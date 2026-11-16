const test = require("node:test");
const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const mysql = require("mysql2/promise");

require("dotenv").config({ path: path.join(__dirname, "../.env.dev"), quiet: true });

test("quiz e dashboard salvam tentativas completas e isolam usuários", { timeout: 120000 }, async () => {
    const nomeBanco = "hollowquiz_teste_" + Date.now();
    const config = { host: process.env.DB_HOST, port: process.env.DB_PORT, user: process.env.DB_USER, password: process.env.DB_PASSWORD };
    const admin = await mysql.createConnection({ ...config, multipleStatements: true });
    let servidor;
    let criado = false;
    try {
        await admin.query("CREATE DATABASE `" + nomeBanco + "`");
        criado = true;
        await admin.query("USE `" + nomeBanco + "`");
        const sql = fs.readFileSync(path.join(__dirname, "../src/database/script-tabelas.sql"), "utf8");
        await admin.query(sql.slice(sql.indexOf("CREATE TABLE usuario")));

        const porta = 35000 + Math.floor(Math.random() * 10000);
        const base = "http://127.0.0.1:" + porta;
        servidor = spawn(process.execPath, ["app.js"], {
            cwd: path.join(__dirname, ".."),
            env: { ...process.env, DB_DATABASE: nomeBanco, APP_PORT: String(porta), APP_HOST: "127.0.0.1", AMBIENTE_PROCESSO: "desenvolvimento" },
            stdio: "ignore"
        });
        let pronto = false;
        for (let i = 0; i < 80; i++) {
            try { pronto = (await fetch(base + "/index.html")).ok; } catch {}
            if (pronto) break;
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        assert.ok(pronto, "servidor iniciou");

        async function requisicao(rota, metodo = "GET", corpo, cookie) {
            const resposta = await fetch(base + rota, {
                method: metodo,
                headers: { ...(corpo ? { "Content-Type": "application/json" } : {}), ...(cookie ? { Cookie: cookie } : {}) },
                body: corpo ? JSON.stringify(corpo) : undefined
            });
            const texto = await resposta.text();
            let dados;
            try { dados = texto ? JSON.parse(texto) : null; } catch { dados = texto; }
            return { status: resposta.status, dados, cookie: resposta.headers.get("set-cookie")?.split(";")[0] };
        }

        assert.equal((await requisicao("/dashboard-api/tentativas")).status, 401);
        assert.equal((await requisicao("/dashboard-api/tentativas/1")).status, 401);
        assert.equal((await requisicao("/quiz/iniciar", "POST", {})).status, 401);
        assert.equal((await requisicao("/quiz/responder", "POST", {})).status, 401);
        assert.equal((await requisicao("/quiz/finalizar", "POST", {})).status, 401);
        for (const [nome, email] of [["Teste A", "a@teste.com"], ["Teste B", "b@teste.com"]]) {
            assert.equal((await requisicao("/usuarios/cadastrar", "POST", { nomeServer: nome, emailServer: email, senhaServer: "Teste1!" })).status, 200);
        }
        async function login(email) {
            const resultado = await requisicao("/usuarios/autenticar", "POST", { emailServer: email, senhaServer: "Teste1!" });
            assert.equal(resultado.status, 200);
            assert.ok(resultado.cookie);
            return resultado.cookie;
        }
        const usuarioA = await login("a@teste.com");
        const usuarioB = await login("b@teste.com");
        assert.deepEqual((await requisicao("/dashboard-api/tentativas", "GET", null, usuarioA)).dados, []);

        const inicio = await requisicao("/quiz/iniciar", "POST", {}, usuarioA);
        assert.equal(inicio.status, 200);
        const perguntas = inicio.dados.perguntas;
        assert.equal(perguntas.length, 20);
        assert.ok(perguntas.every(p => !Object.keys(p).some(chave => /correta|resposta/i.test(chave))));
        assert.deepEqual((await requisicao("/dashboard-api/tentativas", "GET", null, usuarioA)).dados, []);
        assert.equal((await requisicao("/quiz/finalizar", "POST", {}, usuarioA)).status, 400);
        assert.equal((await requisicao("/quiz/responder", "POST", { idPergunta: perguntas[1].id, alternativa: "A" }, usuarioA)).status, 400);
        let acertos = 0;
        for (const [i, pergunta] of perguntas.entries()) {
            const corpo = { idPergunta: pergunta.id, alternativa: "A" };
            const resultado = await requisicao("/quiz/responder", "POST", corpo, usuarioA);
            assert.equal(resultado.status, 200);
            assert.deepEqual(Object.keys(resultado.dados), ["acertou"]);
            if (resultado.dados.acertou) acertos++;
            if (i === 0) {
                const repetida = await requisicao("/quiz/responder", "POST", corpo, usuarioA);
                assert.deepEqual(repetida.dados, resultado.dados);
            }
        }
        // Força uma falha durante a gravação para verificar o rollback e a repetição.
        await admin.query(`CREATE TRIGGER falha_teste BEFORE INSERT ON respostas_usuario
            FOR EACH ROW BEGIN IF NEW.id_pergunta = ${Number(perguntas[10].id)} THEN
                SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'falha simulada'; END IF; END`);
        assert.equal((await requisicao("/quiz/finalizar", "POST", {}, usuarioA)).status, 500);
        const [aposFalha] = await admin.query("SELECT COUNT(*) AS total FROM respostas_usuario");
        assert.equal(aposFalha[0].total, 0);
        assert.deepEqual((await requisicao("/dashboard-api/tentativas", "GET", null, usuarioA)).dados, []);
        await admin.query("DROP TRIGGER falha_teste");
        const fim = await requisicao("/quiz/finalizar", "POST", {}, usuarioA);
        assert.equal(fim.status, 200);
        const id = fim.dados.id;
        assert.equal((await requisicao("/quiz/finalizar", "POST", {}, usuarioA)).dados.id, id);
        const [registros] = await admin.execute("SELECT COUNT(*) AS total, SUM(acertou) AS acertos FROM respostas_usuario WHERE id_tentativa = ?", [id]);
        assert.equal(registros[0].total, 20);
        assert.equal(Number(registros[0].acertos), acertos);
        const lista = await requisicao("/dashboard-api/tentativas", "GET", null, usuarioA);
        assert.equal(lista.dados.length, 1);
        assert.equal(Number(lista.dados[0].acertos), acertos);
        const detalhes = await requisicao("/dashboard-api/tentativas/" + id, "GET", null, usuarioA);
        assert.equal(detalhes.dados.respostas.length, 20);
        assert.ok(detalhes.dados.respostas.every(r => r.jogo && r.assunto && r.nivel));
        assert.equal((await requisicao("/dashboard-api/tentativas/" + id, "GET", null, usuarioB)).status, 404);
        assert.deepEqual((await requisicao("/dashboard-api/tentativas", "GET", null, usuarioB)).dados, []);
        assert.equal((await requisicao("/usuarios/sair", "POST", {}, usuarioA)).status, 204);
        assert.equal((await requisicao("/dashboard-api/tentativas", "GET", null, usuarioA)).status, 401);
        if (process.env.HOLLOWQUIZ_BROWSER_TEST) {
            await require("./navegador-dashboard")(base);
        }
    } finally {
        if (servidor) servidor.kill();
        if (criado) await admin.query("DROP DATABASE `" + nomeBanco + "`");
        await admin.end();
    }
});
