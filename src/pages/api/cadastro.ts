import type { APIRoute } from "astro";
import municipios from "@/data/municipios.json";
import { prepararEnvio, type Respostas } from "@/utils/formulario";
import {
  enviarAoFormulario,
  ErroDoScript,
  estruturaPublicada,
  verificarTurnstile,
} from "@/utils/formulario-servidor";

export const prerender = false;

/*
 * Recebe o cadastro preenchido em /cadastro e grava como resposta do Google
 * Forms, via Apps Script. Antes disso refaz toda a validação: a do navegador é
 * só conforto, e o Forms aceita qualquer coisa vinda do script.
 *
 * Respostas de erro levam um `codigo` que a página usa pra decidir o que
 * mostrar; a mensagem em `erro` é pra quem lê o log.
 */

const LIMITE_DO_CORPO = 200_000;
const MUNICIPIOS = municipios as Record<string, string[]>;

const responder = (status: number, corpo: Record<string, unknown>) =>
  new Response(JSON.stringify(corpo), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });

export const POST: APIRoute = async ({ request, clientAddress }) => {
  const texto = await request.text();
  if (texto.length > LIMITE_DO_CORPO) {
    return responder(413, { ok: false, codigo: "grande-demais" });
  }

  let corpo: { respostas?: unknown; turnstile?: unknown; site_web?: unknown };
  try {
    corpo = JSON.parse(texto);
  } catch {
    return responder(400, { ok: false, codigo: "corpo-invalido" });
  }

  // Campo-isca invisível: gente não preenche, robô preenche tudo. Finge que
  // deu certo pra não ensinar o robô a desviar.
  if (typeof corpo.site_web === "string" && corpo.site_web.trim()) {
    return responder(200, { ok: true });
  }

  if (!(await verificarTurnstile(corpo.turnstile, clientAddress))) {
    return responder(403, { ok: false, codigo: "verificacao" });
  }

  let estrutura;
  try {
    estrutura = await estruturaPublicada(new URL(request.url));
  } catch (e) {
    console.error("[cadastro] sem estrutura para validar o envio:", e);
    return responder(503, { ok: false, codigo: "indisponivel" });
  }
  if (estrutura.problemas?.length) {
    console.error(
      "[cadastro] configuração do Forms impede o envio:",
      estrutura.problemas,
    );
    return responder(503, { ok: false, codigo: "indisponivel" });
  }
  if (!estrutura.aceitandoRespostas) {
    return responder(409, { ok: false, codigo: "fechado" });
  }

  const respostas =
    corpo.respostas &&
    typeof corpo.respostas === "object" &&
    !Array.isArray(corpo.respostas)
      ? (corpo.respostas as Respostas)
      : {};
  const { valores, erros } = prepararEnvio(estrutura, respostas, {
    municipiosDe: (uf) => MUNICIPIOS[uf],
  });
  if (Object.keys(erros).length) {
    return responder(422, { ok: false, codigo: "invalido", erros });
  }
  if (!Object.keys(valores).length) {
    return responder(422, { ok: false, codigo: "vazio" });
  }

  try {
    await enviarAoFormulario(valores);
    return responder(200, { ok: true });
  } catch (e) {
    console.error("[cadastro] o Apps Script recusou o envio:", e);
    const codigo = e instanceof ErroDoScript ? e.codigo : "erro";
    if (codigo === "formulario-mudou" || codigo === "fechado") {
      return responder(409, { ok: false, codigo });
    }
    return responder(502, { ok: false, codigo: "falha-no-envio" });
  }
};
