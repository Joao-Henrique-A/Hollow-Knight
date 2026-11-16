# Hollow-Knight

## Quiz e dashboard

O quiz busca as perguntas do MySQL. Para iniciar uma tentativa e acessar a dashboard, é necessário fazer login. Ao responder às 20 questões, o botão **Finalizar quiz** salva a tentativa e as respostas em uma transação e só então abre a dashboard. Se o salvamento falhar, o botão pode ser acionado novamente.

A dashboard fica em `public/dashboard/dashboard.html`. O seletor e o histórico mostram somente as tentativas concluídas da conta autenticada. Os indicadores usam as respostas da tentativa selecionada; empates são identificados e categorias sem questões não entram na comparação. Os gráficos usam Chart.js, instalado com as dependências do projeto e servido localmente pela aplicação.

### Configuração

1. Configure a conexão MySQL no `.env.dev`, como no restante do projeto, e execute `npm install`.
2. Para um banco novo, execute `src/database/script-tabelas.sql`. Se o banco já existir, mantenha os dados e verifique se as tabelas `usuario`, `perguntas`, `tentativas` e `respostas_usuario` e as 20 perguntas estão disponíveis. Não execute o script de criação inteiro novamente em um banco existente.
3. Inicie com `npm start` e acesse o endereço indicado no terminal.

O login mantém uma sessão no servidor; dados em `sessionStorage` não autorizam acesso às tentativas. As sessões ficam em memória e exigem novo login após reiniciar o servidor. Para configurar a chave da sessão, defina `SESSION_SECRET` no ambiente; caso não seja definida, uma chave temporária é gerada ao iniciar a aplicação. Os resultados concluídos permanecem no MySQL.

### Arquivos principais

- `app.js`, `src/routes/usuarios.js` e `src/controllers/usuarioController.js`: sessão no servidor e login. As rotas do quiz e da dashboard verificam a sessão antes de chamar os controllers.
- `src/database/config.js` e `src/models/usuarioModel.js`: conexão para transações e consultas parametrizadas.
- `src/routes/quiz.js` e `src/routes/dashboard.js`: rotas do quiz e da dashboard.
- `src/controllers/tentativaController.js` e `src/models/tentativaModel.js`: verificação das tentativas, gravação transacional e consultas por usuário.
- `src/models/perguntaModel.js`: perguntas sem gabarito e verificação da alternativa no servidor.
- `public/dashboard/dashboard.html`, `public/styles/dashboard.css` e `public/js/dashboard.js`: estrutura, estilos e gráficos da dashboard. A página substitui o antigo modelo AquaTech no mesmo caminho.
- `public/quiz.html`, `public/js/quiz.js` e `public/styles/estilo.css`: apresentação do quiz e envio das respostas.
- `public/index.html`, `public/login.html` e `public/cadastro.html`: link da dashboard na navegação; `public/js/sessao.js` encerra também a sessão do servidor.
- `src/database/script-tabelas.sql`: correção da criação da tabela de perguntas para bancos novos; não é necessária alteração de colunas no banco existente.
- `tests/dashboard.test.js` e `tests/navegador-dashboard.js`: testes de integração e de navegador.

### Testes

Execute `npm test` com o MySQL disponível e credenciais que permitam criar e excluir um banco temporário. O teste cria um banco isolado, verifica autenticação, acesso entre contas, respostas, rollback e repetição do salvamento e o remove ao terminar.
