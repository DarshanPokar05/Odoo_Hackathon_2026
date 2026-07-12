# AssetFlow
# Backend Architecture & Folder Structure

---

Document ID: AF-BE-001

Version: 1.0

Status: Draft

Project: AssetFlow – Enterprise Asset & Resource Management System

Reference Documents

- AF-PRD-001
- AF-SRS-001
- AF-ARCH-001
- AF-DB-001
- AF-ERD-001

---

# Table of Contents

1. Overview
2. Architectural Pattern
3. Technology Stack
4. Project Structure
5. Module Structure
6. Request Lifecycle
7. Dependency Rules
8. Shared Components
9. Validation Layer
10. Authentication Layer
11. Repository Layer
12. Service Layer
13. Event Layer
14. Error Handling
15. Logging
16. Coding Standards

---

# 1. Overview

The backend follows a Modular Monolith architecture using Domain Driven Design (DDD) and Clean Architecture principles.

Each business domain is isolated into an independent module with its own controllers, services, repositories, DTOs, validators, events, and tests.

Business logic must never exist inside controllers.

---

# 2. Architecture Pattern

```
                HTTP Request

                     │

              Authentication

                     │

               Authorization

                     │

                Route Handler

                     │

                Validation

                     │

                Controller

                     │

                 Service

                     │

               Repository

                     │

                Prisma ORM

                     │

                PostgreSQL

                     │

                HTTP Response
```

---

# 3. Technology Stack

## Runtime

Node.js 22+

---

## Framework

Express.js

---

## Language

TypeScript

---

## ORM

Prisma ORM

---

## Database

PostgreSQL

---

## Authentication

JWT

Refresh Token

bcrypt

---

## Validation

Zod

---

## File Upload

Multer

Cloudinary

---

## Logging

Pino

---

## API Documentation

Swagger / OpenAPI

---

# 4. Project Structure

```
apps/

└── api/

    ├── prisma/

    │   ├── schema.prisma

    │   ├── migrations/

    │   └── seed.ts

    │

    ├── src/

    │

    ├── modules/

    │

    ├── shared/

    │

    ├── infrastructure/

    │

    ├── config/

    │

    ├── middlewares/

    │

    ├── routes/

    │

    ├── app.ts

    │

    └── server.ts

```

---

# 5. Modules Folder

```
modules/

auth/

organization/

user/

asset/

allocation/

booking/

maintenance/

audit/

dashboard/

report/

notification/

activity/

```

Each module owns its own implementation.

Modules never directly modify another module's data.

---

# 6. Standard Module Structure

```
asset/

asset.controller.ts

asset.service.ts

asset.repository.ts

asset.routes.ts

asset.dto.ts

asset.schema.ts

asset.types.ts

asset.constants.ts

asset.events.ts

asset.mapper.ts

asset.permissions.ts

asset.test.ts

index.ts

```

---

# 7. Shared Folder

```
shared/

constants/

errors/

utils/

validators/

events/

responses/

middlewares/

interfaces/

types/

helpers/

```

Contains reusable utilities shared by all modules.

---

# 8. Infrastructure Layer

```
infrastructure/

database/

storage/

email/

queue/

logger/

cache/

```

Responsibilities

- Prisma Client
- Cloudinary
- Email Service
- Redis (Future)
- Queue Workers (Future)

---

# 9. Request Lifecycle

```
Incoming Request

↓

Express Route

↓

Authentication Middleware

↓

Authorization Middleware

↓

Validation Middleware

↓

Controller

↓

Service

↓

Repository

↓

Database

↓

Response Formatter

↓

Client
```

---

# 10. Controller Responsibilities

Controllers are responsible only for

- Receiving Request
- Calling Service
- Returning Response

Controllers must never

❌ Query database

❌ Write business logic

❌ Handle transactions

❌ Send notifications directly

---

Example

```
POST /assets

↓

AssetController.create()

↓

AssetService.create()

```

---

# 11. Service Responsibilities

Services contain all business logic.

Responsibilities

- Validation
- Transactions
- Business Rules
- Events
- Notifications
- Activity Logs

Services may call multiple repositories.

Example

```
Allocate Asset

↓

Validate Asset

↓

Validate Employee

↓

Create Allocation

↓

Update Asset Status

↓

Create Activity Log

↓

Generate Notification

↓

Return Response
```

