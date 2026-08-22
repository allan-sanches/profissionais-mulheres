import type { CollectionEntry } from "astro:content";
import {
  splitList,
  normalizeAceitaPalestras,
  isGrupoTradicionalVazio,
  formatName,
  formatPlace,
  IDENTIDADE_LABELS,
  RACA_LABELS,
} from "@/utils/labels";

export interface ResearcherResolvers {
  resolveLocalizacao?: (raw?: string) => string;
  resolveInstituicaoAtual?: (raw?: string) => string;
  resolveGrupoTradicional?: (raw?: string) => string;
  resolveTrabalhoAtual?: (raw?: string) => string;
  resolveAreaPesquisa?: (raw?: string) => string;
  resolveGrupoBiologico?: (raw?: string) => string;
}

const identity = (raw?: string) => raw || "";

// Único lugar que calcula os campos exibidos e os data-* usados pelos
// filtros client-side. Tabela (ResearcherRow) e cards (ResearcherCard)
// consomem o mesmo view-model pra nunca divergir nos atributos de filtro.
export function buildResearcherView(
  researcher: CollectionEntry<"researchers">,
  resolvers: ResearcherResolvers = {},
) {
  const {
    resolveLocalizacao = identity,
    resolveInstituicaoAtual = identity,
    resolveGrupoTradicional = identity,
    resolveTrabalhoAtual = identity,
    resolveAreaPesquisa = identity,
    resolveGrupoBiologico = identity,
  } = resolvers;
  const r = researcher.data;

  const hidden = new Set(r.campos_ocultos || []);
  const show = (campo: string, valor?: string) =>
    Boolean(valor) && !hidden.has(campo);

  const showIdentidade =
    show("identidade_genero", r.identidade_genero) &&
    r.identidade_genero !== "nao-informado";
  const showRaca =
    show("raca_etnia", r.raca_etnia) && r.raca_etnia !== "nao-informado";
  const showLgbtqiap = !hidden.has("lgbtqiap") && r.lgbtqiap === true;
  const showPcd = !hidden.has("pcd") && r.pcd === true;
  const showGrupoTradicional =
    show("grupo_tradicional", r.grupo_tradicional) &&
    !isGrupoTradicionalVazio(r.grupo_tradicional);
  const gruposBiologicosList = hidden.has("grupos_biologicos")
    ? []
    : r.grupos_biologicos || [];

  const nomeFormatado = formatName(r.nome) || "Pesquisadora sem nome";
  const [primeiroNome, ...restoNomeParts] = nomeFormatado.split(" ");
  const restoNome = restoNomeParts.join(" ");
  const instituicaoFormatada = show("instituicao", r.instituicao)
    ? formatPlace(r.instituicao)
    : "";
  const localizacaoFormatada = show("localizacao", r.localizacao)
    ? formatPlace(r.localizacao)
    : "";

  const handleInstagramLink = (instagram?: string) => {
    if (!instagram) return "";
    return instagram.startsWith("http")
      ? instagram
      : `https://instagram.com/${instagram.replace(/^@/, "")}`;
  };
  const handleLinkedinLink = (linkedin?: string) => {
    if (!linkedin) return "";
    return linkedin.startsWith("http")
      ? linkedin
      : `https://linkedin.com/in/${linkedin}`;
  };
  const handleOrcidLink = (orcid?: string) => {
    if (!orcid) return "";
    return orcid.startsWith("http") ? orcid : `https://orcid.org/${orcid}`;
  };

  const initials = (r.nome || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  const links = [
    {
      show: show("curriculo", r.curriculo),
      href: r.curriculo,
      icon: "academicons:lattes",
      title: "Currículo Lattes",
    },
    {
      show: show("researchgate", r.researchgate),
      href: r.researchgate,
      icon: "academicons:researchgate",
      title: "ResearchGate",
    },
    {
      show: show("orcid", r.orcid),
      href: handleOrcidLink(r.orcid),
      icon: "academicons:orcid",
      title: "ORCID",
    },
    {
      show: show("linkedin", r.linkedin),
      href: handleLinkedinLink(r.linkedin),
      icon: "mdi:linkedin",
      title: "LinkedIn",
    },
    {
      show: show("instagram", r.instagram),
      href: handleInstagramLink(r.instagram),
      icon: "mdi:instagram",
      title: "Instagram",
    },
    {
      show: show("site_pessoal", r.site_pessoal),
      href: r.site_pessoal,
      icon: "mdi:web",
      title: "Site pessoal",
    },
  ].filter((link) => link.show);

  const dataLgbtqiap =
    r.lgbtqiap === undefined ? "" : r.lgbtqiap ? "sim" : "nao";
  const dataPcd = r.pcd === undefined ? "" : r.pcd ? "sim" : "nao";
  const dataTrabalhoAtual = splitList(r.trabalho_atual)
    .map((v) => resolveTrabalhoAtual(v))
    .join("|");
  const dataAreasPesquisa = (r.areas_pesquisa || [])
    .map((v) => resolveAreaPesquisa(v))
    .join("|");
  const dataGruposBiologicos = (r.grupos_biologicos || [])
    .map((v) => resolveGrupoBiologico(v))
    .join("|");
  const dataAceitaPalestras = show("aceita_palestras", r.aceita_palestras)
    ? normalizeAceitaPalestras(r.aceita_palestras)
    : "";

  // Chaves já no formato "data-*" pra poderem ser espalhadas (`{...dataAttrs}`)
  // direto no elemento raiz da tabela e do card, garantindo atributos idênticos.
  const dataAttrs: Record<string, string> = {
    "data-slug": researcher.id,
    "data-identidade": show("identidade_genero", r.identidade_genero)
      ? r.identidade_genero!
      : "",
    "data-raca": show("raca_etnia", r.raca_etnia) ? r.raca_etnia! : "",
    "data-lgbtqiap": dataLgbtqiap,
    "data-pcd": dataPcd,
    "data-grupo-tradicional": show("grupo_tradicional", r.grupo_tradicional)
      ? resolveGrupoTradicional(r.grupo_tradicional)
      : "",
    "data-localizacao": show("localizacao", r.localizacao)
      ? resolveLocalizacao(r.localizacao)
      : "",
    "data-nivel-formacao": r.nivel_formacao || "",
    "data-trabalho-atual": dataTrabalhoAtual,
    "data-instituicao-atual": show("instituicao_atual", r.instituicao_atual)
      ? resolveInstituicaoAtual(r.instituicao_atual)
      : "",
    "data-areas-pesquisa": dataAreasPesquisa,
    "data-grupos-biologicos": dataGruposBiologicos,
    "data-aceita-palestras": dataAceitaPalestras,
    "data-formacao": show("formacao", r.formacao) ? r.formacao! : "",
    "data-instituicao": show("instituicao", r.instituicao)
      ? r.instituicao!
      : "",
    "data-nome": (r.nome || "").toLowerCase(),
  };

  // Lista unificada de badges de perfil. A ordem define quais aparecem
  // inline e quais caem no popover "+{N}": a especificação manda priorizar
  // identidade e grupos biológicos, então esses vêm primeiro e os marcadores
  // adicionais (LGBTQIAP+, PCD, grupo tradicional) ficam no overflow.
  const badges: { key: string; label: string }[] = [
    ...(showIdentidade
      ? [{ key: "identidade", label: IDENTIDADE_LABELS[r.identidade_genero!] }]
      : []),
    ...(showRaca ? [{ key: "raca", label: RACA_LABELS[r.raca_etnia!] }] : []),
    ...gruposBiologicosList.map((grupo) => ({
      key: "grupoBiologico",
      label: grupo,
    })),
    ...(showLgbtqiap ? [{ key: "lgbtqiap", label: "LGBTQIAP+" }] : []),
    ...(showPcd ? [{ key: "pcd", label: "PCD" }] : []),
    ...(showGrupoTradicional
      ? [{ key: "grupoTradicional", label: r.grupo_tradicional! }]
      : []),
  ];

  return {
    r,
    show,
    showIdentidade,
    showRaca,
    showLgbtqiap,
    showPcd,
    showGrupoTradicional,
    gruposBiologicosList,
    badges,
    nomeFormatado,
    primeiroNome,
    restoNome,
    instituicaoFormatada,
    localizacaoFormatada,
    initials,
    links,
    dataAttrs,
  };
}
