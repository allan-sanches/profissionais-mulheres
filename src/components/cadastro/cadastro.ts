/*
 * Página /cadastro: busca a estrutura do Google Forms em /api/formulario.json
 * e monta o formulário em etapas, uma por seção do Forms, seguindo os mesmos
 * desvios ("Ir para a seção com base na resposta").
 *
 * As respostas ficam salvas na sessionStorage enquanto a aba estiver aberta:
 * um recarregamento (ou o aviso de "o formulário mudou") não apaga o que já
 * foi preenchido. É sessionStorage, e não localStorage, de propósito: são
 * dados pessoais sensíveis e não devem ficar num computador compartilhado
 * depois que a aba fecha.
 */

import {
  ENVIAR,
  MENSAGENS,
  caminho,
  dividirEmSecoes,
  ehLocalizacao,
  ehPergunta,
  prepararEnvio,
  proximaSecao,
  validarItem,
  type Estrutura,
  type Localizacao,
  type Pergunta,
  type Respostas,
  type Valor,
} from "@/utils/formulario";
import {
  aplicarResposta,
  esc,
  lerResposta,
  outroSemTexto,
  renderizarItem,
  textoComLinks,
} from "./campos";
import { montarLocalizacao, type CampoLocalizacao } from "./localizacao";
import { obterToken, prepararTurnstile } from "./turnstile";

const CHAVE_DO_RASCUNHO = "cadastro:rascunho";

type Estado =
  | "carregando"
  | "indisponivel"
  | "fechado"
  | "formulario"
  | "enviado";

function mostrarEstado(raiz: HTMLElement, estado: Estado) {
  raiz.querySelectorAll<HTMLElement>("[data-estado]").forEach((el) => {
    el.hidden = el.dataset.estado !== estado;
  });
  raiz.setAttribute("aria-busy", String(estado === "carregando"));
}

export function iniciarCadastro() {
  const raiz = document.getElementById("cadastro");
  if (!raiz || raiz.dataset.iniciado) return;
  raiz.dataset.iniciado = "sim";
  void carregar(raiz);
}

async function carregar(raiz: HTMLElement) {
  // Quando o CDN não tem a estrutura guardada, o Google leva uns 10 s pra
  // responder. Sem aviso, a página parece travada.
  const demora = setTimeout(() => {
    const texto = raiz.querySelector("[data-estado=carregando] p");
    if (texto) {
      texto.textContent =
        "Ainda carregando: as perguntas vêm do Google Forms e às vezes levam alguns segundos.";
    }
  }, 4000);

  let estrutura: Estrutura;
  try {
    const res = await fetch("/api/formulario.json");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    estrutura = await res.json();
    if (!Array.isArray(estrutura?.itens))
      throw new Error("estrutura sem itens");
  } catch (e) {
    console.error("[cadastro] não foi possível carregar o formulário:", e);
    mostrarEstado(raiz, "indisponivel");
    return;
  } finally {
    clearTimeout(demora);
  }

  // O Forms recusaria o envio no fim: melhor avisar antes de a pessoa
  // preencher tudo. Quem cuida do formulário vê o motivo no console.
  if (estrutura.problemas?.length) {
    console.error(
      "[cadastro] o formulário não aceita envio pelo site:",
      estrutura.problemas,
    );
    mostrarEstado(raiz, "indisponivel");
    return;
  }

  if (!estrutura.aceitandoRespostas) {
    const mensagem = raiz.querySelector<HTMLElement>("[data-mensagem-fechado]");
    if (mensagem && estrutura.mensagemFechado) {
      mensagem.innerHTML = textoComLinks(estrutura.mensagemFechado);
    }
    mostrarEstado(raiz, "fechado");
    return;
  }

  montar(raiz, estrutura);
}

