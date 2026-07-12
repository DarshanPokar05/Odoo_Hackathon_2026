const { query } = require('../../config/db');
const { sendPaginated, sendSuccess } = require('../../utils/response');
const { BadRequestError, NotFoundError } = require('../../utils/errors');
const { z } = require('zod');

async function listEmployees(req, res, next) {
  try {
    const { page = 1, limit = 20, departmentId, role, status, search } = req.query;
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 20;
    const offset = (pageNum - 1) * limitNum;

    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (departmentId) {
      conditions.push(`u.department_id = $${paramIndex++}`);
      params.push(departmentId);
    }
    if (role) {
      conditions.push(`u.role = $${paramIndex++}`);
      params.push(role);
    }
    if (status) {
      conditions.push(`u.status = $${paramIndex++}`);
      params.push(status);
    }
    if (search) {
      conditions.push(`(LOWER(u.name) LIKE $${paramIndex} OR LOWER(u.email) LIKE $${paramIndex})`);
      params.push(`%${search.toLowerCase()}%`);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await query(`SELECT COUNT(*) FROM users u ${whereClause}`, params);
    const total = Number(countRes.rows[0].count);

    const sql = `
      SELECT u.id, u.name, u.email, u.role, u.status, u.department_id, d.name AS department_name, u.created_at
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      ${whereClause}
      ORDER BY u.created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

    const resData = await query(sql, [...params, limitNum, offset]);

    return sendPaginated(res, resData.rows, total, pageNum, limitNum);
  } catch (err) {
    next(err);
  }
}

const roleSchema = z.object({
  role: z.enum(['Admin', 'AssetManager', 'DepartmentHead', 'Employee']),
  departmentId: z.string().uuid().optional().nullable(),
});

async function updateEmployeeRole(req, res, next) {
  try {
    const { id } = req.params;
    const { role, departmentId } = roleSchema.parse(req.body);

    const checkRes = await query('SELECT id, name, role, department_id FROM users WHERE id = $1', [id]);
    if (checkRes.rows.length === 0) {
      throw new NotFoundError('Employee not found');
    }

    const targetDeptId = departmentId || checkRes.rows[0].department_id;

    if (role === 'DepartmentHead' && !targetDeptId) {
      throw new BadRequestError('Promoting to Department Head requires a target Department.');
    }

    // Update user's role (and department_id if provided)
    const updatedRes = await query(
      `UPDATE users SET role = $1, department_id = COALESCE($2, department_id), updated_at = NOW()
       WHERE id = $3
       RETURNING id, name, email, role, department_id, status`,
      [role, targetDeptId || null, id]
    );

    // If promoted to Department Head, set that department's head_user_id to this user per spec
    if (role === 'DepartmentHead' && targetDeptId) {
      await query(`UPDATE departments SET head_user_id = $1 WHERE id = $2`, [id, targetDeptId]);
    }

    return sendSuccess(res, { user: updatedRes.rows[0] });
  } catch (err) {
    next(err);
  }
}

const statusSchema = z.object({
  status: z.enum(['Active', 'Inactive']),
});

async function updateEmployeeStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = statusSchema.parse(req.body);

    const checkRes = await query('SELECT id FROM users WHERE id = $1', [id]);
    if (checkRes.rows.length === 0) {
      throw new NotFoundError('Employee not found');
    }

    const updatedRes = await query(
      `UPDATE users SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING id, name, email, role, department_id, status`,
      [status, id]
    );

    return sendSuccess(res, { user: updatedRes.rows[0] });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listEmployees,
  updateEmployeeRole,
  updateEmployeeStatus,
};
