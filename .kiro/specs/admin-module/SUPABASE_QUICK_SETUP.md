# Supabase Quick Setup - Admin Module

## How to Set Up in Supabase

### Step 1: Open SQL Editor

1. Go to your Supabase project dashboard
2. Click on "SQL Editor" in the left sidebar
3. Click "New Query"

### Step 2: Copy and Paste Schema

Copy the entire SQL schema from `SUPABASE_SCHEMA.sql` and paste it into the SQL Editor.

### Step 3: Execute

Click the "Run" button (or press Ctrl+Enter) to execute all migrations.

### Step 4: Verify

Run this query to verify tables were created:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

You should see:
- audit_logs
- dashboard_cache
- doctor_schedules
- doctor_specializations
- medical_specializations
- users

---

## Quick Reference: Table Structures

### users
```sql
id (UUID) - Primary Key
email (VARCHAR) - Unique
password_hash (VARCHAR)
first_name (VARCHAR)
last_name (VARCHAR)
role (VARCHAR) - Admin, Doctor, Patient, Lab
account_status (VARCHAR) - Active, Inactive, Pending Approval
phone_number (VARCHAR)
profile_picture_url (VARCHAR)
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
last_login_at (TIMESTAMP)
is_deleted (BOOLEAN)
deleted_at (TIMESTAMP)
```

### medical_specializations
```sql
id (UUID) - Primary Key
name (VARCHAR) - Unique
description (TEXT)
is_active (BOOLEAN)
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
created_by (UUID) - Foreign Key to users
```

### doctor_specializations
```sql
id (UUID) - Primary Key
doctor_id (UUID) - Foreign Key to users
specialization_id (UUID) - Foreign Key to medical_specializations
assigned_at (TIMESTAMP)
assigned_by (UUID) - Foreign Key to users
```

### doctor_schedules
```sql
id (UUID) - Primary Key
doctor_id (UUID) - Foreign Key to users
day_of_week (INTEGER) - 0-6 (Sunday-Saturday)
start_time (TIME)
end_time (TIME)
is_active (BOOLEAN)
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
created_by (UUID) - Foreign Key to users
```

### audit_logs
```sql
id (UUID) - Primary Key
admin_id (UUID) - Foreign Key to users
action_type (VARCHAR) - CREATE, UPDATE, DELETE, APPROVE, REJECT, ACTIVATE, DEACTIVATE
resource_type (VARCHAR) - User, Specialization, Schedule, Account
resource_id (UUID)
changes (JSONB)
status (VARCHAR) - Success, Failure
error_message (TEXT)
ip_address (VARCHAR)
user_agent (TEXT)
created_at (TIMESTAMP)
```

### dashboard_cache
```sql
id (UUID) - Primary Key
cache_key (VARCHAR) - Unique
cache_value (JSONB)
expires_at (TIMESTAMP)
created_at (TIMESTAMP)
```

---

## Sample Queries

### Get All Users
```sql
SELECT id, email, first_name, last_name, role, account_status, created_at
FROM users
WHERE is_deleted = FALSE
ORDER BY created_at DESC;
```

### Get Pending Approvals
```sql
SELECT id, email, first_name, last_name, role, created_at
FROM users
WHERE account_status = 'Pending Approval' AND is_deleted = FALSE
ORDER BY created_at DESC;
```

### Get Doctors with Specializations
```sql
SELECT 
  u.id,
  u.email,
  u.first_name,
  u.last_name,
  ms.name as specialization
FROM users u
LEFT JOIN doctor_specializations ds ON u.id = ds.doctor_id
LEFT JOIN medical_specializations ms ON ds.specialization_id = ms.id
WHERE u.role = 'Doctor' AND u.is_deleted = FALSE;
```

### Get Doctor Schedule
```sql
SELECT 
  doctor_id,
  day_of_week,
  start_time,
  end_time
FROM doctor_schedules
WHERE doctor_id = 'doctor-uuid-here' AND is_active = TRUE
ORDER BY day_of_week;
```

### Get Audit Logs
```sql
SELECT 
  admin_id,
  action_type,
  resource_type,
  resource_id,
  status,
  created_at
FROM audit_logs
WHERE created_at >= NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;
```

### Get User Statistics
```sql
SELECT 
  COUNT(*) as total_users,
  COUNT(*) FILTER (WHERE role = 'Doctor') as doctors,
  COUNT(*) FILTER (WHERE role = 'Patient') as patients,
  COUNT(*) FILTER (WHERE role = 'Lab') as labs,
  COUNT(*) FILTER (WHERE account_status = 'Active') as active_users,
  COUNT(*) FILTER (WHERE account_status = 'Inactive') as inactive_users,
  COUNT(*) FILTER (WHERE account_status = 'Pending Approval') as pending_approvals
FROM users
WHERE is_deleted = FALSE;
```

