var express = require("express");
var router = express.Router();

var usuarioController = require("../controllers/usuarioController");

//Recebendo os dados do html e direcionando para a função cadastrar de usuarioController.js
router.post("/cadastrar", function (req, res) {
    usuarioController.cadastrar(req, res);
})

router.post("/autenticar", function (req, res) {
    usuarioController.autenticar(req, res);
});

router.get("/sessao", function (req, res) {
    if (!req.session.usuario) return res.status(401).json({ mensagem: "Faça login para continuar." });
    res.json(req.session.usuario);
});

router.post("/sair", function (req, res) {
    req.session.destroy(function (erro) {
        if (erro) return res.status(500).json({ mensagem: "Não foi possível encerrar a sessão." });
        res.clearCookie("connect.sid");
        res.sendStatus(204);
    });
});

module.exports = router;
