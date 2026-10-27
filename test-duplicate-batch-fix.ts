import fs from 'fs';
import path from 'path';

const DB_FILE = path.join(process.cwd(), 'data', 'tastely-db.json');

async function runTests() {
  console.log('--- STARTING FOOD DUPLICATE & BATCH IDENTIFIER TESTS ---');
  let passedCount = 0;
  let totalCount = 0;

  function assert(condition: boolean, msg: string) {
    totalCount++;
    if (condition) {
      console.log(`[PASS] ${msg}`);
      passedCount++;
    } else {
      console.error(`[FAIL] ${msg}`);
      throw new Error(`Assertion failed: ${msg}`);
    }
  }

  // 1. Check historical records preservation
  const dbRaw = fs.readFileSync(DB_FILE, 'utf-8');
  const db = JSON.parse(dbRaw);

  const lasagnaItems = db.inventory.filter((i: any) => i.dishName === 'Artisan Lasagna Batch 100');
  assert(lasagnaItems.length === 8, `Historical 8 Artisan Lasagna Batch 100 inventory items preserved (found ${lasagnaItems.length})`);
  assert(db.orders.length > 0, `Existing historical orders preserved (count: ${db.orders.length})`);
  assert(db.donations.length > 0, `Existing historical donations preserved (count: ${db.donations.length})`);
  assert(db.donationRequests.length > 0, `Existing historical donation requests preserved (count: ${db.donationRequests.length})`);

  // 2. Test GET /api/inventory distinguishes duplicate food names with batch identifiers & accurate stock
  const baseUrl = 'http://localhost:3000';
  const getInvRes = await fetch(`${baseUrl}/api/inventory`, {
    headers: { 'x-user-id': 'usr_vendor_1' } // rest_2 vendor
  });
  assert(getInvRes.ok, 'GET /api/inventory returns 200 OK');
  const invData = await getInvRes.json();
  const vendorLasagnas = invData.inventory.filter((i: any) => i.dishName === 'Artisan Lasagna Batch 100');
  assert(vendorLasagnas.length === 8, `Vendor inventory contains all 8 batches`);
  
  // Verify each identical food name has a distinguishable batch identifier
  const batchIds = new Set(vendorLasagnas.map((i: any) => i.batchIdentifier));
  assert(batchIds.size === 8, `All 8 items with identical name have distinct batch identifiers (unique count: ${batchIds.size})`);
  
  // Verify remaining stock accuracy for the 2 in-stock batches
  const batch100 = vendorLasagnas.find((i: any) => i.remainingQty === 100);
  const batch15 = vendorLasagnas.find((i: any) => i.remainingQty === 15);
  assert(!!batch100, 'Batch with 100 remaining portions is present');
  assert(!!batch15, 'Batch with 15 remaining portions is present');

  // 3. Test Accidental Duplicate Prevention: submitting identical name without distinct batch identifier
  const dupWithoutBatchRes = await fetch(`${baseUrl}/api/inventory`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': 'usr_vendor_1'
    },
    body: JSON.stringify({
      dishName: 'Artisan Lasagna Batch 100',
      preparedQty: 50,
      price: 150
    })
  });
  assert(dupWithoutBatchRes.status === 409, `Accidental duplicate submission without batch identifier is rejected with HTTP 409 (received ${dupWithoutBatchRes.status})`);
  const dupWithoutBatchErr = await dupWithoutBatchRes.json();
  assert(dupWithoutBatchErr.error.includes('Duplicate Food Item Detected'), `Clear duplicate prevention error message: "${dupWithoutBatchErr.error}"`);

  // 4. Test Accidental Duplicate Batch Prevention: submitting with existing batch identifier
  const dupWithExistingBatchRes = await fetch(`${baseUrl}/api/inventory`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': 'usr_vendor_1'
    },
    body: JSON.stringify({
      dishName: 'Artisan Lasagna Batch 100',
      batchIdentifier: vendorLasagnas[0].batchIdentifier,
      preparedQty: 50,
      price: 150
    })
  });
  assert(dupWithExistingBatchRes.status === 409, `Duplicate batch submission with existing batch identifier is rejected with HTTP 409 (received ${dupWithExistingBatchRes.status})`);
  const dupWithExistingBatchErr = await dupWithExistingBatchRes.json();
  assert(dupWithExistingBatchErr.error.includes('Duplicate Batch Detected'), `Clear duplicate batch error message: "${dupWithExistingBatchErr.error}"`);

  // 5. Test Intentional Separate Batch Creation: submitting with a distinct batch identifier
  const distinctBatchId = `Batch_Test_${Date.now()}`;
  const validBatchRes = await fetch(`${baseUrl}/api/inventory`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': 'usr_vendor_1'
    },
    body: JSON.stringify({
      dishName: 'Artisan Lasagna Batch 100',
      batchIdentifier: distinctBatchId,
      preparedQty: 40,
      price: 150,
      category: 'Pizza'
    })
  });
  assert(validBatchRes.status === 201, `Intentional separate batch with distinct batch identifier succeeded with HTTP 201 (received ${validBatchRes.status})`);
  const validBatchData = await validBatchRes.json();
  assert(validBatchData.item.batchIdentifier === distinctBatchId, `Created inventory item has batch identifier "${distinctBatchId}"`);
  assert(validBatchData.item.remainingQty === 40, `Created inventory item remainingQty is 40`);
  assert(validBatchData.dish.batchIdentifier === distinctBatchId, `Associated catalog dish has batch identifier "${distinctBatchId}"`);

  // 6. Test Stock Invariant & Deduction with Record Sale & Donation Allocation
  const testItemId = validBatchData.item.id;
  
  // Record sale of 5 units
  const saleRes = await fetch(`${baseUrl}/api/inventory/${testItemId}/record-sale`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': 'usr_vendor_1'
    },
    body: JSON.stringify({ quantity: 5 })
  });
  assert(saleRes.ok, 'Recorded sale of 5 units');
  const saleData = await saleRes.json();
  assert(saleData.item.remainingQty === 35, `Remaining stock after sale is exactly 35 (got ${saleData.item.remainingQty})`);

  // Donate 10 units
  const donRes = await fetch(`${baseUrl}/api/donations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': 'usr_vendor_1'
    },
    body: JSON.stringify({
      inventoryId: testItemId,
      quantity: 10,
      confirmedSuitable: true,
      pickupDeadline: 'Today before 23:00'
    })
  });
  assert(donRes.status === 201, 'Published 10 portions for donation');
  const donData = await donRes.json();
  assert(donData.remainingStock === 25, `Remaining stock after donation allocation is exactly 25 (got ${donData.remainingStock})`);
  assert(donData.donation.batchIdentifier === distinctBatchId, `Donation offer preserves batch identifier "${distinctBatchId}"`);

  // Verify stock calculation invariant in PUT /api/inventory
  const invalidPutRes = await fetch(`${baseUrl}/api/inventory/${testItemId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': 'usr_vendor_1'
    },
    body: JSON.stringify({
      preparedQty: 10, // Invalid because sold (5) + donated (10) = 15 > 10 prepared!
    })
  });
  assert(invalidPutRes.status === 400, `Stock invariant violation correctly caught and rejected with HTTP 400 (received ${invalidPutRes.status})`);

  // Clean up only the newly created test item from db to leave existing database records clean
  const cleanDb = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
  cleanDb.inventory = cleanDb.inventory.filter((i: any) => i.id !== testItemId);
  cleanDb.dishes = cleanDb.dishes.filter((d: any) => d.id !== validBatchData.dish.id);
  cleanDb.donations = cleanDb.donations.filter((d: any) => d.id !== donData.donation.id);
  fs.writeFileSync(DB_FILE, JSON.stringify(cleanDb, null, 2), 'utf-8');

  console.log(`\n--- ALL ${passedCount}/${totalCount} TESTS PASSED SUCCESSFULLY ---`);
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
