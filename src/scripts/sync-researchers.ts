import { runFullSync } from "../utils/google-sheets";
import "dotenv/config";

async function main() {
  console.log("🚀 Iniciando sincronização via Script...");

  const { GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY, GOOGLE_SHEET_ID } =
    process.env;

  if (!GOOGLE_CLIENT_EMAIL || !GOOGLE_PRIVATE_KEY || !GOOGLE_SHEET_ID) {
    console.error("❌ Erro: Variáveis de ambiente do Google ausentes.");
    process.exit(1);
  }

  try {
    const count = await runFullSync({
      email: GOOGLE_CLIENT_EMAIL,
      key: GOOGLE_PRIVATE_KEY,
      sheetId: GOOGLE_SHEET_ID,
    });
    console.log(`✅ Sucesso! ${count} pesquisadoras sincronizadas no JSON.`);
  } catch (error) {
    console.error("❌ Falha na sincronização:", error);
    process.exit(1);
  }
}

main();
