"""Verifica páginas, referências locais, âncoras e metadados antes da publicação."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote
import re

ROOT = Path(__file__).resolve().parents[1]
PAGES = ('index.html', 'sobre.html', 'guilda.html', 'contato.html', '404.html')

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

pages = {name: Page((ROOT / name).read_text()) for name in PAGES}
for name, page in pages.items():
    assert sum(tag == 'h1' for tag, _ in page.tags) == 1, f'{name}: precisa de um h1'
    assert any(tag == 'html' and a.get('lang') == 'pt-BR' for tag, a in page.tags)
    assert any(tag == 'meta' and a.get('name') == 'description' for tag, a in page.tags)
    assert any(tag == 'meta' and a.get('name') == 'viewport' for tag, a in page.tags)
    for ref in page.refs:
        parsed = urlsplit(ref)
        if parsed.scheme or parsed.netloc: continue
        target = unquote(parsed.path).lstrip('/') or ('index.html' if parsed.path else name)
        assert (ROOT / target).is_file(), f'{name}: arquivo ausente: {ref}'
        if parsed.fragment and target in pages:
            assert parsed.fragment in pages[target].ids, f'{name}: âncora ausente: {ref}'
css = ROOT / 'assets/css/styles.css'
for ref in re.findall(r'url\([\'\"]?(.*?)[\'\"]?\)', css.read_text()):
    assert (css.parent / ref).is_file(), f'CSS: recurso ausente: {ref}'
assert (ROOT / 'CNAME').read_text().strip() == 'nakagaming.com.br'
print(f'OK: {len(pages)} páginas, imagens, fontes, links, âncoras e metadados')
