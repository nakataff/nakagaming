import {get, ref, runTransaction, serverTimestamp} from 'https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js';
import {database} from './firebase-client.mjs';
import {getCurrentAdmin} from './admin-auth.mjs';
import {createDraftRepository} from './admin-store.mjs';
const reference = ref(database, 'nakaGamingAdmin/state');
export const repository = createDraftRepository({
  getUser:getCurrentAdmin,
  read:async () => (await get(reference)).val(),
  transact:async (update) => {
    const result = await runTransaction(reference, update, {applyLocally:false});
    return {committed:result.committed, value:result.snapshot.val()};
  },
  loadBase:async () => {
    const response = await fetch('/assets/data/site.json');
    if (!response.ok) throw new Error('Não foi possível carregar a configuração inicial.');
    return response.json();
  },
  timestamp:serverTimestamp
});
