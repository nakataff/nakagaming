import {validateHistory} from './admin-schema.mjs?v=20261101-history';
import {historyPlayerCard,historyTitleCard,historyMilestone} from './history-view.mjs?v=20261101-history';
import {createPhotoCrop} from './admin-photo-crop.mjs?v=20261101-history';
import {uploadPhoto} from './admin-media.mjs?v=20261101-history';
import {releaseMedia} from './roster-media.mjs?v=20261101-history';
const $=selector=>document.querySelector(selector),field=(form,key)=>form.elements.namedItem(key);
const newId=()=>typeof crypto.randomUUID==='function'?crypto.randomUUID():Array.from(crypto.getRandomValues(new Uint8Array(16)),n=>n.toString(16).padStart(2,'0')).join('');
const label=row=>row.nick||row.title;
function button(text,action,disabled=false){const el=document.createElement('button');el.type='button';el.className='link-button';el.textContent=text;el.disabled=disabled;el.addEventListener('click',action);return el;}
export function mountHistory({getData,persist,feedback,markDirty,isFormDirty,onBusy}){
 const intro=$('#history-intro-form'),settings=['title','intro','timelineTitle','playersTitle','titlesTitle'];let undo=null;
 for(const key of settings)field(intro,key).value=getData().history[key];
 intro.addEventListener('input',()=>markDirty(intro,true));
 intro.addEventListener('submit',async event=>{
  event.preventDefault();try{const next=structuredClone(getData());for(const key of settings)next.history[key]=field(intro,key).value;await persist(next,'Textos da história salvos. Use Publicar no site para atualizar a página.',intro);}catch(error){feedback(error.message,true);}
 });
 const editors=new Map();
 function clearUndo(){undo=null;$('#undo-history').hidden=true;}
 function discard(form){return !isFormDirty(form)||confirm('Descartar as alterações ainda não salvas neste formulário?');}
 function renderLists(){for(const [key,editor]of editors)editor.render(getData().history[key]);}
 async function move(key,index,direction){try{const next=structuredClone(getData()),rows=next.history[key];[rows[index],rows[index+direction]]=[rows[index+direction],rows[index]];await persist(next,'Ordem salva no rascunho.');clearUndo();renderLists();}catch(error){feedback(error.message,true);}}
 async function remove(key,row){
  const editor=editors.get(key);if(field(editor.form,'id').value===row.id&&!discard(editor.form))return;
  if(!confirm('Remover '+label(row)+' do rascunho? O site só muda depois de publicar.'))return;
  try{const next=structuredClone(getData()),rows=next.history[key],index=rows.findIndex(r=>r.id===row.id);next.history[key]=rows.filter(r=>r.id!==row.id);await persist(next,'Registro removido do rascunho. Você pode desfazer a última remoção.');undo={key,index,row:structuredClone(row)};$('#undo-history').hidden=false;if(field(editor.form,'id').value===row.id)editor.reset();renderLists();}catch(error){feedback(error.message,true);}
 }
 for(const [key,names,renderer]of [
  ['timeline',['dateLabel','label','title','description'],historyMilestone],
  ['players',['nick','name','role','period','description','instagram','photo','theme','photoFit'],historyPlayerCard],
  ['titles',['title','dateLabel','description','instagram','photo','theme','photoFit'],historyTitleCard]
 ]){
  const form=$('#history-'+key+'-form'),previewBox=$('#history-'+key+'-preview'),list=$('#history-'+key+'-list');let crop;
  function values(){
   const row={id:field(form,'id').value||newId(),visible:field(form,'visible').checked};for(const name of names)row[name]=field(form,name).value.trim();
   if(key!=='timeline')for(const name of ['photoPositionX','photoPosition','photoZoom'])row[name]=Number(field(form,name).value);
   return row;
  }
  function preview(){
   const row=values();
   if(key==='players'){row.nick||='Nome do jogador';row.description||='Uma breve descrição da participação no projeto.';}
   else{row.title||=key==='timeline'?'Nome do marco':'Nome da conquista';if(key==='timeline'){row.dateLabel||='Data ou período';row.label||='Etapa';row.description||='Descreva este momento da história.';}}
   releaseMedia(previewBox);previewBox.replaceChildren();
   try{const record=validateHistory({...getData().history,[key]:[row]})[key][0];previewBox.append(renderer(record));}
   catch(error){const note=document.createElement('p');note.className='history-admin-note';note.textContent=error.message;previewBox.append(note);}
  }
  function reset(){form.reset();field(form,'id').value='';form.querySelector('[data-editor-title]').textContent='Adicionar '+(key==='timeline'?'marco':key==='players'?'pessoa':'conquista');form.querySelector('.upload-status')?.replaceChildren();markDirty(form,false);preview();}
  function edit(row){
   if(!discard(form))return;form.reset();for(const [name,value]of Object.entries(row)){const input=field(form,name);if(!input)continue;if(input.type==='checkbox')input.checked=value;else input.value=value;}
   form.querySelector('[data-editor-title]').textContent='Editar '+(key==='timeline'?'marco':key==='players'?'pessoa':'conquista');markDirty(form,false);preview();form.scrollIntoView({block:'start',behavior:'instant'});
  }
  function render(rows){
   list.replaceChildren();if(!rows.length){const note=document.createElement('p');note.className='field-help';note.textContent='Nenhum registro nesta seção. Adicione pelo formulário abaixo.';list.append(note);}
   rows.forEach((row,index)=>{
    const article=document.createElement('article');article.className='roster-admin-row';const title=document.createElement('strong');title.textContent=(index+1)+'. '+label(row)+(row.visible?'':' · Oculto');
    const actions=document.createElement('div');actions.className='roster-row-actions';
    const up=button('↑',()=>move(key,index,-1),index===0),down=button('↓',()=>move(key,index,1),index===rows.length-1);up.setAttribute('aria-label','Mover '+label(row)+' para cima');down.setAttribute('aria-label','Mover '+label(row)+' para baixo');
    actions.append(button('Editar',()=>edit(row)),up,down,button('Remover',()=>remove(key,row)));article.append(title,actions);list.append(article);
   });
  }
  form.addEventListener('input',()=>{markDirty(form,true);preview();});
  form.addEventListener('submit',async event=>{
   event.preventDefault();try{const row=values(),next=structuredClone(getData()),rows=next.history[key],index=rows.findIndex(r=>r.id===row.id);if(index<0)rows.push(row);else rows[index]=row;await persist(next,'Registro salvo no rascunho. Use Publicar no site para exibi-lo.',form);clearUndo();reset();renderLists();}catch(error){feedback(error.message,true);}
  });
  form.querySelector('[data-cancel-history]').addEventListener('click',()=>{if(discard(form))reset();});
  if(key!=='timeline'){
   crop=createPhotoCrop({form,getProfile:values,circle:false,feedback,onApply:()=>{markDirty(form,true);preview();feedback('Enquadramento aplicado. Salve o cadastro e publique no site.');}});
   form.querySelector('[data-adjust-photo]').addEventListener('click',()=>crop.open());
   field(form,'photoFile').addEventListener('change',async()=>{
    const input=field(form,'photoFile'),file=input.files[0];if(!file)return;onBusy(1);const status=form.querySelector('.upload-status');status.textContent='Otimizando e enviando imagem…';
    try{field(form,'photo').value=await uploadPhoto(file,key==='titles'?{maxWidth:960,maxHeight:1200}:undefined);for(const name of ['photoPositionX','photoPosition'])field(form,name).value=50;field(form,'photoZoom').value=1;markDirty(form,true);status.textContent='Imagem enviada em WebP de até 75 KB. Ajuste, salve o cadastro e publique.';preview();await crop.open();}
    catch(error){status.textContent=error.message;feedback(error.message,true);}finally{input.value='';onBusy(-1);}
   });
  }
  editors.set(key,{form,reset,render});reset();
 }
 $('#undo-history').addEventListener('click',async()=>{
  if(!undo)return;try{const next=structuredClone(getData());next.history[undo.key].splice(undo.index,0,undo.row);await persist(next,'Última remoção desfeita.');clearUndo();renderLists();}catch(error){feedback(error.message,true);}
 });
 renderLists();
}
