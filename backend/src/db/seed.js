const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');

async function seed() {
  console.log('========================================================================');
  console.log('  ASSETFLOW ENTERPRISE MASTER DATABASE SEEDER (DEMO READY)');
  console.log('========================================================================\n');
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Create Departments (including nested sub-department)
    console.log('1. Seeding Departments...');
    const deptEngRes = await client.query(`
      INSERT INTO departments (name, status)
      VALUES ('Engineering', 'Active')
      ON CONFLICT (name) DO UPDATE SET status = 'Active'
      RETURNING id
    `);
    const deptEngId = deptEngRes.rows[0].id;

    const deptInfraRes = await client.query(`
      INSERT INTO departments (name, parent_department_id, status)
      VALUES ('Platform Infrastructure', $1, 'Active')
      ON CONFLICT (name) DO UPDATE SET parent_department_id = $1, status = 'Active'
      RETURNING id
    `, [deptEngId]);
    const deptInfraId = deptInfraRes.rows[0].id;

    const deptOpsRes = await client.query(`
      INSERT INTO departments (name, status)
      VALUES ('Operations', 'Active')
      ON CONFLICT (name) DO UPDATE SET status = 'Active'
      RETURNING id
    `);
    const deptOpsId = deptOpsRes.rows[0].id;

    // 2. Hash default passwords (12 rounds)
    console.log('2. Hashing default user passwords (12 rounds)...');
    const adminHash = await bcrypt.hash('Admin@123', 12);
    const managerHash = await bcrypt.hash('Manager@123', 12);
    const headHash = await bcrypt.hash('Head@123', 12);
    const employeeHash = await bcrypt.hash('Employee@123', 12);

    // 3. Create Users across all 4 roles
    console.log('3. Seeding Users covering all 4 roles...');
    const adminRes = await client.query(`
      INSERT INTO users (name, email, password_hash, role, department_id, status)
      VALUES ('Alex Morgan (Admin)', 'admin@assetflow.com', $1, 'Admin', $2, 'Active')
      ON CONFLICT (email) DO UPDATE SET password_hash = $1, role = 'Admin', status = 'Active'
      RETURNING id
    `, [adminHash, deptOpsId]);
    const adminId = adminRes.rows[0].id;

    const managerRes = await client.query(`
      INSERT INTO users (name, email, password_hash, role, department_id, status)
      VALUES ('Marcus Vance (Asset Manager)', 'manager@assetflow.com', $1, 'AssetManager', $2, 'Active')
      ON CONFLICT (email) DO UPDATE SET password_hash = $1, role = 'AssetManager', status = 'Active'
      RETURNING id
    `, [managerHash, deptOpsId]);
    const managerId = managerRes.rows[0].id;

    const headRes = await client.query(`
      INSERT INTO users (name, email, password_hash, role, department_id, status)
      VALUES ('Sarah Jenkins (Department Head)', 'head@assetflow.com', $1, 'DepartmentHead', $2, 'Active')
      ON CONFLICT (email) DO UPDATE SET password_hash = $1, role = 'DepartmentHead', status = 'Active'
      RETURNING id
    `, [headHash, deptEngId]);
    const headId = headRes.rows[0].id;

    const empRes = await client.query(`
      INSERT INTO users (name, email, password_hash, role, department_id, status)
      VALUES ('David Chen (Employee)', 'employee@assetflow.com', $1, 'Employee', $2, 'Active')
      ON CONFLICT (email) DO UPDATE SET password_hash = $1, role = 'Employee', status = 'Active'
      RETURNING id
    `, [employeeHash, deptEngId]);
    const empId = empRes.rows[0].id;

    const empSaraRes = await client.query(`
      INSERT INTO users (name, email, password_hash, role, department_id, status)
      VALUES ('Sara Iqbal (SRE Lead)', 'sara.iqbal@assetflow.com', $1, 'Employee', $2, 'Active')
      ON CONFLICT (email) DO UPDATE SET password_hash = $1, role = 'Employee', status = 'Active'
      RETURNING id
    `, [employeeHash, deptInfraId]);
    const empSaraId = empSaraRes.rows[0].id;

    // Set Department Heads
    await client.query(`UPDATE departments SET head_user_id = $1 WHERE id = $2`, [headId, deptEngId]);
    await client.query(`UPDATE departments SET head_user_id = $1 WHERE id = $2`, [managerId, deptOpsId]);

    // 4. Create Categories with custom attribute schemas
    console.log('4. Seeding Asset Categories with custom field schemas...');
    const catItRes = await client.query(`
      INSERT INTO asset_categories (name, custom_fields)
      VALUES (
        'IT Equipment',
        '[{"name": "RAM", "type": "string"}, {"name": "Storage", "type": "string"}, {"name": "CPU", "type": "string"}]'::jsonb
      )
      ON CONFLICT (name) DO UPDATE SET custom_fields = EXCLUDED.custom_fields
      RETURNING id
    `);
    const catItId = catItRes.rows[0].id;

    const catVehRes = await client.query(`
      INSERT INTO asset_categories (name, custom_fields)
      VALUES (
        'Vehicles',
        '[{"name": "License Plate", "type": "string"}, {"name": "Mileage", "type": "number"}, {"name": "Fuel Type", "type": "string"}]'::jsonb
      )
      ON CONFLICT (name) DO UPDATE SET custom_fields = EXCLUDED.custom_fields
      RETURNING id
    `);
    const catVehId = catVehRes.rows[0].id;

    const catFacRes = await client.query(`
      INSERT INTO asset_categories (name, custom_fields)
      VALUES (
        'Facilities & Rooms',
        '[{"name": "Capacity", "type": "number"}, {"name": "Projector Included", "type": "boolean"}]'::jsonb
      )
      ON CONFLICT (name) DO UPDATE SET custom_fields = EXCLUDED.custom_fields
      RETURNING id
    `);
    const catFacId = catFacRes.rows[0].id;

    // 5. Create ~15 realistic Assets across all statuses & bookable items
    console.log('5. Seeding ~15 realistic Assets across all lifecycle states...');
    const assetsData = [
      { tag: 'AF-1001', name: 'MacBook Pro M3 Max 16"', cat: catItId, status: 'Allocated', loc: 'Engineering HQ', serial: 'FVFG92K1M3', bookable: false },
      { tag: 'AF-1002', name: 'MacBook Pro M3 Pro 14"', cat: catItId, status: 'Allocated', loc: 'Engineering HQ', serial: 'FVFG88X2M3', bookable: false },
      { tag: 'AF-1003', name: 'Dell XPS 15 9530 Workstation', cat: catItId, status: 'Available', loc: 'IT Stockroom B', serial: 'DL9921XPS', bookable: false },
      { tag: 'AF-1004', name: 'Lenovo ThinkPad X1 Carbon Gen 11', cat: catItId, status: 'Under Maintenance', loc: 'Service Depot', serial: 'LNV4418TP', bookable: false },
      { tag: 'AF-1005', name: 'iPad Pro M2 12.9" Cellular', cat: catItId, status: 'Available', loc: 'IT Stockroom A', serial: 'IPD2219M2', bookable: false },
      { tag: 'AF-1006', name: 'Cisco Meraki MX95 Cloud Security Node', cat: catItId, status: 'Allocated', loc: 'Server Room 1', serial: 'CSK8812MX', bookable: false },
      { tag: 'AF-1007', name: 'NVIDIA RTX A6000 AI Rack Unit', cat: catItId, status: 'Reserved', loc: 'AI Research Lab', serial: 'NVD6600A', bookable: false },
      { tag: 'AF-1008', name: 'Apple Pro Display XDR 32" 6K', cat: catItId, status: 'Allocated', loc: 'Design Studio', serial: 'XDR3319AD', bookable: false },
      { tag: 'AF-1009', name: 'Ford Transit Cargo Van 2024', cat: catVehId, status: 'Available', loc: 'HQ East Parking', serial: 'VIN1FTBR1Y', bookable: true },
      { tag: 'AF-1010', name: 'Toyota RAV4 Hybrid Shuttler', cat: catVehId, status: 'Under Maintenance', loc: 'Fleet Garage', serial: 'VIN2TYRV4H', bookable: true },
      { tag: 'AF-1011', name: 'Conference Room B2 (Executive Suite)', cat: catFacId, status: 'Available', loc: 'HQ 2nd Floor', serial: 'ROOM-B2', bookable: true },
      { tag: 'AF-1012', name: 'Sony 4K Laser Projector VPL-XW5000', cat: catFacId, status: 'Available', loc: 'Conference Room B2', serial: 'SNY5000PJ', bookable: true },
      { tag: 'AF-1045', name: 'Conference Room A1 (All-Hands Hall)', cat: catFacId, status: 'Available', loc: 'HQ Ground Floor', serial: 'ROOM-A1', bookable: true },
      { tag: 'AF-1090', name: 'ThinkPad T480 Legacy Unit', cat: catItId, status: 'Retired', loc: 'E-Waste Bin', serial: 'OLD480TP', bookable: false },
      { tag: 'AF-1099', name: 'Epson Wireless Portable Scanner', cat: catItId, status: 'Lost', loc: 'Unknown / Field', serial: 'LOST99SCN', bookable: false },
    ];

    const assetMap = {};
    for (const a of assetsData) {
      const res = await client.query(`
        INSERT INTO assets (asset_tag, name, category_id, status, location, serial_number, is_bookable, acquisition_date, acquisition_cost)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW() - INTERVAL '180 days', 2499.00)
        ON CONFLICT (asset_tag) DO UPDATE SET
          name = EXCLUDED.name,
          status = EXCLUDED.status,
          location = EXCLUDED.location,
          is_bookable = EXCLUDED.is_bookable
        RETURNING id, asset_tag
      `, [a.tag, a.name, a.cat, a.status, a.loc, a.serial, a.bookable]);
      assetMap[a.tag] = res.rows[0].id;
    }

    // Clean previous seed allocations & bookings & maintenance
    await client.query(`DELETE FROM bookings`);
    await client.query(`DELETE FROM allocations`);
    await client.query(`DELETE FROM maintenance_requests`);
    await client.query(`DELETE FROM audit_cycles`);

    // 6. Create realistic Allocations (including an OVERDUE allocation!)
    console.log('6. Seeding Allocations (including active and OVERDUE return alerts)...');
    await client.query(`
      INSERT INTO allocations (asset_id, employee_id, created_by, department_id, allocated_date, expected_return_date, status, condition_checkin_notes)
      VALUES ($1, $2, $3, $4, NOW() - INTERVAL '30 days', NOW() + INTERVAL '60 days', 'Active', 'Assigned primary engineering workstation')
    `, [assetMap['AF-1001'], empId, adminId, deptEngId]);

    await client.query(`
      INSERT INTO allocations (asset_id, employee_id, created_by, department_id, allocated_date, expected_return_date, status, condition_checkin_notes)
      VALUES ($1, $2, $3, $4, NOW() - INTERVAL '40 days', NOW() - INTERVAL '5 days', 'Overdue', 'OVERDUE RETURN: Loaned iPad Pro M2 unit')
    `, [assetMap['AF-1002'], empSaraId, adminId, deptInfraId]);

    // 7. Create realistic Bookings (Conference Room B2 booked 9:00 to 10:00 today for live conflict testing)
    console.log('7. Seeding Resource Bookings (Conference Room B2 booked 09:00-10:00 today)...');
    const today = new Date();
    today.setHours(9, 0, 0, 0);
    const end10 = new Date(today.getTime() + 60 * 60 * 1000);

    await client.query(`
      INSERT INTO bookings (resource_asset_id, booked_by, start_time, end_time, purpose, status)
      VALUES ($1, $2, $3, $4, 'Q3 Executive Strategy Planning Session', 'Upcoming')
    `, [assetMap['AF-1011'], adminId, today.toISOString(), end10.toISOString()]);

    // 8. Create Maintenance Requests across all workflow stages
    console.log('8. Seeding Maintenance Requests across all 5 workflow stages...');
    await client.query(`
      INSERT INTO maintenance_requests (asset_id, raised_by, issue_description, priority, status)
      VALUES ($1, $2, 'Battery health degraded below 75% threshold', 'Medium', 'Pending')
    `, [assetMap['AF-1003'], empId]);

    await client.query(`
      INSERT INTO maintenance_requests (asset_id, raised_by, issue_description, priority, status)
      VALUES ($1, $2, 'Firmware update required for security compliance', 'High', 'Approved')
    `, [assetMap['AF-1005'], headId]);

    await client.query(`
      INSERT INTO maintenance_requests (asset_id, raised_by, issue_description, priority, status, technician_name)
      VALUES ($1, $2, 'Fleet routine 10,000 km oil change and brake inspection', 'Medium', 'Technician Assigned', 'R. Verma (Certified Tech)')
    `, [assetMap['AF-1009'], managerId]);

    await client.query(`
      INSERT INTO maintenance_requests (asset_id, raised_by, issue_description, priority, status, technician_name)
      VALUES ($1, $2, 'Display panel calibration and motherboard thermal check', 'Critical', 'In Progress', 'S. Rao (Hardware Specialist)')
    `, [assetMap['AF-1004'], empSaraId]);

    await client.query(`
      INSERT INTO maintenance_requests (asset_id, raised_by, issue_description, priority, status, technician_name)
      VALUES ($1, $2, 'HDMI input module replacement completed', 'Low', 'Resolved', 'A. Patel')
    `, [assetMap['AF-1012'], adminId]);

    // 9. Create Audit Cycles (One Closed cycle with discrepancy, one In Progress cycle)
    console.log('9. Seeding Audit Cycles (Q2 Closed with Discrepancy & Q3 In Progress)...');
    const q2CycleRes = await client.query(`
      INSERT INTO audit_cycles (name, start_date, end_date, status, created_by, closed_at)
      VALUES ('Q2 Physical Verification Audit', '2026-04-01', '2026-04-15', 'Closed', $1, NOW() - INTERVAL '30 days')
      RETURNING id
    `, [adminId]);
    const q2Id = q2CycleRes.rows[0].id;

    await client.query(`
      INSERT INTO audit_cycle_auditors (audit_cycle_id, auditor_id)
      VALUES ($1, $2), ($1, $3)
    `, [q2Id, adminId, managerId]);

    await client.query(`
      INSERT INTO audit_items (audit_cycle_id, asset_id, verification_status, notes, verified_by, verified_at, locked)
      VALUES ($1, $2, 'Missing', 'Scanner missing from storage bin during Q2 audit', $3, NOW() - INTERVAL '30 days', true)
    `, [q2Id, assetMap['AF-1099'], adminId]);

    await client.query(`
      INSERT INTO discrepancy_reports (audit_cycle_id, asset_id, issue_type, description, resolved)
      VALUES ($1, $2, 'Missing', 'Epson Wireless Portable Scanner unaccounted for', false)
    `, [q2Id, assetMap['AF-1099']]);

    // Active Q3 Audit Cycle
    const q3CycleRes = await client.query(`
      INSERT INTO audit_cycles (name, start_date, end_date, status, created_by)
      VALUES ('Q3 Comprehensive Asset Inventory', NOW()::date, (NOW() + INTERVAL '14 days')::date, 'In Progress', $1)
      RETURNING id
    `, [adminId]);
    const q3Id = q3CycleRes.rows[0].id;

    await client.query(`
      INSERT INTO audit_cycle_auditors (audit_cycle_id, auditor_id)
      VALUES ($1, $2), ($1, $3)
    `, [q3Id, adminId, headId]);

    await client.query(`
      INSERT INTO audit_items (audit_cycle_id, asset_id, verification_status)
      VALUES
        ($1, $2, 'Pending'),
        ($1, $3, 'Pending'),
        ($1, $4, 'Pending')
    `, [q3Id, assetMap['AF-1001'], assetMap['AF-1003'], assetMap['AF-1011']]);

    await client.query('COMMIT');

    console.log('\n========================================================================');
    console.log('  ✔ ASSETFLOW DATABASE SUCCESSFULLY SEEDED WITH REALISTIC ENTERPRISE DATA!');
    console.log('========================================================================');
    console.log('  TEST CREDENTIALS (PASSWORD FOR ALL USER ACCOUNTS LISTED BELOW):');
    console.log('   - Admin:            admin@assetflow.com        (Admin@123)');
    console.log('   - Asset Manager:    manager@assetflow.com      (Manager@123)');
    console.log('   - Department Head:  head@assetflow.com         (Head@123)');
    console.log('   - Employee:         employee@assetflow.com     (Employee@123)');
    console.log('========================================================================\n');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Fatal Seeder Error:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
