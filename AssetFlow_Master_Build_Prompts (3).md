# AssetFlow — Master Build Prompt Set (for Antigravity)

**Stack:** React (Vite) + Node.js/Express + Supabase Postgres + custom JWT auth (NOT Supabase Auth)
**Repo:** Monorepo — `/frontend`, `/backend`, shared root config
**Target:** Production-grade business logic, hackathon delivery timeline

---

## HOW TO USE THIS DOCUMENT

Paste each **PHASE PROMPT** block into Antigravity **one at a time, in order**. Do not skip ahead — later phases assume earlier schema/auth/API contracts exist. After each phase, run the **Completion Checklist** before moving on. The **Global Constraints** block must be included (or already in context) for every phase — it encodes the non-negotiable business rules from the problem statement. The **Design System** block must be included with Phase 0 (where it's built) and Phase 6 (where it's QA'd) — later phases just reuse the `<TagChip>` component and theme tokens Phase 0 establishes, so they don't need the full block repeated. **Appendix C (Wireframe Reference)** is the approved layout from the team's Excalidraw mockup — include the relevant screen's entry from it alongside whichever phase builds that screen (Phase 0: Screen 1 · Phase 2: Screens 2–3 · Phase 3: Screens 4–5 · Phase 4: Screens 6–7 · Phase 5: Screens 8–10), so the agent matches exact field labels and layout instead of improvising.

---

## DESIGN SYSTEM (include with Phase 0 and Phase 6 prompts)

The subject is physical asset tracking — assets literally get printed tags (`AF-0001`), status
labels, and audit stickers in real warehouses/offices. The UI should lean into that "inventory tag"
identity instead of looking like a generic SaaS dashboard. Signature element: status/tag chips are
styled like a die-cut inventory tag (small notch on the left edge, monospace code), used
consistently for asset tags, lifecycle status, and priority badges — this is the one recognizable
visual signature, kept quiet everywhere else.

```
DESIGN SYSTEM — implement as CSS variables, class-based dark mode (Tailwind darkMode: 'class'),
toggle in the topbar, persisted in localStorage, defaults to system preference on first load.

COLOR — LIGHT THEME
  --bg:            #F5F6F7   (cool steel-white page background)
  --surface:       #FFFFFF   (cards, tables, modals)
  --surface-alt:   #ECEEF1   (subtle zebra rows, nested panels)
  --border:        #DDE1E6   (hairline borders)
  --text-primary:  #1A2029   (ink navy, not pure black)
  --text-secondary:#5B6472
  --accent:        #B5772A   (tag-amber — primary buttons, links, focus rings, active nav)
  --accent-soft:   #F3E4D0   (accent background tint, e.g. active nav item bg)

COLOR — DARK THEME
  --bg:            #14171C   (graphite, not pure black)
  --surface:       #1C2128
  --surface-alt:   #232A32
  --border:        #2A3038
  --text-primary:  #E8EAED
  --text-secondary:#9AA4B2
  --accent:        #D89A4E   (warmer/brighter amber for dark bg legibility)
  --accent-soft:   #3A2E1E

STATUS COLORS (same hue mapping in both themes, adjust lightness per theme):
  Available        -> green   (#3B8E5A light / #5FBF82 dark)
  Allocated        -> blue    (#2E5AAC light / #6E9CE0 dark)
  Reserved         -> violet  (#7455B0 light / #A98CE0 dark)
  Under Maintenance-> amber   (#B5772A light / #D89A4E dark) — reuse accent, it's the alert color
  Lost             -> red     (#C0392B light / #E06B5D dark)
  Retired          -> slate   (#6B7280 light / #8A93A0 dark)
  Disposed         -> dark slate, struck-through label style (visually "closed")
  Overdue items    -> always red text/badge regardless of surrounding context — never let overdue
                       blend into a neutral list

TYPOGRAPHY
  Display/headers:  'Space Grotesk' (headings, KPI numbers, page titles) — slightly technical,
                     industrial character without being cold
  Body:              'Inter' (all body text, forms, table cells, nav labels)
  Data/tags/mono:    'IBM Plex Mono' (asset tags, serial numbers, IDs, timestamps, audit codes) —
                     every asset_tag, booking ID, and audit reference must render in this face;
                     this is what makes the "inventory tag" identity read consistently
  Scale: 12/14/16/20/24/32px steps, headings at 600-700 weight, body at 400-500, mono data at 500

SIGNATURE COMPONENT — Tag Chip (use for status badges, priority badges, asset tag display):
  - Rectangular, not fully rounded (2px radius max)
  - Left edge has a small circular notch cut into it (like a physical tag hole) — implement as a
    small ::before circle in --bg color positioned over the left edge, or an inline SVG
  - Monospace text, uppercase, letter-spacing 0.02em, small (12-13px)
  - Background = status color at low opacity, text/border = full status color
  - This chip style is used EVERYWHERE a status/code appears — asset status, booking status,
    maintenance priority, audit verification result — for visual consistency across all 10 screens

LAYOUT
  - Fixed left sidebar (icon + label nav, collapsible to icon-only), topbar with: breadcrumb/page
    title, global search, notification bell with unread dot, theme toggle (sun/moon icon), role
    badge + avatar menu
  - Content area: 24px page padding, cards/tables use --surface with 1px --border, 8px radius
    (deliberately less rounded than typical SaaS defaults — reads more "console" than "consumer app")
  - Tables: dense row height (40px), tag-chip columns for status, monospace for ID/tag columns,
    zebra striping using --surface-alt on hover only (not static) to keep it calm
  - KPI cards on Dashboard: large mono number (32px, --text-primary), small label above in
    --text-secondary uppercase, thin left border in the relevant status color when the KPI relates
    to a status (e.g. Overdue Returns card gets a red left border)

MOTION
  - Keep minimal and functional: 150ms ease-out for hover/focus states, a single orchestrated
    fade+slide on page load for the dashboard KPI row (staggered 40ms per card), no decorative
    animation elsewhere. Respect prefers-reduced-motion.

ACCESSIBILITY BASELINE
  - Visible keyboard focus ring using --accent on all interactive elements
  - Status must never be conveyed by color alone — tag chips always carry text, not just color
  - Both themes must pass WCAG AA contrast for text-primary/secondary against bg/surface

THEME TOGGLE IMPLEMENTATION
  - Store preference in localStorage key 'assetflow-theme', apply via a `dark` class on <html>,
    read system preference (prefers-color-scheme) only on first visit before any explicit choice
  - Toggle must be reachable from every screen (topbar, not buried in a settings page)
```

---

## GLOBAL CONSTRAINTS (include with every phase prompt)

```
GLOBAL CONSTRAINTS — DO NOT VIOLATE:

1. AUTH: Signup creates an Employee account ONLY. There is no role field on the
   signup form and no client-controllable role parameter on the signup API.
   Role escalation (Employee → Department Head / Asset Manager) happens ONLY
   via an authenticated Admin action from the Employee Directory (Screen 3,
   Tab C). Never expose an endpoint that lets a user set their own role.

2. ASSET STATE MACHINE: An asset's `status` may only transition along these
   edges — reject any other transition at the API layer, not just the UI:
   Available -> Allocated
   Available -> Reserved
   Available -> Under Maintenance
   Allocated -> Available (return)
   Allocated -> Under Maintenance
   Reserved -> Available
   Reserved -> Allocated
   Under Maintenance -> Available
   Available -> Lost | Retired | Disposed
   Allocated -> Lost
   Any status -> Disposed (Admin/Asset Manager only, terminal state)
   Lost, Retired, Disposed are terminal for booking/allocation purposes
   (cannot allocate or book an asset in these states).

3. ALLOCATION CONFLICT RULE (hard constraint, enforce at DB + API level):
   An asset can have at most ONE active allocation at a time. Attempting to
   allocate an already-allocated asset must be BLOCKED with a 409 response
   that includes who currently holds it, and the response must signal the
   frontend to offer a "Request Transfer" action instead of a raw error.

4. BOOKING OVERLAP RULE (hard constraint, enforce at DB + API level):
   Two bookings for the same bookable asset must never have overlapping time
   ranges. Overlap = NOT (new.end <= existing.start OR new.start >= existing.end).
   A booking starting exactly when another ends is allowed (back-to-back is fine).
   Enforce this with a Postgres EXCLUDE constraint using btree_gist on
   (resource_asset_id, tsrange(start_time, end_time)) in addition to an
   application-level check — never rely on only one layer.

5. MAINTENANCE WORKFLOW: An asset can only move to "Under Maintenance" status
   AFTER a maintenance request reaches "Approved" status. Never allow a
   frontend action to directly set status = Under Maintenance without going
   through the approval workflow.

6. AUDIT WORKFLOW: Audit items can only be marked Verified/Missing/Damaged by
   a user explicitly assigned as an auditor on that audit cycle. Closing an
   audit cycle is irreversible in this build — closing must (a) lock all
   audit_items on that cycle from further edits, and (b) auto-transition any
   asset with a final "Missing" verification to status = Lost.

7. ROLE-BASED ACCESS: Every write endpoint must check role server-side
   (middleware), never trust frontend-hidden buttons alone. Reference the
   permission matrix in Phase 1.

8. NO PLACEHOLDER BUSINESS LOGIC: Do not stub out conflict checks, overlap
   checks, or workflow transitions with TODO comments and let them "pass" —
   these are the graded core of the app. Implement them fully in this pass.
```

---

# PHASE 0 — Project Scaffolding & Environment

### Prompt for Antigravity

```
[Include DESIGN SYSTEM block]
[Include APPENDIX C — Wireframe Reference, Screen 1 entry]

Set up the AssetFlow monorepo.

STRUCTURE:
/assetflow
  /frontend        (React 18 + Vite + React Router v6 + TailwindCSS + Axios + React Query)
  /backend         (Node.js + Express + pg + Supabase JS client + jsonwebtoken + bcrypt + zod for validation)
  /docs            (place this build prompt set and future schema docs here)
  .env.example (root, documents required env vars for both apps)
  README.md (setup instructions: install, env vars, run dev, run migrations)

BACKEND REQUIREMENTS:
- Express app with a clean folder structure:
  /backend/src/config       (db connection, env loader)
  /backend/src/middleware   (auth.js — JWT verify; rbac.js — role check; errorHandler.js)
  /backend/src/modules      (one folder per domain: auth, departments, categories, employees,
                              assets, allocations, bookings, maintenance, audits, notifications,
                              dashboard, reports, activityLogs) — each with controller.js,
                              service.js, routes.js
  /backend/src/db           (migrations/ folder with numbered SQL files, no ORM — raw SQL via pg
                              for full control over constraints; a migrate.js runner script)
  /backend/src/utils        (asOwnFn for asset tag generation, error classes, response wrapper)
- Central error handler returning consistent JSON: { success: false, error: { code, message } }
- All list endpoints support pagination (?page, ?limit) and return { data, total, page, limit }
- CORS configured for local frontend origin only, credentials true

FRONTEND REQUIREMENTS:
- Vite React app, TailwindCSS configured with darkMode: 'class' and every color token from the
  DESIGN SYSTEM block wired in as CSS variables (both light and dark values) plus matching
  Tailwind theme.extend.colors entries (e.g. bg, surface, surfaceAlt, border, textPrimary,
  textSecondary, accent, accentSoft, and status.available/allocated/reserved/maintenance/lost/
  retired). Import 'Space Grotesk', 'Inter', and 'IBM Plex Mono' (Google Fonts or self-hosted)
  and set them as the display/body/mono font families in the Tailwind config.
- Build the theme toggle (topbar, sun/moon icon) and ThemeContext exactly per the THEME TOGGLE
  IMPLEMENTATION spec in the DESIGN SYSTEM block — this must work correctly before any other
  screen is built, since every subsequent screen depends on it being wired up.
- Build a reusable `<TagChip>` component implementing the SIGNATURE COMPONENT spec (notched left
  edge, monospace uppercase text, status-color mapping) now, in Phase 0 — every later phase will
  reuse this component for asset tags, status badges, and priority badges instead of ad hoc badges.
- React Router v6 with a layout shell (sidebar nav + topbar) and protected route wrapper
  that checks JWT presence + role before rendering
- Axios instance with interceptor attaching JWT from memory/httpOnly-safe storage strategy
  and handling 401 by redirecting to login
- React Query for all server state — no manual useEffect+fetch data fetching
- Folder structure: /frontend/src/pages (one per screen), /frontend/src/components,
  /frontend/src/api (one file per module mirroring backend modules), /frontend/src/hooks,
  /frontend/src/context (AuthContext)

ENV VARS TO DOCUMENT:
- SUPABASE_DB_URL (Postgres connection string, direct — not the Supabase client SDK, since we
  need raw SQL, exclusion constraints and transactions)
- JWT_SECRET, JWT_EXPIRES_IN, JWT_REFRESH_SECRET, JWT_REFRESH_EXPIRES_IN
- PORT, FRONTEND_ORIGIN

DELIVERABLE: Working skeleton that boots on both sides, empty DB connection verified with a
/health endpoint, README with exact setup steps. No feature logic yet.
```

### Completion Checklist
- [ ] `npm run dev` boots backend and frontend concurrently without errors
- [ ] `/health` returns DB connectivity status
- [ ] Folder structure matches spec above
- [ ] `.env.example` documents every variable actually used in code

---

# PHASE 1 — Database Schema, Auth & RBAC

### Prompt for Antigravity

```
[Include GLOBAL CONSTRAINTS block]
[Include APPENDIX A — Permission Matrix]

Build the full database schema as numbered raw SQL migration files under
/backend/src/db/migrations, plus the auth + RBAC layer.

SCHEMA (Postgres, enable extension btree_gist for the booking exclusion constraint):

users
  id uuid pk default gen_random_uuid(), name text not null, email text unique not null,
  password_hash text not null, role text not null default 'Employee'
    check (role in ('Admin','AssetManager','DepartmentHead','Employee')),
  department_id uuid references departments(id), status text not null default 'Active'
    check (status in ('Active','Inactive')), created_at timestamptz default now(),
  updated_at timestamptz default now()

departments
  id uuid pk, name text not null, head_user_id uuid references users(id),
  parent_department_id uuid references departments(id), status text default 'Active'
    check (status in ('Active','Inactive')), created_at timestamptz default now()

asset_categories
  id uuid pk, name text not null unique, custom_fields jsonb default '[]',
  created_at timestamptz default now()

assets
  id uuid pk, asset_tag text unique not null, name text not null,
  category_id uuid references asset_categories(id), serial_number text,
  acquisition_date date, acquisition_cost numeric(12,2), condition text
    check (condition in ('New','Good','Fair','Poor','Damaged')),
  location text, status text not null default 'Available'
    check (status in ('Available','Allocated','Reserved','Under Maintenance','Lost','Retired','Disposed')),
  is_bookable boolean default false, photo_url text, documents jsonb default '[]',
  department_id uuid references departments(id), qr_code text,
  created_at timestamptz default now(), updated_at timestamptz default now()

allocations
  id uuid pk, asset_id uuid references assets(id) not null,
  employee_id uuid references users(id), department_id uuid references departments(id),
  allocated_date date not null default current_date, expected_return_date date,
  actual_return_date date, status text not null default 'Active'
    check (status in ('Active','Returned','Overdue')),
  condition_checkin_notes text, created_by uuid references users(id),
  created_at timestamptz default now()
  -- Partial unique index: only one Active allocation per asset
  CREATE UNIQUE INDEX one_active_allocation_per_asset ON allocations(asset_id)
    WHERE status = 'Active';

transfer_requests
  id uuid pk, asset_id uuid references assets(id) not null,
  current_holder_id uuid references users(id), requested_by uuid references users(id) not null,
  requested_to uuid references users(id) not null, status text not null default 'Requested'
    check (status in ('Requested','Approved','Rejected','Completed')),
  approved_by uuid references users(id), created_at timestamptz default now(),
  resolved_at timestamptz

bookings
  id uuid pk, resource_asset_id uuid references assets(id) not null,
  booked_by uuid references users(id) not null, start_time timestamptz not null,
  end_time timestamptz not null, status text not null default 'Upcoming'
    check (status in ('Upcoming','Ongoing','Completed','Cancelled')),
  purpose text, created_at timestamptz default now(),
  CHECK (end_time > start_time)
  -- Overlap prevention via exclusion constraint (only among non-cancelled bookings):
  ALTER TABLE bookings ADD CONSTRAINT no_overlapping_bookings
    EXCLUDE USING gist (
      resource_asset_id WITH =,
      tsrange(start_time, end_time) WITH &&
    ) WHERE (status <> 'Cancelled');

maintenance_requests
  id uuid pk, asset_id uuid references assets(id) not null,
  raised_by uuid references users(id) not null, issue_description text not null,
  priority text not null default 'Medium' check (priority in ('Low','Medium','High','Critical')),
  photo_url text, status text not null default 'Pending'
    check (status in ('Pending','Approved','Rejected','Technician Assigned','In Progress','Resolved')),
  approved_by uuid references users(id), technician_name text,
  resolved_at timestamptz, created_at timestamptz default now()

audit_cycles
  id uuid pk, name text not null, scope_department_id uuid references departments(id),
  scope_location text, start_date date not null, end_date date not null,
  status text not null default 'Planned' check (status in ('Planned','In Progress','Closed')),
  created_by uuid references users(id), created_at timestamptz default now(),
  closed_at timestamptz

audit_cycle_auditors
  audit_cycle_id uuid references audit_cycles(id), auditor_id uuid references users(id),
  primary key (audit_cycle_id, auditor_id)

audit_items
  id uuid pk, audit_cycle_id uuid references audit_cycles(id) not null,
  asset_id uuid references assets(id) not null, verification_status text not null default 'Pending'
    check (verification_status in ('Pending','Verified','Missing','Damaged')),
  notes text, verified_by uuid references users(id), verified_at timestamptz,
  locked boolean default false

discrepancy_reports
  id uuid pk, audit_cycle_id uuid references audit_cycles(id) not null,
  asset_id uuid references assets(id) not null, issue_type text not null,
  description text, resolved boolean default false, resolved_by uuid references users(id),
  created_at timestamptz default now()

notifications
  id uuid pk, user_id uuid references users(id) not null, type text not null,
  message text not null, related_entity_type text, related_entity_id uuid,
  is_read boolean default false, created_at timestamptz default now()

activity_logs
  id uuid pk, user_id uuid references users(id), action text not null,
  entity_type text not null, entity_id uuid, details jsonb, created_at timestamptz default now()

AUTH IMPLEMENTATION:
- POST /api/auth/signup — creates user with role hardcoded to 'Employee' server-side, regardless
  of any role field sent in the body. Hash password with bcrypt (12 rounds). department_id optional.
- POST /api/auth/login — verify bcrypt hash, issue short-lived JWT access token (15m) + longer
  refresh token (7d, httpOnly cookie). Reject if status = 'Inactive'.
- POST /api/auth/refresh — rotate access token from valid refresh cookie
- POST /api/auth/logout — clear refresh cookie
- POST /api/auth/forgot-password + reset-password — token-based reset (email-simulated: log the
  reset link to console for hackathon demo, structure it so a real mailer can be dropped in)
- GET /api/auth/me — return current user + role from JWT

RBAC MIDDLEWARE:
- requireAuth — verifies JWT, attaches req.user
- requireRole(...roles) — 403 if req.user.role not in roles
Build this permission matrix into route-level middleware (not just documentation):

  Admin: full access to everything, including Organization Setup and role promotion
  Asset Manager: register/allocate/transfer-approve assets, approve maintenance, approve
                 returns, participate in audits, view org-wide reports
  Department Head: view/approve within own department_id only (allocation/transfer approvals
                    scoped to department_id = own), book resources, view dept reports
  Employee: view own allocations, book resources, raise maintenance requests, initiate own
            return/transfer requests

- Add a role-promotion endpoint PATCH /api/employees/:id/role restricted to Admin only —
  this is the ONLY place role can change.

DELIVERABLE: All migrations run cleanly against Supabase Postgres, seed script creates one
Admin user, auth flow fully testable via curl/Postman collection (include one in /docs).
```

### Completion Checklist
- [ ] All migrations apply cleanly in order, exclusion constraint on bookings verified with a manual overlapping-insert test that fails as expected
- [ ] Partial unique index on allocations verified with a manual duplicate-active-allocation test that fails as expected
- [ ] Signup never allows role in the request body to take effect
- [ ] JWT + refresh flow works end-to-end; inactive users blocked at login
- [ ] RBAC middleware rejects out-of-role requests with 403 on at least one endpoint per role

---

# PHASE 2 — Organization Setup + Employee Directory (Screen 3) + Dashboard shell (Screen 2)

### Prompt for Antigravity

```
[Include GLOBAL CONSTRAINTS block]
[Include APPENDIX C — Wireframe Reference, Screen 2 and Screen 3 entries]

Build Screen 3 (Admin-only Organization Setup, 3 tabs) fully, and the Dashboard shell (Screen 2)
with real KPI queries.

BACKEND — modules: departments, categories, employees, dashboard

Departments:
- CRUD endpoints, Admin only for create/edit/deactivate
- Support parent_department_id for hierarchy — return departments as a nested tree from
  GET /api/departments/tree in addition to a flat list endpoint
- Deactivating a department must NOT cascade-delete; just flips status, existing FKs remain valid
- Assigning head_user_id must validate the target user's role is Department Head (or promote flow
  handles this — see Employees below)

Asset Categories:
- CRUD, Admin only
- custom_fields stored as jsonb array of { field_name, field_type, required } — e.g. Electronics
  category can define a "warranty_period_months" number field. These custom fields must be
  rendered dynamically on the Asset Registration form in Phase 3 based on selected category.

Employee Directory:
- GET /api/employees with filters (department, role, status) + pagination
- PATCH /api/employees/:id/role — Admin only, promotes Employee -> Department Head or
  Asset Manager (or demotes back to Employee). When promoting to Department Head, prompt/require
  a department_id if not already set, and set that department's head_user_id to this user.
- PATCH /api/employees/:id/status — activate/deactivate

Dashboard KPIs — build real aggregate queries, not mocked numbers:
- Assets Available / Allocated count (group by status)
- Maintenance Today (maintenance_requests with status in Approved/Technician Assigned/In Progress
  and created or scheduled for today — for hackathon scope, count Approved+InProgress items)
- Active Bookings (bookings where status in Upcoming/Ongoing and today falls in range or upcoming)
- Pending Transfers (transfer_requests where status = Requested)
- Upcoming Returns (allocations where expected_return_date between today and today+7, status Active)
- Overdue Returns (allocations where expected_return_date < today, status Active) — MUST be
  returned as a visually distinct field from upcoming returns, not merged
- Scope all of the above by department_id when the requester is a Department Head; org-wide for
  Admin/Asset Manager; Employee sees only their own personal counts

FRONTEND:
- Screen 3 "Organization Setup" with 3 tabs (Department Management / Asset Category Management /
  Employee Directory), visible only to Admin role (route-guarded)
  - Department tab: table + create/edit modal, hierarchy shown as indented tree or breadcrumb
  - Category tab: table + create/edit modal with a dynamic custom-field builder (add field name +
    type + required toggle, repeatable rows)
  - Employee Directory tab: table with role/status badges, a "Promote" action opening a modal to
    pick Department Head or Asset Manager (department picker appears conditionally for Dept Head)
- Screen 2 Dashboard: KPI cards row, Overdue Returns section visually separated (red/amber accent)
  from Upcoming Returns (neutral), Quick Action buttons (Register Asset / Book Resource / Raise
  Maintenance Request) that route to the relevant screen/modal — these will link to modules built
  in Phase 3+, stub the navigation now
```

### Completion Checklist
- [ ] Department hierarchy renders correctly with 2+ levels of nesting
- [ ] Category custom fields persist and are retrievable in the shape the Asset form will need
- [ ] Only Admin can reach role-promotion action anywhere in the UI or API
- [ ] Dashboard KPIs return different scoped numbers for a Department Head test user vs Admin

---

# PHASE 3 — Asset Registry (Screen 4) + Allocation & Transfer (Screen 5)

### Prompt for Antigravity

```
[Include GLOBAL CONSTRAINTS block]
[Include APPENDIX C — Wireframe Reference, Screen 4 and Screen 5 entries]

Build asset registration/search/lifecycle (Screen 4) and allocation/transfer with the conflict
rule (Screen 5).

BACKEND — modules: assets, allocations

Assets:
- POST /api/assets — Asset Manager/Admin only. Auto-generate asset_tag as AF-XXXX (zero-padded,
  sequential per organization — use a Postgres sequence, not a max()+1 query, to avoid race
  conditions under concurrent inserts)
- Validate category-specific custom_fields payload against the category's custom_fields schema
  (required fields present, correct types) before insert
- GET /api/assets — filters: asset_tag, serial_number, category, status, department, location,
  free-text search; pagination
- GET /api/assets/:id — full detail including computed "current holder" (join latest Active
  allocation) and is_bookable flag
- GET /api/assets/:id/history — combined allocation history + maintenance history, chronological
- PATCH /api/assets/:id/status — validate against the state machine in GLOBAL CONSTRAINTS;
  reject illegal transitions with 400 + clear message naming the illegal edge attempted
- Support QR code value generation (store a string/URL in qr_code column) for scan-to-lookup

Allocations:
- POST /api/allocations — enforce the conflict rule at the SERVICE layer AND rely on the DB
  partial unique index as a second line of defense (catch the unique violation and translate
  it to the 409 response shape below). On conflict, return:
  { success: false, error: { code: 'ASSET_ALREADY_ALLOCATED',
    message: 'Currently held by <name>', currentHolder: {...}, offerTransfer: true } }
  On success: asset.status -> Allocated (single transaction with the allocation insert)
- POST /api/allocations/:id/return — Asset Manager approves return, captures
  condition_checkin_notes, sets actual_return_date, allocation.status -> Returned,
  asset.status -> Available, all in one transaction
- Background/cron-style check (implement as a query run on dashboard load + a
  GET /api/allocations/overdue endpoint, not a literal cron for hackathon scope) flags
  allocations where expected_return_date < today AND status = 'Active' as effectively overdue
  for dashboard/notification purposes (status field itself can stay 'Active'; overdue is derived)

Transfer Requests:
- POST /api/transfers — Employee/Dept Head initiates, requested_to is the new holder
- PATCH /api/transfers/:id/approve — Asset Manager or the relevant Department Head only; on
  approve: close old allocation (status Returned), open new allocation for requested_to, in one
  transaction; transfer_requests.status -> Completed
- PATCH /api/transfers/:id/reject — status -> Rejected, no asset changes

FRONTEND:
- Screen 4: registration form with dynamic category custom fields, searchable/filterable table
  with status badges color-coded per lifecycle state, detail drawer showing history timeline
- Screen 5: allocate modal — on 409 conflict response, replace the allocate button with a
  "Currently held by X — Request Transfer" affordance that opens the transfer request flow
  inline (this exact UX from the problem statement's Priya/Raj example must work)
  Return flow with condition check-in notes form
  Overdue allocations shown with a red badge, cross-linked from Dashboard

Trigger a notification (insert into notifications table) on: allocation created, transfer
approved/rejected, asset marked overdue (on-demand check is fine for hackathon scope).
```

### Completion Checklist
- [ ] Attempting to allocate an already-allocated asset returns the exact 409 shape and UI shows Transfer option (replicate the Priya/Raj scenario manually)
- [ ] Concurrent allocation attempts (fire two requests near-simultaneously) — only one succeeds, verified against the DB constraint, not just app logic
- [ ] Asset tag sequence has no gaps/dupes under rapid sequential creates
- [ ] Transfer approval correctly closes old + opens new allocation atomically

---

# PHASE 4 — Resource Booking (Screen 6) + Maintenance Workflow (Screen 7)

### Prompt for Antigravity

```
[Include GLOBAL CONSTRAINTS block]
[Include APPENDIX C — Wireframe Reference, Screen 6 and Screen 7 entries]

BACKEND — modules: bookings, maintenance

Bookings:
- POST /api/bookings — validate asset.is_bookable = true and asset.status not in
  (Lost, Retired, Disposed). Attempt insert; catch the EXCLUDE constraint violation from Phase 1
  and translate to a 409: { code: 'BOOKING_OVERLAP', message: 'Overlaps with existing booking',
  conflictingBooking: {...} }. Also run an application-level overlap pre-check before insert so
  the 409 message can be populated with the actual conflicting booking's details (the DB
  constraint alone won't give you that without a follow-up query).
- GET /api/bookings?resource_id=&from=&to= — calendar view data for a resource
- PATCH /api/bookings/:id/cancel — booked_by or Admin/Asset Manager only
- PATCH /api/bookings/:id/reschedule — same overlap validation as create
- Status transitions Upcoming -> Ongoing -> Completed should be derived (computed from
  start_time/end_time vs now()) rather than requiring manual updates — implement as a computed
  field in the GET response, not a stored/cron-updated value, to keep this simple and correct
- Reminder notification: on booking create, also create a notification record; for "before slot
  starts" reminder, implement a GET /api/bookings/upcoming-reminders endpoint the dashboard/
  notification screen polls, rather than a real scheduler (document this tradeoff in code comments)

Maintenance:
- POST /api/maintenance — any authenticated user (holder of the asset) raises a request,
  status starts Pending
- PATCH /api/maintenance/:id/approve — Asset Manager only; on approve, in one transaction:
  status -> Approved AND asset.status -> Under Maintenance (this is the ONLY path that may set
  Under Maintenance — enforce by putting this status change inside the maintenance service, never
  exposed as a direct asset status PATCH option for this transition)
- PATCH /api/maintenance/:id/reject — Asset Manager only, status -> Rejected, no asset change
- PATCH /api/maintenance/:id/assign-technician — status -> Technician Assigned, technician_name set
- PATCH /api/maintenance/:id/start — status -> In Progress
- PATCH /api/maintenance/:id/resolve — status -> Resolved, resolved_at set, AND
  asset.status -> Available in the same transaction
- GET /api/assets/:id/maintenance-history

FRONTEND:
- Screen 6 (per APPENDIX C wireframe): resource + date picker, single-resource single-day
  vertical time-slot grid (hourly rows), existing bookings as solid labeled blocks, conflicting
  requested slots rendered as a red dashed overlay with inline conflict text before the user even
  submits (pre-check against GET bookings for that resource/day), "Book a slot" button, status
  badges, cancel/reschedule actions
- Screen 7 (per APPENDIX C wireframe) — BUILD AS A KANBAN BOARD: five columns Pending / Approved /
  Technician Assigned / In Progress / Resolved, each request as a draggable card (asset tag+name,
  issue summary, technician once assigned). Card movement between columns triggers the matching
  PATCH endpoint above — implement with a drag-and-drop library (e.g. @dnd-kit) constrained so a
  card can only be dropped on the next valid column for its role-permitted transition; if
  drag-and-drop proves too time-costly, fall back to explicit per-card action buttons ("Approve",
  "Assign Technician", etc.) but keep the column/board layout regardless — do not replace this
  with a flat list/table view, the board structure is how approvers see workload at a glance. A
  "Raise Request" button opens a form (asset picker limited to assets the user holds/has access
  to, issue description, priority selector, photo upload) that creates a new card in the Pending
  column.
```

### Completion Checklist
- [ ] Booking 9:00–10:00 exists; request for 9:30–10:30 is rejected with conflict details; request for 10:00–11:00 succeeds — exact scenario from problem statement verified
- [ ] Asset status only ever reaches "Under Maintenance" via the approval endpoint — attempted direct status PATCH to Under Maintenance is rejected per Global Constraint 5
- [ ] Full maintenance status chain Pending→Approved→Technician Assigned→In Progress→Resolved works and correctly flips asset status at approve/resolve only

---

# PHASE 5 — Audit Cycles (Screen 8) + Reports (Screen 9) + Notifications/Logs (Screen 10)

### Prompt for Antigravity

```
[Include GLOBAL CONSTRAINTS block]
[Include APPENDIX C — Wireframe Reference, Screen 8, Screen 9, and Screen 10 entries]

BACKEND — modules: audits, reports, notifications, activityLogs

Audits:
- POST /api/audits — Admin/Asset Manager creates cycle (name, scope_department_id or
  scope_location, date range), status Planned
- POST /api/audits/:id/auditors — assign one or more auditor user_ids
- POST /api/audits/:id/start — status -> In Progress; auto-populate audit_items from all assets
  matching the cycle's scope (department or location) at this moment
- PATCH /api/audits/:id/items/:itemId — ONLY callable by a user in that cycle's assigned auditors
  list; sets verification_status + notes + verified_by + verified_at. Reject if item.locked = true
- POST /api/audits/:id/close — Admin/Asset Manager only:
  1. Lock all audit_items on this cycle (locked = true)
  2. For every item with verification_status = 'Missing', set the linked asset.status = 'Lost'
  3. Auto-generate discrepancy_reports rows for every item with status Missing or Damaged
  4. audit_cycles.status -> Closed, closed_at set
  All of the above in a single transaction.
- GET /api/audits/:id/discrepancies

Reports (read-only aggregate endpoints, keep queries efficient with proper indexes):
- GET /api/reports/utilization — most-used vs idle assets (rank by allocation/booking frequency
  over a date range)
- GET /api/reports/maintenance-frequency — group by asset/category
- GET /api/reports/due-for-maintenance-or-retirement — heuristic: assets with 3+ maintenance
  requests in last 12 months, or acquisition_date older than a configurable retirement threshold
- GET /api/reports/department-allocation-summary
- GET /api/reports/booking-heatmap — bookings grouped by day-of-week + hour bucket
- GET /api/reports/export?type=&format=csv — CSV export using a streaming CSV writer, not
  in-memory string concatenation for large datasets

Notifications & Activity Logs:
- GET /api/notifications (own), PATCH /api/notifications/:id/read, PATCH /api/notifications/read-all
- Ensure every state-changing endpoint built in Phases 3-5 writes an activity_logs row
  (user_id, action, entity_type, entity_id, details) — add this as a small reusable
  `logActivity()` helper called from each service, not duplicated inline
- GET /api/activity-logs — Admin only, filterable by user/entity_type/date range, paginated

FRONTEND:
- Screen 8 (per APPENDIX C wireframe): header card summarizing the active cycle (name, scope,
  date range, assigned auditors), create-cycle form, auditor assignment, per-asset verification
  table (Asset / Expected Location / Verification as TagChip — editable only by assigned
  auditors), amber discrepancy banner once items are flagged ("N assets flagged — discrepancy
  report generated automatically"), "Close Audit Cycle" button with the irreversible-action
  confirmation modal
- Screen 9 (per APPENDIX C wireframe): two side-by-side chart cards up top (Utilization by
  department — bar; Maintenance Frequency — line), below that two side-by-side lists (Most Used
  Assets / Idle Assets), below that a single Due for Maintenance/Retirement list, filter controls
  (date range, department, category), and an "Export Report" button styled with --accent so it
  reads as the primary terminal action on the screen
- Screen 10 (per APPENDIX C wireframe): filter tab row (All / Alerts / Approvals / Bookings) above
  a notification feed with relative timestamps computed client-side and visually distinct unread
  rows; Admin-only activity log table with filters, reachable from the same screen
```

### Completion Checklist
- [ ] Closing an audit cycle with a Missing item flips the linked asset to Lost and generates a discrepancy row, verified end-to-end
- [ ] Non-assigned auditor cannot PATCH items on a cycle they aren't assigned to (403)
- [ ] Every module built in Phases 3-5 produces at least one activity_logs row per state change
- [ ] CSV export downloads a correctly formatted file for at least 2 report types

---

# PHASE 6 — Login/Signup Polish (Screen 1), Cross-Cutting UX, Hardening & Deploy Prep

### Prompt for Antigravity

```
[Include GLOBAL CONSTRAINTS block]

1. Screen 1 polish: signup/login forms with proper client + server validation feedback, forgot
   password flow wired to the reset-password backend from Phase 1, session validation on app load
   (call /api/auth/me, redirect to login on 401), loading/error states.

2. Cross-cutting UX pass:
   - Empty states for every table/list (no assets yet, no bookings yet, etc.)
   - Toast notifications for every mutation success/failure
   - Consistent confirmation modals for destructive/irreversible actions (dispose asset, close
     audit cycle, reject request)
   - Role-based nav — hide/disable nav items and buttons the current role cannot use (in addition
     to server-side RBAC, this is UX only, not a security boundary)
   - Responsive layout check on tablet width minimum (this is a mobile-adjacent ops tool)
   - Theme QA pass: toggle light/dark on every one of the 10 screens and confirm no hardcoded
     colors slipped in outside the CSS variable system (grep for raw hex codes in component files
     as a check), confirm TagChip status colors stay legible in both themes, confirm charts on the
     Reports screen re-theme correctly (many chart libs need explicit dark-mode color props)

3. Security hardening pass:
   - Rate limit /api/auth/login and /api/auth/signup (express-rate-limit)
   - Helmet middleware on Express
   - Input validation (zod schemas) on every POST/PATCH route, not just the obvious ones
   - Ensure no endpoint leaks another department's/user's data to a scoped role (write a quick
     manual test matrix: Dept Head A cannot see Dept Head B's allocations/bookings/reports)
   - Ensure password_hash and any token secrets never appear in any API response payload

4. Seed script: realistic demo data — 2 departments (one nested sub-department), 3 categories with
   custom fields, ~15 assets across categories and statuses, 6 users covering all 4 roles, a few
   allocations (including one overdue), a few bookings (including a demonstrable overlap-rejection
   case you can show live), one maintenance request at each workflow stage, one closed audit cycle
   with a discrepancy.

5. Deploy prep: production build scripts for frontend, PM2 or similar process config for backend,
   document exact Supabase project setup steps (connection string, enabling btree_gist extension)
   in README, environment variable checklist for a fresh deploy.

DELIVERABLE: a demo-ready build where every hard constraint from GLOBAL CONSTRAINTS can be shown
live using the seed data without extra manual setup.
```

### Completion Checklist
- [ ] Fresh clone + documented setup steps produces a running app with demo data in under 10 minutes
- [ ] Manual cross-role data-leak test matrix passes for all 4 roles
- [ ] Both hard-constraint demo scenarios (allocation conflict, booking overlap) work live off seed data with no extra setup
- [ ] No secrets/hashes present in any browser network tab response
- [ ] Theme toggle works on every screen with no unstyled flash or hardcoded colors breaking dark mode

---

## APPENDIX A — Permission Matrix (for reference while building RBAC)

| Action | Admin | Asset Manager | Department Head | Employee |
|---|---|---|---|---|
| Org setup (dept/category) | ✅ | ❌ | ❌ | ❌ |
| Promote roles | ✅ | ❌ | ❌ | ❌ |
| Register asset | ✅ | ✅ | ❌ | ❌ |
| Allocate asset | ✅ | ✅ | ❌ | ❌ |
| Approve transfer | ✅ | ✅ | own dept only | ❌ |
| Initiate transfer/return request | ✅ | ✅ | ✅ | ✅ (own assets) |
| Book resource | ✅ | ✅ | ✅ | ✅ |
| Raise maintenance request | ✅ | ✅ | ✅ | ✅ |
| Approve maintenance | ✅ | ✅ | ❌ | ❌ |
| Create/close audit cycle | ✅ | ✅ | ❌ | ❌ |
| Verify audit item | only if assigned auditor | only if assigned auditor | only if assigned auditor | only if assigned auditor |
| View org-wide reports | ✅ | ✅ | own dept only | own data only |

## APPENDIX B — Asset State Machine (visual reference)

```
              ┌────────────┐
    ┌────────▶│ Available  │◀────────┐
    │         └─────┬──────┘         │
    │      alloc │  │book    maint. │ resolve
    │            ▼  ▼               │approve
┌───┴────┐  ┌─────────┐      ┌──────┴───────────┐
│Retired │  │Allocated│      │Under Maintenance  │
│Disposed│  └────┬────┘      └───────────────────┘
└────────┘       │return
                  ▼
             Available
   (any active state) ──lost──▶ Lost (terminal)
```

## APPENDIX C — Wireframe Reference (from the team's Excalidraw mockup)

This is the actual approved wireframe. Follow these exact labels, field names, table columns, and
layout structures — don't improvise different copy or structure where the wireframe already
specifies one. Apply the DESIGN SYSTEM tokens/TagChip styling on top of this structure; the
wireframe defines layout and content, the Design System block defines the visual treatment.

**Sidebar nav (identical order on every screen 2-10):**
`Dashboard / Organization setup / Assets / Allocation & Transfer / Resource Booking /
Maintenance / Audit / Reports / Notifications`
(Employee Directory is a tab inside Organization Setup, not its own nav item.)

**Screen 1 — Login**
- Card titled "AssetFlow – login", circular logo mark "AF" above the form
- Fields: Email (`name@company.com` placeholder), Password (masked)
- "Forgot password" link, right-aligned under password
- Divider, then "New here?" section with helper copy: *"Sign up creates an employee account,
  admin roles assigned later"* — use this line verbatim or a very close variant, it's the plain-
  language restatement of Global Constraint 1 and should reassure users this is intentional, not
  a missing feature
- "Create Account" button

**Screen 2 — Dashboard**
- Header "Today's Overview"
- KPI card grid, exact order: Available / Allocated / Reserved / Active Bookings / Pending
  Transfers / Upcoming Returns (6 cards, 3x2 or 6x1 depending on width)
- A red/amber alert banner directly under the KPI grid for overdue items:
  "`N` assets overdue for return — flagged for follow-up" (only rendered when count > 0)
- Quick action row: "+ Register Asset", "Book Resource", "Raise Request" buttons
- "Recent Activity" section below — a plain reverse-chronological feed, e.g. "Laptop AF-0114
  allocated to Priya Shah — IT dept", "Room B2 — booking confirmed 2:00–3:00 PM", "Projector
  AF-0062 — maintenance resolved" (pull from activity_logs, most recent ~5-8 entries)

**Screen 3 — Organization Setup (Admin only)**
- Top button-row acts as the tab switcher: "Departments" / "Categories" / "Employee" (active tab
  highlighted with accent-soft background), plus a persistent "+ Add" button that opens the
  create modal for whichever tab is active
- Departments tab table columns: Department / Head / Parent Dept / Status (status as TagChip:
  Active/Inactive)
- Footnote text under the table: "Editing a department here also drives the picklist in Screen 4
  & 5" — i.e. department dropdowns elsewhere must live-reflect this table, not a cached list

**Screen 4 — Asset Registration & Directory**
- Top bar: search input placeholder "Search by tag, serial, or QR code..." + "+ Register Asset"
  button, right-aligned
- Filter row: Category / Status / Department (dropdown filter chips)
- Table columns: Tag / Name / Category / Status / Location — Tag column in monospace, Status as
  TagChip

**Screen 5 — Asset Allocation & Transfer**
- Asset picker/search field at top (e.g. "AF-0114 – Dell laptop")
- When the selected asset is already allocated, render a red banner exactly like Global
  Constraint 3's required UX: "Already allocated to `<holder>` (`<department>`) — direct
  re-allocation is blocked, submit a transfer request below"
- Transfer Request form under the banner: "From" (read-only, current holder), "To" (Select
  Employee dropdown), "Reason" (textarea), "Submit Request" button
- "Allocation history" list at the bottom, reverse-chronological: date, action, person, and
  condition notes where applicable (e.g. "Mar 12 — Allocated to Priya Shah — Engineering",
  "Jan 04 — Returned by Arjun Nair — condition: good")

**Screen 6 — Resource Booking**
- Resource + date picker at top (e.g. "Conference room B2 – Tue, 7 Jul")
- Day view as a vertical time-slot grid (hourly rows, e.g. 9:00 through 1:00), NOT a month
  calendar — this is a single-resource single-day schedule view
- Existing bookings render as solid blocks spanning their time range, labeled with booker/purpose
  (e.g. "Booked — Procurement Team — 9 to 10")
- When the user's requested slot overlaps an existing booking, render the requested slot as a
  dashed/outlined block in red overlapping the existing one, with inline text: "Requested 9:30 to
  10:30 — conflict, slot is unavailable" — reject on submit, don't just warn
- "Book a slot" button below the grid

**Screen 7 — Maintenance Management — BUILD AS A KANBAN BOARD, not a list/queue view**
- Five columns exactly matching the workflow states: Pending / Approved / Technician Assigned /
  In Progress / Resolved
- Each maintenance request renders as a card in its current column: asset tag + name, short issue
  description, technician name once assigned (e.g. "AF-0078 forklift — tech: R Verma")
- Moving a card between columns IS the approval action — drag-and-drop (or explicit per-card
  action buttons if drag-and-drop is out of scope for time) triggers the corresponding
  PATCH /api/maintenance/:id/... endpoint from Phase 4. A card can only move to the next valid
  column, not skip ahead, and only by a user with the right role for that transition (Asset
  Manager for Pending→Approved/Rejected, any assignee-capable role for Technician
  Assigned→In Progress, etc.)
- Footnote text under the board: "Approving a card moves the asset to Under Maintenance,
  resolving returns it to Available" — this is a direct restatement of Global Constraint 5, keep
  it visible on this screen so the behavior isn't a surprise

**Screen 8 — Asset Audit**
- Header card summarizing the active cycle: cycle name + scope + date range + assigned auditors,
  e.g. "Q3 audit: Engineering dept — 1–15 Jul · Auditors: A. Rao, S. Iqbal"
- Table columns: Asset / Expected Location / Verification (verification as TagChip:
  Verified/Missing/Damaged, editable only by assigned auditors per Global Constraint 6)
- Discrepancy banner once any items are flagged: "`N` assets flagged — discrepancy report
  generated automatically" (amber/yellow treatment, distinct from the red overdue banner style)
- "Close audit cycle" button — must trigger the irreversible-action confirmation modal from
  Phase 6

**Screen 9 — Reports & Analytics**
- Two side-by-side chart cards at top: "Utilization by department" (bar chart) and "Maintenance
  Frequency" (line chart)
- Below that, two side-by-side lists: "Most used assets" (e.g. "Room B2: 34 bookings this month",
  "Van AF-343: 21 trips this month") and "Idle assets" (e.g. "Camera AF-0301: unused 60+ days")
- Below that, a single list: "Assets due for maintenance / nearing retirement" (e.g. "Forklift
  AF-0087: service due in 5 days", "Laptop AF-0020: 4 years old, nearing retirement")
- "Export report" button, visually distinct (the wireframe gives it a warm/alert color to make it
  stand out as the primary terminal action on this screen — use --accent, not a neutral button)

**Screen 10 — Activity Logs & Notifications**
- Filter tab row: All / Alerts / Approvals / Bookings (client-side or query-param filter over the
  same feed)
- Feed list with relative timestamps ("2m ago", "18m ago", "1h ago", "3h ago", "1d ago", "2d ago")
  — compute these client-side from created_at, don't store relative strings
- Each row: small type icon, message text, timestamp right-aligned; unread rows visually distinct
  (bold text or accent-soft background) until clicked/marked read

---

*Generated for Darshan — AssetFlow hackathon build. Paste phases sequentially into Antigravity. Keep this file in `/docs` inside the repo so the agent retains schema/constraint context across sessions.*
