# C4 Model — نظام نقاط بيع شامل (POS Platform)
> هذا المستند بصيغة **Markdown** ويحتوي على مخططات **Mermaid (mmd)** وفق مستويات C4 (Context, Container, Component, Deployment + Dynamic).  
> المكوّنات مستخلصة من نطاق العمل: POS للصراف، مرتجعات، مخزون، مشتريات، محاسبة أساسية، تقارير، أمان متقدم، Offline‑First، تكاملات دفع/رسائل، طباعة حرارية.

---

## Level 1 — System Context (نطاق النظام وعلاقاته)
```mermaid
C4Context
title POS Platform — System Context

Person_Ext(customer, "العميل", "يتلقى فواتير/إشعارات ويُراجع مشترياته")
Person(cashier, "الصراف", "يجري عمليات البيع من واجهة نقاط البيع POS")
Person(manager, "مدير الفرع/النظام", "يدير الأصناف والمخزون والصلاحيات والتقارير")
Person(accountant, "المحاسب", "يراجع القيود والسندات والتقارير المحاسبية")

System_Boundary(pos, "POS Platform") {
  System(system, "نظام نقاط البيع", "PWA + Admin + API", "بيع، مرتجعات، مخزون، مشتريات، محاسبة، تقارير، Offline")
}

System_Ext(payment, "بوابة الدفع", "معالجة مدفوعات البطاقة/المحفظة")
System_Ext(sms, "موفّر الرسائل/البريد", "OTP/إشعارات/مشاركة فواتير")
System_Ext(ext_acc, "نظام محاسبي خارجي (اختياري)", "تكامل محاسبي بديل")
System_Ext(whatsapp, "واجهة واتساب للأعمال (اختياري)", "مشاركة روابط الفواتير/الإشعارات")

Rel(cashier, system, "يستخدم لإتمام عمليات البيع/الإرجاع")
Rel(manager, system, "إدارة أصناف/أسعار/ضرائب/مخزون/مستخدمين/تقارير")
Rel(accountant, system, "مراجعة القيود والسندات/التسويات/الإقفال")
Rel(system, customer, "إرسال فواتير/إشعارات", "رابط/QR/ملف PDF")
Rel(system, payment, "معالجة المدفوعات", "HTTPS/API")
Rel(system, sms, "إرسال OTP/إشعارات", "HTTPS/API")
Rel(system, whatsapp, "مشاركة روابط الفواتير", "HTTPS/API")
Rel(system, ext_acc, "تكامل محاسبي (إن فُعِّل)", "HTTPS/API")
```
---

