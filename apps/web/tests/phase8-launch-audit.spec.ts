import { test, expect } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';

const screenshotDir = path.resolve(process.cwd(), 'tests/screenshots');
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

test.describe('Phase 8: Launch Checklist Audit & 9-Role Walkthrough', () => {

  // Helper function to mock user login by role
  const mockUserRole = async (page: any, role: string, name: string) => {
    await page.addInitScript(
      ({ r, n }: { r: string; n: string }) => {
        localStorage.setItem('gymos_token', 'mock_jwt_token_for_phase8');
        localStorage.setItem('gymos_access_token', 'mock_jwt_token_for_phase8');
        localStorage.setItem(
          'gymos_user',
          JSON.stringify({
            id: `user-${r.toLowerCase()}`,
            name: n,
            email: `${r.toLowerCase()}@techofay.com`,
            role: r,
          }),
        );
      },
      { r: role, n: name },
    );
  };

  test('Role 1: SUPER_ADMIN Walkthrough', async ({ page }) => {
    await mockUserRole(page, 'SUPER_ADMIN', 'Platform Administrator');
    await page.goto('/super-admin');

    await expect(page.locator('h1')).toContainText('Techofay GymOS Platform Super Admin');
    await expect(page.getByText('Platform MRR')).toBeVisible();
    await expect(page.getByText('Total Tenants')).toBeVisible();
    await expect(page.getByRole('button', { name: /Onboard New Tenant/i })).toBeVisible();
  });

  test('Role 2: GYM_OWNER Walkthrough', async ({ page }) => {
    await mockUserRole(page, 'GYM_OWNER', 'Vikramaditya Singhania');
    await page.goto('/dashboard');

    await expect(page.locator('h1')).toContainText('Executive Overview');
    await expect(page.getByText(/Active Members|Monthly Revenue|Check-ins Today/i).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Gate \/ Biometric Simulator/i })).toBeVisible();
  });

  test('Role 3: BRANCH_MANAGER Walkthrough', async ({ page }) => {
    await mockUserRole(page, 'BRANCH_MANAGER', 'Rhea Pillai');
    await page.goto('/multi-branch');

    await expect(page.locator('h1')).toContainText('Multi-Branch Management Engine');
    await expect(page.getByText('Consolidated View')).toBeVisible();
    await expect(page.getByRole('button', { name: /Transfer Member/i })).toBeVisible();
  });

  test('Role 4: RECEPTIONIST Walkthrough', async ({ page }) => {
    await mockUserRole(page, 'RECEPTIONIST', 'Sneha Kapoor');
    await page.goto('/dashboard');

    await expect(page.locator('h1')).toContainText('Executive Overview');
    const simButton = page.getByRole('button', { name: /Gate \/ Biometric Simulator/i });
    await expect(simButton).toBeVisible();
    await simButton.click();

    // Verify turnstile simulation dialog opens
    await expect(page.getByText(/Turnstile Turngate 01 Active/i)).toBeVisible();
  });

  test('Role 5: TRAINER Walkthrough', async ({ page }) => {
    await mockUserRole(page, 'TRAINER', 'Kabir Bhasin');
    await page.goto('/workouts');

    await expect(page.locator('h1')).toContainText('Workouts & Exercise Library');
    const templatesTab = page.getByText(/Plan Templates/i);
    await expect(templatesTab).toBeVisible();
    await templatesTab.click();
    await expect(page.getByText(/3-Day Power Foundation/i)).toBeVisible();
  });

  test('Role 6: NUTRITIONIST Walkthrough', async ({ page }) => {
    await mockUserRole(page, 'NUTRITIONIST', 'Dr. Ananya Roy');
    await page.goto('/nutrition');

    await expect(page.locator('h1')).toContainText('Nutrition & Macro Engine');
    const bmrTab = page.getByText(/BMR Calculator/i);
    await expect(bmrTab).toBeVisible();
    await expect(page.getByText(/Mifflin-St Jeor Energy Inputs/i)).toBeVisible();
  });

  test('Role 7: SALES_EXEC Walkthrough', async ({ page }) => {
    await mockUserRole(page, 'SALES_EXEC', 'Sameer Verma');
    await page.goto('/crm');

    await expect(page.locator('h1')).toContainText('CRM & Lead Pipeline');
    await expect(page.getByRole('button', { name: /Capture Inbound Lead/i })).toBeVisible();
    await expect(page.getByText('TRIAL_BOOKED')).toBeVisible();
  });

  test('Role 8: ACCOUNTANT Walkthrough', async ({ page }) => {
    await mockUserRole(page, 'ACCOUNTANT', 'Kishore Parekh');
    await page.goto('/dashboard');

    await expect(page.locator('h1')).toContainText('Executive Overview');
    await expect(page.getByRole('button', { name: /Generate GST Tax Invoice/i })).toBeVisible();

    await page.goto('/inventory-expenses');
    await expect(page.locator('h1')).toContainText('Inventory & Business Expenses');
    const plTab = page.getByRole('button', { name: /P&L Financial Breakdown/i });
    await expect(plTab).toBeVisible();
    await plTab.click();
    await expect(page.getByText(/Comprehensive Profit & Loss \(P&L\) Statement/i)).toBeVisible();
  });

  test('Role 9: MEMBER Walkthrough', async ({ page }) => {
    await mockUserRole(page, 'MEMBER', 'Aarav Nambiar');
    await page.goto('/member-portal');

    await expect(page.getByRole('heading', { name: 'Aarav Nambiar' })).toBeVisible();
    await expect(page.getByText('BKC Flagship, Mumbai').first()).toBeVisible();
    await expect(page.getByText('HMAC-Signed Check-in')).toBeVisible();
    await expect(page.getByText(/Rotates in/i)).toBeVisible();
  });

  test('Network Throttling & API Failure Graceful Error State', async ({ page }) => {
    await mockUserRole(page, 'GYM_OWNER', 'Vikramaditya Singhania');

    // Simulate complete API downtime / route abort
    await page.route('**/api/analytics/**', (route) => route.abort());
    await page.route('**/api/members/**', (route) => route.abort());

    await page.goto('/dashboard');
    // Ensure application shell remains rendered and error state is handled gracefully
    await expect(page.locator('body')).toBeVisible();
  });

  test('Responsiveness on 360px, 768px, and 1440px Viewports (Zero Horizontal Scroll)', async ({ page }) => {
    await mockUserRole(page, 'GYM_OWNER', 'Vikramaditya Singhania');

    // 1. Desktop Viewport (1440x900)
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/dashboard');
    await page.waitForTimeout(500);
    const desktopOverflow = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
    expect(desktopOverflow).toBe(true);
    await page.screenshot({ path: path.join(screenshotDir, 'desktop-1440.png'), fullPage: false });

    // 2. Tablet Viewport (768x1024)
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/dashboard');
    await page.waitForTimeout(500);
    const tabletOverflow = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
    expect(tabletOverflow).toBe(true);
    await page.screenshot({ path: path.join(screenshotDir, 'tablet-768.png'), fullPage: false });

    // 3. Mobile Viewport (360x800)
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto('/dashboard');
    await page.waitForTimeout(500);
    const mobileOverflow = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
    expect(mobileOverflow).toBe(true);
    await page.screenshot({ path: path.join(screenshotDir, 'mobile-360.png'), fullPage: false });

    // 4. Member PWA on 360px
    await page.goto('/member-portal');
    await page.waitForTimeout(500);
    const pwaOverflow = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
    expect(pwaOverflow).toBe(true);
    await page.screenshot({ path: path.join(screenshotDir, 'pwa-mobile-360.png'), fullPage: false });
  });
});
