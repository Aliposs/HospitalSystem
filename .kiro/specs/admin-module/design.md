# Admin Module - Technical Design Document

## Overview

The Admin Module is a comprehensive management system for healthcare platform administrators. It provides user lifecycle management, medical specialization administration, doctor scheduling, system monitoring, and audit logging capabilities. The module integrates seamlessly with existing authentication, doctor, patient, and lab modules while maintaining backward compatibility.

### Key Responsibilities

- User account management (create, activate, deactivate, approve)
- Medical specialization CRUD operations
- Doctor schedule management
- Real-time system monitoring and statistics
- Comprehensive audit logging
- Role-based access control enforcement
- Input validation and error handling

### Design Principles

1. **Separation of Concerns**: Clear boundaries between API, business logic, and data layers
2. **Backward Compatibility**: No breaking changes to existing modules
3. **Security First**: RBAC, input validation, audit logging on all operations
4. **Performance**: Pagination, caching, optimized queries
5. **Maintainability**: Consistent patterns with existing codebase

---

## Database Schema

### Table: users (Extended)

Extends existing users table with admin-specific fields.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('Admin', 'Doctor', 'Patient', 'Lab')),
  account_status VARCHAR(50) NOT NULL DEFAULT 'Pending Approval' 
    CHECK (account_status IN ('Active', 'Inactive', 'Pending Approval')),
  phone_number VARCHAR(20),
  profile_picture_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login_at TIMESTAMP,
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMP,
  
  -- Indexes for common queries
  CONSTRAINT email_not_deleted UNIQUE NULLS NOT DISTINCT (email, is_deleted)
);

CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_account_status ON users(account_status);
CREATE INDEX idx_users_created_at ON users(created_at DESC);
CREATE INDEX idx_users_email ON users(email);
```

### Table: medical_specializations

```sql
CREATE TABLE medical_specializations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID NOT NULL REFERENCES users(id),
  
  CONSTRAINT name_not_empty CHECK (name != '')
);

CREATE INDEX idx_specializations_name ON medical_specializations(name);
CREATE INDEX idx_specializations_active ON medical_specializations(is_active);
```

### Table: doctor_specializations (Junction)

```sql
CREATE TABLE doctor_specializations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  specialization_id UUID NOT NULL REFERENCES medical_specializations(id) ON DELETE RESTRICT,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  assigned_by UUID NOT NULL REFERENCES users(id),
  
  UNIQUE(doctor_id, specialization_id)
);

CREATE INDEX idx_doctor_specializations_doctor ON doctor_specializations(doctor_id);
CREATE INDEX idx_doctor_specializations_specialization ON doctor_specializations(specialization_id);
```

### Table: doctor_schedules

```sql
CREATE TABLE doctor_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID NOT NULL REFERENCES users(id),
  
  CONSTRAINT valid_time_range CHECK (start_time < end_time)
);

CREATE INDEX idx_doctor_schedules_doctor ON doctor_schedules(doctor_id);
CREATE INDEX idx_doctor_schedules_day ON doctor_schedules(day_of_week);
CREATE INDEX idx_doctor_schedules_active ON doctor_schedules(is_active);
```

### Table: audit_logs

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES users(id),
  action_type VARCHAR(50) NOT NULL 
    CHECK (action_type IN ('CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'ACTIVATE', 'DEACTIVATE')),
  resource_type VARCHAR(50) NOT NULL 
    CHECK (resource_type IN ('User', 'Specialization', 'Schedule', 'Account')),
  resource_id UUID NOT NULL,
  changes JSONB,
  status VARCHAR(20) NOT NULL CHECK (status IN ('Success', 'Failure')),
  error_message TEXT,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_admin ON audit_logs(admin_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action_type);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);
```

### Table: dashboard_cache (Optional - for performance)

```sql
CREATE TABLE dashboard_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key VARCHAR(100) UNIQUE NOT NULL,
  cache_value JSONB NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_dashboard_cache_expires ON dashboard_cache(expires_at);
```

---

## REST API Endpoints

### Base URL: `/api/admin`

All endpoints require authentication and admin role verification.

### User Management Endpoints

