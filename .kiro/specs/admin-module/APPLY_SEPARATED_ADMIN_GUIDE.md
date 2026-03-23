# دليل تطبيق نظام الأدمن المنفصل

## 📋 نظرة عامة

هذا الدليل يشرح كيفية تطبيق نظام الأدمن المنفصل على قاعدة البيانات الخاصة بك.

---

## ✅ الوضع الحالي

- ✅ جدول `user_roles` موجود لكن فاضي (مافيش بيانات)
- ✅ الـ backend معدل ويستخدم `admin_users` للأدمن
- ✅ الـ schema الجديد جاهز للتطبيق

---

## 🚀 خطوات التطبيق (5 دقائق)

### الخطوة 1: تطبيق الـ Schema الجديد

1. افتح **Supabase Dashboard**
2. اذهب إلى **SQL Editor**
3. افتح ملف `.kiro/specs/admin-module/ADMIN_MODULE_SEPARATED_SCHEMA.sql`
4. انسخ **كل المحتوى**
5. الصق في SQL Editor
6. اضغط **Run**

**ما سيحدث**:
- ✅ إنشاء جدول `admin_users` (للأدمن فقط)
- ✅ إنشاء/تحديث جدول `user_roles` (للدكاترة والمرضى والمعامل فقط)
- ✅ إنشاء جدول `medical_specializations`
- ✅ إنشاء جدول `doctor_specializations`
- ✅ إنشاء جدول `audit_logs`
- ✅ إنشاء جدول `dashboard_cache`
- ✅ إضافة أعمدة للجداول الموجودة (doctors, appointments, doctor_availability)
- ✅ إنشاء 5 views
- ✅ إنشاء 7 functions
- ✅ إنشاء 4 triggers

**ملاحظة**: الأمر `IF NOT EXISTS` يضمن عدم حدوث أخطاء إذا كانت الجداول موجودة بالفعل.

---

### الخطوة 2: إنشاء أول حساب أدمن (من Supabase مباشرة)

**ملاحظة مهمة**: صفحة التسجيل في التطبيق مصممة للدكاترة والمرضى فقط (كل واحد له حقول خاصة). لذلك، سننشئ حساب الأدمن من Supabase مباشرة.

#### 2.1 إنشاء مستخدم في Supabase Authentication

1. افتح **Supabase Dashboard**
2. اذهب إلى **Authentication** → **Users**
3. اضغط **"Add user"** → **"Create new user"**
4. أدخل البيانات:
   - **Email**: `admin@yourdomain.com` (أو أي إيميل تريده)
   - **Password**: `Admin@123456` (أو أي كلمة مرور قوية)
   - **Auto Confirm User**: ✅ **علم على هذا الخيار** (مهم جداً!)
5. اضغط **"Create user"**
6. ستظهر رسالة نجاح وسيظهر المستخدم في القائمة

#### 2.2 احصل على user_id

في نفس صفحة Users، ستجد المستخدم الذي أنشأته:
- اضغط على المستخدم
- انسخ الـ **UID** (سيكون شكله مثل: `550e8400-e29b-41d4-a716-446655440000`)

#### 2.3 أضف المستخدم كأدمن في جدول admin_users

1. افتح **SQL Editor** في Supabase
2. نفذ هذا الأمر (استبدل `YOUR_USER_ID` بالـ UID من الخطوة السابقة):

```sql
INSERT INTO admin_users (user_id, email, full_name, account_status)
VALUES (
  'YOUR_USER_ID',
  'admin@yourdomain.com',
  'System Administrator',
  'Active'
);
```

3. اضغط **Run**
4. ستظهر رسالة "Success. No rows returned"

---

### الخطوة 3: التحقق من النجاح

```sql
-- 1. تحقق من جدول admin_users
SELECT * FROM admin_users;
-- يجب أن يظهر حساب الأدمن الذي أنشأته

-- 2. تحقق من جدول user_roles
SELECT * FROM user_roles WHERE role = 'Admin';
-- يجب أن يكون فارغ (لا يوجد أدمن في user_roles)

-- 3. تحقق من الـ function
SELECT is_admin('YOUR_USER_ID');
-- يجب أن يرجع: true

-- 4. تحقق من الـ views
SELECT * FROM active_admins;
-- يجب أن يظهر حساب الأدمن

-- 5. تحقق من كل الجداول
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'admin_users', 
  'user_roles', 
  'medical_specializations', 
  'doctor_specializations', 
  'audit_logs', 
  'dashboard_cache'
);
-- يجب أن يظهر كل الجداول الـ 6
```

