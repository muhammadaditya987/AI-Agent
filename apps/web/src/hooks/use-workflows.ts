'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createWorkflow,
  deleteWorkflow,
  duplicateWorkflow,
  exportWorkflow,
  getWorkflow,
  getWorkflowHistory,
  getWorkflowNodeCatalog,
  getWorkflows,
  importWorkflow,
  publishWorkflow,
  setWorkflowFavorite,
  updateWorkflow,
  validateWorkflow,
} from '@/services/workflow-service';
import { useAuthStore } from '@/providers/auth-store';
import type { WorkflowListFilters, WorkflowListResponse } from '@/types/workflow';

export const workflowsQueryKey = ['workflows'] as const;
export const workflowCatalogQueryKey = ['workflows', 'node-catalog'] as const;
export const defaultWorkflowFilters: WorkflowListFilters = {
  search: '',
  status: '',
  favorite: 'all',
  sortBy: 'updatedAt',
  sortOrder: 'desc',
  page: 1,
  limit: 20,
};

export function useWorkflowNodeCatalog() {
  const userId = useAuthStore((state) => state.user?.id);
  return useQuery({
    queryKey: [...workflowCatalogQueryKey, userId],
    queryFn: getWorkflowNodeCatalog,
    enabled: Boolean(userId),
    staleTime: 5 * 60_000,
  });
}

export function useWorkflows(filters: WorkflowListFilters = defaultWorkflowFilters) {
  const userId = useAuthStore((state) => state.user?.id);
  return useQuery({
    queryKey: [...workflowsQueryKey, userId, 'list', filters],
    queryFn: () => getWorkflows(filters),
    enabled: Boolean(userId),
    placeholderData: (previous) => previous,
  });
}

export function useWorkflow(workflowId: string | null) {
  const userId = useAuthStore((state) => state.user?.id);
  return useQuery({
    queryKey: [...workflowsQueryKey, userId, workflowId],
    queryFn: () => getWorkflow(workflowId ?? ''),
    enabled: Boolean(userId && workflowId),
  });
}

export function useWorkflowHistory(workflowId: string | null) {
  const userId = useAuthStore((state) => state.user?.id);
  return useQuery({
    queryKey: [...workflowsQueryKey, userId, workflowId, 'history'],
    queryFn: () => getWorkflowHistory(workflowId ?? ''),
    enabled: Boolean(userId && workflowId),
  });
}

export function useCreateWorkflow() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: createWorkflow,
    onSuccess: () => client.invalidateQueries({ queryKey: workflowsQueryKey }),
  });
}

export function useImportWorkflow() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: importWorkflow,
    onSuccess: () => client.invalidateQueries({ queryKey: workflowsQueryKey }),
  });
}

export function useUpdateWorkflow() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: updateWorkflow,
    onSuccess: (workflow) => {
      client.setQueryData([...workflowsQueryKey, useAuthStore.getState().user?.id, workflow.id], workflow);
      return client.invalidateQueries({ queryKey: workflowsQueryKey });
    },
  });
}

export function useDeleteWorkflow() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: deleteWorkflow,
    onSuccess: () => client.invalidateQueries({ queryKey: workflowsQueryKey }),
  });
}

export function useDuplicateWorkflow() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: duplicateWorkflow,
    onSuccess: () => client.invalidateQueries({ queryKey: workflowsQueryKey }),
  });
}

export function usePublishWorkflow() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: publishWorkflow,
    onSuccess: (workflow) => {
      client.setQueryData([...workflowsQueryKey, useAuthStore.getState().user?.id, workflow.id], workflow);
      return client.invalidateQueries({ queryKey: workflowsQueryKey });
    },
  });
}

export function useSetWorkflowFavorite() {
  const client = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id);
  return useMutation({
    mutationFn: setWorkflowFavorite,
    onMutate: async ({ workflowId, favorite }) => {
      await client.cancelQueries({ queryKey: [...workflowsQueryKey, userId] });
      const previous = client.getQueriesData<WorkflowListResponse>({
        queryKey: [...workflowsQueryKey, userId, 'list'],
      });
      for (const [key, page] of previous) {
        if (!page) continue;
        client.setQueryData<WorkflowListResponse>(key, {
          ...page,
          data: page.data.map((workflow) => workflow.id === workflowId ? { ...workflow, favorite } : workflow),
        });
      }
      return { previous };
    },
    onError: (_error, _variables, context) => {
      for (const [key, data] of context?.previous ?? []) client.setQueryData(key, data);
    },
    onSettled: () => client.invalidateQueries({ queryKey: [...workflowsQueryKey, userId, 'list'] }),
  });
}

export function useExportWorkflow() {
  return useMutation({ mutationFn: exportWorkflow });
}

export function useValidateWorkflow() {
  return useMutation({ mutationFn: validateWorkflow });
}
