/*
 * Formulário de cadastro (/cadastro): a estrutura que o Apps Script devolve
 * (apps-script/Cadastro.gs) e as regras que valem nos dois lados — o navegador
 * usa pra guiar quem preenche, o servidor (src/pages/api/cadastro.ts) usa de
 * novo antes de gravar, porque resposta criada por script não passa pela
 * validação do Google Forms.
 *
 * Sem dependência de servidor nem de DOM: este módulo entra no bundle da
 * página e na função da Vercel.
 */

import PAISES from "@/data/paises.json";
import { NOME_POR_UF } from "@/utils/labels";

// ── Estrutura (o que o Apps Script devolve) ────────────────────────────────

/** ID de uma seção, ou "ENVIAR", "REINICIAR", "SEGUIR" (próxima na ordem). */
export type Destino = string;

export interface Opcao {
  valor: string;
  /** Só existe nas opções de pergunta com "Ir para a seção com base na resposta". */
  destino?: Destino;
}

interface Base {
  id: string;
  titulo: string;
  ajuda: string;
  /** A ajuda com negrito, itálico e listas, quando o servidor consegue ler. */
  ajudaHtml?: string;
}

export interface ItemTexto extends Base {
  tipo: "TEXT" | "PARAGRAPH_TEXT";
  obrigatoria: boolean;
}

export interface ItemData extends Base {
  tipo: "DATE";
  obrigatoria: boolean;
  incluiAno: boolean;
}

export interface ItemEscolha extends Base {
  tipo: "MULTIPLE_CHOICE" | "LIST" | "CHECKBOX";
  obrigatoria: boolean;
  outro: boolean;
  opcoes: Opcao[];
}

export interface ItemGrade extends Base {
  tipo: "GRID" | "CHECKBOX_GRID";
  obrigatoria: boolean;
  linhas: string[];
  colunas: string[];
}

export interface ItemEscala extends Base {
  tipo: "SCALE";
  obrigatoria: boolean;
  minimo: number;
  maximo: number;
  rotuloMinimo: string;
  rotuloMaximo: string;
}

export interface ItemQuebra extends Base {
  tipo: "PAGE_BREAK";
  /** O "Após a seção N" do Forms fica na quebra que abre a seção N+1. */
  aposSecaoAnterior: Destino | null;
}

export interface ItemInformativo extends Base {
  tipo: "SECTION_HEADER" | "IMAGE" | "VIDEO";
}

/** Tipos que a página ainda não sabe mostrar. Ficam de fora sem quebrar nada. */
export interface ItemNaoSuportado extends Base {
  tipo:
    | "FILE_UPLOAD"
    | "TIME"
    | "DATETIME"
    | "DURATION"
    | "RATING"
    | "UNSUPPORTED";
}

export type Pergunta =
  | ItemTexto
  | ItemData
  | ItemEscolha
  | ItemGrade
  | ItemEscala;

export type Item = Pergunta | ItemQuebra | ItemInformativo | ItemNaoSuportado;

export interface Estrutura {
  titulo: string;
  descricao: string;
  /**
   * A descrição com a formatação do Forms (negrito, itálico, listas). O Apps
   * Script só entrega texto puro; esta versão vem da página pública do
   * formulário (ver formulario-servidor.ts) e pode faltar.
   */
  descricaoHtml?: string;
  confirmacao: string;
  aceitandoRespostas: boolean;
  mensagemFechado: string;
  /**
   * Configurações do Forms que impedem o envio pelo site (coletar e-mail,
   * limitar a 1 resposta). Com alguma, o cadastro fica indisponível.
   */
  problemas?: string[];
  /** ID da planilha que recebe as respostas; null se não há planilha ligada. */
  planilha?: string | null;
  itens: Item[];
}

const TIPOS_DE_PERGUNTA = new Set<string>([
  "TEXT",
  "PARAGRAPH_TEXT",
  "DATE",
  "MULTIPLE_CHOICE",
  "LIST",
  "CHECKBOX",
  "GRID",
  "CHECKBOX_GRID",
  "SCALE",
]);

