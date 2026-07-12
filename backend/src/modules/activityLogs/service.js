const { query } = require('../../config/db');

async function listActivityLogs(filters = {}) {
  const { user_id, entity_type, limit = 50, page = 1 } = filters;
  const pageNum = Number(page) || 1;
  const limitNum = Number(limit) || 50;
  const offset = (pageNum - 1) * limitNum;

  const conditions = [];
  const params = [];
  let paramIndex = 1;

  if (user_id) {
    conditions.push(`l.user_id = $${paramIndex++}`);
    params.push(user_id);
  }
  if (entity_type) {
    conditions.push(`l.entity_type = $${paramIndex++}`);
    params.push(entity_type);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countRes = await query(`SELECT COUNT(*) FROM activity_logs l ${whereClause}`, params);
  const total = Number(countRes.rows[0].count);

  const res = await query(
    `SELECT l.*, u.name AS user_name, u.email AS user_email, u.role AS user_role
     FROM activity_logs l
     LEFT JOIN users u ON l.user_id = u.id
     ${whereClause}
     ORDER BY l.created_at DESC
     LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
    [...params, limitNum, offset]
  );

  return {
    items: res.rows,
    total,
    page: pageNum,
    limit: limitNum,
  };
}

module.exports = { listActivityLogs };
