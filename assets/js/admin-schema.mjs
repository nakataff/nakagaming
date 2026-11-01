export const CONTENT_FIELDS = {
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
const CONTENT_DEFAULTS = {guildRecruitment:'O recrutamento da guilda é feito pelo Instagram oficial @nakateamff. Entre em contato por lá para saber os critérios e as vagas disponíveis.',teamsTitle:'QUEM CARREGA A BANDEIRA.', teamsIntro:'Nossas equipes. Diferentes trajetórias, o mesmo compromisso com a Naka.', leadersTitle:'QUEM CONSTRÓI COM A GUILDA.', leadersIntro:'Conheça as pessoas que organizam e representam a nossa comunidade.'};
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
  for (const [key, [label, limit]] of Object.entries(CONTENT_FIELDS)) content[key] = text(input.content[key] ?? CONTENT_DEFAULTS[key], label, limit);
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
  return { schemaVersion: 1, content, links, teams:validateTeams(input.teams ?? []), leaders:validateLeaders(input.leaders ?? []) };
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
    return {id:identity(raw.id,'Equipe'), name:text(raw.name,'Nome da equipe',60), category:optionalText(raw.category,'Categoria',60), description:optionalText(raw.description,'Descrição',600), theme:theme(raw.theme), background:validatePhoto(raw.background), visible:visible(raw.visible), players:unique(raw.players.map(p=>person(p)),'Jogadores')};
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
  return config;
}
