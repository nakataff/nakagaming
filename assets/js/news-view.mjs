import {setMedia} from './roster-media.mjs?v=20261101-news';
import {formatNewsDate,articleURL} from './news-schema.mjs?v=20261101-news';
const make=(tag,cls,text)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(text)el.textContent=text;return el;};
export function newsCard(article){
 const card=make('article','news-card'),link=make('a','news-card-link');link.href=articleURL(article.id);
 const visual=make('div','news-card-visual'),image=make('img','news-cover');image.alt=article.title;image.width=1280;image.height=800;image.loading='lazy';image.decoding='async';
 image.addEventListener('load',()=>visual.classList.toggle('is-default',image.getAttribute('src')==='/assets/images/symbol.webp'));
 setMedia(image,article.cover,'/assets/images/symbol.webp');visual.append(image);
 const info=make('div','news-card-info'),meta=make('div','news-meta'),date=make('time','',formatNewsDate(article.date));date.dateTime=article.date;
 meta.append(make('span','news-category',article.category),date);
 const title=make('h3','',article.title);info.append(meta,title);if(article.excerpt)info.append(make('p','news-excerpt',article.excerpt));info.append(make('span','news-read','Ler notícia ↗'));
 link.append(visual,info);card.append(link);return card;
}
export function articleParagraphs(container,text){container.replaceChildren();for(const part of text.split(/\n\s*\n/).filter(p=>p.trim()))container.append(make('p','',part.trim()));}
export function newsTextItem(article){
 const item=make('li'),link=make('a','news-recent-link');link.href=articleURL(article.id);
 const meta=make('div','news-meta'),date=make('time','',formatNewsDate(article.date));date.dateTime=article.date;
 meta.append(make('span','news-category',article.category),date);
 link.append(meta,make('h4','',article.title));item.append(link);return item;
}
