import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {validatePublic,validateBackup,publicSnapshot,validatePhoto,validateInstagram} from '../assets/js/admin-schema.mjs';
import {createPublisher} from '../assets/js/admin-publish.mjs';
const base=JSON.parse(await readFile(new URL('../assets/data/site.json',import.meta.url)));
const player=(id='p1')=>({id,nick:'Jogador',ffId:'123456789',instagram:'@nakataff',theme:'inherit'});
const team=()=>({id:'team-1',name:'Equipe de teste',players:[player()],theme:'samurai-fem'});
const data=()=>({...structuredClone(base),teams:[team()],leaders:[{...player('leader-1'),theme:'samurai'}],members:[{id:'private-1',nick:'Privado',role:'Jogador',status:'Ativo'}]});
test('migra backups anteriores sem perder os textos e a lista privada',()=>{
 const old=data();delete old.teams;delete old.leaders;for(const key of ['teamsTitle','teamsIntro','leadersTitle','leadersIntro'])delete old.content[key];
 const parsed=validateBackup(old);assert.deepEqual(parsed.teams,[]);assert.deepEqual(parsed.leaders,[]);assert.equal(parsed.members[0].nick,'Privado');assert.ok(parsed.content.teamsTitle);
});
test('valida perfis, IDs, temas, enquadramento e ordem',()=>{
 const raw=data(),parsed=validateBackup(raw);assert.equal(parsed.teams[0].players[0].instagram,'https://www.instagram.com/nakataff/');assert.equal(parsed.teams[0].players[0].theme,'inherit');
 assert.throws(()=>validateBackup({...raw,leaders:[{...raw.leaders[0],ffId:'123-abc'}]}),/ID do Free Fire/);
 assert.throws(()=>validateBackup({...raw,teams:[{...team(),players:[player(),player()]}]}),/duplicados/);
 assert.throws(()=>validateBackup({...raw,teams:[{...team(),theme:'unknown'}]}),/tema/);
 assert.throws(()=>validateBackup({...raw,teams:[{...team(),players:[{...player(),photoPosition:101}]}]}),/Posição/);
 assert.throws(()=>validatePublic({...raw,teams:Array(13).fill(team())}),/12 equipes/);
});
test('a publicação exclui membros privados e perfis ou equipes ocultos',()=>{
 const raw=data();raw.teams[0].players.push({...player('p2'),visible:false});raw.teams.push({...team(),id:'hidden',visible:false});raw.leaders[0].visible=false;
 const published=publicSnapshot(raw);assert.equal(published.members,undefined);assert.equal(published.teams.length,1);assert.equal(published.teams[0].players.length,1);assert.equal(published.leaders.length,0);
 assert.equal(raw.teams.length,2);assert.equal(raw.teams[0].players.length,2);
});
test('não aceita conteúdo executável nem imagens embutidas no JSON público',()=>{
 for(const url of ['javascript:alert(1)','data:image/svg+xml,test','http://example.com/a.png','//example.com/a.png','https://user:password@example.com/a.png','media:../private'])assert.throws(()=>validatePhoto(url));
 assert.equal(validatePhoto('/naka gaming/foto.png'),'/naka%20gaming/foto.png');assert.equal(validatePhoto('media:12345678-1234'),'media:12345678-1234');
 assert.throws(()=>validateInstagram('https://instagram.com.evil.example/user/'));
 assert.equal(validateInstagram('@nakagamingx'),'https://www.instagram.com/nakagamingx/');
});
test('só publica uma revisão salva com conta administrativa e sem dados privados',async()=>{
 const writes=[];let user=null;
 const publish=createPublisher({getUser:()=>user,write:async v=>writes.push(v),timestamp:()=>1234});
 await assert.rejects(()=>publish(data(),1),/conta administrativa/);assert.equal(writes.length,0);
 user={uid:'admin-uid',email:'admin@centralfreefire.com.br'};
 await assert.rejects(()=>publish(data(),0),/Salve/);assert.equal(writes.length,0);
 await publish(data(),3);assert.equal(writes[0].draftRevision,3);assert.equal(JSON.parse(writes[0].stateJson).members,undefined);
});
test('rejeição do servidor não é apresentada como publicação concluída',async()=>{
 const publish=createPublisher({getUser:()=>({uid:'admin',email:'admin@centralfreefire.com.br'}),write:async()=>{throw new Error('PERMISSION_DENIED');},timestamp:()=>1234});
 await assert.rejects(()=>publish(data(),2),/PERMISSION_DENIED/);
});
test('regras públicas isolam publicação, imagens e dados privados',async()=>{
 const policy=JSON.parse(await readFile(new URL('../firebase/naka-admin.rules.json',import.meta.url)));
 assert.equal(policy.nakaGamingPublic.site['.read'],true);
 assert.match(policy.nakaGamingPublic.site['.write'],/auth.token.email/);
 assert.match(policy.nakaGamingPublic.site['.validate'],/nakaGamingAdmin\/state\/revision/);
 assert.equal(policy.nakaGamingMedia['.read'],undefined);
 const media=policy.nakaGamingMedia.$imageId;
 assert.equal(media['.read'],true);assert.match(media['.write'],/!data.exists/);assert.match(media.dataUrl['.validate'],/110000/);
 assert.match(policy.nakaGamingAdmin['.read'],/auth != null/);
});
