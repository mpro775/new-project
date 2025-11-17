# هيكل الفرونت إند للعملاء - لوحة تحكم زيتونة SaaS

## نظرة عامة على الفرونت إند

يُبنى الفرونت إند للعملاء (التجار) باستخدام **React + TypeScript** ويتبع هيكل واضح ومنظم يضمن سهولة الاستخدام والقابلية للصيانة. النظام يتكون من تطبيقين رئيسيين موجهين للعملاء:

### التطبيقات الرئيسية للعملاء:
1. **POS Frontend PWA** - واجهة الصراف للبيع اليومي
2. **Admin Dashboard** - لوحة التحكم الإدارية الشاملة

---

## 1. لوحة التحكم الإدارية (Admin Dashboard)

### 1.1 البنية العامة
**التقنيات المستخدمة:**
- **إطار العمل**: React 18+ مع TypeScript
- **أداة البناء**: Vite
- **إدارة الحالة**: TanStack Query + Zustand
- **إدارة النماذج**: React Hook Form + Zod
- **واجهة المستخدم**: Material-UI (MUI) + Emotion
- **التوجيه**: React Router v6
- **الرسوم البيانية**: Recharts
- **التعريب**: i18next مع دعم RTL
- **إشعارات**: React Hot Toast

### 1.2 هيكل المجلدات والمكونات

```
src/
├── components/           # المكونات المشتركة
│   ├── common/          # مكونات عامة
│   │   ├── Button/
│   │   ├── Input/
│   │   ├── Table/
│   │   ├── Modal/
│   │   └── Loading/
│   ├── layout/          # تخطيط التطبيق
│   │   ├── Header/
│   │   ├── Sidebar/
│   │   ├── Breadcrumb/
│   │   └── Footer/
│   └── ui/              # مكونات واجهة المستخدم
│       ├── Dashboard/
│       ├── Forms/
│       └── Charts/
├── pages/               # صفحات التطبيق
│   ├── Dashboard/       # الصفحة الرئيسية
│   ├── Products/        # إدارة المنتجات
│   ├── Inventory/       # إدارة المخزون
│   ├── Sales/           # المبيعات والفواتير
│   ├── Purchases/       # المشتريات
│   ├── Customers/       # العملاء
│   ├── Suppliers/       # الموردون
│   ├── Users/           # المستخدمون والصلاحيات
│   ├── Branches/        # الفروع والمخازن
│   ├── Reports/         # التقارير
│   ├── Accounting/      # المحاسبة
│   └── Settings/        # الإعدادات
├── hooks/               # React Hooks مخصصة
│   ├── useAuth.ts
│   ├── useProducts.ts
│   ├── useInventory.ts
│   └── useReports.ts
├── services/            # خدمات API
│   ├── api.ts           # إعداد Axios
│   ├── auth.ts          # خدمات المصادقة
│   ├── products.ts      # خدمات المنتجات
│   ├── inventory.ts     # خدمات المخزون
│   └── reports.ts       # خدمات التقارير
├── store/               # إدارة الحالة العامة
│   ├── authStore.ts
│   ├── uiStore.ts
│   └── appStore.ts
├── utils/               # أدوات مساعدة
│   ├── constants.ts     # الثوابت
│   ├── helpers.ts       # دوال مساعدة
│   ├── validation.ts    # التحقق من البيانات
│   └── formatters.ts    # تنسيق البيانات
├── types/               # أنواع TypeScript
│   ├── api.ts           # أنواع API
│   ├── models.ts        # نماذج البيانات
│   └── ui.ts            # أنواع واجهة المستخدم
├── locales/             # ملفات الترجمة
│   ├── ar.json
│   └── en.json
├── App.tsx
├── main.tsx
└── index.css
```

### 1.3 الصفحات الرئيسية ووظائفها

#### 1.3.1 لوحة المؤشرات (Dashboard)
**المكونات الرئيسية:**
- مؤشرات الأداء الرئيسية (KPIs)
- رسوم بيانية للمبيعات والإيرادات
- مخزون منخفض وتنبيهات
- أفضل المنتجات مبيعاً
- المبيعات اليومية والشهرية
- مقارنة الفترات

**الميزات:**
- فلترة حسب التاريخ والفرع
- تحديث تلقائي كل 5 دقائق
- تصدير البيانات
- تنبيهات ذكية

#### 1.3.2 إدارة المنتجات (Products Management)
**الوظائف الرئيسية:**
- قائمة المنتجات مع البحث والفلترة
- إضافة/تعديل/حذف المنتجات
- إدارة الفئات والتصنيفات
- إدارة المتغيرات (الألوان، الأحجام)
- رفع الصور والباركود
- إدارة الأسعار والضرائب
- استيراد/تصدير CSV

**المكونات:**
- جدول المنتجات مع ترقيم الصفحات
- نموذج إضافة/تعديل المنتج
- معاينة الصور والباركود
- فلاتر متقدمة

#### 1.3.3 إدارة المخزون (Inventory Management)
**الوظائف الرئيسية:**
- عرض المخزون عبر المخازن
- حركات المخزون التفصيلية
- الجرد الدوري
- تسويات المخزون
- تحويلات بين المخازن
- تنبيهات النفاد والزيادة
- تقارير المخزون

**المكونات:**
- خريطة المخزون
- سجل الحركات
- أدوات الجرد
- تنبيهات في الوقت الفعلي

#### 1.3.4 إدارة المبيعات (Sales Management)
**الوظائف الرئيسية:**
- قائمة فواتير المبيعات
- تفاصيل الفاتورة والطباعة
- إدارة المرتجعات
- تتبع المدفوعات
- تقارير المبيعات
- إدارة العملاء

**المكونات:**
- فلاتر متقدمة للبحث
- عرض تفاصيل الفاتورة
- أدوات المرتجعة
- تتبع حالة الدفع

#### 1.3.5 إدارة المشتريات (Purchasing Management)
**الوظائف الرئيسية:**
- فواتير المشتريات
- إدارة الموردين
- تتبع المستحقات
- تحديث تكاليف المخزون
- تقارير المشتريات

