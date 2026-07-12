const { pool, query } = require('../../config/db');
const { BadRequestError, NotFoundError, ForbiddenError } = require('../../utils/errors');
const { logActivity } = require('../../utils/logger');

async function listAuditCycles() {
  const res = await query(`
    SELECT c.*,
           d.name AS scope_department_name,
           (SELECT COUNT(*) FROM audit_items i WHERE i.audit_cycle_id = c.id) AS total_items,
           (SELECT COUNT(*) FROM audit_items i WHERE i.audit_cycle_id = c.id AND i.verification_status <> 'Pending') AS verified_items
    FROM audit_cycles c
    LEFT JOIN departments d ON c.scope_department_id = d.id
    ORDER BY c.created_at DESC
  `);

  const cycles = res.rows;
  for (const c of cycles) {
    const audRes = await query(
      `SELECT u.id, u.name, u.email
       FROM audit_cycle_auditors a
       JOIN users u ON a.auditor_id = u.id
       WHERE a.audit_cycle_id = $1`,
      [c.id]
    );
    c.auditors = audRes.rows;
  }

  return cycles;
}

async function getAuditCycle(cycleId) {
  const cRes = await query(
    `SELECT c.*, d.name AS scope_department_name
     FROM audit_cycles c
     LEFT JOIN departments d ON c.scope_department_id = d.id
     WHERE c.id = $1`,
    [cycleId]
  );
  if (cRes.rows.length === 0) {
    throw new NotFoundError('Audit cycle not found');
  }
  const cycle = cRes.rows[0];

  const audRes = await query(
    `SELECT u.id, u.name, u.email
     FROM audit_cycle_auditors a
     JOIN users u ON a.auditor_id = u.id
     WHERE a.audit_cycle_id = $1`,
    [cycleId]
  );
  cycle.auditors = audRes.rows;

  const itemsRes = await query(
    `SELECT i.*,
            a.asset_tag, a.name AS asset_name, a.location AS expected_location, a.status AS asset_status,
            u.name AS verified_by_name
     FROM audit_items i
     JOIN assets a ON i.asset_id = a.id
     LEFT JOIN users u ON i.verified_by = u.id
     WHERE i.audit_cycle_id = $1
     ORDER BY a.asset_tag ASC`,
    [cycleId]
  );
  cycle.items = itemsRes.rows;

  return cycle;
}

async function createAuditCycle(payload, user) {
  if (!['Admin', 'AssetManager'].includes(user.role)) {
    throw new ForbiddenError('Only Admin or Asset Manager can create audit cycles.');
  }

  const { name, scopeDepartmentId = null, scopeLocation = null, startDate, endDate, auditorIds = [] } = payload;

  const res = await query(
    `INSERT INTO audit_cycles (name, scope_department_id, scope_location, start_date, end_date, status, created_by)
     VALUES ($1, $2, $3, $4, $5, 'Planned', $6)
     RETURNING *`,
    [name, scopeDepartmentId, scopeLocation, startDate, endDate, user.id]
  );

  const cycle = res.rows[0];

  if (Array.isArray(auditorIds) && auditorIds.length > 0) {
    for (const audId of auditorIds) {
      await query(
        `INSERT INTO audit_cycle_auditors (audit_cycle_id, auditor_id)
         VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [cycle.id, audId]
      );
    }
  }

  await logActivity({
    userId: user.id,
    action: `Created audit cycle: ${cycle.name}`,
    entityType: 'AuditCycle',
    entityId: cycle.id,
    details: { name, scopeDepartmentId, scopeLocation },
  });

  return getAuditCycle(cycle.id);
}

async function assignAuditors(cycleId, auditorIds, user) {
  if (!['Admin', 'AssetManager'].includes(user.role)) {
    throw new ForbiddenError('Only Admin or Asset Manager can assign auditors.');
  }

  await query(`DELETE FROM audit_cycle_auditors WHERE audit_cycle_id = $1`, [cycleId]);

  if (Array.isArray(auditorIds) && auditorIds.length > 0) {
    for (const audId of auditorIds) {
      await query(
        `INSERT INTO audit_cycle_auditors (audit_cycle_id, auditor_id)
         VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [cycleId, audId]
      );
    }
  }

  await logActivity({
    userId: user.id,
    action: `Updated auditors for audit cycle ${cycleId}`,
    entityType: 'AuditCycle',
    entityId: cycleId,
    details: { auditorIds },
  });

  return getAuditCycle(cycleId);
}

async function startAuditCycle(cycleId, user) {
  if (!['Admin', 'AssetManager'].includes(user.role)) {
    throw new ForbiddenError('Only Admin or Asset Manager can start audit cycles.');
  }

  const cRes = await query(`SELECT * FROM audit_cycles WHERE id = $1`, [cycleId]);
  if (cRes.rows.length === 0) {
    throw new NotFoundError('Audit cycle not found');
  }
  const cycle = cRes.rows[0];

  if (cycle.status === 'Closed') {
    throw new BadRequestError('Cannot start a closed audit cycle.');
  }

  // Populate audit_items based on scope
  const conditions = [];
  const params = [];
  let paramIndex = 1;

  if (cycle.scope_department_id) {
    conditions.push(`department_id = $${paramIndex++}`);
    params.push(cycle.scope_department_id);
  }
  if (cycle.scope_location) {
    conditions.push(`LOWER(location) = LOWER($${paramIndex++})`);
    params.push(cycle.scope_location);
  }

  // Avoid inserting terminal assets
  conditions.push(`status NOT IN ('Disposed', 'Retired')`);

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const assetsRes = await query(`SELECT id FROM assets ${whereClause}`, params);

  for (const asset of assetsRes.rows) {
    await query(
      `INSERT INTO audit_items (audit_cycle_id, asset_id, verification_status)
       VALUES ($1, $2, 'Pending')
       ON CONFLICT DO NOTHING`,
      [cycleId, asset.id]
    );
  }

  await query(`UPDATE audit_cycles SET status = 'In Progress' WHERE id = $1`, [cycleId]);

  await logActivity({
    userId: user.id,
    action: `Started audit cycle: ${cycle.name} (${assetsRes.rows.length} assets scoped)`,
    entityType: 'AuditCycle',
    entityId: cycleId,
    details: { assetCount: assetsRes.rows.length },
  });

  return getAuditCycle(cycleId);
}

