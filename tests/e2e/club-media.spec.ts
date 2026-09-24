import { test, expect } from '@playwright/test';

test('home shows the opening film and introduces the club', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Poczuj atmosferę WWFC.' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Odtwórz film: Otwarcie Warsaw West Fight Club' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);

  const club = page.getByRole('region', { name: 'Poznaj klub' });
  await expect(club.getByText('1 000 m²')).toBeVisible();
  await expect(club.getByText('Pełnowymiarowy oktagon')).toBeVisible();
  await expect(club.getByText('Ponad 400 m² maty')).toBeVisible();
  await expect(club.locator('img')).toHaveCount(3);
  for (const image of await club.locator('img').all()) {
    await image.scrollIntoViewIfNeeded();
    await expect.poll(() => image.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
  }
});

test('club page shows a real tour film on request', async ({ page }) => {
  await page.goto('/klub/');
  await expect(page.getByRole('heading', { name: 'Poznaj klub od środka.' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(page.locator('video')).toHaveCount(0);
  await page.getByRole('button', { name: 'Odtwórz film: Poznaj WWFC' }).click();
  await expect(page.locator('video')).toBeVisible();
  await expect.poll(() => page.locator('video').evaluate((video: HTMLVideoElement) => video.readyState)).toBeGreaterThan(0);
});
