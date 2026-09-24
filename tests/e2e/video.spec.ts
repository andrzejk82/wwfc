import { test, expect } from '@playwright/test';

test('local videos load only after keyboard activation', async ({ page }) => {
  const remoteVideoRequests: string[] = [];
  page.on('request', request => {
    if (/youtube|ytimg|googlevideo/.test(request.url())) remoteVideoRequests.push(request.url());
  });

  await page.goto('/');
  await expect(page.locator('.local-video video')).toHaveCount(0);

  const play = page.getByRole('button', { name: 'Odtwórz film: Trening w WWFC' });
  await play.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.local-video video')).toHaveAttribute('src', '/images/training-film.mp4');
  expect(remoteVideoRequests).toEqual([]);

  await page.goto('/klub/');
  await expect(page.locator('.local-video video')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Odtwórz film: Poznaj WWFC' })).toBeVisible();
});
