import {validatePhoto,validateInstagram} from './admin-schema.mjs?v=20261101-identity';
import {releaseMedia} from './roster-media.mjs?v=20261101-news';
import {personCard} from './roster-view.mjs?v=20261101-news';
import {uploadPhoto} from './admin-media.mjs?v=20261101-news';
import {createPhotoCrop} from './admin-photo-crop.mjs?v=20261101-news';
const $=s=>document.querySelector(s);
const id=()=>(typeof crypto.randomUUID==='function'?crypto.randomUUID():Array.from(crypto.getRandomValues(new Uint8Array(16)),byte=>byte.toString(16).padStart(2,'0')).join(''));
const field=(form,key)=>form.elements.namedItem(key);
function readProfile(form) {
  const result={id:field(form,'id').value || id()};
  for(const key of ['nick','name','role','ffId','instagram','photo','theme','photoFit'])result[key]=field(form,key).value.trim();
  for(const key of ['photoPosition','photoPositionX','photoZoom'])result[key]=Number(field(form,key).value);
  result.visible=field(form,'visible').checked;return result;
}
function fill(form,record={}) {
  form.reset();for(const [key,value]of Object.entries(record)){const input=field(form,key);if(!input)continue;if(input.type==='checkbox')input.checked=value;else input.value=value;}
}
function button(label,action,disabled=false) {const b=document.createElement('button');b.type='button';b.className='link-button';b.textContent=label;b.disabled=disabled;b.addEventListener('click',action);return b;}
function list(container,items,{edit,remove,move,label}) {
  container.replaceChildren();
  if(!items.length){const p=document.createElement('p');p.className='field-help';p.textContent='Nenhum cadastro ainda. Comece pelo formulário.';container.append(p);return;}
  items.forEach((item,index)=>{
    const row=document.createElement('article');row.className='roster-admin-row';
    const name=document.createElement('strong');name.textContent=(index+1)+'. '+label(item)+(item.visible?'':' · Oculto');
    const actions=document.createElement('div');actions.className='roster-row-actions';
    actions.append(button('Editar',()=>edit(item)),button('↑',()=>move(index,-1),index===0),button('↓',()=>move(index,1),index===items.length-1),button('Remover',()=>remove(item)));
    actions.children[1].setAttribute('aria-label','Mover '+label(item)+' para cima');actions.children[2].setAttribute('aria-label','Mover '+label(item)+' para baixo');
    row.append(name,actions);container.append(row);
  });
}
export function mountRosters({getData,persist,feedback,markDirty,isFormDirty,onBusy}) {
  const isTeams=!!$('#team-form'),isOrganization=document.body.dataset.adminPage==='/admin/organizacao/';
  const leaderKey=isOrganization?'organizationLeaders':'leaders';
  const isLeaderType=type=>type==='leader'||type==='organization-leader';
  const leaderType=isOrganization?'organization-leader':'leader';
  const form=$(isTeams?'#player-form':'#leader-form'),kind=isTeams?'player':'leader';
  let selectedTeam='',undo=null;
  const crop=createPhotoCrop({form,getProfile:()=>readProfile(form),onApply:()=>{markDirty(form,true);preview();feedback('Enquadramento aplicado. Salve o cadastro e publique para atualizar a foto no site.');},feedback,circle:!isTeams});
  form.querySelector('[data-adjust-photo]').addEventListener('click',()=>crop.open());
  const undoButton=$('#undo-roster');
  function clearUndo(){undo=null;undoButton.hidden=true;}
  function discard(target){return !isFormDirty(target)||confirm('Descartar as alterações ainda não salvas neste formulário?');}
  function currentTeam(){return getData().teams.find(t=>t.id===selectedTeam);}
  function preview(){
    const profile=readProfile(form);profile.nick ||= 'NICK';profile.role ||= isTeams?'Jogador':'Liderança';
    try{profile.photo=validatePhoto(profile.photo);}catch{profile.photo='';}
    try{profile.instagram=validateInstagram(profile.instagram);}catch{profile.instagram='';}
    const container=$(isTeams?'#player-preview':'#leader-preview');releaseMedia(container);container.replaceChildren(personCard(profile,currentTeam()||{},!isTeams));
  }
  function resetProfile(){
    fill(form);field(form,'id').value='';if(isTeams)field(form,'theme').value='inherit';
    $('#'+kind+'-form-title').textContent=isTeams?'Adicionar jogador':'Adicionar líder';markDirty(form,false);preview();
  }
  function editProfile(profile){if(!discard(form))return;fill(form,profile);markDirty(form,false);$('#'+kind+'-form-title').textContent='Editar '+(isTeams?'jogador':'líder');preview();form.scrollIntoView({block:'start',behavior:'instant'});}
  async function changeList(mutator,message){
    try{const next=structuredClone(getData());mutator(next);await persist(next,message);clearUndo();render();}
    catch(error){feedback(error.message,true);}
  }
  async function removeRecord(record,type){
    if(!confirm('Remover '+(record.name||record.nick)+' do rascunho? O site só muda quando você publicar.'))return;
    const previous=structuredClone(getData()),teamId=selectedTeam;
    const rows=type==='team'?previous.teams:isLeaderType(type)?previous[leaderKey]:previous.teams.find(t=>t.id===teamId).players;
    const removedIndex=rows.findIndex(row=>row.id===record.id);
    try{
      const next=structuredClone(previous);
      if(type==='team')next.teams=next.teams.filter(t=>t.id!==record.id);
      else if(isLeaderType(type))next[leaderKey]=next[leaderKey].filter(p=>p.id!==record.id);
      else next.teams.find(t=>t.id===selectedTeam).players=next.teams.find(t=>t.id===selectedTeam).players.filter(p=>p.id!==record.id);
      await persist(next,'Cadastro removido do rascunho. Você pode desfazer a última remoção.');
      undo={type,record:structuredClone(record),index:removedIndex,teamId};undoButton.hidden=false;
      const removedSelected=type==='team'&&selectedTeam===record.id;
      if(removedSelected)selectedTeam='';
      render();
      if(removedSelected||field(form,'id').value===record.id)resetProfile();
      if(type==='team'&&field($('#team-form'),'id').value===record.id){fill($('#team-form'));field($('#team-form'),'id').value='';markDirty($('#team-form'),false);$('#team-form-title').textContent='Nova equipe';}
    }catch(error){feedback(error.message,true);}
  }
  async function moveProfile(index,direction){await changeList(next=>{
    const rows=isTeams?next.teams.find(t=>t.id===selectedTeam).players:next[leaderKey];
    [rows[index],rows[index+direction]]=[rows[index+direction],rows[index]];
  },'Ordem salva no rascunho.');}
  function syncTeamPlatform(reset=false){const f=$('#team-form');if(!f)return;const platform=field(f,'platform'),game=field(f,'game').value;if(game!=='free-fire'){platform.value='geral';platform.disabled=true;}else{platform.disabled=false;if(reset||platform.value==='geral')platform.value='emulador';}}
  function renderProfiles(){
    const team=currentTeam(),rows=isTeams?(team?.players||[]):getData()[leaderKey];
    list($(isTeams?'#roster-player-list':'#leader-list'),rows,{label:p=>p.nick,edit:editProfile,remove:p=>removeRecord(p,isTeams?'player':leaderType),move:moveProfile});
    if(isTeams)form.querySelector('button[type=submit]').disabled=!team;
    preview();
  }
  function render(){
    if(isTeams){
      const teams=getData().teams;if(!teams.some(t=>t.id===selectedTeam))selectedTeam=teams[0]?.id||'';
      const select=$('#roster-team-select');select.replaceChildren();
      if(!teams.length){const option=document.createElement('option');option.value='';option.textContent='Cadastre uma equipe primeiro';select.append(option);}
      for(const team of teams){const option=document.createElement('option');option.value=team.id;option.textContent=team.name;select.append(option);}select.value=selectedTeam;
      list($('#team-list'),teams,{label:t=>t.name,edit:t=>{
        if(!discard($('#team-form')))return;fill($('#team-form'),t);syncTeamPlatform();markDirty($('#team-form'),false);$('#team-form-title').textContent='Editar equipe';
      },remove:t=>removeRecord(t,'team'),move:(index,direction)=>changeList(next=>{[next.teams[index],next.teams[index+direction]]=[next.teams[index+direction],next.teams[index]];},'Ordem das equipes salva.')});
    }
    renderProfiles();
  }
  function bindUpload(target,fileName,resultName){
    const input=field(target,fileName);input.addEventListener('change',async()=>{
      const file=input.files[0];if(!file)return;
      onBusy(1);const status=target.querySelector('.upload-status');status.textContent='Otimizando e enviando imagem…';
      try{field(target,resultName).value=await uploadPhoto(file);markDirty(target,true);status.textContent='Imagem enviada em WebP. Salve o cadastro e publique quando estiver pronto.';if(target===form){field(form,'photoPositionX').value=50;field(form,'photoPosition').value=50;field(form,'photoZoom').value=1;preview();crop.open();}}
      catch(error){status.textContent=error.message;feedback(error.message,true);}
      finally{input.value='';onBusy(-1);}
    });
  }
  form.addEventListener('input',()=>{markDirty(form,true);preview();});
  form.addEventListener('submit',async event=>{
    event.preventDefault();
    try{
      if(isTeams&&!currentTeam())throw new Error('Cadastre e selecione uma equipe primeiro.');
      const record=readProfile(form),next=structuredClone(getData());
      const rows=isTeams?next.teams.find(t=>t.id===selectedTeam).players:next[leaderKey],index=rows.findIndex(p=>p.id===record.id);
      if(index<0)rows.push(record);else rows[index]=record;
      await persist(next,'Perfil salvo no rascunho. Use Publicar no site para exibi-lo.',form);clearUndo();resetProfile();renderProfiles();
    }catch(error){feedback(error.message,true);}
  });
  form.querySelector('[data-cancel-profile]').addEventListener('click',()=>{if(discard(form))resetProfile();});
  $('#new-'+kind).addEventListener('click',()=>{if(discard(form))resetProfile();});
  bindUpload(form,'photoFile','photo');
  undoButton.addEventListener('click',async()=>{
    if(!undo)return;try{
      const next=structuredClone(getData()),rows=undo.type==='team'?next.teams:isLeaderType(undo.type)?next[leaderKey]:next.teams.find(t=>t.id===undo.teamId)?.players;
      if(!rows)throw new Error('A equipe foi removida. Restaure a equipe antes do jogador.');
      rows.splice(Math.min(undo.index,rows.length),0,undo.record);
      await persist(next,'Última remoção desfeita.');clearUndo();render();
    }catch(error){feedback(error.message,true);}
  });
  if(isTeams){
    const teamForm=$('#team-form');
    teamForm.addEventListener('change',event=>{if(event.target===field(teamForm,'game'))syncTeamPlatform(true);});
    function resetTeam(){fill(teamForm);syncTeamPlatform();field(teamForm,'id').value='';$('#team-form-title').textContent='Nova equipe';markDirty(teamForm,false);}
    $('#new-team').addEventListener('click',()=>{if(discard(teamForm))resetTeam();});$('#cancel-team').addEventListener('click',()=>{if(discard(teamForm))resetTeam();});
    $('#roster-team-select').addEventListener('change',event=>{
      if(!discard(form)){event.target.value=selectedTeam;return;}selectedTeam=event.target.value;resetProfile();renderProfiles();
    });
    teamForm.addEventListener('input',()=>markDirty(teamForm,true));
    teamForm.addEventListener('submit',async event=>{
      event.preventDefault();try{
        const next=structuredClone(getData()),teamId=field(teamForm,'id').value||id(),index=next.teams.findIndex(t=>t.id===teamId);
        const team={id:teamId,players:index<0?[]:next.teams[index].players};
        for(const key of ['name','category','description','theme','background','game','platform'])team[key]=field(teamForm,key).value.trim();team.visible=field(teamForm,'visible').checked;
        if(index<0)next.teams.push(team);else next.teams[index]=team;
        await persist(next,'Equipe salva. Adicione os jogadores no elenco abaixo.',teamForm);if(!selectedTeam)selectedTeam=teamId;clearUndo();resetTeam();render();
      }catch(error){feedback(error.message,true);}
    });bindUpload(teamForm,'backgroundFile','background');
  }
  render();resetProfile();
}
