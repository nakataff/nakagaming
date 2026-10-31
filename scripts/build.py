"""Cria o diretório público do GitHub Pages, sem dependências externas."""
from pathlib import Path
import shutil

ROOT = Path(__file__).resolve().parents[1]
DESTINATION = ROOT / 'dist'
PAGES = ('index.html', 'sobre/index.html', 'guilda/index.html', 'contato/index.html', '404.html', 'admin/index.html', 'admin/site/index.html', 'admin/guilda/index.html', 'admin/backup/index.html')
ALIASES = ('sobre.html', 'guilda.html', 'contato.html')
PUBLIC_FILES = (*PAGES, *ALIASES, 'CNAME', '.nojekyll', 'robots.txt', 'sitemap.xml')

def build():
    DESTINATION.mkdir(exist_ok=True)
    for child in DESTINATION.iterdir():
        if child.is_dir():
            shutil.rmtree(child)
        else:
            child.unlink()
    for name in PUBLIC_FILES:
        target = DESTINATION / name
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(ROOT / name, target)
    shutil.copytree(ROOT / 'assets', DESTINATION / 'assets')
    print(f'Site pronto em {DESTINATION}')

if __name__ == '__main__':
    build()
