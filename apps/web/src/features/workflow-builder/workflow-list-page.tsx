'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  ArrowDown,
  ArrowUp,
  Copy,
  Download,
  FileJson,
  History,
  LoaderCircle,
  Plus,
  Search,
  Star,
  Trash2,
  Upload,
  Workflow as WorkflowIcon,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  defaultWorkflowFilters,
  useCreateWorkflow,
  useDeleteWorkflow,
  useDuplicateWorkflow,
  useExportWorkflow,
  useImportWorkflow,
  useSetWorkflowFavorite,
  useWorkflowHistory,
  useWorkflows,
} from '@/hooks/use-workflows';
import { workflowImportSchema, workflowMetadataSchema } from '@/schemas/workflow';
import type { WorkflowListFilters, WorkflowMetadataInput } from '@/types/workflow';

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : 'The request could not be completed.';
}

function downloadFile(filename: string, contentType: string, content: string) {
  const url = URL.createObjectURL(new Blob([content], { type: contentType }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function WorkflowListPage() {
  const [filters, setFilters] = useState<WorkflowListFilters>(defaultWorkflowFilters);
  const [importPreview, setImportPreview] = useState<ReturnType<typeof workflowImportSchema.parse> | null>(null);
  const [historyId, setHistoryId] = useState<string | null>(null);
  const workflowsQuery = useWorkflows(filters);
  const historyQuery = useWorkflowHistory(historyId);
  const createMutation = useCreateWorkflow();
  const importMutation = useImportWorkflow();
  const deleteMutation = useDeleteWorkflow();
  const duplicateMutation = useDuplicateWorkflow();
  const favoriteMutation = useSetWorkflowFavorite();
  const exportMutation = useExportWorkflow();
  const createForm = useForm<WorkflowMetadataInput>({
    resolver: zodResolver(workflowMetadataSchema),
    defaultValues: { name: '', description: '' },
  });
  const workflows = workflowsQuery.data?.data ?? [];
  const page = workflowsQuery.data?.page;
  const historyWorkflow = useMemo(
    () => workflows.find((workflow) => workflow.id === historyId),
    [historyId, workflows],
  );

  function changeFilters(changes: Partial<WorkflowListFilters>) {
    setFilters((current) => ({ ...current, ...changes, page: changes.page ?? 1 }));
  }

  async function onCreate(values: WorkflowMetadataInput) {
    try {
      const workflow = await createMutation.mutateAsync(values);
      createForm.reset();
      toast.success(`Created ${workflow.name}.`);
    } catch (error) {
      toast.error(`Workflow could not be created: ${messageOf(error)}`);
    }
  }

  async function onImportFile(file: File | undefined) {
    if (!file) return;
    try {
      const parsedJson: unknown = JSON.parse(await file.text());
      const parsed = workflowImportSchema.safeParse(parsedJson);
      if (!parsed.success) {
        toast.error(`Invalid workflow JSON: ${parsed.error.issues[0]?.message ?? 'The file does not match the workflow format.'}`);
        return;
      }
      setImportPreview(parsed.data);
    } catch (error) {
      toast.error(`The selected file could not be read: ${messageOf(error)}`);
    }
  }

  async function confirmImport() {
    if (!importPreview) return;
    try {
      const result = await importMutation.mutateAsync(importPreview);
      setImportPreview(null);
      toast.success(`Imported ${result.name}.`);
    } catch (error) {
      toast.error(`Workflow import failed: ${messageOf(error)}`);
    }
  }

  async function onExport(workflowId: string) {
    try {
      const result = await exportMutation.mutateAsync(workflowId);
      downloadFile(result.filename, result.contentType, result.content);
      toast.success('Workflow JSON exported.');
    } catch (error) {
      toast.error(`Workflow export failed: ${messageOf(error)}`);
    }
  }

  async function onDelete(workflowId: string, name: string) {
    if (!window.confirm(`Delete "${name}" and its version history?`)) return;
    try {
      await deleteMutation.mutateAsync(workflowId);
      toast.success('Workflow deleted.');
    } catch (error) {
      toast.error(`Workflow could not be deleted: ${messageOf(error)}`);
    }
  }

  return (
    <main className="mx-auto w-full max-w-7xl space-y-5">
      <header className="flex flex-col justify-between gap-4 rounded-xl border border-border bg-panel p-5 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-xl bg-teal-100 text-teal-900 dark:bg-teal-950 dark:text-teal-100">
            <WorkflowIcon className="size-5" aria-hidden="true" />
          </span>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Workflows</h1>
            <p className="text-sm text-muted-foreground">Manage drafts, published workflows, and version history.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-muted">
            <Upload className="size-4" aria-hidden="true" />
            Import JSON
            <input
              type="file"
              accept="application/json,.json"
              className="sr-only"
              onChange={(event) => {
                void onImportFile(event.target.files?.[0]);
                event.currentTarget.value = '';
              }}
            />
          </label>
          <Link href="/workflows/builder/new">
            <Button><Plus className="size-4" aria-hidden="true" /> Open Builder</Button>
          </Link>
        </div>
      </header>

      <form onSubmit={createForm.handleSubmit(onCreate)} className="grid gap-3 rounded-xl border border-border bg-panel p-4 sm:grid-cols-[1fr_2fr_auto] sm:items-end">
        <label className="text-xs font-medium">
          New workflow name
          <input {...createForm.register('name')} className="mt-1 h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-teal-700" />
          {createForm.formState.errors.name ? <span className="mt-1 block text-coral-700">{createForm.formState.errors.name.message}</span> : null}
        </label>
        <label className="text-xs font-medium">
          Description
          <input {...createForm.register('description')} className="mt-1 h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-teal-700" />
        </label>
        <Button type="submit" disabled={createMutation.isPending}>
          {createMutation.isPending ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <Plus className="size-4" aria-hidden="true" />}
          Create draft
        </Button>
      </form>

      <section className="space-y-4 rounded-xl border border-border bg-panel p-4">
        <div className="grid gap-3 md:grid-cols-[minmax(220px,1fr)_repeat(4,minmax(120px,auto))]">
          <label className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <input
              aria-label="Search workflows"
              value={filters.search}
              onChange={(event) => changeFilters({ search: event.target.value })}
              placeholder="Search workflows"
              className="h-10 w-full rounded-md border border-border bg-background pl-9 pr-3 text-sm outline-none focus:border-teal-700"
            />
          </label>
          <select aria-label="Filter by status" value={filters.status} onChange={(event) => changeFilters({ status: event.target.value as WorkflowListFilters['status'] })} className="h-10 rounded-md border border-border bg-background px-3 text-sm">
            <option value="">All statuses</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
          <select aria-label="Filter favorites" value={filters.favorite} onChange={(event) => changeFilters({ favorite: event.target.value as WorkflowListFilters['favorite'] })} className="h-10 rounded-md border border-border bg-background px-3 text-sm">
            <option value="all">All workflows</option>
            <option value="favorite">Favorites</option>
          </select>
          <select aria-label="Sort workflows" value={`${filters.sortBy}:${filters.sortOrder}`} onChange={(event) => {
            const [sortBy, sortOrder] = event.target.value.split(':') as [WorkflowListFilters['sortBy'], WorkflowListFilters['sortOrder']];
            changeFilters({ sortBy, sortOrder });
          }} className="h-10 rounded-md border border-border bg-background px-3 text-sm">
            <option value="updatedAt:desc">Recently updated</option>
            <option value="updatedAt:asc">Least recently updated</option>
            <option value="createdAt:desc">Recently created</option>
            <option value="name:asc">Name A–Z</option>
            <option value="name:desc">Name Z–A</option>
          </select>
          <select aria-label="Page size" value={filters.limit} onChange={(event) => changeFilters({ limit: Number(event.target.value) })} className="h-10 rounded-md border border-border bg-background px-3 text-sm">
            {[10, 20, 50, 100].map((size) => <option key={size} value={size}>{size} per page</option>)}
          </select>
        </div>

        {workflowsQuery.isPending ? (
          <div className="grid gap-3" aria-label="Loading workflows">
            {[0, 1, 2].map((item) => <div key={item} className="h-24 animate-pulse rounded-lg bg-muted" />)}
          </div>
        ) : workflowsQuery.isError ? (
          <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-coral-300 bg-coral-100/50 p-4 text-sm">
            <span>{messageOf(workflowsQuery.error)}</span>
            <Button variant="secondary" onClick={() => void workflowsQuery.refetch()}>Retry</Button>
          </div>
        ) : workflows.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border px-4 py-12 text-center">
            <WorkflowIcon className="mx-auto size-8 text-muted-foreground" aria-hidden="true" />
            <h2 className="mt-3 font-semibold">No workflows found</h2>
            <p className="mt-1 text-sm text-muted-foreground">Create a workflow or adjust your search and filters.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {workflows.map((workflow) => (
              <article key={workflow.id} className="flex flex-col gap-3 rounded-lg border border-border p-4 sm:flex-row sm:items-center sm:justify-between">
                <Link href={`/workflows/builder/${encodeURIComponent(workflow.id)}`} className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate font-semibold hover:text-teal-800">{workflow.name}</h2>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${workflow.status === 'published' ? 'bg-teal-100 text-teal-900 dark:bg-teal-950 dark:text-teal-100' : 'bg-muted text-muted-foreground'}`}>
                      {workflow.status}
                    </span>
                    <span className="text-xs text-muted-foreground">v{workflow.version}</span>
                  </div>
                  <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">{workflow.description || 'No description'}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {workflow.definition.nodes.length} nodes · Updated {new Date(workflow.updatedAt).toLocaleString()} · By {workflow.createdBy}
                    {workflow.publishedAt ? ` · Published ${new Date(workflow.publishedAt).toLocaleDateString()}` : ''}
                  </p>
                </Link>
                <div className="flex flex-wrap items-center gap-1">
                  <Button variant="ghost" size="icon" aria-label={workflow.favorite ? 'Remove favorite' : 'Add favorite'} title={workflow.favorite ? 'Remove favorite' : 'Add favorite'} disabled={favoriteMutation.isPending} onClick={() => favoriteMutation.mutate({ workflowId: workflow.id, favorite: !workflow.favorite }, { onError: (error) => toast.error(`Favorite update failed: ${messageOf(error)}`) })}>
                    <Star className={`size-4 ${workflow.favorite ? 'fill-amber-400 text-amber-500' : ''}`} aria-hidden="true" />
                  </Button>
                  <Button variant="ghost" size="icon" aria-label="Version history" title="Version history" onClick={() => setHistoryId(workflow.id)}>
                    <History className="size-4" aria-hidden="true" />
                  </Button>
                  <Button variant="ghost" size="icon" aria-label="Export workflow JSON" title="Export JSON" disabled={exportMutation.isPending} onClick={() => void onExport(workflow.id)}>
                    <Download className="size-4" aria-hidden="true" />
                  </Button>
                  <Button variant="ghost" size="icon" aria-label="Duplicate workflow" title="Duplicate" disabled={duplicateMutation.isPending} onClick={() => duplicateMutation.mutate(workflow.id, { onSuccess: (copy) => toast.success(`Duplicated as ${copy.name}.`), onError: (error) => toast.error(`Duplicate failed: ${messageOf(error)}`) })}>
                    <Copy className="size-4" aria-hidden="true" />
                  </Button>
                  <Button variant="ghost" size="icon" aria-label="Delete workflow" title="Delete" onClick={() => void onDelete(workflow.id, workflow.name)}>
                    <Trash2 className="size-4 text-coral-700" aria-hidden="true" />
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}

        {page && page.total > 0 ? (
          <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4 text-sm">
            <span className="text-muted-foreground">Page {page.page} of {Math.max(page.totalPages, 1)} · {page.total} workflows</span>
            <div className="flex gap-2">
              <Button variant="secondary" disabled={page.page <= 1 || workflowsQuery.isFetching} onClick={() => changeFilters({ page: page.page - 1 })}>
                <ArrowUp className="size-4 -rotate-90" aria-hidden="true" /> Previous
              </Button>
              <Button variant="secondary" disabled={!page.hasMore || workflowsQuery.isFetching} onClick={() => changeFilters({ page: page.page + 1 })}>
                Next <ArrowDown className="size-4 -rotate-90" aria-hidden="true" />
              </Button>
            </div>
          </footer>
        ) : null}
      </section>

      {importPreview ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="workflow-import-title">
          <section className="w-full max-w-lg space-y-4 rounded-xl border border-border bg-panel p-5 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 id="workflow-import-title" className="font-semibold">Preview workflow import</h2>
                <p className="mt-1 text-sm text-muted-foreground">Review before importing through the backend.</p>
              </div>
              <Button variant="ghost" size="icon" aria-label="Close preview" onClick={() => setImportPreview(null)}><X className="size-4" aria-hidden="true" /></Button>
            </div>
            <div className="rounded-lg border border-border bg-background p-4">
              <p className="font-medium">{importPreview.workflow.name}</p>
              <p className="mt-1 text-sm text-muted-foreground">{importPreview.workflow.description || 'No description'}</p>
              <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground"><FileJson className="size-4" aria-hidden="true" /> {importPreview.workflow.definition.nodes.length} nodes · {importPreview.workflow.definition.edges.length} connections</p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setImportPreview(null)}>Cancel</Button>
              <Button disabled={importMutation.isPending} onClick={() => void confirmImport()}>
                {importMutation.isPending ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <Upload className="size-4" aria-hidden="true" />}
                Import workflow
              </Button>
            </div>
          </section>
        </div>
      ) : null}

      {historyId ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="workflow-history-title">
          <section className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-border bg-panel p-5 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 id="workflow-history-title" className="font-semibold">Version history{historyWorkflow ? ` · ${historyWorkflow.name}` : ''}</h2>
                <p className="mt-1 text-sm text-muted-foreground">Versions are stored and returned by the backend.</p>
              </div>
              <Button variant="ghost" size="icon" aria-label="Close history" onClick={() => setHistoryId(null)}><X className="size-4" aria-hidden="true" /></Button>
            </div>
            {historyQuery.isPending ? <div className="mt-4 h-20 animate-pulse rounded bg-muted" aria-label="Loading version history" /> : historyQuery.isError ? (
              <div role="alert" className="mt-4 text-sm text-coral-700">{messageOf(historyQuery.error)}</div>
            ) : historyQuery.data?.length ? (
              <ol className="mt-4 space-y-2">
                {historyQuery.data.map((version) => (
                  <li key={`${version.workflowId}-${version.version}`} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3 text-sm">
                    <div><p className="font-medium">Version {version.version} · {version.status}</p><p className="mt-1 text-xs text-muted-foreground">{new Date(version.createdAt).toLocaleString()} · {version.createdBy}</p></div>
                    {version.publishedAt ? <span className="text-xs text-muted-foreground">Published {new Date(version.publishedAt).toLocaleDateString()}</span> : null}
                  </li>
                ))}
              </ol>
            ) : <p className="mt-4 text-sm text-muted-foreground">No saved versions yet.</p>}
          </section>
        </div>
      ) : null}
    </main>
  );
}
