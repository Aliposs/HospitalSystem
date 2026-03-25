# Bugfix Requirements Document

## Introduction

The admin dashboard displays four statistics cards (Total Users, Total Cases, Lab Tests, Active Cases) and a "Users by Role" chart. Three of the four cards show incorrect data, and the Users by Role section does not render correctly. Specifically:

- The Total Users card includes the super admin ("big admin") in its count, which should be excluded.
- The Active Cases card does not display the actual count of active/pending appointments.
- The Total Cases card does not reflect the true total across all statuses (confirmed, cancelled, completed, pending).
- The Users by Role chart fails to display every user with their assigned role.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN the admin dashboard loads THEN the Total Users card displays a count that includes the super admin user (role: `big_admin`), inflating the displayed number.

1.2 WHEN the admin dashboard loads THEN the Active Cases card displays 0 or an incorrect count instead of the real number of active/pending appointments.

1.3 WHEN the admin dashboard loads THEN the Total Cases card displays a count that does not sum all appointment statuses (confirmed, cancelled, completed, pending), resulting in an incorrect total.

1.4 WHEN the admin dashboard loads THEN the Users by Role chart does not display all users with their roles, showing an empty or incomplete chart.

### Expected Behavior (Correct)

2.1 WHEN the admin dashboard loads THEN the Total Users card SHALL display the count of all users excluding any user with the `big_admin` role.

2.2 WHEN the admin dashboard loads THEN the Active Cases card SHALL display the count of appointments whose status is `pending` or `confirmed` (i.e., not yet completed or cancelled).

2.3 WHEN the admin dashboard loads THEN the Total Cases card SHALL display the sum of all appointments across all statuses: confirmed, cancelled, completed, and pending.

2.4 WHEN the admin dashboard loads THEN the Users by Role chart SHALL display every non-deleted user grouped by their role, with an accurate count per role.

### Unchanged Behavior (Regression Prevention)

3.1 WHEN the admin dashboard loads THEN the Lab Tests card SHALL CONTINUE TO display the total lab test count unchanged.

3.2 WHEN the admin dashboard loads THEN the Cases by Status chart SHALL CONTINUE TO display the correct breakdown of cases by status.

3.3 WHEN a non-admin user accesses the dashboard statistics API THEN the system SHALL CONTINUE TO reject the request with an authorization error.

3.4 WHEN the dashboard data is refreshed THEN the system SHALL CONTINUE TO return up-to-date statistics reflecting the current database state.
