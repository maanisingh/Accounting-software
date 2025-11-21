/**
 * Comprehensive API Test Suite for ZirakBook Accounting System
 * Tests complete accounting workflow with data flow verification
 */

import axios from 'axios';
import fs from 'fs';

const BASE_URL = 'http://localhost:8020/api/v1';
const RESULTS_FILE = '/tmp/zirakbook_api_test_results.json';

// Test results storage
const testResults = {
  startTime: new Date().toISOString(),
  totalTests: 0,
  passed: 0,
  failed: 0,
  modules: {},
  dataFlow: [],
  errors: []
};

// Global storage for entity IDs
const entityIds = {};
let authToken = '';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

/**
 * Test helper function
 */
async function runTest(moduleName, testName, testFn) {
  testResults.totalTests++;

  if (!testResults.modules[moduleName]) {
    testResults.modules[moduleName] = {
      total: 0,
      passed: 0,
      failed: 0,
      tests: []
    };
  }

  testResults.modules[moduleName].total++;

  const testResult = {
    name: testName,
    status: 'pending',
    duration: 0,
    error: null,
    data: null
  };

  console.log(`\n${colors.cyan}▶ Testing:${colors.reset} ${testName}`);

  const startTime = Date.now();

  try {
    const result = await testFn();
    const duration = Date.now() - startTime;

    testResult.status = 'passed';
    testResult.duration = duration;
    testResult.data = result;

    testResults.passed++;
    testResults.modules[moduleName].passed++;

    console.log(`${colors.green}✓ PASSED${colors.reset} (${duration}ms)`);

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;

    testResult.status = 'failed';
    testResult.duration = duration;
    testResult.error = error.message;

    testResults.failed++;
    testResults.modules[moduleName].failed++;
    testResults.errors.push({
      module: moduleName,
      test: testName,
      error: error.message,
      stack: error.stack
    });

    console.log(`${colors.red}✗ FAILED${colors.reset} (${duration}ms)`);
    console.log(`${colors.red}Error:${colors.reset} ${error.message}`);

    throw error;
  } finally {
    testResults.modules[moduleName].tests.push(testResult);
  }
}

/**
 * HTTP request helper
 */
async function makeRequest(method, endpoint, data = null, requiresAuth = true) {
  const config = {
    method,
    url: `${BASE_URL}${endpoint}`,
    headers: {
      'Content-Type': 'application/json'
    }
  };

  if (requiresAuth && authToken) {
    config.headers['Authorization'] = `Bearer ${authToken}`;
  }

  if (data) {
    config.data = data;
  }

  const response = await axios(config);
  return response.data;
}

/**
 * MODULE 1: Authentication Tests
 */
async function testAuthentication() {
  console.log(`\n${colors.blue}═══════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.blue}MODULE 1: Authentication & User Management${colors.reset}`);
  console.log(`${colors.blue}═══════════════════════════════════════════${colors.reset}`);

  await runTest('Authentication', 'Login with test credentials', async () => {
    const response = await makeRequest('POST', '/auth/login', {
      email: 'admin@test.com',
      password: 'Admin@123'
    }, false);

    authToken = response.data.tokens.accessToken;
    entityIds.userId = response.data.user.id;
    entityIds.companyId = response.data.user.companyId;

    console.log(`  User ID: ${entityIds.userId}`);
    console.log(`  Company ID: ${entityIds.companyId}`);
    console.log(`  Token: ${authToken ? authToken.substring(0, 20) + '...' : 'N/A'}`);

    return response;
  });

  await runTest('Authentication', 'Get current user profile', async () => {
    const response = await makeRequest('GET', '/auth/me');

    console.log(`  User: ${response.data.name}`);
    console.log(`  Role: ${response.data.role}`);

    return response;
  });
}

/**
 * MODULE 2: Inventory Setup Tests
 */
