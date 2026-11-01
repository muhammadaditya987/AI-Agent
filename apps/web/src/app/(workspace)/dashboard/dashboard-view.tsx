'use client';

import { useHealth } from '@/hooks/use-health';
import { Button } from '@/components/ui/button';
import { Activity, ArrowUpRight, CircleCheck, CircleX, Clock3, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { motion, useReducedMotion } from 'framer-motion';

const dependencyNames: Record<string, string> = {
  postgres: 'PostgreSQL',
  redis: 'Redis',
  n8n: 'Automation engine',
};

export function DashboardView() {
  const health = useHealth();
  const queryClient = useQueryClient();
  const reduceMotion = useReducedMotion();
  const healthy = health.data?.status === 'ok';

  async function refreshHealth() {
    await queryClient.invalidateQueries({ queryKey: ['health', 'ready'] });
    toast.success('Service health refreshed');
  }

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.3 }}
      className="space-y-9"
    >
      <section className="flex flex-col justify-between gap-5 border-b border-border pb-7 sm:flex-row sm:items-end">
        <div>
          <p className="mb-3 text-[11px] font-bold uppercase text-teal-800 dark:text-teal-300">Operations</p>
          <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-[38px]">Good systems start with clarity.</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Your platform at a glance. Current indicators are read directly from the API.</p>
        </div>
        <Button type="button" variant="secondary" onClick={() => void refreshHealth()} disabled={health.isFetching}>
          <RefreshCw className={`size-4 ${health.isFetching ? 'animate-spin' : ''}`} aria-hidden="true" />Refresh status
        </Button>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="Platform summary">
        <div className="flex min-h-38.5 flex-col justify-between border border-border bg-panel p-5">
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">API readiness <Activity className="size-4" aria-hidden="true" /></div>
          <div>
            <div className="flex items-center gap-2 text-2xl font-semibold">
              {health.isLoading ? 'Checking' : health.isError ? 'Unavailable' : healthy ? 'Operational' : 'Degraded'}
              {!health.isLoading && !health.isError && (healthy
                ? <CircleCheck className="size-5 text-emerald-700 dark:text-emerald-400" aria-label="Healthy" />
                : <CircleX className="size-5 text-coral-700 dark:text-coral-300" aria-label="Unavailable" />)}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Postgres, Redis and automation</p>
          </div>
        </div>
        <div className="flex min-h-38.5 flex-col justify-between border border-border bg-panel p-5">
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">Last check <Clock3 className="size-4" aria-hidden="true" /></div>
          <div>
            <div className="text-2xl font-semibold">{health.data?.timestamp ? new Date(health.data.timestamp).toLocaleTimeString() : 'Not checked'}</div>
            <p className="mt-1 text-xs text-muted-foreground">Refreshes every 30 seconds</p>
          </div>
        </div>
        <a href="#health" className="group flex min-h-38.5 flex-col justify-between border border-border bg-amber-50 p-5 transition-colors hover:bg-amber-100 dark:bg-amber-950/30 dark:hover:bg-amber-950/50 sm:col-span-2 xl:col-span-1">
          <div className="flex items-center justify-between text-xs font-semibold text-amber-950 dark:text-amber-100">Infrastructure <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" /></div>
          <div>
            <div className="text-2xl font-semibold text-amber-950 dark:text-amber-100">{health.data?.checks ? `${Object.values(health.data.checks).filter((value) => value === 'ok').length}/${Object.keys(health.data.checks).length}` : 'Live check'}</div>
            <p className="mt-1 text-xs text-amber-900/70 dark:text-amber-200/70">Dependencies reporting healthy</p>
          </div>
        </a>
      </section>

      <section id="health" className="scroll-mt-24">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div><h2 className="text-lg font-semibold">Service health</h2><p className="mt-1 text-sm text-muted-foreground">Live readiness checks from the platform API.</p></div>
          <span className="hidden text-xs text-muted-foreground sm:block">Auto-refresh: 30 sec</span>
        </div>
        <div className="overflow-hidden border border-border bg-panel">
          {health.isLoading ? (
            <div className="space-y-4 p-5" aria-label="Loading service status">{[0, 1, 2].map((item) => <div key={item} className="h-12 animate-pulse bg-muted" />)}</div>
          ) : health.isError ? (
            <div className="flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div><p className="font-medium">Health data is unavailable</p><p className="mt-1 text-sm text-muted-foreground">The API did not return a readiness report. Check the API URL and service logs.</p></div>
              <Button variant="secondary" onClick={() => void health.refetch()}>Try again</Button>
            </div>
          ) : (
            <div>
              <div className="grid grid-cols-[1fr_auto] border-b border-border px-5 py-3 text-[10px] font-bold uppercase text-muted-foreground"><span>Dependency</span><span>Status</span></div>
              {Object.entries(health.data?.checks ?? {}).map(([key, status]) => (
                <div key={key} className="grid grid-cols-[1fr_auto] items-center border-b border-border px-5 py-4 last:border-b-0">
                  <span className="text-sm font-medium">{dependencyNames[key] ?? key}</span>
                  <span className={`inline-flex items-center gap-2 text-xs font-semibold ${status === 'ok' ? 'text-emerald-800 dark:text-emerald-300' : 'text-coral-800 dark:text-coral-300'}`}>
                    <span className={`size-2 rounded-full ${status === 'ok' ? 'bg-emerald-600' : 'bg-coral-600'}`} />{status === 'ok' ? 'Operational' : 'Unavailable'}
                  </span>
                </div>
              ))}
              {Object.keys(health.data?.checks ?? {}).length === 0 && <p className="p-5 text-sm text-muted-foreground">The API did not report dependency checks.</p>}
            </div>
          )}
        </div>
      </section>
    </motion.div>
  );
}