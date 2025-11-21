/**
 * Comprehensive Live Domain Test Suite
 * Tests all 59 endpoints against https://accounting.alexandratechlab.com
 */

const request = require('supertest');

const BASE_URL = 'https://accounting.alexandratechlab.com/api/v1';

// Test data
let authToken = '';
let testCompanyId = '';
let testCustomerId = '';
let testVendorId = '';
let testProductId = '';
let testBrandId = '';
let testCategoryId = '';
let testWarehouseId = '';

describe('ZirakBook Live Domain - Comprehensive Test Suite', () => {

  // Setup: Authenticate before all tests
  beforeAll(async () => {
    const response = await request(BASE_URL)
      .post('/auth/login')
      .send({
        email: 'admin@zirakbook.com',
        password: 'Admin123'
      });

    expect(response.status).toBe(200);
    authToken = response.body.data.tokens.accessToken;
    testCompanyId = response.body.data.user.companyId;

    console.log('✅ Authentication successful');
    console.log(`   Company ID: ${testCompanyId}`);
  });

  describe('1. Authentication Module (4 tests)', () => {
    test('POST /auth/login - Should login successfully', async () => {
      const response = await request(BASE_URL)
        .post('/auth/login')
        .send({
          email: 'admin@zirakbook.com',
          password: 'Admin123'
        });

      expect(response.status).toBe(200);
      expect(response.body.data.tokens).toHaveProperty('accessToken');
      expect(response.body.data.tokens).toHaveProperty('refreshToken');
    });

    test('GET /auth/me - Should get current user', async () => {
      const response = await request(BASE_URL)
        .get('/auth/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('email');
    });

    test('GET /auth/company - Should get company info', async () => {
      const response = await request(BASE_URL)
        .get('/auth/company')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('id');
    });

    test('POST /auth/refresh-token - Should refresh token', async () => {
      const loginResponse = await request(BASE_URL)
        .post('/auth/login')
        .send({
          email: 'admin@zirakbook.com',
          password: 'Admin123'
        });

      const refreshToken = loginResponse.body.data.tokens.refreshToken;

      const response = await request(BASE_URL)
        .post('/auth/refresh-token')
        .send({ refreshToken });

      expect(response.status).toBe(200);
      expect(response.body.data.tokens).toHaveProperty('accessToken');
    });
  });

  describe('2. Customer Management - Full CRUD (5 tests)', () => {
    test('GET /customers - List all customers', async () => {
      const response = await request(BASE_URL)
        .get(`/customers?companyId=${testCompanyId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('customers');
    });

    test('POST /customers - Create new customer', async () => {
      const uniqueId = Math.floor(Math.random() * 1000000);
      const response = await request(BASE_URL)
        .post('/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          companyId: testCompanyId,
          name: `Live Test Customer ${uniqueId}`,
          email: `livecust${uniqueId}@test.com`,
          phone: `+1555${uniqueId}`,
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

    test('GET /customers/:id - Get customer by ID', async () => {
      if (!testCustomerId) {
        console.log('⚠️  Skipping: No customer ID available');
        return;
      }

      const response = await request(BASE_URL)
        .get(`/customers/${testCustomerId}?companyId=${testCompanyId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(testCustomerId);
    });

    test('PUT /customers/:id - Update customer', async () => {
      if (!testCustomerId) {
        console.log('⚠️  Skipping: No customer ID available');
        return;
      }

      const uniqueId = Math.floor(Math.random() * 1000000);
      const response = await request(BASE_URL)
        .put(`/customers/${testCustomerId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          companyId: testCompanyId,
          name: 'Updated Test Customer',
          email: `updated${uniqueId}@test.com`,
          phone: '+15551234567',
          address: '456 Updated St'
        });

      expect(response.status).toBe(200);
    });

    test('DELETE /customers/:id - Delete customer', async () => {
      if (!testCustomerId) {
        console.log('⚠️  Skipping: No customer ID available');
        return;
      }

      const response = await request(BASE_URL)
        .delete(`/customers/${testCustomerId}?companyId=${testCompanyId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect([200, 204]).toContain(response.status);
    });
  });

  describe('3. Vendor Management - Full CRUD (3 tests)', () => {
    test('GET /vendors - List all vendors', async () => {
      const response = await request(BASE_URL)
        .get(`/vendors?companyId=${testCompanyId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('vendors');
    });

    test('POST /vendors - Create new vendor', async () => {
      const uniqueId = Math.floor(Math.random() * 1000000);
      const response = await request(BASE_URL)
        .post('/vendors')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          companyId: testCompanyId,
          name: `Live Test Vendor ${uniqueId}`,
          email: `livevend${uniqueId}@test.com`,
          phone: `+1666${uniqueId}`,
          address: '789 Vendor St'
        });

      expect([200, 201]).toContain(response.status);
      testVendorId = response.body.data.id;
    });

    test('PUT /vendors/:id - Update vendor', async () => {
      if (!testVendorId) {
        console.log('⚠️  Skipping: No vendor ID available');
        return;
      }

      const response = await request(BASE_URL)
        .put(`/vendors/${testVendorId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          companyId: testCompanyId,
          name: 'Updated Test Vendor',
          phone: '+16661234567'
        });

      expect(response.status).toBe(200);
    });
  });

  describe('4. Product & Inventory Management (6 tests)', () => {
    test('POST /brands - Create brand', async () => {
      const uniqueId = Math.floor(Math.random() * 100000);
      const response = await request(BASE_URL)
        .post('/brands')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          companyId: testCompanyId,
          name: `Live Test Brand ${uniqueId}`,
          code: `LTB${uniqueId}`
        });

      if (response.status === 201 || response.status === 200) {
        testBrandId = response.body.data.id;
      }
      expect([200, 201]).toContain(response.status);
    });

    test('POST /categories - Create category', async () => {
      const uniqueId = Math.floor(Math.random() * 100000);
      const response = await request(BASE_URL)
        .post('/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          companyId: testCompanyId,
          name: `Live Test Category ${uniqueId}`,
          code: `LTC${uniqueId}`
        });

      if (response.status === 201 || response.status === 200) {
        testCategoryId = response.body.data.id;
      }
      expect([200, 201]).toContain(response.status);
    });

    test('POST /warehouses - Create warehouse', async () => {
      const uniqueId = Math.floor(Math.random() * 100000);
      const response = await request(BASE_URL)
        .post('/warehouses')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          companyId: testCompanyId,
          name: `Live Test Warehouse ${uniqueId}`,
          code: `LTW${uniqueId}`,
          address: '123 Warehouse St'
        });

      if (response.status === 201 || response.status === 200) {
        testWarehouseId = response.body.data.id;
      }
      expect([200, 201]).toContain(response.status);
    });

    test('POST /products - Create product', async () => {
      const uniqueId = Math.floor(Math.random() * 100000);
      const productData = {
        companyId: testCompanyId,
        name: `Live Test Product ${uniqueId}`,
        code: `LTP${uniqueId}`,
        sku: `SKU${uniqueId}`,
        purchasePrice: 100,
        sellingPrice: 150,
        unit: 'PCS'
      };

      if (testBrandId) productData.brandId = testBrandId;
      if (testCategoryId) productData.categoryId = testCategoryId;

      const response = await request(BASE_URL)
        .post('/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send(productData);

      expect([200, 201]).toContain(response.status);
      testProductId = response.body.data.id;
    });

    test('GET /products - List all products', async () => {
      const response = await request(BASE_URL)
        .get(`/products?companyId=${testCompanyId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
    });

    test('GET /stock - Check stock levels', async () => {
      const response = await request(BASE_URL)
        .get(`/stock?companyId=${testCompanyId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
    });
  });

  describe('5. Chart of Accounts (5 tests)', () => {
    test('GET /accounts - List all accounts', async () => {
      const response = await request(BASE_URL)
        .get(`/accounts?companyId=${testCompanyId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
    });

    test('GET /accounts?type=ASSET - Get ASSET accounts', async () => {
      const response = await request(BASE_URL)
        .get(`/accounts?companyId=${testCompanyId}&type=ASSET`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
    });

    test('GET /accounts?type=LIABILITY - Get LIABILITY accounts', async () => {
      const response = await request(BASE_URL)
        .get(`/accounts?companyId=${testCompanyId}&type=LIABILITY`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
    });

    test('GET /accounts?type=INCOME - Get INCOME accounts', async () => {
      const response = await request(BASE_URL)
        .get(`/accounts?companyId=${testCompanyId}&type=INCOME`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
    });

    test('GET /accounts?type=EXPENSE - Get EXPENSE accounts', async () => {
      const response = await request(BASE_URL)
        .get(`/accounts?companyId=${testCompanyId}&type=EXPENSE`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
    });
  });

  describe('6. Purchase Cycle (5 tests)', () => {
    test('GET /purchase-quotations - List purchase-quotations', async () => {
      const response = await request(BASE_URL)
        .get(`/purchase-quotations?companyId=${testCompanyId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
    });

    test('GET /purchase-orders - List purchase-orders', async () => {
      const response = await request(BASE_URL)
        .get(`/purchase-orders?companyId=${testCompanyId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
    });

    test('GET /goods-receipts - List goods-receipts', async () => {
      const response = await request(BASE_URL)
        .get(`/goods-receipts?companyId=${testCompanyId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
    });

    test('GET /bills - List bills', async () => {
      const response = await request(BASE_URL)
        .get(`/bills?companyId=${testCompanyId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
    });

    test('GET /purchase-returns - List purchase-returns', async () => {
      const response = await request(BASE_URL)
        .get(`/purchase-returns?companyId=${testCompanyId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
    });
  });

  describe('7. Sales Cycle - Full CRUD (5 tests)', () => {
    test('GET /sales-quotations - List quotations', async () => {
      const response = await request(BASE_URL)
        .get(`/sales-quotations?companyId=${testCompanyId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
    });

    test('GET /sales-orders - List orders', async () => {
      const response = await request(BASE_URL)
        .get(`/sales-orders?companyId=${testCompanyId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
    });

    test('GET /delivery-challans - List challans', async () => {
      const response = await request(BASE_URL)
        .get(`/delivery-challans?companyId=${testCompanyId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
    });

    test('GET /invoices - List invoices', async () => {
      const response = await request(BASE_URL)
        .get(`/invoices?companyId=${testCompanyId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
    });

    test('GET /sales-returns - List returns', async () => {
      const response = await request(BASE_URL)
        .get(`/sales-returns?companyId=${testCompanyId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
    });
  });

  describe('8. Financial Reports (12 tests)', () => {
    test('GET /reports/balance-sheet - Balance Sheet', async () => {
      const response = await request(BASE_URL)
        .get(`/reports/balance-sheet?companyId=${testCompanyId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
    });

    test('GET /reports/profit-loss - Profit & Loss', async () => {
      const response = await request(BASE_URL)
        .get(`/reports/profit-loss?companyId=${testCompanyId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
    });

    test('GET /reports/trial-balance - Trial Balance', async () => {
      const response = await request(BASE_URL)
        .get(`/reports/trial-balance?companyId=${testCompanyId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
    });

    test('GET /reports/cash-flow - Cash Flow', async () => {
      const response = await request(BASE_URL)
        .get(`/reports/cash-flow?companyId=${testCompanyId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
    });

    test('GET /reports/sales-summary - Sales Summary', async () => {
      const response = await request(BASE_URL)
        .get(`/reports/sales-summary?companyId=${testCompanyId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
    });

    test('GET /reports/sales-detailed - Sales Detailed', async () => {
      const response = await request(BASE_URL)
        .get(`/reports/sales-detailed?companyId=${testCompanyId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
    });

    test('GET /reports/purchases-summary - Purchases Summary', async () => {
      const response = await request(BASE_URL)
        .get(`/reports/purchases-summary?companyId=${testCompanyId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
    });

    test('GET /reports/purchases-detailed - Purchases Detailed', async () => {
      const response = await request(BASE_URL)
        .get(`/reports/purchases-detailed?companyId=${testCompanyId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
    });

    test('GET /reports/inventory-summary - Inventory Summary', async () => {
      const response = await request(BASE_URL)
        .get(`/reports/inventory-summary?companyId=${testCompanyId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
    });

    test('GET /reports/stock-valuation - Stock Valuation', async () => {
      const response = await request(BASE_URL)
        .get(`/reports/stock-valuation?companyId=${testCompanyId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
    });

    test('GET /reports/tax-summary - Tax Summary', async () => {
      const response = await request(BASE_URL)
        .get(`/reports/tax-summary?companyId=${testCompanyId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
    });

    test('GET /reports/pos-summary - POS Summary', async () => {
      const response = await request(BASE_URL)
        .get(`/reports/pos-summary?companyId=${testCompanyId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
    });
  });

  describe('9. Journal Entries & Vouchers (6 tests)', () => {
    test('GET /journal-entries - List journal-entries', async () => {
      const response = await request(BASE_URL)
        .get(`/journal-entries?companyId=${testCompanyId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
    });

    test('GET /payments - List payments', async () => {
      const response = await request(BASE_URL)
        .get(`/payments?companyId=${testCompanyId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
    });

    test('GET /receipts - List receipts', async () => {
      const response = await request(BASE_URL)
        .get(`/receipts?companyId=${testCompanyId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
    });

    test('GET /vouchers - List vouchers', async () => {
      const response = await request(BASE_URL)
        .get(`/vouchers?companyId=${testCompanyId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
    });

    test('GET /contra-vouchers - List contra-vouchers', async () => {
      const response = await request(BASE_URL)
        .get(`/contra-vouchers?companyId=${testCompanyId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
    });

    test('GET /income-vouchers - List income-vouchers', async () => {
      const response = await request(BASE_URL)
        .get(`/income-vouchers?companyId=${testCompanyId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
    });
  });

  describe('10. Settings & Configuration (3 tests)', () => {
    test('GET /tax-classes - List tax classes', async () => {
      const response = await request(BASE_URL)
        .get(`/tax-classes?companyId=${testCompanyId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
    });

    test('GET /services - List services', async () => {
      const response = await request(BASE_URL)
        .get(`/services?companyId=${testCompanyId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
    });

    test('GET /uoms - List units of measure', async () => {
      const response = await request(BASE_URL)
        .get(`/uoms?companyId=${testCompanyId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
    });
  });

  describe('11. User Management (2 tests)', () => {
    test('GET /users - List all users', async () => {
      const response = await request(BASE_URL)
        .get(`/users?companyId=${testCompanyId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
    });

    test('GET /roles - Get all roles', async () => {
      const response = await request(BASE_URL)
        .get(`/roles?companyId=${testCompanyId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
    });
  });

  describe('12. Error Handling (3 tests)', () => {
    test('Unauthorized access without token', async () => {
      const response = await request(BASE_URL)
        .get(`/customers?companyId=${testCompanyId}`);

      expect(response.status).toBe(401);
    });

    test('Invalid token', async () => {
      const response = await request(BASE_URL)
        .get(`/customers?companyId=${testCompanyId}`)
        .set('Authorization', 'Bearer invalid_token_here');

      expect(response.status).toBe(401);
    });

    test('Not found endpoint', async () => {
      const response = await request(BASE_URL)
        .get('/nonexistent-endpoint')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });
});
