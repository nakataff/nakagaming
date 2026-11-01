import {INITIAL_RESULTS} from './competitive-seed.mjs?v=20261101-history';
import {correctLegacyEmulatorHistory} from './competitive-emulator-migration.mjs';
import {HISTORY_DEFAULTS} from './history-defaults.mjs?v=20261101-history';
export const CONTENT_FIELDS = {
  newsTitle: ['Título da seção de notícias', 90], newsIntro: ['Apresentação das notícias', 500],
  supportApproach: ['Como apoiamos os atletas', 1400], prizePolicy: ['Transparência nas premiações', 1400], lineInvitation: ['Convite para lines competitivas', 600],
  homeTitle: ['Título principal', 40], homeSubtitle: ['Segunda linha', 30],
  homeHighlight: ['Palavra em destaque', 30], homeDescription: ['Descrição da home', 400],
  aboutIntro: ['Apresentação da Naka', 600], aboutDescription: ['Identidade da Naka', 1500],
  aboutMission: ['Propósito da Naka', 1500], guildIntro: ['Apresentação da guilda', 800],
  contactIntro: ['Introdução do contato', 400], footerTagline: ['Frase do rodapé', 200],
  guildRecruitment: ['Texto de recrutamento da guilda', 600],
  teamsTitle: ['Título de equipes', 70], teamsIntro: ['Apresentação das equipes', 600],
  leadersTitle: ['Título da liderança', 70], leadersIntro: ['Apresentação da liderança', 600]
};
export const LINK_FIELDS = {
  nakaInstagram: 'Instagram da organização', guildInstagram: 'Instagram da guilda / recrutamento', personalInstagram: 'Instagram do Nakata',
  centralInstagram: 'Instagram da Central', centralSite: 'Site da Central'
};
export const ROLES = ['Jogador', 'Liderança', 'Comissão técnica', 'Criador de conteúdo'];
export const STATUSES = ['Ativo', 'Reserva', 'Saída'];
const LINK_DEFAULTS={guildInstagram:'https://www.instagram.com/nakateamff/'};
const CONTENT_DEFAULTS = {newsTitle:'POR DENTRO DA NAKA.',newsIntro:'Resultados, novidades e os projetos que fazem parte da nossa história.',guildRecruitment:'O recrutamento da guilda é feito pelo Instagram oficial @nakateamff. Entre em contato por lá para saber os critérios e as vagas disponíveis.',teamsTitle:'QUEM CARREGA A BANDEIRA.', teamsIntro:'Nossas equipes. Diferentes trajetórias, o mesmo compromisso com a Naka.', leadersTitle:'QUEM CONSTRÓI COM A GUILDA.', leadersIntro:'Conheça as pessoas que organizam e representam a nossa comunidade.',supportApproach:"A Naka Gaming ainda não conta com investimento de patrocinadores. Nosso papel hoje é dar identidade, espaço e visibilidade às equipes e aos atletas que representam a organização, apoiando sua imagem e a construção de novas oportunidades.",prizePolicy:"Nas premiações coletivas, nossa prática habitual é dividir os valores de forma igualitária entre os participantes do acordo, incluindo a gestão da Naka Gaming. Prêmios individuais, como MVP e reconhecimentos semelhantes, são destinados integralmente ao atleta contemplado. As condições são alinhadas previamente com cada line.",lineInvitation:"Tem uma line competitiva e quer representar a Naka Gaming? Apresente a modalidade, o elenco e seus objetivos pelo Instagram @nakataff."};
const LEGACY_COPY = {
  "homeDescription": "A força de uma organização.\nA união de uma guilda. Esse é o nosso caminho.",
  "aboutIntro": "A Naka Gaming é uma organização de esports e uma guilda de Free Fire.",
  "aboutDescription": "A referência samurai dá forma à nossa identidade visual e aos valores que queremos levar para o jogo: disciplina para evoluir, respeito por quem está ao lado e compromisso com o coletivo.",
  "aboutMission": "Nosso símbolo é o ponto de encontro entre a organização e a comunidade. Mais do que um nome na partida, uma bandeira compartilhada.",
  "guildIntro": "Um espaço para quem compartilha a paixão pelo Free Fire e o orgulho de representar a Naka Gaming.",
  "contactIntro": "Acompanhe a organização e fale com a gente pelo Instagram.",
  "teamsIntro": "Nossas equipes. Diferentes trajetórias, o mesmo compromisso com a Naka.",
  "footerTagline": "O mesmo símbolo.\nO mesmo propósito."
};
const CONTENT_DEFAULTS_MODERN = {
  "homeDescription": "Uma organização independente que valoriza equipes, fortalece a imagem dos atletas e abre caminhos no cenário competitivo.",
  "aboutIntro": "A Naka Gaming é uma organização independente de esports, com foco em representar equipes e dar visibilidade a atletas em desenvolvimento.",
  "aboutDescription": "Com identidade própria e presença no cenário, buscamos fortalecer a imagem das lines que representam a Naka Gaming, valorizando suas trajetórias e conquistas dentro e fora das competições.",
  "aboutMission": "Nosso objetivo é contribuir para que jogadores e equipes ganhem experiência, reconhecimento e oportunidades de evolução, inclusive quando o próximo passo estiver em uma organização com mais estrutura.",
  "guildIntro": "A guilda é uma iniciativa comunitária da Naka Gaming voltada aos jogadores de Free Fire. Ela possui sua própria liderança e funciona de forma independente da gestão competitiva da organização.",
  "contactIntro": "Sua line quer representar a Naka Gaming? Entre em contato diretamente com o Nakata pelo Instagram para apresentar seu elenco e seus objetivos.",
  "teamsIntro": "Nossos elencos representam a Naka Gaming em diferentes modalidades. Competitividade, identidade e valorização de cada atleta.",
  "footerTagline": "Nossa bandeira.\nO talento de cada atleta.",
  "supportApproach": "A Naka Gaming ainda não conta com investimento de patrocinadores. Nosso papel hoje é dar identidade, espaço e visibilidade às equipes e aos atletas que representam a organização, apoiando sua imagem e a construção de novas oportunidades.",
  "prizePolicy": "Nas premiações coletivas, nossa prática habitual é dividir os valores de forma igualitária entre os participantes do acordo, incluindo a gestão da Naka Gaming. Prêmios individuais, como MVP e reconhecimentos semelhantes, são destinados integralmente ao atleta contemplado. As condições são alinhadas previamente com cada line.",
  "lineInvitation": "Tem uma line competitiva e quer representar a Naka Gaming? Apresente a modalidade, o elenco e seus objetivos pelo Instagram @nakataff."
};
const object = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
function text(value, label, limit) {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > limit) {
    throw new Error(`${label}: preencha entre 1 e ${limit} caracteres.`);
  }
  return value.trim();
}
export function validatePublic(input) {
  if (!object(input) || input.schemaVersion !== 1 || !object(input.content) || !object(input.links)) {
    throw new Error('Arquivo incompatível. Use uma configuração exportada pelo painel Naka.');
  }
  const content = {}, links = {};
  for (const [key, [label, limit]] of Object.entries(CONTENT_FIELDS)) {
    const candidate=input.content[key];
    // Textos publicados na identidade anterior são substituídos apenas quando idênticos aos antigos padrões.
    // Alterações personalizadas feitas no painel permanecem intactas.
    const current=Object.hasOwn(LEGACY_COPY,key) && candidate===LEGACY_COPY[key] ? CONTENT_DEFAULTS_MODERN[key] : candidate;
    content[key]=text(current ?? CONTENT_DEFAULTS[key],label,limit);
  }
  for (const [key, label] of Object.entries(LINK_FIELDS)) {
    const raw = text(input.links[key] ?? LINK_DEFAULTS[key], label, 400);
    let url;
    try { url = new URL(raw); } catch { throw new Error(`${label}: informe um endereço HTTPS válido.`); }
    if (url.protocol !== 'https:' || url.username || url.password) throw new Error(`${label}: use um endereço HTTPS sem credenciais.`);
    if (key.endsWith('Instagram') && (!['instagram.com', 'www.instagram.com'].includes(url.hostname) || !url.pathname.split('/').filter(Boolean).length)) {
      throw new Error(`${label}: informe o endereço de um perfil do Instagram.`);
    }
    links[key] = url.href;
  }
  return { schemaVersion: 1, content, links, teams:validateTeams(input.teams ?? []), leaders:validateLeaders(input.leaders ?? []), organizationLeaders:validateLeaders(input.organizationLeaders ?? []), competition:validateCompetition(correctLegacyEmulatorHistory(input.competition ?? {results:INITIAL_RESULTS,titles:[]})),history:validateHistory(input.history) };
}
export function validateBackup(input) {
  const config = validatePublic(input);
  if (!Array.isArray(input.members) || input.members.length > 500) throw new Error('O backup deve conter uma lista de até 500 membros.');
  const ids = new Set(), nicks = new Set();
  const members = input.members.map((m) => {
    if (!object(m)) throw new Error('Membro inválido no backup.');
    const id = text(m.id, 'Identificador do membro', 80), nick = text(m.nick, 'Nick', 40);
    if (ids.has(id) || nicks.has(nick.toLocaleLowerCase('pt-BR'))) throw new Error('Há membros ou nicks duplicados no backup.');
    if (!ROLES.includes(m.role) || !STATUSES.includes(m.status)) throw new Error('Papel ou situação de membro inválido.');
    ids.add(id); nicks.add(nick.toLocaleLowerCase('pt-BR'));
    return {id, nick, role:m.role, status:m.status};
  });
  return {...config, members};
}


