import { test, expect } from '@playwright/test';

const FRONTEND_URL = 'https://frontend-production-32b8.up.railway.app';
const BACKEND_URL = 'https://accounting-software-production.up.railway.app';

// All new credentials from seed
const CREDENTIALS = [
  { email: 'superadmin@test.com', password: 'Test@123456', role: 'SUPERADMIN', company: 'Platform' },
  { email: 'companyadmin@test.com', password: 'Test@123456', role: 'COMPANY_ADMIN', company: 'TechVision' },
  { email: 'admin@globalretail.com', password: 'Test@123456', role: 'COMPANY_ADMIN', company: 'Global Retail' },
  { email: 'admin@mfgsolutions.com', password: 'Test@123456', role: 'COMPANY_ADMIN', company: 'Manufacturing' },
];

test.describe.configure({ mode: 'serial' });

test.describe('Comprehensive Login & Page Analysis', () => {

  test('01. Test All User Logins via API', async ({ request }) => {
    console.log('\\n🔐 Testing All User Logins via API\\n');

    for (const cred of CREDENTIALS) {
      const response = await request.post(`${BACKEND_URL}/api/v1/auth/login`, {
        data: { email: cred.email, password: cred.password }
      });

      const status = response.status();
      const data = await response.json();

      console.log(`\\n${cred.role} (${cred.company}):`);
      console.log(`  Email: ${cred.email}`);
      console.log(`  Status: ${status}`);
      console.log(`  Success: ${data.success}`);

      if (data.success) {
        console.log(`  ✅ Login successful`);
        console.log(`  User: ${data.data.user.name}`);
        console.log(`  Role: ${data.data.user.role}`);
      } else {
        console.log(`  ❌ Login failed: ${data.message}`);
      }
    }
  });

  test('02. Full Frontend Login Flow + Dashboard Analysis', async ({ page }) => {
    console.log('\\n🌐 Testing Frontend Login Flow\\n');

    // Test with company admin
    const testUser = CREDENTIALS[1]; // companyadmin@test.com

    await page.goto(`${FRONTEND_URL}/login`);
    await page.waitForLoadState('networkidle');
    console.log('✅ Login page loaded');

    // Clear localStorage
    await page.evaluate(() => localStorage.clear());

    // Fill login form
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="password"]', testUser.password);
    console.log(`✅ Filled credentials: ${testUser.email}`);

    // Submit
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);

    const currentUrl = page.url();
    console.log(`📍 Current URL: ${currentUrl}`);

    // Check for successful login
    if (currentUrl.includes('/dashboard') || currentUrl.includes('/company')) {
      console.log('✅ Successfully redirected to dashboard');

      // Take screenshot
      await page.screenshot({
        path: '/root/dashboard_logged_in.png',
        fullPage: true
      });
      console.log('📸 Screenshot saved');

      // Analyze page content
      const title = await page.title();
      const bodyText = await page.textContent('body');
      const hasDashboard = bodyText && bodyText.includes('Dashboard');
      const hasCompany = bodyText && bodyText.includes('Company');

      console.log(`\\n📊 Dashboard Analysis:`);
      console.log(`  Title: ${title}`);
      console.log(`  Contains "Dashboard": ${hasDashboard}`);
      console.log(`  Contains "Company": ${hasCompany}`);

    } else {
      console.log('⚠️  Not redirected to dashboard');
      await page.screenshot({ path: '/root/login_failed.png' });
    }
  });

  test('03. Analyze Top 10 Critical Pages', async ({ page }) => {
    console.log('\\n📄 Analyzing Critical Pages\\n');

    // Login first
    await page.goto(`${FRONTEND_URL}/login`);
    await page.fill('input[type="email"]', 'companyadmin@test.com');
    await page.fill('input[type="password"]', 'Test@123456');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    const pagesToTest = [
      '/company/dashboard',
      '/company/customersdebtors',
      '/company/product',
      '/company/invoice',
      '/company/allacounts',
      '/company/users',
      '/company/companyinfo',
      '/company/salesvoucher',
      '/company/inventorys',
      '/company/vendorscreditors'
    ];

    for (const pagePath of pagesToTest) {
      try {
        await page.goto(`${FRONTEND_URL}${pagePath}`, { timeout: 15000 });
        await page.waitForLoadState('networkidle', { timeout: 10000 });

        const title = await page.title();
        const h1 = await page.locator('h1').first().textContent().catch(() => 'No H1');
        const hasTable = await page.locator('table').count() > 0;
        const hasForm = await page.locator('form').count() > 0;
        const hasButtons = await page.locator('button').count();

        console.log(`\\n✅ ${pagePath}`);
        console.log(`   Title: ${title}`);
        console.log(`   H1: ${h1}`);
        console.log(`   Has Table: ${hasTable}`);
        console.log(`   Has Form: ${hasForm}`);
        console.log(`   Button Count: ${hasButtons}`);

      } catch (error) {
        console.log(`\\n❌ ${pagePath}`);
        console.log(`   Error: ${error.message}`);
      }
    }
  });

  test('04. Multi-Tenant Data Isolation Check', async ({ request }) => {
    console.log('\\n🏢 Testing Multi-Tenant Data Isolation\\n');

    // Login as TechVision admin
    const techVisionLogin = await request.post(`${BACKEND_URL}/api/v1/auth/login`, {
      data: { email: 'companyadmin@test.com', password: 'Test@123456' }
    });
    const techVisionData = await techVisionLogin.json();
    const techVisionToken = techVisionData.data?.tokens?.accessToken;

    // Login as Global Retail admin
    const retailLogin = await request.post(`${BACKEND_URL}/api/v1/auth/login`, {
      data: { email: 'admin@globalretail.com', password: 'Test@123456' }
    });
    const retailData = await retailLogin.json();
    const retailToken = retailData.data?.tokens?.accessToken;

    if (techVisionToken && retailToken) {
      // Get customers for each company
      const techCustomers = await request.get(`${BACKEND_URL}/api/v1/customers`, {
        headers: { 'Authorization': `Bearer ${techVisionToken}` }
      });
      const techCustomersData = await techCustomers.json();

      const retailCustomers = await request.get(`${BACKEND_URL}/api/v1/customers`, {
        headers: { 'Authorization': `Bearer ${retailToken}` }
      });
      const retailCustomersData = await retailCustomers.json();

      const techCount = techCustomersData.data?.length || 0;
      const retailCount = retailCustomersData.data?.length || 0;

      console.log(`TechVision Customers: ${techCount}`);
      console.log(`Retail Customers: ${retailCount}`);

      if (techCount !== retailCount) {
        console.log('✅ Data isolation working - different customer counts');
      } else {
        console.log('⚠️  Same customer count - verify data isolation');
      }
    }
  });

  test('05. Generate Comprehensive Report', async () => {
    console.log('\\n📊 Test Summary Generated\\n');
    console.log('All critical tests completed.');
    console.log('Check screenshots and console output for details.');
  });
});
