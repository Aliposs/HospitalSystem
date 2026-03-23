# Admin Module - API Examples & Integration Patterns

## Authentication Flow

### 1. Admin Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "secure_password"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "admin-uuid",
      "email": "admin@example.com",
      "role": "Admin",
      "name": "Admin User"
    }
  }
}
```

### 2. Verify Admin Access
```bash
GET /api/admin/users
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200 OK):** User list returned

**Response (403 Forbidden):** If user is not admin
```json
{
  "success": false,
  "error": "Forbidden",
  "message": "You do not have permission to access this resource"
}
```

---

## User Management Examples

### 1. Get All Users with Filters

```bash
GET /api/admin/users?page=1&limit=20&role=Doctor&status=Pending%20Approval&sortBy=created_at&sortOrder=desc
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "doctor-uuid-1",
        "name": "Dr. John Smith",
        "email": "john.smith@example.com",
        "role": "Doctor",
        "account_status": "Pending Approval",
        "registration_date": "2024-01-20T10:30:00Z",
        "last_login_at": null
      },
      {
        "id": "doctor-uuid-2",
        "name": "Dr. Jane Doe",
        "email": "jane.doe@example.com",
        "role": "Doctor",
        "account_status": "Pending Approval",
        "registration_date": "2024-01-19T14:15:00Z",
        "last_login_at": null
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 2,
      "pages": 1
    }
  }
}
```

### 2. Get User Details

```bash
GET /api/admin/users/doctor-uuid-1
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "doctor-uuid-1",
    "name": "Dr. John Smith",
    "email": "john.smith@example.com",
    "phone_number": "+1-555-0123",
    "role": "Doctor",
    "account_status": "Pending Approval",
    "registration_date": "2024-01-20T10:30:00Z",
    "last_login_at": null,
    "specialization": null,
    "schedule": []
  }
}
```

### 3. Approve Doctor Registration

```bash
POST /api/admin/users/doctor-uuid-1/approve
Authorization: Bearer {token}
Content-Type: application/json

{
  "specialization_id": "spec-uuid-cardiology"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Registration approved successfully",
  "data": {
    "id": "doctor-uuid-1",
    "account_status": "Active",
    "specialization": {
      "id": "spec-uuid-cardiology",
      "name": "Cardiology"
    }
  }
}
```

**Response (400 Bad Request):** Missing specialization_id
```json
{
  "success": false,
  "error": "Validation Error",
  "details": [
    {
      "field": "specialization_id",
      "message": "Specialization is required for doctors"
    }
  ]
}
```

### 4. Reject Doctor Registration

```bash
POST /api/admin/users/doctor-uuid-1/reject
Authorization: Bearer {token}
Content-Type: application/json

{
  "reason": "Credentials could not be verified"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Registration rejected successfully"
}
```

### 5. Activate/Deactivate User

```bash
PUT /api/admin/users/patient-uuid-1/status
Authorization: Bearer {token}
Content-Type: application/json

{
  "account_status": "Inactive",
  "reason": "Account suspended due to policy violation"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Account status updated successfully",
  "data": {
    "id": "patient-uuid-1",
    "account_status": "Inactive"
  }
}
```

### 6. Assign Specialization to Doctor

```bash
PUT /api/admin/users/doctor-uuid-1/specialization
Authorization: Bearer {token}
Content-Type: application/json

{
  "specialization_id": "spec-uuid-neurology"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Specialization assigned successfully",
  "data": {
    "doctor_id": "doctor-uuid-1",
    "specialization": {
      "id": "spec-uuid-neurology",
      "name": "Neurology"
    }
  }
}
```

---

## Doctor Schedule Examples

### 1. Get Doctor Schedule

```bash
GET /api/admin/doctors/doctor-uuid-1/schedule
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "doctor_id": "doctor-uuid-1",
    "schedule": [
      {
        "id": "schedule-uuid-1",
        "day_of_week": 1,
        "day_name": "Monday",
        "start_time": "09:00",
        "end_time": "17:00",
        "is_active": true
      },
      {
        "id": "schedule-uuid-2",
        "day_of_week": 3,
        "day_name": "Wednesday",
        "start_time": "10:00",
        "end_time": "18:00",
        "is_active": true
      },
      {
        "id": "schedule-uuid-3",
        "day_of_week": 5,
        "day_name": "Friday",
        "start_time": "09:00",
        "end_time": "16:00",
        "is_active": true
      }
    ]
  }
}
```

