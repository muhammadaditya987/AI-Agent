import {
  Injectable,
  OnApplicationShutdown,
} from '@nestjs/common';
import { Pool } from 'pg';
import Redis from 'ioredis';

@Injectable()
export class InfrastructureLifecycle implements OnApplicationShutdown {
  constructor(
    private readonly postgres: Pool,
    private readonly redis: Redis,
  ) {}

  async onApplicationShutdown(): Promise<void> {
    await this.postgres.end();
    this.redis.disconnect();
  }
}
