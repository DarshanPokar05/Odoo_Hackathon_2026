# AssetFlow — Enterprise Asset & Resource Management System

<div align="center">

![Enterprise Grade](https://img.shields.io/badge/Enterprise-Grade%20Asset%20Management-3B8E5A?style=for-the-badge)
![PostgreSQL ACID](https://img.shields.io/badge/PostgreSQL-ACID%20%26%20EXCLUDE%20Constraints-2E5AAC?style=for-the-badge)
![RBAC Enforced](https://img.shields.io/badge/Security-Strict%204--Role%20RBAC-7455B0?style=for-the-badge)
![React 18](https://img.shields.io/badge/Frontend-React%2018%20%2B%20Vite-E0533C?style=for-the-badge)

An industrial-grade, full-stack enterprise platform engineered for hardware tracking, temporal resource booking, department-scoped allocations, maintenance workflows, and physical audit reconciliation.

</div>

---

## 🏗 High-Level Architecture & Data Flow

```
+-----------------------------------------------------------------------------------------------+
|                                      FRONTEND LAYER (Vite + React 18)                         |
|  +------------------------+  +-------------------------+  +--------------------------------+  |
|  | Screen 1: Auth Portal  |  | Screen 2: Dashboard     |  | Screen 3: Employee Directory   |  |
|  +------------------------+  +-------------------------+  +--------------------------------+  |
|  | Screen 4: Registry     |  | Screen 5: Allocations   |  | Screen 6: Resource Booking     |  |
|  +------------------------+  +-------------------------+  +--------------------------------+  |
|  | Screen 7: Maintenance  |  | Screen 8: Audit Cycles  |  | Screen 9/10: Reports & Logs    |  |
|  +------------------------+  +-------------------------+  +--------------------------------+  |
|                                                                                               |
|   Signature Component: <TagChip /> (Notched left edge inventory badge | IBM Plex Mono)       |
|   HTTP Interceptor: Axios + Automatic JWT Authorization Header + 401 Session Validation       |
+-----------------------------------------------------------------------------------------------+
                                               │
                                       REST API JSON / JWT
                                               ▼
+-----------------------------------------------------------------------------------------------+
|                                      BACKEND LAYER (Node.js + Express 4)                      |
|  +-----------------------------------------------------------------------------------------+  |
|  | Security & Hardening: Helmet headers, Express Rate Limiter, Bcrypt (12 rounds)          |  |
|  +-----------------------------------------------------------------------------------------+  |
|  | RBAC Middleware: requireAuth() -> requireRole() -> requireDepartmentScope()             |  |
|  +-----------------------------------------------------------------------------------------+  |
|  | Modules: /auth | /departments | /employees | /categories | /assets | /allocations       |  |
|  |          /bookings | /maintenance | /audits | /reports | /notifications | /activity-logs|  |
|  +-----------------------------------------------------------------------------------------+  |
+-----------------------------------------------------------------------------------------------+
                                               │
                           Parameterized SQL Queries (pg Pooler)
                                               ▼
+-----------------------------------------------------------------------------------------------+
|                                 DATABASE LAYER (PostgreSQL / Supabase)                        |
|  +-----------------------------------------------------------------------------------------+  |
|  | Partial Unique Index: one_active_allocation_per_asset (Prevents dual assignment)       |  |
|  +-----------------------------------------------------------------------------------------+  |
|  | EXCLUDE Constraint: no_overlapping_bookings USING gist (Prevents temporal overlap)      |  |
|  +-----------------------------------------------------------------------------------------+  |
|  | ACID Transactions: BEGIN/COMMIT for multi-step audit closures & state machine flushes  |  |
|  +-----------------------------------------------------------------------------------------+  |
+-----------------------------------------------------------------------------------------------+
```

---

## 🌟 Core Enterprise Capabilities Across 10 Modules

1. **Authentication & Identity Portal (`Screen 1`)**: Multi-mode Sign In, Employee Sign Up, and Password Recovery. Features 1-click Quick Demo credentials for instant testing across all 4 enterprise roles.
2. **Executive Command Dashboard (`Screen 2`)**: Real-time KPI telemetry (Total Assets, Allocated, Under Maintenance, Overdue Returns), utilization charts, and interactive quick actions.
3. **Employee & Department Directory (`Screen 3`)**: Complete organizational hierarchy. Admins can promote/demote user roles securely (`Employee -> Department Head -> Asset Manager -> Admin`).
4. **Asset Registry (`Screen 4`)**: Filterable hardware inventory with dynamic custom attributes (`RAM`, `CPU`, `Mileage`, `License Plate`) based on category schemas.
5. **Allocation & Hardware Transfer (`Screen 5`)**: Complete check-out/check-in history. Enforces strict single-active holder constraints and provides an automated **"Request Transfer"** workflow when conflicts arise.
6. **Temporal Resource Booking (`Screen 6`)**: Interactive booking calendar for shared facilities and fleet vehicles. Database-enforced overlap prevention guarantees zero double-bookings.
7. **Maintenance & Ticket Lifecycle (`Screen 7`)**: Stage-gated repair workflows (`Pending -> Approved -> Technician Assigned -> In Progress -> Resolved`).
8. **Audits & Physical Reconciliation (`Screen 8`)**: Location and department-scoped audit cycles. Automated item verification that irreversibly transitions unverified items to `"Lost"` upon cycle closure.
9. **Analytics & Depreciation Reports (`Screen 9`)**: Financial valuation exports, category breakdowns, and audit compliance metrics.
10. **Activity Logs & Notification Feed (`Screen 10`)**: Complete immutable audit trail of all administrative and operational actions.

---

## 🔐 Enterprise RBAC Permission Matrix

| Module / Action | **Admin** (`👑`) | **Asset Manager** (`📦`) | **Department Head** (`🏢`) | **Employee** (`👤`) |
| :--- | :---: | :---: | :---: | :---: |
| **Manage Roles & Departments** | ✅ Full Access | ❌ Read Only | ❌ Read Only | ❌ Read Only |
| **Create / Edit Assets** | ✅ All Categories | ✅ All Categories | ❌ Read Only | ❌ Read Only |
| **Allocate Assets** | ✅ Any Employee | ✅ Any Employee | ✅ Dept Employees | ❌ View Own Only |
| **Request Asset Transfers** | ✅ All Assets | ✅ All Assets | ✅ Dept Assets | ❌ View Only |
| **Book Shared Resources** | ✅ Instant Confirm | ✅ Instant Confirm | ✅ Instant Confirm | ✅ Self-Service |
| **Approve Maintenance Tickets** | ✅ All Requests | ✅ All Requests | ✅ Dept Requests | ❌ Raise Only |
| **Create & Close Audit Cycles** | ✅ Full Access | ✅ Full Access | ❌ View Only | ❌ View Only |

> **Global Constraint 1 (Auth)**: Public signup creates an **Employee** account only. Role escalation happens exclusively via an authenticated Admin action in the Employee Directory (`Screen 3`). Never expose a public endpoint that allows client-side role setting.

---

## 💾 PostgreSQL Database Schema & Hard Constraints

AssetFlow relies on PostgreSQL database-level guarantees to prevent race conditions and illegal states:

```sql
-- 1. Partial Unique Index: Only ONE active allocation per asset at a time (Global Constraint 3)
CREATE UNIQUE INDEX one_active_allocation_per_asset
  ON allocations(asset_id)
  WHERE status = 'Active';

-- 2. Exclusion Constraint: Zero overlapping bookings for the same resource asset (Global Constraint 4)
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE bookings
  ADD CONSTRAINT no_overlapping_bookings
  EXCLUDE USING gist (
    resource_asset_id WITH =,
    tstzrange(start_time, end_time) WITH &&
  ) WHERE (status <> 'Cancelled');
```

---

## 🚀 5-Minute Setup & Live Demo Walkthrough

### 1. Database Configuration (Supabase / PostgreSQL)
1. Create a PostgreSQL database on [Supabase](https://supabase.com).
2. Enable the `btree_gist` extension in the Supabase SQL editor:
   ```sql
   CREATE EXTENSION IF NOT EXISTS btree_gist;
   ```
3. Copy your project connection string (`DATABASE_URL`).

### 2. Configure `.env`
Create `backend/.env` with your credentials:
```ini
PORT=5000
DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:6543/postgres?sslmode=require
JWT_SECRET=your_super_secure_enterprise_jwt_secret
FRONTEND_ORIGIN=http://localhost:5173
NODE_ENV=development
```

### 3. One-Command Setup & Seed
Run from the repository root:
```bash
# Install dependencies across root, backend, and frontend
npm run install:all

# Run raw SQL enterprise migrations & seed realistic demo data
npm run migrate --prefix backend
npm run seed --prefix backend

# Launch backend (port 5000) and frontend (port 5173) concurrently
npm run dev
```

---

## 👥 Demo Credentials (All 4 Enterprise Roles)

Use these credentials or click the **Demo Quick-Fill buttons** on the Login screen (`http://localhost:5173/login`):

| Role | Email | Password | Scoped Demo Context |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@assetflow.com` | `Admin@123` | Full control across all departments, audit cycles, and system logs |
| **Asset Manager** | `manager@assetflow.com` | `Manager@123` | Fleet management, hardware registry, allocation oversight |
| **Department Head** | `head@assetflow.com` | `Head@123` | Scoped to **Engineering** department; approves maintenance |
| **Employee** | `employee@assetflow.com` | `Employee@123` | Standard self-service resource booking & personal workstation view |

---

## 🧪 Verification Walkthroughs for Hard Constraints

### 1. Allocation Conflict 409 & Request Transfer (`Global Constraint 3`)
1. Sign in as **Admin** or **Asset Manager**.
2. Go to **Screen 5 (Allocation & Transfer)**.
3. Try to allocate **`AF-1001`** (`MacBook Pro M3 Max 16"`, currently assigned to David Chen) to Sara Vance.
4. Notice the immediate **HTTP `409 Conflict`** response returning current holder details and displaying the **"Request Transfer"** button.

### 2. Temporal Booking Overlap Prevention (`Global Constraint 4`)
1. Go to **Screen 6 (Resource Booking)**.
2. Select **`Conference Room B2`** (`AF-1011`). Notice it is pre-booked for **Today `09:00 - 10:00`**.
3. Attempt to submit a new booking from **`09:30 - 10:30`**.
4. Observe that both the backend application and PostgreSQL database-level exclusion constraint (`btree_gist`) reject the overlapping interval immediately.

### 3. Approved Maintenance Gating (`Global Constraint 5`)
1. Go to **Screen 7 (Maintenance)**.
2. Inspect pending tickets. Direct asset status transitions to `"Under Maintenance"` are locked out until a supervisor clicks **Approve**, atomically moving the ticket to `Approved`.

### 4. Irreversible Audit Cycle Closure (`Global Constraint 6`)
1. Go to **Screen 8 (Audits & Reconciliation)**.
2. Open **`Q3 Comprehensive Asset Inventory`** (`In Progress`).
3. Mark an unverified asset as **`Missing`** and click **Close Audit Cycle**.
4. Confirm the closure dialog. Check **Screen 4 (Asset Registry)** — the missing asset's status has automatically transitioned to **`Lost`** inside an ACID database transaction.

---

## 🎨 Signature UI/UX & Theme System

- **Dark / Light Mode**: Persistent toggle located in the `Topbar` across all screens. Switches instantly between **Cool Steel Light (`#F5F6F7`)** and **Graphite Dark (`#14171C`)** via CSS custom variables.
- **TagChip Component**: Inspect any status or priority badge across all 10 screens to observe the physical inventory tag aesthetic featuring a notched left edge (`::before` circle cutout) and uppercase `IBM Plex Mono` typography.

---

## 🛠 Production Deployment

### Production Frontend Build
```bash
npm run build --prefix frontend
```
Compiles optimized, minified static bundles to `frontend/dist/`.

### Production Backend Process (PM2)
```bash
pm2 start ecosystem.config.js
```
Runs `assetflow-backend` in clustered production mode with automatic memory management and crash recovery.
