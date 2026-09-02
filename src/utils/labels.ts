// Cor + ícone por categoria de badge — usado na tabela, nos cards e no
// perfil, pra a mesma categoria ser sempre reconhecível pela cor.
//
// O brandbook define só duas famílias de fundo pra pílula: roxo (#F0DEFC)
// e verde (#D1EBD1). A regra aqui segue a especificação: categorias
// identitárias usam a família roxa, categorias de pesquisa (áreas, grupos
// biológicos, colaboração) usam a verde, e metadados neutros (titulação,
// localização) ficam em cinza. O ícone é o que distingue categorias da
// mesma família.
export const CATEGORY_BADGE: Record<string, { color: string }> = {
  localizacao: {
    color: "bg-gray-100 text-gray-600 border-gray-200",
  },
  nivelFormacao: {
    color:
      "bg-meco-slate-bg text-meco-slate-primary border-meco-slate-primary/20",
  },
  identidade: {
    color: "bg-meco-purple-bg text-meco-purple-deep border-meco-purple-soft/50",
  },
  raca: {
    color:
      "bg-meco-purple-bg/60 text-meco-purple-deep border-meco-purple-soft/40",
  },
  lgbtqiap: {
    color:
      "bg-meco-purple-bg text-meco-purple-primary border-meco-purple-soft/50",
  },
  pcd: {
    color:
      "bg-meco-purple-bg/60 text-meco-purple-primary border-meco-purple-soft/40",
  },
  grupoTradicional: {
    color:
      "bg-meco-purple-bg text-meco-purple-deep border-meco-purple-muted/50",
  },
  grupoBiologico: {
    color: "bg-meco-green-bg text-meco-green-dark border-meco-green-soft/60",
  },
  areaPesquisa: {
    color: "bg-meco-green-bg/70 text-meco-green-dark border-meco-green-soft/50",
  },
  formaColaboracao: {
    color: "bg-meco-green-bg text-meco-green-dark border-meco-green-soft/60",
  },
};

// Classe base compartilhada do formato "pill" — usar junto com
// CATEGORY_BADGE[x].color.
//
// Sem `whitespace-nowrap`: o texto vem da planilha e nem sempre é curto — há
// registro com 92 caracteres num campo de grupo biológico. Com nowrap a
// pílula não cabia na coluna e empurrava a largura da tabela inteira. Sem ele,
// rótulo curto continua numa linha só (não há o que quebrar) e o longo quebra
// em quantas precisar.
//
// `max-w-full` prende a pílula à largura do container, e `break-words` cobre o
// caso de uma única palavra maior que a coluna, que nem espaço tem pra quebrar.
//
// `text-center`: quando o texto quebra em duas linhas, `items-center` do flex
// só centraliza a caixa de texto como um todo verticalmente — o alinhamento de
// cada linha continua seguindo o text-align padrão (esquerda). Sem isso a
// segunda linha ficava desalinhada da primeira dentro da pílula arredondada.
export const PILL_BASE =
  "inline-flex max-w-full items-center gap-1 rounded-full border px-2.5 py-1 text-center text-xs font-medium break-words";

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

// ── Região (UF / país) ──────────────────────────────────────────────
// A planilha traz localização como texto livre e inconsistente:
// "Caravelas-BA, Brasil", "sao luis, maranhao, brasil", "Natal, RN, Brasil",
// "Mogi Guaçu (SP) Brasil". Filtrar por essa string crua geraria 150+ opções
// quase todas com 1 resultado. parseRegion normaliza pra UF (quando é Brasil)
// ou pro país (quando é fora), que é o que a especificação pede.

const ESTADO_POR_NOME: Record<string, string> = {
  acre: "AC",
  alagoas: "AL",
  amapa: "AP",
  amazonas: "AM",
  bahia: "BA",
  ceara: "CE",
  "distrito federal": "DF",
  "espirito santo": "ES",
  goias: "GO",
  maranhao: "MA",
  "mato grosso": "MT",
  "mato grosso do sul": "MS",
  "minas gerais": "MG",
  para: "PA",
  paraiba: "PB",
  parana: "PR",
  pernambuco: "PE",
  piaui: "PI",
  "rio de janeiro": "RJ",
  "rio grande do norte": "RN",
  "rio grande do sul": "RS",
  rondonia: "RO",
  roraima: "RR",
  "santa catarina": "SC",
  "sao paulo": "SP",
  sergipe: "SE",
  tocantins: "TO",
};

