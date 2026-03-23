-- ============================================================================
-- ADMIN MODULE - SUPABASE SQL SCHEMA
-- ============================================================================
-- This SQL schema creates all necessary tables for the Admin Module
-- Run these migrations in order in your Supabase database
-- ============================================================================

-- ============================================================================
-- MIGRATION 1: Create User Roles and Status Table (Admin-Specific)
-- ============================================================================
-- Note: We use a separate table instead of modifying auth.users
-- This keeps the Supabase auth system intact and allows us to add admin features

CREATE TABLE IF NOT EXISTS user_roles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL DEFAULT 'Patient' 
    CHECK (role IN ('Admin', 'Doctor', 'Patient', 'Lab')),
  account_status VARCHAR(50) NOT NULL DEFAULT 'Active' 
    CHECK (account_status IN ('Active', 'Inactive', 'Pending Approval')),
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);
CREATE INDEX IF NOT EXISTS idx_user_roles_account_status ON user_roles(account_status);
CREATE INDEX IF NOT EXISTS idx_user_roles_is_deleted ON user_roles(is_deleted);

-- ============================================================================
-- MIGRATION 2: Create Medical Specializations Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS medical_specializations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID NOT NULL REFERENCES users(id),
  
  CONSTRAINT name_not_empty CHECK (name != '')
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_specializations_name ON medical_specializations(name);
CREATE INDEX IF NOT EXISTS idx_specializations_active ON medical_specializations(is_active);
CREATE INDEX IF NOT EXISTS idx_specializations_created_by ON medical_specializations(created_by);

