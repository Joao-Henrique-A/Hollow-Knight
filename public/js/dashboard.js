const assuntos = ["Lore", "Personagens", "Exploração", "Combate", "Trilha Sonora"];
const niveis = ["Fácil", "Médio", "Difícil", "Especialista"];
const jogos = ["Hollow Knight", "Silksong"];
const seletor = document.getElementById("seletorTentativa");
const mensagem = document.getElementById("mensagemDashboard");
let historico = [];
let requisicaoAtual = 0;
const graficos = {};

async function buscar(url) {
    const resposta = await fetch(url);
    if (resposta.status === 401) {
        window.location.href = "../login.html";
        throw new Error("Sessão encerrada.");
    }
    if (!resposta.ok) throw new Error("Não foi possível carregar os dados. Tente novamente.");
    return resposta.json();
}

function dataFormatada(data) {
    return new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit"
    }).format(new Date(data));
}

function agrupar(respostas, campo, nomes) {
    return nomes.map(nome => {
        const itens = respostas.filter(resposta => resposta[campo] === nome);
        const acertos = itens.filter(resposta => Number(resposta.acertou) === 1).length;
        return { nome, acertos, total: itens.length, percentual: itens.length ? acertos * 100 / itens.length : null };
    });
}

function percentual(valor) {
    return Math.round(valor) + "%";
}

function nomeExibido(nome) {
    return nome === "Silksong" ? "Hollow Knight: Silksong" : nome;
}

function mostrarRanking(dados, maior, tituloId, detalheId) {
    const validos = dados.filter(item => item.total > 0);
    const titulo = document.getElementById(tituloId);
    const detalhe = document.getElementById(detalheId);
    if (!validos.length) {
        titulo.textContent = "—";
        detalhe.textContent = "Sem questões";
        return;
    }
    const melhor = maior ? Math.max(...validos.map(item => item.percentual)) : Math.min(...validos.map(item => item.percentual));
    const empatados = validos.filter(item => item.percentual === melhor);
    titulo.textContent = empatados.length > 1 ? "Empate" : nomeExibido(empatados[0].nome);
    detalhe.textContent = empatados.length > 1
        ? empatados.map(item => nomeExibido(item.nome)).join(" / ") + " · " + percentual(melhor)
        : percentual(melhor) + " de acertos";
}

function descricaoGrafico(dados, mostrarContagem) {
    return dados.map(item => nomeExibido(item.nome) + ": " + (item.total
        ? (mostrarContagem ? item.acertos + "/" + item.total + " · " : "") + percentual(item.percentual)
        : "Sem questões"));
}

function atualizarGrafico(id, configuracao, descricao) {
    const canvas = document.getElementById(id);
    canvas.setAttribute("aria-label", descricao.join("; "));
    if (graficos[id]) graficos[id].destroy();
    graficos[id] = new Chart(canvas, configuracao);
}

function mostrarBarras(id, dados, mostrarContagem) {
    const descricao = descricaoGrafico(dados, mostrarContagem);
    const cores = id === "jogos" ? ["#a9c9e8", "#d5b578"] : ["#8accc0", "#a9c9e8", "#b9a8e4", "#e3a39b"];
    atualizarGrafico(id, {
        type: "bar",
        data: {
            labels: descricao,
            datasets: [{ data: dados.map(item => item.percentual), backgroundColor: cores, borderRadius: 5, maxBarThickness: 18 }]
        },
        options: {
            indexAxis: "y", responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false }, tooltip: { callbacks: { label: contexto => percentual(contexto.raw) } } },
            scales: {
                x: { min: 0, max: 100, grid: { color: "#344a62" }, ticks: { color: "#c4d1e0", callback: valor => valor + "%" } },
                y: { grid: { display: false }, ticks: { color: "#c4d1e0", font: { size: 12 } } }
            }
        }
    }, descricao);
}

