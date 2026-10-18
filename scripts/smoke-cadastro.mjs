/*
 * Teste de fumaça do cadastro (/cadastro).
 *
 * POR QUE ELE EXISTE
 * Pelo mesmo motivo do smoke-listagem.mjs: o `astro build` não faz typecheck
 * do <script> da página, e um erro de runtime ali deixa o formulário inteiro
 * inerte sem que o build reclame. No cadastro o custo é maior: ninguém
 * consegue se cadastrar, e a pessoa só descobre no último botão.
 *
 * O QUE ELE FAZ
 * Carrega a página construída num DOM real, serve o formulário de exemplo
 * (src/data/formulario-exemplo.json) no lugar do Google Forms e preenche como
 * uma pessoa faria: tenta avançar sem responder, responde, escolhe estado e
 * cidade pela busca, segue o desvio que pula o mestrado e envia. Falha se
 * qualquer erro escapar ou se o que seria enviado não for o esperado.
 *
 * Roda no fim do `npm run build`, junto com o da listagem.
 */

import fs from "node:fs";
import path from "node:path";
import { JSDOM, VirtualConsole } from "jsdom";

const DIST = "dist/client";

function falhar(mensagem) {
  console.error("\n✗ Teste de fumaça do cadastro falhou\n");
  console.error("  " + mensagem + "\n");
  process.exit(1);
}

// ── Monta o ambiente ────────────────────────────────────────────────────────

const htmlPath = path.join(DIST, "cadastro", "index.html");
if (!fs.existsSync(htmlPath)) {
  falhar(`${htmlPath} não existe — rode o build antes.`);
}

const html = fs.readFileSync(htmlPath, "utf8");
const exemplo = JSON.parse(
  fs.readFileSync("src/data/formulario-exemplo.json", "utf8"),
);
const nomeBundle = fs
  .readdirSync(path.join(DIST, "_astro"))
  .find((f) => f.startsWith("cadastro.astro_astro_type_script_index_0_lang."));
if (!nomeBundle)
  falhar("bundle do script do cadastro não encontrado em _astro/.");
const bundle = fs.readFileSync(path.join(DIST, "_astro", nomeBundle), "utf8");

const resposta = (status, dados) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => dados,
});

// A página aberta no momento. O teste abre duas vezes: uma do zero e outra
// com um rascunho salvo, como quem recarrega a aba no meio do preenchimento.
let window, document, erros, envio;

function abrirPagina(rascunho, estrutura = exemplo) {
  erros = [];
  envio = null;
  const virtualConsole = new VirtualConsole();
  virtualConsole.on("jsdomError", (e) => erros.push(e.stack || e.message));
  virtualConsole.on("error", (...args) => erros.push(args.join(" ")));

  ({ window } = new JSDOM(html, {
    runScripts: "dangerously",
    virtualConsole,
    url: "http://localhost/cadastro/",
    pretendToBeVisual: true,
  }));
  document = window.document;

  // Lacunas do jsdom, não da página (ver o comentário no smoke-listagem.mjs).
  window.HTMLElement.prototype.scrollIntoView = function () {};

  // O Turnstile só existe se o build tiver TURNSTILE_SITE_KEY. Um dublê evita
  // que o teste espere um script da Cloudflare que o jsdom não baixa.
  window.turnstile = {
    render: (_el, opcoes) => {
      window.__turnstileCallback = opcoes.callback;
      return "widget";
    },
    execute: () => window.__turnstileCallback?.("token-de-teste"),
    reset: () => {},
  };

  window.fetch = async (url, opcoes = {}) => {
    const caminho = new URL(url, window.location.href).pathname;
    if (caminho === "/api/formulario.json") return resposta(200, estrutura);
    const uf = /^\/dados\/municipios\/([A-Z]{2})\.json$/.exec(caminho)?.[1];
    if (uf) {
      const arquivo = path.join(DIST, "dados", "municipios", `${uf}.json`);
      if (!fs.existsSync(arquivo)) return resposta(404, {});
      return resposta(200, JSON.parse(fs.readFileSync(arquivo, "utf8")));
    }
    if (caminho === "/api/cadastro" && opcoes.method === "POST") {
      envio = JSON.parse(opcoes.body);
      return resposta(200, { ok: true });
    }
    return resposta(404, {});
  };

  if (rascunho) {
    window.sessionStorage.setItem(
      "cadastro:rascunho",
      JSON.stringify(rascunho),
    );
  }

  try {
    window.eval(bundle);
  } catch (e) {
    falhar("o bundle estourou ao ser avaliado:\n  " + (e.stack || e.message));
  }
  document.dispatchEvent(new window.Event("astro:page-load"));
}

