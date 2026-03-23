# Admin Module - Backend Setup Guide

## ✅ Backend Implementation Complete

All backend files have been created for the Admin Module. Here's what was implemented:

---

## 📁 File Structure

```
Server/src/
├── middleware/
│   └── adminAuth.js                    # Admin authentication middleware
├── services/
│   ├── adminUserService.js             # User management logic
│   ├── adminSpecializationService.js   # Specialization management logic
│   ├── adminScheduleService.js         # Schedule management logic
│   ├── adminDashboardService.js        # Dashboard statistics logic
│   └── adminAuditLogService.js         # Audit logging logic
├── controllers/
│   ├── adminUserController.js          # User management endpoints
│   ├── adminSpecializationController.js # Specialization endpoints
│   ├── adminScheduleController.js      # Schedule endpoints
│   ├── adminDashboardController.js     # Dashboard endpoints
│   └── adminAuditLogController.js      # Audit log endpoints
└── routes/
    └── admin.js                        # All admin routes
```

---

## 🔧 Integration Steps

### Step 1: Update app.js

Add the admin routes to your main `Server/src/app.js`:

```javascript
// Add this import at the top
const adminRoutes = require('./routes/admin');

// Add this middleware after other routes (before error handling)
app.use('/api/admin', adminRoutes);
```

### Step 2: Verify Environment Variables

Make sure your `.env` file has:

```
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Step 3: Test the API

Start your server and test the endpoints:

```bash
npm start
```

---

## 📋 API Endpoints

### User Management (6 endpoints)

```
GET    /api/admin/users                          # List all users
GET    /api/admin/users/:userId                  # Get user details
PUT    /api/admin/users/:userId/status           # Activate/deactivate user
POST   /api/admin/users/:userId/approve          # Approve doctor registration
POST   /api/admin/users/:userId/reject           # Reject doctor registration
PUT    /api/admin/users/:userId/specialization   # Assign specialization
```

### Specializations (4 endpoints)

```
GET    /api/admin/specializations                # List specializations
POST   /api/admin/specializations                # Create specialization
PUT    /api/admin/specializations/:id            # Update specialization
DELETE /api/admin/specializations/:id            # Delete specialization
```

### Doctor Schedules (3 endpoints)

```
GET    /api/admin/doctors/:doctorId/schedule     # Get doctor schedule
POST   /api/admin/doctors/:doctorId/schedule     # Create/update schedule
DELETE /api/admin/doctors/:doctorId/schedule/:id # Delete schedule slot
```

### Dashboard (4 endpoints)

```
GET    /api/admin/dashboard/statistics           # All statistics
GET    /api/admin/dashboard/statistics/users     # User statistics
GET    /api/admin/dashboard/statistics/cases     # Case statistics
GET    /api/admin/dashboard/statistics/lab-tests # Lab test statistics
```

### Audit Logs (4 endpoints)

```
GET    /api/admin/audit-logs                     # List audit logs
GET    /api/admin/audit-logs/:logId              # Get specific log
GET    /api/admin/audit-logs/resource/:type/:id  # Get resource logs
GET    /api/admin/audit-logs/admin/:adminId      # Get admin logs
```

---

## 🔐 Authentication

All admin endpoints require:

1. **Valid JWT Token** in Authorization header:
   ```
   Authorization: Bearer <token>
   ```

2. **Admin Role** in `user_roles` table:
   ```
   role = 'Admin'
   account_status = 'Active'
   is_deleted = false
   ```

The `adminAuthMiddleware` automatically verifies both conditions.

---

## 📝 Example Requests

### Get All Users

```bash
curl -X GET http://localhost:3000/api/admin/users \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json"
```

### Create Specialization

```bash
curl -X POST http://localhost:3000/api/admin/specializations \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Cardiology",
    "description": "Heart and cardiovascular system"
  }'
```

### Approve Doctor

```bash
curl -X POST http://localhost:3000/api/admin/users/<doctorId>/approve \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "specialization_id": "<specializationId>"
  }'
```

### Create Doctor Schedule

```bash
curl -X POST http://localhost:3000/api/admin/doctors/<doctorId>/schedule \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "schedule": [
      {
        "day_of_week": 1,
        "start_time": "09:00",
        "end_time": "17:00"
      },
      {
        "day_of_week": 3,
        "start_time": "10:00",
        "end_time": "18:00"
      }
    ]
  }'