**المكونات:**
- قائمة الموردين
- نماذج فواتير الشراء
- تتبع المدفوعات

#### 1.3.6 إدارة المستخدمين والصلاحيات (Users & Permissions)
**الوظائف الرئيسية:**
- إدارة المستخدمين
- الأدوار والصلاحيات
- ربط المستخدمين بالفروع
- إدارة كلمات المرور
- سجلات النشاط

**المكونات:**
- جدول المستخدمين
- إدارة الأدوار
- إعدادات الأمان

#### 1.3.7 إدارة الفروع والمخازن (Branches & Warehouses)
**الوظائف الرئيسية:**
- إدارة الفروع
- إدارة المخازن لكل فرع
- تبديل بين الفروع
- إعدادات كل فرع

**المكونات:**
- خريطة الفروع
- إعدادات الفرع
- إدارة المخازن

#### 1.3.8 التقارير والتحليلات (Reports & Analytics)
**الوظائف الرئيسية:**
- تقارير المبيعات المفصلة
- تقارير المخزون
- تقارير المالية
- تقارير الأداء
- لوحات مؤشرات مخصصة
- تصدير PDF/Excel

**المكونات:**
- مصمم التقارير
- فلاتر التاريخ والفرع
- رسوم بيانية تفاعلية
- جدولة التقارير

#### 1.3.9 المحاسبة الأساسية (Basic Accounting)
**الوظائف الرئيسية:**
- دليل الحسابات
- القيود اليومية
- سندات الصرف والقبض
- إقفال الفترات
- التقارير المالية

**المكونات:**
- شجرة الحسابات
- سجل القيود
- أدوات الإقفال

#### 1.3.10 الإعدادات (Settings)
**الوظائف الرئيسية:**
- إعدادات الشركة
- إعدادات الضرائب والعملات
- إعدادات الطباعة
- إعدادات النسخ الاحتياطي
- إعدادات الأمان

**المكونات:**
- نماذج الإعدادات
- اختبار الاتصالات
- إدارة النسخ الاحتياطي

---

## 2. واجهة الصراف (POS Frontend PWA)

### 2.1 البنية التقنية
- **PWA**: Progressive Web App
- **Offline-First**: يعمل بدون إنترنت
- **IndexedDB**: تخزين البيانات محلياً
- **Service Worker**: المزامنة والكاش
- **Camera API**: مسح الباركود
- **Web Bluetooth/USB**: الطباعة الحرارية

### 2.2 الشاشات الرئيسية

#### 2.2.1 شاشة تسجيل الدخول
- اسم المستخدم وكلمة المرور
- دعم 2FA (SMS/Authenticator)
- دعم البصمة/الوجه
- تذكر الجهاز

#### 2.2.2 شاشة البيع الرئيسية
- مؤشر اليوم والمبيعات
- مسح الباركود بالكاميرا
- إدخال يدوي للمنتجات
- سلة المشتريات
- حساب الإجمالي والضرائب
- أزرار الدفع الملونة

#### 2.2.3 شاشة الدفع
- طرق الدفع المتعددة:
  - نقد
  - بطاقة ائتمان
  - محفظة إلكترونية
  - آجل/تقسيط
- حساب المبلغ المستلم
- طباعة الفاتورة
- مشاركة الفاتورة

#### 2.2.4 شاشة المرتجعات
- البحث عن الفاتورة
- عرض تفاصيل الفاتورة
- اختيار الأصناف المرجعة
- سبب الإرجاع
- معالجة رد المبلغ
- طباعة إيصال الإرجاع

#### 2.2.5 شاشة التقارير اليومية
- ملخص المبيعات اليوم
- تفصيل العمليات
- إغلاق اليوم المالي

---

## 3. الميزات المشتركة

### 3.1 نظام المصادقة والأمان
- JWT tokens مع تحديث تلقائي
- 2FA متعدد العوامل
- WebAuthn للبصمة والوجه
- انتهاء الجلسة التلقائي
- قفل عند محاولات فاشلة

### 3.2 إدارة الصلاحيات (RBAC)
- أدوار محددة مسبقاً
- صلاحيات دقيقة لكل شاشة
- ربط الصلاحيات بالفروع
- Guards للتحقق من الصلاحيات

### 3.3 دعم اللغات والعملات
- العربية والإنجليزية
- RTL للعربية
- دعم عملات متعددة
- تنسيق الأرقام والتواريخ

### 3.4 الاستجابة والأداء
- تصميم متجاوب لجميع الأجهزة
- تحميل تدريجي للمكونات
- كاش ذكي للبيانات
- ضغط الصور والملفات

### 3.5 الإشعارات والتنبيهات
- إشعارات داخل التطبيق
- تنبيهات المخزون المنخفض
- تذكيرات المهام
- إشعارات النظام

---

## 4. تجربة المستخدم (UX)

### 4.1 مبادئ التصميم
- **البساطة**: واجهات نظيفة وواضحة
- **الكفاءة**: تقليل عدد النقرات
- **الاتساق**: نفس الأنماط في جميع الشاشات
- **الاستجابة**: ردود فعل فورية

### 4.2 تدفقات العمل الشائعة
- **تدفق البيع**: مسح → سلة → دفع → فاتورة
- **تدفق الجرد**: اختيار المخزن → مسح الأصناف → تسجيل الكميات
- **تدفق التقرير**: اختيار النوع → تحديد الفلاتر → عرض/تصدير

### 4.3 إرشادات التصميم
- ألوان زيتونة وأخضر للنجاح
- أحمر للأخطاء والتحذيرات
- رمادي للعناصر غير النشطة
- خطوط واضحة وسهلة القراءة

---

## 5. خطة التطوير المرحلية

### المرحلة الأولى (الأساسيات)
- لوحة المؤشرات
- إدارة المنتجات والمخزون
- إدارة المستخدمين
- الإعدادات الأساسية

### المرحلة الثانية (العمليات التجارية)
- إدارة المبيعات والمرتجعات
- إدارة المشتريات والموردين
- إدارة العملاء
- التقارير الأساسية

