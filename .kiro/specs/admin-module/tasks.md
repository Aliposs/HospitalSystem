# Implementation Plan: Admin Module

## Overview

This implementation plan breaks down the Admin Module into discrete, actionable coding tasks organized in logical phases. Each task builds on previous work, ensuring incremental progress and early validation through testing. The implementation follows a backend-first approach, establishing APIs before frontend components, with property-based tests validating universal correctness properties throughout.

---

## Phase 1: Database Setup & Core Infrastructure

- [x] 1. Create database migrations for Admin Module schema
  - Create migration file for users table extensions (admin-specific fields)
  - Create migration file for medical_specializations table
  - Create migration file for doctor_specializations junction table
  - Create migration file for doctor_schedules table
  - Create migration file for audit_logs table
  - Create migration file for dashboard_cache table (optional performance optimization)
  - Add all required indexes as specified in design
  - _Requirements: 1.1, 2.2, 3.3, 5.1, 6.1, 7.1, 9.1, 10.1, 11.1, 12.1, 15.1_

- [x] 2. Set up database connection and query utilities
  - Create database connection pool configuration
  - Create query builder utilities for common operations
  - Create transaction management utilities
  - Create database error handling utilities
  - _Requirements: 18.1, 18.2_

- [x] 3. Create core TypeScript interfaces and types
  - Define User interface with admin-specific fields
  - Define MedicalSpecialization interface
  - Define DoctorSpecialization interface
  - Define DoctorSchedule interface
  - Define AuditLog interface
  - Define API response wrapper types
  - Define pagination types
  - _Requirements: 1.1, 2.1, 3.1, 5.1, 6.1, 7.1, 9.1, 10.1, 15.1_

- [x] 4. Implement admin authentication middleware
  - Create adminAuthMiddleware to verify admin role
  - Create requireAdminPermission middleware for permission checking
  - Implement JWT token validation
  - Implement role verification logic
  - Add middleware error handling
  - _Requirements: 13.1, 13.2, 14.1, 14.2, 14.4_

- [ ]* 4.1 Write property tests for admin authentication
  - **Property 7: Admin-Only Access Enforcement**
  - **Validates: Requirements 13.1, 13.2, 14.2**

---

## Phase 2: User Management API

- [x] 5. Implement user listing and filtering service
  - Create getUserList service with pagination support
  - Implement role filtering logic
  - Implement account status filtering logic
  - Implement search by name/email logic
  - Implement sorting by multiple fields
  - Add query optimization with indexes
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

- [ ]* 5.1 Write property tests for user listing
  - **Property 10: Pagination Consistency**
  - **Validates: Requirements 1.1, 1.7**
  - **Property 11: Search and Filter Accuracy**
  - **Validates: Requirements 1.3, 1.4, 1.5**

- [x] 6. Implement GET /api/admin/users endpoint
  - Create controller for user list endpoint
  - Implement query parameter validation
  - Implement pagination logic
  - Implement response formatting
  - Add error handling for invalid parameters
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

- [x] 7. Implement GET /api/admin/users/:userId endpoint
  - Create controller for user detail endpoint
  - Fetch user with related specialization and schedule
  - Format response with all required fields
  - Add error handling for user not found
  - _Requirements: 1.1, 5.1, 6.1_

- [x] 8. Implement user status management service
  - Create updateUserStatus service
  - Implement status validation logic
  - Implement login prevention for inactive users
  - Create audit log entry for status changes
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

- [ ]* 8.1 Write property tests for user status transitions
  - **Property 1: User Status Transitions**
  - **Validates: Requirements 2.2, 2.3**

- [x] 9. Implement PUT /api/admin/users/:userId/status endpoint
  - Create controller for status update endpoint
  - Validate status value and user existence
  - Call updateUserStatus service
  - Return updated user with new status
  - Add confirmation dialog validation
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

- [x] 10. Implement doctor approval service
  - Create approveDoctorRegistration service
  - Validate specialization assignment requirement
  - Update user status to Active
  - Create audit log entry
  - Send confirmation email
  - _Requirements: 3.1, 3.2, 3.3, 3.5, 3.6_

