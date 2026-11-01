import { apiClient } from './api-client';
import type {
  ContentProject,
  ContentProjectEnvelope,
  ContentProjectInput,
  ContentProjectExport,
  ContentProjectList,
  GeneratedContentResult,
} from '@/types/content-factory';
import type { ContentBriefInput } from '@/schemas/content-factory';
import type { ContentHistoryFilters, GeneratorType } from '@/schemas/content-factory';

const projectsPath = '/api/v1/internal/content-factory/projects';

export async function getContentProjects(
  filters: ContentHistoryFilters & { page: number },
): Promise<ContentProjectList> {
  const { data } = await apiClient.get<ContentProjectList>(
    filters.favorite === 'favorites' ? '/api/v1/internal/content-factory/favorites' : projectsPath,
    {
      params: {
        page: filters.page,
        limit: filters.pageSize,
        search: filters.search || undefined,
        status: filters.status || undefined,
        favorite: filters.favorite === 'not-favorites' ? 'false' : undefined,
        generatorType: filters.generatorType || undefined,
        dateFrom: filters.dateFrom || undefined,
        dateTo: filters.dateTo || undefined,
      },
    },
  );
  return data;
}

export async function generateContent(
  brief: ContentBriefInput,
  generatorType: GeneratorType,
): Promise<GeneratedContentResult> {
  const { data } = await apiClient.post<{ data: GeneratedContentResult }>(
    '/api/v1/internal/content-factory/generate',
    { brief, generatorType },
  );
  return data.data;
}

export async function getContentProject(projectId: string): Promise<ContentProject> {
  const { data } = await apiClient.get<ContentProjectEnvelope>(
    `${projectsPath}/${encodeURIComponent(projectId)}`,
  );
  return data.data;
}

export async function exportContentProject(
  projectId: string,
  format: 'json' | 'markdown' | 'txt',
): Promise<ContentProjectExport> {
  const { data } = await apiClient.get<{ data: ContentProjectExport }>(
    `${projectsPath}/${encodeURIComponent(projectId)}/export`,
    { params: { format } },
  );
  return data.data;
}

export async function createContentProject(input: ContentProjectInput): Promise<ContentProject> {
  const { data } = await apiClient.post<ContentProjectEnvelope>(projectsPath, input);
  return data.data;
}

export async function updateContentProject(
  projectId: string,
  input: ContentProjectInput,
): Promise<ContentProject> {
  const { data } = await apiClient.put<ContentProjectEnvelope>(
    `${projectsPath}/${encodeURIComponent(projectId)}`,
    input,
  );
  return data.data;
}

export async function updateContentProjectFavorite(
  projectId: string,
  favorite: boolean,
): Promise<ContentProject> {
  const { data } = await apiClient.patch<ContentProjectEnvelope>(
    `${projectsPath}/${encodeURIComponent(projectId)}`,
    { favorite },
  );
  return data.data;
}

export async function importContentProject(input: ContentProjectInput): Promise<ContentProject> {
  const { data } = await apiClient.post<ContentProjectEnvelope>(
    `${projectsPath}/import`,
    input,
  );
  return data.data;
}

export async function publishContentProject(projectId: string): Promise<ContentProject> {
  const { data } = await apiClient.post<ContentProjectEnvelope>(
    `${projectsPath}/${encodeURIComponent(projectId)}/publish`,
  );
  return data.data;
}

export async function deleteContentProject(projectId: string): Promise<ContentProject> {
  const { data } = await apiClient.delete<ContentProjectEnvelope>(
    `${projectsPath}/${encodeURIComponent(projectId)}`,
  );
  return data.data;
}
