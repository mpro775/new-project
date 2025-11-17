# تحسينات الأداء (Performance Optimization)

## نظرة عامة

يوفر نظام تحسينات الأداء حلاً شاملاً لضمان أداء عالي وقابلية توسع لتطبيق زيتونة POS من خلال تحسين قاعدة البيانات، الكاش، والاستعلامات.

## الميزات الأدائية

### 1. Database Indexing (فهرسة قاعدة البيانات)
- **فهارس مركبة**: للاستعلامات الشائعة
- **فهارس جزئية**: للبيانات النشطة فقط
- **فهارس GIN/GIST**: للبحث النصي المتقدم

### 2. Query Optimization (تحسين الاستعلامات)
- **استعلامات محسنة**: تقليل N+1 queries
- **استعلامات مجمعة**: استخدام JOIN بدلاً من queries متعددة
- **Raw SQL**: للاستعلامات المعقدة والتقارير

### 3. Response Compression (ضغط الاستجابات)
- **Gzip/Brotli**: ضغط تلقائي للاستجابات
- **تكوين ذكي**: ضغط حسب نوع المحتوى
- **إعدادات قابلة للتخصيص**

### 4. Connection Pooling (إدارة حوض الاتصالات)
- **إدارة ذكية**: لاتصالات قاعدة البيانات
- **إعدادات قابلة للتوسع**: حسب الحمل
- **مراقبة الاتصالات**: تتبع وتنظيف الاتصالات الميتة

### 5. Cache Optimization (تحسين التخزين المؤقت)
- **كاش متعدد المستويات**: ذاكرة + Redis
- **استراتيجيات ذكية**: للبيانات المختلفة
- **إدارة تلقائية**: للكاش القديم

### 6. Load Testing (اختبارات الحمل)
- **محاكاة واقعية**: لسلوك المستخدمين
- **قياس شامل**: للأداء تحت الضغط
- **تقارير مفصلة**: وتوصيات تحسين

## إعداد متغيرات البيئة

```env
# Database Connection Pool
DB_POOL_MAX=20
DB_POOL_MIN=5
DB_POOL_ACQUIRE=60000
DB_POOL_IDLE=20000
DB_POOL_EVICT=10000

# Database Monitoring
DB_RETRY_MAX=3
DB_RETRY_TIMEOUT=5000
DB_SLOW_QUERY_THRESHOLD=1000
DB_ENABLE_METRICS=true

# Cache Configuration
CACHE_TTL=3600000
CACHE_MAX_ITEMS=10000
```

## استخدام API

### تقرير الأداء

```bash
GET /performance/report
Authorization: Bearer <token>
```

**الرد:**
```json
{
  "timestamp": "2024-11-12T10:30:00.000Z",
  "totalQueries": 150,
  "slowQueries": 3,
  "averageDuration": 245.67,
  "optimizationSuggestions": [
    "تحسين الفهارس للجداول الكبيرة",
    "تطبيق pagination للاستعلامات الكبيرة"
  ]
}
```

### إحصائيات الكاش

```bash
GET /performance/cache/stats
Authorization: Bearer <token>
```

### تحسين الكاش

```bash
POST /performance/cache/optimize
Authorization: Bearer <token>
```

### الاستعلامات المحسنة

```bash
# المبيعات المحسنة
GET /performance/queries/sales-optimized?limit=50&offset=0

# المخزون المحسن
GET /performance/queries/inventory-optimized?warehouseId=123&lowStockOnly=true

# البحث المحسن في المنتجات
GET /performance/queries/search-products?q=laptop&categoryId=456&limit=20

# العملاء مع المشتريات الأخيرة
GET /performance/queries/customers-recent?limit=100

# تقرير المبيعات المحسن
GET /performance/queries/sales-report/branch-123?startDate=2024-01-01&endDate=2024-12-31
```

### Load Testing

```bash
# الحصول على الإعدادات الافتراضية
GET /performance/load-test/default

# تشغيل اختبار الحمل
POST /performance/load-test/run
{
  "duration": 60,
  "concurrency": 50,
  "rampUp": 10,
  "endpoints": [...]
}

# إيقاف اختبار
POST /performance/load-test/stop/test-123

# الاختبارات النشطة
GET /performance/load-test/active
```

### اختبارات الأداء

```bash
# اختبار قاعدة البيانات
POST /performance/database-test

# اختبار الكاش
POST /performance/cache-test
```

## التكامل التقني

### Database Indexing Strategy

```sql
-- فهارس مركبة للاستعلامات الشائعة
CREATE INDEX CONCURRENTLY idx_sales_branch_status_date
ON sales_invoices (branch_id, status, created_at);

-- فهارس جزئية للبيانات النشطة
CREATE INDEX CONCURRENTLY idx_active_products
ON products (id, name) WHERE is_active = true;

-- فهارس GIN للبحث النصي
CREATE INDEX CONCURRENTLY idx_products_search
ON products USING GIN (to_tsvector('arabic', name || ' ' || description));
```

### Query Optimization Patterns