- [ ]* 10.1 Write property tests for doctor approval
  - **Property 2: Approval Status Consistency**
  - **Validates: Requirements 3.3, 4.3**
  - **Property 3: Specialization Assignment Requirement**
  - **Validates: Requirements 3.5, 3.6**

- [x] 11. Implement POST /api/admin/users/:userId/approve endpoint
  - Create controller for doctor approval endpoint
  - Validate specialization_id is provided
  - Call approveDoctorRegistration service
  - Return success response with updated user
  - Add error handling for missing specialization
  - _Requirements: 3.1, 3.2, 3.3, 3.5, 3.6_

- [x] 12. Implement registration rejection service
  - Create rejectRegistration service
  - Delete pending user account
  - Create audit log entry
  - Send rejection email with reason
  - _Requirements: 3.4, 4.4_

- [ ]* 12.1 Write property tests for rejection cleanup
  - **Property 13: Rejection Cleanup**
  - **Validates: Requirements 3.4, 4.4**

- [x] 13. Implement POST /api/admin/users/:userId/reject endpoint
  - Create controller for rejection endpoint
  - Validate user is in Pending Approval status
  - Call rejectRegistration service
  - Return success response
  - _Requirements: 3.4, 4.4_

- [x] 14. Implement lab approval service
  - Create approveLab service (similar to doctor approval but without specialization requirement)
  - Update user status to Active
  - Create audit log entry
  - Send confirmation email
  - _Requirements: 4.1, 4.2, 4.3, 4.5_

- [x] 15. Implement specialization assignment service
  - Create assignSpecializationToDoctor service
  - Validate specialization exists
  - Create doctor_specializations record
  - Create audit log entry
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [ ]* 15.1 Write property tests for specialization assignment
  - **Property 12: Specialization Uniqueness**
  - **Validates: Requirements 7.5, 8.5**

- [x] 16. Implement PUT /api/admin/users/:userId/specialization endpoint
  - Create controller for specialization assignment endpoint
  - Validate specialization exists
  - Call assignSpecializationToDoctor service
  - Return updated doctor with specialization
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [ ] 17. Checkpoint - User Management API Complete
  - Ensure all user management endpoints are working
  - Verify all tests pass
  - Ask the user if questions arise

---

## Phase 3: Medical Specializations API

- [x] 18. Implement specialization CRUD service
  - Create createSpecialization service with uniqueness validation
  - Create updateSpecialization service
  - Create deleteSpecialization service with doctor assignment check
  - Create getSpecializations service with pagination
  - Implement caching for specializations
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 8.1, 8.2, 8.3, 8.4, 8.5, 9.1, 9.2, 9.3, 9.4_

- [ ]* 18.1 Write property tests for specialization operations
  - **Property 5: Specialization Deletion Protection**
  - **Validates: Requirements 9.3**

- [x] 19. Implement GET /api/admin/specializations endpoint
  - Create controller for specializations list endpoint
  - Implement pagination and active_only filtering
  - Include doctor count for each specialization
  - Add caching for performance
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

- [x] 20. Implement POST /api/admin/specializations endpoint
  - Create controller for specialization creation endpoint
  - Validate name is unique and not empty
  - Call createSpecialization service
  - Invalidate specializations cache
  - Return created specialization
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

- [x] 21. Implement PUT /api/admin/specializations/:specializationId endpoint
  - Create controller for specialization update endpoint
  - Validate name uniqueness (excluding current specialization)
  - Call updateSpecialization service
  - Invalidate specializations cache
  - Return updated specialization
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 22. Implement DELETE /api/admin/specializations/:specializationId endpoint
  - Create controller for specialization deletion endpoint
  - Check for assigned doctors before deletion
  - Call deleteSpecialization service
  - Invalidate specializations cache
  - Return success or conflict response
  - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [ ] 23. Checkpoint - Specializations API Complete
  - Ensure all specialization endpoints are working
  - Verify all tests pass
  - Ask the user if questions arise

---

