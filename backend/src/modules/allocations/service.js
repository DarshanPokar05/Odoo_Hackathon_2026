const { query, getClient } = require('../../config/db');
const { BadRequestError, NotFoundError, ForbiddenError } = require('../../utils/errors');

class ConflictError extends Error {
  constructor(message, currentHolder) {
    super(message);
    this.name = 'ConflictError';
    this.statusCode = 409;
    this.code = 'ASSET_ALREADY_ALLOCATED';
    this.currentHolder = currentHolder;
    this.offerTransfer = true;
  }
}

async function getActiveAllocationHolder(assetId) {
  const sql = `
    SELECT al.id AS allocation_id, u.id AS user_id, u.name, u.email, d.name AS department_name
    FROM allocations al
    JOIN users u ON al.employee_id = u.id
    LEFT JOIN departments d ON u.department_id = d.id
    WHERE al.asset_id = $1 AND al.status = 'Active'
    LIMIT 1
  `;
  const res = await query(sql, [assetId]);
  if (res.rows.length === 0) return null;
  const row = res.rows[0];
  return {
    id: row.user_id,
    name: row.name || row.email,
    email: row.email,
    departmentName: row.department_name || 'Unassigned',
  };
}

async function listAllocations(filters = {}) {
  const { assetId, employeeId, departmentId, status, page = 1, limit = 20 } = filters;
  const pageNum = Number(page) || 1;
  const limitNum = Number(limit) || 20;
  const offset = (pageNum - 1) * limitNum;

  const conditions = [];
  const params = [];
  let paramIndex = 1;

  if (assetId) {
    conditions.push(`al.asset_id = $${paramIndex++}`);
    params.push(assetId);
  }
  if (employeeId) {
    conditions.push(`al.employee_id = $${paramIndex++}`);
    params.push(employeeId);
  }
  if (departmentId) {
    conditions.push(`al.department_id = $${paramIndex++}`);
    params.push(departmentId);
  }
  if (status) {
    conditions.push(`al.status = $${paramIndex++}`);
    params.push(status);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countRes = await query(`SELECT COUNT(*) FROM allocations al ${whereClause}`, params);
  const total = Number(countRes.rows[0].count);

  const sql = `
    SELECT al.*,
           a.asset_tag, a.name AS asset_name, a.serial_number,
           u.name AS employee_name, u.email AS employee_email,
           d.name AS department_name
    FROM allocations al
    JOIN assets a ON al.asset_id = a.id
    JOIN users u ON al.employee_id = u.id
    LEFT JOIN departments d ON al.department_id = d.id
    ${whereClause}
    ORDER BY al.allocated_date DESC, al.id DESC
    LIMIT $${paramIndex++} OFFSET $${paramIndex++}
  `;

  const rowsRes = await query(sql, [...params, limitNum, offset]);
  return { items: rowsRes.rows, total };
}

async function listOverdueAllocations() {
  const sql = `
    SELECT al.*,
           a.asset_tag, a.name AS asset_name,
           u.name AS employee_name, u.email AS employee_email,
           d.name AS department_name
    FROM allocations al
    JOIN assets a ON al.asset_id = a.id
    JOIN users u ON al.employee_id = u.id
    LEFT JOIN departments d ON al.department_id = d.id
    WHERE al.status = 'Active' AND al.expected_return_date < CURRENT_DATE
    ORDER BY al.expected_return_date ASC
  `;
  const res = await query(sql);
  return res.rows;
}

async function createAllocation(data, creatorUser) {
  const { assetId, employeeId, expectedReturnDate } = data;

  // 1. Check if asset exists and terminal state
  const assetRes = await query(`SELECT id, asset_tag, name, status FROM assets WHERE id = $1`, [
    assetId,
  ]);
  if (assetRes.rows.length === 0) {
    throw new NotFoundError('Asset not found');
  }

  const asset = assetRes.rows[0];
  if (['Lost', 'Retired', 'Disposed'].includes(asset.status)) {
    throw new BadRequestError(`Cannot allocate asset in terminal state '${asset.status}'.`);
  }

  // 2. Service layer conflict check (Global Constraint 3)
  const holder = await getActiveAllocationHolder(assetId);
  if (holder) {
    throw new ConflictError(`Currently held by ${holder.name}`, holder);
  }

  // 3. Fetch target employee's department
  const empRes = await query(`SELECT id, name, department_id FROM users WHERE id = $1`, [
    employeeId,
  ]);
  if (empRes.rows.length === 0) {
    throw new NotFoundError('Target employee not found');
  }
  const employee = empRes.rows[0];

  const client = await getClient();
  try {
    await client.query('BEGIN');

    const insertRes = await client.query(
      `INSERT INTO allocations (asset_id, employee_id, department_id, allocated_date, expected_return_date, status)
       VALUES ($1, $2, $3, CURRENT_DATE, $4, 'Active')
       RETURNING *`,
      [assetId, employeeId, employee.department_id || null, expectedReturnDate || null]
    );

    await client.query(`UPDATE assets SET status = 'Allocated', updated_at = NOW() WHERE id = $1`, [
      assetId,
    ]);

    // Activity log & Notification
    await client.query(
      `INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
       VALUES ($1, $2, 'Allocation', $3, $4::jsonb)`,
      [
        creatorUser?.id || null,
        `Asset ${asset.asset_tag} allocated to ${employee.name}`,
        insertRes.rows[0].id,
        JSON.stringify({ asset_tag: asset.asset_tag, employee_id: employeeId }),
      ]
    );

    await client.query(
      `INSERT INTO notifications (user_id, title, message, type)
       VALUES ($1, $2, $3, 'ALLOCATION_CREATED')`,
      [
        employeeId,
        `New Asset Assigned: ${asset.asset_tag}`,
        `You have been allocated asset ${asset.asset_tag} (${asset.name}).`,
      ]
    );

    await client.query('COMMIT');
    return insertRes.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');

    // 4. Second line of defense: catch DB unique constraint violation SQLSTATE 23505
    if (err.code === '23505') {
      const currentHolder = (await getActiveAllocationHolder(assetId)) || {
        id: 'unknown',
        name: 'Another User',
        email: 'unknown',
        departmentName: 'Unknown',
      };
      throw new ConflictError(`Currently held by ${currentHolder.name}`, currentHolder);
    }
    throw err;
  } finally {
    client.release();
  }
}

async function returnAllocation(id, conditionNotes, user) {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const allocRes = await client.query(
      `SELECT al.*, a.asset_tag, a.name AS asset_name, u.name AS emp_name
       FROM allocations al
       JOIN assets a ON al.asset_id = a.id
       JOIN users u ON al.employee_id = u.id
       WHERE al.id = $1 FOR UPDATE`,
      [id]
    );

    if (allocRes.rows.length === 0) {
      throw new NotFoundError('Allocation not found');
    }

    const alloc = allocRes.rows[0];
    if (alloc.status !== 'Active') {
      throw new BadRequestError('Allocation is already closed/returned.');
    }

    const updatedAllocRes = await client.query(
      `UPDATE allocations
       SET status = 'Returned', actual_return_date = CURRENT_DATE, condition_checkin_notes = $1
       WHERE id = $2
       RETURNING *`,
      [conditionNotes || 'Good', id]
    );

    await client.query(`UPDATE assets SET status = 'Available', updated_at = NOW() WHERE id = $1`, [
      alloc.asset_id,
    ]);

    await client.query(
      `INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
       VALUES ($1, $2, 'Allocation', $3, $4::jsonb)`,
      [
        user?.id || null,
        `Asset ${alloc.asset_tag} returned by ${alloc.emp_name} (Condition: ${conditionNotes || 'Good'})`,
        id,
        JSON.stringify({ asset_tag: alloc.asset_tag, condition: conditionNotes || 'Good' }),
      ]
    );

    await client.query('COMMIT');
    return updatedAllocRes.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// ==========================================
// TRANSFER REQUESTS
// ==========================================

async function listTransferRequests(filters = {}) {
  const { assetId, status } = filters;
  const conditions = [];
  const params = [];
  let paramIndex = 1;

  if (assetId) {
    conditions.push(`tr.asset_id = $${paramIndex++}`);
    params.push(assetId);
  }
  if (status) {
    conditions.push(`tr.status = $${paramIndex++}`);
    params.push(status);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const sql = `
    SELECT tr.*,
           a.asset_tag, a.name AS asset_name,
           u_by.name AS requested_by_name, u_by.email AS requested_by_email,
           u_to.name AS requested_to_name, u_to.email AS requested_to_email
    FROM transfer_requests tr
    JOIN assets a ON tr.asset_id = a.id
    JOIN users u_by ON tr.requested_by = u_by.id
    JOIN users u_to ON tr.requested_to = u_to.id
    ${whereClause}
    ORDER BY tr.created_at DESC
  `;
  const res = await query(sql, params);
  return res.rows;
}

async function createTransferRequest(data, user) {
  const { assetId, requestedToUserId, reason } = data;

  const assetRes = await query(`SELECT id, asset_tag, name FROM assets WHERE id = $1`, [assetId]);
  if (assetRes.rows.length === 0) {
    throw new NotFoundError('Asset not found');
  }

  const targetRes = await query(`SELECT id, name FROM users WHERE id = $1`, [requestedToUserId]);
  if (targetRes.rows.length === 0) {
    throw new NotFoundError('Target recipient employee not found');
  }

  const insertRes = await query(
    `INSERT INTO transfer_requests (asset_id, requested_by, requested_to, reason, status)
     VALUES ($1, $2, $3, $4, 'Requested')
     RETURNING *`,
    [assetId, user.id, requestedToUserId, reason || 'Asset transfer requested']
  );

  await query(
    `INSERT INTO notifications (user_id, title, message, type)
     VALUES ($1, $2, $3, 'TRANSFER_REQUESTED')`,
    [
      requestedToUserId,
      `Transfer Request: ${assetRes.rows[0].asset_tag}`,
      `${user.name || user.email} requested to transfer asset ${assetRes.rows[0].asset_tag} to you.`,
    ]
  );

  return insertRes.rows[0];
}

async function approveTransferRequest(transferId, user) {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const transferRes = await client.query(
      `SELECT tr.*, a.asset_tag, a.name AS asset_name, u_to.name AS to_name, u_to.department_id AS to_dept_id
       FROM transfer_requests tr
       JOIN assets a ON tr.asset_id = a.id
       JOIN users u_to ON tr.requested_to = u_to.id
       WHERE tr.id = $1 FOR UPDATE`,
      [transferId]
    );

    if (transferRes.rows.length === 0) {
      throw new NotFoundError('Transfer request not found');
    }

    const transfer = transferRes.rows[0];
    if (transfer.status !== 'Requested') {
      throw new BadRequestError(`Transfer request is already '${transfer.status}'.`);
    }

    // 1. Close current active allocation
    await client.query(
      `UPDATE allocations
       SET status = 'Returned', actual_return_date = CURRENT_DATE,
           condition_checkin_notes = 'Transferred directly to ' || $1
       WHERE asset_id = $2 AND status = 'Active'`,
      [transfer.to_name, transfer.asset_id]
    );

    // 2. Open new allocation for requested_to
    const newAllocRes = await client.query(
      `INSERT INTO allocations (asset_id, employee_id, department_id, allocated_date, status)
       VALUES ($1, $2, $3, CURRENT_DATE, 'Active')
       RETURNING *`,
      [transfer.asset_id, transfer.requested_to, transfer.to_dept_id || null]
    );

    // 3. Mark transfer Completed
    const updatedTransferRes = await client.query(
      `UPDATE transfer_requests SET status = 'Completed', updated_at = NOW() WHERE id = $1 RETURNING *`,
      [transferId]
    );

    // 4. Ensure asset status is Allocated
    await client.query(`UPDATE assets SET status = 'Allocated', updated_at = NOW() WHERE id = $1`, [
      transfer.asset_id,
    ]);

    await client.query(
      `INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
       VALUES ($1, $2, 'Transfer', $3, $4::jsonb)`,
      [
        user.id,
        `Transfer approved: Asset ${transfer.asset_tag} transferred to ${transfer.to_name}`,
        transferId,
        JSON.stringify({ asset_tag: transfer.asset_tag, to: transfer.requested_to }),
      ]
    );

    await client.query('COMMIT');
    return { transfer: updatedTransferRes.rows[0], newAllocation: newAllocRes.rows[0] };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function rejectTransferRequest(transferId, user) {
  const check = await query(`SELECT id, status FROM transfer_requests WHERE id = $1`, [transferId]);
  if (check.rows.length === 0) {
    throw new NotFoundError('Transfer request not found');
  }
  if (check.rows[0].status !== 'Requested') {
    throw new BadRequestError(`Transfer request is already '${check.rows[0].status}'.`);
  }

  const updated = await query(
    `UPDATE transfer_requests SET status = 'Rejected', updated_at = NOW() WHERE id = $1 RETURNING *`,
    [transferId]
  );
  return updated.rows[0];
}

module.exports = {
  ConflictError,
  getActiveAllocationHolder,
  listAllocations,
  listOverdueAllocations,
  createAllocation,
  returnAllocation,
  listTransferRequests,
  createTransferRequest,
  approveTransferRequest,
  rejectTransferRequest,
};
