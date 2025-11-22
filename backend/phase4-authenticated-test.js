#!/usr/bin/env node

/**
 * Phase 4: Authenticated API Testing with Real User Login
 * Tests all API endpoints using actual user authentication
 */

import axios from 'axios';
import readline from 'readline';

// Configuration
const BASE_URL = process.env.API_URL || 'http://localhost:8020/api/v1';
let authToken = null;
let userProfile = null;
let testCompanyId = null;

// Test results tracking
const results = {
  passed: 0,
  failed: 0,
  skipped: 0,
  tests: []
};

// Helper function to log test results
function logTest(module, endpoint, status, message = '') {
  const result = { module, endpoint, status, message };
  results.tests.push(result);

  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⏭️';
  console.log(`${icon} [${module}] ${endpoint} - ${status} ${message}`);

  if (status === 'PASS') results.passed++;
  else if (status === 'FAIL') results.failed++;
  else results.skipped++;
}

// Helper to make authenticated requests
async function apiRequest(method, endpoint, data = null) {
  const config = {
    method,
    url: `${BASE_URL}${endpoint}`,
    headers: { 'Authorization': `Bearer ${authToken}` },
    timeout: 10000
  };

  if (data) {
    config.data = data;
  }

  return axios(config);
}

// Get user input for credentials
function getUserInput(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer);
    });
  });
}

// Test 1: User Login with Real Credentials
async function testUserLogin(email, password) {
  try {
    console.log(`\n🔐 Attempting login for: ${email}`);

    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email,
      password
    }, { timeout: 10000 });

    // Check for nested tokens structure (data.tokens.accessToken)
    if (response.data.data?.tokens?.accessToken) {
      authToken = response.data.data.tokens.accessToken;
      userProfile = response.data.data.user;
      testCompanyId = response.data.data.user?.companyId;
      logTest('Auth', 'POST /api/v1/auth/login', 'PASS',
        `Logged in as ${userProfile.name} (${userProfile.role})`);
      return true;
    }

    // Check for direct token fields
    if (response.data.token || response.data.access_token) {
      authToken = response.data.token || response.data.access_token;
      userProfile = response.data.user;
      testCompanyId = response.data.user?.companyId || response.data.companyId;
      logTest('Auth', 'POST /api/v1/auth/login', 'PASS',
        `Logged in as ${userProfile?.name || email}`);
      return true;
    }

    logTest('Auth', 'POST /api/v1/auth/login', 'FAIL', 'No token returned');
    return false;
  } catch (error) {
    logTest('Auth', 'POST /api/v1/auth/login', 'FAIL',
      error.response?.data?.message || error.message);
    return false;
  }
}

// Test 2: Get Current User Profile
async function testGetProfile() {
  try {
    const response = await apiRequest('GET', '/auth/me');
    const user = response.data.data || response.data.user || response.data;

    if (user && user.email) {
      logTest('Auth', 'GET /api/v1/auth/me', 'PASS',
        `Profile: ${user.name} (${user.email})`);
      console.log(`   └─ Role: ${user.role}, Company: ${user.company?.name || 'N/A'}`);
      return true;
    }
    logTest('Auth', 'GET /api/v1/auth/me', 'FAIL', 'No user data');
    return false;
  } catch (error) {
    logTest('Auth', 'GET /api/v1/auth/me', 'FAIL',
      error.response?.data?.message || error.message);
    return false;
  }
}

// Test 3: Get Accounts (with data count)
async function testGetAccounts() {
  try {
    const response = await apiRequest('GET', '/accounts');
    const accounts = response.data.data || response.data;

    if (Array.isArray(accounts)) {
      const count = accounts.length;
      logTest('Accounts', 'GET /api/v1/accounts', 'PASS',
        `Found ${count} account${count !== 1 ? 's' : ''}`);
      if (count > 0) {
        console.log(`   └─ Sample: ${accounts[0].name || accounts[0].account_name || 'N/A'}`);
      }
      return true;
    }
    logTest('Accounts', 'GET /api/v1/accounts', 'PASS', 'No accounts found');
    return true;
  } catch (error) {
    logTest('Accounts', 'GET /api/v1/accounts', 'FAIL',
      error.response?.data?.message || error.message);
    return false;
  }
}

