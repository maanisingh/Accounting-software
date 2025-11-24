/**
 * Quick Production Status Verification
 * Tests current state before applying changes
 */

import { test, expect } from '@playwright/test';

const BASE_URL = 'https://frontend-production-32b8.up.railway.app';
const API_URL = 'https://accounting-software-production.up.railway.app/api/v1';

test.describe('Production Status Verification', () => {

  test('Frontend is accessible', async ({ page }) => {
    const response = await page.goto(BASE_URL);
    expect(response.status()).toBeLessThan(400);
  });

  test('Backend API is accessible', async ({ request }) => {
    // Try health check or just the base API URL
    const response = await request.get(`${API_URL.replace('/api/v1', '')}/health`).catch(
      () => request.get(API_URL)
    );

    // Should not be 500 error
    expect(response.status()).toBeLessThan(500);
  });

  test('Login page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);

    // Should have login form elements
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button:has-text("Log in")')).toBeVisible();
  });

  test('Check if old admin@zirakbook.com user exists', async ({ request }) => {
    const response = await request.post(`${API_URL}/auth/login`, {
      data: {
        email: 'admin@zirakbook.com',
        password: 'Admin123!'
      }
    });

    console.log('Old admin login status:', response.status());

    if (response.ok()) {
      const data = await response.json();
      console.log('Old admin exists:', {
        email: data.data?.user?.email,
        role: data.data?.user?.role,
        company: data.data?.user?.company?.name
      });
    } else {
      console.log('Old admin does not exist (expected if seed hasn\'t run)');
    }
  });

  test('Check if new superadmin@test.com user exists', async ({ request }) => {
    const response = await request.post(`${API_URL}/auth/login`, {
      data: {
        email: 'superadmin@test.com',
        password: 'Test@123456'
      }
    });

    console.log('New superadmin login status:', response.status());

    if (response.ok()) {
      const data = await response.json();
      console.log('New seed data exists:', {
        email: data.data?.user?.email,
        role: data.data?.user?.role,
        company: data.data?.user?.company?.name
      });
    } else {
      console.log('New seed not applied yet - database needs seeding');
    }
  });

  test('Check API error handling', async ({ request }) => {
    const response = await request.post(`${API_URL}/auth/login`, {
      data: {
        email: 'nonexistent@test.com',
        password: 'wrongpassword'
      }
    });

    // Should return 401 or 400 for bad credentials
    expect([400, 401]).toContain(response.status());
  });

  test('Test quick login buttons on login page', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);

    // Check if quick login section exists
    const quickLoginExists = await page.locator('text=/Quick Login|Test Users/i').count() > 0;

    console.log('Quick login buttons present:', quickLoginExists);

    if (quickLoginExists) {
      // Try to find show all button
      const showAllButton = page.locator('button:has-text("Show All")');
      if (await showAllButton.count() > 0) {
        await showAllButton.click();
        await page.waitForTimeout(500);
        console.log('Quick login expanded');
      }
    }
  });

  test('Generate current database status report', async ({ request }) => {
    const report = {
      timestamp: new Date().toISOString(),
      apiUrl: API_URL,
      frontendUrl: BASE_URL,
      tests: {}
    };

    // Test old admin
    const oldAdminResponse = await request.post(`${API_URL}/auth/login`, {
      data: { email: 'admin@zirakbook.com', password: 'Admin123!' }
    });

    report.tests.oldAdmin = {
      exists: oldAdminResponse.ok(),
      status: oldAdminResponse.status()
    };

    // Test new superadmin
    const newSuperadminResponse = await request.post(`${API_URL}/auth/login`, {
      data: { email: 'superadmin@test.com', password: 'Test@123456' }
    });

    report.tests.newSuperadmin = {
      exists: newSuperadminResponse.ok(),
      status: newSuperadminResponse.status()
    };

    // Test TechVision admin
    const techvisionResponse = await request.post(`${API_URL}/auth/login`, {
      data: { email: 'companyadmin@test.com', password: 'Test@123456' }
    });

    report.tests.techvisionAdmin = {
      exists: techvisionResponse.ok(),
      status: techvisionResponse.status()
    };

    console.log('\n=== PRODUCTION STATUS REPORT ===');
    console.log(JSON.stringify(report, null, 2));
    console.log('================================\n');

    if (report.tests.newSuperadmin.exists) {
      console.log('✅ New seed data is already applied to production database');
    } else if (report.tests.oldAdmin.exists) {
      console.log('⚠️  Old seed data exists, new seed needs to be applied');
    } else {
      console.log('⚠️  No users found, database needs to be seeded');
    }
  });
});