// ── Ferramentas de operar a tela ────────────────────────────────────────────

async function esperar(condicao, descricao, ms = 3000) {
  const inicio = Date.now();
  while (!condicao()) {
    if (erros.length)
      falhar(`erro enquanto esperava ${descricao}:\n  ${erros[0]}`);
    if (Date.now() - inicio > ms)
      falhar(`tempo esgotado esperando ${descricao}.`);
    await new Promise((r) => setTimeout(r, 10));
  }
}

const $ = (seletor) => document.querySelector(seletor);
const item = (id) =>
  $(`[data-item="${id}"]`) ?? falhar(`pergunta ${id} não foi desenhada.`);
const visivel = () =>
  [...document.querySelectorAll("[data-secao]")].findIndex((s) => !s.hidden);
const avancar = () => $("[data-avancar]").click();
const erroDe = (id) => item(id).querySelector("[data-erro]");

function digitar(el, texto) {
  el.value = texto;
  el.dispatchEvent(new window.Event("input", { bubbles: true }));
}
function marcar(id, valor) {
  const opcao = [...item(id).querySelectorAll("input")].find(
    (i) => i.value === valor,
  );
  if (!opcao) falhar(`opção "${valor}" não existe na pergunta ${id}.`);
  opcao.checked = true;
  opcao.dispatchEvent(new window.Event("change", { bubbles: true }));
}
function escolher(select, valor) {
  select.value = valor;
  select.dispatchEvent(new window.Event("change", { bubbles: true }));
}
const tecla = (el, key) =>
  el.dispatchEvent(new window.KeyboardEvent("keydown", { key, bubbles: true }));

// ── Preenchimento do zero ───────────────────────────────────────────────────

// Descrição formatada como a página pública do Forms entrega, com o que um
// editor mal-intencionado do formulário poderia tentar injetar no meio.
const DESCRICAO_FORMATADA =
  "<p>Olá! <b>Negrito</b> e <i>itálico</i>.</p><ul><li><p>Primeiro item;</p></li><li><p>Segundo item.</p></li></ul>" +
  '<script>window.__xss = 1</script><p><img src="x" onerror="window.__xss = 1">' +
  '<a href="javascript:window.__xss=1">link perigoso</a> <a href="https://exemplo.com" onclick="window.__xss=1">link bom</a></p>';

abrirPagina(null, { ...exemplo, descricaoHtml: DESCRICAO_FORMATADA });
await esperar(
  () => $("form[data-estado=formulario]") && !$("form").hidden,
  "o formulário aparecer",
);
if (visivel() !== 0)
  falhar(`deveria começar na primeira seção, está na ${visivel()}.`);
if (!$("[data-cabecalho] h1")?.textContent.includes("exemplo")) {
  falhar("o título do formulário não foi desenhado no cabeçalho.");
}
if ($('[data-item="5008"]'))
  falhar("o upload de arquivo não deveria aparecer.");

const cabecalho = $("[data-cabecalho]");
if (
  !cabecalho.querySelector("b")?.textContent.includes("Negrito") ||
  !cabecalho.querySelector("i")
) {
  falhar("o negrito e o itálico da descrição não foram mantidos.");
}
if (cabecalho.querySelectorAll("ul > li").length !== 2) {
  falhar("a lista da descrição não foi mantida.");
}
if (
  cabecalho.querySelector(
    "script, img, [onerror], [onclick], a[href^='javascript']",
  )
) {
  falhar("o filtro da descrição deixou passar tag ou atributo perigoso.");
}
const linkBom = [...cabecalho.querySelectorAll("a")].find(
  (a) => a.textContent === "link bom",
);
if (
  linkBom?.getAttribute("href") !== "https://exemplo.com" ||
  linkBom.target !== "_blank"
) {
  falhar(
    "o link seguro da descrição deveria ter sobrevivido, abrindo em outra aba.",
  );
}
if (window.__xss) falhar("código injetado na descrição foi executado.");