-- ============================================================================
-- MIGRATION 3: Create Doctor Specializations Junction Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS doctor_specializations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  specialization_id UUID NOT NULL REFERENCES medical_specializations(id) ON DELETE RESTRICT,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  assigned_by UUID NOT NULL REFERENCES users(id),
  
  UNIQUE(doctor_id, specialization_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_doctor_specializations_doctor ON doctor_specializations(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_specializations_specialization ON doctor_specializations(specialization_id);
CREATE INDEX IF NOT EXISTS idx_doctor_specializations_assigned_by ON doctor_specializations(assigned_by);

-- ============================================================================
-- MIGRATION 4: Create Doctor Schedules Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS doctor_schedules (
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_doctor_schedules_doctor ON doctor_schedules(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_schedules_day ON doctor_schedules(day_of_week);
CREATE INDEX IF NOT EXISTS idx_doctor_schedules_active ON doctor_schedules(is_active);
CREATE INDEX IF NOT EXISTS idx_doctor_schedules_created_by ON doctor_schedules(created_by);

-- ============================================================================
-- MIGRATION 5: Create Audit Logs Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin ON audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_status ON audit_logs(status);

-- ============================================================================
-- MIGRATION 6: Create Dashboard Cache Table (Optional - for performance)
-- ============================================================================

CREATE TABLE IF NOT EXISTS dashboard_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key VARCHAR(100) UNIQUE NOT NULL,
  cache_value JSONB NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_dashboard_cache_expires ON dashboard_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_dashboard_cache_key ON dashboard_cache(cache_key);

-- ============================================================================
-- MIGRATION 7: Create Views for Common Queries
-- ============================================================================

-- View: Active Users by Role
CREATE OR REPLACE VIEW active_users_by_role AS
SELECT 
  role,
  COUNT(*) as count
FROM users
WHERE account_status = 'Active' AND is_deleted = FALSE
GROUP BY role;

-- View: Pending Approvals
CREATE OR REPLACE VIEW pending_approvals AS
SELECT 
  id,
  email,
  first_name,
  last_name,
  role,
  created_at
FROM users
WHERE account_status = 'Pending Approval' AND is_deleted = FALSE
ORDER BY created_at DESC;

-- View: Doctors with Specializations
CREATE OR REPLACE VIEW doctors_with_specializations AS
SELECT 
  u.id,
  u.email,
  u.first_name,
  u.last_name,
  u.account_status,
  ms.id as specialization_id,
  ms.name as specialization_name
FROM users u
LEFT JOIN doctor_specializations ds ON u.id = ds.doctor_id
LEFT JOIN medical_specializations ms ON ds.specialization_id = ms.id
WHERE u.role = 'Doctor' AND u.is_deleted = FALSE;

-- View: Doctors with Schedules
CREATE OR REPLACE VIEW doctors_with_schedules AS
SELECT 
  u.id,
  u.email,
  u.first_name,
  u.last_name,
  ds.id as schedule_id,
  ds.day_of_week,
  ds.start_time,
  ds.end_time,
  ds.is_active
FROM users u
LEFT JOIN doctor_schedules ds ON u.id = ds.doctor_id
WHERE u.role = 'Doctor' AND u.is_deleted = FALSE;

-- ============================================================================
-- MIGRATION 8: Create Functions for Common Operations
-- ============================================================================

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
  FROM users;
END;
$$ LANGUAGE plpgsql;

-- Function: Get Specialization Count
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

-- ============================================================================
-- MIGRATION 9: Create Triggers for Automatic Updates
-- ============================================================================

-- Trigger: Update users.updated_at on modification
CREATE OR REPLACE FUNCTION update_users_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_update_timestamp
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_users_timestamp();

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

-- Trigger: Update schedules.updated_at on modification
CREATE OR REPLACE FUNCTION update_schedules_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER schedules_update_timestamp
BEFORE UPDATE ON doctor_schedules
FOR EACH ROW
EXECUTE FUNCTION update_schedules_timestamp();

-- ============================================================================
-- MIGRATION 10: Create Row-Level Security Policies (Optional)
-- ============================================================================

-- Enable RLS on audit_logs (prevent modification/deletion)
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can only insert audit logs
CREATE POLICY audit_logs_insert_policy ON audit_logs
  FOR INSERT
  WITH CHECK (true);

-- Policy: Admins can only select audit logs (no update/delete)
CREATE POLICY audit_logs_select_policy ON audit_logs
  FOR SELECT
  USING (true);

-- ============================================================================
-- MIGRATION 11: Seed Initial Data (Optional)
-- ============================================================================

-- Insert default admin user (password: admin123 - CHANGE IN PRODUCTION)
-- Note: In production, use bcrypt or similar for password hashing
INSERT INTO users (
  email,
  password_hash,
  first_name,
  last_name,
  role,
  account_status
) VALUES (
  'admin@example.com',
  '$2b$10$YourHashedPasswordHere', -- Replace with actual bcrypt hash
  'Admin',
  'User',
  'Admin',
  'Active'
) ON CONFLICT (email) DO NOTHING;

-- Insert default medical specializations
INSERT INTO medical_specializations (name, description, created_by)
SELECT 
  'Cardiology',
  'Heart and cardiovascular system',
  id
FROM users
WHERE email = 'admin@example.com'
ON CONFLICT (name) DO NOTHING;

INSERT INTO medical_specializations (name, description, created_by)
SELECT 
  'Neurology',
  'Nervous system and brain disorders',
  id
FROM users
WHERE email = 'admin@example.com'
ON CONFLICT (name) DO NOTHING;

INSERT INTO medical_specializations (name, description, created_by)
SELECT 
  'Orthopedics',
  'Bones, joints, and muscles',
  id
FROM users
WHERE email = 'admin@example.com'
ON CONFLICT (name) DO NOTHING;

INSERT INTO medical_specializations (name, description, created_by)
SELECT 
  'Dermatology',
  'Skin, hair, and nail disorders',
  id
FROM users
WHERE email = 'admin@example.com'
ON CONFLICT (name) DO NOTHING;

INSERT INTO medical_specializations (name, description, created_by)
SELECT 
  'Pediatrics',
  'Medical care for children',
  id
FROM users
WHERE email = 'admin@example.com'
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- MIGRATION 12: Create Cleanup Procedures (Optional)
-- ============================================================================

-- Function: Clean up expired cache entries
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM dashboard_cache
  WHERE expires_at < CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- Function: Soft delete user (mark as deleted instead of hard delete)
CREATE OR REPLACE FUNCTION soft_delete_user(user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE users
  SET is_deleted = TRUE, deleted_at = CURRENT_TIMESTAMP
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- MIGRATION 13: Create Indexes for Performance
-- ============================================================================

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_users_role_status ON users(role, account_status) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_users_email_status ON users(email, account_status) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_doctor_schedules_doctor_day ON doctor_schedules(doctor_id, day_of_week) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_created ON audit_logs(admin_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_created ON audit_logs(resource_type, resource_id, created_at DESC);

-- Full-text search index for user search (optional)
CREATE INDEX IF NOT EXISTS idx_users_search ON users USING GIN (
  to_tsvector('english', first_name || ' ' || last_name || ' ' || email)
) WHERE is_deleted = FALSE;

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
-- Total tables created: 6 (users, medical_specializations, doctor_specializations, 
--                          doctor_schedules, audit_logs, dashboard_cache)
-- Total views created: 4
-- Total functions created: 6
-- Total triggers created: 3
-- Total indexes created: 25+
-- ============================================================================
