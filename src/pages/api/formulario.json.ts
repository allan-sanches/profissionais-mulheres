import type { APIRoute } from "astro";
import { buscarEstrutura } from "@/utils/formulario-servidor";

export const prerender = false;

/*
 * Estrutura do Google Forms pra página /cadastro montar as perguntas.
 *
 * O Apps Script leva de 9 a 15 s pra descrever o formulário real, então quem
 * visita nunca deve esperar por ele. O CDN da Vercel guarda a resposta por 5
 * minutos (s-maxage) e, depois disso, continua servindo a última versão
 * enquanto busca a nova em segundo plano (stale-while-revalidate, até 7 dias,
 * porque o cadastro tem pouco movimento). Na prática, uma edição no Forms
 * aparece pra quem abrir a página depois da primeira visita passados os 5 min.
 */
export const GET: APIRoute = async () => {
  try {
    // O ID da planilha (a das respostas, com dados pessoais) serve só pros
    // avisos do servidor; a página não precisa dele.
    const { planilha: _planilha, ...publica } = await buscarEstrutura();
    return new Response(JSON.stringify(publica), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control":
          "public, max-age=0, s-maxage=300, stale-while-revalidate=604800",
      },
    });
  } catch (e) {
    console.error("[cadastro] estrutura indisponível:", e);
    return new Response(JSON.stringify({ erro: "indisponivel" }), {
      status: 503,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  }
};
