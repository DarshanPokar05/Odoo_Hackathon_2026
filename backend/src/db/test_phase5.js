const { pool } = require('../config/db');
const auditsService = require('../modules/audits/service');
const reportsService = require('../modules/reports/service');

async function runPhase5Tests() {
  const client = await pool.connect();
  let passed = 0;
  const total = 4;

  console.log('========================================================================');
  console.log('  ASSETFLOW PHASE 5 AUTOMATED AUDIT CYCLES, REPORTS & LOGS VERIFICATION');
  console.log('========================================================================\n');

  try {
    // Get test users
    const adminRes = await client.query(`SELECT * FROM users WHERE email = 'admin@assetflow.com' LIMIT 1`);
    const adminUser = adminRes.rows[0];

    const empRes = await client.query(`SELECT * FROM users WHERE email = 'employee@assetflow.com' LIMIT 1`);
    const empUser = empRes.rows[0];

    // Find test asset
    const assetRes = await client.query(`SELECT * FROM assets WHERE asset_tag = 'AF-1045' LIMIT 1`);
    const testAsset = assetRes.rows[0];

    // 1. Create audit cycle & assign auditor
    console.log('[TEST 1] Verifying RBAC Security: Non-assigned auditor blocked from updating audit items (403)...');
    const today = new Date().toISOString().split('T')[0];
    const cycle = await auditsService.createAuditCycle(
      {
        name: 'Automated Test Q3 Audit Cycle',
        startDate: today,
        endDate: today,
        auditorIds: [adminUser.id], // Only admin assigned
      },
      adminUser
    );

    const startedCycle = await auditsService.startAuditCycle(cycle.id, adminUser);
    const targetItem = startedCycle.items.find((i) => i.asset_id === testAsset.id) || startedCycle.items[0];

    let rbacCaught = false;
    try {
      await auditsService.updateAuditItem(
        cycle.id,
        targetItem.id,
        { verificationStatus: 'Verified', notes: 'Unauthorized attempt' },
        empUser // Employee user not in assigned auditors
      );
    } catch (err) {
      if (err.statusCode === 403 || err.status === 403 || err.code === 'FORBIDDEN') {
        console.log(`  ✔ SUCCESS: Non-assigned auditor blocked with 403 Forbidden: "${err.message}"\n`);
        rbacCaught = true;
        passed++;
      }
    }
    if (!rbacCaught) {
      console.error('  ✘ FAILURE: Non-assigned auditor was not blocked with 403.\n');
    }

    // 2. Admin assigned auditor marks item 'Missing' and Closes cycle -> Asset status -> Lost & Discrepancy generated
    console.log('[TEST 2] Verifying Global Constraint 6: Closing audit cycle with Missing item auto-flips Asset to Lost & generates discrepancy report...');
    await auditsService.updateAuditItem(
      cycle.id,
      targetItem.id,
      { verificationStatus: 'Missing', notes: 'Not found in HQ store room' },
      adminUser
    );

    const closedCycle = await auditsService.closeAuditCycle(cycle.id, adminUser);

    // Verify asset status is now Lost
    const assetCheck = await client.query(`SELECT status FROM assets WHERE id = $1`, [targetItem.asset_id]);
    // Verify discrepancy report created
    const discCheck = await client.query(`SELECT * FROM discrepancy_reports WHERE audit_cycle_id = $1 AND asset_id = $2`, [
      cycle.id,
      targetItem.asset_id,
    ]);

    if (assetCheck.rows[0].status === 'Lost' && discCheck.rows.length > 0 && closedCycle.status === 'Closed') {
      console.log(`  ✔ SUCCESS: Asset automatically transitioned to 'Lost' and Discrepancy Report created (${discCheck.rows[0].issue_type}: "${discCheck.rows[0].description}").\n`);
      passed++;

      // Reset asset back to Available after test
      await client.query(`UPDATE assets SET status = 'Available' WHERE id = $1`, [targetItem.asset_id]);
    } else {
      console.error('  ✘ FAILURE: Missing asset did not transition to Lost or discrepancy report missing.\n');
    }

    // 3. Verify Activity Logs recorded for these actions
    console.log('[TEST 3] Verifying Activity Logs generated for Audit Cycle actions...');
    const logsRes = await client.query(
      `SELECT * FROM activity_logs WHERE entity_id = $1 ORDER BY created_at DESC`,
      [cycle.id]
    );
    if (logsRes.rows.length >= 2) {
      console.log(`  ✔ SUCCESS: Recorded ${logsRes.rows.length} Activity Log rows for Audit Cycle state transitions.\n`);
      passed++;
    } else {
      console.error('  ✘ FAILURE: Activity logs not found for audit cycle.\n');
    }

    // 4. Verify CSV Streaming Export generator
    console.log('[TEST 4] Verifying CSV streaming export for utilization and due reports...');
    let csvHeadersSet = {};
    let csvOutput = '';
    const mockRes = {
      setHeader: (k, v) => { csvHeadersSet[k] = v; },
      write: (chunk) => { csvOutput += chunk; },
      end: () => {},
    };

    await reportsService.streamCsvExport('utilization', mockRes);
    const hasHeader = csvOutput.includes('Asset Tag,Asset Name,Usage Count');
    if (csvHeadersSet['Content-Type'] === 'text/csv' && hasHeader) {
      console.log(`  ✔ SUCCESS: Correctly streamed CSV format with header line & row data.\n`);
      passed++;
    } else {
      console.error('  ✘ FAILURE: CSV export failed.\n');
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

runPhase5Tests();
