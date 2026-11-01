import { z } from 'zod';

export const workflowMetadataSchema = z.object({
  name: z.string().trim().min(1, 'Enter a workflow name.').max(180),
  description: z.string().trim().max(1000),
});

export const workflowGraphSchema = z.object({
  nodes: z.array(z.object({
    id: z.string().min(1),
    type: z.string().min(1),
    position: z.object({ x: z.number(), y: z.number() }),
    data: z.object({
      label: z.string(),
      description: z.string(),
      icon: z.string(),
      category: z.string(),
      inputCount: z.number().int().min(0),
      outputCount: z.number().int().min(0),
      config: z.record(z.string(), z.unknown()),
      status: z.enum(['idle', 'ready', 'error']),
      error: z.string().optional(),
    }).passthrough(),
  }).passthrough()).max(200),
  edges: z.array(z.object({
    id: z.string().min(1),
    source: z.string().min(1),
    target: z.string().min(1),
  }).passthrough()).max(500),
});

export const workflowNodeCatalogSchema = z.array(z.object({
  type: z.string().min(1),
  label: z.string().min(1),
  description: z.string(),
  icon: z.string(),
  category: z.string(),
  inputs: z.number().int().min(0),
  outputs: z.number().int().min(0),
  configFields: z.array(z.object({
    key: z.string(),
    label: z.string(),
    type: z.enum(['text', 'textarea', 'number', 'select', 'url', 'boolean']),
    required: z.boolean(),
    placeholder: z.string().optional(),
    options: z.array(z.object({ label: z.string(), value: z.string() })).optional(),
  })),
}));

export const workflowRecordSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  description: z.string(),
  status: z.enum(['draft', 'published']),
  version: z.number().int().min(1),
  createdBy: z.string(),
  definition: workflowGraphSchema,
  favorite: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  publishedAt: z.string().nullable(),
});

export const workflowPageSchema = z.object({
  data: z.array(workflowRecordSchema),
  page: z.object({
    page: z.number().int().min(1),
    limit: z.number().int().min(1),
    total: z.number().int().min(0),
    totalPages: z.number().int().min(0),
    hasMore: z.boolean(),
  }),
});

export const workflowVersionSchema = z.object({
  workflowId: z.string(),
  version: z.number().int().min(1),
  status: z.enum(['draft', 'published']),
  name: z.string(),
  description: z.string(),
  definition: workflowGraphSchema,
  createdBy: z.string(),
  createdAt: z.string(),
  publishedAt: z.string().nullable(),
});

export const workflowImportSchema = z.object({
  format: z.literal('ai-agency-workflow'),
  version: z.literal(1),
  workflow: workflowMetadataSchema.extend({
    definition: workflowGraphSchema,
  }),
});
