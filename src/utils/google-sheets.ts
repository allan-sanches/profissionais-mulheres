import { google } from "googleapis";
import fs from "fs/promises";
import path from "path";

type NivelFormacao = "graduacao" | "mestrado" | "doutorado" | "outro";

type IdentidadeGenero =
  | "mulher-cis"
  | "mulher-trans"
  | "homem-cis"
  | "homem-trans"
  | "nao-binario"
  | "nao-informado";

type RacaEtnia =
  | "branca"
  | "preta"
  | "parda"
  | "amarela"
  | "indigena"
  | "nao-informado";

interface ResearcherRecord {
  nome?: string;
  email?: string;
  telefone?: string;
  formacao?: string;
  nivel_formacao?: NivelFormacao;
  instituicao?: string;
  identidade_genero?: IdentidadeGenero;
  raca_etnia?: RacaEtnia;
  imagem?: string;
  curriculo?: string;
  researchgate?: string;
  instagram?: string;
  site_pessoal?: string;
  localizacao?: string;
  genero?: string;
  lgbtqiap?: boolean;
  pcd?: boolean;
  grupo_tradicional?: string;
  cidade_natal?: string;
  trabalho_atual?: string;
  instituicao_atual?: string;
  aceita_palestras?: string;
  observacoes?: string;
  linkedin?: string;
  orcid?: string;
  bio?: string;
  areas_pesquisa?: string[];
  grupos_biologicos?: string[];
  formas_colaboracao?: string[];
  data_sincronizacao?: string;
  campos_ocultos?: string[];
  gerenciado_pela_planilha?: boolean;
}

// Mapeia campos internos -> nomes de coluna reais do formulário oficial
// "Mulheres na Ecologia" (confirmado direto na planilha em 2026-08-14).
// Telefone/LinkedIn/ORCID/Imagem não existem no formulário ainda — ficam
// sob curadoria manual no Keystatic até serem adicionados por lá.
export const HEADER_MAP = {
  nome: "Nome completo:",
  email: "E-mail para contato:",
  curriculo: "Link do currículo lattes:",
  researchgate: "Link do ResearchGate:",
  instagram: "Instagram:",
  site_pessoal: "Site/Blog pessoal:",
  genero: "Gênero:",
  lgbtqiap: "Você se identifica como parte da comunidade LGBTQIAP+?",
  pcd: "Você se identifica como Pessoa com Deficiência (PCD)?",
  raca_etnia: "Qual a sua raça/cor?",
  grupo_tradicional:
    "Você se identifica como pertencente a algum dos grupos abaixo?",
  cidade_natal: "Cidade, Estado e País onde nasceu:",
  localizacao: "Cidade, Estado e País que reside atualmente:",
  graduacao_status: "Graduação",
  graduacao_curso: "Curso de graduação",
  graduacao_universidade:
    "Graduação completa ou em andamento: Em qual Universidade fez/está fazendo seu curso de graduação?",
  mestrado_status: "Mestrado",
  mestrado_programa:
    "Mestrado completo ou em andamento: Em qual programa de Pós-Graduação fez/está fazendo seu mestrado?",
  mestrado_universidade:
    "Mestrado completo ou em andamento: Em qual Universidade fez/está fazendo seu mestrado?",
  doutorado_status: "Doutorado",
  doutorado_programa:
    "Doutorado completo ou em andamento: Em qual programa de Pós-Graduação fez/está fazendo seu doutorado?",
  doutorado_universidade:
    "Doutorado completo ou em andamento: Em qual Universidade fez/está fazendo seu doutorado?",
  trabalho_atual: "Qual seu trabalho atual?",
  instituicao_atual: "Instituição ou Universidade",
  bio: "Descreva sua pesquisa em uma frase",
  areas_pesquisa: "Qual(is) a(s) grande(s) área(s) da sua pesquisa?",
  grupos_biologicos: "Grupo(s) biológico(s) de interesse na sua pesquisa",
  aceita_palestras:
    "Você aceitaria ministrar palestras, minicursos, ou workshops sobre sua pesquisa para estudantes de graduação e pós-graduação de forma gratuita?",
  formas_colaboracao:
    "Em quais formas de colaboração você se sente à vontade para contribuir com outras pesquisadoras?",
  observacoes:
    "Caso queira citar colaborações extras, sugestões ou críticas, use este espaço:",
} as const;

