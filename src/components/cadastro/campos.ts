/*
 * Monta o HTML de cada pergunta do Google Forms e faz o caminho de volta: lê do
 * DOM a resposta no formato de `Valor` (src/utils/formulario.ts) e reaplica uma
 * resposta salva no rascunho.
 *
 * Como os cards da listagem, é string + innerHTML: todo texto que vem do
 * formulário passa por `esc`.
 */

import {
  NOME_POR_UF,
  UFS,
  ehLocalizacao,
  ehPergunta,
  regraDeTexto,
  type Item,
  type ItemEscala,
  type ItemEscolha,
  type ItemGrade,
  type ItemTexto,
  type Pergunta,
  type Valor,
} from "@/utils/formulario";

/*
 * Cópia do `esc` de card-template.ts. Importar de lá faria o Vite tirar o
 * card-template do bundle da home e criar um pedaço compartilhado, e o teste
 * de fumaça da listagem só sabe rodar bundle sem import.
 */
export function esc(value: string): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Texto do Forms (descrição, ajuda): escapa e vira link o que for URL. */
export function textoComLinks(texto: string): string {
  return esc(texto).replace(
    /https?:\/\/[^\s<]+[^\s<.,;:!?)\]]/g,
    (url) =>
      `<a href="${url}" target="_blank" rel="noopener noreferrer" class="font-semibold text-meco-purple-primary underline hover:text-meco-purple-deep">${url}</a>`,
  );
}

// ── Texto formatado do Forms ────────────────────────────────────────────────

/*
 * Tipografia do texto corrido (descrição e ajudas). O Forms usa parágrafo
 * dentro de cada item de lista (<li><p>), daí o ajuste em `li > p`.
 */
export const PROSA =
  "prose max-w-none text-gray-700 prose-p:my-2 prose-a:text-meco-purple-primary prose-strong:text-gray-900 prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5 [&_li>p]:my-0";

const TAGS_PERMITIDAS = new Set([
  "P",
  "BR",
  "B",
  "STRONG",
  "I",
  "EM",
  "U",
  "UL",
  "OL",
  "LI",
  "A",
]);
const TAGS_DESCARTADAS = new Set([
  "SCRIPT",
  "STYLE",
  "TEMPLATE",
  "IFRAME",
  "OBJECT",
  "EMBED",
  "SVG",
  "MATH",
]);

/*
 * O HTML do Forms chega pelo servidor, mas quem escreve nele é qualquer pessoa
 * com acesso de edição ao formulário: antes de ir pra tela, só sobram as tags
 * de texto acima, sem nenhum atributo (fora o href de link http, https ou
 * mailto). O resto é desembrulhado, ficando só o texto. O <template> não
 * executa script nem carrega imagem enquanto o HTML é analisado.
 */
export function htmlSeguro(html: string): string {
  const modelo = document.createElement("template");
  modelo.innerHTML = html;
  const saida = document.createElement("div");

  const copiar = (origem: Node, destino: Node) => {
    for (const no of Array.from(origem.childNodes)) {
      if (no.nodeType === Node.TEXT_NODE) {
        destino.appendChild(document.createTextNode(no.textContent ?? ""));
        continue;
      }
      if (no.nodeType !== Node.ELEMENT_NODE) continue;
      const el = no as Element;
      if (TAGS_DESCARTADAS.has(el.tagName)) continue;
      if (!TAGS_PERMITIDAS.has(el.tagName)) {
        copiar(el, destino);
        continue;
      }
      const limpo = document.createElement(el.tagName.toLowerCase());
      if (el.tagName === "A") {
        const href = el.getAttribute("href") ?? "";
        if (/^(https?:|mailto:)/i.test(href.trim())) {
          limpo.setAttribute("href", href.trim());
          limpo.setAttribute("target", "_blank");
          limpo.setAttribute("rel", "noopener noreferrer");
        }
      }
      copiar(el, limpo);
      destino.appendChild(limpo);
    }
  };

  copiar(modelo.content, saida);
  return saida.innerHTML;
}

