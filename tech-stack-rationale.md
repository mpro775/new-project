# Tech Stack Rationale — POS Platform (نظام نقاط بيع شامل)
> هذا المستند يبرّر اختيارات التقنية للبنية المقترحة (Backend + Frontend + Data + DevOps + Security + Observability) بما يخدم الأهداف الوظيفية وغير الوظيفية (أداء، أمان، موثوقية، Offline‑First، قابلية التوسّع والتشغيل).

## 1) الأهداف والقيود
- **أهداف أساسية:** أداء عالٍ في نقطة البيع، دقة المخزون/الحسابات، تجربة سلسة Offline‑First مع مزامنة، طباعة حرارية، تقارير ولوحات دقيقة، أمان قوي (2FA/بايومتريك/سجلات)، وتكاملات دفع/رسائل.
- **قيود عملية:** فرق صغيرة، إطلاق تدريجي (MVP ثم توسعات)، تكلفة تشغيل معقولة، اختلاف بيئات الفروع (اتصال ضعيف/أجهزة متواضعة).
- **مقاييس غير وظيفية:** زمن إضافة/بحث ≤ 2–3 ث، انقطاع مقبول مع استمرار العمل Offline، RPO≤24h, RTO≤4h، تغطية اختبارات ≥ 70%، مراقبة وتنبيهات.

---

## 2) Backend
**الخلاصة:** **NestJS (Node LTS ≥ 20/22)** + **PostgreSQL** + **Redis (Cache/Queues)** مع وحدات واضحة (Sales/Returns/Inventory/Purchasing/Accounting/Reporting/Auth/Sync) كما في C4.

### لماذا NestJS؟
- بنية معيارية + DI + Guards/Pipes/Interceptors تسهّل RBAC والـ 2FA.
- TypeScript قوي، وتوثيق OpenAPI سهل، واختبارات منظمة (Jest).
- مجتمع كبير وتكامل ممتاز مع Redis/Prisma/TypeORM وAdapters الدفع/الإشعارات.

### ORM واختيار قاعدة البيانات
- **DB:** PostgreSQL لعلاقات قوية، معاملات متقدمة، Views/CTE، وتوافق واسع.
- **ORM:** **Prisma** (إنتاجية عالية، Type‑safe، Migrate ممتازة).  
  بديل: **TypeORM** حين الحاجة لميزات ORM تقليدية أو أنماط Lazy relations.  
  **قرار:** البدء بـ Prisma؛ التحوّل إلى TypeORM ليس متوقعًا إلا إن تطلبت تقارير SQL دقيقة مخصّصة جدًا داخل ORM.

### الطوابير/الكاش والمزامنة
- **Redis** لـ Cache, Pub/Sub, Queues (BullMQ) كحلّ خفيف وسريع.  
  بديل لاحق: **RabbitMQ** إن احتجنا Routing معقّد/DLX متعدد.
- **Sync/Worker** (Node) يعالج أحداث (InvoiceCreated/ReturnProcessed…)، ويولّد تجميعات وتقارير مؤقتة.

### المعاملات والمحاسبة
- معاملات كل عملية بيع/مرتجع تربط قيود GL تلقائيًا (Sales/Tax/Cash/Receivables).  
- **Idempotency Keys** لعمليات الدفع/إعادة الإرسال.  
- **ULID/UUIDv7** كمُعرّفات صديقة للترتيب والزمن (تفيد في Offline).

### بدائل تم تقييمها
- **Django/.NET**: ممتازان لكن يكلفان تبديل بيئة/خبرة؛ Node/Nest أقرب لفريق الواجهة الأمامية والتكاملات الحالية.
- **MongoDB**: جيد للمرونة لكن احتياجاتنا Relational صِرفة (حسابات/جرد/تقارير).

---

## 3) Frontend
**الخلاصة:** **React + TypeScript** مع **Vite**، و**PWA** للصراف (POS) + **Admin Dashboard**.  
**الحالة بدون اتصال:** **IndexedDB (Dexie)** + Service Worker (**Workbox**) + إستراتيجية مزامنة برزم تغييرات (ChangeSets).

### لماذا React PWA للصراف؟
- انتشار واسع، أداء جيد على الأجهزة المتوسطة، دعم Camera/BarcodeAPI، سهولة العمل كـ App عبر الشاشة الكاملة.
- **TanStack Query** لإدارة بيانات الشبكة/الكاش و**React Hook Form** للنماذج.
- **i18next** للتعريب + RTL، **react-hot-toast**/MUI/Semantic UI حسب تفضيل الفريق (Admin يمكن MUI لسرعة بناء الجداول والنماذج).

### المسح والطباعة
- **BarcodeDetector API** (حيث مدعوم) مع بديل **QuaggaJS**.  
- **طباعة حرارية:** WebBluetooth/WebUSB إن توفّر؛ وإلا **Print Bridge** (Small Desktop Service) يتعامل مع ESC/POS عبر USB/Serial.

