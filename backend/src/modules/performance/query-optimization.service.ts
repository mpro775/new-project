import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';

export interface QueryMetrics {
  query: string;
  duration: number;
  timestamp: Date;
  slowQuery: boolean;
  optimization: string[];
}

export interface PerformanceReport {
  timestamp: Date;
  totalQueries: number;
  slowQueries: number;
  averageDuration: number;
  slowestQueries: QueryMetrics[];
  optimizationSuggestions: string[];
}

@Injectable()
export class QueryOptimizationService {
  private readonly logger = new Logger(QueryOptimizationService.name);
  private queryMetrics: QueryMetrics[] = [];
  private readonly SLOW_QUERY_THRESHOLD = 1000; // 1 second

  constructor(private readonly prisma: PrismaService) {}

  /**
   * تسجيل مقاييس الاستعلام
   */
  recordQueryMetrics(query: string, duration: number, optimization: string[] = []) {
    const metrics: QueryMetrics = {
      query,
      duration,
      timestamp: new Date(),
      slowQuery: duration > this.SLOW_QUERY_THRESHOLD,
      optimization,
    };

    this.queryMetrics.push(metrics);

    // الاحتفاظ بآخر 1000 استعلام فقط
    if (this.queryMetrics.length > 1000) {
      this.queryMetrics = this.queryMetrics.slice(-1000);
    }

    if (metrics.slowQuery) {
      this.logger.warn(`Slow query detected: ${query} (${duration}ms)`);
    }
  }

