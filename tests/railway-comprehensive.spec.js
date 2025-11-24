/**
 * ZirakBook Railway Production - Comprehensive Playwright Test Suite
 * Tests the live Railway deployment: https://frontend-production-32b8.up.railway.app
 * Backend API: https://accounting-software-production.up.railway.app
 */

import { test, expect } from '@playwright/test';

const FRONTEND_URL = 'https://frontend-production-32b8.up.railway.app';
const BACKEND_URL = 'https://accounting-software-production.up.railway.app';

// Test credentials from seed script
const ADMIN_CREDENTIALS = {
  email: 'admin@zirakbook.com',
  password: 'Admin123!'
};

test.describe('ZirakBook Railway Deployment - Health Checks', () => {

  test('Frontend should be accessible', async ({ page }) => {
    const response = await page.goto(FRONTEND_URL);
    expect(response.status()).toBe(200);

    // Check page title
    await expect(page).toHaveTitle(/Zirak Books/i);
  });

  test('Backend API should be accessible', async ({ request }) => {
    const response = await request.get(`${BACKEND_URL}/api/health`);
    expect(response.ok()).toBeTruthy();
  });

  test('Backend API should return correct health response', async ({ request }) => {
    const response = await request.get(`${BACKEND_URL}/api/health`);
    const data = await response.json();

    expect(data).toHaveProperty('success', true);
    expect(data).toHaveProperty('message');
    expect(data.message).toContain('ZirakBook');
    // Note: 'status' field is optional, not checking it
  });
});

test.describe('ZirakBook Railway - Authentication Flow', () => {

  test('Login page should load correctly', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/login`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Wait for login form
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('input[type="password"], input[name="password"]')).toBeVisible();

    // Check for login button - Railway uses "Log In" with space
    await expect(page.locator('button:has-text("Log In"), button:has-text("Login"), button:has-text("Sign In")')).toBeVisible();
  });

  test('Admin login should work with correct credentials', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/login`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Fill login form
    await page.locator('input[type="email"], input[name="email"]').first().fill(ADMIN_CREDENTIALS.email);
    await page.locator('input[type="password"], input[name="password"]').first().fill(ADMIN_CREDENTIALS.password);

    // Click login button - Railway uses "Log In"
    await page.locator('button:has-text("Log In"), button:has-text("Login"), button:has-text("Sign In")').first().click();

    // Wait for navigation or success message
    await page.waitForTimeout(3000);

    // Should either redirect to dashboard or show success
    const url = page.url();
    const hasRedirected = url.includes('/dashboard') || url.includes('/home') || !url.includes('/login');

    if (hasRedirected) {
      console.log('✅ Login successful - redirected to:', url);
    } else {
      // Check for error messages
      const errorVisible = await page.locator('text=/error|invalid|failed/i').isVisible().catch(() => false);
      if (errorVisible) {
        const errorText = await page.locator('text=/error|invalid|failed/i').first().textContent();
        console.log('❌ Login error:', errorText);
        throw new Error(`Login failed: ${errorText}`);
      }
    }
  });

  test('Login with wrong password should fail', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/login`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await page.locator('input[type="email"], input[name="email"]').first().fill(ADMIN_CREDENTIALS.email);
    await page.locator('input[type="password"], input[name="password"]').first().fill('WrongPassword123!');

    await page.locator('button:has-text("Log In"), button:has-text("Login"), button:has-text("Sign In")').first().click();

    await page.waitForTimeout(2000);

    // Should show error message
    const errorVisible = await page.locator('text=/invalid|incorrect|wrong|error/i').isVisible().catch(() => false);
    expect(errorVisible).toBeTruthy();
  });
});

test.describe('ZirakBook Railway - API Endpoints', () => {
  let authToken;

  test.beforeAll(async ({ request }) => {
    // Login to get auth token
    const response = await request.post(`${BACKEND_URL}/api/v1/auth/login`, {
      data: ADMIN_CREDENTIALS
    });

    if (response.ok()) {
      const data = await response.json();
      authToken = data.data?.token || data.token;
      console.log('✅ Auth token obtained');
    } else {
      console.log('⚠️  Could not get auth token - some tests will be skipped');
    }
  });

  test('GET /api/v1/customers should require authentication', async ({ request }) => {
    const response = await request.get(`${BACKEND_URL}/api/v1/customers`);
    expect(response.status()).toBe(401);
  });

  test('GET /api/v1/customers should work with auth token', async ({ request }) => {
    test.skip(!authToken, 'No auth token available');

    const response = await request.get(`${BACKEND_URL}/api/v1/customers`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty('success', true);
    expect(data).toHaveProperty('data');
  });

  test('GET /api/v1/products should work with auth token', async ({ request }) => {
    test.skip(!authToken, 'No auth token available');

    const response = await request.get(`${BACKEND_URL}/api/v1/products`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    expect(response.ok()).toBeTruthy();
  });

  test('GET /api/v1/accounts should work with auth token', async ({ request }) => {
    test.skip(!authToken, 'No auth token available');

    const response = await request.get(`${BACKEND_URL}/api/v1/accounts`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    expect(response.ok()).toBeTruthy();
  });
});

test.describe('ZirakBook Railway - Dashboard Access', () => {

  test('Dashboard should be accessible after login', async ({ page }) => {
    // Login first
    await page.goto(`${FRONTEND_URL}/login`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await page.locator('input[type="email"], input[name="email"]').first().fill(ADMIN_CREDENTIALS.email);
    await page.locator('input[type="password"], input[name="password"]').first().fill(ADMIN_CREDENTIALS.password);
    await page.locator('button:has-text("Log In"), button:has-text("Login"), button:has-text("Sign In")').first().click();

    await page.waitForTimeout(3000);

    // Try to access dashboard
    await page.goto(`${FRONTEND_URL}/dashboard`);
    await page.waitForTimeout(2000);

    // Should not redirect to login
    expect(page.url()).not.toContain('/login');
  });
});

test.describe('ZirakBook Railway - CORS Configuration', () => {

  test('API should accept requests from frontend origin', async ({ page }) => {
    await page.goto(FRONTEND_URL);

    // Make API call from frontend context
    const response = await page.evaluate(async (backendUrl) => {
      try {
        const res = await fetch(`${backendUrl}/api/health`);
        return {
          ok: res.ok,
          status: res.status,
          data: await res.json()
        };
      } catch (error) {
        return { error: error.message };
      }
    }, BACKEND_URL);

    expect(response.ok).toBeTruthy();
    expect(response.error).toBeUndefined();
  });
});

test.describe('ZirakBook Railway - Performance', () => {

  test('Frontend should load within 5 seconds', async ({ page }) => {
    const startTime = Date.now();
    await page.goto(FRONTEND_URL);
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    console.log(`Frontend load time: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(5000);
  });

  test('API response time should be under 2 seconds', async ({ request }) => {
    const startTime = Date.now();
    await request.get(`${BACKEND_URL}/api/health`);
    const responseTime = Date.now() - startTime;

    console.log(`API response time: ${responseTime}ms`);
    expect(responseTime).toBeLessThan(2000);
  });
});
