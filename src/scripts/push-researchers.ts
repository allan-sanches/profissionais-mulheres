import { config } from "dotenv";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { google } from "googleapis";

config({ path: path.resolve(process.cwd(), ".env.local") });

interface Researcher {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  formacao?: string;
  imagem?: string;
  curriculo?: string;
  researchgate?: string;
  instagram?: string;
  site_pessoal?: string;
  genero?: string;
  localizacao?: string;
  slug: string;
  data_sincronizacao: string;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "../..");
const OUTPUT_DIR = path.join(PROJECT_ROOT, "src", "content");
const OUTPUT_FILE = path.join(OUTPUT_DIR, "researchers.json");

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
  const content = await fs.readFile(OUTPUT_FILE, "utf-8");
  const data = JSON.parse(content);
  return (data.researchers || []) as Researcher[];
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
    "Genero",
    "Localizacao",
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
    researcher.genero || "",
    researcher.localizacao || "",
  ]);

  return [header, ...rows];
}

async function pushResearchers() {
  const sheets = await authenticateGoogle();
  const sheetTitle = await getSheetTitle(sheets);
  const researchers = await readLocalResearchers();
  const values = buildSheetRows(researchers);
  const range = `${sheetTitle}!A1:K${values.length}`;

  console.log(
    `🔄 Pushing ${researchers.length} researchers to Google Sheet (${range})...`,
  );

  await sheets.spreadsheets.values.clear({
    spreadsheetId: process.env.GOOGLE_SHEET_ID!,
    range: `${sheetTitle}!A:K`,
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
