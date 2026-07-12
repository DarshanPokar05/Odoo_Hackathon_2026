# AssetFlow
# REST API Specification

---

Document ID: AF-API-001

Version: 1.0

Status: Draft

Project: AssetFlow – Enterprise Asset & Resource Management System

Reference Documents

- AF-PRD-001
- AF-SRS-001
- AF-ARCH-001
- AF-DB-001
- AF-BE-001

---

# Table of Contents

1. API Standards
2. Authentication
3. Response Standards
4. Error Standards
5. Authentication APIs
6. Organization APIs
7. User APIs
8. Asset APIs
9. Allocation APIs
10. Booking APIs
11. Maintenance APIs
12. Audit APIs
13. Dashboard APIs
14. Report APIs
15. Notification APIs
16. Activity APIs

---

# 1. API Standards

## Base URL

/api/v1

---

## Content Type

application/json

---

## Authentication

Authorization: Bearer <JWT>

---

## Date Format

ISO-8601 UTC

Example

2026-07-12T15:30:00Z

---

# 2. Standard Success Response

```json
{
  "success": true,
  "message": "Operation completed successfully.",
  "data": {}
}
```

---

# 3. Standard Error Response

```json
{
  "success": false,
  "message": "Validation failed.",
  "errorCode": "VALIDATION_ERROR",
  "errors": []
}
```

---

# 4. Authentication APIs

---

## AUTH-001 Register

POST /auth/register

Permission

Public

Request

```json
{
  "firstName": "",
  "lastName": "",
  "email": "",
  "password": "",
  "departmentId": ""
}
```

Response

201 Created

---

## AUTH-002 Login

POST /auth/login

Request

```json
{
  "email": "",
  "password": ""
}
```

Response

```json
{
  "accessToken": "",
  "refreshToken": "",
  "user": {}
}
```

---

## AUTH-003 Refresh Token

POST /auth/refresh

---

## AUTH-004 Logout

POST /auth/logout

---

## AUTH-005 Forgot Password

POST /auth/forgot-password

---

## AUTH-006 Reset Password

POST /auth/reset-password

---

# 5. Organization APIs

---

## ORG-001 Get Departments

GET /departments

Permission

ADMIN

---

## ORG-002 Create Department

POST /departments

---

## ORG-003 Update Department

PATCH /departments/{id}

---

## ORG-004 Delete Department

DELETE /departments/{id}

Soft Delete Only

---

## ORG-005 Department Details

GET /departments/{id}

---

## ORG-006 Get Categories

GET /categories

---

## ORG-007 Create Category

POST /categories

---

## ORG-008 Update Category

PATCH /categories/{id}

---

## ORG-009 Delete Category

DELETE /categories/{id}

---

# 6. User APIs

---

## USER-001 Get Employees

GET /users

Supports

- Pagination
- Search
- Filter

---

## USER-002 User Details

GET /users/{id}

---

## USER-003 Update User

PATCH /users/{id}

---

## USER-004 Assign Role

PATCH /users/{id}/role

Permission

ADMIN

---

## USER-005 Activate User

PATCH /users/{id}/activate

---

## USER-006 Deactivate User

PATCH /users/{id}/deactivate

---

# 7. Asset APIs

---

## ASSET-001 Register Asset

POST /assets

Permission

ASSET_MANAGER

---

## ASSET-002 Get Assets

GET /assets

Supports

- Search
- Filter
- Pagination
- Sorting

---

## ASSET-003 Asset Details

GET /assets/{id}

---

## ASSET-004 Update Asset

PATCH /assets/{id}

---

## ASSET-005 Delete Asset

DELETE /assets/{id}

Soft Delete

---

## ASSET-006 Upload Images

POST /assets/{id}/images

Multipart Form Data

---

## ASSET-007 Upload Documents

POST /assets/{id}/documents

---

## ASSET-008 Asset Timeline

GET /assets/{id}/history

---

## ASSET-009 Generate QR

GET /assets/{id}/qr

---

# 8. Allocation APIs

---

## ALLOC-001 Allocate Asset

POST /allocations

---

## ALLOC-002 Allocation Details

GET /allocations/{id}

---

## ALLOC-003 Active Allocations

GET /allocations

---

## ALLOC-004 Return Asset

PATCH /allocations/{id}/return

---

## ALLOC-005 Transfer Request

POST /transfers

---

## ALLOC-006 Transfer Approval

PATCH /transfers/{id}/approve

---

## ALLOC-007 Reject Transfer

PATCH /transfers/{id}/reject

---

## ALLOC-008 Overdue Assets

GET /allocations/overdue

---

# 9. Booking APIs

---

## BOOK-001 Book Resource

POST /bookings

---

## BOOK-002 Get Bookings

GET /bookings

---

## BOOK-003 Booking Details

