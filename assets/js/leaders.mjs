import {loadSiteConfig} from './site-data.mjs?v=20261101-history';
import {personCard} from './roster-view.mjs?v=20261101-history';
try {
  const config=await loadSiteConfig(),leaders=config.leaders.filter(p=>p.visible),grid=document.querySelector('#leaders-grid');
  for(const leader of leaders) grid.append(personCard(leader,{},true));
  document.querySelector('#leaders-empty').hidden=leaders.length>0;
} catch { /* Estado inicial preservado. */ }