export function ehPergunta(item: Item): item is Pergunta {
  return TIPOS_DE_PERGUNTA.has(item.tipo);
}

// ── Respostas ───────────────────────────────────────────────────────────────

export interface Localizacao {
  pais: string;
  uf: string;
  cidade: string;
}

/**
 * Como a página guarda cada resposta. Grade de múltipla escolha: uma string
 * por linha ("" = sem resposta). Grade de caixas: uma lista por linha.
 */
export type Valor = string | string[] | string[][] | Localizacao;
export type Respostas = Record<string, Valor | undefined>;

/** O formato que o Apps Script espera em cada tipo (null = linha vazia). */
export type ValorFormulario =
  | string
  | string[]
  | (string | null)[]
  | (string[] | null)[];

// ── Localização ─────────────────────────────────────────────────────────────

/*
 * Perguntas de localização trocam a caixa de texto por País, Estado e Cidade.
 * A resposta continua indo como texto pra mesma pergunta do Forms, sempre no
 * formato "Campinas, SP, Brasil" (ou "Lisboa, Portugal"), que o parseRegion de
 * labels.ts já entende. Assim a planilha e o sync não mudam.
 *
 * O título é o critério padrão. Se a equipe renomear a pergunta, coloque o ID
 * dela aqui (aparece em /api/formulario.json) e o campo continua especial.
 */
export const LOCALIZACAO = {
  ids: [] as string[],
  titulo: /cidade.*estado.*pa[ií]s/i,
};

export const BRASIL = "Brasil";
export const UFS = Object.keys(NOME_POR_UF).sort((a, b) =>
  NOME_POR_UF[a].localeCompare(NOME_POR_UF[b], "pt-BR"),
);
export { NOME_POR_UF, PAISES };

// Boolean, e não `item is ItemTexto`: o "não" de uma guarda de tipo faria o
// TypeScript concluir que o item não é de texto, e nem todo texto é localização.
export function ehLocalizacao(item: Item): boolean {
  return (
    (item.tipo === "TEXT" || item.tipo === "PARAGRAPH_TEXT") &&
    (LOCALIZACAO.ids.includes(item.id) || LOCALIZACAO.titulo.test(item.titulo))
  );
}

/** Comparação tolerante: sem acento, sem caixa, apóstrofo curvo igual ao reto. */
export function normalizarNome(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[’‘`´]/g, "'")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** A grafia oficial da cidade na lista da UF, se ela estiver lá. */
export function cidadeNaLista(
  cidade: string,
  lista: readonly string[],
): string | undefined {
  const alvo = normalizarNome(cidade);
  return lista.find((nome) => normalizarNome(nome) === alvo);
}

export function localizacaoComoTexto(l: Localizacao): string {
  const cidade = l.cidade.trim();
  return l.pais === BRASIL
    ? `${cidade}, ${l.uf}, ${BRASIL}`
    : `${cidade}, ${l.pais}`;
}

// ── Regras de texto ─────────────────────────────────────────────────────────

/*
 * O Apps Script não consegue ler a validação configurada no Forms, então as
 * regras de formato moram aqui, escolhidas pelo título da pergunta.
 *
 * A de link só barra resposta em pergunta OPCIONAL. Hoje o Forms exige Lattes,
 * ResearchGate, Instagram e site; exigir também um link válido travaria quem
 * não tem ResearchGate, ou a pesquisadora estrangeira sem Lattes, sem saída
 * nenhuma. Em pergunta obrigatória o link só é completado ("https://") quando
 * dá pra reconhecer um.
 */
type RegraDeTexto = "email" | "url";

const REGRAS_DE_TEXTO: { titulo: RegExp; regra: RegraDeTexto }[] = [
  { titulo: /e-?mail/i, regra: "email" },
  { titulo: /\blink\b|\bsite\b|\bblog\b/i, regra: "url" },
];

export function regraDeTexto(item: Item): RegraDeTexto | undefined {
  if (item.tipo !== "TEXT" || ehLocalizacao(item)) return undefined;
  return REGRAS_DE_TEXTO.find((r) => r.titulo.test(item.titulo))?.regra;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Aceita link sem "https://" ("lattes.cnpq.br/123") e devolve completo. */
export function normalizarUrl(texto: string): string | null {
  const t = texto.trim();
  if (!t || /\s/.test(t)) return null;
  try {
    const url = new URL(
      /^[a-z][a-z0-9+.-]*:\/\//i.test(t) ? t : `https://${t}`,
    );
    if (!/^https?:$/.test(url.protocol) || !url.hostname.includes("."))
      return null;
    return url.href;
  } catch {
    return null;
  }
}