```

### Get Dashboard Statistics

```bash
curl -X GET http://localhost:3000/api/admin/dashboard/statistics \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json"
```

---

## 🎯 Key Features

✅ **Admin Authentication** - Middleware verifies admin role on every request
✅ **User Management** - View, activate/deactivate, approve/reject users
✅ **Specializations** - CRUD operations with doctor assignment protection
✅ **Doctor Schedules** - Create, update, delete weekly schedules
✅ **Dashboard Statistics** - Real-time user, case, and lab test statistics
✅ **Audit Logging** - All admin actions are logged automatically
✅ **Error Handling** - Comprehensive error responses with validation
✅ **Caching** - Dashboard statistics cached for 5 minutes
✅ **Pagination** - All list endpoints support pagination

---

## 🔍 Service Layer Details

### adminUserService.js
- `getAllUsers()` - Get paginated user list with filters
- `getUserById()` - Get detailed user information
- `updateUserStatus()` - Activate/deactivate user
- `approveDoctorRegistration()` - Approve doctor with specialization
- `rejectDoctorRegistration()` - Reject and soft-delete user
- `assignSpecializationToDoctor()` - Assign specialization to doctor

### adminSpecializationService.js
- `getAllSpecializations()` - Get specializations with doctor count
- `createSpecialization()` - Create new specialization
- `updateSpecialization()` - Update specialization details
- `deleteSpecialization()` - Delete with doctor assignment check

### adminScheduleService.js
- `getDoctorSchedule()` - Get doctor's weekly schedule
- `createOrUpdateSchedule()` - Create/update schedule with validation
- `deleteScheduleSlot()` - Delete specific schedule slot
- `validateTimeRange()` - Validate time ranges

### adminDashboardService.js
- `getUserStatistics()` - Get user counts by role and status
- `getCaseStatistics()` - Get appointment statistics
- `getLabTestStatistics()` - Get lab test statistics
- `getAllStatistics()` - Get all statistics combined
- `getCachedStatistics()` - Get cached statistics
- `cacheStatistics()` - Cache statistics with TTL

### adminAuditLogService.js
- `logAction()` - Log admin action
- `getAuditLogs()` - Get logs with filtering
- `getAuditLogById()` - Get specific log
- `getResourceAuditLogs()` - Get logs for resource
- `getAdminAuditLogs()` - Get logs for admin

---

## ⚙️ Configuration

### Middleware Configuration

The `adminAuthMiddleware` automatically:
1. Verifies JWT token
2. Checks user role is 'Admin'
3. Checks account status is 'Active'
4. Checks user is not deleted
5. Attaches user info to request

### Error Handling

All endpoints return consistent error format:

```json
{
  "success": false,
  "error": "Error Type",
  "message": "Error message",
  "details": [
    {
      "field": "fieldName",
      "message": "Validation error"
    }
  ]
}
```

### Success Response Format

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data
  }
}
```

---

## 🧪 Testing

### Test Admin Authentication

```bash
# Without token
curl -X GET http://localhost:3000/api/admin/users
# Response: 401 Unauthorized

# With invalid token
curl -X GET http://localhost:3000/api/admin/users \
  -H "Authorization: Bearer invalid_token"
# Response: 401 Unauthorized

# With non-admin user token
curl -X GET http://localhost:3000/api/admin/users \
  -H "Authorization: Bearer patient_token"
# Response: 403 Forbidden
```

### Test User Management

```bash
# Get all users
curl -X GET "http://localhost:3000/api/admin/users?page=1&limit=20&role=Doctor" \
  -H "Authorization: Bearer <admin_token>"

# Get user details
curl -X GET http://localhost:3000/api/admin/users/<userId> \
  -H "Authorization: Bearer <admin_token>"

# Update user status
curl -X PUT http://localhost:3000/api/admin/users/<userId>/status \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{"account_status": "Inactive"}'
```

---

## 📊 Database Integration

All services use Supabase client with:
- Service role key for admin operations
- Proper error handling
- Transaction support for multi-step operations
- Automatic audit logging

---

## 🚀 Next Steps

1. **Update app.js** - Add admin routes
2. **Test endpoints** - Verify all endpoints work
3. **Create admin account** - Set up first admin user
4. **Build frontend** - Create React components
5. **Deploy** - Deploy to production

---

## 📞 Support

For issues or questions:
- Check error messages in response
- Review audit logs for action history
- Check Supabase logs for database errors
- Verify JWT token validity

---

**Backend Implementation Status**: ✅ Complete
**Ready for Frontend Development**: ✅ Yes
**Ready for Testing**: ✅ Yes
