import {appendFile,readFile} from 'node:fs/promises';
import {validateCallbackResult} from './callback-result.mjs';
const phase=process.argv[2];
if(!['running','succeeded','failed'].includes(phase))throw new Error('Nieprawidłowa faza publikacji.');
const requestId=process.env.PUBLICATION_REQUEST_ID;
if(!requestId){
 if(phase==='running'&&process.env.GITHUB_OUTPUT)await appendFile(process.env.GITHUB_OUTPUT,'accepted=true\n');
}else{
 if(!/^[a-f0-9-]{36}$/.test(requestId))throw new Error('Nieprawidłowy identyfikator żądania.');
 const base=new URL(process.env.PUBLICATION_RECEIVER_URL);
 if(base.protocol!=='https:'||base.username||base.password||!process.env.PUBLICATION_CALLBACK_SECRET)throw new Error('Brak konfiguracji callback.');
 const body={requestId,phase,target:process.env.PUBLICATION_TARGET,dataset:process.env.SANITY_DATASET,commit:process.env.GITHUB_SHA};
 if(phase==='succeeded'){
  const manifest=JSON.parse(await readFile('.cache/build-manifest.json','utf8'));
  const deployment=JSON.parse(await readFile('.cache/deployment.json','utf8'));
  Object.assign(body,{snapshotHash:manifest.snapshotHash,deploymentUrl:deployment.url});
 }
 const response=await fetch(new URL('/complete',base),{method:'POST',redirect:'error',signal:AbortSignal.timeout(20000),headers:{Authorization:`Bearer ${process.env.PUBLICATION_CALLBACK_SECRET}`,'Content-Type':'application/json'},body:JSON.stringify(body)});
 if(!response.ok)throw new Error(`Callback publikacji odrzucony (${response.status}).`);
 const result=await response.json();
 validateCallbackResult(result,phase);
 if(phase==='running'){
  if(typeof result.accepted!=='boolean')throw new Error('Nieprawidłowa odpowiedź przejęcia żądania.');
  if(process.env.GITHUB_OUTPUT)await appendFile(process.env.GITHUB_OUTPUT,`accepted=${result.accepted}\n`);
 }
}
