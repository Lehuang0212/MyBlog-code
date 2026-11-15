import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
  loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string().nullish(),
    date: z.union([z.string(), z.date()]).nullish(),
    tags: z.preprocess((value) => (value == null ? [] : value), z.array(z.string())),
    description: z.string().nullish(),
    slug: z.string().nullish(),
    draft: z.preprocess((value) => (value == null ? false : value), z.boolean()),
  }),
});

export const collections = { blog };
