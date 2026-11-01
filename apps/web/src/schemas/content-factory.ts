import { z } from 'zod';

export const contentBriefSchema = z.object({
  keyword: z.string().trim().min(2, 'Enter a keyword with at least 2 characters.').max(160),
  targetAge: z.string().trim().min(2, 'Enter a target age with at least 2 characters.').max(80),
  language: z.string().trim().min(2, 'Enter a language with at least 2 characters.').max(40),
});

export const contentAssetsSchema = z.object({
  title: z.string().min(1).max(180),
  songIdea: z.string().min(1).max(4000),
  lyrics: z.string().min(1).max(12000),
  sunoPrompt: z.string().min(1).max(5000),
  googleFlowPrompt: z.string().min(1).max(5000),
  thumbnailPrompt: z.string().min(1).max(3000),
  youtubeDescription: z.string().min(1).max(5000),
  seoKeywords: z.array(z.string().min(1).max(100)).min(1).max(30),
  hashtags: z.array(z.string().min(1).max(100)).min(1).max(30),
  estimatedDuration: z.string().min(1).max(40),
});

export const generatorTypeSchema = z.enum([
  'youtube-ideas',
  'keyword-research',
  'lyrics-generator',
  'suno-prompt',
  'google-flow-prompt',
  'thumbnail-prompt',
  'video-prompt',
  'metadata-generator',
  'seo-generator',
]);

export const contentHistoryFiltersSchema = z.object({
  search: z.string().max(200),
  generatorType: generatorTypeSchema.or(z.literal('')),
  dateFrom: z.string(),
  dateTo: z.string(),
  status: z.enum(['', 'draft', 'published']),
  favorite: z.enum(['all', 'favorites', 'not-favorites']),
  pageSize: z.number().int().min(1).max(100),
}).refine(
  (filters) => !filters.dateFrom || !filters.dateTo || filters.dateFrom <= filters.dateTo,
  { message: 'The start date must be on or before the end date.', path: ['dateTo'] },
);

export const contentImportSchema = z.object({
  title: z.string().trim().min(1).max(180).optional(),
  brief: contentBriefSchema,
  assets: contentAssetsSchema,
  generatorType: generatorTypeSchema,
  promptVersion: z.string().min(1).max(100),
  model: z.string().min(1).max(100),
});

export const contentExportFileSchema = z.object({
  format: z.literal('ai-content-factory'),
  version: z.literal(1),
  project: contentImportSchema.extend({
    id: z.string().optional(),
    status: z.enum(['draft', 'published', 'archived']).optional(),
    favorite: z.boolean().optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
    publishedAt: z.string().nullable().optional(),
  }),
});

export type ContentBriefInput = z.infer<typeof contentBriefSchema>;
export type ContentAssetsInput = z.infer<typeof contentAssetsSchema>;
export type GeneratorType = z.infer<typeof generatorTypeSchema>;
export type ContentHistoryFilters = z.infer<typeof contentHistoryFiltersSchema>;
export type ContentImportInput = z.infer<typeof contentImportSchema>;
