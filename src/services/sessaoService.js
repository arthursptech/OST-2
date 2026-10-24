// Sessão do usuário em um cookie assinado pelo servidor.
//
// O cookie guarda "id.validade.assinatura". A assinatura (HMAC-SHA256) é feita com SESSAO_SEGREDO,
// que só o servidor conhece: se alguém trocar o id no navegador, a assinatura deixa de bater e a
// sessão é recusada. Assim o servidor descobre quem é o usuário sozinho, sem confiar no id enviado
// pela página. Não precisa de tabela nem de memória (sobrevive aos reinícios do Render).

var crypto = require("crypto");

var NOME_COOKIE = "ost_sessao";
var DURACAO_MS = 7 * 24 * 60 * 60 * 1000;

// Sem SESSAO_SEGREDO no .env, usamos um segredo aleatório: funciona, mas todos são
// deslogados a cada reinício do servidor
var segredo = process.env.SESSAO_SEGREDO;
if (!segredo) {
    console.log("SESSAO_SEGREDO não definido no .env: as sessões serão perdidas a cada reinício do servidor");
    segredo = crypto.randomBytes(32).toString("hex");
}

function assinar(texto) {
    return crypto.createHmac("sha256", segredo).update(texto).digest("base64url");
}

function criarToken(idUsuario) {
    var dados = `${idUsuario}.${Date.now() + DURACAO_MS}`;
    return `${dados}.${assinar(dados)}`;
}

// Devolve o id do usuário, ou null se o token for inválido, adulterado ou estiver vencido
function lerToken(token) {
    var partes = String(token || "").split(".");
    if (partes.length !== 3) return null;
    var dados = `${partes[0]}.${partes[1]}`;
    var esperado = Buffer.from(assinar(dados));
    var recebido = Buffer.from(partes[2]);
    // Compara em tempo constante, para não dar pistas da assinatura pelo tempo de resposta
    if (esperado.length !== recebido.length || !crypto.timingSafeEqual(esperado, recebido)) return null;
    if (Number(partes[1]) < Date.now()) return null;
    var id = Number(partes[0]);
    return Number.isInteger(id) && id > 0 ? id : null;
}

function lerCookie(req, nome) {
    var cookies = (req.headers.cookie || "").split(";");
    for (var cookie of cookies) {
        var [chave, ...valor] = cookie.trim().split("=");
        if (chave === nome) return decodeURIComponent(valor.join("="));
    }
    return null;
}

// HttpOnly: o JavaScript da página não lê o cookie. SameSite=Lax: outros sites não conseguem
// usá-lo para enviar formulários em nome do usuário. Secure: só trafega por HTTPS (no Render)
function opcoesCookie(req, maxAge) {
    var opcoes = [`Path=/`, `Max-Age=${maxAge}`, "HttpOnly", "SameSite=Lax"];
    if (req.secure) opcoes.push("Secure");
    return opcoes.join("; ");
}

function iniciarSessao(req, res, idUsuario) {
    res.setHeader("Set-Cookie", `${NOME_COOKIE}=${encodeURIComponent(criarToken(idUsuario))}; ${opcoesCookie(req, DURACAO_MS / 1000)}`);
}

function encerrarSessao(req, res) {
    res.setHeader("Set-Cookie", `${NOME_COOKIE}=; ${opcoesCookie(req, 0)}`);
}

// Middleware das rotas que exigem login: coloca o id do usuário logado em req.idUsuario
function exigirLogin(req, res, next) {
    var idUsuario = lerToken(lerCookie(req, NOME_COOKIE));
    if (!idUsuario) {
        return res.status(401).send("Sua sessão expirou. Faça login novamente.");
    }
    req.idUsuario = idUsuario;
    next();
}

// ---------- Limite de tentativas de login ----------
// Cada IP pode errar a senha até 10 vezes a cada 15 minutos; depois disso o login fica
// bloqueado até a janela acabar. Logins certos não contam.

var LIMITE_TENTATIVAS = 10;
var JANELA_MS = 15 * 60 * 1000;
var tentativas = new Map();

function tentativasDoIp(ip) {
    var registro = tentativas.get(ip);
    if (!registro || Date.now() - registro.inicio > JANELA_MS) {
        registro = { quantidade: 0, inicio: Date.now() };
        tentativas.set(ip, registro);
    }
    return registro;
}

function limitarLogin(req, res, next) {
    var registro = tentativasDoIp(req.ip);
    if (registro.quantidade >= LIMITE_TENTATIVAS) {
        var minutos = Math.ceil((registro.inicio + JANELA_MS - Date.now()) / 60000);
        res.setHeader("Retry-After", minutos * 60);
        return res.status(429).send(`Muitas tentativas de login. Tente novamente em ${minutos} minuto(s).`);
    }
    next();
}

function registrarFalhaLogin(req) {
    tentativasDoIp(req.ip).quantidade++;
}

function limparFalhasLogin(req) {
    tentativas.delete(req.ip);
}

// Remove de tempos em tempos os IPs cuja janela já acabou, para o Map não crescer sem parar
setInterval(function () {
    var agora = Date.now();
    tentativas.forEach(function (registro, ip) {
        if (agora - registro.inicio > JANELA_MS) tentativas.delete(ip);
    });
}, JANELA_MS).unref();

module.exports = {
    iniciarSessao,
    encerrarSessao,
    exigirLogin,
    limitarLogin,
    registrarFalhaLogin,
    limparFalhasLogin
};
