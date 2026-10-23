// Serviço responsável por montar o quiz a partir do Last.fm do usuário e da playlist do Spotify configurados.
//
// APIs utilizadas (todas gratuitas):
// - Last.fm   -> músicas mais ouvidas do usuário + tags (gênero) e álbum de cada música (precisa de LASTFM_API_KEY)
// - Spotify     -> músicas da playlist de OSTs + trecho (preview de 30s) da gravação da playlist
// - AnimeThemes -> aberturas/encerramentos de anime: identifica o anime e traz o áudio oficial (sem chave)
// - iTunes      -> trecho (preview de 30s) da versão oficial da música, álbum e capa (sem chave)
// - Deezer      -> fallback do trecho, do álbum e da capa (sem chave)
// - AniList     -> imagem do anime (sem chave)
// - Wikipedia   -> imagem da mídia (filme, jogo, série...) (sem chave)

var fs = require("fs");
var path = require("path");

var LASTFM_API = "https://ws.audioscrobbler.com/2.0/";
var LASTFM_USER = process.env.LASTFM_USER || "MsAqua";
var LIMITE_MUSICAS = Number(process.env.LASTFM_LIMITE_MUSICAS) || 200;

// Tags do Last.fm consideradas como gênero "Original Soundtrack"
var TAGS_OST = [
    "original soundtrack",
    "soundtrack",
    "soundtracks",
    "ost",
    "anime soundtrack",
    "game soundtrack",
    "video game soundtrack",
    "videogame soundtrack",
    "video game music",
    "movie soundtrack",
    "film soundtrack",
    "film score",
    "score",
    "original score"
];

// Descrições da Wikipedia que indicam uma mídia (filme, anime, jogo...)
var DESCRICAO_MIDIA = /\b(film|movie|anime|manga|video game|game|television|tv series|series|visual novel|light novel|novel|franchise|musical|ova)\b/i;

var CACHE_MUSICAS_MS = 24 * 60 * 60 * 1000;
var TIMEOUT_MS = 8000;

// As APIs têm limite de requisições por minuto (iTunes ~20, AniList ~30, AnimeThemes ~90), então as
// buscas são espaçadas e os resultados ficam salvos em disco (pasta cache/)
var INTERVALO_ITUNES_MS = 3000;
var INTERVALO_ANILIST_MS = 2100;
var INTERVALO_ANIMETHEMES_MS = 700;
var INTERVALO_SPOTIFY_MS = 1000;
var PASTA_CACHE = path.join(__dirname, "../../cache");

// Palavras que indicam uma versão alternativa (cover, remix, ao vivo...) e não a gravação oficial
var PALAVRAS_VERSAO = ["cover", "covered", "remix", "mix", "karaoke", "instrumental", "piano", "acoustic", "live",
    "arrange", "arranged", "rearranged", "version", "tv size", "short", "edit", "orchestral", "orchestra",
    "guitar", "lofi", "lo fi", "8 bit", "music box", "lullaby", "tribute", "medley", "symphonic", "concert",
    "nightcore", "slowed", "reverb", "sped up", "relax", "relaxing", "chill", "chillwave", "sleep", "study"];

var cacheMusicas = { lista: null, atualizadoEm: 0, carregando: null };

// Quando uma API está fora do ar, deixamos de consultá-la por um tempo para o quiz não ficar lento
var PAUSA_FONTE_MS = 5 * 60 * 1000;
var fontesPausadas = new Map();

function fontePausada(fonte) {
    return (fontesPausadas.get(fonte.name) || 0) > Date.now();
}

function registrarErroFonte(fonte, erro) {
    console.log(`Erro ao buscar dados (${fonte.name}): ${erro.message}`);
    // Timeout ou falha de conexão (não é só "não encontrado")
    if (erro.name === "TimeoutError" || erro.name === "AbortError" || erro.cause) {
        fontesPausadas.set(fonte.name, Date.now() + PAUSA_FONTE_MS);
    }
}

async function buscarJson(url, tentativas = 3, timeoutMs = TIMEOUT_MS) {
    var resposta = await fetch(url, {
        headers: { "User-Agent": "OST-Projeto-Individual/1.0 (https://github.com/arthursptech/Projeto-Individual)" },
        signal: AbortSignal.timeout(timeoutMs)
    });
    // Muitas requisições seguidas (rate limit): espera um pouco e tenta de novo
    if (resposta.status === 429 && tentativas > 1) {
        await new Promise(function (resolve) { setTimeout(resolve, 1500); });
        return buscarJson(url, tentativas - 1, timeoutMs);
    }
    if (!resposta.ok) {
        throw new Error(`HTTP ${resposta.status} em ${url}`);
    }
    return resposta.json();
}

// Cache simples em disco: cada API tem o seu arquivo JSON
function criarCacheDisco(nome) {
    var arquivo = path.join(PASTA_CACHE, `${nome}.json`);
    var dados = {};
    try {
        dados = JSON.parse(fs.readFileSync(arquivo, "utf8"));
    } catch (erro) { }
    return {
        tem: function (chave) { return chave in dados; },
        ler: function (chave) { return dados[chave]; },
        salvar: function (chave, valor) {
            dados[chave] = valor;
            try {
                fs.mkdirSync(PASTA_CACHE, { recursive: true });
                fs.writeFileSync(arquivo, JSON.stringify(dados, null, 1));
            } catch (erro) {
                console.log(`Não foi possível salvar o cache ${nome}: `, erro.message);
            }
        }
    };
}

// Garante um intervalo mínimo entre as chamadas de uma API
function criarFila(intervaloMs) {
    var proxima = 0;
    return async function aguardarVez() {
        var agora = Date.now();
        var espera = Math.max(0, proxima - agora);
        proxima = Math.max(agora, proxima) + intervaloMs;
        if (espera) await new Promise(function (resolve) { setTimeout(resolve, espera); });
    };
}

