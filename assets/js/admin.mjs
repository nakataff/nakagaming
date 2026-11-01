import {CONTENT_FIELDS, LINK_FIELDS, validatePublic, validateBackup, publicSnapshot} from './admin-schema.mjs?v=20261101-emufix';
import {repository,publishDraft} from './admin-cloud.mjs?v=20261101-emufix';
import {mountRosters} from './admin-rosters.mjs?v=20261101-news';
import {mountCompetition} from './admin-competition.mjs?v=20261101-emufix';
import {clearPublishedCache} from './site-data.mjs?v=20261101-news';
import {currentAdmin, getCurrentAdmin, watchSession, logout, goToLogin} from './admin-auth.mjs?v=20261101-news';
import {isAdminUser} from './admin-auth-policy.mjs?v=20261101-news';

if (window.location.pathname.endsWith('/index.html')) {
  window.location.replace(window.location.pathname.slice(0, -'index.html'.length) + window.location.search + window.location.hash);
}

const $ = (selector) => document.querySelector(selector);
let data, savedAt, revision, dirty = false, removedMember = null, pendingImport = null, saving = false;
const dirtyForms=new Set();
let uploads=0;
function markDirty(form,value=true) {
  if(value)dirtyForms.add(form);else dirtyForms.delete(form);
  dirty=dirtyForms.size>0;
  if(dirty)$('#save-state').textContent='Alterações não salvas';else showSaved();
}
document.addEventListener('input',event=>{const form=event.target.closest('form');if(form)markDirty(form);});
function onBusy(delta) {
  uploads+=delta;
  $('#admin-content').inert=uploads>0||saving;
  $('#publish-site').disabled=uploads>0||saving;
}
function feedback(message, error = false) {
  const box = $('#feedback');
  box.textContent = message;
  box.classList.toggle('error', error);
  box.hidden = false;
}
function showSaved() {
  $('#save-state').textContent = dirty ? 'Alterações não salvas' : savedAt
    ? 'Salvo ' + new Intl.DateTimeFormat('pt-BR', {day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit'}).format(new Date(savedAt))
    : 'Rascunho inicial';
}
async function persist(next, message, sourceForm=null) {
  if (saving || uploads) throw new Error('Aguarde o salvamento ou envio em andamento.');
  const form=sourceForm || document.activeElement?.closest('form');
  saving = true;
  $('#admin-content').inert = true;
  $('#save-state').textContent = 'Salvando na conta…';
  let result;
  try { result = await repository.saveDraft(next, revision); }
  finally {
    saving = false;
    $('#save-state').textContent = dirty ? 'Alterações não salvas' : 'Confira o último salvamento';
    if (!document.body.classList.contains('auth-pending')) $('#admin-content').inert = false;
  }
  data = result.data; savedAt = result.savedAt; revision = result.revision;
  if(form)dirtyForms.delete(form);
  dirty=dirtyForms.size>0;
  showSaved();
  feedback(message);
}
function download(filename, payload) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2) + '\n'], {type:'application/json'}));
  const anchor = document.createElement('a');
  anchor.href = url; anchor.download = filename; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}
