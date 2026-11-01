'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Check,
  CircleAlert,
  Clock3,
  Download,
  FileUp,
  Heart,
  LoaderCircle,
  Save,
  Search,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import {
  contentFactoryTools,
  contentFactoryWorkflowSteps,
} from '@/constants/content-factory';
import {
  useContentProjects,
  useDeleteContentProject,
  useGenerateContent,
  useExportContentProject,
  useImportContentProject,
  useLoadContentProject,
  usePublishContentProject,
  useSaveContentProject,
  useToggleContentFavorite,
} from '@/hooks/use-content-factory';
import {
  contentAssetsSchema,
  contentBriefSchema,
  contentExportFileSchema,
  contentHistoryFiltersSchema,
  contentImportSchema,
} from '@/schemas/content-factory';
import type { ContentAssetsInput, ContentBriefInput, ContentHistoryFilters, ContentImportInput } from '@/schemas/content-factory';
import type { ContentProject, ContentProjectInput, GeneratedContent } from '@/types/content-factory';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type Props = Readonly<{ toolSlug: string }>;
type AssetKey = keyof ContentAssetsInput;

const latestDraftFilters: ContentHistoryFilters = {
  search: '',
  generatorType: '',
  dateFrom: '',
  dateTo: '',
  status: 'draft',
  favorite: 'all',
  pageSize: 1,
};

