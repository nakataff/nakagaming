import {ref,set,serverTimestamp} from 'https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js';
import {database} from './firebase-client.mjs?v=20261101-history';
import {getCurrentAdmin} from './admin-auth.mjs?v=20261101-history';
import {compressImage} from './image-compress.mjs?v=20261101-history';
export async function uploadPhoto(file,options) {
  const user=getCurrentAdmin(),dataUrl=await compressImage(file,options);
  if (getCurrentAdmin().uid!==user.uid) throw new Error('Entre novamente antes de enviar a imagem.');
  const id=(typeof crypto.randomUUID==='function'?crypto.randomUUID():Array.from(crypto.getRandomValues(new Uint8Array(16)),byte=>byte.toString(16).padStart(2,'0')).join(''));
  await set(ref(database,'nakaGamingMedia/'+id),{dataUrl,createdAt:serverTimestamp(),createdBy:user.uid});
  return 'media:'+id;
}