/*
 * Plano B quando o HTML do Forms não vem: o texto puro tem uma linha por
 * parágrafo. Linhas terminadas em ";" viram itens de lista, e a linha logo
 * depois delas também, porque é o último item da enumeração ("…; E outras.").
 */
export function textoEmParagrafos(texto: string): string {
  const linhas = texto
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);
  let html = "";
  let lista: string[] = [];
  const fecharLista = () => {
    if (!lista.length) return;
    html += `<ul>${lista.map((i) => `<li>${textoComLinks(i)}</li>`).join("")}</ul>`;
    lista = [];
  };
  linhas.forEach((linha, k) => {
    const anterior = linhas[k - 1] ?? "";
    if (
      linha.endsWith(";") ||
      (anterior.endsWith(";") && linha.length <= 120)
    ) {
      lista.push(linha);
    } else {
      fecharLista();
      html += `<p>${textoComLinks(linha)}</p>`;
    }
  });
  fecharLista();
  return html;
}

/** Valor do marcador "Outro" — nunca é enviado: no lugar dele vai o texto digitado. */
export const OUTRO = "__outro__";

export const CLASSES = {
  entrada:
    "block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-base text-gray-900 placeholder:text-gray-400 focus:border-meco-purple-primary focus:ring-2 focus:ring-meco-purple-primary/25 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-100 aria-[invalid=true]:border-red-600",
  rotuloMenor: "block text-sm font-semibold text-gray-700",
};

const CAMPO =
  "-mx-3 space-y-2 rounded-lg px-3 py-3 transition-colors data-[com-erro]:bg-red-50";
const TITULO = "block font-semibold text-gray-900";
const AJUDA = "text-sm whitespace-pre-line text-gray-600";
const OPCAO =
  "flex cursor-pointer items-start gap-3 rounded-lg px-2 py-1.5 text-gray-800 hover:bg-meco-purple-bg/50";
const MARCADOR = "mt-0.5 size-5 shrink-0 accent-meco-purple-primary";

// ── Peças comuns ────────────────────────────────────────────────────────────

function rotulo(item: Pergunta): string {
  return item.obrigatoria
    ? `${esc(item.titulo)} <span class="text-red-600" aria-hidden="true">*</span><span class="sr-only">(obrigatória)</span>`
    : esc(item.titulo);
}

function descritores(item: Pergunta): string {
  return [item.ajuda ? `ajuda-${item.id}` : "", `erro-${item.id}`]
    .filter(Boolean)
    .join(" ");
}

function ajuda(item: Item): string {
  if (item.ajudaHtml) {
    return `<div id="ajuda-${item.id}" class="${PROSA} prose-sm text-gray-600">${htmlSeguro(item.ajudaHtml)}</div>`;
  }
  return item.ajuda
    ? `<p id="ajuda-${item.id}" class="${AJUDA}">${textoComLinks(item.ajuda)}</p>`
    : "";
}

function erro(item: Pergunta): string {
  return `<p id="erro-${item.id}" class="text-sm font-semibold text-red-700" data-erro hidden></p>`;
}

function atributos(item: Pergunta): string {
  return `id="item-${item.id}" data-item="${item.id}" data-tipo="${item.tipo}"`;
}

/** Perguntas de um controle só (texto, lista, data): <label> aponta pro controle. */
function simples(item: Pergunta, controle: string): string {
  return `<div class="${CAMPO}" ${atributos(item)}>
    <label for="campo-${item.id}" class="${TITULO}">${rotulo(item)}</label>
    ${ajuda(item)}
    ${controle}
    ${erro(item)}
  </div>`;
}