## Level 2 — Container Diagram (حاويات النظام)
```mermaid
C4Container
title POS Platform — Containers

Person(cashier, "الصراف")
Person(manager, "مدير النظام")
Person(accountant, "المحاسب")

System_Boundary(pos, "POS Platform") {
  Container(pwa, "POS Frontend (PWA)", "React/TS + IndexedDB", "واجهة الصراف، Offline‑First، كاميرا باركود، طباعة/مشاركة")
  Container(admin, "Admin Dashboard", "React/TS", "لوحة إدارة المنتجات/الأسعار/المخازن/المستخدمين/التقارير")
  Container(api, "Backend API", "NestJS (REST/OpenAPI)", "خدمات المبيعات، المرتجعات، المخزون، المشتريات، المحاسبة، التقارير")
  Container(sync, "Sync/Worker", "Node + Queues", "طوابير مزامنة، معالجة تغييرات Offline، حل التعارضات")
  ContainerDb(db, "Relational DB", "PostgreSQL", "بيانات أساسية/حركات/قيود/سندات/تقارير")
  Container(cache, "Cache/Queue", "Redis", "Caching، Pub/Sub، طوابير مهام")
  Container(store, "Object Storage", "S3-compatible", "حفظ PDF الفواتير/التقارير والقوالب")
  Container(monitor, "Observability", "APM/Logs/Metrics", "مراقبة، سجلات، تنبيهات")
  Container(printBridge, "Print Bridge (اختياري)", "Desktop Service", "جسر طباعة ESC/POS/USB عند الحاجة")
  Container(adapterPay, "Payment Adapter", "Service/Module", "تغليف تكامل بوابة الدفع")
  Container(adapterNotif, "Notification Adapter", "Service/Module", "SMS/Email/WhatsApp")
}

System_Ext(payment, "بوابة الدفع", "API")
System_Ext(sms, "SMS/Email Provider", "API")
System_Ext(whatsapp, "WhatsApp Business", "API")

Rel(cashier, pwa, "استخدام يومي")
Rel(manager, admin, "إدارة وتشغيل")
Rel(accountant, admin, "مراجعات محاسبية")

Rel(pwa, api, "REST/JSON")
Rel(admin, api, "REST/JSON")
Rel(api, db, "ORM/SQL", "CRUD/Queries")
Rel(api, cache, "Cache/Queues")
Rel(sync, db, "Change Feed/SQL")
Rel(sync, cache, "Queues (Jobs)")
Rel(api, store, "رفع/قراءة ملفات PDF/قوالب")
Rel(api, adapterPay, "معالجة دفع")
Rel(api, adapterNotif, "إرسال إشعارات")
Rel(adapterPay, payment, "HTTPS/API")
Rel(adapterNotif, sms, "HTTPS/API")
Rel(adapterNotif, whatsapp, "HTTPS/API")
Rel(pwa, printBridge, "طباعة حرارية (محلي)")
```

---

## Level 3 — Component Diagram (داخل Backend API)
```mermaid
C4Component
title Backend API (NestJS) — Components

Container(api, "Backend API", "NestJS") {
  Component(gateway, "API Gateway", "HTTP Controllers", "REST/OpenAPI، تفويض/تحقق")
  Component(auth, "Auth & RBAC", "Guards/Policies", "JWT/2FA/WebAuthn، أدوار وصلاحيات")
  Component(sales, "Sales (Invoices)", "Module", "إنشاء/تعديل/طباعة/مشاركة فواتير")
  Component(returns, "Returns", "Module", "إرجاع كلي/جزئي، قيود وعكس حركة مخزون")
  Component(inventory, "Inventory", "Module", "أصناف، مخازن، حركات، تحويلات، جرد")
  Component(purchase, "Purchasing", "Module", "موردون، فواتير مشتريات، شروط دفع")
  Component(accounting, "Accounting (GL)", "Module", "دليل حسابات، قيود، سندات، إقفال")
  Component(reporting, "Reporting", "Module", "تقارير ولوحة مؤشرات، PDF/Excel")
  Component(syncMgr, "Sync Manager", "Module", "توليد تغييرات/ChangeSet، حل تعارضات")
  Component(payAdapter, "Payment Adapter", "Module", "بوابة الدفع")
  Component(notifAdapter, "Notification Adapter", "Module", "SMS/Email/WhatsApp")
  Component(audit, "Audit & Logs", "Module", "سجلات دقيقة (من/متى/ماذا/قبل-بعد)")
  Component(common, "Common/Shared", "Lib", "DTOs/Validators/Mappers")
}

ContainerDb(db, "PostgreSQL", "Relational")
Container(cache, "Redis", "Cache/Queues")
Container(store, "Object Storage (S3)", "Files")

Rel(gateway, auth, "تحقق/تفويض")
Rel(gateway, sales, "API calls")
Rel(gateway, returns, "API calls")
Rel(gateway, inventory, "API calls")
Rel(gateway, purchase, "API calls")
Rel(gateway, accounting, "API calls")
Rel(gateway, reporting, "API calls")

Rel(sales, accounting, "توليد قيود الإيرادات/الصندوق/الضريبة")
Rel(returns, accounting, "عكس الإيرادات/المخزون/الضريبة")
Rel(inventory, accounting, "تسويات/تكاليف")
Rel(purchase, accounting, "قيود المشتريات والموردين")
Rel(reporting, store, "توليد/قراءة PDF/Excel")
Rel(syncMgr, cache, "Queues/Events")
Rel(sales, db, "CRUD/Queries")
Rel(returns, db, "CRUD/Queries")
Rel(inventory, db, "CRUD/Queries")
Rel(purchase, db, "CRUD/Queries")
Rel(accounting, db, "CRUD/Queries")
Rel(reporting, db, "Queries/Aggregations")
Rel(audit, db, "Append-only logs")
Rel(payAdapter, cache, "Idempotency/Events")
Rel(payAdapter, db, "Tx records")
Rel(notifAdapter, cache, "Async send")
```

