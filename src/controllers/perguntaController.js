let perguntaModel = require("../models/perguntaModel");

function listar(req, res) {
    perguntaModel.listar()
        .then(function (perguntas) {
            res.status(200).json(perguntas);
        })
        .catch(function (erro) {
            console.log("Erro ao buscar perguntas:", erro);
            res.status(500).json({ mensagem: "Não foi possível buscar as perguntas." });
        });
}

module.exports = {
    listar
};