## Phase 4: Doctor Schedule API

- [x] 24. Implement schedule management service
  - Create createDoctorSchedule service with time validation
  - Create updateDoctorSchedule service
  - Create deleteDoctorSchedule service
  - Create getDoctorSchedule service
  - Implement schedule notification logic
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

- [ ]* 24.1 Write property tests for schedule operations
  - **Property 4: Schedule Time Validation**
  - **Validates: Requirements 6.6**
  - **Property 14: Schedule Notification Delivery**
  - **Validates: Requirements 6.4**

- [x] 25. Implement GET /api/admin/doctors/:doctorId/schedule endpoint
  - Create controller for doctor schedule retrieval
  - Format schedule with day names
  - Return all schedule slots for the doctor
  - _Requirements: 6.1, 6.2, 6.3_

- [x] 26. Implement POST /api/admin/doctors/:doctorId/schedule endpoint
  - Create controller for schedule creation/update endpoint
  - Validate time ranges (end_time > start_time)
  - Validate day_of_week values (0-6)
  - Call createDoctorSchedule or updateDoctorSchedule service
  - Send notification to doctor
  - Return updated schedule
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

- [x] 27. Implement DELETE /api/admin/doctors/:doctorId/schedule/:scheduleId endpoint
  - Create controller for schedule deletion endpoint
  - Call deleteDoctorSchedule service
  - Return success response
  - _Requirements: 6.1, 6.2, 6.3_

- [ ] 28. Checkpoint - Schedule API Complete
  - Ensure all schedule endpoints are working
  - Verify all tests pass
  - Ask the user if questions arise

---

## Phase 5: Dashboard Statistics API

- [x] 29. Implement dashboard statistics service
  - Create getUserStatistics service (total, by role, by status)
  - Create getCaseStatistics service (total, by status, by specialization)
  - Create getLabTestStatistics service (total, by status, by lab)
  - Implement caching with 5-minute expiration
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 11.1, 11.2, 11.3, 11.4, 12.1, 12.2, 12.3, 12.4_

- [ ]* 29.1 Write property tests for dashboard statistics
  - **Property 9: Dashboard Statistics Accuracy**
  - **Validates: Requirements 10.1, 10.2, 10.3, 11.1, 11.2, 12.1, 12.2**

- [x] 30. Implement GET /api/admin/dashboard/statistics endpoint
  - Create controller for all statistics endpoint
  - Call all statistics services
  - Combine results into single response
  - Include last_updated timestamp
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 11.1, 11.2, 11.3, 11.4, 12.1, 12.2, 12.3, 12.4_

- [x] 31. Implement GET /api/admin/dashboard/statistics/users endpoint
  - Create controller for user statistics only
  - Call getUserStatistics service
  - Return user statistics
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 32. Implement GET /api/admin/dashboard/statistics/cases endpoint
  - Create controller for case statistics only
  - Call getCaseStatistics service
  - Return case statistics
  - _Requirements: 11.1, 11.2, 11.3, 11.4_

- [x] 33. Implement GET /api/admin/dashboard/statistics/lab-tests endpoint
  - Create controller for lab test statistics only
  - Call getLabTestStatistics service
  - Return lab test statistics
  - _Requirements: 12.1, 12.2, 12.3, 12.4_

- [ ] 34. Checkpoint - Dashboard Statistics API Complete
  - Ensure all statistics endpoints are working
  - Verify statistics accuracy
  - Verify all tests pass
  - Ask the user if questions arise

---

## Phase 6: Audit Logging API

- [x] 35. Implement audit logging service
  - Create logAuditAction service to record all admin actions
  - Implement immutability (prevent modification/deletion)
  - Capture admin ID, action type, resource type, resource ID, changes, status, error message
  - Capture IP address and user agent
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

- [ ]* 35.1 Write property tests for audit logging
  - **Property 6: Audit Log Immutability**
  - **Validates: Requirements 15.1, 15.2, 15.4**