/** Perguntas de várias opções: o <fieldset> agrupa e a <legend> é o título. */
function grupo(item: Pergunta, conteudo: string, extra = ""): string {
  // min-w-0: fieldset nasce com min-width: min-content e estouraria a coluna
  // no celular com uma opção longa.
  return `<fieldset class="${CAMPO} min-w-0" ${atributos(item)} ${extra} aria-describedby="${descritores(item)}">
    <legend class="${TITULO} mb-2">${rotulo(item)}</legend>
    ${ajuda(item)}
    ${conteudo}
    ${erro(item)}
  </fieldset>`;
}

function marcador(
  tipo: "radio" | "checkbox",
  nome: string,
  valor: string,
  texto = valor,
): string {
  return `<label class="${OPCAO}"><input type="${tipo}" name="${esc(nome)}" value="${esc(valor)}" class="${MARCADOR}"><span>${esc(texto)}</span></label>`;
}

function outro(item: ItemEscolha, tipo: "radio" | "checkbox"): string {
  return `<div class="flex flex-wrap items-center gap-x-3 gap-y-2 px-2 py-1.5">
    <label class="flex cursor-pointer items-center gap-3 text-gray-800"><input type="${tipo}" name="${item.id}" value="${OUTRO}" data-outro class="${MARCADOR} mt-0"><span>Outro:</span></label>
    <input type="text" data-texto-outro aria-label="Outro: escreva sua resposta" class="${CLASSES.entrada} min-w-0 flex-1 sm:max-w-sm">
  </div>`;
}

// ── Cada tipo ───────────────────────────────────────────────────────────────

function texto(item: ItemTexto): string {
  const regra = regraDeTexto(item);
  const comum = `id="campo-${item.id}" name="${item.id}" aria-describedby="${descritores(item)}" ${item.obrigatoria ? "required" : ""} class="${CLASSES.entrada}"`;
  if (item.tipo === "PARAGRAPH_TEXT") {
    return simples(item, `<textarea ${comum} rows="4"></textarea>`);
  }
  const tipo = regra === "email" ? "email" : regra === "url" ? "url" : "text";
  const preenchimento =
    regra === "email"
      ? 'autocomplete="email"'
      : regra === "url"
        ? 'autocomplete="url" placeholder="https://"'
        : /^nome/i.test(item.titulo)
          ? 'autocomplete="name"'
          : "";
  return simples(item, `<input type="${tipo}" ${preenchimento} ${comum}>`);
}

function escolha(item: ItemEscolha): string {
  const tipo = item.tipo === "CHECKBOX" ? "checkbox" : "radio";
  const opcoes = item.opcoes
    .map((o) => marcador(tipo, item.id, o.valor))
    .join("");
  return grupo(
    item,
    `<div class="space-y-0.5">${opcoes}${item.outro ? outro(item, tipo) : ""}</div>`,
  );
}

function lista(item: ItemEscolha): string {
  const opcoes = item.opcoes
    .map((o) => `<option value="${esc(o.valor)}">${esc(o.valor)}</option>`)
    .join("");
  return simples(
    item,
    `<select id="campo-${item.id}" name="${item.id}" aria-describedby="${descritores(item)}" ${item.obrigatoria ? "required" : ""} class="${CLASSES.entrada}"><option value="">Selecione…</option>${opcoes}</select>`,
  );
}

function grade(item: ItemGrade): string {
  const tipo = item.tipo === "GRID" ? "radio" : "checkbox";
  const linhas = item.linhas
    .map(
      (
        linha,
        k,
      ) => `<fieldset class="rounded-lg border border-gray-200 bg-white px-3 pt-1 pb-2" data-linha="${k}">
        <legend class="px-1 text-sm font-semibold text-gray-800">${esc(linha)}</legend>
        <div class="flex flex-wrap gap-x-4">${item.colunas.map((c) => marcador(tipo, `${item.id}-${k}`, c)).join("")}</div>
      </fieldset>`,
    )
    .join("");
  return grupo(item, `<div class="space-y-3">${linhas}</div>`);
}

