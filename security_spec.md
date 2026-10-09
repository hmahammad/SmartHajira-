# Security Specification for Smart Hazira Firebase

## Data Invariants
1. A company must contain a valid Bangla name, code, category, and status.
2. A member/student record must contain a valid name, roll/staff ID, and reference a valid class or organization.
3. Attendance entries must record the student ID, valid date, attendance status (Present, Absent, Late), and capture method.
4. Audit logs record administrative activity timestamps and status.

## Rules Blueprint
- Catch-all default deny on all collections.
- Allow read/write for operational collections with validation helper predicates.
- Enforce size bounds and typed schema properties.
