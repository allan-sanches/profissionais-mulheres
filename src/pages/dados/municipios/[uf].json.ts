import type { APIRoute, GetStaticPaths } from "astro";
import municipios from "@/data/municipios.json";

/*
 * Um arquivo estático por UF (/dados/municipios/SP.json), que o campo de cidade
 * do cadastro busca quando a pessoa escolhe o estado. Os nomes vêm da cópia do
 * IBGE em src/data/ (scripts/atualizar-localidades.mjs).
 */

const MUNICIPIOS = municipios as Record<string, string[]>;

export const prerender = true;

export const getStaticPaths = (() =>
  Object.keys(MUNICIPIOS).map((uf) => ({
    params: { uf },
  }))) satisfies GetStaticPaths;

export const GET: APIRoute = ({ params }) =>
  new Response(JSON.stringify(MUNICIPIOS[params.uf!] ?? []), {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
