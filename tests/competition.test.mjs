import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {INITIAL_RESULTS} from '../assets/js/competitive-seed.mjs';
import {validatePublic,validateBackup,publicSnapshot} from '../assets/js/admin-schema.mjs';
const base=JSON.parse(await readFile(new URL('../assets/data/site.json',import.meta.url)));
const record=(more={})=>({id:'result-test',game:'free-fire',platform:'emulador',date:'2026-10-01',tournament:'Torneio de teste',tier:'D-Tier',placement:'3º',note:'',link:'',visible:true,...more});
test('carrega os 29 resultados corrigidos do Emulador, sem misturar Mobile',()=>{
  assert.equal(INITIAL_RESULTS.length,29);
  assert.equal(INITIAL_RESULTS.filter(r=>r.date.startsWith('2026-')).length,2);
  assert.equal(INITIAL_RESULTS.filter(r=>r.date.startsWith('2025-')).length,16);
  assert.equal(INITIAL_RESULTS.filter(r=>r.date.startsWith('2024-')).length,11);
  assert.equal(INITIAL_RESULTS.find(r=>r.tournament==='Fora da Safe Qualifier 2024').placement,'2nd');
  assert.equal(INITIAL_RESULTS.some(r=>r.tournament==='Liga UBFF Season 23'),false);
  assert.equal(INITIAL_RESULTS.find(r=>r.tournament==='Alien Cup Season 3').placement,'31st - 33rd');
  assert.ok(INITIAL_RESULTS.every(r=>r.placement));
  assert.ok(INITIAL_RESULTS.every(r=>r.game==='free-fire'&&r.platform==='emulador'));
});
test('migra rascunhos sem competição e permite lista explicitamente vazia',()=>{
  const old=structuredClone(base);delete old.competition;
  const upgraded=validatePublic(old);
  assert.equal(upgraded.competition.results.length,29);
  assert.deepEqual(upgraded.competition.titles,[]);
  const cleared=validatePublic({...old,competition:{results:[],titles:[]}});
  assert.deepEqual(cleared.competition.results,[]);
});
test('separa plataformas e modalidades e mantém elencos antigos no Emulador',()=>{
  const old=structuredClone(base);
  old.teams=[{id:'old-team',name:'Elenco antigo',theme:'samurai',players:[]}];
  assert.deepEqual(validatePublic(old).teams.map(t=>[t.game,t.platform]),[['free-fire','emulador']]);
  old.teams[0].game='valorant';old.teams[0].platform='geral';
  assert.equal(validatePublic(old).teams[0].game,'valorant');
  old.teams[0].platform='mobile';
  assert.throws(()=>validatePublic(old),/plataforma/i);
});
test('não publica históricos ocultos nem a lista privada de membros',()=>{
  const data={...structuredClone(base),members:[{id:'x',nick:'Pessoa',role:'Jogador',status:'Ativo'}],competition:{results:[record(),record({id:'hidden',visible:false})],titles:[record({id:'trophy',placement:''})]}};
  const validated=validateBackup(data);
  const live=publicSnapshot(validated);
  assert.equal(live.members,undefined);
  assert.equal(live.competition.results.length,1);
  assert.equal(live.competition.titles.length,1);
});
test('não aceita URLs externas, datas inválidas nem IDs repetidos',()=>{
  const data=structuredClone(base);
  data.competition={results:[record()],titles:[]};
  const testField=(key,value)=>{const change=structuredClone(data);change.competition.results[0][key]=value;assert.throws(()=>validatePublic(change));};
  testField('link','https://example.com/torneio');
  testField('date','2026-02-30');
  testField('date','2026-13-01');
  testField('game','not-a-game');
  testField('platform','geral');
  data.competition.results.push(record());
  assert.throws(()=>validatePublic(data),/duplicados/i);
});

test('o editor usa os formulários que existem na página administrativa',async()=>{
  const html=await readFile(new URL('../admin/competitivo/index.html',import.meta.url),'utf8');
  const script=await readFile(new URL('../assets/js/admin-competition.mjs',import.meta.url),'utf8');
  for(const kind of ['results','titles']){
    assert.match(html,new RegExp('id="competition-'+kind+'-form"'));
    assert.ok(script.includes("form:'#competition-"+kind+"-form'"));
    assert.match(html,new RegExp('id="competition-'+kind+'-list"'));
  }
});

test('migração corrige 2024 e mantém links, observações, status e Mobile',()=>{
  const original=structuredClone(base);
  const old=original.competition.results;
  const ancient=old.find(r=>r.tournament==='Copa GD Season 1');
  ancient.placement='';
  const old2025=old.find(r=>r.tournament==='Lidoma Contenders 2025');
  old2025.placement='19º–20º';
  old2025.note='Observação personalizada';
  old2025.visible=false;
  const emulatorUBFF={id:'ff-emu-2026-01-22-2',game:'free-fire',platform:'emulador',date:'2026-01-22',tournament:'Liga UBFF Season 23',tier:'D-Tier',placement:'',note:'',link:'',visible:true};
  const mobileUBFF={...emulatorUBFF,id:'mobile-test-ubff',platform:'mobile',placement:'8th'};
  original.competition.results=[...old,emulatorUBFF,mobileUBFF];
  const migrated=validatePublic(original).competition.results;
  assert.equal(migrated.length,30);
  assert.equal(migrated.find(r=>r.id===ancient.id).placement,'14th');
  assert.equal(migrated.find(r=>r.id===old2025.id).placement,'19th - 20th');
  assert.equal(migrated.find(r=>r.id===old2025.id).note,'Observação personalizada');
  assert.equal(migrated.find(r=>r.id===old2025.id).visible,false);
  assert.ok(!migrated.some(r=>r.id===emulatorUBFF.id));
  assert.equal(migrated.find(r=>r.id===mobileUBFF.id).placement,'8th');
  const second=validatePublic({...original,competition:{results:migrated,titles:[]}}).competition.results;
  assert.deepEqual(second,migrated);
});
test('não sobrescreve correções manuais novas nem outros registros',()=>{
  const config=structuredClone(base);
  const ancient=config.competition.results.find(r=>r.tournament==='Copa Flavela Season 1');
  ancient.placement='1st';
  ancient.note='Valor corrigido pelo administrador';
  const extra={id:'extra-naka',game:'free-fire',platform:'emulador',date:'2023-05-01',tournament:'Copa Extra',tier:'C-Tier',placement:'5th',note:'',link:'',visible:true};
  config.competition.results.push(extra);
  const validated=validatePublic(config);
  assert.equal(validated.competition.results.find(r=>r.id===ancient.id).placement,'1st');
  assert.ok(validated.competition.results.some(r=>r.id==='extra-naka'));
});
