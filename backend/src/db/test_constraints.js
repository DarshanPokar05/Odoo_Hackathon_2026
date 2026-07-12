const { pool, query } = require('../config/db');
const authService = require('../modules/auth/service');

async function verifyAllConstraints() {
  console.log('========================================================================');
  console.log('  ASSETFLOW PHASE 1 AUTOMATED CONSTRAINT & AUTH VERIFICATION RUNNER');
  console.log('========================================================================\n');

  let passedTests = 0;
  let totalTests = 3;

  // TEST 1: Signup role immutability check
  console.log('[TEST 1] Verifying Signup Role Immutability (Global Constraint 1)...');
  try {
    const testEmail = `test_attacker_${Date.now()}@assetflow.com`;
    // Try to pass role = 'Admin' during signup
    const signupRes = await authService.signup({
      email: testEmail,
      password: 'Attacker@123',
      fullName: 'Attacker User',
      role: 'Admin'
    });

    if (signupRes.user.role === 'Employee') {
      console.log('  ✔ SUCCESS: Signup ignored requested Admin role and forced role = "Employee".\n');
      passedTests++;
    } else {
      console.error(`  ✘ FAILURE: User created with role = "${signupRes.user.role}" instead of "Employee"!\n`);
    }

    // Clean up test user
    await query('DELETE FROM users WHERE email = $1', [testEmail]);
  } catch (err) {
    console.error('  ✘ FAILURE in Test 1:', err.message, '\n');
  }

  // TEST 2: Partial unique index on active allocations check
  console.log('[TEST 2] Verifying Partial Unique Index on Active Allocations (Global Constraint 3)...');
  try {
    const assetsRes = await query('SELECT id FROM assets LIMIT 1');
    const usersRes = await query('SELECT id FROM users LIMIT 1');
    if (assetsRes.rows.length === 0 || usersRes.rows.length === 0) {
      throw new Error('Database must contain at least one asset and user');
    }
    const assetId = assetsRes.rows[0].id;
    const userId = usersRes.rows[0].id;

    // Insert first active allocation
    await query(`
      INSERT INTO allocations (asset_id, employee_id, status)
      VALUES ($1, $2, 'Active')
    `, [assetId, userId]);

    // Attempt duplicate active allocation
    let threwError = false;
    try {
      await query(`
        INSERT INTO allocations (asset_id, employee_id, status)
        VALUES ($1, $2, 'Active')
      `, [assetId, userId]);
    } catch (err) {
      threwError = true;
      if (err.code === '23505') { // Postgres unique_violation error code
        console.log('  ✔ SUCCESS: Second Active allocation blocked by Postgres unique index (SQLSTATE 23505).\n');
        passedTests++;
      } else {
        console.log('  ✔ SUCCESS: Duplicate allocation blocked with error:', err.message, '\n');
        passedTests++;
      }
    }

    if (!threwError) {
      console.error('  ✘ FAILURE: Second Active allocation was allowed!\n');
    }

    // Clean up test allocation
    await query('DELETE FROM allocations WHERE asset_id = $1', [assetId]);
  } catch (err) {
    console.error('  ✘ FAILURE in Test 2:', err.message, '\n');
  }

  // TEST 3: Exclusion constraint on overlapping bookings check
  console.log('[TEST 3] Verifying btree_gist Overlap Prevention on Bookings (Global Constraint 4)...');
  try {
    const bookableRes = await query('SELECT id FROM assets WHERE is_bookable = true LIMIT 1');
    const usersRes = await query('SELECT id FROM users LIMIT 1');
    if (bookableRes.rows.length === 0 || usersRes.rows.length === 0) {
      throw new Error('Database must contain at least one bookable asset and user');
    }
    const assetId = bookableRes.rows[0].id;
    const userId = usersRes.rows[0].id;

    const startTime1 = '2026-08-01T10:00:00Z';
    const endTime1 = '2026-08-01T12:00:00Z';
    const startTime2 = '2026-08-01T11:00:00Z'; // Overlaps 11:00-12:00
    const endTime2 = '2026-08-01T13:00:00Z';

    // Insert first booking
    await query(`
      INSERT INTO bookings (resource_asset_id, booked_by, start_time, end_time, status)
      VALUES ($1, $2, $3, $4, 'Upcoming')
    `, [assetId, userId, startTime1, endTime1]);

    // Attempt overlapping booking
    let threwOverlapError = false;
    try {
      await query(`
        INSERT INTO bookings (resource_asset_id, booked_by, start_time, end_time, status)
        VALUES ($1, $2, $3, $4, 'Upcoming')
      `, [assetId, userId, startTime2, endTime2]);
    } catch (err) {
      threwOverlapError = true;
      if (err.code === '23P01') { // Postgres exclusion_violation error code
        console.log('  ✔ SUCCESS: Overlapping booking blocked by Postgres btree_gist exclusion constraint (SQLSTATE 23P01).\n');
        passedTests++;
      } else {
        console.log('  ✔ SUCCESS: Overlapping booking blocked with error:', err.message, '\n');
        passedTests++;
      }
    }

    if (!threwOverlapError) {
      console.error('  ✘ FAILURE: Overlapping booking was allowed!\n');
    }

    // Clean up test booking
    await query('DELETE FROM bookings WHERE resource_asset_id = $1', [assetId]);
  } catch (err) {
    console.error('  ✘ FAILURE in Test 3:', err.message, '\n');
  }

  console.log('========================================================================');
  console.log(`  VERIFICATION RESULTS: ${passedTests} / ${totalTests} TESTS PASSED`);
  console.log('========================================================================');

  await pool.end();
  process.exit(passedTests === totalTests ? 0 : 1);
}

if (require.main === module) {
  verifyAllConstraints();
}

module.exports = verifyAllConstraints;
