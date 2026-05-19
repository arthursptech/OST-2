var rankingModel = require("../models/rankingModel");

function buscarTopUsuario(req, res) {
    rankingModel.buscarTopUsuario().then(function (resultado) {
        if (resultado.length > 0) {
            res.status(200).json(resultado);
        } else {
            res.status(204).send("Nenhum resultado encontrado!")
        }
    }).catch(function (erro) {
        console.log(erro);
        console.log("Houve um erro ao buscar o top usuário: ", erro.sqlMessage);
        res.status(500).json(erro.sqlMessage);
    });
}

function buscarRanking(req, res) {
    rankingModel.buscarRanking().then(function (resultado) {
        if (resultado.length > 0) {
            res.status(200).json(resultado);
        } else {
            res.status(204).send("Nenhum resultado encontrado!")
        }
    }).catch(function (erro) {
        console.log(erro);
        console.log("Houve um erro ao buscar os dados do ranking: ", erro.sqlMessage);
        res.status(500).json(erro.sqlMessage);
    });
}

function calcularMedia(req, res) {
    rankingModel.calcularMedia().then(function (resultado) {
        if (resultado.length > 0) {
            res.status(200).json(resultado);
        } else {
            res.status(204).send("Nenhum resultado encontrado!")
        }
    }).catch(function (erro) {
        console.log(erro);
        console.log("Houve um erro ao buscar os dados do ranking: ", erro.sqlMessage);
        res.status(500).json(erro.sqlMessage);
    });
}

function adicionarResposta(req, res) {
    var resposta = req.body.respostaServer;
    var usuario = req.body.userServer;

    rankingModel.adicionarResposta(resposta,usuario)
        .then(function (resultado) {
        if (resultado.length > 0) {
            res.status(200).json(resultado);
        } else {
            res.status(204).send("Nenhum resultado encontrado!")
        }
    }).catch(function (erro) {
        console.log(erro);
        console.log("Houve um erro ao adicionar os dados do quiz: ", erro.sqlMessage);
        res.status(500).json(erro.sqlMessage);
    });
}

function somarAcertos(req,res) {
    var usuario = req.body.userServer;

    rankingModel.somarAcertos(usuario)
        .then(function (resultado) {
        if (resultado.length > 0) {
            res.status(200).json(resultado);
        } else {
            res.status(204).send("Nenhum resultado encontrado!")
        }
    }).catch(function (erro) {
        console.log(erro);
        console.log("Houve um erro ao buscar os dados do quiz do usuário: ", erro.sqlMessage);
        res.status(500).json(erro.sqlMessage);
    });
}

function buscarScore(req,res) {
    console.log(req.params.id);
    
    rankingModel.buscarScore(req.params.id)
        .then(resultado => {
            res.json(resultado);
        }).catch(err => {
            res.status(500).send(err);
        })
}

function buscarTopOst(req,res) {
    rankingModel.buscarTopOst().then(function (resultado) {
        if (resultado.length > 0) {
            res.status(200).json(resultado);
        } else {
            res.status(204).send("Nenhum resultado encontrado!")
        }
    }).catch(function (erro) {
        console.log(erro);
        console.log("Houve um erro ao buscar a top OST: ", erro.sqlMessage);
        res.status(500).json(erro.sqlMessage);
    });
}
module.exports = {
    buscarTopUsuario,
    buscarRanking,
    calcularMedia,
    adicionarResposta,
    somarAcertos,
    buscarScore,
    buscarTopOst
}