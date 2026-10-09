import { test, expect } from '@playwright/test';

test.describe('Phase 3: CRM, Bookings, Waitlist & Workouts Flows', () => {
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

  test('Flow 1: Lead capture, Kanban interaction and 1-Click Convert to Member', async ({ page }) => {
    await page.goto('/crm');

    // 1. Verify CRM pipeline header and Kanban view loaded
    await expect(page.locator('h1')).toContainText('CRM & Lead Pipeline');
    await expect(page.getByText('New Inquiries')).toBeVisible();
    await expect(page.getByText('Contacted', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Converted', { exact: true }).first()).toBeVisible();

    // 2. Click on a lead to open detail drawer
    const leadCard = page.locator('text=Rohan Mehra').first();
    await expect(leadCard).toBeVisible();
    await leadCard.click();

    // 3. Verify lead drawer opened and click "1-Click Convert to Member"
    const convertBtn = page.getByRole('button', { name: /1-Click Convert to Member/i });
    await expect(convertBtn).toBeVisible();
    await convertBtn.click();

    // 4. Confirm conversion modal appears
    await expect(page.getByText(/Convert Rohan Mehra to Member/i)).toBeVisible();
    const confirmConvertBtn = page.getByRole('button', { name: /Confirm Conversion/i });
    await expect(confirmConvertBtn).toBeVisible();
    await confirmConvertBtn.click();

    // 5. Verify conversion celebration toast appears
    await expect(page.getByText(/successfully converted to an active Member/i)).toBeVisible();
  });

  test('Flow 2: Class booking with capacity gauge and waitlist auto-promotion', async ({ page }) => {
    await page.goto('/classes');

    // 1. Verify schedule view is loaded
    await expect(page.locator('h1')).toContainText('Classes, Bookings & Trials');
    await expect(page.getByText('CrossFit WOD & Metabolic Conditioning')).toBeVisible();

    // 2. Locate a class at capacity to test waitlist
    const fullClass = page.getByText('Olympic Snatch & Clean Pulls Masterclass');
    await expect(fullClass).toBeVisible();

    const waitlistBtn = page.getByRole('button', { name: /Join Waitlist/i }).first();
    await expect(waitlistBtn).toBeVisible();
    await waitlistBtn.click();

    // 3. Confirm waitlist booking modal
    await expect(page.getByText(/You will be added to the waitlist/i)).toBeVisible();
    const confirmWaitlistBtn = page.getByRole('button', { name: /Confirm Waitlist/i });
    await expect(confirmWaitlistBtn).toBeVisible();
    await confirmWaitlistBtn.click();

    // 4. Verify waitlist notification
    await expect(page.getByText(/Added to Waitlist/i)).toBeVisible();
  });

  test('Flow 3: Exercise Library exploration and Workout Plan Assignment', async ({ page }) => {
    await page.goto('/workouts');

    // 1. Verify exercise catalog
    await expect(page.locator('h1')).toContainText('Workouts & Exercise Library');
    await expect(page.getByText('Barbell Back Squat')).toBeVisible();

    // 2. Switch to Plan Templates tab
    const templatesTabBtn = page.getByRole('button', { name: /Plan Templates/i });
    await expect(templatesTabBtn).toBeVisible();
    await templatesTabBtn.click();

    // 3. Verify 3-Day Power Foundation template
    await expect(page.getByText('3-Day Power Foundation')).toBeVisible();

    // 4. Click Assign Plan to Member
    const assignBtn = page.getByRole('button', { name: /Assign Plan to Member/i }).first();
    await expect(assignBtn).toBeVisible();
    await assignBtn.click();

    // 5. Confirm assignment modal
    await expect(page.getByText(/Select the member to whom this training schedule should be personalized/i)).toBeVisible();
    const confirmAssignBtn = page.getByRole('button', { name: /Confirm Assignment/i });
    await expect(confirmAssignBtn).toBeVisible();
    await confirmAssignBtn.click();

    // 6. Verify plan assignment toast
    await expect(page.getByText(/Plan Assigned!/i)).toBeVisible();
  });
});
