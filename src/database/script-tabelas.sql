-- Arquivo de apoio, caso você queira criar tabelas como as aqui criadas para a API funcionar.
-- Você precisa executar os comandos no banco de dados para criar as tabelas,
-- ter este arquivo aqui não significa que a tabela em seu BD estará como abaixo!

/*
comandos para mysql server
*/

CREATE DATABASE ost;

USE ost;

CREATE TABLE usuario (
	id INT PRIMARY KEY AUTO_INCREMENT,
	nome VARCHAR(50),
	email VARCHAR(60),
	senha VARCHAR(50)
);

CREATE TABLE mensagem (
	id INT PRIMARY KEY AUTO_INCREMENT,
	titulo VARCHAR(100),
	descricao VARCHAR(150),
	fkUsuario INT,
	FOREIGN KEY (fkUsuario) REFERENCES usuario(id)
);

CREATE TABLE ranking (
	id INT PRIMARY KEY AUTO_INCREMENT,
	qtd_acertos INT,
	dtHrRegistro DATETIME DEFAULT NOW(),
	fkUsuario INT,
	CONSTRAINT cFkUsuario FOREIGN KEY (fkUsuario)
	REFERENCES usuario(id)
);

CREATE TABLE perguntas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    questao VARCHAR(3)
);

CREATE TABLE alternativas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    titulo VARCHAR(60),
    origem VARCHAR(60),
    tipo TINYINT,
    fkPergunta INT,
    FOREIGN KEY (fkPergunta) REFERENCES perguntas(id)
);


CREATE TABLE respostasUser (
    id INT PRIMARY KEY AUTO_INCREMENT,
    fkAlternativa INT,
    fkUsuario INT,
    FOREIGN KEY (fkAlternativa) REFERENCES alternativas(id),
    FOREIGN KEY (fkUsuario) REFERENCES usuario(id)
);

INSERT INTO perguntas (questao) VALUES
('Q1'),
('Q2'),
('Q3'),
('Q4'),
('Q5'),
('Q6'),
('Q7'),
('Q8'),
('Q9'),
('Q10');

INSERT INTO alternativas (titulo, origem, tipo, fkPergunta) VALUES
('Test Drive', 'Como Treinar seu Dragão', 1, 1),
(null, 'Robot Trains', 0, 1),
(null, 'Kung Fu Panda', 0, 1),
(null, 'O Rei Leão', 0, 1),
(null, 'Jujutsu Kaisen', 0, 2),
(null, 'Fate/stay night UBW', 0, 2),
(null, '86: Eighty Six', 1, 2),
(null, 'Sword Art Online', 0, 2),
(null, 'Kimetsu no Yaiba', 0, 3),
(null, 'Re:Creators', 0, 3),
(null, 'Hunter x Hunter', 1, 3),
(null, 'One Piece', 0, 3),
(null, 'Steins;Gate', 0, 4),
(null, 'Umineko', 1, 4),
(null, 'Danganronpa', 0, 4),
(null, 'Higurashi', 0, 4),
(null, 'Oppenheimer', 0, 5),
(null, 'The Batman', 0, 5),
(null, 'Inception', 1, 5),
(null, 'Interstellar', 0, 5),
(null, 'Nier:Automata', 1, 6),
(null, 'Kingdom Hearts', 0, 6),
(null, 'Detroit: Become Human', 0, 6),
(null, 'Minecraft', 0, 6),
(null, 'Dune', 0, 7),
(null, 'Shin Godzilla', 1, 7),
(null, 'Avengers Infinity War', 0, 7),
(null, 'Inception', 0, 7),
(null, 'Lord of the Mysteries', 0, 8),
(null, 'Solo Leveling', 0, 8),
(null, 'Frieren', 1, 8),
(null, 'Shingeki no Kyojin', 0, 8),
(null, 'Cyberpunk', 0, 9),
(null, 'Finding Paradise', 0, 9),
(null, 'Outer Wilds', 1, 9),
(null, 'Honkai: Star Rail', 0, 9),
(null, 'Final Fantasy XV', 1, 10),
(null, 'Kabaneri of the Iron Fortress', 0, 10),
(null, 'Steins;Gate', 0, 10),
(null, 'Hello Charlotte', 0, 10);

select * from usuario;
INSERT INTO ranking (qtd_acertos, fkUsuario)
SELECT 
    COUNT(a.id) AS qtd_acertos,
    ru.fkUsuario
FROM respostasUser ru
JOIN alternativas a ON ru.fkAlternativa = a.id
WHERE ru.fkUsuario = 4 AND a.tipo = 1
GROUP BY ru.fkUsuario;


-- Insert da questao, alternativa, e do usuario na tabela de respostas do Usuário
INSERT INTO respostasUser (fkAlternativa, fkUsuario) VALUES;

-- Desconhecido
select questao, alternativas.* from alternativas JOIN perguntas on fkPergunta = perguntas.id WHERE questao = 'Q1';

select * from usuario;

select quiz.*, a.* from quiz join alternativas a on alternativa1 = a.id;

-- Buscar top usuário
SELECT fkUsuario, nome FROM ranking JOIN usuario ON fkUsuario = usuario.id ORDER BY qtd_acertos DESC LIMIT 1;

-- Gráfico
SELECT nome, fkUsuario, qtd_acertos FROM ranking JOIN usuario ON fkUsuario = usuario.id ORDER BY qtd_acertos DESC;

-- Buscar a média de acertos do quiz
SELECT ROUND(AVG(qtd_acertos),0) media FROM ranking;