# SaaS Blueprint — توصيات تأسيس منصة نقاط بيع كخدمة (POS as a Service)
> وثيقة هندسية/تشغيلية شاملة لتأسيس منصة POS متعددة العملاء (Multi‑Tenant) عالية الأمان والاعتمادية، تغطي: المعمارية، العزل بين العملاء، الأمن والحماية، الخصوصية والامتثال، الشبكات والحافة (Edge/CDN/WAF)، قاعدة البيانات والمخازن، الكاش، المزامنة Offline، الطباعة، القياس والفوترة، المراقبة (Observability)، النسخ الاحتياطي والتعافي من الكوارث (DR)، CI/CD والبنية التحتية ككود (IaC)، الإطلاق والتوسّع متعدد المناطق.

## 0) ملخص تنفيذي
- **هدف المنصة:** تقديم نظام نقاط بيع سحابي مرن للصراف/المدير مع إدارة مخزون/مشتريات/مرتجعات/محاسبة أساسية، يعمل حتى دون اتصال ويُزامن تلقائيًا عند عودة الشبكة، مع قدرات طباعة حرارية وتقارير دقيقة وتقسيط/دفعات إلكترونية.
- **مبادئ أساسية:** عزل صارم للبيانات لكل عميل، أمان افتراضي وقابل للاختبار، قابلية توسع أفقية، تصميم بسيط الآن وقابل للترقية لاحقًا (Simple now, extensible later)، قابلية الملاحظة (Observability‑first)، DR وتجارب استعادة دورية، تصميم للتكلفة.

---

## 1) نموذج التعددية (Multi‑Tenancy) وعزل البيانات
### 1.1 خيارات العزل
- **A. Pooled + RLS (موصى به للبداية):** قاعدة بيانات مشتركة وجداول مشتركة، مع عمود `tenant_id` وسياسات **Row Level Security** تمنع الوصول العرضي. + فهارس مركبة (tenant_id, created_at).  
  - **إيجابيات:** تكاليف تشغيل منخفضة، تبسيط الترحيل، أداء جيد مع فهارس مناسبة.
  - **مخاطر:** أخطاء في تطبيق RLS قد تفتح تسريبًا—تُخفّف بالاختبارات/الفحص الثابت/عزل طبقة التطبيق.
- **B. Schema‑per‑Tenant:** نفس قاعدة البيانات، مخطط لكل عميل عند النمو (10–200 عميل متوسّط).  
  - **إيجابيات:** عزل أقوى، ترحيل خاص بعميل. **سلبيات:** إدارة مخططات.
- **C. DB‑per‑Tenant (مؤسسات كبرى):** عزل شبه كامل وكلفة أعلى—للمرحلة المتقدمة أو لعملاء عاليي المتطلبات/الامتثال.

**توصية:** ابدأ بـ **Pooled + RLS** مع تصميم يمكّنك لاحقًا من نقل عميل معيّن إلى Schema/DB منفصلة عند الحاجة (Migration Playbook).

### 1.2 سياسات RLS (مثال PostgreSQL مختصر)
```sql
-- عمود tenant_id في كل جدول أعمال (NOT NULL + فهرس مركّب)
ALTER TABLE sales_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY sales_rls ON sales_invoices
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- تُضبط قيمة السياق عند كل اتصال/معاملة بعد التحقق من JWT/Session
SELECT set_config('app.current_tenant_id', :tenantId, false);
```

### 1.3 طبقة التطبيق
- حقن `tenantId` من الـ JWT/Session عبر طبقة Auth في كل طلب (NestJS Guard).  
- منع **N+1** عبر Repos/Services تُمرّر `tenantId` صراحةً—لا تعتمد على افتراضات ORM فقط.  
- سجّل `tenant_id` في كل Log/Trace/Metric لسهولة الاستكشاف.

---

## 2) الهوية والمصادقة/التخويل (Identity, AuthZ)
- **AuthN:** JWT Access + Refresh rotation، 2FA (TOTP/SMS)، دعم **WebAuthn** للأجهزة الداعمة.  
- **SSO اختياري:** OAuth2/OIDC (Google/Microsoft/Keycloak) لحسابات الشركات.  
- **RBAC/ABAC:** أدوار (Owner/Admin/Manager/Cashier/Accountant) + سياسات خصائص (فرع/مخزن).  
- **Session Security:** تعيين نفس السياسات على الـ Admin والـ POS PWA، قفل جلسة الخمول، Device fingerprint (معتدل).  
- **التزامات (Entitlements):** ربط الخطط (Plan/Edition) بتفعيل الخصائص (مثلاً Offline/محاسبة/تقارير متقدمة).

