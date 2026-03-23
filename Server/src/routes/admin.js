/**
 * Admin Routes
 * All routes require admin authentication
 */

const express = require('express');
const router = express.Router();

// Middleware
const { adminAuthMiddleware } = require('../middleware/adminAuth');

// Controllers
const adminUserController = require('../controllers/adminUserController');
const adminSpecializationController = require('../controllers/adminSpecializationController');
const adminScheduleController = require('../controllers/adminScheduleController');
const adminDashboardController = require('../controllers/adminDashboardController');
const adminAuditLogController = require('../controllers/adminAuditLogController');

// Apply admin auth middleware to all routes
router.use(adminAuthMiddleware);

// ============================================================================
// USER MANAGEMENT ROUTES
// ============================================================================

// Get all users
router.get('/users', adminUserController.getAllUsers);

// Get user by ID
router.get('/users/:userId', adminUserController.getUserById);

// Update user status (activate/deactivate)
router.put('/users/:userId/status', adminUserController.updateUserStatus);

// Approve doctor registration
router.post('/users/:userId/approve', adminUserController.approveDoctorRegistration);

// Reject doctor registration
router.post('/users/:userId/reject', adminUserController.rejectDoctorRegistration);

// Assign specialization to doctor
router.put('/users/:userId/specialization', adminUserController.assignSpecializationToDoctor);

// ============================================================================
// SPECIALIZATION MANAGEMENT ROUTES
// ============================================================================

// Get all specializations
router.get('/specializations', adminSpecializationController.getAllSpecializations);

// Create specialization
router.post('/specializations', adminSpecializationController.createSpecialization);

// Update specialization
router.put('/specializations/:specializationId', adminSpecializationController.updateSpecialization);

// Delete specialization
router.delete('/specializations/:specializationId', adminSpecializationController.deleteSpecialization);

// ============================================================================
// DOCTOR SCHEDULE ROUTES
// ============================================================================

// Get doctor schedule
router.get('/doctors/:doctorId/schedule', adminScheduleController.getDoctorSchedule);

// Create/update doctor schedule
router.post('/doctors/:doctorId/schedule', adminScheduleController.createOrUpdateSchedule);

// Delete schedule slot
router.delete('/doctors/:doctorId/schedule/:scheduleId', adminScheduleController.deleteScheduleSlot);

// ============================================================================
// DASHBOARD STATISTICS ROUTES
// ============================================================================

// Get all statistics
router.get('/dashboard/statistics', adminDashboardController.getAllStatistics);

// Get user statistics
router.get('/dashboard/statistics/users', adminDashboardController.getUserStatistics);

// Get case statistics
router.get('/dashboard/statistics/cases', adminDashboardController.getCaseStatistics);

// Get lab test statistics
router.get('/dashboard/statistics/lab-tests', adminDashboardController.getLabTestStatistics);

// ============================================================================
// AUDIT LOG ROUTES
// ============================================================================

// Get audit logs
router.get('/audit-logs', adminAuditLogController.getAuditLogs);

// Get specific audit log
router.get('/audit-logs/:logId', adminAuditLogController.getAuditLogById);

// Get audit logs for resource
router.get('/audit-logs/resource/:resourceType/:resourceId', adminAuditLogController.getResourceAuditLogs);

// Get audit logs for admin
router.get('/audit-logs/admin/:adminId', adminAuditLogController.getAdminAuditLogs);

module.exports = router;
