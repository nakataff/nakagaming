"""Atualiza o HTML inicial depois da validação do conteúdo pelo script Node."""
from pathlib import Path
import json, sys, re, html
from urllib.parse import urlsplit
ROOT = Path(__file__).resolve().parents[1]
config = json.load(sys.stdin)
files = ['index.html', 'sobre/index.html', 'guilda/index.html', 'contato/index.html', '404.html']
updates = {}
for name in files:
    path = ROOT / name
    source = path.read_text()
    for key, value in config['content'].items():
        pattern = r'(<(?P<tag>p|span)\b[^>]*data-site-content="' + re.escape(key) + r'"[^>]*>).*?(</(?P=tag)>)'
        source = re.sub(pattern, lambda m: m.group(1) + html.escape(value) + m.group(3), source, flags=re.S)
    for key, url in config['links'].items():
        pattern = r'<a\b(?P<attrs>[^>]*data-site-link="' + re.escape(key) + r'"[^>]*)>(?P<body>.*?)</a>'
        def replace(m):
            attrs = re.sub(r'href="[^"]*"', 'href="' + html.escape(url, quote=True) + '"', m.group('attrs'))
            body = m.group('body')
            if body.lstrip().startswith('@'):
                handle = urlsplit(url).path.strip('/').split('/')[0]
                body = re.sub(r'^\s*@[^<]*', '@' + html.escape(handle), body)
            return '<a' + attrs + '>' + body + '</a>'
        source = re.sub(pattern, replace, source, flags=re.S)
    updates[path] = source
for path, source in updates.items():
    path.write_text(source)
