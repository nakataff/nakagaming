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
5. **Administração:** login e rascunhos privados disponíveis; a publicação direta de conteúdo pode ser adicionada depois.

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

A lista da guilda e os rascunhos não são públicos. O conteúdo publicado continua em `assets/data/site.json`. O fluxo de exportação e aplicação por commit permanece separado do salvamento privado na conta. A regra isolada da Naka foi mesclada ao arquivo de regras existente do projeto Central, sem alterar os caminhos anteriores.

Backups da versão antiga podem ser recuperados manualmente após o login. A importação exige validação e confirmação; não há migração automática de dados locais para a conta.
