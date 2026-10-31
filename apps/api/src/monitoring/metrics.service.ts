import { Injectable } from '@nestjs/common';
import {
  collectDefaultMetrics,
  Counter,
  Histogram,
  Registry,
} from '@prometheus-io/client';

const HTTP_METHODS = new Set([
  'CONNECT',
  'DELETE',
  'GET',
  'HEAD',
  'OPTIONS',
  'PATCH',
  'POST',
  'PUT',
  'TRACE',
]);

@Injectable()
export class MetricsService {
  private readonly registry = new Registry();
  private readonly httpRequests = new Counter({
    name: 'ai_agency_http_requests_total',
    help: 'Total number of completed HTTP requests.',
    labelNames: ['method', 'route', 'status_code'],
    registers: [],
  });
  private readonly httpRequestDuration = new Histogram({
    name: 'ai_agency_http_request_duration_seconds',
    help: 'Duration of completed HTTP requests in seconds.',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
    registers: [],
  });

  constructor() {
    this.registry.registerMetric(this.httpRequests);
    this.registry.registerMetric(this.httpRequestDuration);
    collectDefaultMetrics({ register: this.registry });
  }

  recordHttpRequest(
    method: string,
    route: string,
    statusCode: number,
    durationSeconds: number,
  ): void {
    const labels = {
      method: HTTP_METHODS.has(method) ? method : 'OTHER',
      route,
      status_code: String(statusCode),
    };

    this.httpRequests.inc(labels);
    this.httpRequestDuration.observe(labels, durationSeconds);
  }

  async metrics(): Promise<string> {
    return this.registry.metrics();
  }

  contentType(): string {
    return this.registry.contentType;
  }
}
