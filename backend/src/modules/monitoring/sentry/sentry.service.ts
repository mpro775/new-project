import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
// TODO: Uncomment when Sentry packages are installed
/*
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
*/

@Injectable()
export class SentryService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SentryService.name);
  private isInitialized = false;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    await this.initializeSentry();
  }

  async onModuleDestroy() {
    await this.closeSentry();
  }

  /**
   * تهيئة Sentry
   */
  private async initializeSentry() {
    try {
      const dsn = this.configService.get<string>('SENTRY_DSN');
      const environment = this.configService.get<string>('NODE_ENV', 'development');

      if (!dsn) {
        this.logger.warn('لم يتم العثور على SENTRY_DSN، سيتم تعطيل Sentry');
        return;
      }

      this.logger.log('تهيئة Sentry...');

      // TODO: Uncomment when Sentry packages are installed
      /*
      Sentry.init({
        dsn,
        environment,
        integrations: [
          // Add profiling integration
          nodeProfilingIntegration(),
        ],

        // Performance Monitoring
        tracesSampleRate: environment === 'production' ? 0.1 : 1.0,
        profilesSampleRate: environment === 'production' ? 0.1 : 1.0,

        // Release Health
        enableTracing: true,

        // Error tracking
        beforeSend: (event) => {
          // تنظيف البيانات الحساسة
          return this.sanitizeEvent(event);
        },

        // Custom tags
        initialScope: {
          tags: {
            service: 'zaytuna-backend',
            version: process.env.npm_package_version || '1.0.0',
          },
        },
      });
      */

      this.isInitialized = true;
      this.logger.log('[MOCK] تم تهيئة Sentry بنجاح');

    } catch (error) {
      this.logger.error('فشل في تهيئة Sentry:', error);
    }
  }

  /**
   * إغلاق Sentry
   */
  private async closeSentry() {
    try {
      if (this.isInitialized) {
        // TODO: Uncomment when Sentry packages are installed
        // await Sentry.close(2000);
        this.logger.log('[MOCK] تم إغلاق Sentry');
      }
    } catch (error) {
      this.logger.error('فشل في إغلاق Sentry:', error);
    }
  }

  /**
   * تنظيف الحدث من البيانات الحساسة
   */
  private sanitizeEvent(event: any): any {
    try {
      // إزالة كلمات المرور والرموز المميزة
      if (event.request?.data) {
        const data = event.request.data;
        if (typeof data === 'string') {
          try {
            const parsed = JSON.parse(data);
            this.sanitizeObject(parsed);
            event.request.data = JSON.stringify(parsed);
          } catch (e) {
            // ليس JSON، ترك كما هو
          }
        } else if (typeof data === 'object') {
          this.sanitizeObject(data);
        }
      }

      // إزالة البيانات الحساسة من الـ context
      if (event.contexts?.user) {
        delete event.contexts.user.password;
        delete event.contexts.user.passwordHash;
        delete event.contexts.user.twoFactorSecret;
      }

      return event;
    } catch (error) {
      this.logger.error('فشل في تنظيف الحدث:', error);
      return event;
    }
  }

  /**
   * تنظيف الكائن من البيانات الحساسة
   */
  private sanitizeObject(obj: any) {
    const sensitiveKeys = [
      'password',
      'passwordHash',
      'token',
      'accessToken',
      'refreshToken',
      'secret',
      'key',
      'apiKey',
      'privateKey',
      'creditCard',
      'cardNumber',
      'cvv',
      'pin',
    ];

    for (const key in obj) {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        obj[key] = '[REDACTED]';
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        this.sanitizeObject(obj[key]);
      }
    }
  }

  /**
   * تسجيل خطأ
   */
  captureException(error: Error, context?: {
    user?: any;
    tags?: Record<string, string>;
    extra?: Record<string, any>;
    level?: 'fatal' | 'error' | 'warning' | 'info' | 'debug';
  }) {
    try {
      if (!this.isInitialized) {
        this.logger.error('Sentry غير مهيأ:', error);
        return;
      }

      // TODO: Uncomment when Sentry packages are installed
      /*
      Sentry.withScope((scope) => {
        // إضافة context
        if (context?.user) {
          scope.setUser({
            id: context.user.id,
            email: context.user.email,
            username: context.user.username,
          });
        }

        if (context?.tags) {
          Object.entries(context.tags).forEach(([key, value]) => {
            scope.setTag(key, value);
          });
        }

        if (context?.extra) {
          Object.entries(context.extra).forEach(([key, value]) => {
            scope.setExtra(key, value);
          });
        }

        if (context?.level) {
          scope.setLevel(context.level);
        }

        // إضافة tags افتراضية
        scope.setTag('service', 'zaytuna-backend');
        scope.setTag('component', 'error-handler');

        Sentry.captureException(error);
      });
      */

      this.logger.error('[MOCK] تم تسجيل الخطأ في Sentry:', error.message);
    } catch (sentryError) {
      this.logger.error('فشل في تسجيل الخطأ في Sentry:', sentryError);
    }
  }

  /**
   * تسجيل رسالة
   */
  captureMessage(message: string, context?: {
    level?: 'fatal' | 'error' | 'warning' | 'info' | 'debug';
    tags?: Record<string, string>;
    extra?: Record<string, any>;
  }) {
    try {
      if (!this.isInitialized) {
        this.logger.log(`رسالة: ${message}`, context?.extra);
        return;
      }

      // TODO: Uncomment when Sentry packages are installed
      /*
      Sentry.withScope((scope) => {
        if (context?.tags) {
          Object.entries(context.tags).forEach(([key, value]) => {
            scope.setTag(key, value);
          });
        }

        if (context?.extra) {
          Object.entries(context.extra).forEach(([key, value]) => {
            scope.setExtra(key, value);
          });
        }

        Sentry.captureMessage(message, context?.level || 'info');
      });
      */

      this.logger.log(`[MOCK] تم تسجيل الرسالة في Sentry: ${message}`);
    } catch (error) {
      this.logger.error('فشل في تسجيل الرسالة في Sentry:', error);
    }
  }

  /**
   * إنشاء transaction لتتبع الأداء
   */
  startTransaction(name: string, op: string) {
    try {
      if (!this.isInitialized) {
        return {
          finish: () => {},
          setStatus: () => {},
          setTag: () => {},
          setData: () => {},
        };
      }

      // TODO: Uncomment when Sentry packages are installed
      /*
      const transaction = Sentry.startTransaction({
        name,
        op,
      });

      return {
        finish: () => transaction.finish(),
        setStatus: (status: string) => transaction.setStatus(status),
        setTag: (key: string, value: string) => transaction.setTag(key, value),
        setData: (key: string, value: any) => transaction.setData(key, value),
      };
      */

      return {
        finish: () => this.logger.debug(`[MOCK] انتهى transaction: ${name}`),
        setStatus: (status: string) => {},
        setTag: (key: string, value: string) => {},
        setData: (key: string, value: any) => {},
      };
    } catch (error) {
      this.logger.error('فشل في إنشاء transaction:', error);
      return {
        finish: () => {},
        setStatus: () => {},
        setTag: () => {},
        setData: () => {},
      };
    }
  }

  /**
   * إضافة breadcrumb
   */
  addBreadcrumb(breadcrumb: {
    message: string;
    level?: 'fatal' | 'error' | 'warning' | 'info' | 'debug';
    category?: string;
    data?: Record<string, any>;
  }) {
    try {
      if (!this.isInitialized) {
        this.logger.debug(`Breadcrumb: ${breadcrumb.message}`, breadcrumb.data);
        return;
      }

      // TODO: Uncomment when Sentry packages are installed
      // Sentry.addBreadcrumb(breadcrumb);

      this.logger.debug(`[MOCK] تم إضافة breadcrumb: ${breadcrumb.message}`);
    } catch (error) {
      this.logger.error('فشل في إضافة breadcrumb:', error);
    }
  }

  /**
   * تعيين المستخدم الحالي
   */
  setUser(user: {
    id?: string;
    email?: string;
    username?: string;
    ip_address?: string;
  }) {
    try {
      if (!this.isInitialized) {
        this.logger.debug('تعيين المستخدم:', user);
        return;
      }

      // TODO: Uncomment when Sentry packages are installed
      // Sentry.setUser(user);

      this.logger.debug(`[MOCK] تم تعيين المستخدم: ${user.id || user.email}`);
    } catch (error) {
      this.logger.error('فشل في تعيين المستخدم:', error);
    }
  }

  /**
   * تعيين tag
   */
  setTag(key: string, value: string) {
    try {
      if (!this.isInitialized) {
        return;
      }

      // TODO: Uncomment when Sentry packages are installed
      // Sentry.setTag(key, value);
    } catch (error) {
      this.logger.error('فشل في تعيين tag:', error);
    }
  }

  /**
   * تعيين extra data
   */
  setExtra(key: string, value: any) {
    try {
      if (!this.isInitialized) {
        return;
      }

      // TODO: Uncomment when Sentry packages are installed
      // Sentry.setExtra(key, value);
    } catch (error) {
      this.logger.error('فشل في تعيين extra data:', error);
    }
  }

  /**
   * إنشاء child scope
   */
  withScope(callback: (scope: any) => void) {
    try {
      if (!this.isInitialized) {
        callback({});
        return;
      }

      // TODO: Uncomment when Sentry packages are installed
      /*
      Sentry.withScope((scope) => {
        callback(scope);
      });
      */

      callback({});
    } catch (error) {
      this.logger.error('فشل في إنشاء scope:', error);
    }
  }

  /**
   * flush جميع الأحداث
   */
  async flush(timeout: number = 2000): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        return true;
      }

      // TODO: Uncomment when Sentry packages are installed
      // return await Sentry.flush(timeout);

      return true;
    } catch (error) {
      this.logger.error('فشل في flush الأحداث:', error);
      return false;
    }
  }

  /**
   * الحصول على معلومات Sentry
   */
  getSentryInfo() {
    return {
      initialized: this.isInitialized,
      dsn: this.configService.get<string>('SENTRY_DSN') ? 'configured' : 'not_configured',
      environment: this.configService.get<string>('NODE_ENV', 'development'),
      version: process.env.npm_package_version || '1.0.0',
    };
  }

  /**
   * اختبار Sentry
   */
  async testSentry(): Promise<boolean> {
    try {
      this.captureMessage('Sentry test message', {
        level: 'info',
        tags: { test: 'true' },
        extra: { timestamp: new Date().toISOString() },
      });

      // انتظار flush
      await this.flush(1000);

      return true;
    } catch (error) {
      this.logger.error('فشل في اختبار Sentry:', error);
      return false;
    }
  }
}