### 2. Create/Update Doctor Schedule

```bash
POST /api/admin/doctors/doctor-uuid-1/schedule
Authorization: Bearer {token}
Content-Type: application/json

{
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
    },
    {
      "day_of_week": 5,
      "start_time": "09:00",
      "end_time": "16:00"
    }
  ]
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Schedule updated successfully",
  "data": {
    "doctor_id": "doctor-uuid-1",
    "schedule": [
      {
        "id": "schedule-uuid-1",
        "day_of_week": 1,
        "day_name": "Monday",
        "start_time": "09:00",
        "end_time": "17:00",
        "is_active": true
      },
      {
        "id": "schedule-uuid-2",
        "day_of_week": 3,
        "day_name": "Wednesday",
        "start_time": "10:00",
        "end_time": "18:00",
        "is_active": true
      },
      {
        "id": "schedule-uuid-3",
        "day_of_week": 5,
        "day_name": "Friday",
        "start_time": "09:00",
        "end_time": "16:00",
        "is_active": true
      }
    ]
  }
}
```

**Response (400 Bad Request):** Invalid time range
```json
{
  "success": false,
  "error": "Validation Error",
  "details": [
    {
      "field": "schedule[1].end_time",
      "message": "End time must be after start time"
    }
  ]
}
```

### 3. Delete Schedule Slot

```bash
DELETE /api/admin/doctors/doctor-uuid-1/schedule/schedule-uuid-1
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Schedule deleted successfully"
}
```

---

## Medical Specializations Examples

### 1. Get All Specializations

```bash
GET /api/admin/specializations?page=1&limit=50&active_only=true
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "specializations": [
      {
        "id": "spec-uuid-1",
        "name": "Cardiology",
        "description": "Heart and cardiovascular system",
        "is_active": true,
        "doctor_count": 5
      },
      {
        "id": "spec-uuid-2",
        "name": "Neurology",
        "description": "Nervous system and brain disorders",
        "is_active": true,
        "doctor_count": 3
      },
      {
        "id": "spec-uuid-3",
        "name": "Orthopedics",
        "description": "Bones, joints, and muscles",
        "is_active": true,
        "doctor_count": 4
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 3
    }
  }
}
```

### 2. Create Specialization

```bash
POST /api/admin/specializations
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Dermatology",
  "description": "Skin, hair, and nail disorders"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Specialization created successfully",
  "data": {
    "id": "spec-uuid-4",
    "name": "Dermatology",
    "description": "Skin, hair, and nail disorders",
    "is_active": true
  }
}
```

**Response (409 Conflict):** Duplicate name
```json
{
  "success": false,
  "error": "Conflict",
  "message": "Specialization 'Dermatology' already exists"
}
```

### 3. Update Specialization

```bash
PUT /api/admin/specializations/spec-uuid-1
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Cardiology",
  "description": "Heart, cardiovascular system, and vascular diseases",
  "is_active": true
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Specialization updated successfully",
  "data": {
    "id": "spec-uuid-1",
    "name": "Cardiology",
    "description": "Heart, cardiovascular system, and vascular diseases",
    "is_active": true
  }
}
```

### 4. Delete Specialization

```bash
DELETE /api/admin/specializations/spec-uuid-4
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Specialization deleted successfully"
}
```

**Response (409 Conflict):** Doctors assigned
```json
{
  "success": false,
  "error": "Conflict",
  "message": "Cannot delete specialization with assigned doctors. Please reassign doctors first."
}
```

---

## Dashboard Statistics Examples

### 1. Get All Statistics

```bash
GET /api/admin/dashboard/statistics
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "users": {
      "total": 500,
      "by_role": {
        "Doctor": 50,
        "Patient": 400,
        "Lab": 50
      },
      "by_status": {
        "Active": 480,
        "Inactive": 15,
        "Pending Approval": 5
      }
    },
    "cases": {
      "total": 1200,
      "by_status": {
        "Open": 300,
        "In Progress": 600,
        "Closed": 300
      },
      "by_specialization": {
        "Cardiology": 150,
        "Neurology": 120,
        "Orthopedics": 100
      }
    },
    "lab_tests": {
      "total": 800,
      "by_status": {
        "Pending": 200,
        "Completed": 550,
        "Cancelled": 50
      },
      "by_lab": {
        "Lab A": 300,
        "Lab B": 500
      }
    },
    "last_updated": "2024-01-20T14:30:00Z"
  }
}
```

### 2. Get User Statistics Only

