"""Cria o diretório público do GitHub Pages, sem dependências externas."""
from pathlib import Path
import shutil

ROOT = Path(__file__).resolve().parents[1]
DESTINATION = ROOT / 'dist'
PAGES = ('index.html', 'sobre.html', 'guilda.html', 'contato.html', '404.html')
PUBLIC_FILES = (*PAGES, 'CNAME', '.nojekyll', 'robots.txt', 'sitemap.xml')

def build():
    DESTINATION.mkdir(exist_ok=True)
    # Remove somente arquivos de uma compilação anterior, neste diretório fixo.
    for child in DESTINATION.iterdir():
        if child.is_dir():
            shutil.rmtree(child)
        else:
            child.unlink()
    for name in PUBLIC_FILES:
        shutil.copy2(ROOT / name, DESTINATION / name)
    shutil.copytree(ROOT / 'assets', DESTINATION / 'assets')
    print(f'Site pronto em {DESTINATION}')

if __name__ == '__main__':
    build()