// 1. Avançar sem responder não pode passar.
avancar();
if (visivel() !== 0) falhar("avançou sem responder as obrigatórias.");
if (erroDe("1001").hidden)
  falhar("a pergunta obrigatória vazia não mostrou erro.");

digitar(item("1001").querySelector("input"), "Fulana de Tal");
if (!erroDe("1001").hidden) falhar("o erro não sumiu depois de responder.");
digitar(item("1002").querySelector("input"), "fulana@");
marcar("1003", "Perfil completo no site");
avancar();
if (visivel() !== 0 || erroDe("1002").hidden)
  falhar("aceitou um e-mail inválido.");
digitar(item("1002").querySelector("input"), "fulana@ufrj.br");
avancar();
if (visivel() !== 1) falhar(`deveria estar na seção 1, está na ${visivel()}.`);

// 2. Escolhas, "Outro" e localização.
marcar("2001", "Feminino / Cisgênero");
digitar(item("2002").querySelector("[data-texto-outro]"), "Autismo");
if (!item("2002").querySelector("[data-outro]").checked) {
  falhar('digitar no "Outro" deveria marcar a opção.');
}
escolher(item("2003").querySelector("select"), "Parda");

const natal = item("2005");
if (natal.querySelector("[data-pais]").value !== "Brasil")
  falhar("o país deveria vir como Brasil.");
const cidadeNatal = natal.querySelector("[data-cidade]");
escolher(natal.querySelector("[data-uf]"), "MG");
await esperar(() => !cidadeNatal.disabled, "a lista de cidades de MG carregar");
cidadeNatal.focus();
digitar(cidadeNatal, "para de minas");
const listaNatal = cidadeNatal.closest("[data-combobox]").querySelector("ul");
if (listaNatal.hidden) falhar("a lista de sugestões de cidade não abriu.");
if (!listaNatal.textContent.includes("Pará de Minas")) {
  falhar(
    `a busca sem acento não achou "Pará de Minas": ${listaNatal.textContent.slice(0, 80)}`,
  );
}
tecla(cidadeNatal, "ArrowDown");
tecla(cidadeNatal, "Enter");
if (cidadeNatal.value !== "Pará de Minas")
  falhar(`a cidade escolhida ficou "${cidadeNatal.value}".`);

const atual = item("2006");
digitar(atual.querySelector("[data-pais]"), "portugal");
if (!atual.querySelector("[data-bloco-uf]").hidden)
  falhar("fora do Brasil, o estado deveria sumir.");
digitar(atual.querySelector("[data-cidade]"), "Lisboa");
avancar();
if (visivel() !== 2) {
  const comErro = [...document.querySelectorAll("[data-erro]:not([hidden])")]
    .map((p) => `${p.closest("[data-item]").dataset.item}: ${p.textContent}`)
    .join("; ");
  falhar(`deveria estar na seção 2, está na ${visivel()}. Erros: ${comErro}`);
}

// 3. Desvio: "Não iniciado" pula a seção de mestrado.
digitar(item("3001").querySelector("input"), "Ciências Biológicas");
marcar("3002", "Concluído");
avancar();
if (visivel() !== 3)
  falhar(`"Concluído" deveria ir pra seção de mestrado, foi pra ${visivel()}.`);
digitar(item("4001").querySelector("input"), "PPG Ecologia");
$("[data-voltar]").click();
if (visivel() !== 2)
  falhar(`"Voltar" deveria voltar pra seção 2, foi pra ${visivel()}.`);
marcar("3002", "Não iniciado");
avancar();
if (visivel() !== 4)
  falhar(`"Não iniciado" deveria pular pra seção 4, foi pra ${visivel()}.`);
if ($("[data-avancar]").textContent.trim() !== "Enviar") {
  falhar("na última seção o botão deveria dizer Enviar.");
}

// 4. Última seção e envio.
digitar(item("5001").querySelector("input"), "Polinizadores do Cerrado");
marcar("5002", "Conservação");
marcar("5003", "Presencial");
digitar(item("5006").querySelector("input"), "lattes.cnpq.br/1234");
avancar();

await esperar(() => envio !== null, "o envio para /api/cadastro");
await esperar(
  () => !$("[data-estado=enviado]").hidden,
  "a tela de confirmação",
);

