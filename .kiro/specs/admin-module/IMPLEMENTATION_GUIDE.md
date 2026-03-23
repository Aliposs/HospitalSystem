# Admin Module - Implementation Guide

## Project Structure

```
backend/
├── src/
│   ├── controllers/
│   │   ├── adminController.ts
│   │   ├── userController.ts
│   │   ├── specializationController.ts
│   │   ├── scheduleController.ts
│   │   ├── dashboardController.ts
│   │   └── auditLogController.ts
│   ├── services/
│   │   ├── userService.ts
│   │   ├── specializationService.ts
│   │   ├── scheduleService.ts
│   │   ├── dashboardService.ts
│   │   ├── auditLogService.ts
│   │   └── permissionService.ts
│   ├── middleware/
│   │   ├── adminAuth.ts
│   │   ├── errorHandler.ts
│   │   └── requestLogger.ts
│   ├── models/
│   │   ├── User.ts
│   │   ├── Specialization.ts
│   │   ├── Schedule.ts
│   │   ├── AuditLog.ts
│   │   └── types.ts
│   ├── routes/
│   │   ├── adminRoutes.ts
│   │   ├── userRoutes.ts
│   │   ├── specializationRoutes.ts
│   │   ├── scheduleRoutes.ts
│   │   ├── dashboardRoutes.ts
│   │   └── auditLogRoutes.ts
│   ├── validators/
│   │   ├── userValidator.ts
│   │   ├── specializationValidator.ts
│   │   ├── scheduleValidator.ts
│   │   └── commonValidator.ts
│   ├── utils/
│   │   ├── database.ts
│   │   ├── logger.ts
│   │   ├── emailService.ts
│   │   └── cacheService.ts
│   └── app.ts
├── tests/
│   ├── unit/
│   │   ├── services/
│   │   ├── controllers/
│   │   └── validators/
│   ├── integration/
│   │   ├── userManagement.test.ts
│   │   ├── specializations.test.ts
│   │   ├── schedules.test.ts
│   │   └── dashboard.test.ts
│   └── properties/
│       ├── userProperties.test.ts
│       ├── specializationProperties.test.ts
│       ├── scheduleProperties.test.ts
│       ├── auditLogProperties.test.ts
│       └── accessControlProperties.test.ts
└── migrations/
    ├── 001_create_users_table.sql
    ├── 002_create_specializations_table.sql
    ├── 003_create_doctor_specializations_table.sql
    ├── 004_create_doctor_schedules_table.sql
    ├── 005_create_audit_logs_table.sql
    └── 006_create_indexes.sql

frontend/
├── src/
│   ├── components/
│   │   ├── admin/
│   │   │   ├── AdminLayout.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── Dashboard/
│   │   │   │   ├── Dashboard.tsx
│   │   │   │   ├── StatisticsCard.tsx
│   │   │   │   ├── UserStatsChart.tsx
│   │   │   │   ├── CaseStatsChart.tsx
│   │   │   │   └── PendingApprovalsWidget.tsx
│   │   │   ├── Users/
│   │   │   │   ├── UserList.tsx
│   │   │   │   ├── UserTable.tsx
│   │   │   │   ├── UserDetailModal.tsx
│   │   │   │   ├── ApprovalModal.tsx
│   │   │   │   ├── FilterBar.tsx
│   │   │   │   └── ScheduleEditor.tsx
│   │   │   ├── Specializations/
│   │   │   │   ├── SpecializationList.tsx
│   │   │   │   ├── SpecializationTable.tsx
│   │   │   │   ├── SpecializationForm.tsx
│   │   │   │   └── ConfirmationDialog.tsx
│   │   │   ├── AuditLogs/
│   │   │   │   ├── AuditLogViewer.tsx
│   │   │   │   ├── AuditLogTable.tsx
│   │   │   │   ├── FilterPanel.tsx
│   │   │   │   └── LogDetailModal.tsx
│   │   │   └── Settings/
│   │   │       └── AdminSettings.tsx
│   │   └── common/
│   │       ├── Pagination.tsx
│   │       ├── LoadingSpinner.tsx
│   │       ├── ErrorAlert.tsx
│   │       └── ConfirmDialog.tsx
│   ├── pages/
│   │   ├── admin/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Users.tsx
│   │   │   ├── Specializations.tsx
│   │   │   ├── AuditLogs.tsx
│   │   │   └── Settings.tsx
│   │   └── Unauthorized.tsx
│   ├── hooks/
│   │   ├── useAdmin.ts
│   │   ├── useUsers.ts
│   │   ├── useSpecializations.ts
│   │   ├── useSchedules.ts
│   │   ├── useDashboard.ts
│   │   └── useAuditLogs.ts
│   ├── services/
│   │   ├── adminApi.ts
│   │   ├── userApi.ts
│   │   ├── specializationApi.ts
│   │   ├── scheduleApi.ts
│   │   ├── dashboardApi.ts
│   │   └── auditLogApi.ts
│   ├── types/
│   │   ├── admin.ts
│   │   ├── user.ts
│   │   ├── specialization.ts
│   │   ├── schedule.ts
│   │   └── auditLog.ts
│   ├── utils/
│   │   ├── formatters.ts
│   │   ├── validators.ts
│   │   └── errorHandlers.ts
│   ├── context/
│   │   └── AdminContext.tsx
│   └── App.tsx
└── tests/
    ├── components/
    ├── hooks/
    ├── services/
    └── integration/
```