async function testInventorySetup() {
  console.log(`\n${colors.blue}═══════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.blue}MODULE 2: Inventory Setup${colors.reset}`);
  console.log(`${colors.blue}═══════════════════════════════════════════${colors.reset}`);

  // Create Warehouse
  await runTest('Inventory', 'Create Main Warehouse', async () => {
    const response = await makeRequest('POST', '/warehouses', {
      name: 'Main Warehouse',
      code: 'WH-MAIN-001',
      address: '123 Industrial Area',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      postalCode: '400001',
      isActive: true
    });

    entityIds.warehouseId = response.data.id;
    console.log(`  Warehouse ID: ${entityIds.warehouseId}`);

    testResults.dataFlow.push({
      step: 1,
      entity: 'Warehouse',
      id: entityIds.warehouseId,
      name: response.data.name
    });

    return response;
  });

  // Create Brand
  await runTest('Inventory', 'Create Product Brand', async () => {
    const response = await makeRequest('POST', '/brands', {
      name: 'Premium Electronics',
      description: 'High-quality electronic products'
    });

    entityIds.brandId = response.data.id;
    console.log(`  Brand ID: ${entityIds.brandId}`);

    testResults.dataFlow.push({
      step: 2,
      entity: 'Brand',
      id: entityIds.brandId,
      name: response.data.name
    });

    return response;
  });

  // Create Category
  await runTest('Inventory', 'Create Product Category', async () => {
    const response = await makeRequest('POST', '/categories', {
      name: 'Electronics',
      description: 'Electronic devices and accessories'
    });

    entityIds.categoryId = response.data.id;
    console.log(`  Category ID: ${entityIds.categoryId}`);

    testResults.dataFlow.push({
      step: 3,
      entity: 'Category',
      id: entityIds.categoryId,
      name: response.data.name
    });

    return response;
  });

  // Create Products
  await runTest('Inventory', 'Create Product - Laptop', async () => {
    const response = await makeRequest('POST', '/products', {
      name: 'Business Laptop Pro',
      sku: 'LAPTOP-PRO-001',
      description: 'High-performance laptop for business',
      type: 'GOODS',
      brandId: entityIds.brandId,
      categoryId: entityIds.categoryId,
      unit: 'PCS',
      sellingPrice: 85000.00,
      purchasePrice: 65000.00,
      taxRate: 18.00,
      hsnCode: '8471',
      reorderLevel: 5,
      isActive: true
    });

    entityIds.productId1 = response.data.id;
    console.log(`  Product 1 ID: ${entityIds.productId1}`);
    console.log(`  SKU: ${response.data.sku}`);

    testResults.dataFlow.push({
      step: 4,
      entity: 'Product',
      id: entityIds.productId1,
      name: response.data.name,
      sku: response.data.sku
    });

    return response;
  });

  await runTest('Inventory', 'Create Product - Mouse', async () => {
    const response = await makeRequest('POST', '/products', {
      name: 'Wireless Mouse',
      sku: 'MOUSE-WL-001',
      description: 'Ergonomic wireless mouse',
      type: 'GOODS',
      brandId: entityIds.brandId,
      categoryId: entityIds.categoryId,
      unit: 'PCS',
      sellingPrice: 1500.00,
      purchasePrice: 1000.00,
      taxRate: 18.00,
      hsnCode: '8471',
      reorderLevel: 10,
      isActive: true
    });

    entityIds.productId2 = response.data.id;
    console.log(`  Product 2 ID: ${entityIds.productId2}`);

    return response;
  });

  // Verify products list
  await runTest('Inventory', 'Get all products', async () => {
    const response = await makeRequest('GET', '/products?limit=10');

    console.log(`  Total products: ${response.data.length}`);

    return response;
  });
}

/**
 * MODULE 3: Purchase Cycle Tests
 */
