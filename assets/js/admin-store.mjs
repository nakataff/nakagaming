import {validateBackup} from './admin-schema.mjs';
import {assertAdmin} from './admin-auth-policy.mjs';

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
      if (remote.schemaVersion !== 1 || !Number.isSafeInteger(remote.revision) || remote.revision < 1) throw new Error('O rascunho da conta tem um formato incompatível. Importe um backup válido.');
      const data = validateBackup(JSON.parse(remote.stateJson));
      return {data, revision:remote.revision, savedAt:remote.updatedAt ? new Date(remote.updatedAt).toISOString() : null, notice:''};
    },
    async saveDraft(input, expectedRevision) {
      const user = owner(), data = validateBackup(input);
      if (!Number.isSafeInteger(expectedRevision) || expectedRevision < 0 || expectedRevision >= Number.MAX_SAFE_INTEGER) throw new Error('Recarregue o painel antes de salvar.');
      const stateJson = JSON.stringify(data);
      if (stateJson.length > 200000) throw new Error('O rascunho ultrapassa o limite permitido. Exporte um backup para preservar seus dados.');
      const result = await transact((current) => {
        // O SDK pode chamar primeiro com cache vazio. O servidor repete a
        // transação com o estado atual e valida a revisão antes de gravar.
        if (current !== null && (current?.revision || 0) !== expectedRevision) return undefined;
        return {schemaVersion:1, revision:expectedRevision + 1, stateJson, updatedAt:timestamp(), updatedBy:user.uid};
      });
      sameSession(user);
      if (!result.committed) throw new Error('Outra sessão alterou este rascunho. Preserve o que está editando e recarregue antes de salvar.');
      return {data, revision:result.value.revision, savedAt:new Date(result.value.updatedAt).toISOString()};
    }
  };
}
