import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {INITIAL_RESULTS} from '../assets/js/competitive-seed.mjs';
import {validatePublic,validateBackup,publicSnapshot} from '../assets/js/admin-schema.mjs';
const base=JSON.parse(await readFile(new URL('../assets/data/site.json',import.meta.url)));
const record=(more={})=>({id:'result-test',game:'free-fire',platform:'emulador',date:'2026-10-01',tournament:'Torneio de teste',tier:'D-Tier',placement:'3º',note:'',link:'',visible:true,...more});
test('carrega os 30 resultados históricos informados, sem inventar classificações',()=>{
  assert.equal(INITIAL_RESULTS.length,30);
  assert.equal(INITIAL_RESULTS.filter(r=>r.date.startsWith('2026-')).length,3);
  assert.equal(INITIAL_RESULTS.filter(r=>r.date.startsWith('2025-')).length,16);
  assert.equal(INITIAL_RESULTS.filter(r=>r.date.startsWith('2024-')).length,11);
  assert.equal(INITIAL_RESULTS.find(r=>r.tournament==='Fora da Safe Qualifier 2024').placement,'2º');
  assert.equal(INITIAL_RESULTS.find(r=>r.tournament==='Liga UBFF Season 23').placement,'');
  assert.ok(INITIAL_RESULTS.every(r=>r.game==='free-fire'&&r.platform==='emulador'));
});
test('migra rascunhos sem competição e permite lista explicitamente vazia',()=>{
  const old=structuredClone(base);delete old.competition;
  const upgraded=validatePublic(old);
  assert.equal(upgraded.competition.results.length,30);
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
