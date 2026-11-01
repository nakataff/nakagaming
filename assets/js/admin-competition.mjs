import {resultCopyText,placementLabel} from './competition-copy.mjs?v=20261101-copy';
import {parseResultsText,planResultsImport,applyResultsImport} from './competition-import.mjs?v=20261101-bulk';
import {validateBackup} from './admin-schema.mjs?v=20261101-emufix';
const $=selector=>document.querySelector(selector);
const NEW_ID=()=>typeof crypto.randomUUID==='function'?crypto.randomUUID().replaceAll('-',''):Array.from(crypto.getRandomValues(new Uint8Array(16)),x=>x.toString(16).padStart(2,'0')).join('');
const MODE_NAMES={'free-fire':'Free Fire',hok:'Honor of Kings',valorant:'Valorant',cs2:'CS2'};
const kindDefs={results:{form:'#competition-results-form',list:'#competition-results-list',name:'resultado'},titles:{form:'#competition-titles-form',list:'#competition-titles-list',name:'título'}};
const field=(form,name)=>form.elements.namedItem(name);
const formatted=date=>date.split('-').reverse().join('/');
function create(tag,cls,text) {
  const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;
}
function platformLabel(platform){return platform==='geral'?'Geral':platform==='emulador'?'Emulador':'Mobile';}
export function mountCompetition({getData,persist,feedback,markDirty,isFormDirty}) {
  const filters={game:$('#competition-game-filter'),platform:$('#competition-platform-filter'),search:$('#competition-search')};
  function checkAbandon(form) {return !isFormDirty(form)||confirm('Descartar alterações não salvas neste formulário?');}
  function syncPlatform(form,reset=false) {
    const game=field(form,'game').value,platform=field(form,'platform');
    if(game!=='free-fire'){platform.value='geral';platform.disabled=true;}
    else {platform.disabled=false;if(reset||platform.value==='geral')platform.value='emulador';}
  }
  function resetForm(kind) {
    const def=kindDefs[kind],form=$(def.form);
    form.reset();field(form,'id').value='';syncPlatform(form);
    $('#competition-'+kind+'-heading').textContent='Adicionar '+def.name;
    markDirty(form,false);
  }
  function editRow(kind,record) {
    const def=kindDefs[kind],form=$(def.form);
    if(!checkAbandon(form))return;
    form.reset();
    for(const [name,value]of Object.entries(record)){
      const input=field(form,name);if(!input)continue;
      if(input.type==='checkbox')input.checked=value;else input.value=value;
    }
    syncPlatform(form);
    $('#competition-'+kind+'-heading').textContent='Editar '+def.name;
    markDirty(form,false);
    form.scrollIntoView({block:'start',behavior:'smooth'});
    field(form,'tournament').focus({preventScroll:true});
  }
  function readRow(kind) {
    const form=$(kindDefs[kind].form);
    const row={id:field(form,'id').value||'record-'+NEW_ID(),game:field(form,'game').value,platform:field(form,'platform').value,
      tournament:field(form,'tournament').value.trim(),date:field(form,'date').value,
      tier:field(form,'tier').value.trim(),link:field(form,'link').value.trim(),
      note:field(form,'note').value.trim(),visible:field(form,'visible').checked};
    if(kind==='results')row.placement=field(form,'placement').value.trim();
    return row;
  }
  async function removeRow(kind,record) {
    if(!confirm('Remover '+record.tournament+' do rascunho? O site só muda depois de publicar.'))return;
    try {
      const next=structuredClone(getData());
      next.competition[kind]=next.competition[kind].filter(item=>item.id!==record.id);
      await persist(next,'Registro removido. Publique para atualizar o site.');
      const form=$(kindDefs[kind].form);
      if(field(form,'id').value===record.id)resetForm(kind);
      render();
    }catch(error){feedback(error.message,true);}
  }
  async function copyText(text,successMessage) {
    try {
      if(navigator.clipboard&&window.isSecureContext)await navigator.clipboard.writeText(text);
      else {const field=document.createElement('textarea');field.value=text;field.style.position='fixed';field.style.opacity='0';document.body.append(field);field.select();const ok=document.execCommand('copy');field.remove();if(!ok)throw new Error('Clipboard');}
      feedback(successMessage);
    }catch {feedback('Não foi possível copiar automaticamente. Verifique as permissões do navegador.',true);}
  }
  function filteredRows(kind){
    const game=filters.game.value,platform=filters.platform.value,term=filters.search.value.trim().toLocaleLowerCase('pt-BR');
    return getData().competition[kind].filter(record=>(!game||record.game===game)&&(!platform||record.platform===platform)&&(!term||record.tournament.toLocaleLowerCase('pt-BR').includes(term)))
      .sort((a,b)=>b.date.localeCompare(a.date)||a.tournament.localeCompare(b.tournament));
  }
  function renderList(kind) {
    const list=$(kindDefs[kind].list);
    const filtered=filteredRows(kind);
    list.replaceChildren();
    $('#competition-'+kind+'-count').textContent=filtered.length+' registros';
    if(!filtered.length){list.append(create('p','field-help','Nenhum cadastro para os filtros escolhidos.'));return;}
    for(const record of filtered){
      const row=create('article','roster-admin-row');
      const summary=create('div','');
      summary.append(create('strong','',record.tournament+(record.visible?'':' · Oculto')));
      summary.append(create('p','field-help',formatted(record.date)+' · '+MODE_NAMES[record.game]+' / '+platformLabel(record.platform)+(record.tier?' · '+record.tier:'')+(kind==='results'?' · Colocação: '+placementLabel(record.placement):'')));
      const buttons=create('div','roster-row-actions');
      const edit=create('button','link-button','Editar'),remove=create('button','link-button','Remover');
      edit.type='button';remove.type='button';
      edit.addEventListener('click',()=>editRow(kind,record));remove.addEventListener('click',()=>removeRow(kind,record));
      buttons.append(edit,remove);
      if(kind==='results'){const copy=create('button','link-button','Copiar');copy.type='button';copy.addEventListener('click',()=>copyText(resultCopyText([record],{gameName:MODE_NAMES[record.game],platform:platformLabel(record.platform)}),'Resultado copiado com a colocação.'));buttons.append(copy);}
      if(record.link){const href=create('a','link-button','Liquipedia ↗');href.href=record.link;href.target='_blank';href.rel='noopener noreferrer';buttons.append(href);}
      row.append(summary,buttons);list.append(row);
    }
  }
  function render(){renderList('results');renderList('titles');}
  for(const kind of Object.keys(kindDefs)) {
    const def=kindDefs[kind],form=$(def.form);
    field(form,'game').addEventListener('change',()=>syncPlatform(form,true));
    form.addEventListener('change',()=>markDirty(form,true));
    form.addEventListener('submit',async event=>{
      event.preventDefault();
      try {
        const record=readRow(kind),next=structuredClone(getData());
        const rows=next.competition[kind],index=rows.findIndex(r=>r.id===record.id);
        if(index>=0)rows[index]=record;else rows.push(record);
        await persist(next,'Registro salvo. Use Publicar no site para atualizar a modalidade.',form);
        resetForm(kind);render();
      }catch(error){feedback(error.message,true);}
    });
    form.querySelector('[data-cancel]').addEventListener('click',()=>{if(checkAbandon(form))resetForm(kind);});
    resetForm(kind);
  }

  function mountBulkImport(){
    const form=$('#competition-import-form');
    if(!form)return;
    const target=$('#competition-import-text');
    const game=field(form,'game'),platform=field(form,'platform'),duplicateMode=field(form,'duplicateMode');
    const previewButton=$('#competition-import-preview'),applyButton=$('#competition-import-apply');
    const review=$('#competition-import-review'),summary=$('#competition-import-summary'),errors=$('#competition-import-errors');
    const list=$('#competition-import-list'),message=$('#competition-import-feedback'),clear=$('#competition-import-clear');
    let snapshot=null;
    function platformForGame(reset=false){
      if(game.value!=='free-fire'){
        platform.value='geral';platform.disabled=true;
      }else{
        platform.disabled=false;
        if(reset||platform.value==='geral')platform.value='emulador';
      }
    }
    function discardPreview(){
      snapshot=null;applyButton.disabled=true;review.hidden=true;message.textContent=target.value.trim()?'Texto alterado. Confira a prévia antes de importar.':'';
    }
    function clearForm(){
      form.reset();platformForGame(true);
      target.value='';discardPreview();message.textContent='';markDirty(form,false);
    }
    function prepared(){
      const parsed=parseResultsText(target.value);
      if(parsed.errors.length)return {...parsed,plan:null};
      return {...parsed,plan:planResultsImport(parsed.results,getData().competition.results,{
        game:game.value,platform:platform.value,mode:duplicateMode.value})};
    }
    function drawPreview(){
      snapshot=null;applyButton.disabled=true;review.hidden=false;errors.replaceChildren();list.replaceChildren();
      const result=prepared();
      if(result.errors.length){
        for(const error of result.errors)errors.append(create('p','',error));
        summary.textContent='Importação bloqueada: revise '+result.errors.length+' problema(s). Nenhum resultado foi salvo.';
        message.textContent='Revise as mensagens da prévia.';
        return;
      }
      const plan=result.plan;
      const {add,update,skip}=plan.counts;
      const current=getData().competition.results.length;
      summary.textContent=result.results.length+' resultados identificados · '+add+' novos · '+update+' atualizações · '+skip+' ignorados. Total atual no rascunho: '+current+'.';
      if(current+add>500){errors.append(create('p','','O histórico ultrapassaria o limite de 500 resultados. Remova alguns ou importe um lote menor.'));message.textContent='Limite do cadastro atingido.';return;}
      for(const entry of plan.entries){
        const row=create('div','competition-import-row');
        const info=create('div','');
        info.append(create('strong','',entry.record.tournament));
        info.append(create('small','',entry.record.date+' · '+entry.record.tier+' · Colocação: '+placementLabel(entry.record.placement)));
        const status=entry.status==='add'?'Novo':entry.status==='update'?'Atualizar':'Ignorar';
        const badge=create('span','competition-import-badge'+(entry.status==='add'?' is-new':entry.status==='update'?' is-updated':''),status);
        if(entry.status==='skip'&&entry.prior)badge.title='Este torneio já existe na modalidade e plataforma escolhidas.';
        if(entry.status==='skip'&&!entry.prior)badge.title='Este resultado aparece mais de uma vez no texto colado.';
        row.append(info,badge);list.append(row);
      }
      snapshot={source:target.value,game:game.value,platform:platform.value,mode:duplicateMode.value};
      applyButton.disabled=add+update===0;
      applyButton.textContent=(add+update>0?'Importar '+add+' novo(s)'+(update?' e atualizar '+update:''):'Nada novo para importar');
      message.textContent='A prévia ainda não altera o site. Ao importar, os dados são salvos no rascunho; depois use Publicar no site.';
    }
    game.addEventListener('change',()=>{platformForGame(true);discardPreview();});
    [platform,duplicateMode,target].forEach(input=>input.addEventListener('input',discardPreview));
    [platform,duplicateMode].forEach(input=>input.addEventListener('change',discardPreview));
    previewButton.addEventListener('click',drawPreview);
    clear.addEventListener('click',clearForm);
    form.addEventListener('submit',async event=>{
      event.preventDefault();
      if(!snapshot){message.textContent='Confira a prévia novamente antes de importar.';return;}
      if(target.value!==snapshot.source||game.value!==snapshot.game||platform.value!==snapshot.platform||duplicateMode.value!==snapshot.mode){
        discardPreview();message.textContent='Os dados foram alterados. Gere a prévia novamente.';return;
      }
      for(const kind of Object.keys(kindDefs)){
        if(isFormDirty($(kindDefs[kind].form))){
          message.textContent='Salve ou cancele as alterações nos formulários individuais antes de importar.';
          return;
        }
      }
      const result=prepared();
      if(result.errors.length||!result.plan||result.plan.counts.add+result.plan.counts.update===0){
        drawPreview();return;
      }
      const next=structuredClone(getData());
      try {
        next.competition.results=applyResultsImport(next.competition.results,result.plan,()=> 'import-'+NEW_ID());
        // Validação centralizada, inclusive dos limites e da lista privada.
        validateBackup(next);
        await persist(next,result.plan.counts.add+' novos resultados e '+result.plan.counts.update+' atualizações salvos no rascunho. Clique em Publicar no site.',form);
        const importedGame=game.value,importedPlatform=platform.value;
        clearForm();
        filters.game.value=importedGame;
        filters.platform.value=importedPlatform;filters.search.value='';
        render();
        message.textContent='Importação concluída no rascunho. Use Publicar no site para colocar os resultados no ar.';
      }catch(error){message.textContent='Não foi possível importar: '+error.message;feedback(error.message,true);}
    });
    platformForGame();
    markDirty(form,false);
  }
  mountBulkImport();
  const copyAll=$('#copy-admin-results');
  if(copyAll)copyAll.addEventListener('click',()=>{const rows=filteredRows('results');copyText(resultCopyText(rows,{gameName:MODE_NAMES[filters.game.value]||'NAKA GAMING',platform:filters.platform.value?platformLabel(filters.platform.value):'',format:'cards'}),rows.length+' resultados filtrados copiados com colocação.');});
  for(const value of Object.values(filters))value.addEventListener(value===filters.search?'input':'change',render);
  render();
}
