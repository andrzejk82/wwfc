import {test,expect} from '@playwright/test';

test.beforeEach(async({page})=>{await page.clock.install({time:new Date('2026-09-09T10:00:00Z')});});

test('an explicit all-days choice survives reload',async({page})=>{
 await page.goto('/grafik/');await page.locator('#day').selectOption('');
 await expect(page.locator('[data-session]')).toHaveCount(81);await page.reload();
 await expect(page.locator('#day')).toHaveValue('');await expect(page.locator('[data-session]')).toHaveCount(81);
});

test('reset returns to the current full week on every device',async({page})=>{
 await page.goto('/grafik/?week=2026-09-21&day=2&discipline=boks');await page.getByRole('button',{name:'Wyczyść filtry'}).click();
 await expect(page.locator('#week-label')).toHaveText(/^7 wrz/);await expect(page.locator('#discipline')).toHaveValue('');
 await expect(page.locator('#day')).toHaveValue('');await expect(page.locator('.schedule-day')).toHaveCount(7);await expect(page).toHaveURL(/\/grafik\/$/);await page.reload();await expect(page.locator('#day')).toHaveValue('');
});

test('unknown coach and discipline URLs do not silently hide all classes',async({page})=>{
 await page.goto('/grafik/?week=2026-09-07&day=all&coach=does-not-exist&discipline=does-not-exist');
 await expect(page.locator('#discipline')).toHaveValue('');await expect(page.locator('#coach')).toHaveValue('');await expect(page.locator('[data-session]')).toHaveCount(81);
});

test('changing discipline keeps the full week on mobile across midnight',async({page},testInfo)=>{
 test.skip((testInfo.project.use.viewport?.width??1440)>=768,'Desktop defaults to the full week');
 await page.clock.setSystemTime(new Date('2026-09-09T21:59:30Z'));await page.goto('/grafik/');await page.locator('#discipline').selectOption('boks');await page.clock.runFor(61000);
 await expect(page.locator('#day')).toHaveValue('');await expect(page.locator('.schedule-day')).toHaveCount(7);await page.reload();await expect(page.locator('#day')).toHaveValue('');
});

test('browser back restores the preceding filter selection',async({page})=>{
 await page.goto('/grafik/?week=2026-09-07&day=all');await page.locator('#discipline').selectOption('boks');await page.locator('#audience').selectOption('women');
 await expect(page.locator('[data-session]')).toHaveCount(2);await page.goBack();
 await expect(page.locator('#discipline')).toHaveValue('boks');await expect(page.locator('#audience')).toHaveValue('');
 expect(await page.locator('[data-session]').count()).toBeGreaterThan(2);
});

test('age, coach and room filters combine and expose an empty result',async({page})=>{
 await page.goto('/grafik/?week=2026-09-07&day=all&audience=children&age=11&discipline=akrobatyka');
 await expect(page.locator('#advanced')).toHaveAttribute('open','');
 await expect(page.locator('[data-session]')).toHaveCount(2);
 for(const card of await page.locator('[data-session]').all())await expect(card).toContainText('11+ lat');
 await page.locator('#room').selectOption('cardio');await expect(page.locator('[data-session]')).toHaveCount(0);await expect(page.locator('#result-count')).toContainText('0');
});

test('Warsaw midnight advances the full week without a reload',async({page},testInfo)=>{
 await page.clock.setSystemTime(new Date('2026-09-13T21:59:30Z'));await page.goto('/grafik/');
 await expect(page.locator('#week-label')).toHaveText(/^7 wrz/);await page.clock.runFor(61000);
 await expect(page.locator('#week-label')).toContainText('14 wrz');
 if((testInfo.project.use.viewport?.width??1440)<768){await expect(page.locator('#day')).toHaveValue('');await expect(page.locator('.schedule-day')).toHaveCount(7);}
});

test('an explicitly selected historical week remains selected after midnight',async({page})=>{
 await page.clock.setSystemTime(new Date('2026-09-13T21:59:30Z'));await page.goto('/grafik/?week=2026-09-07&day=2');await page.clock.runFor(61000);
 await expect(page.locator('#week-label')).toHaveText(/^7 wrz/);await expect(page.locator('#day')).toHaveValue('2');
});

test('today drops a class when its start time is reached',async({page})=>{
 await page.clock.setSystemTime(new Date('2026-09-09T13:59:30Z'));await page.goto('/');
 await expect(page.locator('[data-today-list]')).toContainText('16:00');await page.clock.runFor(61000);
 await expect(page.locator('[data-today-list]')).not.toContainText('16:00');
});

test('printing preserves the selected week and filters without duplicating the fallback',async({page})=>{
 await page.goto('/grafik/?week=2026-09-14&day=all&discipline=boks');const count=await page.locator('[data-session]').count();await page.emulateMedia({media:'print'});
 await expect(page.locator('.schedule-app')).toBeHidden();await expect(page.locator('.schedule-fallback')).toBeHidden();
 await expect(page.locator('#schedule-print')).toBeVisible();await expect(page.locator('#schedule-print')).toContainText('14 wrz');
 await expect(page.locator('#schedule-print tbody tr')).toHaveCount(count);
 for(const row of await page.locator('#schedule-print tbody tr').all())await expect(row).toContainText('Boks');
 await expect(page.locator('.mobile-cta')).toBeHidden();
});
