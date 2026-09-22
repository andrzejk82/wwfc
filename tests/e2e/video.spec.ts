import {test,expect} from '@playwright/test';

test('video loads only after keyboard activation and keeps a direct fallback',async({page})=>{
 const youtubeRequests:string[]=[];
 page.on('request',r=>{if(/youtube|ytimg|googlevideo/.test(r.url()))youtubeRequests.push(r.url());});
 await page.route('https://www.youtube-nocookie.com/**',route=>route.fulfill({contentType:'text/html',body:'<html><body>Video player</body></html>'}));
 await page.goto('/');
 await expect(page.locator('.video-player iframe')).toHaveCount(0);
 expect(youtubeRequests).toEqual([]);
 await expect(page.getByRole('link',{name:'Otwórz w YouTube'})).toHaveAttribute('href','https://www.youtube.com/watch?v=JWervAn7Czk');
 const play=page.getByRole('button',{name:'Odtwórz film: Otwarcie Warsaw West Fight Club'});
 await play.focus();await page.keyboard.press('Enter');
 await expect(page.locator('.video-player iframe')).toHaveAttribute('src','https://www.youtube-nocookie.com/embed/JWervAn7Czk?autoplay=1&rel=0');
 await page.goto('/klub/');
 await expect(page.getByText('Film przedstawia projekt, a nie aktualny spacer po obiekcie.',{exact:false})).toBeVisible();
 await expect(page.locator('.video-player iframe')).toHaveCount(0);
 await expect(page.getByRole('link',{name:'Otwórz w YouTube'})).toHaveAttribute('href','https://www.youtube.com/watch?v=U33iUOQjqiQ');
});
