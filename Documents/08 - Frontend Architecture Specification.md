# AssetFlow
# Frontend Architecture Specification

---

Document ID: AF-FE-001

Version: 1.0

Status: Draft

Project: AssetFlow – Enterprise Asset & Resource Management System

Reference Documents

- AF-PRD-001
- AF-SRS-001
- AF-ARCH-001
- AF-BE-001
- AF-API-001

---

# Table of Contents

1. Frontend Goals
2. Technology Stack
3. Application Architecture
4. Folder Structure
5. Module Structure
6. Routing
7. Layout System
8. State Management
9. API Layer
10. Component Architecture
11. Forms & Validation
12. UI Standards
13. Error Handling
14. Performance Strategy
15. Accessibility
16. Frontend Coding Standards

---

# 1. Frontend Goals

The frontend architecture shall:

- Be modular
- Be scalable
- Be reusable
- Be responsive
- Be maintainable
- Follow feature-based architecture
- Minimize prop drilling
- Support future mobile applications

---

# 2. Technology Stack

Framework

React 19

Language

TypeScript

Bundler

Vite

Routing

React Router DOM

State Management

Zustand

Server State

TanStack Query

Forms

React Hook Form

Validation

Zod

Styling

TailwindCSS

Icons

Lucide React

Charts

Recharts

Calendar

FullCalendar

Tables

TanStack Table

Notifications

Sonner

File Upload

React Dropzone

QR

react-qr-code

---

# 3. Application Architecture

```

App

│

Router

│

Protected Layout

│

Feature Modules

│

Pages

│

Components

│

Hooks

│

Services

│

API

```

Business logic should remain inside hooks and services.

Pages should only compose components.

---

# 4. Folder Structure

```
apps/web/src

assets/

components/

config/

constants/

hooks/

layouts/

lib/

modules/

routes/

services/

store/

styles/

types/

utils/

App.tsx

main.tsx

```

---

# 5. Module Structure

Each module follows the same structure.

```
asset/

pages/

components/

hooks/

services/

schemas/

types/

constants/

index.ts

```

Example

```
asset/

pages/

AssetList.tsx

AssetDetails.tsx

CreateAsset.tsx

EditAsset.tsx

components/

AssetCard.tsx

AssetTable.tsx

AssetStatus.tsx

AssetTimeline.tsx

hooks/

useAssets.ts

useCreateAsset.ts

services/

asset.api.ts

schemas/

asset.schema.ts

types/

asset.types.ts

```

---

# 6. Routing Structure

```
/

├── login

├── forgot-password

├── dashboard

├── organization

│   ├── departments

│   ├── categories

│   └── employees

├── assets

│   ├── create

│   ├── :id

│   ├── :id/edit

│   └── history

├── allocations

├── transfers

├── bookings

├── maintenance

├── audits

├── reports

├── notifications

├── activity-logs

└── profile

```

---

# 7. Layout Architecture

## Public Layout

```

Navbar

↓

Content

```

Pages

- Login
- Forgot Password

---

## Protected Layout

```

+------------------------------------+

Top Navigation

+----------+-------------------------+

Sidebar

Main Content

+----------+-------------------------+

Footer

```

Shared for all authenticated pages.

---

# 8. Sidebar Navigation

Dashboard

Organization

Assets

Allocation

Transfers

Bookings

Maintenance

Audits

Reports

Notifications

Activity Logs

Profile

Settings

Logout

Sidebar items are rendered dynamically based on permissions.

---

# 9. Route Guards

Public Routes

- Login
- Register
- Forgot Password

Protected Routes

Require Authentication

Admin Routes

Require ADMIN role

Asset Manager Routes

Require ASSET_MANAGER role

Department Head Routes

Require DEPARTMENT_HEAD role

---

# 10. State Management

Global State (Zustand)

- Authentication
- User
- Theme
- Sidebar
- Notifications

Server State (TanStack Query)

- Assets
- Departments
- Bookings
- Reports
- Maintenance
- Audits

Component State

React useState

---

# 11. API Layer

```
services/

api.ts

asset.api.ts

booking.api.ts

maintenance.api.ts

audit.api.ts

dashboard.api.ts

```

Every service exports

