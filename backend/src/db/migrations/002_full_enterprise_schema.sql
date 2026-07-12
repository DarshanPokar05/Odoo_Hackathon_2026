-- 002_full_enterprise_schema.sql
-- Full enterprise database schema for AssetFlow with btree_gist and partial indexes

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Drop initial Phase 0 demo tables if they exist without UUID structure
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS discrepancy_reports CASCADE;
DROP TABLE IF EXISTS audit_items CASCADE;
DROP TABLE IF EXISTS audit_cycle_auditors CASCADE;
DROP TABLE IF EXISTS audit_cycles CASCADE;
DROP TABLE IF EXISTS maintenance_requests CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS transfer_requests CASCADE;
DROP TABLE IF EXISTS allocations CASCADE;
DROP TABLE IF EXISTS assets CASCADE;
DROP TABLE IF EXISTS asset_categories CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS departments CASCADE;

-- 1. departments table
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  head_user_id UUID, -- Will be foreign keyed to users after users table is created
  parent_department_id UUID REFERENCES departments(id),
  status TEXT DEFAULT 'Active' CHECK (status IN ('Active','Inactive')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'Employee'
    CHECK (role IN ('Admin','AssetManager','DepartmentHead','Employee')),
  department_id UUID REFERENCES departments(id),
  status TEXT NOT NULL DEFAULT 'Active'
    CHECK (status IN ('Active','Inactive')),
  reset_password_token TEXT,
  reset_password_expires TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add head_user_id foreign key to departments
ALTER TABLE departments
  ADD CONSTRAINT fk_departments_head_user
  FOREIGN KEY (head_user_id) REFERENCES users(id) ON DELETE SET NULL;

-- 3. asset_categories table
CREATE TABLE asset_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  custom_fields JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. assets table
CREATE TABLE assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_tag TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category_id UUID REFERENCES asset_categories(id),
  serial_number TEXT,
  acquisition_date DATE,
  acquisition_cost NUMERIC(12,2),
  condition TEXT CHECK (condition IN ('New','Good','Fair','Poor','Damaged')),
  location TEXT,
  status TEXT NOT NULL DEFAULT 'Available'
    CHECK (status IN ('Available','Allocated','Reserved','Under Maintenance','Lost','Retired','Disposed')),
  is_bookable BOOLEAN DEFAULT false,
  photo_url TEXT,
  documents JSONB DEFAULT '[]',
  department_id UUID REFERENCES departments(id),
  qr_code TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. allocations table
CREATE TABLE allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES assets(id),
  employee_id UUID REFERENCES users(id),
  department_id UUID REFERENCES departments(id),
  allocated_date DATE NOT NULL DEFAULT current_date,
  expected_return_date DATE,
  actual_return_date DATE,
  status TEXT NOT NULL DEFAULT 'Active'
    CHECK (status IN ('Active','Returned','Overdue')),
  condition_checkin_notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Global Constraint 3: Partial unique index: only one Active allocation per asset
CREATE UNIQUE INDEX one_active_allocation_per_asset
  ON allocations(asset_id)
  WHERE status = 'Active';

-- 6. transfer_requests table
CREATE TABLE transfer_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES assets(id),
  current_holder_id UUID REFERENCES users(id),
  requested_by UUID NOT NULL REFERENCES users(id),
  requested_to UUID NOT NULL REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'Requested'
    CHECK (status IN ('Requested','Approved','Rejected','Completed')),
  approved_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

-- 7. bookings table
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_asset_id UUID NOT NULL REFERENCES assets(id),
  booked_by UUID NOT NULL REFERENCES users(id),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'Upcoming'
    CHECK (status IN ('Upcoming','Ongoing','Completed','Cancelled')),
  purpose TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT chk_bookings_time CHECK (end_time > start_time)
);

-- Global Constraint 4: Overlap prevention via exclusion constraint (only among non-cancelled bookings)
ALTER TABLE bookings
  ADD CONSTRAINT no_overlapping_bookings
  EXCLUDE USING gist (
    resource_asset_id WITH =,
    tstzrange(start_time, end_time) WITH &&
  ) WHERE (status <> 'Cancelled');

-- 8. maintenance_requests table
CREATE TABLE maintenance_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES assets(id),
  raised_by UUID NOT NULL REFERENCES users(id),
  issue_description TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'Medium'
    CHECK (priority IN ('Low','Medium','High','Critical')),
  photo_url TEXT,
  status TEXT NOT NULL DEFAULT 'Pending'
    CHECK (status IN ('Pending','Approved','Rejected','Technician Assigned','In Progress','Resolved')),
  approved_by UUID REFERENCES users(id),
  technician_name TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. audit_cycles table
CREATE TABLE audit_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  scope_department_id UUID REFERENCES departments(id),
  scope_location TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'Planned'
    CHECK (status IN ('Planned','In Progress','Closed')),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  closed_at TIMESTAMPTZ
);

-- 10. audit_cycle_auditors table
CREATE TABLE audit_cycle_auditors (
  audit_cycle_id UUID REFERENCES audit_cycles(id) ON DELETE CASCADE,
  auditor_id UUID REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (audit_cycle_id, auditor_id)
);

-- 11. audit_items table
CREATE TABLE audit_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_cycle_id UUID NOT NULL REFERENCES audit_cycles(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES assets(id),
  verification_status TEXT NOT NULL DEFAULT 'Pending'
    CHECK (verification_status IN ('Pending','Verified','Missing','Damaged')),
  notes TEXT,
  verified_by UUID REFERENCES users(id),
  verified_at TIMESTAMPTZ,
  locked BOOLEAN DEFAULT false
);

-- 12. discrepancy_reports table
CREATE TABLE discrepancy_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_cycle_id UUID NOT NULL REFERENCES audit_cycles(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES assets(id),
  issue_type TEXT NOT NULL,
  description TEXT,
  resolved BOOLEAN DEFAULT false,
  resolved_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 13. notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  related_entity_type TEXT,
  related_entity_id UUID,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 14. activity_logs table
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
