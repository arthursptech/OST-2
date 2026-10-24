var usuarioModel = require("../models/usuarioModel");
var senhaService = require("../services/senhaService");

function autenticar(req, res) {
    var email = req.body.emailServer;
    var senha = req.body.senhaServer;

    // Só aceitamos texto: um objeto viraria um trecho de SQL na consulta
    if (typeof email != "string" || email == "") {
        res.status(400).send("Seu email está indefinido!");
    } else if (typeof senha != "string" || senha == "") {
        res.status(400).send("Sua senha está indefinida!");
    } else {

        usuarioModel.buscarPorEmail(email)
            .then(async function (resultadoAutenticar) {
                // Confere a senha em todas as contas com esse email (bancos antigos podem ter repetidos)
                var usuario = null;
                for (var candidato of resultadoAutenticar) {
                    if (await senhaService.conferir(senha, candidato.senha)) {
                        usuario = candidato;
                        break;
                    }
                }

                if (usuario) {
                    // Nunca devolvemos a senha (nem o hash) para o navegador
                    res.json({
                        id: usuario.id,
                        email: usuario.email,
                        nome: usuario.nome
                    });
                } else {
                    res.status(403).send("Email e/ou senha inválido(s)");
                }
            }).catch(
                function (erro) {
                    console.log(erro);
                    console.log("\nHouve um erro ao realizar o login! Erro: ", erro.sqlMessage);
                    res.status(500).json("Houve um erro ao realizar o login");
                }
            );
    }

}

function cadastrar(req, res) {
    // Crie uma variável que vá recuperar os valores do arquivo cadastro.html
    var nome = req.body.nomeServer;
    var email = req.body.emailServer;
    var senha = req.body.senhaServer;

    // Faça as validações dos valores
    // Só aceitamos texto: um objeto viraria um trecho de SQL na consulta
    if (typeof nome != "string" || nome.trim() == "" || nome.length > 50) {
        res.status(400).send("Seu nome está indefinido ou é longo demais!");
    } else if (typeof email != "string" || email == "" || email.length > 60) {
        res.status(400).send("Seu email está indefinido ou é longo demais!");
    } else if (typeof senha != "string" || senha.length < 6) {
        res.status(400).send("Sua senha precisa ter pelo menos 6 caracteres!");
    } else {

        usuarioModel.buscarPorEmail(email)
            .then(async function (existentes) {
                if (existentes.length > 0) {
                    return res.status(409).send("Este email já está cadastrado!");
                }
                var senhaHash = await senhaService.gerarHash(senha);
                var resultado = await usuarioModel.cadastrar(nome, email, senhaHash);
                res.json({ id: resultado.insertId });
            }).catch(
                function (erro) {
                    console.log(erro);
                    console.log(
                        "\nHouve um erro ao realizar o cadastro! Erro: ",
                        erro.sqlMessage
                    );
                    res.status(500).json("Houve um erro ao realizar o cadastro");
                }
            );
    }
}

module.exports = {
    autenticar,
    cadastrar
}