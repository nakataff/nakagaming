import {loadSiteConfig} from './site-data.mjs?v=20261101-identity';
import {releaseMedia} from './roster-media.mjs?v=20261101-news';
import {personCard} from './roster-view.mjs?v=20261101-news';
const tabs=document.querySelector('#team-tabs'),panel=document.querySelector('#team-panel'),empty=document.querySelector('#teams-empty');
try {
  const config=await loadSiteConfig(),teams=config.teams.filter(t=>t.visible);
  if (!teams.length) {empty.hidden=false;document.querySelector('#teams-loading').hidden=true;}
  else {
    empty.hidden=true;document.querySelector('#teams-loading').hidden=true;tabs.hidden=false;panel.hidden=false;
    function show(index,focus=false) {
      const team=teams[index];
      [...tabs.children].forEach((button,i)=>{button.setAttribute('aria-selected',String(i===index));button.tabIndex=i===index?0:-1;});
      releaseMedia(panel);panel.replaceChildren();panel.setAttribute('aria-labelledby','team-tab-'+index);
      const heading=document.createElement('div');heading.className='team-panel-heading';
      const title=document.createElement('h2');title.textContent=team.name;
      const count=document.createElement('span');const players=team.players.filter(p=>p.visible);count.textContent=String(players.length).padStart(2,'0')+' / ELENCO';
      heading.append(title,count);panel.append(heading);
      if (team.description) {const description=document.createElement('p');description.className='team-description';description.textContent=team.description;panel.append(description);}
      const grid=document.createElement('div');grid.className='roster-grid';
      for (const player of players) grid.append(personCard(player,team));
      if (!players.length) {const note=document.createElement('p');note.className='roster-empty';note.textContent='O elenco desta equipe será apresentado em breve.';grid.append(note);}
      panel.append(grid);
      history.replaceState(null,'','#'+encodeURIComponent(team.id));
      if(focus)tabs.children[index].focus();
    }
    teams.forEach((team,index)=>{
      const button=document.createElement('button');button.type='button';button.id='team-tab-'+index;button.setAttribute('role','tab');button.setAttribute('aria-controls','team-panel');button.textContent=team.name;
      if(team.category){const category=document.createElement('small');category.textContent=team.category;button.append(category);}
      button.addEventListener('click',()=>show(index));
      button.addEventListener('keydown',event=>{
        let next=index;
        if(event.key==='ArrowRight')next=(index+1)%teams.length;else if(event.key==='ArrowLeft')next=(index-1+teams.length)%teams.length;else if(event.key==='Home')next=0;else if(event.key==='End')next=teams.length-1;else return;
        event.preventDefault();show(next,true);
      });tabs.append(button);
    });
    let selected=teams.findIndex(t=>t.id===decodeURIComponent(location.hash.slice(1)));show(selected<0?0:selected);
  }
} catch {document.querySelector('#teams-loading').hidden=true;empty.hidden=false;}
