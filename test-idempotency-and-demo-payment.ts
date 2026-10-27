import fs from 'fs';
import path from 'path';

const DB_FILE = path.join(process.cwd(), 'data', 'tastely-db.json');
const VENDOR_DASHBOARD_FILE = path.join(process.cwd(), 'src', 'components', 'VendorDashboard.tsx');
const BASE_URL = 'http://localhost:3000';

async function runAllTests() {
  console.log('=== STARTING TASTELY VENDOR SIMULATION REMOVAL & SAFEGUARDS TESTS ===');
  let passed = 0;
  let total = 0;

  function assert(condition: boolean, msg: string) {
    total++;
    if (condition) {
      console.log(`[PASS] ${msg}`);
      passed++;
    } else {
      console.error(`[FAIL] ${msg}`);
      throw new Error(`Assertion failed: ${msg}`);
    }
  }

  // -------------------------------------------------------------------------
  // TEST 1: The Vendor Dashboard has no payment simulation or re-test controls
  // -------------------------------------------------------------------------
  console.log('\n--- Test 1: Vendor Dashboard UI verification ---');
  const vendorDashboardSrc = fs.readFileSync(VENDOR_DASHBOARD_FILE, 'utf-8');
  assert(!vendorDashboardSrc.includes('Simulate / Re-test Demo Payment'),
    'VendorDashboard does not contain "Simulate / Re-test Demo Payment" button');
  assert(!vendorDashboardSrc.includes('<DemoPaymentModal'),
    'VendorDashboard does not render DemoPaymentModal');
  assert(!vendorDashboardSrc.includes("import { DemoPaymentModal }"),
    'VendorDashboard does not import DemoPaymentModal');
  assert(!vendorDashboardSrc.includes('selectedOrderForDemo'),
    'VendorDashboard does not hold selectedOrderForDemo state');

  // Baseline database snapshot check
  const dbBeforeRaw = fs.readFileSync(DB_FILE, 'utf-8');
  const dbBefore = JSON.parse(dbBeforeRaw);
  const baselineOrderIds = new Set(dbBefore.orders.map((o: any) => o.id));
  console.log(`[INFO] Baseline orders in DB: ${baselineOrderIds.size}`);

  const testOrdersCreated: string[] = [];

  try {
    // -------------------------------------------------------------------------
    // TEST 2: Create a customer order and verify vendor CANNOT simulate payment (backend check)
    // -------------------------------------------------------------------------
    console.log('\n--- Test 2: Vendor cannot change payment outcome via direct API request ---');
    const key1 = `idemp_test_cust_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const createRes1 = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': 'usr_customer_1'
      },
      body: JSON.stringify({
        restaurantId: 'rest_6', // Cream Stone Artisanal Desserts
        items: [{ dishId: 'dish_cs_1', quantity: 2 }], // Willy Wonka Chocolate Stone
        customerName: 'Ananya Customer',
        customerPhone: '+91 98765 43210',
        paymentMethod: 'demo',
        idempotencyKey: key1
      })
    });
    assert(createRes1.status === 201, `Customer Order 1 created (HTTP ${createRes1.status})`);
    const data1 = await createRes1.json();
    const order1 = data1.order;
    testOrdersCreated.push(order1.id);

    // Vendor attempts to call simulate-demo-payment directly on order1
    const vendorSimRes = await fetch(`${BASE_URL}/api/orders/${order1.id}/simulate-demo-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': 'usr_vendor_1' // rest_6 owner
      },
      body: JSON.stringify({ outcome: 'success' })
    });
    assert(vendorSimRes.status === 403, `Vendor direct simulation request blocked with HTTP 403 Forbidden (got ${vendorSimRes.status})`);
    const vendorSimData = await vendorSimRes.json();
    assert(vendorSimData.error.includes('Vendors are not permitted to simulate customer payments'),
      `Error explains vendor restriction: "${vendorSimData.error}"`);

    // Verify order paymentStatus remained demo_pending (unaltered by vendor request)
    const checkOrder1 = await (await fetch(`${BASE_URL}/api/orders/${order1.id}`, {
      headers: { 'x-user-id': 'usr_customer_1' }
    })).json();
    assert(checkOrder1.order.paymentStatus === 'demo_pending',
      'Order paymentStatus remains demo_pending after vendor attempt was rejected');

    // -------------------------------------------------------------------------
    // TEST 3: Authorized customer CAN simulate success or failure for eligible demo order
    // -------------------------------------------------------------------------
    console.log('\n--- Test 3: Authorized customer simulates payment ---');
    // Customer simulates success
    const custSimRes = await fetch(`${BASE_URL}/api/orders/${order1.id}/simulate-demo-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': 'usr_customer_1' // ordering customer
      },
      body: JSON.stringify({ outcome: 'success' })
    });
    assert(custSimRes.status === 200, `Customer simulation succeeded with HTTP 200 (got ${custSimRes.status})`);
    const custSimData = await custSimRes.json();
    assert(custSimData.order.paymentStatus === 'demo_completed', 'Order 1 paymentStatus is demo_completed');
    assert(custSimData.order.upiReference?.startsWith('DEMO-SIM-'), `Received valid demo reference: ${custSimData.order.upiReference}`);

    // Create a second customer order to test customer simulating failure
    const key2 = `idemp_test_cust2_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const createRes2 = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': 'usr_customer_1'
      },
      body: JSON.stringify({
        restaurantId: 'rest_6',
        items: [{ dishId: 'dish_cs_2', quantity: 1 }], // Ferrero Rocher Decadence
        customerName: 'Ananya Customer',
        customerPhone: '+91 98765 43210',
        paymentMethod: 'demo',
        idempotencyKey: key2
      })
    });
    assert(createRes2.status === 201, 'Customer Order 2 created');
    const order2 = (await createRes2.json()).order;
    testOrdersCreated.push(order2.id);

    // Customer simulates failure with reason
    const custFailRes = await fetch(`${BASE_URL}/api/orders/${order2.id}/simulate-demo-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': 'usr_customer_1'
      },
      body: JSON.stringify({
        outcome: 'failure',
        failureReason: 'Simulated Bank Network Timeout'
      })
    });
    assert(custFailRes.status === 200, 'Customer simulated failure returned HTTP 200');
    const custFailData = await custFailRes.json();
    assert(custFailData.order.paymentStatus === 'demo_failed', 'Order 2 paymentStatus is demo_failed');
    assert(custFailData.order.demoFailureReason === 'Simulated Bank Network Timeout', 'Failure reason recorded accurately');

    // Customer retries payment on Order 2 to success (customer retry flow)
    const custRetryRes = await fetch(`${BASE_URL}/api/orders/${order2.id}/simulate-demo-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': 'usr_customer_1'
      },
      body: JSON.stringify({ outcome: 'success' })
    });
    assert(custRetryRes.status === 200, 'Customer eligible retry succeeded with HTTP 200');
    const custRetryData = await custRetryRes.json();
    assert(custRetryData.order.paymentStatus === 'demo_completed', 'Order 2 updated to demo_completed upon successful retry');

    // Unrelated customer cannot simulate payment for this order
    const unauthorizedCustRes = await fetch(`${BASE_URL}/api/orders/${order2.id}/simulate-demo-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': 'usr_1792756977272' // different customer Priya Patel
      },
      body: JSON.stringify({ outcome: 'failure' })
    });
    assert(unauthorizedCustRes.status === 403, 'Unrelated customer blocked from simulating payment (HTTP 403)');

    // -------------------------------------------------------------------------
    // TEST 4: Successful payment does not automatically complete fulfillment
    // -------------------------------------------------------------------------
    console.log('\n--- Test 4: Payment status and fulfillment status remain separate ---');
    assert(order1.orderStatus === 'confirmed', 'Order 1 fulfillment status remained confirmed despite demo_completed');
    assert(custRetryData.order.orderStatus === 'confirmed', 'Order 2 fulfillment status remained confirmed despite demo_completed');

    // -------------------------------------------------------------------------
    // TEST 5: Pending and failed payments still block handover
    // -------------------------------------------------------------------------
    console.log('\n--- Test 5: Handover safeguard blocks handover for pending/failed payment ---');
    // Create an order that remains demo_pending
    const key3 = `idemp_test_pending_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const createRes3 = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': 'usr_customer_1'
      },
      body: JSON.stringify({
        restaurantId: 'rest_6',
        items: [{ dishId: 'dish_cs_3', quantity: 1 }],
        customerName: 'Ananya Customer',
        customerPhone: '+91 98765 43210',
        paymentMethod: 'demo',
        idempotencyKey: key3
      })
    });
    const order3 = (await createRes3.json()).order;
    testOrdersCreated.push(order3.id);

    // Vendor attempts handover while demo_pending
    const handoverPendingRes = await fetch(`${BASE_URL}/api/orders/${order3.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': 'usr_vendor_1'
      },
      body: JSON.stringify({ status: 'completed' })
    });
    assert(handoverPendingRes.status === 400, `Handover blocked for demo_pending (HTTP ${handoverPendingRes.status})`);
    const pendingErr = await handoverPendingRes.json();
    assert(pendingErr.error.includes('demo_pending'), `Handover error mentions demo_pending: "${pendingErr.error}"`);

    // Customer simulates failure on order3
    await fetch(`${BASE_URL}/api/orders/${order3.id}/simulate-demo-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': 'usr_customer_1'
      },
      body: JSON.stringify({ outcome: 'failure', failureReason: 'Simulated Insufficient Account Balance' })
    });

    // Vendor attempts handover while demo_failed
    const handoverFailedRes = await fetch(`${BASE_URL}/api/orders/${order3.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': 'usr_vendor_1'
      },
      body: JSON.stringify({ status: 'completed' })
    });
    assert(handoverFailedRes.status === 400, `Handover blocked for demo_failed (HTTP ${handoverFailedRes.status})`);
    const failedErr = await handoverFailedRes.json();
    assert(failedErr.error.includes('demo_failed'), `Handover error mentions demo_failed: "${failedErr.error}"`);

    // -------------------------------------------------------------------------
    // TEST 6: Completed and cancelled orders cannot be simulated again
    // -------------------------------------------------------------------------
    console.log('\n--- Test 6: Finalized orders cannot be re-simulated ---');
    // Advance Order 1 to completed (valid handover since payment is demo_completed)
    const completeOrder1Res = await fetch(`${BASE_URL}/api/orders/${order1.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': 'usr_vendor_1'
      },
      body: JSON.stringify({ status: 'completed' })
    });
    assert(completeOrder1Res.status === 200, 'Vendor completed handover for verified Order 1');

    // Customer attempts re-simulation on completed Order 1
    const reSimCompleteRes = await fetch(`${BASE_URL}/api/orders/${order1.id}/simulate-demo-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': 'usr_customer_1'
      },
      body: JSON.stringify({ outcome: 'failure' })
    });
    assert(reSimCompleteRes.status === 400, `Re-simulation on completed order rejected with HTTP 400 (got ${reSimCompleteRes.status})`);
    const reSimErr = await reSimCompleteRes.json();
    assert(reSimErr.error.includes('already completed'), `Error message explains finalized lock: "${reSimErr.error}"`);

    // Cancel Order 3 and verify simulation rejected
    await fetch(`${BASE_URL}/api/orders/${order3.id}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': 'usr_customer_1'
      },
      body: JSON.stringify({ reason: 'Test cancel' })
    });
    const reSimCancelRes = await fetch(`${BASE_URL}/api/orders/${order3.id}/simulate-demo-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': 'usr_customer_1'
      },
      body: JSON.stringify({ outcome: 'success' })
    });
    assert(reSimCancelRes.status === 400, `Simulation on cancelled order rejected with HTTP 400 (got ${reSimCancelRes.status})`);

    // -------------------------------------------------------------------------
    // TEST 7: Order details, food items, amounts, and failure reasons remain correct
    // -------------------------------------------------------------------------
    console.log('\n--- Test 7: Order details verification ---');
    const verifyOrder1 = (await (await fetch(`${BASE_URL}/api/orders/${order1.id}`, {
      headers: { 'x-user-id': 'usr_customer_1' }
    })).json()).order;
    assert(verifyOrder1.items.length === 1, 'Order 1 has exactly 1 item line');
    assert(verifyOrder1.items[0].dishName === 'Willy Wonka Chocolate Stone', 'Item name is Willy Wonka Chocolate Stone');
    assert(verifyOrder1.items[0].quantity === 2, 'Item quantity is 2');
    assert(verifyOrder1.totalAmount === 378, `Total amount is ₹378 (₹189 * 2) (got ${verifyOrder1.totalAmount})`);
    assert(verifyOrder1.restaurantName === 'Cream Stone Artisanal Desserts', 'Vendor is Cream Stone Artisanal Desserts');

    // -------------------------------------------------------------------------
    // TEST 8: Checkout idempotency safeguards remain intact
    // -------------------------------------------------------------------------
    console.log('\n--- Test 8: Checkout idempotency safeguards intact ---');
    // Retrying with same key2 returns existing order with duplicatePrevented: true
    const retryRes = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': 'usr_customer_1'
      },
      body: JSON.stringify({
        restaurantId: 'rest_6',
        items: [{ dishId: 'dish_cs_2', quantity: 1 }],
        customerName: 'Ananya Customer',
        customerPhone: '+91 98765 43210',
        paymentMethod: 'demo',
        idempotencyKey: key2
      })
    });
    assert(retryRes.status === 200, 'Idempotent retry returned HTTP 200');
    const retryData = await retryRes.json();
    assert(retryData.duplicatePrevented === true, 'Duplicate was prevented');
    assert(retryData.order.id === order2.id, 'Returned same Order 2 ID');

    // Attempting same key with mismatched items returns 409 Conflict
    const mismatchRes = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': 'usr_customer_1'
      },
      body: JSON.stringify({
        restaurantId: 'rest_6',
        items: [{ dishId: 'dish_cs_1', quantity: 1 }], // different dish
        customerName: 'Ananya Customer',
        customerPhone: '+91 98765 43210',
        paymentMethod: 'demo',
        idempotencyKey: key2
      })
    });
    assert(mismatchRes.status === 409, `Mismatched key returned HTTP 409 Conflict (got ${mismatchRes.status})`);

  } finally {
    // -------------------------------------------------------------------------
    // Mandatory Data Preservation Cleanup: Clean up test orders created in this run
    // -------------------------------------------------------------------------
    console.log('\n--- Cleaning up temporary test orders created during test run ---');
    const dbNowRaw = fs.readFileSync(DB_FILE, 'utf-8');
    const dbNow = JSON.parse(dbNowRaw);

    const preCount = dbNow.orders.length;
    dbNow.orders = dbNow.orders.filter((o: any) => !testOrdersCreated.includes(o.id));
    const postCount = dbNow.orders.length;
    console.log(`[CLEANUP] Removed ${preCount - postCount} test orders. DB returned to ${postCount} baseline orders.`);

    // Restore dish stock that was decremented by test orders
    for (const testDishId of ['dish_cs_1', 'dish_cs_2', 'dish_cs_3']) {
      const origDish = dbBefore.dishes.find((d: any) => d.id === testDishId);
      const currDish = dbNow.dishes.find((d: any) => d.id === testDishId);
      if (origDish && currDish) {
        currDish.remainingQty = origDish.remainingQty;
      }
      const origInv = dbBefore.inventory.find((i: any) => i.dishId === testDishId);
      const currInv = dbNow.inventory.find((i: any) => i.dishId === testDishId);
      if (origInv && currInv) {
        currInv.remainingQty = origInv.remainingQty;
        currInv.soldQty = origInv.soldQty;
      }
    }

    fs.writeFileSync(DB_FILE, JSON.stringify(dbNow, null, 2), 'utf-8');

    // Verify baseline orders are completely preserved
    const finalDb = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
    assert(finalDb.orders.length === baselineOrderIds.size, `Exact baseline orders preserved (found ${finalDb.orders.length}, expected ${baselineOrderIds.size})`);
    for (const bId of baselineOrderIds) {
      assert(finalDb.orders.some((o: any) => o.id === bId), `Baseline order ${bId} verified present`);
    }
  }

  console.log(`\n=== ALL TESTS PASSED: ${passed}/${total} assertions ===`);
}

runAllTests().catch((err) => {
  console.error('\n[FATAL TEST FAILURE]:', err);
  process.exit(1);
});
