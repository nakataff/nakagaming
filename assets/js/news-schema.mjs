import {validatePhoto} from './admin-schema.mjs?v=20261101-news';
export const NEWS_CATEGORIES=['Resultados','Novidades','Projetos','Organização'];
export const NEWS_STATUSES=['draft','published','archived'];
export function newsId(){return String(Date.now())+'-'+(typeof crypto.randomUUID==='function'?crypto.randomUUID():Array.from(crypto.getRandomValues(new Uint8Array(16)),n=>n.toString(16).padStart(2,'0')).join(''));}
export function validNewsId(value){return typeof value==='string'&&/^[a-z0-9-]{10,80}$/.test(value);}
function text(value,label,max,optional=false){
 if(optional&&(value===undefined||value===''))return '';
 if(typeof value!=='string'||!value.trim()||value.trim().length>max)throw new Error(label+': preencha até '+max+' caracteres.');
 return value.trim();
}
export function validateNewsMeta(raw,{publicOnly=false}={}){
 if(!raw||typeof raw!=='object'||Array.isArray(raw)||!validNewsId(raw.id))throw new Error('Identificador de notícia inválido.');
 const title=text(raw.title,'Título',140),excerpt=text(raw.excerpt,'Resumo',280,true),date=text(raw.date,'Data',10);
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date+'T12:00:00Z'))||new Date(date+'T12:00:00Z').toISOString().slice(0,10)!==date)throw new Error('Informe uma data válida para a notícia.');
 if(!NEWS_CATEGORIES.includes(raw.category))throw new Error('Escolha uma categoria válida.');
 const status=raw.status??'draft',revision=raw.revision??0,liveRevision=raw.liveRevision??0;
 if(!NEWS_STATUSES.includes(status)||!Number.isSafeInteger(revision)||revision<0||revision>=Number.MAX_SAFE_INTEGER||!Number.isSafeInteger(liveRevision)||liveRevision<0||liveRevision>revision)throw new Error('Estado ou revisão da notícia inválido.');
 if(publicOnly&&(status!=='published'||revision<1||liveRevision!==revision))throw new Error('Esta notícia não está publicada.');
 const sortKey=date+'_'+raw.id;
 if(raw.sortKey!==undefined&&raw.sortKey!==sortKey)throw new Error('Ordem de notícia inválida.');
 return {id:raw.id,title,excerpt,category:raw.category,date,cover:validatePhoto(raw.cover),status,revision,liveRevision,sortKey};
}
export function validateNewsArticle(raw,options={}){
 const meta=validateNewsMeta(raw,options),body=text(raw.body,'Texto',20000,true);
 if(meta.status==='published'&&!body)throw new Error('Escreva o texto da notícia antes de publicar.');
 return {...meta,body};
}
export function newsMetadata(raw){const {body,...meta}=validateNewsArticle(raw);return meta;}
export function todayInBrazil(){return new Intl.DateTimeFormat('sv-SE',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());}
export function formatNewsDate(date){return new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'short',year:'numeric',timeZone:'America/Sao_Paulo'}).format(new Date(date+'T12:00:00Z'));}
export function articleURL(id){if(!validNewsId(id))throw new Error('Notícia inválida.');return '/noticias/ler/?id='+encodeURIComponent(id);}
