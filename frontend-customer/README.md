# Frontend Customer - Zaytuna SaaS

لوحة تحكم زيتونة SaaS - واجهة العملاء (التجار)

## نظرة عامة

تطبيق React + TypeScript لبناء واجهة إدارية شاملة للعملاء في نظام زيتونة SaaS، يتضمن:
- لوحة تحكم إدارية شاملة
- واجهة الصراف (POS PWA)
- دعم كامل للعربية والإنجليزية

## التقنيات المستخدمة

- **إطار العمل**: React 18+ مع TypeScript
- **أداة البناء**: Vite
- **إدارة الحالة**: TanStack Query + Zustand
- **إدارة النماذج**: React Hook Form + Zod
- **واجهة المستخدم**: Material-UI (MUI) + Emotion
- **التوجيه**: React Router v6
- **الرسوم البيانية**: Recharts
- **التعريب**: i18next مع دعم RTL
- **إشعارات**: React Hot Toast

## متطلبات النظام

- Node.js LTS (18+)
- npm أو yarn

## التثبيت والإعداد

```bash
# تثبيت التبعيات
npm install

# تشغيل وضع التطوير
npm run dev

# بناء للإنتاج
npm run build

# معاينة البناء
npm run preview
```

## الأوامر المتاحة

```bash
# التطوير
npm run dev          # تشغيل الخادم المحلي
npm run build        # بناء المشروع للإنتاج
npm run preview      # معاينة البناء

# الجودة والتنسيق
npm run lint         # فحص الكود
npm run lint:fix     # إصلاح مشاكل الكود
npm run format       # تنسيق الكود
npm run format:check # فحص تنسيق الكود
```

## هيكل المشروع

```
src/
├── components/       # المكونات المشتركة
│   ├── common/      # مكونات عامة
│   ├── layout/      # تخطيط التطبيق
│   └── ui/          # مكونات واجهة المستخدم
├── pages/           # صفحات التطبيق
├── hooks/           # React Hooks مخصصة
├── services/        # خدمات API
├── store/           # إدارة الحالة العامة
├── utils/           # أدوات مساعدة
├── types/           # أنواع TypeScript
└── locales/         # ملفات الترجمة
```

## متغيرات البيئة

انسخ ملف `.env.example` إلى `.env` وقم بتحديث القيم حسب البيئة:

```bash
cp .env.example .env
```

## المساهمة

1. قم بعمل Fork للمشروع
2. أنشئ فرع للميزة الجديدة (`git checkout -b feature/new-feature`)
3. قم بالتزام التغييرات (`git commit -am 'Add new feature'`)
4. ادفع للفرع (`git push origin feature/new-feature`)
5. أنشئ Pull Request

## الترخيص

هذا المشروع محمي بحقوق الطبع والنشر © 2024 BThwani