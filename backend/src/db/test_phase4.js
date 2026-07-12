const { pool } = require('../config/db');
const bookingsService = require('../modules/bookings/service');
const maintenanceService = require('../modules/maintenance/service');

async function runPhase4Tests() {
  const client = await pool.connect();
  let passed = 0;
  const total = 4;

  console.log('========================================================================');
  console.log('  ASSETFLOW PHASE 4 AUTOMATED BOOKINGS & MAINTENANCE VERIFICATION');
  console.log('========================================================================\n');

  try {
    // Get test user & bookable asset
    const userRes = await client.query(`SELECT * FROM users WHERE email = 'admin@assetflow.com' LIMIT 1`);
    const adminUser = userRes.rows[0];

    // Find or create a bookable asset
    let assetRes = await client.query(`SELECT * FROM assets WHERE is_bookable = true AND status = 'Available' LIMIT 1`);
    if (assetRes.rows.length === 0) {
      await client.query(`UPDATE assets SET is_bookable = true WHERE asset_tag = 'AF-1045'`);
      assetRes = await client.query(`SELECT * FROM assets WHERE asset_tag = 'AF-1045' LIMIT 1`);
    }
    const asset = assetRes.rows[0];

    // Clean any existing test bookings for this asset today
    await client.query(`DELETE FROM bookings WHERE resource_asset_id = $1`, [asset.id]);

    // Test 1: Booking 9:00 - 10:00 succeeds
    console.log('[TEST 1] Verifying initial Resource Booking (9:00 to 10:00)...');
    const today = new Date();
    today.setHours(9, 0, 0, 0);
    const start1 = new Date(today.getTime());
    const end1 = new Date(today.getTime() + 60 * 60 * 1000); // 10:00

    const bkg1 = await bookingsService.createBooking(
      {
        resourceAssetId: asset.id,
        startTime: start1.toISOString(),
        endTime: end1.toISOString(),
        purpose: 'Strategy Meeting',
      },
      adminUser
    );
    if (bkg1 && bkg1.id) {
      console.log(`  ✔ SUCCESS: Booking created (${bkg1.start_time} to ${bkg1.end_time})\n`);
      passed++;
    }

    // Test 2: Overlapping Booking 9:30 - 10:30 blocked with 409 BookingOverlapError
    console.log('[TEST 2] Verifying Hard Constraint 4 (Booking Overlap Prevention 9:30 to 10:30)...');
    const start2 = new Date(today.getTime() + 30 * 60 * 1000); // 9:30
    const end2 = new Date(today.getTime() + 90 * 60 * 1000);   // 10:30
    let overlapCaught = false;

    try {
      await bookingsService.createBooking(
        {
          resourceAssetId: asset.id,
          startTime: start2.toISOString(),
          endTime: end2.toISOString(),
          purpose: 'Conflicting Slot',
        },
        adminUser
      );
    } catch (err) {
      if (err.code === 'BOOKING_OVERLAP' && err.status === 409 && err.conflictingBooking) {
        console.log(`  ✔ SUCCESS: Blocked overlapping slot with 409 & conflictingBooking details: ${err.message}\n`);
        overlapCaught = true;
        passed++;
      }
    }
    if (!overlapCaught) {
      console.error('  ✘ FAILURE: Overlapping booking was not blocked or returned incorrect shape.\n');
    }

    // Test 3: Back-to-back Booking 10:00 - 11:00 succeeds
    console.log('[TEST 3] Verifying back-to-back Booking (10:00 to 11:00)...');
    const start3 = new Date(today.getTime() + 60 * 60 * 1000);  // 10:00
    const end3 = new Date(today.getTime() + 120 * 60 * 1000);   // 11:00
    const bkg3 = await bookingsService.createBooking(
      {
        resourceAssetId: asset.id,
        startTime: start3.toISOString(),
        endTime: end3.toISOString(),
        purpose: 'Follow-up Session',
      },
      adminUser
    );
    if (bkg3 && bkg3.id) {
      console.log(`  ✔ SUCCESS: Back-to-back slot 10:00-11:00 accepted.\n`);
      passed++;
    }

    // Test 4: Maintenance Approval Workflow & Asset Status Transition (Global Constraint 5)
    console.log('[TEST 4] Verifying Global Constraint 5 (Maintenance Approval State Machine)...');
    const mReq = await maintenanceService.createRequest(
      {
        assetId: asset.id,
        issueDescription: 'Projector bulb replacement check',
        priority: 'High',
      },
      adminUser
    );

    // Asset should still be Available before approval
    const preCheck = await client.query(`SELECT status FROM assets WHERE id = $1`, [asset.id]);

    // Now approve
    const approvedM = await maintenanceService.approveRequest(mReq.id, adminUser);

    // Asset status should now be 'Under Maintenance'
    const postCheck = await client.query(`SELECT status FROM assets WHERE id = $1`, [asset.id]);

    // Now resolve
    const resolvedM = await maintenanceService.resolveMaintenance(approvedM.id, adminUser);
    const finalCheck = await client.query(`SELECT status FROM assets WHERE id = $1`, [asset.id]);

    if (
      preCheck.rows[0].status === 'Available' &&
      approvedM.status === 'Approved' &&
      postCheck.rows[0].status === 'Under Maintenance' &&
      resolvedM.status === 'Resolved' &&
      finalCheck.rows[0].status === 'Available'
    ) {
      console.log(`  ✔ SUCCESS: Maintenance chain executed & asset status transitioned properly: Available -> Under Maintenance -> Available.\n`);
      passed++;
    } else {
      console.error(`  ✘ FAILURE: Maintenance workflow asset status mismatch.\n`);
    }
  } catch (err) {
    console.error('Fatal Test Runner Error:', err);
  } finally {
    client.release();
    await pool.end();
  }

  console.log('========================================================================');
  console.log(`  VERIFICATION RESULTS: ${passed} / ${total} TESTS PASSED`);
  console.log('========================================================================');
}

runPhase4Tests();
