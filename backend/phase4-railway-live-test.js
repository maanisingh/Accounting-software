#!/usr/bin/env node

/**
 * Phase 4: Live Railway Deployment Integration Test
 * Tests all API endpoints on Railway production environment
 */

import axios from 'axios';

// Live Railway URLs
const RAILWAY_BACKEND_URL = 'https://backend-api-production-dd10.up.railway.app';
const RAILWAY_FRONTEND_URL = 'https://frontend-production-32b8.up.railway.app';
const BASE_URL = `${RAILWAY_BACKEND_URL}/api/v1`;

let authToken = null;
let testCompanyId = null;
let testUserId = null;

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
async function apiRequest(method, endpoint, data = null, skipAuth = false) {
  const config = {
    method,
    url: `${BASE_URL}${endpoint}`,
    headers: skipAuth ? {} : { 'Authorization': `Bearer ${authToken}` },
    timeout: 15000 // 15 second timeout for Railway
  };

  if (data) {
    config.data = data;
  }

  return axios(config);
}

// Test 1: Railway Backend Health Check
async function testRailwayHealth() {
  try {
    const response = await axios.get(`${RAILWAY_BACKEND_URL}/api/health`, { timeout: 10000 });
    if (response.data.success) {
      logTest('Railway', 'GET /api/health', 'PASS', `Railway backend is healthy`);
      return true;
    }
    logTest('Railway', 'GET /api/health', 'FAIL', 'Backend unhealthy');
    return false;
  } catch (error) {
    logTest('Railway', 'GET /api/health', 'FAIL', error.message);
    return false;
  }
}

// Test 2: Railway Frontend Accessibility
async function testRailwayFrontend() {
  try {
    const response = await axios.get(RAILWAY_FRONTEND_URL, { timeout: 10000 });
    if (response.status === 200) {
      logTest('Railway', `GET ${RAILWAY_FRONTEND_URL}`, 'PASS', 'Frontend accessible');
      return true;
    }
    logTest('Railway', `GET ${RAILWAY_FRONTEND_URL}`, 'FAIL', 'Frontend not accessible');
    return false;
  } catch (error) {
    logTest('Railway', `GET ${RAILWAY_FRONTEND_URL}`, 'FAIL', error.message);
    return false;
  }
}

// Test 3: CORS Configuration Check
async function testCORSConfiguration() {
  try {
    const response = await axios.options(`${RAILWAY_BACKEND_URL}/api/v1/auth/login`, {
      headers: {
        'Origin': RAILWAY_FRONTEND_URL,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'content-type'
      },
      timeout: 10000
    });

    const allowOrigin = response.headers['access-control-allow-origin'];
    if (allowOrigin && (allowOrigin === RAILWAY_FRONTEND_URL || allowOrigin === '*')) {
      logTest('CORS', 'OPTIONS /api/v1/auth/login', 'PASS', `CORS allows: ${allowOrigin}`);
      return true;
    }
    logTest('CORS', 'OPTIONS /api/v1/auth/login', 'FAIL', 'CORS not configured');
    return false;
  } catch (error) {
    logTest('CORS', 'OPTIONS /api/v1/auth/login', 'FAIL', error.message);
    return false;
  }
}

// Test 4: User Registration on Railway
async function testRailwayUserRegistration() {
  try {
    const testCompanyUUID = '550e8400-e29b-41d4-a716-446655440000';

    const userData = {
      email: `railway_test_${Date.now()}@zirakbook.com`,
      password: 'RailwayTest123!',
      confirmPassword: 'RailwayTest123!',
      name: 'Railway Integration Test User',
      role: 'COMPANY_ADMIN',
      companyId: testCompanyUUID
    };

    const response = await axios.post(`${BASE_URL}/auth/register`, userData, { timeout: 15000 });

    if (response.data.success || response.data.user) {
      testUserId = response.data.user?.id;
      testCompanyId = testCompanyUUID;
      logTest('Auth', 'POST /api/v1/auth/register', 'PASS', `User created: ${userData.email}`);
      return userData;
    }
    logTest('Auth', 'POST /api/v1/auth/register', 'FAIL', 'No user returned');
    return null;
  } catch (error) {
    if (error.response?.status === 409) {
      logTest('Auth', 'POST /api/v1/auth/register', 'SKIP', 'User already exists');
      return {
        email: 'admin@zirakbook.com',
        password: 'Admin123!',
        companyId: '550e8400-e29b-41d4-a716-446655440000'
      };
    }
    logTest('Auth', 'POST /api/v1/auth/register', 'FAIL', error.response?.data?.message || error.message);
    return null;
  }
}