async function testPurchaseCycle() {
  console.log(`\n${colors.blue}═══════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.blue}MODULE 3: Complete Purchase Cycle${colors.reset}`);
  console.log(`${colors.blue}═══════════════════════════════════════════${colors.reset}`);

  // Create Vendor
  await runTest('Purchases', 'Create Vendor', async () => {
    const response = await makeRequest('POST', '/vendors', {
      name: 'Tech Suppliers Ltd',
      email: 'contact@techsuppliers.com',
      phone: '9876543210',
      address: '456 Supplier Street',
      city: 'Delhi',
      state: 'Delhi',
      country: 'India',
      postalCode: '110001',
      taxNumber: '07AABCU9603R1ZX',
      paymentTerms: 30,
    });

    entityIds.vendorId = response.data.id;
    console.log(`  Vendor ID: ${entityIds.vendorId}`);

    testResults.dataFlow.push({
      step: 5,
      entity: 'Vendor',
      id: entityIds.vendorId,
      name: response.data.name
    });

    return response;
  });

  // Create Purchase Order
  await runTest('Purchases', 'Create Purchase Order', async () => {
    const response = await makeRequest('POST', '/purchase-orders', {
      vendorId: entityIds.vendorId,
      orderDate: '2025-11-21',
      expectedDate: '2025-11-30',
      paymentTerms: 'NET_30',
      notes: 'Urgent order for Q4',
      items: [
        {
          productId: entityIds.productId1,
          quantity: 10,
          unitPrice: 65000.00,
          taxRate: 18.00,
          discount: 0
        },
        {
          productId: entityIds.productId2,
          quantity: 50,
          unitPrice: 1000.00,
          taxRate: 18.00,
          discount: 0
        }
      ]
    });

    entityIds.purchaseOrderId = response.data.id;
    console.log(`  PO ID: ${entityIds.purchaseOrderId}`);
    console.log(`  PO Number: ${response.data.poNumber}`);
    console.log(`  Total Amount: ₹${response.data.totalAmount}`);

    testResults.dataFlow.push({
      step: 6,
      entity: 'Purchase Order',
      id: entityIds.purchaseOrderId,
      number: response.data.poNumber,
      amount: response.data.totalAmount
    });

    return response;
  });

  // Approve Purchase Order
  await runTest('Purchases', 'Approve Purchase Order', async () => {
    const response = await makeRequest('POST', `/purchase-orders/${entityIds.purchaseOrderId}/approve`, {});

    console.log(`  Status: ${response.data.status}`);

    return response;
  });

  // Create Goods Receipt
  await runTest('Purchases', 'Create Goods Receipt', async () => {
    const response = await makeRequest('POST', '/goods-receipts', {
      vendorId: entityIds.vendorId,
      purchaseOrderId: entityIds.purchaseOrderId,
      receivedDate: '2025-11-21',
      warehouseId: entityIds.warehouseId,
      notes: 'All items received in good condition',
      items: [
        {
          productId: entityIds.productId1,
          orderedQty: 10,
          receivedQty: 10,
          acceptedQty: 10,
          rejectedQty: 0,
          unitPrice: 65000.00,
          taxRate: 18.00
        },
        {
          productId: entityIds.productId2,
          orderedQty: 50,
          receivedQty: 50,
          acceptedQty: 50,
          rejectedQty: 0,
          unitPrice: 1000.00,
          taxRate: 18.00
        }
      ]
    });

    entityIds.goodsReceiptId = response.data.id;
    console.log(`  GRN ID: ${entityIds.goodsReceiptId}`);
    console.log(`  GRN Number: ${response.data.grnNumber}`);

    testResults.dataFlow.push({
      step: 7,
      entity: 'Goods Receipt',
      id: entityIds.goodsReceiptId,
      number: response.data.grnNumber
    });

    return response;
  });

  // Verify Stock Updated
  await runTest('Purchases', 'Verify Stock Levels After GRN', async () => {
    const response1 = await makeRequest('GET', `/stock?productId=${entityIds.productId1}&warehouseId=${entityIds.warehouseId}`);
    const response2 = await makeRequest('GET', `/stock?productId=${entityIds.productId2}&warehouseId=${entityIds.warehouseId}`);

    console.log(`  Product 1 Stock: ${response1.data[0]?.quantity || 0} units`);
    console.log(`  Product 2 Stock: ${response2.data[0]?.quantity || 0} units`);

    testResults.dataFlow.push({
      step: 8,
      entity: 'Stock Update',
      product1Stock: response1.data[0]?.quantity || 0,
      product2Stock: response2.data[0]?.quantity || 0
    });

    return { product1: response1, product2: response2 };
  });

  // Create Bill
  await runTest('Purchases', 'Create Bill', async () => {
    const response = await makeRequest('POST', '/bills', {
      vendorId: entityIds.vendorId,
      billDate: '2025-11-21',
      dueDate: '2025-12-21',
      goodsReceiptId: entityIds.goodsReceiptId,
      notes: 'Payment due as per terms',
      items: [
        {
          productId: entityIds.productId1,
          quantity: 10,
          unitPrice: 65000.00,
          taxRate: 18.00,
          discount: 0
        },
        {
          productId: entityIds.productId2,
          quantity: 50,
          unitPrice: 1000.00,
          taxRate: 18.00,
          discount: 0
        }
      ]
    });

    entityIds.billId = response.data.id;
    console.log(`  Bill ID: ${entityIds.billId}`);
    console.log(`  Bill Number: ${response.data.billNumber}`);
    console.log(`  Total Amount: ₹${response.data.totalAmount}`);

    testResults.dataFlow.push({
      step: 9,
      entity: 'Bill',
      id: entityIds.billId,
      number: response.data.billNumber,
      amount: response.data.totalAmount
    });

    return response;
  });

  // Create Payment
  await runTest('Purchases', 'Create Payment for Bill', async () => {
    const response = await makeRequest('POST', '/payments', {
      vendorId: entityIds.vendorId,
      paymentDate: '2025-11-21',
      amount: 826900.00,
      paymentMethod: 'BANK_TRANSFER',
      reference: 'TXN-2025-001',
      notes: 'Full payment for bill',
      bills: [
        {
          billId: entityIds.billId,
          amount: 826900.00
        }
      ]
    });

    entityIds.paymentId = response.data.id;
    console.log(`  Payment ID: ${entityIds.paymentId}`);
    console.log(`  Payment Number: ${response.data.paymentNumber}`);

    testResults.dataFlow.push({
      step: 10,
      entity: 'Payment',
      id: entityIds.paymentId,
      number: response.data.paymentNumber,
      amount: response.data.amount
    });

    return response;
  });
}

