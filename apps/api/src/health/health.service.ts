import { Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import Redis from 'ioredis';
import { environment } from '../config/env';

export type DependencyStatus = 'ok' | 'unavailable';

export interface ReadinessResult {
  status: 'ok' | 'unavailable';
  checks: {
    postgres: DependencyStatus;
    redis: DependencyStatus;
    n8n: DependencyStatus;
  };
  timestamp: string;
}

@Injectable()
export class HealthService {
  constructor(
    private readonly postgres: Pool,
    private readonly redis: Redis,
  ) {}

  live(): { status: 'ok'; timestamp: string } {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  async readiness(): Promise<ReadinessResult> {
    const [postgres, redis, n8n] = await Promise.all([
      this.checkPostgres(),
      this.checkRedis(),
      this.checkN8n(),
    ]);

    const checks = { postgres, redis, n8n };
    const ready = Object.values(checks).every((status) => status === 'ok');

    return {
      status: ready ? 'ok' : 'unavailable',
      checks,
      timestamp: new Date().toISOString(),
    };
  }

  private async checkPostgres(): Promise<DependencyStatus> {
    try {
      await this.postgres.query('SELECT 1');
      return 'ok';
    } catch {
      return 'unavailable';
    }
  }

  private async checkRedis(): Promise<DependencyStatus> {
    try {
      const response = await this.redis.ping();
      return response === 'PONG' ? 'ok' : 'unavailable';
    } catch {
      return 'unavailable';
    }
  }

  private async checkN8n(): Promise<DependencyStatus> {
    try {
      const response = await fetch(
        new URL('/healthz/readiness', environment.N8N_BASE_URL),
        { signal: AbortSignal.timeout(environment.HEALTH_CHECK_TIMEOUT_MS) },
      );
      return response.ok ? 'ok' : 'unavailable';
    } catch {
      return 'unavailable';
    }
  }
}
