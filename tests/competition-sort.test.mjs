import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {DEFAULT_RESULTS_SORT,sortedResults,resultDisplayRows,nextResultSort} from '../assets/js/competition-sort.mjs';

const rows=[
  {date:'2026-01-23',placement:'1st',tier:'D-Tier',tournament:'Liga LPT Season 1'},
  {date:'2026-01-21',placement:'2nd',tier:'D-Tier',tournament:'Showmatch do Amoras 2026'},
  {date:'2025-11-21',placement:'10th',tier:'D-Tier',tournament:'Goat League Season 1'},
  {date:'2025-10-05',placement:'4th',tier:'A-Tier',tournament:'Free Fire World Series 2025'},
  {date:'2025-09-25',placement:'6th',tier:'B-Tier',tournament:'Lidoma Endless Series 2025'},
  {date:'2024-05-01',placement:'',tier:'Qualifier',tournament:'Campeonato antigo'}
];
test('data decrescente cria faixas dos anos em ordem decrescente e mantém cada torneio',()=>{
  const output=resultDisplayRows(rows,DEFAULT_RESULTS_SORT);
  assert.deepEqual(output.filter(o=>o.type==='year').map(o=>o.year),['2026','2025','2024']);
  assert.deepEqual(output.filter(o=>o.type==='record').map(o=>o.record.date),rows.map(r=>r.date));
  assert.equal(output.length,9);
  assert.equal(rows.length,6);
});
test('data crescente mantém faixas e troca a ordem de anos',()=>{
  const output=resultDisplayRows(rows,{key:'date',direction:'asc'});
  assert.deepEqual(output.filter(o=>o.type==='year').map(o=>o.year),['2024','2025','2026']);
  assert.equal(output.find(o=>o.type==='record').record.date,'2024-05-01');
});
test('qualquer ordenação diferente de data remove as faixas dos anos',()=>{
  for(const key of ['placement','tier','tournament']){
    const output=resultDisplayRows(rows,{key,direction:'asc'});
    assert.ok(output.every(o=>o.type==='record'),key);
    assert.equal(output.length,rows.length);
  }
});
test('colocações são ordenadas numericamente e ausentes ficam no final nos dois sentidos',()=>{
  const asc=sortedResults(rows,{key:'placement',direction:'asc'});
  assert.deepEqual(asc.map(r=>r.placement),['1st','2nd','4th','6th','10th','']);
  const desc=sortedResults(rows,{key:'placement',direction:'desc'});
  assert.deepEqual(desc.map(r=>r.placement),['10th','6th','4th','2nd','1st','']);
});
test('tier ordena A antes de B e D, e títulos seguem ordem alfabética',()=>{
  const tier=sortedResults(rows,{key:'tier',direction:'desc'}).map(r=>r.tier);
  assert.equal(tier[0],'A-Tier');assert.equal(tier[1],'B-Tier');
  const title=sortedResults(rows,{key:'tournament',direction:'asc'}).map(r=>r.tournament);
  assert.equal(title[0],'Campeonato antigo');
  assert.equal(title[title.length-1],'Showmatch do Amoras 2026');
});
test('clique em uma coluna alterna o sentido; trocar de coluna usa sentido inicial intuitivo',()=>{
  assert.deepEqual(nextResultSort(DEFAULT_RESULTS_SORT,'date'),{key:'date',direction:'asc'});
  assert.deepEqual(nextResultSort(DEFAULT_RESULTS_SORT,'placement'),{key:'placement',direction:'asc'});
  assert.deepEqual(nextResultSort(DEFAULT_RESULTS_SORT,'tier'),{key:'tier',direction:'desc'});
  assert.deepEqual(nextResultSort({key:'tier',direction:'desc'},'tier'),{key:'tier',direction:'asc'});
});
test('páginas públicas usam cabeçalhos ordenáveis e não mostram barra de cópia',async()=>{
  const games=['free-fire','hok','valorant','cs2'];
  for(const game of games){
    const html=await readFile(new URL('../equipes/'+game+'/index.html',import.meta.url),'utf8');
    for(const key of ['date','placement','tier','tournament'])assert.ok(html.includes('data-sort-key="'+key+'"'),game+': '+key);
    for(const id of ['copy-results-button','copy-show-placement','result-copy-format','result-copy-preview','comp-copy-toolbar'])assert.ok(!html.includes(id),game+': '+id);
  }
  const admin=await readFile(new URL('../admin/competitivo/index.html',import.meta.url),'utf8');
  assert.ok(admin.includes('id="copy-admin-results"'));
});
