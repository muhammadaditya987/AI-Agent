'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import type { WorkflowConfigField, WorkflowNode } from '@/types/workflow';

type Props = Readonly<{
  node: WorkflowNode;
  fields: WorkflowConfigField[];
  onSave: (nodeId: string, config: Record<string, unknown>) => void;
  onClose: () => void;
}>;

function makeSchema(fields: WorkflowConfigField[]) {
  return z.object(Object.fromEntries(fields.map((field) => {
    let valueSchema: z.ZodTypeAny;
    if (field.type === 'number') {
      valueSchema = z.preprocess(
        (value) => value === '' || value === undefined ? undefined : typeof value === 'string' ? Number(value) : value,
        field.required
          ? z.number({ error: `${field.label} is required.` })
          : z.number().optional(),
      );
    } else if (field.type === 'boolean') {
      valueSchema = z.boolean();
    } else {
      const stringSchema = z.string();
      valueSchema = field.required
        ? stringSchema.trim().min(1, `${field.label} is required.`)
        : stringSchema.optional();
      if (field.type === 'url' && field.required) {
        valueSchema = z.string().url(`${field.label} must be a valid URL.`);
      }
    }
    return [field.key, valueSchema];
  })));
}

export function WorkflowNodeConfigPanel({ node, fields, onSave, onClose }: Props) {
  const schema = useMemo(() => makeSchema(fields), [fields]);
  const defaults = useMemo(
    () => Object.fromEntries(fields.map((field) => [
      field.key,
      node.data.config[field.key] ?? (field.type === 'boolean' ? false : ''),
    ])),
    [fields, node.data.config],
  );
  const form = useForm<Record<string, unknown>>({
    resolver: zodResolver(schema),
    defaultValues: defaults,
  });

  useEffect(() => form.reset(defaults), [defaults, form]);

  function submit(values: Record<string, unknown>) {
    const config = Object.fromEntries(
      Object.entries(values).filter(([, value]) => value !== '' && value !== undefined),
    );
    onSave(node.id, config);
    onClose();
  }

  return (
    <aside className="absolute inset-y-0 right-0 z-20 flex w-[min(360px,92vw)] flex-col border-l border-border bg-panel shadow-2xl">
      <header className="border-b border-border p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{node.data.category}</p>
            <h2 className="mt-1 text-lg font-semibold">{node.data.label} configuration</h2>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">{node.data.description}</p>
          </div>
          <Button type="button" variant="ghost" size="icon" aria-label="Close configuration panel" onClick={onClose}>×</Button>
        </div>
      </header>
      <form className="flex flex-1 flex-col overflow-y-auto" onSubmit={form.handleSubmit(submit)} noValidate>
        <div className="space-y-4 p-5">
          {fields.map((field) => {
            const error = form.formState.errors[field.key]?.message;
            const controlClass = 'mt-1.5 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15';
            return (
              <div key={field.key}>
                <label htmlFor={`config-${field.key}`} className="text-xs font-semibold">
                  {field.label}{field.required ? <span className="ml-1 text-coral-700" aria-label="required">*</span> : null}
                </label>
                {field.type === 'textarea' ? (
                  <textarea id={`config-${field.key}`} rows={4} placeholder={field.placeholder} {...form.register(field.key)} className={`${controlClass} py-2`} />
                ) : field.type === 'select' ? (
                  <select id={`config-${field.key}`} {...form.register(field.key)} className={`${controlClass} h-10`}>
                    <option value="">Select…</option>
                    {(field.options ?? []).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                ) : field.type === 'boolean' ? (
                  <label className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                    <input type="checkbox" {...form.register(field.key)} className="size-4 accent-teal-700" />
                    Enabled
                  </label>
                ) : (
                  <input
                    id={`config-${field.key}`}
                    type={field.type === 'number' ? 'number' : field.type === 'url' ? 'url' : 'text'}
                    step={field.type === 'number' ? 'any' : undefined}
                    placeholder={field.placeholder}
                    {...form.register(field.key)}
                    className={`${controlClass} h-10`}
                  />
                )}
                {typeof error === 'string' ? <p role="alert" className="mt-1 text-xs text-coral-700 dark:text-coral-300">{error}</p> : null}
              </div>
            );
          })}
          {fields.length === 0 ? <p className="text-sm text-muted-foreground">This node has no configuration fields.</p> : null}
        </div>
        <footer className="mt-auto flex gap-2 border-t border-border p-4">
          <Button type="submit" className="flex-1">Save configuration</Button>
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
        </footer>
      </form>
    </aside>
  );
}