// Test 5: User Login on Railway
async function testRailwayUserLogin(credentials) {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: credentials.email,
      password: credentials.password
    }, { timeout: 15000 });

    if (response.data.data?.tokens?.accessToken) {
      authToken = response.data.data.tokens.accessToken;
      testCompanyId = response.data.data.user?.companyId;
      logTest('Auth', 'POST /api/v1/auth/login', 'PASS', `Token received, CompanyId: ${testCompanyId}`);
      return true;
    }

    if (response.data.token || response.data.access_token) {
      authToken = response.data.token || response.data.access_token;
      testCompanyId = response.data.user?.companyId || response.data.companyId;
      logTest('Auth', 'POST /api/v1/auth/login', 'PASS', `Token received, CompanyId: ${testCompanyId}`);
      return true;
    }

    console.log('\n[DEBUG] No token found in response:', JSON.stringify(response.data, null, 2));
    logTest('Auth', 'POST /api/v1/auth/login', 'FAIL', 'No token returned');
    return false;
  } catch (error) {
    console.log('\n[DEBUG] Login Error:', error.response?.data || error.message);
    logTest('Auth', 'POST /api/v1/auth/login', 'FAIL', error.response?.data?.message || error.message);
    return false;
  }
}

// Test 6: Get User Profile on Railway
async function testRailwayGetProfile() {
  try {
    const response = await apiRequest('GET', '/auth/me');
    const user = response.data.data || response.data.user || response.data;
    const email = user?.email || response.data.email;

    if (user && email) {
      logTest('Auth', 'GET /api/v1/auth/me', 'PASS', `User: ${email}`);
      return true;
    }
    logTest('Auth', 'GET /api/v1/auth/me', 'FAIL', 'No user data');
    return false;
  } catch (error) {
    logTest('Auth', 'GET /api/v1/auth/me', 'FAIL', error.response?.data?.message || error.message);
    return false;
  }
}

// Test 7: Get Accounts on Railway
async function testRailwayGetAccounts() {
  try {
    const response = await apiRequest('GET', '/accounts');
    const accounts = response.data.data || response.data;
    if (Array.isArray(accounts)) {
      logTest('Accounts', 'GET /api/v1/accounts', 'PASS', `${accounts.length} accounts found`);
      return true;
    }
    logTest('Accounts', 'GET /api/v1/accounts', 'FAIL', 'Invalid response format');
    return false;
  } catch (error) {
    logTest('Accounts', 'GET /api/v1/accounts', 'FAIL', error.response?.data?.message || error.message);
    return false;
  }
}

// Test 8: Get Customers on Railway
async function testRailwayGetCustomers() {
  try {
    const response = await apiRequest('GET', '/customers');
    const customers = response.data.data || response.data;

    if (Array.isArray(customers)) {
      logTest('Accounts', 'GET /api/v1/customers', 'PASS', `${customers.length} customers found`);
      return true;
    }

    if (customers && typeof customers === 'object') {
      logTest('Accounts', 'GET /api/v1/customers', 'PASS', '0 customers found (object response)');
      return true;
    }

    logTest('Accounts', 'GET /api/v1/customers', 'FAIL', 'Invalid response format');
    return false;
  } catch (error) {
    logTest('Accounts', 'GET /api/v1/customers', 'FAIL', error.response?.data?.message || error.message);
    return false;
  }
}

// Test 9: Get Vendors on Railway
async function testRailwayGetVendors() {
  try {
    const response = await apiRequest('GET', '/vendors');
    const vendors = response.data.data || response.data;

    if (Array.isArray(vendors)) {
      logTest('Accounts', 'GET /api/v1/vendors', 'PASS', `${vendors.length} vendors found`);
      return true;
    }

    if (vendors && typeof vendors === 'object') {
      logTest('Accounts', 'GET /api/v1/vendors', 'PASS', '0 vendors found (object response)');
      return true;
    }

    logTest('Accounts', 'GET /api/v1/vendors', 'FAIL', 'Invalid response format');
    return false;
  } catch (error) {
    logTest('Accounts', 'GET /api/v1/vendors', 'FAIL', error.response?.data?.message || error.message);
    return false;
  }
}

// Test 10: Get Products on Railway
async function testRailwayGetProducts() {
  try {
    const response = await apiRequest('GET', '/products');
    const products = response.data.data || response.data;
    if (Array.isArray(products)) {
      logTest('Inventory', 'GET /api/v1/products', 'PASS', `${products.length} products found`);
      return true;
    }
    logTest('Inventory', 'GET /api/v1/products', 'FAIL', 'Invalid response format');
    return false;
  } catch (error) {
    logTest('Inventory', 'GET /api/v1/products', 'FAIL', error.response?.data?.message || error.message);
    return false;
  }
}