function getErrorMessage(error: unknown): string {
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

function assetText(value: string | string[]) {
  return Array.isArray(value) ? value.join('\n') : value;
}

function assetValue(key: AssetKey, value: string): string | string[] {
  if (key === 'seoKeywords' || key === 'hashtags') {
    return value.split('\n').map((item) => item.trim()).filter(Boolean);
  }
  return value;
}

function downloadFile(filename: string, content: string, contentType: string) {
  const url = URL.createObjectURL(new Blob([content], { type: contentType }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-xl border border-border p-4" aria-hidden="true">
      <div className="h-4 w-2/3 rounded bg-muted" />
      <div className="mt-4 h-3 w-1/3 rounded bg-muted" />
    </div>
  );
}

export function ContentFactoryWorkspace({ toolSlug }: Props) {
  const tool = contentFactoryTools.find((item) => item.slug === toolSlug);
  const activeTool = tool ?? contentFactoryTools[0];
  const form = useForm<ContentBriefInput>({
    resolver: zodResolver(contentBriefSchema),
    defaultValues: { keyword: '', targetAge: '', language: '' },
  });
  const historyForm = useForm<ContentHistoryFilters>({
    resolver: zodResolver(contentHistoryFiltersSchema),
    defaultValues: {
      search: '',
      generatorType: '',
      dateFrom: '',
      dateTo: '',
      status: '',
      favorite: 'all',
      pageSize: 20,
    },
  });
  const historyFilters = useWatch({ control: historyForm.control });
  const briefValues = useWatch({ control: form.control });
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [importPreview, setImportPreview] = useState<ContentImportInput | null>(null);
  const [importError, setImportError] = useState('');
  const [autoSaveState, setAutoSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const importInput = useRef<HTMLInputElement>(null);
  const autoSaveFingerprint = useRef('');
  const parsedFilters = contentHistoryFiltersSchema.safeParse(historyFilters);
  const filters = parsedFilters.success
    ? { ...parsedFilters.data, search: debouncedSearch }
    : historyForm.getValues();
  const projectsQuery = useContentProjects(filters, page, parsedFilters.success);
  const latestDraftQuery = useContentProjects(latestDraftFilters, 1);
  const generateMutation = useGenerateContent();
  const saveMutation = useSaveContentProject();
  const publishMutation = usePublishContentProject();
  const deleteMutation = useDeleteContentProject();
  const loadProjectMutation = useLoadContentProject();
  const favoriteMutation = useToggleContentFavorite();
  const importMutation = useImportContentProject();
  const exportMutation = useExportContentProject();
  const [generated, setGenerated] = useState<GeneratedContent | null>(null);
  const [activeProject, setActiveProject] = useState<ContentProject | null>(null);
  const [workflowStage, setWorkflowStage] = useState(0);
  const hasLoadedLastDraft = useRef(false);

  const displayTool = contentFactoryTools.find((item) => item.slug === activeProject?.generatorType) ?? activeTool;
  const output = generated?.assets[displayTool.asset] ?? '';
  const outputValue = assetText(output);
  const selectedProjectId = activeProject?.id;
  const isBusy =
    generateMutation.isPending ||
    saveMutation.isPending ||
    publishMutation.isPending ||
    deleteMutation.isPending ||
    favoriteMutation.isPending ||
    importMutation.isPending ||
    exportMutation.isPending;
  const Icon = tool?.icon ?? Sparkles;
  const saveDraft = saveMutation.mutateAsync;

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(historyFilters.search ?? ''), 300);
    return () => window.clearTimeout(timer);
  }, [historyFilters.search]);

  useEffect(() => {
    setPage(1);
  }, [
    historyFilters.search,
    historyFilters.generatorType,
    historyFilters.dateFrom,
    historyFilters.dateTo,
    historyFilters.status,
    historyFilters.favorite,
    historyFilters.pageSize,
  ]);

  useEffect(() => {
    if (!projectsQuery.data || projectsQuery.isPlaceholderData) return;
    const lastPage = Math.max(projectsQuery.data.page.totalPages, 1);
    if (page > lastPage) setPage(lastPage);
  }, [page, projectsQuery.data, projectsQuery.isPlaceholderData]);

  useEffect(() => {
    if (!activeProject || activeProject.status !== 'draft' || !generated || !briefValues) return;
    const brief = contentBriefSchema.safeParse(briefValues);
    const assets = contentAssetsSchema.safeParse(generated.assets);
    if (!brief.success || !assets.success) return;
    const projectInput: ContentProjectInput = {
      brief: brief.data,
      assets: assets.data,
      promptVersion: generated.promptVersion,
      model: generated.model,
      title: assets.data.title,
      generatorType: activeProject.generatorType,
    };
    const fingerprint = JSON.stringify(projectInput);
    if (fingerprint === autoSaveFingerprint.current) return;
    const timer = window.setTimeout(() => {
      autoSaveFingerprint.current = fingerprint;
      setAutoSaveState('saving');
      void saveDraft({ projectId: activeProject.id, project: projectInput })
        .then((project) => {
          setActiveProject(project);
          setAutoSaveState('saved');
        })
        .catch((error: unknown) => {
          autoSaveFingerprint.current = '';
          setAutoSaveState('idle');
          toast.error(`Draft auto-save failed: ${getErrorMessage(error)}`);
        });
    }, 900);
    return () => window.clearTimeout(timer);
  }, [activeProject, briefValues, generated, saveDraft]);

  useEffect(() => {
    if (!latestDraftQuery.isSuccess || hasLoadedLastDraft.current) return;
    hasLoadedLastDraft.current = true;
    const lastDraft = latestDraftQuery.data.data[0];
    if (!activeProject && !generated && lastDraft) void onSelectProject(lastDraft);
  }, [activeProject, generated, latestDraftQuery.data, latestDraftQuery.isSuccess]);

  if (!tool) return null;

  async function onGenerate(brief: ContentBriefInput) {
    try {
      const result = await generateMutation.mutateAsync({ brief, generatorType: activeTool.slug });
      setGenerated({ assets: result.assets, model: result.model, promptVersion: result.promptVersion });
      setActiveProject(result.project);
      setAutoSaveState('saved');
      autoSaveFingerprint.current = JSON.stringify({
        brief: result.project.brief,
        assets: result.project.assets,
        promptVersion: result.project.promptVersion,
        model: result.project.model,
        title: result.project.title,
        generatorType: result.project.generatorType,
      });
      setWorkflowStage(2);
      toast.success('Generated content saved to history as a draft.');
    } catch (error) {
      toast.error(`Generation failed: ${getErrorMessage(error)}`);
      setWorkflowStage(0);
    }
  }

  async function onSave(brief: ContentBriefInput) {
    if (!generated) {
      toast.error('Generate content before saving a project.');
      return;
    }
    const parsedAssets = contentAssetsSchema.safeParse(generated.assets);
    if (!parsedAssets.success) {
      toast.error('The generated content is incomplete. Generate it again before saving.');
      return;
    }

    try {
      const project = await saveMutation.mutateAsync({
        projectId: selectedProjectId,
        project: {
          brief,
          assets: parsedAssets.data,
          promptVersion: generated.promptVersion,
          model: generated.model,
          title: parsedAssets.data.title,
          generatorType: activeProject?.generatorType ?? activeTool.slug,
        },
      });
      setActiveProject(project);
      setAutoSaveState('saved');
      autoSaveFingerprint.current = JSON.stringify({
        brief: project.brief,
        assets: project.assets,
        promptVersion: project.promptVersion,
        model: project.model,
        title: project.title,
        generatorType: project.generatorType,
      });
      setWorkflowStage(4);
      toast.success(selectedProjectId ? 'Project changes saved.' : 'Project saved.');
    } catch (error) {
      toast.error(`Save failed: ${getErrorMessage(error)}`);
    }
  }

  async function onPublish() {
    if (!selectedProjectId) {
      toast.error('Save the project before publishing.');
      return;
    }
    try {
      const project = await publishMutation.mutateAsync(selectedProjectId);
      setActiveProject(project);
      setAutoSaveState('saved');
      setWorkflowStage(5);
      toast.success('Project published.');
    } catch (error) {
      toast.error(`Publish failed: ${getErrorMessage(error)}`);
    }
  }

  async function onSelectProject(project: ContentProject) {
    try {
      project = await loadProjectMutation.mutateAsync(project.id);
    } catch (error) {
      toast.error(`Could not load history detail: ${getErrorMessage(error)}`);
      return;
    }
    setActiveProject(project);
    setGenerated({
      promptVersion: project.promptVersion,
      model: project.model,
      assets: project.assets,
    });
    form.reset(project.brief);
    autoSaveFingerprint.current = JSON.stringify({
      brief: project.brief,
      assets: project.assets,
      promptVersion: project.promptVersion,
      model: project.model,
      title: project.title,
      generatorType: project.generatorType,
    });
    setWorkflowStage(project.status === 'published' ? 5 : 4);
  }

  async function onDeleteProject(project: ContentProject) {
    try {
      await deleteMutation.mutateAsync(project.id);
      if (activeProject?.id === project.id) {
        setActiveProject(null);
        setGenerated(null);
        setWorkflowStage(0);
      }
      toast.success('History entry and draft deleted.');
    } catch (error) {
      toast.error(`Delete failed: ${getErrorMessage(error)}`);
    }
  }

  function updateOutput(value: string) {
    if (!generated) return;
    const parsed = assetValue(displayTool.asset, value);
    setGenerated({
      ...generated,
      assets: { ...generated.assets, [displayTool.asset]: parsed },
    });
    setWorkflowStage(2);
  }

  async function onToggleFavorite(project: ContentProject) {
    try {
      await favoriteMutation.mutateAsync({ projectId: project.id, favorite: !project.favorite });
      toast.success(project.favorite ? 'Removed from favorites.' : 'Added to favorites.');
    } catch (error) {
      toast.error(`Favorite update failed: ${getErrorMessage(error)}`);
    }
  }

  async function onExport(project: ContentProject, format: 'json' | 'markdown' | 'txt') {
    try {
      const file = await exportMutation.mutateAsync({ projectId: project.id, format });
      downloadFile(file.filename, file.content, file.contentType);
    } catch (error) {
      toast.error(`Export failed: ${getErrorMessage(error)}`);
    }
  }

  async function onImport() {
    if (!importPreview) return;
    try {
      const project = await importMutation.mutateAsync({
        ...importPreview,
        assets: importPreview.assets,
      });
      setImportPreview(null);
      setImportError('');
      if (importInput.current) importInput.current.value = '';
      toast.success('Project imported to history and drafts.');
      await onSelectProject(project);
    } catch (error) {
      toast.error(`Import failed: ${getErrorMessage(error)}`);
    }
  }

  async function onFileSelected(file?: File) {
    setImportPreview(null);
    setImportError('');
    if (!file) return;
    try {
      const fileContent = await file.text();
      if (importInput.current) importInput.current.value = '';
      const parsedJson: unknown = JSON.parse(fileContent);
      const envelope = contentExportFileSchema.safeParse(parsedJson);
      const parsedProject = envelope.success
        ? contentImportSchema.safeParse(envelope.data.project)
        : contentImportSchema.safeParse(parsedJson);
      if (!parsedProject.success) {
        setImportError(parsedProject.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join(' '));
        return;
      }
      setImportPreview(parsedProject.data);
    } catch (error) {
      if (importInput.current) importInput.current.value = '';
      setImportError(error instanceof SyntaxError ? 'The selected file is not valid JSON.' : getErrorMessage(error));
    }
  }

  const saveProject = form.handleSubmit(onSave);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-7">
      <section className="overflow-hidden rounded-2xl border border-border bg-panel">
        <div className="border-b border-border bg-gradient-to-br from-teal-50 to-panel px-5 py-7 dark:from-teal-950/30 sm:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-800 dark:text-teal-300">AI Content Factory</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{tool.label}</h1>
              <p className="mt-3 max-w-xl leading-6 text-muted-foreground">
                Build, review, and publish content using your connected AI content service.
              </p>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-border bg-panel px-4 py-3">
              <span className="grid size-10 place-items-center rounded-lg bg-teal-100 text-teal-900 dark:bg-teal-900 dark:text-teal-100">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-semibold">{tool.outputLabel}</p>
                <p className="text-xs text-muted-foreground">Backend-generated preview</p>
              </div>
            </div>
          </div>
          <ol className="mt-8 grid grid-cols-5 gap-2" aria-label="Content workflow">
            {contentFactoryWorkflowSteps.map((step, index) => {
              const isComplete = index < workflowStage;
              const isCurrent = index === workflowStage;
              return (
                <li key={step} className="min-w-0">
                  <div className={cn(
                    'mb-2 h-1 rounded-full',
                    isComplete || isCurrent ? 'bg-teal-700 dark:bg-teal-400' : 'bg-muted',
                  )} />
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold sm:text-xs">
                    {isComplete ? <Check className="size-3.5 text-teal-700 dark:text-teal-400" aria-hidden="true" /> : null}
                    <span className={isCurrent ? 'text-foreground' : 'text-muted-foreground'}>{step}</span>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>

        <div className="grid gap-6 p-5 sm:p-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <form onSubmit={form.handleSubmit(onGenerate)} className="space-y-5" noValidate>
            <div>
              <h2 className="text-lg font-semibold">Content brief</h2>
              <p className="mt-1 text-sm text-muted-foreground">Describe the content you want the backend to generate.</p>
            </div>
            {([
              ['keyword', 'Topic or keyword'],
              ['targetAge', 'Target age'],
              ['language', 'Language'],
            ] as const).map(([field, label]) => (
              <div key={field} className="space-y-1.5">
                <label htmlFor={field} className="text-sm font-medium">{label}</label>
                <input
                  id={field}
                  autoComplete="off"
                  {...form.register(field)}
                  aria-invalid={Boolean(form.formState.errors[field])}
                  aria-describedby={form.formState.errors[field] ? `${field}-error` : undefined}
                  className="h-11 w-full rounded-md border border-border bg-background px-3 text-sm outline-none transition focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15"
                />
                {form.formState.errors[field] ? (
                  <p id={`${field}-error`} className="text-xs text-coral-700 dark:text-coral-300">
                    {form.formState.errors[field]?.message}
                  </p>
                ) : null}
              </div>
            ))}
            {generateMutation.isError ? (
              <div role="alert" className="flex gap-2 rounded-lg border border-coral-200 bg-coral-100/60 p-3 text-sm text-coral-800 dark:border-coral-800 dark:bg-coral-950/40 dark:text-coral-200">
                <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <span>{getErrorMessage(generateMutation.error)}</span>
              </div>
            ) : null}
            <Button type="submit" disabled={isBusy} className="w-full sm:w-auto">
              {generateMutation.isPending ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <Sparkles className="size-4" aria-hidden="true" />}
              {generateMutation.isPending ? 'Generating…' : 'Generate content'}
            </Button>
          </form>

          <section aria-labelledby="preview-title" className="flex min-h-80 flex-col rounded-xl border border-border bg-background p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 id="preview-title" className="text-lg font-semibold">Preview</h2>
                <p className="mt-1 text-sm text-muted-foreground">{displayTool.outputLabel}</p>
              </div>
              {activeProject ? (
                <span className={cn(
                  'rounded-full px-2.5 py-1 text-xs font-semibold capitalize',
                  activeProject.status === 'published'
                    ? 'bg-teal-100 text-teal-900 dark:bg-teal-950 dark:text-teal-100'
                    : 'bg-muted text-muted-foreground',
                )}>{activeProject.status}</span>
              ) : null}
            </div>
            {generateMutation.isPending ? (
              <div className="mt-5 flex-1 space-y-3 animate-pulse" aria-label="Generating preview">
                <div className="h-4 w-1/3 rounded bg-muted" />
                <div className="h-24 rounded-lg bg-muted" />
                <div className="h-4 w-2/3 rounded bg-muted" />
              </div>
            ) : generated ? (
              <>
                <textarea
                  aria-label={`Edit ${displayTool.outputLabel}`}
                  value={outputValue}
                  onChange={(event) => updateOutput(event.target.value)}
                  className="mt-5 min-h-48 w-full flex-1 resize-y rounded-lg border border-border bg-panel p-3 text-sm leading-6 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15"
                />
                <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Check className="size-3.5 text-teal-700 dark:text-teal-400" aria-hidden="true" />
                  Generated by {generated.model} · {generated.promptVersion}
                  {activeProject?.status === 'draft' ? ` · Draft auto-save ${autoSaveState}` : ''}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button type="button" disabled={isBusy} onClick={() => void saveProject()}>
                    {saveMutation.isPending ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <Save className="size-4" aria-hidden="true" />}
                    {saveMutation.isPending ? 'Saving…' : activeProject?.status === 'draft' ? 'Save draft' : selectedProjectId ? 'Save changes' : 'Save project'}
                  </Button>
                  <Button type="button" variant="secondary" disabled={!selectedProjectId || isBusy || activeProject?.status === 'published'} onClick={() => void onPublish()}>
                    {publishMutation.isPending ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <Upload className="size-4" aria-hidden="true" />}
                    Publish
                  </Button>
                  {activeProject ? (
                    <>
                      <Button type="button" variant="secondary" disabled={exportMutation.isPending} onClick={() => void onExport(activeProject, 'json')}>
                        <Download className="size-4" aria-hidden="true" /> JSON
                      </Button>
                      <Button type="button" variant="secondary" disabled={exportMutation.isPending} onClick={() => void onExport(activeProject, 'markdown')}>Markdown</Button>
                      <Button type="button" variant="secondary" disabled={exportMutation.isPending} onClick={() => void onExport(activeProject, 'txt')}>TXT</Button>
                    </>
                  ) : null}
                </div>
              </>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center py-10 text-center">
                <span className="grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
                  <Sparkles className="size-5" aria-hidden="true" />
                </span>
                <p className="mt-4 text-sm font-medium">Your preview will appear here</p>
                <p className="mt-1 max-w-xs text-xs leading-5 text-muted-foreground">Complete the brief and generate content to get started.</p>
              </div>
            )}
          </section>
        </div>
      </section>

      <section aria-labelledby="projects-title" className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="projects-title" className="text-xl font-semibold">History &amp; drafts</h2>
            <p className="mt-1 text-sm text-muted-foreground">Search, filter, edit, export, and manage generated content from the backend.</p>
          </div>
          {projectsQuery.data ? (
            <span className="text-xs text-muted-foreground">
              {projectsQuery.data.page.total} total · Page {projectsQuery.data.page.page} of {Math.max(projectsQuery.data.page.totalPages, 1)}
            </span>
          ) : null}
        </div>
        <form className="grid gap-3 rounded-xl border border-border bg-panel p-4 sm:grid-cols-2 lg:grid-cols-4" onSubmit={(event) => event.preventDefault()}>
          <label className="relative sm:col-span-2 lg:col-span-4">
            <span className="sr-only">Search all content history</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <input
              {...historyForm.register('search')}
              placeholder="Search all generated content…"
              className="h-10 w-full rounded-md border border-border bg-background pl-9 pr-3 text-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15"
            />
          </label>
          <label className="space-y-1 text-xs font-medium text-muted-foreground">
            Generator
            <select {...historyForm.register('generatorType')} className="h-10 w-full rounded-md border border-border bg-background px-2 text-sm text-foreground">
              <option value="">All generators</option>
              {contentFactoryTools.map((item) => <option key={item.slug} value={item.slug}>{item.label}</option>)}
            </select>
          </label>
          <label className="space-y-1 text-xs font-medium text-muted-foreground">
            Status
            <select {...historyForm.register('status')} className="h-10 w-full rounded-md border border-border bg-background px-2 text-sm text-foreground">
              <option value="">All statuses</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </label>
          <label className="space-y-1 text-xs font-medium text-muted-foreground">
            Favorite
            <select {...historyForm.register('favorite')} className="h-10 w-full rounded-md border border-border bg-background px-2 text-sm text-foreground">
              <option value="all">All content</option>
              <option value="favorites">Favorites</option>
              <option value="not-favorites">Not favorites</option>
            </select>
          </label>
          <label className="space-y-1 text-xs font-medium text-muted-foreground">
            Page size
            <select {...historyForm.register('pageSize', { valueAsNumber: true })} className="h-10 w-full rounded-md border border-border bg-background px-2 text-sm text-foreground">
              {[10, 20, 50, 100].map((size) => <option key={size} value={size}>{size} per page</option>)}
            </select>
          </label>
          <label className="space-y-1 text-xs font-medium text-muted-foreground">
            Created from
            <input type="date" {...historyForm.register('dateFrom')} className="h-10 w-full rounded-md border border-border bg-background px-2 text-sm text-foreground" />
          </label>
          <label className="space-y-1 text-xs font-medium text-muted-foreground">
            Created to
            <input type="date" {...historyForm.register('dateTo')} className="h-10 w-full rounded-md border border-border bg-background px-2 text-sm text-foreground" />
          </label>
          <div className="flex items-end sm:col-span-2">
            <Button type="button" variant="ghost" onClick={() => historyForm.reset()}>
              Reset filters
            </Button>
          </div>
          {!parsedFilters.success ? (
            <p role="alert" className="basis-full text-sm text-coral-700 dark:text-coral-300">
              {parsedFilters.error.issues.map((issue) => issue.message).join(' ')}
            </p>
          ) : null}
        </form>

        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-panel p-4">
          <input
            ref={importInput}
            type="file"
            accept=".json,application/json"
            className="sr-only"
            aria-label="Select a Content Factory JSON export"
            onChange={(event) => void onFileSelected(event.target.files?.[0])}
          />
          <Button type="button" variant="secondary" onClick={() => importInput.current?.click()}>
            <FileUp className="size-4" aria-hidden="true" /> Import JSON
          </Button>
          <span className="text-xs text-muted-foreground">JSON imports are validated and previewed before saving.</span>
          {importError ? <p role="alert" className="basis-full text-sm text-coral-700 dark:text-coral-300">{importError}</p> : null}
          {importPreview ? (
            <div className="basis-full rounded-lg border border-border bg-background p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">Import preview: {importPreview.title ?? importPreview.assets.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {importPreview.generatorType} · {importPreview.brief.keyword} · {importPreview.brief.language}
                  </p>
                  <p className="mt-3 line-clamp-3 whitespace-pre-wrap text-xs leading-5 text-muted-foreground">{importPreview.assets.songIdea}</p>
                </div>
                <div className="flex gap-2">
                  <Button type="button" disabled={importMutation.isPending} onClick={() => void onImport()}>
                    {importMutation.isPending ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : null}
                    Import project
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setImportPreview(null)}>Cancel</Button>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {projectsQuery.isError ? (
          <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-coral-200 bg-coral-100/60 p-4 text-sm text-coral-800 dark:border-coral-800 dark:bg-coral-950/40 dark:text-coral-200">
            <span className="flex items-center gap-2"><CircleAlert className="size-4" aria-hidden="true" />{getErrorMessage(projectsQuery.error)}</span>
            <Button type="button" variant="secondary" size="default" onClick={() => void projectsQuery.refetch()}>Retry</Button>
          </div>
        ) : projectsQuery.isPending ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }, (_, index) => <SkeletonCard key={index} />)}
          </div>
        ) : projectsQuery.data.data.length ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {projectsQuery.data.data.map((project) => (
              <article key={project.id} className={cn(
                'rounded-xl border bg-panel p-4 transition',
                activeProject?.id === project.id ? 'border-teal-700 ring-1 ring-teal-700/20' : 'border-border',
              )}>
                <div className="flex items-start justify-between gap-2">
                  <button type="button" className="min-w-0 flex-1 text-left" onClick={() => void onSelectProject(project)}>
                    <span className="block truncate text-sm font-semibold">{project.title}</span>
                    <span className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock3 className="size-3" aria-hidden="true" />
                      {new Date(project.createdAt).toISOString().slice(0, 10)} · {contentFactoryTools.find((item) => item.slug === project.generatorType)?.label ?? project.generatorType}
                    </span>
                  </button>
                  <span className="shrink-0 rounded-full bg-muted px-2 py-1 text-[10px] font-semibold capitalize text-muted-foreground">{project.status}</span>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button type="button" variant="secondary" className="h-9 flex-1 px-3 text-xs" disabled={loadProjectMutation.isPending} onClick={() => void onSelectProject(project)}>
                    Open <ArrowRight className="size-3.5" aria-hidden="true" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon" className="size-9" aria-label={`${project.favorite ? 'Remove from' : 'Add to'} favorites: ${project.title}`} disabled={isBusy} onClick={() => void onToggleFavorite(project)}>
                    <Heart className={cn('size-4', project.favorite && 'fill-coral-600 text-coral-600')} aria-hidden="true" />
                  </Button>
                  {activeProject?.id === project.id ? (
                    <>
                      <Button type="button" variant="ghost" size="icon" className="size-9" aria-label="Export JSON" disabled={exportMutation.isPending} onClick={() => void onExport(activeProject, 'json')}>
                        <Download className="size-4" aria-hidden="true" />
                      </Button>
                      <Button type="button" variant="ghost" size="icon" className="size-9" aria-label="Export Markdown" disabled={exportMutation.isPending} onClick={() => void onExport(activeProject, 'markdown')}>MD</Button>
                      <Button type="button" variant="ghost" size="icon" className="size-9" aria-label="Export TXT" disabled={exportMutation.isPending} onClick={() => void onExport(activeProject, 'txt')}>TXT</Button>
                    </>
                  ) : null}
                  <Button type="button" variant="ghost" size="icon" className="size-9" aria-label={`Delete ${project.title}`} disabled={isBusy} onClick={() => void onDeleteProject(project)}>
                    {deleteMutation.isPending ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <Trash2 className="size-4" aria-hidden="true" />}
                  </Button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-panel px-5 py-10 text-center">
            <p className="text-sm font-medium">No history entries match these filters</p>
            <p className="mt-1 text-xs text-muted-foreground">Generate content or adjust your search and filters.</p>
          </div>
        )}
        {projectsQuery.data ? (
          <nav aria-label="Content history pagination" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-panel px-4 py-3">
            <p className="text-xs text-muted-foreground">
              {projectsQuery.data.page.total === 0
                ? 'No entries'
                : `${(page - 1) * projectsQuery.data.page.limit + 1}–${Math.min(page * projectsQuery.data.page.limit, projectsQuery.data.page.total)} of ${projectsQuery.data.page.total}`}
            </p>
            <div className="flex gap-2">
              <Button type="button" variant="secondary" disabled={page <= 1 || projectsQuery.isFetching} onClick={() => setPage((current) => Math.max(1, current - 1))}>
                <ChevronLeft className="size-4" aria-hidden="true" /> Previous
              </Button>
              <Button type="button" variant="secondary" disabled={!projectsQuery.data.page.hasMore || projectsQuery.isFetching} onClick={() => setPage((current) => current + 1)}>
                Next <ChevronRight className="size-4" aria-hidden="true" />
              </Button>
            </div>
          </nav>
        ) : null}
      </section>
    </div>
  );
}