function preview() {
  const form = $('#site-form');
  for (const [key, selector] of [['homeTitle','#preview-title'],['homeSubtitle','#preview-subtitle'],['homeHighlight','#preview-highlight'],['homeDescription','#preview-description']]) {
    $(selector).textContent = form.elements.namedItem(key).value;
  }
}
function setupSite() {
  const form = $('#site-form');
  for (const key of Object.keys(CONTENT_FIELDS)) form.elements.namedItem(key).value = data.content[key];
  for (const key of Object.keys(LINK_FIELDS)) form.elements.namedItem(key).value = data.links[key];
  preview();
  form.addEventListener('input', () => { dirty = true; $('#save-state').textContent = 'Alterações não salvas'; preview(); });
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const content = {}, links = {};
    for (const key of Object.keys(CONTENT_FIELDS)) content[key] = form.elements.namedItem(key).value;
    for (const key of Object.keys(LINK_FIELDS)) links[key] = form.elements.namedItem(key).value;
    try {
      await persist({...data, ...validatePublic({...data,content,links})}, 'Rascunho salvo na sua conta. Use Publicar no site para colocar as alterações no ar.',form);
      preview();
    } catch (error) { feedback(error.message, true); }
  });
}
function newMemberId() {
  return typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : Array.from(crypto.getRandomValues(new Uint8Array(16)), (byte) => byte.toString(16).padStart(2, '0')).join('');
}
function resetMemberForm() {
  $('#member-form').reset();
  $('#member-form').elements.namedItem('memberId').value = '';
  $('#member-form-title').textContent = 'Adicionar membro';
  $('#cancel-edit').hidden = true;
  markDirty($('#member-form'),false);
  showSaved();
}
function renderMembers() {
  const term = $('#member-search').value.trim().toLocaleLowerCase('pt-BR');
  const status = $('#member-status-filter').value;
  const members = data.members.filter((m) => m.nick.toLocaleLowerCase('pt-BR').includes(term) && (!status || m.status === status));
  const container = $('#member-list'); container.replaceChildren();
  $('#list-count').textContent = `${members.length} de ${data.members.length} membros`;
  if (!members.length) {
    const empty = document.createElement('div'); empty.className = 'admin-empty';
    const heading = document.createElement('h3'); heading.textContent = data.members.length ? 'Nenhum resultado' : 'A guilda começa por aqui';
    const paragraph = document.createElement('p'); paragraph.textContent = data.members.length ? 'Ajuste a busca ou o filtro de situação.' : 'Adicione o primeiro nick para começar seu rascunho.';
    empty.append(heading, paragraph); container.append(empty); return;
  }
  for (const member of members) {
    const row = document.createElement('article'); row.className = 'member-row';
    const identity = document.createElement('div');
    const nick = document.createElement('strong'); nick.textContent = member.nick;
    const role = document.createElement('small'); role.textContent = member.role;
    identity.append(nick, role);
    const status = document.createElement('span'); status.className = 'member-status'; status.textContent = member.status;
    const actions = document.createElement('div'); actions.className = 'member-actions';
    for (const [action, label] of [['edit','Editar'],['remove','Remover']]) {
      const button = document.createElement('button'); button.type = 'button'; button.className = 'link-button'; button.textContent = label;
      button.dataset.action = action; button.dataset.id = member.id;
      button.setAttribute('aria-label', `${label} ${member.nick}`); actions.append(button);
    }
    row.append(identity, status, actions); container.append(row);
  }
}
function setupGuild() {
  const form = $('#member-form');
  form.addEventListener('input', () => { dirty = true; $('#save-state').textContent = 'Membro ainda não salvo'; });
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const id = form.elements.namedItem('memberId').value || newMemberId();
    const member = {id, nick:form.elements.namedItem('nick').value.trim(), role:form.elements.namedItem('role').value, status:form.elements.namedItem('status').value};
    const next = structuredClone(data), index = next.members.findIndex((m) => m.id === id);
    if (index < 0) next.members.push(member); else next.members[index] = member;
    try { await persist(next, 'Membro salvo no rascunho da conta.'); resetMemberForm(); renderMembers(); }
    catch (error) { feedback(error.message, true); }
  });
  $('#cancel-edit').addEventListener('click', resetMemberForm);
  $('#member-search').addEventListener('input', renderMembers);
  $('#member-status-filter').addEventListener('change', renderMembers);
  $('#member-list').addEventListener('click', async (event) => {
    const button = event.target.closest('button[data-action]'); if (!button) return;
    const member = data.members.find((m) => m.id === button.dataset.id); if (!member) return;
    if (button.dataset.action === 'edit') {
      for (const [key, value] of Object.entries({memberId:member.id, nick:member.nick, role:member.role, status:member.status})) form.elements.namedItem(key).value = value;
      $('#member-form-title').textContent = 'Editar membro'; $('#cancel-edit').hidden = false;
      form.elements.namedItem('nick').focus();
      return;
    }
    try {
      const next = structuredClone(data); const index = next.members.findIndex((m) => m.id === member.id); next.members.splice(index, 1);
      await persist(next, 'Membro removido do rascunho. Você pode desfazer abaixo da lista.');
      removedMember = {member, index}; $('#undo-box').hidden = false;
      if (form.elements.namedItem('memberId').value === member.id) resetMemberForm();
      renderMembers();
    } catch (error) { feedback(error.message, true); }
  });
  $('#undo-remove').addEventListener('click', async () => {
    if (!removedMember) return;
    try {
      const next = structuredClone(data); next.members.splice(removedMember.index, 0, removedMember.member);
      await persist(next, 'Remoção desfeita.'); removedMember = null; $('#undo-box').hidden = true; renderMembers();
    } catch (error) { feedback(error.message, true); }
  });
  renderMembers();
}
function setupBackup() {
  const localButton = $('#import-local');
  try { localButton.hidden = !localStorage.getItem('naka-admin-draft-v1'); } catch { /* Sem rascunho antigo. */ }
  localButton.addEventListener('click', () => {
    pendingImport = null; $('#import-review').hidden = true;
    try {
      pendingImport = validateBackup(JSON.parse(localStorage.getItem('naka-admin-draft-v1')));
      $('#import-summary').textContent = `${pendingImport.members.length} membros e os textos/canais do rascunho anterior. Confirme para salvá-los na sua conta.`;
      $('#import-review').hidden = false;
      feedback('Rascunho anterior validado. A cópia local será preservada.');
    } catch { feedback('Não foi possível recuperar o rascunho antigo. Use um arquivo de backup.', true); }
  });
  $('#export-backup').addEventListener('click', () => {
    download('naka-backup.json', validateBackup(data));
    feedback('Download do backup solicitado. Guarde uma cópia fora deste navegador.');
  });
  $('#export-public').addEventListener('click', () => {
    download('naka-site.json', publicSnapshot(data));
    feedback('Download da configuração solicitado. Inclui textos, canais, equipes e líderes públicos; a lista privada de membros fica fora.');
  });
  $('#import-file').addEventListener('change', async (event) => {
    pendingImport = null; $('#import-review').hidden = true;
    const file = event.target.files[0]; if (!file) return;
    try {
      if (file.size > 1024 * 1024) throw new Error('O arquivo ultrapassa o limite de 1 MB.');
      let parsed;
      try { parsed = JSON.parse(await file.text()); } catch { throw new Error('Não foi possível ler o JSON. Selecione um backup válido.'); }
      pendingImport = validateBackup(parsed);
      $('#import-summary').textContent = `${pendingImport.members.length} membros, ${Object.keys(pendingImport.links).length} canais e os textos do portal. Nenhuma alteração foi aplicada à conta ainda.`;
      $('#import-review').hidden = false;
      feedback('Backup validado. Revise o resumo antes de confirmar a importação.');
    } catch (error) { feedback(error.message, true); }
  });
  $('#cancel-import').addEventListener('click', () => {
    pendingImport = null; $('#import-review').hidden = true; $('#import-file').value = '';
    feedback('Importação cancelada. O rascunho da conta foi mantido.');
  });
  $('#confirm-import').addEventListener('click', async () => {
    if (!pendingImport) return;
    try {
      await persist(pendingImport, 'Backup importado na sua conta. O site publicado não foi alterado.');
      pendingImport = null; $('#import-review').hidden = true; $('#import-file').value = '';
    } catch (error) { feedback(error.message, true); }
  });
}
$('#admin-logout').addEventListener('click', async () => {
  if (saving || uploads) { feedback('Aguarde o salvamento ou envio antes de sair.', true); return; }
  if (dirty && !confirm('Sair sem salvar as alterações nos formulários?'))return;
  try { await logout(); dirty = false; goToLogin(); }
  catch { feedback('Não foi possível encerrar a sessão. Tente novamente.', true); }
});
$('#publish-site').addEventListener('click',async()=>{
  if(saving||uploads){feedback('Aguarde o salvamento ou envio em andamento.',true);return;}
  if(dirty){feedback('Salve ou cancele as alterações dos formulários antes de publicar.',true);return;}
  const config=publicSnapshot(data),players=config.teams.reduce((total,team)=>total+team.players.length,0);
  if(!confirm('Publicar os textos e canais, '+config.teams.length+' equipes, '+players+' jogadores e '+config.leaders.length+' líderes? A lista privada de membros não será publicada.'))return;
  saving=true;onBusy(0);
  try {
    if(revision===0){const saved=await repository.saveDraft(data,0);data=saved.data;revision=saved.revision;savedAt=saved.savedAt;}
    await publishDraft(data,revision);clearPublishedCache();
    feedback('Publicado no site. Visitantes podem levar até 2 minutos para atualizar o conteúdo em cache.');
  } catch(error){feedback('Não foi possível publicar. '+(error.code==='PERMISSION_DENIED'?'O rascunho pode ter mudado em outra sessão. Recarregue antes de tentar novamente.':error.message),true);}
  finally{saving=false;onBusy(0);showSaved();}
});
$('#auth-retry').addEventListener('click', async () => {
  try { await logout(); goToLogin(); }
  catch { $('#auth-loading-message').textContent = 'Não foi possível encerrar a sessão. Recarregue a página.'; }
});
try {
  const user = await currentAdmin();
  const stopWatching = watchSession((current) => {
    if (!isAdminUser(current) || current.uid !== user.uid) {
      dirty = false; dirtyForms.clear(); data = null; pendingImport = null; removedMember = null;
      document.body.classList.add('auth-pending');
      $('#admin-content').replaceChildren();
      goToLogin();
    }
  });
  const loaded = await repository.loadDraft();
  if (getCurrentAdmin().uid !== user.uid) throw Object.assign(new Error('A conta conectada mudou.'), {code:'naka/auth-required'});
  data = loaded.data; savedAt = loaded.savedAt; revision = loaded.revision;
  showSaved();
  if (loaded.notice) feedback(loaded.notice, true);
  const path = document.body.dataset.adminPage;
  if (path === '/admin/') $('#channel-count').textContent=String(Object.keys(data.links).length).padStart(2,'0');
  if (path === '/admin/') $('#member-count').textContent = String(data.members.length).padStart(2, '0');
  if (path === '/admin/site/') setupSite();
  if (path === '/admin/guilda/') setupGuild();
  if (path === '/admin/equipes/' || path === '/admin/guilda/') mountRosters({getData:()=>data,persist,feedback,markDirty,isFormDirty:form=>dirtyForms.has(form),onBusy});
  if (path === '/admin/competitivo/') mountCompetition({getData:()=>data,persist,feedback,markDirty,isFormDirty:form=>dirtyForms.has(form)});
  if (path === '/admin/noticias/') {
    const [{mountNews},{newsRepository}]=await Promise.all([import('./admin-news.mjs?v=20261101-news'),import('./news-cloud.mjs?v=20261101-news')]);
    await mountNews({repository:newsRepository,feedback,onBusy,markDirty,isFormDirty:form=>dirtyForms.has(form)});
  }
  if (path === '/admin/backup/') setupBackup();
  $('#admin-content').inert = false;
  document.body.classList.remove('auth-pending');
  window.addEventListener('pagehide', () => {
    document.body.classList.add('auth-pending');
    $('#admin-content').inert = true;
    stopWatching();
  }, {once:true});
} catch (error) {
  if (error.code === 'naka/auth-required') goToLogin();
  else {
    $('#auth-loading-message').textContent = 'Não foi possível validar o acesso aos dados da conta. Recarregue a página ou confira as permissões do painel.';
    $('#auth-retry').hidden = false;
  }
}
window.addEventListener('beforeunload', (event) => { if (dirty || uploads || saving) { event.preventDefault(); event.returnValue = ''; } });
window.addEventListener('pageshow', (event) => { if (event.persisted) location.reload(); });
