import { file, glob } from "astro/loaders";
import { reference, z, defineCollection } from "astro:content";

function slug() {
  return z
    .string()
    .min(3)
    .max(200)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/i, "Invalid slug");
}

const posts = defineCollection({
  loader: glob({
    pattern: "**/*.{md,mdx}",
    base: "./src/content/posts",
  }),
  schema: ({ image }) =>
    z.object({
      title: z.string().max(128),
      createdAt: z.coerce.date(),
      updatedAt: z.coerce.date().optional(),
      category: reference("categories"),
      tags: z.array(reference("tags")).optional().default([]),
      summary: z.string().optional().default(""),
      cover: image().optional(),
      draft: z.boolean().default(false),
      new: z.boolean().default(false),
    }),
});

const projects = defineCollection({
  loader: glob({
    pattern: "**/*.{md,mdx}",
    base: "./src/content/projects",
  }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    tech: z.array(z.string()),
    links: z
      .object({
        homepage: z.string().url().optional(),
        github: z.string().url().optional(),
        demo: z.string().url().optional(),
      })
      .optional(),
    status: z
      .enum(["planning", "in-progress", "completed", "archived"])
      .default("completed"),
    image: z.string().optional(),
  }),
});

const categories = defineCollection({
  loader: file("./src/content/miscs/categories.json"),
  schema: ({ image }) =>
    z.object({
      name: z.string().max(32),
      slug: slug(),
      description: z
        .string()
        .max(512)
        .optional()
        .default("")
        .describe("In markdown format"),
      icon: z.string().optional().default("mdi:folder"),
    }),
});

const tags = defineCollection({
  loader: file("./src/content/miscs/tags.json"),
  schema: z.object({
    name: z.string().max(32),
    slug: slug(),
    description: z
      .string()
      .max(512)
      .optional()
      .default("")
      .describe("In markdown format"),
  }),
});

const friends = defineCollection({
  loader: file("./src/content/miscs/friends.json"),
  schema: z.object({
    name: z.string().max(64),
    description: z.string().optional().describe("One line string"),
    link: z.string().url(),
    avatar: z.string(),
  }),
});

const pages = defineCollection({
  loader: glob({
    pattern: "**/*.{md,mdx}",
    base: "./src/content/pages",
  }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
  }),
});

const researchers = defineCollection({
  loader: glob({
    pattern: "*.json",
    base: "./src/content/researchers",
    generateId: ({ entry }) => entry.replace(/\.json$/, ""),
  }),
  schema: z.object({
    nome: z.string().optional(),
    email: z.string().optional(),
    data_sincronizacao: z.coerce.date().optional(),
    telefone: z.string().optional(),
    formacao: z.string().optional(),
    nivel_formacao: z
      .enum(["graduacao", "mestrado", "doutorado", "outro"])
      .optional(),
    bio: z.string().optional(),
    instituicao: z.string().optional(),
    identidade_genero: z
      .enum([
        "mulher-cis",
        "mulher-trans",
        "homem-cis",
        "homem-trans",
        "nao-binario",
        "nao-informado",
      ])
      .optional(),
    raca_etnia: z
      .enum([
        "branca",
        "preta",
        "parda",
        "amarela",
        "indigena",
        "nao-informado",
      ])
      .optional(),
    imagem: z.string().optional(),
    curriculo: z.string().optional(),
    researchgate: z.string().optional(),
    instagram: z.string().optional(),
    site_pessoal: z.string().optional(),
    linkedin: z.string().optional(),
    orcid: z.string().optional(),
    localizacao: z.string().optional(),
    genero: z.string().optional(),
    lgbtqiap: z.boolean().optional(),
    pcd: z.boolean().optional(),
    grupo_tradicional: z.string().optional(),
    cidade_natal: z.string().optional(),
    trabalho_atual: z.string().optional(),
    instituicao_atual: z.string().optional(),
    aceita_palestras: z.string().optional(),
    observacoes: z.string().optional(),
    areas_pesquisa: z.array(z.string()).optional().default([]),
    grupos_biologicos: z.array(z.string()).optional().default([]),
    formas_colaboracao: z.array(z.string()).optional().default([]),
    campos_ocultos: z.array(z.string()).optional().default([]),
    gerenciado_pela_planilha: z.boolean().optional().default(false),
  }),
});

export const collections = {
  posts,
  projects,
  categories,
  tags,
  friends,
  pages,
  researchers,
};
