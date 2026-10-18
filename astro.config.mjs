// @ts-check
import { defineConfig, envField, fontProviders } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import mdx from "@astrojs/mdx";
import icon from "astro-icon";
import sitemap from "@astrojs/sitemap";
import vercel from "@astrojs/vercel";
import react from "@astrojs/react";
import keystatic from "@keystatic/astro";

export default defineConfig({
  site: "https://rede.mulheresnaecologia.com",
  // 60 s: o Apps Script do cadastro leva de 9 a 15 s pra responder, e o
  // padrão da Vercel em alguns planos é 10 s.
  adapter: vercel({ maxDuration: 60 }),
  output: "static",

  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      // O scanner de dependências do Vite (esbuild) não sabe resolver esse
      // módulo virtual do Keystatic — só o plugin dele resolve em runtime.
      // Excluir daqui evita o erro cosmético "Could not resolve
      // virtual:keystatic-config" no início do dev server.
      exclude: ["virtual:keystatic-config"],
      // A UI do painel só é carregada no cliente e o scanner não a encontra;
      // sem pré-empacotar, dependências CommonJS dela (lodash) chegam cruas ao
      // navegador e /keystatic fica em branco.
      include: ["@keystatic/core/ui"],
    },
  },

  integrations: [mdx(), icon(), sitemap(), react(), keystatic()],

  env: {
    schema: {
      UMAMI_URL: envField.string({
        context: "client",
        access: "public",
        optional: true,
      }),
      UMAMI_WEBSITE_ID: envField.string({
        context: "client",
        access: "public",
        optional: true,
      }),
      GOOGLE_SHEET_ID: envField.string({ context: "server", access: "secret" }),
      GOOGLE_CLIENT_EMAIL: envField.string({
        context: "server",
        access: "secret",
      }),
      GOOGLE_PRIVATE_KEY: envField.string({
        context: "server",
        access: "secret",
      }),
      ADMIN_TOKEN: envField.string({
        context: "server",
        access: "secret",
        default: "ecologia2026",
      }),
      // Cadastro pelo site (/cadastro). Opcionais pra não travar o build: sem
      // as duas do script, a página avisa que o cadastro está indisponível.
      FORMULARIO_SCRIPT_URL: envField.string({
        context: "server",
        access: "secret",
        optional: true,
      }),
      FORMULARIO_SCRIPT_TOKEN: envField.string({
        context: "server",
        access: "secret",
        optional: true,
      }),
      // Anti-spam da Cloudflare. A chave do site vai pro navegador (por isso
      // é lida no build); a secreta fica só no servidor.
      TURNSTILE_SITE_KEY: envField.string({
        context: "client",
        access: "public",
        optional: true,
      }),
      TURNSTILE_SECRET_KEY: envField.string({
        context: "server",
        access: "secret",
        optional: true,
      }),
    },
  },

  fonts: [
    {
      provider: fontProviders.fontsource(),
      name: "Epilogue",
      cssVariable: "--font-display",
      weights: ["100 900"],
    },
  ],
});
