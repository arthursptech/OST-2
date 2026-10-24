var ambiente_processo = 'producao';
// var ambiente_processo = 'desenvolvimento';

var caminho_env = ambiente_processo === 'producao' ? '.env' : '.env.dev';
// Acima, temos o uso do operador ternário para definir o caminho do arquivo .env
// A sintaxe do operador ternário é: condição ? valor_se_verdadeiro : valor_se_falso

require("dotenv").config({ path: caminho_env });

var express = require("express");
var cors = require("cors");
var path = require("path");
// Hospedagens como o Render definem a porta pela variável PORT
var PORTA_APP = process.env.PORT || process.env.APP_PORT;
var HOST_APP = process.env.APP_HOST;

var app = express();

var indexRouter = require("./src/routes/index");
var usuarioRouter = require("./src/routes/usuarios");
var mensagensRouter = require("./src/routes/mensagens");
var rankingRouter = require("./src/routes/ranking");
var quizRouter = require("./src/routes/quiz");
var spotifyRouter = require("./src/routes/spotify");

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));

app.use(cors());

// Rota leve para o agendador (cron-job.org) manter o servidor acordado
app.get("/saude", function (req, res) {
    res.status(200).send("ok");
});

app.use("/", indexRouter);
app.use("/usuarios", usuarioRouter);
app.use("/mensagens", mensagensRouter);
app.use("/ranking", rankingRouter);
app.use("/quiz", quizRouter);
app.use("/spotify", spotifyRouter);

// Contas antigas tinham a senha em texto puro: troca pelo hash ao subir o servidor
require("./src/models/usuarioModel").protegerSenhasAntigas().catch(function (erro) {
    console.log("Não foi possível proteger as senhas antigas: ", erro.message || erro);
});

// Já carrega a lista de músicas do Last.fm ao subir o servidor, para o primeiro quiz não demorar
require("./src/services/ostService").listarMusicasOst().catch(function (erro) {
    console.log("Não foi possível carregar as músicas do Last.fm: ", erro.message);
});

app.listen(PORTA_APP, function () {
    console.log(`
    ####      #####   #########
    ##  ##   ##   ###    ##    
    ##  ##   #      ##   ##
    ##  ##    #####      ##    
    ##  ##        ##     ##    
    ##  ##   ##   ##     ##    
     ####     #####      ##
    \n\n\n                                                                                                 
    Servidor do seu site já está rodando! Acesse o caminho a seguir para visualizar .: http://${HOST_APP}:${PORTA_APP} :. \n\n
    Você está rodando sua aplicação em ambiente de .:${process.env.AMBIENTE_PROCESSO}:. \n\n
    \tSe .:desenvolvimento:. você está se conectando ao banco local. \n
    \tSe .:producao:. você está se conectando ao banco remoto. \n\n
    \t\tPara alterar o ambiente, comente ou descomente as linhas 1 ou 2 no arquivo 'app.js'\n\n`);
});