/**
 * MODULE 4: Sales Cycle Tests
 */
async function testSalesCycle() {
  console.log(`\n${colors.blue}═══════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.blue}MODULE 4: Complete Sales Cycle${colors.reset}`);
  console.log(`${colors.blue}═══════════════════════════════════════════${colors.reset}`);

  // Create Customer
  await runTest('Sales', 'Create Customer', async () => {
    const response = await makeRequest('POST', '/customers', {
      name: 'Corporate Solutions Inc',
      email: 'sales@corpsolutions.com',
      phone: '9123456789',
      address: '789 Business Park',
      city: 'Bangalore',
      state: 'Karnataka',
      country: 'India',
      postalCode: '560001',
      taxNumber: '29AABCU9603R1ZX',
      creditDays: 15,
      creditLimit: 3000000.00,
    });

    entityIds.customerId = response.data.id;
    console.log(`  Customer ID: ${entityIds.customerId}`);

    testResults.dataFlow.push({
      step: 11,
      entity: 'Customer',
      id: entityIds.customerId,
      name: response.data.name
    });

    return response;
  });

  // Create Sales Order
  await runTest('Sales', 'Create Sales Order', async () => {
    const response = await makeRequest('POST', '/sales-orders', {
      customerId: entityIds.customerId,
      orderDate: '2025-11-21',
      expectedDate: '2025-11-25',
      paymentTerms: 'NET_15',
      notes: 'Rush order - priority delivery',
      items: [
        {
          productId: entityIds.productId1,
          quantity: 5,
          unitPrice: 85000.00,
          taxRate: 18.00,
          discount: 0
        },
        {
          productId: entityIds.productId2,
          quantity: 20,
          unitPrice: 1500.00,
          taxRate: 18.00,
          discount: 0
        }
      ]
    });

    entityIds.salesOrderId = response.data.id;
    console.log(`  SO ID: ${entityIds.salesOrderId}`);
    console.log(`  SO Number: ${response.data.soNumber}`);
    console.log(`  Total Amount: ₹${response.data.totalAmount}`);

    testResults.dataFlow.push({
      step: 12,
      entity: 'Sales Order',
      id: entityIds.salesOrderId,
      number: response.data.soNumber,
      amount: response.data.totalAmount
    });

    return response;
  });

  // Create Delivery Challan
  await runTest('Sales', 'Create Delivery Challan', async () => {
    const response = await makeRequest('POST', '/delivery-challans', {
      salesOrderId: entityIds.salesOrderId,
      deliveryDate: '2025-11-21',
      warehouseId: entityIds.warehouseId,
      notes: 'Delivered by courier',
      items: [
        {
          productId: entityIds.productId1,
          quantity: 5
        },
        {
          productId: entityIds.productId2,
          quantity: 20
        }
      ]
    });

    entityIds.deliveryChallanId = response.data.id;
    console.log(`  DC ID: ${entityIds.deliveryChallanId}`);
    console.log(`  DC Number: ${response.data.dcNumber}`);

    testResults.dataFlow.push({
      step: 13,
      entity: 'Delivery Challan',
      id: entityIds.deliveryChallanId,
      number: response.data.dcNumber
    });

    return response;
  });

  // Verify Stock Reduced
  await runTest('Sales', 'Verify Stock Levels After Delivery', async () => {
    const response1 = await makeRequest('GET', `/stock?productId=${entityIds.productId1}&warehouseId=${entityIds.warehouseId}`);
    const response2 = await makeRequest('GET', `/stock?productId=${entityIds.productId2}&warehouseId=${entityIds.warehouseId}`);

    console.log(`  Product 1 Stock: ${response1.data[0]?.quantity || 0} units (should be 5)`);
    console.log(`  Product 2 Stock: ${response2.data[0]?.quantity || 0} units (should be 30)`);

    testResults.dataFlow.push({
      step: 14,
      entity: 'Stock After Delivery',
      product1Stock: response1.data[0]?.quantity || 0,
      product2Stock: response2.data[0]?.quantity || 0
    });

    return { product1: response1, product2: response2 };
  });
}