GET /bookings/{id}

---

## BOOK-004 Update Booking

PATCH /bookings/{id}

---

## BOOK-005 Cancel Booking

PATCH /bookings/{id}/cancel

---

## BOOK-006 Calendar

GET /resources/{id}/calendar

---

## BOOK-007 Available Resources

GET /resources/available

---

# 10. Maintenance APIs

---

## MAIN-001 Raise Request

POST /maintenance

---

## MAIN-002 Maintenance Details

GET /maintenance/{id}

---

## MAIN-003 Pending Requests

GET /maintenance/pending

---

## MAIN-004 Approve Request

PATCH /maintenance/{id}/approve

---

## MAIN-005 Reject Request

PATCH /maintenance/{id}/reject

---

## MAIN-006 Assign Technician

PATCH /maintenance/{id}/assign

---

## MAIN-007 Resolve Request

PATCH /maintenance/{id}/resolve

---

# 11. Audit APIs

---

## AUD-001 Create Audit

POST /audits

---

## AUD-002 Audit List

GET /audits

---

## AUD-003 Audit Details

GET /audits/{id}

---

## AUD-004 Assign Auditor

PATCH /audits/{id}/assign

---

## AUD-005 Verify Asset

PATCH /audits/{id}/verify

---

## AUD-006 Close Audit

PATCH /audits/{id}/close

---

## AUD-007 Discrepancy Report

GET /audits/{id}/report

---

# 12. Dashboard APIs

---

## DASH-001 Dashboard Summary

GET /dashboard

---

## DASH-002 KPI Cards

GET /dashboard/kpis

---

## DASH-003 Recent Activities

GET /dashboard/activity

---

## DASH-004 Charts

GET /dashboard/charts

---

# 13. Report APIs

---

## REP-001 Asset Report

GET /reports/assets

---

## REP-002 Allocation Report

GET /reports/allocations

---

## REP-003 Maintenance Report

GET /reports/maintenance

---

## REP-004 Booking Report

GET /reports/bookings

---

## REP-005 Audit Report

GET /reports/audits

---

## REP-006 Export PDF

GET /reports/export/pdf

---

## REP-007 Export Excel

GET /reports/export/excel

---

## REP-008 Export CSV

GET /reports/export/csv

---

# 14. Notification APIs

---

## NOT-001 User Notifications

GET /notifications

---

## NOT-002 Mark Read

PATCH /notifications/{id}/read

---

## NOT-003 Mark All Read

PATCH /notifications/read-all

---

## NOT-004 Delete Notification

DELETE /notifications/{id}

---

# 15. Activity APIs

---

## LOG-001 Activity Logs

GET /activity-logs

Permission

ADMIN

---

## LOG-002 User Activity

GET /users/{id}/activity

---

## LOG-003 Asset Activity

GET /assets/{id}/activity

---

# 16. Common Query Parameters

Pagination

?page=1&limit=20

Sorting

?sortBy=createdAt&order=desc

Searching

?search=laptop

Filtering

?status=AVAILABLE

?department=IT

?category=Laptop

Date Range

?from=2026-01-01&to=2026-12-31

---

# 17. HTTP Status Codes

| Status | Meaning |
|----------|---------|
| 200 | OK |
| 201 | Created |
| 204 | No Content |
| 400 | Validation Error |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 422 | Business Rule Failed |
| 500 | Internal Server Error |

---

# 18. API Versioning

Current

/api/v1/

Future

/api/v2/

Breaking changes require a new API version.

---

# 19. Rate Limiting

Authenticated Users

100 requests/minute

Guests

20 requests/minute

Authentication Endpoints

10 requests/minute

---

# 20. API Security

- JWT Authentication
- HTTPS Only
- Role-Based Authorization
- Input Validation (Zod)
- Output Sanitization
- File Type Validation
- Rate Limiting
- Helmet Security Headers
- CORS Configuration

---

# 21. OpenAPI Standards

Every endpoint must include:

- Summary
- Description
- Request Body
- Response Schema
- Error Responses
- Authentication Requirement
- Tags
- Example Payloads

---

# 22. API Naming Conventions

Resources (Plural)

✓ /assets

✓ /bookings

✓ /users

✓ /departments

Actions

✓ /approve

✓ /reject

✓ /return

✓ /assign

Avoid verbs in resource names.

---

# 23. API Development Checklist

For every endpoint:

✓ Route Defined

✓ Zod Validation

✓ Controller

✓ Service

✓ Repository

✓ Authorization

✓ Swagger Documentation

✓ Unit Tests

✓ Integration Tests

✓ Activity Logging

✓ Notification Events

---

# End of REST API Specification

Document ID: AF-API-001

Version: 1.0

Next Document:

AF-FE-001

Frontend Architecture Specification