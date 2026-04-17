import type { APIRoute } from "astro";
import {
  ADMIN_TOKEN,
  GOOGLE_CLIENT_EMAIL,
  GOOGLE_PRIVATE_KEY,
  GOOGLE_SHEET_ID,
} from "astro:env/server";
import { google } from "googleapis";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const authHeader = request.headers.get("Authorization");
    if (authHeader?.replace("Bearer ", "") !== ADMIN_TOKEN) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    // 1. Tenta autenticar com o Google
    const auth = new google.auth.JWT({
      email: GOOGLE_CLIENT_EMAIL,
      key: GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    // 2. Tenta ler a planilha (Isso valida se o e-mail tem acesso)
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: GOOGLE_SHEET_ID,
    });
    const sheetTitle =
      spreadsheet.data.sheets?.[0].properties?.title || "Sheet1";

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: GOOGLE_SHEET_ID,
      range: `${sheetTitle}!A:L`,
    });

    const rows = response.data.values?.slice(1) || [];

    // NOTA: Na Vercel, você não pode usar fs.writeFile em produção.
    // Para atualizar o site, você precisaria de um Webhook de deploy
    // ou salvar esses dados em um Banco de Dados (Redis/KV).

    return new Response(
      JSON.stringify({
        success: true,
        count: rows.length,
        message: "Conexão com Google Sheets estabelecida com sucesso!",
      }),
      { status: 200 },
    );
  } catch (error: any) {
    console.error("ERRO DETALHADO:", error.message);
    return new Response(
      JSON.stringify({
        error: "Falha na conexão com Google",
        details: error.message,
      }),
      { status: 500 },
    );
  }
};