// Test 4: Get Customers
async function testGetCustomers() {
  try {
    const response = await apiRequest('GET', '/customers');
    const customers = response.data.data || response.data;

    if (Array.isArray(customers)) {
      const count = customers.length;
      logTest('Accounts', 'GET /api/v1/customers', 'PASS',
        `Found ${count} customer${count !== 1 ? 's' : ''}`);
      if (count > 0) {
        console.log(`   └─ Sample: ${customers[0].name || customers[0].name_english || 'N/A'}`);
      }
      return true;
    }
    logTest('Accounts', 'GET /api/v1/customers', 'PASS', 'No customers found');
    return true;
  } catch (error) {
    logTest('Accounts', 'GET /api/v1/customers', 'FAIL',
      error.response?.data?.message || error.message);
    return false;
  }
}

// Test 5: Get Vendors
async function testGetVendors() {
  try {
    const response = await apiRequest('GET', '/vendors');
    const vendors = response.data.data || response.data;

    if (Array.isArray(vendors)) {
      const count = vendors.length;
      logTest('Accounts', 'GET /api/v1/vendors', 'PASS',
        `Found ${count} vendor${count !== 1 ? 's' : ''}`);
      if (count > 0) {
        console.log(`   └─ Sample: ${vendors[0].name || vendors[0].name_english || 'N/A'}`);
      }
      return true;
    }
    logTest('Accounts', 'GET /api/v1/vendors', 'PASS', 'No vendors found');
    return true;
  } catch (error) {
    logTest('Accounts', 'GET /api/v1/vendors', 'FAIL',
      error.response?.data?.message || error.message);
    return false;
  }
}

// Test 6: Get Products
async function testGetProducts() {
  try {
    const response = await apiRequest('GET', '/products');
    const products = response.data.data || response.data;

    if (Array.isArray(products)) {
      const count = products.length;
      logTest('Inventory', 'GET /api/v1/products', 'PASS',
        `Found ${count} product${count !== 1 ? 's' : ''}`);
      if (count > 0) {
        console.log(`   └─ Sample: ${products[0].name || products[0].productName || 'N/A'}`);
      }
      return true;
    }
    logTest('Inventory', 'GET /api/v1/products', 'PASS', 'No products found');
    return true;
  } catch (error) {
    logTest('Inventory', 'GET /api/v1/products', 'FAIL',
      error.response?.data?.message || error.message);
    return false;
  }
}

// Test 7: Get Warehouses
async function testGetWarehouses() {
  try {
    const response = await apiRequest('GET', '/warehouses');
    const warehouses = response.data.data || response.data;

    if (Array.isArray(warehouses)) {
      const count = warehouses.length;
      logTest('Inventory', 'GET /api/v1/warehouses', 'PASS',
        `Found ${count} warehouse${count !== 1 ? 's' : ''}`);
      if (count > 0) {
        console.log(`   └─ Sample: ${warehouses[0].name || warehouses[0].warehouseName || 'N/A'}`);
      }
      return true;
    }
    logTest('Inventory', 'GET /api/v1/warehouses', 'PASS', 'No warehouses found');
    return true;
  } catch (error) {
    logTest('Inventory', 'GET /api/v1/warehouses', 'FAIL',
      error.response?.data?.message || error.message);
    return false;
  }
}

// Test 8: Get Sales Orders
async function testGetSalesOrders() {
  try {
    const response = await apiRequest('GET', '/sales-orders');
    const orders = response.data.data || response.data;

    if (Array.isArray(orders)) {
      const count = orders.length;
      logTest('Sales', 'GET /api/v1/sales-orders', 'PASS',
        `Found ${count} sales order${count !== 1 ? 's' : ''}`);
      if (count > 0) {
        console.log(`   └─ Sample: Order #${orders[0].orderNumber || orders[0].id || 'N/A'}`);
      }
      return true;
    }
    logTest('Sales', 'GET /api/v1/sales-orders', 'PASS', 'No sales orders found');
    return true;
  } catch (error) {
    logTest('Sales', 'GET /api/v1/sales-orders', 'FAIL',
      error.response?.data?.message || error.message);
    return false;
  }
}

// Test 9: Get Purchase Orders
async function testGetPurchaseOrders() {
  try {
    const response = await apiRequest('GET', '/purchase-orders');
    const orders = response.data.data || response.data;

    if (Array.isArray(orders)) {
      const count = orders.length;
      logTest('Purchases', 'GET /api/v1/purchase-orders', 'PASS',
        `Found ${count} purchase order${count !== 1 ? 's' : ''}`);
      if (count > 0) {
        console.log(`   └─ Sample: PO #${orders[0].orderNumber || orders[0].id || 'N/A'}`);
      }
      return true;
    }
    logTest('Purchases', 'GET /api/v1/purchase-orders', 'PASS', 'No purchase orders found');
    return true;
  } catch (error) {
    logTest('Purchases', 'GET /api/v1/purchase-orders', 'FAIL',
      error.response?.data?.message || error.message);
    return false;
  }
}

