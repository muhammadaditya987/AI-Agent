'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createContentProject,
  deleteContentProject,
  exportContentProject,
  generateContent,
  getContentProject,
  getContentProjects,
  importContentProject,
  publishContentProject,
  updateContentProject,
  updateContentProjectFavorite,
} from '@/services/content-factory-service';
import { useAuthStore } from '@/providers/auth-store';
import type { ContentProjectInput } from '@/types/content-factory';
import type { ContentBriefInput, ContentHistoryFilters, GeneratorType } from '@/schemas/content-factory';

export const contentProjectsQueryKey = ['content-factory', 'projects'] as const;

export function useContentProjects(filters: ContentHistoryFilters, page: number, valid = true) {
  const userId = useAuthStore((state) => state.user?.id);
  return useQuery({
    queryKey: [...contentProjectsQueryKey, userId, filters, page],
    queryFn: () => getContentProjects({ ...filters, page }),
    enabled: Boolean(userId) && valid,
    placeholderData: (previousData) => previousData,
  });
}

export function useGenerateContent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { brief: ContentBriefInput; generatorType: GeneratorType }) =>
      generateContent(input.brief, input.generatorType),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: contentProjectsQueryKey }),
  });
}

export function useSaveContentProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { projectId?: string; project: ContentProjectInput }) =>
      input.projectId
        ? updateContentProject(input.projectId, input.project)
        : createContentProject(input.project),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: contentProjectsQueryKey }),
  });
}

export function usePublishContentProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: publishContentProject,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: contentProjectsQueryKey }),
  });
}

export function useDeleteContentProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteContentProject,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: contentProjectsQueryKey }),
  });
}

export function useLoadContentProject() {
  return useMutation({ mutationFn: getContentProject });
}

export function useExportContentProject() {
  return useMutation({
    mutationFn: (input: { projectId: string; format: 'json' | 'markdown' | 'txt' }) =>
      exportContentProject(input.projectId, input.format),
  });
}

export function useToggleContentFavorite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { projectId: string; favorite: boolean }) =>
      updateContentProjectFavorite(input.projectId, input.favorite),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: contentProjectsQueryKey }),
  });
}

export function useImportContentProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: importContentProject,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: contentProjectsQueryKey }),
  });
}
