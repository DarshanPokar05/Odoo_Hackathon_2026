const { pool } = require('../config/db');

async function checkAssets() {
  try {
    const res = await pool.query(`
      SELECT a.id, a.asset_tag, a.name, a.status, c.name AS category_name, d.name AS department_name
      FROM assets a
      LEFT JOIN asset_categories c ON a.category_id = c.id
      LEFT JOIN departments d ON a.department_id = d.id
      ORDER BY a.asset_tag ASC
    `);
    console.log('Total assets in DB:', res.rows.length);
    res.rows.forEach(r => {
      console.log(`  [${r.asset_tag}] ${r.name} | Category: ${r.category_name} | Status: ${r.status} | Dept: ${r.department_name}`);
    });
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

checkAssets();
