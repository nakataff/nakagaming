# Naka Gaming — diretrizes de manutenção

## Conteúdo editável pelo administrador

- Nomes, descrições, equipes, ordem das abas, elencos, funções, fotos, temas, enquadramento, visibilidade, lideranças, IDs do Free Fire e redes sociais são dados administráveis. Não fixe cadastros reais em HTML ou JavaScript.
- Ao adicionar um novo conteúdo personalizável, entregue também o campo correspondente no painel, a validação, a prévia quando visual e o caminho de publicação. Mantenha compatibilidade com os rascunhos anteriores.
- O painel usa a conta administrativa existente da Central; nunca coloque senhas no repositório. Os rascunhos e a lista privada de membros ficam em `nakaGamingAdmin/state`.
- `Publicar no site` publica somente `publicSnapshot()`. A lista privada de membros e os cadastros ocultos não entram no conteúdo público. Não publique o backup completo.
- Não invente jogadores, equipes, líderes, IDs ou resultados para preencher espaços. Fixtures de teste são locais e não entram no portal.

## Identidade e imagens

- Preserve a identidade azul escura/samurai e as páginas separadas com URLs por diretório.
- Cards de jogadores têm retrato 4:5. Fundo atrás, PNG/WebP transparente à frente; sem foto ou em falha de carregamento, use a silhueta escolhida. O tema pode seguir a equipe ou ser definido por jogador.
- Lideranças da guilda têm foto de perfil, função, ID e Instagram opcionais. Não publique dados de contato pessoais extras.
- Preserve os originais em `naka gaming/`. As cópias de produção ficam em `assets/images/roster/`. Evite imagens maiores que a área exibida.
- Fotos enviadas pelo painel são convertidas no navegador para WebP com transparência, até 75 KB, e armazenadas separadamente dos textos. Uploads são públicos por endereço individual, sem listagem pública. Não guarde imagens embutidas no JSON do site.

## Desempenho e publicação

- Páginas públicas não carregam o SDK do Firebase. Use o leitor REST compartilhado, cache por sessão de 2 minutos e fallback estático. Não acrescente listeners contínuos.
- Carregue fotos sob demanda e renderize apenas o elenco da aba ativa. Evite frameworks e dependências para funções simples.
- As regras de dados do projeto Central devem ser preservadas. Mescle somente os caminhos Naka; nunca substitua o banco inteiro pelo fragmento em `firebase/`.
- Verifique `node --test tests/*.test.mjs`, `python3 scripts/check.py` e `python3 scripts/build.py`. Confira a página de equipes, os líderes, mobile e o estado sem cadastros. Não inclua fixtures locais na publicação.
