import {describe,expect,it} from 'vitest';
import {createLocalJWKSet,exportJWK,generateKeyPair,SignJWT} from 'jose';
import {constantTimeSecret,verifyEditor} from '../src/auth';
import {testEnv} from './helpers';

describe('Access JWT validation',()=>{
 it('accepts only a signed, current, intended application token belonging to an editor',async()=>{
  const env=testEnv();const {privateKey,publicKey}=await generateKeyPair('RS256',{extractable:true});const publicJwk=await exportJWK(publicKey);const keys=createLocalJWKSet({keys:[{...publicJwk,kid:'key1'}]});
  const now=Math.floor(Date.now()/1000);
  const issue=(overrides:Record<string,unknown>={})=>new SignJWT({iss:`https://${env.ACCESS_TEAM_DOMAIN}`,aud:env.ACCESS_AUDIENCE,sub:'editor-id',email:'editor@example.test',type:'app',iat:now,exp:now+300,...overrides}).setProtectedHeader({alg:'RS256',kid:'key1'}).sign(privateKey);
  expect(await verifyEditor(await issue(),env,keys)).toBe('editor@example.test');
  for(const override of [{aud:'wrong'},{iss:'https://evil.test'},{exp:now-1},{email:'outsider@example.test'},{type:'service'},{exp:undefined},{sub:undefined}])await expect(verifyEditor(await issue(override),env,keys)).rejects.toMatchObject({status:401});
  const foreign=await generateKeyPair('RS256');const forged=await new SignJWT({iss:`https://${env.ACCESS_TEAM_DOMAIN}`,aud:env.ACCESS_AUDIENCE,sub:'id',email:'editor@example.test',type:'app',iat:now,exp:now+300}).setProtectedHeader({alg:'RS256',kid:'key1'}).sign(foreign.privateKey);
  await expect(verifyEditor(forged,env,keys)).rejects.toMatchObject({status:401});
 });
 it('compares callback secrets and refuses missing or short configuration',async()=>{
  const secret='a'.repeat(40);expect(await constantTimeSecret(secret,secret)).toBe(true);expect(await constantTimeSecret('b'.repeat(40),secret)).toBe(false);expect(await constantTimeSecret(secret,undefined)).toBe(false);expect(await constantTimeSecret('short','short')).toBe(false);
 });
});
