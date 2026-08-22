// Cor + ícone por categoria de badge — usado tanto na linha da tabela quanto
// no bento do perfil, pra a mesma categoria ser sempre reconhecível pela cor.
// Cores puxadas da paleta oficial da marca (ver theme.css): roxo vivo
// #9C00FF (primary), verde #0D9426 (secondary), violeta #7D1CD4 (accent),
// verde escuro #297552 (neutral), slate #45597D (info), roxo profundo
// #613BA8 (só aqui, sem token daisyUI dedicado). Escolhidas pra não colidir
// dentro do mesmo agrupamento visual (badges de identidade aparecem juntos
// tanto na coluna "Perfil" da tabela quanto na célula de identidade do bento).
export const CATEGORY_BADGE: Record<string, { color: string; icon: string }> = {
  localizacao: { color: "badge-warning", icon: "mdi:map-marker-outline" },
  nivelFormacao: {
    color: "bg-[#613BA8] text-white",
    icon: "mdi:school-outline",
  },
  identidade: { color: "badge-secondary", icon: "mdi:gender-transgender" },
  raca: { color: "badge-accent", icon: "mdi:account-multiple-outline" },
  lgbtqiap: { color: "badge-primary", icon: "mdi:flag-variant-outline" },
  pcd: { color: "badge-info", icon: "mdi:wheelchair-accessibility" },
  grupoTradicional: {
    color: "badge-neutral",
    icon: "mdi:account-group-outline",
  },
  grupoBiologico: { color: "badge-warning", icon: "mdi:paw-outline" },
  areaPesquisa: { color: "badge-primary", icon: "mdi:flask-outline" },
  formaColaboracao: { color: "badge-accent", icon: "mdi:handshake-outline" },
};

export const NIVEL_LABELS: Record<string, string> = {
  graduacao: "Graduação",
  mestrado: "Mestrado",
  doutorado: "Doutorado",
  outro: "Não informado",
};
export const NIVEL_ORDER = ["graduacao", "mestrado", "doutorado", "outro"];

export const IDENTIDADE_LABELS: Record<string, string> = {
  "mulher-cis": "Mulher cis",
  "mulher-trans": "Mulher trans",
  "homem-cis": "Homem cis",
  "homem-trans": "Homem trans",
  "nao-binario": "Não binário",
  "nao-informado": "Não informado",
};
export const IDENTIDADE_ORDER = [
  "mulher-cis",
  "mulher-trans",
  "homem-cis",
  "homem-trans",
  "nao-binario",
  "nao-informado",
];

export const RACA_LABELS: Record<string, string> = {
  branca: "Branca",
  preta: "Preta",
  parda: "Parda",
  amarela: "Amarela",
  indigena: "Indígena",
  "nao-informado": "Não informado",
};
export const RACA_ORDER = [
  "branca",
  "preta",
  "parda",
  "amarela",
  "indigena",
  "nao-informado",
];

// "Em quais formas de colaboração..." / "Áreas da pesquisa" / "Grupos biológicos" /
// "Qual seu trabalho atual?" vêm como célula única com valores separados por vírgula.
export function splitList(raw?: string): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

const ACEITA_ORDER = ["Sim", "Não", "Talvez", "Outro"];
export { ACEITA_ORDER };

export function normalizeAceitaPalestras(raw?: string): string {
  if (!raw) return "Outro";
  const n = raw.trim().toLowerCase();
  if (n.startsWith("sim")) return "Sim";
  if (n.startsWith("não") || n.startsWith("nao")) return "Não";
  if (n.startsWith("talvez")) return "Talvez";
  return "Outro";
}

// Texto livre da planilha vem com formatação inconsistente (vírgulas ou não,
// espaços duplicados) — "Abaetetuba Pará Brasil" e "Abaetetuba, Pará, Brasil"
// são o mesmo lugar. Essa chave ignora pontuação/espaçamento pra comparar.
export function canonicalizeKey(v: string): string {
  return v
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[.,]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Agrupa valores livres que só diferem por pontuação/espaçamento, mantendo a
// primeira grafia encontrada como representante de cada grupo.
export function buildDedupIndex(values: (string | undefined)[]) {
  const map = new Map<string, string>();
  for (const raw of values) {
    if (!raw) continue;
    const key = canonicalizeKey(raw);
    if (!map.has(key)) map.set(key, raw);
  }
  const resolve = (raw?: string): string => {
    if (!raw) return raw || "";
    return map.get(canonicalizeKey(raw)) ?? raw;
  };
  return { options: [...map.values()], resolve };
}

const LOWERCASE_CONNECTORS = new Set([
  "de",
  "da",
  "do",
  "das",
  "dos",
  "e",
  "em",
  "no",
  "na",
  "nos",
  "nas",
  "a",
  "o",
]);

function capitalizeWord(word: string): string {
  if (!word) return word;
  return word
    .toLowerCase()
    .replace(/(^|['-])(\p{L})/gu, (_m, sep, ch) => sep + ch.toUpperCase());
}

// Nomes de pessoas vêm com capitalização inconsistente na planilha ("GLÁUCIA
// HELENA..." vs "sophia dos santos"). Sempre recapitaliza, preservando
// conectores em minúscula ("de", "da", "dos"...) fora da primeira palavra.
export function formatName(v?: string): string {
  if (!v) return "";
  return v
    .trim()
    .split(/\s+/)
    .map((word, i) => {
      const bare = word.replace(/[().,]/g, "").toLowerCase();
      if (i > 0 && LOWERCASE_CONNECTORS.has(bare)) return bare;
      return capitalizeWord(word);
    })
    .join(" ");
}

// Localização/instituição: capitaliza como um nome próprio, mas preserva
// siglas que já vêm em maiúsculas (UFRJ, USP, RJ, SP...) em vez de "corrigir"
// para minúsculo.
export function formatPlace(v?: string): string {
  if (!v) return "";
  return v
    .trim()
    .split(/\s+/)
    .map((word, i) => {
      const bare = word.replace(/[().,]/g, "");
      const isAcronym =
        bare.length >= 2 &&
        bare === bare.toUpperCase() &&
        bare !== bare.toLowerCase();
      if (isAcronym) return word;
      const bareLower = bare.toLowerCase();
      if (i > 0 && LOWERCASE_CONNECTORS.has(bareLower))
        return word.toLowerCase();
      return capitalizeWord(word);
    })
    .join(" ");
}

const GRUPO_TRADICIONAL_VAZIO = "não pertenço a nenhum grupo mencionado";

export function isGrupoTradicionalVazio(v?: string): boolean {
  if (!v) return true;
  return (
    v.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim() ===
    GRUPO_TRADICIONAL_VAZIO.normalize("NFD").replace(/[̀-ͯ]/g, "")
  );
}