- [x] 36. Implement GET /api/admin/audit-logs endpoint
  - Create controller for audit logs retrieval
  - Implement pagination
  - Implement filtering by action_type, resource_type, date range, admin_id
  - Return logs with admin name and formatted changes
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

- [ ] 37. Integrate audit logging into all admin operations
  - Add logAuditAction calls to user management operations
  - Add logAuditAction calls to specialization operations
  - Add logAuditAction calls to schedule operations
  - Add logAuditAction calls to approval/rejection operations
  - Capture success/failure status and error messages
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

- [ ] 38. Checkpoint - Audit Logging Complete
  - Ensure all admin operations are logged
  - Verify audit logs are immutable
  - Verify all tests pass
  - Ask the user if questions arise

---

## Phase 7: Input Validation & Error Handling

- [ ] 39. Implement comprehensive input validation
  - Create validation utilities for email format
  - Create validation utilities for phone number format
  - Create validation utilities for required fields
  - Create validation utilities for time ranges
  - Create validation utilities for specialization names
  - Create validation utilities for role and status enums
  - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5_

- [ ]* 39.1 Write property tests for input validation
  - **Property 8: Input Validation Consistency**
  - **Validates: Requirements 16.1, 16.2, 16.3**

- [ ] 40. Implement error handling middleware
  - Create error handler for validation errors (400)
  - Create error handler for authentication errors (401)
  - Create error handler for authorization errors (403)
  - Create error handler for not found errors (404)
  - Create error handler for conflict errors (409)
  - Create error handler for server errors (500)
  - Implement error logging
  - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5_

- [ ] 41. Implement input sanitization
  - Create sanitization utilities for HTML content
  - Create sanitization utilities for SQL injection prevention
  - Create sanitization utilities for XSS prevention
  - Apply sanitization to all user inputs
  - _Requirements: 16.4, 16.5_

- [ ] 42. Checkpoint - Validation & Error Handling Complete
  - Ensure all endpoints validate inputs
  - Verify error responses are user-friendly
  - Verify all tests pass
  - Ask the user if questions arise

---

## Phase 8: Frontend - Admin Dashboard

- [x] 43. Create admin dashboard layout and navigation
  - Create AdminLayout component with sidebar navigation
  - Create navigation menu with links to all admin sections
  - Create header with user menu and logout
  - Create responsive layout for mobile/tablet
  - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.5_

- [x] 44. Implement dashboard statistics page
  - Create StatisticsCard component for displaying metrics
  - Create UserStatsChart component (pie/bar chart)
  - Create CaseStatsChart component
  - Create LabTestStatsChart component
  - Create PendingApprovalsWidget component
  - Create RecentActivityWidget component
  - Fetch statistics from GET /api/admin/dashboard/statistics
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 11.1, 11.2, 11.3, 11.4, 12.1, 12.2, 12.3, 12.4_

- [x] 45. Implement user management page
  - Create UserTable component with pagination
  - Create FilterBar component for role/status/search filtering
  - Create UserDetailModal component
  - Create ApprovalModal component for doctor/lab approval
  - Create SpecializationSelector component
  - Implement inline actions (View, Edit, Approve, Activate/Deactivate)
  - Fetch users from GET /api/admin/users
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

- [ ] 46. Implement user detail page
  - Create UserDetailPage component
  - Display user information and profile
  - Display user specialization (if doctor)
  - Display user schedule (if doctor)
  - Implement edit functionality for user details
  - Fetch user from GET /api/admin/users/:userId
  - _Requirements: 1.1, 5.1, 6.1_

- [ ] 47. Implement doctor schedule editor
  - Create WeeklyScheduleGrid component (7 days)
  - Create TimeSlotInput component for start/end times
  - Create AddSlotButton and SaveButton
  - Implement time validation (end_time > start_time)
  - Fetch schedule from GET /api/admin/doctors/:doctorId/schedule
  - Submit to POST /api/admin/doctors/:doctorId/schedule
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

- [ ] 48. Checkpoint - Dashboard UI Complete
  - Ensure all dashboard pages render correctly
  - Verify responsive design on mobile/tablet
  - Verify all tests pass
  - Ask the user if questions arise