const LIMITE = { TEXT: 1000, PARAGRAPH_TEXT: 10000 } as const;

// ── Validação ───────────────────────────────────────────────────────────────

export const MENSAGENS = {
  obrigatoria: "Esta pergunta é obrigatória.",
  formato:
    "Resposta em formato inesperado. Recarregue a página e tente de novo.",
  opcao: "Escolha uma das opções.",
  outroVazio: "Escreva sua resposta no campo “Outro” ou desmarque a opção.",
  // O sync separa listas por vírgula: "Outro" com vírgula viraria duas tags.
  virgula:
    "Não use vírgula no campo “Outro”: o site usa a vírgula para separar respostas.",
};

export interface OpcoesDeValidacao {
  /** No servidor, confere se a cidade existe na UF. */
  municipiosDe?: (uf: string) => readonly string[] | undefined;
}

export function respostaVazia(v: Valor | undefined): boolean {
  if (v === undefined || v === null) return true;
  if (typeof v === "string") return v.trim() === "";
  if (Array.isArray(v))
    return v.every((x) =>
      Array.isArray(x) ? x.length === 0 : !String(x ?? "").trim(),
    );
  // País vem pré-preenchido com Brasil: sozinho ele não conta como resposta.
  return !String(v.uf ?? "").trim() && !String(v.cidade ?? "").trim();
}

const ehTexto = (v: unknown): v is string => typeof v === "string";

/** Devolve a mensagem de erro da resposta, ou null se ela está boa. */
export function validarItem(
  item: Pergunta,
  valor: Valor | undefined,
  opcoes: OpcoesDeValidacao = {},
): string | null {
  if (respostaVazia(valor))
    return item.obrigatoria ? MENSAGENS.obrigatoria : null;

  switch (item.tipo) {
    case "TEXT":
    case "PARAGRAPH_TEXT": {
      if (ehLocalizacao(item)) return validarLocalizacao(valor, opcoes);
      if (!ehTexto(valor)) return MENSAGENS.formato;
      const texto = valor.trim();
      if (texto.length > LIMITE[item.tipo])
        return `Use no máximo ${LIMITE[item.tipo]} caracteres.`;
      const regra = regraDeTexto(item);
      if (regra === "email" && !EMAIL.test(texto))
        return "Digite um e-mail válido, como nome@exemplo.com.";
      if (regra === "url" && !item.obrigatoria && !normalizarUrl(texto))
        return "Cole o endereço completo, como https://www.exemplo.com.br, ou deixe em branco.";
      return null;
    }

    case "MULTIPLE_CHOICE":
    case "LIST": {
      if (!ehTexto(valor)) return MENSAGENS.formato;
      const v = valor.trim();
      if (item.opcoes.some((o) => o.valor === v)) return null;
      if (!item.outro) return MENSAGENS.opcao;
      return v.includes(",") ? MENSAGENS.virgula : null;
    }

    case "CHECKBOX": {
      if (!Array.isArray(valor) || !valor.every(ehTexto))
        return MENSAGENS.formato;
      const extras = (valor as string[])
        .map((v) => v.trim())
        .filter((v) => !item.opcoes.some((o) => o.valor === v));
      if (extras.length === 0) return null;
      if (!item.outro || extras.length > 1) return MENSAGENS.opcao;
      if (!extras[0]) return MENSAGENS.outroVazio;
      return extras[0].includes(",") ? MENSAGENS.virgula : null;
    }

    case "GRID": {
      if (
        !Array.isArray(valor) ||
        valor.length !== item.linhas.length ||
        !valor.every(ehTexto)
      )
        return MENSAGENS.formato;
      const linhas = valor as string[];
      if (linhas.some((v) => v !== "" && !item.colunas.includes(v)))
        return MENSAGENS.opcao;
      if (item.obrigatoria && linhas.some((v) => v === ""))
        return "Responda todas as linhas.";
      return null;
    }

    case "CHECKBOX_GRID": {
      if (
        !Array.isArray(valor) ||
        valor.length !== item.linhas.length ||
        !valor.every((l) => Array.isArray(l) && l.every(ehTexto))
      )
        return MENSAGENS.formato;
      const linhas = valor as string[][];
      if (linhas.some((l) => l.some((v) => !item.colunas.includes(v))))
        return MENSAGENS.opcao;
      if (item.obrigatoria && linhas.some((l) => l.length === 0))
        return "Marque pelo menos uma opção em cada linha.";
      return null;
    }

    case "SCALE": {
      const n = Number(valor);
      return Number.isInteger(n) && n >= item.minimo && n <= item.maximo
        ? null
        : MENSAGENS.opcao;
    }

    case "DATE": {
      if (!ehTexto(valor) || !/^\d{4}-\d{2}-\d{2}$/.test(valor))
        return "Digite uma data válida.";
      const [a, m, d] = valor.split("-").map(Number);
      const data = new Date(Date.UTC(a, m - 1, d));
      return data.getUTCMonth() === m - 1 && data.getUTCDate() === d
        ? null
        : "Digite uma data válida.";
    }
  }
}

