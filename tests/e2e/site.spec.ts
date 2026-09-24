import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
test('desktop navigation remains compact and available after scrolling',async({page},testInfo)=>{
 test.skip((testInfo.project.use.viewport?.width??0)<768,'Desktop navigation only');
 await page.goto('/');
 await page.evaluate(()=>window.scrollTo(0,1200));
 await expect.poll(()=>page.evaluate(()=>window.scrollY)).toBeGreaterThan(1000);
 const header=page.locator('.site-header');
 await expect.poll(async()=>Math.round((await header.boundingBox())?.y??-1)).toBe(0);
 const headerBox=await header.boundingBox();
 const navBox=await page.getByRole('navigation',{name:'Nawigacja główna'}).boundingBox();
 expect(headerBox?.height??0).toBeLessThanOrEqual(56);
 expect((navBox?.y??0)-(headerBox?.y??0)).toBeLessThanOrEqual(4);
 expect((headerBox?.y??0)+(headerBox?.height??0)-(navBox?.y??0)-(navBox?.height??0)).toBeLessThanOrEqual(4);
 const navigation=page.getByRole('navigation',{name:'Nawigacja główna'});
 await expect(navigation.getByRole('link',{name:'Trenerzy'})).toBeVisible();
 const logoRight=(await page.locator('.brand').first().boundingBox())?.x??0;
 const logoWidth=(await page.locator('.brand').first().boundingBox())?.width??0;
 expect((await navigation.boundingBox())?.x??0).toBeGreaterThanOrEqual(logoRight+logoWidth);
});
test('mobile header scrolls away while training actions stay available',async({page},testInfo)=>{
 test.skip((testInfo.project.use.viewport?.width??1440)>=768,'Mobile navigation only');
 await page.goto('/');
 await page.evaluate(()=>window.scrollTo(0,1200));
 await expect.poll(()=>page.evaluate(()=>window.scrollY)).toBeGreaterThan(1000);
 expect((await page.locator('.site-header').boundingBox())?.y??0).toBeLessThan(0);
 await expect(page.locator('.mobile-cta').getByRole('link',{name:'Sprawdź grafik'})).toBeInViewport();
});
test('navigation, layout and accessible pages',async({page},testInfo)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 for(const path of ['/','/grafik/','/dyscypliny/boks/','/trenerzy/norbert-dabrowski/','/cennik/','/pierwszy-trening/','/kontakt/']){
  await page.goto(path);await expect(page.locator('h1')).toHaveCount(1);
  await page.evaluate(()=>document.fonts.ready);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  expect((await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze()).violations).toEqual([]);
  if(path==='/'||path==='/grafik/')await page.screenshot({path:testInfo.outputPath(path==='/'?'home.png':'schedule.png'),fullPage:true});
 }
 expect(errors).toEqual([]);
});
test('schedule has source data, URL filters and accessible details',async({page})=>{
 await page.clock.install({time:new Date('2026-09-09T10:00:00Z')});
 await page.goto('/grafik/?week=2026-09-07&discipline=boks');
 await expect(page.locator('#discipline')).toHaveValue('boks');
 await expect(page.locator('[data-session]').first()).toBeVisible();
 await page.locator('[data-session]').first().click();
 await expect(page.getByRole('dialog')).toBeVisible();
 await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).not.toBeVisible();
 await page.getByRole('button',{name:'Wyczyść filtry'}).click();
 await expect(page.locator('#discipline')).toHaveValue('');
});
test('schedule remains readable without JavaScript',async({browser,baseURL},testInfo)=>{
 const context=await browser.newContext({javaScriptEnabled:false,viewport:testInfo.project.use.viewport});const page=await context.newPage();
 await page.goto(baseURL+'/grafik/');
 await expect(page.locator('.schedule-fallback tbody tr')).toHaveCount(81);
 await expect(page.getByText('Wersja statyczna')).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await context.close();
});
