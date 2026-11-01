import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {validateHistory,validateBackup,publicSnapshot} from '../assets/js/admin-schema.mjs';
const base=JSON.parse(await readFile(new URL('../assets/data/site.json',import.meta.url)));
const player={id:'historic-player',nick:'Pessoa de teste',description:'Participação de teste no projeto.',period:'2024',photo:'/assets/images/roster/placeholder-samurai.webp',photoFit:'cover',photoPositionX:32,photoPosition:61,photoZoom:1.75,visible:true};
const title={id:'historic-title',title:'Conquista de teste',dateLabel:'2024',description:'Registro de teste.',photo:'/assets/images/symbol.webp',instagram:'https://www.instagram.com/p/test-post/',photoFit:'contain',photoPositionX:27,photoPosition:64,photoZoom:1.25,visible:true};
test('publicações antigas recebem só a história informada, sem inventar pessoas ou títulos',()=>{
 const legacy=structuredClone(base);delete legacy.history;
 const history=validateBackup({...legacy,members:[]}).history;
 assert.equal(history.timeline.length,6);assert.equal(history.timeline[0].dateLabel,'Início de 2024');assert.equal(history.timeline[5].dateLabel,'Agosto de 2025');
 assert.match(history.intro,/Nakata Revela/);assert.match(history.intro,/centenas de inscrições/);assert.match(history.intro,/repostada pela Garena/);
 assert.deepEqual(history.players,[]);assert.deepEqual(history.titles,[]);
});
test('rascunhos e backups preservam textos próprios, vazios explícitos e o enquadramento das imagens',()=>{
 const history=validateHistory({...base.history,intro:'Nossa história personalizada.',timeline:[],players:[player],titles:[title]});
 const restored=validateBackup({...base,history,members:[]});
 assert.equal(restored.history.intro,'Nossa história personalizada.');assert.deepEqual(restored.history.timeline,[]);
 for(const [key,original]of [['players',player],['titles',title]])for(const field of ['photo','photoFit','photoPositionX','photoPosition','photoZoom'])assert.equal(restored.history[key][0][field],original[field]);
 assert.equal(restored.history.titles[0].instagram,title.instagram);
});
test('história pública filtra registros ocultos e nunca expõe membros ou campos extras',()=>{
 const history=validateHistory({...base.history,players:[{...player,ffId:'123456',privateNote:'privado',members:['segredo']},{...player,id:'hidden-person',visible:false}],titles:[title,{...title,id:'hidden-title',visible:false}]});
 history.timeline[1].visible=false;
 const snapshot=publicSnapshot({...base,history,members:[{nick:'Privado'}]});
 assert.equal(snapshot.history.timeline.length,5);assert.equal(snapshot.history.players.length,1);assert.equal(snapshot.history.titles.length,1);assert.equal(snapshot.members,undefined);
 assert.equal(snapshot.history.players[0].ffId,undefined);assert.equal(snapshot.history.players[0].privateNote,undefined);assert.equal(snapshot.history.players[0].members,undefined);
 assert.deepEqual(publicSnapshot({...base,history:{...history,players:[],titles:[],timeline:[]}}).history.timeline,[]);
});
test('valida links de publicação do Instagram sem aceitar outros domínios ou conteúdo executável',()=>{
 for(const instagram of ['javascript:alert(1)','http://instagram.com/p/test/','https://instagram.com.evil.example/p/test/','https://user:pass@www.instagram.com/p/test/'])assert.throws(()=>validateHistory({...base.history,titles:[{...title,instagram}]}));
 assert.equal(validateHistory({...base.history,titles:[title]}).titles[0].instagram,title.instagram);
 const literal='<img src=x onerror=alert(1)>';
 assert.equal(validateHistory({...base.history,players:[{...player,description:literal}]}).players[0].description,literal);
});
test('rejeita IDs repetidos, listas acima do limite e enquadramentos fora do retrato',()=>{
 assert.throws(()=>validateHistory({...base.history,players:[player,player]}),/duplicados/);
 assert.throws(()=>validateHistory({...base.history,players:Array(41).fill(player)}),/40/);
 assert.throws(()=>validateHistory({...base.history,titles:Array(61).fill(title)}),/60/);
 for(const props of [{photoZoom:4},{photoPositionX:-1},{photoPosition:101},{visible:'false'},{photo:'data:image/png;base64,xxx'}])assert.throws(()=>validateHistory({...base.history,players:[{...player,...props}]}));
 assert.throws(()=>validateHistory({...base.history,players:[{...player,description:'x'.repeat(801)}]}));
});
