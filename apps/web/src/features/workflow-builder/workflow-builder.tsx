'use client';

import '@xyflow/react/dist/style.css';
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type NodeTypes,
} from '@xyflow/react';
import {
  AlertCircle,
  Check,
  ChevronDown,
  CircleHelp,
  Copy,
  Download,
  LoaderCircle,
  Plus,
  Rocket,
  Save,
  Trash2,
  Workflow as WorkflowIcon,
  ZoomIn,
  ZoomOut,
  Maximize,
  ListFilter,
} from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  useCreateWorkflow,
  useDeleteWorkflow,
  useDuplicateWorkflow,
  useExportWorkflow,
  usePublishWorkflow,
  useUpdateWorkflow,
  useValidateWorkflow,
  useWorkflow,
  useWorkflowNodeCatalog,
  useWorkflows,
} from '@/hooks/use-workflows';
import { workflowMetadataSchema } from '@/schemas/workflow';
import type { WorkflowMetadataInput, WorkflowNodeDefinition } from '@/types/workflow';
import { useWorkflowEditorStore } from './workflow-editor-store';
import { WorkflowNodeCard, WorkflowNodeIcon } from './workflow-node-card';
import { WorkflowNodeConfigPanel } from './workflow-node-config-panel';

function errorMessage(error: unknown) {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = error.response;
    if (typeof response === 'object' && response !== null && 'data' in response) {
      const body = response.data;
      if (typeof body === 'object' && body !== null && 'message' in body && typeof body.message === 'string') {
        return body.message;
      }
    }
  }
  return error instanceof Error ? error.message : 'The request could not be completed.';
}

function WorkflowCanvas({ catalog }: Readonly<{ catalog: WorkflowNodeDefinition[] }>) {
  const reactFlow = useReactFlow();
  const nodes = useWorkflowEditorStore((state) => state.nodes);
  const edges = useWorkflowEditorStore((state) => state.edges);
  const onNodesChange = useWorkflowEditorStore((state) => state.onNodesChange);
  const onEdgesChange = useWorkflowEditorStore((state) => state.onEdgesChange);
  const onConnect = useWorkflowEditorStore((state) => state.onConnect);
  const addNode = useWorkflowEditorStore((state) => state.addNode);
  const selectNode = useWorkflowEditorStore((state) => state.selectNode);
  const nodeTypes = useMemo<NodeTypes>(
    () => Object.fromEntries(catalog.map((definition) => [definition.type, WorkflowNodeCard])),
    [catalog],
  );

  const addCatalogNode = useCallback((definition: WorkflowNodeDefinition, position = { x: 100, y: 120 }) => {
    const config = Object.fromEntries(
      definition.configFields.map((field) => [field.key, field.type === 'boolean' ? false : '']),
    );
    addNode({
      id: crypto.randomUUID(),
      type: definition.type,
      position,
      data: {
        label: definition.label,
        description: definition.description,
        icon: definition.icon,
        category: definition.category,
        inputCount: definition.inputs,
        outputCount: definition.outputs,
        config,
        status: 'idle',
      },
    });
  }, [addNode]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    const type = event.dataTransfer.getData('application/workflow-node');
    const definition = catalog.find((item) => item.type === type);
    if (!definition) return;
    addCatalogNode(definition, reactFlow.screenToFlowPosition({ x: event.clientX, y: event.clientY }));
  }, [addCatalogNode, catalog, reactFlow]);

  return (
    <div className="relative h-full w-full" onDragOver={onDragOver} onDrop={onDrop}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={(_, node) => selectNode(node.id)}
        onPaneClick={() => selectNode(null)}
        onSelectionChange={({ nodes: selectedNodes }) => {
          selectNode(selectedNodes.length === 1 ? selectedNodes[0].id : null);
        }}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        deleteKeyCode={['Backspace', 'Delete']}
        selectionOnDrag
        panOnDrag={[1, 2]}
        defaultEdgeOptions={{ type: 'smoothstep', animated: false }}
        proOptions={{ hideAttribution: true }}
        className="bg-background"
      >
        <Background variant={BackgroundVariant.Dots} gap={18} size={1} color="var(--border)" />
        <Controls position="bottom-left" showInteractive={false} />
        <MiniMap
          position="bottom-right"
          pannable
          zoomable
          nodeColor={(node) => {
            const data = node.data as { status?: string };
            if (data.status === 'error') return '#d14c36';
            if (data.status === 'ready') return '#087c68';
            return '#94a3b8';
          }}
          className="!border !border-border !bg-panel"
        />
        {nodes.length === 0 ? (
          <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center">
            <div className="max-w-sm text-center">
              <span className="mx-auto grid size-12 place-items-center rounded-xl bg-teal-100 text-teal-900 dark:bg-teal-950 dark:text-teal-100">
                <WorkflowIcon className="size-6" aria-hidden="true" />
              </span>
              <p className="mt-4 text-sm font-semibold">Start with a node</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">Drag a node from the catalog or select one to add it to this canvas.</p>
            </div>
          </div>
        ) : null}
      </ReactFlow>
      <div className="absolute left-3 top-3 z-10 flex gap-1 rounded-lg border border-border bg-panel/95 p-1 shadow-sm backdrop-blur">
        <Button type="button" variant="ghost" size="icon" className="size-8" aria-label="Zoom in" title="Zoom in" onClick={() => void reactFlow.zoomIn()}>
          <ZoomIn className="size-4" aria-hidden="true" />
        </Button>
        <Button type="button" variant="ghost" size="icon" className="size-8" aria-label="Zoom out" title="Zoom out" onClick={() => void reactFlow.zoomOut()}>
          <ZoomOut className="size-4" aria-hidden="true" />
        </Button>
        <Button type="button" variant="ghost" size="icon" className="size-8" aria-label="Fit canvas to view" title="Fit view" onClick={() => void reactFlow.fitView({ padding: 0.2, duration: 250 })}>
          <Maximize className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}