---

## 3) الشبكات والطبقة الحدّية (Edge)
- **WAF/CDN:** Cloudflare أو ما يماثله: WAF + Rate Limiting + Bot Management + CDN للملفات الثابتة ووسوم التخزين المؤقت.  
- **TLS:** شهادات آلية (ACME)، HSTS، TLS ≥ 1.2.  
- **Zero‑Trust (اختياري):** وصول مقيد للـ Admin/DevTools عبر Access Proxy.  
- **نطاقات العملاء/العلامات البيضاء:** subdomain لكل عميل `tenant.example.com` + دعم **Custom Domain** مع توثيق DNS آلي.

---

## 4) المعمارية والتقنيات (Reference Stack)
- **Backend:** NestJS (Node LTS 22)، وحدات: Sales/Returns/Inventory/Purchasing/Accounting/Reporting/Auth/Sync.  
- **DB:** PostgreSQL 15+، **RLS**، فهارس مركبة، Locks متدرّجة، **ULID/UUIDv7** للترتيب الزمني.  
- **ORM:** Prisma (Type‑safe + Migrate).  
- **Cache/Queues:** Redis 7+ (Cache + BullMQ)، إمكان الترقية لاحقًا لـ RabbitMQ/Redpanda.  
- **Storage:** S3‑compatible (MinIO محلي/Cloudflare R2/S3) للفواتير PDF والقوالب.  
- **Frontend:** React + TS، POS **PWA** (IndexedDB + Workbox)، Admin بـ MUI.  
- **Printing:** WebBluetooth/WebUSB أولًا، **Print‑Bridge** (خدمة سطح مكتب) لل ESC/POS عند الحاجة.  
- **Sync:** Worker/Queues لمعالجة أحداث (InvoiceCreated/ReturnProcessed) وتجميعات.

---

## 5) الكاش والـ Performance
### 5.1 طبقات الكاش
- **Edge Cache:** صفحات ثابتة/ملفات، cache‑control ذكي (Admin: no-store، POS: assets طويلة العمر).  
- **API Cache:** Redis TTL 60–300s لتقارير قراءة كثيفة؛ **Cache Key** يتضمن `tenant_id`.  
- **DB Caching:** فهارس على (tenant_id, date), (product_id, warehouse_id)، Materialized Views للتقارير الثقيلة.  
- **Idempotency Cache:** مفاتيح عمليات الدفع/المزامنة (24h).

### 5.2 ضبط الأداء
- HTTP keep‑alive، ضغط br/gzip، Pagination صارم، Avoid large payloads، Bulk endpoints للتحويلات.  
- **الاستعلامات:** استخدم EXPLAIN/ANALYZE دوريًا، تجنّب FKs عبر حدود عالية الحركة إن سببت Lock contention (استبدلها بفحص منطق).  
- **الأسماء المتزايدة:** ULID/UUIDv7 تقلّل Hotspot مقارنةً بـ UUIDv4.

---

## 6) Offline‑First والمزامنة
- **Local state:** تخزين في IndexedDB (Dexie) مع حالات `pending/failed/synced`.  
- **Batch Sync:** عند الاتصال تُرسل دفعات تغييرات (ChangeSets) مع **Idempotency‑Key** و**Server State Hash**.  
- **حل التعارضات:** LWW مع طوابع زمنية، قواعد خاصة للمخزون/الحركات (الخصم يغلّب)، سجل merging واضح.  
- **رصد المزامنة:** عدّادات pending/failed per tenant + تنبيهات عند العتبات.

---

## 7) الفوترة والقياس (Billing/Metering)
- **Billing Provider:** مزوّد دفع عالمي (Stripe/Paddle) أو محلي حسب المنطقة.  
- **Metering:** قياس Events أساسية (فاتورة منشأة، جهاز نشط، طابعة متصلة، حجم تخزين، مكالمات API).  
- **Plans/Entitlements:** ربط المقاييس بالخطط (Limits/Quotas)، حظر ناعم مع تحذير قبل الإيقاف.  
- **Invoicing:** فواتير اشتراك/استخدام، Webhooks موثّقة (تكرار آمن، توقيع، Idempotency).

---

