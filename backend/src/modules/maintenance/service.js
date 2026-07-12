const { pool, query } = require('../../config/db');
const { BadRequestError, NotFoundError, ForbiddenError } = require('../../utils/errors');

async function listMaintenance(filters = {}) {
  const { status, asset_id, priority } = filters;
  const conditions = [];
  const params = [];
  let paramIndex = 1;

  if (status) {
    conditions.push(`m.status = $${paramIndex++}`);
    params.push(status);
  }
  if (asset_id) {
    conditions.push(`m.asset_id = $${paramIndex++}`);
    params.push(asset_id);
  }
  if (priority) {
    conditions.push(`m.priority = $${paramIndex++}`);
    params.push(priority);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const res = await query(
    `SELECT m.*,
            a.asset_tag, a.name AS asset_name,
            u.name AS raised_by_name, u.email AS raised_by_email
     FROM maintenance_requests m
     JOIN assets a ON m.asset_id = a.id
     JOIN users u ON m.raised_by = u.id
     ${whereClause}
     ORDER BY m.created_at DESC`,
    params
  );

  return res.rows;
}

async function createRequest(payload, user) {
  const { assetId, issueDescription, priority = 'Medium', photoUrl = null } = payload;

  const assetRes = await query(`SELECT id, asset_tag, name, status FROM assets WHERE id = $1`, [assetId]);
  if (assetRes.rows.length === 0) {
    throw new NotFoundError('Asset not found');
  }

  const insertRes = await query(
    `INSERT INTO maintenance_requests (asset_id, raised_by, issue_description, priority, photo_url, status)
     VALUES ($1, $2, $3, $4, $5, 'Pending')
     RETURNING *`,
    [assetId, user.id, issueDescription, priority, photoUrl]
  );

  const m = insertRes.rows[0];
  const asset = assetRes.rows[0];

  return {
    ...m,
    asset_tag: asset.asset_tag,
    asset_name: asset.name,
    raised_by_name: user.name,
  };
}

async function approveRequest(id, user) {
  if (!['Admin', 'AssetManager'].includes(user.role)) {
    throw new ForbiddenError('Only Admin or Asset Manager can approve maintenance requests.');
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const reqRes = await client.query(`SELECT * FROM maintenance_requests WHERE id = $1 FOR UPDATE`, [id]);
    if (reqRes.rows.length === 0) {
      throw new NotFoundError('Maintenance request not found');
    }
    const m = reqRes.rows[0];

    if (m.status !== 'Pending') {
      throw new BadRequestError(`Cannot approve maintenance request from state '${m.status}'.`);
    }

    // 1. Update maintenance request status to Approved
    const updatedM = await client.query(
      `UPDATE maintenance_requests
       SET status = 'Approved', approved_by = $1
       WHERE id = $2 RETURNING *`,
      [user.id, id]
    );

    // 2. Global Constraint 5: Transition asset to 'Under Maintenance' ONLY after approval
    await client.query(
      `UPDATE assets SET status = 'Under Maintenance', updated_at = NOW() WHERE id = $1`,
      [m.asset_id]
    );

    // Activity log
    await client.query(
      `INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
       VALUES ($1, $2, 'Maintenance', $3, $4::jsonb)`,
      [
        user.id,
        `Approved maintenance request ${id}; Asset moved to Under Maintenance`,
        id,
        JSON.stringify({ asset_id: m.asset_id }),
      ]
    );

    await client.query('COMMIT');

    // Fetch joined names
    const joined = await query(
      `SELECT m.*, a.asset_tag, a.name AS asset_name, u.name AS raised_by_name
       FROM maintenance_requests m
       JOIN assets a ON m.asset_id = a.id
       JOIN users u ON m.raised_by = u.id
       WHERE m.id = $1`,
      [id]
    );
    return joined.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function rejectRequest(id, user) {
  if (!['Admin', 'AssetManager'].includes(user.role)) {
    throw new ForbiddenError('Only Admin or Asset Manager can reject maintenance requests.');
  }

  const reqRes = await query(`SELECT * FROM maintenance_requests WHERE id = $1`, [id]);
  if (reqRes.rows.length === 0) {
    throw new NotFoundError('Maintenance request not found');
  }

  const updated = await query(
    `UPDATE maintenance_requests SET status = 'Rejected' WHERE id = $1 RETURNING *`,
    [id]
  );

  const joined = await query(
    `SELECT m.*, a.asset_tag, a.name AS asset_name, u.name AS raised_by_name
     FROM maintenance_requests m
     JOIN assets a ON m.asset_id = a.id
     JOIN users u ON m.raised_by = u.id
     WHERE m.id = $1`,
    [id]
  );
  return joined.rows[0];
}

async function assignTechnician(id, technicianName, user) {
  if (!['Admin', 'AssetManager'].includes(user.role)) {
    throw new ForbiddenError('Only Admin or Asset Manager can assign technicians.');
  }

  const reqRes = await query(`SELECT * FROM maintenance_requests WHERE id = $1`, [id]);
  if (reqRes.rows.length === 0) {
    throw new NotFoundError('Maintenance request not found');
  }

  await query(
    `UPDATE maintenance_requests
     SET status = 'Technician Assigned', technician_name = $1
     WHERE id = $2`,
    [technicianName, id]
  );

  const joined = await query(
    `SELECT m.*, a.asset_tag, a.name AS asset_name, u.name AS raised_by_name
     FROM maintenance_requests m
     JOIN assets a ON m.asset_id = a.id
     JOIN users u ON m.raised_by = u.id
     WHERE m.id = $1`,
    [id]
  );
  return joined.rows[0];
}

async function startMaintenance(id, user) {
  const reqRes = await query(`SELECT * FROM maintenance_requests WHERE id = $1`, [id]);
  if (reqRes.rows.length === 0) {
    throw new NotFoundError('Maintenance request not found');
  }

  await query(`UPDATE maintenance_requests SET status = 'In Progress' WHERE id = $1`, [id]);

  const joined = await query(
    `SELECT m.*, a.asset_tag, a.name AS asset_name, u.name AS raised_by_name
     FROM maintenance_requests m
     JOIN assets a ON m.asset_id = a.id
     JOIN users u ON m.raised_by = u.id
     WHERE m.id = $1`,
    [id]
  );
  return joined.rows[0];
}

async function resolveMaintenance(id, user) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const reqRes = await client.query(`SELECT * FROM maintenance_requests WHERE id = $1 FOR UPDATE`, [id]);
    if (reqRes.rows.length === 0) {
      throw new NotFoundError('Maintenance request not found');
    }
    const m = reqRes.rows[0];

    await client.query(
      `UPDATE maintenance_requests
       SET status = 'Resolved', resolved_at = NOW()
       WHERE id = $1`,
      [id]
    );

    // Return asset status to Available
    await client.query(
      `UPDATE assets SET status = 'Available', updated_at = NOW() WHERE id = $1`,
      [m.asset_id]
    );

    await client.query('COMMIT');

    const joined = await query(
      `SELECT m.*, a.asset_tag, a.name AS asset_name, u.name AS raised_by_name
       FROM maintenance_requests m
       JOIN assets a ON m.asset_id = a.id
       JOIN users u ON m.raised_by = u.id
       WHERE m.id = $1`,
      [id]
    );
    return joined.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = {
  listMaintenance,
  createRequest,
  approveRequest,
  rejectRequest,
  assignTechnician,
  startMaintenance,
  resolveMaintenance,
};
