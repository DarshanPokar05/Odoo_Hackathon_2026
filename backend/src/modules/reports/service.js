const { query } = require('../../config/db');

async function getUtilization() {
  const mostUsedRes = await query(`
    SELECT a.id, a.asset_tag, a.name,
           COUNT(DISTINCT b.id) + COUNT(DISTINCT al.id) AS usage_count
    FROM assets a
    LEFT JOIN bookings b ON a.id = b.resource_asset_id
    LEFT JOIN allocations al ON a.id = al.asset_id
    WHERE a.status NOT IN ('Disposed', 'Retired')
    GROUP BY a.id, a.asset_tag, a.name
    ORDER BY usage_count DESC
    LIMIT 10
  `);

  const idleRes = await query(`
    SELECT a.id, a.asset_tag, a.name, a.created_at
    FROM assets a
    WHERE a.status = 'Available'
      AND a.id NOT IN (
        SELECT DISTINCT resource_asset_id FROM bookings WHERE start_time >= NOW() - INTERVAL '60 days'
      )
      AND a.id NOT IN (
        SELECT DISTINCT asset_id FROM allocations WHERE allocated_date >= NOW() - INTERVAL '60 days'
      )
    ORDER BY a.created_at ASC
    LIMIT 10
  `);

  return {
    mostUsed: mostUsedRes.rows,
    idle: idleRes.rows,
  };
}

async function getMaintenanceFrequency() {
  const byCategoryRes = await query(`
    SELECT c.name AS category_name, COUNT(m.id) AS maintenance_count
    FROM asset_categories c
    LEFT JOIN assets a ON a.category_id = c.id
    LEFT JOIN maintenance_requests m ON a.id = m.asset_id
    GROUP BY c.id, c.name
    ORDER BY maintenance_count DESC
  `);

  const byAssetRes = await query(`
    SELECT a.asset_tag, a.name AS asset_name, COUNT(m.id) AS maintenance_count
    FROM assets a
    LEFT JOIN maintenance_requests m ON a.id = m.asset_id
    GROUP BY a.id, a.asset_tag, a.name
    HAVING COUNT(m.id) > 0
    ORDER BY maintenance_count DESC
    LIMIT 10
  `);

  return {
    byCategory: byCategoryRes.rows,
    byAsset: byAssetRes.rows,
  };
}

async function getDueForMaintenanceOrRetirement() {
  const res = await query(`
    SELECT a.id, a.asset_tag, a.name, a.acquisition_date,
           COUNT(m.id) AS recent_maintenance_count,
           CASE
             WHEN COUNT(m.id) >= 3 THEN 'High Maintenance Frequency (3+ in 12m)'
             WHEN a.acquisition_date <= NOW() - INTERVAL '4 years' THEN 'Nearing Retirement (4+ years old)'
             ELSE 'Scheduled Check Due'
           END AS reason
    FROM assets a
    LEFT JOIN maintenance_requests m ON a.id = m.asset_id AND m.created_at >= NOW() - INTERVAL '12 months'
    WHERE a.status NOT IN ('Disposed', 'Retired')
    GROUP BY a.id, a.asset_tag, a.name, a.acquisition_date
    HAVING COUNT(m.id) >= 2 OR a.acquisition_date <= NOW() - INTERVAL '4 years'
    ORDER BY a.asset_tag ASC
    LIMIT 20
  `);

  return res.rows;
}

async function getDepartmentAllocationSummary() {
  const res = await query(`
    SELECT d.id, d.name AS department_name,
           COUNT(DISTINCT u.id) AS employee_count,
           COUNT(DISTINCT al.id) AS active_allocations
    FROM departments d
    LEFT JOIN users u ON u.department_id = d.id
    LEFT JOIN allocations al ON u.id = al.employee_id AND al.status = 'Active'
    GROUP BY d.id, d.name
    ORDER BY active_allocations DESC
  `);

  return res.rows;
}

async function getBookingHeatmap() {
  const res = await query(`
    SELECT EXTRACT(DOW FROM start_time) AS day_of_week,
           EXTRACT(HOUR FROM start_time) AS hour_bucket,
           COUNT(*) AS booking_count
    FROM bookings
    WHERE status <> 'Cancelled'
    GROUP BY day_of_week, hour_bucket
    ORDER BY day_of_week, hour_bucket
  `);

  return res.rows;
}

async function streamCsvExport(type, res) {
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="assetflow-report-${type}.csv"`);

  if (type === 'utilization') {
    res.write('Asset Tag,Asset Name,Usage Count\n');
    const data = await getUtilization();
    for (const row of data.mostUsed) {
      res.write(`"${row.asset_tag}","${row.name}",${row.usage_count}\n`);
    }
    res.end();
  } else if (type === 'maintenance') {
    res.write('Category,Maintenance Count\n');
    const data = await getMaintenanceFrequency();
    for (const row of data.byCategory) {
      res.write(`"${row.category_name}",${row.maintenance_count}\n`);
    }
    res.end();
  } else if (type === 'due') {
    res.write('Asset Tag,Asset Name,Reason\n');
    const data = await getDueForMaintenanceOrRetirement();
    for (const row of data) {
      res.write(`"${row.asset_tag}","${row.name}","${row.reason}"\n`);
    }
    res.end();
  } else {
    res.write('Department,Employee Count,Active Allocations\n');
    const data = await getDepartmentAllocationSummary();
    for (const row of data) {
      res.write(`"${row.department_name}",${row.employee_count},${row.active_allocations}\n`);
    }
    res.end();
  }
}

module.exports = {
  getUtilization,
  getMaintenanceFrequency,
  getDueForMaintenanceOrRetirement,
  getDepartmentAllocationSummary,
  getBookingHeatmap,
  streamCsvExport,
};
