import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { SecurityService } from '../src/modules/security/security.service';

async function testSecurity() {
  try {
    console.log('🔒 بدء اختبار إعدادات الأمان...');

    const app = await NestFactory.createApplicationContext(AppModule);
    const securityService = app.get(SecurityService);

    // اختبار التحقق من صحة الإعدادات
    console.log('✅ التحقق من صحة الإعدادات...');
    const validation = securityService.validateSecurityConfig();
    console.log('نتيجة التحقق:', validation);

    if (!validation.valid) {
      console.error('❌ أخطاء في الإعدادات:', validation.errors);
      process.exit(1);
    }

    // اختبار الحصول على تقرير الأمان
    console.log('📊 الحصول على تقرير الأمان...');
    const report = securityService.getSecurityReport();
    console.log('البيئة:', report.environment);
    console.log('عدد التوصيات:', report.recommendations.length);

    // اختبار إعدادات CORS
    console.log('🌐 اختبار إعدادات CORS...');
    const corsConfig = securityService.getCorsConfig();
    console.log('CORS origins:', corsConfig.origin);

    // اختبار إعدادات Rate Limiting
    console.log('🔄 اختبار إعدادات Rate Limiting...');
    const rateLimitConfig = securityService.getCorsConfig();
    console.log('Rate limit config available:', !!rateLimitConfig);

    // اختبار إعدادات HTTPS
    console.log('🔒 اختبار إعدادات HTTPS...');
    const httpsConfig = securityService.getHttpsConfig();
    console.log('HTTPS enforced:', httpsConfig.enforce);

    // اختبار إعدادات API Versioning
    console.log('🏷️ اختبار إعدادات API Versioning...');
    const apiVersioningConfig = securityService.getApiVersioningConfig();
    console.log('API versioning enabled:', apiVersioningConfig.enabled);
    console.log('Default version:', apiVersioningConfig.defaultVersion);

    await app.close();
    console.log('🎉 تم الانتهاء من اختبار إعدادات الأمان بنجاح!');

  } catch (error) {
    console.error('❌ فشل في اختبار إعدادات الأمان:', error);
    process.exit(1);
  }
}

testSecurity();