function escala(item: ItemEscala): string {
  const numeros: number[] = [];
  for (let n = item.minimo; n <= item.maximo; n++) numeros.push(n);
  const pontas = (t: string) =>
    t ? `<span class="text-sm text-gray-600">${esc(t)}</span>` : "";
  return grupo(
    item,
    `<div class="flex flex-wrap items-center gap-2">
      ${pontas(item.rotuloMinimo)}
      ${numeros
        .map(
          (n) =>
            `<label class="flex cursor-pointer flex-col items-center gap-1 rounded-lg px-2 py-1 hover:bg-meco-purple-bg/50"><input type="radio" name="${item.id}" value="${n}" class="${MARCADOR} mt-0"><span class="text-sm text-gray-800">${n}</span></label>`,
        )
        .join("")}
      ${pontas(item.rotuloMaximo)}
    </div>`,
  );
}

function localizacao(item: ItemTexto): string {
  const id = `campo-${item.id}`;
  const ufs = UFS.map(
    (uf) => `<option value="${uf}">${esc(NOME_POR_UF[uf])} (${uf})</option>`,
  ).join("");
  const combobox = (sufixo: string, atributo: string) => `
    <div class="relative" data-combobox>
      <input id="${id}-${sufixo}" ${atributo} type="text" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="${id}-${sufixo}-lista" autocomplete="off" spellcheck="false" class="${CLASSES.entrada}">
      <ul id="${id}-${sufixo}-lista" role="listbox" aria-label="Sugestões" hidden class="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg"></ul>
    </div>`;
  return grupo(
    item,
    `<div class="grid gap-3 sm:grid-cols-3">
      <div class="space-y-1">
        <label for="${id}-pais" class="${CLASSES.rotuloMenor}">País</label>
        ${combobox("pais", "data-pais")}
      </div>
      <div class="space-y-1" data-bloco-uf>
        <label for="${id}-uf" class="${CLASSES.rotuloMenor}">Estado</label>
        <select id="${id}-uf" data-uf class="${CLASSES.entrada}"><option value="">Selecione…</option>${ufs}</select>
      </div>
      <div class="space-y-1">
        <label for="${id}-cidade" class="${CLASSES.rotuloMenor}">Cidade</label>
        ${combobox("cidade", "data-cidade")}
      </div>
    </div>
    <p class="text-sm text-gray-600" data-dica-cidade hidden></p>`,
    "data-localizacao",
  );
}

function informativo(item: Item): string {
  return `<div class="space-y-1 border-t border-gray-200 pt-5">
    ${item.titulo ? `<h3 class="font-epilogue text-lg font-bold text-meco-purple-deep">${esc(item.titulo)}</h3>` : ""}
    ${ajuda(item)}
  </div>`;
}

/** HTML do item; "" pros tipos que a página não sabe mostrar. */
export function renderizarItem(item: Item): string {
  if (!ehPergunta(item)) {
    return item.tipo === "SECTION_HEADER" ||
      item.tipo === "IMAGE" ||
      item.tipo === "VIDEO"
      ? informativo(item)
      : "";
  }
  if (ehLocalizacao(item)) return localizacao(item as ItemTexto);
  switch (item.tipo) {
    case "TEXT":
    case "PARAGRAPH_TEXT":
      return texto(item);
    case "DATE":
      return simples(
        item,
        `<input type="date" id="campo-${item.id}" name="${item.id}" aria-describedby="${descritores(item)}" ${item.obrigatoria ? "required" : ""} class="${CLASSES.entrada} sm:max-w-xs">`,
      );
    case "MULTIPLE_CHOICE":
    case "CHECKBOX":
      return escolha(item);
    case "LIST":
      return lista(item);
    case "GRID":
    case "CHECKBOX_GRID":
      return grade(item);
    case "SCALE":
      return escala(item);
  }
}

// ── DOM ↔ resposta ──────────────────────────────────────────────────────────

