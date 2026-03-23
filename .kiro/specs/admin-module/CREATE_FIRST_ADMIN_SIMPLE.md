# إنشاء أول حساب أدمن - خطوات بسيطة

## 📋 ملاحظة مهمة

صفحة التسجيل في التطبيق مصممة للدكاترة والمرضى فقط (كل واحد له حقول خاصة).
لذلك، سننشئ حساب الأدمن من **Supabase Dashboard** مباشرة.

---

## 🚀 الخطوات (3 دقائق)

### الخطوة 1: إنشاء مستخدم في Supabase

1. افتح **Supabase Dashboard**: https://supabase.com/dashboard
2. اختر مشروعك
3. من القائمة الجانبية، اذهب إلى: **Authentication** → **Users**
4. اضغط الزر الأخضر **"Add user"**
5. اختر **"Create new user"**
6. املأ البيانات:
   ```
   Email: admin@yourdomain.com
   Password: Admin@123456
   ```
7. **مهم جداً**: علم على ✅ **"Auto Confirm User"**
8. اضغط **"Create user"**

---

### الخطوة 2: احصل على User ID

بعد إنشاء المستخدم:
1. ستجده في قائمة Users
2. اضغط على المستخدم
3. انسخ الـ **UID** (مثال: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`)

---

### الخطوة 3: أضف المستخدم كأدمن

1. في Supabase Dashboard، اذهب إلى: **SQL Editor**
2. اضغط **"New query"**
3. الصق هذا الكود (استبدل `YOUR_USER_ID` بالـ UID من الخطوة 2):

```sql
INSERT INTO admin_users (user_id, email, full_name, account_status)
VALUES (
  'YOUR_USER_ID',
  'admin@yourdomain.com',
  'System Administrator',
  'Active'
);
```

4. اضغط **"Run"** أو اضغط **Ctrl+Enter**
5. ستظهر رسالة: "Success. No rows returned"

---

### الخطوة 4: تسجيل الدخول

1. اذهب إلى تطبيقك: `http://localhost:5173/login`
2. أدخل:
   ```
   Email: admin@yourdomain.com
   Password: Admin@123456
   ```
3. اضغط **"Sign In"**
4. سيتم توجيهك تلقائياً إلى: `/admin/dashboard`

---

## ✅ التحقق من النجاح

إذا نجحت الخطوات:
- ✅ سيتم توجيهك إلى `/admin/dashboard`
- ✅ ستظهر لوحة تحكم الأدمن
- ✅ سترى اسمك في الـ Header: "System Administrator"

---

## 🆘 استكشاف الأخطاء

### المشكلة: يتم توجيهي إلى الصفحة الرئيسية `/`

**السبب**: المستخدم غير موجود في جدول `admin_users`

**الحل**: تأكد من تنفيذ الخطوة 3 بشكل صحيح

**التحقق**:
```sql
-- في SQL Editor
SELECT * FROM admin_users WHERE email = 'admin@yourdomain.com';
```

يجب أن يظهر سجل واحد. إذا لم يظهر شيء، نفذ الخطوة 3 مرة أخرى.

---

### المشكلة: "Invalid login credentials"

**السبب**: الإيميل أو كلمة المرور خاطئة

**الحل**: تحقق من الإيميل وكلمة المرور في Supabase Dashboard → Authentication → Users

---

### المشكلة: "Email not confirmed"

**السبب**: لم تعلم على "Auto Confirm User" في الخطوة 1

**الحل**: 
1. اذهب إلى Authentication → Users
2. اضغط على المستخدم
3. اضغط **"Confirm email"**

---

## 🎯 ماذا حدث في الكود؟

تم تعديل ملف `Login.tsx` ليتحقق من جدول `admin_users` أولاً:

```typescript
// Check if user is admin first (from admin_users table)
const { data: adminUser } = await supabase
  .from('admin_users')
  .select('full_name, account_status, is_deleted')
  .eq('user_id', user.id)
  .single();

if (adminUser && adminUser.account_status === 'Active' && !adminUser.is_deleted) {
  // User is an admin
  userRole = 'admin';
  fullName = adminUser.full_name;
  navigate('/admin/dashboard');
}
```

**الترتيب**:
1. يتحقق من `admin_users` أولاً
2. إذا لم يجد، يتحقق من `user_metadata.role` (دكتور/مريض)
3. يحفظ الـ role في localStorage
4. يوجه المستخدم حسب الـ role

---

## 📝 ملخص سريع

1. ✅ أنشئ مستخدم في Supabase Authentication (مع Auto Confirm)
2. ✅ انسخ الـ UID
3. ✅ نفذ `INSERT INTO admin_users ...` في SQL Editor
4. ✅ سجل دخول في التطبيق
5. ✅ سيتم توجيهك إلى `/admin/dashboard`

---

**جاهز للتجربة؟** 🚀

إذا واجهت أي مشكلة، أخبرني وسأساعدك!
