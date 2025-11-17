# هيكل الباك إند - نظام نقاط بيع زيتونة

## نظرة عامة على الباك إند

يُبنى باك إند نظام زيتونة باستخدام **NestJS** (إطار عمل Node.js) مع **TypeScript**، ويتبع بنية معيارية واضحة مع فصل المسؤوليات. يتكون النظام من عدة طبقات ووحدات أساسية مصممة لدعم العمليات التجارية الشاملة.

### التقنيات الأساسية المستخدمة
- **إطار العمل**: NestJS مع TypeScript
- **قاعدة البيانات**: PostgreSQL
- **التخزين المؤقت والطوابير**: Redis
- **ORM**: Prisma (مع إمكانية استخدام TypeORM للاستعلامات المعقدة)
- **التوثيق**: OpenAPI/Swagger
- **الأمان**: JWT + 2FA + WebAuthn
- **المراقبة**: OpenTelemetry + Prometheus + Loki

---

## 1. هيكل الطبقات الأساسي (Layered Architecture)

### 1.1 طبقة البنية التحتية (Infrastructure Layer)
هذه الطبقة تحتوي على المكونات الأساسية التي تدعم جميع الوحدات الأخرى:

#### API Gateway & Controllers
- **المسؤولية**: استقبال الطلبات HTTP وتوجيهها
- **المكونات**:
  - Controllers لكل وحدة أساسية
  - DTOs للتحقق من صحة البيانات
  - Pipes للتحويل والتحقق
  - Guards للأمان والصلاحيات

#### نظام المصادقة والصلاحيات (Auth & RBAC)
- **المسؤولية**: إدارة المستخدمين والجلسات والصلاحيات
- **المكونات**:
  - JWT Access/Refresh tokens
  - 2FA (SMS/Authenticator/WebAuthn)
  - Guards للتحقق من الصلاحيات
  - Policies للأدوار المختلفة

#### السجلات والتدقيق (Audit & Logging)
- **المسؤولية**: تسجيل جميع العمليات للأمان والمتابعة
- **المكونات**:
  - Audit logs مع تفاصيل العمليات
  - Change tracking (قبل وبعد)
  - Session tracking
  - Compliance logging

#### المكتبة المشتركة (Common Library)
- **المسؤولية**: المرافق والأدوات المشتركة
- **المكونات**:
  - Shared DTOs
  - Validators
  - Mappers
  - Utilities

### 1.2 طبقة التخزين المؤقت والكاش (Caching & Cache Layer)
هذه الطبقة تدير التخزين المؤقت لتحسين الأداء وتقليل الحمل على قاعدة البيانات:

#### إدارة الكاش (Cache Management)
- **المسؤولية**: تخزين البيانات المؤقتة وإدارة الجلسات
- **المكونات**:
  - Redis للتخزين المؤقت
  - Session storage
  - Cache invalidation strategies
  - Distributed caching

#### استراتيجيات الكاش (Cache Strategies)
- **Cache-Aside**: للبيانات المتغيرة (المنتجات، الأسعار)
- **Write-Through**: للبيانات الحساسة (المخزون)
- **Time-based TTL**: انتهاء تلقائي للكاش
- **Event-based Invalidation**: تحديث الكاش عند التغييرات

#### الكاش متعدد المستويات (Multi-level Caching)
- **L1**: In-memory cache (تطبيق محلي)
- **L2**: Redis distributed cache
- **L3**: Database query caching

### 1.4 طبقة الأعمال الأساسية (Core Business Modules)

النظام مقسم إلى **6 وحدات أساسية** تغطي جميع العمليات التجارية:

#### 1. وحدة المبيعات (Sales Module)
**المسؤولية**: إدارة عمليات البيع والفواتير

**الوظائف الرئيسية**:
- إنشاء وإدارة فواتير المبيعات
- حساب الضرائب والخصومات
- إدارة سلة المشتريات
- دعم طرق الدفع المختلفة
- إنشاء وطباعة الفواتير
- مشاركة الفواتير إلكترونياً

**الكيانات الرئيسية**:
- SalesInvoice (فاتورة مبيعات)
- InvoiceLine (سطور الفاتورة)
- Payment (المدفوعات)
- Customer (العملاء)

#### 2. وحدة المرتجعات (Returns Module)
**المسؤولية**: إدارة عمليات الإرجاع والاسترداد

**الوظائف الرئيسية**:
- البحث عن الفواتير الأصلية
- إرجاع كلي أو جزئي
- تحديث المخزون عند الإرجاع
- معالجة رد المبالغ المالية
- إصدار إيصالات الإرجاع

**الكيانات الرئيسية**:
- Return (الإرجاع)
- ReturnLine (سطور الإرجاع)
- CreditNote (إشعار دائن)

#### 3. وحدة المخزون (Inventory Module)
**المسؤولية**: إدارة المنتجات والمخزون عبر الفروع

