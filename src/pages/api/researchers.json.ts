import { getCollection } from "astro:content";
import type { APIRoute } from "astro";
import { buildResearcherView } from "@/utils/researcher-view";

export const GET: APIRoute = async ({ url }) => {
  const page = parseInt(url.searchParams.get("page") || "1");
  const pageSize = parseInt(url.searchParams.get("pageSize") || "20");

  const allResearchers = await getCollection("researchers");
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const researchers = allResearchers.slice(start, end);

  return new Response(
    JSON.stringify({
      data: researchers.map((r) => ({
        id: r.id,
        nome: r.data.nome,
        instituicao: r.data.instituicao,
        bio: r.data.bio,
      })),
      page,
      pageSize,
      total: allResearchers.length,
      hasMore: end < allResearchers.length,
    }),
    {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=3600",
      },
    },
  );
};