export async function runFullSync(credentials: {
  email: string;
  key: string;
  sheetId: string;
}) {
  const auth = new google.auth.JWT({
    email: credentials.email,
    key: credentials.key.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });

  const sheets = google.sheets({ version: "v4", auth });
  const spreadsheet = await sheets.spreadsheets.get({
    spreadsheetId: credentials.sheetId,
  });
  const sheetTitle = spreadsheet.data.sheets?.[0].properties?.title || "Sheet1";

  // Pega a planilha inteira (não trava em A:Q) pra aguentar colunas novas/reordenadas.
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: credentials.sheetId,
    range: sheetTitle,
  });

  const allRows = response.data.values || [];
  const headerRow = (allRows[0] || []).map((h) => (h ?? "").toString().trim());
  const rows = allRows.slice(1);

  const columnIndex = (header: string): number =>
    headerRow.findIndex((h) => h.toLowerCase() === header.toLowerCase());

  const HEADER_INDEX = Object.fromEntries(
    Object.entries(HEADER_MAP).map(([field, header]) => [
      field,
      columnIndex(header),
    ]),
  ) as Record<keyof typeof HEADER_MAP, number>;

  const cell = (row: unknown[], field: keyof typeof HEADER_MAP): string => {
    const idx = HEADER_INDEX[field];
    if (idx < 0) return "";
    return (row[idx] ?? "").toString().trim();
  };

  const slugify = (nome: string) =>
    nome
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");

  // Graduação/Mestrado/Doutorado vêm como 3 blocos de colunas (status, curso
  // ou programa, universidade). O nível mais alto com status preenchido
  // (completo ou em andamento) vira a "formação" exibida.
  const statusPreenchido = (status: string) =>
    Boolean(status) && !/não iniciad/i.test(status);

  const parseFormacao = (row: unknown[]) => {
    const doutoradoStatus = cell(row, "doutorado_status");
    const mestradoStatus = cell(row, "mestrado_status");
    const graduacaoStatus = cell(row, "graduacao_status");

    if (statusPreenchido(doutoradoStatus)) {
      return {
        formacao: sanitize(cell(row, "doutorado_programa")),
        instituicao: sanitize(cell(row, "doutorado_universidade")),
        nivel: "doutorado" as NivelFormacao,
      };
    }
    if (statusPreenchido(mestradoStatus)) {
      return {
        formacao: sanitize(cell(row, "mestrado_programa")),
        instituicao: sanitize(cell(row, "mestrado_universidade")),
        nivel: "mestrado" as NivelFormacao,
      };
    }
    if (statusPreenchido(graduacaoStatus)) {
      return {
        formacao: sanitize(cell(row, "graduacao_curso")),
        instituicao: sanitize(cell(row, "graduacao_universidade")),
        nivel: "graduacao" as NivelFormacao,
      };
    }
    return { formacao: "", instituicao: "", nivel: undefined };
  };

  const inferNivelFormacao = (formacao: string): NivelFormacao => {
    const f = formacao.toLowerCase();
    if (f.includes("doutor") || f.includes("phd") || f.includes("ph.d"))
      return "doutorado";
    if (f.includes("mestr")) return "mestrado";
    if (
      f.includes("bacharel") ||
      f.includes("graduaç") ||
      f.includes("licenciatura")
    )
      return "graduacao";
    return "outro";
  };

  // Normaliza texto livre da planilha. Se não reconhecer, cai em
  // "não informado" em vez de travar o sync.
  const normalize = (v: string) =>
    v.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();

  // "Gênero:" vem como "Feminino / Cisgênero", "Masculino / Transgênero",
  // "Não-binário" etc.
  const parseIdentidadeGenero = (v: string): IdentidadeGenero => {
    const n = normalize(v);
    if (!n) return "nao-informado";
    if (n.includes("nao-binari") || n.includes("nao binari"))
      return "nao-binario";
    const isFeminino = n.includes("feminino");
    const isMasculino = n.includes("masculino");
    const isTrans = n.includes("trans");
    if (isFeminino) return isTrans ? "mulher-trans" : "mulher-cis";
    if (isMasculino) return isTrans ? "homem-trans" : "homem-cis";
    return "nao-informado";
  };

  const racaEtniaMap: Record<string, RacaEtnia> = {
    branca: "branca",
    preta: "preta",
    parda: "parda",
    amarela: "amarela",
    indigena: "indigena",
  };
  const parseRacaEtnia = (v: string): RacaEtnia =>
    racaEtniaMap[normalize(v)] || "nao-informado";

  const parseSimNao = (v: string): boolean | undefined => {
    if (!v) return undefined;
    return normalize(v) === "sim";
  };

  // Muitas respondentes escreveram "não se aplica" / "não tenho" / "N/A" em
  // vez de deixar em branco. Trata essas variações como campo vazio, senão
  // viram links/textos quebrados na tela (ex: botão Instagram apontando pra
  // "Não se aplica").
  const isNaoAplica = (v: string) => {
    const n = normalize(v).replace(/\.$/, "");
    return (
      /^(nao|n)\s*(se)?\s*(aplica|aplicar|aplicavel|tenho|uso|utilizo|possuo|faco)$/.test(
        n,
      ) || /^n\/?a$/.test(n)
    );
  };
  const sanitize = (v: string) => (isNaoAplica(v) ? "" : v);

  // Campos de lista (múltiplos valores separados por vírgula na célula).
  const parseLista = (v: string): string[] =>
    v
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

  // Campos de texto livre que vêm da planilha. Uma célula vazia NÃO apaga um
  // valor preenchido manualmente pelo Keystatic — só um valor novo sobrescreve.
  const sheetFields = [
    "nome",
    "email",
    "curriculo",
    "researchgate",
    "instagram",
    "site_pessoal",
    "genero",
    "grupo_tradicional",
    "cidade_natal",
    "localizacao",
    "trabalho_atual",
    "instituicao_atual",
    "bio",
    "aceita_palestras",
    "observacoes",
  ] as const;

  const rowsData = rows
    .map((row) => {
      const nome = cell(row, "nome");
      const { formacao, instituicao, nivel } = parseFormacao(row);
      const fromSheet: Record<(typeof sheetFields)[number], string> = {
        nome,
        email: cell(row, "email"),
        curriculo: sanitize(cell(row, "curriculo")),
        researchgate: sanitize(cell(row, "researchgate")),
        instagram: sanitize(cell(row, "instagram")),
        site_pessoal: sanitize(cell(row, "site_pessoal")),
        genero: cell(row, "genero"),
        grupo_tradicional: sanitize(cell(row, "grupo_tradicional")),
        cidade_natal: cell(row, "cidade_natal"),
        localizacao: cell(row, "localizacao"),
        trabalho_atual: sanitize(cell(row, "trabalho_atual")),
        instituicao_atual: sanitize(cell(row, "instituicao_atual")),
        bio: sanitize(cell(row, "bio")),
        aceita_palestras: cell(row, "aceita_palestras"),
        observacoes: sanitize(cell(row, "observacoes")),
      };
      return {
        slug: slugify(nome),
        fromSheet,
        formacao,
        instituicao,
        nivel,
        areasPesquisa: parseLista(cell(row, "areas_pesquisa")),
        gruposBiologicos: parseLista(cell(row, "grupos_biologicos")),
        formasColaboracao: parseLista(cell(row, "formas_colaboracao")),
        identidadeGeneroRaw: fromSheet.genero,
        racaEtniaRaw: cell(row, "raca_etnia"),
        lgbtqiap: parseSimNao(cell(row, "lgbtqiap")),
        pcd: parseSimNao(cell(row, "pcd")),
      };
    })
    .filter((r) => r.fromSheet.nome && r.fromSheet.email);

  // Respostas duplicadas (mesma pessoa preencheu o formulário mais de uma
  // vez) geram o mesmo slug. Mantém só a última ocorrência — senão duas
  // escritas concorrentes no mesmo arquivo corrompem o JSON.
  const dedupedBySlug = new Map<string, (typeof rowsData)[number]>();
  for (const entry of rowsData) {
    dedupedBySlug.set(entry.slug, entry);
  }
  const dedupedRows = [...dedupedBySlug.values()];

  const OUTPUT_DIR = path.resolve("./src/content/researchers");
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  const readExisting = async (
    slug: string,
  ): Promise<ResearcherRecord | null> => {
    try {
      const raw = await fs.readFile(
        path.join(OUTPUT_DIR, `${slug}.json`),
        "utf-8",
      );
      return JSON.parse(raw) as ResearcherRecord;
    } catch {
      return null;
    }
  };

  // Só apaga pesquisadoras que o próprio sync criou (gerenciado_pela_planilha)
  // e que saíram da planilha. Entradas criadas manualmente no Keystatic nunca
  // são removidas automaticamente.
  const currentSlugs = new Set(dedupedRows.map((r) => r.slug));
  const existingFiles = await fs.readdir(OUTPUT_DIR).catch(() => []);
  for (const file of existingFiles) {
    if (!file.endsWith(".json")) continue;
    const slug = file.replace(/\.json$/, "");
    if (currentSlugs.has(slug)) continue;
    const existing = await readExisting(slug);
    if (existing?.gerenciado_pela_planilha) {
      await fs.unlink(path.join(OUTPUT_DIR, file));
    }
  }

  await Promise.all(
    dedupedRows.map(
      async ({
        slug,
        fromSheet,
        formacao,
        instituicao,
        nivel,
        areasPesquisa,
        gruposBiologicos,
        formasColaboracao,
        identidadeGeneroRaw,
        racaEtniaRaw,
        lgbtqiap,
        pcd,
      }) => {
        const existing = await readExisting(slug);

        const merged: ResearcherRecord = { ...existing };
        for (const field of sheetFields) {
          const sheetValue = fromSheet[field];
          if (sheetValue) merged[field] = sheetValue;
        }
        // Graduação/Mestrado/Doutorado: o nível mais alto preenchido na
        // planilha sobrescreve formação/instituição/nível. Se a planilha não
        // trouxer nada, preserva o que já existia (curadoria manual).
        if (formacao) {
          merged.formacao = formacao;
          if (instituicao) merged.instituicao = instituicao;
          if (nivel) merged.nivel_formacao = nivel;
        }
        if (!merged.nivel_formacao) {
          merged.nivel_formacao = inferNivelFormacao(merged.formacao || "");
        }
        // Campos de lista: só sobrescreve se a planilha trouxer algo.
        if (areasPesquisa.length) merged.areas_pesquisa = areasPesquisa;
        else if (!merged.areas_pesquisa) merged.areas_pesquisa = [];
        if (gruposBiologicos.length)
          merged.grupos_biologicos = gruposBiologicos;
        else if (!merged.grupos_biologicos) merged.grupos_biologicos = [];
        if (formasColaboracao.length)
          merged.formas_colaboracao = formasColaboracao;
        else if (!merged.formas_colaboracao) merged.formas_colaboracao = [];
        // Identidade de gênero e raça/etnia: só atualiza se a planilha trouxer
        // algo preenchido; senão preserva o que já foi curado no Keystatic.
        if (identidadeGeneroRaw) {
          merged.identidade_genero = parseIdentidadeGenero(identidadeGeneroRaw);
        } else if (!merged.identidade_genero) {
          merged.identidade_genero = "nao-informado";
        }
        if (racaEtniaRaw) {
          merged.raca_etnia = parseRacaEtnia(racaEtniaRaw);
        } else if (!merged.raca_etnia) {
          merged.raca_etnia = "nao-informado";
        }
        if (lgbtqiap !== undefined) merged.lgbtqiap = lgbtqiap;
        if (pcd !== undefined) merged.pcd = pcd;

        merged.campos_ocultos = existing?.campos_ocultos || [];
        merged.gerenciado_pela_planilha = true;
        merged.data_sincronizacao = new Date().toISOString();

        await fs.writeFile(
          path.join(OUTPUT_DIR, `${slug}.json`),
          JSON.stringify(merged, null, 2) + "\n",
        );
      },
    ),
  );

  return dedupedRows.length;
}