**الوظائف الرئيسية**:
- إدارة المنتجات والمتغيرات
- تتبع المخزون عبر المخازن
- حركات المخزون (دخول/خروج/تحويل)
- الجرد الدوري والمفاجئ
- التنبيهات التلقائية
- إدارة المخازن والفروع

**الكيانات الرئيسية**:
- Product (المنتج)
- ProductVariant (متغيرات المنتج)
- Warehouse (المخزن)
- StockItem (عنصر مخزون)
- StockMovement (حركة مخزون)

#### 4. وحدة المشتريات (Purchasing Module)
**المسؤولية**: إدارة المشتريات والموردين

**الوظائف الرئيسية**:
- إدارة الموردين وشروط الدفع
- إنشاء فواتير المشتريات
- تتبع المستحقات والمدفوعات
- تحديث تكاليف المخزون
- إدارة شروط الائتمان

**الكيانات الرئيسية**:
- Supplier (المورد)
- PurchaseInvoice (فاتورة مشتريات)
- PurchaseOrder (أمر شراء)

#### 5. وحدة المحاسبة (Accounting Module)
**المسؤولية**: النظام المحاسبي الأساسي (General Ledger)

**الوظائف الرئيسية**:
- دليل الحسابات
- القيود اليومية التلقائية
- سندات الصرف والقبض
- إقفال الفترات المحاسبية
- التقارير المالية الأساسية

**الكيانات الرئيسية**:
- GLAccount (حساب الأستاذ العام)
- JournalEntry (قيد يومي)
- JournalEntryLine (سطور القيد)

#### 6. وحدة التقارير (Reporting Module)
**المسؤولية**: إنشاء التقارير ولوحات المؤشرات

**الوظائف الرئيسية**:
- تقارير المبيعات والمخزون
- لوحات المؤشرات التفاعلية
- التصدير بصيغ PDF/Excel
- التقارير المالية
- تقارير الأداء

**المكونات**:
- Queries معقدة للتجميع
- Charts و Dashboards
- Scheduled reports

### 1.5 طبقة التكاملات (Integration & Sync)

#### مدير المزامنة (Sync Manager)
**المسؤولية**: إدارة العمل في وضع عدم الاتصال والمزامنة

**الوظائف الرئيسية**:
- معالجة التغييرات المؤقتة
- حل تعارضات البيانات
- مزامنة البيانات عند عودة الاتصال
- إدارة الطوابير والأحداث

#### محولات الدفع (Payment Adapters)
**المسؤولية**: التكامل مع بوابات الدفع

**الوظائف الرئيسية**:
- معالجة معاملات الدفع
- التحقق من صحة المعاملات
- إدارة المبالغ المعادة
- دعم طرق دفع متعددة

#### محولات الإشعارات (Notification Adapters)
**المسؤولية**: إرسال الإشعارات والرسائل

**الوظائف الرئيسية**:
- إرسال OTP للمصادقة
- إشعارات المبيعات
- مشاركة الفواتير
- تكامل مع SMS/Email/WhatsApp

---

## 2. عدد النماذج (Models) في قاعدة البيانات

يحتوي النظام على **25 نموذج أساسي** مقسمة كالتالي:

### 2.1 نماذج البنية الأساسية (5 نماذج)
1. **User**: المستخدمون والمصادقة
2. **Role**: الأدوار والصلاحيات
3. **Branch**: الفروع
4. **Warehouse**: المخازن
5. **Company**: معلومات الشركة

### 2.2 نماذج المنتجات والمخزون (8 نماذج)
6. **Product**: المنتجات الأساسية
7. **ProductVariant**: متغيرات المنتجات (الألوان، الأحجام)
8. **Category**: فئات المنتجات
9. **StockItem**: عناصر المخزون في كل مخزن
10. **StockMovement**: حركات المخزون
11. **PriceList**: قوائم الأسعار
12. **Tax**: الضرائب
13. **Currency**: العملات

### 2.3 نماذج المبيعات والمشتريات (6 نماذج)
14. **Customer**: العملاء
15. **SalesInvoice**: فواتير المبيعات
16. **SalesInvoiceLine**: سطور فاتورة المبيعات
17. **Supplier**: الموردون
18. **PurchaseInvoice**: فواتير المشتريات
19. **PurchaseInvoiceLine**: سطور فاتورة المشتريات

### 2.4 نماذج المالية والمحاسبة (4 نماذج)
20. **Payment**: المدفوعات
21. **GLAccount**: حسابات الأستاذ العام
22. **JournalEntry**: القيود اليومية
23. **JournalEntryLine**: سطور القيود

### 2.5 نماذج التكاملات والنظام (2 نموذج)
24. **AuditLog**: سجلات التدقيق
25. **SyncBatch**: دفعات المزامنة

---

