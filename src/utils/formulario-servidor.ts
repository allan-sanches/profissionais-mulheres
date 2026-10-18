/*
 * Conversa do servidor com o Apps Script do formulário (apps-script/Cadastro.gs)
 * e com o Turnstile. Só roda na Vercel: o token do script nunca chega ao
 * navegador.
 *
 * Sem FORMULARIO_SCRIPT_URL no `astro dev`, usa src/data/formulario-exemplo.json
 * e não envia nada, pra dar pra trabalhar na página sem acesso ao formulário.
 * Em produção, a falta da variável deixa o cadastro indisponível.
 */

import {
  FORMULARIO_SCRIPT_TOKEN,
  FORMULARIO_SCRIPT_URL,
  GOOGLE_SHEET_ID,
  TURNSTILE_SECRET_KEY,
} from "astro:env/server";
import exemplo from "@/data/formulario-exemplo.json";
import type { Estrutura, ValorFormulario } from "@/utils/formulario";

export class ErroDoScript extends Error {
  constructor(
    readonly codigo: string,
    mensagem: string,
  ) {
    super(mensagem);
  }
}

export const usandoExemplo = () =>
  import.meta.env.DEV && !(FORMULARIO_SCRIPT_URL && FORMULARIO_SCRIPT_TOKEN);

async function chamarScript(corpo: Record<string, unknown>) {
  if (!FORMULARIO_SCRIPT_URL || !FORMULARIO_SCRIPT_TOKEN) {
    throw new ErroDoScript(
      "nao-configurado",
      "FORMULARIO_SCRIPT_URL e FORMULARIO_SCRIPT_TOKEN não estão configuradas.",
    );
  }
  // O app da web do Apps Script responde com um redirecionamento 302; o fetch
  // segue e troca o POST por GET, que é exatamente o que o Google espera.
  // Prazo folgado: descrever o formulário real leva de 9 a 15 s (cada leitura
  // de pergunta ou opção é uma chamada separada dentro do Google). A função
  // tem 60 s (maxDuration em astro.config.mjs).
  const res = await fetch(FORMULARIO_SCRIPT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: FORMULARIO_SCRIPT_TOKEN, ...corpo }),
    redirect: "follow",
    signal: AbortSignal.timeout(45_000),
  });
  const texto = await res.text();
  let dados: {
    ok?: boolean;
    codigo?: string;
    erro?: string;
    [k: string]: unknown;
  };
  try {
    dados = JSON.parse(texto);
  } catch {
    // Costuma ser a tela de login do Google: a implantação não está com
    // "Quem pode acessar: Qualquer pessoa".
    throw new ErroDoScript(
      "resposta-invalida",
      `O Apps Script não devolveu JSON (HTTP ${res.status}): ${texto.slice(0, 160)}`,
    );
  }
  if (!dados.ok) {
    throw new ErroDoScript(
      dados.codigo || "erro",
      dados.erro || "erro sem mensagem",
    );
  }
  return dados;
}

// ── Estrutura ───────────────────────────────────────────────────────────────

/*
 * Cache em memória por instância da função. Quem segura a carga de verdade é
 * o CDN da Vercel (Cache-Control do /api/formulario.json); este aqui poupa o
 * Google quando a mesma instância atende de novo, e é o plano B quando o
 * script falha.
 */
const VALIDADE_DO_CACHE = 5 * 60_000;
let cache: { estrutura: Estrutura; em: number } | null = null;

export async function buscarEstrutura(): Promise<Estrutura> {
  if (usandoExemplo()) return exemplo as Estrutura;
  if (cache && Date.now() - cache.em < VALIDADE_DO_CACHE) {
    return cache.estrutura;
  }
  try {
    const { estrutura } = (await chamarScript({ acao: "estrutura" })) as {
      estrutura: Estrutura;
    };
    avisarConfiguracao(estrutura);
    cache = { estrutura, em: Date.now() };
    return estrutura;
  } catch (e) {
    if (cache) {
      console.error(
        "[cadastro] usando estrutura em cache, o script falhou:",
        e,
      );
      return cache.estrutura;
    }
    throw e;
  }
}

/*
 * Avisos no log da Vercel pra quem configura. O de planilha é o mais
 * traiçoeiro: o envio dá certo, a resposta entra no Forms, mas nunca chega ao
 * site, porque o sync só lê GOOGLE_SHEET_ID. Uma cópia do formulário (usada
 * nos testes locais) cai aqui de propósito: ela não tem planilha.
 */
function avisarConfiguracao(estrutura: Estrutura) {
  for (const problema of estrutura.problemas ?? []) {
    console.error(`[cadastro] ${problema}`);
  }
  if (estrutura.planilha === undefined) return; // script antigo, sem a informação
  if (estrutura.planilha !== GOOGLE_SHEET_ID) {
    console.warn(
      estrutura.planilha
        ? `[cadastro] o formulário grava na planilha ${estrutura.planilha}, mas o sync lê ${GOOGLE_SHEET_ID}: os cadastros não vão chegar ao site.`
        : "[cadastro] o formulário não tem planilha ligada: os cadastros ficam só no Forms e não chegam ao site.",
    );
  }
}

/*
 * A estrutura que a página mostrou, lida do CDN em vez do Apps Script: o envio
 * não espera de novo os segundos que o Google leva pra descrever o formulário.
 * Se ela estiver defasada, o próprio Forms recusa a opção que não existe mais
 * e a página pede pra recarregar. Sem o CDN (deploy de preview protegido, por
 * exemplo), pergunta ao script.
 */
export async function estruturaPublicada(origem: URL): Promise<Estrutura> {
  try {
    const res = await fetch(new URL("/api/formulario.json", origem), {
      signal: AbortSignal.timeout(20_000),
    });
    if (res.ok) {
      const estrutura = (await res.json()) as Estrutura;
      if (Array.isArray(estrutura?.itens)) return estrutura;
    }
  } catch (e) {
    console.warn("[cadastro] CDN sem a estrutura, perguntando ao script:", e);
  }
  return buscarEstrutura();
}

// ── Envio ───────────────────────────────────────────────────────────────────

export async function enviarAoFormulario(
  valores: Record<string, ValorFormulario>,
): Promise<void> {
  if (usandoExemplo()) {
    console.log("[cadastro] modo exemplo, nada foi gravado:", valores);
    return;
  }
  await chamarScript({ acao: "enviar", respostas: valores });
}

// ── Turnstile ───────────────────────────────────────────────────────────────

let avisouSemTurnstile = false;

export async function verificarTurnstile(
  token: unknown,
  ip?: string,
): Promise<boolean> {
  if (!TURNSTILE_SECRET_KEY) {
    if (!import.meta.env.DEV && !avisouSemTurnstile) {
      console.warn(
        "[cadastro] TURNSTILE_SECRET_KEY ausente: envios sem anti-spam.",
      );
      avisouSemTurnstile = true;
    }
    return true;
  }
  if (typeof token !== "string" || !token || token.length > 2048) return false;

  const corpo = new URLSearchParams({
    secret: TURNSTILE_SECRET_KEY,
    response: token,
  });
  if (ip) corpo.set("remoteip", ip);
  try {
    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      { method: "POST", body: corpo, signal: AbortSignal.timeout(10_000) },
    );
    const dados = (await res.json()) as {
      success?: boolean;
      "error-codes"?: string[];
    };
    if (!dados.success) {
      console.warn("[cadastro] Turnstile recusou:", dados["error-codes"]);
    }
    return dados.success === true;
  } catch (e) {
    console.error("[cadastro] Turnstile não respondeu:", e);
    return false;
  }
}
