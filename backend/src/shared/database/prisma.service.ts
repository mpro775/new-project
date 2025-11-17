import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  private connectionStartTime: number;

  constructor(private readonly configService: ConfigService) {
    const dbConfig = configService.get('database');

    super({
      datasourceUrl: dbConfig.url,
      // Connection Pool Configuration
      log: dbConfig.logging.map((level) => ({
        emit: 'event',
        level,
      })),
    });

    // تطبيق إعدادات Connection Pool إذا كانت متاحة
    if (this.$connect && typeof this.$connect === 'function') {
      // Prisma Client configuration for connection pooling
      // Note: Prisma handles connection pooling internally
      // Additional configuration can be added here if needed
    }

    this.connectionStartTime = Date.now();
  }

  async onModuleInit() {
    try {
      const startTime = Date.now();
      await this.$connect();
      const connectionTime = Date.now() - startTime;

      this.logger.log(`Prisma connected successfully in ${connectionTime}ms`);

      // اختبار الاتصال
      await this.$queryRaw`SELECT 1`;

      const totalInitTime = Date.now() - this.connectionStartTime;
      this.logger.log(
        `Database initialization completed in ${totalInitTime}ms`,
      );
    } catch (error) {
      this.logger.error('Failed to connect to database', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    this.logger.log('Disconnecting from database...');
    await this.$disconnect();
    this.logger.log('Database disconnected successfully');
  }

  /**
   * تنفيذ استعلام مع قياس الأداء
   */
  async executeWithMetrics<T>(
    operation: () => Promise<T>,
    operationName: string,
  ): Promise<T> {
    const startTime = Date.now();

    try {
      const result = await operation();
      const duration = Date.now() - startTime;

      const dbConfig = this.configService.get('database');
      const slowQueryThreshold = dbConfig?.monitor?.slowQueryThreshold || 1000;

      if (duration > slowQueryThreshold) {
        this.logger.warn(
          `Slow database operation: ${operationName} (${duration}ms)`,
        );
      }

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `Database operation failed: ${operationName} (${duration}ms)`,
        error,
      );
      throw error;
    }
  }

  /**
   * الحصول على إحصائيات الاتصال
   */
  async getConnectionStats() {
    try {
      // محاولة الحصول على معلومات الاتصال من PostgreSQL
      const stats = await this.$queryRaw`
        SELECT
          count(*) as active_connections,
          sum(case when state = 'active' then 1 else 0 end) as active_queries,
          sum(case when state = 'idle' then 1 else 0 end) as idle_connections
        FROM pg_stat_activity
        WHERE datname = current_database()
      `;

      return stats[0];
    } catch (error) {
      this.logger.warn('Could not retrieve connection stats', error);
      return null;
    }
  }

  /**
   * تنظيف الاتصالات الميتة
   */
  async cleanupDeadConnections() {
    try {
      await this.$queryRaw`
        SELECT pg_terminate_backend(pid)
        FROM pg_stat_activity
        WHERE datname = current_database()
          AND state = 'idle'
          AND state_change < now() - interval '5 minutes'
      `;

      this.logger.log('Dead connections cleaned up');
    } catch (error) {
      this.logger.warn('Could not cleanup dead connections', error);
    }
  }

  /**
   * تحليل أداء الاستعلامات
   */
  async analyzeQueryPerformance() {
    try {
      const slowQueries = await this.$queryRaw`
        SELECT
          query,
          calls,
          total_time,
          mean_time,
          rows
        FROM pg_stat_statements
        WHERE mean_time > 1000
        ORDER BY mean_time DESC
        LIMIT 10
      `;

      return slowQueries;
    } catch (error) {
      this.logger.warn(
        'pg_stat_statements not available for query analysis',
        error,
      );
      return [];
    }
  }
}