## 3. توحيد الردود ونظام الأخطاء الموحد

### 3.1 توحيد شكل الردود (Unified Response Format)
جميع APIs تتبع تنسيق ردود موحد لضمان تجربة متسقة:

#### هيكل الرد الناجح (Success Response)
```json
{
  "success": true,
  "data": {
    // بيانات الاستجابة
  },
  "meta": {
    "timestamp": "2025-01-01T12:00:00Z",
    "requestId": "req-123456",
    "version": "1.0.0"
  },
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

#### هيكل رد الخطأ (Error Response)
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "خطأ في التحقق من البيانات",
    "details": {
      "field": "email",
      "reason": "البريد الإلكتروني مطلوب"
    },
    "traceId": "trace-123456",
    "timestamp": "2025-01-01T12:00:00Z"
  }
}
```

### 3.2 نظام الأخطاء الموحد (Unified Error Handling)
نظام مركزي لمعالجة جميع أنواع الأخطاء:

#### أنواع الأخطاء (Error Types)
- **VALIDATION_ERROR**: أخطاء التحقق من البيانات
- **AUTHENTICATION_ERROR**: أخطاء المصادقة
- **AUTHORIZATION_ERROR**: أخطاء الصلاحيات
- **BUSINESS_ERROR**: أخطاء منطق الأعمال
- **SYSTEM_ERROR**: أخطاء النظام
- **EXTERNAL_ERROR**: أخطاء الخدمات الخارجية

#### معالج الأخطاء العام (Global Error Handler)
- تحويل الأخطاء إلى التنسيق الموحد
- تسجيل الأخطاء مع التفاصيل
- إخفاء التفاصيل الحساسة في الإنتاج
- إرجاع رموز HTTP مناسبة

### 3.3 نظام الصلاحيات المعزز (Enhanced Authorization System)

#### Guards المتعددة المستويات (Multi-level Guards)
```typescript
// مثال على Guard للصلاحيات
@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.get<string[]>(
      'permissions',
      context.getHandler()
    );

    if (!requiredPermissions) {
      return true; // لا توجد صلاحيات مطلوبة
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    return this.checkPermissions(user, requiredPermissions);
  }

  private checkPermissions(user: User, permissions: string[]): boolean {
    // منطق التحقق من الصلاحيات
    return user.permissions?.some(perm => permissions.includes(perm)) ?? false;
  }
}
```

#### استخدام الصلاحيات في Controllers
```typescript
@Controller('sales')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class SalesController {
  @Post()
  @Permissions('sales.create')
  async createSale(@Body() createSaleDto: CreateSaleDto) {
    // منطق إنشاء البيع
  }

  @Get(':id')
  @Permissions('sales.read', 'sales.read_own')
  async getSale(@Param('id') id: string) {
    // منطق جلب البيع
  }
}
```

#### الصلاحيات المبنية على السياق (Context-based Permissions)
- **صلاحيات عامة**: `sales.create`, `inventory.read`
- **صلاحيات محدودة بالفرع**: `sales.create.branch_1`
- **صلاحيات محدودة بالمستخدم**: `sales.read_own`
- **صلاحيات إدارية**: `admin.*`, `system.*`

#### تدقيق الصلاحيات (Permission Auditing)
- تسجيل جميع محاولات الوصول
- تتبع تغييرات الصلاحيات
- تنبيهات للوصول غير المصرح به
- تقارير الامتثال الأمني

---

## 4. تفاصيل النماذج الأساسية

### نموذج المستخدم (User)
```typescript
{
  id: string (ULID)
  username: string
  email: string
  phone: string
  passwordHash: string
  isActive: boolean
  lastLoginAt: Date
  branchId: string (Foreign Key)
  roleId: string (Foreign Key)
  twoFactorEnabled: boolean
  twoFactorSecret: string
  biometricEnabled: boolean
  createdAt: Date
  updatedAt: Date
}
```

### نموذج المنتج (Product)
```typescript
{
  id: string
  name: string
  description: string
  barcode: string
  categoryId: string
  basePrice: decimal
  costPrice: decimal
  taxId: string
  isActive: boolean
  trackInventory: boolean
  reorderPoint: integer
  imageUrl: string
  createdAt: Date
  updatedAt: Date
}
```

### نموذج فاتورة المبيعات (SalesInvoice)
```typescript
{
  id: string
  invoiceNumber: string
  branchId: string
  customerId: string
  cashierId: string (User)
  subtotal: decimal
  taxAmount: decimal
  discountAmount: decimal
  totalAmount: decimal
  currencyId: string
  status: enum (draft/confirmed/cancelled)
  paymentStatus: enum (pending/paid/partial/refunded)
  notes: string
  createdAt: Date
  updatedAt: Date
}
```

