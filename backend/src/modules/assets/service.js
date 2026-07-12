const { query, getClient } = require('../../config/db');
const { BadRequestError, NotFoundError, ForbiddenError } = require('../../utils/errors');

const ALLOWED_STATE_TRANSITIONS = {
  Available: ['Allocated', 'Reserved', 'Under Maintenance', 'Lost', 'Retired', 'Disposed'],
  Allocated: ['Available', 'Under Maintenance', 'Lost', 'Disposed'],
  Reserved: ['Available', 'Allocated', 'Disposed'],
  'Under Maintenance': ['Available', 'Disposed'],
  Lost: ['Disposed'],
  Retired: ['Disposed'],
  Disposed: [],
};

function validateCustomFields(schemaFields, inputFields = {}) {
  let fields = schemaFields;
  if (typeof fields === 'string') {
    try { fields = JSON.parse(fields); } catch (e) { fields = []; }
  }
  if (!Array.isArray(fields) || fields.length === 0) {
    return inputFields;
  }

  for (const field of fields) {
    const { field_name, field_type, required } = field;
    const value = inputFields[field_name];

    if (required && (value === undefined || value === null || value === '')) {
      throw new BadRequestError(`Custom field '${field_name}' is required for this asset category.`);
    }

    if (value !== undefined && value !== null && value !== '') {
      if (field_type === 'number' && isNaN(Number(value))) {
        throw new BadRequestError(`Custom field '${field_name}' must be a valid number.`);
      }
      if (field_type === 'boolean' && typeof value !== 'boolean' && value !== 'true' && value !== 'false') {
        throw new BadRequestError(`Custom field '${field_name}' must be a boolean.`);
      }
    }
  }

  return inputFields;
}

