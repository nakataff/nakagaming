export const CONTENT_FIELDS = {
  homeTitle: ['Título principal', 40], homeSubtitle: ['Segunda linha', 30],
  homeHighlight: ['Palavra em destaque', 30], homeDescription: ['Descrição da home', 400],
  aboutIntro: ['Apresentação da Naka', 600], aboutDescription: ['Identidade da Naka', 1500],
  aboutMission: ['Propósito da Naka', 1500], guildIntro: ['Apresentação da guilda', 800],
  contactIntro: ['Introdução do contato', 400], footerTagline: ['Frase do rodapé', 200]
};
export const LINK_FIELDS = {
  nakaInstagram: 'Instagram da Naka', personalInstagram: 'Instagram do Nakata',
  centralInstagram: 'Instagram da Central', centralSite: 'Site da Central'
};
export const ROLES = ['Jogador', 'Liderança', 'Comissão técnica', 'Criador de conteúdo'];
export const STATUSES = ['Ativo', 'Reserva', 'Saída'];
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
  for (const [key, [label, limit]] of Object.entries(CONTENT_FIELDS)) content[key] = text(input.content[key], label, limit);
  for (const [key, label] of Object.entries(LINK_FIELDS)) {
    const raw = text(input.links[key], label, 400);
    let url;
    try { url = new URL(raw); } catch { throw new Error(`${label}: informe um endereço HTTPS válido.`); }
    if (url.protocol !== 'https:' || url.username || url.password) throw new Error(`${label}: use um endereço HTTPS sem credenciais.`);
    if (key.endsWith('Instagram') && (!['instagram.com', 'www.instagram.com'].includes(url.hostname) || !url.pathname.split('/').filter(Boolean).length)) {
      throw new Error(`${label}: informe o endereço de um perfil do Instagram.`);
    }
    links[key] = url.href;
  }
  return { schemaVersion: 1, content, links };
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