export const THEMES = ['samurai', 'samurai-fem'];
function optionalText(value, label, limit) {
  return value === undefined || value === '' ? '' : text(value,label,limit);
}
function identity(value, label) {
  const id = text(value,label,80);
  if (!/^[a-zA-Z0-9_-]+$/.test(id)) throw new Error(label + ': identificador inválido.');
  return id;
}
export function validatePhoto(value = '') {
  if (!value) return '';
  const raw = text(value,'Imagem',700);
  if (/^media:[a-zA-Z0-9_-]{10,80}$/.test(raw)) return raw;
  if (/^\/(assets\/images\/|naka%20gaming\/|naka gaming\/)/.test(raw) && !raw.includes('..') && !/[<>\\]/.test(raw)) return raw.replaceAll(' ','%20');
  let url;
  try { url = new URL(raw); } catch { throw new Error('Imagem: use um arquivo do site ou um endereço HTTPS.'); }
  if (url.protocol !== 'https:' || url.username || url.password) throw new Error('Imagem: use um endereço HTTPS sem credenciais.');
  return url.href;
}
export function validateInstagram(value = '') {
  if (!value) return '';
  let raw = text(value,'Instagram',400);
  if (/^@?[a-zA-Z0-9_.]{1,30}$/.test(raw)) raw='https://www.instagram.com/'+raw.replace(/^@/,'')+'/';
  let url; try {url=new URL(raw);} catch {throw new Error('Informe um perfil válido do Instagram.');}
  if (url.protocol !== 'https:' || url.username || url.password || !['instagram.com','www.instagram.com'].includes(url.hostname) || !/^\/[a-zA-Z0-9_.]{1,30}\/?$/.test(url.pathname)) throw new Error('Informe um perfil válido do Instagram.');
  return 'https://www.instagram.com/'+url.pathname.split('/').filter(Boolean)[0]+'/';
}
function visible(value) {
  if (value === undefined) return true;
  if (typeof value !== 'boolean') throw new Error('Visibilidade inválida.');
  return value;
}
function theme(value='samurai') {
  if (!THEMES.includes(value)) throw new Error('Escolha um tema samurai válido.');
  return value;
}
function person(raw, leader=false) {
  if (!object(raw)) throw new Error('Perfil inválido.');
  const ffId=optionalText(raw.ffId,'ID do Free Fire',16);
  if (ffId && !/^[0-9]{5,16}$/.test(ffId)) throw new Error('ID do Free Fire: use de 5 a 16 números.');
  const photoFit=raw.photoFit ?? (leader ? 'cover' : 'contain');
  if (!['contain','cover'].includes(photoFit)) throw new Error('Enquadramento inválido.');
  const photoPosition=raw.photoPosition ?? 50;
  if (!Number.isFinite(photoPosition) || photoPosition<0 || photoPosition>100) throw new Error('Posição da foto inválida.');
  const photoPositionX=raw.photoPositionX ?? 50,photoZoom=raw.photoZoom ?? 1;
  if (!Number.isFinite(photoPositionX) || photoPositionX<0 || photoPositionX>100) throw new Error('Posição horizontal da foto inválida.');
  if (!Number.isFinite(photoZoom) || photoZoom<1 || photoZoom>3) throw new Error('Zoom da foto: escolha entre 100% e 300%.');
  return {id:identity(raw.id,'Perfil'), nick:text(raw.nick,'Nick',40), name:optionalText(raw.name,'Nome',70), role:optionalText(raw.role,'Função',50) || (leader?'Liderança':'Jogador'), ffId, instagram:validateInstagram(raw.instagram), photo:validatePhoto(raw.photo), theme:(!leader && (raw.theme === undefined || raw.theme === 'inherit')) ? 'inherit' : theme(raw.theme), photoFit, photoPosition, photoPositionX, photoZoom, visible:visible(raw.visible)};
}
function unique(list,label) {
  const ids=new Set();
  for (const item of list) {if (ids.has(item.id)) throw new Error(label+': identificadores duplicados.'); ids.add(item.id);}
  return list;
}
export function validateTeams(input) {
  if (!Array.isArray(input) || input.length>12) throw new Error('Cadastre até 12 equipes.');
  return unique(input.map(raw=>{
    if (!object(raw) || !Array.isArray(raw.players) || raw.players.length>20) throw new Error('Equipe inválida ou com mais de 20 jogadores.');
    return {id:identity(raw.id,'Equipe'), name:text(raw.name,'Nome da equipe',60), category:optionalText(raw.category,'Categoria',60), description:optionalText(raw.description,'Descrição',600), theme:theme(raw.theme), background:validatePhoto(raw.background), game:gameId(raw.game), platform:platformId(raw.platform,gameId(raw.game)), visible:visible(raw.visible), players:unique(raw.players.map(p=>person(p)),'Jogadores')};
  }),'Equipes');
}
export function validateLeaders(input) {
  if (!Array.isArray(input) || input.length>20) throw new Error('Cadastre até 20 líderes.');
  return unique(input.map(p=>person(p,true)),'Líderes');
}
export function publicSnapshot(input) {
  const config=validatePublic(input);
  config.teams=config.teams.filter(t=>t.visible).map(t=>({...t,players:t.players.filter(p=>p.visible)}));
  config.leaders=config.leaders.filter(p=>p.visible);
  config.organizationLeaders=config.organizationLeaders.filter(p=>p.visible);
  config.competition.results=config.competition.results.filter(r=>r.visible);
  config.competition.titles=config.competition.titles.filter(r=>r.visible);
  for(const key of ['timeline','players','titles'])config.history[key]=config.history[key].filter(row=>row.visible);
  return config;
}