### نموذج حركة المخزون (StockMovement)
```typescript
{
  id: string
  warehouseId: string
  productVariantId: string
  movementType: enum (in/out/adjustment/transfer/return)
  quantity: decimal
  unitCost: decimal
  referenceType: string (sales/return/purchase/adjustment)
  referenceId: string
  reason: string
  performedBy: string (User ID)
  createdAt: Date
}
```

---

## 5. الخدمات المساندة

### 5.1 خدمة التخزين (Object Storage)
- حفظ ملفات PDF للفواتير
- صور المنتجات
- قوالب التقارير
- نسخ احتياطي للمرفقات

### 5.2 خدمة المراقبة (Observability)
- **OpenTelemetry**: تتبع الأداء والأخطاء
- **Prometheus**: مقاييس النظام
- **Loki**: السجلات المركزية
- **Sentry**: تتبع الأخطاء في الإنتاج

### 5.3 خدمة النسخ الاحتياطي (Backup Service)
- نسخ تلقائي يومي لقاعدة البيانات
- نسخ أسبوعي وشهري للمرفقات
- اختبار استعادة دوري
- RPO ≤ 24 ساعة، RTO ≤ 4 ساعات

---

## 6. اعتبارات الأداء والقابلية للتوسع

### 6.1 تحسينات قاعدة البيانات
- فهارس مركبة على (branch_id, created_at)
- فهارس على (product_id, warehouse_id)
- Partitioning للجداول الكبيرة (مثل StockMovement)
- Views محسنة للتقارير الشائعة

### 6.2 التخزين المؤقت (Caching)
- **L1 Cache**: In-memory cache للبيانات السريعة الوصول
- **L2 Cache**: Redis distributed cache للبيانات المشتركة
- **L3 Cache**: Database query result caching
- **TTL Strategies**: انتهاء تلقائي ذكي للكاش
- **Cache Invalidation**: تحديث تلقائي عند التغييرات

### 6.3 الطوابير والمعالجة غير المتزامنة
- BullMQ للمهام الثقيلة
- معالجة المزامنة في الخلفية
- إرسال الإشعارات غير متزامن
- معالجة التقارير المجدولة

---

## 7. خطة التطوير المرحلية

### المرحلة الأولى (MVP - 8 أسابيع)
- وحدات المبيعات والمخزون الأساسية
- المصادقة والصلاحيات
- واجهة الصراف الأساسية
- التقارير البسيطة

### المرحلة الثانية (12 أسبوع)
- المرتجعات والمشتريات
- المحاسبة الأساسية
- Offline-First capabilities
- لوحات المؤشرات

### المرحلة الثالثة (16 أسبوع)
- التكاملات المتقدمة
- النسخ الاحتياطي التلقائي
- المراقبة المتقدمة
- الأمان المعزز

---

هذا الهيكل يضمن:
- **القابلية للصيانة**: فصل واضح للمسؤوليات وطبقات منظمة
- **القابلية للتوسع**: دعم النمو الأفقي مع نظام كاش متعدد المستويات
- **الموثوقية**: معالجة الأخطاء الموحدة وعزل الفشل
- **الأمان**: طبقات متعددة من الحماية مع نظام صلاحيات معزز
- **الاتساق**: توحيد شكل الردود ونظام الأخطاء عبر جميع APIs
- **الأداء**: تحسينات مدروسة للاستعلامات مع إدارة ذكية للكاش

---

## 8. دليل إعداد المشروع (Project Setup Guide)

### 8.1 متطلبات النظام (System Requirements)
```bash
# Node.js LTS (22+)
node --version  # يجب أن يكون 22.0.0 أو أحدث

# PostgreSQL 15+
psql --version  # يجب أن يكون 15.0 أو أحدث

# Redis 7+
redis-cli --version  # يجب أن يكون 7.0 أو أحدث
```

### 8.2 إعداد قاعدة البيانات (Database Setup)
```sql
-- إنشاء قاعدة البيانات
CREATE DATABASE zaytuna_pos;
GRANT ALL PRIVILEGES ON DATABASE zaytuna_pos TO zaytuna_user;

-- إنشاء المستخدم
CREATE USER zaytuna_user WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE zaytuna_pos TO zaytuna_user;
```

### 8.3 إعداد متغيرات البيئة (.env)
```bash
# نسخ ملف البيئة النموذجي
cp .env.example .env

# تحرير متغيرات البيئة
nano .env
```

**محتوى ملف .env:**
```dotenv
# تطبيق
NODE_ENV=development
PORT=3000
APP_NAME=Zaytuna POS
API_PREFIX=api/v1

# قاعدة البيانات
DATABASE_URL=postgresql://zaytuna_user:password@localhost:5432/zaytuna_pos

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your_super_secret_jwt_key_here
JWT_ACCESS_TTL=900
JWT_REFRESH_TTL=604800

# تشفير
ENCRYPTION_KEY=your_32_character_encryption_key

# تخزين الملفات
STORAGE_TYPE=local  # أو s3
STORAGE_PATH=./uploads

# إشعارات
SMS_PROVIDER=twilio
EMAIL_PROVIDER=sendgrid

# مراقبة
SENTRY_DSN=your_sentry_dsn_here
```

