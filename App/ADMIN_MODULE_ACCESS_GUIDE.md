# Admin Module - Access & Setup Guide

## 🔐 How to Access the Admin Module

### Prerequisites

1. **Admin Account Created** in Supabase `user_roles` table
2. **Backend Running** with admin routes integrated
3. **Frontend Built** with admin components

---

## 📋 Step 1: Create Admin Account in Supabase

### Option A: Using Supabase SQL Editor

```sql
-- First, create a user in auth.users (if not already created)
-- This is typically done through your registration flow

-- Then, add the admin role in user_roles table
INSERT INTO user_roles (user_id, role, account_status, is_deleted)
VALUES (
  'user-uuid-here',  -- Replace with actual user ID from auth.users
  'Admin',
  'Active',
  false
);
```

### Option B: Using Your App's Registration

1. Register a new user through your app's registration page
2. Get the user ID from `auth.users` table
3. Run the SQL above to assign admin role

---

## 🚀 Step 2: Set Up Frontend Routes

### Add Admin Routes to App.tsx

Open `App/src/App.tsx` and add these routes:

```typescript
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AdminLayout from './components/admin/AdminLayout';
import Dashboard from './components/admin/Dashboard/Dashboard';
import UserList from './components/admin/Users/UserList';
import SpecializationList from './components/admin/Specializations/SpecializationList';
import AuditLogViewer from './components/admin/AuditLogs/AuditLogViewer';

function App() {
  return (
    <Router>
      <Routes>
        {/* Existing routes */}
        
        {/* Admin Routes */}
        <Route path="/admin/*" element={<AdminLayout><Routes>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="users" element={<UserList />} />
          <Route path="specializations" element={<SpecializationList />} />
          <Route path="audit-logs" element={<AuditLogViewer />} />
        </Routes></AdminLayout>} />
      </Routes>
    </Router>
  );
}

export default App;
```

---

## 🔑 Step 3: Login as Admin

### Login Flow

1. **Go to Login Page**: `http://localhost:3000/login`
2. **Enter Admin Credentials**:
   - Email: (the email you used to create admin account)
   - Password: (the password you set)
3. **Click Login**
4. **Token is Stored**: JWT token saved in `localStorage` as `authToken`

---

## 📍 Step 4: Access Admin Dashboard

### Direct URLs

After logging in as admin, access these URLs:

| Page | URL | Purpose |
|------|-----|---------|
| Dashboard | `http://localhost:3000/admin/dashboard` | View statistics & overview |
| Users | `http://localhost:3000/admin/users` | Manage all users |
| Specializations | `http://localhost:3000/admin/specializations` | Manage medical specializations |
| Audit Logs | `http://localhost:3000/admin/audit-logs` | View admin action logs |

### Via Navigation

1. After login, you should see admin menu in navigation
2. Click "Admin Panel" or similar link
3. Use sidebar to navigate between sections

---

## 🎯 What You Can Do in Admin Module

### Dashboard
- ✅ View total users by role
- ✅ View active vs inactive users
- ✅ View medical cases statistics
- ✅ View lab test statistics
- ✅ See pending approvals

### Users Management
- ✅ View all users (doctors, patients, labs)
- ✅ Filter by role and status
- ✅ Search by email
- ✅ View user details
- ✅ Activate/deactivate accounts
- ✅ Approve doctor registrations
- ✅ Reject registrations
- ✅ Assign specializations to doctors

### Specializations
- ✅ View all medical specializations
- ✅ Create new specialization
- ✅ Edit specialization details
- ✅ Delete specialization (if no doctors assigned)
- ✅ See doctor count per specialization

### Audit Logs
- ✅ View all admin actions
- ✅ Filter by action type
- ✅ Filter by resource type
- ✅ Filter by date range
- ✅ See who did what and when

---

## 🔒 Authentication Requirements

### Admin Access Check

The system automatically checks:

1. **Valid JWT Token** in Authorization header
2. **User Role** = 'Admin' in `user_roles` table
3. **Account Status** = 'Active'
4. **Not Deleted** = false

If any check fails:
- ❌ 401 Unauthorized - Invalid/missing token
- ❌ 403 Forbidden - Not admin or account inactive

---

## 🧪 Testing Admin Access

### Test 1: Login as Admin

```bash
# 1. Register/Login with admin credentials
# 2. Check browser console for authToken
console.log(localStorage.getItem('authToken'))

# 3. Should see a valid JWT token
```

### Test 2: Access Admin Dashboard

```bash
# 1. Navigate to http://localhost:3000/admin/dashboard
# 2. Should see dashboard with statistics
# 3. If redirected to login, token is invalid
```

