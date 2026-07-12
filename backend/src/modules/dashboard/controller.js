const { query } = require('../../config/db');
const { sendSuccess } = require('../../utils/response');

async function getDashboardSummary(req, res, next) {
  try {
    const user = req.user;
    const role = user.role;
    const deptId = user.departmentId;
    const userId = user.id;

    // Build role-scoped filters
    // For Admin / AssetManager -> org-wide
    // For DepartmentHead -> scoped to department_id
    // For Employee -> scoped to user's own data
    let assetWhere = '';
    let allocWhere = '';
    let bookingWhere = '';
    let transferWhere = '';
    let maintWhere = '';
    const params = [];

    if (role === 'DepartmentHead' && deptId) {
      params.push(deptId);
      assetWhere = `WHERE department_id = $1`;
      allocWhere = `WHERE asset_id IN (SELECT id FROM assets WHERE department_id = $1)`;
      bookingWhere = `WHERE resource_asset_id IN (SELECT id FROM assets WHERE department_id = $1)`;
      transferWhere = `WHERE asset_id IN (SELECT id FROM assets WHERE department_id = $1)`;
      maintWhere = `WHERE asset_id IN (SELECT id FROM assets WHERE department_id = $1)`;
    } else if (role === 'Employee') {
      params.push(userId);
      assetWhere = `WHERE id IN (SELECT asset_id FROM allocations WHERE employee_id = $1 AND status = 'Active')`;
      allocWhere = `WHERE employee_id = $1`;
      bookingWhere = `WHERE booked_by = $1`;
      transferWhere = `WHERE requested_by = $1 OR requested_to = $1`;
      maintWhere = `WHERE raised_by = $1`;
    }

    // 1. Asset status counts
    const assetCountsRes = await query(
      `SELECT status, COUNT(*)::int AS count FROM assets ${assetWhere} GROUP BY status`,
      params
    );
    const assetCounts = {
      Available: 0,
      Allocated: 0,
      Reserved: 0,
      'Under Maintenance': 0,
    };
    assetCountsRes.rows.forEach((r) => {
      assetCounts[r.status] = r.count;
    });

    // 2. Active Bookings (Upcoming / Ongoing)
    const bookingRes = await query(
      `SELECT COUNT(*)::int AS count FROM bookings
       ${bookingWhere ? bookingWhere + ' AND' : 'WHERE'} status IN ('Upcoming', 'Ongoing')`,
      params
    );

    // 3. Pending Transfers
    const transferRes = await query(
      `SELECT COUNT(*)::int AS count FROM transfer_requests
       ${transferWhere ? transferWhere + ' AND' : 'WHERE'} status = 'Requested'`,
      params
    );

    // 4. Upcoming Returns (between today and today+7 days, Active)
    const upcomingRes = await query(
      `SELECT COUNT(*)::int AS count FROM allocations
       ${allocWhere ? allocWhere + ' AND' : 'WHERE'} status = 'Active'
       AND expected_return_date >= CURRENT_DATE
       AND expected_return_date <= CURRENT_DATE + INTERVAL '7 days'`,
      params
    );

    // 5. Overdue Returns (expected_return_date < today, Active) -> Visually distinct field
    const overdueCountRes = await query(
      `SELECT COUNT(*)::int AS count FROM allocations
       ${allocWhere ? allocWhere + ' AND' : 'WHERE'} status = 'Active'
       AND expected_return_date < CURRENT_DATE`,
      params
    );

    const overdueListRes = await query(
      `SELECT al.id, al.expected_return_date, a.asset_tag, a.name AS asset_name,
              u.name AS holder_name, u.email AS holder_email
       FROM allocations al
       JOIN assets a ON al.asset_id = a.id
       LEFT JOIN users u ON al.employee_id = u.id
       WHERE al.status = 'Active' AND al.expected_return_date < CURRENT_DATE
       ${role === 'DepartmentHead' && deptId ? 'AND a.department_id = $1' : ''}
       ${role === 'Employee' ? 'AND al.employee_id = $1' : ''}
       ORDER BY al.expected_return_date ASC`,
      params
    );

    // 6. Maintenance Today (Approved / In Progress / Technician Assigned)
    const maintRes = await query(
      `SELECT COUNT(*)::int AS count FROM maintenance_requests
       ${maintWhere ? maintWhere + ' AND' : 'WHERE'} status IN ('Approved', 'Technician Assigned', 'In Progress')`,
      params
    );

    // 7. Recent Activity feed (last 8 items)
    const actRes = await query(
      `SELECT log.id, log.action, log.entity_type, log.created_at, u.name AS user_name
       FROM activity_logs log
       LEFT JOIN users u ON log.user_id = u.id
       ORDER BY log.created_at DESC
       LIMIT 8`
    );

    const kpis = {
      assetsAvailable: assetCounts.Available || 0,
      assetsAllocated: assetCounts.Allocated || 0,
      assetsReserved: assetCounts.Reserved || 0,
      activeBookings: bookingRes.rows[0].count || 0,
      pendingTransfers: transferRes.rows[0].count || 0,
      upcomingReturns: upcomingRes.rows[0].count || 0,
      overdueReturnsCount: overdueCountRes.rows[0].count || 0,
      overdueAllocations: overdueListRes.rows,
      maintenanceToday: maintRes.rows[0].count || 0,
    };

    return sendSuccess(res, {
      kpis,
      recentActivity: actRes.rows,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getDashboardSummary,
};
