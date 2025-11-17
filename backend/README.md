# نظام زيتونة - الباك إند (Zaytuna POS Backend)

<p align="center">
  <img src="https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" alt="NestJS" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white" alt="Redis" />
</p>

## نظرة عامة

نظام شامل لإدارة نقاط البيع يُبنى باستخدام **NestJS** و**TypeScript**، يدعم جميع العمليات التجارية للمتاجر والمطاعم مع إمكانية العمل في وضع عدم الاتصال.

### الميزات الرئيسية
- ✅ إدارة شاملة للمبيعات والمرتجعات
- ✅ نظام مخزون متقدم مع تتبع دقيق
- ✅ إدارة المشتريات والموردين
- ✅ نظام محاسبي كامل (General Ledger)
- ✅ تقارير تفاعلية ولوحات مؤشرات
- ✅ دعم وضع عدم الاتصال (Offline-First)
- ✅ نظام مصادقة معزز مع 2FA
- ✅ دعم متعدد الفروع والمخازن

## التقنيات المستخدمة

### الإطار واللغة
- **NestJS** - إطار عمل Node.js للتطبيقات القابلة للتوسع
- **TypeScript** - لغة برمجة مع تحقق أنواع قوي

### قاعدة البيانات والتخزين
- **PostgreSQL** - قاعدة بيانات رئيسية
- **Redis** - تخزين مؤقت وإدارة الجلسات
- **Prisma** - ORM لإدارة قاعدة البيانات

### الأمان والمصادقة
- **JWT** - مصادقة الرموز المميزة
- **2FA** - مصادقة ثنائية العامل
- **WebAuthn** - مصادقة بيومترية

## متطلبات النظام

- **Node.js** 22.0.0 أو أحدث
- **PostgreSQL** 15.0 أو أحدث
- **Redis** 7.0 أو أحدث

### إعداد قاعدة البيانات

#### 1. تثبيت PostgreSQL
```bash
# على Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# على macOS (استخدام Homebrew)
brew install postgresql
brew services start postgresql

# على Windows (استخدام Chocolatey)
choco install postgresql
```

#### 2. إنشاء قاعدة البيانات والمستخدم
```sql
-- تسجيل الدخول كـ postgres user
sudo -u postgres psql

-- إنشاء قاعدة البيانات
CREATE DATABASE zaytuna_pos;

-- إنشاء المستخدم
CREATE USER zaytuna_user WITH ENCRYPTED PASSWORD 'password';

-- منح الصلاحيات
GRANT ALL PRIVILEGES ON DATABASE zaytuna_pos TO zaytuna_user;

-- الخروج
\q
```

#### 3. إعداد Redis
```bash
# على Ubuntu/Debian
sudo apt install redis-server
sudo systemctl start redis-server

# على macOS
brew install redis
brew services start redis

# على Windows
# قم بتحميل Redis من https://redis.io/download
```

## إعداد المشروع

### 1. تثبيت التبعيات
```bash
npm install
```

### 2. إعداد متغيرات البيئة
```bash
# نسخ ملف البيئة النموذجي
cp .env.example .env

# تحرير متغيرات البيئة حسب البيئة المطلوبة
nano .env
```

### 3. إعداد قاعدة البيانات
```bash
# إنشاء الجداول والعلاقات
npm run db:push

# أو بديل: تشغيل المايجريشن (إذا كان هناك migrations)
npm run db:migrate

# إنشاء بيانات أولية
npm run db:seed

# توليد عميل Prisma (إذا لم يتم تلقائياً)
npm run db:generate
```

### 4. إعداد متغيرات البيئة (اختياري)
```bash
# إذا كنت تريد تخصيص الإعدادات
cp .env.example .env.local
# قم بتحرير .env.local حسب احتياجاتك
```

### 5. إعداد Redis (للكاش)
```bash
# تأكد من تشغيل Redis على المنفذ 6379
redis-cli ping  # يجب أن يرجع PONG

# اختبار الكاش
npm run cache:test
```

## تشغيل المشروع

```bash
# وضع التطوير (مع المراقبة)
npm run start:dev

# وضع الإنتاج
npm run build
npm run start:prod

# وضع التشخيص
npm run start:debug
```

## اختبار المشروع

```bash
# اختبارات الوحدات
npm run test

# اختبارات الوحدات مع المراقبة
npm run test:watch

# اختبارات التكامل النهائية
npm run test:e2e

# تغطية الاختبارات
npm run test:cov
```

## أدوات التطوير

```bash
# تنسيق الكود
npm run format

# فحص الكود
npm run lint

# إصلاح مشاكل الكود تلقائياً
npm run lint:fix

# اختبار الكاش
npm run cache:test
```

## استخدام نظام الكاش

### استخدام Cache Decorators

```typescript
import { Cache, CacheShort, CacheLong, InvalidateCache } from './common/decorators/cache.decorator';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @Cache({ ttl: 300 }) // كاش لمدة 5 دقائق
  async findAll() {
    return this.productsService.findAll();
  }

  @Get(':id')
  @CacheShort() // كاش لمدة 5 دقائق
  async findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Post()
  @InvalidateCache('products:*') // إبطال جميع مفاتيح المنتجات
  async create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }
}
```

### استخدام Cache Service مباشرة

```typescript
import { CacheService } from './shared/cache/cache.service';

@Injectable()
export class ProductsService {
  constructor(private readonly cacheService: CacheService) {}

  async findAll() {
    const cacheKey = 'products:all';

    // محاولة الحصول من الكاش أولاً
    const cached = await this.cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    // الحصول من قاعدة البيانات
    const products = await this.prisma.product.findMany();

    // حفظ في الكاش لمدة 5 دقائق
    await this.cacheService.set(cacheKey, products, { ttl: 300 });

    return products;
  }
}
```

## نظام الاستجابات والأخطاء الموحد

### تنسيق الاستجابات

جميع استجابات API تتبع التنسيق الموحد التالي:

#### استجابة ناجحة:
```json
{
  "success": true,
  "data": {
    // بيانات الاستجابة
  },
  "meta": {
    "timestamp": "2025-01-01T12:00:00.000Z",
    "requestId": "req-123456789",
    "version": "1.0.0",
    "path": "/api/v1/users",
    "method": "GET",
    "duration": 150
  },
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

#### استجابة خطأ:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "خطأ في التحقق من البيانات",
    "details": {
      "field": "email",
      "reason": "الحقل email مطلوب"
    },
    "traceId": "trace-123456789",
    "timestamp": "2025-01-01T12:00:00.000Z",
    "path": "/api/v1/users",
    "method": "POST"
  }
}
```

### استخدام نظام الأخطاء

```typescript
import { BadRequestException } from '@nestjs/common';
import { ErrorCode, ErrorMessages } from './common/constants/error-codes';

// رمي خطأ مخصص
throw new BadRequestException({
  code: ErrorCode.VALIDATION_ERROR,
  message: ErrorMessages[ErrorCode.VALIDATION_ERROR],
  details: {
    field: 'email',
    reason: 'البريد الإلكتروني مطلوب'
  }
});
```

### رموز الأخطاء الشائعة

- `VALIDATION_ERROR` (400): أخطاء التحقق من البيانات
- `AUTHENTICATION_ERROR` (401): أخطاء المصادقة
- `AUTHORIZATION_ERROR` (403): أخطاء الصلاحيات
- `NOT_FOUND_ERROR` (404): العنصر غير موجود
- `SYSTEM_ERROR` (500): أخطاء النظام

### endpoints الاختبار

يمكنك اختبار النظام من خلال endpoints التالية:

```bash
# اختبار الاستجابة العادية
GET /health

# اختبار pagination
GET /test-pagination?page=1&limit=10

# اختبار خطأ
GET /test-error
```

## نظام المصادقة والصلاحيات

### استخدام Decorators الصلاحيات

```typescript
import { Controller, Get, Post } from '@nestjs/common';
import { Public, Permissions, RequireRead, RequireCreate } from './common/decorators/permissions.decorator';

@Controller('users')
export class UsersController {

  @Get()
  @RequireRead() // يتطلب صلاحية القراءة
  async findAll() {
    // منطق جلب المستخدمين
  }

  @Post()
  @Permissions('create', 'admin') // يتطلب صلاحية الإنشاء أو الإدارة
  async create() {
    // منطق إنشاء مستخدم جديد
  }

  @Get('public')
  @Public() // متاح للجميع بدون مصادقة
  async getPublicInfo() {
    // معلومات عامة
  }
}
```

### أنواع الصلاحيات الشائعة

- `read` - قراءة البيانات
- `create` - إنشاء سجلات جديدة
- `update` - تحديث البيانات
- `delete` - حذف السجلات
- `admin` - صلاحيات إدارية كاملة

### نظام Guards العالمي

جميع الـ endpoints محمية تلقائياً بـ:

1. **JWT Auth Guard**: التحقق من المصادقة
2. **Permission Guard**: التحقق من الصلاحيات

### مثال على الاستخدام

```typescript
// في Controller
@Post('protected-endpoint')
@Permissions('sales.create') // يتطلب صلاحية إنشاء المبيعات
async createSale(@Body() data: CreateSaleDto) {
  // سيتم التحقق من:
  // 1. وجود JWT token صحيح
  // 2. وجود صلاحية 'sales.create' لدى المستخدم
  return this.salesService.create(data);
}
```

### endpoints الاختبار

```bash
# الوصول للـ endpoint العام
GET / (متاح بدون مصادقة)

# محاولة الوصول لـ endpoint محمي بدون token
GET /test-pagination (سيرفض الطلب)

# إضافة token في الـ header
Authorization: Bearer <your-jwt-token>
GET /test-pagination (سيسمح حسب الصلاحيات)
```

## نظام المصادقة والـ API

### Auth API Endpoints

#### تسجيل مستخدم جديد
```bash
POST /auth/register
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "SecurePassword123",
  "phone": "+966501234567",
  "roleId": "role_user",
  "branchId": "branch_main"
}
```

#### تسجيل الدخول
```bash
POST /auth/login
Content-Type: application/json

{
  "username": "john_doe",
  "password": "SecurePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "user_123",
      "username": "john_doe",
      "email": "john@example.com",
      "role": "User",
      "branch": "Main Branch"
    },
    "expiresIn": 900
  }
}
```

