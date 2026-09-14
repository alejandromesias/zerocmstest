import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const hero = defineCollection({
  loader: glob({ base: "./src/content/hero", pattern: "**/*.yaml" }),
  schema: z.object({
    titulo: z.string(),
    subtitulo: z.string(),
  }),
});

export const collections = { hero };
