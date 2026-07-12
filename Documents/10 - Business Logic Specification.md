# AssetFlow
# Business Logic Specification

---

Document ID: AF-BL-001

Version: 1.0

Status: Draft

Project: AssetFlow – Enterprise Asset & Resource Management System

Reference Documents

- AF-PRD-001
- AF-SRS-001
- AF-ARCH-001
- AF-DB-001
- AF-API-001

---

# Table of Contents

1. Overview
2. Global Business Rules
3. Authentication Logic
4. Organization Logic
5. User Management Logic
6. Asset Management Logic
7. Allocation Logic
8. Transfer Logic
9. Booking Logic
10. Maintenance Logic
11. Audit Logic
12. Dashboard Logic
13. Reports Logic
14. Notification Logic
15. Activity Log Logic
16. Error Handling Logic
17. Transaction Management

---

# 1. Overview

This document defines the business rules and workflows that govern AssetFlow.

Business logic resides exclusively in the Service Layer.

Controllers are responsible only for request handling.

Repositories are responsible only for data persistence.

---

# 2. Global Business Rules

## BL-001

Every authenticated request must contain a valid JWT.

---

## BL-002

Every request requiring authorization must validate permissions before execution.

---

## BL-003

Every create, update, delete, approve, reject, allocate, transfer, booking, maintenance and audit action must generate an Activity Log.

---

## BL-004

Soft Delete shall be used for all business entities.

---

## BL-005

Every database transaction must either fully succeed or completely rollback.

---

## BL-006

Notifications are generated only after a successful transaction.

---

## BL-007

Every business operation returns a standardized API response.

---

# 3. Authentication Logic

## User Registration

Workflow

```
Validate Email

↓

Check Duplicate Email

↓

Hash Password

↓

Create User

↓

Assign Employee Role

↓

Generate Activity Log

↓

Return Success
```

Business Rules

- Email must be unique
- Password must satisfy policy
- Default role is Employee
- Account is Active by default

---

## Login

Workflow

```
Validate Credentials

↓

Compare Password

↓

Generate JWT

↓

Generate Refresh Token

↓

Update Last Login

↓

Activity Log

↓

Return Tokens
```

---

## Logout

Workflow

```
Validate Session

↓

Invalidate Refresh Token

↓

Activity Log

↓

Success
```

---

# 4. Organization Logic

## Create Department

Rules

- Department name must be unique.
- Department code must be unique.
- Parent department is optional.

Workflow

```
Validate

↓

Create Department

↓

Activity Log

↓

Notification

↓

Success
```

---

## Delete Department

Rules

Cannot delete if

- Employees exist
- Assets assigned
- Active audits exist

Otherwise

Soft Delete

---

# 5. User Management Logic

## Create Employee

Rules

- Unique email
- Department required
- Default role Employee

Workflow

```
Validate

↓

Create User

↓

Assign Department

↓

Generate Employee Code

↓

Activity Log

↓

Success
```

---

## Change Role

Rules

Only Administrator.

Workflow

```
Permission Check

↓

Update Role

↓

Activity Log

↓

Notify User
```

---

# 6. Asset Management Logic

## Register Asset

Business Rules

- Category required
- Asset Tag generated automatically
- Status = AVAILABLE
- QR Code generated

Workflow

```
Validate

↓

Generate Asset Tag

↓

Generate QR

↓

Save Asset

↓

Create History

↓

Activity Log

↓

Dashboard Update
```

---

## Update Asset

Rules

Cannot edit

- Disposed assets

Can edit

- Available
- Reserved

Conditional

- Allocated assets (limited fields)

---

## Delete Asset

Rules

Cannot delete if

- Active Allocation
- Active Booking
- Active Maintenance
- Active Audit

Soft Delete only.

---

# 7. Allocation Logic

## Allocate Asset

Rules

Asset must

- Exist
- Be Available
- Not be Reserved
- Not be Under Maintenance

Employee must

- Exist
- Be Active

Workflow

```
Validate Asset

↓

Validate Employee

↓

Begin Transaction

↓

Create Allocation

↓

Update Asset Status

↓

Create Allocation History

↓

Activity Log

↓

Notification

↓

Commit
```

---

## Return Asset

Rules

Allocation must exist.

Workflow

