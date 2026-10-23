var express = require("express");
var router = express.Router();

var rankingController = require("../controllers/rankingController");

router.get("/buscar", function(req, res) {
    rankingController.buscarTopUsuario(req, res);
});

router.get("/listar", function(req,res) {
    rankingController.buscarRanking(req,res);
})

router.get("/calcular", function(req,res) {
    rankingController.calcularMedia(req,res);
})

router.post("/quiz", function(req,res) {
    rankingController.adicionarResposta(req,res);
})

router.get("/score/:id", function(req,res) {
    rankingController.buscarScore(req,res);
})

router.get("/buscar/topOst", function(req,res) {
    rankingController.buscarTopOst(req,res);
})

router.get("/tentativa/:id", function(req,res) {
    rankingController.buscarTentativa(req,res);
})

router.get("/tentativa/graph/:id", function(req,res) {
    rankingController.buscarGrafico(req,res);
})

router.get("/tempo/:id", function(req,res) {
    rankingController.buscarTempo(req,res);
})

module.exports = router;