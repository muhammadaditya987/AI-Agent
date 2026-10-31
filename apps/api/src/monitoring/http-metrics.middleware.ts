import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { performance } from 'node:perf_hooks';
import { MetricsService } from './metrics.service';

@Injectable()
export class HttpMetricsMiddleware implements NestMiddleware {
  constructor(private readonly metrics: MetricsService) {}

  use(request: Request, response: Response, next: NextFunction): void {
    if (request.path === '/metrics' || request.path === '/api/v1/metrics') {
      next();
      return;
    }

    const startedAt = performance.now();
    response.once('finish', () => {
      const routePath = request.route?.path;
      const route =
        typeof routePath === 'string'
          ? `${request.baseUrl}${routePath}`
          : 'unmatched';

      this.metrics.recordHttpRequest(
        request.method,
        route,
        response.statusCode,
        (performance.now() - startedAt) / 1000,
      );
    });

    next();
  }
}
