import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { OtelService } from '../src/modules/monitoring/otel/otel.service';
import { PrometheusService } from '../src/modules/monitoring/prometheus/prometheus.service';
import { HealthService } from '../src/modules/monitoring/health/health.service';
import { SentryService } from '../src/modules/monitoring/sentry/sentry.service';
import { LoggingService } from '../src/modules/monitoring/logging/logging.service';
import { DashboardService } from '../src/modules/monitoring/dashboards/dashboard.service';

async function testMonitoringModule() {
  console.log('🩺 اختبار نظام المراقبة (Monitoring System)...');

  const app = await NestFactory.createApplicationContext(AppModule);
  const otel = app.get(OtelService);
  const prometheus = app.get(PrometheusService);
  const health = app.get(HealthService);
  const sentry = app.get(SentryService);
  const logging = app.get(LoggingService);
  const dashboard = app.get(DashboardService);

  try {
    // تسجيل الدخول والحصول على المستخدم
    console.log('🔐 تسجيل الدخول...');
    const loginResponse = await fetch('http://localhost:3000/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'password123',
      }),
    });

    if (!loginResponse.ok) {
      throw new Error('فشل في تسجيل الدخول');
    }

    const loginData = await loginResponse.json();
    const testUserId = loginData.user.id;
    console.log(`✅ تم تسجيل الدخول بنجاح، المستخدم: ${testUserId}`);

    // اختبار OpenTelemetry
    console.log('📊 اختبار OpenTelemetry...');
    const otelInfo = otel.getOtelInfo();
    console.log(`✅ معلومات OpenTelemetry: ${otelInfo.serviceName} v${otelInfo.serviceVersion}`);

    // إنشاء span تجريبي
    const span = otel.createSpan('test-monitoring-span');
    span.setAttribute('test', 'monitoring-system');
    span.end();
    console.log(`✅ تم إنشاء span تجريبي`);

    // اختبار Prometheus
    console.log('📈 اختبار Prometheus...');
    const prometheusInfo = prometheus.getPrometheusInfo();
    console.log(`✅ Prometheus: ${prometheusInfo.metricsCount} مقياس`);

    // تسجيل مقياس تجريبي
    prometheus.updateBusinessMetric('test_metric_created', 1);
    console.log(`✅ تم تسجيل مقياس أعمال تجريبي`);

    // اختبار Health Checks
    console.log('🏥 اختبار فحوصات الصحة...');
    const healthResult = await health.checkAllHealth();
    console.log(`✅ حالة النظام: ${healthResult.overall.status}`);

    // فحص صحة قاعدة البيانات
    const dbHealth = await health.checkDatabaseHealth();
    console.log(`✅ قاعدة البيانات: ${dbHealth.status}`);

    // فحص صحة الكاش
    const cacheHealth = await health.checkCacheHealth();
    console.log(`✅ الكاش: ${cacheHealth.status}`);

    // فحص صحة التطبيق
    const appHealth = await health.checkApplicationHealth();
    console.log(`✅ التطبيق: ${appHealth.status}, uptime: ${appHealth.uptime}s`);

    // اختبار Sentry
    console.log('🐛 اختبار Sentry...');
    const sentryInfo = sentry.getSentryInfo();
    console.log(`✅ Sentry: ${sentryInfo.initialized ? 'مهيأ' : 'غير مهيأ'}`);

    // إرسال رسالة تجريبية
    sentry.captureMessage('رسالة اختبار من نظام المراقبة', {
      level: 'info',
      tags: { test: 'monitoring-system' },
    });
    console.log(`✅ تم إرسال رسالة تجريبية إلى Sentry`);

    // اختبار Logging
    console.log('📝 اختبار نظام السجل...');
    const loggingInfo = logging.getLoggingInfo();
    console.log(`✅ السجل: ${loggingInfo.logFilePath}`);

    // تسجيل رسالة تجريبية
    logging.logWithMetadata('info', 'رسالة اختبار من نظام المراقبة', {
      context: 'MONITORING_TEST',
      userId: testUserId,
      extra: { test: true },
    });
    console.log(`✅ تم تسجيل رسالة تجريبية`);

    // البحث في السجلات
    const logSearch = await logging.queryLogs({
      context: 'MONITORING_TEST',
      limit: 5,
    });
    console.log(`✅ تم العثور على ${logSearch.logs.length} سجل`);

    // إحصائيات السجلات
    const logStats = await logging.getLogStats();
    console.log(`✅ إحصائيات السجل: ${logStats.totalLogs} سجل إجمالي`);

    // اختبار Dashboards
    console.log('📊 اختبار لوحات التحكم...');
    const dashboardStats = dashboard.getDashboardStats();
    console.log(`✅ لوحات التحكم: ${dashboardStats.totalDashboards} لوحة، ${dashboardStats.totalWidgets} ودجت`);

    // الحصول على قائمة لوحات التحكم
    const dashboards = await dashboard.getDashboards();
    console.log(`✅ تم العثور على ${dashboards.length} لوحة تحكم`);

    // الحصول على لوحة محددة
    if (dashboards.length > 0) {
      const dashboardData = await dashboard.getDashboard(dashboards[0].id);
      if (dashboardData) {
        console.log(`✅ لوحة "${dashboardData.dashboard.name}": ${Object.keys(dashboardData.data).length} ودجت`);
      }
    }

    // اختبار API endpoints
    console.log('🌐 اختبار API endpoints...');

    // فحص الصحة
    const healthResponse = await fetch('http://localhost:3000/monitoring/health');
    if (healthResponse.ok) {
      console.log(`✅ Health check API: ${healthResponse.status}`);
    }

    // مقاييس Prometheus
    const metricsResponse = await fetch('http://localhost:3000/monitoring/metrics');
    if (metricsResponse.ok) {
      const metrics = await metricsResponse.text();
      console.log(`✅ Metrics API: ${metrics.length} حرف`);
    }

    // اختبار شامل
    console.log('🧪 إجراء اختبار شامل...');
    const testResponse = await fetch('http://localhost:3000/monitoring/test', {
      method: 'POST',
    });

    if (testResponse.ok) {
      const testResult = await testResponse.json();
      console.log(`✅ اختبار شامل: ${testResult.success ? 'نجح' : 'فشل'}`);
      console.log(`   - الصحة: ${testResult.results.health}`);
      console.log(`   - المقاييس: ${testResult.results.metrics}`);
      console.log(`   - السجلات: ${testResult.results.logs}`);
      console.log(`   - لوحات التحكم: ${testResult.results.dashboards}`);
      console.log(`   - Sentry: ${testResult.results.sentry}`);
    }

    console.log('🎉 تم إنجاز جميع اختبارات نظام المراقبة بنجاح!');

  } catch (error) {
    console.error('❌ فشل في اختبار نظام المراقبة:', error);
  } finally {
    await app.close();
  }
}

// تشغيل الاختبار
if (require.main === module) {
  testMonitoringModule();
}

export { testMonitoringModule };
