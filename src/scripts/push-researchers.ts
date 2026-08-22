import { config } from "dotenv";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { google } from "googleapis";

config({ path: path.resolve(process.cwd(), ".env.local") });

interface Researcher {
  nome: string;
  email: string;
  telefone?: string;
  formacao?: string;
  imagem?: string;
  curriculo?: string;
  researchgate?: string;
  instagram?: string;
  site_pessoal?: string;
  linkedin?: string;
  orcid?: string;
  bio?: string;
  localizacao?: string;
  instituicao?: string;
  identidade_genero?: string;
  raca_etnia?: string;
  areas_pesquisa?: string[];
  grupos_biologicos?: string[];
  formas_colaboracao?: string[];
  data_sincronizacao: string;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "../..");
const RESEARCHERS_DIR = path.join(
  PROJECT_ROOT,
  "src",
  "content",
  "researchers",
);

async function authenticateGoogle() {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;

  if (!clientEmail || !privateKey || !spreadsheetId) {
    throw new Error(
      "Missing Google credentials: GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY, GOOGLE_SHEET_ID",
    );
  }

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  return google.sheets({ version: "v4", auth });
}

async function getSheetTitle(sheets: google.sheets_v4.Sheets): Promise<string> {
  const response = await sheets.spreadsheets.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID!,
    fields: "sheets.properties.title",
  });

  const sheetsInfo = response.data.sheets || [];
  const titles = sheetsInfo
    .map((sheet) => sheet?.properties?.title)
    .filter(Boolean) as string[];

  if (titles.length === 0) {
    throw new Error("No sheets found in the Google Spreadsheet");
  }

  const match = titles.find((title) => /^Form Responses/i.test(title));
  return match || titles[0];
}

async function readLocalResearchers(): Promise<Researcher[]> {
  const files = await fs.readdir(RESEARCHERS_DIR);
  const researchers = await Promise.all(
    files
      .filter((file) => file.endsWith(".json"))
      .map(async (file) => {
        const content = await fs.readFile(
          path.join(RESEARCHERS_DIR, file),
          "utf-8",
        );
        return JSON.parse(content) as Researcher;
      }),
  );
  return researchers.sort((a, b) => a.nome.localeCompare(b.nome));
}

function buildSheetRows(researchers: Researcher[]): (string | number)[][] {
  const header = [
    "Nome",
    "Email",
    "Telefone",
    "Formação",
    "Imagem",
    "Curriculo",
    "ResearchGate",
    "Instagram",
    "Site Pessoal",
    "(coluna não usada)",
    "Localizacao",
    "LinkedIn",
    "ORCID",
    "Bio",
    "Instituicao",
    "Identidade de Genero",
    "Raca/Etnia",
    "Areas da Pesquisa",
    "Grupos Biologicos",
    "Formas de Colaboracao",
  ];

  const rows = researchers.map((researcher) => [
    researcher.nome || "",
    researcher.email || "",
    researcher.telefone || "",
    researcher.formacao || "",
    researcher.imagem || "",
    researcher.curriculo || "",
    researcher.researchgate || "",
    researcher.instagram || "",
    researcher.site_pessoal || "",
    "",
    researcher.localizacao || "",
    researcher.linkedin || "",
    researcher.orcid || "",
    researcher.bio || "",
    researcher.instituicao || "",
    researcher.identidade_genero || "",
    researcher.raca_etnia || "",
    (researcher.areas_pesquisa || []).join(", "),
    (researcher.grupos_biologicos || []).join(", "),
    (researcher.formas_colaboracao || []).join(", "),
  ]);

  return [header, ...rows];
}

async function pushResearchers() {
  const sheets = await authenticateGoogle();
  const sheetTitle = await getSheetTitle(sheets);
  const researchers = await readLocalResearchers();
  const values = buildSheetRows(researchers);
  const range = `${sheetTitle}!A1:T${values.length}`;

  console.log(
    `🔄 Pushing ${researchers.length} researchers to Google Sheet (${range})...`,
  );

  await sheets.spreadsheets.values.clear({
    spreadsheetId: process.env.GOOGLE_SHEET_ID!,
    range: `${sheetTitle}!A:T`,
  });

  await sheets.spreadsheets.values.update({
    spreadsheetId: process.env.GOOGLE_SHEET_ID!,
    range,
    valueInputOption: "RAW",
    requestBody: {
      values,
    },
  });

  console.log("✅ Researchers pushed successfully.");
}

if (
  import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1]?.endsWith("push-researchers.ts")
) {
  try {
    await pushResearchers();
    process.exit(0);
  } catch (error) {
    console.error("❌ Failed to push researchers:", error);
    process.exit(1);
  }
}
