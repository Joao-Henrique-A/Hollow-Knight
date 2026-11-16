// Teste opcional de ponta a ponta com o Edge instalado na máquina de desenvolvimento.
const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const fs = require("node:fs");

module.exports = async function testarNavegador(base) {
    const edge = spawn(process.env.HOLLOWQUIZ_EDGE, [
        "--headless", "--disable-gpu", "--disable-extensions", "--remote-debugging-port=49337",
        "--user-data-dir=" + process.env.HOLLOWQUIZ_BROWSER_PROFILE,
        "--window-size=1440,1100", "about:blank"
    ], { stdio: "ignore" });
    let socket;
    try {
        let abas;
        for (let i = 0; i < 80; i++) {
            try { abas = await (await fetch("http://127.0.0.1:49337/json")).json(); break; } catch {}
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        assert.ok(abas, "navegador iniciou");
        const aba = abas.find(item => item.type === "page");
        assert.ok(aba, "aba do navegador disponível");
        socket = new WebSocket(aba.webSocketDebuggerUrl);
        await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
        let id = 0;
        const pendentes = new Map();
        socket.onmessage = evento => {
            const mensagem = JSON.parse(evento.data);
            if (!pendentes.has(mensagem.id)) return;
            const { resolve, reject } = pendentes.get(mensagem.id);
            pendentes.delete(mensagem.id);
            mensagem.error ? reject(new Error(mensagem.error.message)) : resolve(mensagem.result);
        };
        function enviar(method, params = {}) {
            return new Promise((resolve, reject) => {
                pendentes.set(++id, { resolve, reject });
                socket.send(JSON.stringify({ id, method, params }));
            });
        }
        async function avaliar(expression) {
            const resultado = await enviar("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
            if (resultado.exceptionDetails) throw new Error(resultado.exceptionDetails.exception.description);
            return resultado.result.value;
        }
        async function aguardar(expression) {
            for (let i = 0; i < 150; i++) {
                try { if (await avaliar(expression)) return; } catch {}
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            const estado = await avaliar("location.href + ' | ' + document.readyState + ' | ' + document.title");
            throw new Error("Tempo esgotado aguardando: " + expression + " (" + estado + ")");
        }
        async function navegar(url, condicao) {
            await enviar("Page.navigate", { url });
            await aguardar(condicao);
        }
        await enviar("Page.enable");
        await enviar("Emulation.setDeviceMetricsOverride", { width: 1440, height: 1100, deviceScaleFactor: 1, mobile: false });
        await navegar(base + "/dashboard/dashboard.html", "location.pathname.endsWith('login.html') && typeof entrar === 'function'");
        await avaliar("email_input.value = 'b@teste.com'; senha_input.value = 'Teste1!'; entrar();");
        await aguardar("location.pathname.endsWith('quiz.html') && !!document.getElementById('btnIniciarQuiz')");
        await navegar(base + "/dashboard/dashboard.html", "document.getElementById('mensagemDashboard')?.textContent.includes('ainda não concluiu')");

        async function jogar(alternativa) {
            await navegar(base + "/quiz.html", "document.getElementById('btnIniciarQuiz') && document.readyState === 'complete'");
            await avaliar("document.getElementById('btnIniciarQuiz').click()");
            await aguardar("!document.getElementById('jogo').hidden");
            for (let i = 0; i < 20; i++) {
                await avaliar(`document.querySelector('input[value="${alternativa}"]').click(); document.getElementById('btnSubmeter').click();`);
                await aguardar("!document.getElementById('btnProx').disabled");
                await avaliar("document.getElementById('btnProx').click()");
                if (i < 19) await aguardar(`document.getElementById('spanNumeroDaQuestaoAtual').textContent === '${i + 2}'`);
            }
            await aguardar("location.pathname.endsWith('dashboard.html') && document.getElementById('conteudoDashboard') && !document.getElementById('conteudoDashboard').hidden");
            return avaliar("({id: new URLSearchParams(location.search).get('tentativa'), score: document.getElementById('questoesCorretas').textContent})");
        }
        const primeira = await jogar("A");
        assert.match(primeira.score, /^\d+\/20$/);
        assert.equal(await avaliar("Chart.getChart('graficoRadar').config.type"), "radar");
        assert.equal(await avaliar("Chart.getChart('jogos').config.type"), "bar");
        assert.equal(await avaliar("Chart.getChart('dificuldades').data.datasets[0].data.length"), 4);
        const segunda = await jogar("B");
        assert.notEqual(primeira.id, segunda.id);
        assert.equal(await avaliar("document.querySelectorAll('#seletorTentativa option').length"), 2);
        await avaliar(`document.getElementById('seletorTentativa').value = '${primeira.id}'; document.getElementById('seletorTentativa').dispatchEvent(new Event('change'));`);
        await aguardar(`!document.getElementById('conteudoDashboard').hidden && document.getElementById('questoesCorretas').textContent === '${primeira.score}'`);
        assert.equal(await avaliar("document.querySelector('#historicoTentativas tr.selecionada button').textContent"), "Tentativa #" + primeira.id);
        assert.equal(await avaliar(`(async () => {
            const respostas = (await (await fetch('/dashboard-api/tentativas/${primeira.id}')).json()).respostas;
            const dados = Chart.getChart('dificuldades').data.datasets[0].data;
            return ['Fácil', 'Médio', 'Difícil', 'Especialista'].every((nivel, i) => {
                const itens = respostas.filter(resposta => resposta.nivel === nivel);
                const esperado = itens.length ? itens.filter(resposta => Number(resposta.acertou) === 1).length * 100 / itens.length : null;
                return dados[i] === esperado;
            });
        })()`), true);
        assert.equal(await avaliar(`(() => {
            const dados = agrupar([{ assunto: 'Lore', acertou: 0 }], 'assunto', assuntos);
            desenharRadar(dados);
            const grafico = Chart.getChart('graficoRadar');
            return grafico.data.datasets[0].data[0] === 0 && grafico.data.datasets[0].data[1] === null
                && grafico.data.datasets[0].fill === false
                && document.getElementById('graficoRadar').getAttribute('aria-label').includes('Personagens: Sem questões');
        })()`), true);
        await avaliar(`carregarTentativa('${primeira.id}')`);
        if (process.env.HOLLOWQUIZ_SCREENSHOT) {
            const imagem = await enviar("Page.captureScreenshot", { format: "png" });
            fs.writeFileSync(process.env.HOLLOWQUIZ_SCREENSHOT, Buffer.from(imagem.data, "base64"));
        }
    } finally {
        if (socket) socket.close();
        edge.kill();
    }
};
