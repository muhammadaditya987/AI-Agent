import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { Pool } from 'pg';
import Redis from 'ioredis';
import { environment } from './config/env';
import { HealthController } from './health/health.controller';
import { HealthService } from './health/health.service';
import { InfrastructureLifecycle } from './infrastructure/infrastructure-lifecycle';
import { ContentFactoryController } from './content-factory/content-factory.controller';
import { ContentFactoryService } from './content-factory/content-factory.service';
import { InternalAutomationGuard } from './content-factory/internal-automation.guard';
import { NotionProjectsService } from './content-factory/notion-projects.service';
import { WhatsAppPreviewService } from './content-factory/whatsapp-preview.service';
import { HttpMetricsMiddleware } from './monitoring/http-metrics.middleware';
import { MetricsController } from './monitoring/metrics.controller';
import { MetricsService } from './monitoring/metrics.service';

const postgresProvider = {
  provide: Pool,
  useFactory: () =>
    new Pool({
      host: environment.DATABASE_HOST,
      port: environment.DATABASE_PORT,
      database: environment.DATABASE_NAME,
      user: environment.DATABASE_USER,
      password: environment.DATABASE_PASSWORD,
      max: 10,
      connectionTimeoutMillis: environment.HEALTH_CHECK_TIMEOUT_MS,
      query_timeout: environment.HEALTH_CHECK_TIMEOUT_MS,
      statement_timeout: environment.HEALTH_CHECK_TIMEOUT_MS,
      idleTimeoutMillis: 30000,
    }),
};

const redisProvider = {
  provide: Redis,
  useFactory: () =>
    new Redis({
      host: environment.REDIS_HOST,
      port: environment.REDIS_PORT,
      password: environment.REDIS_PASSWORD,
      db: environment.REDIS_DB,
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      commandTimeout: environment.HEALTH_CHECK_TIMEOUT_MS,
      connectTimeout: environment.HEALTH_CHECK_TIMEOUT_MS,
      retryStrategy: (attempt) => Math.min(attempt * 250, 2000),
    }),
};

@Module({
  controllers: [HealthController, ContentFactoryController, MetricsController],
  providers: [
    postgresProvider,
    redisProvider,
    HealthService,
    ContentFactoryService,
    NotionProjectsService,
    WhatsAppPreviewService,
    InternalAutomationGuard,
    InfrastructureLifecycle,
    MetricsService,
    HttpMetricsMiddleware,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(HttpMetricsMiddleware).forRoutes('*');
  }
}
