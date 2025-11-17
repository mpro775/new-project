# التحسينات الأمنية (Security Enhancements)

## نظرة عامة

يوفر نظام التحسينات الأمنية حماية شاملة لتطبيق زيتونة POS من خلال تنفيذ أفضل الممارسات الأمنية في جميع المستويات.

## الميزات الأمنية

### 1. Rate Limiting (تحديد معدل الطلبات)
- **الغرض**: منع هجمات DDoS وإساءة استخدام API
- **التنفيذ**: استخدام `@nestjs/throttler` و `express-rate-limit`
- **الإعدادات**:
  ```typescript
  // في security.config.ts
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
  }
  ```

### 2. CORS Configuration (إعداد Cross-Origin Resource Sharing)
- **الغرض**: التحكم في الوصول من نطاقات مختلفة
- **الميزات**:
  - قائمة النطاقات المسموحة
  - دعم wildcards للنطاقات الفرعية
  - إعدادات credentials و headers

### 3. Input Sanitization (تنظيف المدخلات)
- **الغرض**: منع هجمات XSS و injection
- **التنفيذ**: `SanitizationPipe` مخصص
- **الميزات**:
  - تنظيف HTML entities
  - تقليم الفراغات
  - تحديد الحد الأقصى لطول النصوص
  - إزالة القيم الفارغة والـ undefined

### 4. HTTPS Enforcement (إجبار استخدام HTTPS)
- **الغرض**: ضمان الاتصال الآمن
- **الميزات**:
  - إعادة توجيه تلقائية من HTTP إلى HTTPS
  - إعداد HSTS (HTTP Strict Transport Security)
  - دعم preload للمتصفحات

### 5. Security Headers (رؤوس الأمان)
- **التنفيذ**: استخدام Helmet.js
- **الرؤوس المُضافة**:
  - Content Security Policy (CSP)
  - X-Frame-Options
  - X-Content-Type-Options
  - Referrer Policy
  - وغيرها

### 6. API Versioning (تنويع إصدارات API)
- **الغرض**: دعم إصدارات متعددة من API
- **التنفيذ**: Header-based versioning
- **الميزات**:
  - إصدار افتراضي
  - دعم backward compatibility

## إعداد متغيرات البيئة

```env
# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100

# CORS
CORS_ORIGIN=http://localhost:3000,http://localhost:3001,https://app.zaytuna-pos.com

# HTTPS
HTTPS_ENFORCE=false
TRUST_PROXY=false

# Security Headers
SECURITY_HEADERS_ENABLED=true

# API Versioning
API_VERSION_ENABLED=true
API_VERSION_HEADER=Accept-Version
API_VERSION_DEFAULT=1
```

## استخدام API

### الحصول على تقرير الأمان

```bash
GET /security/report
Authorization: Bearer <token>
```

**الرد:**
```json
{
  "timestamp": "2024-11-12T10:30:00.000Z",
  "environment": "production",
  "validation": {
    "valid": true,
    "errors": []
  },
  "recommendations": []
}
```

### التحقق من صحة الإعدادات

```bash
POST /security/validate
Authorization: Bearer <token>
```

### الحصول على إعدادات محددة

```bash
GET /security/cors
GET /security/rate-limit
GET /security/helmet
GET /security/https
GET /security/api-versioning
```

## التنفيذ التقني

### Security Module
```typescript
@Global()
@Module({
  controllers: [SecurityController],
  providers: [SecurityService],
  exports: [SecurityService],
})
export class SecurityModule {}
```

### Security Service
- إدارة جميع إعدادات الأمان
- التحقق من صحة الإعدادات
- توليد التقارير الأمنية

### Sanitization Pipe
```typescript
@Injectable()
export class SanitizationPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    // تطبيق التنظيف العميق
    return this.sanitizeValue(value, config);
  }
}
```

## الأمان في التطبيق

### Global Guards
```typescript
// ThrottlerGuard - Rate limiting
// JwtAuthGuard - Authentication
// PermissionGuard - Authorization
```

### Global Pipes
```typescript
// CustomValidationPipe - Validation
// SanitizationPipe - Input sanitization
```

### Global Interceptors
```typescript
// LoggingInterceptor - Request logging
// ResponseInterceptor - Response formatting
// AuditInterceptor - Audit logging
```

## اختبار الأمان

### تشغيل اختبارات الأمان

```bash
npm run security:test
```

### فحص الثغرات الأمنية

```bash
# استخدام npm audit
npm audit

# استخدام Snyk (إذا كان مثبتاً)
snyk test
```

## أفضل الممارسات

### 1. البيئة الإنتاجية
```env
NODE_ENV=production
HTTPS_ENFORCE=true
SECURITY_HEADERS_ENABLED=true
```

### 2. مراقبة الأمان
- مراجعة سجلات الأمان بانتظام
- مراقبة Rate limiting alerts
- فحص Security headers

### 3. التحديثات الأمنية
- تحديث التبعيات بانتظام
- مراجعة تغييرات الإعدادات الأمنية
- اختبار التغييرات في بيئة staging

## التعامل مع الهجمات الشائعة

### 1. DDoS Attacks
- Rate limiting فعال
- Monitoring و alerting
- CDN protection (إضافي)

### 2. XSS Attacks
- Input sanitization
- Content Security Policy
- Safe HTML rendering

### 3. CSRF Attacks
- SameSite cookies
- CSRF tokens (للنماذج الحساسة)
- CORS configuration

### 4. Injection Attacks
- Parameterized queries (Prisma)
- Input validation
- Output encoding

## المراقبة والتنبيهات

### Security Monitoring
- Log analysis للكشف عن الأنماط المشبوهة
- Alert عند تجاوز Rate limits
- Audit logging لجميع العمليات الحساسة

### Compliance
- GDPR compliance للبيانات الشخصية
- PCI DSS لمعالجة المدفوعات
- Local regulations compliance

## التوسع

### إضافات أمنية مستقبلية
- Web Application Firewall (WAF)
- Security Information and Event Management (SIEM)
- Multi-factor authentication (MFA)
- API Gateway integration
- Security scanning automation

## استكشاف الأخطاء

### مشاكل شائعة

1. **CORS errors**
   - تحقق من CORS_ORIGIN في متغيرات البيئة
   - تأكد من إعداد credentials صحيح

2. **Rate limiting blocks legitimate requests**
   - زيادة RATE_LIMIT_MAX
   - إضافة whitelist للـ IPs الموثوقة

3. **HTTPS redirect loop**
   - تحقق من TRUST_PROXY setting
   - تأكد من proxy configuration صحيح

4. **Security headers not applied**
   - تحقق من SECURITY_HEADERS_ENABLED
   - تأكد من عدم وجود middleware conflicts

## التوثيق المرجعي

- [OWASP Security Guidelines](https://owasp.org/www-project-top-ten/)
- [Helmet.js Documentation](https://helmetjs.github.io/)
- [NestJS Security](https://docs.nestjs.com/security)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