function montar(raiz: HTMLElement, estrutura: Estrutura) {
  const form = raiz.querySelector<HTMLFormElement>("form")!;
  const cabecalho = form.querySelector<HTMLElement>("[data-cabecalho]")!;
  const areaSecoes = form.querySelector<HTMLElement>("[data-secoes]")!;
  const botaoVoltar = form.querySelector<HTMLButtonElement>("[data-voltar]")!;
  const botaoAvancar = form.querySelector<HTMLButtonElement>("[data-avancar]")!;
  const progresso = form.querySelector<HTMLElement>("[data-progresso]")!;
  const aviso = form.querySelector<HTMLElement>("[data-aviso]")!;
  const caixaTurnstile = form.querySelector<HTMLElement>("[data-turnstile]")!;
  const isca = form.querySelector<HTMLInputElement>("[name=site_web]")!;
  const avisoRascunho = form.querySelector<HTMLElement>("[data-rascunho]")!;

  const secoes = dividirEmSecoes(estrutura.itens);

  // ── Desenha ───────────────────────────────────────────────────────────────

  cabecalho.innerHTML = `
    <h1 class="font-epilogue text-2xl font-bold text-meco-purple-deep sm:text-3xl">${esc(estrutura.titulo)}</h1>
    ${estrutura.descricao ? `<p class="mt-3 whitespace-pre-line text-gray-700">${textoComLinks(estrutura.descricao)}</p>` : ""}
    <p class="mt-4 text-sm text-gray-600"><span class="text-red-600" aria-hidden="true">*</span> Indica uma pergunta obrigatória</p>`;

  areaSecoes.innerHTML = secoes
    .map(
      (secao, i) => `
      <section data-secao="${i}" hidden aria-labelledby="titulo-secao-${i}" class="space-y-4">
        <div class="space-y-1">
          <h2 id="titulo-secao-${i}" tabindex="-1" class="font-epilogue text-xl font-bold text-meco-purple-deep focus:outline-none ${i === 0 && !secao.titulo ? "sr-only" : ""}">${esc(secao.titulo || "Primeira parte")}</h2>
          ${secao.ajuda ? `<p class="whitespace-pre-line text-gray-700">${textoComLinks(secao.ajuda)}</p>` : ""}
        </div>
        ${secao.itens.map(renderizarItem).join("")}
      </section>`,
    )
    .join("");

  const elementosDasSecoes = Array.from(
    areaSecoes.querySelectorAll<HTMLElement>("[data-secao]"),
  );

  const perguntas = new Map<string, Pergunta>();
  const elementos = new Map<string, HTMLElement>();
  const locais = new Map<string, CampoLocalizacao>();
  const secaoDoItem = new Map<string, number>();

  secoes.forEach((secao, i) => {
    for (const item of secao.itens) {
      if (!ehPergunta(item)) {
        if (!renderizarItem(item)) {
          console.warn(
            `[cadastro] tipo "${item.tipo}" não é mostrado no site: "${item.titulo}"`,
          );
        }
        continue;
      }
      const el = areaSecoes.querySelector<HTMLElement>(
        `[data-item="${item.id}"]`,
      );
      if (!el) continue;
      perguntas.set(item.id, item);
      elementos.set(item.id, el);
      secaoDoItem.set(item.id, i);
      if (ehLocalizacao(item))
        locais.set(item.id, montarLocalizacao(el, aoMudar));
    }
  });

  // ── Respostas ─────────────────────────────────────────────────────────────

  const ler = (item: Pergunta): Valor =>
    locais.get(item.id)?.ler() ?? lerResposta(elementos.get(item.id)!, item);

  function coletar(): Respostas {
    const respostas: Respostas = {};
    for (const item of perguntas.values()) respostas[item.id] = ler(item);
    return respostas;
  }

  // ── Erros ─────────────────────────────────────────────────────────────────

  function mostrarErro(id: string, mensagem: string | null) {
    const el = elementos.get(id);
    if (!el) return;
    const p = el.querySelector<HTMLElement>("[data-erro]")!;
    p.textContent = mensagem ?? "";
    p.hidden = !mensagem;
    el.toggleAttribute("data-com-erro", Boolean(mensagem));
    el.querySelectorAll(
      "input:not([type=radio]):not([type=checkbox]), select, textarea",
    ).forEach((c) => {
      if (mensagem) c.setAttribute("aria-invalid", "true");
      else c.removeAttribute("aria-invalid");
    });
  }

  function focarErro(id: string) {
    const el = elementos.get(id);
    if (!el) return;
    el.scrollIntoView({ block: "center", behavior: "smooth" });
    el.querySelector<HTMLElement>(
      "input:not([disabled]):not([type=hidden]), select:not([disabled]), textarea",
    )?.focus({ preventScroll: true });
  }

  function validarSecao(i: number): string[] {
    const comErro: string[] = [];
    for (const item of secoes[i].itens) {
      if (!ehPergunta(item) || !elementos.has(item.id)) continue;
      const mensagem = outroSemTexto(elementos.get(item.id)!)
        ? MENSAGENS.outroVazio
        : validarItem(item, ler(item));
      mostrarErro(item.id, mensagem);
      if (mensagem) comErro.push(item.id);
    }
    return comErro;
  }

  function avisar(html: string, tipo: "erro" | "info" = "erro") {
    aviso.innerHTML = html;
    aviso.hidden = !html;
    aviso.className =
      tipo === "erro"
        ? "rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900"
        : "rounded-lg border border-meco-purple-soft/50 bg-meco-purple-bg/40 p-4 text-sm text-gray-800";
  }

  // ── Navegação ─────────────────────────────────────────────────────────────

  let historico: number[] = [0];
  const atual = () => historico[historico.length - 1];

  function atualizarBotoes() {
    botaoVoltar.hidden = historico.length === 1;
    const seguinte = proximaSecao(secoes, atual(), coletar());
    botaoAvancar.textContent = seguinte === ENVIAR ? "Enviar" : "Próxima";
    progresso.textContent =
      secoes.length > 1 ? `Parte ${historico.length}` : "";
  }

  function mostrar(i: number, focar = true) {
    elementosDasSecoes.forEach((s, j) => (s.hidden = j !== i));
    atualizarBotoes();
    if (focar) {
      form.scrollIntoView({ block: "start", behavior: "smooth" });
      elementosDasSecoes[i]
        .querySelector<HTMLElement>("h2")
        ?.focus({ preventScroll: true });
    }
  }

  function aoMudar() {
    atualizarBotoes();
    salvarRascunho();
  }

  form.addEventListener("input", (e) => {
    const alvo = e.target as HTMLElement;
    // Digitar no "Outro" já marca a opção, como no Forms.
    if (
      alvo.matches("[data-texto-outro]") &&
      (alvo as HTMLInputElement).value
    ) {
      const marcador = alvo
        .closest("[data-item]")
        ?.querySelector<HTMLInputElement>("[data-outro]");
      if (marcador) marcador.checked = true;
    }
    const id = alvo.closest<HTMLElement>("[data-item]")?.dataset.item;
    if (id) mostrarErro(id, null);
    aoMudar();
  });
  form.addEventListener("change", aoMudar);
  // Os botões são type="button"; isto só barra um envio nativo acidental.
  form.addEventListener("submit", (e) => e.preventDefault());

  botaoVoltar.addEventListener("click", () => {
    if (historico.length > 1) historico.pop();
    avisar("");
    salvarRascunho();
    mostrar(atual());
  });

  botaoAvancar.addEventListener("click", () => {
    const comErro = validarSecao(atual());
    if (comErro.length) {
      avisar("Revise as perguntas destacadas antes de continuar.");
      focarErro(comErro[0]);
      return;
    }
    avisar("");
    const seguinte = proximaSecao(secoes, atual(), coletar());
    if (seguinte === ENVIAR) {
      void enviar();
      return;
    }
    historico.push(seguinte);
    salvarRascunho();
    mostrar(seguinte);
  });

  // ── Rascunho ──────────────────────────────────────────────────────────────

  let espera: ReturnType<typeof setTimeout> | undefined;
  function salvarRascunho() {
    clearTimeout(espera);
    espera = setTimeout(() => {
      try {
        sessionStorage.setItem(
          CHAVE_DO_RASCUNHO,
          JSON.stringify({ respostas: coletar(), historico }),
        );
      } catch {
        // Sem storage (aba anônima, cota cheia): segue sem rascunho.
      }
    }, 300);
  }

  function apagarRascunho() {
    clearTimeout(espera);
    try {
      sessionStorage.removeItem(CHAVE_DO_RASCUNHO);
    } catch {
      // idem
    }
  }

  async function restaurarRascunho(): Promise<boolean> {
    let salvo: { respostas?: Respostas; historico?: unknown } | null = null;
    try {
      salvo = JSON.parse(sessionStorage.getItem(CHAVE_DO_RASCUNHO) || "null");
    } catch {
      return false;
    }
    if (!salvo?.respostas || typeof salvo.respostas !== "object") return false;

    let algum = false;
    for (const [id, valor] of Object.entries(salvo.respostas)) {
      const item = perguntas.get(id);
      if (!item || valor === undefined || valor === null) continue;
      try {
        const local = locais.get(id);
        if (local) await local.aplicar(valor as Localizacao);
        else aplicarResposta(elementos.get(id)!, item, valor);
        algum = true;
      } catch {
        // Formato que não cabe mais (a pergunta mudou de tipo): ignora.
      }
    }
    const h = salvo.historico;
    if (
      Array.isArray(h) &&
      h[0] === 0 &&
      h.every((n) => Number.isInteger(n) && n >= 0 && n < secoes.length)
    ) {
      historico = h as number[];
    }
    return algum;
  }

  // ── Envio ─────────────────────────────────────────────────────────────────

  function irParaErros(erros: Record<string, string>) {
    const ids = Object.keys(erros);
    if (ids.some((id) => !elementos.has(id))) {
      formularioMudou();
      return;
    }
    // Volta pra primeira seção do caminho que tem erro.
    const posicao = historico.findIndex((i) =>
      ids.some((id) => secaoDoItem.get(id) === i),
    );
    if (posicao >= 0) historico = historico.slice(0, posicao + 1);
    mostrar(atual(), false);
    ids.forEach((id) => mostrarErro(id, erros[id]));
    avisar(
      "Algumas respostas precisam de ajuste. Revise as perguntas destacadas.",
    );
    focarErro(ids.find((id) => secaoDoItem.get(id) === atual()) ?? ids[0]);
  }

  function formularioMudou() {
    avisar(
      `O formulário foi atualizado enquanto você preenchia. Recarregue a página para ver a versão nova: o que você já respondeu continua salvo nesta aba.
      <button type="button" data-recarregar class="mt-3 block rounded-lg bg-meco-purple-primary px-4 py-2 font-bold text-white hover:bg-meco-purple-deep">Recarregar</button>`,
    );
    aviso
      .querySelector("[data-recarregar]")
      ?.addEventListener("click", () => location.reload());
  }

  async function enviar() {
    const respostas = coletar();
    const { erros } = prepararEnvio(estrutura, respostas);
    if (Object.keys(erros).length) {
      irParaErros(erros);
      return;
    }

    // Só vai o que está no caminho: quem pulou uma seção não envia o que
    // chegou a preencher nela antes de voltar e mudar de ideia.
    const noCaminho = new Set(
      caminho(secoes, respostas).flatMap((i) =>
        secoes[i].itens.map((it) => it.id),
      ),
    );
    const envio = Object.fromEntries(
      Object.entries(respostas).filter(([id]) => noCaminho.has(id)),
    );

    botaoAvancar.disabled = true;
    botaoVoltar.disabled = true;
    botaoAvancar.textContent = "Enviando…";
    form.setAttribute("aria-busy", "true");
    try {
      let turnstile: string | undefined;
      try {
        turnstile = await obterToken(caixaTurnstile);
      } catch {
        avisar(
          "Não conseguimos confirmar que você não é um robô. Tente enviar de novo.",
        );
        return;
      }
      const res = await fetch("/api/cadastro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          respostas: envio,
          turnstile,
          site_web: isca.value,
        }),
      });
      const dados = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        codigo?: string;
        erros?: Record<string, string>;
      };
      if (res.ok && dados.ok) {
        concluir();
        return;
      }
      switch (dados.codigo) {
        case "invalido":
          irParaErros(dados.erros ?? {});
          break;
        case "formulario-mudou":
          formularioMudou();
          break;
        case "fechado":
          apagarRascunho();
          mostrarEstado(raiz, "fechado");
          break;
        case "verificacao":
          avisar(
            "Não conseguimos confirmar que você não é um robô. Tente enviar de novo.",
          );
          break;
        default:
          avisar(
            "Não foi possível enviar agora. Suas respostas continuam aqui: tente de novo em alguns minutos.",
          );
      }
    } catch (e) {
      console.error("[cadastro] falha no envio:", e);
      avisar(
        "Não foi possível enviar agora. Confira sua conexão e tente de novo: suas respostas continuam aqui.",
      );
    } finally {
      botaoAvancar.disabled = false;
      botaoVoltar.disabled = false;
      form.removeAttribute("aria-busy");
      if (!form.hidden) atualizarBotoes();
    }
  }

  function concluir() {
    apagarRascunho();
    const confirmacao = raiz.querySelector<HTMLElement>("[data-confirmacao]")!;
    if (estrutura.confirmacao)
      confirmacao.innerHTML = textoComLinks(estrutura.confirmacao);
    mostrarEstado(raiz, "enviado");
    raiz.scrollIntoView({ block: "start", behavior: "smooth" });
    raiz
      .querySelector<HTMLElement>("[data-estado=enviado] h2")
      ?.focus({ preventScroll: true });
  }

  // ── Começa ────────────────────────────────────────────────────────────────

  avisoRascunho
    .querySelector("[data-descartar]")
    ?.addEventListener("click", () => {
      apagarRascunho();
      location.reload();
    });

  mostrarEstado(raiz, "formulario");
  mostrar(0, false);
  prepararTurnstile();

  void restaurarRascunho().then((restaurou) => {
    if (!restaurou) return;
    avisoRascunho.hidden = false;
    mostrar(atual(), false);
  });
}
