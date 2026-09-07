import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const hero = defineCollection({
  loader: glob({ base: "./src/content/hero", pattern: "**/*.md" }),
  schema: z.object({}),
});

export const collections = { hero };
