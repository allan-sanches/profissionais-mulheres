/*
 * Teste de fumaça da listagem de pesquisadoras.
 *
 * POR QUE ELE EXISTE
 * O `astro build` não faz typecheck do conteúdo das tags <script>. Uma
 * referência a função que não existe mais — o caso clássico é remover uma
 * função e esquecer uma chamada — compila, minifica e sobe pro ar sem um
 * aviso sequer. Em runtime ela derruba a inicialização inteira: como todo o
 * comportamento da tela vive dentro de uma única função, um ReferenceError no
 * meio dela impede o registro de TODOS os listeners que vêm depois. O sintoma
 * não é "um botão quebrado", é "a página inteira parou de responder".
 *
 * Isso já aconteceu duas vezes neste arquivo (`closeDrawer` e
 * `clearAllFilters`), e nas duas o build passou limpo.
 *
 * O QUE ELE FAZ
 * Carrega a home construída num DOM real, executa o bundle da página e opera a
 * tela como uma pessoa faria: abre o painel, marca um filtro, clica em
 * Aplicar. Falha se qualquer erro escapar ou se o resultado não mudar.
 *
 * Roda no fim do `npm run build`, então uma quebra dessas reprova o deploy em
 * vez de chegar no site.
 */

import fs from "node:fs";
import path from "node:path";
import { JSDOM, VirtualConsole } from "jsdom";

const DIST = "dist/client";

function falhar(mensagem) {
  console.error("\n✗ Teste de fumaça da listagem falhou\n");
  console.error("  " + mensagem + "\n");
  process.exit(1);
}

// ── Monta o ambiente ────────────────────────────────────────────────────────

const htmlPath = path.join(DIST, "index.html");
if (!fs.existsSync(htmlPath)) {
  falhar(`${htmlPath} não existe — rode o build antes.`);
}

const erros = [];
const virtualConsole = new VirtualConsole();
virtualConsole.on("jsdomError", (e) => erros.push(e.stack || e.message));

const dom = new JSDOM(fs.readFileSync(htmlPath, "utf8"), {
  runScripts: "dangerously",
  virtualConsole,
  url: "http://localhost/",
  pretendToBeVisual: true,
});

const { window } = dom;
const { document } = window;

/*
 * Lacunas do jsdom, não da página. São APIs que todo navegador tem e o jsdom
 * não implementa; sem elas o teste acusaria uma falha que não existe no
 * ambiente real. Ficam mínimas de propósito — quanto mais o teste simula, menos
 * ele prova.
 */
window.matchMedia = (media) => ({
  matches: true, // finge tela larga: exercita a visão de tabela
  media,
  addEventListener() {},
  removeEventListener() {},
  addListener() {},
  removeListener() {},
});
window.CSS = window.CSS || {};
window.CSS.escape =
  window.CSS.escape || ((v) => String(v).replace(/[^\w-]/g, (c) => "\\" + c));

const drawer = document.getElementById("filter-drawer");
if (drawer && typeof drawer.showModal !== "function") {
  drawer.open = false;
  drawer.showModal = function () {
    this.setAttribute("open", "");
    this.open = true;
  };
  drawer.close = function () {
    this.removeAttribute("open");
    this.open = false;
    this.dispatchEvent(new window.Event("close"));
  };
}

// ── Executa o script da página ──────────────────────────────────────────────

const nomeBundle = fs
  .readdirSync(path.join(DIST, "_astro"))
  .find((f) => f.startsWith("index.astro_astro_type_script_index_0_lang."));

if (!nomeBundle) falhar("bundle do script da home não encontrado em _astro/.");

try {
  window.eval(fs.readFileSync(path.join(DIST, "_astro", nomeBundle), "utf8"));
} catch (e) {
  falhar("o bundle estourou ao ser avaliado:\n  " + (e.stack || e.message));
}

// É por este evento que a página se inicializa, a cada navegação.
document.dispatchEvent(new window.Event("astro:page-load"));

if (erros.length) {
  falhar(
    "erro durante a inicialização — os listeners registrados depois dele " +
      "nunca chegam a existir:\n  " +
      erros[0].split("\n").slice(0, 3).join("\n  "),
  );
}

// ── Opera a tela ────────────────────────────────────────────────────────────

const contador = () =>
  document.getElementById("pagination-info")?.textContent?.trim() ?? "";
const totalFiltrado = () => {
  const m = /de (\d+) pesquisadoras/.exec(contador());
  return m ? Number(m[1]) : null;
};

const totalInicial = totalFiltrado();
if (!totalInicial) {
  falhar(`o contador não foi preenchido na carga. Valor: "${contador()}"`);
}

const aplicar = document.getElementById("filter-apply");
if (!aplicar) falhar('botão "Aplicar Filtros" (#filter-apply) não existe.');

// Um filtro seletivo o bastante pra mudar o total de forma inequívoca.
const caixa = document.querySelector(
  'input[data-filter-group="raca"][value="indigena"]',
);
if (!caixa) falhar("checkbox de filtro esperado não existe (raca=indigena).");

caixa.checked = true;
drawer.showModal();
aplicar.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));

if (erros.length) {
  falhar("erro ao aplicar os filtros:\n  " + erros[0].split("\n")[0]);
}
if (drawer.open) {
  falhar('clicar em "Aplicar Filtros" deveria fechar o painel, e não fechou.');
}

const totalFiltradoDepois = totalFiltrado();
if (totalFiltradoDepois === null) {
  falhar("o contador ficou ilegível depois de aplicar.");
}
if (totalFiltradoDepois >= totalInicial) {
  falhar(
    `o filtro não teve efeito: ${totalInicial} antes, ` +
      `${totalFiltradoDepois} depois (deveria diminuir).`,
  );
}

const chips = document.querySelectorAll("#active-filter-chips span > span");
if (chips.length === 0) {
  falhar("nenhuma etiqueta de filtro ativo apareceu depois de aplicar.");
}

console.log(
  `✓ listagem ok — ${totalInicial} → ${totalFiltradoDepois} ao filtrar, ` +
    `painel fecha, ${chips.length} etiqueta(s) ativa(s)`,
);
