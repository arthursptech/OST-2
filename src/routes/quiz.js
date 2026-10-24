var express = require("express");
var router = express.Router();

var quizController = require("../controllers/quizController");
var sessaoService = require("../services/sessaoService");

router.get("/musicas", function (req, res) {
    quizController.listarMusicas(req, res);
});

router.get("/gerar", function (req, res) {
    quizController.gerarQuiz(req, res);
});

// A tentativa é registrada para o usuário da sessão
router.post("/responder", sessaoService.exigirLogin, function (req, res) {
    quizController.responderQuiz(req, res);
});

module.exports = router;
