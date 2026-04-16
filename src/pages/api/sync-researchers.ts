import type { APIRoute } from "astro";
import { ADMIN_TOKEN } from "astro:env/server";
import { main as syncResearchers } from "@/scripts/sync-researchers";

export const POST: APIRoute = async ({ request }) => {
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

    // Run sync
    const result = await syncResearchers();

    if (result.success) {
      return new Response(
        JSON.stringify({
          success: true,
          message: result.message,
          count: result.count,
          timestamp: result.timestamp,
        }),
        { status: 200 }
      );
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          message: result.message,
          errors: result.errors,
        }),
        { status: 400 }
      );
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Internal server error";
    console.error("Sync error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: `Erro durante sincronização: ${errorMsg}`,
        errors: [errorMsg],
      }),
      { status: 500 }
    );
  }
};
