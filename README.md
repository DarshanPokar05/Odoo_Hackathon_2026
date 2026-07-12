# AssetFlow — Enterprise Asset & Resource Management System

AssetFlow is an enterprise-grade full-stack web application engineered for comprehensive tracking, resource booking, hardware allocation, maintenance workflows, and physical audit reconciliation across organizations.

---

## 🏗 System Architecture & Technology Stack

### **Frontend**
- **Framework**: React 18 + Vite
- **Routing**: React Router v6 with Role-Based Access Control (`ProtectedRoute`) and collapsible industrial console layout (`Sidebar` / `Topbar`)
- **Design System & Styling**: TailwindCSS (`darkMode: 'class'`), CSS custom properties (`--bg`, `--surface`, `--surface-alt`, `--border`, `--text-primary`, `--text-secondary`, `--accent`), and Google Fonts (`Space Grotesk` for display headings, `Inter` for UI body, and `IBM Plex Mono` for inventory tags & serial numbers)
- **Signature UI Component**: **`TagChip`** — physical inventory tag aesthetic with a notched circular left edge (`::before` tag hole) and uppercase monospace typography
- **Server State Management**: `@tanstack/react-query` v5
- **HTTP Client**: Axios with JWT authentication interceptor & automatic session validation (`/api/auth/me`)

### **Backend**
- **Runtime**: Node.js + Express 4
- **Database Layer**: PostgreSQL (Supabase) accessed via raw parameterized SQL queries (`pg` pool) to enforce database-level ACID transactions, partial unique indexes, and PostgreSQL exclusion constraints (`btree_gist`)
- **Security & Hardening**: `helmet` security headers, `express-rate-limit` on authentication routes, bcrypt password hashing (12 rounds), and centralized input/output sanitization
- **RBAC Enforcement**: Server-side middleware (`requireAuth`, `requireRole`, `requireDepartmentScope`) enforcing a strict 4-role permission matrix

---

## 🚀 5-Minute Quickstart & Demo Setup

### 1. Database & Supabase Configuration
1. Create a PostgreSQL project on [Supabase](https://supabase.com).
2. Enable the `btree_gist` extension required for temporal booking overlap prevention:
   ```sql
   CREATE EXTENSION IF NOT EXISTS btree_gist;
   ```
3. Copy your project's Transaction Pooler or Direct connection string.

### 2. Environment Variables
Create a `.env` file inside `backend/`:
```ini
PORT=5000
DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:6543/postgres?sslmode=require
JWT_SECRET=your_super_secure_jwt_secret_key_change_in_production
FRONTEND_ORIGIN=http://localhost:5173
NODE_ENV=development
```

### 3. Install, Migrate & Seed
Run the automated setup commands from the project root:
```bash
# 1. Install dependencies for root, backend, and frontend
npm run install:all

# 2. Run enterprise schema migrations (creates all 13 core tables & constraints)
npm run migrate --prefix backend

# 3. Seed demo data (~15 assets, 6 users, departments, bookings, maintenance & audits)
npm run seed --prefix backend

# 4. Start both backend (port 5000) & frontend (port 5173) concurrently
npm run dev
```

---

## 👥 Demo Credentials (All 4 Enterprise Roles)

The seeder creates fully functional user accounts covering all 4 roles. You can also use the **Quick Demo Fill buttons** directly on the Login screen (`Screen 1`):

| Role | Email Address | Password | Scoped Permissions |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@assetflow.com` | `Admin@123` | Full enterprise read/write access across all departments, audit creation & closure, system logs |
| **Asset Manager** | `manager@assetflow.com` | `Manager@123` | Organization-wide asset registry management, allocation oversight, transfer approvals, maintenance assignment |
| **Department Head** | `head@assetflow.com` | `Head@123` | Scoped to their department (`Engineering`); approves departmental transfers and maintenance requests |
| **Employee** | `employee@assetflow.com` | `Employee@123` | Self-service resource booking, viewing personal allocations, raising maintenance tickets |

> **Global Constraint 1 (Auth)**: Signing up via the public registration form creates an **Employee** account only. Role escalation happens exclusively via an authenticated Admin action in the Employee Directory (`Screen 3`).

---

## 🧪 Live Verification Guide for Core Enterprise Constraints

### 1. Allocation Conflict & Transfer Request (`Global Constraint 3`)
- **Rule**: An asset can have at most **ONE active allocation** at a time (`UNIQUE INDEX ON allocations(asset_id) WHERE status = 'Active'`).
- **Live Demo**:
  1. Navigate to **Screen 5 (Allocation & Transfer)**.
  2. Attempt to allocate **`AF-1001`** (`MacBook Pro M3 Max 16"`, currently assigned to David Chen) to any other employee.
  3. Notice the immediate **HTTP `409 Conflict`** response returning current holder details, triggering the UI to offer a **"Request Transfer"** action button instead of a raw error.

### 2. Temporal Booking Overlap Prevention (`Global Constraint 4`)
- **Rule**: Two bookings for the same resource asset must never have overlapping time ranges (`POSTGRES EXCLUDE USING gist (resource_asset_id WITH =, tstzrange(start_time, end_time) WITH &&)`).
- **Live Demo**:
  1. Navigate to **Screen 6 (Resource Booking)**.
  2. Select **`Conference Room B2`** (`AF-1011`). The seeder pre-books this room for **Today `09:00 - 10:00`**.
  3. Attempt to submit a new booking from **`09:30 - 10:30`**.
  4. Notice the request is blocked by both application and PostgreSQL exclusion checks. Back-to-back bookings (`10:00 - 11:00`) succeed cleanly.

### 3. Approved Maintenance Workflow (`Global Constraint 5`)
- **Rule**: An asset can only transition to `"Under Maintenance"` status **AFTER** its maintenance request reaches `"Approved"` status.
- **Live Demo**:
  1. Navigate to **Screen 7 (Maintenance)**.
  2. View pending requests. Direct asset status manipulation is locked out until a Department Head or Asset Manager clicks **Approve**, which atomically sets the ticket to `Approved` and allows service assignment.

### 4. Irreversible Audit Closure & Automatic Discrepancies (`Global Constraint 6`)
- **Rule**: Only assigned cycle auditors can mark audit items. Closing an audit cycle locks all items and automatically transitions any missing assets to `Lost`.
- **Live Demo**:
  1. Navigate to **Screen 8 (Audits & Reconciliation)**.
  2. Select **`Q3 Comprehensive Asset Inventory`** (`In Progress`).
  3. Mark an item as **`Missing`** (notice the amber discrepancy banner appear).
  4. Click **Close Audit Cycle** and confirm the irreversible modal.
  5. Check **Screen 4 (Asset Registry)** — the missing asset's lifecycle status has automatically transitioned to **`Lost`** inside a single database transaction.

---

## 🎨 Theme & Signature Component QA
- **Theme Toggle**: Located in the Topbar on every screen. Switch instantly between **Cool Steel Light (`#F5F6F7`)** and **Graphite Dark (`#14171C`)**.
- **TagChip Component**: Inspect any status badge or asset tag across all 10 screens to observe the notched left edge (`::before` circle cut out) and `IBM Plex Mono` typography.

---

## 🛠 Production Deployment Prep
- **Frontend Build**:
  ```bash
  npm run build --prefix frontend
  ```
  Generates optimized static assets in `frontend/dist/`.
- **Backend PM2 Deployment**:
  ```bash
  pm2 start ecosystem.config.js
  ```
  Runs `assetflow-backend` in production cluster/fork mode with automated crash recovery.
