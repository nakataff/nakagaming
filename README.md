# Naka Gaming

Portal institucional da Naka Gaming, organização de esports e guilda de Free Fire.

**Domínio:** https://nakagaming.com.br

**Hospedagem:** GitHub Pages, branch `main`, pasta `/ (root)`

## Páginas

| Arquivo | Conteúdo |
| --- | --- |
| `index.html` | Início e apresentação da marca |
| `sobre.html` | Organização, identidade e princípios |
| `guilda.html` | Comunidade e perguntas frequentes |
| `contato.html` | Espaço para os futuros canais oficiais |
| `404.html` | Página de endereço não encontrado |

HTML por página, CSS e JavaScript compartilhados. Não é necessário instalar pacotes ou compilar para publicar a partir da raiz. Fontes e imagens são locais; não há dependência de CDNs, rastreadores ou serviços externos no carregamento das páginas.

## Organização

- `assets/css/styles.css`: identidade visual, componentes e responsividade
- `assets/js/main.js`: menu móvel acessível e ano do rodapé
- `assets/images/`: logos otimizadas e imagem de compartilhamento
- `assets/fonts/`: fontes locais e licença da família Nimbus
- `naka gaming/`: logos originais preservadas
- `docs/`: publicação e evolução da plataforma
- `scripts/`: verificações e montagem de um pacote público opcional

## Executar localmente

Na pasta do projeto:

```sh
python3 -m http.server 8080
```

Abra http://localhost:8080. Para verificar antes de enviar:

```sh
python3 scripts/check.py
node --check assets/js/main.js
python3 scripts/build.py
```

O último comando gera `dist/`, ignorado pelo Git. Ele é opcional e serve para empacotar somente os arquivos públicos. O GitHub Pages atual publica diretamente os arquivos da raiz.

## Publicar

O Pages já estava ativo antes da primeira implementação. Novos commits em `main` acionam a publicação automática do GitHub. O workflow `Verificar site` também valida HTML, referências e sintaxe JavaScript; ele não altera a configuração de hospedagem. Na publicação por branch, esse workflow é uma verificação adicional e não bloqueia o build nativo do Pages.

O domínio está declarado em `CNAME`. A resolução externa depende da conclusão da transição de DNS e da configuração no Registro.br. Consulte [Publicação e DNS](docs/PUBLICACAO.md).

## Editar conteúdo

Edite cada arquivo HTML diretamente. As páginas compartilham a mesma folha de estilos e o mesmo script; cabeçalho e rodapé estão presentes em cada HTML para que a navegação funcione mesmo sem JavaScript. Ao mudar o menu, atualize os cinco HTMLs e execute as verificações.

Não foram inventados integrantes, resultados, patrocinadores ou redes sociais. A página de contato e as perguntas da guilda indicam as informações ainda não publicadas. Atualize esses trechos quando os dados oficiais estiverem definidos.

## Próximas etapas

Login, perfis e painel administrativo não foram implementados nesta etapa. A separação por página e por recursos permite adicioná-los sem misturar o portal institucional com a plataforma. Leia [Arquitetura e próximos passos](docs/ARQUITETURA.md).

A marca e suas imagens pertencem à Naka Gaming. A licença das fontes está em `assets/fonts/LICENSE.txt`.
