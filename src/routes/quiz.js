let express = require("express");
let router = express.Router();
let perguntaController = require("../controllers/perguntaController");

router.get("/perguntas", function (req, res) {
    perguntaController.listar(req, res);
});

module.exports = router;
