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

async function adicionarResposta(req, res) {
    var resposta = req.body.respostasServer;
    var usuario = req.body.userServer;

    if (usuario.length < 0 || resposta.length < 0) {
        return res.status(400).send("Dados inválidos")
    }
    try {
        var result = await rankingModel.adicionarTentativa(usuario);
        
        var tentativaId = result.insertId;

        await rankingModel.adicionarResposta(resposta, usuario, tentativaId)

        res.status(200).json({
            ok_sql: "Ambas funções funcionaram: alternativa e resposta",
            tentativa: tentativaId 
        });
    } catch (erro) {
        console.log(erro);
        console.log("Houve um erro ao adicionar os dados do quiz: ", erro.sqlMessage);
        res.status(500).json(erro.sqlMessage);
    };
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

module.exports = {
    buscarTopUsuario,
    buscarRanking,
    calcularMedia,
    adicionarResposta,
    buscarScore,
    buscarTopOst,
    buscarTentativa,
    buscarGrafico
}