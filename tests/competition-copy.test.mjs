import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {placementLabel,resultCopyText} from '../assets/js/competition-copy.mjs';

const records=[
  {date:'2025-09-29',placement:'22º',tier:'C-Tier',tournament:'Liga Angelical Trials II',note:''},
  {date:'2024-10-19',placement:'2º',tier:'Qualifier',tournament:'Fora da Safe Qualifier 2024',note:'Vice'},
  {date:'2026-01-22',placement:'',tier:'D-Tier',tournament:'Liga UBFF Season 23',note:''}
];

test('o formato padrão inclui a colocação de todos os registros, inclusive os desconhecidos',()=>{
  const copied=resultCopyText(records,{gameName:'Free Fire',platform:'Emulador'});
  assert.match(copied,/Colocação: 22º/);
  assert.match(copied,/Colocação: 2º/);
  assert.match(copied,/Colocação: Não informada/);
  assert.match(copied,/3 participações neste filtro/);
});
test('cópia compacta e completa mantêm a posição sem inferir colocações',()=>{
  for(const mode of ['compact','complete']){
    const copied=resultCopyText([records[0]],{format:mode});
    assert.match(copied,/22º/);
    assert.match(copied,/Liga Angelical Trials II/);
  }
  assert.equal(placementLabel(''),'Não informada');
});
test('opção de ocultar colocação funciona e formato só torneios não inclui resultados',()=>{
  assert.doesNotMatch(resultCopyText([records[0]],{format:'cards',includePlacement:false}),/22º|Colocação/);
  assert.doesNotMatch(resultCopyText([records[0]],{format:'compact',includePlacement:false}),/22º/);
  assert.doesNotMatch(resultCopyText([records[0]],{format:'list'}),/22º|C-Tier/);
});
test('nenhum filtro não cria colocações ou nomes de torneio fictícios',()=>{
  const copied=resultCopyText([],{gameName:'CS2'});
  assert.match(copied,/Nenhum resultado encontrado/);
});
test('exportação continua disponível no admin, mas não nas páginas públicas',async()=>{
  for(const game of ['free-fire','hok','valorant','cs2']){
    const html=await readFile(new URL('../equipes/'+game+'/index.html',import.meta.url),'utf8');
    assert.ok(!html.includes('id="copy-results-button"'),game);
    assert.ok(!html.includes('id="copy-show-placement"'),game);
  }
  const admin=await readFile(new URL('../admin/competitivo/index.html',import.meta.url),'utf8');
  assert.ok(admin.includes('id="copy-admin-results"'));
});
