# AGENTS.md

## Visão geral

O projeto será um site dedicado ao universo de Hollow Knight e Hollow Knight: Silksong. O objetivo é apresentar informações sobre os jogos e oferecer um sistema de quiz para testar os conhecimentos dos usuários sobre seus personagens, histórias, itens, cenários e acontecimentos.

O site terá uma interface organizada, com uma barra de navegação (Navbar) que permitirá acessar as seguintes páginas:

- **Dashboard:** apresentará o desempenho do usuário nos quizzes, incluindo erros cometidos, pontos fortes e informações sobre seu progresso.
- **Quiz:** permitirá que o usuário responda perguntas sobre Hollow Knight e Silksong.
- **Login:** permitirá que usuários cadastrados acessem suas contas.
- **Cadastro:** permitirá criar uma nova conta para utilizar o sistema.
- **Index:** página inicial com informações sobre a história de Hollow Knight
- **História Silksong** parecida com a página inicial mas é sobre silksong.

O sistema deverá armazenar os resultados das tentativas dos usuários para que suas dificuldades e seus pontos fortes possam ser identificados e apresentados na Dashboard.

## Tecnologias

- HTML para estruturar as páginas do site.
- CSS para personalizar a aparência e o layout.
- JavaScript para implementar as funcionalidades e a interação com o usuário.
- Banco de dados para armazenar usuários, respostas, erros e resultados dos quizzes.
- Visual Studio Code para desenvolver o projeto.

## Arquitetura

O projeto será organizado de forma que cada responsabilidade fique separada.

- **index.html:** página inicial com informações sobre a história de Hollow Knight e Silksong.
- **dashboard.html:** página que apresentará o desempenho e o histórico do usuário.
- **quiz.html:** página responsável pela exibição das perguntas e pelo funcionamento do quiz.
- **login.html:** página de acesso dos usuários.
- **cadastro.html:** página de criação de novas contas.
- **css/:** pasta responsável pelos arquivos de estilização das páginas.
- **js/:** pasta responsável pelos arquivos JavaScript e pelas funcionalidades do sistema.
- **assets/:** pasta destinada às imagens, ícones e outros recursos visuais.

As páginas deverão manter uma identidade visual consistente, utilizando a mesma Navbar e seguindo os padrões de organização do projeto.

## Sistema de Quiz

O quiz será dividido em quatro níveis de dificuldade, cada um contendo cinco perguntas, totalizando vinte perguntas.

A progressão será organizada da