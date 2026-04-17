import type { APIRoute } from "astro";
import {
  ADMIN_TOKEN,
  GOOGLE_CLIENT_EMAIL,
  GOOGLE_PRIVATE_KEY,
  GOOGLE_SHEET_ID,
} from "astro:env/server";
import { runFullSync } from "../../utils/google-sheets";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token || token !== ADMIN_TOKEN) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    const count = await runFullSync({
      email: GOOGLE_CLIENT_EMAIL,
      key: GOOGLE_PRIVATE_KEY,
      sheetId: GOOGLE_SHEET_ID,
    });

    return new Response(
      JSON.stringify({
        success: true,
        count,
        message: "Sincronização concluída com sucesso!",
      }),
      { status: 200 },
    );
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
};
