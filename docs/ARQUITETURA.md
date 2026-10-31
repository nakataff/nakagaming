# Arquitetura e evolução

## Etapa atual: portal institucional

HTML estático separado por página; uma folha de estilos e um script compartilhados. O portal funciona com navegação nativa e não usa framework nem banco de dados. Um módulo carrega os textos e canais de um JSON público; o HTML original permanece completo como fallback.

A identidade visual está centralizada nas variáveis de `assets/css/styles.css`: cores, fontes, superfícies e bordas. Os componentes de botão, navegação, rodapé, cabeçalhos e seções podem ser reaproveitados nas próximas páginas.

## Próximas etapas possíveis

A ordem abaixo é uma proposta técnica, não uma lista de recursos já disponíveis:

1. **Conteúdo oficial:** canais de contato, recrutamento, história, elenco e resultados, com dados confirmados.
2. **Autenticação real:** escolher um provedor de identidade e definir os dados pessoais estritamente necessários.
3. **Perfis:** páginas próprias, por exemplo `/perfil/`, com módulo de dados separado do código de navegação.
4. **Membros:** área própria, por exemplo `/membros/`, para funcionalidades da guilda.
5. **Administração:** interface própria e autorização de administradores validada pelo backend.

## Limites do GitHub Pages

GitHub Pages entrega arquivos estáticos. Login, gravação de perfis e administração exigem um serviço externo de autenticação e dados ou um backend hospedado em outra plataforma. O domínio e as páginas institucionais podem continuar no Pages durante essa evolução.

Não implemente autenticação somente com JavaScript, um campo no localStorage ou uma senha dentro do repositório. A visibilidade de uma página administrativa não substitui a autorização no servidor. Perfis públicos devem separar campos visíveis dos dados privados da conta; privilégios de administrador devem ser controlados no backend.

## Separação quando a plataforma começar

Introduza módulos em `assets/js/services/` para autenticação e dados somente quando o provedor for escolhido. Scripts específicos de cada página devem importar esses serviços; `main.js` continua responsável pela experiência comum do portal. Não há integrações fictícias ou código de login desativado nesta primeira versão.

Mantenha credenciais privadas no backend, regras de acesso por usuário e por função, e ambientes separados de teste e produção. Os parâmetros públicos exigidos pelo provedor escolhido não devem ser confundidos com chaves administrativas.


## Administração local adicionada

`/admin/` é a visão geral. `/admin/site/` edita conteúdo e canais; `/admin/guilda/` organiza uma lista local de nicks; `/admin/backup/` exporta e importa dados.

O painel é público e não autenticado. O noindex e a ausência de links públicos não restringem acesso. Cada navegador guarda seu próprio rascunho, sem API de gravação nem sincronização. Membros não são enviados ao servidor. O backup completo é diferente da configuração pública: somente esta última pode ser aplicada por `scripts/apply-content.mjs`.

Os módulos `admin-schema.mjs` e `admin-store.mjs` separam validação e armazenamento da interface `admin.mjs`. A futura autenticação e persistência remota devem substituir esse armazenamento local com regras no backend, sem transformar localStorage em controle de acesso.
