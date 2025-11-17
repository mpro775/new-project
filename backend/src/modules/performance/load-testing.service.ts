import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../shared/database/prisma.service';
import { CacheOptimizationService } from './cache-optimization.service';
import { QueryOptimizationService } from './query-optimization.service';

export interface LoadTestConfig {
  duration: number; // مدة الاختبار بالثواني
  concurrency: number; // عدد الطلبات المتزامنة
  rampUp: number; // وقت البدء التدريجي بالثواني
  endpoints: LoadTestEndpoint[];
}

export interface LoadTestEndpoint {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  weight: number; // وزن الـ endpoint في الاختبار
  payload?: any; // البيانات المرسلة (للـ POST/PUT)
  headers?: Record<string, string>;
}

export interface LoadTestResult {
  timestamp: Date;
  config: LoadTestConfig;
  summary: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    minResponseTime: number;
    maxResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
    requestsPerSecond: number;
    errorRate: number;
  };
  endpoints: LoadTestEndpointResult[];
  recommendations: string[];
}

export interface LoadTestEndpointResult {
  endpoint: string;
  method: string;
  requests: number;
  successful: number;
  failed: number;
  averageResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  errorRate: number;
}

@Injectable()
export class LoadTestingService {
  private readonly logger = new Logger(LoadTestingService.name);
  private activeTests = new Map<string, { abort: () => void }>();

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly cacheOptimization: CacheOptimizationService,
    private readonly queryOptimization: QueryOptimizationService,
  ) {}

  /**
   * إنشاء اختبار حمل افتراضي للنظام
   */
  createDefaultLoadTest(): LoadTestConfig {
    const baseUrl = this.configService.get('app.apiPrefix') || 'api/v1';

    return {
      duration: 60, // 60 ثانية
      concurrency: 50, // 50 طلب متزامن
      rampUp: 10, // 10 ثواني لبدء تدريجي
      endpoints: [
        {
          url: `/${baseUrl}/products`,
          method: 'GET',
          weight: 30, // 30% من الطلبات
          headers: { 'Content-Type': 'application/json' },
        },
        {
          url: `/${baseUrl}/sales`,
          method: 'GET',
          weight: 25, // 25% من الطلبات
          headers: { 'Content-Type': 'application/json' },
        },
        {
          url: `/${baseUrl}/inventory`,
          method: 'GET',
          weight: 20, // 20% من الطلبات
          headers: { 'Content-Type': 'application/json' },
        },
        {
          url: `/${baseUrl}/customers`,
          method: 'GET',
          weight: 15, // 15% من الطلبات
          headers: { 'Content-Type': 'application/json' },
        },
        {
          url: `/${baseUrl}/reports/sales`,
          method: 'GET',
          weight: 10, // 10% من الطلبات
          headers: { 'Content-Type': 'application/json' },
        },
      ],
    };
  }

  /**
   * تشغيل اختبار الحمل
   */
  async runLoadTest(config: LoadTestConfig): Promise<LoadTestResult> {
    const testId = `load_test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    this.logger.log(`Starting load test: ${testId}`);
    this.logger.log(`Config: ${config.concurrency} concurrent users, ${config.duration}s duration`);

    const results: LoadTestEndpointResult[] = config.endpoints.map(endpoint => ({
      endpoint: endpoint.url,
      method: endpoint.method,
      requests: 0,
      successful: 0,
      failed: 0,
      averageResponseTime: 0,
      minResponseTime: Infinity,
      maxResponseTime: 0,
      errorRate: 0,
    }));

    const responseTimes: number[] = [];
    let totalRequests = 0;
    let successfulRequests = 0;
    let failedRequests = 0;

    // إنشاء AbortController لإيقاف الاختبار
    const abortController = new AbortController();
    this.activeTests.set(testId, { abort: () => abortController.abort() });

    const startTime = Date.now();
    const endTime = startTime + (config.duration * 1000);

    try {
      // مرحلة البدء التدريجي
      if (config.rampUp > 0) {
        await this.rampUpPhase(config, abortController.signal);
      }

      // مرحلة الاختبار الرئيسية
      const testPromises = Array.from({ length: config.concurrency }, (_, i) =>
        this.runUserSimulation(i, config, results, responseTimes, abortController.signal)
      );

      await Promise.allSettled(testPromises);

      // حساب الإحصائيات النهائية
      totalRequests = results.reduce((sum, r) => sum + r.requests, 0);
      successfulRequests = results.reduce((sum, r) => sum + r.successful, 0);
      failedRequests = results.reduce((sum, r) => sum + r.failed, 0);

      // حساب إحصائيات الأوقات
      responseTimes.sort((a, b) => a - b);
      const averageResponseTime = responseTimes.length > 0
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
        : 0;

      const minResponseTime = responseTimes.length > 0 ? responseTimes[0] : 0;
      const maxResponseTime = responseTimes.length > 0 ? responseTimes[responseTimes.length - 1] : 0;

      const p95Index = Math.floor(responseTimes.length * 0.95);
      const p99Index = Math.floor(responseTimes.length * 0.99);

      const p95ResponseTime = responseTimes[p95Index] || 0;
      const p99ResponseTime = responseTimes[p99Index] || 0;

      const actualDuration = (Date.now() - startTime) / 1000;
      const requestsPerSecond = totalRequests / actualDuration;
      const errorRate = totalRequests > 0 ? (failedRequests / totalRequests) * 100 : 0;

      // تحديث إحصائيات الـ endpoints
      results.forEach(result => {
        result.errorRate = result.requests > 0 ? (result.failed / result.requests) * 100 : 0;
      });

      // توليد التوصيات
      const recommendations = this.generateRecommendations({
        averageResponseTime,
        errorRate,
        requestsPerSecond,
        p95ResponseTime,
        totalRequests,
      });

      const testResult: LoadTestResult = {
        timestamp: new Date(),
        config,
        summary: {
          totalRequests,
          successfulRequests,
          failedRequests,
          averageResponseTime,
          minResponseTime,
          maxResponseTime,
          p95ResponseTime,
          p99ResponseTime,
          requestsPerSecond,
          errorRate,
        },
        endpoints: results,
        recommendations,
      };

      this.logger.log(`Load test completed: ${testId}`);
      this.logger.log(`Results: ${totalRequests} requests, ${requestsPerSecond.toFixed(2)} req/s, ${errorRate.toFixed(2)}% errors`);

      return testResult;

    } catch (error) {
      this.logger.error(`Load test failed: ${testId}`, error);
      throw error;
    } finally {
      this.activeTests.delete(testId);
    }
  }

  /**
   * إيقاف اختبار الحمل
   */
  stopLoadTest(testId: string): boolean {
    const test = this.activeTests.get(testId);
    if (test) {
      test.abort();
      this.activeTests.delete(testId);
      this.logger.log(`Load test stopped: ${testId}`);
      return true;
    }
    return false;
  }

  /**
   * الحصول على اختبارات الحمل النشطة
   */
  getActiveTests(): string[] {
    return Array.from(this.activeTests.keys());
  }

  /**
   * تشغيل اختبار أداء قاعدة البيانات
   */
  async runDatabasePerformanceTest(): Promise<{
    connectionPoolTest: any;
    queryPerformanceTest: any;
    concurrentConnectionsTest: any;
  }> {
    const results = {
      connectionPoolTest: null,
      queryPerformanceTest: null,
      concurrentConnectionsTest: null,
    };

    // اختبار Connection Pool
    results.connectionPoolTest = await this.testConnectionPool();

    // اختبار أداء الاستعلامات
    results.queryPerformanceTest = await this.testQueryPerformance();

    // اختبار الاتصالات المتزامنة
    results.concurrentConnectionsTest = await this.testConcurrentConnections();

    return results;
  }

  /**
   * تشغيل اختبار أداء الكاش
   */
  async runCachePerformanceTest(): Promise<{
    cacheHitRate: number;
    cacheLatency: number;
    cacheOptimization: any;
  }> {
    const startTime = Date.now();

    // الحصول على إحصائيات الكاش
    const cacheStats = await this.cacheOptimization.getCacheStats();

    // تشغيل تحسين الكاش
    const optimizationResult = await this.cacheOptimization.performFullCacheOptimization();

    const cacheLatency = Date.now() - startTime;

    return {
      cacheHitRate: cacheStats.hitRate,
      cacheLatency,
      cacheOptimization: optimizationResult,
    };
  }

  // طرق خاصة

  private async rampUpPhase(config: LoadTestConfig, abortSignal: AbortSignal): Promise<void> {
    const rampUpInterval = config.rampUp * 1000 / config.concurrency;

    for (let i = 1; i <= config.concurrency; i++) {
      if (abortSignal.aborted) break;

      // بدء مستخدم واحد كل rampUpInterval
      setTimeout(() => {
        this.logger.debug(`Ramping up user ${i}/${config.concurrency}`);
      }, i * rampUpInterval);

      // انتظار قليل لتجنب التحميل المفاجئ
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // انتظار انتهاء مرحلة البدء التدريجي
    await new Promise(resolve => setTimeout(resolve, config.rampUp * 1000));
  }

  private async runUserSimulation(
    userId: number,
    config: LoadTestConfig,
    results: LoadTestEndpointResult[],
    responseTimes: number[],
    abortSignal: AbortSignal
  ): Promise<void> {
    const startTime = Date.now();
    const testDuration = config.duration * 1000;

    while (Date.now() - startTime < testDuration && !abortSignal.aborted) {
      // اختيار endpoint عشوائي بناءً على الوزن
      const selectedEndpoint = this.selectWeightedEndpoint(config.endpoints);
      const endpointIndex = config.endpoints.indexOf(selectedEndpoint);
      const result = results[endpointIndex];

      try {
        const requestStartTime = Date.now();

        // محاكاة الطلب (في الواقع سيتم استخدام HTTP client)
        await this.simulateHttpRequest(selectedEndpoint);

        const responseTime = Date.now() - requestStartTime;

        // تحديث الإحصائيات
        result.requests++;
        result.successful++;
        result.averageResponseTime =
          (result.averageResponseTime * (result.requests - 1) + responseTime) / result.requests;
        result.minResponseTime = Math.min(result.minResponseTime, responseTime);
        result.maxResponseTime = Math.max(result.maxResponseTime, responseTime);

        responseTimes.push(responseTime);

      } catch (error) {
        result.requests++;
        result.failed++;
      }

      // انتظار عشوائي بين الطلبات لمحاكاة سلوك المستخدم الطبيعي
      const waitTime = Math.random() * 1000 + 500; // 500-1500ms
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  private selectWeightedEndpoint(endpoints: LoadTestEndpoint[]): LoadTestEndpoint {
    const totalWeight = endpoints.reduce((sum, endpoint) => sum + endpoint.weight, 0);
    let random = Math.random() * totalWeight;

    for (const endpoint of endpoints) {
      random -= endpoint.weight;
      if (random <= 0) {
        return endpoint;
      }
    }

    return endpoints[0];
  }

  private async simulateHttpRequest(endpoint: LoadTestEndpoint): Promise<void> {
    // محاكاة طلب HTTP باستخدام Prisma للاستعلامات
    // في الواقع، سيتم استخدام axios أو fetch

    const startTime = Date.now();

    try {
      // محاكاة استدعاء الخدمات المختلفة
      if (endpoint.url.includes('/products')) {
        await this.prisma.product.findMany({ take: 10 });
      } else if (endpoint.url.includes('/sales')) {
        await this.prisma.salesInvoice.findMany({ take: 10 });
      } else if (endpoint.url.includes('/inventory')) {
        await this.prisma.stockItem.findMany({ take: 10 });
      } else if (endpoint.url.includes('/customers')) {
        await this.prisma.customer.findMany({ take: 10 });
      } else {
        // محاكاة استجابة سريعة للطلبات الأخرى
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      // محاكاة وقت استجابة إضافي
      const processingTime = Math.random() * 200 + 50; // 50-250ms
      await new Promise(resolve => setTimeout(resolve, processingTime));

    } catch (error) {
      throw error;
    }
  }

  private generateRecommendations(stats: {
    averageResponseTime: number;
    errorRate: number;
    requestsPerSecond: number;
    p95ResponseTime: number;
    totalRequests: number;
  }): string[] {
    const recommendations: string[] = [];

    if (stats.averageResponseTime > 1000) {
      recommendations.push('تحسين متوسط وقت الاستجابة (>1s) - فحص الفهارس وتحسين الاستعلامات');
    }

    if (stats.p95ResponseTime > 2000) {
      recommendations.push('تحسين استجابة P95 (>2s) - فحص الاختناقات في النظام');
    }

    if (stats.errorRate > 5) {
      recommendations.push('تقليل معدل الأخطاء (>5%) - فحص استقرار النظام والمعالجة');
    }

    if (stats.requestsPerSecond < 50) {
      recommendations.push('تحسين معدل الطلبات (<50 req/s) - فحص تحسينات الأداء');
    }

    if (stats.totalRequests < 1000) {
      recommendations.push('زيادة عدد الطلبات في الاختبار للحصول على نتائج أفضل');
    }

    recommendations.push('مراجعة استخدام الكاش وتحسين الاستعلامات');
    recommendations.push('فحص إعدادات Connection Pool وقاعدة البيانات');

    return recommendations;
  }

  private async testConnectionPool(): Promise<any> {
    const startTime = Date.now();

    // اختبار إنشاء عدة اتصالات
    const promises = Array.from({ length: 10 }, () =>
      this.prisma.$queryRaw`SELECT pg_sleep(0.1)`
    );

    await Promise.all(promises);

    const duration = Date.now() - startTime;

    return {
      test: 'Connection Pool',
      concurrentConnections: 10,
      totalDuration: duration,
      averageDuration: duration / 10,
    };
  }

  private async testQueryPerformance(): Promise<any> {
    const startTime = Date.now();

    // اختبار استفسارات مختلفة
    const tests = [
      this.prisma.product.count(),
      this.prisma.salesInvoice.findMany({ take: 100 }),
      this.prisma.stockItem.findMany({ where: { quantity: { gt: 0 } }, take: 50 }),
      this.prisma.customer.findMany({ take: 50 }),
    ];

    const results = await Promise.all(tests);

    const duration = Date.now() - startTime;

    return {
      test: 'Query Performance',
      queriesExecuted: tests.length,
      totalDuration: duration,
      averageQueryTime: duration / tests.length,
    };
  }

  private async testConcurrentConnections(): Promise<any> {
    const startTime = Date.now();

    // اختبار 50 اتصال متزامن
    const promises = Array.from({ length: 50 }, (_, i) =>
      this.prisma.$queryRaw`SELECT ${i} as connection_id, pg_sleep(0.05)`
    );

    const results = await Promise.all(promises);

    const duration = Date.now() - startTime;

    return {
      test: 'Concurrent Connections',
      totalConnections: 50,
      totalDuration: duration,
      averageConnectionTime: duration / 50,
    };
  }
}
