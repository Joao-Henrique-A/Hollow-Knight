-- Arquivo de apoio, caso você queira criar tabelas como as aqui criadas para a API funcionar.
-- Você precisa executar os comandos no banco de dados para criar as tabelas,
-- ter este arquivo aqui não significa que a tabela em seu BD estará como abaixo!

/*
comandos para mysql server
*/

CREATE DATABASE HollowQuiz;

USE HollowQuiz;

CREATE TABLE usuario (
idUsuario INT PRIMARY KEY AUTO_INCREMENT,
nome VARCHAR(45) NOT NULL,
email VARCHAR(30) NOT NULL,
senha VARCHAR(20) NOT NULL
);

CREATE TABLE perguntas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    enunciado TEXT NOT NULL,
    alternativa_a VARCHAR(255) NOT NULL,
    alternativa_b VARCHAR(255) NOT NULL,
    alternativa_c VARCHAR(255) NOT NULL,
    alternativa_d VARCHAR(255) NOT NULL,
    resposta_correta CHAR(1) NOT NULL,
    nivel VARCHAR(30) NOT NULL,
    assunto VARCHAR(50) NOT NULL,
    jogo VARCHAR(30) NOT NULL,
	imagem VARCHAR(255) DEFAULT NULL,
    audio VARCHAR(255) DEFAULT NULL
);

CREATE TABLE tentativas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    data_inicio DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    data_fim DATETIME,
    pontuacao INT DEFAULT 0,
    quantidade_acertos INT DEFAULT 0,
    quantidade_erros INT DEFAULT 0,

    CONSTRAINT fk_tentativas_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuario(idUsuario)
);

CREATE TABLE respostas_usuario (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_tentativa INT NOT NULL,
    id_pergunta INT NOT NULL,
    resposta_escolhida CHAR(1) NOT NULL,
    acertou TINYINT NOT NULL,

    CONSTRAINT fk_respostas_tentativa
        FOREIGN KEY (id_tentativa)
        REFERENCES tentativas(id),

    CONSTRAINT fk_respostas_pergunta
        FOREIGN KEY (id_pergunta)
        REFERENCES perguntas(id)
);

INSERT INTO perguntas (
    enunciado,
    alternativa_a,
    alternativa_b,
    alternativa_c,
    alternativa_d,
    resposta_correta,
    nivel,
    assunto,
    jogo,
    imagem,
    audio
)
VALUES

-- =========================================
-- FÁCIL
-- =========================================

(
    'Quais são os três Sonhadores responsáveis por selar o Cavaleiro Vazio?',
    'Lurien, Monomon e Herrah',
    'Hornet, Quirrel e Zote',
    'Dama Branca, Rei Pálido e Herrah',
    'Monomon, Grimm e Lurien',
    'A',
    'Fácil',
    'Lore',
    'Hollow Knight',
    NULL,
    NULL
),

(
    'Qual personagem está representado na imagem?',
    'Zote',
    'Quirrel',
    'Cornifer',
    'Tiso',
    'B',
    'Fácil',
    'Personagens',
    'Hollow Knight',
    'assets/img/quirrel.png',
    NULL
),

(
    'O trecho de áudio apresentado pertence ao confronto contra qual chefe?',
    'Viúva',
    'Lace',
    'Besta dos Sinos',
    'Dançarinos Mecânicos',
    'B',
    'Fácil',
    'Trilha Sonora',
    'Silksong',
    NULL,
    'assets/audio/lace.mp3'
),

(
    'Qual habilidade permite ao Cavaleiro escalar paredes?',
    'Coração de Cristal',
    'Asas do Monarca',
    'Garras do Louva-a-Deus',
    'Manto Sombrio',
    'C',
    'Fácil',
    'Exploração',
    'Hollow Knight',
    NULL,
    NULL
),

(
    'Qual personagem está representado na imagem?',
    'Shakra',
    'Viúva',
    'Lace',
    'Mestre da Colmeia',
    'C',
    'Fácil',
    'Personagens',
    'Silksong',
    'assets/img/lace.png',
    NULL
),

-- =========================================
-- MÉDIO
-- =========================================

(
    'Qual é a versão aprimorada do feitiço Espírito Vingativo?',
    'Grito do Abismo',
    'Alma Sombria',
    'Mergulho Desolador',
    'Escuridão Descendente',
    'B',
    'Médio',
    'Combate',
    'Hollow Knight',
    NULL,
    NULL
),

(
    'O trecho de áudio representa a trilha sonora de qual região de Hallownest?',
    'Jardins da Rainha',
    'Cidade das Lágrimas',
    'Ermos Fúngicos',
    'Bacia Antiga',
    'B',
    'Médio',
    'Trilha Sonora',
    'Hollow Knight',
    NULL,
    'assets/audio/city-of-tears.mp3'
),

