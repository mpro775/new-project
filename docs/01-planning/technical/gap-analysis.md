# Gap Analysis — فجوات نظام نقاط البيع وتحويله إلى SaaS جاهز للإنتاج
> مستند يشرح الفجوات بدقة ويقدّم توصيات تنفيذية ومعايير قبول وخطة 30/60/90 يوم.  
> يغطي: تعددية العملاء (Multi‑Tenancy)، الأمن والامتثال، المراقبة، النسخ الاحتياطي وDR، الأداء والكاش، Offline‑First، المحاسبة، المخزون والمشتريات، الطباعة والأجهزة، التقارير و‑BI، الفوترة والقياس، والحوكمة والخصوصية.

---

## 0) الخلاصة التنفيذية
- الملفات الحالية توثّق تجربة تشغيل **(بيع/مرتجعات/تقارير/صلاحيات/نسخ احتياطي)** بشكل جيد، لكنها لا تكفي وحدها للوصول إلى **SaaS مؤسسي**.  
- الفجوات الأبرز: **تعدد المستأجرين (RLS/Plans/Billing)**، **أمن وامتثال مؤسسي**، **Observability**، **PITR/DR باختبارات دورية**، **طبقات كاش/Idempotency**، **مزامنة Offline محكمة**، **محاسبة مترابطة بالكامل**، **جسر طباعة آمن**، **مشتريات ومخزون متقدّم**، **قياس وفوترة**.  
- الأولويات: (P0) أساس SaaS والأمان/DR/Observability/Cache؛ (P1) Offline Sync/Accounting/Printing/Procurement/Advanced Inventory؛ (P2) Billing/BI/Multi‑Region/حَوْكمة.

---

## 1) مصفوفة الفجوات (Gap Matrix)
| المجال | الحالة الملحوظة | الفجوة | الأثر | الأولوية | التوصية المختصرة |
|---|---|---|---|:--:|---|
| Multi‑Tenancy | نطاق وظيفي أحادي العميل | لا يوجد عزل مستأجرين/خطط | مخاطر تسريب/تعذّر التسعير | **P0** | Pooled + RLS، Plans/Entitlements، Metering & Usage Billing |
| Security & Compliance | 2FA/بايومتريك/سجلات | لا يوجد KMS/Rotation/CSP/Rate‑limit/سياسات خصوصية | مخاطر امتثال/اختراق | **P0** | KMS+Vault، CSP/Helmet/Rate‑limit، سياسات الاحتفاظ/المحو/التصدير |
| Observability | تقارير تشغيلية فقط | لا يوجد Traces/Metrics/Logs/SLO | صعوبة استكشاف الأعطال | **P0** | OTel + Prometheus + Logs + Sentry + SLO/Alerts |
| Backup/DR | ذكر نسخ/اختبار | لا يوجد PITR/RPO/RTO/Runbook مجرّب | فقد بيانات/تعطل طويل | **P0** | pgBackRest + PITR، RPO≤24h/RTO≤4h، تمرين شهري |
| Performance/Cache | أهداف زمنية عامة | لا توجد طبقات كاش/Materialized Views/Idempotency | ضغط DB واحتمال ازدواج | **P0** | Redis (API/Idempotency)، Edge cache، MV للتقارير |
| Offline‑First | مذكور كتجربة | لا توجد إستراتيجية مزامنة/تعارضات/قياسات | ازدواج/فقد مزامنة | **P1** | Batch ChangeSets + LWW + عدّادات ومؤشرات |
| Accounting | موجودة جزئياً | نقص ترحيل آلي/إقفال/تسويات | تقارير غير متزنة | **P1** | GL كامل، إقفال فترات، تسويات، اختبارات مواءمة |
| Inventory Advanced | أساسيات فقط | لا Serials/IMEI/Expiry/ROQ per branch | دقة ضعيفة/سرقات | **P1** | تتبع متقدّم/تنبيهات/تحويلات باعتماد |
| Purchasing | أساسية | لا PO/GRN/تكاليف إضافية | تكلفة مخزون غير دقيقة | **P1** | دورة مشتريات كاملة + توزيع التكاليف |
| Printing & Devices | طباعة حرارية مذكورة | لا Print‑Bridge آمن/سياسة أجهزة | فشل/ثغرات طرفيّة | **P1** | Bridge موقّع/قنوات محلية مشفّرة/Whitelist طابعات |
| Reporting & BI | تقارير تشغيلية | لا Lake/Warehouse/تنبيهات نمطية | رؤى محدودة | **P2** | ETL إلى Lake، لوحات KPI/تنبيهات |
| Billing & Metering | غير مذكور | لا قياس/خطط/اشتراكات | عدم القدرة على التحصيل | **P2** | Usage metering + Provider + Webhooks آمنة |
| Governance/Privacy | غير محدّد | لا سياسات DPA/Residency | مخاطر قانونية | **P2** | DPA، Data Residency، سياسات محو/تصدير |

