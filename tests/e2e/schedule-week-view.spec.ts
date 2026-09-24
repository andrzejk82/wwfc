import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: new Date('2026-09-09T10:00:00Z') });
});

test('mobile opens the complete week instead of only today', async ({ page }, testInfo) => {
  test.skip((testInfo.project.use.viewport?.width ?? 1440) >= 768, 'Mobile layout only');
  await page.goto('/grafik/');
  await expect(page.locator('#day')).toHaveValue('');
  await expect(page.locator('.schedule-day')).toHaveCount(7);
  await expect(page.locator('.schedule-day').first().getByRole('heading')).toContainText('Poniedziałek');
  await expect(page.locator('.schedule-day').last().getByRole('heading')).toContainText('Niedziela');
  await expect(page.locator('[data-session]')).toHaveCount(81);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(page).toHaveURL(/\/grafik\/$/);
});

test('each day labels its class count and a selected day still narrows the week', async ({ page }) => {
  await page.goto('/grafik/');
  const monday = page.locator('.schedule-day').first();
  const mondayClasses = await monday.locator('[data-session]').count();
  await expect(monday.locator('.day-count')).toHaveText(`Zajęcia: ${mondayClasses}`);
  await page.locator('#day').selectOption('2');
  await expect(page.locator('.schedule-day')).toHaveCount(1);
  await page.reload();
  await expect(page.locator('#day')).toHaveValue('2');
  await expect(page.locator('.schedule-day')).toHaveCount(1);
});

test('mobile week overview links to every day without hiding other days', async ({ page }, testInfo) => {
  test.skip((testInfo.project.use.viewport?.width ?? 1440) >= 768, 'Mobile layout only');
  await page.goto('/grafik/');
  const overview = page.getByRole('navigation', { name: 'Przegląd tygodnia' });
  await expect(overview.getByRole('link')).toHaveCount(7);
  await overview.getByRole('link', { name: /Niedziela/ }).click();
  await expect(page.locator('.schedule-day')).toHaveCount(7);
  await expect(page.locator('#schedule-day-7')).toBeInViewport();
});

test('desktop days have enough width to read class details', async ({ page }, testInfo) => {
  test.skip((testInfo.project.use.viewport?.width ?? 0) < 1200, 'Wide desktop layout only');
  await page.goto('/grafik/');
  const width = (await page.locator('.schedule-day').first().boundingBox())?.width ?? 0;
  expect(width).toBeGreaterThanOrEqual(400);
});

test('mobile shows the week overview before the filters', async ({ page }, testInfo) => {
  test.skip((testInfo.project.use.viewport?.width ?? 1440) >= 768, 'Mobile layout only');
  await page.goto('/grafik/');
  const overview = page.getByRole('navigation', { name: 'Przegląd tygodnia' });
  const overviewBox = await overview.boundingBox();
  const filtersBox = await page.locator('#filters').boundingBox();
  expect(overviewBox?.y ?? Infinity).toBeLessThan(filtersBox?.y ?? 0);
});
