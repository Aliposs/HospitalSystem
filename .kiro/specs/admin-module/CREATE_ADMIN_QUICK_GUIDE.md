# إنشاء حساب أدمن - دليل سريع

## ⚡ الخطوات (3 دقائق فقط)

### 1️⃣ إنشاء المستخدم في Supabase

**Supabase Dashboard** → **Authentication** → **Users** → **Add user** → **Create new user**

```
Email: admin@yourdomain.com
Password: Admin@123456
✅ Auto Confirm User (مهم!)
```

اضغط **Create user**

---

### 2️⃣ انسخ الـ UID

من قائمة Users، اضغط على المستخدم وانسخ الـ **UID**

مثال: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`

---

### 3️⃣ أضف في جدول admin_users

**Supabase Dashboard** → **SQL Editor** → **New query**

```sql
INSERT INTO admin_users (user_id, email, full_name, account_status)
VALUES (
  'YOUR_USER_ID_HERE',
  'admin@yourdomain.com',
  'System Administrator',
  'Active'
);
```

اضغط **Run**

---

### 4️⃣ سجل دخول

اذهب إلى: `http://localhost:5173/login`

```
Email: admin@yourdomain.com
Password: Admin@123456
```

✅ سيتم توجيهك إلى `/admin/dashboard`

---

## ✅ التحقق

```sql
-- تحقق من الأدمن
SELECT * FROM admin_users WHERE email = 'admin@yourdomain.com';

-- تحقق من الـ function
SELECT is_admin('YOUR_USER_ID');
-- يجب أن يرجع: true
```

---

## 🎯 ملاحظات

- ✅ الأدمن **منفصل تماماً** عن الدكاترة والمرضى
- ✅ لا يمكن التسجيل كأدمن من صفحة التسجيل (أمان)
- ✅ الأدمن يتم إنشاؤه من Supabase فقط
- ✅ بعد إنشاء أول أدمن، يمكنه إضافة أدمن آخرين من لوحة التحكم

---

**انتهى!** 🎉
