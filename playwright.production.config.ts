import {defineConfig} from '@playwright/test';
const remote=process.env.DEPLOYMENT_URL;
if(remote){
 const url=new URL(remote);
 const project=process.env.PAGES_PROJECT_NAME;
 if(url.protocol!=='https:'||!project||!(url.hostname===`${project}.pages.dev`||url.hostname.endsWith(`.${project}.pages.dev`)))throw new Error('Nieznany adres wdrożenia.');
}
export default defineConfig({
 testDir:'./tests/e2e',testMatch:'production-smoke.spec.ts',workers:1,reporter:'list',
 use:{baseURL:remote||'http://127.0.0.1:8788',browserName:'chromium',trace:'off',screenshot:'off',video:'off'},
 projects:[{name:'artifact',use:{viewport:{width:390,height:800}}}],
 ...(remote?{}:{webServer:{command:'npm run preview:pages',url:'http://127.0.0.1:8788',reuseExistingServer:false}})
});
