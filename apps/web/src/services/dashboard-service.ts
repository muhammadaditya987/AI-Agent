import { apiClient } from './api-client';
import type {
  DashboardApproval,
  DashboardRun,
  DashboardSchedule,
  PaginatedResult,
  UsageAggregate,
} from '@/types/auth';

function tenantPath(path: string): string | null {
  const tenantId = process.env.NEXT_PUBLIC_TENANT_ID;
  if (!tenantId) return null;
  return `/api/v1/tenants/${encodeURIComponent(tenantId)}${path}`;
}

export async function getUsage(): Promise<UsageAggregate> {
  const path = tenantPath('/usage');
  if (!path) throw new Error('TENANT_NOT_CONFIGURED');
  const { data } = await apiClient.get<UsageAggregate>(path);
  return data;
}

export async function getRuns(status?: string): Promise<PaginatedResult<DashboardRun>> {
  const path = tenantPath('/runs');
  if (!path) throw new Error('TENANT_NOT_CONFIGURED');
  const { data } = await apiClient.get<PaginatedResult<DashboardRun>>(path, {
    params: { status, limit: 50 },
  });
  return data;
}

export async function getApprovals(): Promise<PaginatedResult<DashboardApproval>> {
  const path = tenantPath('/approvals');
  if (!path) throw new Error('TENANT_NOT_CONFIGURED');
  const { data } = await apiClient.get<PaginatedResult<DashboardApproval>>(path, {
    params: { status: 'pending', limit: 50 },
  });
  return data;
}

export async function getUpcomingSchedules(): Promise<PaginatedResult<DashboardSchedule>> {
  const path = tenantPath('/schedules');
  if (!path) throw new Error('TENANT_NOT_CONFIGURED');
  const { data } = await apiClient.get<PaginatedResult<DashboardSchedule>>(path, {
    params: { enabled: true, limit: 50 },
  });
  return data;
}
