import { test, expect } from '@playwright/test';

test.describe('Phase 6: SaaS Platform, Multi-Branch, Public Website and Member PWA', () => {
  test.beforeEach(async ({ page }) => {
    // Inject auth token and mock session
    await page.addInitScript(() => {
      localStorage.setItem('gymos_token', 'mock_jwt_token_for_phase6');
      localStorage.setItem('gymos_access_token', 'mock_jwt_token_for_phase6');
      localStorage.setItem(
        'gymos_user',
        JSON.stringify({
          id: 'super-admin-root',
          name: 'Techofay Platform Admin',
          email: 'admin@techofay.com',
          role: 'SUPER_ADMIN',
        }),
      );
    });
  });

  test('Flow 1: Super Admin Console Onboarding, Usage Metering & Platform Revenue', async ({ page }) => {
    await page.goto('/super-admin');

    // 1. Verify Super Admin Console header & Platform Revenue Metrics
    await expect(page.locator('h1')).toContainText('Techofay GymOS Platform Super Admin');
    await expect(page.getByText('Platform MRR')).toBeVisible();
    await expect(page.getByText('Total Tenants')).toBeVisible();
    await expect(page.getByText('Global Members')).toBeVisible();

    // 2. Verify Tenant Directory with existing sample tenants
    await expect(page.getByText('Pulse Fitness Hub')).toBeVisible();
    await expect(page.getByText('Iron Forge Athletics')).toBeVisible();

    // 3. Open Tenant Onboarding Wizard
    const onboardBtn = page.getByRole('button', { name: /Onboard New Tenant/i });
    await expect(onboardBtn).toBeVisible();
    await onboardBtn.click();

    // 4. Verify Wizard Modal Title
    await expect(page.getByRole('heading', { name: 'Tenant Onboarding Wizard' })).toBeVisible();
    await page.locator('input[placeholder*="Apex Performance Gym"]').fill('Vanguard Fitness Studio');
    await page.locator('input[placeholder*="apex-gym"]').fill('vanguard-fitness');
    await page.locator('input[placeholder*="Anand Verma"]').fill('Kabir Khanna');
    await page.locator('input[placeholder*="owner@apexgym.in"]').fill('kabir@vanguardfitness.in');
    await page.locator('input[placeholder*="+919876543210"]').fill('9819922334');

    // 5. Check Submit Button is ready
    const submitBtn = page.getByRole('button', { name: /Confirm & Provision Gym/i });
    await expect(submitBtn).toBeVisible();

    // 6. Close Modal
    const cancelBtn = page.getByRole('button', { name: /Cancel/i });
    await cancelBtn.click();

    // 7. Verify Impersonation Action is available
    const impersonateBtn = page.getByRole('button', { name: /Impersonate/i }).first();
    await expect(impersonateBtn).toBeVisible();
  });

  test('Flow 2: Multi-Branch Performance & Member Transfer', async ({ page }) => {
    await page.goto('/multi-branch');

    // 1. Verify Consolidated Network Overview
    await expect(page.locator('h1')).toContainText('Multi-Branch Management Engine');
    await expect(page.getByText('Consolidated Revenue')).toBeVisible();
    await expect(page.getByText('Network Active Members')).toBeVisible();

    // 2. Verify Branch Cards using headings
    await expect(page.getByRole('heading', { name: 'Andheri West Flagship' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'BKC Premium Studio' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Koramangala Fitness Hub' })).toBeVisible();

    // 3. Open Transfer Member Modal
    const transferBtn = page.getByRole('button', { name: /Transfer Member/i });
    await expect(transferBtn).toBeVisible();
    await transferBtn.click();

    // 4. Verify Transfer Member modal content
    await expect(page.getByRole('heading', { name: 'Member Branch Transfer' })).toBeVisible();

    // 5. Confirm Transfer Action button is present
    const confirmTransferBtn = page.getByRole('button', { name: /Execute Transfer/i });
    await expect(confirmTransferBtn).toBeVisible();

    // 6. Close modal
    const closeBtn = page.locator('button:has-text("✕")');
    await closeBtn.click();
  });

  test('Flow 3: Inventory & Expenses with Atomic Stock In/Out and P&L Financials', async ({ page }) => {
    await page.goto('/inventory-expenses');

    // 1. Verify Inventory Header & Low-Stock Banner
    await expect(page.locator('h1')).toContainText('Inventory & Business Expenses');
    await expect(page.getByText('Low-Stock Threshold Alert')).toBeVisible();

    // 2. Verify Items in Stock Table
    await expect(page.getByText('Optimum Nutrition Gold Standard Whey 2kg')).toBeVisible();
    await expect(page.getByText('Creatine Monohydrate 300g Micronized', { exact: true })).toBeVisible();

    // 3. Open Stock In/Out Modal
    const stockActionBtn = page.getByRole('button', { name: /\+ Stock In/i }).first();
    await expect(stockActionBtn).toBeVisible();
    await stockActionBtn.click();

    // 4. Verify modal heading
    await expect(page.getByRole('heading', { name: /Stock In \(\+\)/i })).toBeVisible();

    // 5. Check Confirm Adjustment button
    const confirmAdjustmentBtn = page.getByRole('button', { name: /Confirm Adjustment/i });
    await expect(confirmAdjustmentBtn).toBeVisible();

    // 6. Close stock modal
    const closeBtn = page.getByRole('button', { name: /Cancel/i }).first();
    await closeBtn.click();

    // 7. Switch to Profit & Loss Tab
    const plTab = page.getByRole('button', { name: /P&L Financial Breakdown/i });
    await expect(plTab).toBeVisible();
    await plTab.click();

    // 8. Verify Financial Statement Line Items
    await expect(page.getByText('Comprehensive Profit & Loss (P&L) Statement')).toBeVisible();
    await expect(page.getByText('Revenue Sources')).toBeVisible();
    await expect(page.getByText('Operating Cost Breakdown')).toBeVisible();
    await expect(page.getByText('EBITDA Margin')).toBeVisible();
  });

  test('Flow 4: Branded Tenant Public Website Trial Booking & Enquiries', async ({ page }) => {
    await page.goto('/gym/ironpulse-mumbai');

    // 1. Verify Branded Gym Website Header & Hero
    await expect(page.getByText('IRONPULSE-MUMBAI Elite Fitness').first()).toBeVisible();
    await expect(page.getByText('Elevate Your Body & Mind At')).toBeVisible();

    // 2. Verify Pricing Plans
    await expect(page.getByText('Annual VIP All-Access Membership')).toBeVisible();
    await expect(page.getByText('Quarterly Transformation Pass')).toBeVisible();

    // 3. Verify Facilities and Trainers
    await expect(page.getByText('Olympic Competition Power Racks & Eleiko Barbells')).toBeVisible();
    await expect(page.getByText('Rohan Malhotra').first()).toBeVisible();

    // 4. Open Trial Booking Modal
    const trialBtn = page.getByRole('button', { name: /Book Free Trial/i }).first();
    await expect(trialBtn).toBeVisible();
    await trialBtn.click();

    // 5. Fill Trial Booking Form
    await expect(page.getByText('Book Free 1-Day Trial Session')).toBeVisible();
    await page.locator('input[placeholder*="Vikram Sharma"]').fill('Rohan Gupta');
    await page.locator('input[placeholder*="9876543210"]').fill('9820199887');
    await page.locator('input[placeholder*="vikram@gmail"]').fill('rohan@gupta-holdings.in');

    // 6. Verify Trial Submission Button is present and active
    const confirmTrialBtn = page.getByRole('button', { name: /Confirm My Free Trial Pass/i });
    await expect(confirmTrialBtn).toBeVisible();

    // 7. Close Trial Modal
    const closeBtn = page.locator('button:has-text("✕")');
    await closeBtn.click();
  });

  test('Flow 5: Member PWA Access Pass, Dynamic QR Check-in & DPDP Compliance', async ({ page }) => {
    await page.goto('/member-portal');

    // 1. Verify Member Profile & Rotating QR Pass
    await expect(page.getByRole('heading', { name: 'Aarav Nambiar' })).toBeVisible();
    await expect(page.getByText('BKC Flagship, Mumbai').first()).toBeVisible();
    await expect(page.getByText('HMAC-Signed Check-in')).toBeVisible();
    await expect(page.getByText(/Rotates in/i)).toBeVisible();

    // 2. Verify Streak Milestones
    await expect(page.getByText('Consistency Pioneer')).toBeVisible();
    await expect(page.getByText('Iron Warrior')).toBeVisible();

    // 3. Switch to Workouts Tab
    const workoutsTab = page.getByRole('button', { name: /Workouts/i });
    await expect(workoutsTab).toBeVisible();
    await workoutsTab.click();

    await expect(page.getByText('Push Power Hypertrophy (Chest & Triceps)')).toBeVisible();
    await expect(page.getByText('Barbell Flat Bench Press')).toBeVisible();

    // 4. Switch to DPDP Compliance Tab
    const dpdpTab = page.getByRole('button', { name: /DPDP Compliance/i });
    await expect(dpdpTab).toBeVisible();
    await dpdpTab.click();

    // 5. Verify Statutory Data Protection Rights
    await expect(page.getByText('Digital Personal Data Protection (DPDP) Act, 2023 Compliance')).toBeVisible();
    await expect(page.getByText('Right to Data Portability')).toBeVisible();

    // 6. Verify Data Export button is available
    const exportBtn = page.getByRole('button', { name: /Download My Data Package/i });
    await expect(exportBtn).toBeVisible();

    // 7. Verify Erasure Modal
    const deleteBtn = page.getByRole('button', { name: /Request Account & Data Deletion/i });
    await expect(deleteBtn).toBeVisible();
    await deleteBtn.click();

    await expect(page.getByText('Request Right to Erasure (DPDP Act, 2023)')).toBeVisible();
    await expect(page.getByText('Warning: Irreversible Account Action')).toBeVisible();
  });

  test('Flow 6: Techofay GymOS Marketing Site (Blog, Privacy & Terms)', async ({ page }) => {
    // 1. Visit Blog Page
    await page.goto('/blog');
    await expect(page.locator('h1')).toContainText('Fitness Business & Technology Intelligence');
    await expect(page.getByText('How Automated GST Invoicing and UPI Autopay Reduced Payment Churn by 42%').first()).toBeVisible();
    await expect(page.getByText('DPDP Act 2023 Compliance Blueprint for Indian Gym Owners and Fitness Studios')).toBeVisible();

    // 2. Visit Privacy Policy Page
    await page.goto('/privacy');
    await expect(page.locator('h1')).toContainText('Privacy Policy & Data Protection Charter');
    await expect(page.getByText('DPDP Act, 2023 Compliant')).toBeVisible();
    await expect(page.getByText('Identity of Data Fiduciary')).toBeVisible();

    // 3. Visit Terms of Service Page
    await page.goto('/terms');
    await expect(page.locator('h1')).toContainText('Terms of Service & Subscription Agreement');
    await expect(page.getByText('Subscription Scope & Tier Quotas')).toBeVisible();
    await expect(page.getByText('Billing, Invoicing & GST Compliance')).toBeVisible();
  });
});
