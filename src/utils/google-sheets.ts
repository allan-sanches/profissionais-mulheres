import { google } from "googleapis";
import fs from "fs/promises";
import path from "path";

export async function runFullSync(credentials: {
  email: string;
  key: string;
  sheetId: string;
}) {
  const auth = new google.auth.JWT({
    email: credentials.email,
    key: credentials.key.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });

  const sheets = google.sheets({ version: "v4", auth });

  const spreadsheet = await sheets.spreadsheets.get({
    spreadsheetId: credentials.sheetId,
  });
  const sheetTitle = spreadsheet.data.sheets?.[0].properties?.title || "Sheet1";

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: credentials.sheetId,
    range: `${sheetTitle}!A:L`,
  });

  const rows = response.data.values?.slice(1) || [];

  const researchers = rows
    .map((row, i) => {
      const nome = row[0]?.toString().trim() || "";
      return {
        id: `${row[1]?.toString().split("@")[0] || "res"}-${i}`,
        nome: nome,
        email: row[1]?.toString().trim() || "",
        telefone: row[2]?.toString().trim() || "",
        formacao: row[3]?.toString().trim() || "",
        imagem: row[4]?.toString().trim() || "",
        curriculo: row[5]?.toString().trim() || "",
        researchgate: row[6]?.toString().trim() || "",
        instagram: row[7]?.toString().trim() || "",
        site_pessoal: row[8]?.toString().trim() || "",
        genero: row[9]?.toString().trim() || "",
        localizacao: row[10]?.toString().trim() || "",
        slug: nome
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/\s+/g, "-"),
        data_sincronizacao: new Date().toISOString(),
      };
    })
    .filter((r) => r.nome && r.email);

  const OUTPUT_DIR = path.resolve("./src/content");
  const OUTPUT_FILE = path.join(OUTPUT_DIR, "researchers.json");

  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  const finalData = {
    timestamp: new Date().toISOString(),
    total: researchers.length,
    researchers: researchers.sort((a, b) => a.nome.localeCompare(b.nome)),
  };

  await fs.writeFile(OUTPUT_FILE, JSON.stringify(finalData, null, 2));
  return researchers.length;
}
