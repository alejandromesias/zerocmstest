import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const hero = defineCollection({
  loader: glob({ base: "./src/content/hero", pattern: "**/*.md" }),
  schema: z.object({
    subtext: z.string(),
    trust: z.string(),
  }),
});

export const collections = { hero };
