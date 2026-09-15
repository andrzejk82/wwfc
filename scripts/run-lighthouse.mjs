import {spawnSync} from 'node:child_process';
import {writeFile} from 'node:fs/promises';
const privateBuild=process.env.DEPLOY_ENV==='draft-preview';
const result=spawnSync(process.execPath,['node_modules/@lhci/cli/src/cli.js','autorun'],{env:process.env,stdio:privateBuild?'pipe':'inherit',encoding:'utf8',maxBuffer:10*1024*1024});
if(privateBuild){await writeFile('.cache/draft-lighthouse.log',(result.stdout??'')+(result.stderr??''));console.log(result.status===0?'Pomiar Lighthouse szkiców zaliczony.':'Pomiar Lighthouse szkiców niezaliczony; raport pozostaje prywatny.');}
process.exitCode=result.status??1;
