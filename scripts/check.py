"""Valida as rotas públicas, atalhos antigos, recursos e links do portal."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, urljoin, unquote
import re
import json
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
ROUTES = {'/': 'index.html', '/sobre/': 'sobre/index.html', '/guilda/': 'guilda/index.html', '/contato/': 'contato/index.html', '/404.html': '404.html'}
ALIASES = {'sobre.html': '/sobre/', 'guilda.html': '/guilda/', 'contato.html': '/contato/'}
SOCIALS = set(json.loads((ROOT / 'assets/data/site.json').read_text())['links'].values())
BASE = 'https://nakagaming.com.br'

class Page(HTMLParser):
    def __init__(self, source):
        super().__init__()
        self.ids, self.refs, self.tags = set(), [], []
        self.feed(source)
    def handle_starttag(self, tag, attributes):
        attrs = dict(attributes)
        self.tags.append((tag, attrs))
        if 'id' in attrs:
            assert attrs['id'] not in self.ids, f'ID duplicado: {attrs["id"]}'
            self.ids.add(attrs['id'])
        for key in ('href', 'src'):
            if key in attrs: self.refs.append(attrs[key])
        if tag == 'img': assert 'alt' in attrs, 'Imagem sem texto alternativo'

pages = {route: Page((ROOT / name).read_text()) for route, name in ROUTES.items()}
for route, page in pages.items():
    assert sum(tag == 'h1' for tag, _ in page.tags) == 1, f'{route}: precisa de um h1'
    for key in ('description', 'viewport'):
        assert any(t == 'meta' and a.get('name') == key for t, a in page.tags)
    assert any(t == 'html' and a.get('lang') == 'pt-BR' for t, a in page.tags)
    assert any(t == 'link' and a.get('rel') == 'canonical' and a.get('href') == BASE + route for t, a in page.tags)
    assert SOCIALS.issubset(page.refs), f'{route}: falta canal no rodapé'
    for ref in page.refs:
        parsed = urlsplit(urljoin(BASE + route, ref))
        if parsed.netloc != 'nakagaming.com.br': continue
        path = unquote(parsed.path)
        assert path in ROUTES or not path.endswith('.html'), f'{route}: link antigo: {ref}'
        target = ROOT / path.lstrip('/')
        if target.is_dir(): target /= 'index.html'
        assert target.is_file(), f'{route}: arquivo ausente: {ref}'
        if parsed.fragment and path in pages:
            assert parsed.fragment in pages[path].ids, f'{route}: âncora ausente: {ref}'
for old, target in ALIASES.items():
    page = Page((ROOT / old).read_text())
    assert target in page.refs, f'{old}: falta link alternativo'
    assert any(t == 'meta' and a.get('http-equiv') == 'refresh' and a.get('content') == '0; url=' + target for t, a in page.tags)
    assert any(t == 'link' and a.get('rel') == 'canonical' and a.get('href') == BASE + target for t, a in page.tags)
css = ROOT / 'assets/css/styles.css'
for ref in re.findall(r'url\([\'\"]?(.*?)[\'\"]?\)', css.read_text()):
    assert (css.parent / ref).is_file(), f'CSS: recurso ausente: {ref}'
ADMIN_ROUTES = {'/admin/': 'admin/index.html', '/admin/site/': 'admin/site/index.html', '/admin/guilda/': 'admin/guilda/index.html', '/admin/backup/': 'admin/backup/index.html', '/admin/login/': 'admin/login/index.html'}
for route, name in ADMIN_ROUTES.items():
    page = Page((ROOT / name).read_text())
    assert sum(t == 'h1' for t, a in page.tags) == 1
    assert any(t == 'meta' and a.get('name') == 'robots' and 'noindex' in a.get('content', '') for t, a in page.tags)
    for ref in page.refs:
        parsed = urlsplit(urljoin(BASE + route, ref))
        if parsed.netloc != 'nakagaming.com.br': continue
        target = ROOT / unquote(parsed.path).lstrip('/')
        if target.is_dir(): target /= 'index.html'
        assert target.is_file(), f'{route}: recurso ausente: {ref}'
        if parsed.fragment and parsed.path == route: assert parsed.fragment in page.ids
assert 'Disallow: /admin/' in (ROOT / 'robots.txt').read_text()
assert (ROOT / 'CNAME').read_text().strip() == 'nakagaming.com.br'
ns = {'s': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
assert {e.text for e in ET.parse(ROOT / 'sitemap.xml').findall('s:url/s:loc', ns)} == {BASE + route for route in ROUTES if route != '/404.html'}
print(f'OK: {len(pages)} páginas, {len(ALIASES)} redirecionamentos, rotas, canais, imagens, fontes e sitemap')