```
Locate Allocation

↓

Verify Return

↓

Record Condition

↓

Update Asset Status

↓

Close Allocation

↓

Activity Log

↓

Notification
```

---

## Overdue Assets

Logic

```
Today >

Expected Return Date

AND

Status = ACTIVE

↓

Mark OVERDUE

↓

Notify Employee

↓

Notify Asset Manager
```

---

# 8. Transfer Logic

Workflow

```
Employee Request

↓

Department Approval

↓

Asset Manager Approval

↓

Transfer Ownership

↓

Close Previous Allocation

↓

Create New Allocation

↓

History

↓

Notification
```

Rules

- Cannot transfer disposed asset.
- Cannot transfer under-maintenance asset.
- Transfer history retained.

---

# 9. Booking Logic

## Create Booking

Rules

- Resource available
- No overlap
- Future date only

Workflow

```
Validate Resource

↓

Validate Time

↓

Overlap Check

↓

Create Booking

↓

Calendar Update

↓

Notification
```

---

## Cancel Booking

Rules

Cannot cancel

Completed bookings

Workflow

```
Validate

↓

Update Status

↓

Notification

↓

Activity Log
```

---

# 10. Maintenance Logic

## Raise Maintenance Request

Rules

- Asset exists
- Description mandatory

Workflow

```
Create Request

↓

Status=PENDING

↓

Notify Asset Manager
```

---

## Approve Maintenance

Workflow

```
Approve

↓

Status=APPROVED

↓

Update Asset

↓

UNDER_MAINTENANCE

↓

Assign Technician
```

---

## Resolve Maintenance

Workflow

```
Technician Update

↓

Verification

↓

Status=RESOLVED

↓

Asset AVAILABLE

↓

Maintenance History

↓

Activity Log
```

---

# 11. Audit Logic

## Create Audit

Workflow

```
Create Cycle

↓

Assign Auditors

↓

Notify

↓

Dashboard Update
```

---

## Verify Asset

Possible Results

- Verified
- Missing
- Damaged

Each verification creates history.

---

## Close Audit

Workflow

```
Generate Report

↓

Generate Discrepancy Report

↓

Close Cycle

↓

Notify Management

↓

Archive
```

---

# 12. Dashboard Logic

Dashboard KPIs calculated from live data.

Cards

- Total Assets
- Allocated
- Available
- Bookings
- Maintenance
- Pending Audits
- Overdue Assets

Refresh Strategy

- On Login
- Every 5 Minutes
- Manual Refresh

---

# 13. Reports Logic

Reports generated dynamically.

Supported Reports

- Assets
- Allocations
- Bookings
- Maintenance
- Audits
- Departments

Export Formats

- PDF
- Excel
- CSV

---

# 14. Notification Logic

Notification Triggers

Asset Registered

Asset Allocated

Asset Returned

Transfer Approved

Booking Created

Booking Cancelled

Maintenance Approved

Maintenance Completed

Audit Created

Audit Closed

Role Changed

Notification Priority

- Info
- Warning
- Critical

---

# 15. Activity Log Logic

Every action stores

- User
- Module
- Entity
- Entity ID
- Action
- Previous Value
- New Value
- Timestamp
- IP Address
- Device

Immutable records.

---

# 16. Error Handling Logic

Business Errors

Examples

- Asset Already Allocated
- Booking Conflict
- Duplicate Department
- Duplicate Email
- Invalid State Transition
- Permission Denied

Each error returns

- Error Code
- Message
- HTTP Status

---

# 17. Transaction Management

Transactions required for

- Asset Allocation
- Asset Transfer
- Maintenance Approval
- Booking Creation
- Audit Completion

Example

```
BEGIN

↓

Business Validation

↓

Database Updates

↓

Activity Log

↓

Notification

↓

COMMIT

If Any Failure

↓

ROLLBACK
```

---

# Business Logic Checklist

Every module must

✓ Validate Request

✓ Validate Permissions

✓ Validate Business Rules

✓ Execute Transaction

✓ Generate Activity Log

✓ Generate Notification

✓ Return Standard Response

---

# End of Business Logic Specification

Document ID: AF-BL-001

Version: 1.0

Next Document:

AF-TKT-001

Feature Breakdown & Development Tickets