#### تحديث الرمز المميز
```bash
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### تسجيل الخروج
```bash
POST /auth/logout
Authorization: Bearer <access_token>
```

#### معلومات المستخدم الحالي
```bash
GET /auth/me
Authorization: Bearer <access_token>
```

#### تغيير كلمة المرور
```bash
PATCH /auth/password
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "currentPassword": "OldPassword123",
  "newPassword": "NewPassword123"
}
```

#### إعادة تعيين كلمة المرور (للمشرفين)
```bash
PATCH /auth/users/{userId}/password
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "newPassword": "NewAdminPassword123"
}
```

### استخدام الرموز المميزة

جميع الـ requests المحمية تحتاج إلى تضمين الرمز المميز في الـ header:

```bash
Authorization: Bearer <your_access_token>
```

### أنواع الرموز المميزة

- **Access Token**: يستخدم للوصول للموارد المحمية (مدة 15 دقيقة)
- **Refresh Token**: يستخدم لتجديد Access Token (مدة 7 أيام)

### أدوار وصلاحيات النظام

- **Super Admin**: صلاحيات كاملة على النظام
- **Admin**: إدارة المستخدمين والإعدادات
- **Manager**: إدارة العمليات اليومية
- **Cashier**: الوصول للمبيعات والفواتير
- **User**: وصول محدود للقراءة

### اختبار النظام

```bash
# تشغيل الاختبار الشامل
npm run auth:full-test
```

## نظام إدارة الأدوار والصلاحيات (RBAC)

### فئات الصلاحيات المتاحة

#### 🔧 صلاحيات النظام
- `system.admin` - إدارة النظام الكاملة
- `system.config` - إعدادات النظام
- `system.logs` - عرض السجلات

#### 👥 صلاحيات المستخدمين
- `users.read` - قراءة بيانات المستخدمين
- `users.create` - إنشاء مستخدمين جدد
- `users.update` - تحديث بيانات المستخدمين
- `users.delete` - حذف المستخدمين
- `users.manage` - إدارة شاملة

#### 🏪 صلاحيات المنتجات
- `products.read` - قراءة المنتجات
- `products.create` - إنشاء منتجات جديدة
- `products.update` - تحديث المنتجات
- `products.delete` - حذف المنتجات

#### 💰 صلاحيات المبيعات
- `sales.read` - قراءة فواتير المبيعات
- `sales.create` - إنشاء فواتير مبيعات
- `sales.update` - تحديث فواتير المبيعات
- `sales.delete` - حذف فواتير المبيعات
- `sales.refund` - معالجة المرتجعات

#### 📦 صلاحيات المخزون
- `inventory.read` - قراءة بيانات المخزون
- `inventory.adjust` - تعديل المخزون
- `inventory.transfer` - نقل المخزون

#### 💼 صلاحيات المشتريات
- `purchases.read` - قراءة فواتير المشتريات
- `purchases.create` - إنشاء أوامر شراء
- `purchases.update` - تحديث أوامر الشراء

#### 🧾 صلاحيات المحاسبة
- `accounting.read` - قراءة السجلات المحاسبية
- `accounting.journal` - إدارة القيود اليومية
- `accounting.reports` - عرض التقارير المالية

#### 📊 صلاحيات التقارير
- `reports.sales` - تقارير المبيعات
- `reports.inventory` - تقارير المخزون
- `reports.financial` - التقارير المالية

### Roles API Endpoints

#### إدارة الأدوار
```bash
GET /roles - قائمة جميع الأدوار
POST /roles - إنشاء دور جديد
GET /roles/:id - تفاصيل دور محدد
PATCH /roles/:id - تحديث دور
DELETE /roles/:id - حذف دور
GET /roles/stats - إحصائيات الأدوار
POST /roles/assign - تعيين دور لمستخدم
```

#### إدارة الصلاحيات
```bash
GET /permissions - قائمة جميع الصلاحيات
GET /permissions/categories - فئات الصلاحيات
GET /permissions/category/:category - صلاحيات فئة محددة
GET /permissions/validate/:permission - التحقق من صحة صلاحية
```

### أمثلة على الاستخدام

#### إنشاء دور جديد
```bash
POST /roles
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "Sales Manager",
  "description": "مدير المبيعات",
  "permissions": [
    "sales.read",
    "sales.create",
    "sales.update",
    "reports.sales",
    "users.read"
  ],
  "isSystemRole": false
}
```

#### تعيين دور لمستخدم
```bash
POST /roles/assign
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "userId": "user_123",
  "roleId": "role_sales_manager"
}
```

### الأدوار الافتراضية

1. **Super Admin** - صلاحيات كاملة
2. **Admin** - إدارة المستخدمين والإعدادات
3. **Manager** - إدارة العمليات اليومية
4. **Cashier** - المبيعات والفواتير
5. **User** - صلاحيات محدودة

### نظام الصلاحيات الهرمي

- الصلاحيات تتضمن الصلاحيات الفرعية تلقائياً
- `sales` تشمل `sales.read`, `sales.create`, إلخ
- `admin` تشمل جميع الصلاحيات
- يمكن تخصيص الصلاحيات بدقة لكل دور

### اختبار النظام

```bash
# تشغيل اختبار RBAC
npm run rbac:test
```

## نظام الفروع والمخازن (Branches & Warehouses)

### إدارة الفروع

#### إنشاء فرع جديد
```bash
POST /branches
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "فرع الرياض",
  "code": "BR-RIYADH",
  "address": "الرياض، المملكة العربية السعودية",
  "phone": "+966112345678",
  "email": "riyadh@company.com",
  "companyId": "company_123",
  "managerId": "user_456"
}
```

#### إدارة الفروع
```bash
GET /branches - قائمة جميع الفروع
GET /branches?companyId=xyz - فروع شركة محددة
GET /branches/:id - تفاصيل فرع
PATCH /branches/:id - تحديث فرع
DELETE /branches/:id - حذف فرع
GET /branches/stats - إحصائيات الفروع
GET /branches/:id/users - مستخدمو الفرع
```

### إدارة المخازن

#### إنشاء مخزن جديد
```bash
POST /warehouses
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "مخزن الرياض الرئيسي",
  "code": "WH-RIYADH-MAIN",
  "address": "مخزن الرياض",
  "phone": "+966119876543",
  "email": "warehouse@company.com",
  "branchId": "branch_123",
  "managerId": "user_456"
}
```

#### إدارة المخازن
```bash
GET /warehouses - قائمة جميع المخازن
GET /warehouses?branchId=xyz - مخازن فرع محدد
GET /warehouses/:id - تفاصيل مخزن
PATCH /warehouses/:id - تحديث مخزن
DELETE /warehouses/:id - حذف مخزن
GET /warehouses/stats - إحصائيات المخازن
GET /warehouses/:id/stock - مخزون المخزن
```

### نقل المخزون بين المخازن

```bash
POST /warehouses/transfer-stock
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "fromWarehouseId": "warehouse_123",
  "toWarehouseId": "warehouse_456",
  "productVariantId": "variant_789",
  "quantity": 50,
  "notes": "نقل مخزون لتلبية الطلب"
}
```

### Branch-based Filtering

جميع endpoints تدعم الفلترة حسب الفرع:

```typescript
// في Controllers
@Permissions('inventory.read')
findAll(@Query('branchId') branchId?: string) {
  return this.warehouseService.findAll(branchId);
}
```

### إحصائيات شاملة

#### إحصائيات الفروع
```json
{
  "totalBranches": 5,
  "activeBranches": 4,
  "inactiveBranches": 1,
  "totalCompanies": 2,
  "averageBranchesPerCompany": 2.5,
  "totalUsers": 25,
  "totalWarehouses": 8
}
```

#### إحصائيات المخازن
```json
{
  "totalWarehouses": 8,
  "activeWarehouses": 7,
  "inactiveWarehouses": 1,
  "totalStockItems": 1250,
  "totalStockQuantity": 50000,
  "averageWarehousesPerBranch": 1.6
}
```

### أذونات مطلوبة

- `branches.read` - قراءة بيانات الفروع
- `branches.manage` - إدارة الفروع (إنشاء/تحديث/حذف)
- `inventory.read` - قراءة بيانات المخازن والمخزون
- `inventory.transfer` - نقل المخزون بين المخازن

### اختبار النظام

```bash
# تشغيل اختبار الفروع والمخازن
npm run branches:test
```

## نظام الفروع والمخازن (Branches & Warehouses)

### إدارة الفروع

#### إنشاء فرع جديد
```bash
POST /branches
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "فرع الرياض",
  "code": "BR-RIYADH",
  "address": "الرياض، المملكة العربية السعودية",
  "phone": "+966112345678",
  "email": "riyadh@company.com",
  "companyId": "company_123",
  "managerId": "user_456"
}
```

#### إدارة الفروع
```bash
GET /branches - قائمة جميع الفروع
GET /branches?companyId=xyz - فروع شركة محددة
GET /branches/:id - تفاصيل فرع
PATCH /branches/:id - تحديث فرع
DELETE /branches/:id - حذف فرع
GET /branches/stats - إحصائيات الفروع
GET /branches/:id/users - مستخدمو الفرع
```

### إدارة المخازن

#### إنشاء مخزن جديد
```bash
POST /warehouses
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "مخزن الرياض الرئيسي",
  "code": "WH-RIYADH-MAIN",
  "address": "مخزن الرياض",
  "phone": "+966119876543",
  "email": "warehouse@company.com",
  "branchId": "branch_123",
  "managerId": "user_456"
}
```

#### إدارة المخازن
```bash
GET /warehouses - قائمة جميع المخازن
GET /warehouses?branchId=xyz - مخازن فرع محدد
GET /warehouses/:id - تفاصيل مخزن
PATCH /warehouses/:id - تحديث مخزن
DELETE /warehouses/:id - حذف مخزن
GET /warehouses/stats - إحصائيات المخازن
GET /warehouses/:id/stock - مخزون المخزن
```

### نقل المخزون بين المخازن

```bash
POST /warehouses/transfer-stock
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "fromWarehouseId": "warehouse_123",
  "toWarehouseId": "warehouse_456",
  "productVariantId": "variant_789",
  "quantity": 50,
  "notes": "نقل مخزون لتلبية الطلب"
}
```

### Branch-based Filtering

جميع endpoints تدعم الفلترة حسب الفرع:

```typescript
// في Controllers
@Permissions('inventory.read')
findAll(@Query('branchId') branchId?: string) {
  return this.warehouseService.findAll(branchId);
}
```

### إحصائيات شاملة

#### إحصائيات الفروع
```json
{
  "totalBranches": 5,
  "activeBranches": 4,
  "inactiveBranches": 1,
  "totalCompanies": 2,
  "averageBranchesPerCompany": 2.5,
  "totalUsers": 25,
  "totalWarehouses": 8
}
```

#### إحصائيات المخازن
```json
{
  "totalWarehouses": 8,
  "activeWarehouses": 7,
  "inactiveWarehouses": 1,
  "totalStockItems": 1250,
  "totalStockQuantity": 50000,
  "averageWarehousesPerBranch": 1.6
}
```

### أذونات مطلوبة

- `branches.read` - قراءة بيانات الفروع
- `branches.manage` - إدارة الفروع (إنشاء/تحديث/حذف)
- `inventory.read` - قراءة بيانات المخازن والمخزون
- `inventory.transfer` - نقل المخزون بين المخازن

### نماذج قاعدة البيانات

#### نموذج StockItem
```sql
model StockItem {
  id                String  @id @default(cuid()) @db.VarChar(50)
  warehouseId       String  @db.VarChar(50)
  productVariantId  String  @db.VarChar(50)
  quantity          Decimal @db.Decimal(10, 3)
  minStock          Decimal @default(0) @db.Decimal(10, 3)
  maxStock          Decimal @default(1000) @db.Decimal(10, 3)

  warehouse Warehouse @relation(fields: [warehouseId], references: [id], onDelete: Cascade)
  stockMovements StockMovement[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([warehouseId, productVariantId])
  @@map("stock_items")
}
```

#### نموذج StockMovement
```sql
model StockMovement {
  id                String   @id @default(cuid()) @db.VarChar(50)
  warehouseId       String   @db.VarChar(50)
  productVariantId  String   @db.VarChar(50)
  movementType      String   @db.VarChar(50) // in, out, adjustment, transfer
  quantity          Decimal  @db.Decimal(10, 3)
  referenceType     String?  @db.VarChar(50) // sales, purchase, adjustment, transfer
  referenceId       String?  @db.VarChar(50)
  reason            String?  @db.Text
  performedBy       String?  @db.VarChar(50) // User ID

  warehouse Warehouse @relation(fields: [warehouseId], references: [id], onDelete: Cascade)
  stockItem StockItem @relation(fields: [warehouseId, productVariantId], references: [warehouseId, productVariantId], onDelete: Cascade)

  createdAt DateTime @default(now())

  @@map("stock_movements")
}
```

### اختبار النظام

```bash
# تشغيل اختبار الفروع والمخازن
npm run branches:test
```

## نظام إدارة المنتجات (Product Management)

### إدارة الفئات

#### إنشاء فئة جديدة
```bash
POST /categories
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "الإلكترونيات",
  "description": "أجهزة ومعدات إلكترونية",
  "parentId": "parent_category_id", // اختياري للفئات الفرعية
  "imageUrl": "https://example.com/electronics.jpg"
}
```

#### إدارة الفئات
```bash
GET /categories - قائمة الفئات
GET /categories/root - الفئات الجذر
GET /categories/:id - تفاصيل فئة
GET /categories/:id/subcategories - الفئات الفرعية
PATCH /categories/:id - تحديث فئة
DELETE /categories/:id - حذف فئة
GET /categories/stats - إحصائيات الفئات
```

### إدارة المنتجات

#### إنشاء منتج جديد
```bash
POST /products
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "هاتف ذكي سامسونج",
  "description": "هاتف ذكي سامسونج جالاكسي S23",
  "barcode": "8806094012345",
  "sku": "SAMSUNG-S23-BLK",
  "categoryId": "category_id",
  "basePrice": 2999.99,
  "costPrice": 2500.00,
  "trackInventory": true,
  "reorderPoint": 5,
  "imageUrl": "https://example.com/samsung-s23.jpg"
}
```

#### إدارة المنتجات
```bash
GET /products - قائمة المنتجات
GET /products?categoryId=xyz - منتجات فئة محددة
GET /products?search=laptop - البحث في المنتجات
GET /products/:id - تفاصيل منتج
GET /products/lookup/:barcode - البحث بالباركود
PATCH /products/:id - تحديث منتج
DELETE /products/:id - حذف منتج
GET /products/stats - إحصائيات المنتجات
```

### إدارة متغيرات المنتج

#### إنشاء متغير منتج
```bash
POST /product-variants
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "productId": "product_id",
  "name": "هاتف سامسونج جالاكسي S23 - أسود",
  "sku": "SAMSUNG-S23-BLK-128GB",
  "barcode": "8806094012346",
  "price": 3199.99,
  "costPrice": 2700.00,
  "weight": 0.168,
  "dimensions": {
    "length": 14.6,
    "width": 7.1,
    "height": 0.76
  },
  "attributes": {
    "color": "أسود",
    "storage": "128GB",
    "ram": "8GB"
  },
  "imageUrl": "https://example.com/samsung-s23-black.jpg"
}
```

#### إدارة متغيرات المنتج
```bash
GET /product-variants - قائمة المتغيرات
GET /product-variants?productId=xyz - متغيرات منتج محدد
GET /product-variants/:id - تفاصيل متغير
GET /product-variants/lookup/:barcode - البحث بالباركود
PATCH /product-variants/:id - تحديث متغير
DELETE /product-variants/:id - حذف متغير
```

### نظام الفئات الهرمي

- **الفئات الجذر**: فئات بدون أب
- **الفئات الفرعية**: فئات تابعة لفئة أب
- **منع الحلقات**: لا يمكن تحديد فئة كأب لنفسها أو لأحفادها
- **المستويات**: كل فئة لها مستوى في التسلسل الهرمي

### البحث والفلترة

#### البحث بالباركود/SKU
```bash
GET /products/lookup/8806094012345
GET /product-variants/lookup/8806094012346
```

#### البحث النصي
```bash
GET /products?search=سامسونج
GET /products?categoryId=electronics_id
```

### إدارة الأسعار

- **السعر الأساسي**: سعر المنتج الافتراضي
- **سعر التكلفة**: تكلفة شراء المنتج
- **سعر المتغير**: سعر مخصص لكل متغير
- **validation**: أسعار موجبة بدقة سنتين

### إحصائيات شاملة

#### إحصائيات المنتجات
```json
{
  "totalProducts": 150,
  "activeProducts": 145,
  "totalVariants": 450,
  "activeVariants": 440,
  "totalCategories": 25,
  "averageProductsPerCategory": 6.0
}
```

#### إحصائيات الفئات
```json
{
  "totalCategories": 25,
  "activeCategories": 24,
  "rootCategories": 8,
  "maxDepth": 3,
  "totalProducts": 150,
  "averageProductsPerCategory": 6.0
}
```

### نظام Barcode و SKU

- **Uniqueness**: كل باركود و SKU فريد في النظام
- **Validation**: طول وصيغة محددة
- **البحث السريع**: فهرسة للبحث السريع
- **تتبع**: ربط بالمنتجات والمتغيرات

### أذونات مطلوبة

- `products.read` - قراءة بيانات المنتجات
- `products.create` - إنشاء منتجات جديدة
- `products.update` - تحديث المنتجات
- `products.delete` - حذف المنتجات

### نماذج قاعدة البيانات

#### نموذج Category
```sql
model Category {
  id          String   @id @default(cuid()) @db.VarChar(50)
  name        String   @db.VarChar(255)
  description String?  @db.Text
  parentId    String?  @db.VarChar(50)
  imageUrl    String?  @db.Text
  isActive    Boolean  @default(true)

  parent     Category? @relation("CategoryHierarchy", fields: [parentId], references: [id])
  children   Category[] @relation("CategoryHierarchy")
  products   Product[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("categories")
}
```

#### نموذج Product
```sql
model Product {
  id          String   @id @default(cuid()) @db.VarChar(50)
  name        String   @db.VarChar(255)
  description String?  @db.Text
  barcode     String?  @unique @db.VarChar(100)
  sku         String?  @unique @db.VarChar(100)
  categoryId  String   @db.VarChar(50)
  basePrice   Decimal  @db.Decimal(10, 2)
  costPrice   Decimal? @db.Decimal(10, 2)
  taxId       String?  @db.VarChar(50)
  isActive    Boolean  @default(true)
  trackInventory Boolean @default(true)
  reorderPoint   Int?     @default(0)
  imageUrl    String?  @db.Text

  category    Category    @relation(fields: [categoryId], references: [id])
  variants    ProductVariant[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("products")
}
```

#### نموذج ProductVariant
```sql
model ProductVariant {
  id          String   @id @default(cuid()) @db.VarChar(50)
  productId   String   @db.VarChar(50)
  name        String   @db.VarChar(255)
  sku         String?  @unique @db.VarChar(100)
  barcode     String?  @unique @db.VarChar(100)
  price       Decimal? @db.Decimal(10, 2)
  costPrice   Decimal? @db.Decimal(10, 2)
  weight      Decimal? @db.Decimal(8, 3)
  dimensions  Json?    // {length, width, height}
  attributes  Json?    // {color, size, material, etc}
  imageUrl    String?  @db.Text
  isActive    Boolean  @default(true)

  product Product @relation(fields: [productId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("product_variants")
}
```

### اختبار النظام

```bash
# تشغيل اختبار إدارة المنتجات
npm run products:test
```

## نظام إدارة المنتجات (Product Management)

### إدارة الفئات

#### إنشاء فئة جديدة
```bash
POST /categories
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "الإلكترونيات",
  "description": "أجهزة ومعدات إلكترونية",
  "parentId": "parent_category_id", // اختياري للفئات الفرعية
  "imageUrl": "https://example.com/electronics.jpg"
}
```

#### إدارة الفئات
```bash
GET /categories - قائمة الفئات
GET /categories/root - الفئات الجذر
GET /categories/:id - تفاصيل فئة
GET /categories/:id/subcategories - الفئات الفرعية
PATCH /categories/:id - تحديث فئة
DELETE /categories/:id - حذف فئة
GET /categories/stats - إحصائيات الفئات
```

### إدارة المنتجات

#### إنشاء منتج جديد
```bash
POST /products
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "هاتف ذكي سامسونج",
  "description": "هاتف ذكي سامسونج جالاكسي S23",
  "barcode": "8806094012345",
  "sku": "SAMSUNG-S23-BLK",
  "categoryId": "category_id",
  "basePrice": 2999.99,
  "costPrice": 2500.00,
  "trackInventory": true,
  "reorderPoint": 5,
  "imageUrl": "https://example.com/samsung-s23.jpg"
}
```

#### إدارة المنتجات
```bash
GET /products - قائمة المنتجات
GET /products?categoryId=xyz - منتجات فئة محددة
GET /products?search=laptop - البحث في المنتجات
GET /products/:id - تفاصيل منتج
GET /products/lookup/:barcode - البحث بالباركود
PATCH /products/:id - تحديث منتج
DELETE /products/:id - حذف منتج
GET /products/stats - إحصائيات المنتجات
```

### إدارة متغيرات المنتج

#### إنشاء متغير منتج
```bash
POST /product-variants
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "productId": "product_id",
  "name": "هاتف سامسونج جالاكسي S23 - أسود",
  "sku": "SAMSUNG-S23-BLK-128GB",
  "barcode": "8806094012346",
  "price": 3199.99,
  "costPrice": 2700.00,
  "weight": 0.168,
  "dimensions": {
    "length": 14.6,
    "width": 7.1,
    "height": 0.76
  },
  "attributes": {
    "color": "أسود",
    "storage": "128GB",
    "ram": "8GB"
  },
  "imageUrl": "https://example.com/samsung-s23-black.jpg"
}
```

#### إدارة متغيرات المنتج
```bash
GET /product-variants - قائمة المتغيرات
GET /product-variants?productId=xyz - متغيرات منتج محدد
GET /product-variants/:id - تفاصيل متغير
GET /product-variants/lookup/:barcode - البحث بالباركود
PATCH /product-variants/:id - تحديث متغير
DELETE /product-variants/:id - حذف متغير
```

### نظام الفئات الهرمي

- **الفئات الجذر**: فئات بدون أب
- **الفئات الفرعية**: فئات تابعة لفئة أب
- **منع الحلقات**: لا يمكن تحديد فئة كأب لنفسها أو لأحفادها
- **المستويات**: كل فئة لها مستوى في التسلسل الهرمي

### البحث والفلترة

#### البحث بالباركود/SKU
```bash
GET /products/lookup/8806094012345
GET /product-variants/lookup/8806094012346
```

#### البحث النصي
```bash
GET /products?search=سامسونج
GET /products?categoryId=electronics_id
```

### إدارة الأسعار

- **السعر الأساسي**: سعر المنتج الافتراضي
- **سعر التكلفة**: تكلفة شراء المنتج
- **سعر المتغير**: سعر مخصص لكل متغير
- **validation**: أسعار موجبة بدقة سنتين

### إحصائيات شاملة

#### إحصائيات المنتجات
```json
{
  "totalProducts": 150,
  "activeProducts": 145,
  "totalVariants": 450,
  "activeVariants": 440,
  "totalCategories": 25,
  "averageProductsPerCategory": 6.0
}
```

#### إحصائيات الفئات
```json
{
  "totalCategories": 25,
  "activeCategories": 24,
  "rootCategories": 8,
  "maxDepth": 3,
  "totalProducts": 150,
  "averageProductsPerCategory": 6.0
}
```

### نظام Barcode و SKU

- **Uniqueness**: كل باركود و SKU فريد في النظام
- **Validation**: طول وصيغة محددة
- **البحث السريع**: فهرسة للبحث السريع
- **تتبع**: ربط بالمنتجات والمتغيرات

### أذونات مطلوبة

- `products.read` - قراءة بيانات المنتجات
- `products.create` - إنشاء منتجات جديدة
- `products.update` - تحديث المنتجات
- `products.delete` - حذف المنتجات

### نماذج قاعدة البيانات

#### نموذج Category
```sql
model Category {
  id          String   @id @default(cuid()) @db.VarChar(50)
  name        String   @db.VarChar(255)
  description String?  @db.Text
  parentId    String?  @db.VarChar(50)
  imageUrl    String?  @db.Text
  isActive    Boolean  @default(true)

  parent     Category? @relation("CategoryHierarchy", fields: [parentId], references: [id])
  children   Category[] @relation("CategoryHierarchy")
  products   Product[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("categories")
}
```

#### نموذج Product
```sql
model Product {
  id          String   @id @default(cuid()) @db.VarChar(50)
  name        String   @db.VarChar(255)
  description String?  @db.Text
  barcode     String?  @unique @db.VarChar(100)
  sku         String?  @unique @db.VarChar(100)
  categoryId  String   @db.VarChar(50)
  basePrice   Decimal  @db.Decimal(10, 2)
  costPrice   Decimal? @db.Decimal(10, 2)
  taxId       String?  @db.VarChar(50)
  isActive    Boolean  @default(true)
  trackInventory Boolean @default(true)
  reorderPoint   Int?     @default(0)
  imageUrl    String?  @db.Text

  category    Category    @relation(fields: [categoryId], references: [id])
  variants    ProductVariant[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("products")
}
```

#### نموذج ProductVariant
```sql
model ProductVariant {
  id          String   @id @default(cuid()) @db.VarChar(50)
  productId   String   @db.VarChar(50)
  name        String   @db.VarChar(255)
  sku         String?  @unique @db.VarChar(100)
  barcode     String?  @unique @db.VarChar(100)
  price       Decimal? @db.Decimal(10, 2)
  costPrice   Decimal? @db.Decimal(10, 2)
  weight      Decimal? @db.Decimal(8, 3)
  dimensions  Json?    // {length, width, height}
  attributes  Json?    // {color, size, material, etc}
  imageUrl    String?  @db.Text
  isActive    Boolean  @default(true)

  product Product @relation(fields: [productId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("product_variants")
}
```

### اختبار النظام

```bash
# تشغيل اختبار إدارة المنتجات
npm run products:test
```

## نظام إدارة المخزون (Inventory Management)

### إدارة عناصر المخزون

#### إنشاء عنصر مخزون جديد
```bash
POST /inventory/stock-items
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "warehouseId": "warehouse_id",
  "productVariantId": "variant_id",
  "quantity": 100,
  "minStock": 10,
  "maxStock": 500
}
```

#### إدارة عناصر المخزون
```bash
GET /inventory/stock-items - قائمة عناصر المخزون
GET /inventory/stock-items?warehouseId=xyz - مخزون مخزن محدد
GET /inventory/stock-items?lowStockOnly=true - المخزون المنخفض فقط
GET /inventory/stock-items/:id - تفاصيل عنصر مخزون
PATCH /inventory/stock-items/:id - تحديث حدود المخزون
```

### تعديل كميات المخزون

#### تعديل كمية المخزون
```bash
POST /inventory/stock-items/:warehouseId/:productVariantId/adjust
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "quantity": 50,
  "movementType": "purchase",
  "referenceType": "purchase_order",
  "referenceId": "PO-001",
  "reason": "شراء من المورد أحمد"
}
```

#### أنواع حركات المخزون
- `adjustment`: تعديل يدوي
- `purchase`: شراء من مورد
- `sale`: بيع لعميل
- `transfer_in`: نقل وارد من مخزن آخر
- `transfer_out`: نقل صادر لمخزن آخر
- `return`: مرتجع من عميل
- `initial`: مخزون أولي

### تتبع حركات المخزون

#### عرض حركات المخزون
```bash
GET /inventory/movements - جميع الحركات
GET /inventory/movements?warehouseId=xyz - حركات مخزن محدد
GET /inventory/movements?productVariantId=xyz - حركات منتج محدد
GET /inventory/movements?limit=20 - تحديد عدد النتائج
```

### تنبيهات المخزون

#### تنبيهات المخزون المنخفض
```bash
GET /inventory/alerts/low-stock
Authorization: Bearer <admin_token>
```

### إحصائيات المخزون

#### إحصائيات شاملة
```bash
GET /inventory/stats
Authorization: Bearer <admin_token>
```

**الإحصائيات تشمل:**
- إجمالي عناصر المخزون
- القيمة الإجمالية للمخزون
- عدد العناصر ذات المخزون المنخفض
- عدد العناصر بدون مخزون
- عدد العناصر ذات المخزون المرتفع
- إجمالي حركات المخزون

### عرض المخزون المتقدم

#### مخزون منتج عبر المخازن
```bash
GET /inventory/products/:productVariantId/stock
Authorization: Bearer <admin_token>
```

#### مخزون مخزن كامل
```bash
GET /inventory/warehouses/:warehouseId/stock
Authorization: Bearer <admin_token>
```

### حدود المخزون

#### تحديث حدود المخزون
```bash
PATCH /inventory/stock-items/:id
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "minStock": 5,
  "maxStock": 1000
}
```

### أذونات مطلوبة

- `inventory.read` - قراءة بيانات المخزون
- `inventory.create` - إنشاء عناصر مخزون جديدة
- `inventory.update` - تعديل كميات وحدود المخزون
- `inventory.delete` - حذف عناصر المخزون

### نماذج قاعدة البيانات

#### نموذج StockItem
```sql
model StockItem {
  id                String   @id @default(cuid()) @db.VarChar(50)
  warehouseId       String   @db.VarChar(50)
  productVariantId  String   @db.VarChar(50)
  quantity          Decimal  @db.Decimal(10, 3)
  minStock          Decimal  @default(0) @db.Decimal(10, 3)
  maxStock          Decimal  @default(1000) @db.Decimal(10, 3)

  warehouse       Warehouse      @relation(fields: [warehouseId], references: [id], onDelete: Cascade)
  productVariant  ProductVariant @relation(fields: [productVariantId], references: [id], onDelete: Cascade)

  movements StockMovement[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([warehouseId, productVariantId])
  @@map("stock_items")
}
```

#### نموذج StockMovement
```sql
model StockMovement {
  id                String   @id @default(cuid()) @db.VarChar(50)
  warehouseId       String   @db.VarChar(50)
  productVariantId  String   @db.VarChar(50)
  movementType      String   @db.VarChar(50) // in, out, adjustment, transfer
  quantity          Decimal  @db.Decimal(10, 3)
  referenceType     String?  @db.VarChar(50) // sales, purchase, adjustment, transfer
  referenceId       String?  @db.VarChar(50)
  reason            String?  @db.Text
  performedBy       String?  @db.VarChar(50) // User ID

  warehouse       Warehouse      @relation(fields: [warehouseId], references: [id], onDelete: Cascade)
  productVariant  ProductVariant @relation(fields: [warehouseId, productVariantId], references: [warehouseId, productVariantId], onDelete: Cascade)

  createdAt DateTime @default(now())

  @@map("stock_movements")
  @@index([warehouseId])
  @@index([productVariantId])
  @@index([referenceType])
  @@index([referenceId])
}
```

### منطق حدود المخزون

#### حالات المخزون
- **مخزون طبيعي**: `quantity > minStock && quantity <= maxStock`
- **مخزون منخفض**: `quantity <= minStock`
- **مخزون مرتفع**: `quantity > maxStock`
- **مخزون فارغ**: `quantity = 0`

#### تنبيهات تلقائية
- تنبيه منخفض عند `quantity <= minStock`
- تنبيه مرتفع عند `quantity > maxStock`
- تنبيه فارغ عند `quantity = 0`

### معاملات قاعدة البيانات

جميع عمليات تعديل المخزون تتم داخل معاملات قاعدة بيانات لضمان:
- الاتساق في البيانات
- عدم فقدان البيانات في حالة فشل العملية
- تسجيل الحركات بدقة

### اختبار النظام

```bash
# تشغيل اختبار نظام المخزون
npm run inventory:test
```

## نظام إدارة المخزون (Inventory Management)

### إدارة عناصر المخزون

#### إنشاء عنصر مخزون جديد
```bash
POST /inventory/stock-items
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "warehouseId": "warehouse_id",
  "productVariantId": "variant_id",
  "quantity": 100,
  "minStock": 10,
  "maxStock": 500
}
```

#### إدارة عناصر المخزون
```bash
GET /inventory/stock-items - قائمة عناصر المخزون
GET /inventory/stock-items?warehouseId=xyz - مخزون مخزن محدد
GET /inventory/stock-items?lowStockOnly=true - المخزون المنخفض فقط
GET /inventory/stock-items/:id - تفاصيل عنصر مخزون
PATCH /inventory/stock-items/:id - تحديث حدود المخزون
```

### تعديل كميات المخزون

#### تعديل كمية المخزون
```bash
POST /inventory/stock-items/:warehouseId/:productVariantId/adjust
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "quantity": 50,
  "movementType": "purchase",
  "referenceType": "purchase_order",
  "referenceId": "PO-001",
  "reason": "شراء من المورد أحمد"
}
```

#### أنواع حركات المخزون
- `adjustment`: تعديل يدوي
- `purchase`: شراء من مورد
- `sale`: بيع لعميل
- `transfer_in`: نقل وارد من مخزن آخر
- `transfer_out`: نقل صادر لمخزن آخر
- `return`: مرتجع من عميل
- `initial`: مخزون أولي

### تتبع حركات المخزون

#### عرض حركات المخزون
```bash
GET /inventory/movements - جميع الحركات
GET /inventory/movements?warehouseId=xyz - حركات مخزن محدد
GET /inventory/movements?productVariantId=xyz - حركات منتج محدد
GET /inventory/movements?limit=20 - تحديد عدد النتائج
```

### تنبيهات المخزون

#### تنبيهات المخزون المنخفض
```bash
GET /inventory/alerts/low-stock
Authorization: Bearer <admin_token>
```

### إحصائيات المخزون

#### إحصائيات شاملة
```bash
GET /inventory/stats
Authorization: Bearer <admin_token>
```

**الإحصائيات تشمل:**
- إجمالي عناصر المخزون
- القيمة الإجمالية للمخزون
- عدد العناصر ذات المخزون المنخفض
- عدد العناصر بدون مخزون
- عدد العناصر ذات المخزون المرتفع
- إجمالي حركات المخزون

### عرض المخزون المتقدم

#### مخزون منتج عبر المخازن
```bash
GET /inventory/products/:productVariantId/stock
Authorization: Bearer <admin_token>
```

#### مخزون مخزن كامل
```bash
GET /inventory/warehouses/:warehouseId/stock
Authorization: Bearer <admin_token>
```

### حدود المخزون

#### تحديث حدود المخزون
```bash
PATCH /inventory/stock-items/:id
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "minStock": 5,
  "maxStock": 1000
}
```

### أذونات مطلوبة

- `inventory.read` - قراءة بيانات المخزون
- `inventory.create` - إنشاء عناصر مخزون جديدة
- `inventory.update` - تعديل كميات وحدود المخزون
- `inventory.delete` - حذف عناصر المخزون

### نماذج قاعدة البيانات

#### نموذج StockItem
```sql
model StockItem {
  id                String  @id @default(cuid()) @db.VarChar(50)
  warehouseId       String  @db.VarChar(50)
  productVariantId  String  @db.VarChar(50)
  quantity          Decimal @db.Decimal(10, 3)
  minStock          Decimal @default(0) @db.Decimal(10, 3)
  maxStock          Decimal @default(1000) @db.Decimal(10, 3)

  warehouse Warehouse @relation(fields: [warehouseId], references: [id], onDelete: Cascade)
  productVariant ProductVariant @relation(fields: [productVariantId], references: [id], onDelete: Cascade)

  movements StockMovement[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([warehouseId, productVariantId])
  @@map("stock_items")
}
```

#### نموذج StockMovement
```sql
model StockMovement {
  id                String   @id @default(cuid()) @db.VarChar(50)
  warehouseId       String   @db.VarChar(50)
  productVariantId  String   @db.VarChar(50)
  movementType      String   @db.VarChar(50) // in, out, adjustment, transfer
  quantity          Decimal  @db.Decimal(10, 3)
  referenceType     String?  @db.VarChar(50) // sales, purchase, adjustment, transfer
  referenceId       String?  @db.VarChar(50)
  reason            String?  @db.Text
  performedBy       String?  @db.VarChar(50) // User ID

  warehouse Warehouse @relation(fields: [warehouseId], references: [id], onDelete: Cascade)
  productVariant ProductVariant @relation(fields: [productVariantId], references: [id], onDelete: Cascade)
  stockItem StockItem @relation(fields: [warehouseId, productVariantId], references: [warehouseId, productVariantId], onDelete: Cascade)

  createdAt DateTime @default(now())

  @@map("stock_movements")
  @@index([warehouseId])
  @@index([productVariantId])
  @@index([referenceType])
  @@index([referenceId])
}
```

### منطق حدود المخزون

#### حالات المخزون
- **مخزون طبيعي**: `quantity > minStock && quantity <= maxStock`
- **مخزون منخفض**: `quantity <= minStock`
- **مخزون مرتفع**: `quantity > maxStock`
- **مخزون فارغ**: `quantity = 0`

#### تنبيهات تلقائية
- تنبيه منخفض عند `quantity <= minStock`
- تنبيه مرتفع عند `quantity > maxStock`
- تنبيه فارغ عند `quantity = 0`

### معاملات قاعدة البيانات

جميع عمليات تعديل المخزون تتم داخل معاملات قاعدة بيانات لضمان:
- الاتساق في البيانات
- عدم فقدان البيانات في حالة فشل العملية
- تسجيل الحركات بدقة

### اختبار النظام

```bash
# تشغيل اختبار النظام المحاسبي الأساسي
npm run accounting:test
```

## النظام المحاسبي الأساسي (Basic Accounting System)

### دليل الحسابات (Chart of Accounts)

#### إنشاء حساب GL جديد
```bash
POST /accounting/gl-accounts
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "accountCode": "5003",
  "name": "مصروفات إعلانية",
  "description": "مصروفات الإعلانات والتسويق",
  "accountType": "expense",
  "parentId": null,
  "isActive": true,
  "isSystem": false
}
```

#### إدارة حسابات GL
```bash
GET /accounting/gl-accounts - قائمة حسابات GL
GET /accounting/gl-accounts/:id - تفاصيل حساب GL
PATCH /accounting/gl-accounts/:id - تحديث حساب GL
DELETE /accounting/gl-accounts/:id - حذف حساب GL
```

### القيود اليومية (Journal Entries)

#### إنشاء قيد يومي
```bash
POST /accounting/journal-entries
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "entryNumber": "JE-001-2025",
  "description": "قيد تجريبي للنظام المحاسبي",
  "referenceType": "test",
  "referenceId": "test-001",
  "sourceModule": "accounting",
  "status": "draft",
  "isSystem": false,
  "lines": [
    {
      "debitAccountId": "cash-account-id",
      "creditAccountId": "sales-revenue-account-id",
      "amount": 1000.00,
      "description": "إيرادات نقدية",
      "referenceType": "test",
      "referenceId": "test-001"
    }
  ]
}
```

#### إدارة القيود اليومية
```bash
GET /accounting/journal-entries - قائمة القيود اليومية
GET /accounting/journal-entries/:id - تفاصيل قيد يومي
PATCH /accounting/journal-entries/:id/post - اعتماد قيد
PATCH /accounting/journal-entries/:id/unpost - إلغاء اعتماد
```

### حسابات النظام الافتراضية

#### إعداد حسابات النظام
```bash
POST /accounting/setup/system-accounts
Authorization: Bearer <admin_token>
```

**الحسابات الافتراضية:**
- `1001`: النقدية (Asset)
- `1002`: المدينون (Asset)
- `1003`: المخزون (Asset)
- `2001`: الدائنون (Liability)
- `2002`: ضريبة المبيعات المستحقة (Liability)
- `3001`: رأس المال (Equity)
- `3002`: الأرباح المحتجزة (Equity)
- `4001`: إيرادات المبيعات (Revenue)
- `4002`: إيرادات أخرى (Revenue)
- `5001`: تكلفة البضائع المباعة (Expense)
- `5002`: المصروفات التشغيلية (Expense)

### القيود التلقائية

#### قيد المبيعات التلقائي
```typescript
// يتم إنشاؤه تلقائياً عند إنشاء فاتورة مبيعات
POST /accounting/auto/sales/{salesInvoiceId}
{
  "customerId": "customer-id",
  "totalAmount": 500.00,
  "taxAmount": 50.00
}
```

**القيد المُنشأ:**
```
مدين: المدينون (1002)           550.00
دائن: إيرادات المبيعات (4001)     500.00
دائن: ضريبة المبيعات (2002)       50.00
```

#### قيد المشتريات التلقائي
```typescript
// يتم إنشاؤه تلقائياً عند إنشاء فاتورة مشتريات
POST /accounting/auto/purchase/{purchaseInvoiceId}
{
  "supplierId": "supplier-id",
  "totalAmount": 300.00,
  "taxAmount": 0.00
}
```

**القيد المُنشأ:**
```
مدين: المخزون (1003)             300.00
دائن: الدائنون (2001)             300.00
```

### إحصائيات المحاسبة

#### إحصائيات شاملة
```bash
GET /accounting/stats/overview
```

**الإحصائيات تشمل:**
- عدد حسابات GL (الإجمالي والنشطة)
- توزيع الحسابات حسب النوع
- عدد القيود اليومية (المجموع، المعتمدة، المسودة)
- الأرصدة المالية (الأصول، الالتزامات، حقوق الملكية، الإيرادات، المصروفات)
- صافي الربح

### هيكل دليل الحسابات

#### تصنيف الحسابات
```
1000-1999: الأصول (Assets)
  - 1100: الأصول المتداولة
  - 1200: الأصول الثابتة
  - 1300: الأصول الأخرى