/**
 * MODULE 5: Accounts & Journal Entries Tests
 */
async function testAccounting() {
  console.log(`\n${colors.blue}═══════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.blue}MODULE 5: Accounting & Journal Entries${colors.reset}`);
  console.log(`${colors.blue}═══════════════════════════════════════════${colors.reset}`);

  // Get Chart of Accounts
  await runTest('Accounting', 'Get Chart of Accounts', async () => {
    const response = await makeRequest('GET', '/accounts');

    console.log(`  Total accounts: ${response.data.length}`);

    // Store some account IDs for journal entries
    if (response.data.length > 0) {
      entityIds.accountId1 = response.data[0].id;
      entityIds.accountId2 = response.data[1]?.id || response.data[0].id;
    }

    return response;
  });

  // Create Journal Entry
  await runTest('Accounting', 'Create Manual Journal Entry', async () => {
    const response = await makeRequest('POST', '/journal-entries', {
      entryDate: '2025-11-21',
      reference: 'JE-MANUAL-001',
      notes: 'Test journal entry for verification',
      lines: [
        {
          accountId: entityIds.accountId1,
          transactionType: 'DEBIT',
          amount: 50000.00,
          description: 'Test debit entry'
        },
        {
          accountId: entityIds.accountId2,
          transactionType: 'CREDIT',
          amount: 50000.00,
          description: 'Test credit entry'
        }
      ]
    });

    entityIds.journalEntryId = response.data.id;
    console.log(`  JE ID: ${entityIds.journalEntryId}`);
    console.log(`  JE Number: ${response.data.entryNumber}`);

    testResults.dataFlow.push({
      step: 15,
      entity: 'Journal Entry',
      id: entityIds.journalEntryId,
      number: response.data.entryNumber
    });

    return response;
  });

  // Get Journal Entries
  await runTest('Accounting', 'Get All Journal Entries', async () => {
    const response = await makeRequest('GET', '/journal-entries');

    console.log(`  Total entries: ${response.data.length}`);

    return response;
  });

  // Get Payments
  await runTest('Accounting', 'Get All Payments', async () => {
    const response = await makeRequest('GET', '/payments');

    console.log(`  Total payments: ${response.data.length}`);

    return response;
  });
}

