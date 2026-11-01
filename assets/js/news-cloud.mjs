import {get,ref,update,query,orderByChild,limitToLast,endBefore} from 'https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js';
import {database} from './firebase-client.mjs?v=20261101-news';
import {getCurrentAdmin} from './admin-auth.mjs?v=20261101-news';
import {createNewsRepository} from './news-store.mjs?v=20261101-news';
const root=ref(database,'nakaGamingNews');
export const newsRepository=createNewsRepository({
 getUser:getCurrentAdmin,
 readRecord:async id=>(await get(ref(database,'nakaGamingNews/drafts/'+id))).val(),
 listRecords:async cursor=>{
  const snapshot=await get(query(ref(database,'nakaGamingNews/adminIndex'),orderByChild('sortKey'),...(cursor?[endBefore(cursor)]:[]),limitToLast(21)));
  const rows=Object.values(snapshot.val()||{}).sort((a,b)=>a.sortKey<b.sortKey?1:a.sortKey>b.sortKey?-1:0),items=rows.slice(0,20);
  return {items,cursor:rows.length>20?items.at(-1).sortKey:null};
 },
 write:changes=>update(root,changes)
});
