import { apiClient } from './api-client';
import type { HealthReport, RuntimeMetrics } from '@/types/auth';

export async function getReadiness(): Promise<HealthReport> {
  const { data } = await apiClient.get<HealthReport>('/health/ready', {
    validateStatus: (status) => status === 200 || status === 503,
  });
  return data;
}

export async function getRuntimeMetrics(): Promise<RuntimeMetrics> {
  const { data } = await apiClient.get<string>('/metrics', {
    responseType: 'text',
    transformResponse: [(value) => value],
  });

  function sample(name: string): number | null {
    const rows = data.split('\n').filter((line) => line.startsWith(name));
    let total = 0;
    let found = false;
    for (const row of rows) {
      const match = row.match(/\s(-?[0-9]+(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?)$/);
      if (!match) continue;
      total += Number(match[1]);
      found = true;
    }
    return found ? total : null;
  }

  const userCpu = sample('process_cpu_user_seconds_total');
  const systemCpu = sample('process_cpu_system_seconds_total');

  return {
    httpRequestsTotal: sample('ai_agency_http_requests_total'),
    processCpuSeconds: userCpu === null && systemCpu === null ? null : (userCpu ?? 0) + (systemCpu ?? 0),
    processMemoryBytes: sample('process_resident_memory_bytes'),
    timestamp: new Date().toISOString(),
  };
}