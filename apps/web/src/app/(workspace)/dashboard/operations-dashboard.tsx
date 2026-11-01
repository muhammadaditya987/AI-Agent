'use client';

import { useQueryClient } from '@tanstack/react-query';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Activity, ArrowUpRight, Bot, CheckSquare2, CircleCheck, CircleX, Clock3,
  Cpu, Database, HardDrive, RefreshCw, Users, Workflow,
} from 'lucide-react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useDashboardData } from '@/hooks/use-dashboard';

const dependencyNames: Record<string, string> = { postgres: 'PostgreSQL', redis: 'Redis', n8n: 'Automation engine' };

function formatBytes(bytes: number | null | undefined) {
  if (bytes == null) return 'Unavailable';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) { value /= 1024; unit += 1; }
  return `${value >= 10 || unit === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[unit]}`;
}

function MetricCard({ label, value, detail, icon: Icon, unavailable = false }: { label: string; value: string; detail: string; icon: typeof Users; unavailable?: boolean }) {
  return (
    <div className="min-h-29.5 border border-border bg-panel p-4">
      <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground"><span>{label}</span><Icon className="size-4" aria-hidden="true" /></div>
      <p className={`mt-4 text-2xl font-semibold tabular-nums ${unavailable ? 'text-muted-foreground' : ''}`}>{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}

function ChartCard({ title, value, data, color = '#087c68', type = 'area' }: { title: string; value: string; data: Array<{ name: string; value: number }> | null; color?: string; type?: 'area' | 'bar' }) {
  return (
    <div className="min-h-65 border border-border bg-panel p-5">
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
      <div className="mt-5 h-45">
        {data?.length ? (
          <ResponsiveContainer width="100%" height="100%">
            {type === 'bar' ? (
              <BarChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: 'var(--muted)' }} contentStyle={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12 }} />
                <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} />
              </BarChart>
            ) : (
              <AreaChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                <defs><linearGradient id={`fill-${title}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity={0.28} /><stop offset="100%" stopColor={color} stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12 }} />
                <Area type="monotone" dataKey="value" stroke={color} fill={`url(#fill-${title})`} strokeWidth={2} />
              </AreaChart>
            )}
          </ResponsiveContainer>
        ) : <div className="grid h-full place-items-center border border-dashed border-border text-xs text-muted-foreground">No live chart data</div>}
      </div>
    </div>
  );
}

