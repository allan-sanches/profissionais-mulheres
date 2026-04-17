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

interface SyncResult {
  success: boolean;
  message: string;
  count: number;
  timestamp: string;
  errors: string[];
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const PROJECT_ROOT = path.resolve(__dirname, "../..");
const OUTPUT_DIR = path.join(PROJECT_ROOT, "src", "content");
const IMAGE_DIR = path.join(PROJECT_ROOT, "public", "researchers", "images");
const OUTPUT_FILE = path.join(OUTPUT_DIR, "researchers.json");
const LOG_FILE = path.join(OUTPUT_DIR, "researchers.sync.log");

// Column mapping from Google Sheets (columns A-L)
// Google Forms automatically adds a Timestamp column as the first column
const COLUMN_MAP: Record<number, string> = {
  0: "nome", // Column A (after Google Forms Timestamp, usually column B in responses)
  1: "email", // Column B
  2: "telefone", // Column C
  3: "formacao", // Column D
  4: "imagem", // Column E (Google Drive file ID or link)
  5: "curriculo", // Column F (URL)
  6: "researchgate", // Column G (URL)
  7: "instagram", // Column H (Username or URL)
  8: "site_pessoal", // Column I (URL)
  9: "genero", // Column J
  10: "localizacao", // Column K (City, State, Country)
};

async function authenticateGoogle() {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const sheetId = process.env.GOOGLE_SHEET_ID;

  if (!clientEmail || !privateKey || !sheetId) {
    throw new Error(
      "Missing Google credentials: GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY, GOOGLE_SHEET_ID",
    );
  }

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });

  return { sheets: google.sheets({ version: "v4", auth }), auth };
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

async function fetchSheetData(
  sheets: google.sheets_v4.Sheets,
): Promise<(string | number)[][]> {
  const sheetTitle = await getSheetTitle(sheets);
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID!,
    range: `${sheetTitle}!A:L`,
  });

  const rows = response.data.values || [];

  if (rows.length === 0) {
    throw new Error("No data found in Google Sheet");
  }

  // Skip header row
  return rows.slice(1);
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[àáäâãå]/g, "a")
    .replace(/[èéëê]/g, "e")
    .replace(/[ìíïî]/g, "i")
    .replace(/[òóöô]/g, "o")
    .replace(/[ùúüû]/g, "u")
    .replace(/[ç]/g, "c")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function parseRow(row: (string | number)[]): Partial<Researcher> | null {
  try {
    const researcher: Partial<Researcher> = {
      data_sincronizacao: new Date().toISOString(),
    };

    // Map columns to fields
    Object.entries(COLUMN_MAP).forEach(([colIndex, fieldName]) => {
      const value = row[parseInt(colIndex)];
      if (value && value.toString().trim()) {
        researcher[fieldName as keyof Researcher] = value.toString().trim();
      }
    });

    // Validate required fields
    if (!researcher.nome || !researcher.email) {
      return null;
    }

    // Generate ID and slug
    researcher.id = `${researcher.email
      .split("@")[0]
      .toLowerCase()}-${Date.now()}`;
    researcher.slug = generateSlug(researcher.nome);

    return researcher;
  } catch (error) {
    console.error("Error parsing row:", row, error);
    return null;
  }
}

