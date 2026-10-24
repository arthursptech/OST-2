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

function buscarScore(req, res) {
    console.log(req.params.id);

    rankingModel.buscarScore(req.params.id)
        .then(resultado => {
            res.json(resultado);
        }).catch(err => {
            res.status(500).send(err);
        })
}

function buscarTopOst(req, res) {
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

function buscarTentativa(req, res) {
    var idUsuario = req.params.id;

    rankingModel.buscarTentativa(idUsuario).then(function (resultado) {
        if (resultado.length > 0) {
            res.status(200).json(resultado);
        } else {
            res.status(204).send("Nenhum resultado encontrado!")
        }
    }).catch(function (erro) {
        console.log(erro);
        console.log("Houve um erro ao buscar os dados sobre as tentativas: ", erro.sqlMessage);
        res.status(500).json(erro.sqlMessage);
    });
}

function buscarGrafico(req,res) {
    var idUsuario = req.params.id;

    rankingModel.buscarGrafico(idUsuario).then(function (resultado) {
        if (resultado.length > 0) {
            res.status(200).json(resultado);
        } else {
            res.status(204).send("Nenhum resultado encontrado!")
        }
    }).catch(function (erro) {
        console.log(erro);
        console.log("Houve um erro ao buscar o gráfico sobre as tentativas: ", erro.sqlMessage);
        res.status(500).json(erro.sqlMessage);
    });
}

function buscarTempo(req, res) {
    var idUsuario = req.params.id;

    Promise.all([rankingModel.buscarGraficoTempo(idUsuario), rankingModel.buscarMediaTempo(idUsuario)])
        .then(function ([tentativas, medias]) {
            res.status(200).json({
                tentativas: tentativas,
                mediaUsuario: medias[0].media_usuario,
                mediaGeral: medias[0].media_geral
            });
        }).catch(function (erro) {
            console.log(erro);
            console.log("Houve um erro ao buscar o tempo de resposta: ", erro.sqlMessage);
            res.status(500).json(erro.sqlMessage);
        });
}

module.exports = {
    buscarTopUsuario,
    buscarRanking,
    calcularMedia,
    buscarScore,
    buscarTopOst,
    buscarTentativa,
    buscarGrafico,
    buscarTempo
}