/*
 * Caixa de texto com lista de sugestões (padrão "combobox" da WAI-ARIA), usada
 * no país e na cidade do cadastro.
 *
 * Existe porque o <datalist> nativo não serve aqui: ele não ignora acento
 * ("sao paulo" não acha "São Paulo"), e é assim que muita gente digita no
 * celular. A resposta só vale quando o texto bate com uma opção da lista; no
 * modo livre (sem lista), vale o que foi digitado.
 */

import { normalizarNome } from "@/utils/formulario";
import { esc } from "./campos";

export interface Combobox {
  /** A opção escolhida, ou "" se o texto não bate com nenhuma. No modo livre, o texto. */
  valor(): string;
  definir(texto: string): void;
  /** `null` liga o modo livre: sem lista, aceita o que for digitado. */
  usarOpcoes(lista: readonly string[] | null): void;
  habilitar(sim: boolean, dica?: string): void;
}

const MAXIMO_VISIVEL = 50;

export function criarCombobox(
  raiz: HTMLElement,
  { aoMudar, semResultado }: { aoMudar: () => void; semResultado: string },
): Combobox {
  const entrada = raiz.querySelector("input")!;
  const lista = raiz.querySelector("ul")!;

  let opcoes: { nome: string; chave: string }[] | null = [];
  let visiveis: string[] = [];
  let ativa = -1;

  function filtrar(texto: string): string[] {
    if (!opcoes) return [];
    const busca = normalizarNome(texto);
    if (!busca) return opcoes.slice(0, MAXIMO_VISIVEL).map((o) => o.nome);
    // Começa com o texto > alguma palavra começa com ele > contém em qualquer lugar.
    const inicio: string[] = [];
    const palavra: string[] = [];
    const meio: string[] = [];
    for (const o of opcoes) {
      if (o.chave.startsWith(busca)) inicio.push(o.nome);
      else if (o.chave.includes(" " + busca)) palavra.push(o.nome);
      else if (o.chave.includes(busca)) meio.push(o.nome);
    }
    return [...inicio, ...palavra, ...meio].slice(0, MAXIMO_VISIVEL);
  }

  function desenhar() {
    lista.innerHTML = visiveis.length
      ? visiveis
          .map(
            (nome, k) =>
              `<li id="${lista.id}-${k}" role="option" aria-selected="false" data-indice="${k}" class="cursor-pointer px-3 py-2 text-base text-gray-900 hover:bg-meco-purple-bg/60 aria-selected:bg-meco-purple-bg">${esc(nome)}</li>`,
          )
          .join("")
      : `<li class="px-3 py-2 text-sm text-gray-500">${esc(semResultado)}</li>`;
  }

  function abrir() {
    if (!opcoes || entrada.disabled) return;
    visiveis = filtrar(entrada.value);
    ativa = -1;
    entrada.removeAttribute("aria-activedescendant");
    desenhar();
    lista.hidden = false;
    entrada.setAttribute("aria-expanded", "true");
  }

  function fechar() {
    lista.hidden = true;
    ativa = -1;
    entrada.setAttribute("aria-expanded", "false");
    entrada.removeAttribute("aria-activedescendant");
  }

  function marcar(k: number) {
    if (!visiveis.length) return;
    ativa = Math.max(0, Math.min(k, visiveis.length - 1));
    lista.querySelectorAll("[role=option]").forEach((li, j) => {
      li.setAttribute("aria-selected", String(j === ativa));
    });
    const li = document.getElementById(`${lista.id}-${ativa}`);
    if (li) {
      entrada.setAttribute("aria-activedescendant", li.id);
      li.scrollIntoView?.({ block: "nearest" });
    }
  }

  function escolher(k: number) {
    entrada.value = visiveis[k];
    fechar();
    aoMudar();
  }

  function valor(): string {
    if (!opcoes) return entrada.value.trim();
    const chave = normalizarNome(entrada.value);
    return opcoes.find((o) => o.chave === chave)?.nome ?? "";
  }

  entrada.addEventListener("input", () => {
    abrir();
    aoMudar();
  });
  entrada.addEventListener("click", () => {
    if (lista.hidden) abrir();
  });
  entrada.addEventListener("keydown", (e) => {
    if (!opcoes) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (lista.hidden) abrir();
      marcar(ativa + 1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      marcar(ativa - 1);
    } else if (e.key === "Enter" && !lista.hidden) {
      e.preventDefault();
      if (ativa >= 0) escolher(ativa);
      else if (visiveis.length === 1) escolher(0);
    } else if (e.key === "Escape" && !lista.hidden) {
      e.preventDefault();
      fechar();
    }
  });
  entrada.addEventListener("blur", () => {
    fechar();
    // "sao paulo" vira "São Paulo" ao sair do campo, se bater com a lista.
    const v = valor();
    if (opcoes && v && v !== entrada.value) {
      entrada.value = v;
      aoMudar();
    }
  });
  // mousedown tiraria o foco do campo antes do clique chegar na opção.
  lista.addEventListener("mousedown", (e) => e.preventDefault());
  lista.addEventListener("click", (e) => {
    const li = (e.target as HTMLElement).closest<HTMLElement>("[data-indice]");
    if (li) escolher(Number(li.dataset.indice));
  });

  return {
    valor,
    definir(texto) {
      entrada.value = texto;
      fechar();
    },
    usarOpcoes(novas) {
      opcoes = novas
        ? novas.map((nome) => ({ nome, chave: normalizarNome(nome) }))
        : null;
      entrada.setAttribute("aria-autocomplete", novas ? "list" : "none");
      if (novas) entrada.setAttribute("role", "combobox");
      else entrada.removeAttribute("role");
      fechar();
    },
    habilitar(sim, dica) {
      entrada.disabled = !sim;
      if (dica !== undefined) entrada.placeholder = dica;
      if (!sim) fechar();
    },
  };
}
