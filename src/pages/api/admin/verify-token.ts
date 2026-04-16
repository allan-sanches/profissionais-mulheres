import type { APIRoute } from "astro";
import { ADMIN_TOKEN } from "astro:env/server";

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

    // Return success (token is valid)
    return new Response(
      JSON.stringify({ success: true, message: "Token válido" }),
      { status: 200 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500 }
    );
  }
};
