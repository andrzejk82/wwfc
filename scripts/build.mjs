import {spawnSync} from 'node:child_process';
import {writeFile} from 'node:fs/promises';
import {writeBuildManifest} from './write-build-manifest.mjs';

// A single snapshot and manifest are fixed before either checking or building.
const privateBuild=process.env.DEPLOY_ENV==='draft-preview';
try{
 const {path}=await writeBuildManifest();
 const env={...process.env,CONTENT_SNAPSHOT_PATH:path};
 for(const command of ['check','build']){
  const result=spawnSync(process.execPath,['node_modules/astro/bin/astro.mjs',command],{env,stdio:privateBuild?'pipe':'inherit',encoding:'utf8',maxBuffer:10*1024*1024});
  if(privateBuild)await writeFile(`.cache/draft-${command}.log`,(result.stdout??'')+(result.stderr??''));
  if(result.status!==0){console.error('Sprawdzenie lub build nie powiodły się.');process.exitCode=result.status??1;break;}
 }
}catch(error){
 if(!privateBuild)throw error;
 console.error('Build chronionych szkiców odrzucony. Szczegóły nie są publikowane w logu CI.');process.exitCode=1;
}
