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
  site: "https://profissionais-mulheres.vercel.app",
  adapter: vercel(),
  output: "static",

  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      // O scanner de dependências do Vite (esbuild) não sabe resolver esse
      // módulo virtual do Keystatic — só o plugin dele resolve em runtime.
      // Excluir daqui evita o erro cosmético "Could not resolve
      // virtual:keystatic-config" no início do dev server.
      exclude: ["virtual:keystatic-config"],
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
