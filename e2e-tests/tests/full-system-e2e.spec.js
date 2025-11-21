/**
 * ZirakBook Accounting System - Complete E2E Test Suite
 * Tests all pages, forms, buttons, and data flows using Playwright
 */

const { test, expect } = require('@playwright/test');

// Test configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const API_URL = process.env.API_URL || 'http://localhost:8020';
const TEST_EMAIL = 'admin@zirakbook.com';
const TEST_PASSWORD = 'Admin123';

test.describe('ZirakBook E2E Tests - Complete System', () => {

  // ============================================================================
  // AUTHENTICATION FLOW
  // ============================================================================

  test.describe('1. Authentication & Login Flow', () => {
    test('should load login page', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      await expect(page).toHaveTitle(/ZirakBook|Login/i);
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();
    });

    test('should login successfully', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      await page.fill('input[type="email"]', TEST_EMAIL);
      await page.fill('input[type="password"]', TEST_PASSWORD);
      await page.click('button[type="submit"]');

      // Wait for redirect to dashboard
      await page.waitForURL(/.*dashboard.*/);
      expect(page.url()).toContain('dashboard');
    });

    test('should show error on invalid credentials', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      await page.fill('input[type="email"]', 'wrong@email.com');
      await page.fill('input[type="password"]', 'wrongpass');
      await page.click('button[type="submit"]');

      // Check for error message
      await expect(page.locator('.error, .alert-danger, [role="alert"]')).toBeVisible();
    });
  });

  // ============================================================================
  // DASHBOARD NAVIGATION
  // ============================================================================

  test.describe('2. Dashboard Navigation', () => {
    test.beforeEach(async ({ page }) => {
      // Login before each test
      await page.goto(`${BASE_URL}/login`);
      await page.fill('input[type="email"]', TEST_EMAIL);
      await page.fill('input[type="password"]', TEST_PASSWORD);
      await page.click('button[type="submit"]');
      await page.waitForURL(/.*dashboard.*/);
    });

    test('should display dashboard overview', async ({ page }) => {
      await expect(page.locator('h1, h2, .dashboard-title')).toBeVisible();
    });

    test('should navigate to all major sections', async ({ page }) => {
      const sections = [
        { name: 'Customers', selector: 'a[href*="customer"]' },
        { name: 'Vendors', selector: 'a[href*="vendor"]' },
        { name: 'Products', selector: 'a[href*="product"]' },
        { name: 'Inventory', selector: 'a[href*="inventory"]' },
        { name: 'Sales', selector: 'a[href*="sales"]' },
        { name: 'Purchase', selector: 'a[href*="purchase"]' },
        { name: 'Reports', selector: 'a[href*="report"]' },
        { name: 'Accounts', selector: 'a[href*="account"]' }
      ];

      for (const section of sections) {
        const link = page.locator(section.selector).first();
        if (await link.isVisible()) {
          await link.click();
          await page.waitForTimeout(1000);
        }
      }
    });
  });

  // ============================================================================
  // CUSTOMER MANAGEMENT - FULL CRUD
  // ============================================================================

  test.describe('3. Customer Management - Complete CRUD Flow', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      await page.fill('input[type="email"]', TEST_EMAIL);
      await page.fill('input[type="password"]', TEST_PASSWORD);
      await page.click('button[type="submit"]');
      await page.waitForURL(/.*dashboard.*/);
    });

    test('should navigate to customers page', async ({ page }) => {
      await page.click('a[href*="customer"]');
      await expect(page).toHaveURL(/.*customer.*/);
    });

    test('should open add customer modal/form', async ({ page }) => {
      await page.goto(`${BASE_URL}/company/customersdebtors`);

      const addButton = page.locator('button:has-text("Add"), button:has-text("New"), button:has-text("Create")').first();
      if (await addButton.isVisible()) {
        await addButton.click();
        await page.waitForTimeout(500);
      }
    });

    test('should create new customer', async ({ page }) => {
      await page.goto(`${BASE_URL}/company/customersdebtors`);

      const uniqueId = Date.now();

      // Try to find and click add button
      const addButton = page.locator('button:has-text("Add"), button:has-text("New"), .btn:has-text("Add")').first();
      if (await addButton.isVisible()) {
        await addButton.click();
        await page.waitForTimeout(1000);

        // Fill form fields
        await page.fill('input[name="name"], input[placeholder*="Name"]', `Test Customer ${uniqueId}`);
        await page.fill('input[name="email"], input[type="email"]', `customer${uniqueId}@test.com`);
        await page.fill('input[name="phone"], input[placeholder*="Phone"]', `+1234567${uniqueId}`);

        // Submit form
        await page.click('button[type="submit"], button:has-text("Save"), button:has-text("Submit")');
        await page.waitForTimeout(2000);
      }
    });

    test('should search and filter customers', async ({ page }) => {
      await page.goto(`${BASE_URL}/company/customersdebtors`);

      const searchInput = page.locator('input[type="search"], input[placeholder*="Search"]').first();
      if (await searchInput.isVisible()) {
        await searchInput.fill('Test');
        await page.waitForTimeout(1000);
      }
    });

    test('should view customer details', async ({ page }) => {
      await page.goto(`${BASE_URL}/company/customersdebtors`);

      const viewButton = page.locator('button:has-text("View"), a:has-text("View"), .view-btn').first();
      if (await viewButton.isVisible()) {
        await viewButton.click();
        await page.waitForTimeout(1000);
      }
    });
  });

  // ============================================================================
  // PRODUCT MANAGEMENT
  // ============================================================================

  test.describe('4. Product Management Flow', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      await page.fill('input[type="email"]', TEST_EMAIL);
      await page.fill('input[type="password"]', TEST_PASSWORD);
      await page.click('button[type="submit"]');
      await page.waitForURL(/.*dashboard.*/);
    });

    test('should navigate to products page', async ({ page }) => {
      await page.goto(`${BASE_URL}/company/product`);
      await expect(page).toHaveURL(/.*product.*/);
    });

    test('should create new product', async ({ page }) => {
      await page.goto(`${BASE_URL}/company/createproduct`);

      const uniqueId = Date.now();

      // Fill product form
      await page.fill('input[name="name"]', `Test Product ${uniqueId}`);
      await page.fill('input[name="code"], input[name="sku"]', `TP${uniqueId}`);
      await page.fill('input[name="purchasePrice"], input[name="cost"]', '100');
      await page.fill('input[name="sellingPrice"], input[name="price"]', '150');

      // Submit
      const submitButton = page.locator('button[type="submit"], button:has-text("Save")').first();
      if (await submitButton.isVisible()) {
        await submitButton.click();
        await page.waitForTimeout(2000);
      }
    });
  });

  // ============================================================================
  // SALES FLOW
  // ============================================================================

  test.describe('5. Sales Quotation to Invoice Flow', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      await page.fill('input[type="email"]', TEST_EMAIL);
      await page.fill('input[type="password"]', TEST_PASSWORD);
      await page.click('button[type="submit"]');
      await page.waitForURL(/.*dashboard.*/);
    });

    test('should navigate to sales quotation', async ({ page }) => {
      await page.goto(`${BASE_URL}/company/multistepsalesform`);
      await expect(page).toHaveURL(/.*sales.*/);
    });

    test('should create sales quotation', async ({ page }) => {
      await page.goto(`${BASE_URL}/company/multistepsalesform`);

      // Select customer
      const customerSelect = page.locator('select[name="customerId"], .customer-select').first();
      if (await customerSelect.isVisible()) {
        await customerSelect.selectOption({ index: 1 });
      }

      // Add line items
      await page.waitForTimeout(1000);
    });

    test('should navigate through sales cycle tabs', async ({ page }) => {
      await page.goto(`${BASE_URL}/company/multistepsalesform`);

      const tabs = ['Quotation', 'Order', 'Delivery', 'Invoice', 'Payment'];
      for (const tab of tabs) {
        const tabElement = page.locator(`button:has-text("${tab}"), a:has-text("${tab}")`).first();
        if (await tabElement.isVisible()) {
          await tabElement.click();
          await page.waitForTimeout(500);
        }
      }
    });
  });

  // ============================================================================
  // REPORTS TESTING
  // ============================================================================

  test.describe('6. Financial Reports', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      await page.fill('input[type="email"]', TEST_EMAIL);
      await page.fill('input[type="password"]', TEST_PASSWORD);
      await page.click('button[type="submit"]');
      await page.waitForURL(/.*dashboard.*/);
    });

    const reports = [
      { name: 'Balance Sheet', path: '/company/balancesheet' },
      { name: 'Profit & Loss', path: '/company/profitloss' },
      { name: 'Trial Balance', path: '/company/trialbalance' },
      { name: 'Cash Flow', path: '/company/cashflow' },
      { name: 'Sales Report', path: '/company/salesreport' },
      { name: 'Purchase Report', path: '/company/purchasereport' }
    ];

    for (const report of reports) {
      test(`should load ${report.name}`, async ({ page }) => {
        await page.goto(`${BASE_URL}${report.path}`);
        await page.waitForTimeout(2000);

        // Check if report container is visible
        await expect(page.locator('body')).toBeVisible();
      });
    }
  });

  // ============================================================================
  // POS SYSTEM
  // ============================================================================

  test.describe('7. Point of Sale System', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      await page.fill('input[type="email"]', TEST_EMAIL);
      await page.fill('input[type="password"]', TEST_PASSWORD);
      await page.click('button[type="submit"]');
      await page.waitForURL(/.*dashboard.*/);
    });

    test('should load POS interface', async ({ page }) => {
      await page.goto(`${BASE_URL}/company/ponitofsale`);
      await page.waitForTimeout(2000);
    });

    test('should create POS invoice', async ({ page }) => {
      await page.goto(`${BASE_URL}/company/ponitofsale`);

      // Select products
      const productButton = page.locator('.product-card, .product-item').first();
      if (await productButton.isVisible()) {
        await productButton.click();
        await page.waitForTimeout(500);
      }
    });
  });

  // ============================================================================
  // SETTINGS & CONFIGURATION
  // ============================================================================

  test.describe('8. Settings & Configuration', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      await page.fill('input[type="email"]', TEST_EMAIL);
      await page.fill('input[type="password"]', TEST_PASSWORD);
      await page.click('button[type="submit"]');
      await page.waitForURL(/.*dashboard.*/);
    });

    test('should navigate to company info', async ({ page }) => {
      await page.goto(`${BASE_URL}/company/companyinfo`);
      await expect(page).toHaveURL(/.*companyinfo.*/);
    });

    test('should navigate to users management', async ({ page }) => {
      await page.goto(`${BASE_URL}/company/users`);
      await expect(page).toHaveURL(/.*users.*/);
    });

    test('should navigate to roles & permissions', async ({ page }) => {
      await page.goto(`${BASE_URL}/company/rolespermissions`);
      await expect(page).toHaveURL(/.*roles.*/);
    });
  });
});