#### GET /users
Retrieve paginated list of all users with filtering and sorting.

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 20, max: 100)
- `role` (string, optional): Filter by role (Doctor, Patient, Lab, Admin)
- `status` (string, optional): Filter by account status (Active, Inactive, Pending Approval)
- `search` (string, optional): Search by name or email
- `sortBy` (string, default: created_at): Sort field (name, email, created_at, account_status)
- `sortOrder` (string, default: desc): asc or desc

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "uuid",
        "name": "John Doe",
        "email": "john@example.com",
        "role": "Doctor",
        "account_status": "Active",
        "registration_date": "2024-01-15T10:30:00Z",
        "last_login_at": "2024-01-20T14:22:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "pages": 8
    }
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid query parameters
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: User is not admin

#### GET /users/:userId
Retrieve detailed user information.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "Doctor",
    "account_status": "Active",
    "phone_number": "+1234567890",
    "registration_date": "2024-01-15T10:30:00Z",
    "specialization": {
      "id": "uuid",
      "name": "Cardiology"
    },
    "schedule": [
      {
        "day_of_week": 1,
        "start_time": "09:00",
        "end_time": "17:00"
      }
    ]
  }
}
```

#### PUT /users/:userId/status
Activate or deactivate a user account.

**Request Body:**
```json
{
  "account_status": "Active" | "Inactive",
  "reason": "Optional reason for status change"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Account status updated successfully",
  "data": {
    "id": "uuid",
    "account_status": "Inactive"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid status value
- `404 Not Found`: User not found
- `409 Conflict`: Cannot deactivate admin account

#### POST /users/:userId/approve
Approve a pending doctor or lab registration.

**Request Body:**
```json
{
  "specialization_id": "uuid" // Required for doctors only
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Registration approved successfully",
  "data": {
    "id": "uuid",
    "account_status": "Active"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Missing specialization_id for doctor
- `404 Not Found`: User not found
- `409 Conflict`: User is not in Pending Approval status

#### POST /users/:userId/reject
Reject a pending registration and delete the account.

**Request Body:**
```json
{
  "reason": "Reason for rejection"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Registration rejected successfully"
}
```

#### PUT /users/:userId/specialization
Assign or update medical specialization for a doctor.

**Request Body:**
```json
{
  "specialization_id": "uuid"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Specialization assigned successfully",
  "data": {
    "doctor_id": "uuid",
    "specialization": {
      "id": "uuid",
      "name": "Cardiology"
    }
  }
}
```

### Doctor Schedule Endpoints

#### GET /doctors/:doctorId/schedule
Retrieve doctor's weekly schedule.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "doctor_id": "uuid",
    "schedule": [
      {
        "id": "uuid",
        "day_of_week": 1,
        "day_name": "Monday",
        "start_time": "09:00",
        "end_time": "17:00",
        "is_active": true
      }
    ]
  }
}
```

#### POST /doctors/:doctorId/schedule
Create or update doctor's schedule.

**Request Body:**
```json
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
    "doctor_id": "uuid",
    "schedule": [...]
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid time range or schedule format
- `404 Not Found`: Doctor not found

#### DELETE /doctors/:doctorId/schedule/:scheduleId
Delete a specific schedule slot.

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Schedule deleted successfully"
}
```

### Medical Specializations Endpoints

#### GET /specializations
Retrieve all medical specializations.

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 50)
- `active_only` (boolean, default: true)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "specializations": [
      {
        "id": "uuid",
        "name": "Cardiology",
        "description": "Heart and cardiovascular system",
        "is_active": true,
        "doctor_count": 5
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 25
    }
  }
}
```

#### POST /specializations
Create a new medical specialization.

**Request Body:**
```json
{
  "name": "Cardiology",
  "description": "Heart and cardiovascular system"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Specialization created successfully",
  "data": {
    "id": "uuid",
    "name": "Cardiology",
    "description": "Heart and cardiovascular system"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Validation error (empty name, duplicate name)
- `409 Conflict`: Specialization already exists

#### PUT /specializations/:specializationId
Update a medical specialization.

**Request Body:**
```json
{
  "name": "Cardiology",
  "description": "Updated description",
  "is_active": true
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Specialization updated successfully",
  "data": {
    "id": "uuid",
    "name": "Cardiology",
    "description": "Updated description"
  }
}
```

#### DELETE /specializations/:specializationId
Delete a medical specialization.

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Specialization deleted successfully"
}
```

**Error Responses:**
- `409 Conflict`: Specialization has assigned doctors

### Dashboard Statistics Endpoints

#### GET /dashboard/statistics
Retrieve all dashboard statistics.

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
        "Neurology": 120
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

#### GET /dashboard/statistics/users
Retrieve user statistics only.

#### GET /dashboard/statistics/cases
Retrieve medical case statistics only.

#### GET /dashboard/statistics/lab-tests
Retrieve lab test statistics only.

### Audit Log Endpoints

#### GET /audit-logs
Retrieve audit logs with filtering.

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 50)
- `action_type` (string, optional): Filter by action type
- `resource_type` (string, optional): Filter by resource type
- `start_date` (ISO string, optional): Filter by date range start
- `end_date` (ISO string, optional): Filter by date range end
- `admin_id` (uuid, optional): Filter by admin

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": "uuid",
        "admin_id": "uuid",
        "admin_name": "Admin User",
        "action_type": "APPROVE",
        "resource_type": "User",
        "resource_id": "uuid",
        "changes": {
          "account_status": {
            "from": "Pending Approval",
            "to": "Active"
          }
        },
        "status": "Success",
        "created_at": "2024-01-20T14:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 1500
    }
  }
}
```

---

## Admin Dashboard UI Structure

### Page Hierarchy

```
/admin
├── /dashboard (Main Dashboard)
├── /users
│   ├── /users (User List)
│   ├── /users/:id (User Detail)
│   └── /users/pending (Pending Approvals)
├── /specializations
│   ├── /specializations (Specialization List)
│   ├── /specializations/new (Create)
│   └── /specializations/:id/edit (Edit)
├── /audit-logs
│   └── /audit-logs (Audit Log Viewer)
└── /settings (Admin Settings)
```

### Layout Structure

```
┌─────────────────────────────────────────────┐
│           Admin Header                      │
│  Logo | Breadcrumb | Search | User Menu    │
├──────────┬──────────────────────────────────┤
│          │                                  │
│ Sidebar  │      Main Content Area          │
│          │                                  │
│ - Dashboard                                 │
│ - Users                                     │
│ - Specializations                           │
│ - Schedules                                 │
│ - Audit Logs                                │
│ - Settings                                  │
│          │                                  │
└──────────┴──────────────────────────────────┘
```

### Key Pages and Components

#### 1. Dashboard Page
**Components:**
- StatisticsCard (displays count with icon)
- UserStatsChart (pie/bar chart)
- CaseStatsChart (status breakdown)
- LabTestStatsChart (status breakdown)
- PendingApprovalsWidget (quick action)
- RecentActivityWidget (latest audit logs)

**Layout:**
- Top row: 3 main stat cards (Total Users, Total Cases, Total Lab Tests)
- Second row: User distribution by role and status
- Third row: Case and lab test statistics
- Bottom row: Pending approvals and recent activity

#### 2. User Management Page
**Components:**
- UserTable (paginated, sortable, filterable)
- FilterBar (role, status, search)
- UserDetailModal (view/edit user)
- ApprovalModal (approve/reject registration)
- ScheduleEditor (weekly schedule)
- SpecializationSelector (dropdown)

**Features:**
- Inline actions (View, Edit, Approve, Activate/Deactivate)
- Bulk actions (select multiple users)
- Export functionality (CSV)

#### 3. Specializations Management Page
**Components:**
- SpecializationTable (list with edit/delete)
- SpecializationForm (create/edit modal)
- ConfirmationDialog (delete confirmation)
- DoctorCountBadge (shows doctors assigned)

#### 4. Audit Logs Page
**Components:**
- AuditLogTable (paginated, filterable)
- DateRangeFilter
- ActionTypeFilter
- ResourceTypeFilter
- LogDetailModal (view full details)

#### 5. Doctor Schedule Editor
**Components:**
- WeeklyScheduleGrid (7 days)
- TimeSlotInput (start/end time)
- AddSlotButton
- SaveButton with validation

---

## Authentication & Authorization Logic

### RBAC Implementation

**Role Hierarchy:**
```
Admin (highest privilege)
  ├── Can manage all users
  ├── Can manage specializations
  ├── Can manage schedules
  ├── Can view audit logs
  └── Can access dashboard

Doctor
  ├── Can view own profile
  ├── Can view own schedule
  └── Can manage own cases

Patient
  ├── Can view own profile
  └── Can manage own cases

Lab
  ├── Can view own profile
  └── Can manage own test requests
```

### Admin Middleware Implementation

**File: `backend/middleware/adminAuth.ts`**

```typescript
// Verify admin role and permissions
export const adminAuthMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const decoded = verifyToken(token);
    const user = await getUserById(decoded.userId);

    if (user.role !== 'Admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Verify specific admin permission
export const requireAdminPermission = (permission: string) => {
  return async (req, res, next) => {
    if (!hasPermission(req.user, permission)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};
```

### Token Validation Flow

```
1. User logs in with credentials
2. Backend validates credentials
3. Backend checks user role
4. If Admin, generate JWT with admin claims
5. Frontend stores token in secure storage
6. On each request, include token in Authorization header
7. Middleware validates token and role
8. If valid, proceed; if not, return 401/403
9. On token expiry, redirect to login
```

### Permission Checking Logic

**File: `backend/services/permissionService.ts`**

```typescript
const ADMIN_PERMISSIONS = {
  'user:view': ['Admin'],
  'user:create': ['Admin'],
  'user:update': ['Admin'],
  'user:delete': ['Admin'],
  'user:approve': ['Admin'],
  'specialization:manage': ['Admin'],
  'schedule:manage': ['Admin'],
  'audit:view': ['Admin'],
  'dashboard:view': ['Admin']
};

export const hasPermission = (user: User, permission: string): boolean => {
  const allowedRoles = ADMIN_PERMISSIONS[permission];
  return allowedRoles?.includes(user.role) ?? false;
};
```

---

## Integration Points

### With Authentication Module

**Data Consistency:**
- Use existing `users` table (extended with admin fields)
- Reuse JWT token generation and validation
- Maintain password hashing standards
- Preserve existing login flow

**No Breaking Changes:**
- Existing auth endpoints unchanged
- New admin-specific fields are optional
- Backward compatible with existing user creation

### With Doctor Module

**Data Sharing:**
- Doctor profile data from `users` table
- Specialization assignments via `doctor_specializations` table
- Schedule management via `doctor_schedules` table

**Integration Points:**
- Doctor registration creates user with "Pending Approval" status
- Admin approval activates doctor account
- Schedule changes notify doctor via email
- Specialization changes update doctor's public profile

### With Patient Module

**Data Sharing:**
- Patient profile from `users` table
- Patient account status managed by admin

**Integration Points:**
- Patient registration creates active account (no approval needed)
- Admin can deactivate patient accounts
- Patient data visible in admin dashboard

### With Lab Module

**Data Sharing:**
- Lab profile from `users` table
- Lab account status managed by admin

**Integration Points:**
- Lab registration creates user with "Pending Approval" status
- Admin approval activates lab account
- Lab statistics displayed in dashboard

### Data Consistency Considerations

**Cascading Operations:**
- When user is deleted, cascade to related records (schedules, specializations)
- When specialization is deleted, prevent if doctors assigned
- When schedule is deleted, notify affected patients

**Transaction Management:**
- Wrap multi-step operations in transactions
- Rollback on failure to maintain consistency
- Log all changes for audit trail

**Soft Deletes:**
- Use `is_deleted` flag instead of hard deletes
- Preserve audit trail and referential integrity
- Allow data recovery if needed



---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: User Status Transitions

*For any* user account, when an admin changes the account status from Active to Inactive, the user should be unable to log in, and when changed back to Active, the user should be able to log in again.

**Validates: Requirements 2.2, 2.3**

### Property 2: Approval Status Consistency

*For any* doctor or lab registration, when an admin approves the registration, the account status should transition from "Pending Approval" to "Active", and the user should be able to log in immediately.

**Validates: Requirements 3.3, 4.3**

### Property 3: Specialization Assignment Requirement

*For any* doctor approval operation, if no specialization is assigned, the approval should fail with a validation error, and the doctor's status should remain "Pending Approval".

**Validates: Requirements 3.5, 3.6**

### Property 4: Schedule Time Validation

*For any* doctor schedule, the end time must be strictly greater than the start time, and if this constraint is violated, the schedule should not be saved and a validation error should be displayed.

**Validates: Requirements 6.6**

### Property 5: Specialization Deletion Protection

*For any* medical specialization, if one or more doctors are assigned to it, deletion should fail with a warning message, and the specialization should remain in the system.

**Validates: Requirements 9.3**

### Property 6: Audit Log Immutability

*For any* audit log entry, once created, it should not be modifiable or deletable, and all admin actions should be recorded with timestamp, admin ID, and action details.

**Validates: Requirements 15.1, 15.2, 15.4**

### Property 7: Admin-Only Access Enforcement

*For any* non-admin user attempting to access an admin endpoint, the system should return a 403 Forbidden response, and the request should not be processed.

**Validates: Requirements 13.1, 13.2, 14.2**

### Property 8: Input Validation Consistency

*For any* form submission with invalid data (empty required fields, invalid email format, invalid time ranges), the system should reject the submission, display specific error messages, and prevent data persistence.

**Validates: Requirements 16.1, 16.2, 16.3**

### Property 9: Dashboard Statistics Accuracy

*For any* dashboard statistics query, the returned counts should match the actual number of records in the database matching the specified criteria (e.g., active users, pending approvals).

**Validates: Requirements 10.1, 10.2, 10.3, 11.1, 11.2, 12.1, 12.2**

### Property 10: Pagination Consistency

*For any* paginated list endpoint, the total number of items across all pages should equal the total count returned, and each page should contain the correct subset of items.

**Validates: Requirements 1.1, 1.7**

### Property 11: Search and Filter Accuracy

*For any* search or filter operation, all returned results should match the specified criteria (role, status, search term), and no non-matching results should be included.

**Validates: Requirements 1.3, 1.4, 1.5**

### Property 12: Specialization Uniqueness

*For any* specialization creation or update, if a specialization with the same name already exists, the operation should fail with a validation error, and the duplicate should not be created.

**Validates: Requirements 7.5, 8.5**

### Property 13: Rejection Cleanup

*For any* rejected registration, the pending user account should be deleted from the system, and all associated data should be removed or marked as deleted.

**Validates: Requirements 3.4, 4.4**

### Property 14: Schedule Notification Delivery

*For any* doctor schedule update, a notification should be sent to the affected doctor, and the notification should contain the updated schedule details.

**Validates: Requirements 6.4**

### Property 15: Role-Based Feature Access

*For any* admin user, all admin-specific features (user management, specializations, schedules, audit logs, dashboard) should be accessible, and for non-admin users, these features should be completely hidden or return access denied errors.

**Validates: Requirements 13.3, 13.4, 14.1, 14.3**

---

## Error Handling

### Error Categories and Responses

#### Validation Errors (400 Bad Request)

**Scenarios:**
- Empty required fields
- Invalid email format
- Invalid time ranges (end time before start time)
- Duplicate specialization names
- Invalid role or status values

**Response Format:**
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
      "field": "specialization_id",
      "message": "Specialization is required for doctors"
    }
  ]
}
```

#### Authentication Errors (401 Unauthorized)

**Scenarios:**
- Missing authorization header
- Invalid or expired token
- Token signature verification failed

**Response Format:**
```json
{
  "success": false,
  "error": "Unauthorized",
  "message": "Invalid or expired token"
}
```

#### Authorization Errors (403 Forbidden)

**Scenarios:**
- User is not an admin
- User lacks specific permission
- Attempting to modify own admin status

**Response Format:**
```json
{
  "success": false,
  "error": "Forbidden",
  "message": "You do not have permission to perform this action"
}
```

#### Not Found Errors (404 Not Found)

**Scenarios:**
- User not found
- Specialization not found
- Schedule not found

**Response Format:**
```json
{
  "success": false,
  "error": "Not Found",
  "message": "User with ID 'xyz' not found"
}
```

#### Conflict Errors (409 Conflict)

**Scenarios:**
- Specialization already exists
- Cannot delete specialization with assigned doctors
- Cannot deactivate last admin account
- User already has this specialization

**Response Format:**
```json
{
  "success": false,
  "error": "Conflict",
  "message": "Specialization 'Cardiology' already exists"
}
```

#### Server Errors (500 Internal Server Error)

**Scenarios:**
- Database connection failure
- Unexpected server error
- Email service failure

**Response Format:**
```json
{
  "success": false,
  "error": "Internal Server Error",
  "message": "An unexpected error occurred. Please try again later."
}
```

### Error Handling Strategy

**Frontend:**
- Display user-friendly error messages
- Highlight invalid form fields
- Provide actionable guidance (e.g., "Email format is invalid")
- Log errors for debugging
- Implement retry logic for network failures

**Backend:**
- Log all errors with context (user ID, action, timestamp)
- Sanitize error messages before sending to client
- Implement transaction rollback on failure
- Send alerts for critical errors
- Maintain error rate monitoring

**Database:**
- Use constraints to prevent invalid data
- Implement foreign key constraints with appropriate cascade rules
- Use transactions for multi-step operations
- Log all failed operations

---

## Testing Strategy

### Dual Testing Approach

The Admin Module requires both unit tests and property-based tests for comprehensive coverage:

**Unit Tests:**
- Specific examples and edge cases
- Integration points between components
- Error conditions and validation
- UI component behavior
- API endpoint responses

**Property-Based Tests:**
- Universal properties across all inputs
- Comprehensive input coverage through randomization
- Invariant preservation
- Round-trip operations

### Unit Testing

**Test Categories:**

1. **User Management Tests**
   - Create user with valid data
   - Reject user creation with invalid email
   - Activate/deactivate user account
   - Approve doctor with specialization
   - Reject pending registration
   - Search and filter users

2. **Specialization Tests**
   - Create specialization with unique name
   - Reject duplicate specialization names
   - Update specialization details
   - Prevent deletion of specialization with assigned doctors
   - Assign specialization to doctor

3. **Schedule Tests**
   - Create valid schedule with time slots
   - Reject schedule with invalid time range
   - Update existing schedule
   - Delete schedule slot
   - Retrieve doctor's weekly schedule

4. **Dashboard Tests**
   - Retrieve user statistics
   - Retrieve case statistics
   - Retrieve lab test statistics
   - Verify statistics accuracy
   - Test statistics caching

5. **Audit Log Tests**
   - Log user creation action
   - Log specialization update action
   - Log approval action
   - Filter logs by action type and date range
   - Verify audit log immutability

6. **Authorization Tests**
   - Reject non-admin access to admin endpoints
   - Allow admin access to all endpoints
   - Verify role-based feature access
   - Test session expiry and re-authentication

### Property-Based Testing Configuration

**Testing Library:** fast-check (JavaScript/TypeScript)

**Minimum Iterations:** 100 per property test

**Test Structure:**
```typescript
import fc from 'fast-check';