async function updateAuditItem(cycleId, itemId, payload, user) {
  const cRes = await query(`SELECT status FROM audit_cycles WHERE id = $1`, [cycleId]);
  if (cRes.rows.length === 0) {
    throw new NotFoundError('Audit cycle not found');
  }
  if (cRes.rows[0].status === 'Closed') {
    throw new BadRequestError('Cannot update items on a closed audit cycle.');
  }

  // GLOBAL CONSTRAINT 6: Verify user is an assigned auditor on this audit cycle
  const audCheck = await query(
    `SELECT 1 FROM audit_cycle_auditors WHERE audit_cycle_id = $1 AND auditor_id = $2`,
    [cycleId, user.id]
  );
  if (audCheck.rows.length === 0) {
    throw new ForbiddenError('You are not an assigned auditor on this audit cycle.');
  }

  const iRes = await query(`SELECT locked FROM audit_items WHERE id = $1 AND audit_cycle_id = $2`, [
    itemId,
    cycleId,
  ]);
  if (iRes.rows.length === 0) {
    throw new NotFoundError('Audit item not found');
  }
  if (iRes.rows[0].locked) {
    throw new BadRequestError('Audit item is locked from further edits.');
  }

  const { verificationStatus, notes = null } = payload;

  const updated = await query(
    `UPDATE audit_items
     SET verification_status = $1, notes = $2, verified_by = $3, verified_at = NOW()
     WHERE id = $4 RETURNING *`,
    [verificationStatus, notes, user.id, itemId]
  );

  await logActivity({
    userId: user.id,
    action: `Verified audit item ${itemId} as '${verificationStatus}'`,
    entityType: 'AuditItem',
    entityId: itemId,
    details: { verificationStatus, notes },
  });

  return updated.rows[0];
}

async function closeAuditCycle(cycleId, user) {
  if (!['Admin', 'AssetManager'].includes(user.role)) {
    throw new ForbiddenError('Only Admin or Asset Manager can close audit cycles.');
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const cRes = await client.query(`SELECT * FROM audit_cycles WHERE id = $1 FOR UPDATE`, [cycleId]);
    if (cRes.rows.length === 0) {
      throw new NotFoundError('Audit cycle not found');
    }
    const cycle = cRes.rows[0];

    if (cycle.status === 'Closed') {
      throw new BadRequestError('Audit cycle is already closed.');
    }

    // 1. Lock all audit_items on this cycle
    await client.query(`UPDATE audit_items SET locked = true WHERE audit_cycle_id = $1`, [cycleId]);

    // 2. GLOBAL CONSTRAINT 6: Auto-transition any asset with final 'Missing' verification to status = 'Lost'
    const missingRes = await client.query(
      `SELECT asset_id, notes FROM audit_items WHERE audit_cycle_id = $1 AND verification_status = 'Missing'`,
      [cycleId]
    );

    for (const item of missingRes.rows) {
      await client.query(
        `UPDATE assets SET status = 'Lost', updated_at = NOW() WHERE id = $1`,
        [item.asset_id]
      );
    }

    // 3. Auto-generate discrepancy_reports for every item with status Missing or Damaged
    const flagRes = await client.query(
      `SELECT asset_id, verification_status, notes FROM audit_items
       WHERE audit_cycle_id = $1 AND verification_status IN ('Missing', 'Damaged')`,
      [cycleId]
    );

    for (const flag of flagRes.rows) {
      await client.query(
        `INSERT INTO discrepancy_reports (audit_cycle_id, asset_id, issue_type, description, resolved)
         VALUES ($1, $2, $3, $4, false)`,
        [cycleId, flag.asset_id, flag.verification_status, flag.notes || `Flagged as ${flag.verification_status} during audit`]
      );
    }

    // 4. Mark cycle closed
    await client.query(
      `UPDATE audit_cycles SET status = 'Closed', closed_at = NOW() WHERE id = $1`,
      [cycleId]
    );

    await logActivity(
      {
        userId: user.id,
        action: `Closed audit cycle: ${cycle.name} (${missingRes.rows.length} assets marked Lost, ${flagRes.rows.length} discrepancy reports created)`,
        entityType: 'AuditCycle',
        entityId: cycleId,
        details: { missingCount: missingRes.rows.length, discrepancyCount: flagRes.rows.length },
      },
      client
    );

    await client.query('COMMIT');
    return getAuditCycle(cycleId);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function getDiscrepancies(cycleId) {
  const res = await query(
    `SELECT r.*,
            a.asset_tag, a.name AS asset_name, a.status AS asset_status
     FROM discrepancy_reports r
     JOIN assets a ON r.asset_id = a.id
     WHERE r.audit_cycle_id = $1
     ORDER BY r.created_at DESC`,
    [cycleId]
  );
  return res.rows;
}

module.exports = {
  listAuditCycles,
  getAuditCycle,
  createAuditCycle,
  assignAuditors,
  startAuditCycle,
  updateAuditItem,
  closeAuditCycle,
  getDiscrepancies,
};
