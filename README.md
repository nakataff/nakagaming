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

HTML por página, CSS e JavaScript compartilhados. Não é necessário instalar pacotes ou compilar para publicar a partir da raiz. Fontes e imagens são locais. As páginas públicas não dependem de CDNs; o painel administrativo carrega o SDK oficial do Firebase.

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

Login e perfis de membros são etapas futuras. O painel em `/admin/` já usa a conta administrativa da Central Free Fire e salva rascunhos privados no Firebase. A separação por página e por recursos permite evoluir a plataforma sem misturar o portal institucional com o painel. Leia [Arquitetura e próximos passos](docs/ARQUITETURA.md).

A marca e suas imagens pertencem à Naka Gaming. A licença das fontes está em `assets/fonts/LICENSE.txt`.


## Painel administrativo com a conta da Central

Acesse `/admin/`. Sem sessão, o painel abre `/admin/login/`. Use a mesma conta administrativa e a mesma senha cadastrada no Firebase Authentication da Central Free Fire. A aplicação não armazena a senha em arquivos, URLs ou backups. O SDK mantém apenas a sessão na aba/navegador até sair ou encerrar a sessão do navegador.

As telas são separadas em `/admin/site/`, `/admin/guilda/` e `/admin/backup/`, com CSS e módulos JavaScript próprios.

### Dados privados e publicação

O mesmo projeto Firebase é usado para autenticação, mas os rascunhos da Naka ficam exclusivamente em `nakaGamingAdmin/state`, separados dos conteúdos da Central. As regras no servidor permitem leitura e escrita somente para `admin@centralfreefire.com.br`. O painel só mostra os dados depois de uma leitura autorizada no servidor. O noindex e o bloqueio visual não são controles de segurança do banco.

Os rascunhos são sincronizados na conta, com revisão transacional para evitar sobrescrever alterações feitas em outra sessão. Salvar no painel ainda não publica no portal. Para publicar, exporte a configuração e aplique-a ao repositório:

```sh
node scripts/apply-content.mjs /caminho/naka-site.json
python3 scripts/check.py
node --test tests/admin.test.mjs
```

O script valida os dados, atualiza `assets/data/site.json` e os textos/links de fallback nos HTMLs. Envie o commit para publicar. Backups completos incluem a lista de membros e devem ser guardados separadamente; o aplicador rejeita esses backups para não expor a lista no portal público.

O botão de sair encerra a sessão da Naka. Para quem usou a versão local anterior, a página de backups oferece recuperação manual do rascunho daquele navegador, com validação e confirmação; a cópia original é preservada. Dados locais nunca são enviados automaticamente.

### Configuração do Firebase

A configuração pública está em `assets/js/firebase-config.mjs`, usando o projeto `central-free-fire`. A regra isolada está documentada em `firebase/naka-admin.rules.json` e foi incorporada ao `database.rules.json` do repositório `nakataff/ffwsbr`, cujo workflow publica as regras do projeto. Não substitua as regras completas pelo fragmento da Naka.

Se o Firebase retornar `auth/unauthorized-domain`, adicione `nakagaming.com.br` em Authentication → Settings → Authorized domains no projeto correto. Verifique também eventuais restrições de referer da API key, se forem usadas. Não coloque uma service account no frontend.
