import {newsId,validateNewsArticle,newsMetadata,todayInBrazil,articleURL,formatNewsDate} from './news-schema.mjs?v=20261101-news';
import {newsCard} from './news-view.mjs?v=20261101-news';
import {uploadPhoto} from './admin-media.mjs?v=20261101-news';
import {releaseMedia} from './roster-media.mjs?v=20261101-news';
import {clearNewsCache} from './news-data.mjs?v=20261101-news';
const $=s=>document.querySelector(s);
export async function mountNews({repository,feedback,onBusy,markDirty,isFormDirty}){
 const form=$('#news-form'),field=name=>form.elements.namedItem(name);let current,items=[],cursor=null,loading=false;
 function reset(){
  form.reset();current={id:newsId(),revision:0,liveRevision:0,status:'draft'};field('date').value=todayInBrazil();
  $('#news-form-title').textContent='Nova notícia';$('#news-editor-state').textContent='Ainda não salva';$('#news-live-link').hidden=true;form.querySelector('.upload-status').textContent='';markDirty(form,false);preview();
 }
 function values(){return {...current,title:field('title').value,excerpt:field('excerpt').value,category:field('category').value,date:field('date').value,cover:field('cover').value,body:field('body').value};}
 function preview(){
  let value={...values(),status:'draft',sortKey:undefined};value.title ||= 'Título da notícia';
  try{value=validateNewsArticle(value);}catch{value={id:current.id,title:'Prévia da notícia',excerpt:'Confira os campos para visualizar a capa e o resumo.',date:todayInBrazil(),category:'Novidades',cover:''};}
  const box=$('#news-preview');releaseMedia(box);box.replaceChildren(newsCard(value));
  box.querySelector('a').setAttribute('tabindex','-1');box.querySelector('a').removeAttribute('href');
 }
 function statusText(row){return row.status==='archived'?'Arquivada':row.status==='published'?'Publicada':row.liveRevision?'Rascunho · versão anterior no ar':'Rascunho';}
 function setCurrent(article){
  current=article;for(const name of ['title','excerpt','category','date','cover','body'])field(name).value=article[name];
  $('#news-form-title').textContent='Editar notícia';$('#news-editor-state').textContent=statusText(article);markDirty(form,false);
  const live=$('#news-live-link');live.hidden=!article.liveRevision;live.href=articleURL(article.id);preview();
 }
 function discard(){return !isFormDirty(form)||confirm('Descartar as alterações ainda não salvas nesta notícia?');}
 function rowButton(label,action){const button=document.createElement('button');button.type='button';button.className='link-button';button.textContent=label;button.addEventListener('click',action);return button;}
 async function edit(id){
  if(!discard())return;onBusy(1);
  try{setCurrent(await repository.read(id));form.scrollIntoView({block:'start',behavior:'instant'});}catch(error){feedback(error.message,true);}finally{onBusy(-1);}
 }
 async function archive(row){
  if(!discard()||!confirm('Arquivar esta notícia e retirá-la do site? O texto será preservado no painel.'))return;
  onBusy(1);try{
   const original=await repository.read(row.id),saved=await repository.save(original,original.revision,'archived');
   updateIndex(saved);clearNewsCache();if(current.id===row.id)setCurrent(saved);feedback('Notícia arquivada e retirada do site. Você pode editar e publicar novamente.');
  }catch(error){feedback('Não foi possível arquivar. '+error.message,true);}finally{onBusy(-1);}
 }
 function render(){
  const term=$('#news-search').value.trim().toLocaleLowerCase('pt-BR'),state=$('#news-filter').value,rows=items.filter(row=>(!term||row.title.toLocaleLowerCase('pt-BR').includes(term))&&(!state||row.status===state));
  const box=$('#news-list');box.replaceChildren();$('#news-list-count').textContent=rows.length+' de '+items.length+' carregadas';
  for(const row of rows){
   const article=document.createElement('article');article.className='news-admin-row';
   const info=document.createElement('div'),title=document.createElement('strong'),meta=document.createElement('small');title.textContent=row.title;meta.textContent=row.category+' · '+formatNewsDate(row.date)+' · '+statusText(row);info.append(title,meta);
   const actions=document.createElement('div');actions.className='roster-row-actions';actions.append(rowButton('Editar',()=>edit(row.id)));
   if(row.liveRevision){const link=document.createElement('a');link.className='link-button';link.textContent='Ver no site ↗';link.href=articleURL(row.id);link.target='_blank';link.rel='noopener';actions.append(link);}
   if(row.status!=='archived')actions.append(rowButton('Arquivar',()=>archive(row)));
   article.append(info,actions);box.append(article);
  }
  if(!rows.length){const note=document.createElement('p');note.className='field-help';note.textContent=items.length?'Nenhuma notícia corresponde ao filtro.':'Comece pela primeira notícia da Naka.';box.append(note);}
 }
 function updateIndex(article){const meta=newsMetadata(article),index=items.findIndex(row=>row.id===meta.id);if(index<0)items.push(meta);else items[index]=meta;items.sort((a,b)=>a.sortKey<b.sortKey?1:a.sortKey>b.sortKey?-1:0);render();}
 async function loadMore(){
  if(loading)return;loading=true;$('#news-load-more').disabled=true;
  try{const page=await repository.list(cursor);const known=new Set(items.map(row=>row.id));items.push(...page.items.filter(row=>!known.has(row.id)));cursor=page.cursor;$('#news-load-more').hidden=!cursor;render();}
  catch(error){feedback('Não foi possível carregar a lista. '+error.message,true);$('#news-load-more').hidden=false;}
  finally{loading=false;$('#news-load-more').disabled=false;}
 }
 async function save(mode){
  if(mode==='published'&&!confirm('Publicar esta notícia no site agora? Apenas esta notícia será atualizada.'))return;
  onBusy(1);try{
   const saved=await repository.save(values(),current.revision,mode);setCurrent(saved);updateIndex(saved);
   if(mode==='published'){clearNewsCache();feedback('Notícia publicada. Ela já está disponível no site; o cache de visitantes pode levar até 2 minutos para atualizar.');}
   else feedback(saved.liveRevision?'Rascunho salvo. A versão que já estava publicada continua no site.':'Rascunho salvo. Use Publicar notícia quando estiver pronta.');
  }catch(error){feedback('Não foi possível salvar. '+((error.code||'').includes('PERMISSION_DENIED')?'Outra sessão pode ter alterado a notícia. Reabra pelo botão Editar antes de tentar novamente.':error.message),true);}
  finally{onBusy(-1);}
 }
 form.addEventListener('input',()=>{markDirty(form,true);preview();});
 form.addEventListener('submit',event=>{event.preventDefault();save(event.submitter?.dataset.newsSave||'draft');});
 field('coverFile').addEventListener('change',async()=>{
  const file=field('coverFile').files[0];if(!file)return;onBusy(1);const status=form.querySelector('.upload-status');status.textContent='Otimizando e enviando capa…';
  try{field('cover').value=await uploadPhoto(file,{maxWidth:1280,maxHeight:900});markDirty(form,true);status.textContent='Capa enviada em WebP de até 75 KB. Ela será usada no card e dentro da notícia.';preview();}
  catch(error){status.textContent=error.message;feedback(error.message,true);}finally{field('coverFile').value='';onBusy(-1);}
 });
 $('#new-news').addEventListener('click',()=>{if(discard())reset();});$('#news-search').addEventListener('input',render);$('#news-filter').addEventListener('change',render);$('#news-load-more').addEventListener('click',loadMore);
 reset();await loadMore();
}