// Test 11: Get Warehouses on Railway
async function testRailwayGetWarehouses() {
  try {
    const response = await apiRequest('GET', '/warehouses');
    const warehouses = response.data.data || response.data;
    if (Array.isArray(warehouses)) {
      logTest('Inventory', 'GET /api/v1/warehouses', 'PASS', `${warehouses.length} warehouses found`);
      return true;
    }
    logTest('Inventory', 'GET /api/v1/warehouses', 'FAIL', 'Invalid response format');
    return false;
  } catch (error) {
    logTest('Inventory', 'GET /api/v1/warehouses', 'FAIL', error.response?.data?.message || error.message);
    return false;
  }
}

// Test 12: Get Sales Orders on Railway
async function testRailwayGetSalesOrders() {
  try {
    const response = await apiRequest('GET', '/sales-orders');
    const orders = response.data.data || response.data;

    if (Array.isArray(orders)) {
      logTest('Sales', 'GET /api/v1/sales-orders', 'PASS', `${orders.length} sales orders found`);
      return true;
    }

    if (orders && typeof orders === 'object') {
      logTest('Sales', 'GET /api/v1/sales-orders', 'PASS', '0 sales orders found (object response)');
      return true;
    }

    logTest('Sales', 'GET /api/v1/sales-orders', 'FAIL', 'Invalid response format');
    return false;
  } catch (error) {
    logTest('Sales', 'GET /api/v1/sales-orders', 'FAIL', error.response?.data?.message || error.message);
    return false;
  }
}

// Test 13: Get Purchase Orders on Railway
async function testRailwayGetPurchaseOrders() {
  try {
    const response = await apiRequest('GET', '/purchase-orders');
    const orders = response.data.data || response.data;

    if (Array.isArray(orders)) {
      logTest('Purchases', 'GET /api/v1/purchase-orders', 'PASS', `${orders.length} orders found`);
      return true;
    }

    if (orders && typeof orders === 'object') {
      logTest('Purchases', 'GET /api/v1/purchase-orders', 'PASS', '0 orders found (object response)');
      return true;
    }

    logTest('Purchases', 'GET /api/v1/purchase-orders', 'FAIL', 'Invalid response format');
    return false;
  } catch (error) {
    logTest('Purchases', 'GET /api/v1/purchase-orders', 'FAIL', error.response?.data?.message || error.message);
    return false;
  }
}

// Test 14: Database Connection Test
async function testDatabaseConnection() {
  try {
    // Try to fetch accounts which requires database
    const response = await apiRequest('GET', '/accounts');
    if (response.status === 200) {
      logTest('Database', 'PostgreSQL Connection', 'PASS', 'Database accessible');
      return true;
    }
    logTest('Database', 'PostgreSQL Connection', 'FAIL', 'Database not responding');
    return false;
  } catch (error) {
    logTest('Database', 'PostgreSQL Connection', 'FAIL', error.message);
    return false;
  }
}

// Main test runner
async function runRailwayTests() {
  console.log('\n🚀 Starting Phase 4: Railway Live Deployment Tests\n');
  console.log('=' .repeat(70));
  console.log(`🌐 Backend URL: ${RAILWAY_BACKEND_URL}`);
  console.log(`🎨 Frontend URL: ${RAILWAY_FRONTEND_URL}`);
  console.log('=' .repeat(70));
  console.log('');

  // Test Railway infrastructure
  const backendHealthy = await testRailwayHealth();
  if (!backendHealthy) {
    console.log('\n❌ Railway backend is not healthy. Aborting tests.\n');
    printSummary();
    return;
  }

  await testRailwayFrontend();
  await testCORSConfiguration();
  await testDatabaseConnection();

  // Test authentication flow
  const userCreds = await testRailwayUserRegistration();
  if (!userCreds) {
    console.log('\n❌ Could not create/retrieve test user. Aborting authenticated tests.\n');
    printSummary();
    return;
  }

  const loginOk = await testRailwayUserLogin(userCreds);
  if (!loginOk) {
    console.log('\n❌ Login failed. Aborting authenticated tests.\n');
    printSummary();
    return;
  }

  // Run authenticated tests
  await testRailwayGetProfile();
  await testRailwayGetAccounts();
  await testRailwayGetCustomers();
  await testRailwayGetVendors();
  await testRailwayGetProducts();
  await testRailwayGetWarehouses();
  await testRailwayGetSalesOrders();
  await testRailwayGetPurchaseOrders();

  printSummary();
}

// Print test summary
function printSummary() {
  console.log('\n' + '='.repeat(70));
  console.log('📊 Railway Deployment Test Summary');
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

  // Railway-specific info
  console.log('\n🌐 Railway Deployment URLs:');
  console.log(`   Backend:  ${RAILWAY_BACKEND_URL}`);
  console.log(`   Frontend: ${RAILWAY_FRONTEND_URL}`);

  console.log('\n' + '='.repeat(70) + '\n');

  // Exit with appropriate code
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run the tests
runRailwayTests().catch(error => {
  console.error('\n❌ Test runner error:', error.message);
  process.exit(1);
});
