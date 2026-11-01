import {publicSnapshot} from './admin-schema.mjs?v=20261101-identity';
import {assertAdmin} from './admin-auth-policy.mjs?v=20261101-identity';
export function createPublisher({getUser,write,timestamp}) {
  return async (draft,revision)=>{
    assertAdmin(getUser());
    if (!Number.isSafeInteger(revision) || revision<1) throw new Error('Salve o rascunho na conta antes de publicar.');
    const config=publicSnapshot(draft),stateJson=JSON.stringify(config);
    if (stateJson.length>200000) throw new Error('O conteúdo ultrapassa o limite de publicação.');
    await write({schemaVersion:1,draftRevision:revision,stateJson,publishedAt:timestamp()});
    return config;
  };
}