## 8) الأمان والحماية (Security)
- **AppSec:** Helmet/CSP، حماية XSS/CSRF (حسب نمط Auth)، Rate‑Limit، منع Enumeration.  
- **Data Security:** تشفير At‑Rest (DB/Backups/Objects)، تشفير In‑Transit (TLS).  
- **KMS:** مفاتيح لكل بيئة، خيار **Per‑Tenant Key** للبيانات الحساسة (أرصدة، أرقام جزءية)، تدوير دوري.  
- **Secrets:** إدارة أسرار (Vault/Secrets Manager)، تمنع .env في الإنتاج، سجلات وصول للأسرار.  
- **Audit:** سجلات Append‑only (من/متى/ماذا/قبل‑بعد/عنوان IP/جهاز)، تتكامل مع SIEM.  
- **Dependency Hygiene:** Renovate/Dependabot، SBOM (Syft)، SCA (Trivy/OSV).  
- **Secure SDLC:** مراجعات كود، SAST/DAST، فحوصات حقن/تحكم وصول، غطاء اختبارات ≥ 70%.  
- **التوافق:** سياسات DPA، شطب/تصدير بيانات العميل (Right to Erasure/Export)، سياسات احتفاظ زمنية.

---

## 9) المراقبة والمرئية (Observability)
- **Tracing:** OpenTelemetry → Collector → (Jaeger/Tempo).  
- **Metrics:** Prometheus → Grafana (SLIs/SLOs ولوحات: زمن الاستجابة/أخطاء/طوابير/استعلامات ثقيلة/Sync backlog).  
- **Logging:** Loki/ELK، حقل `tenant_id` إلزامي، Masking لحقول حساسة.  
- **Error Tracking:** Sentry للفرونت/الباك.  
- **الإنذارات:** Alerting على Error Budget/SLO، Backups failed، Sync backlog، High queue latency، %5xx.

---

## 10) النسخ الاحتياطي والتعافي من الكوارث (Backup/DR)
- **PostgreSQL:** pgBackRest/PITR (ساعات/يوم)، Snapshot يومي + أسبوعي + شهري، احتفاظ 30–90 يومًا.  
- **Object Storage:** restic (يومي/أسبوعي/شهري) مع تحقق من السلامة.  
- **Redis:** لا يُعدّ مصدرًا للحقيقة—نُصدّر Snapshots إذا لزم.  
- **اختبار الاستعادة:** شهريًا—سيناريو استعادة إلى بيئة منفصلة + تحقق وظيفي آلي (smoke tests).  
- **أهداف:** **RPO ≤ 24h**، **RTO ≤ 4h** (اضبط حسب الخطة المدفوعة).  
- **Runbooks:** دليل خطوة/خطوة مع Checklists وروابط Dashboards.

---

## 11) CI/CD و IaC
- **IaC:** Terraform + Helm/Kustomize (لـ K8s)، بيئات منفصلة (Dev, Staging, Prod).  
- **GitHub Actions:** Lint/Type‑check/Test/Coverage/Build Docker/Trivy/SBOM/Deploy.  
- **Preview Environments:** فروع الميزات تُنشئ بيئة مؤقتة.  
- **Release:** SemVer + Changelog، إطلاق تدريجي Canary/Blue‑Green.  
- **Migrations:** Prisma migrate مع Gate لحماية أوقات الذروة، نسخ قبل/بعد، Rollback plan.  
- **Secrets:** مخزنة في Secret Manager مع Rotation وجدولة مراجعة.

---

## 12) الاستضافة والتوسّع
- **مرحلة مبكرة:** Cloud Run/Render/Koyeb + DB مُدارة (Cloud SQL/RDS) + Redis مُدار (Upstash/ElastiCache).  
- **مرحلة نمو:** Kubernetes (HPA, PDB, Pod anti‑affinity)، تخزين خارجي لـ DB/Redis مُدارين.  
- **تعدّد المناطق:** Primary Region + Read Replica + خطة Failover، **Clock Sync**، **ID monotonicity** (ULID/UUIDv7).  
- **Edge:** CDN/WAF لكل مناطق العملاء + Routing جغرافي للملفات.

---

## 13) إدارة الإعدادات والميزات
- **Config:** 12‑factor، Config per environment/tenant عبر قاعدة بيانات إعدادات (مع كاش).  
- **Feature Flags:** إطلاق تدريجي/اختبارات A/B، تمكين خصائص حسب Plan/Segment.  
- **Limits/Quotas:** جداول `tenant_limits` + عدّادات، تطبيق عبر Gateway/Guards.

---

## 14) جودة البيانات والتقارير
- **ETL/ELT:** دَفع Events إلى Lake (S3/R2) + تفريغ جداول التقارير إلى Warehouse (BigQuery/ClickHouse/PG OLAP).  
- **BI:** لوحات مخصّصة للمديرين، تنبيهات أنماط (انخفاض مبيعات/نفاد مخزون).  
- **دقة:** تسويات محاسبية دورية، Double‑entry متّزن، تقارير مصادقة (Reconciliation).

