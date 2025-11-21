/**
 * Quick Test - Vendor Endpoint
 * Tests the newly created vendor endpoint
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:8020/api/v1';
let authToken = null;

async function makeRequest(method, endpoint, data = null, requiresAuth = true) {
  const config = {
    method,
    url: `${BASE_URL}${endpoint}`,
    headers: { 'Content-Type': 'application/json' }
  };

  if (requiresAuth && authToken) {
    config.headers['Authorization'] = `Bearer ${authToken}`;
  }

  if (data) {
    config.data = data;
  }

  return await axios(config);
}

async function main() {
  try {
    console.log('\n╔════════════════════════════════════════╗');
    console.log('║   Testing Vendor & Customer Endpoints ║');
    console.log('╚════════════════════════════════════════╝\n');

    // Step 1: Login
    console.log('1. Logging in...');
    const loginRes = await makeRequest('POST', '/auth/login', {
      email: 'admin@test.com',
      password: 'Admin@123'
    }, false);

    authToken = loginRes.data.data.tokens.accessToken;
    console.log('✓ Login successful\n');

    // Step 2: Create Vendor
    console.log('2. Creating vendor...');
    const vendorRes = await makeRequest('POST', '/vendors', {
      name: 'Test Vendor ' + Date.now(),
      email: `vendor${Date.now()}@test.com`,
      phone: '9876543210',
      address: '123 Vendor Street',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      postalCode: '400001',
      taxNumber: 'GST123456',
      paymentTerms: 30,
      openingBalance: 0,
      notes: 'Test vendor created via API'
    });

    console.log('✓ Vendor created successfully');
    console.log('  Vendor ID:', vendorRes.data.data.id);
    console.log('  Vendor Number:', vendorRes.data.data.vendorNumber);
    console.log('  Vendor Name:', vendorRes.data.data.name);
    console.log();

    // Step 3: Get all vendors
    console.log('3. Getting all vendors...');
    const vendorsRes = await makeRequest('GET', '/vendors');
    console.log('✓ Vendors retrieved');
    console.log('  Total vendors:', vendorsRes.data.data.pagination.total);
    console.log();

    // Step 4: Get vendor by ID
    console.log('4. Getting vendor by ID...');
    const vendorDetailRes = await makeRequest('GET', `/vendors/${vendorRes.data.data.id}`);
    console.log('✓ Vendor details retrieved');
    console.log('  Name:', vendorDetailRes.data.data.name);
    console.log('  Current Balance:', vendorDetailRes.data.data.currentBalance);
    console.log();

    // Step 5: Create Customer
    console.log('5. Creating customer...');
    const customerRes = await makeRequest('POST', '/customers', {
      name: 'Test Customer ' + Date.now(),
      email: `customer${Date.now()}@test.com`,
      phone: '9876543210',
      address: '456 Customer Avenue',
      city: 'Delhi',
      state: 'Delhi',
      country: 'India',
      postalCode: '110001',
      taxNumber: 'GST789012',
      creditLimit: 50000,
      creditDays: 30,
      openingBalance: 0,
      notes: 'Test customer created via API'
    });

    console.log('✓ Customer created successfully');
    console.log('  Customer ID:', customerRes.data.data.id);
    console.log('  Customer Number:', customerRes.data.data.customerNumber);
    console.log('  Customer Name:', customerRes.data.data.name);
    console.log();

    // Step 6: Get all customers
    console.log('6. Getting all customers...');
    const customersRes = await makeRequest('GET', '/customers');
    console.log('✓ Customers retrieved');
    console.log('  Total customers:', customersRes.data.data.pagination.total);
    console.log();

    console.log('╔════════════════════════════════════════╗');
    console.log('║   ✓ ALL TESTS PASSED SUCCESSFULLY!    ║');
    console.log('╚════════════════════════════════════════╝\n');

  } catch (error) {
    console.error('\n✗ Test failed:');
    console.error('  Error:', error.response?.data?.message || error.message);
    if (error.response?.data) {
      console.error('  Details:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

main();