2000-2999: الالتزامات (Liabilities)
  - 2100: الالتزامات المتداولة
  - 2200: الالتزامات طويلة الأجل

3000-3999: حقوق الملكية (Equity)
  - 3100: رأس المال
  - 3200: الأرباح المحتجزة

4000-4999: الإيرادات (Revenue)
  - 4100: إيرادات المبيعات
  - 4200: إيرادات أخرى

5000-5999: المصروفات (Expenses)
  - 5100: تكاليف المبيعات
  - 5200: المصروفات الإدارية
  - 5300: المصروفات التسويقية
```

### مبادئ المحاسبة المُطبقة

#### 1. مبدأ التوازن المزدوج
```typescript
// كل قيد يومي يجب أن يكون متوازناً
const totalDebit = lines.reduce((sum, line) => sum + line.amount, 0);
const totalCredit = lines.reduce((sum, line) => sum + line.amount, 0);

if (totalDebit !== totalCredit) {
  throw new BadRequestException('القيد غير متوازن');
}
```

#### 2. مبدأ التسجيل المزدوج
كل معاملة مالية تؤثر على حسابين على الأقل:
- حساب مدين واحد على الأقل
- حساب دائن واحد على الأقل
- مجموع المدين = مجموع الدائن

#### 3. مبدأ الاستمرارية
النشاط مستمر إلا إذا ثبت العكس، لذلك لا نقوم بتصفية الأصول والالتزامات في نهاية كل فترة.

#### 4. مبدأ التطابق
يتم مطابقة الإيرادات مع المصروفات المتعلقة بها في نفس الفترة المحاسبية.

### أذونات مطلوبة

- `accounting.gl_accounts.create` - إنشاء حسابات GL
- `accounting.gl_accounts.read` - قراءة حسابات GL
- `accounting.gl_accounts.update` - تحديث حسابات GL
- `accounting.gl_accounts.delete` - حذف حسابات GL
- `accounting.journal_entries.create` - إنشاء قيود يومية
- `accounting.journal_entries.read` - قراءة القيود اليومية
- `accounting.journal_entries.post` - اعتماد القيود
- `accounting.journal_entries.unpost` - إلغاء اعتماد القيود
- `accounting.setup` - إعداد النظام
- `accounting.reports` - التقارير والإحصائيات
- `accounting.export` - تصدير البيانات
- `accounting.auto_entries` - القيود التلقائية

### نموذج قاعدة البيانات

#### نموذج GLAccount
```sql
model GLAccount {
  id          String   @id @default(cuid()) @db.VarChar(50)
  accountCode String   @unique @db.VarChar(20)
  name        String   @db.VarChar(255)
  description String?  @db.Text
  accountType String   @db.VarChar(50) // asset, liability, equity, revenue, expense

  parentId    String?  @db.VarChar(50)
  parent      GLAccount? @relation("GLAccountHierarchy", fields: [parentId], references: [id])
  children    GLAccount[] @relation("GLAccountHierarchy")

  isActive    Boolean  @default(true)
  isSystem    Boolean  @default(false)

  debitBalance  Decimal @default(0) @db.Decimal(15, 2)
  creditBalance Decimal @default(0) @db.Decimal(15, 2)

  debitEntries  JournalEntryLine[] @relation("DebitAccount")
  creditEntries JournalEntryLine[] @relation("CreditAccount")

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

#### نموذج JournalEntry
```sql
model JournalEntry {
  id              String   @id @default(cuid()) @db.VarChar(50)
  entryNumber     String   @unique @db.VarChar(20)
  entryDate       DateTime @default(now())
  description     String   @db.Text
  referenceType   String?  @db.VarChar(50)
  referenceId     String?  @db.VarChar(50)
  sourceModule    String?  @db.VarChar(50)

  status          String   @default("draft") @db.VarChar(20) // draft, posted, reversed
  isSystem        Boolean  @default(false)

  totalDebit      Decimal  @default(0) @db.Decimal(15, 2)
  totalCredit     Decimal  @default(0) @db.Decimal(15, 2)

  createdBy       String?  @db.VarChar(50)
  creator         User?    @relation(fields: [createdBy], references: [id])

  lines           JournalEntryLine[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### التكامل مع الأنظمة الأخرى

#### مع نظام المبيعات
```typescript
// عند إنشاء فاتورة مبيعات
await accountingService.createSalesJournalEntry(
  salesInvoice.id,
  salesInvoice.customerId,
  salesInvoice.totalAmount,
  salesInvoice.taxAmount,
  userId
);
```

#### مع نظام المشتريات
```typescript
// عند إنشاء فاتورة مشتريات
await accountingService.createPurchaseJournalEntry(
  purchaseInvoice.id,
  purchaseInvoice.supplierId,
  purchaseInvoice.totalAmount,
  purchaseInvoice.taxAmount,
  userId
);
```

### اختبار النظام

```bash
# تشغيل اختبار النظام المحاسبي الأساسي
npm run accounting:test
```

## نظام إدارة العملاء (Customer Management)

### إدارة بيانات العملاء

#### إنشاء عميل جديد
```bash
POST /customers
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "أحمد محمد علي",
  "phone": "+966501234567",
  "email": "ahmed.mohamed@example.com",
  "address": "الرياض، حي العليا، شارع الملك فهد",
  "taxNumber": "1234567890",
  "creditLimit": 5000.00,
  "birthday": "1990-05-15",
  "gender": "male",
  "marketingConsent": true,
  "isActive": true
}
```

#### إدارة العملاء
```bash
GET /customers - قائمة العملاء
GET /customers/search - البحث المتقدم
GET /customers/:id - تفاصيل عميل
PATCH /customers/:id - تحديث عميل
DELETE /customers/:id - حذف عميل
```

### نظام الولاء والمكافآت

#### الحصول على إحصائيات الولاء
```bash
GET /customers/:id/loyalty
```

**الرد:**
```json
{
  "currentTier": "silver",
  "pointsToNextTier": 500,
  "nextTier": "gold",
  "tierBenefits": ["خصم 5% على المشتريات", "شحن مجاني للطلبات فوق 200 ر.س"],
  "recentTransactions": [
    {
      "type": "sale",
      "amount": 299.99,
      "pointsEarned": 30,
      "date": "2025-01-15T10:30:00Z"
    }
  ]
}
```

#### تحديث نقاط الولاء
```bash
PATCH /customers/:id/loyalty-points
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "pointsChange": 50,
  "reason": "مكافأة خاصة للعميل المميز"
}
```

### مستويات الولاء

#### حساب النقاط والمستويات
- **Bronze**: مشتريات أقل من 1000 ر.س
  - فوائد: خصم 2% على المشتريات
- **Silver**: مشتريات من 1000 إلى 4999 ر.س
  - فوائد: خصم 5% + شحن مجاني فوق 200 ر.س
- **Gold**: مشتريات من 5000 إلى 14999 ر.س
  - فوائد: خصم 10% + شحن مجاني + دعم فني أولوية
- **Platinum**: مشتريات أكثر من 15000 ر.س
  - فوائد: خصم 15% + شحن مجاني + دعم فني أولوية + هدايا شهرية

#### كيفية كسب النقاط
- **المشتريات**: 1 نقطة لكل 10 ريال
- **المكافآت الخاصة**: نقاط إضافية من الحملات التسويقية
- **الإشارات**: نقاط لإحضار عملاء جدد

### البحث والفلترة المتقدمة

#### البحث في العملاء
```bash
GET /customers/search?query=أحمد&loyaltyTier=silver&minPurchases=1000&maxPurchases=5000&hasMarketingConsent=true&gender=male
```

**معايير البحث:**
- النص: البحث في الاسم والبريد الإلكتروني والهاتف والعنوان
- مستوى الولاء: فلترة حسب مستوى الولاء
- المشتريات: نطاق إجمالي المشتريات
- الموافقة التسويقية: العملاء الذين وافقوا على التسويق
- الجنس: فلترة حسب الجنس

### إحصائيات العملاء

#### إحصائيات شاملة
```bash
GET /customers/stats/overview
GET /customers/stats/overview?startDate=2025-01-01&endDate=2025-12-31
```

**الإحصائيات تشمل:**
- إجمالي العملاء والعملاء النشطين
- إجمالي نقاط الولاء
- توزيع العملاء حسب المستويات
- أفضل العملاء حسب المشتريات
- عملاء جدد هذا الشهر
- متوسط قيمة المشتريات لكل عميل

### تحديث إحصائيات العملاء

#### التحديث التلقائي عند المبيعات
```typescript
// عند إنشاء فاتورة مبيعات
customerService.updateCustomerStatsOnSale(customerId, saleAmount, paymentMethod);
```

**ما يتم تحديثه:**
- إجمالي المشتريات
- تاريخ آخر شراء
- نقاط الولاء
- مستوى الولاء
- طريقة الدفع المفضلة

### أذونات مطلوبة

- `customers.create` - إنشاء عملاء جدد
- `customers.read` - قراءة بيانات العملاء
- `customers.update` - تحديث بيانات العملاء
- `customers.delete` - حذف العملاء
- `customers.reports` - الوصول للإحصائيات والتقارير
- `customers.export` - تصدير بيانات العملاء
- `customers.marketing` - إرسال رسائل تسويقية

### نموذج قاعدة البيانات

#### نموذج Customer الموسع
```sql
model Customer {
  id          String   @id @default(cuid()) @db.VarChar(50)
  name        String   @db.VarChar(255)
  phone       String?  @db.VarChar(50)
  email       String?  @db.VarChar(255)
  address     String?  @db.Text
  taxNumber   String?  @db.VarChar(100)
  creditLimit Decimal? @db.Decimal(10, 2)

  // نظام الولاء
  loyaltyPoints         Int      @default(0)
  loyaltyTier          String   @default("bronze") @db.VarChar(20)
  totalPurchases       Decimal  @default(0) @db.Decimal(12, 2)
  lastPurchaseDate     DateTime?
  preferredPaymentMethod String? @db.VarChar(50)

  // معلومات شخصية إضافية
  birthday             DateTime?
  gender               String?  @db.VarChar(10) // male, female, other
  marketingConsent     Boolean  @default(false)

  isActive    Boolean  @default(true)

  salesInvoices SalesInvoice[]
  payments      Payment[]
  returns       Return[]
  creditNotes   CreditNote[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("customers")
  @@index([email])
  @@index([phone])
  @@index([loyaltyTier])
  @@index([lastPurchaseDate])
}
```

### منطق العمليات التجارية

#### إنشاء العميل
1. **التحقق من البيانات**: التأكد من صحة البريد الإلكتروني ورقم الهاتف
2. **إنشاء السجل**: حفظ البيانات الأساسية ونظام الولاء
3. **تعيين المستوى**: تحديد مستوى الولاء الأولي (Bronze)

#### تحديث الإحصائيات
1. **عند المبيعات**: زيادة إجمالي المشتريات وتحديث النقاط
2. **ترقية المستوى**: التحقق من إمكانية الترقية لمستوى أعلى
3. **تحديث التواريخ**: تسجيل تاريخ آخر شراء
4. **تتبع الدفع**: حفظ طريقة الدفع المفضلة

#### إدارة الولاء
1. **كسب النقاط**: حساب النقاط من المشتريات والمكافآت
2. **استبدال النقاط**: استخدام النقاط في الخصومات والمكافآت
3. **انتهاء الصلاحية**: إدارة صلاحية النقاط (اختياري)
4. **التقارير**: تتبع أداء برنامج الولاء

### معاملات قاعدة البيانات

جميع عمليات العملاء تتم داخل معاملات قاعدة بيانات لضمان:
- الاتساق في تحديث إحصائيات العملاء
- عدم فقدان النقاط والمكافآت
- تتبع دقيق للمشتريات والمدفوعات
- سلامة بيانات نظام الولاء

### اختبار النظام

```bash
# تشغيل اختبار نظام إدارة العملاء
npm run customers:test
```

## نظام إدارة المشتريات (Purchasing Management)

### إدارة الموردين

#### إنشاء مورد جديد
```bash
POST /purchasing/suppliers
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "مورد الإلكترونيات",
  "contactName": "أحمد محمد",
  "phone": "+966501234567",
  "email": "supplier@example.com",
  "address": "الرياض، المملكة العربية السعودية",
  "taxNumber": "1234567890",
  "paymentTerms": "دفع نقدي عند الاستلام",
  "isActive": true
}
```

#### إدارة الموردين
```bash
GET /purchasing/suppliers - قائمة الموردين
GET /purchasing/suppliers/:id - تفاصيل مورد
PATCH /purchasing/suppliers/:id - تحديث مورد
DELETE /purchasing/suppliers/:id - حذف مورد
```

### إدارة أوامر الشراء

#### إنشاء أمر شراء جديد
```bash
POST /purchasing/orders
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "supplierId": "supplier_id",
  "warehouseId": "warehouse_id",
  "expectedDate": "2025-12-31",
  "lines": [
    {
      "productId": "product_id",
      "quantity": 10,
      "unitCost": 150.00
    }
  ],
  "notes": "أمر شراء عاجل"
}
```

#### تحديث حالة أمر الشراء
```bash
PATCH /purchasing/orders/:id/status
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "status": "approved" // draft, approved, ordered, received, cancelled
}
```

### إدارة فواتير الشراء

#### إنشاء فاتورة شراء جديدة
```bash
POST /purchasing/invoices
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "invoiceNumber": "PURCHASE-INV-001", // اختياري - يُولد تلقائياً
  "supplierId": "supplier_id",
  "warehouseId": "warehouse_id",
  "purchaseOrderId": "order_id", // اختياري
  "currencyId": "currency_id",
  "invoiceDate": "2025-01-15",
  "dueDate": "2025-02-15",
  "lines": [
    {
      "productVariantId": "variant_id",
      "quantity": 10,
      "unitCost": 150.00,
      "discountAmount": 50.00,
      "taxAmount": 22.50
    }
  ],
  "status": "received",
  "notes": "فاتورة شراء من مورد موثوق"
}
```

#### إنشاء دفعة لفاتورة شراء
```bash
POST /purchasing/invoices/:id/payments
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "amount": 1500.00,
  "paymentMethod": "bank_transfer",
  "referenceNumber": "REF-123456",
  "notes": "دفعة جزئية"
}
```

### التحقق من صحة المشتريات

#### قواعد التحقق الأساسية
- **المورد**: يجب أن يكون المورد نشطاً
- **المنتجات**: يجب أن تكون المنتجات موجودة
- **الكميات**: يجب أن تكون الكميات موجبة
- **الأسعار**: يجب أن تكون الأسعار صحيحة

### تحديث المخزون من المشتريات

#### منطق تحديث المخزون
```typescript
// عند إنشاء فاتورة شراء - إضافة الكميات للمخزون
inventoryService.adjustStock(warehouseId, productVariantId, {
  quantity: purchaseQuantity,
  movementType: 'purchase',
  referenceType: 'purchase_invoice',
  referenceId: purchaseInvoiceId,
  reason: `فاتورة شراء - ${invoiceNumber}`
});
```

### حالات أوامر الشراء

#### حالات الأمر
- `draft`: مسودة
- `approved`: معتمدة
- `ordered`: تم الطلب
- `received`: تم الاستلام
- `cancelled`: ملغاة

### حالات فواتير الشراء

#### حالات الفاتورة
- `draft`: مسودة
- `received`: تم الاستلام
- `approved`: معتمدة
- `paid`: مدفوعة
- `cancelled`: ملغاة

### حالات المدفوعات

#### حالات الدفع
- `pending`: معلق
- `partial`: جزئي
- `paid`: مدفوع

### طرق الدفع

- `cash`: نقدي
- `bank_transfer`: تحويل بنكي
- `check`: شيك
- `credit_card`: بطاقة ائتمان

### إحصائيات المشتريات

#### إحصائيات شاملة
```bash
GET /purchasing/stats/overview
GET /purchasing/stats/overview?startDate=2025-01-01&endDate=2025-12-31
```

**الإحصائيات تشمل:**
- إجمالي عدد الموردين والنشطين
- إجمالي أوامر الشراء والمعتمدة
- إجمالي فواتير الشراء والمدفوعة
- إجمالي قيمة المشتريات والمدفوعات
- المبلغ المستحق للموردين

### أذونات مطلوبة

- `purchasing.suppliers.create` - إنشاء موردين جدد
- `purchasing.suppliers.read` - قراءة بيانات الموردين
- `purchasing.suppliers.update` - تحديث الموردين
- `purchasing.suppliers.delete` - حذف الموردين
- `purchasing.orders.create` - إنشاء أوامر الشراء
- `purchasing.orders.read` - قراءة أوامر الشراء
- `purchasing.orders.update` - تحديث أوامر الشراء
- `purchasing.invoices.create` - إنشاء فواتير الشراء
- `purchasing.invoices.read` - قراءة فواتير الشراء
- `purchasing.payments.create` - إنشاء المدفوعات
- `purchasing.reports.read` - قراءة التقارير

### نماذج قاعدة البيانات

#### نموذج Supplier
```sql
model Supplier {
  id          String   @id @default(cuid()) @db.VarChar(50)
  name        String   @db.VarChar(255)
  contactName String?  @db.VarChar(255)
  phone       String?  @db.VarChar(50)
  email       String?  @db.VarChar(255)
  address     String?  @db.Text
  taxNumber   String?  @db.VarChar(100)
  paymentTerms String? @db.VarChar(255) // شروط الدفع
  isActive    Boolean  @default(true)

  purchaseOrders   PurchaseOrder[]
  purchaseInvoices PurchaseInvoice[]
  purchasePayments PurchasePayment[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("suppliers")
  @@index([email])
  @@index([phone])
}
```

#### نموذج PurchaseOrder
```sql
model PurchaseOrder {
  id              String   @id @default(cuid()) @db.VarChar(50)
  orderNumber     String   @unique @db.VarChar(50)
  supplierId      String   @db.VarChar(50)
  warehouseId     String   @db.VarChar(50)
  requestedBy     String   @db.VarChar(50) // User ID

  expectedDate    DateTime?
  notes           String?  @db.Text

  status          String   @default("draft") @db.VarChar(50) // draft, approved, ordered, received, cancelled

  supplier        Supplier   @relation(fields: [supplierId], references: [id])
  warehouse       Warehouse  @relation(fields: [warehouseId], references: [id])
  requester       User       @relation(fields: [requestedBy], references: [id])

  lines           PurchaseOrderLine[]
  purchaseInvoices PurchaseInvoice[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("purchase_orders")
  @@index([supplierId])
  @@index([warehouseId])
  @@index([status])
  @@index([orderNumber])
}
```

#### نموذج PurchaseInvoice
```sql
model PurchaseInvoice {
  id              String   @id @default(cuid()) @db.VarChar(50)
  invoiceNumber   String   @unique @db.VarChar(50)
  supplierId      String   @db.VarChar(50)
  warehouseId     String   @db.VarChar(50)
  receivedBy      String   @db.VarChar(50) // User ID
  purchaseOrderId String?  @db.VarChar(50)

  subtotal        Decimal  @db.Decimal(10, 2)
  taxAmount       Decimal  @default(0) @db.Decimal(10, 2)
  discountAmount  Decimal  @default(0) @db.Decimal(10, 2)
  totalAmount     Decimal  @db.Decimal(10, 2)

  currencyId      String   @db.VarChar(50)

  invoiceDate     DateTime @default(now())
  dueDate         DateTime?

  status          String   @default("draft") @db.VarChar(50) // draft, received, approved, paid, cancelled
  paymentStatus   String   @default("pending") @db.VarChar(50) // pending, partial, paid

  notes           String?  @db.Text

  supplier        Supplier        @relation(fields: [supplierId], references: [id])
  warehouse       Warehouse       @relation(fields: [warehouseId], references: [id])
  receiver        User            @relation(fields: [receivedBy], references: [id])
  purchaseOrder   PurchaseOrder?  @relation(fields: [purchaseOrderId], references: [id])
  currency        Currency        @relation(fields: [currencyId], references: [id])

  lines           PurchaseInvoiceLine[]
  payments        PurchasePayment[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("purchase_invoices")
  @@index([supplierId])
  @@index([warehouseId])
  @@index([purchaseOrderId])
  @@index([status])
  @@index([paymentStatus])
  @@index([invoiceNumber])
}
```

### منطق العمليات التجارية

#### إنشاء أمر شراء
1. **التحقق من المورد**: التأكد من وجود المورد ونشاطه
2. **التحقق من المنتجات**: التأكد من وجود المنتجات المطلوبة
3. **إنشاء رقم الأمر**: توليد رقم أمر فريد تلقائياً
4. **حفظ الأمر**: حفظ أمر الشراء وبنوده

#### إنشاء فاتورة شراء
1. **التحقق من المورد والمخزن**: التأكد من صحة البيانات
2. **ربط بأمر الشراء**: ربط الفاتورة بأمر الشراء إن وجد
3. **حساب المجاميع**: حساب إجمالي الفاتورة والضرائب
4. **تحديث المخزون**: إضافة الكميات المشتراة للمخزون
5. **تحديث حالة الأمر**: تغيير حالة أمر الشراء إلى "received"

#### إنشاء المدفوعات
1. **التحقق من الفاتورة**: التأكد من وجود فاتورة الشراء
2. **حساب المبلغ المتبقي**: حساب المبلغ الذي لم يتم دفعه بعد
3. **التحقق من المبلغ**: التأكد من عدم تجاوز المبلغ المتبقي
4. **تحديث حالة الدفع**: تحديث حالة دفع الفاتورة

### معاملات قاعدة البيانات

جميع عمليات المشتريات تتم داخل معاملات قاعدة بيانات لضمان:
- الاتساق في البيانات
- عدم فقدان البيانات في حالة فشل العملية
- تحديث المخزون بدقة
- تتبع المدفوعات بشكل صحيح

### اختبار النظام

```bash
# تشغيل اختبار نظام المشتريات
npm run purchasing:test
```

## نظام إدارة المبيعات (Sales Management)

### إدارة فواتير المبيعات

#### إنشاء فاتورة مبيعات جديدة
```bash
POST /sales/invoices
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "invoiceNumber": "INV-001", // اختياري - يُولد تلقائياً إذا لم يُحدد
  "branchId": "branch_id",
  "customerId": "customer_id", // اختياري
  "warehouseId": "warehouse_id",
  "currencyId": "currency_id",
  "taxId": "tax_id", // اختياري
  "lines": [
    {
      "productVariantId": "variant_id",
      "quantity": 2,
      "unitPrice": 199.99,
      "discountAmount": 10.00,
      "taxAmount": 0.00
    }
  ],
  "status": "confirmed",
  "notes": "فاتورة تجريبية",
  "dueDate": "2025-12-31"
}
```

#### إدارة فواتير المبيعات
```bash
GET /sales/invoices - قائمة فواتير المبيعات
GET /sales/invoices?status=confirmed - فواتير مؤكدة فقط
GET /sales/invoices?customerId=xyz - فواتير عميل محدد
GET /sales/invoices/:id - تفاصيل فاتورة
PATCH /sales/invoices/:id - تحديث فاتورة
DELETE /sales/invoices/:id/cancel - إلغاء فاتورة
GET /sales/invoices/:id/print - طباعة فاتورة
```

### معالجة المدفوعات

#### إضافة دفعة لفاتورة
```bash
POST /sales/invoices/:invoiceId/payments
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "currencyId": "currency_id",
  "amount": 399.98,
  "paymentMethod": "cash",
  "referenceNumber": "PAY-001",
  "notes": "دفع نقدي كامل"
}
```

#### طرق الدفع المدعومة
- `cash`: نقدي
- `card`: بطاقة ائتمان
- `bank_transfer`: تحويل بنكي
- `check`: شيك
- `digital_wallet`: محفظة رقمية

### حساب الضرائب والخصومات

#### حساب تلقائي للمجاميع
```typescript
// المجموع الفرعي = الكمية × السعر
subtotal = quantity * unitPrice

// المجموع بعد الخصم = المجموع الفرعي - الخصم
afterDiscount = subtotal - discountAmount

// المجموع النهائي = المجموع بعد الخصم + الضريبة
totalAmount = afterDiscount + taxAmount
```

### إدارة سلة المشتريات

#### إضافة منتجات متعددة
```json
{
  "lines": [
    {
      "productVariantId": "variant1",
      "quantity": 2,
      "unitPrice": 199.99,
      "discountAmount": 10.00
    },
    {
      "productVariantId": "variant2",
      "quantity": 1,
      "unitPrice": 299.99,
      "discountAmount": 0.00
    }
  ]
}
```

### حالات فواتير المبيعات

#### حالات الفاتورة
- `draft`: مسودة
- `confirmed`: مؤكدة
- `cancelled`: ملغاة
- `refunded`: مستردة

#### حالات الدفع
- `pending`: معلق
- `partial`: جزئي
- `paid`: مدفوع
- `refunded`: مسترد

### إحصائيات المبيعات

#### إحصائيات شاملة
```bash
GET /sales/stats
GET /sales/stats?branchId=xyz
GET /sales/stats?startDate=2025-01-01&endDate=2025-12-31
```

**الإحصائيات تشمل:**
- إجمالي عدد الفواتير
- عدد الفواتير المؤكدة والملغاة
- إجمالي الإيرادات والضرائب والخصومات
- عدد الفواتير المعلقة الدفع ومدفوعة
- متوسط قيمة الفاتورة

### فواتير العملاء والفروع

#### فواتير العميل
```bash
GET /sales/customers/:customerId/invoices
```

#### فواتير الفرع
```bash
GET /sales/branches/:branchId/invoices
```

### أذونات مطلوبة

- `sales.read` - قراءة فواتير المبيعات
- `sales.create` - إنشاء فواتير مبيعات جديدة
- `sales.update` - تحديث وإلغاء الفواتير
- `sales.delete` - حذف الفواتير (إلغاء)

### نماذج قاعدة البيانات

#### نموذج SalesInvoice
```sql
model SalesInvoice {
  id              String   @id @default(cuid()) @db.VarChar(50)
  invoiceNumber   String   @unique @db.VarChar(50)
  branchId        String   @db.VarChar(50)
  customerId      String?  @db.VarChar(50)
  cashierId       String   @db.VarChar(50)
  warehouseId     String   @db.VarChar(50)

  subtotal        Decimal  @db.Decimal(10, 2)
  taxAmount       Decimal  @default(0) @db.Decimal(10, 2)
  discountAmount  Decimal  @default(0) @db.Decimal(10, 2)
  totalAmount     Decimal  @db.Decimal(10, 2)

  currencyId      String   @db.VarChar(50)
  taxId           String?  @db.VarChar(50)

  status          String   @default("draft") @db.VarChar(50)
  paymentStatus   String   @default("pending") @db.VarChar(50)

  notes           String?  @db.Text
  dueDate         DateTime?

  branch          Branch       @relation(fields: [branchId], references: [id])
  customer        Customer?    @relation(fields: [customerId], references: [id])
  cashier         User         @relation(fields: [cashierId], references: [id])
  warehouse       Warehouse    @relation(fields: [warehouseId], references: [id])
  currency        Currency     @relation(fields: [currencyId], references: [id])
  tax             Tax?         @relation(fields: [taxId], references: [id])

  lines           SalesInvoiceLine[]
  payments        Payment[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("sales_invoices")
  @@index([branchId])
  @@index([customerId])
  @@index([cashierId])
  @@index([warehouseId])
  @@index([status])
  @@index([paymentStatus])
  @@index([invoiceNumber])
}
```

#### نموذج Payment
```sql
model Payment {
  id              String   @id @default(cuid()) @db.VarChar(50)
  salesInvoiceId  String?  @db.VarChar(50)
  customerId      String?  @db.VarChar(50)
  currencyId      String   @db.VarChar(50)

  amount          Decimal  @db.Decimal(10, 2)
  paymentMethod   String   @db.VarChar(50)
  referenceNumber String?  @db.VarChar(100)
  notes           String?  @db.Text

  paymentDate     DateTime @default(now())
  processedBy     String?  @db.VarChar(50)

  salesInvoice    SalesInvoice? @relation(fields: [salesInvoiceId], references: [id])
  customer        Customer?     @relation(fields: [customerId], references: [id])
  currency        Currency      @relation(fields: [currencyId], references: [id])
  processor       User?         @relation(fields: [processedBy], references: [id])

  @@map("payments")
  @@index([salesInvoiceId])
  @@index([customerId])
  @@index([currencyId])
  @@index([paymentMethod])
}
```

### منطق العمليات التجارية

#### إنشاء فاتورة مبيعات
1. **التحقق من البيانات**: التحقق من وجود المنتجات والمخزون
2. **حساب الأسعار**: تحديد الأسعار من المنتجات أو المتغيرات
3. **حساب المجاميع**: حساب الإجماليات والضرائب والخصومات
4. **إنشاء الفاتورة**: حفظ الفاتورة والبنود
5. **تحديث المخزون**: إنقاص كميات المخزون
6. **تسجيل الحركات**: تسجيل حركات المخزون

#### إضافة دفعة
1. **التحقق من الفاتورة**: التأكد من وجود الفاتورة
2. **التحقق من العملة**: مطابقة عملة الدفعة مع الفاتورة
3. **حساب المبلغ المتبقي**: حساب المبلغ المستحق
4. **التحقق من المبلغ**: التأكد من عدم تجاوز المبلغ المستحق
5. **إنشاء الدفعة**: حفظ الدفعة
6. **تحديث حالة الدفع**: تحديث حالة دفع الفاتورة

#### إلغاء فاتورة
1. **التحقق من الحالة**: التأكد من عدم إلغاء الفاتورة مسبقاً
2. **إعادة المخزون**: إضافة الكميات مرة أخرى للمخزون
3. **تحديث الحالة**: تغيير حالة الفاتورة إلى ملغاة
4. **تسجيل السبب**: حفظ سبب الإلغاء

### معاملات قاعدة البيانات

جميع عمليات المبيعات تتم داخل معاملات قاعدة بيانات لضمان:
- الاتساق في البيانات
- عدم فقدان البيانات في حالة فشل العملية
- تحديث المخزون بدقة
- تسجيل المدفوعات بشكل صحيح

### اختبار النظام

```bash
# تشغيل اختبار نظام المرتجعات
npm run returns:test
```

## نظام إدارة المرتجعات (Returns Management)

### إدارة فواتير المرتجعات

#### إنشاء مرتجع جديد
```bash
POST /returns
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "returnNumber": "RTN-001", // اختياري - يُولد تلقائياً
  "salesInvoiceId": "sales_invoice_id",
  "warehouseId": "warehouse_id",
  "reason": "المنتج معيب",
  "lines": [
    {
      "productVariantId": "variant_id",
      "quantity": 1,
      "unitPrice": 199.99,
      "discountAmount": 0.00,
      "taxAmount": 0.00,
      "reason": "المنتج معيب ولن يتم إعادة بيعه"
    }
  ],
  "status": "confirmed",
  "notes": "مرتجع تجريبي"
}
```

#### إدارة فواتير المرتجعات
```bash
GET /returns - قائمة المرتجعات
GET /returns?salesInvoiceId=xyz - مرتجعات فاتورة محددة
GET /returns?customerId=xyz - مرتجعات عميل محدد
GET /returns?status=confirmed - مرتجعات مؤكدة
GET /returns/:id - تفاصيل مرتجع
PATCH /returns/:id - تحديث مرتجع
DELETE /returns/:id/cancel - إلغاء مرتجع
```

### إنشاء إشعارات دائنة

#### إنشاء إشعار دائن للمرتجع
```bash
POST /returns/:returnId/credit-notes
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "amount": 199.99,
  "expiryDate": "2025-12-31",
  "notes": "إشعار دائن للمرتجع"
}
```

### التحقق من صحة المرتجعات

#### قواعد التحقق الأساسية
- **فاتورة المبيعات**: يجب أن تكون الفاتورة مؤكدة
- **الكميات**: لا يمكن مرتجع كمية أكبر من المباعة
- **المخزن**: يجب أن يكون نفس مخزن فاتورة المبيعات
- **المنتجات**: يجب أن تكون المنتجات موجودة في فاتورة المبيعات

### تحديث المخزون عند المرتجعات

#### منطق تحديث المخزون
```typescript
// عند إنشاء مرتجع - إضافة الكميات للمخزون
inventoryService.adjustStock(warehouseId, productVariantId, {
  quantity: returnQuantity,
  movementType: 'return',
  referenceType: 'return',
  referenceId: returnId,
  reason: 'مرتجع - ${returnNumber}'
});

