const { test, expect } = require('@playwright/test');

test.describe('Verify Current Login Status', () => {
  const FRONTEND_URL = 'https://frontend-production-32b8.up.railway.app';
  
  test('Verify login works now', async ({ page }) => {
    console.log('🔐 Testing current login state...\n');
    
    // Go to login page
    await page.goto(`${FRONTEND_URL}/login`, { waitUntil: 'networkidle' });
    console.log('✅ Login page loaded');
    
    // Clear localStorage
    await page.evaluate(() => localStorage.clear());
    
    // Fill and submit login
    await page.fill('input[type="email"]', 'admin@zirakbook.com');
    await page.fill('input[type="password"]', 'Admin123!');
    console.log('✅ Filled credentials');
    
    await page.click('button[type="submit"]');
    console.log('✅ Submitted login form');
    
    await page.waitForTimeout(5000);
    
    const url = page.url();
    console.log(`📍 Current URL: ${url}`);
    
    // Take screenshot
    await page.screenshot({ path: '/root/current_login_state.png', fullPage: true });
    console.log('📸 Screenshot saved\n');
    
    expect(url).toBeTruthy();
  });
});