---

## Create Admin Account

### Option 1: Using SQL (for testing)

```sql
-- First, generate a bcrypt hash of your password
-- You can use an online tool or your backend to generate this
-- For testing only: password "admin123" hashed with bcrypt

INSERT INTO users (
  email,
  password_hash,
  first_name,
  last_name,
  role,
  account_status
) VALUES (
  'admin@example.com',
  '$2b$10$YourBcryptHashHere', -- Replace with actual bcrypt hash
  'Admin',
  'User',
  'Admin',
  'Active'
);
```

### Option 2: Using Node.js (recommended)

```javascript
const bcrypt = require('bcrypt');

// Generate hash
const password = 'your_secure_password';
const hash = await bcrypt.hash(password, 10);
console.log(hash); // Use this in the SQL INSERT

// Then use the hash in the SQL query above
```

### Option 3: Using Python

```python
import bcrypt

password = b'your_secure_password'
hash = bcrypt.hashpw(password, bcrypt.gensalt())
print(hash.decode('utf-8'))  # Use this in the SQL INSERT
```

---

## Seed Initial Specializations

```sql
-- Get the admin user ID first
SELECT id FROM users WHERE email = 'admin@example.com';

-- Then insert specializations (replace admin-uuid with actual ID)
INSERT INTO medical_specializations (name, description, created_by) VALUES
('Cardiology', 'Heart and cardiovascular system', 'admin-uuid'),
('Neurology', 'Nervous system and brain disorders', 'admin-uuid'),
('Orthopedics', 'Bones, joints, and muscles', 'admin-uuid'),
('Dermatology', 'Skin, hair, and nail disorders', 'admin-uuid'),
('Pediatrics', 'Medical care for children', 'admin-uuid'),
('Psychiatry', 'Mental health and behavioral disorders', 'admin-uuid'),
('Oncology', 'Cancer treatment and research', 'admin-uuid'),
('Gastroenterology', 'Digestive system disorders', 'admin-uuid');
```

---

## Enable Row-Level Security (Optional but Recommended)

```sql
-- Enable RLS on audit_logs to prevent modification
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow inserts
CREATE POLICY audit_logs_insert_policy ON audit_logs
  FOR INSERT
  WITH CHECK (true);

-- Allow selects
CREATE POLICY audit_logs_select_policy ON audit_logs
  FOR SELECT
  USING (true);

-- Prevent updates and deletes
CREATE POLICY audit_logs_no_update ON audit_logs
  FOR UPDATE
  USING (false);

CREATE POLICY audit_logs_no_delete ON audit_logs
  FOR DELETE
  USING (false);
```

---

## Backup and Restore

### Backup Database

```bash
# Using pg_dump
pg_dump postgresql://user:password@host:port/database > backup.sql

# Or use Supabase's built-in backup feature in the dashboard
```

### Restore Database

```bash
# Using psql
psql postgresql://user:password@host:port/database < backup.sql
```

---

## Troubleshooting

### Issue: "Relation already exists"
**Solution**: The table already exists. Either drop it first or use `CREATE TABLE IF NOT EXISTS`.

### Issue: "Foreign key constraint failed"
**Solution**: Ensure the referenced table exists and the ID is valid.

### Issue: "Unique constraint violation"
**Solution**: The value already exists. Check for duplicates or use `ON CONFLICT DO NOTHING`.

### Issue: "Permission denied"
**Solution**: Ensure your Supabase user has the necessary permissions. Check your role in the database.

---

## Performance Tips

1. **Indexes**: All important columns are indexed. Check with:
   ```sql
   SELECT * FROM pg_indexes WHERE tablename = 'users';
   ```

2. **Queries**: Use `EXPLAIN ANALYZE` to check query performance:
   ```sql
   EXPLAIN ANALYZE
   SELECT * FROM users WHERE role = 'Doctor' AND account_status = 'Active';
   ```

3. **Caching**: Use the `dashboard_cache` table to cache expensive queries.

4. **Pagination**: Always use LIMIT and OFFSET for large result sets:
   ```sql
   SELECT * FROM users LIMIT 20 OFFSET 0;
   ```

---

## Next Steps

1. ✅ Run the SQL schema
2. ✅ Create admin account
3. ✅ Seed specializations
4. ✅ Test queries
5. ➡️ Start backend implementation
6. ➡️ Start frontend implementation
7. ➡️ Write tests
8. ➡️ Deploy to production

---

## Support

For issues or questions:
- Check the `GETTING_STARTED.md` guide
- Review the `design.md` for schema details
- Check `API_EXAMPLES.md` for usage patterns
- Consult Supabase documentation: https://supabase.com/docs
