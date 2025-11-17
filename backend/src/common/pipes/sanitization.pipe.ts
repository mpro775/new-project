import { Injectable, PipeTransform, ArgumentMetadata } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { sanitize } from 'class-sanitizer';

@Injectable()
export class SanitizationPipe implements PipeTransform {
  constructor(private readonly configService: ConfigService) {}

  transform(value: any, metadata: ArgumentMetadata) {
    if (!value || typeof value !== 'object') {
      return value;
    }

    const sanitizationConfig = this.configService.get('security.sanitization');

    if (!sanitizationConfig?.enabled) {
      return value;
    }

    // تطبيق التنظيف العميق على الكائن
    return this.sanitizeValue(value, sanitizationConfig);
  }

  private sanitizeValue(value: any, config: any): any {
    if (value === null || value === undefined) {
      if (config.removeNull) return undefined;
      return value;
    }

    if (typeof value === 'string') {
      let sanitized = value;

      // تقليم الفراغات
      if (config.trimStrings) {
        sanitized = sanitized.trim();
      }

      // تقليل طول النص إذا تجاوز الحد
      if (config.maxStringLength && sanitized.length > config.maxStringLength) {
        sanitized = sanitized.substring(0, config.maxStringLength);
      }

      // تنظيف HTML
      if (config.escapeHtml) {
        sanitized = sanitized
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#x27;')
          .replace(/\//g, '&#x2F;');
      }

      return sanitized;
    }

    if (Array.isArray(value)) {
      if (config.maxArrayLength && value.length > config.maxArrayLength) {
        return value.slice(0, config.maxArrayLength);
      }

      return value.map(item => this.sanitizeValue(item, config));
    }

    if (typeof value === 'object') {
      // التحقق من عمق الكائن
      if (config.maxObjectDepth && this.getObjectDepth(value) > config.maxObjectDepth) {
        return {}; // إرجاع كائن فارغ إذا تجاوز العمق
      }

      const sanitized: any = {};

      for (const [key, val] of Object.entries(value)) {
        // استخدام class-sanitizer للتنظيف الإضافي
        const sanitizedKey = sanitize(key);
        const sanitizedValue = this.sanitizeValue(val, config);

        if (sanitizedValue !== undefined) {
          sanitized[sanitizedKey] = sanitizedValue;
        }
      }

      return sanitized;
    }

    return value;
  }

  private getObjectDepth(obj: any, currentDepth = 0): number {
    if (typeof obj !== 'object' || obj === null) {
      return currentDepth;
    }

    let maxDepth = currentDepth;

    for (const value of Object.values(obj)) {
      if (typeof value === 'object' && value !== null) {
        const depth = this.getObjectDepth(value, currentDepth + 1);
        maxDepth = Math.max(maxDepth, depth);
      }
    }

    return maxDepth;
  }
}
