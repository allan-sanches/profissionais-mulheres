import { runFullSync, describePrivateKey } from "../utils/google-sheets";
import { config } from "dotenv";
import path from "path";

config({ path: path.resolve(process.cwd(), ".env.local") });

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
    if ((error as { code?: string })?.code === "ERR_OSSL_UNSUPPORTED") {
      console.error(
        "\n🔑 A chave privada não foi aceita pelo OpenSSL. Formato recebido:\n     " +
          describePrivateKey(GOOGLE_PRIVATE_KEY),
      );
    }
    process.exit(1);
  }
}

main();
