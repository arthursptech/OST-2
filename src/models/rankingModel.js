var database = require("../database/config")

function buscarTopUsuario() {
    console.log("Buscando o usuário que mais acertou perguntas no quiz");

    var instrucaoSql = `
        SELECT fkUsuario, nome FROM ranking JOIN usuario ON fkUsuario = usuario.id ORDER BY qtd_acertos DESC LIMIT 1;
    `;
    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

function buscarRanking() {
    var instrucaoSql = `
    SELECT nome, fkUsuario, qtd_acertos FROM ranking JOIN usuario ON fkUsuario = usuario.id ORDER BY qtd_acertos DESC;`;

    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

function calcularMedia() {
    var instrucaoSql = `
    SELECT ROUND(AVG(qtd_acertos),0) media FROM ranking;`;

    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

function adicionarResposta(resposta, usuario) {
    var instrucaoSql = `
    INSERT INTO respostasUser (fkAlternativa, fkUsuario) VALUES
    (${resposta}, ${usuario});`;

    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

function somarAcertos(idUsuario) {
    var instrucaoSql = `
    INSERT INTO ranking (qtd_acertos, fkUsuario)
    SELECT 
        SUM(CASE
        WHEN a.tipo = 1 THEN 1 ELSE 0
        END) AS qtd_acertos,
        ru.fkUsuario
    FROM respostasUser ru
    JOIN alternativas a ON ru.fkAlternativa = a.id
    WHERE ru.fkUsuario = ${idUsuario}
    GROUP BY ru.fkUsuario;`

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
module.exports = {
    buscarTopUsuario,
    buscarRanking,
    calcularMedia,
    adicionarResposta,
    somarAcertos,
    buscarScore,
    buscarTopOst
};