### المرحلة الثالثة (المتقدمة)
- المحاسبة الأساسية
- لوحات المؤشرات المتقدمة
- التكاملات الخارجية
- تحسينات الأداء

---

## 6. متطلبات التشغيل

### 6.1 متطلبات المتصفح
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### 6.2 متطلبات الأجهزة
- ذاكرة RAM: 4GB على الأقل
- مساحة تخزين: 500MB
- اتصال إنترنت مستقر
- كاميرا لمسح الباركود (اختياري)

### 6.3 دعم PWA
- تثبيت كتطبيق
- عمل بدون إنترنت
- إشعارات الدفع
- مشاركة الملفات

---

هذا الهيكل يضمن:
- **سهولة الاستخدام**: واجهات بديهية للتجار غير التقنيين
- **الكفاءة**: تقليل الوقت المطلوب لإتمام العمليات
- **المرونة**: دعم أحجام الأعمال المختلفة
- **الأمان**: حماية البيانات والعمليات
- **القابلية للتوسع**: إضافة ميزات جديدة بسهولة

---

## 7. دليل إعداد المشروع (Project Setup Guide)

### 7.1 متطلبات النظام (System Requirements)
```bash
# Node.js LTS (18+)
node --version  # يجب أن يكون 18.0.0 أو أحدث

# npm أو yarn
npm --version   # أو yarn --version

# Git
git --version
```

### 7.2 إعداد مشروع React مع TypeScript
```bash
# إنشاء مشروع React مع TypeScript
npx create-react-app frontend-customer --template typescript

# أو مع Vite (أسرع)
npm create vite@latest frontend-customer -- --template react-ts
cd frontend-customer
```

### 7.3 تثبيت التبعيات الأساسية
```bash
# تثبيت التبعيات الأساسية
npm install @mui/material @emotion/react @emotion/styled
npm install @tanstack/react-query @tanstack/react-query-devtools
npm install react-hook-form @hookform/resolvers zod
npm install react-router-dom @types/react-router-dom
npm install axios
npm install recharts
npm install react-i18next i18next-browser-languagedetector
npm install react-hot-toast
npm install zustand

# تثبيت تبعيات التطوير
npm install -D @types/node vite @vitejs/plugin-react
npm install -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
npm install -D prettier eslint-config-prettier eslint-plugin-prettier
```

### 7.4 إعداد متغيرات البيئة
```bash
# نسخ ملف البيئة النموذجي
cp .env.example .env

# تحرير متغيرات البيئة
nano .env
```

**محتوى ملف .env:**
```dotenv
# API Configuration
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_API_TIMEOUT=10000

# Authentication
VITE_JWT_REFRESH_THRESHOLD=300000  # 5 minutes in ms

# Features
VITE_ENABLE_PWA=true
VITE_ENABLE_OFFLINE=true
VITE_ENABLE_ANALYTICS=false

# Environment
VITE_APP_ENV=development
VITE_APP_VERSION=1.0.0
```

### 7.5 إعداد TypeScript وESLint
```typescript
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@/components/*": ["src/components/*"],
      "@/pages/*": ["src/pages/*"],
      "@/hooks/*": ["src/hooks/*"],
      "@/services/*": ["src/services/*"],
      "@/utils/*": ["src/utils/*"],
      "@/types/*": ["src/types/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### 7.6 إعداد Vite للتطوير
```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/pages': path.resolve(__dirname, './src/pages'),
      '@/hooks': path.resolve(__dirname, './src/hooks'),
      '@/services': path.resolve(__dirname, './src/services'),
      '@/utils': path.resolve(__dirname, './src/utils'),
      '@/types': path.resolve(__dirname, './src/types'),
    },
  },
  server: {
    port: 3001,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})
```

### 7.7 تشغيل التطبيق
```bash
# وضع التطوير
npm run dev

# بناء للإنتاج
npm run build

