// Extrai HTML real renderizado do site (rodando em localhost:4321) e gera os
// arquivos .stories.ts do Storybook a partir dele. Como componentes .astro não
// têm runtime no navegador, as stories embutem o HTML já renderizado — assim
// refletem exatamente o que vai pro ar, sem duplicar lógica em outra linguagem.
//
// Rode com o dev server ativo: node scripts/generate-storybook-stories.mjs
import * as cheerio from "cheerio";
import fs from "fs/promises";
import path from "path";

const SITE_URL = "http://localhost:4321/";

// Remove atributos de debug injetados só em `astro dev` (não existem em produção)
const stripDevAttrs = (html) =>
  html.replace(/\s*data-astro-source-(file|loc)="[^"]*"/g, "").trim();

const titleCase = (nome) =>
  nome
    .split(" ")
    .map((w) => w[0]?.toUpperCase() + w.slice(1))
    .join(" ");

const escapeTemplate = (str) =>
  str.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$\{/g, "\\${");

function writeStoryFile(filePath, content) {
  return fs.writeFile(filePath, content.trimStart());
}

async function main() {
  const html = await fetch(SITE_URL).then((r) => r.text());
  const $ = cheerio.load(html);

  // 1) ResearcherCard: as 3 primeiras pesquisadoras
  const cards = $("#researchers-container .card").slice(0, 3);
  const exports = [];
  cards.each((i, el) => {
    const nomeAttr = $(el).attr("data-nome") || `pesquisadora-${i + 1}`;
    const exportName = titleCase(nomeAttr).replace(/[^a-zA-Z0-9]/g, "");
    const htmlStr = stripDevAttrs($.html(el));
    exports.push({ exportName, nomeAttr, htmlStr });
  });

  const cardStoriesContent = `
import type { Meta, StoryObj } from "@storybook/html-vite";

// Gerado automaticamente por scripts/generate-storybook-stories.mjs
// a partir do HTML real renderizado de ResearcherCard.astro.
// Para atualizar: rode o script de novo com \`npm run dev\` ativo.

const meta: Meta = {
  title: "Componentes/ResearcherCard",
  parameters: { layout: "padded" },
};
export default meta;

type Story = StoryObj;

${exports
  .map(
    ({ exportName, nomeAttr, htmlStr }) => `
// ${titleCase(nomeAttr)}
export const ${exportName}: Story = {
  render: () => \`${escapeTemplate(htmlStr)}\`,
};
`,
  )
  .join("\n")}
`;

  await writeStoryFile(
    path.resolve("./src/components/blocks/ResearcherCard.stories.ts"),
    cardStoriesContent,
  );

  // 2) Footer
  const footerHtml = stripDevAttrs($.html($("footer")));
  const footerStoriesContent = `
import type { Meta, StoryObj } from "@storybook/html-vite";

// Gerado automaticamente por scripts/generate-storybook-stories.mjs
// a partir do HTML real renderizado de Footer.astro.

const meta: Meta = {
  title: "Componentes/Footer",
  parameters: { layout: "padded" },
};
export default meta;

type Story = StoryObj;

export const Padrao: Story = {
  render: () => \`${escapeTemplate(footerHtml)}\`,
};
`;

  await writeStoryFile(
    path.resolve("./src/components/layout/Footer.stories.ts"),
    footerStoriesContent,
  );

  // 3) Tela inteira (header + filtros + grid com só as 3 primeiras + footer + script de filtro)
  const screenRoot = $("body > div").first().clone();
  const grid = screenRoot.find("#researchers-container");
  grid.find(".card").slice(3).remove();
  const filterScript = $("script")
    .filter((_, el) => $(el).html()?.includes("filterResearchers"))
    .first();
  const screenHtml = stripDevAttrs(
    $.html(screenRoot) + "\n" + $.html(filterScript),
  );

  await fs.mkdir(path.resolve("./src/stories"), { recursive: true });
  const screenStoriesContent = `
import type { Meta, StoryObj } from "@storybook/html-vite";

// Gerado automaticamente por scripts/generate-storybook-stories.mjs
// a partir do HTML real da tela inicial (src/pages/index.astro), com as 3
// primeiras pesquisadoras. Os filtros funcionam de verdade (o script client-side
// original vem junto).

const meta: Meta = {
  title: "Telas/Listagem de Pesquisadoras",
  parameters: { layout: "fullscreen" },
};
export default meta;

type Story = StoryObj;

export const Padrao: Story = {
  render: () => \`${escapeTemplate(screenHtml)}\`,
};
`;

  await writeStoryFile(
    path.resolve("./src/stories/HomeScreen.stories.ts"),
    screenStoriesContent,
  );

  console.log("Stories geradas:");
  console.log(
    "- src/components/blocks/ResearcherCard.stories.ts ->",
    exports.map((e) => e.nomeAttr).join(", "),
  );
  console.log("- src/components/layout/Footer.stories.ts");
  console.log("- src/stories/HomeScreen.stories.ts");
}

main().catch((err) => {
  console.error("Falha ao gerar stories:", err);
  process.exit(1);
});
