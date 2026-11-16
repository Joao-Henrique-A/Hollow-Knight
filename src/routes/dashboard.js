var express = require("express");
var router = express.Router();
var tentativaController = require("../controllers/tentativaController");

router.get("/tentativas", function (req, res) {
    if (!req.session.usuario) return res.status(401).json({ mensagem: "Faça login para continuar." });
    return tentativaController.listar(req, res);
});

router.get("/tentativas/:id", function (req, res) {
    if (!req.session.usuario) return res.status(401).json({ mensagem: "Faça login para continuar." });
    return tentativaController.detalhes(req, res);
});

module.exports = router;
