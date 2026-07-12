# AssetFlow
# Database Design & ER Specification

---

Document ID: AF-DB-001

Version: 1.0

Status: Draft

Project: AssetFlow – Enterprise Asset & Resource Management System

Reference Documents

- AF-PRD-001
- AF-SRS-001
- AF-ARCH-001

---

# Table of Contents

1. Database Design Principles
2. Naming Conventions
3. Database Architecture
4. Core Entities
5. Relationships
6. Master Tables
7. Transaction Tables
8. Audit Tables
9. Notification Tables
10. Indexing Strategy
11. Constraints
12. Soft Delete Strategy
13. Database Standards

---

# 1. Database Design Principles

The AssetFlow database shall follow these principles:

- Third Normal Form (3NF)
- ACID Transactions
- Referential Integrity
- Soft Delete
- Audit Friendly
- UUID Primary Keys
- Optimized Indexing
- History Preservation

---

# 2. Naming Conventions

## Tables

Plural

Examples

users

departments

assets

bookings

maintenance_requests

---

## Primary Keys

id

UUID

---

## Foreign Keys

department_id

asset_id

user_id

category_id

booking_id

---

## Timestamp Columns

created_at

updated_at

deleted_at

---

## Boolean Columns

is_active

is_deleted

is_bookable

---

## Enum Columns

status

role

priority

condition

---

# 3. Database Architecture

```

Organization

│

Departments

│

Users

│

Assets

│

Allocation

│

Booking

│

Maintenance

│

Audit

│

Notifications

│

Activity Logs

```

---

# 4. Master Tables

Master tables contain static business information.

---

## departments

Purpose

Store organization hierarchy.

Columns

| Column | Type | Description |
|----------|----------|----------------|
| id | UUID | Primary Key |
| name | VARCHAR(100) | Department Name |
| code | VARCHAR(20) | Unique Code |
| parent_department_id | UUID | Self Reference |
| head_id | UUID | Department Head |
| status | ENUM | ACTIVE / INACTIVE |
| created_at | TIMESTAMP | Creation Time |
| updated_at | TIMESTAMP | Last Update |
| deleted_at | TIMESTAMP | Soft Delete |

Indexes

- name
- code
- status

---

## roles

Purpose

System Roles

Columns

id

name

description

created_at

---

Default Roles

ADMIN

ASSET_MANAGER

DEPARTMENT_HEAD

EMPLOYEE

---

## permissions

Purpose

RBAC Permissions

Examples

CREATE_ASSET

UPDATE_ASSET

DELETE_ASSET

ALLOCATE_ASSET

BOOK_RESOURCE

VIEW_REPORT

---

## role_permissions

Many-to-Many

roles

↓

permissions

---

## users

Purpose

Employee Directory

Columns

| Column | Type |
|----------|------|
| id | UUID |
| employee_code | VARCHAR(20) |
| first_name | VARCHAR |
| last_name | VARCHAR |
| email | VARCHAR |
| password | VARCHAR |
| phone | VARCHAR |
| role_id | UUID |
| department_id | UUID |
| profile_image | TEXT |
| status | ENUM |
| last_login | TIMESTAMP |
| created_at | TIMESTAMP |
| updated_at | TIMESTAMP |
| deleted_at | TIMESTAMP |

Indexes

email

employee_code

department_id

role_id

status

---

## asset_categories

Columns

id

name

description

icon

is_active

created_at

updated_at

---

# 5. Asset Tables

---

## assets

Purpose

Store all physical assets.

Columns

| Column | Type |
|----------|------|
| id | UUID |
| asset_tag | VARCHAR |
| name | VARCHAR |
| category_id | UUID |
| serial_number | VARCHAR |
| manufacturer | VARCHAR |
| model | VARCHAR |
| acquisition_date | DATE |
| acquisition_cost | DECIMAL |
| current_value | DECIMAL |
| location | VARCHAR |
| condition | ENUM |
| status | ENUM |
| is_bookable | BOOLEAN |
| created_by | UUID |
| created_at | TIMESTAMP |
| updated_at | TIMESTAMP |
| deleted_at | TIMESTAMP |

Indexes

asset_tag

serial_number

status

category_id

location

---

## asset_images

id

asset_id

image_url

display_order

created_at

---

## asset_documents

id

asset_id

document_name

document_url

document_type

created_at

---

## asset_history

Purpose

Track every asset event.

Columns

id

asset_id

action

previous_value

new_value

performed_by

performed_at

remarks