## Implementation Steps

### Step 1: Database Setup

1. Create migration files in `backend/migrations/`
2. Run migrations in order:
   ```bash
   npm run migrate
   ```
3. Verify tables created:
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public';
   ```

### Step 2: Backend - Core Services

1. **Create User Service** (`backend/src/services/userService.ts`)
   - `getAllUsers(filters, pagination)`
   - `getUserById(userId)`
   - `activateUser(userId)`
   - `deactivateUser(userId)`
   - `approveDoctor(userId, specializationId)`
   - `rejectRegistration(userId)`
   - `assignSpecialization(doctorId, specializationId)`

2. **Create Specialization Service** (`backend/src/services/specializationService.ts`)
   - `getAllSpecializations()`
   - `createSpecialization(name, description)`
   - `updateSpecialization(id, data)`
   - `deleteSpecialization(id)`
   - `checkDoctorAssignments(specializationId)`

3. **Create Schedule Service** (`backend/src/services/scheduleService.ts`)
   - `getDoctorSchedule(doctorId)`
   - `createSchedule(doctorId, scheduleData)`
   - `updateSchedule(scheduleId, data)`
   - `deleteSchedule(scheduleId)`
   - `validateTimeRange(startTime, endTime)`

4. **Create Dashboard Service** (`backend/src/services/dashboardService.ts`)
   - `getUserStatistics()`
   - `getCaseStatistics()`
   - `getLabTestStatistics()`
   - `getCachedStatistics(key)`
   - `invalidateCache(key)`

5. **Create Audit Log Service** (`backend/src/services/auditLogService.ts`)
   - `logAction(adminId, actionType, resourceType, resourceId, changes)`
   - `getAuditLogs(filters, pagination)`
   - `preventModification()` (immutability enforcement)

### Step 3: Backend - Middleware & Validation

1. **Create Admin Auth Middleware** (`backend/src/middleware/adminAuth.ts`)
   ```typescript
   export const adminAuthMiddleware = async (req, res, next) => {
     // Verify token
     // Check admin role
     // Attach user to request
   };
   ```

2. **Create Validators** (`backend/src/validators/`)
   - Email format validation
   - Phone number validation
   - Time range validation
   - Required field validation
   - Specialization name uniqueness

3. **Create Error Handler** (`backend/src/middleware/errorHandler.ts`)
   - Catch and format errors
   - Log errors
   - Return appropriate status codes

### Step 4: Backend - Controllers & Routes

1. **Create Controllers** (`backend/src/controllers/`)
   - Call services
   - Handle request/response
   - Call audit logging

2. **Create Routes** (`backend/src/routes/`)
   - Mount controllers
   - Apply middleware
   - Define HTTP methods

3. **Register Routes** in `app.ts`
   ```typescript
   app.use('/api/admin', adminAuthMiddleware, adminRoutes);
   ```

### Step 5: Frontend - Setup

1. **Create Admin Context** (`frontend/src/context/AdminContext.tsx`)
   - Store admin user data
   - Store permissions
   - Provide to components

2. **Create API Services** (`frontend/src/services/`)
   - Implement API calls
   - Handle errors
   - Manage tokens

3. **Create Custom Hooks** (`frontend/src/hooks/`)
   - `useAdmin()` - Get admin context
   - `useUsers()` - Fetch and manage users
   - `useSpecializations()` - Fetch specializations
   - `useDashboard()` - Fetch statistics

### Step 6: Frontend - Components

1. **Create Layout Components**
   - AdminLayout (main container)
   - Sidebar (navigation)
   - Header (user menu, breadcrumb)

2. **Create Dashboard Components**
   - StatisticsCard
   - Charts (user, case, lab stats)
   - PendingApprovalsWidget

3. **Create User Management Components**
   - UserTable (paginated, sortable)
   - FilterBar
   - UserDetailModal
   - ApprovalModal
   - ScheduleEditor

4. **Create Specialization Components**
   - SpecializationTable
   - SpecializationForm
   - ConfirmationDialog

5. **Create Audit Log Components**
   - AuditLogTable
   - FilterPanel
   - LogDetailModal

### Step 7: Testing

1. **Unit Tests**
   ```bash
   npm run test:unit
   ```

2. **Property-Based Tests**
   ```bash
   npm run test:properties
   ```

3. **Integration Tests**
   ```bash
   npm run test:integration
   ```

4. **E2E Tests**
   ```bash
   npm run test:e2e
   ```

## Key Implementation Details

### Admin Middleware Pattern

```typescript
// Verify admin on every request
app.use('/api/admin', adminAuthMiddleware);

