# AssetFlow
# System Architecture Document

---

Document ID: AF-ARCH-001

Version: 1.0

Status: Draft

Project: AssetFlow – Enterprise Asset & Resource Management System

Reference Documents

- AF-PRD-001
- AF-SRS-001

---

# Revision History

| Version | Date | Author | Description |
|----------|------|--------|-------------|
| 1.0 | YYYY-MM-DD | Architecture Team | Initial Version |

---

# Table of Contents

1. Architecture Goals
2. Design Principles
3. High-Level Architecture
4. System Components
5. Modular Architecture
6. Folder Structure
7. Request Lifecycle
8. Authentication Architecture
9. Authorization (RBAC)
10. Module Interaction
11. Event Architecture
12. Technology Stack
13. Deployment Architecture
14. Scalability Strategy
15. Security Architecture
16. Logging Architecture
17. Monitoring
18. Future Expansion

---

# 1. Architecture Goals

The architecture shall:

- Be modular
- Be scalable
- Be maintainable
- Be secure
- Support future modules
- Prevent tight coupling
- Follow Clean Architecture principles

---

# 2. Design Principles

## AP-001 Single Responsibility

Every module shall own one business domain.

Examples

Asset Module

↓

Asset Operations Only

Booking Module

↓

Booking Operations Only

---

## AP-002 Loose Coupling

Modules communicate through services.

Never directly access another module's database logic.

---

## AP-003 High Cohesion

Related business logic remains inside the same module.

---

## AP-004 Separation of Concerns

Presentation Layer

↓

Controller

↓

Service

↓

Repository

↓

Database

---

## AP-005 Reusability

Reusable components belong inside Shared modules.

---

# 3. High-Level Architecture

```
                        Browser

                           │

                    React + TypeScript

                           │

                    REST API (HTTPS)

                           │

                 Express.js Application

                           │

        ┌─────────────────────────────────┐
        │                                 │
        │        Business Modules         │
        │                                 │
        └─────────────────────────────────┘

 Assets

 Booking

 Maintenance

 Audit

 Dashboard

 Reports

 Organization

 Notifications

                           │

                   Prisma Repository

                           │

                     PostgreSQL

                           │

                    Cloud Storage
```

---

# 4. System Components

## Client Layer

Responsibilities

- UI
- Forms
- Validation
- State Management
- API Calls

Technology

- React
- TypeScript
- Tailwind

---

## API Layer

Responsibilities

- Routing
- Authentication
- Validation
- Authorization

Technology

Express.js

---

## Business Layer

Responsibilities

- Business Rules
- Transactions
- Validation
- Workflows

---

## Repository Layer

Responsibilities

- Database Operations
- Query Optimization
- Transactions

Technology

Prisma ORM

---

## Database Layer

Responsibilities

- Data Storage
- Relationships
- Constraints

Technology

PostgreSQL

---

## Storage Layer

Responsibilities

- Images
- Documents
- QR Assets

Technology

Cloudinary

---

# 5. Modular Architecture

```
Core

│

├── Authentication

├── Authorization

├── Shared

├── Notifications

├── Activity Logs

│

Business Modules

│

├── Organization

├── Users

├── Assets

├── Allocation

├── Booking

├── Maintenance

├── Audit

├── Dashboard

├── Reports

```

Each module owns:

- Routes
- Controllers
- Services
- Repository
- Validation
- DTOs
- Types
- Tests

---

# 6. Backend Folder Structure

```
apps/api/src

auth/

organization/

users/

assets/

allocation/

booking/

maintenance/

audit/

dashboard/

reports/

notifications/

activity/

shared/

config/

middlewares/

utils/

database/

types/

validators/

```

Each module

```
assets/

controllers/

services/

repository/

routes/

dto/

validators/

types/

constants/

events/

tests/

```

---

# 7. Frontend Folder Structure

```
apps/web/src

modules/

components/

layouts/

pages/

hooks/

services/

store/

routes/

assets/

styles/

utils/

types/

```

Example

```
modules/

asset/

booking/

maintenance/

audit/

reports/

dashboard/

```

---

# 8. Request Lifecycle

```
Client

↓

Route

↓

Middleware

↓

Validation

↓

Controller

↓

Service

↓

Repository

↓

Database

↓

Repository

↓

Service

↓

Controller

↓

Client
```

