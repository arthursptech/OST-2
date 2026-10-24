// Senhas guardadas como hash (scrypt, já incluso no Node), nunca em texto puro.
// Formato salvo no banco: "scrypt$<salt em hex>$<hash em hex>"

var crypto = require("crypto");

var PREFIXO = "scrypt$";
var TAMANHO_HASH = 64;

function scrypt(senha, salt) {
    return new Promise(function (resolve, reject) {
        crypto.scrypt(String(senha), salt, TAMANHO_HASH, function (erro, hash) {
            if (erro) return reject(erro);
            resolve(hash);
        });
    });
}

async function gerarHash(senha) {
    var salt = crypto.randomBytes(16).toString("hex");
    var hash = await scrypt(senha, salt);
    return `${PREFIXO}${salt}$${hash.toString("hex")}`;
}

function ehHash(valor) {
    return typeof valor === "string" && valor.startsWith(PREFIXO);
}

// Compara em tempo constante, para não dar pistas da senha pelo tempo de resposta
async function conferir(senha, salvo) {
    if (!ehHash(salvo)) return false;
    var partes = salvo.split("$");
    var esperado = Buffer.from(partes[2], "hex");
    var hash = await scrypt(senha, partes[1]);
    return esperado.length === hash.length && crypto.timingSafeEqual(esperado, hash);
}

module.exports = {
    gerarHash,
    ehHash,
    conferir
};