function validarLocalizacao(
  valor: Valor | undefined,
  opcoes: OpcoesDeValidacao,
): string | null {
  if (!valor || typeof valor !== "object" || Array.isArray(valor))
    return MENSAGENS.formato;
  const pais = String(valor.pais ?? "");
  const uf = String(valor.uf ?? "");
  const cidade = String(valor.cidade ?? "").trim();

  if (!pais) return "Escolha o país.";
  if (!PAISES.includes(pais)) return "Escolha um país da lista.";
  if (pais === BRASIL) {
    if (!UFS.includes(uf)) return "Escolha o estado.";
    if (!cidade) return "Escolha a cidade.";
    const lista = opcoes.municipiosDe?.(uf);
    if (lista && !cidadeNaLista(cidade, lista))
      return `Não encontramos “${cidade}” entre as cidades de ${NOME_POR_UF[uf]}.`;
    return null;
  }
  if (!cidade) return "Digite o nome da cidade.";
  if (/[,\d]/.test(cidade))
    return "Digite só o nome da cidade, sem vírgula nem números.";
  return cidade.length > 100 ? "Use no máximo 100 caracteres." : null;
}

// ── Seções e desvios ────────────────────────────────────────────────────────

export interface Secao {
  /** "inicio" pra primeira; nas outras, o ID da quebra de seção que a abre. */
  id: string;
  titulo: string;
  ajuda: string;
  ajudaHtml?: string;
  itens: Item[];
  /** Pra onde ir ao terminar, quando nenhuma resposta decide. */
  aoTerminar: Destino | null;
}

export function dividirEmSecoes(itens: Item[]): Secao[] {
  const secoes: Secao[] = [
    { id: "inicio", titulo: "", ajuda: "", itens: [], aoTerminar: null },
  ];
  for (const item of itens) {
    if (item.tipo === "PAGE_BREAK") {
      secoes[secoes.length - 1].aoTerminar = item.aposSecaoAnterior;
      secoes.push({
        id: item.id,
        titulo: item.titulo,
        ajuda: item.ajuda,
        ajudaHtml: item.ajudaHtml,
        itens: [],
        aoTerminar: null,
      });
    } else {
      secoes[secoes.length - 1].itens.push(item);
    }
  }
  return secoes;
}

/** Índice especial: depois desta seção, o formulário é enviado. */
export const ENVIAR = -1;

