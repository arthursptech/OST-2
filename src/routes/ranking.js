var express = require("express");
var router = express.Router();

var rankingController = require("../controllers/rankingController");
var sessaoService = require("../services/sessaoService");

// Dados pessoais (score, tentativas, gráficos): sempre do usuário da sessão, não de um id enviado pela página
function doUsuarioLogado(req, res, next) {
    req.params.id = req.idUsuario;
    next();
}

router.get("/buscar", function(req, res) {
    rankingController.buscarTopUsuario(req, res);
});

router.get("/listar", function(req,res) {
    rankingController.buscarRanking(req,res);
})

router.get("/calcular", function(req,res) {
    rankingController.calcularMedia(req,res);
})

router.get("/score", sessaoService.exigirLogin, doUsuarioLogado, function(req,res) {
    rankingController.buscarScore(req,res);
})

router.get("/buscar/topOst", function(req,res) {
    rankingController.buscarTopOst(req,res);
})

router.get("/tentativa", sessaoService.exigirLogin, doUsuarioLogado, function(req,res) {
    rankingController.buscarTentativa(req,res);
})

router.get("/tentativa/graph", sessaoService.exigirLogin, doUsuarioLogado, function(req,res) {
    rankingController.buscarGrafico(req,res);
})

router.get("/tempo", sessaoService.exigirLogin, doUsuarioLogado, function(req,res) {
    rankingController.buscarTempo(req,res);
})

module.exports = router;