---

## Phase 9: Frontend - Specializations Management

- [x] 49. Implement specializations management page
  - Create SpecializationTable component with pagination
  - Create SpecializationForm component for create/edit
  - Create ConfirmationDialog component for deletion
  - Create DoctorCountBadge component
  - Implement inline actions (Edit, Delete)
  - Fetch specializations from GET /api/admin/specializations
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 8.1, 8.2, 8.3, 8.4, 8.5, 9.1, 9.2, 9.3, 9.4_

- [ ] 50. Implement specialization creation modal
  - Create form with name and description fields
  - Implement validation for empty name and duplicate names
  - Submit to POST /api/admin/specializations
  - Display success/error messages
  - Refresh specializations list on success
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

- [ ] 51. Implement specialization edit modal
  - Create form with name and description fields
  - Pre-populate with existing specialization data
  - Implement validation for name uniqueness
  - Submit to PUT /api/admin/specializations/:specializationId
  - Display success/error messages
  - Refresh specializations list on success
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 52. Implement specialization deletion confirmation
  - Create confirmation dialog with warning message
  - Check for assigned doctors before deletion
  - Submit to DELETE /api/admin/specializations/:specializationId
  - Display success/error messages
  - Refresh specializations list on success
  - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [ ] 53. Checkpoint - Specializations UI Complete
  - Ensure all specialization pages render correctly
  - Verify all CRUD operations work
  - Verify all tests pass
  - Ask the user if questions arise

---

## Phase 10: Frontend - Audit Logs Viewer

- [x] 54. Implement audit logs page
  - Create AuditLogTable component with pagination
  - Create DateRangeFilter component
  - Create ActionTypeFilter component
  - Create ResourceTypeFilter component
  - Create LogDetailModal component
  - Fetch audit logs from GET /api/admin/audit-logs
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

- [ ] 55. Implement audit log filtering and search
  - Implement filtering by action_type
  - Implement filtering by resource_type
  - Implement filtering by date range
  - Implement filtering by admin_id
  - Display filtered results with pagination
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

- [ ] 56. Implement audit log detail view
  - Create LogDetailModal to display full log details
  - Display admin name, action type, resource type, resource ID
  - Display changes in readable format
  - Display status and error message (if failed)
  - Display timestamp and IP address
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

- [ ] 57. Checkpoint - Audit Logs UI Complete
  - Ensure audit logs page renders correctly
  - Verify filtering works correctly
  - Verify all tests pass
  - Ask the user if questions arise

---

## Phase 11: Integration & Testing

- [ ] 58. Write integration tests for user management flow
  - Test: Admin approves doctor → Doctor can log in → Doctor can view own profile
  - Test: Admin assigns specialization → Specialization appears in doctor's profile
  - Test: Admin deactivates user → User cannot log in
  - Test: Admin rejects pending registration → Account is deleted
  - _Requirements: 1.1, 2.2, 3.3, 5.1, 6.1_

- [ ] 59. Write integration tests for specialization flow
  - Test: Admin creates specialization → Specialization appears in list
  - Test: Admin assigns specialization to doctor → Doctor profile updated
  - Test: Admin deletes specialization → Deletion prevented if doctors assigned
  - _Requirements: 7.1, 8.1, 9.1, 5.1_

- [ ] 60. Write integration tests for schedule flow
  - Test: Admin creates schedule → Schedule appears in doctor's availability
  - Test: Admin updates schedule → Changes reflected in availability
  - Test: Admin deletes schedule → Schedule removed from availability
  - _Requirements: 6.1, 6.4_

- [ ] 61. Write integration tests for dashboard flow
  - Test: Dashboard statistics match database records
  - Test: Statistics update when users are added/removed
  - Test: Statistics update when cases are created/closed
  - _Requirements: 10.1, 11.1, 12.1_

- [ ] 62. Write integration tests for audit logging
  - Test: All admin actions are logged
  - Test: Audit logs cannot be modified or deleted
  - Test: Audit logs can be filtered and searched
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

