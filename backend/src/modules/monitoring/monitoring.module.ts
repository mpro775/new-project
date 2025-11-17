import { Module, Global } from '@nestjs/common';
import { OtelService } from './otel/otel.service';
import { PrometheusService } from './prometheus/prometheus.service';
import { HealthService } from './health/health.service';
import { SentryService } from './sentry/sentry.service';
import { LoggingService } from './logging/logging.service';
import { DashboardService } from './dashboards/dashboard.service';
import { MonitoringController } from './monitoring.controller';
import { PrismaService } from '../../shared/database/prisma.service';
import { CacheService } from '../../shared/cache/cache.service';

@Global()
@Module({
  controllers: [MonitoringController],
  providers: [
    OtelService,
    PrometheusService,
    HealthService,
    SentryService,
    LoggingService,
    DashboardService,
    PrismaService,
    CacheService,
  ],
  exports: [
    OtelService,
    PrometheusService,
    HealthService,
    SentryService,
    LoggingService,
    DashboardService,
  ],
})
export class MonitoringModule {}