/*
 * Pergunta com desvio é a que tem ao menos uma opção mandando pra outro lugar
 * que não a próxima seção. Opção marcada como "Continuar" numa pergunta dessas
 * vai pra próxima seção na ordem, ignorando o "Após a seção" — é assim que o
 * Forms se comporta.
 */
export function temDesvio(item: Item): item is ItemEscolha {
  return (
    (item.tipo === "MULTIPLE_CHOICE" || item.tipo === "LIST") &&
    item.opcoes.some((o) => o.destino && o.destino !== "SEGUIR")
  );
}

export function proximaSecao(
  secoes: Secao[],
  indice: number,
  respostas: Respostas,
): number {
  const secao = secoes[indice];
  let destino = secao.aoTerminar;
  // Se houver mais de uma pergunta com desvio na seção, vale a última.
  for (const item of secao.itens) {
    if (!temDesvio(item)) continue;
    const escolhida = item.opcoes.find((o) => o.valor === respostas[item.id]);
    if (escolhida) destino = escolhida.destino ?? "SEGUIR";
  }

  const seguinte = indice + 1 < secoes.length ? indice + 1 : ENVIAR;
  if (!destino || destino === "SEGUIR") return seguinte;
  if (destino === "ENVIAR") return ENVIAR;
  if (destino === "REINICIAR") return 0;
  const alvo = secoes.findIndex((s) => s.id === destino);
  return alvo >= 0 ? alvo : seguinte;
}

/** As seções que a pessoa percorre com estas respostas, na ordem. */
export function caminho(secoes: Secao[], respostas: Respostas): number[] {
  const visitadas: number[] = [];
  let i = 0;
  while (i !== ENVIAR && !visitadas.includes(i)) {
    visitadas.push(i);
    i = proximaSecao(secoes, i, respostas);
  }
  return visitadas;
}

// ── Envio ───────────────────────────────────────────────────────────────────

/*
 * Valida só as seções do caminho e descarta o que ficou fora dele: quem pulou
 * a seção de mestrado não envia resposta de mestrado, mesmo que tenha
 * preenchido antes de voltar e mudar de ideia.
 */
export function prepararEnvio(
  estrutura: Estrutura,
  respostas: Respostas,
  opcoes: OpcoesDeValidacao = {},
): { valores: Record<string, ValorFormulario>; erros: Record<string, string> } {
  const secoes = dividirEmSecoes(estrutura.itens);
  const valores: Record<string, ValorFormulario> = {};
  const erros: Record<string, string> = {};

  for (const i of caminho(secoes, respostas)) {
    for (const item of secoes[i].itens) {
      if (!ehPergunta(item)) continue;
      const v = respostas[item.id];
      const erro = validarItem(item, v, opcoes);
      if (erro) erros[item.id] = erro;
      else if (v !== undefined && !respostaVazia(v))
        valores[item.id] = paraFormulario(item, v, opcoes);
    }
  }
  return { valores, erros };
}

function paraFormulario(
  item: Pergunta,
  v: Valor,
  opcoes: OpcoesDeValidacao,
): ValorFormulario {
  switch (item.tipo) {
    case "TEXT":
    case "PARAGRAPH_TEXT": {
      if (ehLocalizacao(item)) {
        const l = v as Localizacao;
        // Grava a grafia do IBGE mesmo que a pessoa tenha digitado sem acento.
        const lista =
          l.pais === BRASIL ? opcoes.municipiosDe?.(l.uf) : undefined;
        const cidade = (lista && cidadeNaLista(l.cidade, lista)) || l.cidade;
        return localizacaoComoTexto({ ...l, cidade });
      }
      const texto = (v as string).trim();
      return regraDeTexto(item) === "url"
        ? (normalizarUrl(texto) ?? texto)
        : texto;
    }
    case "CHECKBOX":
      return (v as string[]).map((s) => s.trim());
    case "GRID":
      return (v as string[]).map((s) => s || null);
    case "CHECKBOX_GRID":
      return (v as string[][]).map((l) => (l.length ? l : null));
    default:
      return String(v).trim();
  }
}