  /**
   * تحسين استعلام المبيعات مع المنتجات والعملاء
   */
  async getOptimizedSalesWithRelations(branchId?: string, limit = 50, offset = 0) {
    const startTime = Date.now();

    const sales = await this.prisma.salesInvoice.findMany({
      where: branchId ? { branchId } : undefined,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        cashier: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
        lines: {
          include: {
            productVariant: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    sku: true,
                  },
                },
              },
            },
          },
        },
        payments: {
          select: {
            id: true,
            amount: true,
            paymentMethod: true,
            paymentDate: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    const duration = Date.now() - startTime;
    this.recordQueryMetrics(
      `getOptimizedSalesWithRelations(branchId: ${branchId}, limit: ${limit})`,
      duration,
      [
        'Include only necessary fields',
        'Use proper indexing on branchId, createdAt',
        'Limit result set size',
        'Use cursor-based pagination for large datasets',
      ]
    );

    return sales;
  }

  /**
   * تحسين استعلام المخزون مع المنتجات
   */
  async getOptimizedInventoryWithProducts(warehouseId?: string, lowStockOnly = false) {
    const startTime = Date.now();

    const where: any = {};
    if (warehouseId) where.warehouseId = warehouseId;
    if (lowStockOnly) where.quantity = { lte: this.prisma.stockItem.fields.minStock };

    const inventory = await this.prisma.stockItem.findMany({
      where,
      include: {
        warehouse: {
          select: {
            id: true,
            name: true,
          },
        },
        productVariant: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                category: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
            variantValues: {
              include: {
                attribute: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
                value: {
                  select: {
                    id: true,
                    value: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: [
        { warehouseId: 'asc' },
        { quantity: 'asc' },
      ],
    });

    const duration = Date.now() - startTime;
    this.recordQueryMetrics(
      `getOptimizedInventoryWithProducts(warehouseId: ${warehouseId}, lowStockOnly: ${lowStockOnly})`,
      duration,
      [
        'Include only necessary nested relations',
        'Use composite indexes on warehouseId, quantity',
        'Filter at database level for low stock',
        'Order by indexed columns',
      ]
    );

    return inventory;
  }

  /**
   * تحسين استعلام التقارير المجمعة
   */
  async getOptimizedSalesReport(branchId: string, startDate: Date, endDate: Date) {
    const startTime = Date.now();

    // استخدام raw query للأداء الأمثل في التقارير المجمعة
    const report = await this.prisma.$queryRaw`
      SELECT
        DATE(si."createdAt") as date,
        COUNT(*) as total_invoices,
        SUM(si.total_amount) as total_sales,
        AVG(si.total_amount) as average_sale,
        COUNT(DISTINCT si.customer_id) as unique_customers,
        SUM(sil.quantity) as total_items_sold
      FROM sales_invoices si
      LEFT JOIN sales_invoice_lines sil ON si.id = sil.sales_invoice_id
      WHERE si.branch_id = ${branchId}
        AND si.created_at >= ${startDate}
        AND si.created_at <= ${endDate}
        AND si.status = 'completed'
      GROUP BY DATE(si."createdAt")
      ORDER BY date DESC
    `;

    const duration = Date.now() - startTime;
    this.recordQueryMetrics(
      `getOptimizedSalesReport(branchId: ${branchId})`,
      duration,
      [
        'Use raw SQL for complex aggregations',
        'Group by date for daily summaries',
        'Index on branch_id, created_at, status',
        'Avoid N+1 queries with JOINs',
      ]
    );

    return report;
  }

  /**
   * تحسين البحث في المنتجات
   */
  async searchProductsOptimized(searchTerm: string, categoryId?: string, limit = 20) {
    const startTime = Date.now();

    const products = await this.prisma.product.findMany({
      where: {
        AND: [
          categoryId ? { categoryId } : {},
          {
            OR: [
              { name: { contains: searchTerm, mode: 'insensitive' } },
              { sku: { contains: searchTerm, mode: 'insensitive' } },
              { description: { contains: searchTerm, mode: 'insensitive' } },
            ],
          },
        ],
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        variants: {
          include: {
            stockItems: {
              include: {
                warehouse: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: [
        // ترتيب حسب الدقة أولاً
        { name: 'asc' },
        { createdAt: 'desc' },
      ],
      take: limit,
    });

    const duration = Date.now() - startTime;
    this.recordQueryMetrics(
      `searchProductsOptimized(searchTerm: "${searchTerm}", categoryId: ${categoryId})`,
      duration,
      [
        'Use full-text search indexes',
        'Limit result set size',
        'Include stock information efficiently',
        'Order by relevance and recency',
      ]
    );

    return products;
  }

  /**
   * تحسين استعلام العملاء مع آخر المشتريات
   */
  async getCustomersWithRecentPurchases(limit = 100) {
    const startTime = Date.now();

    const customers = await this.prisma.customer.findMany({
      include: {
        _count: {
          select: {
            salesInvoices: true,
          },
        },
        salesInvoices: {
          select: {
            id: true,
            totalAmount: true,
            createdAt: true,
            status: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 5, // آخر 5 فواتير فقط
        },
      },
      orderBy: [
        { lastPurchaseDate: 'desc' },
        { totalPurchases: 'desc' },
      ],
      take: limit,
    });

    const duration = Date.now() - startTime;
    this.recordQueryMetrics(
      `getCustomersWithRecentPurchases(limit: ${limit})`,
      duration,
      [
        'Use aggregate counts efficiently',
        'Limit nested relations to recent items',
        'Order by indexed columns (lastPurchaseDate, totalPurchases)',
        'Use pagination for large datasets',
      ]
    );

    return customers;
  }

  /**
   * الحصول على تقرير الأداء
   */
  getPerformanceReport(): PerformanceReport {
    const totalQueries = this.queryMetrics.length;
    const slowQueries = this.queryMetrics.filter(m => m.slowQuery).length;
    const totalDuration = this.queryMetrics.reduce((sum, m) => sum + m.duration, 0);
    const averageDuration = totalQueries > 0 ? totalDuration / totalQueries : 0;

    const slowestQueries = [...this.queryMetrics]
      .filter(m => m.slowQuery)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10);

    const optimizationSuggestions = this.generateOptimizationSuggestions();

    return {
      timestamp: new Date(),
      totalQueries,
      slowQueries,
      averageDuration,
      slowestQueries,
      optimizationSuggestions,
    };
  }

  /**
   * مسح مقاييس الاستعلامات
   */
  clearMetrics() {
    this.queryMetrics = [];
    this.logger.log('Query metrics cleared');
  }

  private generateOptimizationSuggestions(): string[] {
    const suggestions: string[] = [];
    const slowQueryCount = this.queryMetrics.filter(m => m.slowQuery).length;

    if (slowQueryCount > 10) {
      suggestions.push('فحص الاستعلامات البطيئة وتحسين الفهارس');
    }

    const avgDuration = this.queryMetrics.reduce((sum, m) => sum + m.duration, 0) / this.queryMetrics.length;
    if (avgDuration > 500) {
      suggestions.push('تحسين متوسط وقت الاستعلامات (>500ms)');
    }

    if (this.queryMetrics.some(m => m.query.includes('findMany') && !m.query.includes('take'))) {
      suggestions.push('إضافة حدود للاستعلامات غير المحدودة');
    }

    suggestions.push('مراجعة استخدام N+1 queries');
    suggestions.push('التأكد من استخدام الفهارس المناسبة');
    suggestions.push('استخدام raw SQL للاستعلامات المعقدة');

    return suggestions;
  }
}