### 8.4 تثبيت التبعيات (Dependencies Installation)
```bash
# تثبيت التبعيات
npm install

# تثبيت تبعيات التطوير
npm install -D @types/node typescript ts-node
```

### 8.5 إعداد قاعدة البيانات (Database Migration)
```bash
# تشغيل المايجريشن
npm run migration:run

# إنشاء بيانات أولية (إن وجدت)
npm run seed
```

### 8.6 تشغيل التطبيق (Running the Application)
```bash
# وضع التطوير
npm run start:dev

# وضع الإنتاج
npm run build
npm run start:prod

# مع Docker
docker-compose up -d
```

---

## 9. هيكل المجلدات التفصيلي (Detailed Folder Structure)

```
backend/
├── src/
│   ├── main.ts                           # نقطة دخول التطبيق
│   ├── app.module.ts                     # الوحدة الرئيسية
│   ├── config/                           # إعدادات التطبيق
│   │   ├── database.config.ts
│   │   ├── redis.config.ts
│   │   ├── jwt.config.ts
│   │   └── app.config.ts
│   ├── common/                           # المكونات المشتركة
│   │   ├── decorators/                   # Decorators مخصصة
│   │   │   ├── permissions.decorator.ts
│   │   │   └── public.decorator.ts
│   │   ├── guards/                       # Guards للأمان
│   │   │   ├── jwt.guard.ts
│   │   │   ├── permission.guard.ts
│   │   │   └── role.guard.ts
│   │   ├── interceptors/                 # Interceptors
│   │   │   ├── response.interceptor.ts
│   │   │   ├── logging.interceptor.ts
│   │   │   └── timeout.interceptor.ts
│   │   ├── filters/                      # Exception Filters
│   │   │   ├── http-exception.filter.ts
│   │   │   ├── validation.filter.ts
│   │   │   └── all-exceptions.filter.ts
│   │   ├── pipes/                        # Validation Pipes
│   │   │   ├── validation.pipe.ts
│   │   └── dto/                          # DTOs مشتركة
│   │       ├── pagination.dto.ts
│   │       └── response.dto.ts
│   ├── modules/                          # وحدات الأعمال
│   │   ├── auth/                         # وحدة المصادقة
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── strategies/
│   │   │   │   ├── jwt.strategy.ts
│   │   │   │   └── local.strategy.ts
│   │   │   ├── dto/
│   │   │   │   ├── login.dto.ts
│   │   │   │   └── register.dto.ts
│   │   │   └── entities/
│   │   │       └── user.entity.ts
│   │   ├── sales/                        # وحدة المبيعات
│   │   │   ├── sales.module.ts
│   │   │   ├── sales.service.ts
│   │   │   ├── sales.controller.ts
│   │   │   ├── dto/
│   │   │   │   ├── create-sale.dto.ts
│   │   │   │   └── update-sale.dto.ts
│   │   │   └── entities/
│   │   │       ├── sale.entity.ts
│   │   │       └── sale-line.entity.ts
│   │   ├── inventory/                    # وحدة المخزون
│   │   ├── purchasing/                   # وحدة المشتريات
│   │   ├── accounting/                   # وحدة المحاسبة
│   │   ├── reporting/                    # وحدة التقارير
│   │   └── sync/                         # وحدة المزامنة
│   ├── shared/                           # المكونات المشتركة
│   │   ├── database/                     # إعدادات قاعدة البيانات
│   │   │   ├── prisma.service.ts
│   │   │   └── migrations/
│   │   ├── cache/                        # إعدادات الكاش
│   │   │   ├── cache.service.ts
│   │   │   └── cache.module.ts
│   │   ├── queue/                        # إعدادات الطوابير
│   │   │   ├── queue.service.ts
│   │   │   └── queue.module.ts
│   │   ├── storage/                      # إعدادات التخزين
│   │   │   ├── storage.service.ts
│   │   └── logger/                       # إعدادات التسجيل
│   │       └── logger.service.ts
│   ├── utils/                            # الأدوات المساعدة
│   │   ├── date.util.ts
│   │   ├── string.util.ts
│   │   ├── crypto.util.ts
│   │   └── validation.util.ts
│   └── app.controller.ts                 # Controller الرئيسي
├── test/                                 # ملفات الاختبار
│   ├── e2e/
│   ├── integration/
│   └── unit/
├── scripts/                              # سكريبتات مساعدة
│   ├── setup-db.sh
│   ├── backup.sh
│   └── migrate.sh
├── Dockerfile
├── docker-compose.yml
├── package.json
├── tsconfig.json
└── nest-cli.json
```

