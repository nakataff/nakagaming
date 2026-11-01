import {loadNewsPage,loadNewsArticle} from './news-data.mjs?v=20261101-history';
import {newsCard,newsTextItem,articleParagraphs} from './news-view.mjs?v=20261101-history';
import {mountNewsCarousel} from './news-carousel.mjs?v=20261101-history';
import {formatNewsDate,articleURL} from './news-schema.mjs?v=20261101-history';
import {setMedia} from './roster-media.mjs?v=20261101-history';
const grid=document.querySelector('[data-news-grid]');
if(grid){
 const home=grid.dataset.newsGrid==='home',status=document.querySelector('#news-status'),more=document.querySelector('#news-more');let cursor=null,busy=false;
 async function load(){
  if(busy)return;busy=true;if(more)more.disabled=true;
  try{
   const page=await loadNewsPage({limit:home?8:12,cursor});
   for(const article of (home?page.items.slice(0,3):page.items))grid.append(newsCard(article));cursor=page.cursor;
   if(home){
    const recent=document.querySelector('#news-recent'),list=document.querySelector('#news-recent-list');
    for(const article of page.items.slice(3,8))list.append(newsTextItem(article));
    recent.hidden=!list.children.length;
    grid.closest('.news-home-layout').classList.toggle('has-recent',!recent.hidden);
    mountNewsCarousel(grid,document.querySelector('#news-dots'));
   }
   status.textContent=grid.children.length?'':'As próximas histórias da Naka chegam por aqui.';
   if(more){more.hidden=!cursor;more.textContent='Carregar mais notícias';}
  }catch{status.textContent='Não foi possível carregar as notícias agora.';if(more){more.hidden=false;more.textContent='Tentar novamente';}}
  finally{busy=false;if(more)more.disabled=false;}
 }
 if(more)more.addEventListener('click',load);await load();
}
if(document.querySelector('#news-article')){
 const container=document.querySelector('#news-article'),status=document.querySelector('#article-status');
 try{
  const article=await loadNewsArticle(new URLSearchParams(location.search).get('id'));
  if(!article){status.textContent='Esta notícia não está disponível. Ela pode ter sido retirada do ar.';}
  else{
   document.title=article.title+' — Naka Gaming';
   const canonical=new URL(articleURL(article.id),location.origin).href;document.querySelector('link[rel=canonical]').href=canonical;
   for(const [key,value] of [['og:title',article.title+' — Naka Gaming'],['og:description',article.excerpt||article.title],['og:url',canonical]]) {const meta=document.querySelector('meta[property="'+key+'"]');if(meta)meta.content=value;}
   document.querySelector('#article-cover img').alt=article.title;
   document.querySelector('meta[name=description]').content=article.excerpt||article.title;
   document.querySelector('#article-title').textContent=article.title;document.querySelector('#article-category').textContent=article.category;
   const date=document.querySelector('#article-date');date.textContent=formatNewsDate(article.date);date.dateTime=article.date;
   const excerpt=document.querySelector('#article-excerpt');excerpt.textContent=article.excerpt;excerpt.hidden=!article.excerpt;
   const cover=document.querySelector('#article-cover');cover.hidden=!article.cover;
   if(article.cover)setMedia(cover.querySelector('img'),article.cover,'/assets/images/symbol.webp');
   articleParagraphs(document.querySelector('#article-body'),article.body);status.hidden=true;container.hidden=false;
  }
 }catch{status.textContent='Não foi possível carregar esta notícia. Atualize a página para tentar novamente.';}
}