### Test 3: Test API Directly

```bash
# Get all users
curl -X GET http://localhost:3000/api/admin/users \
  -H "Authorization: Bearer <your_admin_token>" \
  -H "Content-Type: application/json"

# Should return user list with 200 status
```

---

## ⚠️ Common Issues & Solutions

### Issue 1: "Unauthorized" Error

**Cause**: Invalid or missing token

**Solution**:
1. Log out and log back in
2. Check if token is in localStorage
3. Verify token hasn't expired

### Issue 2: "Forbidden" Error

**Cause**: User is not admin

**Solution**:
1. Check `user_roles` table - role should be 'Admin'
2. Check account_status = 'Active'
3. Check is_deleted = false

### Issue 3: Can't See Admin Menu

**Cause**: Not logged in as admin

**Solution**:
1. Log in with admin account
2. Check user role in database
3. Refresh page after login

### Issue 4: API Returns 404

**Cause**: Backend routes not integrated

**Solution**:
1. Check `Server/src/app.js` has admin routes
2. Verify: `app.use('/api/admin', adminRoutes);`
3. Restart backend server

---

## 📱 Admin Module Features

### User Management
```
GET    /api/admin/users                    - List all users
GET    /api/admin/users/:userId            - Get user details
PUT    /api/admin/users/:userId/status     - Activate/deactivate
POST   /api/admin/users/:userId/approve    - Approve doctor
POST   /api/admin/users/:userId/reject     - Reject registration
PUT    /api/admin/users/:userId/specialization - Assign specialization
```

### Specializations
```
GET    /api/admin/specializations          - List specializations
POST   /api/admin/specializations          - Create specialization
PUT    /api/admin/specializations/:id      - Update specialization
DELETE /api/admin/specializations/:id      - Delete specialization
```

### Doctor Schedules
```
GET    /api/admin/doctors/:doctorId/schedule     - Get schedule
POST   /api/admin/doctors/:doctorId/schedule     - Create/update schedule
DELETE /api/admin/doctors/:doctorId/schedule/:id - Delete schedule
```

### Dashboard
```
GET    /api/admin/dashboard/statistics           - All statistics
GET    /api/admin/dashboard/statistics/users     - User stats
GET    /api/admin/dashboard/statistics/cases     - Case stats
GET    /api/admin/dashboard/statistics/lab-tests - Lab stats
```

### Audit Logs
```
GET    /api/admin/audit-logs                     - List audit logs
GET    /api/admin/audit-logs/:logId              - Get specific log
GET    /api/admin/audit-logs/resource/:type/:id  - Get resource logs
GET    /api/admin/audit-logs/admin/:adminId      - Get admin logs
```

---

## 🎓 Example Workflow

### Approve a Doctor Registration

1. **Login as Admin**
   - Go to login page
   - Enter admin credentials
   - Click login

2. **View Pending Approvals**
   - Go to Dashboard
   - See "Pending Approvals" widget
   - Click "Review" on a pending doctor

3. **Approve Doctor**
   - View doctor details
   - Select specialization from dropdown
   - Click "Approve"
   - Doctor receives confirmation email
   - Doctor can now log in

4. **Verify in Audit Logs**
   - Go to Audit Logs
   - Filter by action type: "APPROVE"
   - See your approval action logged

---

## 🔄 Complete Setup Checklist

- [ ] Admin account created in `user_roles` table
- [ ] Backend server running with admin routes integrated
- [ ] Frontend components created in `App/src/components/admin/`
- [ ] Admin routes added to `App.tsx`
- [ ] CSS files created for styling
- [ ] Frontend server running
- [ ] Logged in as admin user
- [ ] Can access `/admin/dashboard`
- [ ] Can view users, specializations, audit logs
- [ ] Can perform admin actions (approve, reject, etc.)

---

## 📞 Quick Reference

### Admin Dashboard URL
```
http://localhost:3000/admin/dashboard
```

### Admin API Base URL
```
http://localhost:3000/api/admin
```

### Required Header for All Requests
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### Check Admin Status
```javascript
// In browser console
const token = localStorage.getItem('authToken');
const role = localStorage.getItem('userRole');
console.log('Token:', token);
console.log('Role:', role);
```

---

## 🚀 Next Steps

1. ✅ Create admin account
2. ✅ Integrate backend routes
3. ✅ Add frontend routes
4. ✅ Create CSS files
5. ✅ Login as admin
6. ✅ Test all features
7. ✅ Deploy to production

---

**Admin Module is Ready to Use!** 🎉

For issues or questions, check the error messages in browser console and network tab.
