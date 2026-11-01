import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {validateNewsArticle,validateNewsMeta,newsMetadata,articleURL} from '../assets/js/news-schema.mjs';
import {createNewsRepository} from '../assets/js/news-store.mjs';
import {loadNewsPage,loadNewsArticle,clearNewsCache} from '../assets/js/news-data.mjs';
const fixture=(n=1)=>({id:'1793490000000-test-'+String(n).padStart(3,'0'),title:'Notícia de teste '+n,excerpt:'Resumo',category:'Resultados',date:'2026-10-31',cover:'/assets/images/logo.webp',body:'Primeiro parágrafo.\n\nSegundo parágrafo.',revision:0,liveRevision:0,status:'draft'});
function harness(){
 let user={uid:'owner',email:'admin@centralfreefire.com.br'},state={};const writes=[];
 const repo=createNewsRepository({getUser:()=>user,readRecord:async id=>structuredClone(state['drafts/'+id]),listRecords:async()=>({items:Object.entries(state).filter(([key])=>key.startsWith('adminIndex/')).map(([,value])=>structuredClone(value)),cursor:null}),write:async changes=>{
  const [path,record]=Object.entries(changes).find(([key])=>key.startsWith('drafts/')),old=state[path];
  if(record.revision!==(old?.revision||0)+1)throw Object.assign(new Error('PERMISSION_DENIED'),{code:'PERMISSION_DENIED'});
  if(record.status==='draft'&&record.liveRevision!==(old?.liveRevision||0))throw new Error('PERMISSION_DENIED');
  const next=structuredClone(state);for(const [key,value]of Object.entries(changes)){if(value===null)delete next[key];else next[key]=structuredClone(value);}state=next;writes.push(structuredClone(changes));
 }});
 return {repo,writes,get state(){return state;},setUser:value=>{user=value;}};
}
test('valida conteúdo, calendário e links sem interpretar HTML',()=>{
 const raw=fixture();raw.title='<img src=x onerror=alert(1)>';assert.equal(validateNewsArticle(raw).title,raw.title);
 for(const cover of ['javascript:alert(1)','data:text/html,x','http://example.com/a.png'])assert.throws(()=>validateNewsArticle({...raw,cover}));
 for(const date of ['2026-02-30','not-a-date'])assert.throws(()=>validateNewsArticle({...raw,date}));
 assert.throws(()=>validateNewsArticle({...raw,id:'../drafts'}));assert.throws(()=>articleURL('../drafts'));
 assert.throws(()=>validateNewsArticle({...raw,body:'x'.repeat(20001)}));
 assert.throws(()=>validateNewsArticle({...raw,status:'published',body:''}),/texto/);
 assert.equal(newsMetadata(raw).body,undefined);
});
test('leitura e gravação administrativas exigem a conta autorizada',async()=>{
 for(const user of [null,{uid:'visitor',email:'visitor@example.com'}]){
  const h=harness();h.setUser(user);
  await assert.rejects(()=>h.repo.list(),/conta administrativa/);await assert.rejects(()=>h.repo.read(fixture().id),/conta administrativa/);await assert.rejects(()=>h.repo.save(fixture(),0,'published'),/conta administrativa/);assert.equal(h.writes.length,0);
 }
});
test('publicar é atômico; editar rascunho conserva a notícia que já está no ar',async()=>{
 const h=harness(),first=await h.repo.save(fixture(),0,'draft'),id=first.id;
 assert.equal(h.state['articles/'+id],undefined);assert.equal(first.revision,1);
 const live=await h.repo.save(first,1,'published');assert.equal(live.liveRevision,2);assert.equal(h.state['publicIndex/'+id].body,undefined);assert.equal(h.state['articles/'+id].cover,live.cover);
 const draft=await h.repo.save({...live,title:'Título ainda em revisão',body:'Texto privado atualizado.'},2,'draft');
 assert.equal(draft.revision,3);assert.equal(draft.liveRevision,2);assert.equal(h.state['articles/'+id].title,live.title);assert.equal(h.state['articles/'+id].body,live.body);
 assert.equal(h.writes.at(-1)['articles/'+id],undefined);
 assert.ok(h.writes.every(change=>Object.keys(change).every(key=>/^(drafts|adminIndex|publicIndex|articles)\//.test(key))));
});
test('arquivar retira do público sem excluir o texto e permite republicar',async()=>{
 const h=harness(),live=await h.repo.save(fixture(),0,'published'),id=live.id;
 const archived=await h.repo.save(live,1,'archived');assert.equal(archived.body,live.body);assert.equal(archived.liveRevision,0);assert.equal(h.state['articles/'+id],undefined);assert.equal(h.state['publicIndex/'+id],undefined);
 const restored=await h.repo.save(archived,2,'published');assert.equal(restored.revision,3);assert.equal(h.state['articles/'+id].body,live.body);
});
test('uma sessão desatualizada não sobrescreve a edição mais nova',async()=>{
 const h=harness(),live=await h.repo.save(fixture(),0,'published');await h.repo.save({...live,title:'Versão mais nova'},1,'published');
 await assert.rejects(()=>h.repo.save({...live,title:'Versão antiga'},1,'published'),/PERMISSION_DENIED/);
 assert.equal(h.state['articles/'+live.id].title,'Versão mais nova');assert.equal(h.writes.length,2);
});
test('alterar a data recalcula a ordem em vez de reaproveitar o índice anterior',async()=>{
 const h=harness(),draft=await h.repo.save(fixture(),0,'draft');const changed=await h.repo.save({...draft,date:'2026-11-01'},1,'published');
 assert.equal(changed.sortKey,'2026-11-01_'+changed.id);
});
test('o leitor pagina só metadados e busca o corpo apenas ao abrir o artigo',async()=>{
 const original=globalThis.fetch,calls=[],records=Array.from({length:25},(_,i)=>validateNewsArticle({...fixture(i),status:'published',revision:1,liveRevision:1}));
 globalThis.fetch=async raw=>{
  const url=new URL(raw);calls.push(url);
  if(url.pathname.endsWith('/publicIndex.json')){
   assert.equal(url.searchParams.get('orderBy'),'"sortKey"');
   const end=url.searchParams.has('endAt')?JSON.parse(url.searchParams.get('endAt')):null;
   const rows=records.filter(row=>!end||row.sortKey<=end).sort((a,b)=>a.sortKey<b.sortKey?-1:1).slice(-Number(url.searchParams.get('limitToLast')));
   return {ok:true,json:async()=>Object.fromEntries(rows.map(row=>[row.id,newsMetadata(row)]))};
  }
  const id=decodeURIComponent(url.pathname.split('/').at(-1).replace(/\.json$/,''));return {ok:true,json:async()=>records.find(row=>row.id===id)||null};
 };
 try{
  clearNewsCache();const first=await loadNewsPage(),second=await loadNewsPage({cursor:first.cursor}),third=await loadNewsPage({cursor:second.cursor});
  assert.equal(first.items.length,12);assert.equal(second.items.length,12);assert.equal(third.items.length,1);assert.equal(third.cursor,null);
  assert.equal(new Set([...first.items,...second.items,...third.items].map(row=>row.id)).size,25);
  assert.ok(calls.every(url=>url.pathname.endsWith('/publicIndex.json')));assert.equal(first.items[0].body,undefined);
  const article=await loadNewsArticle(first.items[0].id);assert.equal(article.body,records[0].body);assert.match(calls.at(-1).pathname,/\/articles\//);
  assert.equal(await loadNewsArticle('../private'),null);
  assert.throws(()=>validateNewsMeta(fixture(),{publicOnly:true}));
 }finally{globalThis.fetch=original;clearNewsCache();}
});
test('as regras separam rascunhos, índice sem corpo e artigos publicados',async()=>{
 const scope=JSON.parse(await readFile(new URL('../firebase/naka-news.rules.json',import.meta.url))).nakaGamingNews;
 const allowed=new Function('auth','return '+scope['.write']);assert.equal(allowed(null),false);assert.equal(allowed({token:{email:'other@example.com'}}),false);assert.equal(allowed({token:{email:'admin@centralfreefire.com.br'}}),true);
 assert.equal(scope.publicIndex['.read'],true);assert.equal(scope.drafts['.read'],undefined);assert.equal(scope.publicIndex.$id.body,undefined);assert.equal(scope.publicIndex.$id.$other['.validate'],false);
 assert.match(scope.articles.$id['.validate'],/published/);assert.match(scope.drafts.$id['.validate'],/revision/);assert.deepEqual(scope.publicIndex['.indexOn'],['sortKey']);
});
