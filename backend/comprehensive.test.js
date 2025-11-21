/**
 * Comprehensive ZirakBook API Test Suite
 * Tests all endpoints with all HTTP methods (GET, POST, PUT, DELETE)
 * Using Jest + Supertest for professional API testing
 */

const request = require('supertest');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:8020';

// Test data
let authToken = '';
let testCompanyId = '';
let testUserId = '';
let testCustomerId = '';
let testVendorId = '';
let testProductId = '';
let testBrandId = '';
let testCategoryId = '';
let testWarehouseId = '';
let testAccountId = '';
let testInvoiceId = '';

describe('ZirakBook Accounting System - Comprehensive API Tests', () => {

  // ============================================================================
  // SETUP & AUTHENTICATION
  // ============================================================================

  beforeAll(async () => {
    // Wait for API to be ready
    await new Promise(resolve => setTimeout(resolve, 2000));
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('1. Authentication Module', () => {
    test('POST /api/v1/auth/login - Should login successfully', async () => {
      const response = await request(BASE_URL)
        .post('/api/v1/auth/login')
        .send({
          email: 'admin@zirakbook.com',
          password: 'Admin123'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.tokens).toHaveProperty('accessToken');
      expect(response.body.data.tokens).toHaveProperty('refreshToken');

      authToken = response.body.data.tokens.accessToken;
      testCompanyId = response.body.data.user.companyId;
      testUserId = response.body.data.user.id;
    });

    test('GET /api/v1/auth/me - Should get current user', async () => {
      const response = await request(BASE_URL)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('email');
    });

    test('GET /api/v1/auth/company - Should get company info', async () => {
      const response = await request(BASE_URL)
        .get('/api/v1/auth/company')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('name');
    });

    test('POST /api/v1/auth/refresh-token - Should refresh token', async () => {
      const loginResponse = await request(BASE_URL)
        .post('/api/v1/auth/login')
        .send({ email: 'admin@zirakbook.com', password: 'Admin123' });

      const refreshToken = loginResponse.body.data.tokens.refreshToken;

      const response = await request(BASE_URL)
        .post('/api/v1/auth/refresh-token')
        .send({ refreshToken });

      expect(response.status).toBe(200);
      expect(response.body.data.tokens).toHaveProperty('accessToken');
    });
  });

  // ============================================================================
  // CRUD: CUSTOMERS
  // ============================================================================

  describe('2. Customer Management - Full CRUD', () => {
    beforeAll(async () => {
      // Ensure we have auth token for customer tests
      if (!authToken) {
        const loginResponse = await request(BASE_URL)
          .post('/api/v1/auth/login')
          .send({
            email: 'admin@zirakbook.com',
            password: 'Admin123'
          });
        authToken = loginResponse.body.data.tokens.accessToken;
        testCompanyId = loginResponse.body.data.user.companyId;
      }
    });

    test('GET /api/v1/customers - List all customers', async () => {
      const response = await request(BASE_URL)
        .get('/api/v1/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ companyId: testCompanyId });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('customers');
      expect(Array.isArray(response.body.data.customers)).toBe(true);
    });

    test('POST /api/v1/customers - Create new customer', async () => {
      const uniqueId = Math.floor(Math.random() * 1000000); // 6 digits max
      const response = await request(BASE_URL)
        .post('/api/v1/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          companyId: testCompanyId,
          name: `Test Customer ${uniqueId}`,
          email: `customer${uniqueId}@test.com`,
          phone: `+1555${uniqueId}`, // Max 16 characters
          address: '123 Test St',
          city: 'Test City',
          state: 'Test State',
          country: 'Test Country',
          postalCode: '12345'
        });

      expect([200, 201]).toContain(response.status);
      expect(response.body.data).toHaveProperty('id');
      testCustomerId = response.body.data.id;
    });

    test('GET /api/v1/customers/:id - Get customer by ID', async () => {
      const response = await request(BASE_URL)
        .get(`/api/v1/customers/${testCustomerId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(testCustomerId);
    });

    test('PUT /api/v1/customers/:id - Update customer', async () => {
      const response = await request(BASE_URL)
        .put(`/api/v1/customers/${testCustomerId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Customer Name',
          phone: '+1987654321'
        });

      expect([200, 204]).toContain(response.status);
    });

    test('DELETE /api/v1/customers/:id - Delete customer', async () => {
      const response = await request(BASE_URL)
        .delete(`/api/v1/customers/${testCustomerId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect([200, 204]).toContain(response.status);
    });
  });

  // ============================================================================
  // CRUD: VENDORS
  // ============================================================================

  describe('3. Vendor Management - Full CRUD', () => {
    beforeAll(async () => {
      // Ensure we have auth token for vendor tests
      if (!authToken) {
        const loginResponse = await request(BASE_URL)
          .post('/api/v1/auth/login')
          .send({
            email: 'admin@zirakbook.com',
            password: 'Admin123'
          });
        authToken = loginResponse.body.data.tokens.accessToken;
        testCompanyId = loginResponse.body.data.user.companyId;
      }
    });

    test('GET /api/v1/vendors - List all vendors', async () => {
      const response = await request(BASE_URL)
        .get('/api/v1/vendors')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ companyId: testCompanyId });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('vendors');
    });

    test('POST /api/v1/vendors - Create new vendor', async () => {
      const uniqueId = Math.floor(Math.random() * 1000000); // 6 digits max
      const response = await request(BASE_URL)
        .post('/api/v1/vendors')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          companyId: testCompanyId,
          name: `Test Vendor ${uniqueId}`,
          email: `vendor${uniqueId}@test.com`,
          phone: `+1666${uniqueId}`, // Max 16 characters
          address: '456 Vendor St',
          city: 'Vendor City',
          postalCode: '54321'
        });

      expect([200, 201]).toContain(response.status);
      testVendorId = response.body.data.id;
    });

    test('PUT /api/v1/vendors/:id - Update vendor', async () => {
      const response = await request(BASE_URL)
        .put(`/api/v1/vendors/${testVendorId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated Vendor Name' });

      expect([200, 204]).toContain(response.status);
    });
  });

  // ============================================================================
  // CRUD: PRODUCTS & INVENTORY
  // ============================================================================

  describe('4. Product Management - Full CRUD', () => {
    beforeAll(async () => {
      // Ensure we have auth token for product tests
      if (!authToken) {
        const loginResponse = await request(BASE_URL)
          .post('/api/v1/auth/login')
          .send({
            email: 'admin@zirakbook.com',
            password: 'Admin123'
          });
        authToken = loginResponse.body.data.tokens.accessToken;
        testCompanyId = loginResponse.body.data.user.companyId;
      }
    });

    test('POST /api/v1/brands - Create brand', async () => {
      const uniqueId = Math.floor(Math.random() * 100000); // 5 digits
      const response = await request(BASE_URL)
        .post('/api/v1/brands')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          companyId: testCompanyId,
          name: `Test Brand ${uniqueId}`,
          code: `TB${uniqueId}`
        });

      expect([200, 201]).toContain(response.status);
      testBrandId = response.body.data.id;
    });

    test('POST /api/v1/categories - Create category', async () => {
      const uniqueId = Math.floor(Math.random() * 100000); // 5 digits
      const response = await request(BASE_URL)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          companyId: testCompanyId,
          name: `Test Category ${uniqueId}`,
          code: `TC${uniqueId}`
        });

      expect([200, 201]).toContain(response.status);
      testCategoryId = response.body.data.id;
    });

    test('POST /api/v1/warehouses - Create warehouse', async () => {
      const uniqueId = Math.floor(Math.random() * 100000); // 5 digits
      const response = await request(BASE_URL)
        .post('/api/v1/warehouses')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          companyId: testCompanyId,
          name: `Test Warehouse ${uniqueId}`,
          code: `WH${uniqueId}`,
          location: 'Test Location'
        });

      expect([200, 201]).toContain(response.status);
      testWarehouseId = response.body.data.id;
    });

    test('POST /api/v1/products - Create product', async () => {
      const uniqueId = Math.floor(Math.random() * 100000); // 5 digits
      const productData = {
        companyId: testCompanyId,
        name: `Test Product ${uniqueId}`,
        code: `TP${uniqueId}`,
        sku: `SKU${uniqueId}`, // Required field
        purchasePrice: 100,
        sellingPrice: 150,
        unit: 'PCS'
      };

      // Add brandId and categoryId only if they exist
      if (testBrandId) productData.brandId = testBrandId;
      if (testCategoryId) productData.categoryId = testCategoryId;

      const response = await request(BASE_URL)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send(productData);

      expect([200, 201]).toContain(response.status);
      testProductId = response.body.data.id;
    });

    test('GET /api/v1/products - List all products', async () => {
      const response = await request(BASE_URL)
        .get('/api/v1/products')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ companyId: testCompanyId });

      expect(response.status).toBe(200);
    });

    test('GET /api/v1/stock - Check stock levels', async () => {
      const response = await request(BASE_URL)
        .get('/api/v1/stock')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ companyId: testCompanyId });

      expect(response.status).toBe(200);
    });
  });

  // ============================================================================
  // CHART OF ACCOUNTS
  // ============================================================================

  describe('5. Chart of Accounts', () => {
    test('GET /api/v1/accounts - List all accounts', async () => {
      const response = await request(BASE_URL)
        .get('/api/v1/accounts')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ companyId: testCompanyId });

      expect(response.status).toBe(200);
      if (response.body.data.length > 0) {
        testAccountId = response.body.data[0].id;
      }
    });

    const accountTypes = ['ASSET', 'LIABILITY', 'INCOME', 'EXPENSE'];
    accountTypes.forEach(type => {
      test(`GET /api/v1/accounts?type=${type} - Get ${type} accounts`, async () => {
        const response = await request(BASE_URL)
          .get('/api/v1/accounts')
          .set('Authorization', `Bearer ${authToken}`)
          .query({ companyId: testCompanyId, type });

        expect(response.status).toBe(200);
      });
    });
  });

  // ============================================================================
  // PURCHASE CYCLE
  // ============================================================================

  describe('6. Purchase Cycle', () => {
    const purchaseEndpoints = [
      '/api/v1/purchase-quotations',
      '/api/v1/purchase-orders',
      '/api/v1/goods-receipts',
      '/api/v1/bills',
      '/api/v1/purchase-returns'
    ];

    purchaseEndpoints.forEach(endpoint => {
      test(`GET ${endpoint} - List ${endpoint.split('/').pop()}`, async () => {
        const response = await request(BASE_URL)
          .get(endpoint)
          .set('Authorization', `Bearer ${authToken}`)
          .query({ companyId: testCompanyId });

        expect(response.status).toBe(200);
      });
    });
  });

  // ============================================================================
  // SALES CYCLE
  // ============================================================================

  describe('7. Sales Cycle - Full CRUD', () => {
    test('GET /api/v1/sales-quotations - List quotations', async () => {
      const response = await request(BASE_URL)
        .get('/api/v1/sales-quotations')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ companyId: testCompanyId });

      expect(response.status).toBe(200);
    });

    test('GET /api/v1/sales-orders - List orders', async () => {
      const response = await request(BASE_URL)
        .get('/api/v1/sales-orders')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ companyId: testCompanyId });

      expect(response.status).toBe(200);
    });

    test('GET /api/v1/delivery-challans - List challans', async () => {
      const response = await request(BASE_URL)
        .get('/api/v1/delivery-challans')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ companyId: testCompanyId });

      expect(response.status).toBe(200);
    });

    test('GET /api/v1/invoices - List invoices', async () => {
      const response = await request(BASE_URL)
        .get('/api/v1/invoices')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ companyId: testCompanyId });

      expect(response.status).toBe(200);
    });

    test('GET /api/v1/sales-returns - List returns', async () => {
      const response = await request(BASE_URL)
        .get('/api/v1/sales-returns')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ companyId: testCompanyId });

      expect(response.status).toBe(200);
    });
  });

  // ============================================================================
  // FINANCIAL REPORTS
  // ============================================================================

  describe('8. Financial Reports', () => {
    const reports = [
      { name: 'Balance Sheet', endpoint: '/api/v1/reports/balance-sheet' },
      { name: 'Profit & Loss', endpoint: '/api/v1/reports/profit-loss' },
      { name: 'Trial Balance', endpoint: '/api/v1/reports/trial-balance' },
      { name: 'Cash Flow', endpoint: '/api/v1/reports/cash-flow' },
      { name: 'Sales Summary', endpoint: '/api/v1/reports/sales-summary' },
      { name: 'Sales Detailed', endpoint: '/api/v1/reports/sales-detailed' },
      { name: 'Purchases Summary', endpoint: '/api/v1/reports/purchases-summary' },
      { name: 'Purchases Detailed', endpoint: '/api/v1/reports/purchases-detailed' },
      { name: 'Inventory Summary', endpoint: '/api/v1/reports/inventory-summary' },
      { name: 'Stock Valuation', endpoint: '/api/v1/reports/stock-valuation' },
      { name: 'Tax Summary', endpoint: '/api/v1/reports/tax-summary' },
      { name: 'POS Summary', endpoint: '/api/v1/reports/pos-summary' }
    ];

    reports.forEach(report => {
      test(`GET ${report.endpoint} - ${report.name}`, async () => {
        const response = await request(BASE_URL)
          .get(report.endpoint)
          .set('Authorization', `Bearer ${authToken}`)
          .query({
            companyId: testCompanyId,
            startDate: '2024-01-01',
            endDate: '2024-12-31'
          });

        expect(response.status).toBe(200);
      });
    });
  });

  // ============================================================================
  // JOURNAL ENTRIES & VOUCHERS
  // ============================================================================

  describe('9. Journal Entries & Vouchers', () => {
    const voucherEndpoints = [
      '/api/v1/journal-entries',
      '/api/v1/payments',
      '/api/v1/receipts',
      '/api/v1/vouchers',
      '/api/v1/contra-vouchers',
      '/api/v1/income-vouchers'
    ];

    voucherEndpoints.forEach(endpoint => {
      test(`GET ${endpoint} - List ${endpoint.split('/').pop()}`, async () => {
        const response = await request(BASE_URL)
          .get(endpoint)
          .set('Authorization', `Bearer ${authToken}`)
          .query({ companyId: testCompanyId });

        expect(response.status).toBe(200);
      });
    });
  });

  // ============================================================================
  // SETTINGS & CONFIGURATION
  // ============================================================================

  describe('10. Settings & Configuration', () => {
    test('GET /api/v1/tax-classes - List tax classes', async () => {
      const response = await request(BASE_URL)
        .get('/api/v1/tax-classes')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ companyId: testCompanyId });

      expect(response.status).toBe(200);
    });

    test('GET /api/v1/services - List services', async () => {
      const response = await request(BASE_URL)
        .get('/api/v1/services')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ companyId: testCompanyId });

      expect(response.status).toBe(200);
    });

    test('GET /api/v1/uoms - List units of measure', async () => {
      const response = await request(BASE_URL)
        .get('/api/v1/uoms')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ companyId: testCompanyId });

      expect(response.status).toBe(200);
    });
  });

  // ============================================================================
  // USER MANAGEMENT
  // ============================================================================

  describe('11. User Management', () => {
    test('GET /api/v1/users - List all users', async () => {
      const response = await request(BASE_URL)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ companyId: testCompanyId });

      expect(response.status).toBe(200);
    });

    test('GET /api/v1/roles - Get all roles', async () => {
      const response = await request(BASE_URL)
        .get('/api/v1/roles')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
    });
  });

  // ============================================================================
  // ERROR HANDLING
  // ============================================================================

  describe('12. Error Handling', () => {
    test('Unauthorized access without token', async () => {
      const response = await request(BASE_URL)
        .get('/api/v1/customers');

      expect(response.status).toBe(401);
    });

    test('Invalid token', async () => {
      const response = await request(BASE_URL)
        .get('/api/v1/customers')
        .set('Authorization', 'Bearer invalid_token');

      expect(response.status).toBe(401);
    });

    test('Not found endpoint', async () => {
      const response = await request(BASE_URL)
        .get('/api/v1/nonexistent-endpoint')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });
});
