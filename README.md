# Zaytuna SaaS Project

نظام إدارة الأعمال الشامل - زيتونة SaaS

## نظرة عامة

منصة SaaS متكاملة لإدارة الأعمال التجارية في اليمن، تشمل إدارة المخزون، المبيعات، المشتريات، المحاسبة، والتقارير.

## الهيكل العام

```
zaytuna-project/
├── backend/           # الخادم الخلفي (NestJS)
├── frontend-customer/ # واجهة العملاء (React + TypeScript)
├── docs/             # التوثيق
└── README.md         # هذا الملف
```

## التقنيات المستخدمة

### الخلفية (Backend)
- **إطار العمل**: NestJS مع TypeScript
- **قاعدة البيانات**: PostgreSQL مع Prisma ORM
- **المصادقة**: JWT مع 2FA
- **التخزين المؤقت**: Redis
- **رسائل البريد**: NodeMailer
- **التوثيق**: Swagger/OpenAPI

### الواجهة الأمامية (Frontend)
- **إطار العمل**: React 18+ مع TypeScript
- **أداة البناء**: Vite
- **إدارة الحالة**: TanStack Query + Zustand
- **واجهة المستخدم**: Material-UI (MUI)
- **النماذج**: React Hook Form + Zod

## متطلبات النظام

- Node.js LTS (18+)
- PostgreSQL 15+
- Redis 7+
- Docker (اختياري)

## البدء السريع

### 1. استنساخ المشروع
```bash
git clone <repository-url>
cd zaytuna-project
```

### 2. إعداد الخلفية
```bash
cd backend
npm install
# إعداد قاعدة البيانات والمتغيرات البيئية
npm run start:dev
```

### 3. إعداد الواجهة الأمامية
```bash
cd ../frontend-customer
npm install
npm run dev
```

## التطوير

### الأوامر الشائعة

#### الخلفية
```bash
cd backend
npm run start:dev      # التطوير
npm run build         # البناء
npm run test          # الاختبارات
npm run migration:run # تشغيل المايقريشن
```

#### الواجهة الأمامية
```bash
cd frontend-customer
npm run dev           # التطوير
npm run build         # البناء
npm run lint          # فحص الكود
npm run format        # تنسيق الكود
```

## المساهمة

1. اقرأ [دليل المساهمة](docs/contribution-guide.md)
2. اتبع [معايير الكود](docs/coding-standards.md)
3. أنشئ فرع للميزة الجديدة
4. اختبر التغييرات
5. أرسل Pull Request

## الترخيص

هذا المشروع محمي بحقوق الطبع والنشر © 2024 BThwani

## التواصل

- **الموقع**: [bthwani.com](https://bthwani.com)
- **البريد**: contact@bthwani.com
- **التوثيق**: [docs.bthwani.com](https://docs.bthwani.com)