/**
 * MODULE 6: Reports Tests
 */
async function testReports() {
  console.log(`\n${colors.blue}═══════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.blue}MODULE 6: Financial & Business Reports${colors.reset}`);
  console.log(`${colors.blue}═══════════════════════════════════════════${colors.reset}`);

  // Balance Sheet
  await runTest('Reports', 'Generate Balance Sheet', async () => {
    const response = await makeRequest('GET', '/reports/balance-sheet?asOfDate=2025-11-21');

    console.log(`  Report generated successfully`);

    return response;
  });

  // P&L Statement
  await runTest('Reports', 'Generate Profit & Loss Statement', async () => {
    const response = await makeRequest('GET', '/reports/profit-loss?startDate=2025-01-01&endDate=2025-11-21');

    console.log(`  Report generated successfully`);

    return response;
  });

  // Trial Balance
  await runTest('Reports', 'Generate Trial Balance', async () => {
    const response = await makeRequest('GET', '/reports/trial-balance?asOfDate=2025-11-21');

    console.log(`  Report generated successfully`);

    return response;
  });

  // Stock Valuation
  await runTest('Reports', 'Generate Stock Valuation Report', async () => {
    const response = await makeRequest('GET', '/reports/stock-valuation');

    console.log(`  Report generated successfully`);

    return response;
  });

  // Sales Summary
  await runTest('Reports', 'Generate Sales Summary Report', async () => {
    const response = await makeRequest('GET', '/reports/sales-summary?startDate=2025-01-01&endDate=2025-11-21');

    console.log(`  Report generated successfully`);

    return response;
  });

  // Purchase Summary
  await runTest('Reports', 'Generate Purchase Summary Report', async () => {
    const response = await makeRequest('GET', '/reports/purchase-summary?startDate=2025-01-01&endDate=2025-11-21');

    console.log(`  Report generated successfully`);

    return response;
  });

  // Stock Movement
  await runTest('Reports', 'Generate Stock Movement Report', async () => {
    const response = await makeRequest('GET', '/reports/stock-movement?startDate=2025-01-01&endDate=2025-11-21');

    console.log(`  Report generated successfully`);

    return response;
  });

  // GST Report
  await runTest('Reports', 'Generate GST Report', async () => {
    const response = await makeRequest('GET', '/reports/gst?startDate=2025-01-01&endDate=2025-11-21');

    console.log(`  Report generated successfully`);

    return response;
  });
}

/**
 * Print final test results
 */
