var database = require("../database/config");

function criar(idUsuario) {
    return database.executar("INSERT INTO tentativas (id_usuario) VALUES (?)", [idUsuario]);
}

async function finalizar(idUsuario, idTentativa, respostas) {
    var conexao = await database.conectar();
    try {
        await conexao.beginTransaction();
        var [tentativas] = await conexao.execute(
            "SELECT id, data_fim FROM tentativas WHERE id = ? AND id_usuario = ? FOR UPDATE",
            [idTentativa, idUsuario]
        );
        if (!tentativas.length) throw new Error("Tentativa não encontrada.");

        // Uma repetição da requisição após a confirmação não cria outra tentativa.
        if (!tentativas[0].data_fim) {
            for (var resposta of respostas) {
                var [insercao] = await conexao.execute(
                    `INSERT INTO respostas_usuario (id_tentativa, id_pergunta, resposta_escolhida, acertou)
                     SELECT ?, id, ?, resposta_correta = ? FROM perguntas WHERE id = ?`,
                    [idTentativa, resposta.alternativa, resposta.alternativa, resposta.idPergunta]
                );
                if (insercao.affectedRows !== 1) throw new Error("Pergunta não encontrada.");
            }
            var [totais] = await conexao.execute(
                "SELECT COUNT(*) AS total, COALESCE(SUM(acertou), 0) AS acertos FROM respostas_usuario WHERE id_tentativa = ?",
                [idTentativa]
            );
            await conexao.execute(
                `UPDATE tentativas SET data_fim = NOW(), pontuacao = ?, quantidade_acertos = ?, quantidade_erros = ?
                 WHERE id = ? AND id_usuario = ?`,
                [totais[0].acertos, totais[0].acertos, totais[0].total - totais[0].acertos, idTentativa, idUsuario]
            );
        }
        await conexao.commit();
        return idTentativa;
    } catch (erro) {
        await conexao.rollback();
        throw erro;
    } finally {
        await conexao.end();
    }
}

function listar(idUsuario) {
    return database.executar(
        `SELECT t.id, t.data_fim, COUNT(r.id) AS total, COALESCE(SUM(r.acertou), 0) AS acertos
         FROM tentativas t JOIN respostas_usuario r ON r.id_tentativa = t.id
         WHERE t.id_usuario = ? AND t.data_fim IS NOT NULL
         GROUP BY t.id, t.data_fim ORDER BY t.data_fim DESC, t.id DESC`, [idUsuario]
    );
}

function detalhes(idUsuario, idTentativa) {
    return database.executar(
        `SELECT p.jogo, p.assunto, p.nivel, r.acertou
         FROM respostas_usuario r
         JOIN tentativas t ON t.id = r.id_tentativa
         JOIN perguntas p ON p.id = r.id_pergunta
         WHERE t.id_usuario = ? AND t.id = ? AND t.data_fim IS NOT NULL`,
        [idUsuario, idTentativa]
    );
}

module.exports = { criar, finalizar, listar, detalhes };
