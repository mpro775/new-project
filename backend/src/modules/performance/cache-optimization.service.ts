import { Injectable, Logger, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PrismaService } from '../../shared/database/prisma.service';

export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  totalRequests: number;
  cacheSize: number;
  memoryUsage: number;
}

export interface CacheOptimizationResult {
  optimized: boolean;
  improvements: string[];
  recommendations: string[];
}

@Injectable()
export class CacheOptimizationService {
  private readonly logger = new Logger(CacheOptimizationService.name);
  private cacheStats = {
    hits: 0,
    misses: 0,
    totalRequests: 0,
  };

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * تحسين التخزين المؤقت للمنتجات الشائعة
   */
  async optimizeProductCache() {
    const startTime = Date.now();

    // الحصول على المنتجات الأكثر مبيعاً
    const topProducts = await this.prisma.$queryRaw`
      SELECT
        pv.id,
        p.name,
        p.sku,
        COUNT(sil.id) as sales_count,
        SUM(sil.quantity) as total_quantity
      FROM product_variants pv
      JOIN products p ON pv.product_id = p.id
      JOIN sales_invoice_lines sil ON pv.id = sil.product_variant_id
      JOIN sales_invoices si ON sil.sales_invoice_id = si.id
      WHERE si.created_at >= NOW() - INTERVAL '30 days'
        AND si.status = 'completed'
      GROUP BY pv.id, p.name, p.sku
      ORDER BY sales_count DESC
      LIMIT 100
    `;

    // تخزين المنتجات الأكثر مبيعاً في الكاش
    for (const product of topProducts as any[]) {
      const cacheKey = `product:${product.id}`;
      const productData = await this.prisma.productVariant.findUnique({
        where: { id: product.id },
        include: {
          product: {
            include: {
              category: true,
            },
          },
          variantValues: {
            include: {
              attribute: true,
              value: true,
            },
          },
          stockItems: {
            include: {
              warehouse: true,
            },
          },
        },
      });

      if (productData) {
        await this.cacheManager.set(cacheKey, productData, 3600000); // 1 hour
      }
    }

    const duration = Date.now() - startTime;
    this.logger.log(`Product cache optimization completed in ${duration}ms`);

    return {
      optimized: true,
      cachedProducts: topProducts.length,
      duration,
    };
  }

  /**
   * تحسين التخزين المؤقت للعملاء النشطين
   */
  async optimizeCustomerCache() {
    const startTime = Date.now();

    // الحصول على العملاء النشطين (لديهم مشتريات في آخر 30 يوم)
    const activeCustomers = await this.prisma.$queryRaw`
      SELECT
        c.id,
        c.name,
        c.email,
        COUNT(si.id) as recent_purchases,
        MAX(si.created_at) as last_purchase
      FROM customers c
      JOIN sales_invoices si ON c.id = si.customer_id
      WHERE si.created_at >= NOW() - INTERVAL '30 days'
        AND si.status = 'completed'
      GROUP BY c.id, c.name, c.email
      ORDER BY recent_purchases DESC
      LIMIT 200
    `;

    // تخزين العملاء النشطين في الكاش
    for (const customer of activeCustomers as any[]) {
      const cacheKey = `customer:${customer.id}`;
      const customerData = await this.prisma.customer.findUnique({
        where: { id: customer.id },
        include: {
          salesInvoices: {
            take: 10,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              totalAmount: true,
              createdAt: true,
            },
          },
        },
      });

      if (customerData) {
        await this.cacheManager.set(cacheKey, customerData, 1800000); // 30 minutes
      }
    }

    const duration = Date.now() - startTime;
    this.logger.log(`Customer cache optimization completed in ${duration}ms`);

