import { test, expect } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';

const PUBLIC_ROUTES = [
  { path: '/', name: 'landing' },
  { path: '/features', name: 'features' },
  { path: '/pricing', name: 'pricing' },
  { path: '/contact', name: 'contact' },
  { path: '/blog', name: 'blog' },
  { path: '/privacy', name: 'privacy' },
  { path: '/terms', name: 'terms' },
  { path: '/gym', name: 'gym-tenant' },
  { path: '/member-portal', name: 'member-portal' },
];

test.describe('Design and Images Pass — Public Site & Tenant Template Verification', () => {
  const screenshotsDir = path.resolve('../../docs/screenshots');

  test.beforeAll(() => {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  });

  test('1. Tenant Gym Site Hero reference layout, video modal, and plan scroll link', async ({ page }) => {
    // 1440px Desktop viewport
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/gym');
    await page.waitForLoadState('networkidle');

    // Verify Hero elements per DESIGN RULES
    const heroHeadline = page.locator('h1');
    await expect(heroHeadline).toBeVisible();
    await expect(heroHeadline).toContainText('Relentless Performance');

    // Verify "View Membership Plans" working scroll link
    const viewPlansBtn = page.getByRole('link', { name: 'View Membership Plans' });
    await expect(viewPlansBtn).toBeVisible();
    await expect(viewPlansBtn).toHaveAttribute('href', '#membership-plans');

    // Click "Watch Video" to trigger accessible modal
    const watchVideoBtn = page.getByRole('button', { name: 'Watch Video' });
    await expect(watchVideoBtn).toBeVisible();
    await watchVideoBtn.click();

    // Verify Accessible Video Modal
    const videoDialog = page.getByRole('dialog', { name: /Club Tour & Training Session Video/i });
    await expect(videoDialog).toBeVisible();

    const videoEl = videoDialog.locator('video');
    await expect(videoEl).toBeVisible();
    await expect(videoEl).toHaveAttribute('controls', '');

    const captionsTrack = videoDialog.locator('track[kind="captions"]');
    await expect(captionsTrack).toBeAttached();

    // Close modal via Escape key
    await page.keyboard.press('Escape');
    await expect(videoDialog).not.toBeVisible();

    // Verify Facilities Grid with Graded Photos
    const facilitiesSection = page.locator('#facilities');
    await expect(facilitiesSection).toBeVisible();
    const facilityCards = facilitiesSection.locator('.group');
    await expect(facilityCards).toHaveCount(6);

    // Verify Timetable Day Selector
    const timetableSection = page.locator('#timetable');
    await expect(timetableSection).toBeVisible();
    const tuesdayBtn = page.getByRole('button', { name: 'Tuesday' });
    await tuesdayBtn.click();
    await expect(tuesdayBtn).toHaveAttribute('aria-pressed', 'true');

    // Verify Membership Plans Section
    const plansSection = page.locator('#membership-plans');
    await expect(plansSection).toBeVisible();
    await expect(plansSection.locator('text=Most Popular Pass')).toBeVisible();

    // Verify Certified Coaching Staff
    const trainersSection = page.locator('#trainers');
    await expect(trainersSection).toBeVisible();
    await expect(trainersSection.locator('text=Rohan Malhotra')).toBeVisible();

    // Verify FAQ Accordion
    const faqSection = page.locator('#faq');
    await expect(faqSection).toBeVisible();
    const firstFaq = faqSection.getByRole('button').first();
    await expect(firstFaq).toBeVisible();
  });

  test('2. Mobile Menu Drawer closes on Escape and navigation', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Open mobile menu
    const menuBtn = page.getByRole('button', { name: /open navigation drawer/i });
    await expect(menuBtn).toBeVisible();
    await menuBtn.click();

    // Verify drawer is open
    const drawer = page.getByTestId('mobile-drawer');
    await expect(drawer).toBeVisible();

    // Press Escape to close
    await page.keyboard.press('Escape');
    await expect(drawer).not.toBeVisible();
  });

  test('3. Capture 360px Mobile and 1440px Desktop Screenshots of Every Public Page', async ({ page }) => {
    for (const route of PUBLIC_ROUTES) {
      // 1. Desktop 1440px
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(route.path);
      await page.waitForLoadState('networkidle');

      // Assert no horizontal scroll
      const desktopOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth <= window.innerWidth;
      });
      expect(desktopOverflow).toBe(true);

      const desktopShotPath = path.join(screenshotsDir, `${route.name}-1440.png`);
      await page.screenshot({ path: desktopShotPath, fullPage: true });

      // 2. Mobile 360px
      await page.setViewportSize({ width: 360, height: 740 });
      await page.goto(route.path);
      await page.waitForLoadState('networkidle');

      // Assert no horizontal scroll on mobile
      const mobileOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth <= window.innerWidth;
      });
      expect(mobileOverflow).toBe(true);

      const mobileShotPath = path.join(screenshotsDir, `${route.name}-360.png`);
      await page.screenshot({ path: mobileShotPath, fullPage: true });
    }
  });
});
