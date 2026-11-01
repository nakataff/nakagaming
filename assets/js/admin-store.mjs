import {validateBackup} from './admin-schema.mjs?v=20261101-news';
import {assertAdmin} from './admin-auth-policy.mjs?v=20261101-news';

// Transporte injetável: a interface só recebe dados depois da leitura autorizada.
export function createDraftRepository({getUser, read, transact, loadBase, timestamp}) {
  function owner() { return assertAdmin(getUser()); }
  function sameSession(user) {
    if (owner().uid !== user.uid) throw new Error('A conta conectada mudou. Entre novamente.');
  }
  return {
    async loadDraft() {
      const user = owner();
      const remote = await read();
      sameSession(user);
      if (!remote) {
        const data = validateBackup({...await loadBase(), members:[]});
        sameSession(user);
        return {data, revision:0, savedAt:null, notice:''};
      }
      if (remote.schemaVersion !== 1 || !Number.i…2926 tokens truncated…iew').hidden = false;
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
