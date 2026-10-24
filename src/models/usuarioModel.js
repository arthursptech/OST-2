var database = require("../database/config")
var senhaService = require("../services/senhaService");

// Os valores vão separados da instrução (nos "?"), assim o que o usuário digita nunca vira SQL
function buscarPorEmail(email) {
    var instrucaoSql = `
        SELECT id, nome, email, senha FROM usuario WHERE email = ?;
    `;
    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql, [email], true);
}

function buscarPorId(id) {
    var instrucaoSql = `
        SELECT id, nome, email FROM usuario WHERE id = ?;
    `;
    return database.executar(instrucaoSql, [id], true);
}

// A senha chega aqui já como hash (ver senhaService)
function cadastrar(nome, email, senhaHash) {
    var instrucaoSql = `
        INSERT INTO usuario (nome, email, senha) VALUES (?, ?, ?);
    `;
    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql, [nome, email, senhaHash]);
}

// Contas criadas antes do hash tinham a senha em texto puro: ao subir o servidor,
// aumentamos a coluna (o hash tem ~170 caracteres) e trocamos essas senhas pelo hash delas
async function protegerSenhasAntigas() {
    var coluna = await database.executar(`
        SELECT CHARACTER_MAXIMUM_LENGTH tamanho FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'usuario' AND COLUMN_NAME = 'senha';`, true);
    if (coluna.length && coluna[0].tamanho < 255) {
        await database.executar("ALTER TABLE usuario MODIFY senha VARCHAR(255);", true);
    }

    var usuarios = await database.executar("SELECT id, senha FROM usuario WHERE senha NOT LIKE 'scrypt$%';", true);
    for (var usuario of usuarios) {
        var hash = await senhaService.gerarHash(usuario.senha || "");
        await database.executar("UPDATE usuario SET senha = ? WHERE id = ?;", [hash, usuario.id], true);
    }
    if (usuarios.length) console.log(`Senhas: ${usuarios.length} senha(s) em texto puro protegida(s) com hash`);
}

module.exports = {
    buscarPorEmail,
    buscarPorId,
    cadastrar,
    protegerSenhasAntigas
};
