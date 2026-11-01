import {firebaseConfig} from './firebase-config.mjs?v=20261101-crop';
const resolved=new Map();
export const themeAssets=(theme)=>({
  background:'/assets/images/roster/background-'+(theme==='samurai-fem'?'samurai-fem':'samurai')+'.webp',
  placeholder:'/assets/images/roster/placeholder-'+(theme==='samurai-fem'?'samurai-fem':'samurai')+'.webp'
});
export async function mediaURL(reference) {
  if (!reference.startsWith('media:')) return reference;
  if (!resolved.has(reference)) resolved.set(reference,(async()=>{
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8000);
    try {
      const response=await fetch(firebaseConfig.databaseURL+'/nakaGamingMedia/'+encodeURIComponent(reference.slice(6))+'.json',{signal:controller.signal});
      if (!response.ok) throw new Error('Foto indisponível');
      const data=await response.json();
      if (typeof data?.dataUrl!=='string' || data.dataUrl.length>110000 || !/^data:image\/webp;base64,[A-Za-z0-9+/=]+$/.test(data.dataUrl)) throw new Error('Foto inválida');
      return data.dataUrl;
    } finally {clearTimeout(timer);}
  })());
  return resolved.get(reference);
}
const lazy=new IntersectionObserver(entries=>{
  for (const entry of entries) if (entry.isIntersecting) {
    lazy.unobserve(entry.target);
    const image=entry.target,reference=image.dataset.media;
    mediaURL(reference).then(url=>{if (image.isConnected) image.src=url;}).catch(()=>{});
  }
},{rootMargin:'250px'});
export function releaseMedia(root) {for(const image of root.querySelectorAll('[data-media]'))lazy.unobserve(image);}
export function setMedia(image,reference,fallback) {
  image.src=fallback;
  image.addEventListener('error',()=>{if (image.getAttribute('src')!==fallback) image.src=fallback;});
  if (!reference) return;
  if (!reference.startsWith('media:')) {image.src=reference;return;}
  image.dataset.media=reference;lazy.observe(image);
}
