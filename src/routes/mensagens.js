var express = require("express");
var router = express.Router();

var mensagemController = require("../controllers/mensagemController");

router.get("/listar", function (req, res) {
    mensagemController.listar(req, res);
});

router.get("/listar/:idUsuario", function (req, res) {
    mensagemController.listarPorUsuario(req, res);
});

router.get("/pesquisar/:descricao", function (req, res) {
    mensagemController.pesquisarDescricao(req, res);
});

router.post("/publicar/:idUsuario", function (req, res) {
    mensagemController.publicar(req, res);
});

router.put("/editar/:idMensagem", function (req, res) {
    mensagemController.editar(req, res);
});

router.delete("/deletar/:idMensagem", function (req, res) {
    mensagemController.deletar(req, res);
});

module.exports = router;