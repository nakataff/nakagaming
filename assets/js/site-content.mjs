import {loadSiteConfig} from './site-data.mjs?v=20261101-crop';
// O HTML continua completo quando a configuração remota está indisponível.
try {
  const config=await loadSiteConfig();
  for (const element of document.querySelectorAll('[data-site-content]')) {
    const value=config.content[element.dataset.siteContent];
    if (typeof value==='string') element.textContent=value;
  }
  for (const element of document.querySelectorAll('[data-site-link]')) {
    const href=config.links[element.dataset.siteLink]; if (!href) continue;
    element.href=href;
    if (element.firstChild?.nodeType===Node.TEXT_NODE && element.firstChild.textContent.trim().startsWith('@')) element.firstChild.textContent='@'+new URL(href).pathname.split('/').filter(Boolean)[0];
  }
} catch (error) {console.warn('Conteúdo original mantido:',error.message);}
