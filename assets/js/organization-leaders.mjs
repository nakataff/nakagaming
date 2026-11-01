import {loadSiteConfig} from './site-data.mjs?v=20261101-history';
import {personCard} from './roster-view.mjs?v=20261101-history';
try {
  const config=await loadSiteConfig();
  const grid=document.querySelector('#organization-leaders-grid'),empty=document.querySelector('#organization-leaders-empty');
  if(grid&&empty){
    const leaders=(config.organizationLeaders||[]).filter(p=>p.visible);
    for(const leader of leaders)grid.append(personCard(leader,{},true));
    empty.hidden=leaders.length>0;
  }
} catch(error) {
  console.warn('Não foi possível carregar a direção da organização:',error.message);
}