async function downloadImage(
  imageUrl: string,
  filename: string,
): Promise<string | null> {
  try {
    // Create image directory if not exists
    await fs.mkdir(IMAGE_DIR, { recursive: true });

    // Check if it's a Google Drive link
    let driveFileId = imageUrl;

    if (imageUrl.includes("drive.google.com")) {
      // Extract file ID from various Google Drive URL formats
      const match =
        imageUrl.match(/\/d\/([a-zA-Z0-9-_]+)/) ||
        imageUrl.match(/id=([a-zA-Z0-9-_]+)/);
      if (match) {
        driveFileId = match[1];
      } else {
        return null;
      }
    }

    // Download from Google Drive export URL (works for images)
    const downloadUrl = `https://drive.google.com/uc?export=download&id=${driveFileId}`;

    const response = await fetch(downloadUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
      redirect: "follow",
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const buffer = await response.arrayBuffer();
    const filepath = path.join(IMAGE_DIR, filename);

    // Determine extension based on content-type
    const contentType = response.headers.get("content-type") || "image/jpeg";
    const ext = contentType.split("/")[1].split(";")[0] || "jpg";
    const finalPath = `${filepath}.${ext}`;

    await fs.writeFile(finalPath, Buffer.from(buffer));

    // Return relative path for website
    return `/researchers/images/${filename}.${ext}`;
  } catch (error) {
    console.error(`Error downloading image ${imageUrl}:`, error);
    return null;
  }
}

async function processResearchers(
  rows: (string | number)[][],
): Promise<Researcher[]> {
  const researchers: Researcher[] = [];
  const errors: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    try {
      const parsed = parseRow(rows[i]);
      if (!parsed || !parsed.nome) continue;

      // Download image if provided
      if (parsed.imagem) {
        const imageFilename = `${parsed.slug}-${i}`;
        const imagePath = await downloadImage(parsed.imagem, imageFilename);
        if (imagePath) {
          parsed.imagem = imagePath;
        } else {
          delete parsed.imagem;
        }
      }

      researchers.push(parsed as Researcher);
    } catch (error) {
      const errorMsg = `Row ${i}: ${error instanceof Error ? error.message : "Unknown error"}`;
      errors.push(errorMsg);
      console.error(errorMsg);
    }
  }

  return researchers;
}

async function saveData(researchers: Researcher[]): Promise<void> {
  // Ensure output directory exists
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  // Save researchers data
  const data = {
    timestamp: new Date().toISOString(),
    total: researchers.length,
    researchers: researchers.sort((a, b) => a.nome.localeCompare(b.nome)),
  };

  await fs.writeFile(OUTPUT_FILE, JSON.stringify(data, null, 2));

  console.log(`✅ Saved ${researchers.length} researchers to ${OUTPUT_FILE}`);
}

async function logSync(result: SyncResult): Promise<void> {
  const logEntry = `
---
[${result.timestamp}]
Status: ${result.success ? "SUCCESS" : "FAILED"}
Message: ${result.message}
Count: ${result.count}
Errors: ${result.errors.length}
${result.errors.length > 0 ? "\nErrors:\n" + result.errors.join("\n") : ""}
`;

  try {
    await fs.appendFile(LOG_FILE, logEntry);
  } catch (error) {
    console.error("Error writing log file:", error);
  }
}

async function main(): Promise<SyncResult> {
  const timestamp = new Date().toISOString();
  console.log(`\n🔄 Starting researchers sync at ${timestamp}...`);

  try {
    // Authenticate with Google
    const { sheets } = await authenticateGoogle();
    console.log("✅ Authenticated with Google Sheets API");

    // Fetch sheet data
    const rows = await fetchSheetData(sheets);
    console.log(`📊 Fetched ${rows.length} rows from Google Sheet`);

    // Process and download
    const researchers = await processResearchers(rows);
    console.log(`✅ Processed ${researchers.length} valid researchers`);

    // Save to file
    await saveData(researchers);

    const result: SyncResult = {
      success: true,
      message: `Successfully synced ${researchers.length} researchers`,
      count: researchers.length,
      timestamp,
      errors: [],
    };

    await logSync(result);
    console.log("\n✅ Sync completed successfully");

    return result;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    console.error("\n❌ Sync failed:", errorMsg);

    const result: SyncResult = {
      success: false,
      message: `Sync failed: ${errorMsg}`,
      count: 0,
      timestamp,
      errors: [errorMsg],
    };

    await logSync(result);

    return result;
  }
}

// Run if called directly
if (
  import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1]?.endsWith("sync-researchers.ts")
) {
  const result = await main();
  process.exit(result.success ? 0 : 1);
}

export { main, authenticateGoogle, fetchSheetData, processResearchers };
