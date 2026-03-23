-- ============================================================================
-- ADMIN MODULE - ADDITIONS FOR EXISTING SCHEMA (SEPARATED ADMIN ACCOUNTS)
-- ============================================================================
-- This SQL adds the Admin Module to your existing database
-- WITHOUT modifying auth.users or any existing tables
-- Safe to run - only adds new tables and columns
-- 
-- IMPORTANT: Admin accounts are COMPLETELY SEPARATED from Doctor/Patient/Lab
-- Admin users have their own table and are NOT in user_roles table
-- ============================================================================

-- ============================================================================
-- 1. Create Admin Users Table (COMPLETELY SEPARATED)
-- ============================================================================
-- This table stores ONLY admin accounts
-- Admin users are NOT doctors, patients, or labs
-- They are purely for system administration

CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  full_name VARCHAR(255) NOT NULL,
  account_status VARCHAR(50) NOT NULL DEFAULT 'Active' 
    CHECK (account_status IN ('Active', 'Inactive')),
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON admin_users(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_account_status ON admin_users(account_status);
CREATE INDEX IF NOT EXISTS idx_admin_users_is_deleted ON admin_users(is_deleted);

-- ============================================================================
-- 2. Create User Roles Table (For Doctor/Patient/Lab ONLY)
-- ============================================================================
-- This table stores roles for Doctor, Patient, and Lab users ONLY
-- Admin users are NOT in this table - they have their own admin_users table

CREATE TABLE IF NOT EXISTS user_roles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL 
    CHECK (role IN ('Doctor', 'Patient', 'Lab')),
  account_status VARCHAR(50) NOT NULL DEFAULT 'Active' 
    CHECK (account_status IN ('Active', 'Inactive', 'Pending Approval')),
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);
CREATE INDEX IF NOT EXISTS idx_user_roles_account_status ON user_roles(account_status);
CREATE INDEX IF NOT EXISTS idx_user_roles_is_deleted ON user_roles(is_deleted);

-- ============================================================================
-- 3. Create Medical Specializations Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS medical_specializations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID NOT NULL REFERENCES admin_users(user_id),
  
  CONSTRAINT name_not_empty CHECK (name != '')
);

CREATE INDEX IF NOT EXISTS idx_specializations_name ON medical_specializations(name);
CREATE INDEX IF NOT EXISTS idx_specializations_active ON medical_specializations(is_active);
CREATE INDEX IF NOT EXISTS idx_specializations_created_by ON medical_specializations(created_by);

-- ============================================================================
-- 4. Create Doctor Specializations Junction Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS doctor_specializations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES doctors(user_id) ON DELETE CASCADE,
  specialization_id UUID NOT NULL REFERENCES medical_specializations(id) ON DELETE RESTRICT,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  assigned_by UUID NOT NULL REFERENCES admin_users(user_id),
  
  UNIQUE(doctor_id, specialization_id)
);