---

# 6. Allocation Tables

---

## asset_allocations

Columns

id

asset_id

allocated_to

allocated_by

allocation_date

expected_return_date

actual_return_date

status

condition_before

condition_after

remarks

created_at

---

Status

ACTIVE

RETURNED

OVERDUE

TRANSFERRED

---

## transfer_requests

Columns

id

asset_id

requested_by

requested_to

department_approval

asset_manager_approval

status

reason

created_at

updated_at

---

# 7. Booking Tables

---

## resources

Purpose

Bookable Resources

Columns

id

asset_id

resource_type

capacity

location

status

created_at

---

## bookings

Columns

id

resource_id

booked_by

start_time

end_time

purpose

status

remarks

created_at

updated_at

---

Booking Status

UPCOMING

ONGOING

COMPLETED

CANCELLED

---

# 8. Maintenance Tables

---

## maintenance_requests

Columns

id

asset_id

reported_by

priority

description

photo_url

status

approved_by

assigned_to

resolved_at

remarks

created_at

updated_at

---

Priority

LOW

MEDIUM

HIGH

CRITICAL

---

Status

PENDING

APPROVED

ASSIGNED

IN_PROGRESS

RESOLVED

REJECTED

---

## maintenance_history

id

maintenance_request_id

status

remarks

updated_by

created_at

---

# 9. Audit Tables

---

## audit_cycles

Columns

id

title

department_id

location

start_date

end_date

status

created_by

created_at

---

Status

DRAFT

ACTIVE

CLOSED

---

## audit_assignments

id

audit_cycle_id

auditor_id

assigned_at

---

## audit_items

Columns

id

audit_cycle_id

asset_id

verification_status

remarks

verified_by

verified_at

---

Verification Status

VERIFIED

MISSING

DAMAGED

---

## discrepancy_reports

id

audit_item_id

severity

description

resolved

resolved_by

resolved_at

---

# 10. Notification Tables

---

## notifications

Columns

id

user_id

title

message

type

is_read

created_at

---

Types

ASSET

BOOKING

MAINTENANCE

AUDIT

TRANSFER

SYSTEM

---

# 11. Activity Log Tables

---

## activity_logs

Columns

id

user_id

module

entity

entity_id

action

ip_address

device

metadata

created_at

---

Example Actions

LOGIN

LOGOUT

REGISTER_ASSET

UPDATE_ASSET

ALLOCATE

RETURN

BOOK

APPROVE

AUDIT

---

# 12. Dashboard Materialized Views

(Optional)

dashboard_asset_summary

dashboard_booking_summary

dashboard_maintenance_summary

dashboard_department_summary

---

# 13. Relationships

```

Department

1 ---- * Users

Department

1 ---- * Audit Cycles

Category

1 ---- * Assets

Asset

1 ---- * Asset Images

Asset

1 ---- * Documents

Asset

1 ---- * Allocation History

Asset

1 ---- * Maintenance

Asset

1 ---- * Audit Items

User

1 ---- * Bookings

User

1 ---- * Notifications

User

1 ---- * Activity Logs

Audit Cycle

1 ---- * Audit Items

Role

* ---- * Permission

```

---

# 14. Constraints

Unique

email

employee_code

asset_tag

serial_number

department_code

role_name

category_name

---

Foreign Keys

department_id

role_id

asset_id

category_id

booking_id

maintenance_id

audit_cycle_id

---

Check Constraints

acquisition_cost >= 0

expected_return_date >= allocation_date

end_time > start_time

---

# 15. Soft Delete Strategy

Never permanently delete:

- Users
- Departments
- Assets
- Categories
- Bookings
- Maintenance
- Audits

Instead

deleted_at = CURRENT_TIMESTAMP

---

# 16. Database Indexing Strategy

Indexes

Users

- email
- department_id

Assets

- asset_tag
- serial_number
- status

Bookings

- resource_id
- start_time
- end_time

Maintenance

- asset_id
- status

Audit

- audit_cycle_id
- asset_id

Notifications

- user_id
- is_read

Activity Logs

- user_id
- created_at

---

# 17. Database Standards

- UUID Primary Keys
- UTC Timestamps
- Soft Delete
- Audit Columns
- Foreign Key Constraints
- Cascading Updates
- Restricted Deletes
- Transaction Support
- Optimistic Concurrency (future)

---

# 18. Next Document

AF-ERD-001

Entity Relationship Diagram

(Complete database relationship visualization)

---

End of Database Design Document