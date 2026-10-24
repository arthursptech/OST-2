var mysql = require("mysql2");

// CONEXÃO DO BANCO MYSQL SERVER
var mySqlConfig = {
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    // Pool: reaproveita as conexões em vez de abrir uma nova a cada consulta
    connectionLimit: 5,
    waitForConnections: true,
    enableKeepAlive: true
};

// Bancos na nuvem (Aiven, TiDB Cloud...) exigem conexão segura (SSL).
// DB_SSL_CA é o conteúdo do certificado da Aiven (no TiDB Cloud não é necessário)
if (process.env.DB_SSL === "true") {
    mySqlConfig.ssl = { rejectUnauthorized: true };
    if (process.env.DB_SSL_CA) {
        mySqlConfig.ssl.ca = process.env.DB_SSL_CA.replace(/\\n/g, "\n");
    }
}

var pool = null;

// silencioso = true não mostra o resultado da consulta no console (usado pelo cache, que faz muitas)
function executar(instrucao, silencioso) {

    if (process.env.AMBIENTE_PROCESSO !== "producao" && process.env.AMBIENTE_PROCESSO !== "desenvolvimento") {
        console.log("\nO AMBIENTE (produção OU desenvolvimento) NÃO FOI DEFINIDO EM .env OU dev.env OU app.js\n");
        return Promise.reject("AMBIENTE NÃO CONFIGURADO EM .env");
    }

    if (!pool) pool = mysql.createPool(mySqlConfig);

    return new Promise(function (resolve, reject) {
        pool.query(instrucao, function (erro, resultados) {
            if (erro) {
                console.log("ERRO NO MySQL SERVER: ", erro.sqlMessage || erro.message);
                return reject(erro);
            }
            if (!silencioso) console.log(resultados);
            resolve(resultados);
        });
    });
}

module.exports = {
    executar
};
