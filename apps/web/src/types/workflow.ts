import type { Edge, Node } from '@xyflow/react';

export interface WorkflowMetadataInput {
  name: string;
  description: string;
}

export interface WorkflowConfigField {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'select' | 'url' | 'boolean';
  required: boolean;
  placeholder?: string;
  options?: Array<{ label: string; value: string }>;
}

export interface WorkflowNodeDefinition {
  type: string;
  label: string;
  description: string;
  icon: string;
  category: string;
  inputs: number;
  outputs: number;
  configFields: WorkflowConfigField[];
}

export interface WorkflowNodeData extends Record<string, unknown> {
  label: string;
  description: string;
  icon: string;
  category: string;
  inputCount: number;
  outputCount: number;
  config: Record<string, unknown>;
  status: 'idle' | 'ready' | 'error';
  error?: string;
}

export type WorkflowNode = Node<WorkflowNodeData>;
export type WorkflowEdge = Edge;

export interface WorkflowDefinition {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

export interface WorkflowRecord {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'published';
  version: number;
  createdBy: string;
  definition: WorkflowDefinition;
  favorite: boolean;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

export interface WorkflowVersionRecord {
  workflowId: string;
  version: number;
  status: 'draft' | 'published';
  name: string;
  description: string;
  definition: WorkflowDefinition;
  createdBy: string;
  createdAt: string;
  publishedAt: string | null;
}

export interface WorkflowPageInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export interface WorkflowListResponse {
  data: WorkflowRecord[];
  page: WorkflowPageInfo;
}

export interface WorkflowListFilters {
  search: string;
  status: '' | 'draft' | 'published';
  favorite: 'all' | 'favorite';
  sortBy: 'updatedAt' | 'createdAt' | 'name';
  sortOrder: 'asc' | 'desc';
  page: number;
  limit: number;
}

export interface WorkflowEnvelope {
  data: WorkflowRecord;
}

export interface WorkflowValidationError {
  nodeId?: string;
  field?: string;
  message: string;
}

export interface WorkflowValidationResult {
  valid: boolean;
  errors: WorkflowValidationError[];
}
