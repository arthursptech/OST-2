var mensagemModel = require("../models/mensagemModel");

function listar(req, res) {
    mensagemModel.listar().then(function (resultado) {
        if (resultado.length > 0) {
            res.status(200).json(resultado);
        } else {
            res.status(204).send("Nenhum resultado encontrado!")
        }
    }).catch(function (erro) {
        console.log(erro);
        console.log("Houve um erro ao buscar as mensagens: ", erro.sqlMessage);
        res.status(500).json(erro.sqlMessage);
    });
}

function listarPorUsuario(req, res) {
    var idUsuario = req.params.idUsuario;

    mensagemModel.listarPorUsuario(idUsuario)
        .then(
            function (resultado) {
                if (resultado.length > 0) {
                    res.status(200).json(resultado);
                } else {
                    res.status(204).send("Nenhum resultado encontrado!");
                }
            }
        )
        .catch(
            function (erro) {
                console.log(erro);
                console.log(
                    "Houve um erro ao buscar as mensagens: ",
                    erro.sqlMessage
                );
                res.status(500).json(erro.sqlMessage);
            }
        );
}

function pesquisarDescricao(req, res) {
    var descricao = req.params.descricao;

    mensagemModel.pesquisarDescricao(descricao)
        .then(
            function (resultado) {
                if (resultado.length > 0) {
                    res.status(200).json(resultado);
                } else {
                    res.status(204).send("Nenhum resultado encontrado!");
                }
            }
        ).catch(
            function (erro) {
                console.log(erro);
                console.log("Houve um erro ao buscar as mensagens: ", erro.sqlMessage);
                res.status(500).json(erro.sqlMessage);
            }
        );
}

function publicar(req, res) {
    var titulo = req.body.titulo;
    var descricao = req.body.descricao;
    var idUsuario = req.params.idUsuario;

    if (typeof titulo != "string" || titulo.trim() == "") {
        res.status(400).send("O título está indefinido!");
    } else if (typeof descricao != "string" || descricao.trim() == "") {
        res.status(400).send("A descrição está indefinido!");
    } else if (idUsuario == undefined) {
        res.status(403).send("O id do usuário está indefinido!");
    } else {
        mensagemModel.publicar(titulo, descricao, idUsuario)
            .then(
                function (resultado) {
                    res.json(resultado);
                }
            )
            .catch(
                function (erro) {
                    console.log(erro);
                    console.log("Houve um erro ao realizar o post: ", erro.sqlMessage);
                    res.status(500).json(erro.sqlMessage);
                }
            );
    }
}

// O autor da mensagem vem no corpo da requisição; se a mensagem não for dele, nada é alterado
function editar(req, res) {
    var novaDescricao = req.body.descricao;
    var idMensagem = req.params.idMensagem;
    var idUsuario = req.body.idUsuario;

    if (typeof novaDescricao != "string" || novaDescricao.trim() == "") {
        return res.status(400).send("A descrição está indefinida!");
    }

    mensagemModel.editar(novaDescricao, idMensagem, idUsuario)
        .then(
            function (resultado) {
                if (resultado.affectedRows == 0) {
                    return res.status(403).send("Você não pode editar a mensagem de outro usuário!");
                }
                res.json(resultado);
            }
        )
        .catch(
            function (erro) {
                console.log(erro);
                console.log("Houve um erro ao realizar o post: ", erro.sqlMessage);
                res.status(500).json(erro.sqlMessage);
            }
        );

}

function deletar(req, res) {
    var idMensagem = req.params.idMensagem;
    var idUsuario = req.body.idUsuario;

    mensagemModel.deletar(idMensagem, idUsuario)
        .then(
            function (resultado) {
                if (resultado.affectedRows == 0) {
                    return res.status(403).send("Você não pode deletar a mensagem de outro usuário!");
                }
                res.json(resultado);
            }
        )
        .catch(
            function (erro) {
                console.log(erro);
                console.log("Houve um erro ao deletar o post: ", erro.sqlMessage);
                res.status(500).json(erro.sqlMessage);
            }
        );
}

module.exports = {
    listar,
    listarPorUsuario,
    pesquisarDescricao,
    publicar,
    editar,
    deletar
}