```
getAll()

getById()

create()

update()

delete()

```

No API calls inside components.

---

# 12. React Query Strategy

Query Keys

```
["assets"]

["asset", id]

["bookings"]

["dashboard"]

["reports"]

```

Mutations

```
Create

Update

Delete

Approve

Reject

```

Invalidate queries after successful mutations.

---

# 13. Component Architecture

Component Types

### Layout Components

Navbar

Sidebar

Footer

Breadcrumb

---

### Shared Components

Button

Input

Select

Textarea

Checkbox

Dialog

Drawer

Table

Pagination

Badge

Avatar

Card

Tabs

Tooltip

---

### Business Components

AssetCard

BookingCalendar

MaintenanceTimeline

AuditSummary

TransferDialog

ReportChart

NotificationPanel

---

# 14. Design System

Spacing

4px Grid

Border Radius

8px

Shadow

Soft

Typography

Inter

Responsive Breakpoints

sm

md

lg

xl

2xl

---

# 15. Forms

All forms use

React Hook Form

+

Zod Validation

Example

```
CreateAssetForm

↓

Validation

↓

Submit

↓

Mutation

↓

Toast

↓

Redirect

```

---

# 16. Error Handling

Page Errors

404

403

500

Unauthorized

Validation Errors

Display inline.

API Errors

Toast Notification

Network Errors

Retry Button

---

# 17. Loading Strategy

Skeleton Loaders

Tables

Cards

Charts

Calendar

Buttons

Lazy Loading

Route Based

---

# 18. Tables

Every data table supports

- Search
- Filter
- Sort
- Pagination
- Column Visibility
- Export

Examples

Assets

Bookings

Maintenance

Audits

Employees

Notifications

---

# 19. Search Strategy

Global Search

Supports

- Asset Tag
- Asset Name
- Employee
- Booking
- Department

Debounce

300ms

---

# 20. File Upload

Supports

Images

PDF

Preview

Drag & Drop

Progress Bar

Multiple Uploads

---

# 21. Dashboard Architecture

Widgets

- KPI Cards
- Recent Activity
- Upcoming Returns
- Pending Maintenance
- Booking Calendar
- Department Summary
- Charts

Dashboard refreshes using React Query.

---

# 22. Theme Support

Light Theme

Dark Theme

Future

Organization Branding

---

# 23. Responsive Design

Desktop

≥1280px

Tablet

768px–1279px

Mobile

<768px

Sidebar collapses automatically on mobile.

---

# 24. Accessibility

Keyboard Navigation

Screen Reader Support

ARIA Labels

Focus Management

Color Contrast

WCAG AA Compliance

---

# 25. Performance Strategy

- Route Lazy Loading
- Code Splitting
- Image Optimization
- React.memo where needed
- Query Caching
- Virtualized Tables
- Debounced Search

---

# 26. Frontend Coding Standards

File Naming

PascalCase Components

camelCase Hooks

Example

AssetTable.tsx

CreateAsset.tsx

useAssets.ts

asset.api.ts

---

Component Rules

- Maximum 250 lines per component
- Single Responsibility
- Reusable
- No business logic inside JSX

---

Hooks Rules

Business logic belongs inside custom hooks.

Example

useAssets()

useBookings()

useDashboard()

---

Styling Rules

TailwindCSS only

No inline styles

Reusable utility classes preferred

---

Testing

Every module should include

- Component Tests
- Hook Tests
- Page Tests
- Integration Tests

Target Coverage

80%+

---

# 27. Frontend Development Checklist

For every feature:

✓ Route

✓ Page

✓ Components

✓ Form

✓ Validation

✓ API Service

✓ React Query Hook

✓ Loading State

✓ Error State

✓ Empty State

✓ Responsive Design

✓ Permission Check

✓ Tests

---

# 28. Future Enhancements

- PWA Support
- Offline Mode
- Mobile App (React Native)
- Real-time Notifications (WebSocket)
- Drag & Drop Dashboard Widgets
- Multi-language (i18n)
- Organization Branding
- Accessibility Enhancements

---

# End of Frontend Architecture Specification

Document ID: AF-FE-001

Version: 1.0

Next Document:

AF-UI-001

UI/UX Specification & Wireframes