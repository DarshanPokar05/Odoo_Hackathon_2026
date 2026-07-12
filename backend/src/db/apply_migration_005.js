const { pool } = require('../config/db');

async function ensurePhase5Schema() {
  const client = await pool.connect();
  try {
    // Ensure notifications has title column
    await client.query(`
      ALTER TABLE notifications ADD COLUMN IF NOT EXISTS title TEXT;
    `);

    // Ensure audit tables exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_cycles (
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
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_cycle_auditors (
        audit_cycle_id UUID REFERENCES audit_cycles(id) ON DELETE CASCADE,
        auditor_id UUID REFERENCES users(id) ON DELETE CASCADE,
        PRIMARY KEY (audit_cycle_id, auditor_id)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_items (
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
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS discrepancy_reports (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        audit_cycle_id UUID NOT NULL REFERENCES audit_cycles(id) ON DELETE CASCADE,
        asset_id UUID NOT NULL REFERENCES assets(id),
        issue_type TEXT NOT NULL,
        description TEXT,
        resolved BOOLEAN DEFAULT false,
        resolved_by UUID REFERENCES users(id),
        created_at TIMESTAMPTZ DEFAULT now()
      );
    `);

    console.log('✔ Phase 5 schema verified successfully.');
  } catch (err) {
    console.error('Error verifying Phase 5 schema:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

ensurePhase5Schema();