### بدائل تم تقييمها
- **Flutter Web** للصراف: تجربة رائعة، لكن حجم الحِمل الأولي وقيود الطباعة قد تؤثر. React PWA أخفّ وأسهل تكاملًا مع الويب والطابعات المتنوعة.

---

## 4) Data & Storage
- **PostgreSQL** (RDS/Cloud SQL/ self‑hosted) مع **pgBackRest**/استراتيجية نسخ احتياطي.
- **Redis** للـ Cache/Queues وSession rate‑limit/anti‑bruteforce.
- **Object Storage** متوافق S3 (MinIO محلي، أو **Cloudflare R2**/S3) لحفظ **PDF/تقارير/نماذج**.
- **Schema مبسّط أساسي:** Users, Roles, Branches, Warehouses, Products, Variants, Prices, Taxes, Currencies, StockItems, StockMovements, Suppliers, PurchaseInvoices, Customers, SalesInvoices, Payments, Returns, CreditNotes, GLAccounts, JournalEntries, AuditLogs, SyncBatches.

---

## 5) Offline‑First & Conflict Resolution
- **Local-first**: تخزين الفواتير/الحركات في IndexedDB مع حالة Sync (pending/failed/synced).
- **المزامنة:** عند الاتصال تُرسل **Batches** بإستخدام **Idempotency**، ويُعاد **Server State Hash** لضمان التطبيق.
- **حل التعارضات:** **Last‑Writer‑Wins (LWW)** مؤطر بزمن/نسخة سجل، مع قواعد خاصة لبعض الجداول (مثلاً خصم المخزون يَغلِب الزيادات العشوائية).  
  بدائل: CRDT معقّدة—تُؤجّل لسيناريوهات تعاون حي متعدد الأطراف.

---

## 6) Security
- **Auth:** JWT Access + Refresh rotation، 2FA (TOTP/SMS)، WebAuthn للأجهزة الداعمة.  
- **RBAC** دقيق بالحُماة (Guards/Decorators).  
- **Headers & AppSec:** Helmet, Rate‑Limit, CORS, CSP (في الواجهة)، حماية ضد XSS/CSRF (على حسب نمط المصادقة).  
- **التخزين:** سرية المفاتيح عبر **Secrets Manager** (بيئة الإنتاج)، **.env** محلي فقط.  
- **التدقيق:** Audit trail Append‑only، تتبّع من/متى/ماذا/قبل‑بعد مع بصمة جهاز/موقع تقريبي.

---

## 7) Observability
- **OpenTelemetry** Traces + **Prometheus** Metrics + **Loki/ELK** Logs.  
- **Sentry** للأخطاء في الفرونت/الباك.  
- Dashboards لتنبيه البطء/الأخطاء/طوابير متراكمة/انخفاض الطباعة/فشل مزامنة.

---