// Specific permission checks
app.post('/api/admin/users/:id/approve', 
  requireAdminPermission('user:approve'),
  approveUserController
);
```

### Audit Logging Pattern

```typescript
// Log every admin action
async function approveDoctor(userId, specializationId, adminId) {
  try {
    const result = await userService.approveDoctor(userId, specializationId);
    await auditLogService.logAction(
      adminId,
      'APPROVE',
      'User',
      userId,
      { specialization_id: specializationId },
      'Success'
    );
    return result;
  } catch (error) {
    await auditLogService.logAction(
      adminId,
      'APPROVE',
      'User',
      userId,
      null,
      'Failure',
      error.message
    );
    throw error;
  }
}
```

### Validation Pattern

```typescript
// Validate before processing
const validateUserApproval = (data) => {
  const errors = [];
  
  if (!data.specialization_id && userRole === 'Doctor') {
    errors.push('Specialization is required for doctors');
  }
  
  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
};
```

### Caching Pattern

```typescript
// Cache statistics with TTL
async function getUserStatistics() {
  const cached = await cacheService.get('user_stats');
  if (cached) return cached;
  
  const stats = await calculateUserStatistics();
  await cacheService.set('user_stats', stats, 300); // 5 min TTL
  return stats;
}
```

## Testing Examples

### Unit Test Example

```typescript
describe('UserService', () => {
  it('should activate a user account', async () => {
    const userId = 'test-user-id';
    const result = await userService.activateUser(userId);
    
    expect(result.account_status).toBe('Active');
    expect(result.id).toBe(userId);
  });
});
```

### Property Test Example

```typescript
it('should enforce user status transitions', () => {
  fc.assert(
    fc.property(
      fc.record({
        userId: fc.uuid(),
        status: fc.constantFrom('Active', 'Inactive')
      }),
      async (data) => {
        const user = await userService.getUserById(data.userId);
        await userService.updateUserStatus(data.userId, data.status);
        const updated = await userService.getUserById(data.userId);
        
        expect(updated.account_status).toBe(data.status);
      }
    ),
    { numRuns: 100 }
  );
});
```

## Deployment Checklist

- [ ] Database migrations run successfully
- [ ] Environment variables configured
- [ ] Admin account created
- [ ] Initial specializations seeded
- [ ] Email service configured
- [ ] JWT secrets configured
- [ ] CORS configured
- [ ] Rate limiting configured
- [ ] Monitoring alerts set up
- [ ] Backup strategy implemented
- [ ] Documentation updated
- [ ] Team trained on admin features

