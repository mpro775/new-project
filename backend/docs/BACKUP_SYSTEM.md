# نظام النسخ الاحتياطي (Backup System)

## نظرة عامة

يوفر نظام النسخ الاحتياطي حلاً شاملاً لضمان سلامة البيانات في نظام زيتونة POS. النظام يدعم النسخ التلقائي واليدوي مع التشفير والاستعادة الآمنة.

## الميزات

- ✅ **النسخ التلقائي**: جدولة يومية تلقائية
- ✅ **التشفير**: تشفير البيانات باستخدام AES-256
- ✅ **الاختبار**: التحقق من صحة النسخ الاحتياطي
- ✅ **الاستعادة**: استعادة البيانات بأمان
- ✅ **المراقبة**: تتبع حالة النسخ الاحتياطي
- ✅ **التنظيف التلقائي**: حذف النسخ القديمة

## إعداد متغيرات البيئة

```env
# نظام النسخ الاحتياطي
BACKUP_ENCRYPTION_KEY=your_32_character_encryption_key_here
BACKUP_RETENTION_DAYS=30
BACKUP_MAX_SIZE_MB=1024
BACKUP_SCHEDULE=0 2 * * * # كل يوم في الساعة 2 صباحاً
```

## استخدام API

### إنشاء نسخة احتياطية يدوية

```bash
POST /backup/manual
Authorization: Bearer <token>
```

**الرد:**
```json
{
  "success": true,
  "data": {
    "id": "backup_20241112_123456_abc123",
    "backupId": "backup_20241112_123456_abc123",
    "timestamp": "2024-11-12T12:34:56.789Z",
    "type": "manual",
    "status": "completed",
    "size": 1048576,
    "encrypted": true,
    "duration": 15000
  }
}
```

### الحصول على قائمة النسخ الاحتياطية

```bash
GET /backup/list
Authorization: Bearer <token>
```

### الحصول على إحصائيات النسخ الاحتياطي

```bash
GET /backup/stats
Authorization: Bearer <token>
```

**الرد:**
```json
{
  "totalBackups": 15,
  "successfulBackups": 14,
  "failedBackups": 1,
  "lastBackup": "2024-11-12T02:00:00.000Z",
  "totalSize": 15728640,
  "activeBackups": 0
}
```

### اختبار نظام النسخ الاحتياطي

```bash
POST /backup/test
Authorization: Bearer <token>
```

### استعادة نسخة احتياطية

```bash
POST /backup/restore
Authorization: Bearer <token>
Content-Type: application/json

{
  "backupId": "backup_20241112_123456_abc123",
  "targetDatabase": "postgresql://user:pass@localhost:5432/restore_db",
  "dropExisting": false,
  "verifyOnly": false
}
```

## استخدام CLI

### إنشاء نسخة احتياطية يدوية

```bash
npm run backup:create
```

### اختبار النظام

```bash
npm run backup:test
```

### استعادة نسخة احتياطية

```bash
# التحقق من صحة النسخة فقط
npm run backup:restore backup_20241112_123456_abc123 --verify-only

# استعادة كاملة (مع حذف البيانات الموجودة)
npm run backup:restore backup_20241112_123456_abc123 --drop-existing

# استعادة إلى قاعدة بيانات مختلفة
npm run backup:restore backup_20241112_123456_abc123 postgresql://user:pass@localhost:5432/new_db
```

## الأمان

### التشفير
- يستخدم النظام تشفير AES-256-CBC لجميع النسخ الاحتياطية
- يتم إنشاء IV عشوائي لكل ملف
- مفتاح التشفير مخزن في متغيرات البيئة

### الصلاحيات
- يتطلب صلاحيات محددة للوصول لعمليات النسخ الاحتياطي:
  - `backup:create` - إنشاء نسخ احتياطية
  - `backup:read` - قراءة معلومات النسخ الاحتياطي
  - `backup:delete` - حذف نسخ احتياطية
  - `backup:restore` - استعادة نسخ احتياطية
  - `backup:test` - اختبار النظام

## المراقبة والصيانة

### التنظيف التلقائي
- يتم حذف النسخ الاحتياطية القديمة تلقائياً حسب `BACKUP_RETENTION_DAYS`
- يمكن تعديل فترة الاحتفاظ من متغيرات البيئة

### السجلات
- جميع عمليات النسخ الاحتياطي مسجلة في Audit Log
- معلومات مفصلة عن الأخطاء والنجاحات

### التنبيهات
- تنبيهات تلقائية عند فشل النسخ الاحتياطي
- تقارير دورية عن حالة النظام

## استكشاف الأخطاء

### مشاكل شائعة

1. **فشل الاتصال بقاعدة البيانات**
   - تأكد من صحة `DATABASE_URL`
   - تحقق من تشغيل PostgreSQL

2. **مشكلة في التشفير**
   - تأكد من وجود `BACKUP_ENCRYPTION_KEY` (32 حرفاً)
   - تحقق من صلاحيات الكتابة في مجلد النسخ

3. **مساحة القرص غير كافية**
   - مراقبة حجم النسخ الاحتياطية
   - تعديل `BACKUP_RETENTION_DAYS` لتقليل عدد النسخ

4. **فشل الاستعادة**
   - استخدم `--verify-only` للتحقق من سلامة الملف
   - تأكد من عدم استخدام قاعدة البيانات أثناء الاستعادة

## الأداء

### التأثير على النظام
- النسخ التلقائي يعمل في أوقات الذروة المنخفضة (2 صباحاً)
- يمكن جدولة النسخ اليدوي في أوقات مناسبة

### تحسينات الأداء
- ضغط البيانات لتقليل الحجم
- معالجة متداخلة للعمليات الكبيرة
- فهرسة البيانات الوصفية للبحث السريع

## التوسع

### دعم قواعد البيانات الأخرى
يمكن توسيع النظام لدعم:
- MySQL/MariaDB
- MongoDB
- Redis
- ملفات التطبيق

### التخزين السحابي
- AWS S3
- Google Cloud Storage
- Azure Blob Storage

### النسخ الموزع
- نسخ احتياطي متعدد المواقع
- مزامنة بين الخوادم
- نسخ احتياطي هجين (محلي + سحابي)
