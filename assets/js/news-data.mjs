import {firebaseConfig} from './firebase-config.mjs?v=20261101-history';
import {validateNewsMeta,validateNewsArticle,validNewsId} from './news-schema.mjs?v=20261101-history';
const PREFIX='naka-news-v1:',TTL=120000,pending=new Map();
async function request(path){
 const key=PREFIX+path;
 if(pending.has(key))return pending.get(key);
 const promise=(async()=>{
  try{const cached=JSON.parse(sessionStorage.getItem(key));if(cached&&Date.now()-cached.at<TTL)return cached.data;}catch{}
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),6000);
  try{
   const response=await fetch(firebaseConfig.databaseURL+'/nakaGamingNews/'+path,{signal:controller.signal});
   if(!response.ok)throw new Error('Não foi possível carregar as notícias.');
   const data=await response.json();try{sessionStorage.setItem(key,JSON.stringify({at:Date.now(),data}));}catch{}
   return data;
  }finally{clearTimeout(timer);}
 })();pending.set(key,promise);
 try{return await promise;}catch(error){pending.delete(key);throw error;}
}
export async function loadNewsPage({cursor=null,limit=12}={}){
 if(!Number.isInteger(limit)||limit<1||limit>24)throw new Error('Limite de notícias inválido.');
 const params=new URLSearchParams({orderBy:JSON.stringify('sortKey'),limitToLast:String(limit+(cursor?2:1))});
 if(cursor)params.set('endAt',JSON.stringify(cursor));
 const rows=Object.values(await request('publicIndex.json?'+params)||{}).map(row=>validateNewsMeta(row,{publicOnly:true})).filter(row=>!cursor||row.sortKey<cursor).sort((a,b)=>a.sortKey<b.sortKey?1:a.sortKey>b.sortKey?-1:0);
 const items=rows.slice(0,limit);return {items,cursor:rows.length>limit?items.at(-1).sortKey:null};
}
export async function loadNewsArticle(id){
 if(!validNewsId(id))return null;
 const raw=await request('articles/'+encodeURIComponent(id)+'.json');return raw?validateNewsArticle(raw,{publicOnly:true}):null;
}
export function clearNewsCache(){pending.clear();try{for(const key of Object.keys(sessionStorage))if(key.startsWith(PREFIX))sessionStorage.removeItem(key);}catch{}}
