let perguntas = [];
let indice = 0;
let certas = 0;
let erradas = 0;

const telaInicial = document.getElementById("telaInicial");
const pontuacao = document.getElementById("pontuacao");
const jogo = document.getElementById("jogo");
const iniciar = document.getElementById("btnIniciarQuiz");
const submeter = document.getElementById("btnSubmeter");
const proxima = document.getElementById("btnProx");
const feedback = document.getElementById("feedbackResposta");
const mensagemInicial = document.getElementById("mensagemInicial");
const opcoes = Array.from(document.querySelectorAll('input[name="option"]'));
const audio = document.getElementById("audioQuestao");

async function enviar(url, dados) {
    const resposta = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados || {})
    });
    if (resposta.status === 401) throw new Error("Sua sessão expirou. Faça login para continuar.");
    const resultado = await resposta.json();
    if (!resposta.ok) throw new Error(resultado.mensagem || "Não foi possível concluir a operação.");
    return resultado;
}

function mostrarPergunta() {
    const pergunta = perguntas[indice];
    document.getElementById("spanNumeroDaQuestaoAtual").textContent = indice + 1;
    document.getElementById("qtdQuestoes").textContent = perguntas.length;
    document.getElementById("spanQuestaoExibida").textContent = pergunta.pergunta;
    document.getElementById("jogoQuestao").textContent = pergunta.jogo;
    document.getElementById("dificuldadeQuestao").textContent = pergunta.dificuldade;
    document.getElementById("temaQuestao").textContent = pergunta.tema;
    document.getElementById("etiquetaDificuldade").dataset.dificuldade = pergunta.dificuldade;
    jogo.dataset.dificuldade = pergunta.dificuldade;
    document.getElementById("ornamentoQuestao").src = pergunta.jogo === "Silksong"
        ? "./assets/ornamentos/silksong.png" : "./assets/ornamentos/hollow-knight.png";
    document.getElementById("tipoQuestao").textContent = pergunta.imagem && pergunta.audio ? "Imagem e áudio"
        : pergunta.imagem ? "Imagem" : pergunta.audio ? "Áudio" : "Texto";

    const midia = document.getElementById("midiaQuestao");
    const imagem = document.getElementById("imagemQuestao");
    const painelAudio = document.getElementById("painelAudio");
    midia.hidden = !pergunta.imagem && !pergunta.audio;
    imagem.hidden = !pergunta.imagem;
    imagem.alt = pergunta.imagem ? "Imagem da questão" : "";
    if (pergunta.imagem) imagem.src = pergunta.imagem;
    else imagem.removeAttribute("src");
    audio.pause();
    painelAudio.hidden = !pergunta.audio;
    if (pergunta.audio) audio.src = pergunta.audio;
    else audio.removeAttribute("src");
    audio.load();

    opcoes.forEach(opcao => {
        opcao.checked = false;
        opcao.disabled = false;
        opcao.labels[0].textContent = pergunta["alternativa" + opcao.value];
        opcao.labels[0].classList.remove("text-success-with-bg", "text-danger-with-bg");
    });
    feedback.hidden = true;
    submeter.disabled = false;
    proxima.disabled = true;
    proxima.textContent = indice === perguntas.length - 1 ? "Finalizar quiz" : "Próxima questão";
}

iniciar.addEventListener("click", async () => {
    iniciar.disabled = true;
    mensagemInicial.textContent = "Carregando perguntas...";
    try {
        const resultado = await enviar("/quiz/iniciar");
        perguntas = resultado.perguntas;
        indice = 0;
        certas = 0;
        erradas = 0;
        telaInicial.hidden = true;
        pontuacao.hidden = false;
        jogo.hidden = false;
        mostrarPergunta();
    } catch (erro) {
        if (erro.message.startsWith("Sua sessão expirou")) {
            window.location.href = "login.html";
            return;
        }
        mensagemInicial.textContent = erro.message;
        iniciar.disabled = false;
    }
});

submeter.addEventListener("click", async () => {
    const escolhida = opcoes.find(opcao => opcao.checked);
    if (!escolhida) {
        feedback.className = "feedback-resposta feedback-incorreto";
        feedback.textContent = "Escolha uma alternativa antes de responder.";
        feedback.hidden = false;
        return;
    }
    submeter.disabled = true;
    opcoes.forEach(opcao => { opcao.disabled = true; });
    try {
        const resultado = await enviar("/quiz/responder", { idPergunta: perguntas[indice].id, alternativa: escolhida.value });
        escolhida.labels[0].classList.add(resultado.acertou ? "text-success-with-bg" : "text-danger-with-bg");
        if (resultado.acertou) certas++;
        else erradas++;
        document.getElementById("spanCertas").textContent = certas;
        document.getElementById("spanErradas").textContent = erradas;
        feedback.className = "feedback-resposta " + (resultado.acertou ? "feedback-correto" : "feedback-incorreto");
        feedback.textContent = resultado.acertou ? "Resposta correta! Muito bem." : "Resposta incorreta. Continue sua jornada!";
        feedback.hidden = false;
        proxima.disabled = false;
    } catch (erro) {
        feedback.className = "feedback-resposta feedback-incorreto";
        feedback.textContent = erro.message + " Tente novamente.";
        feedback.hidden = false;
        // Mantém a mesma alternativa selecionada para uma repetição segura da requisição.
        submeter.disabled = false;
    }
});

proxima.addEventListener("click", async () => {
    if (indice < perguntas.length - 1) {
        indice++;
        mostrarPergunta();
        return;
    }
    proxima.disabled = true;
    audio.pause();
    feedback.className = "feedback-resposta";
    feedback.textContent = "Salvando sua tentativa...";
    feedback.hidden = false;
    try {
        const resultado = await enviar("/quiz/finalizar");
        window.location.href = "dashboard/dashboard.html?tentativa=" + encodeURIComponent(resultado.id);
    } catch (erro) {
        feedback.className = "feedback-resposta feedback-incorreto";
        feedback.textContent = erro.message + " Seus resultados ainda não foram confirmados; tente finalizar novamente.";
        proxima.disabled = false;
    }
});
