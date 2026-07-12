const { query } = require('../../config/db');
const { sendPaginated, sendSuccess } = require('../../utils/response');
const { BadRequestError, NotFoundError } = require('../../utils/errors');
const { z } = require('zod');

async function listDepartments(req, res, next) {
  try {
    const { status } = req.query;
    let sql = `
      SELECT d.id, d.name, d.head_user_id, u.name AS head_name, u.email AS head_email,
             d.parent_department_id, pd.name AS parent_department_name, d.status, d.created_at
      FROM departments d
      LEFT JOIN users u ON d.head_user_id = u.id
      LEFT JOIN departments pd ON d.parent_department_id = pd.id
    `;
    const params = [];

    if (status) {
      sql += ` WHERE d.status = $1`;
      params.push(status);
    }

    sql += ` ORDER BY d.name ASC`;

    const result = await query(sql, params);
    return sendSuccess(res, { departments: result.rows });
  } catch (err) {
    next(err);
  }
}

// Helper function to build tree hierarchy recursively
function buildTree(items, parentId = null) {
  return items
    .filter((item) => item.parent_department_id === parentId)
    .map((item) => ({
      ...item,
      children: buildTree(items, item.id),
    }));
}

async function getDepartmentTree(req, res, next) {
  try {
    const result = await query(`
      SELECT d.id, d.name, d.head_user_id, u.name AS head_name, u.email AS head_email,
             d.parent_department_id, d.status, d.created_at
      FROM departments d
      LEFT JOIN users u ON d.head_user_id = u.id
      ORDER BY d.name ASC
    `);

    const tree = buildTree(result.rows, null);
    return sendSuccess(res, { tree });
  } catch (err) {
    next(err);
  }
}

const deptSchema = z.object({
  name: z.string().min(1),
  headUserId: z.string().uuid().optional().nullable().or(z.literal('')).transform(val => val === '' ? null : val),
  parentDepartmentId: z.string().uuid().optional().nullable().or(z.literal('')).transform(val => val === '' ? null : val),
  status: z.enum(['Active', 'Inactive']).optional().default('Active'),
});

async function createDepartment(req, res, next) {
  try {
    const validated = deptSchema.parse(req.body);

    // Ensure name uniqueness
    const existing = await query('SELECT id FROM departments WHERE LOWER(name) = LOWER($1)', [
      validated.name,
    ]);
    if (existing.rows.length > 0) {
      throw new BadRequestError('Department with this name already exists.');
    }

    // If headUserId provided, ensure or promote target user to DepartmentHead
    if (validated.headUserId) {
      await query(
        `UPDATE users SET role = 'DepartmentHead', updated_at = NOW()
         WHERE id = $1 AND role = 'Employee'`,
        [validated.headUserId]
      );
    }

    const insertRes = await query(
      `INSERT INTO departments (name, head_user_id, parent_department_id, status)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [
        validated.name,
        validated.headUserId || null,
        validated.parentDepartmentId || null,
        validated.status || 'Active',
      ]
    );

    const newDept = insertRes.rows[0];

    // If headUserId provided, update their department_id to point to this new department
    if (validated.headUserId) {
      await query(`UPDATE users SET department_id = $1 WHERE id = $2`, [
        newDept.id,
        validated.headUserId,
      ]);
    }

    return sendSuccess(res, { department: newDept }, 201);
  } catch (err) {
    next(err);
  }
}

async function updateDepartment(req, res, next) {
  try {
    const { id } = req.params;
    const validated = deptSchema.parse(req.body);

    const check = await query('SELECT id FROM departments WHERE id = $1', [id]);
    if (check.rows.length === 0) {
      throw new NotFoundError('Department not found');
    }

    // Prevent circular reference
    if (validated.parentDepartmentId === id) {
      throw new BadRequestError('A department cannot be its own parent.');
    }

    // Ensure name uniqueness against other depts
    const existing = await query(
      'SELECT id FROM departments WHERE LOWER(name) = LOWER($1) AND id <> $2',
      [validated.name, id]
    );
    if (existing.rows.length > 0) {
      throw new BadRequestError('Department name already in use.');
    }

    if (validated.headUserId) {
      await query(
        `UPDATE users SET role = 'DepartmentHead', department_id = $1, updated_at = NOW()
         WHERE id = $2`,
        [id, validated.headUserId]
      );
    }

    const updated = await query(
      `UPDATE departments
       SET name = $1, head_user_id = $2, parent_department_id = $3, status = $4
       WHERE id = $5
       RETURNING *`,
      [
        validated.name,
        validated.headUserId || null,
        validated.parentDepartmentId || null,
        validated.status || 'Active',
        id,
      ]
    );

    return sendSuccess(res, { department: updated.rows[0] });
  } catch (err) {
    next(err);
  }
}

const statusSchema = z.object({
  status: z.enum(['Active', 'Inactive']),
});

async function updateDepartmentStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = statusSchema.parse(req.body);

    const check = await query('SELECT id FROM departments WHERE id = $1', [id]);
    if (check.rows.length === 0) {
      throw new NotFoundError('Department not found');
    }

    // Deactivating must NOT cascade delete; just flips status
    const updated = await query(
      `UPDATE departments SET status = $1 WHERE id = $2 RETURNING *`,
      [status, id]
    );

    return sendSuccess(res, { department: updated.rows[0] });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listDepartments,
  getDepartmentTree,
  createDepartment,
  updateDepartment,
  updateDepartmentStatus,
};
