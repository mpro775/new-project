# Use Cases و User Stories - مشروع زيتونة

## مقدمة
يحتوي هذا الملف على جميع السيناريوهات الوظيفية (Use Cases) والقصص المستخدمة (User Stories) التي تحدد ما يمكن للمستخدمين فعله داخل نظام زيتونة. تم تنظيمها حسب الشخصيات المختلفة مع التركيز على الوظائف الأساسية والمتقدمة.

---

## 1. أحمد الصراف (Cashier Persona)

### User Stories الأساسية

#### البيع اليومي
**كصراف، أريد مسح المنتجات بالكاميرا**
```
As a cashier,
I want to scan products using the camera
So that I can quickly add items to the cart without manual entry
```

**كصراف، أريد رؤية سلة المشتريات بوضوح**
```
As a cashier,
I want to see a clear cart with item names, quantities, and prices
So that I can verify the order before payment
```

**كصراف، أريد حساب الإجمالي تلقائياً**
```
As a cashier,
I want the system to automatically calculate totals including taxes and discounts
So that I avoid calculation errors
```

#### طرق الدفع
**كصراف، أريد قبول الدفع النقدي**
```
As a cashier,
I want to process cash payments
So that I can handle traditional payment methods
```

**كصراف، أريد قبول الدفع بالبطاقة**
```
As a cashier,
I want to process card payments through integrated gateway
So that customers can pay with credit/debit cards
```

**كصراف، أريد قبول الدفع بالمحفظة الإلكترونية**
```
As a cashier,
I want to accept digital wallet payments
So that I can serve tech-savvy customers
```

#### الطباعة والمشاركة
**كصراف، أريد طباعة الفاتورة تلقائياً**
```
As a cashier,
I want the system to automatically print receipts
So that customers get physical copies
```

**كصراف، أريد مشاركة الفاتورة عبر واتساب**
```
As a cashier,
I want to share invoices via WhatsApp
So that customers can easily access digital copies
```

#### وضع عدم الاتصال
**كصراف، أريد العمل بدون إنترنت**
```
As a cashier,
I want to continue selling when internet is down
So that business doesn't stop during connectivity issues
```

**كصراف، أريد مزامنة البيانات تلقائياً**
```
As a cashier,
I want data to sync automatically when connection returns
So that no sales data is lost
```

### Use Cases المفصلة

#### UC-1: إتمام عملية بيع كاملة
**الممثل الرئيسي:** الصراف
**المتطلبات المسبقة:** الصراف مسجل دخول، النظام متصل
**التدفق الأساسي:**
1. الصراف يمسح المنتجات بالكاميرا
2. النظام يضيف المنتجات للسلة ويظهر الأسعار
3. الصراف يطبق خصومات إن وجدت
4. النظام يحسب الإجمالي مع الضرائب
5. الصراف يختار طريقة الدفع
6. النظام يعالج الدفع ويطبع الفاتورة
7. الصراف يشارك الفاتورة عبر واتساب

#### UC-2: معالجة المرتجعات
**الممثل الرئيسي:** الصراف
**المتطلبات المسبقة:** فاتورة أصلية موجودة
**التدفق الأساسي:**
1. الصراف يبحث عن الفاتورة بالرقم أو رقم الهاتف
2. النظام يعرض تفاصيل الفاتورة
3. الصراف يحدد المنتجات المراد إرجاعها
4. النظام يتحقق من سياسة الإرجاع
5. الصراف يحدد سبب الإرجاع
6. النظام يحسب المبلغ المسترد
7. الصراف يعالج الاسترداد ويطبع إيصال الإرجاع

---

## 2. فاطمة مديرة الفرع (Branch Manager Persona)

### User Stories الإدارية

#### مراقبة الأداء
**كمدير فرع، أريد رؤية مبيعات اليوم**
```
As a branch manager,
I want to see today's sales figures
So that I can track daily performance
```

**كمدير فرع، أريد رؤية أداء الصرافين**
```
As a branch manager,
I want to see cashier performance metrics
So that I can identify top performers and areas for improvement
```

**كمدير فرع، أريد تنبيهات المخزون المنخفض**
```
As a branch manager,
I want alerts for low stock items
So that I can reorder before stockouts occur
```

#### إدارة المنتجات
**كمدير فرع، أريد تعديل الأسعار محلياً**
```
As a branch manager,
I want to adjust local prices for promotions
So that I can run branch-specific deals
```

