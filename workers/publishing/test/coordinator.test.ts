import {afterEach,describe,expect,it,vi} from 'vitest';
import {generateKeyPair,exportPKCS8} from 'jose';
import {event,internal,setup} from './helpers';

afterEach(()=>{vi.restoreAllMocks();vi.unstubAllGlobals();vi.useRealTimers()});
async function githubSetup(){
 const state=setup();const {privateKey}=await generateKeyPair('RS256',{extractable:true});state.env.GITHUB_APP_PRIVATE_KEY=await exportPKCS8(privateKey);
 let dispatches=0;
 const fetch=vi.fn(async(url:string)=>{
  if(url.includes('/access_tokens'))return Response.json({token:'installation-test-token'});
  if(url.includes('/dispatches')){dispatches++;return new Response(null,{status:204})}
  throw Error('Unexpected outbound request');
 });vi.stubGlobal('fetch',fetch);return {...state,dispatches:()=>dispatches,fetch};
}
describe('durable request lifecycle',()=>{
 it('keeps queued work for 48 hours but expires a stalled running claim after 30 minutes',async()=>{
  const {coordinator,storage}=setup();const publication:any=await(await coordinator.fetch(internal('/cms',event))).json();
  const record:any=await storage.get(`request:${publication.requestId}`);
  record.createdAt=new Date(Date.now()-3*60*60*1000).toISOString();record.dispatch='sent';await storage.put(`request:${publication.requestId}`,record);
  await coordinator.alarm();expect((await storage.get<any>(`request:${publication.requestId}`)).phase).toBe('pending');
  record.phase='running';record.updatedAt=new Date(Date.now()-31*60*1000).toISOString();await storage.put(`request:${publication.requestId}`,record);
  await coordinator.alarm();expect((await storage.get<any>(`request:${publication.requestId}`)).error).toBe('workflow_timeout');
 });
 it('atomically deduplicates simultaneous signed events and dispatches exactly once in a normal delivery',async()=>{
  const state=await githubSetup();
  const results=await Promise.all(Array.from({length:12},()=>state.coordinator.fetch(internal('/cms',event)).then(response=>response.json())));
  expect(new Set(results.map((result:any)=>result.requestId)).size).toBe(1);
  expect(state.storage.alarm).not.toBeNull();
  await state.coordinator.alarm();await state.coordinator.alarm();
  expect(state.dispatches()).toBe(1);
  const dispatch=state.fetch.mock.calls.find(([url])=>url.includes('/dispatches'));
  expect(dispatch?.[0]).toBe('https://api.github.com/repos/example/wwfc/actions/workflows/publish.yml/dispatches');
 });
 it('only one workflow can claim a request and terminal callbacks cannot regress it',async()=>{
  const {coordinator}=setup();const publication:any=await(await coordinator.fetch(internal('/cms',event))).json();
  const base={requestId:publication.requestId,target:'production',dataset:'production',commit:'a'.repeat(40)};
  const claims=await Promise.all(Array.from({length:4},()=>coordinator.fetch(internal('/complete',{...base,phase:'running'})).then(r=>r.json())));
  expect(claims.filter((result:any)=>result.accepted)).toHaveLength(1);
  const complete:any=await(await coordinator.fetch(internal('/complete',{...base,phase:'succeeded',snapshotHash:'b'.repeat(64),deploymentUrl:'https://abcdef12.wwfc-production.pages.dev/'}))).json();
  expect(complete.status.phase).toBe('succeeded');
  const repeated:any=await(await coordinator.fetch(internal('/complete',{...base,phase:'failed'}))).json();
  expect(repeated.accepted).toBe(false);expect(repeated.status.phase).toBe('succeeded');
 });
 it('rejects unknown requests, wrong target, unsafe URL and success without running claim',async()=>{
  const {coordinator}=setup();const publication:any=await(await coordinator.fetch(internal('/cms',event))).json();
  const base={requestId:publication.requestId,target:'production',dataset:'production',phase:'running'};
  expect((await coordinator.fetch(internal('/complete',{...base,requestId:crypto.randomUUID()}))).status).toBe(404);
  expect((await coordinator.fetch(internal('/complete',{...base,target:'draft-preview'}))).status).toBe(409);
  expect((await coordinator.fetch(internal('/complete',{...base,phase:'succeeded',commit:'a'.repeat(40),snapshotHash:'b'.repeat(64),deploymentUrl:'https://evil.test/'}))).status).toBe(400);
  expect((await coordinator.fetch(internal('/complete',{...base,phase:'succeeded',commit:'a'.repeat(40),snapshotHash:'b'.repeat(64),deploymentUrl:'https://abcdef12.wwfc-production.pages.dev/'}))).status).toBe(409);
 });
 it('accepts validation failure before claim and retries with one new ID even on repeated clicks',async()=>{
  const {coordinator}=setup();const original:any=await(await coordinator.fetch(internal('/cms',event))).json();
  expect((await coordinator.fetch(internal('/retry',{requestId:original.requestId}))).status).toBe(409);
  const failed:any=await(await coordinator.fetch(internal('/complete',{requestId:original.requestId,dataset:'production',target:'production',phase:'failed'}))).json();
  expect(failed.accepted).toBe(true);
  const retries=await Promise.all([1,2,3].map(()=>coordinator.fetch(internal('/retry',{requestId:original.requestId})).then(r=>r.json()))) as any[];
  expect(retries[0].requestId).not.toBe(original.requestId);expect(new Set(retries.map(result=>result.requestId)).size).toBe(1);expect(retries[0].phase).toBe('pending');
 });
 it('returns latest document status only after the requested timestamp',async()=>{
  const {coordinator}=setup();const publication:any=await(await coordinator.fetch(internal('/cms',event))).json();
  const before:any=await(await coordinator.fetch(internal(`/status?documentId=${event.documentId}&since=2000-01-01T00:00:00.000Z`))).json();expect(before.status.requestId).toBe(publication.requestId);
  const after:any=await(await coordinator.fetch(internal(`/status?documentId=${event.documentId}&since=2099-01-01T00:00:00.000Z`))).json();expect(after.status).toBeNull();
 });
 it('persists a definite dispatch refusal as failed without automatic retry',async()=>{
  const state=await githubSetup();state.fetch.mockImplementation(async(url)=>url.includes('/access_tokens')?Response.json({token:'test-token'}):new Response(null,{status:403}));
  const publication:any=await(await state.coordinator.fetch(internal('/cms',event))).json();await state.coordinator.alarm();
  const status:any=await(await state.coordinator.fetch(internal(`/status?requestId=${publication.requestId}`))).json();expect(status.phase).toBe('failed');expect(status.error).toBe('dispatch_failed');
 });
 it('reconciles an interrupted dispatch by workflow run name before considering resend',async()=>{
  const state=await githubSetup();const publication:any=await(await state.coordinator.fetch(internal('/cms',event))).json();
  const stored:any=await state.storage.get(`request:${publication.requestId}`);stored.dispatch='sending';stored.nextAttempt=0;await state.storage.put(`request:${publication.requestId}`,stored);
  state.fetch.mockImplementation(async(url)=>url.includes('/access_tokens')?Response.json({token:'test-token'}):Response.json({total_count:1,workflow_runs:[{display_title:`WWFC:production:${publication.requestId}`}]}));
  await state.coordinator.alarm();expect(state.fetch.mock.calls.some(([url])=>url.includes('/runs?'))).toBe(true);expect(state.fetch.mock.calls.some(([url])=>url.includes('/dispatches'))).toBe(false);
  expect((await state.storage.get<any>(`request:${publication.requestId}`))?.dispatch).toBe('sent');
 });
 it('keeps ambiguous dispatch pending if run history cannot establish absence',async()=>{
  const state=await githubSetup();const publication:any=await(await state.coordinator.fetch(internal('/cms',event))).json();
  const stored:any=await state.storage.get(`request:${publication.requestId}`);stored.dispatch='sending';stored.nextAttempt=0;await state.storage.put(`request:${publication.requestId}`,stored);
  state.fetch.mockImplementation(async(url)=>url.includes('/access_tokens')?Response.json({token:'test-token'}):Response.json({total_count:101,workflow_runs:[]}));await state.coordinator.alarm();
  expect(state.fetch.mock.calls.some(([url])=>url.includes('/dispatches'))).toBe(false);expect((await state.storage.get<any>(`request:${publication.requestId}`))?.phase).toBe('pending');
 });
 it('expires orphaned workflows and deletes request and event keys after seven days',async()=>{
  const {coordinator,storage}=setup();const publication:any=await(await coordinator.fetch(internal('/cms',event))).json();
  const record:any=await storage.get(`request:${publication.requestId}`);record.createdAt=new Date(Date.now()-49*60*60*1000).toISOString();await storage.put(`request:${publication.requestId}`,record);
  await coordinator.alarm();expect((await storage.get<any>(`request:${publication.requestId}`)).error).toBe('workflow_timeout');
  record.expiresAt=Date.now()-1;await storage.put(`request:${publication.requestId}`,record);await coordinator.alarm();expect(storage.data.size).toBe(0);
 });
});