async function listAssets(filters = {}) {
  const {
    page = 1,
    limit = 20,
    search,
    categoryId,
    status,
    departmentId,
    location,
    isBookable,
  } = filters;

  const pageNum = Number(page) || 1;
  const limitNum = Number(limit) || 20;
  const offset = (pageNum - 1) * limitNum;

  const conditions = [];
  const params = [];
  let paramIndex = 1;

  if (search) {
    conditions.push(
      `(LOWER(a.asset_tag) LIKE $${paramIndex} OR LOWER(a.name) LIKE $${paramIndex} OR LOWER(COALESCE(a.serial_number, '')) LIKE $${paramIndex} OR LOWER(COALESCE(a.qr_code, '')) LIKE $${paramIndex})`
    );
    params.push(`%${search.toLowerCase()}%`);
    paramIndex++;
  }

  if (categoryId) {
    conditions.push(`a.category_id = $${paramIndex++}`);
    params.push(categoryId);
  }

  if (status) {
    conditions.push(`a.status = $${paramIndex++}`);
    params.push(status);
  }

  if (departmentId) {
    conditions.push(`a.department_id = $${paramIndex++}`);
    params.push(departmentId);
  }

  if (location) {
    conditions.push(`LOWER(a.location) LIKE $${paramIndex++}`);
    params.push(`%${location.toLowerCase()}%`);
  }

  if (isBookable !== undefined && isBookable !== '') {
    conditions.push(`a.is_bookable = $${paramIndex++}`);
    params.push(isBookable === 'true' || isBookable === true);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countRes = await query(`SELECT COUNT(*) FROM assets a ${whereClause}`, params);
  const total = Number(countRes.rows[0].count);

  const sql = `
    SELECT a.*,
           c.name AS category_name,
           d.name AS department_name,
           al.employee_id AS current_holder_id,
           u.name AS current_holder_name,
           u.email AS current_holder_email
    FROM assets a
    LEFT JOIN asset_categories c ON a.category_id = c.id
    LEFT JOIN departments d ON a.department_id = d.id
    LEFT JOIN allocations al ON al.asset_id = a.id AND al.status = 'Active'
    LEFT JOIN users u ON al.employee_id = u.id
    ${whereClause}
    ORDER BY a.asset_tag ASC
    LIMIT $${paramIndex++} OFFSET $${paramIndex++}
  `;

  const rowsRes = await query(sql, [...params, limitNum, offset]);
  return { items: rowsRes.rows, total };
}

async function getAssetById(id) {
  const sql = `
    SELECT a.*,
           c.name AS category_name,
           c.custom_fields AS category_custom_fields_schema,
           d.name AS department_name,
           al.id AS current_allocation_id,
           al.employee_id AS current_holder_id,
           u.name AS current_holder_name,
           u.email AS current_holder_email,
           hd.name AS current_holder_department
    FROM assets a
    LEFT JOIN asset_categories c ON a.category_id = c.id
    LEFT JOIN departments d ON a.department_id = d.id
    LEFT JOIN allocations al ON al.asset_id = a.id AND al.status = 'Active'
    LEFT JOIN users u ON al.employee_id = u.id
    LEFT JOIN departments hd ON u.department_id = hd.id
    WHERE a.id::text = $1 OR a.asset_tag = $1
  `;
  const result = await query(sql, [id]);
  if (result.rows.length === 0) {
    throw new NotFoundError('Asset not found');
  }

  const row = result.rows[0];
  return {
    ...row,
    currentHolder: row.current_holder_id
      ? {
          allocationId: row.current_allocation_id,
          id: row.current_holder_id,
          name: row.current_holder_name,
          email: row.current_holder_email,
          departmentName: row.current_holder_department,
        }
      : null,
  };
}

async function createAsset(data, creatorUser) {
  const {
    name,
    categoryId,
    serialNumber,
    location,
    departmentId,
    isBookable = false,
    customFields = {},
  } = data;

  // 1. Fetch category schema
  const catRes = await query(`SELECT id, name, custom_fields FROM asset_categories WHERE id = $1`, [
    categoryId,
  ]);
  if (catRes.rows.length === 0) {
    throw new BadRequestError('Invalid category ID provided.');
  }
  const categorySchema = catRes.rows[0].custom_fields || [];

  // 2. Validate custom fields against schema
  const validatedCustomFields = validateCustomFields(categorySchema, customFields);

  const client = await getClient();
  try {
    await client.query('BEGIN');

    // 3. Auto-generate asset_tag via Postgres sequence
    const seqRes = await client.query(`SELECT nextval('asset_tag_seq') AS seq`);
    const seqVal = seqRes.rows[0].seq;
    const assetTag = `AF-${String(seqVal).padStart(4, '0')}`;

    // 4. QR code value
    const qrCode = `${assetTag} | ${name} | SN: ${serialNumber || 'N/A'}`;

    const insertRes = await client.query(
      `INSERT INTO assets (asset_tag, name, category_id, serial_number, location, status, is_bookable, department_id, custom_fields, qr_code)
       VALUES ($1, $2, $3, $4, $5, 'Available', $6, $7, $8::jsonb, $9)
       RETURNING *`,
      [
        assetTag,
        name,
        categoryId,
        serialNumber || null,
        location || 'HQ Store Room',
        isBookable,
        departmentId || null,
        JSON.stringify(validatedCustomFields),
        qrCode,
      ]
    );

    const newAsset = insertRes.rows[0];

    // Log activity
    await client.query(
      `INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
       VALUES ($1, $2, 'Asset', $3, $4::jsonb)`,
      [
        creatorUser?.id || null,
        `Asset ${assetTag} (${name}) registered`,
        newAsset.id,
        JSON.stringify({ asset_tag: assetTag, category: catRes.rows[0].name }),
      ]
    );

    await client.query('COMMIT');
    return newAsset;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function updateAssetStatus(id, newStatus, user) {
  const assetRes = await query(`SELECT id, asset_tag, status FROM assets WHERE id = $1`, [id]);
  if (assetRes.rows.length === 0) {
    throw new NotFoundError('Asset not found');
  }

  const currentStatus = assetRes.rows[0].status;

  // Terminal state check
  if (['Lost', 'Retired', 'Disposed'].includes(currentStatus) && newStatus !== 'Disposed') {
    throw new BadRequestError(
      `Illegal asset status transition from '${currentStatus}' to '${newStatus}'. '${currentStatus}' is a terminal state.`
    );
  }

  const allowed = ALLOWED_STATE_TRANSITIONS[currentStatus] || [];
  if (!allowed.includes(newStatus)) {
    throw new BadRequestError(
      `Illegal asset status transition from '${currentStatus}' to '${newStatus}'. Allowed transitions from '${currentStatus}': [${allowed.join(', ')}]`
    );
  }

  // Disposed requires Admin / AssetManager
  if (newStatus === 'Disposed' && !['Admin', 'AssetManager'].includes(user?.role)) {
    throw new ForbiddenError("Only Admin or Asset Manager can transition an asset to 'Disposed'.");
  }

  const updated = await query(
    `UPDATE assets SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
    [newStatus, id]
  );

  await query(
    `INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
     VALUES ($1, $2, 'Asset', $3, $4::jsonb)`,
    [
      user?.id || null,
      `Asset ${assetRes.rows[0].asset_tag} status updated from '${currentStatus}' to '${newStatus}'`,
      id,
      JSON.stringify({ oldStatus: currentStatus, newStatus }),
    ]
  );

  return updated.rows[0];
}

async function getAssetHistory(id) {
  const assetRes = await query(`SELECT id, asset_tag, name FROM assets WHERE id::text = $1 OR asset_tag = $1`, [id]);
  if (assetRes.rows.length === 0) {
    throw new NotFoundError('Asset not found');
  }

  const assetId = assetRes.rows[0].id;

  // Combined allocation history + maintenance history, chronological
  const allocRes = await query(
    `SELECT al.id, al.allocated_date AS event_date,
            CASE
              WHEN al.status = 'Returned' THEN 'Returned by ' || u.name || ' (Condition: ' || COALESCE(al.condition_checkin_notes, 'Good') || ')'
              ELSE 'Allocated to ' || u.name || ' (' || COALESCE(d.name, 'No Dept') || ')'
            END AS action_summary,
            'Allocation' AS event_type,
            u.name AS person_name,
            al.condition_checkin_notes AS notes
     FROM allocations al
     LEFT JOIN users u ON al.employee_id = u.id
     LEFT JOIN departments d ON al.department_id = d.id
     WHERE al.asset_id = $1`,
    [assetId]
  );

  const maintRes = await query(
    `SELECT m.id, m.created_at AS event_date,
            'Maintenance Request (' || m.status || ')' AS action_summary,
            'Maintenance' AS event_type,
            u.name AS person_name,
            m.issue_description AS notes
     FROM maintenance_requests m
     LEFT JOIN users u ON m.raised_by = u.id
     WHERE m.asset_id = $1`,
    [assetId]
  );

  const history = [...allocRes.rows, ...maintRes.rows].sort((a, b) => {
    return new Date(b.event_date) - new Date(a.event_date);
  });

  return {
    asset: assetRes.rows[0],
    history,
  };
}

module.exports = {
  listAssets,
  getAssetById,
  createAsset,
  updateAssetStatus,
  getAssetHistory,
};
