let express = require("express");
let router = express.Router();
let perguntaController = require("../controllers/perguntaController");
let tentativaController = require("../controllers/tentativaController");

router.get("/perguntas", function (req, res) {
    perguntaController.listar(req, res);
});

router.post("/iniciar", function (req, res) {
    if (!req.session.usuario) return res.status(401).json({ mensagem: "Faça login para continuar." });
    return tentativaController.iniciar(req, res);
});

router.post("/responder", function (req, res) {
    if (!req.session.usuario) return res.status(401).json({ mensagem: "Faça login para continuar." });
    return tentativaController.responder(req, res);
});

router.post("/finalizar", function (req, res) {
    if (!req.session.usuario) return res.status(401).json({ mensagem: "Faça login para continuar." });
    return tentativaController.finalizar(req, res);
});

module.exports = router;
