let database = require("../database/config");

function listar() {
    let instrucaoSql = `
        SELECT id, enunciado AS pergunta,
            alternativa_a AS alternativaA, alternativa_b AS alternativaB,
            alternativa_c AS alternativaC, alternativa_d AS alternativaD,
            nivel AS dificuldade, jogo, assunto AS tema, imagem, audio
        FROM perguntas
        ORDER BY FIELD(nivel, 'Fácil', 'Médio', 'Difícil', 'Especialista'), id;
    `;

    return database.executar(instrucaoSql);
}

function verificar(id, resposta) {
    return database.executar("SELECT resposta_correta = ? AS acertou FROM perguntas WHERE id = ?", [resposta, id]);
}

module.exports = {
    listar,
    verificar
};
