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

router.post("/soma", function(req,res) {
    rankingController.somarAcertos(req,res);
})

router.get("/score/:id", function(req,res) {
    rankingController.buscarScore(req,res);
})

router.get("/buscar/topOst", function(req,res) {
    rankingController.buscarTopOst(req,res);
})
module.exports = router;