const NOME_POR_UF: Record<string, string> = {
  AC: "Acre",
  AL: "Alagoas",
  AP: "Amapá",
  AM: "Amazonas",
  BA: "Bahia",
  CE: "Ceará",
  DF: "Distrito Federal",
  ES: "Espírito Santo",
  GO: "Goiás",
  MA: "Maranhão",
  MT: "Mato Grosso",
  MS: "Mato Grosso do Sul",
  MG: "Minas Gerais",
  PA: "Pará",
  PB: "Paraíba",
  PR: "Paraná",
  PE: "Pernambuco",
  PI: "Piauí",
  RJ: "Rio de Janeiro",
  RN: "Rio Grande do Norte",
  RS: "Rio Grande do Sul",
  RO: "Rondônia",
  RR: "Roraima",
  SC: "Santa Catarina",
  SP: "São Paulo",
  SE: "Sergipe",
  TO: "Tocantins",
};

const UF_SET = new Set(Object.values(ESTADO_POR_NOME));

// Só os países realmente presentes na base, mapeados pra grafia em português.
const PAIS_ALIAS: Record<string, string> = {
  eua: "Estados Unidos",
  usa: "Estados Unidos",
  "estados unidos": "Estados Unidos",
  canada: "Canadá",
  sweden: "Suécia",
  suecia: "Suécia",
  australia: "Austrália",
  franca: "França",
  espanha: "Espanha",
  portugal: "Portugal",
  argentina: "Argentina",
  mexico: "México",
  equador: "Equador",
};

// Igual a canonicalizeKey, mas também neutraliza hífen, barra e parênteses,
// que aparecem em "Caravelas-BA" e "Mogi Guaçu (SP)".
function canonicalizeRegion(v: string): string {
  return v
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[.,\-/()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export interface Region {
  value: string;
  label: string;
}

export function parseRegion(raw?: string): Region | null {
  if (!raw) return null;
  const c = canonicalizeRegion(raw);

  // Nome de estado por extenso. Os mais longos primeiro pra "mato grosso do
  // sul" não casar antes como "mato grosso".
  const nomes = Object.keys(ESTADO_POR_NOME).sort(
    (a, b) => b.length - a.length,
  );
  for (const nome of nomes) {
    if (new RegExp(`(^| )${nome}( |$)`).test(c)) {
      const uf = ESTADO_POR_NOME[nome];
      return { value: uf, label: `${NOME_POR_UF[uf]} (${uf})` };
    }
  }

  // Sigla de UF isolada como token ("Natal, RN, Brasil").
  for (const tok of c.split(" ")) {
    const up = tok.toUpperCase();
    if (tok.length === 2 && UF_SET.has(up)) {
      return { value: up, label: `${NOME_POR_UF[up]} (${up})` };
    }
  }

  for (const [alias, nome] of Object.entries(PAIS_ALIAS)) {
    if (new RegExp(`(^| )${alias}( |$)`).test(c)) {
      return { value: nome, label: nome };
    }
  }

  if (/(^| )(brasil|brazil)( |$)/.test(c)) {
    return { value: "Brasil", label: "Brasil (UF não informada)" };
  }
  return null;
}

// Ordena as opções de região: UFs brasileiras primeiro (alfabético), depois
// "Brasil" genérico, depois países estrangeiros.
export function compareRegions(a: Region, b: Region): number {
  const rank = (r: Region) =>
    UF_SET.has(r.value) ? 0 : r.value === "Brasil" ? 1 : 2;
  const diff = rank(a) - rank(b);
  return diff !== 0 ? diff : a.label.localeCompare(b.label, "pt-BR");
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