---

## 2) تفاصيل الفجوات وتوصيات التنفيذ

### 2.1 تعدد المستأجرين (Multi‑Tenancy)
- **الفجوة:** لا يوجد عزل مستأجرين/خطط/قياس استخدام.  
- **التوصية:**  
  - نموذج **Pooled + RLS** كبداية (عمود `tenant_id` + سياسات RLS لكل جدول).  
  - تمرير `tenantId` عبر JWT/Guards في كل طلب.  
  - **Entitlements/Plans** تتحكم في الميزات (Offline/Accounting/Advanced Reports).  
  - **Metering** للأحداث الرئيسية (فاتورة/جهاز/طابعة/ملفات) + **Usage Billing**.  
- **AC:** لا يستطيع مستأجر قراءة أي سجل لمستأجر آخر؛ تقارير الاستخدام لكل مستأجر شهريًا.

### 2.2 الأمن والامتثال
- **الفجوة:** نقص KMS/Rotation/CSP/Rate‑limit/سياسات خصوصية/تشفير النسخ.  
- **التوصية:**  
  - **KMS** بمفاتيح لكل بيئة (Op: Vault/Secrets Manager، تدوير دوري).  
  - **CSP/Helmet/Rate‑limit/Bruteforce‑guard**، تشفير النسخ الاحتياطي، تشفير أعمدة حساسة.  
  - **سياسات خصوصية:** الاحتفاظ/المحو/التصدير/قابلية النقل + سجل ولوج للأسرار.  
- **AC:** تقارير تدقيق تمرّ، لا أسرار مكشوفة، إنذارات نشاط شاذ، اختبارات SRF/XSS/IDOR ناجحة.

### 2.3 المراقبة والمرئية (Observability)
- **الفجوة:** لا SLIs/SLOs/Tracing/Unified Logs.  
- **التوصية:** OTel traces + Prometheus metrics + Logs (Loki/ELK) + Sentry؛ لوحات p95 latency/%5xx/Sync backlog/DB heavy queries؛ تنبيهات على SLO.  
- **AC:** إنذار تلقائي عند اختراق SLO؛ لوحة موحّدة لكل بيئة/مستأجر.

### 2.4 النسخ الاحتياطي وDR
- **الفجوة:** لا PITR/RPO/RTO/Runbook مجرّب.  
- **التوصية:** pgBackRest + WAL (PITR)، **RPO≤24h/RTO≤4h**، تمرين شهري، بيئة استعادة معزولة + Smoke Tests آلية.  
- **AC:** نجاح تمرين شهري موثّق مع أزمنة استعادة ضمن الحدود.

### 2.5 الأداء وطبقات الكاش
- **الفجوة:** لا طبقات كاش/Idempotency/فهارس مركبة/Views مادية.  
- **التوصية:** Redis (API cache TTL 60–300s، مفاتيح Idempotency 24h)، Edge cache للأصول، **Materialized Views** للتقارير، فهارس مركبة على (tenant_id, created_at) و(warehouse_id, product_id).  
- **AC:** p95 قراءة < 400ms وكتابة < 800ms في POS؛ انخفاض استهلاك DB بنسبة > 30% للتقارير.

### 2.6 Offline‑First والمزامنة
- **الفجوة:** لا إستراتيجية Batch/ChangeSet ولا حل تعارضات أو قياسات.  
- **التوصية:**  
  - **ChangeSets** مع مفاتيح Idempotency + **Server State Hash**.  
  - **LWW** كقاعدة مع قواعد خاصة للمخزون (الخصم يغلّب).  
  - عدّادات Pending/Failed per tenant + تنبيهات تجاوز العتبات.  
