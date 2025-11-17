import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  Response,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Response as ExpressResponse } from 'express';
import { OtelService } from './otel/otel.service';
import { PrometheusService } from './prometheus/prometheus.service';
import { HealthService } from './health/health.service';
import { SentryService } from './sentry/sentry.service';
import { LoggingService } from './logging/logging.service';
import { DashboardService } from './dashboards/dashboard.service';
import { Permissions } from '../../common/decorators/permissions.decorator';

@Controller('monitoring')
export class MonitoringController {
  constructor(
    private readonly otel: OtelService,
    private readonly prometheus: PrometheusService,
    private readonly health: HealthService,
    private readonly sentry: SentryService,
    private readonly logging: LoggingService,
    private readonly dashboard: DashboardService,
  ) {}

  // ========== OpenTelemetry ==========

  /**
   * معلومات OpenTelemetry
   */
  @Get('otel/info')
  @Permissions('monitoring.admin')
  getOtelInfo() {
    return this.otel.getOtelInfo();
  }

  // ========== Prometheus ==========

  /**
   * مقاييس Prometheus
   */
  @Get('metrics')
  @Permissions('monitoring.metrics')
  async getMetrics(@Response({ passthrough: true }) res: ExpressResponse) {
    const metrics = await this.prometheus.getMetrics();

    res.set({
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
    });

    return metrics;
  }

  /**
   * معلومات Prometheus
   */
  @Get('prometheus/info')
  @Permissions('monitoring.admin')
  getPrometheusInfo() {
    return this.prometheus.getPrometheusInfo();
  }

  /**
   * تنظيف المقاييس القديمة
   */
  @Post('prometheus/cleanup')
  @Permissions('monitoring.admin')
  async cleanupMetrics() {
    const deletedCount = await this.prometheus.cleanupOldMetrics();
    return {
      message: 'تم تنظيف المقاييس القديمة بنجاح',
      deletedMetrics: deletedCount,
    };
  }

  // ========== Health Checks ==========

  /**
   * فحص صحة شامل
   */
  @Get('health')
  async getHealth() {
    return this.health.checkAllHealth();
  }

  /**
   * فحص صحة مفصل لقاعدة البيانات
   */
  @Get('health/database')
  @Permissions('monitoring.health')
  async getDatabaseHealth() {
    return this.health.checkDatabaseHealth();
  }

  /**
   * فحص صحة مفصل للكاش
   */
  @Get('health/cache')
  @Permissions('monitoring.health')
  async getCacheHealth() {
    return this.health.checkCacheHealth();
  }

  /**
   * فحص صحة مفصل للتطبيق
   */
  @Get('health/app')
  @Permissions('monitoring.health')
  async getApplicationHealth() {
    return this.health.checkApplicationHealth();
  }

  /**
   * فحص صحة الشبكة
   */
  @Get('health/network')
  @Permissions('monitoring.health')
  async getNetworkHealth() {
    return this.health.checkNetworkHealth();
  }

