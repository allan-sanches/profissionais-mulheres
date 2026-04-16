import type { APIRoute } from "astro";
import { ADMIN_TOKEN } from "astro:env/server";
import { getCollection } from "astro:content";

interface SyncLog {
  timestamp: string;
}

export const GET: APIRoute = async ({ request }) => {
  try {
    // Check authorization
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token || token !== ADMIN_TOKEN) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401 }
      );
    }

    // Get researchers count
    const researchers = await getCollection("researchers");
    const count = researchers.length;

    // Try to get last sync time from researchers data
    let lastSync = "Nunca";
    if (researchers.length > 0) {
      const latestResearcher = researchers[researchers.length - 1];
      if (latestResearcher.data.data_sincronizacao) {
        const date = new Date(latestResearcher.data.data_sincronizacao);
        lastSync = date.toLocaleString("pt-BR");
      }
    }

    return new Response(
      JSON.stringify({
        count,
        lastSync,
        status: "connected",
      }),
      { status: 200 }
    );
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: errorMsg }),
      { status: 500 }
    );
  }
};
