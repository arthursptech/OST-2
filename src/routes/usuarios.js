var express = require("express");
var router = express.Router();

var usuarioController = require("../controllers/usuarioController");
var sessaoService = require("../services/sessaoService");

//Recebendo os dados do html e direcionando para a função cadastrar de usuarioController.js
router.post("/cadastrar", function (req, res) {
    usuarioController.cadastrar(req, res);
})

// Limitado a 10 senhas erradas a cada 15 minutos por IP
router.post("/autenticar", sessaoService.limitarLogin, function (req, res) {
    usuarioController.autenticar(req, res);
});

// Usuário da sessão atual (usado pelas páginas para conferir se o login ainda vale)
router.get("/eu", sessaoService.exigirLogin, function (req, res) {
    usuarioController.buscarUsuarioLogado(req, res);
});

router.post("/sair", function (req, res) {
    usuarioController.sair(req, res);
});

module.exports = router;