---

## 15) الحوكمة والامتثال
- **Privacy by Design:** تقليل البيانات الشخصية، تشفير الأعمدة الحساسة، إخفاء عبر الواجهة.  
- **Data Residency:** خيار استضافة إقليمي، سياسات نقل عبر الحدود.  
- **العقود:** DPA/ToS/SLAs (SLOs: زمن استجابة/توفر شهري، Credits عند الإخلال).  
- **تدقيق:** جاهزية ISO 27001/SOC2 (على مراحل)، سجلات تغيير التهيئة والأذونات.

---

## 16) خطة SRE و SLOs
- **SLIs:** p95 latency، نسبة 5xx، تكدس الطوابير، معدّل أخطاء Sync، زمن استعلامات ضخمة.  
- **SLOs:** p95 < 400ms للقراءات، p95 < 800ms للكتابات، توفّر شهري ≥ 99.9% (Prod).  
- **Error Budget:** يُستخدم لاتخاذ قرارات الإطلاق مقابل الصيانة.  
- **Post‑mortems:** خالية من اللوم، مع إجراءات تصحيحية (CAPAs).

---

## 17) أمن الطباعة والأجهزة
- **POS PWA:** تأمين الوصول للجهاز (نمط جهاز موثوق/ربط حساب)، قيود على الطباعة الحرارية (مصرّح بها فقط).  
- **Print‑Bridge:** توقيع/تحديث آمن، قنوات اتصال محلية مشفّرة، لائحة طابعات مسموح بها لكل عميل.  
- **Mobile MDM (اختياري):** للأجهزة المملوكة للشركة.

---

## 18) خطة الإطلاق والتدرّج
1) **MVP SaaS:** Multi‑Tenant + RLS، POS PWA + Admin، بيع/مرتجع/مخزون أساسي، تقرير أساسي، الدفع واحد، نسخ احتياطي + مراقبة مبدئية.  
2) **Wave 2:** مشتريات/موردون، تقارير متقدمة/لوحة مؤشرات، الطباعة/Bridge، Offline‑Sync كامل.  
3) **Wave 3:** محاسبة أساسية/إقفال فترات، Entitlements متقدمة، Metering/Usage Billing.  
4) **Wave 4:** Multi‑Region، تكاملات محاسبية خارجية، BI متقدّم.

---

## 19) ملاحق عملية
### 19.1 سياسة RLS معيارية (قالب)
```sql
CREATE POLICY rls_generic ON {table}
USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
```

### 19.2 معدّل الطلبات لكل عميل (NestJS + Redis) — مبدأي
```ts
// pseudo-code
@Injectable()
export class TenantRateLimiter {
  constructor(private readonly redis: Redis) {}
  async check(tenantId: string, key: string, limit = 300, windowSec = 60) {
    const k = `rl:${tenantId}:${key}:${Math.floor(Date.now()/1000/windowSec)}`;
    const n = await this.redis.incr(k);
    if (n === 1) await this.redis.expire(k, windowSec);
    if (n > limit) throw new TooManyRequestsException();
  }
}
```

### 19.3 Runbook: اختبار استعادة PostgreSQL (خلاصة)
1) تهيئة بيئة استعادة معزولة.  
2) استعادة أحدث Snapshot + WAL (PITR).  
3) تشغيل اختبارات smoke (تسجيل دخول/إنشاء فاتورة/تقرير).  
4) توثيق الزمن والنتيجة، وتلقيم لوحة DR‑KPIs.

---

## 20) قرارات افتراضية (يمكن تعديلها لاحقًا)
- **Tenancy:** Pooled + RLS، قابل للترقية إلى Schema/DB per tenant.  
- **Security:** JWT + 2FA + WebAuthn، Vault للأسرار، KMS للمفاتيح.  
- **Infra:** Cloud Run/DB مُدارة → K8s عند النمو، CDN/WAF من اليوم الأول.  
- **Data:** PostgreSQL + RLS + Backups PITR، Redis للكاش والطوابير، R2/S3 للملفات.  
- **Obs:** OTel + Prometheus + Loki/Sentry، تنبيهات على SLO/Error‑budget.  
- **Ops:** Terraform/Helm، CI/CD مكتمل، اختبار استعادة شهري، توثيق Runbooks.

**الخلاصة:** بهذه الوصفة، تنطلق بمنصّة SaaS لنقاط البيع آمنة، فعّالة، قابلة للتوسع، وقابلة للتشغيل اليومي بثقة؛ مع مسارات واضحة للترقية نحو عزلات أقوى وتعدد مناطق وتكاملات أعمق كلما نمت قاعدة العملاء.
