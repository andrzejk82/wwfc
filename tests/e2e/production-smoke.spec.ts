import {test,expect} from '@playwright/test';
import {readFile,readdir} from 'node:fs/promises';
import {join,relative,sep} from 'node:path';
import {gzipSync} from 'node:zlib';

async function htmlRoutes(directory='dist'):Promise<string[]>{
 const result:string[]=[];
 for(const entry of await readdir(directory,{withFileTypes:true})){
  const path=join(directory,entry.name);
  if(entry.isDirectory())result.push(...await htmlRoutes(path));
  else if(entry.name.endsWith('.html'))result.push('/'+relative('dist',path).split(sep).join('/').replace(/index\.html$/,''));
 }
 return result;
}
// Credentials are attached only to explicit same-origin API calls, never to a
// browser context whose image requests could transmit them to another origin.
function accessHeaders():Record<string,string>{
 if(process.env.DEPLOYMENT_URL&&process.env.CONTENT_PERSPECTIVE==='drafts'){
  if(!process.env.CF_ACCESS_CLIENT_ID||!process.env.CF_ACCESS_CLIENT_SECRET)throw new Error('Brak poświadczeń chronionego preview.');
  return {'CF-Access-Client-Id':process.env.CF_ACCESS_CLIENT_ID,'CF-Access-Client-Secret':process.env.CF_ACCESS_CLIENT_SECRET};
 }
 return {};
}
test('artifact identity and all generated HTML routes',async({request})=>{
 const expected=JSON.parse(await readFile('.cache/build-manifest.json','utf8'));
 const response=await request.get('/version.json',{headers:accessHeaders(),maxRedirects:0});
 expect(response.status()).toBe(200);expect(await response.json()).toEqual(expected);
 for(const path of await htmlRoutes()){
  const response=await request.get(path==='/404.html'?'/wwfc-smoke-nonexistent-route':path,{headers:accessHeaders(),maxRedirects:0});
  expect([200,404].includes(response.status())).toBe(true);
  if(path!=='/404.html')expect(response.status()).toBe(200);
  const html=await response.text();
  expect(html.includes('lang="pl"')).toBe(true);expect(html.includes('<main')).toBe(true);
  expect(/<title>[^<]+<\/title>/.test(html)).toBe(true);
  const production=process.env.DEPLOY_ENV==='production';
  const robots=path==='/404.html'?'noindex,follow':production?'index,follow':'noindex,nofollow';
  expect(html.includes(`content="${robots}"`)).toBe(true);
 }
});
test('local artifact navigation and script budget',async({page})=>{
 test.skip(Boolean(process.env.DEPLOYMENT_URL),'Remote smoke uses origin-bound requests to protect Access credentials.');
 for(const path of ['/','/grafik/','/cennik/','/kontakt/']){
  const scripts:Buffer[]=[];const pending:Promise<void>[]=[];
  const listener=(response:import('@playwright/test').Response)=>{if(response.request().resourceType()==='script')pending.push(response.body().then(bytes=>{scripts.push(bytes)}));};
  page.on('response',listener);await page.goto(path);await page.waitForLoadState('networkidle');await Promise.all(pending);page.off('response',listener);
  await expect(page.locator('main')).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  const inline=await page.locator('script:not([src]):not([type="application/json"]):not([type="application/ld+json"])').allTextContents();
  expect([...scripts,...inline.map(value=>Buffer.from(value))].reduce((sum,value)=>sum+gzipSync(value).length,0)).toBeLessThanOrEqual(75000);
 }
});
test('draft deployment denies anonymous document access',async({request})=>{
 test.skip(!process.env.DEPLOYMENT_URL||process.env.CONTENT_PERSPECTIVE!=='drafts');
 for(const path of ['/','/grafik/','/version.json']){
  const response=await request.get(path,{maxRedirects:0});
  expect([302,303,401,403].includes(response.status())).toBe(true);
 }
});
