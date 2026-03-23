# Quick Integration Guide - Add Admin Routes to app.js

## 📝 Step-by-Step Integration

### Step 1: Open your `Server/src/app.js` file

### Step 2: Add the import statement

Add this line with your other route imports (usually near the top):

```javascript
const adminRoutes = require('./routes/admin');
```

### Step 3: Register the admin routes

Add this line with your other route registrations (usually after other API routes):

```javascript
// Admin routes (must be after auth middleware)
app.use('/api/admin', adminRoutes);
```

---

## 📍 Example app.js Structure

```javascript
const express = require('express');
const cors = require('cors');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require('./routes/auth');
const doctorRoutes = require('./routes/doctor');
const patientRoutes = require('./routes/patient');
const adminRoutes = require('./routes/admin');  // ← ADD THIS

// Register routes
app.use('/api/auth', authRoutes);
app.use('/api/doctor', doctorRoutes);
app.use('/api/patient', patientRoutes);
app.use('/api/admin', adminRoutes);  // ← ADD THIS

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
});

module.exports = app;
```

---

## ✅ Verification

After adding the routes, verify they're working:

```bash
# Start your server
npm start

# Test an admin endpoint (you'll need a valid admin token)
curl -X GET http://localhost:3000/api/admin/users \
  -H "Authorization: Bearer <your_admin_token>"
```

---

## 🔐 Important Notes

1. **Admin Authentication**: All `/api/admin/*` routes require:
   - Valid JWT token in `Authorization` header
   - User must have `role = 'Admin'` in `user_roles` table
   - User must have `account_status = 'Active'`

2. **Order Matters**: Register admin routes after your auth middleware

3. **No Breaking Changes**: Adding admin routes doesn't affect existing routes

---

## 🚀 You're Done!

The admin module backend is now integrated and ready to use.

Next: Build the frontend React components!