# معاينة البناء
npm run preview
```

---

## 8. هيكل المجلدات التفصيلي (Detailed Folder Structure)

```
frontend-customer/
├── public/
│   ├── favicon.ico
│   ├── manifest.json          # PWA manifest
│   ├── robots.txt
│   └── icons/                 # PWA icons
│       ├── icon-192x192.png
│       ├── icon-512x512.png
│       └── apple-touch-icon.png
├── src/
│   ├── assets/                # الصور والأصول الثابتة
│   │   ├── images/
│   │   ├── icons/
│   │   └── styles/
│   ├── components/            # المكونات المشتركة
│   │   ├── common/            # مكونات عامة
│   │   │   ├── Button/
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Button.stories.tsx
│   │   │   │   └── index.ts
│   │   │   ├── Input/
│   │   │   │   ├── Input.tsx
│   │   │   │   ├── InputField.tsx
│   │   │   │   └── index.ts
│   │   │   ├── Table/
│   │   │   │   ├── DataTable.tsx
│   │   │   │   ├── TablePagination.tsx
│   │   │   │   └── index.ts
│   │   │   ├── Modal/
│   │   │   │   ├── Modal.tsx
│   │   │   │   ├── ConfirmDialog.tsx
│   │   │   │   └── index.ts
│   │   │   ├── Loading/
│   │   │   │   ├── Spinner.tsx
│   │   │   │   ├── Skeleton.tsx
│   │   │   │   └── index.ts
│   │   │   └── Form/
│   │   │       ├── FormField.tsx
│   │   │       ├── FormSelect.tsx
│   │   │       └── index.ts
│   │   ├── layout/            # تخطيط التطبيق
│   │   │   ├── Header/
│   │   │   │   ├── Header.tsx
│   │   │   │   ├── UserMenu.tsx
│   │   │   │   ├── NotificationBell.tsx
│   │   │   │   └── index.ts
│   │   │   ├── Sidebar/
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   ├── SidebarMenu.tsx
│   │   │   │   ├── SidebarItem.tsx
│   │   │   │   └── index.ts
│   │   │   ├── Breadcrumb/
│   │   │   │   ├── Breadcrumb.tsx
│   │   │   │   └── index.ts
│   │   │   └── Footer/
│   │   │       ├── Footer.tsx
│   │   │       └── index.ts
│   │   └── ui/                # مكونات واجهة المستخدم المتخصصة
│   │       ├── Dashboard/
│   │       │   ├── KPICard.tsx
│   │       │   ├── SalesChart.tsx
│   │       │   ├── InventoryAlerts.tsx
│   │       │   └── index.ts
│   │       ├── Forms/
│   │       │   ├── ProductForm.tsx
│   │       │   ├── UserForm.tsx
│   │       │   ├── SaleForm.tsx
│   │       │   └── index.ts
│   │       └── Charts/
│   │           ├── BarChart.tsx
│   │           ├── LineChart.tsx
│   │           ├── PieChart.tsx
│   │           └── index.ts
│   ├── pages/                 # صفحات التطبيق
│   │   ├── Dashboard/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Dashboard.hooks.ts
│   │   │   └── index.ts
│   │   ├── Products/
│   │   │   ├── Products.tsx
│   │   │   ├── ProductList.tsx
│   │   │   ├── ProductForm.tsx
│   │   │   ├── ProductDetails.tsx
│   │   │   └── index.ts
│   │   ├── Inventory/
│   │   │   ├── Inventory.tsx
│   │   │   ├── StockLevels.tsx
│   │   │   ├── StockMovements.tsx
│   │   │   ├── InventoryAdjustment.tsx
│   │   │   └── index.ts
│   │   ├── Sales/
│   │   │   ├── Sales.tsx
│   │   │   ├── SalesList.tsx
│   │   │   ├── SaleDetails.tsx
│   │   │   ├── CreateSale.tsx
│   │   │   └── index.ts
│   │   ├── Purchases/
│   │   │   ├── Purchases.tsx
│   │   │   ├── PurchaseOrders.tsx
│   │   │   ├── Suppliers.tsx
│   │   │   └── index.ts
│   │   ├── Customers/
│   │   │   ├── Customers.tsx
│   │   │   ├── CustomerList.tsx
│   │   │   ├── CustomerForm.tsx
│   │   │   └── index.ts
│   │   ├── Suppliers/
│   │   │   ├── Suppliers.tsx
│   │   │   ├── SupplierList.tsx
│   │   │   ├── SupplierForm.tsx
│   │   │   └── index.ts
│   │   ├── Users/
│   │   │   ├── Users.tsx
│   │   │   ├── UserList.tsx
│   │   │   ├── UserForm.tsx
│   │   │   ├── RolesPermissions.tsx
│   │   │   └── index.ts
│   │   ├── Branches/
│   │   │   ├── Branches.tsx
│   │   │   ├── BranchList.tsx
│   │   │   ├── BranchForm.tsx
│   │   │   ├── Warehouses.tsx
│   │   │   └── index.ts
│   │   ├── Reports/
│   │   │   ├── Reports.tsx
│   │   │   ├── SalesReports.tsx
│   │   │   ├── InventoryReports.tsx
│   │   │   ├── FinancialReports.tsx
│   │   │   └── index.ts
│   │   ├── Accounting/
│   │   │   ├── Accounting.tsx
│   │   │   ├── ChartOfAccounts.tsx
│   │   │   ├── JournalEntries.tsx
│   │   │   ├── FinancialStatements.tsx
│   │   │   └── index.ts
│   │   └── Settings/
│   │       ├── Settings.tsx
│   │       ├── CompanySettings.tsx
│   │       ├── SystemSettings.tsx
│   │       ├── SecuritySettings.tsx
│   │       └── index.ts
│   ├── hooks/                 # React Hooks مخصصة
│   │   ├── useAuth.ts
│   │   ├── useProducts.ts
│   │   ├── useInventory.ts
│   │   ├── useSales.ts
│   │   ├── useReports.ts
│   │   ├── useLocalStorage.ts
│   │   ├── useDebounce.ts
│   │   └── usePermissions.ts
│   ├── services/              # خدمات API
│   │   ├── api/
│   │   │   ├── axios.ts       # إعداد Axios
│   │   │   ├── interceptors.ts # Interceptors
│   │   │   └── index.ts
│   │   ├── auth.ts            # خدمات المصادقة
│   │   ├── products.ts        # خدمات المنتجات
│   │   ├── inventory.ts       # خدمات المخزون
│   │   ├── sales.ts           # خدمات المبيعات
│   │   ├── purchases.ts       # خدمات المشتريات
│   │   ├── customers.ts       # خدمات العملاء
│   │   ├── suppliers.ts       # خدمات الموردين
│   │   ├── users.ts           # خدمات المستخدمين
│   │   ├── branches.ts        # خدمات الفروع
│   │   ├── reports.ts         # خدمات التقارير
│   │   └── settings.ts        # خدمات الإعدادات
│   ├── store/                 # إدارة الحالة العامة
│   │   ├── authStore.ts       # حالة المصادقة
│   │   ├── uiStore.ts         # حالة واجهة المستخدم
│   │   ├── appStore.ts        # حالة التطبيق العامة
│   │   ├── notificationStore.ts # حالة الإشعارات
│   │   └── index.ts
│   ├── utils/                 # أدوات مساعدة
│   │   ├── constants.ts       # الثوابت
│   │   ├── helpers.ts         # دوال مساعدة
│   │   ├── validation.ts      # التحقق من البيانات
│   │   ├── formatters.ts      # تنسيق البيانات
│   │   ├── dateUtils.ts       # أدوات التاريخ
│   │   ├── currencyUtils.ts   # أدوات العملة
│   │   └── fileUtils.ts       # أدوات الملفات
│   ├── types/                 # أنواع TypeScript
│   │   ├── api.ts             # أنواع API
│   │   ├── models.ts          # نماذج البيانات
│   │   ├── ui.ts              # أنواع واجهة المستخدم
│   │   ├── forms.ts           # أنواع النماذج
│   │   └── index.ts
│   ├── locales/               # ملفات الترجمة
│   │   ├── ar/
│   │   │   ├── common.json
│   │   │   ├── dashboard.json
│   │   │   ├── products.json
│   │   │   └── index.ts
│   │   ├── en/
│   │   │   ├── common.json
│   │   │   ├── dashboard.json
│   │   │   ├── products.json
│   │   │   └── index.ts
│   │   └── i18n.ts            # إعداد i18next
│   ├── App.tsx
│   ├── main.tsx
│   ├── index.css
│   └── vite-env.d.ts
├── tests/                     # ملفات الاختبار
│   ├── setup.ts
│   ├── utils/
│   ├── components/
│   ├── hooks/
│   └── e2e/
├── docs/                      # التوثيق
│   ├── README.md
│   ├── CHANGELOG.md
│   └── API.md
├── scripts/                   # سكريبتات مساعدة
│   ├── build.sh
│   ├── deploy.sh
│   └── generate-types.sh
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
├── vite.config.ts
├── eslint.config.js
├── prettier.config.js
├── index.html
└── README.md
```

---

## 9. أمثلة كود للمكونات الأساسية (Code Examples)

### 9.1 مثال على مكون React مع TypeScript
```typescript
// components/common/Button/Button.tsx
import React from 'react';
import { Button as MuiButton, ButtonProps as MuiButtonProps } from '@mui/material';
import { styled } from '@mui/material/styles';