export const COMPETITIVE_GAMES = ['free-fire','hok','valorant','cs2'];
export const COMPETITIVE_PLATFORMS = ['emulador','mobile','geral'];
function gameId(value='free-fire') {
  if (!COMPETITIVE_GAMES.includes(value)) throw new Error('Modalidade inválida.');
  return value;
}
function platformId(value,game='free-fire') {
  const platform=value ?? (game==='free-fire'?'emulador':'geral');
  if (game==='free-fire' && platform==='geral') throw new Error('Escolha Emulador ou Mobile para Free Fire.');
  if (game!=='free-fire' && platform!=='geral') throw new Error('A plataforma é exclusiva do Free Fire.');
  if (!COMPETITIVE_PLATFORMS.includes(platform)) throw new Error('Plataforma inválida.');
  return platform;
}
function competitionUrl(value) {
  if (!value) return '';
  let url;
  try { url=new URL(value); } catch { throw new Error('Link da Liquipedia inválido.'); }
  if (url.protocol!=='https:' || !['liquipedia.net','www.liquipedia.net'].includes(url.hostname) || !url.pathname.startsWith('/freefire/') && !url.pathname.startsWith('/honorofkings/') && !url.pathname.startsWith('/valorant/') && !url.pathname.startsWith('/counterstrike/')) throw new Error('Use um link HTTPS da Liquipedia.');
  return url.href;
}
function competitionRow(raw,title=false) {
  if (!object(raw)) throw new Error('Registro competitivo inválido.');
  const game=gameId(raw.game),date=text(raw.date,'Data do torneio',10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date+'T12:00:00Z')) || new Date(date+'T12:00:00Z').toISOString().slice(0,10)!==date) throw new Error('Data do torneio inválida.');
  return {id:identity(raw.id,'Resultado'),game,platform:platformId(raw.platform,game),date,tournament:text(raw.tournament,'Torneio',130),
    tier:optionalText(raw.tier,'Categoria do torneio',30),placement:title?'':optionalText(raw.placement,'Colocação',24),
    link:competitionUrl(raw.link),note:optionalText(raw.note,'Observação',250),visible:visible(raw.visible)};
}
export function validateCompetition(value) {
  if (!object(value) || !Array.isArray(value.results) || !Array.isArray(value.titles) || value.results.length>500 || value.titles.length>100) throw new Error('Histórico competitivo inválido ou acima do limite.');
  const results=unique(value.results.map(r=>competitionRow(r)),'Resultados');
  const titles=unique(value.titles.map(r=>competitionRow(r,true)),'Títulos');
  return {results,titles};
}

