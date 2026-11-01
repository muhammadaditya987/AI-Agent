import { apiClient } from './api-client';
import {
  workflowNodeCatalogSchema,
  workflowPageSchema,
  workflowRecordSchema,
  workflowVersionSchema,
} from '@/schemas/workflow';
import type {
  WorkflowDefinition,
  WorkflowListFilters,
  WorkflowListResponse,
  WorkflowNodeDefinition,
  WorkflowRecord,
  WorkflowValidationResult,
  WorkflowVersionRecord,
} from '@/types/workflow';
import { z } from 'zod';

const workflowsPath = '/api/v1/internal/workflows';

function unwrap<T>(value: unknown, schema: z.ZodType<T>, message: string): T {
  const parsed = schema.safeParse(
    typeof value === 'object' && value !== null && 'data' in value ? value.data : undefined,
  );
  if (!parsed.success) throw new Error(message);
  return parsed.data;
}

export async function getWorkflowNodeCatalog(): Promise<WorkflowNodeDefinition[]> {
  const { data } = await apiClient.get<unknown>(`${workflowsPath}/node-catalog`);
  return unwrap(data, workflowNodeCatalogSchema, 'The workflow node catalog response is invalid.');
}

export async function getWorkflows(filters: WorkflowListFilters): Promise<WorkflowListResponse> {
  const { data } = await apiClient.get<unknown>(workflowsPath, {
    params: {
      search: filters.search || undefined,
      status: filters.status || undefined,
      favorite: filters.favorite === 'favorite' ? true : undefined,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
      page: filters.page,
      limit: filters.limit,
    },
  });
  const parsed = workflowPageSchema.safeParse(data);
  if (!parsed.success) throw new Error('The workflow list response is invalid.');
  return parsed.data;
}

export async function getWorkflow(workflowId: string): Promise<WorkflowRecord> {
  const { data } = await apiClient.get<unknown>(`${workflowsPath}/${encodeURIComponent(workflowId)}`);
  return unwrap(data, workflowRecordSchema, 'The workflow response is invalid.');
}

export async function getWorkflowHistory(workflowId: string): Promise<WorkflowVersionRecord[]> {
  const { data } = await apiClient.get<unknown>(`${workflowsPath}/${encodeURIComponent(workflowId)}/history`);
  return unwrap(data, z.array(workflowVersionSchema), 'The workflow history response is invalid.');
}

export async function createWorkflow(input: { name: string; description: string }): Promise<WorkflowRecord> {
  const { data } = await apiClient.post<unknown>(workflowsPath, input);
  return unwrap(data, workflowRecordSchema, 'The created workflow response is invalid.');
}

export async function importWorkflow(input: {
  format: 'ai-agency-workflow';
  version: 1;
  workflow: { name: string; description: string; definition: WorkflowDefinition };
}): Promise<WorkflowRecord> {
  const { data } = await apiClient.post<unknown>(`${workflowsPath}/import`, input);
  return unwrap(data, workflowRecordSchema, 'The imported workflow response is invalid.');
}

export async function updateWorkflow(input: {
  workflowId: string;
  name: string;
  description: string;
  definition: WorkflowDefinition;
}): Promise<WorkflowRecord> {
  const { data } = await apiClient.put<unknown>(
    `${workflowsPath}/${encodeURIComponent(input.workflowId)}`,
    { name: input.name, description: input.description, definition: input.definition },
  );
  return unwrap(data, workflowRecordSchema, 'The updated workflow response is invalid.');
}

export async function deleteWorkflow(workflowId: string): Promise<WorkflowRecord> {
  const { data } = await apiClient.delete<unknown>(`${workflowsPath}/${encodeURIComponent(workflowId)}`);
  return unwrap(data, workflowRecordSchema, 'The deleted workflow response is invalid.');
}

export async function duplicateWorkflow(workflowId: string): Promise<WorkflowRecord> {
  const { data } = await apiClient.post<unknown>(`${workflowsPath}/${encodeURIComponent(workflowId)}/duplicate`);
  return unwrap(data, workflowRecordSchema, 'The duplicated workflow response is invalid.');
}

export async function publishWorkflow(workflowId: string): Promise<WorkflowRecord> {
  const { data } = await apiClient.post<unknown>(`${workflowsPath}/${encodeURIComponent(workflowId)}/publish`);
  return unwrap(data, workflowRecordSchema, 'The published workflow response is invalid.');
}

export async function setWorkflowFavorite(input: { workflowId: string; favorite: boolean }): Promise<WorkflowRecord> {
  const { data } = await apiClient.patch<unknown>(
    `${workflowsPath}/${encodeURIComponent(input.workflowId)}/favorite`,
    { favorite: input.favorite },
  );
  return unwrap(data, workflowRecordSchema, 'The workflow favorite response is invalid.');
}

export async function exportWorkflow(workflowId: string): Promise<{ filename: string; contentType: string; content: string }> {
  const { data } = await apiClient.get<unknown>(`${workflowsPath}/${encodeURIComponent(workflowId)}/export`);
  return unwrap(
    data,
    z.object({ filename: z.string(), contentType: z.string(), content: z.string() }),
    'The workflow export response is invalid.',
  );
}

export async function validateWorkflow(input: {
  workflowId: string;
  definition: WorkflowDefinition;
}): Promise<WorkflowValidationResult> {
  const { data } = await apiClient.post<{ data: WorkflowValidationResult }>(
    `${workflowsPath}/${encodeURIComponent(input.workflowId)}/validate`,
    input.definition,
  );
  return data.data;
}