export function WorkflowBuilder({ initialWorkflowId = null }: Readonly<{ initialWorkflowId?: string | null }>) {
  const catalogQuery = useWorkflowNodeCatalog();
  const workflowsQuery = useWorkflows();
  const [workflowId, setWorkflowId] = useState<string | null>(initialWorkflowId);
  const workflowQuery = useWorkflow(workflowId);
  const createMutation = useCreateWorkflow();
  const updateMutation = useUpdateWorkflow();
  const deleteMutation = useDeleteWorkflow();
  const duplicateMutation = useDuplicateWorkflow();
  const publishMutation = usePublishWorkflow();
  const exportMutation = useExportWorkflow();
  const validateMutation = useValidateWorkflow();
  const nodes = useWorkflowEditorStore((state) => state.nodes);
  const edges = useWorkflowEditorStore((state) => state.edges);
  const setWorkflow = useWorkflowEditorStore((state) => state.setWorkflow);
  const setNodeErrors = useWorkflowEditorStore((state) => state.setNodeErrors);
  const deleteSelection = useWorkflowEditorStore((state) => state.deleteSelection);
  const selectedNodeId = useWorkflowEditorStore((state) => state.selectedNodeId);
  const selectedNode = nodes.find((node) => node.id === selectedNodeId);
  const metadataForm = useForm<WorkflowMetadataInput>({
    resolver: zodResolver(workflowMetadataSchema),
    defaultValues: { name: '', description: '' },
  });
  const metadata = useWatch({ control: metadataForm.control });
  const hydratedId = useRef<string | null>(null);
  const savedFingerprint = useRef('');
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [validationErrors, setValidationErrors] = useState<Array<{ nodeId?: string; field?: string; message: string }>>([]);
  const [showNodeCatalog, setShowNodeCatalog] = useState(true);
  const catalog = catalogQuery.data ?? [];
  const workflowList = workflowsQuery.data?.data ?? [];
  const updateWorkflowRequest = updateMutation.mutateAsync;

  useEffect(() => {
    if (!workflowQuery.data || workflowQuery.data.id === hydratedId.current) return;
    const workflow = workflowQuery.data;
    setWorkflow(workflow.id, workflow.definition.nodes, workflow.definition.edges);
    metadataForm.reset({ name: workflow.name, description: workflow.description });
    hydratedId.current = workflow.id;
    savedFingerprint.current = JSON.stringify({
      workflowId: workflow.id,
      name: workflow.name,
      description: workflow.description,
      nodes: workflow.definition.nodes,
      edges: workflow.definition.edges,
    });
    setSaveState('saved');
  }, [metadataForm, setWorkflow, workflowQuery.data]);

  useEffect(() => {
    if (!workflowId || hydratedId.current !== workflowId || !metadata.name) return;
    const parsedMetadata = workflowMetadataSchema.safeParse(metadata);
    if (!parsedMetadata.success) return;
    const snapshot = {
      workflowId,
      name: parsedMetadata.data.name,
      description: parsedMetadata.data.description,
      nodes,
      edges,
    };
    const fingerprint = JSON.stringify(snapshot);
    if (fingerprint === savedFingerprint.current) return;

    const timer = window.setTimeout(() => {
      savedFingerprint.current = fingerprint;
      setSaveState('saving');
      void updateWorkflowRequest({
        workflowId,
        name: snapshot.name,
        description: snapshot.description,
        definition: { nodes, edges },
      }).then(() => {
        setSaveState('saved');
      }).catch((error: unknown) => {
        savedFingerprint.current = '';
        setSaveState('error');
        toast.error(`Workflow auto-save failed: ${errorMessage(error)}`);
      });
    }, 750);
    return () => window.clearTimeout(timer);
  }, [edges, metadata, nodes, updateWorkflowRequest, workflowId]);

  async function onCreate(values: WorkflowMetadataInput) {
    try {
      const workflow = await createMutation.mutateAsync(values);
      setWorkflowId(workflow.id);
      hydratedId.current = null;
      toast.success('Workflow created.');
    } catch (error) {
      toast.error(`Workflow could not be created: ${errorMessage(error)}`);
    }
  }

  async function onDelete() {
    if (!workflowId || !window.confirm('Delete this workflow and its saved graph?')) return;
    try {
      await deleteMutation.mutateAsync(workflowId);
      setWorkflowId(null);
      setWorkflow(null);
      metadataForm.reset({ name: '', description: '' });
      hydratedId.current = null;
      savedFingerprint.current = '';
      setSaveState('idle');
      toast.success('Workflow deleted.');
    } catch (error) {
      toast.error(`Workflow could not be deleted: ${errorMessage(error)}`);
    }
  }

  async function onSave() {
    if (!workflowId || !metadata.name) return;
    const parsedMetadata = workflowMetadataSchema.safeParse(metadata);
    if (!parsedMetadata.success) {
      toast.error('Enter a valid workflow name before saving.');
      return;
    }
    const snapshot = {
      workflowId,
      name: parsedMetadata.data.name,
      description: parsedMetadata.data.description,
      nodes,
      edges,
    };
    try {
      setSaveState('saving');
      const saved = await updateMutation.mutateAsync({
        ...snapshot,
        definition: { nodes, edges },
      });
      savedFingerprint.current = JSON.stringify(snapshot);
      setSaveState('saved');
      toast.success(`Saved version ${saved.version}.`);
    } catch (error) {
      setSaveState('error');
      toast.error(`Workflow could not be saved: ${errorMessage(error)}`);
    }
  }

  async function onPublish() {
    if (!workflowId || !metadata.name) return;
    try {
      const validation = await validateMutation.mutateAsync({ workflowId, definition: { nodes, edges } });
      setValidationErrors(validation.errors);
      setNodeErrors(validation.errors);
      if (!validation.valid) {
        toast.error(`Workflow has ${validation.errors.length} validation error${validation.errors.length === 1 ? '' : 's'}.`);
        return;
      }
      const parsedMetadata = workflowMetadataSchema.safeParse(metadata);
      if (!parsedMetadata.success) {
        toast.error('Enter a valid workflow name before publishing.');
        return;
      }
      const saved = await updateMutation.mutateAsync({
        workflowId,
        name: parsedMetadata.data.name,
        description: parsedMetadata.data.description,
        definition: { nodes, edges },
      });
      const published = await publishMutation.mutateAsync(saved.id);
      savedFingerprint.current = JSON.stringify({
        workflowId,
        name: parsedMetadata.data.name,
        description: parsedMetadata.data.description,
        nodes,
        edges,
      });
      setSaveState('saved');
      toast.success(`Workflow v${published.version} published.`);
    } catch (error) {
      toast.error(`Workflow could not be published: ${errorMessage(error)}`);
    }
  }

  async function onDuplicate() {
    if (!workflowId) return;
    try {
      const copy = await duplicateMutation.mutateAsync(workflowId);
      setWorkflowId(copy.id);
      hydratedId.current = null;
      toast.success(`Duplicated as ${copy.name}.`);
    } catch (error) {
      toast.error(`Workflow could not be duplicated: ${errorMessage(error)}`);
    }
  }

  async function onExport() {
    if (!workflowId) return;
    try {
      const file = await exportMutation.mutateAsync(workflowId);
      const url = URL.createObjectURL(new Blob([file.content], { type: file.contentType }));
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = file.filename;
      anchor.click();
      URL.revokeObjectURL(url);
      toast.success('Workflow JSON exported.');
    } catch (error) {
      toast.error(`Workflow export failed: ${errorMessage(error)}`);
    }
  }

  async function onValidate() {
    if (!workflowId) return;
    try {
      const result = await validateMutation.mutateAsync({
        workflowId,
        definition: { nodes, edges },
      });
      setValidationErrors(result.errors);
      setNodeErrors(result.errors);
      if (result.valid) toast.success('Workflow validation passed.');
      else toast.error(`Workflow has ${result.errors.length} validation error${result.errors.length === 1 ? '' : 's'}.`);
    } catch (error) {
      toast.error(`Validation failed: ${errorMessage(error)}`);
    }
  }

  const onDragStart = (event: React.DragEvent, definition: WorkflowNodeDefinition) => {
    event.dataTransfer.setData('application/workflow-node', definition.type);
    event.dataTransfer.effectAllowed = 'move';
  };

  const catalogByCategory = useMemo(
    () => catalog.reduce<Record<string, WorkflowNodeDefinition[]>>((groups, definition) => {
      (groups[definition.category] ??= []).push(definition);
      return groups;
    }, {}),
    [catalog],
  );

  const isLoading = catalogQuery.isPending;
  const pageError = catalogQuery.error;

  return (
    <div className="mx-auto flex min-h-[calc(100vh-9.5rem)] w-full max-w-[1600px] flex-col gap-4">
      <header className="flex flex-col gap-4 rounded-xl border border-border bg-panel p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-teal-100 text-teal-900 dark:bg-teal-950 dark:text-teal-100">
            <WorkflowIcon className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h1 className="text-xl font-semibold tracking-tight">Workflow Builder</h1>
            <p className="text-xs text-muted-foreground">Design workflows visually with your connected nodes.</p>
            {workflowQuery.data ? (
              <p className="mt-1 text-[11px] text-muted-foreground">
                v{workflowQuery.data.version} · {workflowQuery.data.status} · Created by {workflowQuery.data.createdBy} · Updated {new Date(workflowQuery.data.updatedAt).toLocaleString()}
              </p>
            ) : null}
          </div>
          {workflowId ? (
            <label className="min-w-0">
              <span className="sr-only">Workflow name</span>
              <input
                {...metadataForm.register('name')}
                className="h-9 w-36 rounded-md border border-border bg-background px-2 text-xs font-medium outline-none focus:border-teal-700 sm:w-48"
                aria-label="Workflow name"
              />
            </label>
          ) : null}
          <div className="relative ml-1 min-w-0">
            <label htmlFor="workflow-select" className="sr-only">Select workflow</label>
            <select
              id="workflow-select"
              value={workflowId ?? ''}
              onChange={(event) => {
                setWorkflowId(event.target.value || null);
                hydratedId.current = null;
              }}
              className="h-9 max-w-48 rounded-md border border-border bg-background pl-3 pr-8 text-xs font-medium outline-none focus:border-teal-700"
            >
              <option value="">Select workflow…</option>
              {workflowList.map((workflow) => <option key={workflow.id} value={workflow.id}>{workflow.name}</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/workflows"><Button type="button" variant="ghost">Workflow list</Button></Link>
          <span className="mr-1 flex items-center gap-1.5 text-xs text-muted-foreground" aria-live="polite">
            {saveState === 'saving' ? <LoaderCircle className="size-3.5 animate-spin" aria-hidden="true" /> : saveState === 'error' ? <AlertCircle className="size-3.5 text-coral-600" aria-hidden="true" /> : saveState === 'saved' ? <Check className="size-3.5 text-teal-700" aria-hidden="true" /> : <Save className="size-3.5" aria-hidden="true" />}
            {saveState === 'saving' ? 'Saving…' : saveState === 'error' ? 'Save failed' : saveState === 'saved' ? 'All changes saved' : 'Not saved'}
          </span>
          <Button type="button" variant="secondary" disabled={!workflowId || validateMutation.isPending} onClick={() => void onValidate()}>
            {validateMutation.isPending ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <Check className="size-4" aria-hidden="true" />}
            Validate
          </Button>
          <Button type="button" variant="secondary" disabled={!workflowId || updateMutation.isPending} onClick={() => void onSave()}>
            {updateMutation.isPending ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <Save className="size-4" aria-hidden="true" />}
            Save
          </Button>
          <Button type="button" variant="secondary" disabled={!workflowId || publishMutation.isPending || updateMutation.isPending} onClick={() => void onPublish()}>
            {publishMutation.isPending ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <Rocket className="size-4" aria-hidden="true" />}
            Publish
          </Button>
          {workflowId ? (
            <>
              <Button type="button" variant="ghost" size="icon" aria-label="Duplicate workflow" title="Duplicate workflow" disabled={duplicateMutation.isPending} onClick={() => void onDuplicate()}>
                <Copy className="size-4" aria-hidden="true" />
              </Button>
              <Button type="button" variant="ghost" size="icon" aria-label="Export workflow JSON" title="Export workflow JSON" disabled={exportMutation.isPending} onClick={() => void onExport()}>
                <Download className="size-4" aria-hidden="true" />
              </Button>
            </>
          ) : null}
          <Button type="button" variant="secondary" disabled={!workflowId || nodes.length === 0} onClick={deleteSelection}>
            <Trash2 className="size-4" aria-hidden="true" /> Delete selected
          </Button>
          {workflowId ? (
            <Button type="button" variant="ghost" disabled={deleteMutation.isPending} aria-label="Delete workflow" title="Delete workflow" onClick={() => void onDelete()}>
              {deleteMutation.isPending ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <Trash2 className="size-4 text-coral-700" aria-hidden="true" />}
            </Button>
          ) : null}
          <Button type="button" disabled={createMutation.isPending} onClick={() => {
            setWorkflowId(null);
            setWorkflow(null);
            hydratedId.current = null;
            savedFingerprint.current = '';
            metadataForm.reset({ name: '', description: '' });
          }}>
            {createMutation.isPending ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <Plus className="size-4" aria-hidden="true" />}
            New workflow
          </Button>
          <Button type="button" variant="ghost" size="icon" aria-label="Toggle node catalog" onClick={() => setShowNodeCatalog((visible) => !visible)}>
            <ListFilter className="size-4" aria-hidden="true" />
          </Button>
        </div>
      </header>

      {pageError ? (
        <div role="alert" className="flex items-center justify-between gap-3 rounded-lg border border-coral-200 bg-coral-100/60 p-4 text-sm text-coral-800 dark:border-coral-800 dark:bg-coral-950/40 dark:text-coral-200">
          <span>{errorMessage(pageError)}</span>
          <Button type="button" variant="secondary" onClick={() => { void catalogQuery.refetch(); void workflowsQuery.refetch(); }}>Retry</Button>
        </div>
      ) : null}
      {validationErrors.length ? (
        <section role="alert" className="rounded-lg border border-coral-200 bg-coral-100/60 p-4 text-sm text-coral-800 dark:border-coral-800 dark:bg-coral-950/40 dark:text-coral-200">
          <h2 className="font-semibold">Workflow validation errors</h2>
          <ul className="mt-2 list-inside list-disc space-y-1">
            {validationErrors.map((error, index) => (
              <li key={`${error.nodeId ?? 'graph'}-${error.field ?? 'error'}-${index}`}>
                {error.nodeId ? `${nodes.find((node) => node.id === error.nodeId)?.data.label ?? error.nodeId}: ` : ''}
                {error.message}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {!workflowId ? (
        <form
          className="flex min-h-96 flex-1 flex-col items-center justify-center rounded-xl border border-border bg-panel p-8 text-center"
          onSubmit={metadataForm.handleSubmit(onCreate)}
        >
          <span className="grid size-14 place-items-center rounded-2xl bg-muted text-muted-foreground">
            <WorkflowIcon className="size-7" aria-hidden="true" />
          </span>
          <h2 className="mt-4 text-lg font-semibold">{workflowList.length ? 'Choose a workflow or create a new one' : 'Create your first workflow'}</h2>
          <p className="mt-1 max-w-md text-sm leading-6 text-muted-foreground">Workflows are loaded and saved through the backend. Node configuration is supplied by the backend catalog.</p>
          <div className="mt-5 grid w-full max-w-md gap-3 text-left">
            <label className="text-xs font-semibold" htmlFor="new-workflow-name">
              Workflow name
              <input id="new-workflow-name" {...metadataForm.register('name')} className="mt-1.5 h-10 w-full rounded-md border border-border bg-background px-3 text-sm font-normal outline-none focus:border-teal-700" />
              {metadataForm.formState.errors.name ? <span className="mt-1 block text-xs text-coral-700">{metadataForm.formState.errors.name.message}</span> : null}
            </label>
            <label className="text-xs font-semibold" htmlFor="new-workflow-description">
              Description
              <textarea id="new-workflow-description" {...metadataForm.register('description')} rows={2} className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-normal outline-none focus:border-teal-700" />
            </label>
          </div>
          <Button type="submit" className="mt-4" disabled={createMutation.isPending}>
            <Plus className="size-4" aria-hidden="true" /> Create workflow
          </Button>
        </form>
      ) : (
        <div className="flex min-h-[640px] flex-1 overflow-hidden rounded-xl border border-border bg-panel">
          {showNodeCatalog ? (
            <aside className="z-10 flex w-60 shrink-0 flex-col border-r border-border bg-panel sm:w-68">
              <div className="border-b border-border p-4">
                <h2 className="text-sm font-semibold">Node catalog</h2>
                <p className="mt-1 text-[11px] leading-4 text-muted-foreground">Drag a node onto the canvas.</p>
              </div>
              <div className="flex-1 space-y-5 overflow-y-auto p-3">
                {isLoading ? (
                  <div className="space-y-2" aria-label="Loading node catalog">
                    {[0, 1, 2, 3].map((item) => <div key={item} className="h-12 animate-pulse rounded-lg bg-muted" />)}
                  </div>
                ) : catalog.length ? Object.entries(catalogByCategory).map(([category, definitions]) => (
                  <section key={category}>
                    <h3 className="mb-2 px-1 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">{category}</h3>
                    <div className="space-y-1.5">
                      {definitions.map((definition) => (
                        <button
                          key={definition.type}
                          type="button"
                          draggable
                          onDragStart={(event) => onDragStart(event, definition)}
                          onClick={() => {
                            const bounds = document.querySelector('.react-flow')?.getBoundingClientRect();
                            const position = bounds
                              ? { x: bounds.width / 2 - 100, y: bounds.height / 2 - 50 }
                              : { x: 100, y: 100 };
                            const { addNode } = useWorkflowEditorStore.getState();
                            addNode({
                              id: crypto.randomUUID(),
                              type: definition.type,
                              position,
                              data: {
                                label: definition.label,
                                description: definition.description,
                                icon: definition.icon,
                                category: definition.category,
                                inputCount: definition.inputs,
                                outputCount: definition.outputs,
                                config: Object.fromEntries(definition.configFields.map((configField) => [configField.key, configField.type === 'boolean' ? false : ''])),
                                status: 'idle',
                              },
                            });
                          }}
                          className="flex w-full items-start gap-2.5 rounded-lg border border-transparent p-2 text-left transition hover:border-border hover:bg-muted"
                        >
                          <span className="grid size-8 shrink-0 place-items-center rounded-md bg-background text-teal-800 dark:text-teal-300">
                            <WorkflowNodeIcon icon={definition.icon} className="size-4" />
                          </span>
                          <span className="min-w-0">
                            <span className="block text-xs font-semibold">{definition.label}</span>
                            <span className="mt-0.5 line-clamp-2 block text-[10px] leading-4 text-muted-foreground">{definition.description}</span>
                          </span>
                        </button>
                      ))}
                    </div>
                  </section>
                )) : (
                  <div className="rounded-lg border border-dashed border-border p-3 text-xs leading-5 text-muted-foreground">
                    {catalogQuery.isError ? errorMessage(catalogQuery.error) : 'The backend returned no available nodes.'}
                  </div>
                )}
              </div>
              <div className="border-t border-border p-3 text-[10px] leading-4 text-muted-foreground">
                <span className="flex items-start gap-1.5"><CircleHelp className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" /> Configure selected nodes to validate the workflow.</span>
              </div>
            </aside>
          ) : null}

          <section className="relative min-w-0 flex-1">
            <ReactFlowProvider>
              <WorkflowCanvas catalog={catalog} />
            </ReactFlowProvider>
            {workflowQuery.isPending ? (
              <div className="absolute inset-0 z-30 grid place-items-center bg-background/70 backdrop-blur-sm">
                <LoaderCircle className="size-6 animate-spin text-teal-700" aria-label="Loading workflow" />
              </div>
            ) : workflowQuery.isError ? (
              <div role="alert" className="absolute inset-x-4 top-16 z-30 rounded-lg border border-coral-200 bg-panel p-4 text-sm text-coral-700 shadow">
                {errorMessage(workflowQuery.error)}
              </div>
            ) : null}
            {workflowQuery.data && selectedNode ? (
              <WorkflowNodeConfigPanel
                key={selectedNode.id}
                node={selectedNode}
                fields={catalog.find((definition) => definition.type === selectedNode.type)?.configFields ?? []}
                onSave={(nodeId, config) => {
                  useWorkflowEditorStore.getState().updateNodeConfig(nodeId, config);
                }}
                onClose={() => useWorkflowEditorStore.getState().selectNode(null)}
              />
            ) : null}
            {workflowQuery.data ? (
              <div className="absolute bottom-3 left-1/2 z-10 flex max-w-[calc(100%-1rem)] -translate-x-1/2 items-center gap-2 rounded-full border border-border bg-panel/95 px-3 py-1.5 text-[10px] text-muted-foreground shadow-sm backdrop-blur">
                <span className="truncate font-medium text-foreground">{workflowQuery.data.name}</span>
                <span aria-hidden="true">·</span>
                <span>{nodes.length} nodes</span>
                <span aria-hidden="true">·</span>
                <span>{edges.length} connections</span>
              </div>
            ) : null}
          </section>
        </div>
      )}
      {!workflowId && workflowList.length ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {workflowList.map((workflow) => (
            <button
              key={workflow.id}
              type="button"
              onClick={() => {
                setWorkflowId(workflow.id);
                hydratedId.current = null;
              }}
              className="rounded-xl border border-border bg-panel p-4 text-left transition hover:border-teal-700"
            >
              <span className="flex items-center justify-between gap-2 text-sm font-semibold">
                {workflow.name}<WorkflowIcon className="size-4 text-teal-700" aria-hidden="true" />
              </span>
              <span className="mt-1 line-clamp-2 block text-xs leading-5 text-muted-foreground">{workflow.description || 'No description'}</span>
              <span className="mt-3 block text-[10px] text-muted-foreground">{workflow.definition.nodes.length} nodes · Updated {workflow.updatedAt.slice(0, 10)}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