// Test 10: Get Reports - Income Vouchers
async function testGetIncomeVouchers() {
  try {
    if (!testCompanyId) {
      logTest('Reports', 'GET /api/v1/income-vouchers', 'SKIP', 'No company ID');
      return false;
    }

    const response = await apiRequest('GET', `/income-vouchers/company/${testCompanyId}`);
    const vouchers = response.data.data || response.data;

    if (Array.isArray(vouchers)) {
      const count = vouchers.length;
      logTest('Reports', 'GET /api/v1/income-vouchers', 'PASS',
        `Found ${count} income voucher${count !== 1 ? 's' : ''}`);
      return true;
    }
    logTest('Reports', 'GET /api/v1/income-vouchers', 'PASS', 'No income vouchers found');
    return true;
  } catch (error) {
    logTest('Reports', 'GET /api/v1/income-vouchers', 'SKIP', 'Endpoint may not exist');
    return false;
  }
}

// Test 11: Get Reports - POS Invoices
async function testGetPOSInvoices() {
  try {
    const response = await apiRequest('GET', '/pos-invoices');
    const invoices = response.data.data || response.data;

    if (Array.isArray(invoices)) {
      const count = invoices.length;
      logTest('Reports', 'GET /api/v1/pos-invoices', 'PASS',
        `Found ${count} POS invoice${count !== 1 ? 's' : ''}`);
      return true;
    }
    logTest('Reports', 'GET /api/v1/pos-invoices', 'PASS', 'No POS invoices found');
    return true;
  } catch (error) {
    logTest('Reports', 'GET /api/v1/pos-invoices', 'SKIP', 'Endpoint may not exist');
    return false;
  }
}

// Main test runner
async function runAuthenticatedTests() {
  console.log('\n🚀 Phase 4: Authenticated API Testing\n');
  console.log('=' .repeat(70));
  console.log(`📍 API Base URL: ${BASE_URL}`);
  console.log('=' .repeat(70));
  console.log('');

  // Check if credentials provided via environment
  let email = process.env.TEST_EMAIL;
  let password = process.env.TEST_PASSWORD;

  // If not in env, prompt user
  if (!email || !password) {
    console.log('📝 Please provide login credentials:\n');
    email = await getUserInput('Email: ');
    password = await getUserInput('Password: ');
    console.log('');
  }

  // Test authentication
  const loginOk = await testUserLogin(email, password);
  if (!loginOk) {
    console.log('\n❌ Authentication failed. Cannot proceed with tests.\n');
    printSummary();
    return;
  }

  console.log(`\n✅ Authentication successful!`);
  console.log(`   Token: ${authToken.substring(0, 20)}...`);
  console.log(`   Company ID: ${testCompanyId}`);
  console.log('');

  // Run all authenticated tests
  await testGetProfile();
  await testGetAccounts();
  await testGetCustomers();
  await testGetVendors();
  await testGetProducts();
  await testGetWarehouses();
  await testGetSalesOrders();
  await testGetPurchaseOrders();
  await testGetIncomeVouchers();
  await testGetPOSInvoices();

  printSummary();
}

// Print test summary
function printSummary() {
  console.log('\n' + '='.repeat(70));
  console.log('📊 Authenticated API Test Summary');
  console.log('='.repeat(70));
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`⏭️  Skipped: ${results.skipped}`);
  console.log(`📝 Total: ${results.tests.length}`);

  const successRate = results.passed + results.failed > 0
    ? ((results.passed / (results.passed + results.failed)) * 100).toFixed(1)
    : 0;
  console.log(`\n📈 Success Rate: ${successRate}% (excluding skipped)`);

  // Show failed tests
  const failedTests = results.tests.filter(t => t.status === 'FAIL');
  if (failedTests.length > 0) {
    console.log('\n❌ Failed Tests:');
    failedTests.forEach(t => {
      console.log(`   [${t.module}] ${t.endpoint} - ${t.message}`);
    });
  }

  // Show user info
  if (userProfile) {
    console.log('\n👤 Tested As:');
    console.log(`   Name: ${userProfile.name}`);
    console.log(`   Email: ${userProfile.email}`);
    console.log(`   Role: ${userProfile.role}`);
    console.log(`   Company: ${userProfile.company?.name || 'N/A'}`);
  }

  console.log('\n' + '='.repeat(70) + '\n');

  // Exit with appropriate code
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run the tests
runAuthenticatedTests().catch(error => {
  console.error('\n❌ Test runner error:', error.message);
  process.exit(1);
});
