import {validatePublic} from './admin-schema.mjs?v=20261101-identity';
import {firebaseConfig} from './firebase-config.mjs?v=20261101-news';
const CACHE_KEY='naka-public-site-v2', TTL=120000;
let pending;
async function request(url) {
  const controller=new AbortController(), timer=setTimeout(()=>controller.abort(),5000);
  try { const response=await fetch(url,{signal:controller.signal}); if (!response.ok) throw new Error('Conteúdo indisponível'); return await response.json(); }
  finally {clearTimeout(timer);}
}
export function loadSiteConfig() {
  return pending ||= (async()=>{
    let cached;
    try {cached=JSON.parse(sessionStorage.getItem(CACHE_KEY));} catch {}
    if (cached && Date.now()-cached.at<TTL) {try {return validatePublic(cached.config);} catch {}}
    try {
      const state=await request(firebaseConfig.databaseURL+'/nakaGamingPublic/site.json');
      if (state?.stateJson) {
        const config=validatePublic(JSON.parse(state.stateJson));
        try {sessionStorage.setItem(CACHE_KEY,JSON.stringify({at:Date.now(),config}));} catch {}
        return config;
      }
    } catch { /* Falha de rede: conserva a última publicação validada. */ }
    if (cached?.config) {try {return validatePublic(cached.config);} catch {}}
    const fallback=validatePublic(await request('/assets/data/site.json'));
    try {sessionStorage.setItem(CACHE_KEY,JSON.stringify({at:Date.now(),config:fallback}));} catch {}
    return fallback;
  })();
}
export function clearPublishedCache() {try {sessionStorage.removeItem(CACHE_KEY);} catch {}}
