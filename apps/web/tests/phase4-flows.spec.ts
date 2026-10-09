import { test, expect } from '@playwright/test';

test.describe('Phase 4: Communication & Marketing Automation Flows', () => {
  test.beforeEach(async ({ page }) => {
    // Inject auth token and mock user session
    await page.addInitScript(() => {
      localStorage.setItem('gymos_access_token', 'mock_jwt_token_for_e2e');
      localStorage.setItem(
        'gymos_user',
        JSON.stringify({
          id: 'user-owner-1',
          name: 'Super Gym Admin',
          email: 'admin@ironpulse-fitness.org',
          role: 'GYM_OWNER',
        }),
      );
    });
  });

  test('Flow 1: Scheduled Jobs Dashboard and 1-Click Execution', async ({ page }) => {
    await page.goto('/communication');

    // 1. Verify Communication console header
    await expect(page.locator('h1')).toContainText('Communication & Notification Engine');
    await expect(page.getByText('11 BullMQ Jobs Active')).toBeVisible();

    // 2. Check scheduled jobs list
    await expect(page.getByText('membership-expiry-7d')).toBeVisible();
    await expect(page.getByText('birthday-auto-wishes')).toBeVisible();
    await expect(page.getByText('inactivity-followup')).toBeVisible();

    // 3. Trigger a scheduled job using "Run Now"
    const runNowButtons = page.getByRole('button', { name: /Run Now/i });
    await expect(runNowButtons.first()).toBeVisible();
    await runNowButtons.first().click();

    // 4. Verify job execution completion toast
    await expect(
      page.getByText(/Job Completed Successfully/i),
    ).toBeVisible({ timeout: 5000 });
  });

  test('Flow 2: Multilingual Template Manager & Simulated Delivery Logs', async ({ page }) => {
    await page.goto('/communication');

    // 1. Switch to Template Manager tab
    const templatesTabBtn = page.getByRole('button', { name: /Template Manager/i });
    await expect(templatesTabBtn).toBeVisible();
    await templatesTabBtn.click();

    // 2. Verify templates and WhatsApp approval status
    await expect(page.getByText('Membership 7-Day Expiry Notice').first()).toBeVisible();
    await expect(page.getByText('APPROVED').first()).toBeVisible();

    // 3. Test multilingual preview toggle (Hindi & Gujarati)
    const hiBtn = page.getByRole('button', { name: 'हिन्दी (Hindi)' });
    await expect(hiBtn).toBeVisible();
    await hiBtn.click();
    await expect(page.getByText(/नमस्ते/i).first()).toBeVisible();

    const guBtn = page.getByRole('button', { name: 'ગુજરાતી (Gujarati)' });
    await expect(guBtn).toBeVisible();
    await guBtn.click();
    await expect(page.getByText(/નમસ્તે/i).first()).toBeVisible();

    // 4. Switch to Delivery History tab
    const historyTabBtn = page.getByRole('button', { name: /Delivery History & Logs/i });
    await expect(historyTabBtn).toBeVisible();
    await historyTabBtn.click();

    // 5. Verify simulated marker for mock providers
    await expect(page.getByText('SIMULATED').first()).toBeVisible();
    await expect(page.getByText('Vikram Malhotra')).toBeVisible();

    // 6. Switch to Quiet Hours & Gateways tab
    const settingsTabBtn = page.getByRole('button', { name: /Quiet Hours & Gateways/i });
    await expect(settingsTabBtn).toBeVisible();
    await settingsTabBtn.click();
    await expect(page.getByText('Quiet Hours Policy')).toBeVisible();
    await expect(page.getByText('WhatsApp Business API')).toBeVisible();
  });

  test('Flow 3: Marketing Campaigns, A/B Testing & New Campaign Builder', async ({ page }) => {
    await page.goto('/marketing');

    // 1. Verify Marketing header
    await expect(page.locator('h1')).toContainText('Marketing, Campaigns & Automations');
    await expect(page.getByText('Diwali Fitness Fest 2026')).toBeVisible();
    await expect(page.getByText('A/B Split Test').first()).toBeVisible();

    // 2. Launch New Campaign Modal
    const newCampBtn = page.getByRole('button', { name: /New Campaign/i });
    await expect(newCampBtn).toBeVisible();
    await newCampBtn.click();

    // 3. Fill in campaign form
    await page.getByPlaceholder('e.g. Diwali Super Renewal Blitz').fill('New Year Fitness Kickstart 2027');
    await page.locator('input[type="checkbox"]').check();
    await page.getByPlaceholder('Hi {{memberName}}, celebrate with exclusive membership perks...').fill('Get 30% off your annual gym membership! Limited slots.');
    await page.getByPlaceholder('Hi {{memberName}}, alternate hook or discount offer...').fill('Start strong in 2027 with ₹5,000 off your personal training pass.');

    // 4. Submit campaign
    const submitBtn = page.getByRole('button', { name: /Launch Campaign/i });
    await expect(submitBtn).toBeVisible();
    await submitBtn.click();

    // 5. Verify toast notification and new campaign in list
    await expect(page.getByText(/Campaign Launched!/i)).toBeVisible();
    await expect(page.getByRole('heading', { name: 'New Year Fitness Kickstart 2027' })).toBeVisible();
  });

  test('Flow 4: Live Audience Segmentation, Automation Rules & Birthday Coupons', async ({ page }) => {
    await page.goto('/marketing');

    // 1. Switch to Live Audience Segmentation tab
    const segTabBtn = page.getByRole('button', { name: /Live Audience Segmentation/i });
    await expect(segTabBtn).toBeVisible();
    await segTabBtn.click();

    // 2. Verify predefined segments
    await expect(page.getByText('High-Value Annual Members')).toBeVisible();
    await expect(page.getByText('At-Risk Churn (Inactive > 14 Days)')).toBeVisible();

    // 3. Click Calculate Live Audience Size
    const calcBtn = page.getByRole('button', { name: /Calculate Live Audience Size/i });
    await expect(calcBtn).toBeVisible();
    await calcBtn.click();

    await expect(page.getByText(/Audience Aggregated/i)).toBeVisible();

    // 4. Switch to Automation Workflows tab
    const rulesTabBtn = page.getByRole('button', { name: /Automation Workflows/i });
    await expect(rulesTabBtn).toBeVisible();
    await rulesTabBtn.click();

    await expect(page.getByText('7-Day Membership Expiry Followup')).toBeVisible();
    await expect(page.getByText('Birthday Auto-Offer with Coupon')).toBeVisible();

    // 5. Switch to Birthday & Anniversary Coupons tab
    const couponsTabBtn = page.getByRole('button', { name: /Birthday & Anniversary Coupons/i });
    await expect(couponsTabBtn).toBeVisible();
    await couponsTabBtn.click();

    await expect(page.getByText('BDAY-MEM001-2026')).toBeVisible();
    await expect(page.getByText('20% OFF').first()).toBeVisible();
  });
});
