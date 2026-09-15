const {chromium}=require('@playwright/test');
const {readFileSync}=require('node:fs');
const content=JSON.parse(readFileSync(process.env.CONTENT_SNAPSHOT_PATH||'.cache/content-source.json','utf8'));
const discipline=content.disciplines[0]?.slug,coach=content.coaches[0]?.slug;
module.exports={ci:{
 collect:{startServerCommand:'npm run preview:pages',startServerReadyPattern:'Ready on',startServerReadyTimeout:60000,chromePath:chromium.executablePath(),numberOfRuns:3,
  url:['/','/grafik/',discipline?`/dyscypliny/${discipline}/`:'/dyscypliny/',coach?`/trenerzy/${coach}/`:'/trenerzy/','/cennik/','/kontakt/'].map(p=>'http://127.0.0.1:8788'+p),
  settings:{chromeFlags:'--headless',skipAudits:process.env.DEPLOY_ENV==='production'?[]:['is-crawlable']}
 },
 assert:{assertions:{
  'categories:performance':['error',{minScore:.9}],
  'categories:accessibility':['error',{minScore:.9}],
  'categories:best-practices':['error',{minScore:.9}],
  'categories:seo':['error',{minScore:.9}],
  'largest-contentful-paint':['error',{maxNumericValue:2500}],
  'cumulative-layout-shift':['error',{maxNumericValue:.1}],
  'total-byte-weight':['error',{maxNumericValue:1500000}]
 }},
 upload:{target:'filesystem',outputDir:'.lighthouseci/reports'}
}};