**كمدير فرع، أريد إدارة العروض الخاصة**
```
As a branch manager,
I want to create and manage special offers
So that I can attract more customers
```

#### إدارة الموظفين
**كمدير فرع، أريد جدولة الورديات**
```
As a branch manager,
I want to schedule employee shifts
So that I can ensure adequate staffing
```

**كمدير فرع، أريد تتبع حضور الموظفين**
```
As a branch manager,
I want to track employee attendance
So that I can manage payroll accurately
```

### Use Cases الإدارية

#### UC-3: مراقبة أداء الفرع
**الممثل الرئيسي:** مدير الفرع
**المتطلبات المسبقة:** صلاحيات مدير الفرع
**التدفق الأساسي:**
1. مدير الفرع يدخل لوحة التحكم
2. النظام يعرض مؤشرات الأداء الرئيسية (مبيعات، أرباح، حركة العملاء)
3. مدير الفرع يختار فترة زمنية محددة
4. النظام يعرض التقارير التفصيلية
5. مدير الفرع يقارن مع الأهداف
6. النظام يولد توصيات للتحسين

#### UC-4: إدارة المخزون اليومية
**الممثل الرئيسي:** مدير الفرع
**المتطلبات المسبقة:** صلاحيات إدارة المخزون
**التدفق الأساسي:**
1. مدير الفرع يدخل قسم المخزون
2. النظام يعرض مستويات المخزون الحالية
3. مدير الفرع يراجع التنبيهات للمنخفض
4. النظام يقترح كميات إعادة الطلب
5. مدير الفرع يوافق على طلبات الشراء
6. النظام يرسل الطلبات للموردين

---

## 3. محمد المحاسب (Accountant Persona)

### User Stories المحاسبية

#### القيود اليومية
**كمحاسب، أريد رؤية القيود التلقائية**
```
As an accountant,
I want to see automatically generated journal entries
So that I don't have to manually enter sales/purchase transactions
```

**كمحاسب، أريد تعديل القيود يدوياً**
```
As an accountant,
I want to manually adjust journal entries
So that I can correct errors or add special entries
```

**كمحاسب، أريد إقفال الفترة المحاسبية**
```
As an accountant,
I want to close accounting periods
So that I can prepare accurate financial statements
```

#### التقارير المالية
**كمحاسب، أريد تقرير الميزانية العمومية**
```
As an accountant,
I want to generate balance sheet reports
So that I can show the company's financial position
```

**كمحاسب، أريد تقرير الدخل**
```
As an accountant,
I want to generate income statements
So that I can show profitability over time
```

**كمحاسب، أريد تقرير التدفق النقدي**
```
As an accountant,
I want to generate cash flow statements
So that I can track cash movements
```

#### الضرائب والامتثال
**كمحاسب، أريد حساب الضرائب تلقائياً**
```
As an accountant,
I want automatic tax calculations
So that I comply with tax regulations
```

**كمحاسب، أريد تصدير البيانات للضرائب**
```
As an accountant,
I want to export data for tax filing
So that I can easily prepare tax returns
```

### Use Cases المحاسبية

#### UC-5: إدارة دليل الحسابات
**الممثل الرئيسي:** المحاسب
**المتطلبات المسبقة:** صلاحيات محاسبية كاملة
**التدفق الأساسي:**
1. المحاسب يدخل قسم دليل الحسابات
2. النظام يعرض شجرة الحسابات
3. المحاسب يضيف حسابات جديدة أو يعدل الموجودة
4. النظام يتحقق من صحة التسلسل
5. المحاسب يربط الحسابات بالعمليات التجارية
6. النظام يحفظ التغييرات ويحدث القيود

#### UC-6: إعداد التقارير المالية
**الممثل الرئيسي:** المحاسب
**المتطلبات المسبقة:** بيانات محاسبية متاحة
**التدفق الأساسي:**
1. المحاسب يختار نوع التقرير
2. النظام يطلب الفترة الزمنية
3. المحاسب يحدد معايير التقرير
4. النظام يولد التقرير ويعرضه
5. المحاسب يراجع ويقوم بتعديلات إن لزم
6. النظام يصدّر التقرير بصيغ مختلفة (PDF، Excel)

---

## 4. علي رجل الأعمال (Business Owner Persona)

### User Stories الاستراتيجية

#### الرؤية الشاملة
**كرجل أعمال، أريد رؤية جميع الفروع**
```
As a business owner,
I want to see performance across all branches
So that I can make strategic decisions
```

