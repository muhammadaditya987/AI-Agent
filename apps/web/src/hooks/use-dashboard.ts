'use client';

import { useQuery } from '@tanstack/react-query';
import { getApprovals, getRuns, getUpcomingSchedules, getUsage } from '@/services/dashboard-service';
import { getReadiness, getRuntimeMetrics } from '@/services/health-service';

export function useDashboardData() {
  const health = useQuery({ queryKey: ['health', 'ready'], queryFn: getReadiness, refetchInterval: 30_000 });
  const metrics = useQuery({ queryKey: ['runtime', 'metrics'], queryFn: getRuntimeMetrics, refetchInterval: 30_000 });
  const usage = useQuery({ queryKey: ['dashboard', 'usage'], queryFn: getUsage, retry: false, refetchInterval: 60_000 });
  const runningRuns = useQuery({ queryKey: ['dashboard', 'runs', 'running'], queryFn: () => getRuns('running'), retry: false, refetchInterval: 15_000 });
  const allRuns = useQuery({ queryKey: ['dashboard', 'runs', 'recent'], queryFn: () => getRuns(), retry: false, refetchInterval: 30_000 });
  const approvals = useQuery({ queryKey: ['dashboard', 'approvals'], queryFn: getApprovals, retry: false, refetchInterval: 30_000 });
  const schedules = useQuery({ queryKey: ['dashboard', 'schedules'], queryFn: getUpcomingSchedules, retry: false, refetchInterval: 60_000 });

  return { health, metrics, usage, runningRuns, allRuns, approvals, schedules };
}
