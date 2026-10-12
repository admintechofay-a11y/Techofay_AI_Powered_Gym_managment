import { test, expect } from '@playwright/test';

test.describe('Phase 5: AI & Advanced Analytics Flows', () => {
  test.beforeEach(async ({ page }) => {
    // Inject auth token and mock user session
    await page.addInitScript(() => {
      localStorage.setItem('gymos_access_token', 'mock_jwt_token_for_e2e');
      localStorage.setItem(
        'gymos_user',
        JSON.stringify({
          id: 'user-owner-1',
          name: 'Super Gym Admin',
          email: 'admin@olympus-fitness.org',
          role: 'GYM_OWNER',
        }),
      );
    });
  });

  test('Flow 1: Natural-Language Business Reports Query & Safe Tools Inspector', async ({ page }) => {
    await page.goto('/analytics');

    // 1. Verify page title and AI mode badge
    await expect(page.locator('h1')).toContainText('AI & Advanced Analytics Hub');
    await expect(page.getByText(/AI: Basic mode/i).first()).toBeVisible();

    // 2. Click a quick prompt suggestion
    const promptChip = page.getByRole('button', { name: /How much revenue did we collect this month/i });
    await expect(promptChip).toBeVisible();
    await promptChip.click();

    // 3. Verify AI synthesis response panel displays
    await expect(page.getByText('AI Synthesis Response')).toBeVisible({ timeout: 6000 });
    await expect(page.getByText('get_revenue_by_period')).toBeVisible();

    // 4. Verify Real Tenant Data inspection accordion
    const dataDetails = page.locator('details');
    await expect(dataDetails.first()).toBeVisible();
    await dataDetails.first().click();
    await expect(page.getByText(/Inspect Tenant Data Used/i)).toBeVisible();
  });

  test('Flow 2: Churn Risk Predictor & Editable Follow-Up Generation', async ({ page }) => {
    await page.goto('/analytics');

    // 1. Verify Churn Risk scoring section
    await expect(page.getByText('Predictive Member Churn Risk Scoring')).toBeVisible();
    await expect(page.getByText('Kabir Singhania')).toBeVisible();
    await expect(page.getByText(/HIGH RISK/i).first()).toBeVisible();

    // 2. Verify top explainable reasons
    await expect(page.getByText(/Absent for 25 consecutive days/i)).toBeVisible();

    // 3. Click "Draft AI Outreach Message"
    const draftBtn = page.getByRole('button', { name: /Draft AI Outreach Message/i }).first();
    await expect(draftBtn).toBeVisible();
    await draftBtn.click();

    // 4. Verify modal opens with editable message
    await expect(page.getByText(/Draft AI Follow-Up Message/i)).toBeVisible();
    const textarea = page.locator('textarea');
    await expect(textarea).toBeVisible();
    await textarea.fill('Hi Kabir, coach Aditya here. We noticed you missed a few sessions. Your renewed annual plan discount is ready!');

    // 5. Test Copy Message action
    const copyBtn = page.getByRole('button', { name: /Copy Text/i });
    await expect(copyBtn).toBeVisible();
    await copyBtn.click();
    await expect(page.getByText('Message copied to clipboard')).toBeVisible({ timeout: 5000 });

    // 6. Test Dispatch action
    const dispatchBtn = page.getByRole('button', { name: /Dispatch via/i });
    await expect(dispatchBtn).toBeVisible();
    await dispatchBtn.click();
    await expect(page.getByText(/Follow-up/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('Flow 3: Advanced Dashboards & Peak Hours Heatmap', async ({ page }) => {
    await page.goto('/analytics');

    // 1. Switch to Advanced Dashboards tab
    const dashboardsTab = page.getByRole('button', { name: /Advanced Dashboards/i });
    await expect(dashboardsTab).toBeVisible();
    await dashboardsTab.click();

    // 2. Verify Member Retention Cohorts matrix
    await expect(page.getByText('Member Retention Cohorts (Monthly Matrix)')).toBeVisible();
    await expect(page.getByText('Join Cohort')).toBeVisible();

    // 3. Verify 7x24 Peak Hours Heatmap
    await expect(page.getByText('7x24 Peak Hours Footfall Heatmap')).toBeVisible();
    await expect(page.getByText('Monday')).toBeVisible();
    await expect(page.getByText('Friday')).toBeVisible();

    // 4. Verify Predictive Renewal Forecast
    await expect(page.getByText('Predictive Renewal Forecast')).toBeVisible();
    await expect(page.getByText('Next 7 Days')).toBeVisible();
    await expect(page.getByText('Next 30 Days')).toBeVisible();

    // 5. Verify Trainer Performance Matrix
    await expect(page.getByText('Trainer Performance & Session Utilization')).toBeVisible();
  });

  test('Flow 4: SOW 23 Reports & Scheduled Email Engine', async ({ page }) => {
    await page.goto('/analytics');

    // 1. Switch to SOW 23 Reports tab
    const reportsTab = page.getByRole('button', { name: /SOW 23 Reports & Export/i });
    await expect(reportsTab).toBeVisible();
    await reportsTab.click();

    // 2. Verify header and Live Records Preview
    await expect(page.getByText('SOW Sec 23 Business Reports & Scheduled Email Engine')).toBeVisible();
    await expect(page.getByText(/Live Records Preview/i)).toBeVisible();

    // 3. Verify export buttons exist
    await expect(page.getByRole('button', { name: 'CSV' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Excel' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'PDF' })).toBeVisible();

    // 4. Open Schedule Email Report modal
    const scheduleBtn = page.getByRole('button', { name: /Schedule Email Report/i });
    await expect(scheduleBtn).toBeVisible();
    await scheduleBtn.click();

    // 5. Fill and submit schedule
    await expect(page.getByText('Configure Scheduled Email Report')).toBeVisible();
    const recipientInput = page.getByPlaceholder(/manager@gym.com/i);
    await recipientInput.fill('finance@olympus-gym.org, auditor@olympus-gym.org');

    const saveScheduleBtn = page.getByRole('button', { name: /Save Schedule/i });
    await expect(saveScheduleBtn).toBeVisible();
    await saveScheduleBtn.click();

    await expect(page.getByText(/Scheduled email report configured successfully/i)).toBeVisible({ timeout: 5000 });
  });

  test('Flow 5: AI Workout & Diet DRAFT Approval Safeguard', async ({ page }) => {
    await page.goto('/analytics');

    // 1. Switch to AI Approval Queue tab
    const approvalsTab = page.getByRole('button', { name: /AI Approval Queue/i });
    await expect(approvalsTab).toBeVisible();
    await approvalsTab.click();

    // 2. Verify clinical safeguard requirement banner
    await expect(page.getByText('AI Workout & Nutrition Approval Queue')).toBeVisible();
    await expect(page.getByText(/Mandatory Clinical Safeguard: All AI-generated workout routines and diet charts are created as DRAFT/i)).toBeVisible();

    // 3. Verify draft plan is present and approve it
    await expect(page.getByText(/Hypertrophy 4-Day Strength Split/i)).toBeVisible();
    const reviewBtn = page.getByRole('button', { name: /Review Plan/i }).first();
    await expect(reviewBtn).toBeVisible();
    await reviewBtn.click();

    // 4. Verify review modal with exercise schedule
    await expect(page.getByText(/Prescribed Exercise Schedule/i)).toBeVisible();
    await expect(page.getByText('Barbell Back Squat')).toBeVisible();

    // 5. Click Approve & Activate
    const approveBtn = page.getByRole('button', { name: /Approve & Activate/i }).last();
    await expect(approveBtn).toBeVisible();
    await approveBtn.click();

    // 6. Verify success toast
    await expect(page.getByText(/approved and activated for member/i)).toBeVisible({ timeout: 5000 });
  });

  test('Flow 6: Floating AI Gym Concierge Chatbot & Human Handoff', async ({ page }) => {
    await page.goto('/analytics');

    // 1. Open floating chatbot widget
    const conciergeTrigger = page.getByRole('button', { name: /Open AI Gym Concierge/i });
    await expect(conciergeTrigger).toBeVisible();
    await conciergeTrigger.click();

    // 2. Verify chatbot header and welcome message
    await expect(page.getByText('AI Concierge & Timetable')).toBeVisible();
    await expect(page.getByText(/Namaste! I am your GymOS AI Assistant/i)).toBeVisible();

    // 3. Click quick prompt for timings
    const hoursPrompt = page.getByRole('button', { name: /What are the gym operating hours/i });
    await expect(hoursPrompt).toBeVisible();
    await hoursPrompt.click();

    // 4. Verify synthesized bot response
    await expect(page.getByText(/Monday to Saturday 05:30 AM/i).first()).toBeVisible({ timeout: 6000 });

    // 5. Test Human Handoff flow
    const handoffPrompt = page.getByRole('button', { name: /Speak with front desk/i });
    await expect(handoffPrompt).toBeVisible();
    await handoffPrompt.click();

    // 6. Fill handoff callback request
    await expect(page.getByText('Front-Desk Specialist Callback')).toBeVisible();
    await page.getByLabel('Full Name').fill('Rajesh Khanna');
    await page.getByLabel('Phone Number').fill('+91 98111 22334');

    const requestCallBtn = page.getByRole('button', { name: /Request Call/i });
    await expect(requestCallBtn).toBeVisible();
    await requestCallBtn.click();

    await expect(page.getByText(/Callback registered!/i)).toBeVisible({ timeout: 5000 });
  });

  test('Flow 7: Integrations Settings AI Status Display', async ({ page }) => {
    await page.goto('/settings/integrations');

    // 1. Verify Integrations page header
    await expect(page.locator('h1')).toContainText('Integrations & Adapters');

    // 2. Verify AI Engine card shows "AI: Basic mode / Claude"
    await expect(page.getByText('AI Engine & LLM Intelligence')).toBeVisible();
    await expect(page.getByText('AI: Basic mode / Claude')).toBeVisible();
    await expect(page.getByText(/AI: Basic mode/i).first()).toBeVisible();
    await expect(page.getByText(/Prompt sanitization & PII masked/i)).toBeVisible();
    await expect(page.getByText(/Cross-Tenant Isolation/i)).toBeVisible();
  });
});