---

## 10. أمثلة كود للمكونات الأساسية (Code Examples)

### 10.1 مثال على Controller
```typescript
@Controller('sales')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  @Permissions('sales.create')
  async create(@Body() createSaleDto: CreateSaleDto, @User() user: User) {
    return this.salesService.create(createSaleDto, user);
  }

  @Get()
  @Permissions('sales.read')
  async findAll(@Query() query: FindSalesDto) {
    return this.salesService.findAll(query);
  }

  @Get(':id')
  @Permissions('sales.read', 'sales.read_own')
  async findOne(@Param('id') id: string, @User() user: User) {
    return this.salesService.findOne(id, user);
  }

  @Patch(':id')
  @Permissions('sales.update')
  async update(
    @Param('id') id: string,
    @Body() updateSaleDto: UpdateSaleDto,
    @User() user: User
  ) {
    return this.salesService.update(id, updateSaleDto, user);
  }

  @Delete(':id')
  @Permissions('sales.delete')
  async remove(@Param('id') id: string, @User() user: User) {
    return this.salesService.remove(id, user);
  }
}
```

### 10.2 مثال على Service
```typescript
@Injectable()
export class SalesService {
  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService,
    private auditService: AuditService,
  ) {}

  async create(createSaleDto: CreateSaleDto, user: User) {
    // التحقق من الصلاحيات
    await this.checkPermissions(user, 'sales.create');

    // التحقق من صحة البيانات
    await this.validateSaleData(createSaleDto);

    // إنشاء معاملة قاعدة البيانات
    return this.prisma.$transaction(async (tx) => {
      // إنشاء الفاتورة
      const sale = await tx.sale.create({
        data: {
          ...createSaleDto,
          createdBy: user.id,
          branchId: user.branchId,
        },
      });

      // تحديث المخزون
      await this.updateInventory(tx, createSaleDto.lines);

      // إنشاء القيود المحاسبية
      await this.createAccountingEntries(tx, sale);

      // تسجيل العملية في السجل
      await this.auditService.log({
        action: 'CREATE',
        entity: 'SALE',
        entityId: sale.id,
        userId: user.id,
        changes: createSaleDto,
      });

      // تحديث الكاش
      await this.invalidateCache(['sales', `branch_${user.branchId}`]);

      return sale;
    });
  }

  private async checkPermissions(user: User, permission: string) {
    // منطق التحقق من الصلاحيات
  }

  private async validateSaleData(dto: CreateSaleDto) {
    // التحقق من صحة البيانات
  }

  private async updateInventory(tx: Prisma.TransactionClient, lines: any[]) {
    // تحديث المخزون
  }

  private async createAccountingEntries(tx: Prisma.TransactionClient, sale: any) {
    // إنشاء القيود المحاسبية
  }

  private async invalidateCache(keys: string[]) {
    // تحديث الكاش
  }
}
```

### 10.3 مثال على Entity/Model
```typescript
@Entity()
@Index(['branchId', 'createdAt'])
@Index(['customerId'])
export class Sale {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  @Index()
  invoiceNumber: string;

  @ManyToOne(() => Branch)
  @JoinColumn({ name: 'branchId' })
  branch: Branch;

  @Column({ type: 'uuid' })
  branchId: string;

  @ManyToOne(() => Customer, { nullable: true })
  @JoinColumn({ name: 'customerId' })
  customer?: Customer;

  @Column({ type: 'uuid', nullable: true })
  customerId?: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'cashierId' })
  cashier: User;

  @Column({ type: 'uuid' })
  cashierId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  taxAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  discountAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalAmount: number;

  @ManyToOne(() => Currency)
  @JoinColumn({ name: 'currencyId' })
  currency: Currency;

  @Column({ type: 'uuid' })
  currencyId: string;

  @Column({
    type: 'enum',
    enum: SaleStatus,
    default: SaleStatus.DRAFT
  })
  status: SaleStatus;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING
  })
  paymentStatus: PaymentStatus;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @OneToMany(() => SaleLine, line => line.sale, { cascade: true })
  lines: SaleLine[];

  @OneToMany(() => Payment, payment => payment.sale)
  payments: Payment[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
```

### 10.4 مثال على DTO
```typescript
export class CreateSaleDto {
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSaleLineDto)
  @ArrayMinSize(1)
  lines: CreateSaleLineDto[];

  @IsOptional()
  @IsUUID()
  currencyId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePaymentDto)
  payments?: CreatePaymentDto[];
}

export class CreateSaleLineDto {
  @IsUUID()
  productId: string;

  @IsUUID()
  productVariantId: string;

  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.001)
  quantity: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  unitPrice: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  discountAmount?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  discountPercentage?: number;
}
```

---

## 11. إرشادات التطوير (Development Guidelines)

