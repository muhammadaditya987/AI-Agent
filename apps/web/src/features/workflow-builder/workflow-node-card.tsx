'use client';

import {
  Brain,
  Braces,
  Clock3,
  Database,
  Film,
  GitBranch,
  Mail,
  MessageSquare,
  Music2,
  Repeat2,
  Sparkles,
  Video,
  Webhook,
  Youtube,
  type LucideIcon,
} from 'lucide-react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { cn } from '@/lib/utils';
import type { WorkflowNode } from '@/types/workflow';

const iconByKey: Record<string, LucideIcon> = {
  brain: Brain,
  sparkles: Sparkles,
  music: Music2,
  film: Film,
  youtube: Youtube,
  video: Video,
  webhook: Webhook,
  timer: Clock3,
  repeat: Repeat2,
  'git-branch': GitBranch,
  database: Database,
  mail: Mail,
  'message-square': MessageSquare,
};

export function WorkflowNodeIcon({ icon, className }: Readonly<{ icon: string; className?: string }>) {
  const Icon = iconByKey[icon] ?? Braces;
  return <Icon className={className} aria-hidden="true" />;
}

export function WorkflowNodeCard({ data, selected }: NodeProps<WorkflowNode>) {
  const inputs = Array.from({ length: data.inputCount }, (_, index) => index);
  const outputs = Array.from({ length: data.outputCount }, (_, index) => index);

  return (
    <article className={cn(
      'relative min-w-56 max-w-64 rounded-xl border bg-panel shadow-lg shadow-slate-950/5 transition',
      selected ? 'border-teal-700 ring-2 ring-teal-700/20' : 'border-border',
      data.status === 'error' && 'border-coral-600 ring-2 ring-coral-600/15',
    )}>
      {inputs.map((input) => (
        <Handle
          key={`input-${input}`}
          id={`input-${input}`}
          type="target"
          position={Position.Left}
          style={{ top: `${((input + 1) / (inputs.length + 1)) * 100}%` }}
          className="!size-3 !border-2 !border-panel !bg-teal-700 dark:!bg-teal-400"
          aria-label={`Input ${input + 1}`}
        />
      ))}
      <header className="flex items-center gap-3 border-b border-border p-3.5">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-teal-100 text-teal-900 dark:bg-teal-950 dark:text-teal-100">
          <WorkflowNodeIcon icon={data.icon} className="size-4.5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold">{data.label}</span>
          <span className="mt-0.5 block text-[10px] uppercase tracking-wide text-muted-foreground">{data.category}</span>
        </span>
        <span
          title={data.status === 'error' ? data.error : data.status}
          className={cn(
            'size-2 shrink-0 rounded-full',
            data.status === 'error' ? 'bg-coral-600' : data.status === 'ready' ? 'bg-teal-600' : 'bg-slate-300 dark:bg-slate-600',
          )}
        />
      </header>
      <div className="px-3.5 py-3">
        <p className="line-clamp-2 min-h-8 text-xs leading-4 text-muted-foreground">{data.description}</p>
        {data.status === 'error' && data.error ? (
          <p role="alert" className="mt-2 line-clamp-2 text-[11px] leading-4 text-coral-700 dark:text-coral-300">{data.error}</p>
        ) : null}
      </div>
      {outputs.map((output) => (
        <Handle
          key={`output-${output}`}
          id={`output-${output}`}
          type="source"
          position={Position.Right}
          style={{ top: `${((output + 1) / (outputs.length + 1)) * 100}%` }}
          className="!size-3 !border-2 !border-panel !bg-teal-700 dark:!bg-teal-400"
          aria-label={`Output ${output + 1}`}
        />
      ))}
    </article>
  );
}