// عند إلغاء مرتجع - إنقاص الكميات من المخزون
inventoryService.adjustStock(warehouseId, productVariantId, {
  quantity: -returnQuantity,
  movementType: 'adjustment',
  referenceType: 'return_cancelled',
  referenceId: returnId,
  reason: 'إلغاء مرتجع'
});
```

### حالات فواتير المرتجعات

#### حالات المرتجع
- `draft`: مسودة
- `confirmed`: مؤكدة
- `cancelled`: ملغاة
- `refunded`: مستردة

#### حالات الاسترداد
- `pending`: معلق
- `partial`: جزئي
- `refunded`: مسترد

### إحصائيات المرتجعات

#### إحصائيات شاملة
```bash
GET /returns/stats/overview
GET /returns/stats/overview?startDate=2025-01-01&endDate=2025-12-31
```

**الإحصائيات تشمل:**
- إجمالي عدد المرتجعات
- عدد المرتجعات المؤكدة والملغاة
- إجمالي قيمة المرتجعات
- عدد المرتجعات المستردة جزئياً وكلياً
- متوسط قيمة المرتجع

### مرتجعات العملاء والفواتير

#### مرتجعات فاتورة مبيعات
```bash
GET /returns/sales-invoices/:salesInvoiceId/returns
```

#### مرتجعات العميل
```bash
GET /returns/customers/:customerId/returns
```

### أذونات مطلوبة

- `returns.read` - قراءة فواتير المرتجعات
- `returns.create` - إنشاء فواتير مرتجعات جديدة
- `returns.update` - تحديث وإلغاء المرتجعات
- `returns.delete` - حذف المرتجعات

### نماذج قاعدة البيانات

#### نموذج Return
```sql
model Return {
  id              String   @id @default(cuid()) @db.VarChar(50)
  returnNumber    String   @unique @db.VarChar(50)
  salesInvoiceId  String   @db.VarChar(50)
  customerId      String?  @db.VarChar(50)
  cashierId       String   @db.VarChar(50)
  warehouseId     String   @db.VarChar(50)

  subtotal        Decimal  @db.Decimal(10, 2)
  taxAmount       Decimal  @default(0) @db.Decimal(10, 2)
  discountAmount  Decimal  @default(0) @db.Decimal(10, 2)
  totalAmount     Decimal  @db.Decimal(10, 2)

  currencyId      String   @db.VarChar(50)
  reason          String   @db.Text

  status          String   @default("draft") @db.VarChar(50)
  refundStatus    String   @default("pending") @db.VarChar(50)

  notes           String?  @db.Text

  salesInvoice    SalesInvoice @relation(fields: [salesInvoiceId], references: [id])
  customer        Customer?    @relation(fields: [customerId], references: [id])
  cashier         User         @relation(fields: [cashierId], references: [id])
  warehouse       Warehouse    @relation(fields: [warehouseId], references: [id])
  currency        Currency     @relation(fields: [currencyId], references: [id])

  lines           ReturnLine[]
  creditNotes     CreditNote[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("returns")
  @@index([salesInvoiceId])
  @@index([customerId])
  @@index([cashierId])
  @@index([warehouseId])
  @@index([status])
  @@index([refundStatus])
  @@index([returnNumber])
}
```

#### نموذج CreditNote
```sql
model CreditNote {
  id              String   @id @default(cuid()) @db.VarChar(50)
  creditNoteNumber String  @unique @db.VarChar(50)
  returnId        String   @db.VarChar(50)
  customerId      String?  @db.VarChar(50)
  currencyId      String   @db.VarChar(50)

  amount          Decimal  @db.Decimal(10, 2)
  remainingAmount Decimal  @db.Decimal(10, 2)

  status          String   @default("active") @db.VarChar(50)
  expiryDate      DateTime?

  notes           String?  @db.Text

  return          Return     @relation(fields: [returnId], references: [id])
  customer        Customer?  @relation(fields: [customerId], references: [id])
  currency        Currency   @relation(fields: [currencyId], references: [id])

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("credit_notes")
  @@index([returnId])
  @@index([customerId])
  @@index([currencyId])
  @@index([status])
  @@index([creditNoteNumber])
}
```

### منطق العمليات التجارية

#### إنشاء مرتجع
1. **التحقق من فاتورة المبيعات**: التأكد من وجود الفاتورة وحالة التأكيد
2. **التحقق من الكميات**: التأكد من عدم تجاوز الكميات المباعة
3. **حساب الأسعار**: استخدام أسعار فاتورة المبيعات الأصلية
4. **إنشاء المرتجع**: حفظ المرتجع وبنوده
5. **تحديث المخزون**: إضافة الكميات المرتجعة للمخزون
6. **تسجيل الحركات**: تسجيل حركات المخزون

#### إنشاء إشعار دائن
1. **التحقق من المرتجع**: التأكد من وجود المرتجع وحالة التأكيد
2. **حساب المبلغ المتبقي**: حساب المبلغ الذي لم يتم استرداده بعد
3. **التحقق من المبلغ**: التأكد من عدم تجاوز المبلغ المتبقي
4. **إنشاء الإشعار**: حفظ إشعار الدائن
5. **تحديث حالة الاسترداد**: تحديث حالة استرداد المرتجع

#### إلغاء مرتجع
1. **التحقق من الحالة**: التأكد من عدم إلغاء المرتجع مسبقاً
2. **إنقاص المخزون**: إزالة الكميات المرتجعة من المخزون
3. **تحديث الحالة**: تغيير حالة المرتجع إلى ملغاة
4. **تسجيل السبب**: حفظ سبب الإلغاء

### معاملات قاعدة البيانات

جميع عمليات المرتجعات تتم داخل معاملات قاعدة بيانات لضمان:
- الاتساق في البيانات
- عدم فقدان البيانات في حالة فشل العملية
- تحديث المخزون بدقة
- تسجيل الاستردادات بشكل صحيح

### اختبار النظام

```bash
# تشغيل اختبار نظام المرتجعات
npm run returns:test
```

## هيكل المشروع

```
backend/
├── src/
│   ├── config/                 # إعدادات التطبيق
│   ├── common/                 # المكونات المشتركة
│   │   ├── decorators/         # Decorators مخصصة
│   │   ├── guards/            # Guards للأمان
│   │   ├── interceptors/      # Interceptors
│   │   ├── filters/           # Exception Filters
│   │   ├── pipes/             # Validation Pipes
│   │   └── dto/               # DTOs مشتركة
│   ├── modules/               # وحدات الأعمال
│   │   ├── auth/              # وحدة المصادقة
│   │   ├── sales/             # وحدة المبيعات
│   │   ├── inventory/         # وحدة المخزون
│   │   ├── purchasing/        # وحدة المشتريات
│   │   ├── accounting/        # وحدة المحاسبة
│   │   ├── reporting/         # وحدة التقارير
│   │   └── sync/              # وحدة المزامنة
│   ├── shared/                # الخدمات المشتركة
│   │   ├── database/          # إعدادات قاعدة البيانات
│   │   ├── cache/             # إعدادات الكاش
│   │   ├── queue/             # إعدادات الطوابير
│   │   ├── storage/           # إعدادات التخزين
│   │   └── logger/            # إعدادات التسجيل
│   └── utils/                 # الأدوات المساعدة
├── test/                      # ملفات الاختبار
└── scripts/                   # سكريبتات مساعدة
```

## مراحل التطوير

### المرحلة 1 ✅ (مكتملة)
- إعداد المشروع الأساسي
- تثبيت التبعيات الأساسية
- إنشاء هيكل المجلدات
- إعداد أدوات التطوير

### المرحلة 2 ✅ (مكتملة)
- إعداد قاعدة البيانات مع Prisma
- تكوين Prisma Schema الكامل
- إنشاء نماذج البيانات الأساسية (User, Role, Branch, Company, Warehouse)
- إعداد خدمة Prisma ووحدتها
- إنشاء بيانات أولية شاملة
- إعداد سكريبتات اختبار قاعدة البيانات

### المرحلة 3 ✅ (مكتملة)
- إعداد اتصال Redis الكامل
- إنشاء خدمة Cache شاملة مع إحصائيات
- إعداد Session Store لإدارة الجلسات
- تكوين Cache Module العام
- إضافة Cache Interceptors للـ HTTP requests
- إنشاء Cache Decorators للاستخدام السهل
- إعداد نظام إبطال الكاش التلقائي

### المرحلة 4 ✅ (مكتملة)
- إنشاء Response Interceptor لتوحيد شكل الاستجابات
- بناء Exception Filters شامل لمعالجة الأخطاء
- إنشاء Validation Exception Filter مخصص
- إنشاء DTOs مشتركة للاستجابات والـ pagination
- تكوين Custom Validation Pipe مع ترجمة الأخطاء للعربية
- إضافة Logging Interceptor شامل لتسجيل الطلبات
- إنشاء نظام Error Codes موحد مع رسائل عربية
- إعداد نظام استجابات موحد مع metadata وpagination

### المرحلة 5 ✅ (مكتملة)
- إنشاء Permission Decorators شامل (@Permissions, @Public, @RequireRead, etc.)
- بناء Permission Guard للتحقق من الصلاحيات
- إعداد JWT Strategy للمصادقة بالرموز المميزة
- إنشاء Local Strategy للمصادقة بالبيانات المحلية
- بناء JWT Auth Guard لحماية الـ endpoints
- إنشاء Role Guard للتحقق من الأدوار
- تكوين Auth Module لتنظيم مكونات المصادقة
- إعداد Global Guards للتطبيق التلقائي على جميع الـ endpoints
- إضافة Permission Checker مساعد للتحقق من الصلاحيات

### المرحلة 6 ✅ (مكتملة)
- إنشاء Auth Service شامل مع جميع العمليات
- بناء Auth Controller مع endpoints كاملة
- إضافة JWT token generation و refresh mechanism
- تكوين Refresh token logic مع validation
- إنشاء Password hashing utilities مع bcrypt
- إضافة User registration مع validation شامل
- تكوين Session management في Redis
- إعداد DTOs لجميع العمليات (Login, Register, Change Password, etc.)
- إضافة Local Auth Guard للمصادقة المحلية
- تكامل كامل مع Permission System

### المرحلة 7 ✅ (مكتملة)
- إنشاء Role Service شامل مع CRUD operations
- بناء Role Controller مع جميع endpoints
- إضافة Permission Service مع نظام هرمي متطور
- إدارة الصلاحيات المفصلة (140+ صلاحية منظمة)
- ربط المستخدمين بالأدوار مع validation
- نظام صلاحيات هرمي مع الصلاحيات الأب والفرعية
- إضافة فئات الصلاحيات (system, users, products, sales, etc.)
- تكامل كامل مع Cache system للأداء
- حماية الـ endpoints بأدوار وصلاحيات محددة
- إحصائيات شاملة للأدوار والمستخدمين

### المرحلة 8 ✅ (مكتملة)
- إنشاء Branch Service شامل مع إدارة كاملة للفروع
- بناء Branch Controller مع جميع endpoints
- إضافة Warehouse Service مع إدارة المخازن والمخزون
- إنشاء Warehouse Controller مع endpoints متكاملة
- إدارة علاقات الفروع بالمخازن والمستخدمين
- Branch-based filtering للبيانات والمخزون
- نقل المخزون بين المخازن مع تتبع الحركات
- إحصائيات شاملة للفروع والمخازن
- تكامل كامل مع نظام الصلاحيات والأدوار
- حماية البيانات مع validation شامل
- نظام كاش محسن للأداء والاستجابة السريعة
- إضافة نماذج StockItem و StockMovement إلى قاعدة البيانات

### المرحلة 9 ✅ (مكتملة)
- إنشاء Product Service شامل مع إدارة كاملة للمنتجات
- بناء Product Controller مع جميع endpoints
- إضافة Category Service مع نظام هرمي متطور للفئات
- إنشاء Category Controller مع endpoints متكاملة
- إدارة Product Variants مع خصائص مخصصة (الألوان، الأحجام، إلخ)
- إنشاء ProductVariant Controller مع إدارة شاملة
- نظام Barcode و SKU مع validation و uniqueness
- البحث المتقدم بالباركود والاسم والفئة
- إدارة الأسعار والتكاليف مع validation دقيق
- نظام الفئات الهرمي مع منع الحلقات
- إحصائيات شاملة للمنتجات والفئات والمتغيرات
- تكامل كامل مع نظام الصلاحيات والكاش
- validation شامل لجميع البيانات والعمليات
- إضافة نماذج Product و Category و ProductVariant إلى قاعدة البيانات

### المرحلة 10 ✅ (مكتملة)
- إنشاء Inventory Service شامل مع إدارة كاملة للمخزون
- بناء Inventory Controller مع جميع endpoints
- إدارة Stock Items مع حدود المخزون (الحد الأدنى والأقصى)
- نظام Stock Movements مع تتبع شامل للحركات
- تنبيهات المخزون المنخفض والمرتفع
- تعديل كميات المخزون مع validation شامل
- تقارير حركات المخزون التفصيلية
- إحصائيات شاملة للمخزون والحركات
- عرض مخزون المنتج عبر المخازن
- عرض مخزون المخزن الكامل
- تكامل كامل مع نظام الصلاحيات والكاش
- validation شامل للبيانات والعمليات
- معاملات قاعدة البيانات لضمان الاتساق
- أنواع حركات متعددة (شراء، بيع، تعديل، نقل، إرجاع)

### المرحلة 11 ✅ (مكتملة)
- إنشاء Sales Service شامل مع إدارة كاملة للمبيعات
- بناء Sales Controller مع جميع endpoints
- إدارة Sales Invoices مع أرقام فواتير تلقائية
- معالجة المدفوعات المتعددة وتتبع حالة الدفع
- حساب الضرائب والخصومات تلقائياً
- إدارة سلة المشتريات والمنتجات المتعددة
- تحديث المخزون تلقائياً عند المبيعات
- إلغاء الفواتير وإعادة المخزون
- إحصائيات شاملة للمبيعات والإيرادات
- تكامل كامل مع نظام العملاء والعملات
- إدارة فواتير متعددة الحالات والمدفوعات
- طباعة الفواتير وإدارة التواريخ
- تكامل كامل مع نظام الصلاحيات والكاش
- validation شامل للبيانات والعمليات
- معاملات قاعدة البيانات للأمان والاتساق

### المرحلة 12 ✅ (مكتملة)
- إنشاء Returns Service شامل مع إدارة كاملة للمرتجعات
- بناء Returns Controller مع جميع endpoints
- إدارة Return Invoices مع أرقام مرتجعات تلقائية
- معالجة المرتجعات الكلية والجزئية مع التحقق من الكميات
- تحديث المخزون تلقائياً عند المرتجعات (إضافة الكميات)
- إنشاء Credit Notes للاسترداد المالي
- إلغاء المرتجعات وإعادة المخزون الأصلي
- إحصائيات شاملة للمرتجعات والإرجاعات
- تكامل كامل مع نظام المبيعات والمخزون
- تتبع حالات المرتجعات وحالات الاسترداد
- ربط المرتجعات بفواتير المبيعات الأصلية
- التحقق من صحة البيانات ومنع المرتجعات غير الصحيحة
- تكامل كامل مع نظام الصلاحيات والكاش
- validation شامل للبيانات والعمليات
- معاملات قاعدة البيانات للأمان والاتساق

### المرحلة 13 ✅ (مكتملة)
- إنشاء Purchasing Service شامل مع إدارة كاملة للمشتريات
- بناء Purchasing Controller مع جميع endpoints
- إدارة Suppliers مع معلومات الاتصال والشروط المالية
- إدارة Purchase Orders مع أرقام تلقائية وتتبع الحالات
- إدارة Purchase Invoices مع ربطها بأوامر الشراء
- معالجة Purchase Payments مع تتبع حالات المدفوعات
- تحديث المخزون تلقائياً عند استلام فواتير الشراء
- إحصائيات شاملة للمشتريات والموردين والمدفوعات
- تكامل كامل مع نظام المنتجات والمخزون
- تتبع حالات أوامر الشراء (draft, approved, ordered, received, cancelled)
- تتبع حالات فواتير الشراء (draft, received, approved, paid, cancelled)
- تتبع حالات المدفوعات (pending, partial, paid)
- دعم طرق دفع متعددة (cash, bank_transfer, check, credit_card)
- ربط فواتير الشراء بأوامر الشراء الأصلية
- التحقق من صحة البيانات ومنع العمليات غير الصحيحة
- تكامل كامل مع نظام الصلاحيات والكاش
- validation شامل للبيانات والعمليات
- معاملات قاعدة البيانات للأمان والاتساق

### المرحلة 14 ✅ (مكتملة)
- إنشاء Customer Service شامل مع إدارة كاملة للعملاء
- بناء Customer Controller مع جميع endpoints
- إدارة بيانات العملاء مع معلومات الاتصال والشخصية
- نظام الولاء المتقدم مع النقاط والمستويات الأربعة
- تحديث تلقائي لإحصائيات العملاء عند المبيعات
- البحث والفلترة المتقدمة في العملاء
- إدارة حدود الائتمان وطرق الدفع المفضلة
- نظام الموافقة على التسويق والإشعارات
- تتبع تاريخ المعاملات والمشتريات
- إحصائيات شاملة للعملاء والولاء والمبيعات
- حساب تلقائي لنقاط الولاء من المشتريات
- ترقية تلقائية لمستويات الولاء
- إدارة نقاط الولاء وإضافة/خصم النقاط
- فوائد مختلفة حسب مستوى الولاء
- تكامل كامل مع نظام المبيعات والمدفوعات
- validation شامل للبيانات والعمليات
- معاملات قاعدة البيانات للأمان والاتساق

### المرحلة 15 ✅ (مكتملة)
- إنشاء Accounting Service شامل للنظام المحاسبي الأساسي
- بناء Accounting Controller مع جميع endpoints المحاسبية
- دليل الحسابات (Chart of Accounts) مع التسلسل الهرمي
- نظام القيود اليومية مع التحقق من التوازن المزدوج
- إنشاء وإدارة حسابات GL بأنواع مختلفة (أصول، التزامات، حقوق ملكية، إيرادات، مصروفات)
- اعتماد وإلغاء اعتماد القيود اليومية مع تحديث الأرصدة
- قيود تلقائية للمبيعات والمشتريات
- حسابات النظام الافتراضية (النقدية، المدينون، الدائنون، إيرادات المبيعات، إلخ)
- إحصائيات شاملة للنظام المحاسبي (الحسابات، القيود، الأرصدة)
- منع الحلقات في التسلسل الهرمي للحسابات
- حماية الحسابات النظامية من التعديل غير المصرح
- تتبع مصدر القيود (يدوي/تلقائي) ووحدة النظام
- validation شامل للقيود والحسابات
- معاملات قاعدة البيانات لضمان سلامة البيانات المالية
- تكامل كامل مع نظام الصلاحيات والكاش
- دعم المراجع والتتبع لجميع القيود المحاسبية

### المرحلة 16 ✅ (مكتملة)
- إنشاء Reporting Service شامل لوحدة التقارير المتقدمة
- بناء Reporting Controller مع جميع endpoints التقارير
- تقارير المبيعات الشاملة مع تحليلات مفصلة (يومي، شهري، حسب الفترة)
- تقارير المخزون المتقدمة مع تنبيهات المخزون المنخفض
- بيانات لوحة المؤشرات التفاعلية مع مقاييس الأداء الرئيسية
- تقارير المبيعات حسب الفرع، العميل، طريقة الدفع، والمنتج
- تحليل حركات المخزون والمنتجات الأكثر حركة
- إحصائيات شاملة للعملاء والولاء والأداء المالي
- نظام كاش ذكي للتقارير (5-30 دقيقة حسب نوع التقرير)
- استعلامات مجمعة ومحسنة لتقليل عدد الاستعلامات قاعدة البيانات
- validation شامل للبيانات والتواريخ والفلاتر
- تكامل كامل مع جميع وحدات النظام (مبيعات، مخزون، محاسبة، عملاء)
- دعم تصدير التقارير (PDF وExcel جاهز للتطبيق)
- تقارير مجدولة ومخصصة مع فلاتر متقدمة
- تحليلات الأداء ومقارنات الفترات
- أذونات أمان محكمة للتقارير المختلفة
- واجهة برمجة موحدة وسهلة الاستخدام
- استعداد كامل للإنتاج مع أداء عالي وقابلية توسع

### المرحلة 17 ✅ (مكتملة)
- إنشاء AuditLog Entity شامل في قاعدة البيانات مع جميع العلاقات
- بناء Audit Service متقدم للتسجيل والتتبع والتحليل
- إنشاء Audit Controller مع جميع endpoints التدقيق والتقارير
- نظام Auto-logging decorators للتسجيل التلقائي للعمليات
- Audit Interceptor لالتقاط وتسجيل العمليات تلقائياً
- تتبع تفصيلي للتغييرات (قبل وبعد) مع مقارنة الإصدارات
- تقارير التدقيق الشاملة (أمان، امتثال، نشاط، تغييرات)
- إحصائيات متقدمة للأخطاء والأنشطة والمستخدمين
- نظام تصنيف العمليات (business, security, system, audit)
- تتبع المستخدمين والفروع والمخازن مع العلاقات الكاملة
- نظام كاش ذكي للإحصائيات والتقارير (5 دقائق)
- تصدير سجلات التدقيق إلى JSON مع فلاتر متقدمة
- تنظيف تلقائي للسجلات القديمة مع الحفاظ على السجلات الحرجة
- validation شامل ومعالجة أخطاء آمنة
- أذونات أمان محكمة (read, compliance, admin, export, cleanup)
- تكامل كامل مع جميع وحدات النظام للتسجيل التلقائي
- دعم البحث المتقدم والفلاتر المعقدة
- استعداد كامل للإنتاج مع أداء عالي وأمان متقدم

## وحدة التدقيق (Audit Module)

### نظرة عامة على النظام

وحدة التدقيق توفر نظاماً شاملاً لتتبع وتسجيل جميع العمليات في النظام مع إمكانيات البحث والتحليل المتقدمة. يدعم النظام:

- **تسجيل تلقائي** لجميع العمليات الحساسة
- **تتبع التغييرات** التفصيلي (قبل وبعد)
- **تقارير الأمان** والامتثال
- **إحصائيات شاملة** للنشاط والأخطاء
- **تصدير البيانات** بصيغ متعددة
- **تنظيف تلقائي** للسجلات القديمة

### أنواع السجلات المُسجلة

#### عمليات المصادقة والأمان
```typescript
LOGIN_SUCCESS, LOGIN_FAILED, LOGOUT
PASSWORD_CHANGE, PERMISSION_CHANGE
```

#### عمليات CRUD
```typescript
CREATE, READ, UPDATE, DELETE
```

#### عمليات النظام
```typescript
SYSTEM_MAINTENANCE, BACKUP_CREATED, ERROR_OCCURRED
```

### البحث في سجلات التدقيق

#### البحث العام
```bash
GET /audit/logs?limit=50&offset=0
```

#### البحث المتقدم
```bash
GET /audit/logs?userId=user-1&action=UPDATE&entity=Product&startDate=2025-01-01&endDate=2025-12-31
```

**معاملات البحث المتاحة:**
- `userId` - فلترة حسب المستخدم
- `action` - نوع العملية (CREATE, UPDATE, DELETE, etc)
- `entity` - الكيان المُعدّل
- `entityId` - معرف الكيان المحدد
- `branchId` - فلترة حسب الفرع
- `warehouseId` - فلترة حسب المخزن
- `startDate/endDate` - نطاق زمني
- `success` - حالة العملية (true/false)
- `severity` - مستوى الخطورة
- `category` - فئة العملية
- `module` - الوحدة النظامية
- `searchText` - نص البحث الحر

### إحصائيات التدقيق

#### إحصائيات عامة
```bash
GET /audit/stats
```

#### إحصائيات يومية/أسبوعية/شهرية
```bash
GET /audit/stats/daily?branchId=branch-1
GET /audit/stats/weekly?branchId=branch-1
GET /audit/stats/monthly?year=2025&month=1&branchId=branch-1
```

**تشمل الإحصائيات:**
- إجمالي عدد السجلات
- توزيع العمليات حسب النوع
- توزيع السجلات حسب الكيانات
- أكثر المستخدمين نشاطاً
- معدل الأخطاء
- الأنشطة الأخيرة

### تتبع التدقيق التفصيلي

#### تتبع كيان محدد
```bash
GET /audit/trail/detailed/Product/product-123
```

**العائد:**
```json
{
  "entity": "Product",
  "entityId": "product-123",
  "currentState": { /* الحالة الحالية */ },
  "changeHistory": [
    {
      "timestamp": "2025-01-15T10:30:00Z",
      "action": "UPDATE",
      "user": "admin",
      "changes": [
        {
          "field": "name",
          "oldValue": "منتج قديم",
          "newValue": "منتج محدث",
          "changeType": "modified"
        }
      ]
    }
  ],
  "summary": {
    "totalChanges": 5,
    "lastModified": "2025-01-15T10:30:00Z",
    "lastModifiedBy": "admin",
    "createdAt": "2025-01-01T09:00:00Z",
    "createdBy": "admin"
  }
}
```

### تقارير التدقيق المتخصصة

#### تقرير الأخطاء
```bash
GET /audit/reports/errors?startDate=2025-01-01&endDate=2025-12-31
```

#### تقرير الأمان
```bash
GET /audit/reports/security?startDate=2025-01-01&endDate=2025-12-31
```

#### تقرير النشاط
```bash
GET /audit/reports/activity?startDate=2025-01-01&endDate=2025-12-31
```

#### تقرير الامتثال
```bash
GET /audit/reports/compliance?startDate=2025-01-01&endDate=2025-12-31
```

#### تقرير التغييرات
```bash
GET /audit/reports/changes?startDate=2025-01-01&endDate=2025-12-31
```

### نظام Auto-logging Decorators

#### استخدام الdecorators في Controllers
```typescript
import { AuditCreate, AuditUpdate, AuditDelete, AuditRead } from '../common/decorators/audit.decorators';

@Controller('products')
export class ProductController {
  @Post()
  @AuditCreate({
    entity: 'Product',
    module: 'products',
    entityIdProperty: 'result.id'
  })
  async create(@Body() createProductDto: CreateProductDto) {
    // العملية ستُسجل تلقائياً
    return this.productService.create(createProductDto);
  }

  @Put(':id')
  @AuditUpdate({
    entity: 'Product',
    module: 'products',
    entityIdParam: 'id',
    includeRequestBody: true
  })
  async update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    // سيتم تسجيل القيم القديمة والجديدة
    return this.productService.update(id, updateProductDto);
  }

  @Delete(':id')
  @AuditDelete({
    entity: 'Product',
    module: 'products',
    entityIdParam: 'id'
  })
  async delete(@Param('id') id: string) {
    // سيتم تسجيل عملية الحذف
    return this.productService.delete(id);
  }
}
```

#### Decorators المتاحة
- `@AuditCreate()` - تسجيل عمليات الإنشاء
- `@AuditRead()` - تسجيل عمليات القراءة
- `@AuditUpdate()` - تسجيل عمليات التحديث مع مقارنة القيم
- `@AuditDelete()` - تسجيل عمليات الحذف
- `@AuditSecurity()` - تسجيل عمليات الأمان
- `@AuditAuth()` - تسجيل عمليات المصادقة
- `@AuditSystem()` - تسجيل عمليات النظام
- `@AuditSales()` - تسجيل عمليات المبيعات
- `@AuditInventory()` - تسجيل عمليات المخزون
- `@AuditAccounting()` - تسجيل عمليات المحاسبة
- `@AuditCustomer()` - تسجيل عمليات العملاء
- `@AuditPurchasing()` - تسجيل عمليات المشتريات
- `@AuditReporting()` - تسجيل عمليات التقارير
- `@AuditAdmin()` - تسجيل عمليات الإدارة

### تصدير البيانات

#### تصدير JSON
```bash
GET /audit/export/json?startDate=2025-01-01&endDate=2025-12-31&entity=Product
```

#### تصدير Excel (جاهز للتطبيق)
```bash
GET /audit/export/excel?startDate=2025-01-01&endDate=2025-12-31&entity=Product
```

### إدارة السجلات

#### تنظيف السجلات القديمة
```bash
GET /audit/cleanup/365
```

**يحذف السجلات الأقدم من 365 يوماً، مع الاحتفاظ بالسجلات الحرجة**

### أذونات الوصول

- `audit.read` - قراءة سجلات التدقيق
- `audit.compliance` - تقارير الامتثال
- `audit.admin` - إدارة سجلات التدقيق
- `audit.export` - تصدير السجلات
- `audit.cleanup` - تنظيف السجلات القديمة

### نظام الكاش

#### أوقات الكاش حسب نوع البيانات:
- إحصائيات التدقيق: 5 دقائق
- تقارير التدقيق: 10 دقائق
- تتبع التفصيلي: 15 دقيقة

### نموذج قاعدة البيانات

```sql
-- AuditLog table structure
CREATE TABLE audit_logs (
  id VARCHAR(50) PRIMARY KEY,
  userId VARCHAR(50),
  action VARCHAR(50) NOT NULL,
  entity VARCHAR(100) NOT NULL,
  entityId VARCHAR(50) NOT NULL,
  branchId VARCHAR(50),
  warehouseId VARCHAR(50),
  details JSONB,
  oldValues JSONB,
  newValues JSONB,
  ipAddress VARCHAR(45),
  userAgent TEXT,
  sessionId VARCHAR(100),
  success BOOLEAN DEFAULT true,
  errorMessage TEXT,
  severity VARCHAR(20) DEFAULT 'info',
  category VARCHAR(50) DEFAULT 'business',
  referenceType VARCHAR(50),
  referenceId VARCHAR(50),
  module VARCHAR(50),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  searchableText TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Indexes for performance
  INDEX idx_audit_userId (userId),
  INDEX idx_audit_action (action),
  INDEX idx_audit_entity (entity),
  INDEX idx_audit_timestamp (timestamp),
  INDEX idx_audit_success (success),
  INDEX idx_audit_severity (severity),
  INDEX idx_audit_module (module),
  INDEX idx_audit_searchableText (searchableText)
);
```

### اختبار النظام

```bash
# تشغيل اختبار وحدة التدقيق
npm run audit:test
```

### أمثلة على الاستخدامات

#### 1. تتبع تغييرات المنتج
```typescript
// في ProductController
@Put(':id')
@AuditUpdate({
  entity: 'Product',
  entityIdParam: 'id',
  module: 'products',
  includeRequestBody: true
})
async update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
  const oldProduct = await this.productService.findOne(id);
  const result = await this.productService.update(id, dto);

  // النظام سيسجل تلقائياً:
  // - القيم القديمة من oldProduct
  // - القيم الجديدة من dto
  // - تفاصيل العملية
  return result;
}
```

#### 2. مراقبة عمليات الأمان
```typescript
// في AuthController
@Post('change-password')
@AuditSecurity({
  action: 'PASSWORD_CHANGE',
  entity: 'User',
  module: 'auth',
  severity: 'warning'
})
async changePassword(@Body() dto: ChangePasswordDto, @User() user: User) {
  // سيتم تسجيل محاولة تغيير كلمة المرور
  return this.authService.changePassword(user.id, dto);
}
```

#### 3. تقرير الامتثال اليومي
```typescript
// في ComplianceService
async generateDailyComplianceReport(): Promise<ComplianceReport> {
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const stats = await this.auditService.getAuditStats(startOfDay, today);
  const securityReport = await this.auditService.getSecurityReport(startOfDay, today);

  return {
    date: today,
    totalEvents: stats.totalLogs,
    errorRate: stats.errorRate,
    securityIncidents: securityReport.totalSecurityEvents,
    complianceStatus: this.calculateComplianceStatus(stats, securityReport),
    recommendations: this.generateRecommendations(stats)
  };
}
```

### ملخص المميزات

✅ **تسجيل شامل** لجميع العمليات الحساسة
✅ **تتبع تفصيلي** للتغييرات مع مقارنة القيم
✅ **تقارير متقدمة** للأمان والامتثال والنشاط
✅ **بحث وفلترة** متقدمة مع دعم النص الحر
✅ **إحصائيات شاملة** مع تحليلات الأداء
✅ **تصدير البيانات** بصيغ متعددة
✅ **تنظيف تلقائي** للسجلات القديمة
✅ **أذونات أمان** محكمة ومرنة
✅ **كاش ذكي** للأداء العالي
✅ **تكامل كامل** مع جميع وحدات النظام
✅ **decorators** للتسجيل التلقائي
✅ **واجهة برمجة** موحدة وسهلة الاستخدام
✅ **استعداد كامل** للإنتاج مع الأمان العالي

### تقارير المبيعات

#### تقرير المبيعات الشامل
```bash
GET /reporting/sales?startDate=2025-01-01&endDate=2025-12-31&branchId=branch-1&customerId=customer-1
```

**التقرير يشمل:**
- الإحصائيات العامة (إجمالي المبيعات، الإيرادات، الضرائب، الخصومات)
- متوسط قيمة الطلب
- أفضل المنتجات مبيعاً
- المبيعات حسب الفترة الزمنية
- المبيعات حسب الفرع
- المبيعات حسب العميل
- المبيعات حسب طريقة الدفع

#### تقارير متخصصة
```bash
GET /reporting/sales/monthly?year=2025&month=1&branchId=branch-1
GET /reporting/sales/daily?date=2025-01-15&branchId=branch-1
```

### تقارير المخزون

#### تقرير المخزون الشامل
```bash
GET /reporting/inventory?warehouseId=warehouse-1&categoryId=category-1
```

**التقرير يشمل:**
- إحصائيات المخزون العامة (الإجمالي، القيمة، المنخفض، الناقص)
- المخزون حسب المخزن
- تنبيهات المخزون المنخفض
- حركات المخزون الأخيرة
- المنتجات الأكثر حركة

#### تقارير متخصصة
```bash
GET /reporting/inventory/low-stock?warehouseId=warehouse-1
GET /reporting/inventory/movements?warehouseId=warehouse-1&startDate=2025-01-01&endDate=2025-12-31
```

### لوحة المؤشرات

#### بيانات لوحة المؤشرات الرئيسية
```bash
GET /reporting/dashboard/overview?branchId=branch-1
```

**البيانات تشمل:**
- مقاييس الأداء الرئيسية (الإيرادات، الطلبات، العملاء)
- نسب التغيير مقارنة بالفترة السابقة
- الرسوم البيانية للإيرادات حسب الفترة
- توزيع المبيعات حسب الفئة
- أفضل المنتجات
- نمو العملاء
- التنبيهات (مخزون منخفض، مدفوعات متأخرة)
- الأنشطة الأخيرة

#### بيانات متخصصة للوحة المؤشرات
```bash
GET /reporting/dashboard/sales?period=monthly&branchId=branch-1
GET /reporting/dashboard/inventory?warehouseId=warehouse-1
```

### التقارير المالية

#### الميزانية العمومية
```bash
GET /reporting/financial/balance-sheet?asOfDate=2025-12-31
```

#### قائمة الدخل
```bash
GET /reporting/financial/profit-loss?startDate=2025-01-01&endDate=2025-12-31
```

#### التدفق النقدي
```bash
GET /reporting/financial/cash-flow?startDate=2025-01-01&endDate=2025-12-31
```

#### التقرير المالي الشامل
```bash
GET /reporting/financial/comprehensive?asOfDate=2025-12-31
```

### إحصائيات النظام

#### إحصائيات المحاسبة
```bash
GET /accounting/stats/overview?startDate=2025-01-01&endDate=2025-12-31
```

**تشمل:**
- عدد حسابات GL (الإجمالي والنشط)
- توزيع الحسابات حسب النوع
- عدد القيود اليومية (المجموع، المعتمدة، المسودة)
- الأرصدة المالية (الأصول، الالتزامات، حقوق الملكية، الإيرادات، المصروفات)

### تصدير التقارير

#### تصدير إلى Excel
```bash
GET /reporting/sales/export/excel?startDate=2025-01-01&endDate=2025-12-31&branchId=branch-1
GET /reporting/inventory/export/excel?warehouseId=warehouse-1
```

#### تصدير إلى PDF
```bash
GET /reporting/sales/export/pdf?startDate=2025-01-01&endDate=2025-12-31&branchId=branch-1
GET /reporting/inventory/export/pdf?warehouseId=warehouse-1
```

*ملاحظة: ميزات التصدير إلى PDF وExcel جاهزة للتطبيق وسيتم إضافتها في المرحلة التالية*

### التقارير المجدولة

#### إنشاء تقرير مجدول
```bash
GET /reporting/scheduled/sales?frequency=daily&branchId=branch-1
GET /reporting/scheduled/inventory?frequency=weekly&warehouseId=warehouse-1
```

*ملاحظة: التقارير المجدولة جاهزة للتطبيق وسيتم إضافتها في المرحلة التالية*

### التقارير المخصصة

#### تقرير مخصص مع فلاتر متقدمة
```bash
GET /reporting/custom?reportType=sales&filters={"branchId":"branch-1","minAmount":100}&groupBy=category&sortBy=revenue
```

*ملاحظة: التقارير المخصصة جاهزة للتطبيق وسيتم إضافتها في المرحلة التالية*

### تحليلات الأداء

#### مقارنات الفترات
```bash
GET /reporting/analytics/comparison?currentStart=2025-01-01&currentEnd=2025-12-31&previousStart=2024-01-01&previousEnd=2024-12-31&branchId=branch-1
```

#### تحليلات الأداء
```bash
GET /reporting/analytics/performance?metric=sales&period=month&branchId=branch-1
```

*ملاحظة: التحليلات المتقدمة جاهزة للتطبيق وسيتم إضافتها في المرحلة التالية*

### أذونات الوصول

- `reporting.sales.read` - قراءة تقارير المبيعات
- `reporting.inventory.read` - قراءة تقارير المخزون
- `reporting.financial.read` - قراءة التقارير المالية
- `reporting.dashboard.read` - قراءة لوحات المؤشرات
- `reporting.export` - تصدير التقارير
- `reporting.scheduled` - التقارير المجدولة
- `reporting.custom` - التقارير المخصصة
- `reporting.analytics` - التحليلات المتقدمة

### نظام الكاش الذكي

#### أوقات الكاش حسب نوع التقرير:
- تقارير المبيعات: 10 دقائق
- تقارير المخزون: 5 دقائق
- بيانات لوحة المؤشرات: 5 دقائق
- التقارير المالية: 30 دقيقة
- إحصائيات المحاسبة: 15 دقيقة

### اختبار النظام

```bash
# تشغيل اختبار وحدة التقارير
npm run reporting:test
```

## ملخص المشروع حتى المرحلة 16

### الوحدات المكتملة (16 وحدة):
1. ✅ البنية الأساسية (Infrastructure)
2. ✅ نظام المصادقة (Authentication)
3. ✅ إدارة الأدوار والصلاحيات (RBAC)
4. ✅ إدارة الفروع والمخازن (Branches & Warehouses)
5. ✅ إدارة المنتجات (Product Management)
6. ✅ نظام المخزون (Inventory System)
7. ✅ وحدة المبيعات (Sales Module)
8. ✅ وحدة المرتجعات (Returns Module)
9. ✅ وحدة المشتريات (Purchasing Module)
10. ✅ إدارة العملاء (Customer Management)
11. ✅ النظام المحاسبي الأساسي (Basic Accounting)
12. ✅ وحدة التقارير (Reporting Module)
13. ✅ نظام الدفع (Payment System)

### الإنجازات الرئيسية:
- **16 مرحلة مكتملة** من أصل 28 مرحلة مخططة
- **تغطية شاملة** لجميع عمليات الأعمال الأساسية
- **نظام محاسبي متكامل** مع التوازن المزدوج
- **تقارير متقدمة** مع لوحات مؤشرات تفاعلية
- **أمان متقدم** مع RBAC شامل
- **أداء عالي** مع نظام كاش ذكي
- **تكامل كامل** بين جميع الوحدات
- **API موحدة** مع validation شامل
- **قاعدة بيانات محسنة** مع فهارس وعلاقات
- **معالجة أخطاء متقدمة** مع logging شامل
- **اختبارات شاملة** لجميع الوحدات
- **توثيق كامل** مع أمثلة عملية

## 18. نظام المزامنة (Sync System)

### نظرة عامة
نظام شامل للمزامنة يدعم العمل في وضع عدم الاتصال مع كشف وحل التعارضات.

### المكونات الأساسية

#### 1. SyncService - خدمة المزامنة الرئيسية
```typescript
@Injectable()
export class SyncService {
  async createSyncBatch() // إنشاء دفعة مزامنة
  async processSyncBatch() // معالجة دفعة المزامنة
  async resolveConflict() // حل تعارض المزامنة
  async getSyncData() // جلب البيانات للمزامنة
  async getSyncStats() // إحصائيات المزامنة
}
```

#### 2. OfflineService - خدمة وضع offline
```typescript
@Injectable()
export class OfflineService {
  async createOfflineSession() // إنشاء جلسة offline
  async validateOfflineSession() // التحقق من صحة الجلسة
  async createOfflineDataPackage() // إنشاء حزمة البيانات
  async saveOfflineChanges() // حفظ التغييرات من وضع offline
}
```

#### 3. SyncController - متحكم المزامنة
```typescript
@Controller('sync')
export class SyncController {
  @Post('upload') // رفع البيانات للمزامنة
  @Get('download') // تحميل البيانات للمزامنة
  @Post('bidirectional') // مزامنة ثنائية الاتجاه
  @Put('batch/:batchId/conflict/:conflictId') // حل تعارض
}
```

### نماذج قاعدة البيانات

#### SyncBatch - دفعات المزامنة
```prisma
model SyncBatch {
  id              String   @id @default(cuid())
  batchId         String   @unique
  deviceId        String
  syncType        String   // full, incremental, changes_only
  direction       String   // upload, download, bidirectional
  status          String   @default("pending")
  changes         Json?
  conflicts       Json?
  totalRecords    Int      @default(0)
  processedRecords Int     @default(0)
  failedRecords   Int      @default(0)
  conflictedRecords Int    @default(0)
  createdAt       DateTime @default(now())
}
```

### APIs المتاحة

#### مزامنة البيانات
```bash
# رفع البيانات للمزامنة
POST /sync/upload
Authorization: Bearer <token>
Content-Type: application/json