- **AC:** لا ازدواج فواتير؛ مزامنة مكتملة (pending=0) بعد عودة الاتصال؛ سجلّ تعارضات مدقق.

### 2.7 المحاسبة والمالية
- **الفجوة:** ترحيل جزئي؛ لا إقفال فترات/تسويات ضريبية وصرف.  
- **التوصية:** GL كامل (Revenue/COGS/Tax/Cash/AR/AP)، إقفال فترات، تسويات، تقارير مواءمة بين المبيعات/المخزون/GL.  
- **AC:** ميزان مراجعة متزن دائمًا، تقارير توافق بلا فروق مادية.

### 2.8 المخزون والمشتريات (متقدم)
- **الفجوة:** لا Serials/IMEI/Expiry، لا PO/GRN/تكاليف إضافية موزّعة.  
- **التوصية:** تتبّع متقدّم حسب الحاجة القطاعية، دورة مشتريات كاملة، توزيع تكاليف على تكلفة المخزون، حدود ائتمان/شروط دفع.  
- **AC:** دقة المخزون وCOGS، تقارير أعمار ديون الموردين.

### 2.9 الطباعة والأجهزة
- **الفجوة:** لا Print‑Bridge آمن أو سياسات أجهزة/توقيع تحديث.  
- **التوصية:** خدمة Bridge موقّعة، قنوات محلية مشفّرة، Whitelist طابعات/قارئات، Logs أعطال الطباعة، تكامل درج النقود.  
- **AC:** طباعة موثوقة 58/80mm مع قوالب RTL؛ سجل أعطال وإعادة محاولة.

### 2.10 التقارير و‑BI
- **الفجوة:** لا Lake/Warehouse/تنبيهات نمطية/لوحات KPI متقدمة.  
- **التوصية:** ETL إلى Lake (R2/S3)، Warehouse خفيف، لوحات KPI وتنبيهات (انخفاض مبيعات/نفاد مخزون).  
- **AC:** ثبات زمن استعلامات، تنبيهات استباقية.

### 2.11 القياس والفوترة (SaaS Billing)
- **الفجوة:** لا Metering/Plans/Subscriptions أو Webhooks آمنة.  
- **التوصية:** مزوّد دفع اشتراكات، قياس الاستخدام، Webhooks موقّعة/Idempotent، خطط/قيود/حصص.  
- **AC:** فواتير صحيحة، قطع ناعم عند تجاوز الحصص.

### 2.12 الحوكمة والخصوصية
- **الفجوة:** عدم وضوح DPA/Data Residency/Retention/Erasure.  
- **التوصية:** سياسات خصوصية/احتفاظ/نقل عبر الحدود، إجراءات محو/تصدير بيانات المستأجر.  
- **AC:** اجتياز تدقيق خصوصية؛ وثائق DPA جاهزة.

---

## 3) معايير قبول (AC) مختصرة لكل حزمة
- **SaaS Core (P0):** RLS مفعل؛ اختبار E2E لعزل 20 حالة؛ خطط/Entitlements نشطة؛ Usage تقرير شهري.  
- **Security (P0):** لا أسرار مكشوفة؛ CSP/Helmet/Rate‑limit نشطة؛ KMS/Rotation؛ تشفير النسخ؛ سجل وصول للأسرار.  
- **Observability (P0):** لوحات p95/%5xx/Queues/Sync؛ إنذارات فورية على SLO.  
- **Backup/DR (P0):** تمرين PITR شهري ناجح؛ تقرير RPO/RTO.  
- **Performance/Cache (P0):** تحسن p95 وDB load؛ مفاتيح Idempotency فعّالة.  
- **Offline Sync (P1):** لا ازدواج؛ pending=0 بعد الاتصال؛ سجل تعارضات.  
- **Accounting (P1):** قيود تلقائية متزنة؛ إقفال فترات؛ تقارير مطابقة.  
- **Printing (P1):** Bridge آمن؛ قوالب RTL؛ سجلات أعطال.  
- **Purchasing/Inventory (P1):** COGS دقيق؛ PO/GRN؛ أعمار ديون.  
- **BI/Billing/Governance (P2):** لوحات KPI/تنبيهات؛ اشتراكات/حصص؛ سياسات خصوصية نافذة.

