import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {validatePublic,validateBackup,publicSnapshot} from '../assets/js/admin-schema.mjs';
import {safeAdminPath} from '../assets/js/admin-auth-policy.mjs';
const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8');
const fallback=JSON.parse(await read('assets/data/site.json'));
const profile=(id,nick,visible=true)=>({id,nick,name:'',role:'Direção',ffId:'',instagram:'',photo:'',theme:'samurai',photoFit:'cover',photoPosition:50,photoPositionX:50,photoZoom:1,visible});
test('a organização e a guilda mantêm cadastros independentes e não tornam os membros privados públicos',()=>{
 const original=structuredClone(fallback);
 original.leaders=[profile('guild1','Lider Guilda')];
 original.organizationLeaders=[profile('org1','Diretor Naka'),profile('org2','Diretor Oculto',false)];
 original.members=[{id:'private1',nick:'Membro Privado',role:'Jogador',status:'Ativo'}];
 const backup=validateBackup(original);
 assert.equal(backup.leaders[0].nick,'Lider Guilda');
 assert.equal(backup.organizationLeaders[0].nick,'Diretor Naka');
 const publicData=publicSnapshot(backup);
 assert.deepEqual(publicData.organizationLeaders.map(p=>p.nick),['Diretor Naka']);
 assert.deepEqual(publicData.leaders.map(p=>p.nick),['Lider Guilda']);
 assert.equal(publicData.members,undefined);
});
test('backups legados sem direção da organização continuam válidos',()=>{
 const original=structuredClone(fallback);delete original.organizationLeaders;
 assert.deepEqual(validatePublic(original).organizationLeaders,[]);
});
test('textos antigos publicados recebem posicionamento novo sem sobrescrever textos personalizados',()=>{
 const original=structuredClone(fallback);
 original.content.aboutIntro='A Naka Gaming é uma organização de esports e uma guilda de Free Fire.';
 original.content.homeDescription='A força de uma organização.\nA união de uma guilda. Esse é o nosso caminho.';
 original.content.footerTagline='O mesmo símbolo.\nO mesmo propósito.';
 const mapped=validatePublic(original);
 assert.match(mapped.content.aboutIntro,/organização independente/i);
 assert.match(mapped.content.homeDescription,/atletas/i);
 assert.match(mapped.content.footerTagline,/talento de cada atleta/i);
 original.content.aboutIntro='Texto próprio criado no painel';
 assert.equal(validatePublic(original).content.aboutIntro,'Texto próprio criado no painel');
});
test('mensagens de premiação e apoio podem ser editadas e passam pela validação',()=>{
 const validated=validatePublic(fallback);
 assert.match(validated.content.supportApproach,/patrocinadores/);
 assert.match(validated.content.prizePolicy,/MVP/);
 assert.match(validated.content.prizePolicy,/gestão da Naka Gaming/);
 const changed=structuredClone(fallback);changed.content.prizePolicy='Divisão a combinar antes da competição.';
 assert.equal(validatePublic(changed).content.prizePolicy,changed.content.prizePolicy);
});
test('painel da direção é uma rota administrativa independente da guilda',async()=>{
 assert.equal(safeAdminPath('/admin/organizacao/'),'/admin/organizacao/');
 const admin=await read('admin/organizacao/index.html');
 assert.match(admin,/data-admin-page="\/admin\/organizacao\/"/);
 assert.match(admin,/id="leader-form"/);
 assert.doesNotMatch(admin,/id="member-form"/);
 const guild=await read('admin/guilda/index.html');
 assert.match(guild,/id="member-form"/);
});
test('páginas públicas separam direção de guilda e priorizam a organização',async()=>{
 const about=await read('sobre/index.html'),guild=await read('guilda/index.html'),home=await read('index.html');
 assert.match(about,/id="organization-leaders-grid"/);
 assert.match(about,/data-site-content="prizePolicy"/);
 assert.match(guild,/id="leaders-grid"/);
 assert.match(home,/organization-model/);
 assert.match(home,/community-compact/);
 assert.match(home,/data-site-link="personalInstagram"/);
 assert.ok(home.indexOf('href="/equipes/"')<home.indexOf('href="/guilda/"'));
});
