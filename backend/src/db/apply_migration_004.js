const { pool } = require('../config/db');

async function ensurePhase4Schema() {
  const client = await pool.connect();
  try {
    await client.query(`CREATE EXTENSION IF NOT EXISTS btree_gist;`);

    // Ensure bookings table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS bookings (
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
    `);

    // Ensure exclusion constraint exists
    try {
      await client.query(`
        ALTER TABLE bookings
        ADD CONSTRAINT no_overlapping_bookings
        EXCLUDE USING gist (
          resource_asset_id WITH =,
          tstzrange(start_time, end_time) WITH &&
        ) WHERE (status <> 'Cancelled');
      `);
    } catch (e) {
      // Constraint likely already exists
    }

    // Ensure maintenance_requests table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS maintenance_requests (
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
    `);

    console.log('✔ Phase 4 schema & btree_gist exclusion constraint verified successfully.');
  } catch (err) {
    console.error('Error verifying Phase 4 schema:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

ensurePhase4Schema();
