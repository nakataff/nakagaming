# Publicação e domínio

## Configuração do projeto

- Repositório: `nakataff/nakagaming`
- Hospedagem: GitHub Pages
- Fonte: branch `main`, pasta `/ (root)`
- Domínio: `nakagaming.com.br`
- Arquivo `CNAME`: contém apenas o domínio, sem protocolo nem caminho
- `.nojekyll`: serve o HTML e os arquivos estáticos diretamente

O Pages já estava ativo, com builds nativos concluídos, antes desta implementação. Preserve essa publicação por branch. Para conferir: **Settings → Pages → Build and deployment → Deploy from a branch → main → / (root)**.

A publicação roda em **Actions → pages build and deployment**. O workflow adicional **Verificar site** valida os arquivos, mas não controla o deploy nativo. Para uma futura publicação condicionada aos checks, migre conscientemente a fonte para GitHub Actions e adicione um workflow de deploy; não são necessários dois métodos de publicação ao mesmo tempo.

## Registro.br depois da transição

A transição para o modo avançado de DNS precisa terminar antes da alteração dos registros. Se os servidores autoritativos continuarem sendo os do Registro.br, cadastre os registros na zona DNS do Registro.br:

| Tipo | Nome | Valor |
| --- | --- | --- |
| A | raiz / campo de nome vazio | `185.199.108.153` |
| A | raiz / campo de nome vazio | `185.199.109.153` |
| A | raiz / campo de nome vazio | `185.199.110.153` |
| A | raiz / campo de nome vazio | `185.199.111.153` |
| CNAME | `www` | `nakataff.github.io` |

Alguns provedores representam a raiz como `@`; no Registro.br, use o campo vazio quando a interface já mostrar o domínio ao lado. O CNAME de `www` aponta para o usuário GitHub, sem `/nakagaming`.

Se optar por delegar o DNS a outro provedor, crie os registros na zona desse provedor. Não é necessário contratar outra hospedagem. Preserve registros de e-mail e outros serviços existentes; ajuste somente registros web conflitantes, se houver.

## HTTPS e validação

1. Confirme que o domínio personalizado exibido em **Settings → Pages** é `nakagaming.com.br`.
2. Após salvar o DNS, aguarde sua propagação e a verificação de domínio do GitHub.
3. Ative **Enforce HTTPS** quando o certificado estiver disponível. Não remova o domínio do Pages durante a espera.
4. Teste a raiz, `sobre.html`, `guilda.html`, `contato.html` e a versão `www`.

Com o domínio personalizado ativo, `nakataff.github.io/nakagaming/` redireciona para ele. Por isso esse endereço também depende do DNS para funcionar no navegador. Um build concluído não significa que o domínio já está resolvendo.

Opcionalmente, verifique a propriedade do domínio em **Settings da conta → Pages**. O GitHub fornece um TXT específico; não é possível preparar esse valor antes de recebê-lo.

## Referências oficiais

- https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site
- https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
