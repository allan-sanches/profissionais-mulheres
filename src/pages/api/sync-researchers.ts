import type { APIRoute } from "astro";
import { ADMIN_TOKEN } from "astro:env/server";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const authHeader = request.headers.get("Authorization");
  if (authHeader?.replace("Bearer ", "") !== ADMIN_TOKEN) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  try {
    // Substitua pelo seu usuário e repositório
    const REPO = "allan-sanches/profissionais-mulheres";
    const WORKFLOW_ID = "sync-researchers.yml"; // Nome do seu arquivo .yml
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN; // Adicione na Vercel!

    const res = await fetch(
      `https://api.github.com/repos/${REPO}/actions/workflows/${WORKFLOW_ID}/dispatches`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: "application/vnd.github+json",
          "User-Agent": "Astro-App",
        },
        body: JSON.stringify({ ref: "main" }),
      },
    );

    if (!res.ok) {
      const errorData = await res.text();
      throw new Error(`GitHub API Error: ${errorData}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message:
          "Sincronização solicitada! O site será atualizado em instantes pelo GitHub.",
      }),
      { status: 200 },
    );
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
};
