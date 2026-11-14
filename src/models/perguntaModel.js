let database = require("../database/config");

function listar() {
    let instrucaoSql = `
        SELECT id, enunciado AS pergunta,
            alternativa_a AS alternativaA, alternativa_b AS alternativaB,
            alternativa_c AS alternativaC, alternativa_d AS alternativaD,
            nivel AS dificuldade, jogo, assunto AS tema, imagem, audio
        FROM perguntas
        ORDER BY id;
    `;

    return database.executar(instrucaoSql);
}

module.exports = {
    listar
};
