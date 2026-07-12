const { pool } = require('../config/db');

async function applySeq() {
  try {
    await pool.query(`CREATE SEQUENCE IF NOT EXISTS asset_tag_seq START WITH 1100 INCREMENT BY 1;`);
    await pool.query(`ALTER TABLE assets ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}'::jsonb;`);
    await pool.query(`ALTER TABLE transfer_requests ADD COLUMN IF NOT EXISTS reason TEXT;`);
    await pool.query(`ALTER TABLE transfer_requests ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();`);
    await pool.query(`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS title TEXT;`);
    console.log('✔ asset_tag_seq, assets.custom_fields, transfer_requests.(reason, updated_at), and notifications.title applied successfully.');
  } catch (err) {
    console.error('Error applying migration 003:', err);
  } finally {
    await pool.end();
  }
}

applySeq();
