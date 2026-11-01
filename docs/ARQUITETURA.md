# Arquitetura e evolução

## Etapa atual: portal institucional

HTML estático separado por página; uma folha de estilos e um script compartilhados. O portal funciona com navegação nativa e não usa framework nem banco de dados. Um módulo carrega os textos e canais de um JSON público; o HTML original permanece completo como fallback.

A identidade visual está centralizada nas variáveis de `assets/css/styles.css`: cores, fontes, superfícies e bordas. Os componentes de botão, navegação, rodapé, cabeçalhos e seções podem ser reaproveitados nas próximas páginas.

## Próximas etapas possíveis

A ordem abaixo é uma proposta técnica, não uma lista de recursos já disponíveis:

1. **Conteúdo oficial:** canais de contato, recrutamento, história, elenco e resultados, com dados confirmados.
2. **Autenticação administrativa:** implementada com a conta existente da Central; futuros membros devem ter identidade e permissões próprias.
3. **Perfis:** páginas próprias, por exemplo `/perfil/`, com módulo de dados separado do código de navegação.
4. **Membros:** área própria, por exemplo `/membros/`, para funcionalidades da guilda.
5. **Administração:** login e rascunhos privados disponíveis; a publicação direta de textos, equipes e líderes já está disponível.

## Limites do GitHub Pages

GitHub Pages entrega arquivos estáticos. Login, gravação de perfis e administração exigem um serviço externo de autenticação e dados ou um backend hospedado em outra plataforma. O domínio e as páginas institucionais podem continuar no Pages durante essa evolução.

Não implemente autenticação somente com JavaScript, um campo no localStorage ou uma senha dentro do repositório. A visibilidade de uma página administrativa não substitui a autorização no servidor. Perfis públicos devem separar campos visíveis dos dados privados da conta; privilégios de administrador devem ser controlados no backend.

## Separação quando a plataforma começar

Autenticação e dados administrativos usam módulos específicos em `assets/js/`, com Firebase como provedor. Scripts específicos de cada página devem importar esses serviços; `main.js` continua responsável pela experiência comum do portal. Novas funcionalidades de membros devem manter essa separação.

Mantenha credenciais privadas no backend, regras de acesso por usuário e por função, e ambientes separados de teste e produção. Os parâmetros públicos exigidos pelo provedor escolhido não devem ser confundidos com chaves administrativas.


## Administração autenticada

`/admin/` exige a conta administrativa existente no Firebase Authentication da Central Free Fire. `/admin/login/` usa email/senha com o email administrativo fixo. A senha só é enviada pelo SDK ao serviço de autenticação. Não há cadastro, alteração de senha nem cópia de credenciais entre repositórios.

A sessão é gerenciada pelo SDK com persistência de sessão, não por flags de localStorage. Todas as páginas administrativas aguardam a autenticação e uma leitura autorizada de `nakaGamingAdmin/state` antes de mostrar dados. Ao sair, a sessão é encerrada e os dados da interface são removidos.

O HTML e o JavaScript continuam estáticos e públicos no GitHub Pages. O controle efetivo de dados está nas regras do Realtime Database: apenas a conta administrativa pode ler/escrever no caminho da Naka. Nenhuma configuração ou dado privado da Central é consultado pelas telas da Naka.

`admin-store.mjs` implementa validação e controle de revisão com transporte injetável. `admin-cloud.mjs` faz leituras pontuais e transações no Firebase, sem listener contínuo do banco. `admin-auth.mjs` gerencia a sessão. `admin-auth-policy.mjs` contém as rotas permitidas e a identidade administrativa, sem segredos.

A lista privada da guilda e os rascunhos não são públicos. Equipes e lideranças marcadas para exibição são publicadas explicitamente pelo administrador. O conteúdo publicado fica em `nakaGamingPublic/site`, lido por REST com cache de sessão de 2 minutos e fallback em `assets/data/site.json`. O fluxo de exportação e aplicação por commit permanece como cópia estática opcional. A regra isolada da Naka foi mesclada ao arquivo de regras existente do projeto Central, sem alterar os caminhos anteriores.

