var perguntaModel = require("../models/perguntaModel");
var tentativaModel = require("../models/tentativaModel");

async function iniciar(req, res) {
    try {
        var perguntas = await perguntaModel.listar();
        var niveis = ["Fácil", "Médio", "Difícil", "Especialista"];
        if (perguntas.length !== 20 || niveis.some(nivel => perguntas.filter(p => p.dificuldade === nivel).length !== 5)) {
            return res.status(503).json({ mensagem: "As 20 perguntas do quiz ainda não estão disponíveis." });
        }
        var tentativa = await tentativaModel.criar(req.session.usuario.id);
        req.session.quiz = { id: tentativa.insertId, perguntas: perguntas.map(p => p.id), respostas: [] };
        req.session.save(function (erro) {
            if (erro) return res.status(500).json({ mensagem: "Não foi possível iniciar o quiz." });
            res.json({ perguntas: perguntas });
        });
    } catch (erro) {
        console.error("Erro ao iniciar quiz:", erro.message);
        res.status(500).json({ mensagem: "Não foi possível iniciar o quiz." });
    }
}

async function responder(req, res) {
    var quiz = req.session.quiz;
    var id = Number(req.body.idPergunta);
    var alternativa = req.body.alternativa;
    var anterior = quiz && quiz.respostas[quiz.respostas.length - 1];
    if (anterior && anterior.idPergunta === id && anterior.alternativa === alternativa) {
        try {
            var respostaAnterior = await perguntaModel.verificar(id, alternativa);
            if (respostaAnterior.length) return res.json({ acertou: Boolean(respostaAnterior[0].acertou) });
        } catch (erro) {
            return res.status(500).json({ mensagem: "Não foi possível verificar a resposta." });
        }
    }
    if (!quiz || quiz.respostas.length >= quiz.perguntas.length || quiz.perguntas[quiz.respostas.length] !== id || !["A", "B", "C", "D"].includes(alternativa)) {
        return res.status(400).json({ mensagem: "Resposta inválida ou questão fora de ordem." });
    }
    try {
        var resultado = await perguntaModel.verificar(id, alternativa);
        if (!resultado.length) return res.status(404).json({ mensagem: "Pergunta não encontrada." });
        var acertou = Boolean(resultado[0].acertou);
        quiz.respostas.push({ idPergunta: id, alternativa: alternativa });
        req.session.save(function (erro) {
            if (erro) return res.status(500).json({ mensagem: "Não foi possível registrar a resposta." });
            res.json({ acertou: acertou });
        });
    } catch (erro) {
        console.error("Erro ao verificar resposta:", erro.message);
        res.status(500).json({ mensagem: "Não foi possível verificar a resposta." });
    }
}

async function finalizar(req, res) {
    var quiz = req.session.quiz;
    if (!quiz || quiz.perguntas.length !== 20 || quiz.respostas.length !== quiz.perguntas.length) {
        return res.status(400).json({ mensagem: "Responda a todas as questões antes de finalizar." });
    }
    try {
        var id = await tentativaModel.finalizar(req.session.usuario.id, quiz.id, quiz.respostas);
        res.json({ id: id });
    } catch (erro) {
        console.error("Erro ao salvar tentativa:", erro.message);
        res.status(500).json({ mensagem: "Não foi possível salvar a tentativa. Tente novamente." });
    }
}

async function listar(req, res) {
    try {
        res.json(await tentativaModel.listar(req.session.usuario.id));
    } catch (erro) {
        console.error("Erro ao listar tentativas:", erro.message);
        res.status(500).json({ mensagem: "Não foi possível carregar o histórico." });
    }
}

async function detalhes(req, res) {
    var id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id < 1) return res.status(400).json({ mensagem: "Tentativa inválida." });
    try {
        var respostas = await tentativaModel.detalhes(req.session.usuario.id, id);
        if (!respostas.length) return res.status(404).json({ mensagem: "Tentativa não encontrada." });
        res.json({ id: id, respostas: respostas });
    } catch (erro) {
        console.error("Erro ao buscar tentativa:", erro.message);
        res.status(500).json({ mensagem: "Não foi possível carregar a tentativa." });
    }
}

module.exports = { iniciar, responder, finalizar, listar, detalhes };
