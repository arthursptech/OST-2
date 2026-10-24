// Cache das APIs externas (iTunes, AnimeThemes, AniList, Spotify...) e da lista de músicas do quiz.
//
// Os dados ficam no banco (tabela cache_api), para não se perderem quando o servidor reinicia
// (em hospedagens como o Render o disco é apagado a cada reinício). Uma cópia fica em memória,
// então as leituras são instantâneas e só as gravações vão para o banco.

var crypto = require("crypto");
var fs = require("fs");
var path = require("path");
var mysql = require("mysql2");
var database = require("../database/config");

// Pasta do cache antigo em arquivos: é importada para o banco na primeira vez
var PASTA_CACHE_ANTIGO = path.join(__dirname, "../../cache");
var TAMANHO_MAXIMO_CHAVE = 191;

var caches = new Map();
var inicializacao = null;

function cacheEmMemoria(nome) {
    if (!caches.has(nome)) caches.set(nome, new Map());
    return caches.get(nome);
}

// Chaves muito longas (ex.: títulos enormes) viram um hash, para caber na chave primária da tabela
function chaveBanco(chave) {
    chave = String(chave);
    if (chave.length <= TAMANHO_MAXIMO_CHAVE) return chave;
    return `sha1:${crypto.createHash("sha1").update(chave).digest("hex")}`;
}

// database.executar mostra o resultado de cada consulta no console; para o cache seria barulho demais
function executarSilencioso(instrucao) {
    return database.executar(instrucao, true);
}

async function salvarNoBanco(registros) {
    // Em lotes, para não montar uma instrução gigante
    for (var i = 0; i < registros.length; i += 200) {
        var valores = registros.slice(i, i + 200).map(function (r) {
            return `(${mysql.escape(r.nome)}, ${mysql.escape(r.chave)}, ${mysql.escape(JSON.stringify(r.valor))})`;
        });
        await executarSilencioso(`
            INSERT INTO cache_api (nome, chave, valor) VALUES ${valores.join(", ")}
            ON DUPLICATE KEY UPDATE valor = VALUES(valor);`);
    }
}

function importarCacheAntigo(nomesNoBanco) {
    var registros = [];
    var arquivos = [];
    try {
        arquivos = fs.readdirSync(PASTA_CACHE_ANTIGO).filter(function (a) { return a.endsWith(".json"); });
    } catch (erro) {
        return registros;
    }
    arquivos.forEach(function (arquivo) {
        var nome = arquivo.replace(/\.json$/, "");
        if (nomesNoBanco.has(nome)) return;
        try {
            var dados = JSON.parse(fs.readFileSync(path.join(PASTA_CACHE_ANTIGO, arquivo), "utf8"));
            Object.entries(dados).forEach(function ([chave, valor]) {
                chave = chaveBanco(chave);
                cacheEmMemoria(nome).set(chave, valor);
                registros.push({ nome: nome, chave: chave, valor: valor });
            });
        } catch (erro) {
            console.log(`Não foi possível importar o cache ${arquivo}: `, erro.message);
        }
    });
    return registros;
}

async function carregar() {
    try {
        await executarSilencioso(`
            CREATE TABLE IF NOT EXISTS cache_api (
                nome VARCHAR(50) NOT NULL,
                chave VARCHAR(${TAMANHO_MAXIMO_CHAVE}) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
                valor MEDIUMTEXT,
                atualizadoEm DATETIME DEFAULT NOW() ON UPDATE NOW(),
                PRIMARY KEY (nome, chave)
            );`);
        var linhas = await executarSilencioso("SELECT nome, chave, valor FROM cache_api;");
        var nomesNoBanco = new Set();
        linhas.forEach(function (linha) {
            nomesNoBanco.add(linha.nome);
            try {
                cacheEmMemoria(linha.nome).set(linha.chave, JSON.parse(linha.valor));
            } catch (erro) { }
        });

        var importados = importarCacheAntigo(nomesNoBanco);
        if (importados.length) {
            await salvarNoBanco(importados);
            console.log(`Cache: ${importados.length} registros importados da pasta cache/ para o banco`);
        }
        console.log(`Cache: ${linhas.length + importados.length} registros carregados do banco`);
    } catch (erro) {
        // Sem banco o quiz continua funcionando, só que o cache fica apenas em memória
        console.log("Cache: não foi possível usar o banco, usando só a memória: ", erro.message || erro);
        importarCacheAntigo(new Set());
    }
}

// Precisa ser chamado (e aguardado) antes de usar os caches
function inicializar() {
    if (!inicializacao) inicializacao = carregar();
    return inicializacao;
}

function criarCache(nome) {
    return {
        tem: function (chave) { return cacheEmMemoria(nome).has(chaveBanco(chave)); },
        ler: function (chave) { return cacheEmMemoria(nome).get(chaveBanco(chave)); },
        salvar: function (chave, valor) {
            chave = chaveBanco(chave);
            cacheEmMemoria(nome).set(chave, valor);
            salvarNoBanco([{ nome: nome, chave: chave, valor: valor }]).catch(function (erro) {
                console.log(`Não foi possível salvar o cache ${nome} no banco: `, erro.message || erro);
            });
        }
    };
}

module.exports = {
    inicializar,
    criarCache
};
