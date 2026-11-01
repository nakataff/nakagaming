import {assertAdmin} from './admin-auth-policy.mjs?v=20261101-history';
import {validateNewsArticle,validateNewsMeta,newsMetadata,validNewsId} from './news-schema.mjs?v=20261101-history';
export function createNewsRepository({getUser,readRecord,listRecords,write}){
 function owner(){return assertAdmin(getUser());}
 function same(user){if(owner().uid!==user.uid)throw new Error('A sessão mudou. Entre novamente.');}
 return {
  async list(cursor=null){const user=owner(),result=await listRecords(cursor);same(user);return {...result,items:result.items.map(row=>validateNewsMeta(row))};},
  async read(id){const user=owner();if(!validNewsId(id))throw new Error('Notícia inválida.');const raw=await readRecord(id);same(user);if(!raw)throw new Error('A notícia não foi encontrada.');return validateNewsArticle(raw);},
  async save(input,expectedRevision,mode='draft'){
   const user=owner();
   if(!['draft','published','archived'].includes(mode)||!Number.isSafeInteger(expectedRevision)||expectedRevision<0||expectedRevision>=Number.MAX_SAFE_INTEGER-1)throw new Error('Recarregue a notícia antes de salvar.');
   const revision=expectedRevision+1;
   const article=validateNewsArticle({...input,sortKey:undefined,revision,status:mode,liveRevision:mode==='published'?revision:mode==='archived'?0:input.liveRevision??0});
   const metadata=newsMetadata(article),changes={['drafts/'+article.id]:article,['adminIndex/'+article.id]:metadata};
   if(mode==='published'){changes['publicIndex/'+article.id]=metadata;changes['articles/'+article.id]=article;}
   if(mode==='archived'){changes['publicIndex/'+article.id]=null;changes['articles/'+article.id]=null;}
   await write(changes);same(user);return article;
  }
 };
}