**كرجل أعمال، أريد مقارنة الأداء بين الفروع**
```
As a business owner,
I want to compare branch performance
So that I can identify best practices and problems
```

**كرجل أعمال، أريد التنبؤات المالية**
```
As a business owner,
I want financial forecasts
So that I can plan investments and growth
```

#### إدارة الشركة
**كرجل أعمال، أريد إضافة فروع جديدة**
```
As a business owner,
I want to add new branches easily
So that I can expand my business
```

**كرجل أعمال، أريد إدارة المستخدمين**
```
As a business owner,
I want to manage user roles and permissions
So that I can control access to sensitive data
```

**كرجل أعمال، أريد إعدادات النظام**
```
As a business owner,
I want to configure system settings
So that I can customize it for my business needs
```

### Use Cases الاستراتيجية

#### UC-7: لوحة التحكم التنفيذية
**الممثل الرئيسي:** رجل الأعمال
**المتطلبات المسبقة:** صلاحيات المدير العام
**التدفق الأساسي:**
1. رجل الأعمال يدخل لوحة التحكم الرئيسية
2. النظام يعرض مؤشرات الأداء الرئيسية للشركة
3. رجل الأعمال يختار فرعاً محدداً للتفاصيل
4. النظام يعرض تحليلات مفصلة للفرع
5. رجل الأعمال يرى التنبيهات والتوصيات
6. النظام يولد تقارير تنفيذية

#### UC-8: إدارة الشركة
**الممثل الرئيسي:** رجل الأعمال
**المتطلبات المسبقة:** صلاحيات إدارية كاملة
**التدفق الأساسي:**
1. رجل الأعمال يدخل إعدادات الشركة
2. النظام يعرض هيكل الفروع والمخازن
3. رجل الأعمال يضيف فرعاً جديداً
4. النظام يطلب تفاصيل الفرع (عنوان، مدير، إلخ)
5. رجل الأعمال يعين المستخدمين والصلاحيات
6. النظام ينشئ الفرع ويربطه بالنظام

---

## 5. سارة أمينة المخزن (Inventory Manager Persona)

### User Stories المخزنية

#### إدارة المخزون
**كأمين مخزن، أريد رؤية مستويات المخزون**
```
As an inventory manager,
I want to see current stock levels
So that I can plan replenishment
```

**كأمين مخزن، أريد إجراء الجرد**
```
As an inventory manager,
I want to conduct inventory counts
So that I can verify actual stock against system records
```

**كأمين مخزن، أريد تحويل بين المخازن**
```
As an inventory manager,
I want to transfer items between warehouses
So that I can balance stock distribution
```

#### الطلبات والشراء
**كأمين مخزن، أريد إنشاء طلبات شراء**
```
As an inventory manager,
I want to create purchase orders
So that I can replenish low stock items
```

**كأمين مخزن، أريد استلام البضائع**
```
As an inventory manager,
I want to receive goods from suppliers
So that I can update inventory accurately
```

**كأمين مخزن، أريد تتبع المنتجات المنتهية**
```
As an inventory manager,
I want to track expired products
So that I can remove them from inventory
```

### Use Cases المخزنية

#### UC-9: إدارة حركة المخزون
**الممثل الرئيسي:** أمين المخزن
**المتطلبات المسبقة:** صلاحيات إدارة المخزون
**التدفق الأساسي:**
1. أمين المخزن يدخل قسم المخزون
2. النظام يعرض حركة المخزون التاريخية
3. أمين المخزن يختار نوع الحركة (دخول، خروج، تحويل)
4. النظام يطلب تفاصيل الحركة (منتج، كمية، سبب)
5. أمين المخزن يؤكد الحركة
6. النظام يحدث المخزون ويسجل الحركة

#### UC-10: عملية الجرد الدوري
**الممثل الرئيسي:** أمين المخزن
**المتطلبات المسبقة:** صلاحيات الجرد
**التدفق الأساسي:**
1. أمين المخزن يبدأ عملية جرد جديدة
2. النظام يعرض قائمة المنتجات المراد جردها
3. أمين المخزن يمسح الباركود ويدخل الكمية الفعلية
4. النظام يحسب الفروقات تلقائياً
5. أمين المخزن يراجع الفروقات ويضيف أسباب
6. النظام يحدث المخزون ويولد تقرير الجرد

---