var cacheItunes = criarCacheDisco("itunes");
var cacheAnimeThemes = criarCacheDisco("animethemes");
var cacheImagens = criarCacheDisco("imagens");
var cacheSpotify = criarCacheDisco("spotify");
var cacheAniList = criarCacheDisco("anilist");
var aguardarVezItunes = criarFila(INTERVALO_ITUNES_MS);
var aguardarVezAniList = criarFila(INTERVALO_ANILIST_MS);
var aguardarVezAnimeThemes = criarFila(INTERVALO_ANIMETHEMES_MS);
var aguardarVezSpotify = criarFila(INTERVALO_SPOTIFY_MS);

function lastfm(parametros) {
    var query = new URLSearchParams({
        ...parametros,
        api_key: process.env.LASTFM_API_KEY,
        format: "json"
    });
    return buscarJson(`${LASTFM_API}?${query}`).then(function (json) {
        if (json.error) {
            throw new Error(`Last.fm: ${json.message}`);
        }
        return json;
    });
}

// Executa as funções com no máximo `limite` requisições simultâneas (evita estourar o rate limit das APIs)
async function emLotes(itens, limite, funcao) {
    var resultados = new Array(itens.length);
    var proximo = 0;
    async function trabalhador() {
        while (proximo < itens.length) {
            var i = proximo++;
            try {
                resultados[i] = await funcao(itens[i]);
            } catch (erro) {
                resultados[i] = null;
            }
        }
    }
    var trabalhadores = [];
    for (var t = 0; t < Math.min(limite, itens.length); t++) {
        trabalhadores.push(trabalhador());
    }
    await Promise.all(trabalhadores);
    return resultados;
}

function normalizar(texto) {
    return (texto || "")
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .trim();
}

function ehTagOst(tag) {
    return TAGS_OST.includes((tag.name || "").toLowerCase().trim());
}

function lerTags(json) {
    var tags = json && json.toptags && json.toptags.tag;
    if (!tags) return [];
    return Array.isArray(tags) ? tags : [tags];
}

function melhorImagemLastfm(imagens) {
    if (!Array.isArray(imagens)) return null;
    var url = imagens.length ? imagens[imagens.length - 1]["#text"] : "";
    // A imagem padrão (estrela) do Last.fm não interessa
    if (!url || url.includes("2a96cbd8b46e442fc41c2b86b821562f")) return null;
    return url;
}