    return {
      optimized: true,
      cachedCustomers: activeCustomers.length,
      duration,
    };
  }

  /**
   * تحسين التخزين المؤقت لإعدادات النظام
   */
  async optimizeSystemSettingsCache() {
    const startTime = Date.now();

    // تخزين إعدادات النظام الأساسية
    const settings = {
      branches: await this.prisma.branch.findMany({
        select: { id: true, name: true, isActive: true },
      }),
      warehouses: await this.prisma.warehouse.findMany({
        select: { id: true, name: true, branchId: true },
      }),
      categories: await this.prisma.category.findMany({
        select: { id: true, name: true, parentId: true },
      }),
      taxRates: await this.prisma.tax.findMany({
        select: { id: true, name: true, rate: true, isActive: true },
      }),
    };

    // تخزين كل إعدادات النظام مع TTL طويل
    await this.cacheManager.set('system:branches', settings.branches, 86400000); // 24 hours
    await this.cacheManager.set('system:warehouses', settings.warehouses, 86400000);
    await this.cacheManager.set('system:categories', settings.categories, 86400000);
    await this.cacheManager.set('system:taxRates', settings.taxRates, 86400000);

    const duration = Date.now() - startTime;
    this.logger.log(`System settings cache optimization completed in ${duration}ms`);

    return {
      optimized: true,
      cachedSettings: Object.keys(settings).length,
      duration,
    };
  }

  /**
   * تحسين التخزين المؤقت للتقارير اليومية
   */
  async optimizeDailyReportsCache() {
    const startTime = Date.now();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // تقرير المبيعات اليومية
    const dailySales = await this.prisma.$queryRaw`
      SELECT
        COUNT(*) as total_invoices,
        SUM(total_amount) as total_sales,
        AVG(total_amount) as average_sale,
        COUNT(DISTINCT customer_id) as unique_customers
      FROM sales_invoices
      WHERE DATE(created_at) = CURRENT_DATE
        AND status = 'completed'
    `;

    // تقرير المخزون المنخفض
    const lowStockItems = await this.prisma.stockItem.findMany({
      where: {
        quantity: {
          lte: this.prisma.stockItem.fields.minStock,
        },
      },
      include: {
        productVariant: {
          include: {
            product: {
              select: { name: true, sku: true },
            },
          },
        },
        warehouse: {
          select: { name: true },
        },
      },
    });

    // تخزين التقارير في الكاش
    await this.cacheManager.set('reports:daily-sales', dailySales, 3600000); // 1 hour
    await this.cacheManager.set('reports:low-stock', lowStockItems, 1800000); // 30 minutes

    const duration = Date.now() - startTime;
    this.logger.log(`Daily reports cache optimization completed in ${duration}ms`);

    return {
      optimized: true,
      cachedReports: 2,
      duration,
    };
  }

  /**
   * تنظيف الكاش القديم
   */
  async cleanupExpiredCache() {
    const startTime = Date.now();

    // هذا يعتمد على نوع cache manager المستخدم
    // في Redis، يمكن استخدام TTL للتنظيف التلقائي
    // في memory cache، نحتاج لتنظيف يدوي

    try {
      // محاولة تنظيف الكاش باستخدام reset
      await this.cacheManager.reset();
      this.logger.log('Cache cleanup completed');
    } catch (error) {
      this.logger.warn('Cache cleanup not supported by current cache manager');
    }

    const duration = Date.now() - startTime;
    return {
      cleaned: true,
      duration,
    };
  }

  /**
   * الحصول على إحصائيات الكاش
   */
  async getCacheStats(): Promise<CacheStats> {
    // محاولة الحصول على إحصائيات من Redis إذا كان متاحاً
    try {
      const info = await (this.cacheManager as any).store?.getClient?.()?.info?.();
      if (info) {
        const usedMemory = parseInt(info.match(/used_memory:(\d+)/)?.[1] || '0');
        const totalKeys = parseInt(info.match(/db0:keys=(\d+)/)?.[1] || '0');

        return {
          hits: this.cacheStats.hits,
          misses: this.cacheStats.misses,
          hitRate: this.cacheStats.totalRequests > 0
            ? (this.cacheStats.hits / this.cacheStats.totalRequests) * 100
            : 0,
          totalRequests: this.cacheStats.totalRequests,
          cacheSize: totalKeys,
          memoryUsage: usedMemory,
        };
      }
    } catch (error) {
      // إذا لم يكن Redis متاحاً
    }

    // إحصائيات أساسية للـ memory cache
    return {
      hits: this.cacheStats.hits,
      misses: this.cacheStats.misses,
      hitRate: this.cacheStats.totalRequests > 0
        ? (this.cacheStats.hits / this.cacheStats.totalRequests) * 100
        : 0,
      totalRequests: this.cacheStats.totalRequests,
      cacheSize: 0, // غير متاح في memory cache
      memoryUsage: 0, // غير متاح في memory cache
    };
  }

  /**
   * تسجيل cache hit/miss
   */
  recordCacheAccess(hit: boolean) {
    if (hit) {
      this.cacheStats.hits++;
    } else {
      this.cacheStats.misses++;
    }
    this.cacheStats.totalRequests++;
  }

  /**
   * تحسين شامل للكاش
   */
  async performFullCacheOptimization(): Promise<CacheOptimizationResult> {
    const startTime = Date.now();
    const improvements: string[] = [];
    const recommendations: string[] = [];

    try {
      // تحسين كاش المنتجات
      const productResult = await this.optimizeProductCache();
      improvements.push(`تم تحسين كاش ${productResult.cachedProducts} منتج`);

      // تحسين كاش العملاء
      const customerResult = await this.optimizeCustomerCache();
      improvements.push(`تم تحسين كاش ${customerResult.cachedCustomers} عميل`);

      // تحسين كاش إعدادات النظام
      const settingsResult = await this.optimizeSystemSettingsCache();
      improvements.push(`تم تحسين كاش ${settingsResult.cachedSettings} إعدادات نظام`);

      // تحسين كاش التقارير
      const reportsResult = await this.optimizeDailyReportsCache();
      improvements.push(`تم تحسين كاش ${reportsResult.cachedReports} تقرير`);

      // تنظيف الكاش القديم
      await this.cleanupExpiredCache();
      improvements.push('تم تنظيف الكاش القديم');

      // الحصول على إحصائيات
      const stats = await this.getCacheStats();
      if (stats.hitRate < 70) {
        recommendations.push('تحسين معدل الإصابة في الكاش (أقل من 70%)');
      }

      const duration = Date.now() - startTime;
      this.logger.log(`Full cache optimization completed in ${duration}ms`);

      return {
        optimized: true,
        improvements,
        recommendations,
      };

    } catch (error) {
      this.logger.error('Cache optimization failed', error);
      return {
        optimized: false,
        improvements: [],
        recommendations: ['فحص أخطاء تحسين الكاش', 'التأكد من اتصال قاعدة البيانات'],
      };
    }
  }

  /**
   * إعادة تعيين إحصائيات الكاش
   */
  resetStats() {
    this.cacheStats = {
      hits: 0,
      misses: 0,
      totalRequests: 0,
    };
    this.logger.log('Cache stats reset');
  }
}
