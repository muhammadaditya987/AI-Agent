export interface AuthUser {
  id: string;
  name: string;
  email: string;
  roles: string[];
  permissions: string[];
}

export interface AuthSession {
  user: AuthUser;
}

export interface HealthReport {
  status: 'ok' | 'unavailable' | 'error';
  timestamp?: string;
  checks?: Record<string, string>;
}

export interface RuntimeMetrics {
  httpRequestsTotal: number | null;
  processCpuSeconds: number | null;
  processMemoryBytes: number | null;
  timestamp: string;
}

export interface UsageAggregate {
  clients?: number;
  projects?: number;
  revenue?: number;
  credits?: number;
  jobs?: number;
  aiJobs?: number;
  pendingTasks?: number;
  workflowRuns?: number;
  storageBytes?: number;
  cpu?: number;
  memoryBytes?: number;
  timestamp?: string;
}

export interface DashboardRun {
  runId: string;
  workflowId: string;
  status: string;
  triggerType?: string;
  createdAt: string;
  completedAt?: string | null;
}

export interface DashboardApproval {
  approvalId: string;
  runId: string;
  status: string;
  summary: string;
  requestedAt: string;
  expiresAt: string;
}

export interface DashboardSchedule {
  scheduleId: string;
  workflowId: string;
  enabled: boolean;
  nextRunAt: string;
}

export interface PaginatedResult<T> {
  data: T[];
  page?: {
    limit?: number;
    nextCursor?: string | null;
    hasMore?: boolean;
  };
}