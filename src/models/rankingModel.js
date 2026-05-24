var database = require("../database/config")

function buscarTopUsuario() {
    console.log("Buscando o usuário que mais acertou perguntas no quiz");

    var instrucaoSql = `
        SELECT fkUsuario, nome FROM ranking ORDER BY qtd_acertos DESC LIMIT 1;`;
    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

function buscarRanking() {
    var instrucaoSql = `
    SELECT * FROM ranking;`;

    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

function calcularMedia() {
    var instrucaoSql = `
    SELECT ROUND(AVG(qtd_acertos),0) media FROM ranking;`;

    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

function adicionarResposta(resposta, usuario, tentativa) {
    var instrucaoSql = `
    INSERT INTO respostasUser (fkAlternativa, fkUsuario, fkTentativa) VALUES
    (${resposta[0]}, ${usuario}, ${tentativa}),
    (${resposta[1]}, ${usuario}, ${tentativa}),
    (${resposta[2]}, ${usuario}, ${tentativa}),
    (${resposta[3]}, ${usuario}, ${tentativa}),
    (${resposta[4]}, ${usuario}, ${tentativa}),
    (${resposta[5]}, ${usuario}, ${tentativa}),
    (${resposta[6]}, ${usuario}, ${tentativa}),
    (${resposta[7]}, ${usuario}, ${tentativa}),
    (${resposta[8]}, ${usuario}, ${tentativa}),
    (${resposta[9]}, ${usuario}, ${tentativa});`;

    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

function adicionarTentativa(usuario) {
    var instrucaoSql = `
    INSERT INTO tentativas (fkUsuario) VALUES (${usuario});`;

    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

function buscarScore(idUsuario) {
    var instrucaoSql = `
    SELECT 
        qtd_acertos
    FROM
        ranking
    WHERE
        fkUsuario = ${idUsuario};`;

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
    FROM tentativas WHERE fkUsuario = ${idUsuario}
    GROUP BY fkUsuario
    LIMIT 1;`

    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

function buscarGrafico(idUsuario) {
    var instrucaoSql = `
    SELECT COUNT(*) qtd_acertos, ru.fkUsuario userId, DATE_FORMAT(dtHrRegistro,'%d/%m/%Y') dtTentativa
    FROM respostasUser ru
    JOIN alternativas a ON fkAlternativa = a.id
    JOIN usuario u ON ru.fkUsuario = u.id
    JOIN tentativas t ON ru.fkTentativa = idTentativa
    WHERE tipo = 1 AND ru.fkUsuario = ${idUsuario}
    GROUP BY ru.fkUsuario, fkTentativa, dtHrRegistro
    ORDER BY dtHrRegistro ASC;`

    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

module.exports = {
    buscarTopUsuario,
    buscarRanking,
    calcularMedia,
    adicionarResposta,
    adicionarTentativa,
    buscarScore,
    buscarTopOst,
    buscarTentativa,
    buscarGrafico
};