describe('Admin Module Properties', () => {
  // Feature: admin-module, Property 1: User Status Transitions
  it('should enforce user status transitions correctly', () => {
    fc.assert(
      fc.property(
        fc.record({
          userId: fc.uuid(),
          initialStatus: fc.constantFrom('Active', 'Inactive'),
          newStatus: fc.constantFrom('Active', 'Inactive')
        }),
        async (data) => {
          // Test implementation
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

**Property Test Coverage:**

1. **Property 1: User Status Transitions**
   - Generate random users with different statuses
   - Verify status changes are persisted
   - Verify login behavior matches status

2. **Property 2: Approval Status Consistency**
   - Generate pending registrations
   - Approve with valid specialization
   - Verify status changes to Active
   - Verify user can log in

3. **Property 3: Specialization Assignment Requirement**
   - Generate doctor approvals without specialization
   - Verify approval fails
   - Verify status remains Pending Approval

4. **Property 4: Schedule Time Validation**
   - Generate random time ranges
   - Verify end_time > start_time constraint
   - Verify invalid schedules are rejected

5. **Property 5: Specialization Deletion Protection**
   - Generate specializations with assigned doctors
   - Attempt deletion
   - Verify deletion fails with warning

6. **Property 6: Audit Log Immutability**
   - Generate audit log entries
   - Attempt modification
   - Verify modification fails
   - Verify all actions are logged

7. **Property 7: Admin-Only Access Enforcement**
   - Generate non-admin users
   - Attempt admin endpoint access
   - Verify 403 Forbidden response

8. **Property 8: Input Validation Consistency**
   - Generate invalid inputs (empty, malformed, etc.)
   - Verify rejection with specific error messages
   - Verify data is not persisted

9. **Property 9: Dashboard Statistics Accuracy**
   - Generate random user/case/lab data
   - Query statistics
   - Verify counts match database records

10. **Property 10: Pagination Consistency**
    - Generate large datasets
    - Query paginated results
    - Verify total count and page consistency

11. **Property 11: Search and Filter Accuracy**
    - Generate random search criteria
    - Query with filters
    - Verify all results match criteria

12. **Property 12: Specialization Uniqueness**
    - Generate specialization names
    - Attempt duplicate creation
    - Verify uniqueness constraint

13. **Property 13: Rejection Cleanup**
    - Generate pending registrations
    - Reject registration
    - Verify account is deleted

14. **Property 14: Schedule Notification Delivery**
    - Generate schedule updates
    - Verify notification is sent
    - Verify notification contains correct data

15. **Property 15: Role-Based Feature Access**
    - Generate users with different roles
    - Verify feature access matches role
    - Verify non-admin users cannot access admin features

### Integration Testing

**Test Scenarios:**
- Admin approves doctor → Doctor can log in → Doctor can view own profile
- Admin assigns specialization → Specialization appears in doctor's profile → Patients can search by specialization
- Admin creates schedule → Schedule appears in doctor's availability → Patients can book appointments
- Admin deactivates user → User cannot log in → User's data remains in system

### Performance Testing

**Benchmarks:**
- Dashboard load time: < 2 seconds
- User list filtering: < 1 second
- Search results: < 1 second
- Pagination: < 500ms per page

**Load Testing:**
- 1000 concurrent admin users
- 10,000 user records
- 5,000 specialization assignments
- 50,000 audit log entries

### UI Testing

**Component Tests:**
- UserTable renders correctly with data
- FilterBar updates results on filter change
- ScheduleEditor validates time ranges
- ApprovalModal displays required fields
- StatisticsCard displays correct values

**E2E Tests:**
- Admin logs in → Views dashboard → Navigates to users → Filters by role → Approves pending doctor
- Admin creates specialization → Assigns to doctor → Verifies in doctor profile
- Admin creates schedule → Verifies in doctor's availability

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
- Database schema creation
- User management API endpoints
- Admin authentication middleware
- Basic RBAC implementation

### Phase 2: Core Features (Week 3-4)
- Specialization management endpoints
- Doctor schedule endpoints
- Audit logging system
- Admin dashboard statistics

### Phase 3: UI Development (Week 5-6)
- Admin dashboard page
- User management interface
- Specialization management interface
- Schedule editor component

### Phase 4: Testing & Refinement (Week 7-8)
- Unit test implementation
- Property-based test implementation
- Integration testing
- Performance optimization

### Phase 5: Deployment (Week 9)
- Staging deployment
- User acceptance testing
- Production deployment
- Monitoring setup

---

## Security Considerations

### Input Validation
- Validate all user inputs on both client and server
- Use parameterized queries to prevent SQL injection
- Sanitize HTML to prevent XSS attacks
- Validate email and phone number formats

### Authentication
- Use JWT tokens with expiration
- Implement refresh token rotation
- Secure token storage (httpOnly cookies)
- Implement rate limiting on login attempts

### Authorization
- Verify admin role on every request
- Implement permission-based access control
- Log all authorization failures
- Implement session timeout

### Data Protection
- Encrypt sensitive data at rest
- Use HTTPS for all communications
- Implement audit logging for all changes
- Implement data retention policies

### Audit Logging
- Log all admin actions with timestamp
- Include admin ID and IP address
- Log both successful and failed operations
- Prevent audit log tampering

---

## Performance Optimization

### Database Optimization
- Create indexes on frequently queried columns
- Use pagination to limit result sets
- Implement query caching for statistics
- Use connection pooling

### API Optimization
- Implement response compression
- Use pagination for large datasets
- Cache frequently accessed data
- Implement rate limiting

### Frontend Optimization
- Lazy load components
- Implement virtual scrolling for large lists
- Cache API responses
- Minimize bundle size

### Caching Strategy
- Cache specializations (rarely change)
- Cache user statistics (refresh every 5 minutes)
- Cache dashboard data (refresh on page load)
- Implement cache invalidation on updates

