/**
 * Dry-run da planilha: confere se os cabeçalhos do formulário ainda batem com
 * o HEADER_MAP antes de rodar o sync de verdade. Não escreve nenhum arquivo.
 *
 *   npm run check:sheet              -> usa GOOGLE_SHEET_ID do .env.local
 *   npm run check:sheet -- <id|url>  -> testa outra planilha
 */
import { google } from "googleapis";
import { config } from "dotenv";
import path from "path";
import { HEADER_MAP, normalizePrivateKey } from "../utils/google-sheets";

config({ path: path.resolve(process.cwd(), ".env.local") });

const arg = process.argv[2];
const sheetId =
  arg?.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)?.[1] ||
  arg ||
  process.env.GOOGLE_SHEET_ID;

const { GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY } = process.env;

if (!GOOGLE_CLIENT_EMAIL || !GOOGLE_PRIVATE_KEY || !sheetId) {
  console.error(
    "❌ Faltam GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY ou o ID da planilha.",
  );
  process.exit(1);
}

const auth = new google.auth.JWT({
  email: GOOGLE_CLIENT_EMAIL,
  key: normalizePrivateKey(GOOGLE_PRIVATE_KEY),
  scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
});
const sheets = google.sheets({ version: "v4", auth });

const meta = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
console.log(`📄 Planilha: ${meta.data.properties?.title}`);

const abas = meta.data.sheets ?? [];
console.log("\nAbas:");
abas.forEach((s, i) => {
  const p = s.properties!;
  console.log(
    `  gid=${p.sheetId}  "${p.title}"${i === 0 ? "   ← o sync lê esta" : ""}`,
  );
});

const title = abas[0]?.properties?.title || "Sheet1";
const res = await sheets.spreadsheets.values.get({
  spreadsheetId: sheetId,
  range: title,
});
const rows = res.data.values ?? [];
const header = (rows[0] ?? []).map((h) => (h ?? "").toString().trim());
console.log(
  `\nAba lida: "${title}" | respostas: ${rows.length - 1} | colunas: ${header.length}`,
);

const entradas = Object.entries(HEADER_MAP);
const casou: [string, number][] = [];
const falhou: [string, string][] = [];
for (const [campo, cab] of entradas) {
  const i = header.findIndex((h) => h.toLowerCase() === cab.toLowerCase());
  if (i >= 0) casou.push([campo, i]);
  else falhou.push([campo, cab]);
}

console.log(`\n✅ Casaram ${casou.length}/${entradas.length} campos.`);

if (falhou.length) {
  console.log(`\n⚠️  Sem correspondência (viriam VAZIOS):`);
  for (const [campo, cab] of falhou) {
    console.log(`  ${campo}\n     esperado: "${cab}"`);
    const prefixo = cab.toLowerCase().slice(0, 18);
    header
      .filter((h) => h && h.toLowerCase().startsWith(prefixo))
      .forEach((h) => console.log(`     parecido na planilha: "${h}"`));
  }
}

const usadas = new Set(casou.map(([, i]) => i));
const ociosas = header
  .map((h, i) => [h, i] as const)
  .filter(([h, i]) => h && !usadas.has(i));
if (ociosas.length) {
  console.log(`\nℹ️  Colunas da planilha que o sync ignora:`);
  ociosas.forEach(([h, i]) => console.log(`  [col ${i}] "${h}"`));
}

process.exit(falhou.length ? 1 : 0);
