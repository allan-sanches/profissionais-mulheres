import { file, glob } from "astro/loaders";
import { reference, z } from "astro:content";
import { defineCollection } from "astro:content";
import { readFileSync } from "fs";
import { resolve } from "path";
import { fileURLToPath } from "url";

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

// Custom loader for researchers JSON
const researchersLoader = async () => {
  const __dirname = fileURLToPath(new URL(".", import.meta.url));
  const filePath = resolve(__dirname, "./researchers.json");
  const fileContent = readFileSync(filePath, "utf-8");
  const data = JSON.parse(fileContent);

  return (data.researchers || []).map((researcher: any) => ({
    id: researcher.id,
    data: researcher,
  }));
};

const researchers = defineCollection({
  loader: researchersLoader,
  schema: z.object({
    id: z.string(),
    nome: z.string(),
    email: z.string().email(),
    slug: z.string(),
    data_sincronizacao: z.string(),
    telefone: z.string().optional(),
    formacao: z.string().optional(),
    imagem: z.string().optional(),
    curriculo: z.string().url().optional(),
    researchgate: z.string().url().optional(),
    instagram: z.string().optional(),
    site_pessoal: z.string().url().optional(),
    genero: z.string().optional(),
    localizacao: z.string().optional(),
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
