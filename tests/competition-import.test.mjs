import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {parseResultsText,planResultsImport,applyResultsImport} from '../assets/js/competition-import.mjs';
import {validateBackup} from '../assets/js/admin-schema.mjs';

const sample=`User:Nakataff/NAKA Gaming — TODOS OS RESULTADOS

Liga UBFF Season 23
2026-01-22 • D-Tier • Colocação: 8th

Telados FF Gratuito Mobile
2025-10-06 • D-Tier • Colocação: 6th

Copa Auge Elite Season 9
2025-08-18 • D-Tier • Colocação: 7th

Gran Legends Season 1
2025-05-30 • D-Tier • Colocação: 17th

Copa Davi Season 3
2025-04-25 • D-Tier • Colocação: 45th - 48th

RED League Season 1
2025-01-27 • D-Tier • Colocação: 7th

Alien Cup Season 2
2024-06-22 • D-Tier • Colocação: 33rd - 35th

Copa Theus Season 2
2024-04-04 • D-Tier • Colocação: 14th`;

test('reconhece os oito resultados do texto Mobile informado',()=>{
  const {results,errors}=parseResultsText(sample);
  assert.deepEqual(errors,[]);
  assert.equal(results.length,8);
  assert.equal(results[0].date,'2026-01-22');
  assert.equal(results[0].tier,'D-Tier');
  assert.equal(results[0].placement,'8th');
  assert.equal(results[4].placement,'45th - 48th');
  assert.equal(results[6].placement,'33rd - 35th');
});
test('separa Mobile e Emulador mesmo em torneios com o mesmo nome e data',()=>{
  const {results}=parseResultsText(sample);
  const emulator=[{id:'old-1',game:'free-fire',platform:'emulador',date:'2026-01-22',tournament:'Liga UBFF Season 23',tier:'D-Tier',placement:'',note:'',link:'',visible:true}];
  const mobile=planResultsImport(results,emulator,{game:'free-fire',platform:'mobile'});
  assert.deepEqual(mobile.counts,{add:8,update:0,skip:0});
  const merged=applyResultsImport(emulator,mobile,(()=>{let i=0;return ()=> 'mobile-'+(++i)})());
  assert.equal(merged.length,9);
  assert.equal(merged[0].placement,'');
  assert.equal(merged[1].platform,'mobile');
  const copy=JSON.parse(awaitSiteFakeData(merged));
  assert.equal(copy.competition.results[1].placement,'8th');
});
function awaitSiteFakeData(records){return JSON.stringify({competition:{results:records,titles:[]}});}
test('colagem idêntica é idempotente e repetidos dentro do mesmo texto são ignorados',()=>{
  const {results}=parseResultsText(sample);
  const rows=applyResultsImport([],planResultsImport(results,[],{game:'free-fire',platform:'mobile'}),(()=>{let i=0;return ()=> 'm-'+(++i)})());
  assert.deepEqual(planResultsImport(results,rows,{game:'free-fire',platform:'mobile'}).counts,{add:0,update:0,skip:8});
  const duplicates=planResultsImport([...results,results[0]],[],{game:'free-fire',platform:'mobile'});
  assert.deepEqual(duplicates.counts,{add:8,update:0,skip:1});
});
test('atualização mantém link, id, visibilidade e campos não informados',()=>{
  const existing=[{id:'uid1',game:'free-fire',platform:'mobile',date:'2026-01-22',tournament:'Liga UBFF Season 23',tier:'D-Tier',placement:'',note:'original',link:'https://liquipedia.net/freefire/X',visible:false}];
  const plan=planResultsImport([{tournament:'Liga UBFF Season 23',date:'2026-01-22',tier:'D-Tier',placement:'8th',note:''}],existing,{game:'free-fire',platform:'mobile',mode:'update'});
  assert.equal(plan.counts.update,1);
  const rows=applyResultsImport(existing,plan,()=>{throw Error('should not allocate id');});
  assert.equal(rows[0].id,'uid1');assert.equal(rows[0].placement,'8th');
  assert.equal(rows[0].link,existing[0].link);assert.equal(rows[0].visible,false);assert.equal(rows[0].note,'original');
});
test('não gera registro se linha de metadados estiver inválida; título sem posição é permitido',()=>{
  assert.equal(parseResultsText('Torneio Novo\n2025-01-01 • D-Tier').results[0].placement,'');
  for(const bad of ['Torneio A\n2025-02-30 • D-Tier','Torneio A\nNão é uma data','Torneio A\n2026-01-22 • D-Tier • Outro: inválido']){
    const parsed=parseResultsText(bad);assert.ok(parsed.errors.length, bad);
  }
  assert.throws(()=>planResultsImport([],[],{game:'free-fire',platform:'geral'}),/Plataforma/);
});
test('a importação é compatível com o backup e não produz títulos automaticamente',async()=>{
  const base=JSON.parse(await readFile(new URL('../assets/data/site.json',import.meta.url),'utf8'));
  const rows=applyResultsImport(base.competition.results,planResultsImport(parseResultsText(sample).results,base.competition.results,{game:'free-fire',platform:'mobile'}),(()=>{let i=0;return ()=> 'new-'+(++i)})());
  const next=validateBackup({...base,competition:{results:rows,titles:[]},members:[]});
  assert.equal(next.competition.results.length,38);
  assert.deepEqual(next.competition.titles,[]);
  assert.equal(next.competition.results.filter(r=>r.platform==='mobile').length,8);
});
test('os controles de importação e o módulo estão integrados ao admin',async()=>{
  const html=await readFile(new URL('../admin/competitivo/index.html',import.meta.url),'utf8');
  const js=await readFile(new URL('../assets/js/admin-competition.mjs',import.meta.url),'utf8');
  for(const id of ['competition-import-form','competition-import-text','competition-import-preview','competition-import-apply','competition-import-review','competition-import-list'])assert.ok(html.includes('id="'+id+'"'),id);
  assert.match(js,/mountBulkImport\(\)/);assert.match(js,/applyResultsImport/);
});
