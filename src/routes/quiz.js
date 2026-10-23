var express = require("express");
var router = express.Router();

var quizController = require("../controllers/quizController");

router.get("/musicas", function (req, res) {
    quizController.listarMusicas(req, res);
});

router.get("/gerar", function (req, res) {
    quizController.gerarQuiz(req, res);
});

router.post("/responder", function (req, res) {
    quizController.responderQuiz(req, res);
});

module.exports = router;
