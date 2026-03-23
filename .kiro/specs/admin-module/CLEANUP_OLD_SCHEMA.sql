-- ============================================================================
-- CLEANUP OLD ADMIN SCHEMA - RUN THIS MANUALLY
-- ============================================================================
-- This script removes the old admin schema that you created yesterday
-- Run this ONLY if you want to start fresh with the separated admin accounts
-- 
-- WARNING: This will delete ALL data in these tables
-- Make sure you have a backup if needed
-- ============================================================================

-- ============================================================================
-- STEP 1: Drop Triggers (Run these first)
-- ============================================================================

DROP TRIGGER IF EXISTS user_roles_update_timestamp ON user_roles;
DROP TRIGGER IF EXISTS specializations_update_timestamp ON medical_specializations;
DROP TRIGGER IF EXISTS availability_update_timestamp ON doctor_availability;

-- ============================================================================
-- STEP 2: Drop Functions (Run these second)
-- ============================================================================

DROP FUNCTION IF EXISTS update_user_roles_timestamp();
DROP FUNCTION IF EXISTS update_specializations_timestamp();
DROP FUNCTION IF EXISTS update_availability_timestamp();
DROP FUNCTION IF EXISTS log_audit_action(UUID, VARCHAR, VARCHAR, UUID, JSONB, VARCHAR, TEXT, VARCHAR, TEXT);
DROP FUNCTION IF EXISTS get_user_statistics();
DROP FUNCTION IF EXISTS get_specialization_doctor_count(UUID);
DROP FUNCTION IF EXISTS validate_time_range(TIME, TIME);
DROP FUNCTION IF EXISTS soft_delete_user(UUID);
DROP FUNCTION IF EXISTS cleanup_expired_cache();

-- ============================================================================
-- STEP 3: Drop Views (Run these third)
-- ============================================================================

DROP VIEW IF EXISTS pending_doctor_approvals;
DROP VIEW IF EXISTS active_users_by_role;
DROP VIEW IF EXISTS doctors_with_specializations;
DROP VIEW IF EXISTS doctors_with_schedules;

-- ============================================================================
-- STEP 4: Drop Tables (Run these last - in correct order)
-- ============================================================================

-- Drop tables with foreign keys first
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS doctor_specializations CASCADE;
DROP TABLE IF EXISTS dashboard_cache CASCADE;

-- Drop main tables
DROP TABLE IF EXISTS medical_specializations CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;

-- ============================================================================
-- STEP 5: Remove Added Columns from Existing Tables
-- ============================================================================

-- Remove columns from doctors table
ALTER TABLE doctors DROP COLUMN IF EXISTS is_approved_by_admin;
ALTER TABLE doctors DROP COLUMN IF EXISTS admin_approval_date;
ALTER TABLE doctors DROP COLUMN IF EXISTS admin_notes;
ALTER TABLE doctors DROP COLUMN IF EXISTS approved_by;

-- Remove columns from appointments table
ALTER TABLE appointments DROP COLUMN IF EXISTS admin_notes;
ALTER TABLE appointments DROP COLUMN IF EXISTS is_flagged_by_admin;
ALTER TABLE appointments DROP COLUMN IF EXISTS flagged_by;

-- Remove columns from doctor_availability table
ALTER TABLE doctor_availability DROP COLUMN IF EXISTS created_by;
ALTER TABLE doctor_availability DROP COLUMN IF EXISTS updated_at;

-- ============================================================================
-- CLEANUP COMPLETE
-- ============================================================================
-- All old admin schema has been removed
-- You can now run ADMIN_MODULE_SEPARATED_SCHEMA.sql to create the new schema
-- ============================================================================