{
  "deviceId": "device_123",
  "syncType": "incremental",
  "changes": [
    {
      "id": "change_1",
      "entity": "Product",
      "operation": "create",
      "data": { "name": "منتج جديد" },
      "timestamp": "2025-01-01T12:00:00Z"
    }
  ]
}

# تحميل البيانات للمزامنة
GET /sync/download?deviceId=device_123&lastSyncTime=2025-01-01T10:00:00Z

# مزامنة ثنائية الاتجاه
POST /sync/bidirectional
```

#### حل التعارضات
```bash
# حل تعارض محدد
PUT /sync/batch/sync_device_123_1234567890/conflict/conflict_1
Authorization: Bearer <token>
Content-Type: application/json

{
  "resolution": "local",
  "resolvedData": { "name": "الاسم المحلول" }
}
```

#### إحصائيات المزامنة
```bash
# إحصائيات عامة
GET /sync/stats

# إحصائيات فرع محدد
GET /sync/stats?branchId=branch_123
```

#### وضع Offline
```bash
# إنشاء جلسة offline
POST /sync/offline/session
Authorization: Bearer <token>
Content-Type: application/json

{
  "deviceId": "device_123",
  "userId": "user_456",
  "capabilities": ["read", "write", "sync"]
}

# جلب حزمة البيانات
GET /sync/offline/package/offline_device_123_1234567890

