import {test,expect} from '@playwright/test';
import {readFileSync,readdirSync} from 'node:fs';
import {join} from 'node:path';

test('keyboard opens navigation and restores focus after schedule details',async({page},testInfo)=>{
 await page.goto('/');await page.keyboard.press('Tab');await expect(page.locator('.skip-link')).toBeFocused();await page.keyboard.press('Enter');
 if((testInfo.project.use.viewport?.width??1440)<768){const menu=page.getByRole('button',{name:'Menu',exact:true});await menu.focus();await page.keyboard.press('Enter');await expect(menu).toHaveAttribute('aria-expanded','true');await expect(page.getByRole('navigation')).toBeVisible();await page.keyboard.press('Escape');await expect(menu).toBeFocused();await expect(page.getByRole('navigation')).toBeHidden();}
 await page.goto('/grafik/?week=2026-09-07&day=all&level=intro');const card=page.locator('[data-session]').first();await card.focus();await page.keyboard.press('Enter');
 const dialog=page.getByRole('dialog');await expect(dialog).toBeVisible();await expect(dialog.getByRole('button',{name:'Zamknij'})).toBeFocused();
 await page.keyboard.press('Shift+Tab');await expect(dialog.getByRole('link',{name:'Zadzwoń do klubu'})).toBeFocused();await page.keyboard.press('Tab');await expect(dialog.getByRole('button',{name:'Zamknij'})).toBeFocused();
 for(let i=0;i<5;i++){await page.keyboard.press('Tab');const focus=await page.evaluate(()=>({inside:Boolean(document.activeElement?.closest('dialog')),tag:document.activeElement?.tagName,text:document.activeElement?.textContent?.slice(0,60)}));expect(focus.inside,JSON.stringify({tab:i+1,...focus})).toBe(true);}
 await page.keyboard.press('Escape');await expect(card).toBeFocused();
});

test('404 and preview indexing policy are correct',async({page,request})=>{
 const response=await page.goto('/nieistniejaca-strona/');expect(response?.status()).toBe(404);
 await expect(page.locator('h1')).toContainText('Wracamy');await page.goto('/');
 await expect(page.locator('meta[name=robots]')).toHaveAttribute('content','noindex,nofollow');
 expect(await (await request.get('/robots.txt')).text()).toContain('Disallow: /');
 const image=await request.get('/images/og-default.jpg');expect(image.status()).toBe(200);expect(image.headers()['content-type']).toContain('image/jpeg');
 expect((await request.get('/')).headers()['x-content-type-options']).toBe('nosniff');
});

test('all built HTML routes and internal link targets respond',async({request},testInfo)=>{
 test.skip(testInfo.project.name!=='chromium-1440','HTTP crawl is independent of viewport');
 const walk=(dir:string):string[]=>readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(join(dir,e.name)):[join(dir,e.name)]);
 const links=new Set<string>();const routes=walk('dist').filter(f=>f.endsWith('.html')&&!f.endsWith('404.html'));
 for(const file of routes){const path='/'+file.replaceAll('\\','/').replace(/^dist\//,'').replace(/index\.html$/,'');links.add(path);const html=readFileSync(file,'utf8');for(const m of html.matchAll(/(?:href|src)="(\/[^"#]*)"/g))links.add(m[1]!);}
 for(const link of links){const response=await request.get(link);expect(response.status(),link).toBe(200);}
 expect(routes.length).toBeGreaterThan(40);
});