export function OperationsDashboard() {
  const { health, metrics, usage, runningRuns, allRuns, approvals, schedules } = useDashboardData();
  const queryClient = useQueryClient();
  const reduceMotion = useReducedMotion();
  const healthy = health.data?.status === 'ok';
  const usageData = usage.data;
  const runningCount = runningRuns.data?.data.length;
  const pendingCount = approvals.data?.data.length;
  const recentRuns = allRuns.data?.data ?? [];
  const scheduled = schedules.data?.data ?? [];

  async function refresh() {
    await queryClient.invalidateQueries();
    toast.success('Dashboard refreshed');
  }

  const revenueData = usageData?.revenue == null ? null : [{ name: 'Current', value: usageData.revenue }];
  const creditsData = usageData?.credits == null ? null : [{ name: 'Current', value: usageData.credits }];
  const jobsData = usageData?.aiJobs == null && usageData?.jobs == null ? null : [{ name: 'Current', value: usageData?.aiJobs ?? usageData?.jobs ?? 0 }];
  const workflowData = runningCount == null ? null : [{ name: 'Running', value: runningCount }];
  const storageData = usageData?.storageBytes == null ? null : [{ name: 'Current', value: usageData.storageBytes }];

  return (
    <motion.div initial={reduceMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduceMotion ? 0 : 0.3 }} className="space-y-8">
      <section className="flex flex-col justify-between gap-5 border-b border-border pb-7 sm:flex-row sm:items-end">
        <div><p className="mb-3 text-[11px] font-bold uppercase text-teal-800 dark:text-teal-300">Operations</p><h1 className="font-display text-3xl font-semibold tracking-tight sm:text-[38px]">Command center</h1><p className="mt-2 text-sm text-muted-foreground">Live platform operations and tenant activity.</p></div>
        <Button variant="secondary" onClick={() => void refresh()}><RefreshCw className={`size-4 ${health.isFetching || metrics.isFetching ? 'animate-spin' : ''}`} aria-hidden="true" />Refresh</Button>
      </section>

      <section className="grid grid-cols-2 gap-px border border-border bg-border lg:grid-cols-4 xl:grid-cols-6" aria-label="Platform metrics">
        <MetricCard label="Total clients" value={usageData?.clients?.toLocaleString() ?? 'Unavailable'} detail={usage.isLoading ? 'Loading usage API' : usage.error ? 'Usage API unavailable' : 'Live tenant usage'} icon={Users} unavailable={usageData?.clients == null} />
        <MetricCard label="Total projects" value={usageData?.projects?.toLocaleString() ?? 'Unavailable'} detail={usage.error ? 'Usage API unavailable' : 'Live tenant usage'} icon={Database} unavailable={usageData?.projects == null} />
        <MetricCard label="AI jobs" value={(usageData?.aiJobs ?? usageData?.jobs)?.toLocaleString() ?? 'Unavailable'} detail="Usage aggregate" icon={Bot} unavailable={usageData?.aiJobs == null && usageData?.jobs == null} />
        <MetricCard label="Credits" value={usageData?.credits?.toLocaleString() ?? 'Unavailable'} detail="Available usage credits" icon={CircleCheck} unavailable={usageData?.credits == null} />
        <MetricCard label="Revenue" value={usageData?.revenue == null ? 'Unavailable' : `$${usageData.revenue.toLocaleString()}`} detail="Reported tenant revenue" icon={ArrowUpRight} unavailable={usageData?.revenue == null} />
        <MetricCard label="Pending tasks" value={pendingCount?.toLocaleString() ?? 'Unavailable'} detail={approvals.error ? 'Approvals API unavailable' : 'Pending approvals'} icon={CheckSquare2} unavailable={pendingCount == null} />
        <MetricCard label="Running workflow" value={runningCount?.toLocaleString() ?? 'Unavailable'} detail={runningRuns.error ? 'Runs API unavailable' : 'Currently running'} icon={Workflow} unavailable={runningCount == null} />
        <MetricCard label="Storage" value={formatBytes(usageData?.storageBytes)} detail={usageData?.storageBytes == null ? 'Usage API value unavailable' : 'Reported storage usage'} icon={HardDrive} unavailable={usageData?.storageBytes == null} />
        <MetricCard label="CPU" value={metrics.data?.processCpuSeconds == null ? 'Unavailable' : `${metrics.data.processCpuSeconds.toFixed(2)} sec`} detail="Process CPU seconds" icon={Cpu} unavailable={metrics.data?.processCpuSeconds == null} />
        <MetricCard label="Memory" value={formatBytes(metrics.data?.processMemoryBytes)} detail="Resident process memory" icon={Activity} unavailable={metrics.data?.processMemoryBytes == null} />
        <MetricCard label="API status" value={health.isLoading ? 'Checking' : health.isError ? 'Unavailable' : healthy ? 'Operational' : 'Degraded'} detail="Live readiness endpoint" icon={healthy ? CircleCheck : CircleX} unavailable={!healthy && !health.isLoading} />
        <MetricCard label="HTTP requests" value={metrics.data?.httpRequestsTotal?.toLocaleString() ?? 'Unavailable'} detail="Process lifetime requests" icon={Clock3} unavailable={metrics.data?.httpRequestsTotal == null} />
      </section>

      <section className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <ChartCard title="Revenue" value={usageData?.revenue == null ? 'No live data' : `$${usageData.revenue.toLocaleString()}`} data={revenueData} color="#087c68" />
        <ChartCard title="Credits" value={usageData?.credits == null ? 'No live data' : usageData.credits.toLocaleString()} data={creditsData} color="#b95e45" />
        <ChartCard title="AI jobs" value={usageData?.aiJobs == null && usageData?.jobs == null ? 'No live data' : String(usageData?.aiJobs ?? usageData?.jobs ?? 0)} data={jobsData} color="#4a6fa5" type="bar" />
        <ChartCard title="Workflow" value={runningCount == null ? 'No live data' : `${runningCount} running`} data={workflowData} color="#7a6c9d" type="bar" />
        <ChartCard title="Storage" value={usageData?.storageBytes == null ? 'No live data' : formatBytes(usageData.storageBytes)} data={storageData} color="#c4933c" />
      </section>

      <section className="grid gap-4 xl:grid-cols-12">
        <div className="border border-border bg-panel xl:col-span-5"><div className="border-b border-border px-5 py-4"><h2 className="text-sm font-semibold">Recent activities</h2><p className="mt-1 text-xs text-muted-foreground">Latest workflow runs</p></div><div className="divide-y divide-border">{recentRuns.length ? recentRuns.slice(0, 6).map((run) => <div key={run.runId} className="flex items-center justify-between gap-4 px-5 py-4"><div className="min-w-0"><p className="truncate text-sm font-medium">{run.workflowId}</p><p className="mt-1 text-xs text-muted-foreground">{run.status} · {new Date(run.createdAt).toLocaleString()}</p></div><span className="text-xs font-semibold uppercase text-muted-foreground">{run.status}</span></div>) : <div className="grid min-h-48 place-items-center px-5 text-center text-xs text-muted-foreground">{allRuns.error ? 'Runs endpoint unavailable or tenant not configured.' : 'No recent workflow runs.'}</div>}</div></div>
        <div className="border border-border bg-panel xl:col-span-4"><div className="border-b border-border px-5 py-4"><h2 className="text-sm font-semibold">AI queue</h2><p className="mt-1 text-xs text-muted-foreground">Running and pending work</p></div><div className="divide-y divide-border"><div className="flex items-center justify-between px-5 py-4"><span className="text-sm">Running</span><strong className="text-sm tabular-nums">{runningCount ?? '—'}</strong></div><div className="flex items-center justify-between px-5 py-4"><span className="text-sm">Pending approvals</span><strong className="text-sm tabular-nums">{pendingCount ?? '—'}</strong></div><div className="flex items-center justify-between px-5 py-4"><span className="text-sm">Queue status</span><strong className="text-xs text-muted-foreground">{runningRuns.error || approvals.error ? 'Endpoint unavailable' : 'Live API'}</strong></div></div></div>
        <div className="border border-border bg-panel xl:col-span-3"><div className="border-b border-border px-5 py-4"><h2 className="text-sm font-semibold">Upcoming schedule</h2><p className="mt-1 text-xs text-muted-foreground">Enabled workflow schedules</p></div><div className="divide-y divide-border">{scheduled.length ? scheduled.slice(0, 6).map((item) => <div key={item.scheduleId} className="px-5 py-4"><p className="truncate text-sm font-medium">{item.workflowId}</p><p className="mt-1 text-xs text-muted-foreground">{new Date(item.nextRunAt).toLocaleString()}</p></div>) : <div className="grid min-h-48 place-items-center px-5 text-center text-xs text-muted-foreground">{schedules.error ? 'Schedules endpoint unavailable or tenant not configured.' : 'No upcoming schedules.'}</div>}</div></div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="border border-border bg-panel"><div className="border-b border-border px-5 py-4"><h2 className="text-sm font-semibold">Latest videos</h2></div><div className="grid min-h-40 place-items-center px-5 text-center"><p className="max-w-sm text-xs text-muted-foreground">No content listing endpoint is implemented. This widget will activate when the API exposes a video asset resource.</p></div></div>
        <div className="border border-border bg-panel"><div className="border-b border-border px-5 py-4"><h2 className="text-sm font-semibold">Notification center</h2></div><div className="divide-y divide-border">{!healthy && health.data ? <div className="px-5 py-4 text-sm">A dependency is reporting degraded readiness.</div> : null}{pendingCount ? <div className="px-5 py-4 text-sm">{pendingCount} workflow approval{pendingCount === 1 ? '' : 's'} need attention.</div> : null}{healthy && !pendingCount && !health.isLoading ? <div className="grid min-h-32 place-items-center px-5 text-xs text-muted-foreground">No pending operational notifications.</div> : null}</div></div>
      </section>

      <section id="health" className="scroll-mt-24 border border-border bg-panel">
        <div className="flex items-end justify-between border-b border-border px-5 py-4"><div><h2 className="text-sm font-semibold">Service health</h2><p className="mt-1 text-xs text-muted-foreground">Live readiness checks</p></div><span className="text-xs text-muted-foreground">30 sec refresh</span></div>
        {health.isLoading ? <div className="space-y-3 p-5">{[0, 1, 2].map((item) => <div key={item} className="h-8 animate-pulse bg-muted" />)}</div> : health.isError ? <div className="p-5 text-sm">Health data is unavailable.</div> : <div>{Object.entries(health.data?.checks ?? {}).map(([key, status]) => <div key={key} className="flex items-center justify-between border-b border-border px-5 py-4 last:border-b-0"><span className="text-sm font-medium">{dependencyNames[key] ?? key}</span><span className={`text-xs font-semibold ${status === 'ok' ? 'text-emerald-700 dark:text-emerald-300' : 'text-coral-700 dark:text-coral-300'}`}>{status === 'ok' ? 'Operational' : 'Unavailable'}</span></div>)}</div>}
      </section>
    </motion.div>
  );
}
