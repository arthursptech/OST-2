// sessão
// Quem diz se o usuário está logado é o servidor (cookie de sessão assinado). O nome e o id
// no sessionStorage servem só para mostrar na tela.
function validarSessao() {
    var tinhaDados = sessionStorage.ID_USUARIO != null && sessionStorage.NOME_USUARIO != null;
    if (tinhaDados) mostrarUsuario();

    fetch("/usuarios/eu", { cache: "no-store" })
        .then(function (resposta) {
            if (!resposta.ok) throw new Error("sessão inválida");
            return resposta.json();
        })
        .then(function (usuario) {
            sessionStorage.EMAIL_USUARIO = usuario.email;
            sessionStorage.NOME_USUARIO = usuario.nome;
            sessionStorage.ID_USUARIO = usuario.id;
            // A aba foi reaberta com a sessão ainda válida: recarrega para a página usar os dados
            if (!tinhaDados) window.location.reload();
        })
        .catch(function () {
            sessionStorage.clear();
            window.location = "../login.html";
        });
}

function mostrarUsuario() {
    var b_usuario = document.getElementById("b_usuario");
    var b_id = document.getElementById("b_id");
    if (b_usuario) b_usuario.textContent = sessionStorage.NOME_USUARIO;
    if (b_id) b_id.textContent = sessionStorage.ID_USUARIO;
}

function limparSessao() {
    sessionStorage.clear();
    fetch("/usuarios/sair", { method: "POST" }).finally(function () {
        window.location = "../login.html";
    });
}

// Resposta 401 do servidor: a sessão acabou (expirou ou o usuário saiu em outra aba)
function sessaoExpirada() {
    window.alert("Sua sessão expirou. Faça login novamente.");
    sessionStorage.clear();
    window.location = "../login.html";
}

// carregamento (loading)
function aguardar() {
    var divAguardar = document.getElementById("div_aguardar");
    divAguardar.style.display = "flex";
}

function finalizarAguardar(texto) {
    var divAguardar = document.getElementById("div_aguardar");
    divAguardar.style.display = "none";

    var divErrosLogin = document.getElementById("div_erros_login");
    if (texto) {
        divErrosLogin.style.display = "flex";
        divErrosLogin.innerHTML = texto;
    }
}