---

## 4) خطة 30/60/90 يوم (Workstreams قابلة للتنفيذ)

### 0–30 يوم (P0 أساس SaaS)
- [ ] Multi‑Tenancy: RLS + تمرير tenantId + اختبارات عزل.  
- [ ] Security: KMS/Vault + CSP/Helmet/Rate‑limit + تشفير نسخ.  
- [ ] Observability: OTel/Prometheus/Logs/Sentry + SLO وAlerts.  
- [ ] Backup/DR: pgBackRest + PITR + Runbook + تمرين.  
- [ ] Performance: Redis Cache + Idempotency + فهارس + MV.

### 31–60 يوم (P1 وظائف متقدمة)
- [ ] Offline‑First: Batch ChangeSets + LWW + قياسات.  
- [ ] Accounting: GL كامل + إقفال فترات + تسويات.  
- [ ] Printing: Print‑Bridge آمن + قوالب RTL.  
- [ ] Purchasing/Inventory Advanced: PO/GRN/Costs + Serials/Expiry (عند الحاجة).  

### 61–90 يوم (P2 نمو وربحية)
- [ ] Billing/Metering: مزوّد اشتراكات + قياس استخدام + Webhooks.  
- [ ] BI: Lake/Warehouse خفيف + لوحات KPI/تنبيهات.  
- [ ] Governance/Privacy: DPA/Residency/Retention/Erasure.  
- [ ] Multi‑Region (اختياري): قراءة مكرّرة + خطة Failover.

---

## 5) مخاطر رئيسية وخطط تخفيف
| المخاطر | الاحتمال | التأثير | التخفيف |
|---|:--:|:--:|---|
| أخطاء RLS | متوسط | عالٍ | اختبارات عزل صارمة + فحص حقوق الوصول + مراجعات كود |
| ازدواج فواتير بالمزامنة | متوسط | متوسط | Idempotency + Hash + LWW + سجل تعارضات |
| فشل طباعة | متوسط | متوسط | Bridge موقّع + إعادة محاولة + Logs + دعم أجهزة |
| فقد بيانات | منخفض | عالٍ | PITR + تمرين شهري + مراقبة Backups |
| تكاليف غير متوقعة | متوسط | متوسط | مراقبة استخدام/حصص + تحجيم تلقائي + تنبيه |
| اختراق/تسريب أسرار | منخفض | عالٍ | Vault/KMS + Rotation + Least‑Privilege + مراقبة وصول |

---

## 6) ملاحق عملية

### 6.1 سياسة RLS عامة (قالب)
```sql
ALTER TABLE {table} ENABLE ROW LEVEL SECURITY;
CREATE POLICY rls_generic ON {table}
USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
```

### 6.2 مفاتيح Idempotency (قالب)
```
Key: idem:{tenant_id}:{entity}:{operation}:{client_id}:{nonce}
TTL: 24h
```
قواعد: أنشئ المفتاح قبل بدء العملية؛ إذا وُجد — أعد النتيجة/ارفض التنفيذ.

### 6.3 مفاتيح الكاش (قالب)
```
cache:{tenant_id}:{resource}:{query_hash}
TTL: 60–300s (تقارير ثقيلة قد تكون أطول مع explicit invalidation)
```

### 6.4 فهارس مقترحة
- `(tenant_id, created_at desc)` على جداول الحركات/الفواتير.  
- `(warehouse_id, product_id)` على المخزون.  
- مفاتيح بحث شائعة (barcode, sku, phone).

### 6.5 Runbook: اختبار استعادة PostgreSQL (مقتضب)
1) إنشاء بيئة استعادة معزولة.  
2) استعادة Snapshot + WAL (PITR إلى نقطة زمنية).  
3) تشغيل Smoke: (تسجيل دخول/إنشاء فاتورة/تقرير).  
4) تسجيل الزمن والنتائج، وتحديث لوحة DR‑KPIs.

---

**الخلاصة:** بتنفيذ P0 خلال 30 يومًا ثم P1 خلال 60 يومًا، تصبح المنصة **SaaS آمنة وعملية**، ثم تُبنى قدرات الربحية والتحليلات في P2. هذا المستند مرجع عملي للتنفيذ السريع بأقل مخاطرة.