```bash
GET /api/admin/dashboard/statistics/users
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "total": 500,
    "by_role": {
      "Doctor": 50,
      "Patient": 400,
      "Lab": 50
    },
    "by_status": {
      "Active": 480,
      "Inactive": 15,
      "Pending Approval": 5
    }
  }
}
```

---

## Audit Log Examples

### 1. Get Audit Logs with Filters

```bash
GET /api/admin/audit-logs?page=1&limit=50&action_type=APPROVE&resource_type=User&start_date=2024-01-01&end_date=2024-01-31
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": "log-uuid-1",
        "admin_id": "admin-uuid",
        "admin_name": "Admin User",
        "action_type": "APPROVE",
        "resource_type": "User",
        "resource_id": "doctor-uuid-1",
        "changes": {
          "account_status": {
            "from": "Pending Approval",
            "to": "Active"
          },
          "specialization_id": {
            "from": null,
            "to": "spec-uuid-cardiology"
          }
        },
        "status": "Success",
        "created_at": "2024-01-20T14:30:00Z"
      },
      {
        "id": "log-uuid-2",
        "admin_id": "admin-uuid",
        "admin_name": "Admin User",
        "action_type": "UPDATE",
        "resource_type": "Specialization",
        "resource_id": "spec-uuid-1",
        "changes": {
          "description": {
            "from": "Heart and cardiovascular system",
            "to": "Heart, cardiovascular system, and vascular diseases"
          }
        },
        "status": "Success",
        "created_at": "2024-01-20T13:15:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 2
    }
  }
}
```

---

## Integration Patterns

### Pattern 1: Doctor Registration Approval Flow

```
1. Doctor registers via /api/auth/register
   → User created with status "Pending Approval"
   → Email sent to admin

2. Admin views pending doctors via GET /api/admin/users?status=Pending%20Approval&role=Doctor
   → List shows pending doctors

3. Admin approves doctor via POST /api/admin/users/{doctorId}/approve
   → Specialization assigned
   → Status changed to "Active"
   → Audit log created
   → Confirmation email sent to doctor

4. Doctor can now log in and access doctor dashboard
```

### Pattern 2: Doctor Schedule Update Flow

```
1. Admin views doctor details via GET /api/admin/users/{doctorId}
   → Current schedule displayed

2. Admin updates schedule via POST /api/admin/doctors/{doctorId}/schedule
   → Schedule validated
   → Database updated
   → Audit log created
   → Notification sent to doctor

3. Patients can now see updated availability
   → Schedule appears in doctor's profile
   → Booking system uses new schedule
```

### Pattern 3: Specialization Management Flow

```
1. Admin creates specialization via POST /api/admin/specializations
   → Specialization added to system
   → Audit log created

2. Admin assigns specialization to doctor via PUT /api/admin/users/{doctorId}/specialization
   → Doctor-specialization relationship created
   → Audit log created

3. Patients can search by specialization
   → Doctor appears in search results
   → Specialization displayed in doctor profile
```

### Pattern 4: User Deactivation Flow

```
1. Admin deactivates user via PUT /api/admin/users/{userId}/status
   → Status changed to "Inactive"
   → Audit log created

2. User attempts to log in
   → Login fails with "Account inactive" message
   → User cannot access any features

3. Admin can reactivate via same endpoint
   → Status changed back to "Active"
   → User can log in again
```

### Pattern 5: Audit Trail Verification

```
1. Admin views audit logs via GET /api/admin/audit-logs
   → All admin actions displayed
   → Filters available by action type, date range, admin

2. Admin can verify:
   → Who made changes
   → What was changed
   → When changes were made
   → Whether operations succeeded or failed

3. Audit logs are immutable
   → Cannot be modified or deleted
   → Provides compliance trail
```

---

## Error Handling Examples

### Validation Error

```json
{
  "success": false,
  "error": "Validation Error",
  "details": [
    {
      "field": "email",
      "message": "Invalid email format"
    },
    {
      "field": "phone_number",
      "message": "Invalid phone number format"
    }
  ]
}
```

### Authorization Error

```json
{
  "success": false,
  "error": "Forbidden",
  "message": "You do not have permission to perform this action"
}
```

### Conflict Error

```json
{
  "success": false,
  "error": "Conflict",
  "message": "Specialization 'Cardiology' already exists"
}
```

### Server Error

```json
{
  "success": false,
  "error": "Internal Server Error",
  "message": "An unexpected error occurred. Please try again later."
}
```

