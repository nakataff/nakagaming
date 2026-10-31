# Naka Gaming

Portal institucional da Naka Gaming, organização de esports e guilda de Free Fire.

**Domínio:** https://nakagaming.com.br

**Hospedagem:** GitHub Pages, branch `main`, pasta `/ (root)`

## Páginas

| Endereço público | Arquivo | Conteúdo |
| --- | --- | --- |
| `/` | `index.html` | Início e apresentação da marca |
| `/sobre/` | `sobre/index.html` | Organização, identidade e princípios |
| `/guilda/` | `guilda/index.html` | Comunidade e perguntas frequentes |
| `/contato/` | `contato/index.html` | Instagrams e site da Central Free Fire |
| Página não encontrada | `404.html` | Endereços inexistentes |

As páginas continuam separadas em HTML. O servidor abre o `index.html` de cada pasta sem mostrar o nome do arquivo na URL. Ao abrir `/sobre`, o GitHub Pages pode completar o endereço para `/sobre/`. Os antigos `sobre.html`, `guilda.html` e `contato.html` redirecionam para as novas rotas; visitas explícitas a `index.html` também são normalizadas pelo script compartilhado, preservando parâmetros e âncoras.

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
node --test tests/admin.test.mjs
python3 scripts/build.py
```

O último comando gera `dist/`, ignorado pelo Git. Ele é opcional e serve para empacotar somente os arquivos públicos. O GitHub Pages atual publica diretamente os arquivos da raiz.

## Publicar

O Pages já estava ativo antes da primeira implementação. Novos commits em `main` acionam a publicação automática do GitHub. O workflow `Verificar site` também valida HTML, referências e sintaxe JavaScript; ele não altera a configuração de hospedagem. Na publicação por branch, esse workflow é uma verificação adicional e não bloqueia o build nativo do Pages.

O domínio está declarado em `CNAME`. O DNS deve apontar para o GitHub Pages; o HTTPS é configurado nas opções do Pages. Consulte [Publicação e DNS](docs/PUBLICACAO.md).

## Editar conteúdo

Edite cada arquivo HTML diretamente. As páginas compartilham a mesma folha de estilos e o mesmo script; cabeçalho e rodapé estão presentes em cada HTML para que a navegação funcione mesmo sem JavaScript. Ao mudar o menu, atualize os cinco HTMLs e execute as verificações.

Não foram inventados integrantes, resultados, patrocinadores ou redes sociais. Os canais informados pelo responsável estão na página de contato e no rodapé de todas as páginas: @nakagamingx, @nakataff, @centralfreefire_ e centralfreefire.com.br. As perguntas da guilda indicam informações ainda não publicadas.

## Próximas etapas

Login e perfis ainda não foram implementados. O painel inicial disponível em `/admin/` funciona como editor local com exportação. A separação por página e por recursos permite adicioná-los sem misturar o portal institucional com a plataforma. Leia [Arquitetura e próximos passos](docs/ARQUITETURA.md).

A marca e suas imagens pertencem à Naka Gaming. A licença das fontes está em `assets/fonts/LICENSE.txt`.


## Painel administrativo inicial

Acesse `/admin/`. As telas são separadas em `/admin/site/`, `/admin/guilda/` e `/admin/backup/`, com CSS e módulos JavaScript próprios.

Esta etapa é um editor local, sem autenticação ou sincronização. Textos, links e nicks são rascunhos no armazenamento do navegador. A área é pública, embora excluída do sitemap e marcada como noindex; não cadastre informações privadas. Nenhum botão concede privilégios ou altera o site remoto.

O conteúdo público fica em `assets/data/site.json`. As páginas carregam esse arquivo, mantendo o HTML completo como fallback. Para aplicar uma configuração exportada pelo painel:

```sh
node scripts/apply-content.mjs /caminho/naka-site.json
python3 scripts/check.py
node --test tests/admin.test.mjs
```

O script valida os dados, atualiza o arquivo público e os textos/links de fallback nos HTMLs. Envie o commit para publicar. Backups completos incluem o rascunho de membros e devem ser guardados separadamente; o aplicador rejeita esses backups para não colocá-los no portal público.

O painel permite importar backups com validação e confirmação, exportar configurações públicas, adicionar/editar/remover membros com desfazer, buscar e filtrar a lista. Conflitos entre abas e falhas no armazenamento são sinalizados. Login, autorização no backend e publicação direta continuam como próxima etapa.
