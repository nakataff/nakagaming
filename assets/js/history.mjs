import {loadSiteConfig} from './site-data.mjs?v=20261101-history';
import {historyPlayerCard,historyTitleCard,historyMilestone,historyParagraphs} from './history-view.mjs?v=20261101-history';
try{
 const {history}=await loadSiteConfig();
 for(const element of document.querySelectorAll('[data-history-text]'))element.textContent=history[element.dataset.historyText];
 historyParagraphs(document.querySelector('#history-intro'),history.intro);
 const visible=key=>history[key].filter(row=>row.visible);
 const timeline=document.querySelector('#history-timeline');timeline.replaceChildren(...visible('timeline').map(historyMilestone));document.querySelector('#history-timeline-empty').hidden=!!timeline.children.length;
 for(const [key,render]of [['players',historyPlayerCard],['titles',historyTitleCard]]){
  const list=document.querySelector('#history-'+key);list.replaceChildren(...visible(key).map(render));document.querySelector('#history-'+key+'-empty').hidden=!!list.children.length;
 }
}catch(error){console.warn('História original mantida:',error.message);}
