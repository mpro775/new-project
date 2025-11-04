# C4 Model — نظام نقاط بيع شامل (POS Platform)

> هذا المستند بصيغة **Markdown** ويحتوي على مخططات **Mermaid** وفق مستويات C4 (Context, Container, Component, Deployment + Dynamic).  
> المكوّنات مستخلصة من نطاق العمل: POS للصراف، مرتجعات، مخزون، مشتريات، محاسبة أساسية، تقارير، أمان متقدم، Offline‑First، تكاملات دفع/رسائل، طباعة حرارية.

---

## محتويات المستند

1. [Level 1 — System Context](#level-1--system-context-نطاق-النظام-وعلاقاته)
2. [Level 2 — Container Diagram](#level-2--container-diagram-حاويات-النظام)
3. [Level 3 — Component Diagram](#level-3--component-diagram-داخل-backend-api)
4. [Level 4 — Deployment Diagram](#level-4--deployment-diagram-النشر-والتشغيل)
5. [Dynamic — سيناريو: بيع Offline ثم مزامنة](#dynamic--سيناريو-بيع-offline-ثم-مزامنة)

---

## Level 1 — System Context (نطاق النظام وعلاقاته)

يوضح هذا المستوى العلاقات بين النظام والأنظمة الخارجية والمستخدمين.

```mermaid
graph TB
    subgraph users["المستخدمون"]
        customer["👤 العميل<br/>يتلقى فواتير/إشعارات<br/>ويُراجع مشترياته"]
        cashier["👤 الصراف<br/>يجري عمليات البيع من<br/>واجهة نقاط البيع POS"]
        manager["👤 مدير الفرع/النظام<br/>يدير الأصناف والمخزون<br/>والصلاحيات والتقارير"]
        accountant["👤 المحاسب<br/>يراجع القيود والسندات<br/>والتقارير المحاسبية"]
    end
    
    subgraph posplatform["POS Platform"]
        system["🖥️ نظام نقاط البيع<br/>PWA + Admin + API<br/>بيع، مرتجعات، مخزون<br/>مشتريات، محاسبة، تقارير، Offline"]
    end
    
    subgraph externalsystems["الأنظمة الخارجية"]
        payment["💳 بوابة الدفع<br/>معالجة مدفوعات<br/>البطاقة/المحفظة"]
        sms["📱 موفّر الرسائل/البريد<br/>OTP/إشعارات<br/>مشاركة فواتير"]
        extacc["📊 نظام محاسبي خارجي<br/>اختياري<br/>تكامل محاسبي بديل"]
        whatsapp["💬 واتساب للأعمال<br/>اختياري<br/>مشاركة روابط الفواتير"]
    end
    
    cashier -->|يستخدم لإتمام<br/>عمليات البيع/الإرجاع| system
    manager -->|إدارة أصناف/أسعار/ضرائب<br/>مخزون/مستخدمين/تقارير| system
    accountant -->|مراجعة القيود والسندات<br/>التسويات/الإقفال| system
    system -->|إرسال فواتير/إشعارات<br/>رابط/QR/ملف PDF| customer
    system -->|معالجة المدفوعات<br/>HTTPS/API| payment
    system -->|إرسال OTP/إشعارات<br/>HTTPS/API| sms
    system -->|مشاركة روابط الفواتير<br/>HTTPS/API| whatsapp
    system -.->|تكامل محاسبي<br/>إن فُعِّل - HTTPS/API| extacc
    
    classDef userStyle fill:#08427b,stroke:#052e56,color:#fff,stroke-width:2px
    classDef systemStyle fill:#1168bd,stroke:#0b4884,color:#fff,stroke-width:3px
    classDef externalStyle fill:#999999,stroke:#6b6b6b,color:#fff,stroke-width:2px
    
    class customer,cashier,manager,accountant userStyle
    class system systemStyle
    class payment,sms,extacc,whatsapp externalStyle
```

---

## Level 2 — Container Diagram (حاويات النظام)

يوضح هذا المستوى الحاويات (التطبيقات والخدمات) التي تشكل النظام والعلاقات بينها.

```mermaid
graph TB
    subgraph users["المستخدمون"]
        cashier["👤 الصراف"]
        manager["👤 مدير النظام"]
        accountant["👤 المحاسب"]
    end
    
    subgraph posplatform["POS Platform"]
        subgraph frontend["Frontend Applications"]
            pwa["📱 POS Frontend PWA<br/>React/TS + IndexedDB<br/>واجهة الصراف، Offline‑First<br/>كاميرا باركود، طباعة/مشاركة"]
            admin["🖥️ Admin Dashboard<br/>React/TS<br/>لوحة إدارة المنتجات/الأسعار<br/>المخازن/المستخدمين/التقارير"]
        end
        
        subgraph backend["Backend Services"]
            api["⚙️ Backend API<br/>NestJS REST/OpenAPI<br/>خدمات المبيعات، المرتجعات<br/>المخزون، المشتريات، المحاسبة، التقارير"]
            sync["🔄 Sync/Worker<br/>Node + Queues<br/>طوابير مزامنة، معالجة تغييرات Offline<br/>حل التعارضات"]
        end
        
        subgraph data["Data Layer"]
            db[("💾 Relational DB<br/>PostgreSQL<br/>بيانات أساسية/حركات<br/>قيود/سندات/تقارير")]
            cache["⚡ Cache/Queue<br/>Redis<br/>Caching، Pub/Sub<br/>طوابير مهام"]
            store["📦 Object Storage<br/>S3-compatible<br/>حفظ PDF الفواتير<br/>التقارير والقوالب"]
        end
        
        subgraph adapters["Adapters & Integrations"]
            adapterpay["💳 Payment Adapter<br/>Service/Module<br/>تغليف تكامل بوابة الدفع"]
            adapternotif["📧 Notification Adapter<br/>Service/Module<br/>SMS/Email/WhatsApp"]
        end
        
        subgraph optional["Optional Services"]
            monitor["📊 Observability<br/>APM/Logs/Metrics<br/>مراقبة، سجلات، تنبيهات"]
            printbridge["🖨️ Print Bridge<br/>Desktop Service<br/>جسر طباعة ESC/POS/USB"]
        end
    end
    
    subgraph external["External Services"]
        payment["💳 بوابة الدفع<br/>API"]
        smsext["📱 SMS/Email Provider<br/>API"]
        whatsapp["💬 WhatsApp Business<br/>API"]
    end
    
    cashier -->|استخدام يومي| pwa
    manager -->|إدارة وتشغيل| admin
    accountant -->|مراجعات محاسبية| admin
    
    pwa -->|REST/JSON| api
    admin -->|REST/JSON| api
    api -->|ORM/SQL<br/>CRUD/Queries| db
    api -->|Cache/Queues| cache
    sync -->|Change Feed/SQL| db
    sync -->|Queues Jobs| cache
    api -->|رفع/قراءة ملفات<br/>PDF/قوالب| store
    api -->|معالجة دفع| adapterpay
    api -->|إرسال إشعارات| adapternotif
    adapterpay -->|HTTPS/API| payment
    adapternotif -->|HTTPS/API| smsext
    adapternotif -->|HTTPS/API| whatsapp
    pwa -.->|طباعة حرارية محلي| printbridge
    
    classDef userStyle fill:#08427b,stroke:#052e56,color:#fff,stroke-width:2px
    classDef containerStyle fill:#1168bd,stroke:#0b4884,color:#fff,stroke-width:2px
    classDef dataStyle fill:#438dd5,stroke:#2e6295,color:#fff,stroke-width:2px
    classDef externalStyle fill:#999999,stroke:#6b6b6b,color:#fff,stroke-width:2px
    
    class cashier,manager,accountant userStyle
    class pwa,admin,api,sync,adapterpay,adapternotif,monitor,printbridge containerStyle
    class db,cache,store dataStyle
    class payment,smsext,whatsapp externalStyle
```

---

## Level 3 — Component Diagram (داخل Backend API)

يوضح هذا المستوى المكوّنات الداخلية لـ Backend API والعلاقات بينها.

```mermaid
graph TB
    subgraph backendapi["Backend API - NestJS"]
        subgraph infrastructure["Infrastructure Layer"]
            gateway["🌐 API Gateway<br/>HTTP Controllers<br/>REST/OpenAPI endpoints، routing"]
            auth["🔐 Authentication & RBAC<br/>Guards/Policies<br/>JWT/2FA/WebAuthn<br/>أدوار وصلاحيات"]
            common["📚 Common Library<br/>Shared Lib<br/>DTOs/Validators/Mappers/Utilities"]
            audit["📝 Audit & Logging<br/>Service<br/>سجلات دقيقة<br/>من/متى/ماذا/قبل-بعد"]
        end
        
        subgraph business["Core Business Modules"]
            sales["💰 Sales Module<br/>Business Logic<br/>إنشاء/تعديل/طباعة<br/>مشاركة فواتير"]
            returns["↩️ Returns Module<br/>Business Logic<br/>إرجاع كلي/جزئي<br/>عكس حركة مخزون"]
            inventory["📦 Inventory Module<br/>Business Logic<br/>أصناف، مخازن، حركات<br/>تحويلات، جرد"]
            purchase["🛒 Purchasing Module<br/>Business Logic<br/>موردون، فواتير مشتريات<br/>شروط دفع"]
            accounting["📊 Accounting Module<br/>Business Logic<br/>دليل حسابات، قيود<br/>سندات، إقفال"]
            reporting["📈 Reporting Module<br/>Business Logic<br/>تقارير ولوحة مؤشرات<br/>PDF/Excel"]
        end
        
        subgraph integration["Integration & Sync"]
            syncmgr["🔄 Sync Manager<br/>Background Service<br/>مزامنة Offline، حل تعارضات<br/>ChangeSet"]
            payadapter["💳 Payment Adapter<br/>Integration Service<br/>تكامل بوابة الدفع"]
            notifadapter["📧 Notification Adapter<br/>Integration Service<br/>SMS/Email/WhatsApp"]
        end
    end
    
    subgraph external["External Data & Services"]
        db[("💾 PostgreSQL<br/>Relational Database")]
        cache["⚡ Redis<br/>Cache & Message Queue"]
        store["📦 Object Storage<br/>S3-compatible Files"]
    end
    
    gateway -->|التحقق والتفويض| auth
    gateway -->|POST/GET/PUT<br/>/api/sales| sales
    gateway -->|POST/GET<br/>/api/returns| returns
    gateway -->|POST/GET/PUT<br/>/api/inventory| inventory
    gateway -->|POST/GET<br/>/api/purchases| purchase
    gateway -->|POST/GET<br/>/api/accounting| accounting
    gateway -->|GET<br/>/api/reports| reporting
    
    sales -->|توليد قيود الإيرادات<br/>الصندوق/الضريبة| accounting
    returns -->|عكس الإيرادات<br/>المخزون/الضريبة| accounting
    inventory -->|تسويات/تكاليف<br/>المخزون| accounting
    purchase -->|قيود المشتريات<br/>والموردين| accounting
    
    sales -->|CRUD/Queries SQL| db
    returns -->|CRUD/Queries SQL| db
    inventory -->|CRUD/Queries SQL| db
    purchase -->|CRUD/Queries SQL| db
    accounting -->|CRUD/Queries SQL| db
    reporting -->|Queries/Aggregations SQL| db
    audit -->|Append-only logs SQL| db
    
    syncmgr -->|Queues/Events<br/>Pub/Sub| cache
    payadapter -->|Idempotency Keys/Events<br/>Redis| cache
    notifadapter -->|Async Queue<br/>Redis| cache
    
    payadapter -->|Transaction Records<br/>SQL| db
    
    reporting -->|توليد/قراءة<br/>PDF/Excel - S3 API| store
    
    classDef infraStyle fill:#438dd5,stroke:#2e6295,color:#fff,stroke-width:2px
    classDef businessStyle fill:#1168bd,stroke:#0b4884,color:#fff,stroke-width:2px
    classDef integrationStyle fill:#6b8e23,stroke:#556b2f,color:#fff,stroke-width:2px
    classDef dataStyle fill:#999999,stroke:#6b6b6b,color:#fff,stroke-width:2px
    
    class gateway,auth,common,audit infraStyle
    class sales,returns,inventory,purchase,accounting,reporting businessStyle
    class syncmgr,payadapter,notifadapter integrationStyle
    class db,cache,store dataStyle
```

---

## Level 4 — Deployment Diagram (النشر والتشغيل)

يوضح هذا المستوى كيفية نشر النظام والبنية التحتية المطلوبة لتشغيله.

```mermaid
graph TB
    subgraph clientdevices["Client Devices - Android/iOS/PC"]
        subgraph browser["Browser/WebView"]
            pwa["📱 PWA POS<br/>React/TS + IndexedDB"]
            admin["🖥️ Admin Dashboard<br/>React/TS"]
            printbridge["🖨️ Print Bridge<br/>Desktop Service<br/>اختياري"]
        end
        
        subgraph thermalprinter["Thermal Printer - Bluetooth/USB"]
            escpos["🖨️ ESC/POS Printer<br/>80mm/58mm"]
        end
    end
    
    subgraph cloudinfra["Cloud Infrastructure - K8s/VMs"]
        subgraph appnodes["App Nodes - Node.js"]
            api["⚙️ Backend API<br/>NestJS"]
            sync["🔄 Sync/Worker<br/>Node + Queue"]
        end
        
        subgraph datalayer["Data Layer"]
            db[("💾 PostgreSQL<br/>HA/Backup")]
            cache["⚡ Redis<br/>Cache/Queues"]
            store["📦 Object Storage<br/>S3-compatible"]
        end
        
        subgraph observability["Observability"]
            monitor["📊 APM/Logs/Metrics<br/>Dashboards/Alerts"]
        end
    end
    
    subgraph thirdparty["3rd Party Services"]
        payment["💳 Payment Gateway<br/>HTTPS"]
        sms["📱 SMS/Email Provider<br/>HTTPS"]
        whatsapp["💬 WhatsApp Business<br/>HTTPS"]
    end
    
    pwa -->|HTTPS/REST| api
    admin -->|HTTPS/REST| api
    api -->|SQL| db
    api -->|TCP| cache
    sync -->|Queues| cache
    api -->|S3 API| store
    api -->|HTTPS| payment
    api -->|HTTPS| sms
    api -->|HTTPS| whatsapp
    printbridge -.->|USB/Serial/BLE| escpos
    
    classDef clientStyle fill:#08427b,stroke:#052e56,color:#fff,stroke-width:2px
    classDef appStyle fill:#1168bd,stroke:#0b4884,color:#fff,stroke-width:2px
    classDef dataStyle fill:#438dd5,stroke:#2e6295,color:#fff,stroke-width:2px
    classDef externalStyle fill:#999999,stroke:#6b6b6b,color:#fff,stroke-width:2px
    
    class pwa,admin,printbridge,escpos clientStyle
    class api,sync,monitor appStyle
    class db,cache,store dataStyle
    class payment,sms,whatsapp externalStyle
```

---

## Dynamic — سيناريو: بيع Offline ثم مزامنة

يوضح هذا السيناريو التدفق التفصيلي لعملية البيع في وضع Offline ثم مزامنة البيانات مع الخادم عند عودة الاتصال.

```mermaid
sequenceDiagram
    participant الصراف
    participant PWA as POS PWA<br/>React/TS + IndexedDB
    participant API as Backend API<br/>NestJS
    participant DB as PostgreSQL<br/>Relational DB
    participant Cache as Redis<br/>Cache/Queues
    participant Sync as Sync/Worker<br/>Node + Queues
    
    Note over الصراف,PWA: وضع Offline - بدون اتصال بالإنترنت
    الصراف->>PWA: 1) يضيف أصناف ويدفع<br/>(بدون إنترنت)
    PWA->>PWA: حفظ البيانات محلياً<br/>في IndexedDB
    
    Note over PWA,API: عودة الاتصال بالإنترنت
    PWA->>API: 2) إرسال التغييرات المحفوظة محلياً<br/>(Batch) - HTTPS/REST
    
    Note over API,DB: معالجة البيانات
    API->>DB: 3) إنشاء سجل الفاتورة/الحركات<br/>ضمن معاملة - SQL Transaction
    DB-->>API: تأكيد الحفظ
    
    API->>Cache: 4) نشر حدث 'InvoiceCreated'<br/>Pub/Sub
    
    Note over Cache,Sync: معالجة غير متزامنة
    Cache->>Sync: 5) يلتقط الحدث ويعالج<br/>تبعات/تنبيهات/تقارير<br/>Event Consumer
    
    Sync->>DB: 6) تحديثات إضافية/تجميعات<br/>SQL Updates
    
    API-->>PWA: 7) إرجاع نتائج المزامنة<br/>وحالة الفاتورة - HTTPS/REST
    PWA-->>الصراف: تأكيد نجاح العملية
    
    Note over الصراف,Sync: العملية مكتملة ✓
```

---

## ملاحظات تقنية

### المزايا الرئيسية للنظام:

1. **Offline-First Architecture**: يعمل النظام بكفاءة دون اتصال بالإنترنت مع مزامنة تلقائية
2. **قابلية التوسع**: بنية موزعة تدعم النمو الأفقي
3. **الأمان المتقدم**: مصادقة متعددة العوامل وصلاحيات دقيقة
4. **التكامل السلس**: دعم متعدد لبوابات الدفع والإشعارات
5. **المراقبة والمتابعة**: نظام شامل للسجلات والتنبيهات

### التقنيات المستخدمة:

- **Frontend**: React, TypeScript, IndexedDB, PWA
- **Backend**: NestJS, Node.js, REST API, OpenAPI
- **Database**: PostgreSQL (Relational DB)
- **Cache & Queue**: Redis
- **Storage**: S3-compatible Object Storage
- **Deployment**: Kubernetes/VMs, Docker
- **Monitoring**: APM, Logs, Metrics, Dashboards