  /**
   * فحص صحة مخصص
   */
  @Post('health/custom')
  @Permissions('monitoring.admin')
  async runCustomHealthCheck(@Body() body: { name: string; checkFn: string }) {
    try {
      // تحذير: هذا غير آمن في الإنتاج - يُستخدم للاختبار فقط
      const checkFn = new Function('return ' + body.checkFn)();
      return this.health.runCustomCheck(body.name, checkFn);
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
      };
    }
  }

  // ========== Sentry ==========

  /**
   * معلومات Sentry
   */
  @Get('sentry/info')
  @Permissions('monitoring.admin')
  getSentryInfo() {
    return this.sentry.getSentryInfo();
  }

  /**
   * اختبار Sentry
   */
  @Post('sentry/test')
  @Permissions('monitoring.admin')
  async testSentry() {
    const success = await this.sentry.testSentry();
    return {
      success,
      message: success ? 'تم إرسال رسالة اختبار إلى Sentry' : 'فشل في إرسال رسالة الاختبار',
    };
  }

  // ========== Logging ==========

  /**
   * البحث في السجلات
   */
  @Get('logs')
  @Permissions('monitoring.logs')
  async searchLogs(@Query() query: any) {
    return this.logging.queryLogs(query);
  }

  /**
   * إحصائيات السجلات
   */
  @Get('logs/stats')
  @Permissions('monitoring.logs')
  async getLogStats() {
    return this.logging.getLogStats();
  }

  /**
   * تصدير السجلات
   */
  @Get('logs/export')
  @Permissions('monitoring.logs')
  async exportLogs(@Query() query: any, @Query('format') format: string = 'json') {
    const data = await this.logging.exportLogs(query, format as 'json' | 'csv');

    return {
      format,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * تنظيف السجلات القديمة
   */
  @Post('logs/cleanup')
  @Permissions('monitoring.admin')
  async cleanupLogs(@Body() body: { daysToKeep?: number }) {
    const daysToKeep = body.daysToKeep || 30;
    const deletedCount = await this.logging.cleanupOldLogs(daysToKeep);

    return {
      message: 'تم تنظيف السجلات القديمة بنجاح',
      deletedFiles: deletedCount,
      daysToKeep,
    };
  }

  /**
   * معلومات السجل
   */
  @Get('logging/info')
  @Permissions('monitoring.admin')
  getLoggingInfo() {
    return this.logging.getLoggingInfo();
  }

  // ========== Dashboards ==========

  /**
   * قائمة لوحات التحكم
   */
  @Get('dashboards')
  @Permissions('monitoring.dashboards')
  async getDashboards(@Query('category') category?: string) {
    return this.dashboard.getDashboards(category);
  }

  /**
   * لوحة تحكم محددة
   */
  @Get('dashboards/:dashboardId')
  @Permissions('monitoring.dashboards')
  async getDashboard(@Param('dashboardId') dashboardId: string) {
    const result = await this.dashboard.getDashboard(dashboardId);
    if (!result) {
      return { error: 'لوحة التحكم غير موجودة' };
    }
    return result;
  }

  /**
   * إنشاء لوحة تحكم مخصصة
   */
  @Post('dashboards')
  @Permissions('monitoring.dashboards')
  async createDashboard(@Body() dashboard: any, @Query('userId') userId?: string) {
    return this.dashboard.createDashboard(dashboard, userId || 'system');
  }

  /**
   * تحديث لوحة تحكم
   */
  @Post('dashboards/:dashboardId')
  @Permissions('monitoring.dashboards')
  async updateDashboard(
    @Param('dashboardId') dashboardId: string,
    @Body() updates: any,
    @Query('userId') userId?: string,
  ) {
    return this.dashboard.updateDashboard(dashboardId, updates, userId || 'system');
  }

  /**
   * حذف لوحة تحكم
   */
  @Delete('dashboards/:dashboardId')
  @Permissions('monitoring.dashboards')
  async deleteDashboard(
    @Param('dashboardId') dashboardId: string,
    @Query('userId') userId?: string,
  ) {
    const success = await this.dashboard.deleteDashboard(dashboardId, userId || 'system');
    return {
      success,
      message: success ? 'تم حذف لوحة التحكم بنجاح' : 'فشل في حذف لوحة التحكم',
    };
  }

  /**
   * إحصائيات لوحات التحكم
   */
  @Get('dashboards/stats')
  @Permissions('monitoring.dashboards')
  getDashboardStats() {
    return this.dashboard.getDashboardStats();
  }

  // ========== معلومات عامة ==========

  /**
   * معلومات شاملة عن نظام المراقبة
   */
  @Get('info')
  @Permissions('monitoring.admin')
  getMonitoringInfo() {
    return {
      otel: this.otel.getOtelInfo(),
      prometheus: this.prometheus.getPrometheusInfo(),
      sentry: this.sentry.getSentryInfo(),
      logging: this.logging.getLoggingInfo(),
      dashboards: this.dashboard.getDashboardStats(),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * اختبار شامل لنظام المراقبة
   */
  @Post('test')
  @Permissions('monitoring.admin')
  @HttpCode(HttpStatus.OK)
  async testMonitoring() {
    const results = {
      health: false,
      metrics: false,
      logs: false,
      dashboards: false,
      sentry: false,
    };

    try {
      // اختبار الصحة
      const health = await this.health.checkAllHealth();
      results.health = health.overall.status === 'healthy';

      // اختبار المقاييس
      const metrics = await this.prometheus.getMetrics();
      results.metrics = metrics.length > 0;

      // اختبار السجلات
      const logs = await this.logging.queryLogs({ limit: 1 });
      results.logs = true;

      // اختبار لوحات التحكم
      const dashboards = await this.dashboard.getDashboards();
      results.dashboards = dashboards.length > 0;

      // اختبار Sentry
      results.sentry = await this.sentry.testSentry();

    } catch (error) {
      // في حالة فشل أي اختبار، سيبقى false
    }

    const allPassed = Object.values(results).every(result => result);

    return {
      success: allPassed,
      results,
      message: allPassed
        ? 'جميع اختبارات نظام المراقبة نجحت'
        : 'بعض اختبارات نظام المراقبة فشلت',
      timestamp: new Date().toISOString(),
    };
  }
}
