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
  function renderList(kind) {
    const list=$(kindDefs[kind].list);
    const game=filters.game.value,platform=filters.platform.value,term=filters.search.value.trim().toLocaleLowerCase('pt-BR');
    const filtered=getData().competition[kind]
      .filter(record=>(!game||record.game===game)&&(!platform||record.platform===platform)&&(!term||record.tournament.toLocaleLowerCase('pt-BR').includes(term)))
      .sort((a,b)=>b.date.localeCompare(a.date)||a.tournament.localeCompare(b.tournament));
    list.replaceChildren();
    $('#competition-'+kind+'-count').textContent=filtered.length+' registros';
    if(!filtered.length){list.append(create('p','field-help','Nenhum cadastro para os filtros escolhidos.'));return;}
    for(const record of filtered){
      const row=create('article','roster-admin-row');
      const summary=create('div','');
      summary.append(create('strong','',record.tournament+(record.visible?'':' · Oculto')));
      summary.append(create('p','field-help',formatted(record.date)+' · '+MODE_NAMES[record.game]+' / '+platformLabel(record.platform)+(record.tier?' · '+record.tier:'')+(record.placement?' · '+record.placement:'')));
      const buttons=create('div','roster-row-actions');
      const edit=create('button','link-button','Editar'),remove=create('button','link-button','Remover');
      edit.type='button';remove.type='button';
      edit.addEventListener('click',()=>editRow(kind,record));remove.addEventListener('click',()=>removeRow(kind,record));
      buttons.append(edit,remove);
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
  for(const value of Object.values(filters))value.addEventListener(value===filters.search?'input':'change',render);
  render();
}
