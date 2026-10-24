<img src="./public/assets/icon/logoOST.png">

# Original Soundtrack - Projeto Individual

Música sempre esteve presente na minha vida e desde sempre a amei. O tema deste projeto é um dos diversos formatos de música existentes e também um dos meus favoritos. Poder desenvolver um site sobre Original Soundtrack e poder explicar o quão importante ela é para a indústria e para mim é extremamente gratificante.

## Tecnologias Utilizadas

### Front-end
![badge](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![badge](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![badge](https://img.shields.io/badge/JavaScript-323330?style=for-the-badge&logo=javascript&logoColor=F7DF1E)

### Back-end
![badge](https://img.shields.io/badge/JavaScript-323330?style=for-the-badge&logo=javascript&logoColor=F7DF1E)
![badge](https://img.shields.io/badge/MySQL-005C84?style=for-the-badge&logo=mysql&logoColor=white)
![badge](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)


# Instalação do Projeto

## 1. Clone o repositório
```bash
git clone https://github.com/arthursptech/Projeto-Individual.git
```

## 2. Instalação de dependências
```bash
npm install
```

## 3. Configure o Banco de Dados
- Crie o banco de dados usando o <a href="./src/database/script-tabelas.sql">script</a>.

## 4. Configure as variáveis de ambiente
Crie um arquivo .env e .env.dev:

```bash
DB_HOST= "localhost"
DB_DATABASE= "ost"
DB_USER= "seu_usuario"
DB_PASSWORD= "sua_senha"
PORT=3306

APP_PORT=3333
APP_HOST=localhost

LASTFM_API_KEY="sua_api_key"
LASTFM_USER=MsAqua
LASTFM_LIMITE_MUSICAS=200

SPOTIFY_PLAYLIST_ID=6VQOZVwVhlgpR00UKZXRrl
SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=
SPOTIFY_REDIRECT_URI=http://127.0.0.1:8080/spotify/callback
```
#### A chave do Last.fm é gratuita e pode ser criada em https://www.last.fm/api/account/create
#### As credenciais do Spotify são opcionais: sem elas só as 100 primeiras músicas da playlist são lidas. Crie um app gratuito em https://developer.spotify.com/dashboard para obter o Client ID e o Client Secret. Cadastre no app o mesmo `SPOTIFY_REDIRECT_URI` e, com o servidor rodando, acesse http://127.0.0.1:8080/spotify/login uma vez com a conta dona da playlist
#### Importante: caso sua senha contenha caracteres especiais, insira-a entre 'aspas'

## 5. Configure o ambiente

No arquivo `app.js`:

### Produção

```js
var ambiente_processo = 'producao';
```
No `.env`

### Desenvolvimento 

```js
var ambiente_processo = 'desenvolvimento';
```
No `.env.dev`

## 6. Rodando o projeto:

```bash
npm start ou node app.js
```

### Acesse http://localhost:3333

## Deploy gratuito (Render + Aiven + cron-job.org)

O site inteiro (páginas + API) roda em um único serviço Node no [Render](https://render.com), com o banco MySQL na [Aiven](https://aiven.io). Os dois têm plano gratuito (confira os limites atuais ao criar as contas).

O cache das APIs, a lista de músicas do quiz e o login do Spotify ficam salvos no banco (tabela `cache_api`). Por isso o servidor volta a funcionar em segundos mesmo depois de reiniciar ou "dormir".

### 1. Banco na Aiven
1. Crie um serviço **Aiven for MySQL** no plano **Free**.
2. Em *Connection information* anote host, porta, usuário (`avnadmin`), senha e banco (`defaultdb`) e baixe o **CA certificate**.
3. Conecte com o MySQL Workbench (usando SSL) e rode o [script](./src/database/script-tabelas.sql) **sem** as linhas `CREATE DATABASE ost;` e `USE ost;`.
4. (Recomendado) Rode o projeto **uma vez no seu computador** com o `.env` apontando para a Aiven (variáveis `DB_*` + `DB_SSL=true` + `DB_SSL_CA`). O servidor copia o cache local (pasta `cache/`) e a lista de músicas para o banco na nuvem, então o site já começa rápido. Faça também o login do Spotify em http://127.0.0.1:8080/spotify/login nesse momento.

### 2. Servidor no Render
1. *New* > *Web Service* > conecte o repositório do GitHub (branch `main`).
2. Build command: `npm install` | Start command: `npm start` | Instance type: **Free**.
3. Em *Environment*, cadastre as variáveis do `.env`: `AMBIENTE_PROCESSO=producao`, `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USER`, `DB_PASSWORD`, `DB_SSL=true`, `DB_SSL_CA`, `LASTFM_API_KEY`, `LASTFM_USER`, `LASTFM_LIMITE_MUSICAS`, `SPOTIFY_PLAYLIST_ID`, `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET` e `SPOTIFY_REDIRECT_URI=https://SEU-APP.onrender.com/spotify/callback`. Não é preciso definir a porta.
4. No app do Spotify (developer.spotify.com), adicione o Redirect URI `https://SEU-APP.onrender.com/spotify/callback`. Se o login do Spotify não foi feito no passo 1.4, acesse `https://SEU-APP.onrender.com/spotify/login` uma vez.
5. A cada push na `main` o Render publica a nova versão automaticamente.

### 3. Manter o site acordado (6h às 22h)
O plano gratuito do Render "dorme" após 15 minutos sem acesso. Para evitar isso no horário de uso, crie no [cron-job.org](https://cron-job.org) uma tarefa que acessa `https://SEU-APP.onrender.com/saude` **a cada 10 minutos, das 6h às 21h50** (fuso `America/Sao_Paulo`). De madrugada o servidor dorme e não gasta as horas gratuitas do mês.

## Páginas e Funcionalidades

### <a href="./public/index.html">Homepage</a>
<img src="./public/assets/imgs/homeSS.png" width="1080">

Na homepage é possível pausar e despausar a trilha sonora de fundo.

Na seção de Exemplos, é possível acessar uma página dedicada àquela OST clicando no "Clique Aqui!"

### <a href="./public/cadastro.html">Cadastro</a>
<img src="./public/assets/imgs/cadastroSS.png">

### <a href="./public/login.html">Login</a>
<img src="./public/assets/imgs/loginSS.png">

### <a href="./public/dashboard/cards.html">Quiz</a>
<img src="./public/assets/imgs/quizSS.png">

As músicas do quiz são sorteadas a partir de duas fontes:

- A playlist de OSTs do Spotify configurada em `SPOTIFY_PLAYLIST_ID` (todas as músicas entram)
- As músicas mais ouvidas do usuário do Last.fm configurado em `LASTFM_USER`, filtrando apenas as que têm a tag (gênero) de Original Soundtrack Cada questão toca automaticamente um trecho de 10 segundos da música correta e mostra 4 alternativas com a imagem da mídia ou, se não encontrada, a capa do álbum:

- Aberturas e encerramentos de anime: áudio oficial e identificação do anime pelo [AnimeThemes](https://animethemes.moe)
- Músicas da playlist: trecho de 30 segundos do próprio Spotify
- Demais músicas: preview da versão oficial no iTunes (com o Deezer como alternativa)
- Imagens: [AniList](https://anilist.co) para animes e Wikipedia para filmes, jogos e séries

As APIs têm limite de requisições por minuto (o iTunes aceita cerca de 20), então na primeira vez que o servidor sobe a lista de músicas leva alguns minutos para carregar. Os resultados ficam salvos na pasta `cache/` e as próximas inicializações são rápidas.

### Modelo do Quiz - Adivinhe de onde é a OST
<img src="./public/assets/imgs/quizExSS.png">

### Dashboard - Ranking dos jogadores e gráfico do score do usuário e a média dos jogadores
<img src="./public/assets/imgs/rankingSS.png">

### Dashboard - Gráfico mostrando a variação dos scores a cada tentativa e a data de cada tentativa
<img src="./public/assets/imgs/tentativaSS.png">

### Fórum
<img src="./public/assets/imgs/forumSS.png">

