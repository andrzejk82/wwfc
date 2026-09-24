import { test, expect } from '@playwright/test';

test('opening film loads after keyboard activation while club video stays local', async ({ page }) => {
  const youtubeRequests: string[] = [];
  page.on('request', request => {
    if (/youtube|ytimg|googlevideo/.test(request.url())) youtubeRequests.push(request.url());
  });
  await page.route('https://www.youtube-nocookie.com/**', route => route.fulfill({ contentType: 'text/html', body: '<html><body>Video player</body></html>' }));

  await page.goto('/');
  await expect(page.locator('.video-player iframe')).toHaveCount(0);
  expect(youtubeRequests).toEqual([]);
  await expect(page.getByRole('link', { name: 'Otwórz w YouTube' })).toHaveAttribute('href', 'https://www.youtube.com/watch?v=JWervAn7Czk');
  const play = page.getByRole('button', { name: 'Odtwórz film: Otwarcie Warsaw West Fight Club' });
  await play.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.video-player iframe')).toHaveAttribute('src', 'https://www.youtube-nocookie.com/embed/JWervAn7Czk?autoplay=1&rel=0');

  await page.goto('/klub/');
  await expect(page.locator('.local-video video')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Odtwórz film: Poznaj WWFC' })).toBeVisible();
});