### 11.1 اتفاقيات التسمية (Naming Conventions)
```typescript
// Classes - PascalCase
export class SalesService {}
export class CreateSaleDto {}

// Methods - camelCase
async createSale() {}
async findAllSales() {}

// Variables - camelCase
const salesData = [];
const totalAmount = 0;

// Constants - UPPER_SNAKE_CASE
export const MAX_RETRY_ATTEMPTS = 3;
export const DEFAULT_PAGE_SIZE = 20;

// Files - kebab-case
sales.service.ts
create-sale.dto.ts
sales.controller.ts

// Database tables - snake_case
sales_invoices
user_permissions
product_categories
```

### 11.2 إرشادات كتابة الكود (Code Writing Guidelines)
```typescript
// ✅ جيد - استخدام async/await
async function processSale(saleId: string): Promise<Sale> {
  const sale = await this.salesRepository.findById(saleId);
  if (!sale) {
    throw new NotFoundException('Sale not found');
  }
  return sale;
}

// ❌ سيء - استخدام callbacks أو promises بشكل معقد
function processSale(saleId: string): Promise<Sale> {
  return this.salesRepository.findById(saleId).then(sale => {
    if (!sale) throw new Error('Sale not found');
    return sale;
  });
}

// ✅ جيد - التحقق من الصلاحيات في البداية
@Post()
@Permissions('sales.create')
async create(@Body() dto: CreateSaleDto, @User() user: User) {
  // منطق الإنشاء
}

// ✅ جيد - استخدام DTOs للتحقق من البيانات
@Post()
async create(@Body() createSaleDto: CreateSaleDto) {
  // البيانات تم التحقق منها تلقائياً
}

// ✅ جيد - معالجة الأخطاء بشكل مناسب
try {
  await this.salesService.create(dto);
} catch (error) {
  if (error instanceof ValidationError) {
    throw new BadRequestException(error.message);
  }
  throw error;
}
```

### 11.3 إرشادات قاعدة البيانات (Database Guidelines)
```sql
-- ✅ جيد - استخدام foreign keys
CREATE TABLE sales_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES branches(id),
  customer_id UUID REFERENCES customers(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ✅ جيد - إنشاء indexes للاستعلامات الشائعة
CREATE INDEX idx_sales_branch_date ON sales_invoices(branch_id, created_at);
CREATE INDEX idx_sales_customer ON sales_invoices(customer_id);

-- ✅ جيد - استخدام constraints
ALTER TABLE products ADD CONSTRAINT chk_price_positive CHECK (price > 0);
ALTER TABLE inventory ADD CONSTRAINT chk_quantity_non_negative CHECK (quantity >= 0);
```

### 11.4 إرشادات الاختبار (Testing Guidelines)
```typescript
describe('SalesService', () => {
  let service: SalesService;
  let mockRepository: MockType<Repository<Sale>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SalesService,
        {
          provide: getRepositoryToken(Sale),
          useFactory: jest.fn(() => ({
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
          })),
        },
      ],
    }).compile();

    service = module.get<SalesService>(SalesService);
    mockRepository = module.get(getRepositoryToken(Sale));
  });

  it('should create a sale', async () => {
    // Arrange
    const createSaleDto = { /* test data */ };
    const expectedSale = { id: '1', ...createSaleDto };

    mockRepository.create.mockReturnValue(expectedSale);
    mockRepository.save.mockReturnValue(expectedSale);

    // Act
    const result = await service.create(createSaleDto);

    // Assert
    expect(result).toEqual(expectedSale);
    expect(mockRepository.create).toHaveBeenCalledWith(createSaleDto);
    expect(mockRepository.save).toHaveBeenCalledWith(expectedSale);
  });
});
```

---

## 12. أفضل الممارسات (Best Practices)

### 12.1 أمان (Security)
- **مبدأ Least Privilege**: منح الحد الأدنى من الصلاحيات المطلوبة
- **Input Validation**: التحقق من جميع المدخلات على مستويات متعددة
- **SQL Injection Prevention**: استخدام parameterized queries
- **XSS Protection**: sanitization لجميع المدخلات
- **Rate Limiting**: حماية من هجمات DDoS
- **Audit Logging**: تسجيل جميع العمليات الحساسة

### 12.2 أداء (Performance)
- **Database Indexing**: إنشاء indexes للاستعلامات الشائعة
- **Query Optimization**: تجنب N+1 queries
- **Caching Strategy**: استخدام الكاش للبيانات الثابتة
- **Pagination**: تطبيق pagination للقوائم الكبيرة
- **Lazy Loading**: تحميل البيانات عند الحاجة
- **Database Connection Pooling**: إدارة فعالة للاتصالات

