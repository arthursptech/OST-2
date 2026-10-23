var express = require("express");
var crypto = require("crypto");
var router = express.Router();

var ostService = require("../services/ostService");

// Login do dono da playlist no Spotify (feito uma vez): o Spotify só libera a playlist completa com ele
var estadosValidos = new Set();

router.get("/login", function (req, res) {
    if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) {
        return res.status(500).send("Configure SPOTIFY_CLIENT_ID e SPOTIFY_CLIENT_SECRET no arquivo .env");
    }
    var estado = crypto.randomUUID();
    estadosValidos.add(estado);
    res.redirect(ostService.urlLoginSpotify(estado));
});

router.get("/callback", function (req, res) {
    if (req.query.error) {
        return res.status(400).send(`Login no Spotify cancelado: ${req.query.error}`);
    }
    if (!estadosValidos.has(req.query.state)) {
        return res.status(400).send("Login no Spotify inválido. Tente novamente em /spotify/login");
    }
    estadosValidos.delete(req.query.state);

    ostService.concluirLoginSpotify(req.query.code).then(function () {
        res.send("Login no Spotify concluído! A playlist completa está sendo carregada para o quiz. Pode fechar esta página.");
    }).catch(function (erro) {
        console.log(erro.message);
        res.status(500).send(erro.message);
    });
});

module.exports = router;