## 8) CI/CD & DevOps
- **GitHub Actions**: Lint/Type‑check/Test/Coverage/Build Docker/Trivy/SBOM/YAML‑lint.  
- E2E (Playwright) على بيئة معاينة.  
- **الحاويات:** صور متعددة المراحل، **Node LTS (22)** أساس.  
- **التشغيل:** 
  - صغير/متوسط: **Cloud Run**/**Render**/**Koyeb**/**Hetzner** + DB مُدارة.  
  - أكبر/متعدّد الفروع: **Kubernetes** (Horizontal Pod Autoscaler/PodDisruptionBudget).  
- **Backups:** restic إلى **Cloudflare R2** (يومي/أسبوعي/شهري) + **اختبار استعادة دوري**.

---

## 9) Performance & Sizing (إرشادات)
- **PostgreSQL:** ضبط فهارس مركّبة على (branch_id, created_at), (product_id, warehouse_id).  
- **Redis:** TTL للكاش (60–300s)، مفاتيح idempotency 24h.  
- **API:** ضغط gzip/br، HTTP keep‑alive، pagination صارم، cold‑start أقل عبر تشغيل مستمر أو min‑instances.  
- **Frontend:** Code‑splitting، prefetch ذكي، caching headers، Workbox strategies.

---

## 10) Testing Strategy
- **Unit:** حساب الضرائب/الخصومات/تسعير المرتجع/قيود GL.  
- **Integration:** Sales↔Inventory↔Accounting، Payment idempotency، Printing adapter.  
- **E2E:** سيناريوهات الصراف/المرتجعات/المشتريات/الإغلاقات المحاسبية/Offline‑sync.  
- **Security tests:** rate‑limit/bruteforce، auth‑flows، permission matrix.  
- **Coverage هدف ≥ 70%** بالمراحل الأولى، وزيادته مع الزمن.

---

## 11) Alternatives & Trade‑offs
- **NestJS vs FastAPI/.NET:** تم تفضيل Nest لاستخدام TS موحّد مع الواجهة الأمامية وتقليل تباين التقنيات.  
- **Prisma vs TypeORM:** Prisma أسرع تطويرًا، TypeORM أعمق في أنماط ORM الكلاسيكية؛ اختيار Prisma مع منافذ SQL مباشرة عند الحاجة.  
- **Redis vs RabbitMQ:** Redis أسرع للبدء وبسيط؛ RabbitMQ عند الحاجة إلى نماذج توجيه/تعقيد أعلى.  
- **React PWA vs Flutter Web:** React أخفّ وأقرب للويب/الطباعة؛ Flutter خيار لاحق لتوحيد منصات متعددة إن لزم.

---

## 12) Bill of Materials (اقتراح أولي)
- **Backend:** NestJS, Prisma, Zod/DTO Validators, BullMQ, Helmet, Winston/Pino, OpenAPI, Passport/JWT, otel SDK.
- **DB/Infra:** PostgreSQL 15+, Redis 7+, MinIO/R2, Nginx/Cloudflare, restic.
- **Frontend (POS/Admin):** React 18+, Vite, TypeScript, TanStack Query, React Hook Form, i18next, Workbox, Dexie, react‑hot‑toast, MUI (للـ Admin)، QuaggaJS/BarcodeDetector.
- **Testing:** Jest, Supertest, Playwright, Testing Library.
- **Observability:** OpenTelemetry, Prometheus, Grafana, Loki/ELK, Sentry.
- **CI/CD:** GitHub Actions, Trivy, Syft (SBOM), Docker/Buildx, GHCR/Registry.

---

## 13) خريطة الطريق التقنية (MVP ← توسّع)
1) **MVP**: Auth/RBAC/2FA + Sales/Returns + Inventory Basics + Printing + Reports أساسية + POS PWA + Admin CRUD + Payment واحد + Backups + مراقبة أولية.  
2) **Wave 2**: Purchasing/Suppliers + تقارير متقدّمة + لوحة مؤشرات + Offline‑First كامل.  
3) **Wave 3**: محاسبة أساسية/إقفال فترات + تكامل رسائل/واتساب متقدم + تحسين الطباعة/Bridge.  
4) **Wave 4**: K8s/Autoscaling + تكاملات محاسبية خارجية (اختياري) + BI.

---

## 14) قرارات افتراضية (يمكن تعديلها)
- **Node:** LTS 22، **NestJS**، **Prisma + PostgreSQL**، **Redis** لـ Cache/Queues.  
- **Frontend:** React PWA (POS) + React Admin (MUI)، IndexedDB + Workbox.  
- **Printing:** WebUSB/Bluetooth أولًا، و**Bridge** اختياري.  
- **Offline:** مفعّل؛ **LWW** لقواعد فضّ التعارض.  
- **Observability:** OTel + Prometheus + Loki/Sentry.  
- **Deploy:** Cloud Run/Hetzner مبدئيًا، K8s عند النمو.

---

## 15) ملحق: متغيرات بيئية نموذجية (.env)
> **ملاحظة:** أمثلة. لا تُرفع للـ git.
```dotenv
# App
NODE_ENV=production
PORT=8080
APP_BASE_URL=https://pos.example.com

# DB
DATABASE_URL=postgresql://user:pass@host:5432/pos?schema=public
REDIS_URL=redis://:pass@host:6379/0

# Auth
JWT_ACCESS_TTL=900
JWT_REFRESH_TTL=604800
JWT_SECRET=change_me
TOTP_ISSUER=POS
WEBAUTHN_RP_ID=pos.example.com

# Payments
PAYMENT_PROVIDER=stripe_like
PAYMENT_API_KEY=change_me

# Storage
S3_ENDPOINT=https://r2.cloudflarestorage.com
S3_BUCKET=pos-files
S3_ACCESS_KEY_ID=change_me
S3_SECRET_ACCESS_KEY=change_me

# Observability
OTEL_EXPORTER_OTLP_ENDPOINT=https://otel-collector.example.com
SENTRY_DSN=

# Emails/SMS
SMS_API_KEY=
EMAIL_SMTP_URL=
```

---

**الخلاصة:** الاختيارات أعلاه تحقق توازناً بين السرعة في التنفيذ (Time‑to‑Market)، والاعتمادية، والقدرة على النمو. تم تبنّي مبدأ **Simple now, extensible later**: Redis للمهام الآن، RabbitMQ عند الحاجة؛ React PWA للطباعة والسرعة، وBridge عند الحاجة؛ Prisma لسرعة التطوير مع إبقاء المجال مفتوحًا للوصول المباشر لـ SQL/Views للمحاسبة والتقارير المتقدمة.
