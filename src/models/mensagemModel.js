var database = require("../database/config");

function listar() {
    console.log("ACESSEI a mensagem  MODEL \n \n\t\t >> Se aqui der erro de 'Error: connect ECONNREFUSED',\n \t\t >> verifique suas credenciais de acesso ao banco\n \t\t >> e se o servidor de seu BD está rodando corretamente. \n\n function listar()");
    var instrucaoSql = `
        SELECT 
            m.id AS idMensagem,
            m.titulo,
            m.descricao,
            m.fkUsuario,
            u.id AS idUsuario,
            u.nome
        FROM mensagem m
            INNER JOIN usuario u
                ON m.fkUsuario = u.id;
    `;
    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

function pesquisarDescricao(texto) {
    console.log("ACESSEI a mensagem MODEL \n \n\t\t >> Se aqui der erro de 'Error: connect ECONNREFUSED',\n \t\t >> verifique suas credenciais de acesso ao banco\n \t\t >> e se o servidor de seu BD está rodando corretamente. \n\n function pesquisarDescricao()");
    var instrucaoSql = `
        SELECT 
            m.id AS idMensagem,
            m.titulo,
            m.descricao,
            m.fkUsuario,
            u.id AS idUsuario,
            u.nome
        FROM mensagem m
            INNER JOIN usuario u
                ON m.fkUsuario = u.id
        WHERE m.descricao LIKE ?;
    `;
    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql, [texto]);
}

function listarPorUsuario(idUsuario) {
    console.log("ACESSEI a mensagem MODEL \n \n\t\t >> Se aqui der erro de 'Error: connect ECONNREFUSED',\n \t\t >> verifique suas credenciais de acesso ao banco\n \t\t >> e se o servidor de seu BD está rodando corretamente. \n\n function listarPorUsuario()");
    var instrucaoSql = `
        SELECT 
            m.id AS idMensagem,
            m.titulo,
            m.descricao,
            m.fkUsuario,
            u.id AS idUsuario,
            u.nome
        FROM mensagem m
            INNER JOIN usuario u
                ON m.fkUsuario = u.id
        WHERE u.id = ?;
    `;
    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql, [idUsuario]);
}

function publicar(titulo, descricao, idUsuario) {
    console.log("ACESSEI a mensagem MODEL \n \n\t\t >> Se aqui der erro de 'Error: connect ECONNREFUSED',\n \t\t >> verifique suas credenciais de acesso ao banco\n \t\t >> e se o servidor de seu BD está rodando corretamente. \n\n function publicar(): ", titulo, descricao, idUsuario);
    var instrucaoSql = `
        INSERT INTo mensagem (titulo, descricao, fkUsuario) VALUES (?, ?, ?);
    `;
    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql, [titulo, descricao, idUsuario]);
}

// Só o autor pode editar/apagar: a mensagem precisa ser do usuário informado
function editar(novaDescricao, idMensagem, idUsuario) {
    console.log("ACESSEI a mensagem MODEL \n \n\t\t >> Se aqui der erro de 'Error: connect ECONNREFUSED',\n \t\t >> verifique suas credenciais de acesso ao banco\n \t\t >> e se o servidor de seu BD está rodando corretamente. \n\n function editar(): ", novaDescricao, idMensagem);
    var instrucaoSql = `
        UPDATE mensagem SET descricao = ? WHERE id = ? AND fkUsuario = ?;
    `;
    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql, [novaDescricao, idMensagem, idUsuario]);
}

function deletar(idMensagem, idUsuario) {
    console.log("ACESSEI a mensagem MODEL \n \n\t\t >> Se aqui der erro de 'Error: connect ECONNREFUSED',\n \t\t >> verifique suas credenciais de acesso ao banco\n \t\t >> e se o servidor de seu BD está rodando corretamente. \n\n function deletar():", idMensagem);
    var instrucaoSql = `
        DELETE FROM mensagem WHERE id = ? AND fkUsuario = ?;
    `;
    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql, [idMensagem, idUsuario]);
}

module.exports = {
    listar,
    listarPorUsuario,
    pesquisarDescricao,
    publicar,
    editar,
    deletar
}
