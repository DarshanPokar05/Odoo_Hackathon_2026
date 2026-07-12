const { query } = require('../../config/db');
const { sendSuccess } = require('../../utils/response');
const { BadRequestError, NotFoundError } = require('../../utils/errors');
const { z } = require('zod');

async function listCategories(req, res, next) {
  try {
    const result = await query(`
      SELECT c.id, c.name, c.custom_fields, c.created_at,
             COUNT(a.id)::int AS asset_count
      FROM asset_categories c
      LEFT JOIN assets a ON a.category_id = c.id
      GROUP BY c.id
      ORDER BY c.name ASC
    `);

    return sendSuccess(res, { categories: result.rows });
  } catch (err) {
    next(err);
  }
}

async function getCategoryById(req, res, next) {
  try {
    const { id } = req.params;
    const result = await query(`SELECT * FROM asset_categories WHERE id = $1`, [id]);
    if (result.rows.length === 0) {
      throw new NotFoundError('Category not found');
    }
    return sendSuccess(res, { category: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

const customFieldSchema = z.object({
  field_name: z.string().min(1),
  field_type: z.enum(['text', 'number', 'date', 'boolean']),
  required: z.boolean().default(false),
});

const categorySchema = z.object({
  name: z.string().min(1),
  customFields: z.array(customFieldSchema).optional().default([]),
});

async function createCategory(req, res, next) {
  try {
    const validated = categorySchema.parse(req.body);

    const existing = await query('SELECT id FROM asset_categories WHERE LOWER(name) = LOWER($1)', [
      validated.name,
    ]);
    if (existing.rows.length > 0) {
      throw new BadRequestError('Asset category with this name already exists.');
    }

    const insertRes = await query(
      `INSERT INTO asset_categories (name, custom_fields)
       VALUES ($1, $2::jsonb)
       RETURNING *`,
      [validated.name, JSON.stringify(validated.customFields)]
    );

    return sendSuccess(res, { category: insertRes.rows[0] }, 201);
  } catch (err) {
    next(err);
  }
}

async function updateCategory(req, res, next) {
  try {
    const { id } = req.params;
    const validated = categorySchema.parse(req.body);

    const check = await query('SELECT id FROM asset_categories WHERE id = $1', [id]);
    if (check.rows.length === 0) {
      throw new NotFoundError('Category not found');
    }

    const existing = await query(
      'SELECT id FROM asset_categories WHERE LOWER(name) = LOWER($1) AND id <> $2',
      [validated.name, id]
    );
    if (existing.rows.length > 0) {
      throw new BadRequestError('Category name already in use.');
    }

    const updated = await query(
      `UPDATE asset_categories
       SET name = $1, custom_fields = $2::jsonb
       WHERE id = $3
       RETURNING *`,
      [validated.name, JSON.stringify(validated.customFields), id]
    );

    return sendSuccess(res, { category: updated.rows[0] });
  } catch (err) {
    next(err);
  }
}

async function deleteCategory(req, res, next) {
  try {
    const { id } = req.params;
    const check = await query('SELECT id FROM asset_categories WHERE id = $1', [id]);
    if (check.rows.length === 0) {
      throw new NotFoundError('Category not found');
    }

    // Ensure no assets depend on this category
    const assetCheck = await query('SELECT id FROM assets WHERE category_id = $1 LIMIT 1', [id]);
    if (assetCheck.rows.length > 0) {
      throw new BadRequestError('Cannot delete category with existing assets.');
    }

    await query('DELETE FROM asset_categories WHERE id = $1', [id]);
    return sendSuccess(res, { message: 'Category deleted successfully' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};