### 12.3 قابلية الصيانة (Maintainability)
- **Single Responsibility**: كل class مسؤول عن مهمة واحدة
- **DRY Principle**: عدم تكرار الكود
- **SOLID Principles**: تطبيق مبادئ التصميم الجيد
- **Documentation**: توثيق شامل للكود
- **Code Reviews**: مراجعة الكود من قبل الفريق
- **Version Control**: استخدام git بشكل صحيح

### 12.4 مراقبة وصيانة (Monitoring & Maintenance)
- **Health Checks**: مراقبة حالة التطبيق والخدمات
- **Metrics Collection**: جمع المقاييس الأداء
- **Error Tracking**: تتبع وإصلاح الأخطاء
- **Backup Strategy**: خطة نسخ احتياطي موثوقة
- **Deployment Automation**: نشر تلقائي وآمن
- **Incident Response**: خطة التعامل مع الحوادث

---

## 13. دليل استكشاف الأخطاء (Troubleshooting Guide)

### 13.1 مشاكل شائعة في قاعدة البيانات (Database Issues)
```bash
# فحص اتصال قاعدة البيانات
npm run db:check

# تشغيل migrations
npm run migration:run

# إعادة تعيين قاعدة البيانات (في التطوير فقط)
npm run db:reset

# فحص حالة الاتصال
psql -h localhost -U zaytuna_user -d zaytuna_pos -c "SELECT version();"
```

### 13.2 مشاكل في Redis/Cache
```bash
# فحص اتصال Redis
redis-cli ping

# عرض مفاتيح الكاش
redis-cli keys "cache:*"

# مسح الكاش
redis-cli flushall

# مراقبة Redis
redis-cli monitor
```

### 13.3 مشاكل في الأداء (Performance Issues)
```bash
# فحص استهلاك الذاكرة
node --expose-gc --inspect index.js

# مراقبة استخدام CPU
top -p $(pgrep node)

# تحليل استدعاءات قاعدة البيانات
npm run db:analyze

# فحص الطوابير
npm run queue:status
```

### 13.4 مشاكل في الصلاحيات (Permission Issues)
```typescript
// فحص صلاحيات المستخدم
const userPermissions = await this.authService.getUserPermissions(userId);

// فحص سجلات التدقيق
const auditLogs = await this.auditService.getRecentLogs({
  userId,
  action: 'ACCESS_DENIED'
});

// تحديث صلاحيات المستخدم
await this.authService.updateUserPermissions(userId, newPermissions);
```

### 13.5 مشاكل في المزامنة (Sync Issues)
```bash
# فحص حالة المزامنة
npm run sync:status

# إعادة مزامنة البيانات
npm run sync:reset

# فحص الطوابير المعلقة
npm run queue:pending

# تشغيل المزامنة يدوياً
npm run sync:manual
```

---

## 14. قائمة المهام والتطوير (Development Checklist)

### 14.1 قبل البدء في التطوير (Pre-Development)
- [ ] قراءة متطلبات الميزة
- [ ] فهم تأثير الميزة على النظام الحالي
- [ ] مراجعة التصميم مع الفريق
- [ ] إنشاء تذكرة في نظام التتبع

### 14.2 أثناء التطوير (During Development)
- [ ] كتابة اختبارات unit للوظائف الجديدة
- [ ] تطبيق validation لجميع المدخلات
- [ ] إضافة logging مناسب
- [ ] تحديث التوثيق
- [ ] مراجعة الكود (code review)

### 14.3 قبل النشر (Pre-Deployment)
- [ ] تشغيل جميع الاختبارات
- [ ] فحص الأداء
- [ ] فحص الأمان
- [ ] اختبار التكامل
- [ ] تحديث migrations قاعدة البيانات

### 14.4 بعد النشر (Post-Deployment)
- [ ] مراقبة السجلات
- [ ] فحص مقاييس الأداء
- [ ] التحقق من عمل الميزة في الإنتاج
- [ ] توثيق أي مشاكل وإصلاحها

---

## 15. المراجع والموارد (References & Resources)

### 15.1 التوثيق الرسمي
- [NestJS Documentation](https://docs.nestjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Redis Documentation](https://redis.io/documentation)

### 15.2 أفضل الممارسات
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [API Design Best Practices](https://docs.microsoft.com/en-us/azure/architecture/best-practices/api-design)
- [Database Design Best Practices](https://www.lucidchart.com/pages/database-diagram/database-design)

### 15.3 أدوات مفيدة
- [Postman](https://www.postman.com/) - اختبار APIs
- [pgAdmin](https://www.pgadmin.org/) - إدارة PostgreSQL
- [Redis Insight](https://redis.com/redis-enterprise/redis-insight/) - مراقبة Redis
- [Sentry](https://sentry.io/) - تتبع الأخطاء

---

هذا الدليل يوفر إرشادات شاملة لبناء باك إند قوي وقابل للصيانة. استخدمه كمرجع أساسي أثناء التطوير وأضف إليه حسب احتياجات المشروع.