## 6. السيناريوهات المشتركة (Cross-Cutting Scenarios)

### User Stories المشتركة

#### المصادقة والأمان
**كمستخدم، أريد تسجيل الدخول الآمن**
```
As any user,
I want secure login with 2FA
So that my account is protected
```

**كمستخدم، أريد تغيير كلمة المرور**
```
As any user,
I want to change my password regularly
So that I maintain security
```

#### الإشعارات والتنبيهات
**كمستخدم، أريد تلقي التنبيهات**
```
As any user,
I want to receive important notifications
So that I stay informed about critical events
```

**كمستخدم، أريد تخصيص الإشعارات**
```
As any user,
I want to customize notification preferences
So that I only receive relevant alerts
```

### Use Cases متقاطعة

#### UC-11: استعادة كلمة المرور
**الممثل الرئيسي:** أي مستخدم
**المتطلبات المسبقة:** حساب مسجل
**التدفق الأساسي:**
1. المستخدم يطلب استعادة كلمة المرور
2. النظام يرسل رمز تحقق للبريد الإلكتروني أو الهاتف
3. المستخدم يدخل الرمز
4. النظام يتحقق من صحة الرمز
5. المستخدم يدخل كلمة مرور جديدة
6. النظام يحدث كلمة المرور ويؤكد النجاح

#### UC-12: المزامنة في وضع عدم الاتصال
**الممثل الرئيسي:** أي مستخدم (خاصة الصراف)
**المتطلبات المسبقة:** فقدان الاتصال بالإنترنت
**التدفق الأساسي:**
1. النظام يكتشف فقدان الاتصال
2. يخزن العمليات محلياً في IndexedDB
3. يظهر مؤشراً للوضع offline
4. عند عودة الاتصال، يبدأ المزامنة تلقائياً
5. يعرض تقدم المزامنة للمستخدم
6. يؤكد نجاح المزامنة أو يعرض الأخطاء

---

## 7. جدول ملخص الوظائف

| الوظيفة | أحمد الصراف | فاطمة المدير | محمد المحاسب | علي رجل الأعمال | سارة أمين المخزن |
|---------|-------------|--------------|---------------|------------------|-------------------|
| البيع والدفع | ✅ كامل | ❌ | ❌ | ❌ | ❌ |
| المرتجعات | ✅ كامل | ✅ مراجعة | ✅ مراجعة | ❌ | ❌ |
| إدارة المخزون | ❌ | ✅ متوسط | ❌ | ✅ عالي المستوى | ✅ كامل |
| المحاسبة | ❌ | ✅ أساسي | ✅ كامل | ✅ مراجعة | ❌ |
| التقارير | ❌ | ✅ متوسط | ✅ كامل | ✅ كامل | ✅ متوسط |
| إدارة المستخدمين | ❌ | ✅ محدود | ❌ | ✅ كامل | ❌ |
| الإعدادات | ❌ | ✅ محدود | ❌ | ✅ كامل | ❌ |

---

## 8. معايير القبول للوظائف الرئيسية

### البيع والدفع:
- [ ] مسح المنتج يستغرق أقل من 2 ثانية
- [ ] حساب الإجمالي دقيق 100%
- [ ] جميع طرق الدفع تعمل بنجاح
- [ ] الفاتورة تُطبع في أقل من 5 ثواني

### إدارة المخزون:
- [ ] عرض مستويات المخزون في الوقت الفعلي
- [ ] تنبيهات المنخفض تعمل تلقائياً
- [ ] عملية الجرد تكتمل في أقل من 4 ساعات لمخزن متوسط
- [ ] تحويل بين المخازن يحدث فوراً

### المحاسبة:
- [ ] القيود التلقائية دقيقة 100%
- [ ] التقارير المالية متوازنة دائماً
- [ ] إقفال الفترة يستغرق أقل من 10 دقائق
- [ ] التصدير للضرائب يعمل بسلاسة

### وضع عدم الاتصال:
- [ ] النظام يعمل بدون إنترنت لمدة 24 ساعة
- [ ] المزامنة تحدث تلقائياً عند عودة الاتصال
- [ ] لا فقد للبيانات في أي ظرف
- [ ] الصراف يعرف حالة الاتصال دائماً

---

**تاريخ الإنشاء:** نوفمبر 2025
**المسؤول عن Use Cases:** فريق التحليل والتصميم
**تاريخ آخر تحديث:** نوفمبر 2025