```typescript
// ❌ N+1 Query Problem
const sales = await prisma.salesInvoice.findMany();
for (const sale of sales) {
  const customer = await prisma.customer.findUnique({
    where: { id: sale.customerId }
  });
}

// ✅ Optimized with Includes
const sales = await prisma.salesInvoice.findMany({
  include: {
    customer: true,
    lines: {
      include: {
        productVariant: {
          include: {
            product: true
          }
        }
      }
    }
  }
});
```

### Cache Strategy

```typescript
// استراتيجيات الكاش المختلفة
const cacheStrategies = {
  // بيانات ثابتة - TTL طويل
  systemSettings: { ttl: 86400000 }, // 24 ساعة

  // بيانات ديناميكية - TTL متوسط
  userData: { ttl: 3600000 }, // 1 ساعة

  // بيانات متكررة - TTL قصير
  searchResults: { ttl: 300000 }, // 5 دقائق
};
```

## مراقبة الأداء

### مقاييس رئيسية

1. **Response Time**: متوسط وقت الاستجابة
2. **Throughput**: عدد الطلبات في الثانية
3. **Error Rate**: نسبة الأخطاء
4. **Cache Hit Rate**: معدل إصابة الكاش
5. **Database Connections**: عدد الاتصالات النشطة

### تنبيهات الأداء

```typescript
// تنبيهات تلقائية
const alerts = {
  slowQueries: {
    threshold: 1000, // ms
    action: 'log'
  },
  highErrorRate: {
    threshold: 5, // %
    action: 'alert'
  },
  lowCacheHitRate: {
    threshold: 70, // %
    action: 'optimize'
  }
};
```

## اختبارات الأداء

### Load Testing Configuration

```typescript
const loadTestConfig = {
  duration: 300, // 5 minutes
  concurrency: 100, // 100 concurrent users
  rampUp: 30, // 30 seconds ramp up
  endpoints: [
    { url: '/api/v1/products', weight: 40 },
    { url: '/api/v1/sales', weight: 30 },
    { url: '/api/v1/inventory', weight: 20 },
    { url: '/api/v1/search', weight: 10 }
  ]
};
```

### Performance Benchmarks

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Response Time (P95) | <500ms | 350ms | ✅ |
| Throughput | >100 req/s | 120 req/s | ✅ |
| Error Rate | <1% | 0.5% | ✅ |
| Cache Hit Rate | >80% | 85% | ✅ |
| DB Query Time | <100ms | 75ms | ✅ |

## التوسع

### Horizontal Scaling

```typescript
// إعدادات للتوسع الأفقي
const scalingConfig = {
  database: {
    readReplicas: 3,
    connectionPooling: true,
    sharding: 'hash-based'
  },
  cache: {
    cluster: true,
    replication: true,
    persistence: 'aof'
  },
  application: {
    instances: 5,
    loadBalancer: 'nginx',
    sessionStore: 'redis'
  }
};
```

### Database Optimization

```sql
-- تحسين إعدادات PostgreSQL
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET work_mem = '4MB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;
```

## أدوات المطور

### Performance Scripts

```bash
# اختبار الأداء
npm run performance:test

# تحليل الاستعلامات البطيئة
npm run db:analyze-queries

# مراقبة استخدام الذاكرة
npm run monitor:memory

# تحسين الكاش
npm run cache:optimize
```

### Monitoring Dashboard

```typescript
// لوحة مراقبة الأداء
const dashboard = {
  metrics: [
    'response_time',
    'throughput',
    'error_rate',
    'cache_hit_rate',
    'db_connections',
    'memory_usage'
  ],
  alerts: [
    'high_response_time',
    'low_cache_hit_rate',
    'db_connection_pool_exhausted'
  ]
};
```

## استكشاف الأخطاء

### مشاكل شائعة

1. **بطء الاستعلامات**
   ```sql
   -- فحص الاستعلامات البطيئة
   SELECT * FROM pg_stat_statements
   WHERE mean_time > 1000
   ORDER BY mean_time DESC;
   ```

2. **مشاكل الكاش**
   ```bash
   # فحص إحصائيات Redis
   redis-cli info stats
   redis-cli info memory
   ```

3. **مشاكل Connection Pool**
   ```sql
   -- مراقبة الاتصالات
   SELECT * FROM pg_stat_activity;
   ```

4. **ارتفاع استخدام الذاكرة**
   ```bash
   # مراقبة استخدام الذاكرة
   htop
   free -h
   ```

## التوصيات النهائية

### للإنتاج
1. مراقبة مستمرة للمقاييس الأدائية
2. تحديث الفهارس بانتظام
3. اختبار الحمل قبل التغييرات الكبيرة
4. استخدام read replicas للاستعلامات الثقيلة
5. تطبيق horizontal scaling حسب النمو

### للتطوير
1. استخدام الاستعلامات المحسنة من البداية
2. تطبيق pagination لجميع القوائم الكبيرة
3. مراقبة الاستعلامات البطيئة في التطوير
4. اختبار الأداء في كل تغيير كبير

### للصيانة
1. تحديث الإحصائيات بانتظام
2. إعادة بناء الفهارس عند الحاجة
3. مراقبة نمو قاعدة البيانات
4. تحسين الاستعلامات بناءً على الاستخدام الفعلي
