// @ts-check
import { defineConfig, envField, fontProviders } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import mdx from "@astrojs/mdx";
import icon from "astro-icon";
import sitemap from "@astrojs/sitemap";
import vercel from "@astrojs/vercel";

export default defineConfig({
  site: "https://profissionais-mulheres.vercel.app",
  adapter: vercel(),
  output: "static",

  vite: {
    plugins: [tailwindcss()],
  },

  integrations: [mdx(), icon(), sitemap()],

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
      name: "Space Grotesk",
      cssVariable: "--font-display",
    },
  ],
});
