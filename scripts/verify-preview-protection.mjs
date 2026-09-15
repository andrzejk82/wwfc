import {deploymentPolicy,isProjectDeploymentUrl} from '../src/lib/build/deployment-policy.ts';
const {target,project}=deploymentPolicy(process.env);
if(target==='draft-preview'){
 const urls=JSON.parse(process.env.PREVIEW_PROTECTION_URLS||'[]');
 if(!Array.isArray(urls)||urls.length<3||urls.some(url=>typeof url!=='string'))throw new Error('Podaj adres główny, alias main i istniejący adres kontrolnego wdrożenia.');
 const origins=urls.map(value=>new URL(value));
 if(origins.some(url=>url.protocol!=='https:'||url.username||url.password||url.pathname!=='/'))throw new Error('Nieprawidłowy adres ochrony.');
 if(!origins.some(url=>url.hostname===`${project}.pages.dev`)||!origins.some(url=>url.hostname===`main.${project}.pages.dev`)||!origins.some(url=>isProjectDeploymentUrl(url.href,project)&&/^[a-f0-9]{8}\./.test(url.hostname)))throw new Error('Nie sprawdzono wszystkich typów adresów Pages.');
 for(const url of origins)for(const path of ['/','/version.json']){
  const response=await fetch(new URL(path,url),{redirect:'manual',signal:AbortSignal.timeout(20000)});
  if([401,403].includes(response.status))continue;
  const location=response.headers.get('location');
  if(![302,303].includes(response.status)||!location||!new URL(location,url).hostname.endsWith('.cloudflareaccess.com'))throw new Error('Anonimowy dostęp nie jest poprawnie chroniony. Nie wolno wysyłać szkiców.');
 }
 console.log('Kontrolne adresy preview odrzucają anonimowy dostęp.');
}
