import {loadSiteConfig} from './site-data.mjs?v=20261101-news';
import {personCard} from './roster-view.mjs?v=20261101-news';
import {releaseMedia} from './roster-media.mjs?v=20261101-news';

const root=document.querySelector('[data-competition-page]');
const GAME_NAMES={'free-fire':'FREE FIRE',hok:'HONOR OF KINGS',valorant:'VALORANT',cs2:'COUNTER-STRIKE 2'};
const GAME_WIKIS={'free-fire':'freefire',hok:'honorofkings',valorant:'valorant',cs2:'counterstrike'};
const formatDate=value=>new Intl.DateTimeFormat('pt-BR',{timeZone:'UTC',day:'2-digit',month:'2-digit',year:'numeric'}).format(new Date(value+'T12:00:00Z'));
const element=(tag,cls,content)=>{
  const node=document.createElement(tag);
  if(cls)node.className=cls;
  if(content!==undefined)node.textContent=content;
  return node;
};
function competitionLink(record,game) {
  if(record.link)return {url:record.link,label:'Ver torneio ↗',exact:true};
  return {url:'https://liquipedia.net/'+GAME_WIKIS[game]+'/Special:Search?search='+encodeURIComponent(record.tournament),label:'Buscar na Liquipedia ↗',exact:false};
}
function linkNode(record,game) {
  const {url,label,exact}=competitionLink(record,game);
  const link=element('a','comp-source'+(exact?'':' comp-search'),label);
  link.href=url;link.target='_blank';link.rel='noopener noreferrer';
  link.title=exact?'Página do torneio na Liquipedia':'Abrir busca pelo nome do torneio na Liquipedia';
  return link;
}
try {
  if(root) {
    const game=root.dataset.competitionPage,config=await loadSiteConfig(),platformButtons=[...root.querySelectorAll('[data-platform]')];
    let platform=game==='free-fire'&&new URLSearchParams(location.search).get('plataforma')==='mobile'?'mobile':game==='free-fire'?'emulador':'geral';
    const panel=root.querySelector('#competition-content'),resultsArea=root.querySelector('#results-body'),titlesArea=root.querySelector('#titles-list');
    const resultFilters=root.querySelector('#result-filters');
    const years=root.querySelector('#result-year'),tier=root.querySelector('#result-tier'),search=root.querySelector('#result-search');
    const resultsTitle=root.querySelector('#results-count'),titlesCount=root.querySelector('#titles-count');
    const rosterCount=root.querySelector('#roster-count'),rosterArea=root.querySelector('#competition-rosters');
    const emptyResults=root.querySelector('#results-empty'),emptyTitles=root.querySelector('#titles-empty');
    const current=(list)=>list.filter(r=>r.game===game&&r.platform===platform&&r.visible);
    function drawResults() {
      const list=current(config.competition.results).sort((a,b)=>b.date.localeCompare(a.date)||a.tournament.localeCompare(b.tournament));
      const selectedYear=years.value,selectedTier=tier.value,query=search.value.trim().toLocaleLowerCase('pt-BR');
      const filtered=list.filter(r=>(!selectedYear||r.date.startsWith(selectedYear))&&(!selectedTier||r.tier===selectedTier)&&(!query||r.tournament.toLocaleLowerCase('pt-BR').includes(query)));
      resultsArea.replaceChildren();resultsTitle.textContent=list.length+' participações';
      emptyResults.hidden=filtered.length>0;
      root.querySelector('#results-table').hidden=!filtered.length;
      for (const record of filtered) {
        const tr=document.createElement('tr');
        const date=element('td','comp-date',formatDate(record.date));
        const placement=element('td','');
        placement.append(element('span','placement'+(/^1[º°]|^1st$/i.test(record.placement)?' is-first':''),record.placement||'—'));
        const level=element('td','');
        level.append(element('span','comp-tier',record.tier||'—'));
        const tournament=element('td','comp-name');
        tournament.append(element('strong','',record.tournament));
        if(record.note)tournament.append(element('small','',record.note));
        const source=element('td','comp-source-cell');
        source.append(linkNode(record,game));
        tr.append(date,placement,level,tournament,source);resultsArea.append(tr);
      }
    }
    function drawTitles() {
      const list=current(config.competition.titles).sort((a,b)=>b.date.localeCompare(a.date));
      titlesArea.replaceChildren();titlesCount.textContent=list.length+' títulos cadastrados';
      emptyTitles.hidden=list.length>0;
      for(const record of list) {
        const item=element('article','comp-honor');
        const year=element('span','comp-honor-year',record.date.slice(0,4));
        const body=element('div','');
        body.append(element('h3','',record.tournament),element('p','',formatDate(record.date)+(record.tier?' · '+record.tier:'')));
        if(record.note)body.append(element('p','',record.note));
        item.append(year,body,linkNode(record,game));titlesArea.append(item);
      }
    }
    function drawTeams(){
      releaseMedia(rosterArea);rosterArea.replaceChildren();
      const list=current(config.teams);
      const totalPlayers=list.reduce((n,t)=>n+t.players.filter(p=>p.visible).length,0);
      rosterCount.textContent=list.length+' equipe(s) · '+totalPlayers+' integrante(s)';
      if(!list.length){rosterArea.append(element('p','comp-empty','O elenco desta modalidade ainda não foi publicado.'));return;}
      for(const team of list){
        const section=element('section','comp-team');
        const header=element('div','team-panel-heading');
        header.append(element('h3','',team.name),element('span','',team.category||GAME_NAMES[game]));
        section.append(header);
        if(team.description)section.append(element('p','team-description',team.description));
        const grid=element('div','roster-grid'),players=team.players.filter(p=>p.visible);
        if(players.length)for(const player of players)grid.append(personCard(player,team));
        else grid.append(element('p','roster-empty','O elenco desta equipe será anunciado em breve.'));
        section.append(grid);rosterArea.append(section);
      }
    }
    function setFilters(){
      years.replaceChildren(new Option('Todos os anos',''));
      tier.replaceChildren(new Option('Todos os níveis',''));
      const list=current(config.competition.results);
      [...new Set(list.map(r=>r.date.slice(0,4)))].sort().reverse().forEach(y=>years.add(new Option(y,y)));
      [...new Set(list.map(r=>r.tier).filter(Boolean))].sort().forEach(t=>tier.add(new Option(t,t)));
      search.value='';
      root.querySelector('#platform-name').textContent=game==='free-fire'?'FREE FIRE / '+platform.toUpperCase():GAME_NAMES[game];
      platformButtons.forEach(b=>{const selected=b.dataset.platform===platform;b.classList.toggle('active',selected);b.setAttribute('aria-pressed',String(selected));});
      drawTeams();drawResults();drawTitles();
    }
    platformButtons.forEach(b=>b.addEventListener('click',()=>{
      if(platform===b.dataset.platform)return;
      platform=b.dataset.platform;
      const url=new URL(location.href);
      if(platform==='mobile')url.searchParams.set('plataforma','mobile');else url.searchParams.delete('plataforma');
      history.replaceState(null,'',url.pathname+url.search+url.hash);
      setFilters();
    }));
    [years,tier,search].forEach(input=>input.addEventListener(input===search?'input':'change',drawResults));
    setFilters();panel.hidden=false;root.querySelector('#competition-loading').hidden=true;
  }
} catch(error) {
  if(root){root.querySelector('#competition-loading').textContent='Não foi possível carregar os dados. Atualize a página para tentar novamente.';}
  console.warn('Falha ao carregar histórico competitivo',error);
}
