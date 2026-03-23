# دليل إنشاء حساب أدمن منفصل

## 🎯 الهدف

إنشاء حساب أدمن **منفصل تماماً** عن الدكاترة والمرضى والمعامل.

---

## ⚡ الطريقة السريعة (3 دقائق)

### الخطوة 1: سجل مستخدم جديد

اذهب إلى صفحة التسجيل في تطبيقك:
```
http://localhost:5173/register
```

سجل بالبيانات التالية:
- **Email**: `admin@yourdomain.com`
- **Password**: `YourSecurePassword123`
- **Name**: `Admin User`

**مهم**: لا تختار "Doctor" أو "Patient" - هذا سيكون حساب أدمن فقط.

---

### الخطوة 2: احصل على User ID

افتح Supabase Dashboard:
1. اذهب إلى **Authentication** → **Users**
2. ابحث عن الإيميل: `admin@yourdomain.com`
3. انسخ الـ **ID** (يبدو مثل: `550e8400-e29b-41d4-a716-446655440000`)

---

### الخطوة 3: أضف الأدمن في قاعدة البيانات

افتح **Supabase SQL Editor** وشغل هذا الأمر:

```sql
INSERT INTO admin_users (user_id, email, full_name, account_status)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',  -- ضع الـ ID من الخطوة 2
  'admin@yourdomain.com',
  'Admin User',
  'Active'
);
```

---

### الخطوة 4: تحقق من النجاح

```sql
-- تحقق من وجود الأدمن
SELECT * FROM admin_users WHERE email = 'admin@yourdomain.com';

-- تحقق من الـ function
SELECT is_admin('550e8400-e29b-41d4-a716-446655440000');
-- يجب أن يرجع: true
```

---

## ✅ تم بنجاح!

الآن يمكنك:
1. تسجيل الدخول بحساب الأدمن
2. الوصول إلى `/admin/dashboard`
3. إدارة المستخدمين والتخصصات

---

## 🔍 التحقق من الفصل الكامل

```sql
-- تحقق من أن الأدمن ليس في user_roles
SELECT * FROM user_roles WHERE user_id = '550e8400-e29b-41d4-a716-446655440000';
-- يجب أن يكون فارغ (لا نتائج)

-- تحقق من أن الأدمن ليس في doctors
SELECT * FROM doctors WHERE user_id = '550e8400-e29b-41d4-a716-446655440000';
-- يجب أن يكون فارغ (لا نتائج)

-- تحقق من أن الأدمن في admin_users فقط
SELECT * FROM admin_users WHERE user_id = '550e8400-e29b-41d4-a716-446655440000';
-- يجب أن يظهر سجل واحد
```

---

## 📊 مثال كامل

```sql
-- مثال: إنشاء 3 أدمن

-- Admin 1
INSERT INTO admin_users (user_id, email, full_name, account_status)
VALUES (
  'uuid-admin-1',
  'admin1@example.com',
  'Ahmed Admin',
  'Active'
);

-- Admin 2
INSERT INTO admin_users (user_id, email, full_name, account_status)
VALUES (
  'uuid-admin-2',
  'admin2@example.com',
  'Mohamed Admin',
  'Active'
);

-- Admin 3
INSERT INTO admin_users (user_id, email, full_name, account_status)
VALUES (
  'uuid-admin-3',
  'admin3@example.com',
  'Sara Admin',
  'Active'
);

-- تحقق من الأدمن
SELECT email, full_name, account_status FROM admin_users;
```

---

## 🚫 ما لا يجب فعله

❌ **لا تضع** user_id من جدول `doctors` في `admin_users`
❌ **لا تضع** user_id من جدول `patients` في `admin_users`
❌ **لا تضع** user_id من جدول `user_roles` في `admin_users`

✅ **فقط** أنشئ حسابات جديدة منفصلة للأدمن

---

## 🎉 النتيجة

```
admin_users table:
- user_id: 'admin-uuid-1'
- email: 'admin@example.com'
- role: Admin (ضمني)

user_roles table:
- user_id: 'doctor-uuid-1'
- role: 'Doctor'

doctors table:
- user_id: 'doctor-uuid-1'
- full_name: 'Dr. Ahmed'

✅ لا تعارض: كل شخص له دور واحد واضح
✅ الأدمن منفصلين تماماً
```

---

**جاهز للاستخدام!** 🚀
