import {validateBackup} from './admin-schema.mjs';
const KEY = 'naka-admin-draft-v1';
const TIME_KEY = 'naka-admin-saved-at-v1';
export async function loadDraft() {
  const response = await fetch('/assets/data/site.json');
  if (!response.ok) throw new Error('Não foi possível carregar a configuração inicial. Recarregue a página.');
  const base = validateBackup({...await response.json(), members:[]});
  let raw;
  try { raw = localStorage.getItem(KEY); } catch { throw new Error('O armazenamento deste navegador está bloqueado. Libere-o para usar o painel.'); }
  if (!raw) return {data:base, savedAt:null, revision:raw, notice:''};
  try { return {data:validateBackup(JSON.parse(raw)), savedAt:localStorage.getItem(TIME_KEY), revision:raw, notice:''}; }
  catch { return {data:base, savedAt:null, revision:raw, notice:'O rascunho anterior não pôde ser lido. Ele foi preservado; importe um backup válido para substituí-lo.'}; }
}
export function saveDraft(data, expectedRevision) {
  const validated = validateBackup(data);
  const savedAt = new Date().toISOString();
  const raw = JSON.stringify(validated);
  let current;
  try { current = localStorage.getItem(KEY); }
  catch { throw new Error('O armazenamento deste navegador está bloqueado.'); }
  if (expectedRevision !== current) throw new Error('O rascunho mudou em outra aba. Recarregue antes de salvar para preservar as alterações.');
  try { localStorage.setItem(KEY, raw); }
  catch { throw new Error('Não foi possível salvar neste navegador. Exporte um backup antes de sair.'); }
  // A data é apenas informativa. Falhar nela não invalida o rascunho salvo.
  try { localStorage.setItem(TIME_KEY, savedAt); } catch { /* Sem data. */ }
  return {data:validated, savedAt, revision:raw};
}
