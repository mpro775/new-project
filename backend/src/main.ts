import { NestFactory } from '@nestjs/core';
import { VersioningType } from '@nestjs/common';
import { AppModule } from './app.module';
import { SecurityService } from './modules/security/security.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // الحصول على خدمة الأمان
  const securityService = app.get(SecurityService);

  // إعداد CORS
  const corsConfig = securityService.getCorsConfig();
  app.enableCors(corsConfig);

  // إعداد Trust Proxy
  const trustProxy = securityService.getTrustProxyConfig();
  if (trustProxy) {
    app.set('trust proxy', trustProxy);
  }

  // إعداد Helmet (Security Headers)
  const helmetConfig = securityService.getHelmetConfig();
  app.use(helmetConfig);

  // إعداد Rate Limiting
  const rateLimitMiddleware = securityService.getRateLimitMiddleware();
  app.use(rateLimitMiddleware);

  // إعداد Compression
  const compressionConfig = securityService.getCompressionConfig();
  app.use(compressionConfig);

  // إعداد API Versioning
  const apiVersioningConfig = securityService.getApiVersioningConfig();
  if (apiVersioningConfig.enabled) {
    app.enableVersioning({
      type: VersioningType.HEADER,
      header: apiVersioningConfig.header,
      defaultVersion: apiVersioningConfig.defaultVersion,
    });

    // إعداد Global Prefix
    app.setGlobalPrefix(apiVersioningConfig.globalPrefix);
  }

  // إعداد HTTPS Enforcement (في الإنتاج)
  const httpsConfig = securityService.getHttpsConfig();
  if (httpsConfig.enforce && process.env.NODE_ENV === 'production') {
    app.use((req, res, next) => {
      if (req.header('x-forwarded-proto') !== 'https') {
        res.redirect(`https://${req.header('host')}${req.url}`);
      } else {
        next();
      }
    });

    // إعداد HSTS
    app.use((req, res, next) => {
      res.setHeader('Strict-Transport-Security', `max-age=${httpsConfig.hsts.maxAge}; includeSubDomains; preload`);
      next();
    });
  }

  // إعداد Sanitization Pipe كـ Global Pipe
  // سيتم تطبيقه تلقائياً على جميع المدخلات

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  console.log(`🚀 التطبيق يعمل على: http://localhost:${port}`);
  console.log(`📝 البيئة: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔒 الأمان مفعل: ${httpsConfig.enforce ? 'نعم' : 'لا'}`);
  console.log(`🔄 Rate Limiting: مفعل`);
  console.log(`🛡️ Security Headers: مفعل`);
  console.log(`🗜️ Compression: مفعل`);
}
void bootstrap();