- [ ] 63. Write end-to-end tests for complete workflows
  - Test: Complete doctor registration approval workflow
  - Test: Complete lab registration approval workflow
  - Test: Complete specialization management workflow
  - Test: Complete schedule management workflow
  - _Requirements: 1.1, 2.2, 3.3, 4.3, 5.1, 6.1, 7.1, 8.1, 9.1_

- [ ] 64. Checkpoint - Integration Tests Complete
  - Ensure all integration tests pass
  - Verify end-to-end workflows work correctly
  - Ask the user if questions arise

---

## Phase 12: Security & Performance

- [ ] 65. Implement rate limiting for admin endpoints
  - Add rate limiting middleware to all admin endpoints
  - Implement per-user rate limits
  - Implement per-IP rate limits
  - Return 429 Too Many Requests on limit exceeded
  - _Requirements: 13.1, 13.2, 14.1, 14.2_

- [ ] 66. Implement CORS and security headers
  - Configure CORS for admin routes
  - Add security headers (CSP, X-Frame-Options, etc.)
  - Implement HTTPS enforcement
  - _Requirements: 13.1, 13.2, 14.1, 14.2_

- [ ] 67. Implement session management and timeout
  - Implement session timeout after inactivity
  - Implement session refresh on activity
  - Redirect to login on session expiry
  - _Requirements: 14.4, 14.5_

- [ ] 68. Optimize database queries
  - Add query result caching for specializations
  - Add query result caching for dashboard statistics
  - Implement cache invalidation on updates
  - Verify query performance with indexes
  - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5_

- [ ] 69. Optimize API response times
  - Implement response compression
  - Implement pagination for large datasets
  - Implement lazy loading for frontend components
  - Verify API response times < 1 second
  - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5_

- [ ] 70. Optimize frontend bundle size
  - Implement code splitting for admin routes
  - Implement lazy loading for components
  - Minimize CSS and JavaScript
  - Verify bundle size is reasonable
  - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.5_

- [ ] 71. Checkpoint - Security & Performance Complete
  - Verify all security measures are in place
  - Verify performance benchmarks are met
  - Verify all tests pass
  - Ask the user if questions arise

---

## Phase 13: Final Integration & Deployment

- [ ] 72. Verify backward compatibility with existing modules
  - Test authentication module integration
  - Test doctor module integration
  - Test patient module integration
  - Test lab module integration
  - Verify no breaking changes to existing APIs
  - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5_

- [ ] 73. Verify role-based feature access
  - Test admin users can access all admin features
  - Test non-admin users cannot access admin features
  - Test feature visibility matches user role
  - _Requirements: 13.3, 13.4, 14.1, 14.3, 15.1_

- [ ]* 73.1 Write property tests for role-based access
  - **Property 15: Role-Based Feature Access**
  - **Validates: Requirements 13.3, 13.4, 14.1, 14.3**

- [ ] 74. Create admin module documentation
  - Document API endpoints and request/response formats
  - Document database schema and relationships
  - Document authentication and authorization flow
  - Document error handling and status codes
  - Document deployment instructions
  - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5_

- [ ] 75. Perform final testing and validation
  - Run all unit tests
  - Run all property-based tests
  - Run all integration tests
  - Run all end-to-end tests
  - Verify all requirements are met
  - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1, 6.1, 7.1, 8.1, 9.1, 10.1, 11.1, 12.1, 13.1, 14.1, 15.1, 16.1, 17.1, 18.1, 19.1, 20.1_

- [ ] 76. Final checkpoint - Admin Module Complete
  - Ensure all tasks are completed
  - Verify all tests pass
  - Verify all requirements are met
  - Ask the user if questions arise

---

## Notes

- Tasks marked with `*` are optional property-based tests and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation and early error detection
- Property tests validate universal correctness properties across all inputs
- Unit tests validate specific examples and edge cases
- Integration tests validate component interactions
- All code should follow existing project patterns and conventions
- Database migrations should be reversible and tested
- API responses should follow consistent format with success/error fields
- Frontend components should be responsive and accessible
- All admin operations should be logged for audit trail