---

## Level 4 — Deployment Diagram (النشر والتشغيل)
```mermaid
C4Deployment
title POS Platform — Deployment (Reference)

Deployment_Node(client, "Client Devices", "Android/iOS/PC") {
  Deployment_Node(browser, "Browser/ WebView") {
    Container(pwa, "PWA (POS)", "React/TS + IndexedDB")
    Container(admin, "Admin Dashboard", "React/TS")
    Container(printBridge, "Print Bridge (اختياري)", "Desktop Service")
  }
  Deployment_Node(printer, "Thermal Printer", "Bluetooth/USB") {
    Container_Ext(escpos, "ESC/POS Printer", "80mm/58mm")
  }
}

Deployment_Node(cloud, "Cloud", "K8s/VMs") {
  Deployment_Node(app, "App Nodes", "Node.js") {
    Container(api, "Backend API", "NestJS")
    Container(sync, "Sync/Worker", "Node + Queue")
  }
  Deployment_Node(data, "Data Layer") {
    ContainerDb(db, "PostgreSQL", "HA/Backup")
    Container(cache, "Redis", "Cache/Queues")
    Container(store, "Object Storage", "S3-compatible")
  }
  Deployment_Node(obs, "Observability") {
    Container(monitor, "APM/Logs/Metrics", "Dashboards/Alerts")
  }
}

Deployment_Node(ext, "3rd Party Services") {
  Container_Ext(payment, "Payment Gateway", "HTTPS")
  Container_Ext(sms, "SMS/Email Provider", "HTTPS")
  Container_Ext(whatsapp, "WhatsApp Business", "HTTPS")
}

Rel(pwa, api, "HTTPS/REST")
Rel(admin, api, "HTTPS/REST")
Rel(api, db, "SQL")
Rel(api, cache, "TCP")
Rel(sync, cache, "Queues")
Rel(api, store, "S3 API")
Rel(api, payment, "HTTPS")
Rel(api, sms, "HTTPS")
Rel(api, whatsapp, "HTTPS")
Rel(printBridge, escpos, "USB/Serial/BLE")
```

---

## Dynamic — سيناريو: بيع Offline ثم مزامنة
```mermaid
C4Dynamic
title Offline sale then sync

Person(cashier, "الصراف")
Container(pwa, "POS PWA", "IndexedDB")
Container(api, "Backend API", "NestJS")
Container(sync, "Sync/Worker", "Queues")
ContainerDb(db, "PostgreSQL", "Relational")
Container(cache, "Redis", "Queues")

Rel(cashier, pwa, "1) يضيف أصناف ويدفع (بدون إنترنت)")
Rel(pwa, pwa, "2) يخزّن الفاتورة محلياً + علامات مزامنة")
Rel(pwa, api, "3) عند الاتصال: إرسال التغييرات (Batch)", "HTTPS")
Rel(api, db, "4) إنشاء سجل الفاتورة/الحركات ضمن معاملة")
Rel(api, cache, "5) نشر حدث 'InvoiceCreated'")
Rel(sync, cache, "6) يلتقط الحدث ويعالج تبعات/تنبيهات/تقارير")
Rel(sync, db, "7) تحديثات إضافية/تجميعات")
Rel(api, pwa, "8) إرجاع نتائج المزامنة وحالة الفاتورة")
```