---

# 12. Repository Responsibilities

Repositories are responsible for

- Prisma Queries
- CRUD
- Transactions
- Query Optimization

Repositories never

❌ Validate Business Rules

❌ Authorize Users

❌ Generate Notifications

---

Example

```
AssetRepository

create()

update()

findById()

findByTag()

findMany()

delete()

```

---

# 13. DTO Layer

Every request and response uses DTOs.

Example

```
CreateAssetDTO

UpdateAssetDTO

AssetResponseDTO

AllocationDTO

BookingDTO

MaintenanceDTO

```

DTOs isolate API contracts from database models.

---

# 14. Validation Layer

Validation uses Zod.

Example

```
AssetSchema

BookingSchema

MaintenanceSchema

AuditSchema

```

Validation occurs before controllers execute.

---

# 15. Authentication Layer

Middleware

```
authenticate()

↓

verifyJWT()

↓

attachUser()

↓

next()

```

Unauthorized requests return HTTP 401.

---

# 16. Authorization Layer

Every route declares required permissions.

Example

```
POST /assets

Permission Required

CREATE_ASSET

```

Middleware

```
authorize("CREATE_ASSET")

↓

Permission Check

↓

Controller
```

---

# 17. Event Layer

The backend uses internal domain events.

Example Events

```
ASSET_CREATED

ASSET_UPDATED

ASSET_ALLOCATED

BOOKING_CREATED

BOOKING_CANCELLED

TRANSFER_APPROVED

MAINTENANCE_APPROVED

AUDIT_COMPLETED

```

Consumers

- Notification Module
- Dashboard Module
- Activity Module
- Reports Module

---

# 18. Transaction Management

Multi-step operations execute inside Prisma Transactions.

Example

Allocate Asset

```
BEGIN

↓

Create Allocation

↓

Update Asset

↓

Create History

↓

Create Notification

↓

Create Activity Log

↓

COMMIT
```

Failure

↓

ROLLBACK

---

# 19. Error Handling

Application uses centralized error handling.

Custom Errors

```
ValidationError

AuthenticationError

AuthorizationError

ConflictError

NotFoundError

BusinessRuleError

InternalServerError

```

Response

```json
{
    "success": false,
    "message": "Asset already allocated.",
    "errorCode": "ASSET_ALREADY_ALLOCATED"
}
```

---

# 20. Logging

Every request logs

- User
- Endpoint
- Duration
- Status Code
- IP Address
- User Agent

Business Logs

- Asset Created
- Asset Updated
- Booking Created
- Audit Closed

---

# 21. Coding Standards

## File Naming

```
asset.service.ts

booking.repository.ts

audit.controller.ts
```

---

## Function Naming

camelCase

```
createAsset()

allocateAsset()

approveTransfer()

```

---

## Classes

PascalCase

```
AssetService

BookingRepository

AuditController

```

---

## Constants

UPPER_CASE

```
DEFAULT_PAGE_SIZE

MAX_UPLOAD_SIZE

JWT_SECRET

```

---

## Enums

PascalCase

```
AssetStatus

BookingStatus

MaintenancePriority

```

---

# 22. Dependency Rules

Allowed

```
Controller

↓

Service

↓

Repository

↓

Database
```

Not Allowed

```
Controller

↓

Database
```

Not Allowed

```
Repository

↓

Notification
```

Not Allowed

```
Module

↓

Another Module's Repository
```

Cross-module interaction must occur through Services or Events.

---

# 23. Testing Strategy

Each module must include

- Unit Tests
- Integration Tests
- Repository Tests
- Validation Tests

Coverage Target

80%+

---

# 24. Future Enhancements

- CQRS
- Event Sourcing
- Redis Cache
- RabbitMQ
- Kafka
- Background Workers
- Microservice Extraction
- GraphQL Gateway
- Multi-Tenant Support

---

# 25. Backend Development Checklist

For every module implement:

✓ Prisma Model

✓ Repository

✓ Service

✓ Controller

✓ Routes

✓ DTOs

✓ Validation

✓ Permissions

✓ Events

✓ Activity Logs

✓ Notifications

✓ Unit Tests

✓ API Documentation

---

# End of Backend Architecture Document

Document ID: AF-BE-001

Version: 1.0

Next Document:

AF-API-001

REST API Specification