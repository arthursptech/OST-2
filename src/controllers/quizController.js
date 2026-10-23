var crypto = require("crypto");
var ostService = require("../services/ostService");
var rankingModel = require("../models/rankingModel");

var QTD_QUESTOES = 10;
var VALIDADE_QUIZ_MS = 2 * 60 * 60 * 1000;

// Gabarito dos quizzes gerados fica apenas no servidor, para o usuário não conseguir ver a resposta
var quizzesGerados = new Map();

function limparQuizzesExpirados() {
    var agora = Date.now();
    quizzesGerados.forEach(function (quiz, id) {
        if (agora - quiz.criadoEm > VALIDADE_QUIZ_MS) quizzesGerados.delete(id);
    });
}

function listarMusicas(req, res) {
    ostService.listarMusicasOst().then(function (musicas) {
        res.status(200).json(musicas);
    }).catch(function (erro) {
        console.log("Houve um erro ao buscar as músicas do Last.fm: ", erro.message);
        res.status(500).json(erro.message);
    });
}

function gerarQuiz(req, res) {
    limparQuizzesExpirados();

    ostService.gerarQuiz(QTD_QUESTOES).then(function (questoes) {
        var id = crypto.randomUUID();
        quizzesGerados.set(id, { questoes: questoes, criadoEm: Date.now() });

        res.status(200).json({
            id: id,
            questoes: questoes.map(function (questao) {
                return {
                    preview: questao.preview,
                    previewAlternativo: questao.previewAlternativo,
                    alternativas: questao.alternativas.map(function (alternativa) {
                        return { midia: alternativa.midia, imagem: alternativa.imagem };
                    })
                };
            })
        });
    }).catch(function (erro) {
        console.log("Houve um erro ao gerar o quiz: ", erro.message);
        res.status(500).json(erro.message);
    });
}

async function responderQuiz(req, res) {
    var idQuiz = req.body.quizServer;
    var respostas = req.body.respostasServer;
    var tempos = Array.isArray(req.body.temposServer) ? req.body.temposServer : [];
    var usuario = Number(req.body.userServer);
    var quiz = quizzesGerados.get(idQuiz);

    if (!quiz || !Number.isInteger(usuario) || !Array.isArray(respostas) || respostas.length !== quiz.questoes.length) {
        return res.status(400).send("Dados inválidos");
    }

    var alternativasEscolhidas = quiz.questoes.map(function (questao, i) {
        var escolhida = questao.alternativas[Number(respostas[i])];
        if (!escolhida) return null;
        var correta = Number(respostas[i]) === questao.correta;
        // Tempo em segundos para responder a questão (ignorado se vier inválido)
        var tempo = Number(tempos[i]);
        return {
            titulo: correta ? escolhida.titulo : null,
            origem: escolhida.midia,
            tipo: correta ? 1 : 0,
            pergunta: i + 1,
            tempo: Number.isFinite(tempo) && tempo >= 0 && tempo < 3600 ? Math.round(tempo * 100) / 100 : null
        };
    });

    if (alternativasEscolhidas.includes(null)) {
        return res.status(400).send("Dados inválidos");
    }

    try {
        var result = await rankingModel.adicionarTentativa(usuario);
        var tentativaId = result.insertId;

        await rankingModel.adicionarRespostasQuiz(alternativasEscolhidas, usuario, tentativaId);
        quizzesGerados.delete(idQuiz);

        res.status(200).json({
            tentativa: tentativaId,
            acertos: alternativasEscolhidas.filter(function (a) { return a.tipo === 1; }).length
        });
    } catch (erro) {
        console.log(erro);
        console.log("Houve um erro ao adicionar os dados do quiz: ", erro.sqlMessage);
        res.status(500).json(erro.sqlMessage);
    }
}

module.exports = {
    listarMusicas,
    gerarQuiz,
    responderQuiz
};