function historyInstagram(value='') {
  if(!value)return '';
  let url;try{url=new URL(text(value,'Link do Instagram',700));}catch{throw new Error('Informe um link HTTPS do Instagram para a conquista.');}
  if(url.protocol!=='https:'||url.username||url.password||!['instagram.com','www.instagram.com'].includes(url.hostname)||!url.pathname.split('/').filter(Boolean).length)throw new Error('Informe um link HTTPS do Instagram para a conquista.');
  return url.href;
}
export function validateHistory(value=HISTORY_DEFAULTS) {
  if(!object(value))throw new Error('História inválida.');
  const result={};
  for(const key of ['title','timelineTitle','playersTitle','titlesTitle'])result[key]=text(value[key]??HISTORY_DEFAULTS[key],'Título da história',90);
  result.intro=text(value.intro??HISTORY_DEFAULTS.intro,'Apresentação da história',4000);
  for(const [key,max]of [['timeline',30],['players',40],['titles',60]]){
    const rows=value[key]??HISTORY_DEFAULTS[key];
    if(!Array.isArray(rows)||rows.length>max)throw new Error('História: cadastre até '+max+' registros em '+key+'.');
    result[key]=unique(rows.map(raw=>{
      if(!object(raw))throw new Error('Registro da história inválido.');
      if(key==='timeline')return {id:identity(raw.id,'Marco'),dateLabel:text(raw.dateLabel,'Data ou período',60),label:text(raw.label,'Tipo de marco',60),title:text(raw.title,'Nome do marco',120),description:text(raw.description,'Descrição do marco',800),visible:visible(raw.visible)};
      if(key==='players'){
        const profile=person({...raw,role:raw.role||'Atleta / projeto',photoFit:raw.photoFit??'contain'},false);
        // Só dados públicos desta seção. Não transporta IDs de jogo ou outros cadastros privados.
        const {ffId,...publicProfile}=profile;
        return {...publicProfile,period:optionalText(raw.period,'Período de participação',60),description:text(raw.description,'Descrição da participação',800)};
      }
      const frame=person({...raw,nick:'Conquista',role:'Conquista',instagram:'',photoFit:raw.photoFit??'contain'},false);
      return {id:frame.id,title:text(raw.title,'Nome da conquista',120),dateLabel:optionalText(raw.dateLabel,'Data da conquista',60),description:optionalText(raw.description,'Descrição da conquista',800),photo:frame.photo,theme:frame.theme,photoFit:frame.photoFit,photoPositionX:frame.photoPositionX,photoPosition:frame.photoPosition,photoZoom:frame.photoZoom,instagram:historyInstagram(raw.instagram),visible:frame.visible};
    }),'História / '+key);
  }
  return result;
}
