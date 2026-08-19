import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const concepts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/concepts' }),
  schema: z.object({
    title: z.string(),
    subtitle: z.string().optional(),
    description: z.string(),
    series: z.string().optional(),
    seriesIndex: z.number().optional(),
    date: z.date(),
  }),
});

export const collections = { concepts };