# حفظ التغييرات من وضع offline
POST /sync/offline/changes/offline_device_123_1234567890
Authorization: Bearer <token>
Content-Type: application/json

{
  "changes": [
    {
      "entity": "Product",
      "operation": "create",
      "data": { "name": "منتج offline" },
      "localId": "local_123"
    }
  ]
}
```

### أنواع المزامنة المدعومة

#### 1. Incremental Sync - مزامنة تدريجية
- تزامن التغييرات فقط من وقت محدد
- مثال: `lastSyncTime=2025-01-01T10:00:00Z`

#### 2. Full Sync - مزامنة كاملة
- تزامن جميع البيانات
- مناسب للأجهزة الجديدة

#### 3. Changes Only - تغييرات محددة
- تزامن كيانات محددة فقط
- مثال: `entities=Product,Customer`

#### 4. Bidirectional - مزامنة ثنائية
- رفع وتحميل البيانات معاً
- مثال للتطبيقات المتصلة

### كشف وحل التعارضات

#### أنواع التعارضات
- **Version Conflict**: اختلاف في الإصدارات
- **Data Conflict**: تعارض في البيانات
- **Deleted Conflict**: الكيان محذوف

#### استراتيجيات الحل
- **Local Wins**: استخدام البيانات المحلية
- **Remote Wins**: استخدام البيانات البعيدة
- **Merge**: دمج البيانات المتوافقة
- **Manual**: حل يدوي من قبل المستخدم

### إحصائيات شاملة

```typescript
interface SyncStats {
  totalBatches: number;
  pendingBatches: number;
  processingBatches: number;
  completedBatches: number;
  failedBatches: number;
  conflictedBatches: number;
  totalRecords: number;
  syncedRecords: number;
  failedRecords: number;
  conflictedRecords: number;
  lastSyncTime?: Date;
  averageSyncTime: number;
}
```

### وضع Offline الكامل

#### مميزات وضع Offline
- **جلسات زمنية**: مهلة 24 ساعة للجلسات
- **حزم بيانات ذكية**: تحميل البيانات المطلوبة فقط
- **قوائم انتظار**: حفظ التغييرات محلياً
- **مزامنة تلقائية**: عند عودة الاتصال
- **إدارة الأجهزة**: تتبع جميع الأجهزة المتصلة

#### سيناريوهات الاستخدام
1. **الصراف في الفرع**: يعمل بدون اتصال
2. **المدير المتنقل**: يحمل البيانات للمراجعة
3. **المزامنة التلقائية**: تزامن دورية بين الفروع

### الأمان والأذونات

#### أذونات المزامنة
- `sync.upload` - رفع البيانات للمزامنة
- `sync.download` - تحميل البيانات للمزامنة
- `sync.bidirectional` - المزامنة الثنائية
- `sync.resolve` - حل تعارضات المزامنة
- `sync.retry` - إعادة محاولة الدفعات الفاشلة
- `sync.read` - قراءة إحصائيات المزامنة
- `sync.offline` - استخدام وضع offline
- `sync.admin` - إدارة إعدادات المزامنة

### اختبار النظام

```bash
# تشغيل اختبارات المزامنة
npm run sync:test

# الاختبارات تشمل:
# - إنشاء ومعالجة دفعات المزامنة
# - كشف وحل التعارضات
# - وضع offline الكامل
# - إحصائيات النظام
# - تنظيف البيانات القديمة
```

### الأداء والتحسينات

#### تحسينات الأداء
- **كاش ذكي**: تخزين البيانات المؤقتة
- **معاملات قاعدة البيانات**: ضمان الاتساق
- **فهرسة شاملة**: بحث سريع
- **معالجة غير متزامنة**: قوائم انتظار
- **ضغط البيانات**: تقليل حجم النقل

#### مراقبة الأداء
- **معدل النجاح**: نسبة الدفعات الناجحة
- **وقت المعالجة**: متوسط وقت المزامنة
- **حجم البيانات**: كمية البيانات المنقولة
- **عدد التعارضات**: معدل التعارضات

### التكامل مع النظام

#### تكامل مع Audit System
```typescript
// تسجيل جميع عمليات المزامنة
await this.auditService.log({
  action: 'SYNC_UPLOAD',
  entity: 'SyncBatch',
  entityId: batchId,
  details: { changes: changes.length },
  module: 'sync'
});
```

#### تكامل مع Cache System
```typescript
// تخزين إحصائيات المزامنة مؤقتاً
await this.cacheService.set(`sync_stats:${branchId}`, stats, { ttl: 300 });
```

### نصائح الاستخدام

#### للمطورين
1. **اختبار شامل**: اختبر جميع سيناريوهات المزامنة
2. **معالجة الأخطاء**: تعامل مع انقطاع الاتصال
3. **تحسين الأداء**: استخدم الكاش والفهرسة
4. **الأمان أولاً**: تحقق من الأذونات دائماً

#### للمستخدمين
1. **مزامنة دورية**: مزامنة منتظمة للبيانات
2. **حل التعارضات**: مراجعة التعارضات فوراً
3. **وضع offline**: استخدم عند انقطاع الاتصال
4. **مراقبة الحالة**: تابع إحصائيات المزامنة

## 19. نظام الدفع (Payment System)

### نظرة عامة
نظام دفع شامل وآمن يدعم بوابات الدفع المختلفة مع معالجة متقدمة للاستردادات والتسوية.

### المكونات الأساسية

#### 1. PaymentService - خدمة الدفع الرئيسية
```typescript
@Injectable()
export class PaymentService {
  async processPayment() // معالجة دفعة جديدة
  async processRefund() // معالجة استرداد
  async processWebhook() // معالجة webhook من البوابة
  async getPaymentStats() // إحصائيات الدفع
  async reconcileTransactions() // تسوية المعاملات
}
```

#### 2. PaymentAdapterFactory - مصنع البوابات
```typescript
@Injectable()
export class PaymentAdapterFactory {
  getAdapter(gateway: PaymentGateway): BasePaymentAdapter
  isGatewayAvailable(gateway: PaymentGateway): boolean
  getAvailableGateways(): PaymentGateway[]
  getGatewayInfo(gateway: PaymentGateway)
}
```

#### 3. PaymentSecurityService - خدمة الأمان
```typescript
@Injectable()
export class PaymentSecurityService {
  encryptCardData() // تشفير بيانات البطاقة
  createCardToken() // إنشاء token للبطاقة
  validateCardNumber() // التحقق من رقم البطاقة
  validateCVV() // التحقق من CVV
  createHMAC() // إنشاء HMAC للتحقق
}
```

#### 4. RefundService - خدمة الاسترداد
```typescript
@Injectable()
export class RefundService {
  async processRefund() // معالجة استرداد
  getRefundPolicy() // سياسة الاسترداد
  async getRefundStats() // إحصائيات الاسترداد
  async getRefundReport() // تقرير الاستردادات
}
```

#### 5. ReconciliationService - خدمة التسوية
```typescript
@Injectable()
export class ReconciliationService {
  async reconcileTransactions() // تسوية المعاملات
  async resolveDiscrepancy() // حل اختلاف
  async getReconciliationStats() // إحصائيات التسوية
}
```

### البوابات المدعومة

#### 1. **Stripe** - بوابة عالمية
- دعم جميع أنواع البطاقات
- 3D Secure
- Recurring payments
- Apple Pay / Google Pay

#### 2. **PayPal** - بوابة شهيرة
- حسابات مصرفية
- Express Checkout
- Subscriptions
- International payments

#### 3. **Tap** - بوابة الشرق الأوسط
- دعم العملات المحلية
- QR codes
- Mobile wallets
- Local payment methods

#### 4. **Local** - المدفوعات المحلية
- نقدي
- شيكات
- تحويلات بنكية
- Offline processing

### APIs المتاحة

#### معالجة الدفع
```bash
# معالجة دفعة جديدة
POST /payment/process
Authorization: Bearer <token>
Content-Type: application/json

