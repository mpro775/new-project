import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import * as rateLimit from 'express-rate-limit';
import * as compression from 'compression';

@Injectable()
export class SecurityService implements OnModuleInit {
  private readonly logger = new Logger(SecurityService.name);

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    this.logger.log('تم تهيئة خدمة الأمان');
  }

  /**
   * إنشاء إعدادات Rate Limiting
   */
  getRateLimitMiddleware() {
    const rateLimitConfig = this.configService.get('security.rateLimit');

    return rateLimit({
      windowMs: rateLimitConfig.windowMs,
      max: rateLimitConfig.max,
      message: rateLimitConfig.message,
      standardHeaders: rateLimitConfig.standardHeaders,
      legacyHeaders: rateLimitConfig.legacyHeaders,
      skip: (req) => {
        // تخطي rate limiting للطلبات من نفس الخادم
        const forwarded = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        return forwarded === '127.0.0.1' || forwarded === '::1';
      },
      handler: (req, res) => {
        this.logger.warn(`تم تجاوز حد الطلبات من IP: ${req.ip}, Path: ${req.path}`);
        res.status(429).json(rateLimitConfig.message);
      },
    });
  }

  /**
   * إنشاء إعدادات Helmet للأمان
   */
  getHelmetConfig() {
    const helmetConfig = this.configService.get('security.helmet');

    return helmet({
      contentSecurityPolicy: helmetConfig.contentSecurityPolicy,
      crossOriginEmbedderPolicy: helmetConfig.crossOriginEmbedderPolicy,
      hsts: helmetConfig.hsts,
      noSniff: helmetConfig.noSniff,
      xssFilter: helmetConfig.xssFilter,
      hidePoweredBy: helmetConfig.hidePoweredBy,
      frameguard: helmetConfig.frameguard,
      referrerPolicy: helmetConfig.referrerPolicy,
    });
  }

  /**
   * إنشاء إعدادات CORS
   */
  getCorsConfig() {
    return this.configService.get('security.cors');
  }

  /**
   * إنشاء إعدادات HTTPS Enforcement
   */
  getHttpsConfig() {
    return this.configService.get('security.https');
  }

  /**
   * إنشاء إعدادات Compression
   */
  getCompressionConfig() {
    return compression({
      level: 6, // مستوى الضغط (1-9)
      threshold: 1024, // لا تضغط الملفات الأصغر من 1KB
      filter: (req, res) => {
        // لا تضغط إذا كان الطلب يحتوي على 'x-no-compression'
        if (req.headers['x-no-compression']) {
          return false;
        }

        // ضغط الاستجابات النصية فقط
        return /json|text|javascript|css|xml|html/i.test(res.getHeader('Content-Type')?.toString() || '');
      },
    });
  }

  /**
   * إنشاء إعدادات API Versioning
   */
  getApiVersioningConfig() {
    return this.configService.get('security.apiVersioning');
  }

  /**
   * إعداد Trust Proxy
   */
  getTrustProxyConfig() {
    const httpsConfig = this.getHttpsConfig();
    return httpsConfig.trustProxy;
  }

  /**
   * التحقق من صحة الإعدادات الأمنية
   */
  validateSecurityConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    try {
      const rateLimitConfig = this.configService.get('security.rateLimit');
      if (!rateLimitConfig || !rateLimitConfig.windowMs || !rateLimitConfig.max) {
        errors.push('إعدادات Rate Limiting غير صحيحة');
      }

      const corsConfig = this.configService.get('security.cors');
      if (!corsConfig || !corsConfig.origin) {
        errors.push('إعدادات CORS غير صحيحة');
      }

      const helmetConfig = this.configService.get('security.helmet');
      if (!helmetConfig) {
        errors.push('إعدادات Helmet غير صحيحة');
      }

      return {
        valid: errors.length === 0,
        errors,
      };
    } catch (error) {
      return {
        valid: false,
        errors: [`خطأ في قراءة إعدادات الأمان: ${error.message}`],
      };
    }
  }

  /**
   * الحصول على تقرير الأمان
   */
  getSecurityReport() {
    const validation = this.validateSecurityConfig();

    return {
      timestamp: new Date(),
      environment: process.env.NODE_ENV || 'development',
      validation,
      configs: {
        rateLimiting: this.configService.get('security.rateLimit'),
        cors: this.configService.get('security.cors'),
        https: this.getHttpsConfig(),
        helmet: this.configService.get('security.helmet'),
        apiVersioning: this.getApiVersioningConfig(),
      },
      recommendations: this.generateRecommendations(validation.errors),
    };
  }

  private generateRecommendations(errors: string[]): string[] {
    const recommendations: string[] = [];

    if (errors.includes('إعدادات Rate Limiting غير صحيحة')) {
      recommendations.push('تحقق من متغيرات البيئة RATE_LIMIT_WINDOW_MS و RATE_LIMIT_MAX');
    }

    if (errors.includes('إعدادات CORS غير صحيحة')) {
      recommendations.push('تحقق من متغير البيئة CORS_ORIGIN');
    }

    if (process.env.NODE_ENV === 'production') {
      if (!process.env.HTTPS_ENFORCE || process.env.HTTPS_ENFORCE !== 'true') {
        recommendations.push('فعل إجبار HTTPS في الإنتاج عبر متغير HTTPS_ENFORCE');
      }
    }

    if (!process.env.SECURITY_HEADERS_ENABLED || process.env.SECURITY_HEADERS_ENABLED !== 'true') {
      recommendations.push('فعل رؤوس الأمان عبر متغير SECURITY_HEADERS_ENABLED');
    }

    return recommendations;
  }
}
