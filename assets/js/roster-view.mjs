import {themeAssets,setMedia} from './roster-media.mjs?v=20261101-news';
import {photoLayout,frameStyles} from './photo-frame.mjs?v=20261101-news';
const node=(tag,cls,text)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(text)el.textContent=text;return el;};
export function personCard(person,team={},leader=false) {
  const article=node('article',leader?'leader-card':'player-card');
  const media=node('div',leader?'leader-portrait':'player-portrait');
  const assets=themeAssets(person.theme==='inherit'?team.theme:(person.theme || team.theme));
  const background=node('img','portrait-background');background.alt='';background.width=640;background.height=800;background.loading='lazy';background.decoding='async';
  setMedia(background,team.background,assets.background);
  const photo=node('img','portrait-person'+(!person.photo?' is-placeholder':''));photo.alt=person.nick;photo.width=480;photo.height=600;photo.loading='lazy';photo.decoding='async';
  photo.style.objectFit=person.photo?person.photoFit:'contain';photo.style.objectPosition=(person.photoPositionX??50)+'% '+person.photoPosition+'%';
  photo.addEventListener('load',()=>{
    const fallback=photo.getAttribute('src')===assets.placeholder;
    photo.classList.toggle('is-placeholder',fallback);photo.classList.toggle('has-crop',!fallback);
    if(fallback){for(const prop of ['width','height','left','top'])photo.style[prop]='';photo.style.objectFit='contain';}
    else Object.assign(photo.style,frameStyles(photoLayout(photo.naturalWidth,photo.naturalHeight,leader?100:80,100,person)),{objectFit:'fill'});
  });
  setMedia(photo,person.photo,assets.placeholder);
  media.append(background,photo);
  const info=node('div',leader?'leader-info':'player-info');
  info.append(node('p','person-role',person.role),node('h3','person-nick',person.nick));
  if (person.name) info.append(node('p','person-name',person.name));
  const meta=node('div','person-meta');
  if (person.ffId) meta.append(node('span','person-id','ID '+person.ffId));
  if (person.instagram) {const link=node('a','person-instagram','Instagram ↗');link.href=person.instagram;link.target='_blank';link.rel='noopener noreferrer';link.setAttribute('aria-label','Instagram de '+person.nick);meta.append(link);}
  info.append(meta);article.append(media,info);return article;
}
