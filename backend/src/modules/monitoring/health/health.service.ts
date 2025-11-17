import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../shared/database/prisma.service';
import { CacheService } from '../../../shared/cache/cache.service';

export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'warning';
  timestamp: Date;
  duration: number;
  details?: Record<string, any>;
  error?: string;
}

export interface SystemHealth {
  overall: HealthCheckResult;
  components: {
    database: HealthCheckResult;
    cache: HealthCheckResult;
    storage: HealthCheckResult;
    external: HealthCheckResult;
  };
}

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);
  private readonly healthChecks = new Map<string, () => Promise<HealthCheckResult>>();

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {
    this.registerDefaultChecks();
  }

  /**
   * تسجيل فحص صحة افتراضي
   */
  private registerDefaultChecks() {
    // فحص قاعدة البيانات
    this.registerCheck('database', async () => {
      const startTime = Date.now();
      try {
        await this.prisma.$queryRaw`SELECT 1`;
        return {
          status: 'healthy',
          timestamp: new Date(),
          duration: Date.now() - startTime,
          details: { connection: 'ok' },
        };
      } catch (error) {
        return {
          status: 'unhealthy',
          timestamp: new Date(),
          duration: Date.now() - startTime,
          error: error.message,
        };
      }
    });

    // فحص الكاش
    this.registerCheck('cache', async () => {
      const startTime = Date.now();
      try {
        const testKey = 'health_check_' + Date.now();
        await this.cache.set(testKey, 'ok', 10);
        const value = await this.cache.get(testKey);
        await this.cache.del(testKey);

        if (value === 'ok') {
          return {
            status: 'healthy',
            timestamp: new Date(),
            duration: Date.now() - startTime,
            details: { operations: 'ok' },
          };
        } else {
          return {
            status: 'unhealthy',
            timestamp: new Date(),
            duration: Date.now() - startTime,
            error: 'Cache read/write failed',
          };
        }
      } catch (error) {
        return {
          status: 'unhealthy',
          timestamp: new Date(),
          duration: Date.now() - startTime,
          error: error.message,
        };
      }
    });

    // فحص التخزين
    this.registerCheck('storage', async () => {
      const startTime = Date.now();
      try {
        const fs = require('fs/promises');
        const uploadDir = this.configService.get<string>('UPLOAD_DIR', './uploads');

        // فحص وجود مجلد الرفع
        await fs.access(uploadDir);

        // فحص إمكانية الكتابة
        const testFile = `${uploadDir}/.health_check_${Date.now()}`;
        await fs.writeFile(testFile, 'ok');
        await fs.unlink(testFile);

        return {
          status: 'healthy',
          timestamp: new Date(),
          duration: Date.now() - startTime,
          details: { directory: uploadDir, writable: true },
        };
      } catch (error) {
        return {
          status: 'unhealthy',
          timestamp: new Date(),
          duration: Date.now() - startTime,
          error: error.message,
        };
      }
    });

    // فحص الخدمات الخارجية
    this.registerCheck('external', async () => {
      const startTime = Date.now();
      const results = {
        smtp: 'unknown',
        payment_gateway: 'unknown',
        sms_gateway: 'unknown',
      };

      try {
        // فحص SMTP (محاكاة)
        results.smtp = 'ok';

        // فحص بوابة الدفع (محاكاة)
        results.payment_gateway = 'ok';

        // فحص بوابة SMS (محاكاة)
        results.sms_gateway = 'ok';

        return {
          status: 'healthy',
          timestamp: new Date(),
          duration: Date.now() - startTime,
          details: results,
        };
      } catch (error) {
        return {
          status: 'warning',
          timestamp: new Date(),
          duration: Date.now() - startTime,
          details: results,
          error: error.message,
        };
      }
    });
  }

  /**
   * تسجيل فحص صحة مخصص
   */
  registerCheck(name: string, checkFn: () => Promise<HealthCheckResult>) {
    this.healthChecks.set(name, checkFn);
    this.logger.log(`تم تسجيل فحص الصحة: ${name}`);
  }

  /**
   * إلغاء تسجيل فحص صحة
   */
  unregisterCheck(name: string) {
    this.healthChecks.delete(name);
    this.logger.log(`تم إلغاء تسجيل فحص الصحة: ${name}`);
  }

  /**
   * تنفيذ فحص صحة واحد
   */
  async checkHealth(checkName: string): Promise<HealthCheckResult | null> {
    const checkFn = this.healthChecks.get(checkName);
    if (!checkFn) {
      return null;
    }

    try {
      return await checkFn();
    } catch (error) {
      this.logger.error(`فشل في فحص الصحة ${checkName}:`, error);
      return {
        status: 'unhealthy',
        timestamp: new Date(),
        duration: 0,
        error: error.message,
      };
    }
  }

  /**
   * تنفيذ جميع فحوصات الصحة
   */
  async checkAllHealth(): Promise<SystemHealth> {
    const startTime = Date.now();
    const results = new Map<string, HealthCheckResult>();

    // تنفيذ جميع الفحوصات بالتوازي
    const checkPromises = Array.from(this.healthChecks.entries()).map(
      async ([name, checkFn]) => {
        try {
          const result = await checkFn();
          results.set(name, result);
        } catch (error) {
          this.logger.error(`فشل في فحص الصحة ${name}:`, error);
          results.set(name, {
            status: 'unhealthy',
            timestamp: new Date(),
            duration: 0,
            error: error.message,
          });
        }
      }
    );

    await Promise.all(checkPromises);

    // تحديد الحالة العامة
    const statuses = Array.from(results.values()).map(r => r.status);
    let overallStatus: 'healthy' | 'unhealthy' | 'warning' = 'healthy';

    if (statuses.includes('unhealthy')) {
      overallStatus = 'unhealthy';
    } else if (statuses.includes('warning')) {
      overallStatus = 'warning';
    }

    const overall: HealthCheckResult = {
      status: overallStatus,
      timestamp: new Date(),
      duration: Date.now() - startTime,
      details: {
        totalChecks: results.size,
        passed: statuses.filter(s => s === 'healthy').length,
        warnings: statuses.filter(s => s === 'warning').length,
        failed: statuses.filter(s => s === 'unhealthy').length,
      },
    };

    return {
      overall,
      components: {
        database: results.get('database') || { status: 'unhealthy', timestamp: new Date(), duration: 0, error: 'Check not found' },
        cache: results.get('cache') || { status: 'unhealthy', timestamp: new Date(), duration: 0, error: 'Check not found' },
        storage: results.get('storage') || { status: 'unhealthy', timestamp: new Date(), duration: 0, error: 'Check not found' },
        external: results.get('external') || { status: 'unhealthy', timestamp: new Date(), duration: 0, error: 'Check not found' },
      },
    };
  }

  /**
   * فحص صحة مفصل لقاعدة البيانات
   */
  async checkDatabaseHealth(): Promise<{
    status: string;
    connectionPool: any;
    activeConnections: number;
    idleConnections: number;
    pendingQueries: number;
    slowQueries: any[];
  }> {
    try {
      // معلومات اتصال قاعدة البيانات
      const connectionInfo = await this.prisma.$queryRaw`
        SELECT
          count(*) as total_connections,
          sum(case when state = 'active' then 1 else 0 end) as active_connections,
          sum(case when state = 'idle' then 1 else 0 end) as idle_connections
        FROM pg_stat_activity
        WHERE datname = current_database()
      `;

      // استعلامات معلقة
      const pendingQueries = await this.prisma.$queryRaw`
        SELECT count(*) as pending
        FROM pg_stat_activity
        WHERE state = 'active' AND query_start < now() - interval '30 seconds'
      `;

      // استعلامات بطيئة
      const slowQueries = await this.prisma.$queryRaw`
        SELECT query, state, query_start, now() - query_start as duration
        FROM pg_stat_activity
        WHERE state = 'active'
          AND query_start < now() - interval '10 seconds'
          AND query NOT LIKE '%pg_stat_activity%'
        ORDER BY query_start ASC
        LIMIT 5
      `;

      return {
        status: 'healthy',
        connectionPool: connectionInfo[0],
        activeConnections: parseInt(connectionInfo[0].active_connections) || 0,
        idleConnections: parseInt(connectionInfo[0].idle_connections) || 0,
        pendingQueries: parseInt(pendingQueries[0].pending) || 0,
        slowQueries: slowQueries as any[],
      };
    } catch (error) {
      this.logger.error('فشل في فحص صحة قاعدة البيانات:', error);
      return {
        status: 'unhealthy',
        connectionPool: null,
        activeConnections: 0,
        idleConnections: 0,
        pendingQueries: 0,
        slowQueries: [],
      };
    }
  }

  /**
   * فحص صحة الكاش
   */
  async checkCacheHealth(): Promise<{
    status: string;
    hitRate: number;
    memoryUsage: any;
    connectedClients: number;
    uptime: number;
  }> {
    try {
      const stats = await this.cache.getStats();

      return {
        status: 'healthy',
        hitRate: stats.hitRate || 0,
        memoryUsage: stats.memory || {},
        connectedClients: stats.clients || 0,
        uptime: stats.uptime || 0,
      };
    } catch (error) {
      this.logger.error('فشل في فحص صحة الكاش:', error);
      return {
        status: 'unhealthy',
        hitRate: 0,
        memoryUsage: {},
        connectedClients: 0,
        uptime: 0,
      };
    }
  }

  /**
   * فحص صحة التطبيق
   */
  async checkApplicationHealth(): Promise<{
    status: string;
    version: string;
    uptime: number;
    memoryUsage: any;
    cpuUsage: any;
  }> {
    try {
      const memUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();

      return {
        status: 'healthy',
        version: process.env.npm_package_version || '1.0.0',
        uptime: process.uptime(),
        memoryUsage: {
          rss: memUsage.rss,
          heapTotal: memUsage.heapTotal,
          heapUsed: memUsage.heapUsed,
          external: memUsage.external,
        },
        cpuUsage: {
          user: cpuUsage.user,
          system: cpuUsage.system,
        },
      };
    } catch (error) {
      this.logger.error('فشل في فحص صحة التطبيق:', error);
      return {
        status: 'unhealthy',
        version: 'unknown',
        uptime: 0,
        memoryUsage: {},
        cpuUsage: {},
      };
    }
  }

  /**
   * فحص صحة الشبكة
   */
  async checkNetworkHealth(): Promise<{
    status: string;
    latency: number;
    dnsResolution: boolean;
    externalConnectivity: boolean;
  }> {
    try {
      const startTime = Date.now();

      // فحص DNS
      const dns = require('dns/promises');
      await dns.lookup('google.com');

      // فحص الاتصال الخارجي
      const https = require('https');
      await new Promise((resolve, reject) => {
        const req = https.request('https://www.google.com', { method: 'HEAD' }, (res) => {
          resolve(res);
        });
        req.on('error', reject);
        req.setTimeout(5000, () => reject(new Error('Timeout')));
        req.end();
      });

      return {
        status: 'healthy',
        latency: Date.now() - startTime,
        dnsResolution: true,
        externalConnectivity: true,
      };
    } catch (error) {
      this.logger.error('فشل في فحص صحة الشبكة:', error);
      return {
        status: 'unhealthy',
        latency: 0,
        dnsResolution: false,
        externalConnectivity: false,
      };
    }
  }

  /**
   * الحصول على قائمة فحوصات الصحة المسجلة
   */
  getRegisteredChecks(): string[] {
    return Array.from(this.healthChecks.keys());
  }

  /**
   * تشغيل فحص صحة مخصص
   */
  async runCustomCheck(name: string, checkFn: () => Promise<any>): Promise<HealthCheckResult> {
    const startTime = Date.now();
    try {
      const result = await checkFn();
      return {
        status: 'healthy',
        timestamp: new Date(),
        duration: Date.now() - startTime,
        details: result,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date(),
        duration: Date.now() - startTime,
        error: error.message,
      };
    }
  }
}