const marcadosEm = (el: Element, seletor = "input:checked") =>
  Array.from(el.querySelectorAll<HTMLInputElement>(seletor));

const textoDoOutro = (el: Element) =>
  el.querySelector<HTMLInputElement>("[data-texto-outro]")?.value.trim() ?? "";

/** "Outro" marcado sem texto: a mensagem certa é pedir o texto, não a opção. */
export function outroSemTexto(el: Element): boolean {
  return Boolean(el.querySelector("[data-outro]:checked")) && !textoDoOutro(el);
}

/** Lê do DOM a resposta de uma pergunta que não é de localização. */
export function lerResposta(el: HTMLElement, item: Pergunta): Valor {
  switch (item.tipo) {
    case "TEXT":
    case "PARAGRAPH_TEXT":
    case "DATE":
      return el.querySelector<HTMLInputElement>("input, textarea")?.value ?? "";
    case "LIST":
      return el.querySelector("select")?.value ?? "";
    case "MULTIPLE_CHOICE":
    case "SCALE": {
      const marcado = marcadosEm(el, "input[type=radio]:checked")[0];
      if (!marcado) return "";
      return marcado.value === OUTRO ? textoDoOutro(el) : marcado.value;
    }
    case "CHECKBOX":
      return marcadosEm(el, "input[type=checkbox]:checked").map((m) =>
        m.value === OUTRO ? textoDoOutro(el) : m.value,
      );
    case "GRID":
      return item.linhas.map(
        (_, k) =>
          marcadosEm(el.querySelector(`[data-linha="${k}"]`)!)[0]?.value ?? "",
      );
    case "CHECKBOX_GRID":
      return item.linhas.map((_, k) =>
        marcadosEm(el.querySelector(`[data-linha="${k}"]`)!).map(
          (m) => m.value,
        ),
      );
  }
}

function marcarValores(el: Element, valores: string[], comOutro: boolean) {
  const sobra = new Set(valores);
  el.querySelectorAll<HTMLInputElement>(
    "input[type=radio], input[type=checkbox]",
  ).forEach((m) => {
    if (m.value === OUTRO) return;
    m.checked = sobra.delete(m.value);
  });
  const textoOutro = [...sobra][0];
  if (comOutro && textoOutro) {
    el.querySelector<HTMLInputElement>("[data-outro]")!.checked = true;
    el.querySelector<HTMLInputElement>("[data-texto-outro]")!.value =
      textoOutro;
  }
}

/** Reaplica no DOM uma resposta salva (rascunho). Ignora o que não couber. */
export function aplicarResposta(el: HTMLElement, item: Pergunta, valor: Valor) {
  switch (item.tipo) {
    case "TEXT":
    case "PARAGRAPH_TEXT":
    case "DATE": {
      const campo = el.querySelector<HTMLInputElement>("input, textarea");
      if (campo && typeof valor === "string") campo.value = valor;
      return;
    }
    case "LIST": {
      const campo = el.querySelector("select");
      if (campo && typeof valor === "string") campo.value = valor;
      return;
    }
    case "MULTIPLE_CHOICE":
    case "SCALE":
      if (typeof valor === "string" && valor)
        marcarValores(
          el,
          [valor],
          item.tipo === "MULTIPLE_CHOICE" && item.outro,
        );
      return;
    case "CHECKBOX":
      if (Array.isArray(valor))
        marcarValores(
          el,
          valor.filter((v): v is string => typeof v === "string"),
          item.outro,
        );
      return;
    case "GRID":
    case "CHECKBOX_GRID":
      if (!Array.isArray(valor)) return;
      valor.forEach((linha, k) => {
        const bloco = el.querySelector(`[data-linha="${k}"]`);
        if (!bloco) return;
        const valores = Array.isArray(linha) ? linha : [linha];
        marcarValores(
          bloco,
          valores.filter((v): v is string => typeof v === "string"),
          false,
        );
      });
      return;
  }
}
