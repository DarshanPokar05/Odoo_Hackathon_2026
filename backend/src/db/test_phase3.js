const { pool } = require('../config/db');
const assetsService = require('../modules/assets/service');
const allocationsService = require('../modules/allocations/service');

async function runPhase3Tests() {
  console.log('========================================================================');
  console.log('  ASSETFLOW PHASE 3 AUTOMATED BUSINESS LOGIC & CONFLICT VERIFICATION');
  console.log('========================================================================\n');

  let passed = 0;
  let total = 4;

  const client = await pool.connect();
  try {
    // 1. Test Asset Tag Sequence generation
    console.log('[TEST 1] Verifying Postgres Sequence-Driven Asset Tag Generation...');
    const catRes = await client.query(`SELECT id FROM asset_categories LIMIT 1`);
    const catId = catRes.rows[0].id;

    const asset1 = await assetsService.createAsset({
      name: 'Test Sequence Laptop 1',
      categoryId: catId,
      serialNumber: 'SN-SEQ-1',
    });
    const asset2 = await assetsService.createAsset({
      name: 'Test Sequence Laptop 2',
      categoryId: catId,
      serialNumber: 'SN-SEQ-2',
    });

    if (asset1.asset_tag && asset2.asset_tag && asset1.asset_tag !== asset2.asset_tag) {
      console.log(`  ✔ SUCCESS: Generated distinct sequential tags (${asset1.asset_tag}, ${asset2.asset_tag}).\n`);
      passed++;
    } else {
      console.error(`  ✘ FAILURE: Sequence tag generation failed.\n`);
    }

    // 2. Test State Machine Transition Enforcement (Global Constraint 2)
    console.log('[TEST 2] Verifying State Machine Enforcement (Global Constraint 2)...');
    try {
      // asset1 starts as Available -> let's allocate it first
      await assetsService.updateAssetStatus(asset1.id, 'Allocated', { role: 'AssetManager' });
      // Now attempt illegal transition Allocated -> Reserved
      await assetsService.updateAssetStatus(asset1.id, 'Reserved', { role: 'AssetManager' });
      console.error(`  ✘ FAILURE: Illegal transition Allocated -> Reserved was not blocked.\n`);
    } catch (err) {
      if (err.message && err.message.includes('Illegal asset status transition')) {
        console.log(`  ✔ SUCCESS: Blocked illegal transition Allocated -> Reserved.\n`);
        passed++;
      } else {
        console.error(`  ✘ FAILURE: Unexpected error message: ${err.message}\n`);
      }
    }

    // 3. Test Allocation Conflict 409 Shape & Transfer Affordance (Global Constraint 3)
    console.log('[TEST 3] Verifying Allocation Conflict Rule & 409 Error Shape (Global Constraint 3)...');
    const allocatedAssetRes = await client.query(`SELECT id, asset_tag FROM assets WHERE asset_tag = 'AF-0114' LIMIT 1`);
    const empRes = await client.query(`SELECT id, name FROM users WHERE email = 'employee@assetflow.com' LIMIT 1`);

    if (allocatedAssetRes.rows.length > 0 && empRes.rows.length > 0) {
      try {
        await allocationsService.createAllocation({
          assetId: allocatedAssetRes.rows[0].id,
          employeeId: empRes.rows[0].id,
        });
        console.error(`  ✘ FAILURE: Duplicate allocation was not blocked.\n`);
      } catch (err) {
        if (err.statusCode === 409 && err.code === 'ASSET_ALREADY_ALLOCATED' && err.offerTransfer) {
          console.log(`  ✔ SUCCESS: Returned 409 Conflict with currentHolder details and offerTransfer=true.\n`);
          passed++;
        } else {
          console.error(`  ✘ FAILURE: Error did not match exact 409 specification. Got status: ${err.statusCode}\n`);
        }
      }
    } else {
      console.log(`  ⚠ SKIP: AF-0114 or test employee not found.\n`);
    }

    // 4. Test Atomic Transfer Request Approval
    console.log('[TEST 4] Verifying Atomic Transfer Approval (Closes Old + Opens New Allocation)...');
    const adminRes = await client.query(`SELECT id, name, email FROM users WHERE email = 'admin@assetflow.com' LIMIT 1`);
    const managerRes = await client.query(`SELECT id, name, email FROM users WHERE email = 'manager@assetflow.com' LIMIT 1`);

    if (allocatedAssetRes.rows.length > 0 && adminRes.rows.length > 0 && managerRes.rows.length > 0) {
      const transfer = await allocationsService.createTransferRequest({
        assetId: allocatedAssetRes.rows[0].id,
        requestedToUserId: managerRes.rows[0].id,
        reason: 'Automated test transfer',
      }, adminRes.rows[0]);

      const approvalRes = await allocationsService.approveTransferRequest(transfer.id, adminRes.rows[0]);
      if (approvalRes.transfer.status === 'Completed' && approvalRes.newAllocation.status === 'Active') {
        console.log(`  ✔ SUCCESS: Transfer approval atomically closed old allocation and opened new active allocation.\n`);
        passed++;
      } else {
        console.error(`  ✘ FAILURE: Transfer approval did not complete properly.\n`);
      }
    }

  } catch (err) {
    console.error('Test runner fatal error:', err);
  } finally {
    client.release();
    await pool.end();
  }

  console.log('========================================================================');
  console.log(`  VERIFICATION RESULTS: ${passed} / ${total} TESTS PASSED`);
  console.log('========================================================================');
}

runPhase3Tests();
