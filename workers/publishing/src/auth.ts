import {createRemoteJWKSet,jwtVerify,type JWTVerifyGetKey} from 'jose';
import {type Env,HttpError} from './contracts';

const keySets=new Map<string,JWTVerifyGetKey>();
export async function verifyEditor(token:string,env:Env,key?:JWTVerifyGetKey){
 if(!/^[a-z0-9-]+\.cloudflareaccess\.com$/.test(env.ACCESS_TEAM_DOMAIN??'')||!env.ACCESS_AUDIENCE||!env.EDITOR_EMAILS)throw new HttpError(503,'access_not_configured');
 const issuer=`https://${env.ACCESS_TEAM_DOMAIN}`;
 let jwks=key??keySets.get(issuer);
 if(!jwks){jwks=createRemoteJWKSet(new URL(`${issuer}/cdn-cgi/access/certs`),{timeoutDuration:5000});keySets.set(issuer,jwks)}
 try{
  const {payload}=await jwtVerify(token,jwks,{issuer,audience:env.ACCESS_AUDIENCE,algorithms:['RS256'],requiredClaims:['exp','iat','sub','email'],maxTokenAge:'24h'});
  const allowlist=env.EDITOR_EMAILS.split(',').map(email=>email.trim().toLowerCase()).filter(Boolean);
  if(typeof payload.email!=='string'||!allowlist.includes(payload.email.toLowerCase())||payload.type!=='app')throw Error('forbidden');
  return payload.email.toLowerCase();
 }catch{throw new HttpError(401,'unauthorized')}
}
export async function constantTimeSecret(candidate:string,secret:string|undefined){
 if(!secret||secret.length<32||candidate.length>1024)return false;
 // Let Web Crypto compare equal-length HMAC signatures in native code instead
 // of relying on JavaScript string comparison or JIT loop timing.
 const encoder=new TextEncoder();
 const key=await crypto.subtle.importKey('raw',encoder.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign','verify']);
 const expected=await crypto.subtle.sign('HMAC',key,encoder.encode(secret));
 return crypto.subtle.verify('HMAC',key,expected,encoder.encode(candidate));
}
