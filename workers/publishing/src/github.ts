import {SignJWT,importPKCS8} from 'jose';
import {type Env,type StoredPublication,HttpError,boundedText,parseJson} from './contracts';

function configuration(env:Env){
 if(!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(env.GITHUB_REPOSITORY??'')||!/^\d+$/.test(env.GITHUB_APP_ID??'')||!/^\d+$/.test(env.GITHUB_INSTALLATION_ID??'')||!env.GITHUB_APP_PRIVATE_KEY)throw new HttpError(503,'github_not_configured');
 return env.GITHUB_REPOSITORY;
}
async function github(path:string,token:string,body?:unknown){
 return fetch(`https://api.github.com${path}`,{method:body===undefined?'GET':'POST',redirect:'error',signal:AbortSignal.timeout(15000),headers:{Authorization:`Bearer ${token}`,Accept:'application/vnd.github+json','Content-Type':'application/json','X-GitHub-Api-Version':'2022-11-28','User-Agent':'wwfc-publishing'},...(body===undefined?{}:{body:JSON.stringify(body)})});
}
async function installationToken(env:Env){
 const repository=configuration(env);
 const key=await importPKCS8(env.GITHUB_APP_PRIVATE_KEY.replaceAll('\\n','\n'),'RS256');
 const now=Math.floor(Date.now()/1000);
 const jwt=await new SignJWT({}).setProtectedHeader({alg:'RS256'}).setIssuer(env.GITHUB_APP_ID).setIssuedAt(now-60).setExpirationTime(now+540).sign(key);
 const response=await github(`/app/installations/${env.GITHUB_INSTALLATION_ID}/access_tokens`,jwt,{repositories:[repository.split('/')[1]],permissions:{actions:'write'}});
 if(!response.ok)throw new HttpError(502,'github_auth_failed');
 const result=parseJson(await boundedText(response,65536)) as {token?:unknown};
 if(typeof result.token!=='string'||!result.token)throw new HttpError(502,'github_auth_failed');return result.token;
}
export async function dispatchPublication(env:Env,record:StoredPublication,reconcile:boolean):Promise<'sent'|'uncertain'|'failed'>{
 try{
  const repository=configuration(env),token=await installationToken(env);
  if(reconcile){
   // Never resend an ambiguous dispatch until checking the fixed workflow's runs.
   const response=await github(`/repos/${repository}/actions/workflows/publish.yml/runs?event=workflow_dispatch&branch=main&per_page=100&created=${encodeURIComponent(`>=${record.createdAt}`)}`,token);
   if(!response.ok)return 'uncertain';
   const result=parseJson(await boundedText(response,2_000_000)) as {workflow_runs?:{display_title?:string}[];total_count?:number};
   if(!Array.isArray(result.workflow_runs))return 'uncertain';
   if(result.workflow_runs.some(run=>run.display_title===`WWFC:${record.target}:${record.requestId}`))return 'sent';
   // More pages would make absence inconclusive. Do not blindly re-dispatch.
   if((result.total_count??Infinity)>100)return 'uncertain';
  }
  const response=await github(`/repos/${repository}/actions/workflows/publish.yml/dispatches`,token,{ref:'main',inputs:{target:record.target,request_id:record.requestId}});
  if(response.status===204)return 'sent';
  return response.status>=500?'uncertain':'failed';
 }catch{return 'uncertain'}
}