export interface ButtonProps extends Omit<MuiButtonProps, 'variant'> {
  variant?: 'primary' | 'secondary' | 'success' | 'error' | 'warning';
  loading?: boolean;
}

const StyledButton = styled(MuiButton)<{ customVariant: string }>(
  ({ theme, customVariant }) => ({
    borderRadius: theme.spacing(1),
    textTransform: 'none',
    fontWeight: 600,
    ...(customVariant === 'primary' && {
      backgroundColor: theme.palette.primary.main,
      color: theme.palette.primary.contrastText,
      '&:hover': {
        backgroundColor: theme.palette.primary.dark,
      },
    }),
    // باقي التنسيقات...
  })
);

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  loading = false,
  children,
  disabled,
  ...props
}) => {
  return (
    <StyledButton
      customVariant={variant}
      variant="contained"
      disabled={disabled || loading}
      {...props}
    >
      {loading ? 'جارٍ التحميل...' : children}
    </StyledButton>
  );
};

export default Button;
```

### 9.2 مثال على Hook مخصص
```typescript
// hooks/useProducts.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { productsApi } from '@/services/products';
import { Product, ProductFilters } from '@/types/models';

export const useProducts = (filters?: ProductFilters) => {
  const queryClient = useQueryClient();

  // جلب المنتجات
  const {
    data: productsData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['products', filters],
    queryFn: () => productsApi.getProducts(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // إنشاء منتج جديد
  const createMutation = useMutation({
    mutationFn: productsApi.createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  // تحديث منتج
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Product> }) =>
      productsApi.updateProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  // حذف منتج
  const deleteMutation = useMutation({
    mutationFn: productsApi.deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  // حساب إحصائيات المنتجات
  const stats = useMemo(() => {
    if (!productsData?.data) return null;

    return {
      total: productsData.total,
      active: productsData.data.filter(p => p.isActive).length,
      inactive: productsData.data.filter(p => !p.isActive).length,
      lowStock: productsData.data.filter(p => p.stockQuantity <= p.reorderPoint).length,
    };
  }, [productsData]);

  return {
    products: productsData?.data || [],
    total: productsData?.total || 0,
    stats,
    isLoading,
    error,
    refetch,
    createProduct: createMutation.mutate,
    updateProduct: updateMutation.mutate,
    deleteProduct: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};
```

### 9.3 مثال على خدمة API
```typescript
// services/products.ts
import { api } from './api';
import { Product, ProductFilters, CreateProductDto, UpdateProductDto } from '@/types/models';

export const productsApi = {
  // جلب المنتجات مع الفلاتر
  async getProducts(filters?: ProductFilters) {
    const params = new URLSearchParams();

    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.search) params.append('search', filters.search);
    if (filters?.categoryId) params.append('categoryId', filters.categoryId);
    if (filters?.isActive !== undefined) params.append('isActive', filters.isActive.toString());

    const response = await api.get(`/products?${params}`);
    return response.data;
  },

  // جلب منتج بالمعرف
  async getProduct(id: string): Promise<Product> {
    const response = await api.get(`/products/${id}`);
    return response.data.data;
  },

  // إنشاء منتج جديد
  async createProduct(data: CreateProductDto): Promise<Product> {
    const response = await api.post('/products', data);
    return response.data.data;
  },

  // تحديث منتج
  async updateProduct(id: string, data: UpdateProductDto): Promise<Product> {
    const response = await api.patch(`/products/${id}`, data);
    return response.data.data;
  },

  // حذف منتج
  async deleteProduct(id: string): Promise<void> {
    await api.delete(`/products/${id}`);
  },

  // رفع صورة المنتج
  async uploadProductImage(productId: string, file: File): Promise<string> {
    const formData = new FormData();
    formData.append('image', file);

    const response = await api.post(`/products/${productId}/upload-image`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.data.imageUrl;
  },

  // جلب فئات المنتجات
  async getCategories() {
    const response = await api.get('/products/categories');
    return response.data.data;
  },
};
```

### 9.4 مثال على نموذج React Hook Form مع Zod
```typescript
// components/ui/Forms/ProductForm.tsx
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Box,
  Grid,
} from '@mui/material';
import { Product, Category } from '@/types/models';

const productSchema = z.object({
  name: z.string().min(1, 'اسم المنتج مطلوب').max(100, 'اسم المنتج طويل جداً'),
  description: z.string().max(500, 'الوصف طويل جداً').optional(),
  barcode: z.string().optional(),
  categoryId: z.string().min(1, 'الفئة مطلوبة'),
  basePrice: z.number().min(0, 'السعر يجب أن يكون أكبر من أو يساوي صفر'),
  costPrice: z.number().min(0, 'تكلفة الشراء يجب أن تكون أكبر من أو تساوي صفر'),
  reorderPoint: z.number().min(0, 'نقطة إعادة الطلب يجب أن تكون أكبر من أو تساوي صفر'),
  isActive: z.boolean(),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormProps {
  product?: Product;
  categories: Category[];
  onSubmit: (data: ProductFormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export const ProductForm: React.FC<ProductFormProps> = ({
  product,
  categories,
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: product?.name || '',
      description: product?.description || '',
      barcode: product?.barcode || '',
      categoryId: product?.categoryId || '',
      basePrice: product?.basePrice || 0,
      costPrice: product?.costPrice || 0,
      reorderPoint: product?.reorderPoint || 0,
      isActive: product?.isActive ?? true,
    },
  });

  const onFormSubmit = async (data: ProductFormData) => {
    await onSubmit(data);
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onFormSubmit)} sx={{ mt: 2 }}>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="اسم المنتج"
            {...register('name')}
            error={!!errors.name}
            helperText={errors.name?.message}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <FormControl fullWidth error={!!errors.categoryId}>
            <InputLabel>الفئة</InputLabel>
            <Select
              {...register('categoryId')}
              label="الفئة"
              value={watch('categoryId')}
              onChange={(e) => setValue('categoryId', e.target.value)}
            >
              {categories.map((category) => (
                <MenuItem key={category.id} value={category.id}>
                  {category.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="الوصف"
            {...register('description')}
            error={!!errors.description}
            helperText={errors.description?.message}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            type="number"
            label="السعر الأساسي"
            {...register('basePrice', { valueAsNumber: true })}
            error={!!errors.basePrice}
            helperText={errors.basePrice?.message}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            type="number"
            label="تكلفة الشراء"
            {...register('costPrice', { valueAsNumber: true })}
            error={!!errors.costPrice}
            helperText={errors.costPrice?.message}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            type="number"
            label="نقطة إعادة الطلب"
            {...register('reorderPoint', { valueAsNumber: true })}
            error={!!errors.reorderPoint}
            helperText={errors.reorderPoint?.message}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="الباركود"
            {...register('barcode')}
            error={!!errors.barcode}
            helperText={errors.barcode?.message}
          />
        </Grid>

        <Grid item xs={12}>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button type="button" onClick={onCancel} disabled={loading}>
              إلغاء
            </Button>
            <Button type="submit" variant="contained" loading={loading}>
              {product ? 'تحديث' : 'إنشاء'}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};
```

### 9.5 مثال على مكون لوحة المؤشرات
```typescript
// pages/Dashboard/Dashboard.tsx
import React from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  LinearProgress,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Inventory,
  People,
  AttachMoney,
} from '@mui/icons-material';
import { useDashboard } from './Dashboard.hooks';
import { KPICard } from '@/components/ui/Dashboard/KPICard';
import { SalesChart } from '@/components/ui/Dashboard/SalesChart';
import { InventoryAlerts } from '@/components/ui/Dashboard/InventoryAlerts';

export const Dashboard: React.FC = () => {
  const {
    kpis,
    salesData,
    inventoryAlerts,
    isLoading,
    error,
  } = useDashboard();

  if (isLoading) {
    return <LinearProgress />;
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">
          حدث خطأ في تحميل البيانات: {error.message}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        لوحة المؤشرات
      </Typography>

      {/* مؤشرات الأداء الرئيسية */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="إجمالي المبيعات"
            value={kpis?.totalSales || 0}
            icon={<AttachMoney />}
            color="primary"
            format="currency"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="عدد الفواتير"
            value={kpis?.totalInvoices || 0}
            icon={<ShoppingCart />}
            color="secondary"
            trend={kpis?.invoiceTrend}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="المخزون المنخفض"
            value={kpis?.lowStockItems || 0}
            icon={<Inventory />}
            color="warning"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="العملاء النشطين"
            value={kpis?.activeCustomers || 0}
            icon={<People />}
            color="success"
          />
        </Grid>
      </Grid>

      {/* الرسوم البيانية */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              اتجاهات المبيعات
            </Typography>
            <SalesChart data={salesData} />
          </Paper>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              تنبيهات المخزون
            </Typography>
            <InventoryAlerts alerts={inventoryAlerts} />
          </Paper>
        </Grid>
      </Grid>

      {/* إحصائيات إضافية */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                أفضل المنتجات مبيعاً
              </Typography>
              {/* قائمة أفضل المنتجات */}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                آخر العمليات
              </Typography>
              {/* قائمة آخر العمليات */}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
```

---

## 10. إرشادات التطوير (Development Guidelines)

### 10.1 اتفاقيات التسمية (Naming Conventions)
```typescript
// مكونات React - PascalCase
export const UserProfile: React.FC = () => {};
export const ProductCard: React.FC = () => {};

// ملفات المكونات - PascalCase
UserProfile.tsx
ProductCard.tsx

// مجلدات المكونات - PascalCase
UserProfile/
ProductCard/

// Hooks - camelCase مع use
export const useAuth = () => {};
export const useProducts = () => {};

// ملفات Hooks
useAuth.ts
useProducts.ts

// Services - camelCase مع Api
export const productsApi = {};
export const usersApi = {};

// ملفات Services
products.ts
users.ts

// Types - PascalCase
export interface User {};
export type ProductStatus = 'active' | 'inactive';

// ملفات Types
user.ts
product.ts

// Utils - camelCase
export const formatCurrency = () => {};
export const validateEmail = () => {};
```

### 10.2 إرشادات كتابة الكود (Code Writing Guidelines)
```typescript
// ✅ جيد - استخدام TypeScript types
interface User {
  id: string;
  name: string;
  email: string;
}

const UserCard: React.FC<{ user: User }> = ({ user }) => {
  return <div>{user.name}</div>;
};

// ✅ جيد - استخدام custom hooks
const ProductList: React.FC = () => {
  const { products, isLoading, error } = useProducts();

  if (isLoading) return <Spinner />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <div>
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
};

// ✅ جيد - فصل المنطق من الواجهة
const ProductForm: React.FC = () => {
  const { handleSubmit, register, errors } = useProductForm();

  return (
    <form onSubmit={handleSubmit}>
      <input {...register('name')} />
      {errors.name && <span>{errors.name.message}</span>}
    </form>
  );
};

// ❌ سيء - وضع المنطق في المكون
const BadProductForm: React.FC = () => {
  const [name, setName] = useState('');
  const [errors, setErrors] = useState({});

  const handleSubmit = async () => {
    // منطق معقد هنا
  };

  return (
    <form onSubmit={handleSubmit}>
      <input value={name} onChange={e => setName(e.target.value)} />
    </form>
  );
};
```

### 10.3 إرشادات إدارة الحالة (State Management Guidelines)
```typescript
// ✅ جيد - استخدام React Query للبيانات من الخادم
const useProducts = () => {
  return useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// ✅ جيد - استخدام Zustand للحالة العامة
const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  login: async (credentials) => {
    const user = await authApi.login(credentials);
    set({ user, isAuthenticated: true });
  },
  logout: () => {
    set({ user: null, isAuthenticated: false });
  },
}));

// ✅ جيد - استخدام local state للمكونات
const ProductForm: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: ProductFormData) => {
    setIsSubmitting(true);
    try {
      await createProduct(data);
    } finally {
      setIsSubmitting(false);
    }
  };
};
```

### 10.4 إرشادات الأداء (Performance Guidelines)
```typescript
// ✅ جيد - استخدام React.memo للمكونات الثابتة
const ProductCard = React.memo<ProductCardProps>(({ product }) => {
  return <div>{product.name}</div>;
});

// ✅ جيد - استخدام useMemo للحسابات المكلفة
const ProductList: React.FC = () => {
  const filteredProducts = useMemo(() => {
    return products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

  return (
    <div>
      {filteredProducts.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
};

// ✅ جيد - استخدام useCallback للدوال
const ProductActions: React.FC = () => {
  const handleEdit = useCallback((productId: string) => {
    navigate(`/products/${productId}/edit`);
  }, [navigate]);

  return <button onClick={() => handleEdit(product.id)}>تعديل</button>;
};

// ✅ جيد - تحميل تدريجي للمكونات
const ProductDetails = lazy(() => import('./ProductDetails'));

const ProductsPage: React.FC = () => {
  return (
    <Suspense fallback={<Spinner />}>
      <ProductDetails />
    </Suspense>
  );
};
```

### 10.5 إرشادات الاختبار (Testing Guidelines)
```typescript
// اختبار مكون
describe('ProductCard', () => {
  const mockProduct: Product = {
    id: '1',
    name: 'Test Product',
    price: 100,
  };

  it('should render product name', () => {
    render(<ProductCard product={mockProduct} />);
    expect(screen.getByText('Test Product')).toBeInTheDocument();
  });

  it('should call onEdit when edit button is clicked', () => {
    const mockOnEdit = jest.fn();
    render(<ProductCard product={mockProduct} onEdit={mockOnEdit} />);

    fireEvent.click(screen.getByRole('button', { name: /تعديل/i }));
    expect(mockOnEdit).toHaveBeenCalledWith('1');
  });
});

// اختبار hook
describe('useProducts', () => {
  it('should return products data', async () => {
    const mockProducts = [{ id: '1', name: 'Product 1' }];
    mockAxios.get.mockResolvedValue({ data: mockProducts });

    const { result } = renderHook(() => useProducts(), {
      wrapper: QueryClientProvider,
    });

    await waitFor(() => {
      expect(result.current.products).toEqual(mockProducts);
    });
  });
});

// اختبار API
describe('productsApi', () => {
  it('should create product', async () => {
    const newProduct = { name: 'New Product', price: 50 };
    const createdProduct = { id: '1', ...newProduct };

    mockAxios.post.mockResolvedValue({
      data: { data: createdProduct }
    });

    const result = await productsApi.createProduct(newProduct);
    expect(result).toEqual(createdProduct);
    expect(mockAxios.post).toHaveBeenCalledWith('/products', newProduct);
  });
});
```

---

## 11. أفضل الممارسات (Best Practices)

### 11.1 هيكل المشروع (Project Structure)
- **فصل المسؤوليات**: كل ملف له غرض واحد واضح
- **التجميع حسب الميزة**: ربط الملفات المتعلقة بميزة واحدة
- **استخدام الـ aliases**: للوصول السريع للملفات
- **تجنب التداخل**: فصل المنطق من العرض

### 11.2 إدارة الحالة (State Management)
- **React Query**: للبيانات من الخادم
- **Zustand**: للحالة العامة البسيطة
- **Local State**: للحالات المؤقتة في المكونات
- **Context**: للبيانات المشتركة بين مكونات قريبة

### 11.3 الأداء (Performance)
- **Code Splitting**: تحميل المكونات عند الحاجة
- **Memoization**: تجنب إعادة الحساب غير الضرورية
- **Virtual Scrolling**: للقوائم الكبيرة
- **Image Optimization**: ضغط وتحسين الصور

### 11.4 الأمان (Security)
- **Input Validation**: التحقق من جميع المدخلات
- **XSS Protection**: sanitization للمحتوى
- **CSRF Protection**: رموز أمان للنماذج
- **Secure Headers**: إعداد headers الأمان

### 11.5 إمكانية الوصول (Accessibility)
- **Semantic HTML**: استخدام العناصر المناسبة
- **ARIA Labels**: للمكونات التفاعلية
- **Keyboard Navigation**: دعم التنقل بالكيبورد
- **Screen Readers**: دعم قارئات الشاشة

### 11.6 التدويل (Internationalization)
- **i18next**: لإدارة الترجمات
- **RTL Support**: للغات من اليمين لليسار
- **Date/Currency Formatting**: حسب المنطقة
- **Pluralization**: دعم الصيغ المختلفة للجموع

---

## 12. دليل استكشاف الأخطاء (Troubleshooting Guide)

### 12.1 مشاكل شائعة في React
```typescript
// مشكلة: إعادة الرسم غير الضرورية
// الحل: استخدام React.memo و useMemo
const ProductList = React.memo(() => {
  const filteredProducts = useMemo(() => {
    return products.filter(/* فلترة */);
  }, [products, searchTerm]);

  return <div>{/* محتوى */}</div>;
});

// مشكلة: تسريب الذاكرة في useEffect
// الحل: تنظيف الاشتراكات
useEffect(() => {
  const subscription = someApi.subscribe(callback);
  return () => subscription.unsubscribe();
}, []);

// مشكلة: تحديثات الحالة غير متزامنة
// الحل: استخدام callback في setState
setProducts(prevProducts => [...prevProducts, newProduct]);
```

### 12.2 مشاكل في API calls
```typescript
// مشكلة: Race conditions في البحث
// الحل: إلغاء الطلبات السابقة
const useSearch = (query: string) => {
  return useQuery({
    queryKey: ['search', query],
    queryFn: () => searchApi.search(query),
    enabled: query.length > 2,
  });
};

// مشكلة: فشل الشبكة
// الحل: إعادة المحاولة مع exponential backoff
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.code === 'NETWORK_ERROR') {
      // إعادة المحاولة
      return new Promise((resolve) => {
        setTimeout(() => resolve(api.request(error.config)), 1000);
      });
    }
    return Promise.reject(error);
  }
);
```

### 12.3 مشاكل في النماذج
```typescript
// مشكلة: validation غير فعالة
// الحل: استخدام schema validation
const schema = z.object({
  email: z.string().email('بريد إلكتروني غير صحيح'),
  password: z.string().min(8, 'كلمة المرور قصيرة جداً'),
});

const {
  register,
  handleSubmit,
  formState: { errors },
} = useForm({
  resolver: zodResolver(schema),
});

// مشكلة: تحديث الحقول المتداخلة
// الحل: استخدام setValue مع shouldValidate
const handleCategoryChange = (categoryId: string) => {
  setValue('categoryId', categoryId, { shouldValidate: true });
  setValue('subcategoryId', '', { shouldValidate: true });
};
```

### 12.4 مشاكل في الأداء
```bash
# فحص حجم البناء
npm run build -- --analyze

# فحص الحزم الكبيرة
npx vite-bundle-analyzer dist

# تشغيل Lighthouse
npx lighthouse http://localhost:3000
```

### 12.5 مشاكل في PWA
```typescript
// مشكلة: Service Worker غير مسجل
// الحل: فحص التسجيل
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
    .then(registration => console.log('SW registered'))
    .catch(error => console.log('SW registration failed'));
}

// مشكلة: الكاش لا يعمل
// الحل: فحص Cache Storage
caches.open('my-cache-v1').then(cache => {
  return cache.keys().then(requests => {
    console.log('Cached requests:', requests);
  });
});
```

---

## 13. قائمة المهام والتطوير (Development Checklist)

### 13.1 قبل البدء في التطوير
- [ ] قراءة متطلبات الميزة بالتفصيل
- [ ] فهم تأثير الميزة على تجربة المستخدم
- [ ] مراجعة التصميم مع مصمم الـ UX
- [ ] إنشاء تذكرة في نظام التتبع
- [ ] كتابة اختبارات قبول (Acceptance Criteria)

### 13.2 أثناء التطوير
- [ ] إنشاء مكونات React مع TypeScript
- [ ] كتابة اختبارات unit للوظائف
- [ ] تطبيق validation لجميع النماذج
- [ ] إضافة error handling مناسب
- [ ] تحسين الأداء (lazy loading, memoization)
- [ ] اختبار إمكانية الوصول (accessibility)
- [ ] التأكد من الاستجابة على جميع الأجهزة

### 13.3 قبل دمج الكود (Pre-Merge)
- [ ] تشغيل جميع الاختبارات (unit, integration, e2e)
- [ ] فحص TypeScript للأخطاء
- [ ] فحص ESLint لانتهاكات القواعد
- [ ] فحص Lighthouse للأداء
- [ ] اختبار يدوي شامل للميزة
- [ ] مراجعة الكود من قبل مطور آخر
- [ ] تحديث التوثيق

### 13.4 بعد النشر (Post-Deployment)
- [ ] مراقبة السجلات للأخطاء
- [ ] فحص مقاييس الأداء
- [ ] التحقق من عمل الميزة في الإنتاج
- [ ] جمع ملاحظات المستخدمين
- [ ] توثيق أي مشاكل وإصلاحها

---

## 14. المراجع والموارد (References & Resources)

### 14.1 التوثيق الرسمي
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Material-UI Documentation](https://mui.com/material-ui/getting-started/)
- [React Hook Form](https://react-hook-form.com/)
- [TanStack Query](https://tanstack.com/query/v4)

### 14.2 أدوات مفيدة
- [Vite](https://vitejs.dev/) - أداة البناء السريعة
- [Storybook](https://storybook.js.org/) - توثيق المكونات
- [React DevTools](https://react.dev/learn/react-developer-tools) - أدوات التطوير
- [Lighthouse](https://developers.google.com/web/tools/lighthouse) - فحص الأداء

### 14.3 مكتبات إضافية موصى بها
- [React Table](https://react-table.tanstack.com/) - جداول متقدمة
- [React Dropzone](https://react-dropzone.js.org/) - رفع الملفات
- [React Date Picker](https://reactdatepicker.com/) - اختيار التواريخ
- [React Toastify](https://fkhadra.github.io/react-toastify/) - إشعارات

### 14.4 موارد التعلم
- [React Patterns](https://reactpatterns.com/) - أنماط React الشائعة
- [JavaScript Info](https://javascript.info/) - شرح مفاهيم JavaScript
- [CSS Tricks](https://css-tricks.com/) - حلول CSS
- [Web.dev](https://web.dev/) - أفضل ممارسات الويب

---

هذا الدليل يوفر إرشادات شاملة لبناء الفرونت إند بطريقة احترافية ومنظمة. استخدمه كمرجع أساسي أثناء التطوير وأضف إليه حسب احتياجات المشروع.
