import {test,expect} from '@playwright/test';
import {gzipSync} from 'node:zlib';
test('loaded scripts and initial page transfer stay within budgets',async({page},testInfo)=>{
 test.skip(testInfo.project.name!=='chromium-1440','Resource bytes do not require six duplicate runs');
 const report=[];
 for(const path of ['/','/grafik/','/dyscypliny/boks/','/trenerzy/norbert-dabrowski/','/cennik/','/kontakt/']){
  const scripts=new Map<string,Buffer>();const pending:Promise<void>[]=[];
  const capture=(response:import('@playwright/test').Response)=>{if(response.request().resourceType()==='script')pending.push(response.body().then(body=>{scripts.set(response.url(),body);}));};
  page.on('response',capture);await page.goto(path);await page.waitForLoadState('networkidle');await page.evaluate(()=>document.fonts.ready);await Promise.all(pending);page.off('response',capture);
  const inline=await page.locator('script:not([src]):not([type="application/json"])').allTextContents();
  const jsBytes=[...scripts.values(),...inline.map(s=>Buffer.from(s))].reduce((sum,b)=>sum+gzipSync(b).length,0);
  const transfer=await page.evaluate(()=>performance.getEntriesByType('resource').reduce((sum,r)=>sum+(r as PerformanceResourceTiming).transferSize,0)+(performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming).transferSize);
  report.push({path,jsGzipBytes:jsBytes,initialTransferBytes:transfer});expect(jsBytes,path+' JS gzip').toBeLessThanOrEqual(75000);if(path==='/')expect(transfer,'home transfer').toBeLessThanOrEqual(1500000);
 }
 await testInfo.attach('asset-budgets.json',{body:JSON.stringify(report,null,2),contentType:'application/json'});
});
