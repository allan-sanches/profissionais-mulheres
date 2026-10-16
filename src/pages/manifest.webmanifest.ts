import type { APIRoute } from "astro";
import site from "@/config/site";
import { identidade } from "@/config/aparencia";

/*
 * Manifest gerado no build a partir da secao "Identidade visual" do painel,
 * para o nome e o icone do atalho no celular acompanharem o que estiver la.
 *
 * `sizes: "any"` porque o favicon vem de upload e pode ter qualquer tamanho.
 */
export const GET: APIRoute = () =>
  new Response(
    JSON.stringify({
      name: identidade.nomeDoSite,
      short_name: identidade.nomeDoSite,
      description: site.meta.description,
      start_url: "/",
      display: "standalone",
      background_color: "#ffffff",
      theme_color: "#3F9C87",
      lang: site.meta.lang,
      icons: [{ src: identidade.favicon, sizes: "any", purpose: "any" }],
    }),
    { headers: { "Content-Type": "application/manifest+json" } },
  );