---

## 🔐 تسجيل الدخول كأدمن

بعد إنشاء حساب الأدمن:

1. اذهب إلى صفحة تسجيل الدخول
2. سجل دخول بإيميل الأدمن: `admin@yourdomain.com`
3. كلمة المرور: `Admin@123456`
4. سيتم توجيهك إلى لوحة تحكم الأدمن

---

## 📊 كيف يعمل النظام المنفصل؟

### للأدمن:
```
1. المستخدم يسجل في التطبيق
   ↓
2. يتم إنشاء حساب في auth.users
   ↓
3. الأدمن يضيفه في جدول admin_users
   ↓
4. المستخدم يصبح أدمن فقط (ليس دكتور أو مريض)
```

### للدكاترة/مرضى/معامل:
```
1. المستخدم يسجل في التطبيق
   ↓
2. يتم إنشاء حساب في auth.users
   ↓
3. يتم إضافته في جدول user_roles (role: Doctor/Patient/Lab)
   ↓
4. يتم إضافته في جدول doctors أو patients أو labs
   ↓
5. المستخدم يصبح دكتور/مريض/معمل فقط (ليس أدمن)
```

---

## 🎯 الفرق الرئيسي

### النظام القديم (المشكلة):
```
auth.users
    ↓
user_roles (role: Admin/Doctor/Patient/Lab)
    ↓
doctors table
    ↓
❌ نفس الشخص ممكن يكون أدمن ودكتور في نفس الوقت
```

### النظام الجديد (الحل):
```
auth.users
    ↓
    ├─→ admin_users (للأدمن فقط)
    │
    └─→ user_roles (للدكاترة/مرضى/معامل فقط)
        ↓
        doctors/patients/labs tables
        
✅ كل شخص له دور واحد واضح
✅ لا تعارض على الإطلاق
```

---

## 🔧 ماذا تم تعديله في الـ Backend؟

### ملف: `Server/src/middleware/adminAuth.js`
```javascript
// يتحقق من جدول admin_users (ليس user_roles)
const { data: adminUser } = await supabase
  .from('admin_users')  // ← هنا التعديل
  .select('*')
  .eq('user_id', user.id)
  .single();
```

### ملف: `Server/src/services/adminUserService.js`
- ✅ يستخدم `user_roles` للدكاترة والمرضى (صح)
- ✅ يستخدم `admin_users` للأدمن (صح)

### ملف: `Server/src/services/adminDashboardService.js`
- ✅ يستخدم `user_roles` لإحصائيات الدكاترة والمرضى (صح)
- ✅ يستخدم `admin_users` لإحصائيات الأدمن (صح)

---

## 🆘 استكشاف الأخطاء

### خطأ: "relation admin_users does not exist"

**السبب**: لم يتم تطبيق الـ schema بعد

**الحل**: قم بتطبيق ملف `ADMIN_MODULE_SEPARATED_SCHEMA.sql` في Supabase SQL Editor

---

### خطأ: "foreign key constraint"

**السبب**: الجداول القديمة لا تزال موجودة وتتعارض

**الحل**: قم بتطبيق ملف `CLEANUP_OLD_SCHEMA.sql` أولاً لحذف الجداول القديمة

---

### خطأ: "User is not an admin"

**السبب**: المستخدم غير موجود في جدول `admin_users`

**الحل**: قم بإضافة المستخدم في جدول `admin_users` باستخدام الأمر في الخطوة 2.3

---

## 📝 ملخص سريع

1. **طبق الـ schema**: نفذ `ADMIN_MODULE_SEPARATED_SCHEMA.sql` في Supabase
2. **سجل حساب جديد**: في التطبيق (إيميل جديد)
3. **أضفه كأدمن**: نفذ `INSERT INTO admin_users ...` في Supabase
4. **سجل دخول**: استخدم إيميل الأدمن للدخول

---

## ✅ النتيجة النهائية

بعد تطبيق هذه الخطوات:
- ✅ الأدمن منفصلين تماماً عن الدكاترة والمرضى
- ✅ لا تعارض في الأدوار
- ✅ النظام آمن ومنظم
- ✅ كل إجراءات الأدمن مسجلة في `audit_logs`

---

**جاهز للتطبيق؟** 🚀

ابدأ بالخطوة 1 (تطبيق الـ schema) وأخبرني عند الانتهاء!
