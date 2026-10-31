import {validatePublic} from './admin-schema.mjs';
// O HTML continua disponível como fallback se o arquivo de conteúdo não carregar.
try {
  const response = await fetch('/assets/data/site.json');
  if (!response.ok) throw new Error('Conteúdo indisponível');
  const config = validatePublic(await response.json());
  for (const element of document.querySelectorAll('[data-site-content]')) {
    const value = config.content[element.dataset.siteContent];
    if (typeof value === 'string') element.textContent = value;
  }
  for (const element of document.querySelectorAll('[data-site-link]')) {
    const href = config.links[element.dataset.siteLink];
    if (!href) continue;
    element.href = href;
    if (element.firstChild?.nodeType === Node.TEXT_NODE && element.firstChild.textContent.trim().startsWith('@')) {
      element.firstChild.textContent = '@' + new URL(href).pathname.split('/').filter(Boolean)[0];
    }
  }
} catch (error) {
  console.warn('Conteúdo original mantido:', error.message);
}
