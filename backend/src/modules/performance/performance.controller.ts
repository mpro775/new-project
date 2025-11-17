import {
  Controller,
  Get,
  Post,
  Query,
  Param,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { QueryOptimizationService, PerformanceReport } from './query-optimization.service';
import { CacheOptimizationService, CacheStats, CacheOptimizationResult } from './cache-optimization.service';
import { LoadTestingService, LoadTestConfig, LoadTestResult } from './load-testing.service';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { Permissions } from '../../common/decorators/permission.decorator';

@ApiTags('Performance Optimization')
@ApiBearerAuth()
@Controller('performance')
@UseGuards(PermissionGuard)
export class PerformanceController {
  constructor(
    private readonly queryOptimizationService: QueryOptimizationService,
    private readonly cacheOptimizationService: CacheOptimizationService,
    private readonly loadTestingService: LoadTestingService,
  ) {}

  @Get('report')
  @Permissions('performance:read')
  @ApiOperation({ summary: 'الحصول على تقرير الأداء' })
  @ApiResponse({
    status: 200,
    description: 'تقرير الأداء الحالي',
    schema: {
      type: 'object',
      properties: {
        timestamp: { type: 'string', format: 'date-time' },
        totalQueries: { type: 'number' },
        slowQueries: { type: 'number' },
        averageDuration: { type: 'number' },
        slowestQueries: { type: 'array' },
        optimizationSuggestions: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  async getPerformanceReport(): Promise<PerformanceReport> {
    return this.queryOptimizationService.getPerformanceReport();
  }

  @Get('cache/stats')
  @Permissions('performance:read')
  @ApiOperation({ summary: 'الحصول على إحصائيات الكاش' })
  @ApiResponse({
    status: 200,
    description: 'إحصائيات الكاش',
    schema: {
      type: 'object',
      properties: {
        hits: { type: 'number' },
        misses: { type: 'number' },
        hitRate: { type: 'number' },
        totalRequests: { type: 'number' },
        cacheSize: { type: 'number' },
        memoryUsage: { type: 'number' },
      },
    },
  })
  async getCacheStats(): Promise<CacheStats> {
    return this.cacheOptimizationService.getCacheStats();
  }

  @Post('cache/optimize')
  @Permissions('performance:admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'تحسين الكاش بالكامل' })
  @ApiResponse({
    status: 200,
    description: 'نتيجة تحسين الكاش',
    schema: {
      type: 'object',
      properties: {
        optimized: { type: 'boolean' },
        improvements: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  async optimizeCache(): Promise<CacheOptimizationResult> {
    return this.cacheOptimizationService.performFullCacheOptimization();
  }

  @Post('cache/reset-stats')
  @Permissions('performance:admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'إعادة تعيين إحصائيات الكاش' })
  @ApiResponse({
    status: 200,
    description: 'تم إعادة تعيين إحصائيات الكاش',
  })
  async resetCacheStats() {
    this.cacheOptimizationService.resetStats();
    return { message: 'تم إعادة تعيين إحصائيات الكاش' };
  }

  @Post('queries/clear-metrics')
  @Permissions('performance:admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'مسح مقاييس الاستعلامات' })
  @ApiResponse({
    status: 200,
    description: 'تم مسح مقاييس الاستعلامات',
  })
  async clearQueryMetrics() {
    this.queryOptimizationService.clearMetrics();
    return { message: 'تم مسح مقاييس الاستعلامات' };
  }

  @Get('queries/sales-optimized')
  @Permissions('performance:read')
  @ApiOperation({ summary: 'الحصول على المبيعات المحسنة' })
  @ApiResponse({
    status: 200,
    description: 'قائمة المبيعات المحسنة',
  })
  async getOptimizedSales(
    @Query('branchId') branchId?: string,
    @Query('limit') limit = 50,
    @Query('offset') offset = 0,
  ) {
    return this.queryOptimizationService.getOptimizedSalesWithRelations(
      branchId,
      parseInt(limit.toString()),
      parseInt(offset.toString()),
    );
  }

  @Get('queries/inventory-optimized')
  @Permissions('performance:read')
  @ApiOperation({ summary: 'الحصول على المخزون المحسن' })
  @ApiResponse({
    status: 200,
    description: 'قائمة المخزون المحسنة',
  })
  async getOptimizedInventory(
    @Query('warehouseId') warehouseId?: string,
    @Query('lowStockOnly') lowStockOnly = false,
  ) {
    return this.queryOptimizationService.getOptimizedInventoryWithProducts(
      warehouseId,
      lowStockOnly === 'true' || lowStockOnly === true,
    );
  }

  @Get('queries/search-products')
  @Permissions('performance:read')
  @ApiOperation({ summary: 'البحث المحسن في المنتجات' })
  @ApiResponse({
    status: 200,
    description: 'نتائج البحث في المنتجات',
  })
  async searchProducts(
    @Query('q') searchTerm: string,
    @Query('categoryId') categoryId?: string,
    @Query('limit') limit = 20,
  ) {
    return this.queryOptimizationService.searchProductsOptimized(
      searchTerm,
      categoryId,
      parseInt(limit.toString()),
    );
  }

  @Get('queries/customers-recent')
  @Permissions('performance:read')
  @ApiOperation({ summary: 'الحصول على العملاء مع آخر المشتريات' })
  @ApiResponse({
    status: 200,
    description: 'قائمة العملاء مع آخر المشتريات',
  })
  async getCustomersWithRecentPurchases(@Query('limit') limit = 100) {
    return this.queryOptimizationService.getCustomersWithRecentPurchases(
      parseInt(limit.toString()),
    );
  }

  @Get('queries/sales-report/:branchId')
  @Permissions('performance:read')
  @ApiOperation({ summary: 'تقرير المبيعات المحسن' })
  @ApiResponse({
    status: 200,
    description: 'تقرير المبيعات المحسن',
  })
  async getSalesReport(
    @Param('branchId') branchId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.queryOptimizationService.getOptimizedSalesReport(
      branchId,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('load-test/default')
  @Permissions('performance:read')
  @ApiOperation({ summary: 'الحصول على إعدادات اختبار الحمل الافتراضية' })
  @ApiResponse({
    status: 200,
    description: 'إعدادات اختبار الحمل الافتراضية',
  })
  getDefaultLoadTestConfig(): LoadTestConfig {
    return this.loadTestingService.createDefaultLoadTest();
  }

  @Post('load-test/run')
  @Permissions('performance:admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'تشغيل اختبار الحمل' })
  @ApiResponse({
    status: 200,
    description: 'نتائج اختبار الحمل',
  })
  async runLoadTest(@Body() config: LoadTestConfig) {
    // تشغيل الاختبار في الخلفية
    const testId = `load_test_${Date.now()}`;

    setImmediate(async () => {
      try {
        const result = await this.loadTestingService.runLoadTest(config);
        console.log(`Load test completed: ${testId}`, result.summary);
      } catch (error) {
        console.error(`Load test failed: ${testId}`, error);
      }
    });

    return {
      testId,
      status: 'running',
      message: 'تم بدء اختبار الحمل',
    };
  }

  @Post('load-test/stop/:testId')
  @Permissions('performance:admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'إيقاف اختبار الحمل' })
  @ApiResponse({
    status: 200,
    description: 'نتيجة إيقاف اختبار الحمل',
  })
  stopLoadTest(@Param('testId') testId: string) {
    const stopped = this.loadTestingService.stopLoadTest(testId);
    return {
      stopped,
      message: stopped ? 'تم إيقاف اختبار الحمل' : 'اختبار الحمل غير موجود أو متوقف بالفعل',
    };
  }

  @Get('load-test/active')
  @Permissions('performance:read')
  @ApiOperation({ summary: 'الحصول على اختبارات الحمل النشطة' })
  @ApiResponse({
    status: 200,
    description: 'قائمة اختبارات الحمل النشطة',
  })
  getActiveLoadTests() {
    const activeTests = this.loadTestingService.getActiveTests();
    return {
      activeTests,
      count: activeTests.length,
    };
  }

  @Post('database-test')
  @Permissions('performance:admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'تشغيل اختبار أداء قاعدة البيانات' })
  @ApiResponse({
    status: 200,
    description: 'نتائج اختبار أداء قاعدة البيانات',
  })
  async runDatabasePerformanceTest() {
    return this.loadTestingService.runDatabasePerformanceTest();
  }

  @Post('cache-test')
  @Permissions('performance:admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'تشغيل اختبار أداء الكاش' })
  @ApiResponse({
    status: 200,
    description: 'نتائج اختبار أداء الكاش',
  })
  async runCachePerformanceTest() {
    return this.loadTestingService.runCachePerformanceTest();
  }
}
