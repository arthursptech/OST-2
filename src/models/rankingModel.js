var database = require("../database/config")
var mysql = require("mysql2");

// Ranking calculado a partir das respostas: a pontuação de cada usuário é a sua melhor tentativa
var rankingSql = `
    SELECT u.id fkUsuario, u.nome, MAX(t.acertos) qtd_acertos
    FROM usuario u
    JOIN (
        SELECT ru.fkUsuario, ru.fkTentativa, CAST(SUM(a.tipo = 1) AS SIGNED) acertos
        FROM respostasUser ru
        JOIN alternativas a ON ru.fkAlternativa = a.id
        GROUP BY ru.fkUsuario, ru.fkTentativa
    ) t ON t.fkUsuario = u.id
    GROUP BY u.id, u.nome`;

function buscarTopUsuario() {
    console.log("Buscando o usuário que mais acertou perguntas no quiz");

    var instrucaoSql = `
        SELECT fkUsuario, nome FROM (${rankingSql}) ranking ORDER BY qtd_acertos DESC LIMIT 1;`;
    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

function buscarRanking() {
    var instrucaoSql = `
    SELECT * FROM (${rankingSql}) ranking ORDER BY qtd_acertos DESC, nome;`;

    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

function calcularMedia() {
    var instrucaoSql = `
    SELECT ROUND(AVG(qtd_acertos),0) media FROM (${rankingSql}) ranking;`;

    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

// As alternativas do quiz são geradas a partir do Last.fm, então a alternativa escolhida
// é registrada no momento da resposta e depois vinculada à resposta do usuário
async function adicionarRespostasQuiz(alternativas, usuario, tentativa) {
    for (var alternativa of alternativas) {
        var instrucaoAlternativa = `
        INSERT INTO alternativas (titulo, origem, tipo, fkPergunta) VALUES
        (${mysql.escape(alternativa.titulo ? alternativa.titulo.substring(0, 60) : null)}, ${mysql.escape(alternativa.origem.substring(0, 60))}, ${alternativa.tipo}, ${alternativa.pergunta});`;

        console.log("Executando a instrução SQL: \n" + instrucaoAlternativa);
        var resultado = await database.executar(instrucaoAlternativa);

        var instrucaoResposta = `
        INSERT INTO respostasUser (fkAlternativa, fkUsuario, fkTentativa, tempoResposta) VALUES
        (${resultado.insertId}, ${usuario}, ${tentativa}, ${mysql.escape(alternativa.tempo)});`;

        console.log("Executando a instrução SQL: \n" + instrucaoResposta);
        await database.executar(instrucaoResposta);
    }
}

function adicionarTentativa(usuario) {
    var instrucaoSql = `
    INSERT INTO tentativas (fkUsuario) VALUES (?);`;

    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql, [Number(usuario)]);
}

function buscarScore(idUsuario) {
    var instrucaoSql = `
    SELECT 
        qtd_acertos
    FROM
        (${rankingSql}) ranking
    WHERE
        fkUsuario = ${Number(idUsuario)};`;

    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

function buscarTopOst() {
    var instrucaoSql = `
    SELECT 
        titulo,
        COUNT(ru.id) total_acertos
    FROM respostasUser ru
    JOIN alternativas a ON fkAlternativa = a.id
    WHERE a.tipo = 1 AND titulo != 'null'
    GROUP BY titulo
    ORDER BY total_acertos DESC
    LIMIT 1;`

    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

function buscarTentativa(idUsuario) {
    var instrucaoSql = `
    SELECT DATE_FORMAT(MAX(dtHrRegistro),'%d/%m/%Y') dtTentativa,
    COUNT(*) tentativaAtual
    FROM tentativas WHERE fkUsuario = ${Number(idUsuario)}
    GROUP BY fkUsuario
    LIMIT 1;`

    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

function buscarGrafico(idUsuario) {
    var instrucaoSql = `
    SELECT CAST(SUM(a.tipo = 1) AS SIGNED) qtd_acertos, ru.fkUsuario userId, DATE_FORMAT(dtHrRegistro,'%d/%m/%Y') dtTentativa
    FROM respostasUser ru
    JOIN alternativas a ON fkAlternativa = a.id
    JOIN usuario u ON ru.fkUsuario = u.id
    JOIN tentativas t ON ru.fkTentativa = idTentativa
    WHERE ru.fkUsuario = ${Number(idUsuario)}
    GROUP BY ru.fkUsuario, fkTentativa, dtHrRegistro
    ORDER BY dtHrRegistro ASC;`

    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

// Tempo médio (em segundos) para responder as questões em cada tentativa do usuário
function buscarGraficoTempo(idUsuario) {
    var instrucaoSql = `
    SELECT ROUND(AVG(ru.tempoResposta), 1) tempo_medio, DATE_FORMAT(t.dtHrRegistro,'%d/%m/%Y') dtTentativa
    FROM respostasUser ru
    JOIN tentativas t ON ru.fkTentativa = t.idTentativa
    WHERE ru.fkUsuario = ${Number(idUsuario)}
    GROUP BY t.idTentativa, t.dtHrRegistro
    ORDER BY t.dtHrRegistro ASC;`

    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

// Tempo médio por questão do usuário e de todos os jogadores
function buscarMediaTempo(idUsuario) {
    var instrucaoSql = `
    SELECT
        (SELECT ROUND(AVG(tempoResposta), 1) FROM respostasUser WHERE fkUsuario = ${Number(idUsuario)}) media_usuario,
        (SELECT ROUND(AVG(tempoResposta), 1) FROM respostasUser) media_geral;`

    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

module.exports = {
    buscarTopUsuario,
    buscarRanking,
    calcularMedia,
    adicionarTentativa,
    adicionarRespostasQuiz,
    buscarScore,
    buscarTopOst,
    buscarTentativa,
    buscarGrafico,
    buscarGraficoTempo,
    buscarMediaTempo
};