{
  "invoiceId": "inv_123",
  "invoiceType": "sales",
  "amount": 299.99,
  "currency": "SAR",
  "gateway": "stripe",
  "method": "card",
  "description": "دفع فاتورة رقم 123"
}

# معالجة استرداد
POST /payment/refund
Authorization: Bearer <token>
Content-Type: application/json

{
  "transactionId": "txn_stripe_123",
  "amount": 50.00,
  "reason": "customer_request"
}
```

#### إدارة البوابات
```bash
# قائمة البوابات المتاحة
GET /payment/gateways

# معلومات بوابة محددة
GET /payment/gateways/stripe

# التحقق من دعم العملة
GET /payment/gateways/stripe/currency/SAR

# البوابات المتاحة لعملة
GET /payment/gateways/currency/SAR
```

#### الميزات المتقدمة
```bash
# إنشاء رابط دفع
POST /payment/create-link

# إنشاء QR code
POST /payment/create-qr

# تسوية المعاملات
POST /payment/reconcile
```

#### Webhook Endpoints
```bash
# Stripe webhook
POST /payment/webhooks/stripe

# PayPal webhook
POST /payment/webhooks/paypal

# Tap webhook
POST /payment/webhooks/tap

# Webhook عام
POST /payment/webhooks/:gateway
```

### الأمان والتشفير

#### تشفير البيانات الحساسة
```typescript
// تشفير بيانات البطاقة
const encrypted = await securityService.encryptCardData(cardData);

// فك التشفير
const decrypted = await securityService.decryptCardData(encrypted);
```

#### Tokenization
```typescript
// إنشاء token للبطاقة
const token = await securityService.createCardToken(cardData);
// العودة: { token, last4, brand, fingerprint }
```

#### التحقق من البيانات
```typescript
// التحقق من رقم البطاقة (Luhn)
const isValid = securityService.validateCardNumber('4111111111111111');

// التحقق من تاريخ الانتهاء
const isValidExpiry = securityService.validateExpiryDate('12', '2025');

// التحقق من CVV
const isValidCVV = securityService.validateCVV('123', '4111111111111111');
```

### نظام الاسترداد المتقدم

#### سياسة الاسترداد
```typescript
const policy = refundService.getRefundPolicy();
// {
//   maxRefundDays: 30,
//   allowPartialRefunds: true,
//   requireApproval: false,
//   supportedReasons: ['customer_request', 'defective_product', ...]
// }
```

#### معالجة الاسترداد
```typescript
const refundResult = await refundService.processRefund({
  transactionId: 'txn_123',
  amount: 50.00,
  reason: 'customer_request',
  userId: 'user_456'
});
```

### نظام التسوية

#### تسوية المعاملات
```typescript
const result = await reconciliationService.reconcileTransactions({
  gateway: 'stripe',
  startDate: new Date('2025-01-01'),
  endDate: new Date(),
  branchId: 'branch_123'
});

// العودة: { matched, unmatchedSystem, unmatchedGateway, discrepancies }
```

#### حل الاختلافات
```typescript
await reconciliationService.resolveDiscrepancy(
  'discrepancy_123',
  {
    action: 'accept',
    notes: 'تم التحقق من المعاملة',
  },
  'user_456'
);
```

### إحصائيات شاملة

#### إحصائيات الدفع
```typescript
const stats = await paymentService.getPaymentStats();
// {
//   totalTransactions: 1250,
//   successfulTransactions: 1180,
//   totalAmount: 250000,
//   gatewayStats: { stripe: {...}, paypal: {...} }
// }
```

#### إحصائيات الاسترداد
```typescript
const refundStats = await refundService.getRefundStats();
// {
//   totalRefunds: 45,
//   totalRefundAmount: 12500,
//   successfulRefunds: 42,
//   refundRate: 5.0,
//   commonReasons: { customer_request: 25, defective_product: 12 }
// }
```

### اختبار النظام

```bash
# تشغيل اختبارات الدفع
npm run payment:test

# الاختبارات تشمل:
# - معالجة المدفوعات عبر جميع البوابات
# - الاستردادات والتسوية
# - الأمان والتشفير
# - معالجة webhooks
# - التقارير والإحصائيات
# - معالجة الأخطاء
```

### متغيرات البيئة المطلوبة

```bash
# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# PayPal
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...
PAYPAL_ENVIRONMENT=sandbox

# Tap
TAP_API_KEY=...
TAP_WEBHOOK_SECRET=...

# الأمان
PAYMENT_ENCRYPTION_KEY=your_32_character_encryption_key
```

## المراحل المنجزة

### ✅ المرحلة 19: تكامل بوابات الدفع (Payment Gateway Integration)
تم تنفيذ نظام شامل للتكامل مع بوابات الدفع الرئيسية (Stripe, PayPal, Tap, Local) مع دعم المعاملات الآمنة، الاسترداد، والتسوية.

### ✅ المرحلة 20: نظام الإشعارات (Notification System)
تم تنفيذ نظام إشعارات شامل يدعم عدة قنوات (Email, SMS, WhatsApp, Push, In-App) مع نظام قوالب متقدم وتفضيلات مستخدمين ذكية.

### ✅ المرحلة 21: نظام التخزين (Storage System)
تم تنفيذ نظام تخزين شامل يدعم رفع الملفات، التحسين التلقائي للصور، إنشاء الصور المصغرة، والتحكم في الوصول مع دعم S3 وتخزين محلي.

### ✅ المرحلة 22: نظام المراقبة (Monitoring System)
تم تنفيذ نظام مراقبة شامل يشمل OpenTelemetry، Prometheus metrics، Health checks، Sentry لتتبع الأخطاء، نظام سجلات محسن، ولوحات تحكم تفاعلية.

### المراحل المتبقية (5 مراحل):
23. نظام النسخ الاحتياطي (Backup System)
24. تحسينات الأمان (Security Enhancements)
25. تحسينات الأداء (Performance Optimization)
26. كتابة الاختبارات (Testing)
27. الإعداد للنشر (Deployment Preparation)
28. النشر والمراقبة (Deployment & Monitoring)

### جاهزية الإنتاج:
- ✅ جميع APIs تعمل بكفاءة
- ✅ قاعدة البيانات محسنة ومُفهرسة
- ✅ نظام الكاش فعال
- ✅ معالجة الأخطاء شاملة
- ✅ أذونات أمان محكمة
- ✅ معاملات قاعدة البيانات للسلامة
- ✅ اختبارات شاملة
- ✅ توثيق كامل

### نظام الإشعارات (Notification System)

#### نظرة عامة
نظام إشعارات شامل يدعم إرسال الرسائل عبر قنوات متعددة مع نظام قوالب متقدم وتفضيلات مستخدمين ذكية.

#### القنوات المدعومة
- **Email**: إيميل بقوالب HTML ومتغيرات ديناميكية
- **SMS**: رسائل نصية قصيرة مع دعم Unicode
- **WhatsApp**: رسائل تفاعلية مع أزرار وقوائم
- **Push Notifications**: إشعارات دفع للتطبيقات المحمولة
- **In-App Notifications**: إشعارات داخل التطبيق

#### المزودون المدعمون

**Email Providers:**
- SendGrid (توصية للإنتاج)
- Mailgun
- AWS SES
- SMTP Server

**SMS Providers:**
- Twilio (توصية للإنتاج)
- AWS SNS
- MessageBird
- Nexmo (Vonage)

**WhatsApp Providers:**
- WhatsApp Business API (توصية للإنتاج)
- 360Dialog
- Twilio WhatsApp

#### APIs الرئيسية

```typescript
// إرسال إشعار فوري
POST /notifications/send
{
  "title": "فاتورة جديدة",
  "message": "تم إنشاء فاتورة رقم INV-001",
  "type": "email",
  "recipientId": "customer_123",
  "recipientType": "customer",
  "recipientEmail": "customer@example.com"
}

// إرسال باستخدام قالب
POST /notifications/send-template/invoice_created
{
  "recipientId": "customer_123",
  "recipientType": "customer",
  "variables": {
    "invoice_number": "INV-001",
    "customer_name": "أحمد محمد",
    "amount": "299.99"
  }
}

// إرسال جماعي
POST /notifications/send-bulk
{
  "notifications": [
    {
      "title": "تنبيه عام",
      "message": "تحديث مهم في النظام",
      "type": "sms",
      "recipientId": "user_123",
      "recipientType": "user"
    }
  ]
}
```

#### نظام القوالب

```typescript
// إنشاء قالب
POST /notifications/templates
{
  "name": "invoice_created_email",
  "type": "email",
  "subject": "فاتورة جديدة رقم ${invoice_number}",
  "content": "مرحباً ${customer_name}، تم إنشاء فاتورة جديدة بقيمة ${amount} ريال",
  "htmlContent": "<p>مرحباً <strong>${customer_name}</strong>...</p>",
  "event": "sale_created",
  "module": "sales",
  "variables": {
    "invoice_number": "string",
    "customer_name": "string",
    "amount": "number"
  }
}

// البحث في القوالب
GET /notifications/templates?type=email&event=sale_created

// معاينة قالب
POST /notifications/templates/template_123/preview
{
  "variables": {
    "invoice_number": "INV-001",
    "customer_name": "أحمد محمد",
    "amount": "299.99"
  }
}
```

#### تفضيلات المستخدمين

```typescript
// الحصول على تفضيلات المستخدم
GET /notifications/preferences/user_123

// تحديث التفضيلات
PUT /notifications/preferences/user_123
{
  "preferences": [
    {
      "notificationType": "email",
      "event": "sale_created",
      "enabled": true,
      "frequency": "immediate"
    },
    {
      "notificationType": "sms",
      "event": "payment_failed",
      "enabled": false,
      "quietHoursStart": "22:00",
      "quietHoursEnd": "08:00"
    }
  ]
}

// إعادة تعيين للافتراضية
POST /notifications/preferences/user_123/reset
```

#### إحصائيات النظام

```typescript
// إحصائيات الإشعارات
GET /notifications/stats
// {
//   "totalNotifications": 1250,
//   "sentNotifications": 1180,
//   "failedNotifications": 15,
//   "pendingNotifications": 55,
//   "deliveryRate": 94.4,
//   "notificationsByType": { "email": 800, "sms": 350, "whatsapp": 100 },
//   "notificationsByModule": { "sales": 600, "inventory": 400, "customer": 250 }
// }

// إحصائيات التفضيلات
GET /notifications/preferences/stats
// {
//   "totalUsers": 150,
//   "usersWithCustomPreferences": 45,
//   "mostPopularPreferences": [...],
//   "quietHoursUsage": 30
// }
```

#### معالجة الطوابير

```typescript
// معلومات الطابور
GET /notifications/queue/stats
// {
//   "totalJobs": 250,
//   "queuedJobs": 45,
//   "processingJobs": 5,
//   "completedJobs": 195,
//   "failedJobs": 5,
//   "averageProcessingTime": 1250
// }

// إعادة تشغيل الطابور
POST /notifications/queue/restart

// تنظيف المهام القديمة
DELETE /notifications/queue/cleanup?daysOld=30
```

#### الأحداث المتاحة

```typescript
// قائمة الأحداث
GET /notifications/events

// أحداث المبيعات
[
  { "event": "sale_created", "module": "sales", "description": "إنشاء فاتورة مبيعات" },
  { "event": "payment_received", "module": "sales", "description": "استلام دفعة" },
  { "event": "payment_failed", "module": "sales", "description": "فشل في الدفع" }
]

// أحداث المخزون
[
  { "event": "stock_low", "module": "inventory", "description": "مخزون منخفض" },
  { "event": "stock_out", "module": "inventory", "description": "نفاد المخزون" }
]

// أحداث العملاء
[
  { "event": "customer_birthday", "module": "customer", "description": "عيد ميلاد العميل" },
  { "event": "loyalty_tier_upgraded", "module": "customer", "description": "ترقية درجة الولاء" }
]
```

#### متغيرات البيئة

```bash
# Email Configuration
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=SG.YourApiKeyHere
EMAIL_FROM_EMAIL=noreply@zaytuna.com
EMAIL_FROM_NAME=نظام زيتونة

# SMS Configuration
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
SMS_FROM_NUMBER=+966500000000

# WhatsApp Configuration
WHATSAPP_PROVIDER=whatsapp_business
WHATSAPP_ACCESS_TOKEN=your_access_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id

# Queue Configuration
NOTIFICATION_QUEUE_MAX_CONCURRENT=10
NOTIFICATION_QUEUE_PROCESSING_INTERVAL=5000
NOTIFICATION_RETRY_ATTEMPTS=3
NOTIFICATION_RETRY_BACKOFF_BASE=60
```

#### اختبار النظام

```bash
# تشغيل اختبارات الإشعارات
npm run notification:test

# اختبار إرسال إشعار
POST /notifications/test
{
  "type": "email",
  "recipient": "test@example.com",
  "message": "رسالة اختبار"
}
```

#### المميزات المتقدمة

- **معالجة طوابير ذكية**: معالجة غير متزامنة مع إعادة المحاولة التلقائية
- **قوالب ديناميكية**: دعم متغيرات مخصصة وشروط منطقية
- **تفضيلات مستخدمين**: تحكم كامل للمستخدمين في الإشعارات المستلمة
- **جدولة زمنية**: إمكانية جدولة الإشعارات لوقت لاحق
- **تتبع شامل**: تسجيل كامل لعمليات الإرسال والتسليم
- **دعم متعدد اللغات**: قوالب مترجمة ومحلية
- **إحصائيات متقدمة**: تحليلات مفصلة لمعدلات التسليم والأداء

#### أمثلة عملية

```typescript
// إشعار فاتورة جديدة
await notificationService.sendTemplatedNotification(
  'sale_invoice_created_email',
  {
    invoice_number: 'INV-001',
    customer_name: 'أحمد محمد',
    amount: '299.99',
    invoice_date: '2025-01-11'
  },
  'customer_123',
  'customer'
);

// إشعار مخزون منخفض
await notificationService.sendNotification({
  title: 'تنبيه: مخزون منخفض',
  message: `المخزون من ${productName} أصبح ${currentStock} قطعة فقط`,
  type: 'push',
  recipientId: 'manager_123',
  recipientType: 'user',
  priority: 'urgent',
  module: 'inventory',
  event: 'stock_low'
});

// إشعار عيد ميلاد
await notificationService.sendNotification({
  title: '🎉 كل عام وأنت بخير!',
  message: `عيد ميلاد سعيد ${customerName}! شكراً لثقتك بنا 🎂`,
  type: 'whatsapp',
  recipientId: 'customer_456',
  recipientType: 'customer',
  priority: 'normal',
  module: 'customer',
  event: 'customer_birthday'
});
```

## نظام التخزين (Storage System)

### نظرة عامة
نظام تخزين شامل يدعم رفع الملفات، التحسين التلقائي للصور، إنشاء الصور المصغرة، والتحكم في الوصول مع دعم S3 وتخزين محلي.

### المكونات الأساسية

#### 1. رفع الملفات (File Upload)
- **تحميل متعدد الأجزاء**: دعم رفع الملفات الكبيرة بكفاءة
- **تحقق من النوع**: التحقق من أنواع الملفات المسموحة
- **تحقق من الحجم**: حدود حجم الملفات القابلة للتكوين
- **معالجة الأخطاء**: معالجة شاملة لأخطاء الرفع

#### 2. تحسين الصور (Image Optimization)
- **ضغط تلقائي**: تقليل حجم الصور دون فقدان الجودة
- **تغيير الحجم**: تحجيم الصور للاستخدام الأمثل
- **تحويل التنسيق**: تحويل إلى WebP أو AVIF للأداء الأفضل
- **إنشاء الصور المصغرة**: صور مصغرة متعددة الأحجام

#### 3. التحكم في الوصول (Access Control)
- **رموز الوصول**: رموز مؤقتة للوصول المحدود
- **قواعد الوصول**: قواعد مرنة بناءً على المستخدم أو الدور
- **الروابط العامة**: روابط مشاركة آمنة مع حدود زمنية
- **تسجيل الوصول**: تتبع شامل لمحاولات الوصول

#### 4. موفري التخزين (Storage Providers)
- **S3**: دعم Amazon S3 ومكافئاته (MinIO, DigitalOcean Spaces)
- **تخزين محلي**: تخزين على النظام الملفي المحلي
- **CDN**: دعم شبكات توزيع المحتوى

### APIs الرئيسية

#### رفع الملفات
```typescript
// رفع ملف واحد
POST /storage/upload
Content-Type: multipart/form-data
Authorization: Bearer <token>

FormData:
- file: <file>
- category: "product_images"
- entityType: "product"
- entityId: "prod_123"
- isPublic: false
- bucket: "main-bucket"

// الاستجابة
{
  "id": "file_123",
  "filename": "product.jpg",
  "mimeType": "image/jpeg",
  "size": 245760,
  "url": "/storage/files/file_123/download",
  "thumbnailUrl": "/storage/files/file_123/thumbnail",
  "uploadedBy": "user_456",
  "createdAt": "2025-01-11T10:00:00Z"
}

// رفع ملفات متعددة
POST /storage/upload/multiple
Content-Type: multipart/form-data

FormData:
- files: [<file1>, <file2>, <file3>]
- category: "gallery"
- entityType: "product"
- entityId: "prod_123"
```

#### تحميل وعرض الملفات
```typescript
// تحميل ملف
GET /storage/files/{fileId}/download?userId=user_123&accessToken=abc123
// يرجع الملف مع headers مناسبة للتحميل

// عرض ملف (inline)
GET /storage/files/{fileId}/view?userId=user_123&accessToken=abc123
// يرجع الملف مع headers للعرض في المتصفح

// عرض الصورة المصغرة
GET /storage/files/{fileId}/thumbnail?userId=user_123&accessToken=abc123
// يرجع الصورة المصغرة أو الصورة الأصلية إذا لم تكن موجودة
```

#### إدارة الملفات
```typescript
// معلومات الملف
GET /storage/files/{fileId}?userId=user_123
{
  "id": "file_123",
  "filename": "product.jpg",
  "originalName": "my-product-image.jpg",
  "mimeType": "image/jpeg",
  "size": 245760,
  "path": "/uploads/main-bucket/2025/01/file_123.jpg",
  "url": "/storage/files/file_123/download",
  "thumbnailUrl": "/storage/files/file_123/thumbnail",
  "bucket": "main-bucket",
  "category": "product_images",
  "entityType": "product",
  "entityId": "prod_123",
  "isPublic": false,
  "metadata": {
    "width": 1920,
    "height": 1080,
    "optimized": true,
    "compressionRatio": 35.5
  },
  "uploadedBy": "user_456",
  "branchId": "branch_789",
  "createdAt": "2025-01-11T10:00:00Z",
  "updatedAt": "2025-01-11T10:05:00Z"
}

// البحث في الملفات
GET /storage/files?category=product_images&entityType=product&entityId=prod_123&userId=user_123
{
  "files": [...],
  "total": 25,
  "page": 1,
  "limit": 10,
  "totalPages": 3
}

// حذف ملف
DELETE /storage/files/{fileId}?userId=user_123
{
  "message": "تم حذف الملف بنجاح"
}
```

#### تحسين الصور
```typescript
// تحسين صورة وحفظها
POST /storage/files/{fileId}/optimize?userId=user_123
{
  "quality": 85,
  "format": "webp",
  "maxWidth": 1920,
  "maxHeight": 1080
}
// الاستجابة: نتيجة التحسين مع نسبة الضغط

// إنشاء صور مصغرة
POST /storage/files/{fileId}/thumbnails?userId=user_123
{
  "sizes": [
    { "width": 150, "height": 150, "suffix": "sm" },
    { "width": 300, "height": 300, "suffix": "md" },
    { "width": 600, "height": 600, "suffix": "lg" }
  ]
}
{
  "fileId": "file_123",
  "thumbnails": [
    {
      "size": "sm",
      "path": "/uploads/thumbnails/main-bucket/file_123_sm.jpg",
      "success": true
    }
  ],
  "message": "تم إنشاء الصور المصغرة بنجاح"
}

// تحويل تنسيق الصورة
POST /storage/files/{fileId}/convert?userId=user_123
{
  "targetFormat": "webp",
  "quality": 80
}
{
  "fileId": "file_123",
  "conversion": {
    "success": true,
    "originalSize": 245760,
    "optimizedSize": 184320,
    "compressionRatio": 25.0,
    "outputPath": "/uploads/optimized/main-bucket/converted_file_123.webp"
  }
}

// تحسين تلقائي
POST /storage/files/{fileId}/auto-optimize?userId=user_123
{
  "aggressive": false
}
{
  "fileId": "file_123",
  "autoOptimization": {
    "optimizations": ["تقليل الجودة إلى 85%", "تحويل إلى WebP"],
    "totalCompression": 45.5,
    "results": [...]
  }
}

// metadata الصورة
GET /storage/files/{fileId}/metadata?userId=user_123
{
  "fileId": "file_123",
  "metadata": {
    "width": 1920,
    "height": 1080,
    "format": "jpeg",
    "size": 245760,
    "colorSpace": "srgb",
    "hasAlpha": false,
    "density": 72
  }
}
```

#### التحكم في الوصول
```typescript
// إنشاء رابط وصول مؤقت
POST /storage/files/{fileId}/access-token?userId=user_123
{
  "expiresInMinutes": 60,
  "maxDownloads": 5
}
{
  "fileId": "file_123",
  "accessToken": "abc123def456...",
  "expiresIn": 60,
  "maxDownloads": 5,
  "message": "تم إنشاء رابط الوصول المؤقت بنجاح"
}

// إنشاء رابط عام
POST /storage/files/{fileId}/public-link?userId=user_123
{
  "expiresInMinutes": 1440, // 24 ساعة
  "maxDownloads": 10
}
{
  "fileId": "file_123",
  "publicLink": "http://localhost:3000/api/storage/files/file_123/download?token=abc123...",
  "expiresIn": 1440,
  "maxDownloads": 10
}

// إبطال جميع رموز الوصول
DELETE /storage/files/{fileId}/access-tokens?userId=user_123
{
  "fileId": "file_123",
  "revokedTokens": 3,
  "message": "تم إبطال جميع رموز الوصول بنجاح"
}

