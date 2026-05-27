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
```
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

### Modelo do Quiz - Adivinhe de onde é a OST
<img src="./public/assets/imgs/quizExSS.png">

### Dashboard - Ranking dos jogadores e gráfico do score do usuário e a média dos jogadores
<img src="./public/assets/imgs/rankingSS.png">

### Dashboard - Gráfico mostrando a variação dos scores a cada tentativa e a data de cada tentativa
<img src="./public/assets/imgs/tentativaSS.png">

### Fórum
<img src="./public/assets/imgs/forumSS.png">