function desenharRadar(dados) {
    const descricao = descricaoGrafico(dados, false);
    atualizarGrafico("graficoRadar", {
        type: "radar",
        data: {
            labels: dados.map(item => [item.nome, item.total ? percentual(item.percentual) : "Sem questões"]),
            datasets: [{
                data: dados.map(item => item.percentual),
                fill: dados.every(item => item.total > 0),
                backgroundColor: "rgba(185, 168, 228, 0.3)", borderColor: "#b9a8e4",
                pointBackgroundColor: "#e2d8fa", pointRadius: 3
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false }, tooltip: { callbacks: { label: contexto => percentual(contexto.raw) } } },
            scales: { r: {
                min: 0, max: 100, ticks: { display: false, stepSize: 25 },
                grid: { color: "#344a62" }, angleLines: { color: "#344a62" },
                pointLabels: { color: "#c4d1e0", font: { size: 12 } }
            } }
        }
    }, descricao);
    document.getElementById("avisoRadar").textContent = dados.some(dado => !dado.total)
        ? "O preenchimento aparece quando há questões em todos os assuntos."
        : "";
}

function mostrarHistorico(idSelecionado) {
    const corpo = document.getElementById("historicoTentativas");
    corpo.replaceChildren();
    historico.forEach(tentativa => {
        const linha = document.createElement("tr");
        if (Number(tentativa.id) === idSelecionado) linha.className = "selecionada";
        const celula = document.createElement("td");
        const botao = document.createElement("button");
        botao.type = "button";
        botao.textContent = "Tentativa #" + tentativa.id;
        botao.addEventListener("click", () => { seletor.value = tentativa.id; carregarTentativa(tentativa.id); });
        celula.append(botao);
        linha.append(celula);
        [dataFormatada(tentativa.data_fim), tentativa.acertos, tentativa.total - tentativa.acertos,
            percentual(tentativa.acertos * 100 / tentativa.total)].forEach(valor => {
            const coluna = document.createElement("td");
            coluna.textContent = valor;
            linha.append(coluna);
        });
        corpo.append(linha);
    });
}

async function carregarTentativa(id) {
    const numeroRequisicao = ++requisicaoAtual;
    mensagem.hidden = false;
    mensagem.textContent = "Carregando tentativa...";
    document.getElementById("conteudoDashboard").hidden = true;
    try {
        const dados = await buscar("/dashboard-api/tentativas/" + encodeURIComponent(id));
        if (numeroRequisicao !== requisicaoAtual) return;
        const respostas = dados.respostas;
        const porJogo = agrupar(respostas, "jogo", jogos);
        const porAssunto = agrupar(respostas, "assunto", assuntos);
        const porNivel = agrupar(respostas, "nivel", niveis);
        const acertos = respostas.filter(resposta => Number(resposta.acertou) === 1).length;
        mostrarRanking(porJogo, true, "melhorJogo", "melhorJogoDetalhe");
        mostrarRanking(porAssunto, true, "melhorCategoria", "melhorCategoriaDetalhe");
        mostrarRanking(porAssunto, false, "piorCategoria", "piorCategoriaDetalhe");
        document.getElementById("questoesCorretas").textContent = acertos + "/" + respostas.length;
        document.getElementById("aproveitamento").textContent = percentual(acertos * 100 / respostas.length) + " de aproveitamento";
        document.getElementById("conteudoDashboard").hidden = false;
        mostrarBarras("jogos", porJogo, true);
        mostrarBarras("dificuldades", porNivel, false);
        desenharRadar(porAssunto);
        mostrarHistorico(Number(id));
        mensagem.hidden = true;
    } catch (erro) {
        if (numeroRequisicao === requisicaoAtual) {
            document.getElementById("conteudoDashboard").hidden = true;
            mensagem.textContent = erro.message;
        }
    }
}

async function iniciarDashboard() {
    try {
        historico = await buscar("/dashboard-api/tentativas");
        if (!historico.length) {
            mensagem.textContent = "Você ainda não concluiu nenhum quiz. ";
            const link = document.createElement("a");
            link.href = "../quiz.html";
            link.textContent = "Começar uma tentativa";
            mensagem.append(link);
            return;
        }
        historico.forEach(tentativa => {
            const opcao = document.createElement("option");
            opcao.value = tentativa.id;
            opcao.textContent = "Tentativa #" + tentativa.id + " · " + dataFormatada(tentativa.data_fim);
            seletor.append(opcao);
        });
        document.getElementById("seletorContainer").hidden = false;
        const idSolicitado = Number(new URLSearchParams(window.location.search).get("tentativa"));
        const escolhida = historico.find(item => Number(item.id) === idSolicitado) || historico[0];
        seletor.value = escolhida.id;
        await carregarTentativa(escolhida.id);
    } catch (erro) {
        mensagem.textContent = erro.message;
    }
}

seletor.addEventListener("change", () => carregarTentativa(seletor.value));
iniciarDashboard();