// إحصائيات الوصول
GET /storage/files/{fileId}/access-stats?userId=user_123
{
  "totalAccess": 15,
  "uniqueUsers": 8,
  "recentAccess": [
    {
      "accessedBy": "user_456",
      "accessType": "token",
      "accessedAt": "2025-01-11T10:30:00Z",
      "ipAddress": "192.168.1.100"
    }
  ],
  "accessByType": {
    "direct": 5,
    "token": 8,
    "rule": 2
  }
}
```

#### إحصائيات التخزين
```typescript
// إحصائيات عامة
GET /storage/stats?branchId=branch_123
{
  "totalFiles": 1250,
  "totalSize": 524288000, // 500MB
  "totalSizeFormatted": "500 MB",
  "filesByCategory": {
    "product_images": 450,
    "user_avatars": 150,
    "documents": 300,
    "invoices": 200,
    "receipts": 150
  },
  "filesByType": {
    "image/jpeg": 600,
    "image/png": 200,
    "application/pdf": 300,
    "text/plain": 50,
    "application/msword": 100
  },
  "storageByBucket": {
    "main-bucket": 524288000,
    "archive-bucket": 104857600
  },
  "recentUploads": 45,
  "averageFileSize": 419430, // ~400KB
  "largestFile": {
    "id": "file_789",
    "filename": "large-video.mp4",
    "size": 104857600 // 100MB
  }
}

// تقارير الملفات
GET /storage/reports/files?startDate=2025-01-01&endDate=2025-01-11&category=product_images
{
  "report": "files_report",
  "filters": {
    "startDate": "2025-01-01",
    "endDate": "2025-01-11",
    "category": "product_images"
  },
  "summary": {
    "totalFiles": 150,
    "totalSize": 78643200,
    "averageSize": 524288,
    "filesUploaded": 45,
    "filesDownloaded": 1200,
    "popularFiles": [...]
  },
  "chartData": {
    "uploadsByDay": [...],
    "downloadsByDay": [...],
    "filesBySize": [...]
  }
}
```

### أذونات RBAC
- `storage.upload`: رفع الملفات
- `storage.download`: تحميل الملفات
- `storage.view`: عرض الملفات
- `storage.edit`: تعديل الملفات (تحسين، تحويل، إلخ)
- `storage.delete`: حذف الملفات
- `storage.share`: مشاركة الملفات
- `storage.admin`: إدارة النظام (تنظيف، إحصائيات، إلخ)

### متغيرات البيئة
```bash
# إعدادات عامة
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760  # 10MB
ALLOWED_MIME_TYPES=image/jpeg,image/png,image/webp,application/pdf
ALLOWED_EXTENSIONS=jpg,jpeg,png,webp,pdf,doc,docx

# S3 Configuration
STORAGE_PROVIDER=s3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
S3_BUCKET_NAME=zaytuna-storage
S3_BASE_PATH=uploads/

# Local Storage (افتراضي)
STORAGE_PROVIDER=local
LOCAL_STORAGE_PATH=./uploads

# Image Optimization
IMAGE_OPTIMIZATION_ENABLED=true
IMAGE_QUALITY_DEFAULT=85
IMAGE_MAX_WIDTH=1920
IMAGE_MAX_HEIGHT=1080
THUMBNAIL_SIZES=150x150,300x300,600x600
AUTO_OPTIMIZE_IMAGES=true

# Access Control
ACCESS_TOKEN_EXPIRY_MINUTES=60
MAX_DOWNLOADS_PER_TOKEN=10
ENABLE_PUBLIC_LINKS=true
PUBLIC_LINK_EXPIRY_HOURS=24

# Cache Configuration
STORAGE_CACHE_TTL=3600  # 1 hour
ENABLE_FILE_CACHING=true
CACHE_THUMBNAILS=true
```

### اختبار النظام
```bash
# تشغيل اختبارات التخزين
npm run storage:test

# الاختبارات تشمل:
# - رفع الملفات وحفظها
# - تحسين الصور وضغطها
# - إنشاء الصور المصغرة
# - التحكم في الوصول والرموز
# - إحصائيات التخزين
# - تنظيف الملفات المؤقتة
# - معالجة الأخطاء
```

### مميزات متقدمة

#### 1. تحسين الصور التلقائي
- **كشف التنسيق**: تحويل تلقائي إلى WebP للأداء الأفضل
- **ضغط ذكي**: ضغط مختلف حسب نوع الصورة
- **تحجيم تلقائي**: تقليل الأبعاد الكبيرة جداً
- **إزالة البيانات الوصفية**: تقليل الحجم دون فقدان المعلومات المهمة

#### 2. نظام الصور المصغرة
- **أحجام متعددة**: إنشاء عدة أحجام للاستخدام المختلف
- **جودة قابلة للتكوين**: تحكم في جودة الصور المصغرة
- **تحديث تلقائي**: إعادة إنشاء عند تحديث الصورة الأصلية

#### 3. التحكم الأمني في الوصول
- **تشفير الرموز**: رموز وصول آمنة ومشفرة
- **حدود زمنية**: انتهاء صلاحية الروابط تلقائياً
- **قيود التنزيل**: تحديد عدد مرات التنزيل المسموحة
- **تسجيل شامل**: تتبع كامل لعمليات الوصول

#### 4. دعم التخزين السحابي
- **Amazon S3**: دعم كامل لخدمة S3
- **تكرار تلقائي**: نسخ احتياطي تلقائي
- **CDN**: توزيع سريع عالمي
- **تكلفة محسنة**: تخزين ذكي وفعال

#### 5. إدارة متقدمة للملفات
- **إصدارات الملفات**: حفظ إصدارات مختلفة
- **استعادة الملفات**: استعادة الملفات المحذوفة
- **فحص سلامة**: التحقق من سلامة الملفات المخزنة
- **تنظيف تلقائي**: حذف الملفات المؤقتة والقديمة

### أمثلة عملية

```typescript
// رفع صورة منتج وتحسينها تلقائياً
const uploadedFile = await storageService.uploadFile({
  file: productImage,
  category: 'product_images',
  entityType: 'product',
  entityId: productId,
  isPublic: true,
  bucket: 'products',
  uploadedBy: userId,
  metadata: {
    alt: productName,
    caption: productDescription
  }
});

// تحسين الصورة تلقائياً
await imageOptimizationService.autoOptimizeImage(uploadedFile.id, false);

// إنشاء صور مصغرة
await imageOptimizationService.generateThumbnailsForFile(uploadedFile.id, [
  { width: 300, height: 300, suffix: 'md' },
  { width: 600, height: 600, suffix: 'lg' }
]);

// إنشاء رابط عام للمشاركة
const publicLink = await accessControlService.createPublicLink(
  uploadedFile.id,
  userId,
  { expiresIn: 168 } // أسبوع واحد
);

console.log(`Product image uploaded: ${uploadedFile.url}`);
console.log(`Public link: ${publicLink}`);
```

### أداء وتحسين

#### 1. الكاش الذكي
- **كاش الملفات**: تخزين مؤقت للملفات المتكررة الوصول
- **كاش الصور المصغرة**: تخزين الصور المصغرة في الذاكرة
- **كاش الـ metadata**: تخزين معلومات الملفات

#### 2. معالجة غير متزامنة
- **طوابير الرفع**: معالجة الرفع في الخلفية
- **تحسين غير متزامن**: تحسين الصور بدون حجب الاستجابة
- **معالجة مجمعة**: تحسين عدة ملفات معاً

#### 3. مراقبة الأداء
- **مقاييس الرفع**: زمن الرفع وحجم الملفات
- **إحصائيات التحسين**: نسب الضغط وزمن المعالجة
- **تحليل الوصول**: أنماط الوصول واستخدام النطاق

### التكامل مع النظام

#### 1. تكامل مع المنتجات
- **صور المنتجات**: رفع وتحسين صور المنتجات تلقائياً
- **كتالوج الصور**: إدارة صور المنتجات مع الصور المصغرة
- **معرض المنتجات**: عرض الصور المحسنة في التطبيق

#### 2. تكامل مع المستخدمين
- **صور الملف الشخصي**: رفع وتحسين صور المستخدمين
- **وثائق الهوية**: تخزين آمن لوثائق المستخدمين
- **مرفقات الرسائل**: مشاركة الملفات بأمان

#### 3. تكامل مع المبيعات
- **فواتير PDF**: تخزين فواتير المبيعات
- **إيصالات الدفع**: حفظ إيصالات الدفع الرقمية
- **عقود التجارة**: تخزين العقود والوثائق الرسمية

## نظام المراقبة (Monitoring System)

### نظرة عامة
نظام مراقبة شامل يوفر مراقبة كاملة للتطبيق باستخدام أحدث التقنيات في مجال المراقبة والقياس.

### المكونات الأساسية

#### 1. OpenTelemetry (تتبع التوزيع)
- **تتبع الطلبات**: تتبع شامل لجميع الطلبات والعمليات
- **مقاييس الأداء**: قياس زمن الاستجابة ومعدلات الخطأ
- **تتبع الأخطاء**: ربط الأخطاء بالطلبات والمستخدمين
- **تكامل مع Jaeger**: تصدير البيانات إلى أدوات التتبع

#### 2. Prometheus Metrics (المقاييس)
- **مقاييس HTTP**: طلبات، استجابات، أخطاء
- **مقاييس قاعدة البيانات**: اتصالات، استعلامات، أداء
- **مقاييس الكاش**: معدل الإصابة، حجم البيانات
- **مقاييس الأعمال**: مؤشرات الأداء الرئيسية

#### 3. Health Checks (فحوصات الصحة)
- **فحص قاعدة البيانات**: اتصال، استعلامات معلقة
- **فحص الكاش**: أداء القراءة والكتابة
- **فحص التخزين**: مساحة القرص، صلاحية الوصول
- **فحص الخدمات الخارجية**: بوابات الدفع، خدمات الإشعارات

#### 4. Sentry (تتبع الأخطاء)
- **تتبع الأخطاء**: تلقائي مع سياق كامل
- **تجميع الأخطاء**: منع تكرار نفس الخطأ
- **إشعارات الأخطاء**: تنبيهات فورية للأخطاء الحرجة
- **تحليل الأخطاء**: إحصائيات واتجاهات

#### 5. نظام السجلات المحسن
- **سجلات مصنفة**: تصنيف حسب المستوى والسياق
- **بحث متقدم**: فلترة وبحث في السجلات
- **تصدير السجلات**: JSON و CSV
- **تنظيف تلقائي**: حذف السجلات القديمة

#### 6. لوحات التحكم التفاعلية
- **لوحات افتراضية**: لوحات جاهزة للاستخدام
- **ودجتس مخصصة**: إنشاء ودجتس حسب الحاجة
- **تحديث تلقائي**: بيانات محدثة في الوقت الفعلي
- **صلاحيات مرنة**: تحكم في الوصول للوحات

### APIs الرئيسية

#### فحوصات الصحة
```typescript
// فحص صحة شامل
GET /monitoring/health
{
  "overall": {
    "status": "healthy",
    "timestamp": "2025-01-11T10:00:00Z",
    "duration": 45,
    "details": {
      "totalChecks": 4,
      "passed": 4,
      "warnings": 0,
      "failed": 0
    }
  },
  "components": {
    "database": { "status": "healthy", "timestamp": "...", "duration": 12 },
    "cache": { "status": "healthy", "timestamp": "...", "duration": 8 },
    "storage": { "status": "healthy", "timestamp": "...", "duration": 15 },
    "external": { "status": "healthy", "timestamp": "...", "duration": 10 }
  }
}

// فحص مفصل لقاعدة البيانات
GET /monitoring/health/database
{
  "status": "healthy",
  "connectionPool": {
    "total_connections": 10,
    "active_connections": 3,
    "idle_connections": 7
  },
  "activeConnections": 3,
  "idleConnections": 7,
  "pendingQueries": 0,
  "slowQueries": []
}
```

#### مقاييس Prometheus
```typescript
// مقاييس بتنسيق Prometheus
GET /monitoring/metrics
# HELP zaytuna_backend_http_requests_total Total number of HTTP requests
# TYPE zaytuna_backend_http_requests_total counter
zaytuna_backend_http_requests_total{method="GET",route="/api/health",status_code="200"} 150
zaytuna_backend_http_requests_total{method="POST",route="/api/auth/login",status_code="200"} 45

# HELP zaytuna_backend_active_connections Number of active connections
# TYPE zaytuna_backend_active_connections gauge
zaytuna_backend_active_connections{type="http"} 12
zaytuna_backend_active_connections{type="websocket"} 3
```

#### السجلات
```typescript
// البحث في السجلات
GET /monitoring/logs?level=error&context=HTTP&limit=50
{
  "logs": [
    {
      "timestamp": "2025-01-11T10:30:00Z",
      "level": "error",
      "message": "Database connection failed",
      "context": "HTTP",
      "userId": "user_123",
      "ip": "192.168.1.100",
      "method": "POST",
      "url": "/api/orders",
      "statusCode": 500,
      "duration": 2500,
      "error": {
        "name": "DatabaseError",
        "message": "Connection timeout",
        "stack": "..."
      }
    }
  ],
  "total": 1,
  "hasMore": false
}

// إحصائيات السجلات
GET /monitoring/logs/stats
{
  "totalLogs": 1250,
  "logsByLevel": {
    "error": 15,
    "warn": 45,
    "log": 850,
    "debug": 200,
    "verbose": 140
  },
  "logsByContext": {
    "HTTP": 600,
    "DATABASE": 150,
    "CACHE": 80,
    "BUSINESS": 420
  },
  "oldestLog": "2025-01-01T00:00:00Z",
  "newestLog": "2025-01-11T10:30:00Z",
  "logFileSize": 5242880
}
```

#### لوحات التحكم
```typescript
// قائمة لوحات التحكم
GET /monitoring/dashboards?category=system
[
  {
    "id": "system-overview",
    "name": "نظرة عامة على النظام",
    "description": "لوحة تحكم شاملة لمراقبة حالة النظام",
    "category": "system",
    "widgets": [...],
    "layout": { "columns": 6, "rows": 10, "gap": 10 },
    "permissions": ["dashboard.view"],
    "isPublic": false,
    "createdBy": "system",
    "createdAt": "2025-01-11T00:00:00Z",
    "updatedAt": "2025-01-11T00:00:00Z"
  }
]

// لوحة تحكم محددة مع البيانات
GET /monitoring/dashboards/system-overview
{
  "dashboard": { ... },
  "data": {
    "system-health": {
      "overall": "healthy",
      "components": { ... },
      "details": { ... }
    },
    "active-users": {
      "value": 45,
      "change": 5.2,
      "trend": "up"
    },
    "http-requests": {
      "labels": ["00:00", "01:00", "02:00", ...],
      "data": [120, 95, 110, ...]
    }
  },
  "lastUpdated": "2025-01-11T10:30:00Z"
}

// إنشاء لوحة تحكم مخصصة
POST /monitoring/dashboards
{
  "name": "مبيعات الفرع",
  "description": "مراقبة مبيعات فرع محدد",
  "category": "business",
  "widgets": [
    {
      "id": "branch-sales",
      "type": "chart",
      "title": "مبيعات الفرع",
      "position": { "x": 0, "y": 0, "width": 6, "height": 4 },
      "config": {
        "dataSource": "business",
        "query": "branch_sales",
        "refreshInterval": 300000,
        "filters": { "branchId": "branch_123" }
      }
    }
  ],
  "layout": { "columns": 6, "rows": 6, "gap": 10 },
  "permissions": ["dashboard.branch.view"],
  "isPublic": false
}
```

### أذونات RBAC
- `monitoring.health`: قراءة فحوصات الصحة
- `monitoring.metrics`: الوصول للمقاييس
- `monitoring.logs`: قراءة وبحث السجلات
- `monitoring.dashboards`: إدارة لوحات التحكم
- `monitoring.admin`: إدارة كاملة للنظام

### متغيرات البيئة
```bash
# OpenTelemetry
OTEL_SERVICE_NAME=zaytuna-backend
OTEL_SERVICE_VERSION=1.0.0
OTEL_TRACES_EXPORTER=console
OTEL_METRICS_EXPORTER=console
OTEL_NODE_RESOURCE_DETECTORS=env,host,os

# Prometheus
PROMETHEUS_ENABLED=true
PROMETHEUS_METRICS_PREFIX=zaytuna_backend_
PROMETHEUS_DEFAULT_METRICS=true
PROMETHEUS_GC_METRICS=true

# Sentry
SENTRY_DSN=https://your-dsn@sentry.io/project-id
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0.1
SENTRY_PROFILES_SAMPLE_RATE=0.1

# Logging
LOG_LEVEL=debug
LOG_DIR=./logs
LOG_MAX_FILES=30
LOG_FORMAT=json

# Health Checks
HEALTH_CHECK_TIMEOUT=30000
HEALTH_CHECK_DATABASE_ENABLED=true
HEALTH_CHECK_CACHE_ENABLED=true
HEALTH_CHECK_STORAGE_ENABLED=true
HEALTH_CHECK_EXTERNAL_ENABLED=true

# Dashboards
DASHBOARD_REFRESH_INTERVAL=30000
DASHBOARD_CACHE_TTL=300
DASHBOARD_MAX_WIDGETS_PER_DASHBOARD=50
```

### اختبار النظام
```bash
# تشغيل اختبارات المراقبة
npm run monitoring:test

# الاختبارات تشمل:
# - فحوصات الصحة الشاملة
# - جمع المقاييس
# - تتبع الأخطاء
# - السجلات والإحصائيات
# - لوحات التحكم
# - APIs والتكامل
```

### مميزات متقدمة

#### 1. تتبع شامل للأداء
- **Distributed Tracing**: تتبع الطلبات عبر جميع الخدمات
- **Performance Metrics**: مؤشرات الأداء الرئيسية
- **Custom Spans**: تتبع عمليات مخصصة
- **Error Correlation**: ربط الأخطاء بالطلبات

#### 2. مراقبة الأعمال
- **Business KPIs**: مؤشرات الأداء الرئيسية للأعمال
- **Real-time Alerts**: تنبيهات فورية للمشاكل
- **Trend Analysis**: تحليل الاتجاهات والتنبؤات
- **Custom Dashboards**: لوحات مخصصة حسب الاحتياجات

#### 3. إدارة السجلات الذكية
- **Log Aggregation**: تجميع السجلات من مصادر متعددة
- **Advanced Search**: بحث متقدم مع فلاتر معقدة
- **Log Rotation**: إدارة تلقائية لملفات السجل
- **Export & Backup**: تصدير ونسخ احتياطي للسجلات

#### 4. لوحات تحكم تفاعلية
- **Drag & Drop**: إنشاء لوحات بسهولة
- **Real-time Updates**: تحديث البيانات تلقائياً
- **Responsive Design**: متوافق مع جميع الأجهزة
- **Sharing & Permissions**: مشاركة آمنة مع صلاحيات

### أمثلة عملية

```typescript
// فحص صحة شامل قبل النشر
const healthCheck = await monitoringService.checkAllHealth();
if (healthCheck.overall.status !== 'healthy') {
  console.error('التطبيق غير جاهز للنشر:', healthCheck.overall.details);
  process.exit(1);
}

// تتبع أداء عملية أعمال
const span = monitoringService.startTransaction('process-order', 'business');
try {
  // معالجة الطلب
  await processOrder(orderData);

  // تسجيل مقاييس الأعمال
  monitoringService.recordBusinessMetric('orders_processed', 1);
  monitoringService.recordBusinessMetric('revenue_generated', orderData.total);

  span.setStatus('ok');
} catch (error) {
  span.setStatus('error', error.message);
  monitoringService.captureException(error, {
    user: orderData.customer,
    tags: { operation: 'process-order' },
  });
  throw error;
} finally {
  span.finish();
}

// إنشاء لوحة تحكم لمراقبة المبيعات
const salesDashboard = await dashboardService.createDashboard({
  name: 'مراقبة المبيعات',
  category: 'business',
  widgets: [
    {
      type: 'chart',
      title: 'المبيعات اليومية',
      config: {
        dataSource: 'business',
        query: 'daily_sales_chart',
        refreshInterval: 300000,
      },
    },
    {
      type: 'metric',
      title: 'إجمالي المبيعات',
      config: {
        dataSource: 'business',
        query: 'total_sales',
      },
    },
  ],
}, 'admin_user');

// البحث في السجلات لتحليل مشكلة
const errorLogs = await loggingService.queryLogs({
  level: 'error',
  startDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // آخر 24 ساعة
  context: 'PAYMENT',
  limit: 100,
});

console.log(`تم العثور على ${errorLogs.total} خطأ في الدفع خلال 24 ساعة`);
```

### التكامل مع أدوات خارجية

#### Grafana
```yaml
# grafana/provisioning/datasources/prometheus.yml
apiVersion: 1
datasources:
  - name: Zaytuna Prometheus
    type: prometheus
    url: http://prometheus:9090
    access: proxy
    isDefault: true
```

#### Jaeger
```yaml
# docker-compose.yml
version: '3.8'
services:
  jaeger:
    image: jaegertracing/all-in-one:latest
    ports:
      - "16686:16686"
      - "14268:14268"
    environment:
      COLLECTOR_OTLP_ENABLED: true
```

#### ELK Stack
```yaml
# filebeat.yml
filebeat.inputs:
- type: log
  paths:
    - /app/logs/*.log
  json.keys_under_root: true

output.elasticsearch:
  hosts: ["elasticsearch:9200"]
```

### مقاييس الأداء

#### استهلاك الموارد
- **CPU Usage**: < 70% في الأوقات العادية
- **Memory Usage**: < 80% من الذاكرة المتاحة
- **Disk I/O**: < 50MB/s متوسط
- **Network I/O**: < 100MB/s متوسط

#### زمن الاستجابة
- **API Response Time**: < 200ms للطلبات البسيطة
- **Database Queries**: < 50ms متوسط
- **Cache Hit Rate**: > 85%
- **Error Rate**: < 1%

#### توافر النظام
- **Uptime**: > 99.9%
- **Health Checks**: جميع الفحوصات ناجحة
- **Alert Response**: < 5 دقائق للتنبيهات الحرجة

### المراحل القادمة
- وحدات الأعمال الأساسية (Purchasing, Accounting, etc.)
- التكاملات والتحسينات
- الاختبار والنشر

## المساهمة

يرجى قراءة [دليل المساهمة](../../CONTRIBUTING.md) للحصول على معلومات حول كيفية المساهمة في المشروع.

## الترخيص

هذا المشروع مرخص تحت رخصة MIT - راجع ملف [LICENSE](../../LICENSE) للتفاصيل.