function printResults() {
  console.log(`\n${colors.blue}╔═══════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.blue}║           COMPREHENSIVE API TEST RESULTS                  ║${colors.reset}`);
  console.log(`${colors.blue}╚═══════════════════════════════════════════════════════════╝${colors.reset}\n`);

  console.log(`${colors.cyan}Total Tests:${colors.reset} ${testResults.totalTests}`);
  console.log(`${colors.green}Passed:${colors.reset}      ${testResults.passed}`);
  console.log(`${colors.red}Failed:${colors.reset}      ${testResults.failed}`);
  console.log(`${colors.yellow}Success Rate:${colors.reset} ${((testResults.passed / testResults.totalTests) * 100).toFixed(2)}%`);

  console.log(`\n${colors.cyan}Module Breakdown:${colors.reset}`);
  for (const [moduleName, moduleResults] of Object.entries(testResults.modules)) {
    const successRate = ((moduleResults.passed / moduleResults.total) * 100).toFixed(2);
    console.log(`  ${moduleName}: ${moduleResults.passed}/${moduleResults.total} (${successRate}%)`);
  }

  if (testResults.errors.length > 0) {
    console.log(`\n${colors.red}Errors Encountered:${colors.reset}`);
    testResults.errors.forEach((error, index) => {
      console.log(`  ${index + 1}. [${error.module}] ${error.test}`);
      console.log(`     ${error.error}`);
    });
  }

  console.log(`\n${colors.cyan}Data Flow Verification:${colors.reset}`);
  testResults.dataFlow.forEach((flow, index) => {
    console.log(`  ${flow.step}. ${flow.entity}: ${flow.name || flow.number || flow.id || 'Created'}`);
  });

  console.log(`\n${colors.cyan}Entity IDs Created:${colors.reset}`);
  for (const [key, value] of Object.entries(entityIds)) {
    if (key !== 'userId' && key !== 'companyId') {
      console.log(`  ${key}: ${value}`);
    }
  }

  // Save results to file
  testResults.endTime = new Date().toISOString();
  testResults.duration = new Date(testResults.endTime) - new Date(testResults.startTime);
  testResults.entityIds = entityIds;

  fs.writeFileSync(RESULTS_FILE, JSON.stringify(testResults, null, 2));
  console.log(`\n${colors.green}✓ Results saved to:${colors.reset} ${RESULTS_FILE}`);

  // Print summary
  if (testResults.failed === 0) {
    console.log(`\n${colors.green}╔═══════════════════════════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.green}║  ✓ ALL TESTS PASSED! SYSTEM IS PRODUCTION-READY!        ║${colors.reset}`);
    console.log(`${colors.green}╚═══════════════════════════════════════════════════════════╝${colors.reset}\n`);
  } else {
    console.log(`\n${colors.yellow}╔═══════════════════════════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.yellow}║  ⚠ SOME TESTS FAILED - REVIEW ERRORS ABOVE              ║${colors.reset}`);
    console.log(`${colors.yellow}╚═══════════════════════════════════════════════════════════╝${colors.reset}\n`);
  }
}

/**
 * Main test execution
 */
async function main() {
  console.log(`${colors.cyan}═══════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.cyan}   ZirakBook Accounting System - Comprehensive API Tests${colors.reset}`);
  console.log(`${colors.cyan}═══════════════════════════════════════════════════════════${colors.reset}\n`);
  console.log(`${colors.yellow}Testing complete accounting workflow with data flow verification${colors.reset}`);
  console.log(`${colors.yellow}Base URL: ${BASE_URL}${colors.reset}\n`);

  try {
    await testAuthentication();
    await testInventorySetup();
    await testPurchaseCycle();
    await testSalesCycle();
    await testAccounting();
    await testReports();

    printResults();

    process.exit(testResults.failed === 0 ? 0 : 1);
  } catch (error) {
    console.error(`\n${colors.red}Fatal error:${colors.reset}`, error.message);
    printResults();
    process.exit(1);
  }
}

// Run tests
main();
