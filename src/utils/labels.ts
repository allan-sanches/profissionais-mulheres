// Cor + ícone por categoria de badge — usado na tabela, nos cards e no
// perfil, pra a mesma categoria ser sempre reconhecível pela cor.
//
// O brandbook define só duas famílias de fundo pra pílula: roxo (#F0DEFC)
// e verde (#D1EBD1). A regra aqui segue a especificação: categorias
// identitárias usam a família roxa, categorias de pesquisa (áreas, grupos
// biológicos, colaboração) usam a verde, e metadados neutros (titulação,
// localização) ficam em cinza. O ícone é o que distingue categorias da
// mesma família.
export const CATEGORY_BADGE: Record<string, { color: string; icon: string }> = {
  localizacao: {
    color: "bg-gray-100 text-gray-600 border-gray-200",
    icon: "mdi:map-marker-outline",
  },
  nivelFormacao: {
    color: "bg-gray-100 text-gray-700 border-gray-200",
    icon: "mdi:school-outline",
  },
  identidade: {
    color: "bg-meco-purple-bg text-meco-purple-deep border-meco-purple-soft/50",
    icon: "mdi:gender-transgender",
  },
  raca: {
    color:
      "bg-meco-purple-bg/60 text-meco-purple-deep border-meco-purple-soft/40",
    icon: "mdi:account-multiple-outline",
  },
  lgbtqiap: {
    color:
      "bg-meco-purple-bg text-meco-purple-primary border-meco-purple-soft/50",
    icon: "mdi:flag-variant-outline",
  },
  pcd: {
    color:
      "bg-meco-purple-bg/60 text-meco-purple-primary border-meco-purple-soft/40",
    icon: "mdi:wheelchair-accessibility",
  },
  grupoTradicional: {
    color:
      "bg-meco-purple-bg text-meco-purple-deep border-meco-purple-muted/50",
    icon: "mdi:account-group-outline",
  },
  grupoBiologico: {
    color: "bg-meco-green-bg text-meco-green-dark border-meco-green-soft/60",
    icon: "mdi:paw-outline",
  },
  areaPesquisa: {
    color: "bg-meco-green-bg/70 text-meco-green-dark border-meco-green-soft/50",
    icon: "mdi:flask-outline",
  },
  formaColaboracao: {
    color: "bg-meco-green-bg text-meco-green-dark border-meco-green-soft/60",
    icon: "mdi:handshake-outline",
  },
};

// Classe base compartilhada do formato "pill" — usar junto com
// CATEGORY_BADGE[x].color.
export const PILL_BASE =
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium whitespace-nowrap";

// Ícone descritivo por forma de colaboração, pros mini-cards do perfil.
// As chaves são fragmentos em minúsculo casados por `includes` — o texto vem
// livre da planilha e tem variações ("Mentoria" vs "Mentoria ou orientação de
// estudantes"), então casamos por trecho em vez de igualdade exata.
const COLABORACAO_ICONS: [string, string][] = [
  ["palestra", "mdi:presentation"],
  ["workshop", "mdi:human-male-board"],
  ["mentoria", "mdi:school-outline"],
  ["orientação", "mdi:school-outline"],
  ["banca", "mdi:account-tie-outline"],
  ["revisão de texto", "mdi:file-document-edit-outline"],
  ["revisão de divulgação", "mdi:bullhorn-outline"],
  ["revisão de artigos", "mdi:file-check-outline"],
  ["divulgação", "mdi:bullhorn-outline"],
  ["organização de eventos", "mdi:calendar-star"],
  ["análises estatísticas", "mdi:chart-bar"],
  ["análise de dados", "mdi:chart-bar"],
  ["modelagem", "mdi:function-variant"],
  ["programação", "mdi:code-braces"],
  ["mapas", "mdi:map-outline"],
  ["tradução", "mdi:translate"],
  ["traduação", "mdi:translate"],
  ["materiais visuais", "mdi:palette-outline"],
  ["consultoria", "mdi:briefcase-outline"],
  ["assessoria", "mdi:briefcase-outline"],
  ["relatório", "mdi:file-chart-outline"],
  ["identificação de espécies", "mdi:magnify-scan"],
  ["campo", "mdi:pine-tree"],
  ["educação ambiental", "mdi:leaf"],
  ["projetos", "mdi:lightbulb-outline"],
  ["rede", "mdi:account-network-outline"],
];

export function colaboracaoIcon(forma: string): string {
  const n = forma.toLowerCase();
  for (const [needle, icon] of COLABORACAO_ICONS) {
    if (n.includes(needle)) return icon;
  }
  return "mdi:handshake-outline";
}

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
