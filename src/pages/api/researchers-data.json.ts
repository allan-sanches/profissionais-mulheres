import { getCollection } from "astro:content";
import { buildResearcherView } from "@/utils/researcher-view";
import {
  buildDedupIndex,
  formatPlace,
  parseRegion,
  isGrupoTradicionalVazio,
  splitList,
} from "@/utils/labels";

export const prerender = true;

export async function GET() {
  const researchers = await getCollection("researchers");

  const grupoTradicionalIndex = buildDedupIndex(
    researchers.map((r) =>
      isGrupoTradicionalVazio(r.data.grupo_tradicional)
        ? undefined
        : r.data.grupo_tradicional,
    ),
  );
  const localizacaoIndex = buildDedupIndex(
    researchers.map((r) => r.data.localizacao),
  );
  const trabalhoAtualIndex = buildDedupIndex(
    researchers.flatMap((r) => splitList(r.data.trabalho_atual)),
  );
  const instituicaoAtualIndex = buildDedupIndex(
    researchers.map((r) => r.data.instituicao_atual),
  );
  const areasPesquisaIndex = buildDedupIndex(
    researchers.flatMap((r) => r.data.areas_pesquisa || []),
  );
  const gruposBiologicosIndex = buildDedupIndex(
    researchers.flatMap((r) => r.data.grupos_biologicos || []),
  );

  const resolvers = {
    resolveLocalizacao: (raw?: string) =>
      formatPlace(localizacaoIndex.resolve(raw)),
    resolveInstituicaoAtual: (raw?: string) =>
      formatPlace(instituicaoAtualIndex.resolve(raw)),
    resolveGrupoTradicional: grupoTradicionalIndex.resolve,
    resolveTrabalhoAtual: trabalhoAtualIndex.resolve,
    resolveAreaPesquisa: areasPesquisaIndex.resolve,
    resolveGrupoBiologico: gruposBiologicosIndex.resolve,
  };

  const data = researchers.map((r) => {
    const vm = buildResearcherView(r, resolvers);
    return {
      id: r.id,
      nome: r.data.nome,
      instituicao: r.data.instituicao,
      dataAttrs: vm.dataAttrs,
    };
  });

  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" },
  });
}