Controllers never contain business logic.

---

# 9. Authentication Architecture

Authentication Flow

```
Login

↓

Validate Credentials

↓

Generate JWT

↓

Generate Refresh Token

↓

Return Tokens

↓

Authenticated Requests
```

Middleware

```
Verify JWT

↓

Extract User

↓

Load Permissions

↓

Authorize Route
```

---

# 10. Authorization Architecture

RBAC

```
Admin

↓

Asset Manager

↓

Department Head

↓

Employee
```

Permission Evaluation

```
Incoming Request

↓

Authentication

↓

Role Check

↓

Permission Check

↓

Business Rule

↓

Controller
```

---

# 11. Module Interaction

Asset Allocation

```
Allocation Module

↓

Asset Module

↓

Notification Module

↓

Dashboard Module

↓

Activity Module
```

Maintenance

```
Maintenance

↓

Asset Module

↓

Notification

↓

Dashboard

↓

Reports
```

Audit

```
Audit

↓

Asset

↓

Reports

↓

Dashboard

↓

Notifications
```

Modules communicate through services/events.

---

# 12. Event Architecture

System Events

```
ASSET_REGISTERED

ASSET_ALLOCATED

ASSET_RETURNED

TRANSFER_APPROVED

BOOKING_CREATED

BOOKING_CANCELLED

MAINTENANCE_APPROVED

MAINTENANCE_COMPLETED

AUDIT_CREATED

AUDIT_COMPLETED
```

Event Consumers

- Dashboard
- Notifications
- Activity Logs
- Reports

---

# 13. Technology Stack

Frontend

- React
- TypeScript
- Tailwind CSS
- React Router
- TanStack Query
- Zustand

Backend

- Node.js
- Express.js
- TypeScript
- Prisma ORM

Database

- PostgreSQL

Storage

- Cloudinary

Authentication

- JWT
- bcrypt

Validation

- Zod

---

# 14. Deployment Architecture

```
Internet

↓

Vercel

↓

React Frontend

↓

HTTPS

↓

Railway

↓

Express API

↓

PostgreSQL

↓

Cloudinary
```

Future

Docker

Kubernetes

NGINX

Redis

---

# 15. Scalability Strategy

Horizontal Scaling

- Stateless APIs
- JWT Authentication
- External Storage

Vertical Scaling

- Database Indexing
- Query Optimization

Future

- Redis Cache
- Queue Workers
- Message Broker

---

# 16. Security Architecture

Authentication

JWT

Authorization

RBAC

Encryption

bcrypt

Transport

HTTPS

Validation

Zod

Rate Limiting

Express Rate Limit

Helmet

Enabled

CORS

Configured

---

# 17. Logging Architecture

Application Logs

- Startup
- Shutdown
- Errors

Audit Logs

- Login
- Allocation
- Booking
- Maintenance
- Audit

Database Logs

- Query Errors
- Slow Queries

---

# 18. Monitoring

Monitor

- API Response Time
- Error Rate
- Database Health
- Memory Usage
- CPU Usage
- Storage Usage

Future

Prometheus

Grafana

Sentry

---

# 19. Architecture Decisions (ADR)

| ADR ID | Decision | Reason |
|---------|----------|--------|
| ADR-001 | Modular Monolith | Faster MVP, easier future extraction |
| ADR-002 | PostgreSQL | Strong relational integrity |
| ADR-003 | Prisma ORM | Type safety and migrations |
| ADR-004 | JWT Authentication | Stateless authentication |
| ADR-005 | React + TypeScript | Modern, scalable frontend |
| ADR-006 | Service Layer Pattern | Keeps business logic isolated |
| ADR-007 | Soft Delete | Preserve audit history |
| ADR-008 | Event-Driven Internal Communication | Loose coupling between modules |

---

# 20. Future Architecture Evolution

After MVP, the architecture should support:

- Microservices (module extraction)
- Redis for caching
- Background workers (BullMQ)
- Event broker (RabbitMQ/Kafka)
- Elasticsearch for advanced search
- Multi-tenant architecture
- Public REST API
- GraphQL gateway
- Mobile backend support
- AI services for predictive maintenance

---

# End of System Architecture Document

Document ID: AF-ARCH-001

Version: 1.0

Next Document:

AF-DB-001

Database Design & ER Diagram