import {describe,it,expect} from 'vitest';
import {handleRequest} from '../src/index';
import {encodeSignatureHeader,SIGNATURE_HEADER_NAME} from '@sanity/webhook';
import {event,setup,testEnv} from './helpers';

describe('publication authentication boundary',()=>{
 it('rejects a forged Sanity signature before contacting the coordinator',async()=>{
  let dispatches=0;
  const env={SANITY_WEBHOOK_SECRET:'a-very-long-test-secret',PUBLICATIONS:{idFromName:()=>'',get:()=>{dispatches++;throw Error('must not dispatch');}}};
  const response=await handleRequest(new Request('https://receiver.test/cms',{method:'POST',headers:{'content-type':'application/json','sanity-webhook-signature':'forged'},body:'{}'}),env as never);
  expect(response.status).toBe(401);expect(dispatches).toBe(0);
 });
 it('rejects signed wrong dataset, draft documents and extra dispatch-routing fields',async()=>{
  const {env,storage}=setup();
  for(const payload of [{...event,dataset:'other'},{...event,documentId:'drafts.schedule'},{...event,projectId:'other'},{...event,repository:'attacker/repo'},{...event,operation:'draft'}]){
   const body=JSON.stringify(payload);const signature=await encodeSignatureHeader(body,Date.now(),env.SANITY_WEBHOOK_SECRET);
   const response=await handleRequest(new Request('https://receiver.test/cms',{method:'POST',headers:{'content-type':'application/json',[SIGNATURE_HEADER_NAME]:signature},body}),env);
   expect(response.status).toBe(400);expect(storage.data.size).toBe(0);
  }
 });
 it('authenticates raw bytes and rejects signatures beyond the replay window',async()=>{
  const {env,storage}=setup();const body=JSON.stringify(event);
  const valid=await encodeSignatureHeader(body,Date.now(),env.SANITY_WEBHOOK_SECRET);
  const call=(body:string,signature:string)=>handleRequest(new Request('https://receiver.test/cms',{method:'POST',headers:{'content-type':'application/json',[SIGNATURE_HEADER_NAME]:signature},body}),env);
  expect((await call(`${body} `,valid)).status).toBe(401);
  expect((await call(body,await encodeSignatureHeader(body,Date.now()-25*60*60*1000,env.SANITY_WEBHOOK_SECRET))).status).toBe(401);
  expect(storage.data.size).toBe(0);expect((await call(body,valid)).status).toBe(202);
 });
 it('rejects unsigned editor requests even with a forged email header',async()=>{
  const env=testEnv();
  for(const path of ['/preview','/preflight','/retry','/status']){
   const response=await handleRequest(new Request(`https://receiver.test${path}`,{method:path==='/status'?'GET':'POST',headers:{origin:env.STUDIO_ORIGIN,'cf-access-authenticated-user-email':'editor@example.test','content-type':'application/json'},...(path==='/status'?{}:{body:'{}'})}),env);
   expect(response.status).toBe(401);
  }
 });
 it('denies foreign origins and grants credentialed preflight only to configured Studio',async()=>{
  const env=testEnv();const evil=await handleRequest(new Request('https://receiver.test/preview',{method:'OPTIONS',headers:{origin:'https://evil.test'}}),env);expect(evil.status).toBe(403);expect(evil.headers.has('access-control-allow-origin')).toBe(false);
  const allowed=await handleRequest(new Request('https://receiver.test/preview',{method:'OPTIONS',headers:{origin:env.STUDIO_ORIGIN}}),env);expect(allowed.status).toBe(204);expect(allowed.headers.get('access-control-allow-origin')).toBe(env.STUDIO_ORIGIN);expect(allowed.headers.get('access-control-allow-credentials')).toBe('true');
 });
 it('requires the distinct callback secret before looking up a request',async()=>{
  const {env,storage}=setup();const body=JSON.stringify({requestId:crypto.randomUUID(),target:'production',dataset:'production',phase:'running'});
  for(const authorization of ['',`Bearer ${env.SANITY_WEBHOOK_SECRET}`])expect((await handleRequest(new Request('https://receiver.test/complete',{method:'POST',body,headers:{'content-type':'application/json',authorization}}),env)).status).toBe(401);
  expect(storage.data.size).toBe(0);
  expect((await handleRequest(new Request('https://receiver.test/complete',{method:'POST',body,headers:{'content-type':'application/json',authorization:`Bearer ${env.PUBLICATION_CALLBACK_SECRET}`}}),env)).status).toBe(404);
 });
 it('limits body bytes before signature parsing',async()=>{
  const {env,storage}=setup();const response=await handleRequest(new Request('https://receiver.test/cms',{method:'POST',headers:{'content-type':'application/json'},body:'x'.repeat(16385)}),env);expect(response.status).toBe(413);expect(storage.data.size).toBe(0);
 });
});