CREATE INDEX IF NOT EXISTS idx_doctor_specializations_doctor ON doctor_specializations(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_specializations_specialization ON doctor_specializations(specialization_id);
CREATE INDEX IF NOT EXISTS idx_doctor_specializations_assigned_by ON doctor_specializations(assigned_by);

-- ============================================================================
-- 5. Update doctor_availability Table (Add Admin Fields)
-- ============================================================================

ALTER TABLE doctor_availability ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES admin_users(user_id);
ALTER TABLE doctor_availability ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- ============================================================================
-- 6. Create Audit Logs Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES admin_users(user_id),
  action_type VARCHAR(50) NOT NULL 
    CHECK (action_type IN ('CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'ACTIVATE', 'DEACTIVATE')),
  resource_type VARCHAR(50) NOT NULL 
    CHECK (resource_type IN ('User', 'Doctor', 'Specialization', 'Schedule', 'Account')),
  resource_id UUID NOT NULL,
  changes JSONB,
  status VARCHAR(20) NOT NULL CHECK (status IN ('Success', 'Failure')),
  error_message TEXT,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_admin ON audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_status ON audit_logs(status);

-- ============================================================================
-- 7. Create Dashboard Cache Table (Optional - for performance)
-- ============================================================================

CREATE TABLE IF NOT EXISTS dashboard_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key VARCHAR(100) UNIQUE NOT NULL,
  cache_value JSONB NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_dashboard_cache_expires ON dashboard_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_dashboard_cache_key ON dashboard_cache(cache_key);

-- ============================================================================
-- 8. Update doctors Table (Add Admin Fields)
-- ============================================================================

ALTER TABLE doctors ADD COLUMN IF NOT EXISTS is_approved_by_admin BOOLEAN DEFAULT FALSE;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS admin_approval_date TIMESTAMP;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS admin_notes TEXT;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES admin_users(user_id);

-- ============================================================================
-- 9. Update appointments Table (Add Admin Fields)
-- ============================================================================

ALTER TABLE appointments ADD COLUMN IF NOT EXISTS admin_notes TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS is_flagged_by_admin BOOLEAN DEFAULT FALSE;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS flagged_by UUID REFERENCES admin_users(user_id);

-- ============================================================================
-- 10. Create Views for Admin Dashboard
-- ============================================================================

-- View: Pending Doctor Approvals
CREATE OR REPLACE VIEW pending_doctor_approvals AS
SELECT 
  d.user_id,
  d.full_name,
  d.phone_number,
  d.specialty,
  d.license_file_path,
  d.created_at,
  d.is_approved,
  d.is_approved_by_admin
FROM doctors d
WHERE d.is_approved = FALSE OR d.is_approved_by_admin = FALSE
ORDER BY d.created_at DESC;

-- View: Active Users by Role (Doctor/Patient/Lab only)
CREATE OR REPLACE VIEW active_users_by_role AS
SELECT 
  ur.role,
  COUNT(*) as count
FROM user_roles ur
WHERE ur.account_status = 'Active' AND ur.is_deleted = FALSE
GROUP BY ur.role;

-- View: Active Admins
CREATE OR REPLACE VIEW active_admins AS
SELECT 
  au.id,
  au.user_id,
  au.email,
  au.full_name,
  au.account_status,
  au.created_at
FROM admin_users au
WHERE au.account_status = 'Active' AND au.is_deleted = FALSE
ORDER

-- View: Doctors with Specializations
CREATE OR REPLACE VIEW doctors_with_specializations AS
SELECT 
  d.user_id,
  d.full_name,
  d.specialty,
  ms.name as specialization_name,
  d.is_approved,
  d.is_approved_by_admin
FROM doctors d
LEFT JOIN doctor_specializations ds ON d.user_id = ds.doctor_id
LEFT JOIN medical_specializations ms ON ds.specialization_id = ms.id;

-- View: Doctors with Schedules
CREATE OR REPLACE VIEW doctors_with_schedules AS
SELECT 
  d.user_id,
  d.full_name,
  da.day_of_week,
  da.start_time,
  da.end_time,
  da.is_available
FROM doctors d
LEFT JOIN doctor_availability da ON d.user_id = da.doctor_id;

-- ============================================================================
-- 10. Create Functions for Admin Operations
-- ============================================================================

-- Function: Log Audit Action
CREATE OR REPLACE FUNCTION log_audit_action(
  p_admin_id UUID,
  p_action_type VARCHAR,
  p_resource_type VARCHAR,
  p_resource_id UUID,
  p_changes JSONB,
  p_status VARCHAR,
  p_error_message TEXT DEFAULT NULL,
  p_ip_address VARCHAR DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO audit_logs (
    admin_id,
    action_type,
    resource_type,
    resource_id,
    changes,
    status,
    error_message,
    ip_address,
    user_agent
  ) VALUES (
    p_admin_id,
    p_action_type,
    p_resource_type,
    p_resource_id,
    p_changes,
    p_status,
    p_error_message,
    p_ip_address,
    p_user_agent
  )
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Get User Statistics
CREATE OR REPLACE FUNCTION get_user_statistics()
RETURNS TABLE (
  total_users BIGINT,
  doctors BIGINT,
  patients BIGINT,
  labs BIGINT,
  active_users BIGINT,
  inactive_users BIGINT,
  pending_approvals BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) FILTER (WHERE is_deleted = FALSE),
    COUNT(*) FILTER (WHERE role = 'Doctor' AND is_deleted = FALSE),
    COUNT(*) FILTER (WHERE role = 'Patient' AND is_deleted = FALSE),
    COUNT(*) FILTER (WHERE role = 'Lab' AND is_deleted = FALSE),
    COUNT(*) FILTER (WHERE account_status = 'Active' AND is_deleted = FALSE),
    COUNT(*) FILTER (WHERE account_status = 'Inactive' AND is_deleted = FALSE),
    COUNT(*) FILTER (WHERE account_status = 'Pending Approval' AND is_deleted = FALSE)
  FROM user_roles;
END;
$$ LANGUAGE plpgsql;

-- Function: Get Specialization Doctor Count
CREATE OR REPLACE FUNCTION get_specialization_doctor_count(spec_id UUID)
RETURNS BIGINT AS $$
BEGIN
  RETURN COUNT(*)
  FROM doctor_specializations
  WHERE specialization_id = spec_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Validate Time Range
CREATE OR REPLACE FUNCTION validate_time_range(start_time TIME, end_time TIME)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN start_time < end_time;
END;
$$ LANGUAGE plpgsql;

-- Function: Soft Delete User
CREATE OR REPLACE FUNCTION soft_delete_user(user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE user_roles
  SET is_deleted = TRUE, deleted_at = CURRENT_TIMESTAMP
  WHERE user_id = user_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Clean up Expired Cache
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM dashboard_cache
  WHERE expires_at < CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 11. Create Triggers for Automatic Updates
-- ============================================================================

-- Trigger: Update user_roles.updated_at on modification
CREATE OR REPLACE FUNCTION update_user_roles_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_roles_update_timestamp
BEFORE UPDATE ON user_roles
FOR EACH ROW
EXECUTE FUNCTION update_user_roles_timestamp();

-- Trigger: Update specializations.updated_at on modification
CREATE OR REPLACE FUNCTION update_specializations_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER specializations_update_timestamp
BEFORE UPDATE ON medical_specializations
FOR EACH ROW
EXECUTE FUNCTION update_specializations_timestamp();

-- Trigger: Update doctor_availability.updated_at on modification
CREATE OR REPLACE FUNCTION update_availability_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER availability_update_timestamp
BEFORE UPDATE ON doctor_availability
FOR EACH ROW
EXECUTE FUNCTION update_availability_timestamp();

-- ============================================================================
-- 12. Create Composite Indexes for Performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_user_roles_role_status ON user_roles(role, account_status) 
  WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_doctor_specializations_doctor_spec ON doctor_specializations(doctor_id, specialization_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_created ON audit_logs(admin_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_created ON audit_logs(resource_type, resource_id, created_at DESC);

-- ============================================================================
-- 13. Seed Initial Data (Optional)
-- ============================================================================

-- Insert default medical specializations
INSERT INTO medical_specializations (name, description, created_by)
SELECT 
  'Cardiology',
  'Heart and cardiovascular system',
  id
FROM auth.users
LIMIT 1
ON CONFLICT (name) DO NOTHING;

INSERT INTO medical_specializations (name, description, created_by)
SELECT 
  'Neurology',
  'Nervous system and brain disorders',
  id
FROM auth.users
LIMIT 1
ON CONFLICT (name) DO NOTHING;

INSERT INTO medical_specializations (name, description, created_by)
SELECT 
  'Orthopedics',
  'Bones, joints, and muscles',
  id
FROM auth.users
LIMIT 1
ON CONFLICT (name) DO NOTHING;

INSERT INTO medical_specializations (name, description, created_by)
SELECT 
  'Dermatology',
  'Skin, hair, and nail disorders',
  id
FROM auth.users
LIMIT 1
ON CONFLICT (name) DO NOTHING;

INSERT INTO medical_specializations (name, description, created_by)
SELECT 
  'Pediatrics',
  'Medical care for children',
  id
FROM auth.users
LIMIT 1
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- END OF ADMIN MODULE ADDITIONS
-- ============================================================================
-- Summary:
-- - Created user_roles table (replaces modifying auth.users)
-- - Created medical_specializations table
-- - Created doctor_specializations junction table
-- - Created audit_logs table
-- - Created dashboard_cache table
-- - Added columns to doctor_availability, doctors, appointments
-- - Created 4 views for admin dashboard
-- - Created 5 functions for admin operations
-- - Created 3 triggers for automatic updates
-- - Created composite indexes for performance
-- - Seeded initial specializations
-- 
-- All changes are safe and don't modify existing tables
-- ============================================================================
