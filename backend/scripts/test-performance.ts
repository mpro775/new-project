import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { QueryOptimizationService } from '../src/modules/performance/query-optimization.service';
import { CacheOptimizationService } from '../src/modules/performance/cache-optimization.service';
import { LoadTestingService } from '../src/modules/performance/load-testing.service';

async function testPerformance() {
  try {
    console.log('🚀 بدء اختبار تحسينات الأداء...');

    const app = await NestFactory.createApplicationContext(AppModule);
    const queryOptimization = app.get(QueryOptimizationService);
    const cacheOptimization = app.get(CacheOptimizationService);
    const loadTesting = app.get(LoadTestingService);

    // اختبار تقرير الأداء
    console.log('📊 اختبار تقرير الأداء...');
    const performanceReport = queryOptimization.getPerformanceReport();
    console.log(`الاستعلامات الكلية: ${performanceReport.totalQueries}`);
    console.log(`الاستعلامات البطيئة: ${performanceReport.slowQueries}`);
    console.log(`متوسط الوقت: ${performanceReport.averageDuration.toFixed(2)}ms`);

    // اختبار تحسين الكاش
    console.log('💾 اختبار تحسين الكاش...');
    const cacheResult = await cacheOptimization.performFullCacheOptimization();
    console.log('نتيجة تحسين الكاش:', cacheResult.optimized);
    console.log('التحسينات:', cacheResult.improvements.length);

    // اختبار إحصائيات الكاش
    console.log('📈 اختبار إحصائيات الكاش...');
    const cacheStats = await cacheOptimization.getCacheStats();
    console.log(`معدل الإصابة: ${cacheStats.hitRate.toFixed(2)}%`);

    // اختبار الاستعلامات المحسنة
    console.log('🔍 اختبار الاستعلامات المحسنة...');

    // اختبار المبيعات المحسنة
    const sales = await queryOptimization.getOptimizedSalesWithRelations(undefined, 5);
    console.log(`تم جلب ${sales.length} مبيعة محسنة`);

    // اختبار المخزون المحسن
    const inventory = await queryOptimization.getOptimizedInventoryWithProducts(undefined, false);
    console.log(`تم جلب ${inventory.length} عنصر مخزون محسن`);

    // اختبار البحث المحسن
    const searchResults = await queryOptimization.searchProductsOptimized('test', undefined, 5);
    console.log(`تم العثور على ${searchResults.length} منتج في البحث`);

    // اختبار العملاء مع المشتريات الأخيرة
    const customers = await queryOptimization.getCustomersWithRecentPurchases(5);
    console.log(`تم جلب ${customers.length} عميل مع مشترياتهم`);

    // اختبار إعدادات Load Testing
    console.log('⚡ اختبار إعدادات Load Testing...');
    const defaultConfig = loadTesting.createDefaultLoadTest();
    console.log(`المدة: ${defaultConfig.duration}s, المتزامنة: ${defaultConfig.concurrency}`);
    console.log(`عدد الـ endpoints: ${defaultConfig.endpoints.length}`);

    // اختبار أداء قاعدة البيانات
    console.log('🗄️ اختبار أداء قاعدة البيانات...');
    const dbTest = await loadTesting.runDatabasePerformanceTest();
    console.log('اختبار Connection Pool:', dbTest.connectionPoolTest ? '✅' : '❌');
    console.log('اختبار Query Performance:', dbTest.queryPerformanceTest ? '✅' : '❌');

    // اختبار أداء الكاش
    console.log('💾 اختبار أداء الكاش...');
    const cacheTest = await loadTesting.runCachePerformanceTest();
    console.log(`معدل الإصابة: ${cacheTest.cacheHitRate.toFixed(2)}%`);
    console.log(`وقت الاستجابة: ${cacheTest.cacheLatency}ms`);

    await app.close();
    console.log('🎉 تم الانتهاء من اختبار تحسينات الأداء بنجاح!');

    // طباعة التوصيات النهائية
    console.log('\n📋 التوصيات:');
    performanceReport.optimizationSuggestions.forEach((suggestion, i) => {
      console.log(`${i + 1}. ${suggestion}`);
    });

  } catch (error) {
    console.error('❌ فشل في اختبار تحسينات الأداء:', error);
    process.exit(1);
  }
}

testPerformance();
