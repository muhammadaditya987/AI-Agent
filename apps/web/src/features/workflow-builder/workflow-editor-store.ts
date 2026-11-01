'use client';

import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type EdgeChange,
  type NodeChange,
} from '@xyflow/react';
import { create } from 'zustand';
import type { WorkflowEdge, WorkflowNode } from '@/types/workflow';

interface WorkflowEditorState {
  workflowId: string | null;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  selectedNodeId: string | null;
  setWorkflow: (workflowId: string | null, nodes?: WorkflowNode[], edges?: WorkflowEdge[]) => void;
  onNodesChange: (changes: NodeChange<WorkflowNode>[]) => void;
  onEdgesChange: (changes: EdgeChange<WorkflowEdge>[]) => void;
  onConnect: (connection: Connection) => void;
  addNode: (node: WorkflowNode) => void;
  updateNodeConfig: (nodeId: string, config: Record<string, unknown>) => void;
  setNodeErrors: (errors: Array<{ nodeId?: string; message: string }>) => void;
  selectNode: (nodeId: string | null) => void;
  deleteSelection: () => void;
}

export const useWorkflowEditorStore = create<WorkflowEditorState>((set) => ({
  workflowId: null,
  nodes: [],
  edges: [],
  selectedNodeId: null,
  setWorkflow: (workflowId, nodes = [], edges = []) =>
    set({ workflowId, nodes, edges, selectedNodeId: null }),
  onNodesChange: (changes) =>
    set((state) => ({ nodes: applyNodeChanges(changes, state.nodes) as WorkflowNode[] })),
  onEdgesChange: (changes) =>
    set((state) => ({ edges: applyEdgeChanges(changes, state.edges) })),
  onConnect: (connection) =>
    set((state) => ({ edges: addEdge({ ...connection, type: 'smoothstep' }, state.edges) })),
  addNode: (node) => set((state) => ({ nodes: [...state.nodes, node] })),
  updateNodeConfig: (nodeId, config) =>
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, config, status: 'idle', error: undefined } }
          : node,
      ),
    })),
  setNodeErrors: (errors) =>
    set((state) => ({
      nodes: state.nodes.map((node) => {
        const nodeErrors = errors.filter((error) => error.nodeId === node.id);
        return {
          ...node,
          data: {
            ...node.data,
            status: nodeErrors.length ? 'error' : 'ready',
            error: nodeErrors.map((error) => error.message).join(' '),
          },
        };
      }),
    })),
  selectNode: (selectedNodeId) => set({ selectedNodeId }),
  deleteSelection: () =>
    set((state) => {
      const selectedNodeIds = new Set(state.nodes.filter((node) => node.selected).map((node) => node.id));
      const nodes = state.nodes.filter((node) => !node.selected);
      const edges = state.edges.filter((edge) =>
        !edge.selected && !selectedNodeIds.has(edge.source) && !selectedNodeIds.has(edge.target),
      );
      return { nodes, edges, selectedNodeId: null };
    }),
}));

