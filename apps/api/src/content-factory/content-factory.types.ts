import { z } from 'zod';

export const contentBriefSchema = z.object({
  keyword: z.string().trim().min(2).max(160),
  targetAge: z.string().trim().min(2).max(80),
  language: z.string().trim().min(2).max(40),
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

export type ContentBrief = z.infer<typeof contentBriefSchema>;
export type ContentAssets = z.infer<typeof contentAssetsSchema>;