// Converte o nome do álbum no nome da mídia (anime, filme, jogo...)
// Ex.: "Shingeki no Kyojin Original Soundtrack" -> "Shingeki no Kyojin"
function extrairMidia(album) {
    if (!album) return null;
    // Converte caracteres de largura total ("８６") para os normais ("86")
    album = album.normalize("NFKC");
    // Em álbuns japoneses o nome da obra costuma vir entre 「」 ou 『』
    var japones = album.match(/[「『]([^」』]+)[」』]/);
    if (japones) return japones[1].trim();

    var midia = album
        .replace(/(オリジナル・?サウンドトラック|コンプリート・?サウンドトラック|サウンドトラック|ミュージックコレクション|音楽集|劇場版|TVアニメ|テレビアニメ|オリジナル|コンプリート)\s*\d*/g, " ");
    // Remove os trechos entre parênteses/colchetes (inclusive aninhados), de dentro para fora
    var anterior;
    do {
        anterior = midia;
        midia = midia.replace(/[\(\[\{【「『][^\(\)\[\]\{\}【】「」『』]*[\)\]\}】」』]/g, " ");
    } while (midia !== anterior);
    midia = midia
        .replace(/\s+-\s+(single|ep)\s*$/i, " ")
        .replace(/\b(music from( the)?|music of( the)?|selections from( the)?|the very best of|best of)\b/gi, " ")
        .replace(/\b(original|motion picture|tv anime|tv animation|television|video game|deluxe|complete|expanded|edition|orchestral|arrangement|album|piano)\b/gi, " ")
        .replace(/\b(soundtracks?|ost|o\.s\.t\.?|score|sound ?track|bgm|music|collection|vol\.?\s*\d+|volume\s*\d+|disc\s*\d+|part\s*\d+|pt\.?\s*\d+)\b/gi, " ")
        .replace(/[\(\)\[\]\{\}【】「」『』]/g, " ")
        .replace(/[-–—:~\/|]+\s*$/g, " ")
        .replace(/^\s*[-–—:~\/|]+/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .replace(/[-–—:~,\/|]+$/g, "")
        .replace(/^["“”']+|["“”']+$/g, "")
        .trim();
    // Álbuns de duas versões de uma obra ("NieR Gestalt & NieR RepliCant"): usamos a versão mais recente (a última)
    var versoes = midia.split(/\s+&\s+/);
    if (versoes.length === 2 && versoes[0].split(" ").length >= 2) {
        var franquia = versoes[0].split(" ")[0];
        midia = normalizar(versoes[1]).startsWith(normalizar(franquia)) ? versoes[1] : `${franquia} ${versoes[1]}`;
    }
    return midia.length >= 2 ? midia : album;
}

// Singles de tema costumam trazer o nome da obra no álbum:
// "Da Capo (Honkai Impact 3rd "Graduation Trip" Animated Short Theme Song) - Single" -> "Honkai Impact 3rd"
// "Hikari (游戏《战双帕弥什: 九龙环城》主题曲) - Single" -> "战双帕弥什: 九龙环城"
function extrairMidiaDeTema(album) {
    if (!album) return null;
    var chines = album.match(/《([^》]+)》/);
    if (chines) return chines[1].trim();
    // "Next to you (from Parasyte)" -> "Parasyte"
    var de = album.match(/\(from ["“]?([^)"”]+?)["”]?\)/i);
    if (de) return de[1].trim();
    var tema = album.match(/\(([^()"“]+?)\s*(?:["“][^"”]*["”]\s*)?(?:animated short |anime |game |opening |ending |main )?(?:theme song|theme|opening|ending)\)/i);
    return tema ? tema[1].replace(/^(from|tv anime|anime|game)\s+/i, "").trim() : null;
}

// Indica se o nome do álbum é de uma trilha sonora (e não uma coletânea, single, best of...)
function ehAlbumTrilha(album) {
    return /soundtrack|\bost\b|o\.s\.t|original score|music from|music collection|サウンドトラック|オリジナル|ミュージックコレクション|音楽集/i.test(album || "");
}

// ---------- Last.fm ----------

// Músicas mais ouvidas do usuário que têm a tag (gênero) Original Soundtrack
async function detalharMusicaLastfm(item) {
    var info = await lastfm({
        method: "track.getInfo",
        artist: item.artist.name,
        track: item.name,
        autocorrect: 1
    });
    var track = info.track || {};
    var tags = lerTags(track);

    // Quando a música não tem tags, usamos as tags do artista
    if (tags.length === 0) {
        var infoArtista = await lastfm({ method: "artist.getTopTags", artist: item.artist.name, autocorrect: 1 });
        tags = lerTags(infoArtista).slice(0, 10);
    }

    if (!tags.some(ehTagOst)) return null;

    return {
        titulo: item.name,
        artista: item.artist.name,
        album: track.album ? track.album.title : null,
        imagemAlbum: track.album ? melhorImagemLastfm(track.album.image) : null,
        origem: "lastfm"
    };
}

async function carregarMusicasLastfm() {
    if (!process.env.LASTFM_API_KEY) {
        console.log("LASTFM_API_KEY não configurada no arquivo .env: músicas do Last.fm ignoradas");
        return [];
    }

    var topTracks = [];
    var pagina = 1;
    while (topTracks.length < LIMITE_MUSICAS) {
        var json = await lastfm({
            method: "user.getTopTracks",
            user: LASTFM_USER,
            period: "overall",
            limit: Math.min(200, LIMITE_MUSICAS),
            page: pagina
        });
        var tracks = (json.toptracks && json.toptracks.track) || [];
        topTracks = topTracks.concat(tracks);
        var totalPaginas = Number(json.toptracks["@attr"].totalPages);
        if (tracks.length === 0 || pagina >= totalPaginas) break;
        pagina++;
    }
    topTracks = topTracks.slice(0, LIMITE_MUSICAS);

    var lista = (await emLotes(topTracks, 5, detalharMusicaLastfm)).filter(Boolean);
    console.log(`Last.fm: ${lista.length} músicas OST encontradas de ${topTracks.length} músicas de ${LASTFM_USER}`);
    return lista;
}

// ---------- Spotify ----------
// A playlist já é só de OSTs, então todas as músicas entram (sem filtro de gênero)

// O Spotify só libera o conteúdo da playlist com o login do dono dela (fluxo "Authorization Code").
// O login é feito uma vez em /spotify/login; o refresh token fica salvo em cache/spotify-login.json
var ARQUIVO_LOGIN_SPOTIFY = path.join(PASTA_CACHE, "spotify-login.json");
var REDIRECT_URI_SPOTIFY = process.env.SPOTIFY_REDIRECT_URI || "http://127.0.0.1:8080/spotify/callback";

function lerLoginSpotify() {
    try {
        return JSON.parse(fs.readFileSync(ARQUIVO_LOGIN_SPOTIFY, "utf8"));
    } catch (erro) {
        return null;
    }
}

function urlLoginSpotify(estado) {
    var query = new URLSearchParams({
        client_id: process.env.SPOTIFY_CLIENT_ID,
        response_type: "code",
        redirect_uri: REDIRECT_URI_SPOTIFY,
        scope: "playlist-read-private playlist-read-collaborative",
        state: estado
    });
    return `https://accounts.spotify.com/authorize?${query}`;
}

async function pedirTokenSpotify(parametros) {
    var credenciais = Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString("base64");
    var resposta = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: { "Authorization": `Basic ${credenciais}`, "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(parametros).toString(),
        signal: AbortSignal.timeout(TIMEOUT_MS)
    });
    var json = await resposta.json().catch(function () { return {}; });
    if (!resposta.ok) {
        throw new Error(`Spotify: não foi possível autenticar (${json.error_description || json.error || `HTTP ${resposta.status}`})`);
    }
    return json;
}

// Chamado pela rota /spotify/callback com o código que o Spotify devolve após o login
async function concluirLoginSpotify(codigo) {
    var json = await pedirTokenSpotify({ grant_type: "authorization_code", code: codigo, redirect_uri: REDIRECT_URI_SPOTIFY });
    fs.mkdirSync(PASTA_CACHE, { recursive: true });
    fs.writeFileSync(ARQUIVO_LOGIN_SPOTIFY, JSON.stringify({ refresh_token: json.refresh_token }));

    // Recarrega a lista de músicas já com a playlist completa
    cacheMusicas.atualizadoEm = 0;
    listarMusicasOst().catch(function (erro) {
        console.log("Erro ao recarregar as músicas: ", erro.message);
    });
}

async function tokenSpotify() {
    var login = lerLoginSpotify();
    if (!login || !login.refresh_token) {
        throw new Error("Spotify: faça o login em /spotify/login para ler a playlist completa");
    }
    var json = await pedirTokenSpotify({ grant_type: "refresh_token", refresh_token: login.refresh_token });
    // O Spotify às vezes devolve um refresh token novo
    if (json.refresh_token) fs.writeFileSync(ARQUIVO_LOGIN_SPOTIFY, JSON.stringify({ refresh_token: json.refresh_token }));
    return json.access_token;
}

// Web API: playlist completa, com álbum e capa (precisa de SPOTIFY_CLIENT_ID e SPOTIFY_CLIENT_SECRET)
async function carregarPlaylistWebApi(idPlaylist) {
    var token = await tokenSpotify();
    var musicas = [];
    var url = `https://api.spotify.com/v1/playlists/${idPlaylist}/items?limit=50`;
    while (url) {
        var resposta = await fetch(url, {
            headers: { "Authorization": `Bearer ${token}` },
            signal: AbortSignal.timeout(TIMEOUT_MS)
        });
        if (!resposta.ok) throw new Error(`Spotify: erro ao ler a playlist (HTTP ${resposta.status})`);
        var json = await resposta.json();
        (json.items || []).forEach(function (item) {
            var track = item.track || item.item;
            if (!track || track.type !== "track") return;
            var imagens = (track.album && track.album.images) || [];
            musicas.push({
                id: track.id,
                titulo: track.name,
                artista: (track.artists || []).map(function (a) { return a.name; })[0] || "",
                album: track.album ? track.album.name : null,
                imagemAlbum: imagens.length ? imagens[0].url : null,
                previewSpotify: track.preview_url || null,
                origem: "spotify"
            });
        });
        url = json.next;
    }
    return musicas;
}

// Página pública de "embed" da playlist: não precisa de credenciais, mas só traz as 100 primeiras músicas
// e não informa o álbum (que depois é descoberto pelo iTunes/Deezer)
async function carregarPlaylistEmbed(idPlaylist) {
    var resposta = await fetch(`https://open.spotify.com/embed/playlist/${idPlaylist}`, {
        headers: { "User-Agent": "Mozilla/5.0" },
        signal: AbortSignal.timeout(TIMEOUT_MS)
    });
    if (!resposta.ok) throw new Error(`Spotify: erro ao ler a playlist (HTTP ${resposta.status})`);
    var html = await resposta.text();
    var dados = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
    if (!dados) throw new Error("Spotify: formato da página de embed mudou");
    var entidade = JSON.parse(dados[1]).props.pageProps.state.data.entity;
    return (entidade.trackList || []).map(function (track) {
        return {
            id: (track.uri || "").split(":").pop(),
            titulo: track.title,
            artista: (track.subtitle || "").split(",")[0].trim(),
            album: null,
            imagemAlbum: null,
            previewSpotify: track.audioPreview ? track.audioPreview.url : null,
            origem: "spotify"
        };
    });
}

// O embed não informa o álbum, mas a página pública da música informa:
// <meta property="og:description" content="James Harris · Fate/stay night [Unlimited Blade Works] Original Soundtrack · Song · 2020"/>
async function buscarAlbumSpotify(idMusica) {
    if (cacheSpotify.tem(idMusica)) return cacheSpotify.ler(idMusica);

    await aguardarVezSpotify();
    var resposta = await fetch(`https://open.spotify.com/track/${idMusica}`, {
        headers: { "User-Agent": "Mozilla/5.0" },
        signal: AbortSignal.timeout(TIMEOUT_MS)
    });
    if (!resposta.ok) throw new Error(`Spotify: erro ao ler a música ${idMusica} (HTTP ${resposta.status})`);
    var html = await resposta.text();
    var descricao = html.match(/<meta property="og:description" content="([^"]*)"/);
    var imagem = html.match(/<meta property="og:image" content="([^"]*)"/);
    var partes = descricao ? decodificarHtml(descricao[1]).split(" · ") : [];

    var resultado = {
        // "Artista · Álbum · Song · Ano": o álbum é o penúltimo item antes de "Song"
        album: partes.length >= 4 ? partes.slice(1, -2).join(" · ") : null,
        imagem: imagem ? imagem[1] : null
    };
    cacheSpotify.salvar(idMusica, resultado);
    return resultado;
}

function decodificarHtml(texto) {
    return texto
        .replace(/&#x([0-9a-f]+);/gi, function (_, hex) { return String.fromCodePoint(parseInt(hex, 16)); })
        .replace(/&#(\d+);/g, function (_, dec) { return String.fromCodePoint(Number(dec)); })
        .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
}

async function carregarMusicasSpotify() {
    var idPlaylist = process.env.SPOTIFY_PLAYLIST_ID;
    if (!idPlaylist) return [];

    var musicas = [];
    if (process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET) {
        try {
            musicas = await carregarPlaylistWebApi(idPlaylist);
        } catch (erro) {
            console.log(`${erro.message}. Usando a página pública da playlist (100 primeiras músicas)`);
        }
    }

    // O embed traz o trecho (preview) das músicas, que a Web API não fornece mais para apps novos
    var embed = [];
    try {
        embed = await carregarPlaylistEmbed(idPlaylist);
    } catch (erro) {
        console.log(erro.message);
    }
    if (musicas.length === 0) {
        musicas = embed;
    } else {
        var previews = new Map(embed.map(function (m) { return [m.id, m.previewSpotify]; }));
        musicas.forEach(function (m) { m.previewSpotify = m.previewSpotify || previews.get(m.id) || null; });
    }

    // Músicas sem álbum (vindas do embed): busca o álbum e a capa na página pública de cada uma
    await emLotes(musicas.filter(function (m) { return !m.album && m.id; }), 2, async function (musica) {
        try {
            var dados = await buscarAlbumSpotify(musica.id);
            musica.album = dados.album;
            musica.imagemAlbum = dados.imagem;
        } catch (erro) {
            console.log(erro.message);
        }
    });

    console.log(`Spotify: ${musicas.length} músicas na playlist ${idPlaylist}`);
    return musicas;
}

// ---------- Dados completos de cada música ----------

// Descobre o áudio, o álbum e a mídia (anime, filme, jogo...) de uma música do Last.fm ou do Spotify
async function completarMusica(musica) {
    // Abertura/encerramento de anime? (AnimeThemes)
    try {
        musica.animeTheme = await buscarAnimeTheme(musica);
    } catch (erro) {
        console.log(`Erro ao buscar no AnimeThemes: ${erro.message}`);
    }

    // Versão oficial da música no iTunes (ou Deezer): trecho, álbum e capa.
    // Músicas do Spotify que já têm trecho e álbum não precisam dessa busca (o iTunes tem limite de buscas)
    var oficial = {};
    if (!(musica.previewSpotify && musica.album)) {
        oficial = await buscarVersaoOficial(musica) || {};
    }
    var temAudio = oficial.fonte || musica.previewSpotify || (musica.animeTheme && musica.animeTheme.audio);
    if (!temAudio) return null;
    musica.audio = oficial.fonte ? oficial : null;

    // O álbum do Last.fm pode ser uma coletânea (ex.: Somnus em "drammatica"), então preferimos
    // o álbum da trilha sonora original encontrado no iTunes/Deezer (ex.: "FINAL FANTASY XV (Original Soundtrack)")
    if (oficial.album && (!musica.album || (!ehAlbumTrilha(musica.album) && ehAlbumTrilha(oficial.album)))) {
        musica.album = oficial.album;
        musica.imagemAlbum = oficial.capa || musica.imagemAlbum;
    }
    musica.imagemAlbum = musica.imagemAlbum || oficial.capa;

    if (!musica.album && !musica.animeTheme) return null;

    if (musica.animeTheme) {
        // O AnimeThemes já diz de qual anime é (ex.: "Duvet" da bôa -> Serial Experiments Lain)
        musica.midia = musica.animeTheme.anime;
        musica.ehAnime = true;
        musica.midiaConhecida = true;
    } else {
        // O tema do álbum do iTunes/Deezer só vale se o álbum original não for uma trilha sonora
        var midiaDeTema = extrairMidiaDeTema(musica.album)
            || (!ehAlbumTrilha(musica.album) && extrairMidiaDeTema(oficial.album));
        musica.midia = midiaDeTema || extrairMidia(musica.album);
        // Só sabemos a obra quando o álbum é uma trilha sonora ou um tema; em álbuns de estúdio/singles
        // buscar a "mídia" traria imagens de outra coisa com o mesmo nome
        musica.midiaConhecida = Boolean(midiaDeTema) || ehAlbumTrilha(musica.album);
    }

    // Se a obra for um anime no AniList, usamos o nome oficial dele: assim "キルラキル" (Spotify) e
    // "KILL la KILL" (Last.fm) viram a mesma alternativa, e a imagem já vem junto
    if (musica.midiaConhecida) {
        try {
            var anime = await buscarAnimeAniList(musica.midia);
            if (anime) {
                musica.midia = anime.titulo;
                musica.imagemAnime = anime.imagem;
                musica.ehAnime = true;
            }
        } catch (erro) {
            registrarErroFonte(buscarImagemAniList, erro);
        }
    }
    return musica;
}

// Junta as músicas do Spotify e do Last.fm sem repetir (a mesma música pode estar nas duas).
// Quando repete, completa os dados que faltam com os da outra fonte (ex.: álbum do Last.fm + trecho do Spotify)
function juntarSemRepetir(listas) {
    var porChave = new Map();
    listas.flat().forEach(function (musica) {
        var chave = tituloBase(musica.titulo) || musica.titulo;
        var existente = porChave.get(chave);
        if (!existente) {
            porChave.set(chave, musica);
            return;
        }
        ["album", "imagemAlbum", "previewSpotify", "id"].forEach(function (campo) {
            if (!existente[campo] && musica[campo]) existente[campo] = musica[campo];
        });
        existente.origem = `${existente.origem}+${musica.origem}`;
    });
    return Array.from(porChave.values());
}

async function carregarMusicasOst() {
    var listas = await Promise.all([
        carregarMusicasSpotify().catch(function (erro) {
            console.log("Erro ao carregar a playlist do Spotify: ", erro.message);
            return [];
        }),
        carregarMusicasLastfm()
    ]);
    var musicas = juntarSemRepetir(listas);
    if (musicas.length === 0) {
        throw new Error("Nenhuma música encontrada: configure LASTFM_API_KEY e/ou SPOTIFY_PLAYLIST_ID no arquivo .env");
    }

    var lista = (await emLotes(musicas, 3, completarMusica)).filter(Boolean);
    console.log(`Total: ${lista.length} músicas OST disponíveis para o quiz`);
    return lista;
}

// Lista de músicas OST do usuário, com cache de 24h
async function listarMusicasOst() {
    var expirado = Date.now() - cacheMusicas.atualizadoEm > CACHE_MUSICAS_MS;
    if (cacheMusicas.lista && !expirado) {
        return cacheMusicas.lista;
    }
    if (!cacheMusicas.carregando) {
        cacheMusicas.carregando = carregarMusicasOst()
            .then(function (lista) {
                cacheMusicas.lista = lista;
                cacheMusicas.atualizadoEm = Date.now();
                return lista;
            })
            .finally(function () {
                cacheMusicas.carregando = null;
            });
    }
    // Se já temos uma lista antiga, usamos ela enquanto a nova carrega
    if (cacheMusicas.lista) return cacheMusicas.lista;
    return cacheMusicas.carregando;
}

// ---------- Trecho da música (preview) ----------

function tituloBase(titulo) {
    return normalizar((titulo || "").replace(/[\(\[<].*?[\)\]>]/g, " ").replace(/\s+-\s+.*$/, " "));
}

function palavrasVersao(texto) {
    var normalizado = ` ${normalizar(texto)} `;
    return PALAVRAS_VERSAO.filter(function (palavra) { return normalizado.includes(` ${palavra} `); });
}

// Pontua um resultado do iTunes/Deezer: quanto maior, mais provável de ser a gravação oficial
function pontuarResultado(musica, resultado) {
    var titulo = tituloBase(musica.titulo);
    var tituloResultado = tituloBase(resultado.titulo);
    if (!titulo || !tituloResultado) return -Infinity;

    var pontos;
    if (normalizar(resultado.titulo) === normalizar(musica.titulo)) pontos = 5;
    else if (tituloResultado === titulo) pontos = 4;
    else if (tituloResultado.includes(titulo) || titulo.includes(tituloResultado)) pontos = 2;
    else return -Infinity;

    if (titulosParecidos(resultado.artista, musica.artista)) {
        pontos += 2;
    } else if (normalizar(resultado.artista) && normalizar(musica.artista)) {
        // Artistas diferentes (só dá para comparar quando os dois nomes estão em alfabeto latino;
        // "下村陽子" e "Yoko Shimomura" são a mesma pessoa)
        pontos -= 5;
    }
    if (ehAlbumTrilha(resultado.album)) pontos += 2;
    if (musica.album) {
        if (titulosParecidos(extrairMidia(resultado.album), extrairMidia(musica.album))) pontos += 2;
        // O álbum do Last.fm já é uma trilha sonora, mas de outra obra
        else if (ehAlbumTrilha(musica.album) && ehAlbumTrilha(resultado.album)) pontos -= 2;
    }

    // Penaliza covers, remixes, versões instrumentais etc. que não fazem parte do nome original da música
    // (o artista entra no original para não penalizar nomes como "HOYO-MiX")
    var original = palavrasVersao(`${musica.titulo} ${musica.album || ""} ${musica.artista}`);
    palavrasVersao(`${resultado.titulo} ${resultado.album} ${resultado.artista}`).forEach(function (palavra) {
        if (!original.includes(palavra)) pontos -= 5;
    });
    // O contrário também: a música do Last.fm é uma versão (ex.: "Orchestra: ...") e o resultado não
    var versoesResultado = palavrasVersao(`${resultado.titulo} ${resultado.album}`);
    palavrasVersao(musica.titulo).forEach(function (palavra) {
        if (!versoesResultado.includes(palavra)) pontos -= 3;
    });
    // Ex.: "Somnus (From \"Final Fantasy XV\")" costuma ser regravação de outro artista
    if (/\(from ["“]/i.test(resultado.titulo)) pontos -= 5;
    return pontos;
}

function melhorResultado(musica, resultados) {
    var melhor = null;
    var melhorPontos = 3; // pontuação mínima para aceitar
    resultados.forEach(function (resultado) {
        if (!resultado.preview) return;
        var pontos = pontuarResultado(musica, resultado);
        if (pontos > melhorPontos) {
            melhor = resultado;
            melhorPontos = pontos;
        }
    });
    return melhor;
}

async function pesquisarItunes(termo) {
    await aguardarVezItunes();
    var url = `https://itunes.apple.com/search?term=${encodeURIComponent(termo)}&entity=song&limit=15`;
    try {
        var json = await buscarJson(url);
    } catch (erro) {
        // O iTunes responde 403 quando o limite de buscas estoura: espera e tenta mais uma vez
        if (!/HTTP 403/.test(erro.message)) throw erro;
        await new Promise(function (resolve) { setTimeout(resolve, 60000); });
        json = await buscarJson(url);
    }
    return (json.results || []).map(function (r) {
        return {
            titulo: r.trackName,
            artista: r.artistName,
            album: r.collectionName,
            preview: r.previewUrl,
            capa: r.artworkUrl100 ? r.artworkUrl100.replace("100x100bb", "600x600bb") : null
        };
    });
}

async function buscarVersaoItunes(musica) {
    var chave = `${musica.artista} - ${musica.titulo}`;
    if (cacheItunes.tem(chave)) return cacheItunes.ler(chave);

    var achado = null;
    for (var termo of [`${musica.titulo} ${musica.artista}`, musica.titulo]) {
        achado = melhorResultado(musica, await pesquisarItunes(termo));
        if (achado) break;
    }
    var resultado = achado
        ? { fonte: "itunes", titulo: achado.titulo, artista: achado.artista, preview: achado.preview, capa: achado.capa, album: achado.album }
        : null;
    cacheItunes.salvar(chave, resultado);
    return resultado;
}

async function buscarVersaoDeezer(musica) {
    var consultas = [
        `artist:"${musica.artista}" track:"${musica.titulo}"`,
        `${musica.titulo} ${musica.artista}`,
        musica.titulo
    ];
    for (var consulta of consultas) {
        var json = await buscarJson(`https://api.deezer.com/search?q=${encodeURIComponent(consulta)}&limit=15`);
        var achado = melhorResultado(musica, (json.data || []).map(function (d) {
            return {
                id: d.id,
                titulo: d.title,
                artista: d.artist ? d.artist.name : "",
                album: d.album ? d.album.title : "",
                preview: d.preview,
                capa: d.album ? d.album.cover_xl || d.album.cover_big : null
            };
        }));
        if (achado) {
            // O link do preview do Deezer expira, então guardamos o id para buscar um link novo na hora do quiz
            return { fonte: "deezer", id: achado.id, titulo: achado.titulo, artista: achado.artista, capa: achado.capa, album: achado.album };
        }
    }
    return null;
}

// Aberturas/encerramentos de anime no AnimeThemes: diz de qual anime é a música e traz o áudio oficial
async function buscarAnimeTheme(musica) {
    var chave = `${musica.artista} - ${musica.titulo}`;
    if (cacheAnimeThemes.tem(chave)) return cacheAnimeThemes.ler(chave);

    await aguardarVezAnimeThemes();
    var query = new URLSearchParams({
        q: tituloBase(musica.titulo) || musica.titulo,
        "fields[search]": "animethemes",
        "include[animetheme]": "anime.images,song.artists,animethemeentries.videos.audio"
    });
    // A busca com os detalhes (anime, artistas, áudio) do AnimeThemes costuma demorar mais
    var json = await buscarJson(`https://api.animethemes.moe/search?${query}`, 3, 20000);

    var achado = ((json.search && json.search.animethemes) || []).find(function (tema) {
        if (!tema.song || !tema.anime) return false;
        // O título tem que ser o mesmo e a música tem que ter artista cadastrado
        // (títulos comuns como "Hope" ou "Believe" existem em dezenas de animes)
        var mesmoTitulo = normalizar(tema.song.title) === normalizar(musica.titulo)
            || tituloBase(tema.song.title) === tituloBase(musica.titulo);
        var artistas = (tema.song.artists || []).map(function (a) { return a.name; }).join(" ");
        if (!mesmoTitulo || !normalizar(artistas)) return false;
        // Artista em outro alfabeto (ex.: "梶浦由記" x "Yuki Kajiura"): não dá para comparar, então só aceitamos
        // se o álbum não for a trilha sonora de outra obra (ex.: "The Tower" do álbum de NieR:Automata
        // não é o encerramento "The Tower" de Carole & Tuesday)
        if (!normalizar(musica.artista)) {
            return !ehAlbumTrilha(musica.album) || mesmoNome(extrairMidia(musica.album), tema.anime.name)
                || titulosParecidos(extrairMidia(musica.album), tema.anime.name);
        }
        return titulosParecidos(artistas, musica.artista)
            || normalizar(artistas).split(" ").some(function (p) { return p.length > 2 && normalizar(musica.artista).includes(p); });
    });

    var resultado = null;
    if (achado) {
        var audio = null;
        (achado.animethemeentries || []).some(function (entrada) {
            return (entrada.videos || []).some(function (video) {
                audio = video.audio && video.audio.link;
                return Boolean(audio);
            });
        });
        var capa = (achado.anime.images || []).find(function (i) { return i.facet === "Large Cover"; });
        resultado = {
            anime: achado.anime.name,
            tema: `${achado.type}${achado.sequence || ""}`,
            audio: audio,
            capa: capa ? capa.link : null
        };
    }
    cacheAnimeThemes.salvar(chave, resultado);
    return resultado;
}

// Prioridade: iTunes -> Deezer
async function buscarVersaoOficial(musica) {
    for (var fonte of [buscarVersaoItunes, buscarVersaoDeezer]) {
        if (fontePausada(fonte)) continue;
        try {
            var resultado = await fonte(musica);
            if (resultado) return resultado;
        } catch (erro) {
            registrarErroFonte(fonte, erro);
        }
    }
    return null;
}

async function obterPreviewOficial(musica) {
    // O trecho do Spotify é exatamente a gravação que está na playlist
    if (musica.previewSpotify) return musica.previewSpotify;
    if (!musica.audio) return null;
    if (musica.audio.fonte === "itunes") return musica.audio.preview;
    try {
        var json = await buscarJson(`https://api.deezer.com/track/${musica.audio.id}`);
        return json.preview || null;
    } catch (erro) {
        console.log(`Erro ao buscar preview no Deezer: ${erro.message}`);
        return null;
    }
}

// Áudio principal: abertura/encerramento do AnimeThemes (.ogg) quando existir; senão o preview do iTunes/Deezer.
// O preview do iTunes/Deezer (.mp3) vai como alternativo para navegadores que não tocam .ogg
async function obterPreview(musica) {
    var oficial = await obterPreviewOficial(musica);
    var animeTheme = musica.animeTheme && musica.animeTheme.audio;
    var principal = animeTheme || oficial;
    if (!principal) return null;
    return { principal: principal, alternativo: animeTheme ? oficial : null };
}

// ---------- Imagem da mídia ----------

function titulosParecidos(a, b) {
    var na = normalizar(a);
    var nb = normalizar(b);
    if (!na || !nb) return false;
    return na === nb || na.includes(nb) || nb.includes(na);
}

// Compara nomes em japonês ignorando espaços e pontuação ("86―エイティシックス―" = "86 エイティシックス")
function mesmoNome(a, b) {
    if (!a || !b) return false;
    function limpar(t) { return t.normalize("NFKC").toLowerCase().replace(/[\s・\-―—~～:：!！?？.。,、"“”'’\/]/g, ""); }
    return limpar(a) === limpar(b);
}

async function buscarImagemAniList(midia) {
    var anime = await buscarAnimeAniList(midia);
    return anime ? anime.imagem : null;
}

// Procura o anime no AniList pelo nome (romaji, inglês ou japonês) e devolve o nome oficial e a capa
async function buscarAnimeAniList(midia) {
    if (cacheAniList.tem(midia)) return cacheAniList.ler(midia);
    if (fontePausada(buscarImagemAniList)) return null;

    await aguardarVezAniList();
    var resposta = await fetch("https://graphql.anilist.co", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({
            query: `query ($busca: String) {
                Page(perPage: 5) {
                    media(search: $busca, type: ANIME, sort: SEARCH_MATCH) {
                        title { romaji english native }
                        synonyms
                        coverImage { extraLarge large }
                    }
                }
            }`,
            variables: { busca: midia }
        }),
        signal: AbortSignal.timeout(TIMEOUT_MS)
    });
    if (resposta.status === 429) throw new Error("AniList: limite de requisições atingido");
    if (!resposta.ok) throw new Error(`HTTP ${resposta.status} no AniList`);
    var json = await resposta.json();

    var achado = ((json.data && json.data.Page && json.data.Page.media) || []).find(function (anime) {
        var titulos = [anime.title.romaji, anime.title.english, anime.title.native].concat(anime.synonyms || []);
        // Igualdade exata, para não trazer um spin-off/filme com nome parecido
        return titulos.some(function (t) {
            if (!t) return false;
            return mesmoNome(t, midia) || (normalizar(t) && normalizar(t) === normalizar(midia));
        });
    });
    var resultado = achado
        ? { titulo: achado.title.english || achado.title.romaji, imagem: achado.coverImage.extraLarge || achado.coverImage.large }
        : null;
    cacheAniList.salvar(midia, resultado);
    return resultado;
}

async function buscarImagemWikipedia(midia) {
    var query = new URLSearchParams({
        action: "query",
        generator: "search",
        gsrsearch: midia,
        gsrlimit: 3,
        prop: "pageimages|description",
        piprop: "original",
        pilicense: "any",
        format: "json"
    });
    var json = await buscarJson(`https://en.wikipedia.org/w/api.php?${query}`);
    var paginas = Object.values((json.query && json.query.pages) || {})
        .sort(function (a, b) { return a.index - b.index; });
    // Só aceitamos páginas de mídias (evita trazer foto de cidade, pessoa etc. com o mesmo nome)
    paginas = paginas.filter(function (p) {
        return p.original && DESCRICAO_MIDIA.test(p.description || "");
    });
    // Remove o "(film)", "(video game)" etc. do título da página
    function tituloPagina(p) { return p.title.replace(/\s*\(.*\)\s*$/, ""); }
    // Prioridade: título igual -> título que contém o nome completo da mídia (ex.: "Nier Replicant ver.1.22..." e não "Nier")
    // -> nome da mídia que contém o título (ex.: "Attack on Titan Season 2" -> "Attack on Titan")
    var achado = paginas.find(function (p) { return normalizar(tituloPagina(p)) === normalizar(midia); })
        || paginas.find(function (p) { return normalizar(tituloPagina(p)).includes(normalizar(midia)); })
        || paginas.find(function (p) { return titulosParecidos(tituloPagina(p), midia); });
    if (!achado) return null;

    // A página é mais genérica que a mídia (ex.: "Nier" para "NieR Replicant"): procuramos no artigo
    // uma imagem com as palavras que faltam (ex.: "Nier Replicant remake art.png")
    var tituloNormalizado = normalizar(tituloPagina(achado));
    var midiaNormalizada = normalizar(midia);
    if (tituloNormalizado !== midiaNormalizada && midiaNormalizada.includes(tituloNormalizado)) {
        var extras = midiaNormalizada.replace(tituloNormalizado, " ").split(" ").filter(Boolean);
        var variante = await buscarImagemDoArtigo(achado.title, extras);
        if (variante) return variante;
    }
    return achado.original.source;
}

async function buscarImagemDoArtigo(titulo, palavras) {
    var query = new URLSearchParams({ action: "query", titles: titulo, prop: "images", imlimit: 50, format: "json" });
    var json = await buscarJson(`https://en.wikipedia.org/w/api.php?${query}`);
    var pagina = Object.values((json.query && json.query.pages) || {})[0];
    var arquivo = ((pagina && pagina.images) || []).find(function (imagem) {
        var nome = ` ${normalizar(imagem.title)} `;
        return !/\.svg$/i.test(imagem.title) && palavras.every(function (p) { return nome.includes(` ${p} `); });
    });
    if (!arquivo) return null;

    query = new URLSearchParams({ action: "query", titles: arquivo.title, prop: "imageinfo", iiprop: "url", format: "json" });
    json = await buscarJson(`https://en.wikipedia.org/w/api.php?${query}`);
    var info = Object.values((json.query && json.query.pages) || {})[0];
    return info && info.imageinfo ? info.imageinfo[0].url : null;
}

// Prioridade: imagem da mídia (anime -> AniList; filme, jogo... -> Wikipedia) -> imagem do álbum
async function buscarImagem(musica) {
    // Sem imagem da mídia: capa do anime no AnimeThemes -> capa do álbum
    var semImagemMidia = (musica.animeTheme && musica.animeTheme.capa) || musica.imagemAlbum || "../assets/icon/logoOST.png";
    if (!musica.midiaConhecida) return semImagemMidia;
    if (musica.imagemAnime) return musica.imagemAnime;

    if (cacheImagens.tem(musica.midia)) return cacheImagens.ler(musica.midia) || semImagemMidia;

    // Anime confirmado pelo AnimeThemes: só AniList (e a capa do AnimeThemes); senão AniList e depois Wikipedia
    var fontes = musica.ehAnime ? [buscarImagemAniList] : [buscarImagemAniList, buscarImagemWikipedia];
    // Nomes só com caracteres não latinos (ex.: "少女前线") não dão para comparar com as páginas em inglês
    if (!normalizar(musica.midia)) fontes = fontes.filter(function (f) { return f !== buscarImagemWikipedia; });

    var imagemMidia = null;
    var consultouTodas = true;
    for (var fonte of fontes) {
        if (fontePausada(fonte)) {
            consultouTodas = false;
            continue;
        }
        try {
            imagemMidia = await fonte(musica.midia);
            if (imagemMidia) break;
        } catch (erro) {
            consultouTodas = false;
            registrarErroFonte(fonte, erro);
        }
    }
    // Só guardamos "sem imagem" se todas as APIs responderam, para tentar de novo quando voltarem
    if (imagemMidia || consultouTodas) cacheImagens.salvar(musica.midia, imagemMidia);
    return imagemMidia || semImagemMidia;
}

// ---------- Montagem do quiz ----------

function embaralhar(vetor) {
    var copia = vetor.slice();
    for (var i = copia.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        [copia[i], copia[j]] = [copia[j], copia[i]];
    }
    return copia;
}

// Agrupa as músicas por mídia, para que as 4 alternativas de uma questão sejam de mídias diferentes
function agruparPorMidia(musicas) {
    var grupos = new Map();
    musicas.forEach(function (musica) {
        // A primeira palavra significativa junta a mesma franquia, para não aparecerem duas alternativas
        // da mesma obra (ex.: "86" e "86 2nd Season", "Kara no Kyoukai 1" e "Kara no Kyoukai 5", "NieR:Automata" e "NieR Replicant")
        var palavras = normalizar(musica.midia).split(" ").filter(function (p) { return !["the", "a", "an", "tv"].includes(p); });
        var chave = palavras[0] || musica.midia.split(" ")[0];
        if (!grupos.has(chave)) grupos.set(chave, []);
        grupos.get(chave).push(musica);
    });
    return Array.from(grupos.values());
}

async function gerarQuiz(qtdQuestoes) {
    var musicas = await listarMusicasOst();
    var grupos = agruparPorMidia(musicas);

    if (grupos.length < 4) {
        throw new Error("São necessárias músicas OST de pelo menos 4 mídias diferentes para montar o quiz");
    }

    var questoes = [];
    // Procuramos uma música com preview disponível para cada questão
    var candidatos = embaralhar(grupos);
    for (var grupo of candidatos) {
        if (questoes.length >= qtdQuestoes) break;

        var correta = embaralhar(grupo)[0];
        var preview = await obterPreview(correta);
        if (!preview) continue;

        var distratores = embaralhar(grupos.filter(function (g) { return g !== grupo; }))
            .slice(0, 3)
            .map(function (g) { return embaralhar(g)[0]; });

        var opcoes = embaralhar([correta].concat(distratores));
        // Uma imagem por vez, para não estourar o limite de requisições da Wikipedia/AniList
        var alternativas = [];
        for (var musica of opcoes) {
            alternativas.push({
                titulo: musica.titulo,
                artista: musica.artista,
                midia: musica.midia,
                imagem: await buscarImagem(musica)
            });
        }

        questoes.push({
            preview: preview.principal,
            previewAlternativo: preview.alternativo,
            alternativas: alternativas,
            correta: opcoes.indexOf(correta)
        });
    }

    if (questoes.length === 0) {
        throw new Error("Não foi possível encontrar trechos das músicas para montar o quiz");
    }
    return questoes;
}

module.exports = {
    listarMusicasOst,
    urlLoginSpotify,
    concluirLoginSpotify,
    gerarQuiz,
    extrairMidia
};