const r = envio.respostas;
const esperado = {
  1001: "Fulana de Tal",
  2002: "Autismo",
  2005: JSON.stringify({ pais: "Brasil", uf: "MG", cidade: "Pará de Minas" }),
  2006: JSON.stringify({ pais: "Portugal", uf: "", cidade: "Lisboa" }),
  3002: "Não iniciado",
  5002: JSON.stringify(["Conservação"]),
  5003: JSON.stringify(["Presencial", "", ""]),
};
for (const [id, valor] of Object.entries(esperado)) {
  const recebido = typeof r[id] === "string" ? r[id] : JSON.stringify(r[id]);
  if (recebido !== valor)
    falhar(`resposta ${id}: esperado ${valor}, enviado ${recebido}.`);
}
if ("4001" in r) falhar("a seção pulada (mestrado) não deveria ser enviada.");
if (envio.site_web) falhar("o campo-isca foi enviado preenchido.");
if (!$("[data-confirmacao]").textContent.includes("Obrigada")) {
  falhar("a mensagem de confirmação do formulário não apareceu.");
}
if (window.sessionStorage.getItem("cadastro:rascunho")) {
  falhar("o rascunho deveria ser apagado depois do envio.");
}
if (erros.length) falhar("erro durante o preenchimento:\n  " + erros[0]);
const enviadas = Object.keys(r).length;

// ── Rascunho recuperado ─────────────────────────────────────────────────────

abrirPagina({
  respostas: {
    1001: "Ciclana",
    2005: { pais: "Brasil", uf: "SP", cidade: "Campinas" },
    2006: { pais: "Portugal", uf: "", cidade: "Porto" },
    3002: "Não iniciado",
  },
  historico: [0, 1],
});
await esperar(
  () => !$("[data-rascunho]").hidden,
  "o aviso de rascunho recuperado",
);
// Sem o HTML do Forms, a descrição em texto puro vira parágrafos.
if ($("[data-cabecalho]").querySelectorAll("p").length < 3) {
  falhar("a descrição em texto puro deveria virar parágrafos separados.");
}
if (visivel() !== 1)
  falhar(`o rascunho deveria reabrir na seção 1, abriu na ${visivel()}.`);
if (item("1001").querySelector("input").value !== "Ciclana") {
  falhar("o texto salvo no rascunho não voltou.");
}
const cidadeSalva = item("2005").querySelector("[data-cidade]");
await esperar(
  () => cidadeSalva.value === "Campinas" && !cidadeSalva.disabled,
  "a cidade do rascunho voltar com a lista de SP carregada",
);
if (item("2005").querySelector("[data-uf]").value !== "SP")
  falhar("o estado salvo não voltou.");
const exterior = item("2006");
if (
  !exterior.querySelector("[data-bloco-uf]").hidden ||
  exterior.querySelector("[data-cidade]").value !== "Porto"
) {
  falhar("a localização fora do Brasil não voltou do rascunho.");
}
if (!item("3002").querySelector('input[value="Não iniciado"]').checked) {
  falhar("a opção salva no rascunho não voltou marcada.");
}
if (erros.length) falhar("erro ao recuperar o rascunho:\n  " + erros[0]);

// ── Forms configurado de um jeito que recusa envio por script ───────────────

// Ex.: "Coletar endereços de e-mail" ligado. A página tem que avisar logo, e
// não deixar a pessoa preencher tudo pra falhar no "Enviar". O console.error
// que ela emite aqui é esperado, por isso não passa por `esperar`.
abrirPagina(null, {
  ...exemplo,
  problemas: ["“Coletar endereços de e-mail” precisa estar em “Não coletar”."],
});
for (
  let i = 0;
  i < 300 && $("#cadastro").getAttribute("aria-busy") !== "false";
  i++
) {
  await new Promise((r) => setTimeout(r, 10));
}
const estadoVisivel = [...document.querySelectorAll("[data-estado]")].find(
  (el) => !el.hidden,
)?.dataset.estado;
if (estadoVisivel !== "indisponivel") {
  falhar(
    `com o Forms recusando envio, a página deveria dizer indisponível; mostrou "${estadoVisivel}".`,
  );
}

console.log(
  `✓ cadastro ok — desvio pulando o mestrado, cidade por busca, ${enviadas} respostas enviadas, rascunho recuperado, aviso de configuração`,
);
process.exit(0);
