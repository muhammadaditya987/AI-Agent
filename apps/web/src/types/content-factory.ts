import type { ContentAssetsInput, ContentBriefInput, GeneratorType } from '@/schemas/content-factory';

export interface GeneratedContent {
  promptVersion: string;
  model: string;
  assets: ContentAssetsInput;
}

export interface ContentProject {
  id: string;
  title: string;
  brief: ContentBriefInput;
  assets: ContentAssetsInput;
  status: 'draft' | 'published' | 'archived';
  favorite: boolean;
  generatorType: GeneratorType;
  promptVersion: string;
  model: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

export interface ContentProjectList {
  data: ContentProject[];
  page: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export interface ContentProjectInput extends GeneratedContent {
  brief: ContentBriefInput;
  title?: string;
  generatorType: GeneratorType;
}

export interface ContentProjectEnvelope {
  data: ContentProject;
}

export interface ContentProjectExport {
  filename: string;
  contentType: string;
  content: string;
}

export interface GeneratedContentResult extends GeneratedContent {
  project: ContentProject;
}
