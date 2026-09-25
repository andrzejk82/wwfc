import {test,expect} from '@playwright/test';
import {sourceContent} from '../../src/lib/content/repository';
import type {Page} from '@playwright/test';

async function withScenario(page:Page,kind:'changed'|'substitution'|'cancelled'|'closed'|'expired'){
 const data=sourceContent();const base=data.releases[0]!.sessions.find(s=>s.disciplineSlug==='boks'&&s.audience==='general')!;
 data.releases=[{id:'scenario',title:'Test wyjątków',validFrom:'2026-09-01',validTo:kind==='expired'?'2026-09-13':'2026-09-30',sessions:[{...base,key:'boks',weekday:2,startTime:'18:00',endTime:'19:00',room:'mata-1'}],exceptions:kind==='changed'?[{sessionKey:'boks',date:'2026-09-15',kind:'changed',explanation:'Jednorazowa zmiana sali i godziny',replacement:{room:'mata-2',startTime:'19:00',endTime:'20:00'}}]:kind==='substitution'?[{sessionKey:'boks',date:'2026-09-15',kind:'changed',explanation:'Zastępstwo trenera',replacement:{coachSlug:data.coaches.find(c=>c.slug!==base.coachSlug)!.slug}}]:kind==='cancelled'?[{sessionKey:'boks',date:'2026-09-15',kind:'cancelled',explanation:'Trening odwołany'}]:[],notices:kind==='closed'?[{key:'closed',title:'Klub zamknięty',message:'Przerwa',startDate:'2026-09-15',endDate:'2026-09-15',closed:true}]:[]}];
 // Inject only test content into the built HTML. The shipped JS/CSS remains unchanged.
 await page.route('**/grafik/**',async route=>{if(route.request().resourceType()!=='document')return route.continue();const response=await route.fetch();const html=(await response.text()).replace(/(<script\b[^>]*\bid="schedule-data"[^>]*>)[\s\S]*?(<\/script>)/,(_m,a,b)=>a+JSON.stringify(data).replaceAll('<','\\u003c')+b);await route.fulfill({response,body:html});});
}
test('single-date replacement filters effective values and leaves the next week intact',async({page})=>{
 await withScenario(page,'changed');await page.goto('/grafik/?week=2026-09-14&day=all&room=mata-2');
 const card=page.locator('[data-session]');await expect(card).toHaveCount(1);await expect(card).toContainText('19:00');await expect(card).toContainText('Zmiana jednorazowa');await card.click();
 await expect(page.getByRole('dialog')).toContainText('Pierwotnie: 18:00, Mata 1');await page.keyboard.press('Escape');
 await page.emulateMedia({media:'print'});await expect(page.locator('#schedule-print')).toContainText('19:00');await expect(page.locator('#schedule-print')).toContainText('pierwotnie 18:00');await page.emulateMedia({media:'screen'});
 await page.locator('#room').selectOption('');await page.getByRole('button',{name:'Następny tydzień'}).click();await expect(card).toContainText('18:00');await expect(card).not.toContainText('Zmiana jednorazowa');
});
test('coach replacement is labeled consistently in the card and details',async({page})=>{
 await withScenario(page,'substitution');await page.goto('/grafik/?week=2026-09-14&day=all');
 const card=page.locator('[data-session]');await expect(card.locator('.status')).toHaveText('Zastępstwo');await card.click();
 await expect(page.getByRole('dialog')).toContainText('Zastępstwo: Zastępstwo trenera');
});
for(const kind of ['cancelled','closed'] as const)test(`${kind} remains visible with an explanation`,async({page})=>{
 await withScenario(page,kind);await page.goto('/grafik/?week=2026-09-14&day=all');const card=page.locator('[data-session]');await expect(card).toContainText('Odwołane');await card.click();await expect(page.getByRole('dialog')).toContainText(kind==='closed'?'Klub zamknięty':'Trening odwołany');
});
test('an expired release never appears as the current schedule',async({page})=>{
 await withScenario(page,'expired');await page.goto('/grafik/?week=2026-09-14&day=all');await expect(page.locator('[data-session]')).toHaveCount(0);await expect(page.getByText('Brak opublikowanego grafiku na ten dzień.')).toHaveCount(7);
 await expect(page.locator('#schedule-notices a[href="tel:+48604066669"]')).toBeVisible();
});

test('week navigation stops at release coverage and print includes validity dates',async({page})=>{
 await withScenario(page,'changed');await page.goto('/grafik/?week=2026-08-31&day=all');
 await expect(page.getByRole('button',{name:'Poprzedni tydzień'})).toBeDisabled();
 await page.goto('/grafik/?week=2026-09-28&day=all');await expect(page.getByRole('button',{name:'Następny tydzień'})).toBeDisabled();
 await page.emulateMedia({media:'print'});await expect(page.locator('#schedule-print')).toContainText('2026-09-01');await expect(page.locator('#schedule-print')).toContainText('2026-09-30');
});
