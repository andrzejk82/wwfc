import {deploymentPolicy} from '../src/lib/build/deployment-policy.ts';
export async function pagesApi(path='',method='GET'){
 const {project,account}=deploymentPolicy(process.env);
 if(!process.env.CLOUDFLARE_API_TOKEN)throw new Error('Brak tokena Pages.');
 const response=await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/pages/projects/${project}${path}`,{method,redirect:'error',signal:AbortSignal.timeout(30000),headers:{Authorization:`Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,'Content-Type':'application/json'}});
 if(!response.ok)throw new Error(`Operacja Pages odrzucona (${response.status}).`);
 const result=await response.json();if(!result.success)throw new Error('Cloudflare odrzuciło operację Pages.');
 return result.result;
}