(
    'Qual é a principal função da Needolin durante a jornada de Hornet?',
    'Permitir que Hornet voe por curtas distâncias',
    'Tocar melodias que interagem com ecos e mecanismos',
    'Aumentar permanentemente o alcance da agulha',
    'Revelar a localização de todos os mapas',
    'B',
    'Médio',
    'Lore',
    'Silksong',
    NULL,
    NULL
),

(
    'Qual chefe é enfrentado nas Docas Profundas?',
    'Lace',
    'Viúva',
    'Besta dos Sinos',
    'Dançarinos Mecânicos',
    'C',
    'Médio',
    'Combate',
    'Silksong',
    NULL,
    NULL
),

-- 10. Silksong | Personagens
(
    'Qual é a principal atividade de Shakra em Pharloom?',
    'Vender mapas das regiões',
    'Forjar ferramentas de combate',
    'Ensinar habilidades de movimento',
    'Administrar os bancos de rosários',
    'A',
    'Médio',
    'Personagens',
    'Silksong',
    'assets/img/shakra.png',
    NULL
),

-- =========================================
-- DIFÍCIL
-- =========================================

(
    'Onde o Cavaleiro recebe a primeira metade do amuleto Alma do Rei?',
    'Na Bacia Antiga',
    'No Palácio Branco',
    'Nos Jardins da Rainha, com a Dama Branca',
    'No Abismo, após derrotar o Receptáculo Quebrado',
    'C',
    'Difícil',
    'Lore',
    'Hollow Knight',
    NULL,
    NULL
),

-- 12. Silksong | Personagens
(
    'Qual chefe precisa ser derrotado para que Hornet obtenha a Needolin?',
    'Lace',
    'Besta dos Sinos',
    'Viúva',
    'Dançarinos Mecânicos',
    'C',
    'Difícil',
    'Personagens',
    'Silksong',
    NULL,
    NULL
),

-- 13. Silksong | Exploração
(
    'Qual moeda é utilizada para comprar mapas de Shakra?',
    'Fragmentos de Concha',
    'Rosários',
    'Fios de Seda',
    'Marcas de Caçador',
    'B',
    'Difícil',
    'Exploração',
    'Silksong',
    NULL,
    NULL
),

(
    'O trecho de áudio apresentado está associado a qual local de Hallownest?',
    'Caminho do Sofrimento',
    'Palácio Branco',
    'Bacia Antiga',
    'Terra do Descanso',
    'B',
    'Difícil',
    'Trilha Sonora',
    'Hollow Knight',
    NULL,
    'assets/audio/white-palace.mp3'
),

(
    'Qual é o nome da dupla de chefes mecânicos enfrentada em Pharloom?',
    'Irmãs da Agulha',
    'Dançarinos Mecânicos',
    'Guardas da Cidadela',
    'Mestres do Sino',
    'B',
    'Difícil',
    'Combate',
    'Silksong',
    NULL,
    'assets/audio/cogwork-dancers.mp3'
),

-- =========================================
-- ESPECIALISTA
-- =========================================

(
    'Qual foi a falha central no plano do Rei Pálido ao escolher o Cavaleiro Vazio?',
    'O Cavaleiro Vazio não conseguiu absorver o Vazio',
    'O Cavaleiro Vazio desenvolveu um vínculo emocional com o Rei Pálido',
    'A Dama Branca impediu que o selo fosse concluído',
    'Os três Sonhadores abandonaram o ritual',
    'B',
    'Especialista',
    'Lore',
    'Hollow Knight',
    NULL,
    NULL
),

(
    'Qual chefe encerra o Panteão de Hallownest?',
    'Rei Pesadelo Grimm',
    'Cavaleiro Vazio',
    'Radiância',
    'Radiância Absoluta',
    'D',
    'Especialista',
    'Combate',
    'Hollow Knight',
    NULL,
    NULL
),

(
    'Qual estrutura precisa ser ativada no Abismo para permitir a travessia pelo mar de Vazio?',
    'O elevador da Bacia Antiga',
    'O farol',
    'O mecanismo do Palácio Branco',
    'O portão do Templo do Ovo Negro',
    'B',
    'Especialista',
    'Exploração',
    'Hollow Knight',
    NULL,
    NULL
),

(
    'Qual moeda Hornet precisa acumular para adquirir mapas e outros serviços oferecidos por Shakra?',
    'Rosários',
    'Fragmentos de Concha',
    'Fios de Seda',
    'Marcas de Caçador',
    'A',
    'Especialista',
    'Exploração',
    'Silksong',
    NULL,
    NULL
),

(
    'O trecho de áudio apresentado pertence à batalha final contra qual chefe?',
    'Lace',
    'Viúva',
    'Besta dos Sinos',
    'Lost Lace',
    'D',
    'Especialista',
    'Trilha Sonora',
    'Silksong',
    NULL,
    'assets/audio/lost-lace.mp3'
);

SELECT * FROM usuario;