Backups da versão antiga podem ser recuperados manualmente após o login. A importação exige validação e confirmação; não há migração automática de dados locais para a conta.


## Elencos e publicação

`admin-schema.mjs` valida equipes e perfis e migra configurações antigas com listas vazias e títulos padrão. `publicSnapshot()` remove membros privados, equipes ocultas, jogadores ocultos e líderes ocultos. `admin-publish.mjs` envia somente essa representação, vinculada à revisão salva do rascunho; a regra do servidor compara a revisão com `nakaGamingAdmin/state/revision`.

`admin-rosters.mjs` compartilha os controles de perfil entre equipes e líderes. `roster-view.mjs` monta os cards por DOM seguro, sem interpolar HTML vindo dos cadastros. `teams.mjs` mantém apenas a aba ativa no DOM e oferece navegação de teclado. `roster-media.mjs` busca as imagens quando próximas da tela, reutiliza respostas por identificador e restaura a silhueta em caso de falha.

`image-compress.mjs` reduz imagens no navegador, sem remover transparência. `admin-media.mjs` grava WebP em registros individuais de até 110.000 caracteres base64. Os arquivos são públicos por identificador, sem leitura pública da lista inteira; a conta administrativa só cria registros novos. Dados de imagem não acompanham as leituras de conteúdo. Essa abordagem usa o Realtime Database já disponível, sem credenciais adicionais de armazenamento; as imagens têm teto de 75 KB antes da codificação. Uma galeria maior deverá migrar o transporte para armazenamento de objetos, preservando as referências dos perfis.

Os backups guardam as referências dos uploads, não o binário. Uploads substituídos são preservados; uma coleta futura precisa considerar todos os rascunhos e publicações antes de excluir arquivos. Não há exclusão automática de mídia em uso.


## Enquadramento de fotos

`photo-frame.mjs` compartilha a geometria do recorte entre `admin-photo-crop.mjs` e `roster-view.mjs`. Posição X/Y (0–100) e zoom (1–3) geram proporções relativas, mantendo o mesmo recorte no editor e em retratos de outros tamanhos. Perfis anteriores mantêm a posição vertical existente, X central e zoom 1. `photoPositionX` e `photoZoom` são opcionais na entrada e recebem valores padrão na validação. Silhuetas continuam usando seu enquadramento original. O ajuste não altera o arquivo nem faz novo upload.


## Notícias independentes

`news-store.mjs` implementa o fluxo de rascunho, publicação e arquivamento, com transporte injetável. `news-cloud.mjs` usa uma atualização atômica nos caminhos `nakaGamingNews/drafts/{id}`, `adminIndex/{id}`, `publicIndex/{id}` e `articles/{id}`. A revisão de cada rascunho deve incrementar exatamente uma vez, recusando sobrescritas de sessões antigas. `liveRevision` informa qual versão está no ar; salvar um rascunho não altera os caminhos públicos. Arquivar apaga apenas as cópias públicas e conserva o rascunho.

Os índices usam `sortKey` composto da data exibida e identificador, com índice no servidor. O frontend público carrega 3 metadados na home e 12 no arquivo, com paginação; o artigo é buscado individualmente. O namespace inteiro e os rascunhos não aceitam leitura anônima. Só a conta administrativa escreve. O índice público tem uma lista fechada de campos, sem corpo do texto. Textos são montados por `textContent`, sem interpretar HTML.

A capa é uma referência única compartilhada entre card e artigo. O conversor permite dimensões maiores para capas e mantém o limite de 75 KB/110.000 caracteres do transporte de mídia existente. Perfis não mudam seus limites. Não há listeners contínuos de notícias. O backup de configuração geral do portal não inclui este namespace independente.
