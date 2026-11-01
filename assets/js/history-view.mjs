import {personCard} from './roster-view.mjs?v=20261101-history';
import {setMedia,themeAssets} from './roster-media.mjs?v=20261101-history';
import {photoLayout,frameStyles} from './photo-frame.mjs?v=20261101-history';
const node=(tag,cls,text)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(text)el.textContent=text;return el;};
export function historyPlayerCard(record){
 const card=personCard(record,{theme:'samurai'});card.classList.add('history-person');
 const info=card.querySelector('.player-info'),meta=info.querySelector('.person-meta');
 if(record.period)info.insertBefore(node('p','history-period',record.period),meta);
 info.insertBefore(node('p','history-card-description',record.description),meta);return card;
}
export function historyTitleCard(record){
 const card=node('article','history-title-card'),portrait=node('div','player-portrait');
 const background=node('img','portrait-background');background.alt='';background.width=640;background.height=800;background.loading='lazy';background.decoding='async';setMedia(background,'',themeAssets(record.theme).background);
 const image=node('img','history-title-image');image.alt=record.title;image.width=480;image.height=600;image.loading='lazy';image.decoding='async';
 image.addEventListener('load',()=>{
  if(image.getAttribute('src')==='/assets/images/symbol.webp'){image.classList.add('is-default');for(const p of ['width','height','left','top'])image.style[p]='';}
  else{image.classList.remove('is-default');Object.assign(image.style,frameStyles(photoLayout(image.naturalWidth,image.naturalHeight,80,100,record)));}
 });
 setMedia(image,record.photo,'/assets/images/symbol.webp');portrait.append(background,image);
 const info=node('div','player-info');if(record.dateLabel)info.append(node('p','history-period',record.dateLabel));info.append(node('h3','person-nick',record.title));
 if(record.description)info.append(node('p','history-card-description',record.description));
 if(record.instagram){const link=node('a','person-instagram','Ver no Instagram ↗');link.href=record.instagram;link.target='_blank';link.rel='noopener noreferrer';link.setAttribute('aria-label',record.title+' no Instagram');info.append(link);}
 card.append(portrait,info);return card;
}
export function historyMilestone(record){
 const item=node('li','history-milestone'),when=node('div','history-when',record.dateLabel),body=node('div','history-event');
 body.append(node('p','eyebrow',record.label),node('h3','',record.title),node('p','history-event-description',record.description));item.append(when,body);return item;
}
export function historyParagraphs(container,text){container.replaceChildren();for(const paragraph of text.split(/\n\s*\n/).filter(p=>p.trim()))container.append(node('p','',paragraph.trim()));}
