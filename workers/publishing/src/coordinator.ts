import {Completion,DATASET,DocumentId,HttpError,RequestId,Webhook,json,parseJson,publicStatus,type Env,type StoredPublication,type CompletionInput} from './contracts';
import {dispatchPublication} from './github';

const RETENTION=7*24*60*60*1000;
const LEASE=90_000;
const MAX_QUEUE_AGE=48*60*60*1000;
const MAX_RUNNING_AGE=30*60*1000;
const PREFIX='request:';
const key=(id:string)=>`${PREFIX}${id}`;

export class PublicationCoordinator {
 constructor(private state:DurableObjectState,private env:Env){}

 async fetch(request:Request):Promise<Response>{
  try{
   const url=new URL(request.url);
   if(url.pathname==='/status'){
    const id=url.searchParams.get('requestId');
    if(id){const record=await this.state.storage.get<StoredPublication>(key(RequestId.parse(id)));if(!record||record.expiresAt<=Date.now())throw new HttpError(404,'request_not_found');return json(publicStatus(record))}
    const documentId=DocumentId.parse(url.searchParams.get('documentId'));
    const since=url.searchParams.get('since');
    if(!since||!/^\d{4}-\d{2}-\d{2}T/.test(since)||!Number.isFinite(Date.parse(since)))throw new HttpError(400,'invalid_since');
    const records=await this.state.storage.list<StoredPublication>({prefix:PREFIX});
    const record=[...records.values()].filter(r=>r.documentId===documentId&&r.expiresAt>Date.now()&&Date.parse(r.createdAt)>=Date.parse(since)).sort((a,b)=>b.createdAt.localeCompare(a.createdAt))[0];
    return json({status:record?publicStatus(record):null});
   }
   const body=parseJson(await request.text());
   if(url.pathname==='/complete')return json(await this.complete(Completion.parse(body)));
   if(url.pathname==='/cms'){
    const event=Webhook.parse(body);
    const eventKey=`event:${await this.digest(event.eventId)}`;
    const record=await this.create('production',{eventKey,documentId:event.documentId,documentRevision:event.revision});
    return json(publicStatus(record),202);
   }
   if(url.pathname==='/preview'){
    if(this.env.DRAFT_PREVIEW_ENABLED!=='true')throw new HttpError(403,'preview_disabled');
    return json(publicStatus(await this.create('draft-preview')),202);
   }
   if(url.pathname==='/retry'){
    const id=RequestId.parse((body as {requestId?:unknown})?.requestId);
    return json(publicStatus(await this.retry(id)),202);
   }
   throw new HttpError(404,'not_found');
  }catch(error){return json({error:error instanceof HttpError?error.code:'invalid_request'},error instanceof HttpError?error.status:400)}
 }

 private async digest(value:string){const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));return Array.from(new Uint8Array(bytes),v=>v.toString(16).padStart(2,'0')).join('')}

 private fresh(target:StoredPublication['target'],extra:Partial<StoredPublication>={}):StoredPublication{
  const now=Date.now();return {requestId:crypto.randomUUID(),dataset:DATASET,target,phase:'pending',createdAt:new Date(now).toISOString(),updatedAt:new Date(now).toISOString(),dispatch:'waiting',attempts:0,nextAttempt:now,expiresAt:now+RETENTION,...extra};
 }

 private async create(target:StoredPublication['target'],extra:Partial<StoredPublication>={}):Promise<StoredPublication>{
  // The alarm is persisted before the record. A crash can create a harmless empty
  // alarm, never a committed request with no recovery wakeup.
  await this.arm(Date.now()+1000);
  return this.state.storage.transaction(async tx=>{
   if(extra.eventKey){
    const existingId=await tx.get<string>(extra.eventKey);
    const existing=existingId?await tx.get<StoredPublication>(key(existingId)):undefined;
    if(existing&&existing.expiresAt>Date.now())return existing;
   }
   if((await tx.list({prefix:PREFIX,limit:2001})).size>=2000)throw new HttpError(503,'publication_capacity');
   const record=this.fresh(target,extra);
   await tx.put(key(record.requestId),record);
   if(record.eventKey)await tx.put(record.eventKey,record.requestId);
   return record;
  });
 }

 private async retry(id:string){
  await this.arm(Date.now()+1000);
  return this.state.storage.transaction(async tx=>{
   const previous=await tx.get<StoredPublication>(key(id));
   if(!previous||previous.expiresAt<=Date.now())throw new HttpError(404,'request_not_found');
   if(previous.retryId){const retry=await tx.get<StoredPublication>(key(previous.retryId));if(retry)return retry}
   if(previous.phase!=='failed')throw new HttpError(409,'request_not_failed');
   if(previous.target==='draft-preview'&&this.env.DRAFT_PREVIEW_ENABLED!=='true')throw new HttpError(403,'preview_disabled');
   if((await tx.list({prefix:PREFIX,limit:2001})).size>=2000)throw new HttpError(503,'publication_capacity');
   const record=this.fresh(previous.target,{documentId:previous.documentId,documentRevision:previous.documentRevision});
   previous.retryId=record.requestId;
   await tx.put(key(previous.requestId),previous);await tx.put(key(record.requestId),record);return record;
  });
 }

 private validateDeployment(input:CompletionInput){
  if(!input.deploymentUrl)return;
  const url=new URL(input.deploymentUrl);
  const project=input.target==='production'?this.env.PRODUCTION_PAGES_PROJECT:this.env.PREVIEW_PAGES_PROJECT;
  if(!project||!/^[a-z0-9-]+$/.test(project)||url.protocol!=='https:'||url.username||url.password||url.port||url.search||url.hash||url.pathname!=='/'||!new RegExp(`^[a-f0-9]{8,64}\\.${project}\\.pages\\.dev$`).test(url.hostname))throw new HttpError(400,'invalid_deployment_url');
 }

 private async complete(input:CompletionInput){
  this.validateDeployment(input);
  return this.state.storage.transaction(async tx=>{
   const record=await tx.get<StoredPublication>(key(input.requestId));
   if(!record||record.expiresAt<=Date.now())throw new HttpError(404,'request_not_found');
   if(record.target!==input.target||record.dataset!==input.dataset)throw new HttpError(409,'target_mismatch');
   if(record.phase==='succeeded'||record.phase==='failed')return {accepted:false,status:publicStatus(record)};
   if(input.phase==='running'&&record.phase==='running')return {accepted:false,status:publicStatus(record)};
   if(input.phase==='succeeded'&&record.phase!=='running')throw new HttpError(409,'request_not_running');
   if(record.commit&&input.commit&&record.commit!==input.commit)throw new HttpError(409,'commit_mismatch');
   Object.assign(record,{phase:input.phase,updatedAt:new Date().toISOString(),dispatch:'sent'},input.commit?{commit:input.commit}:{},input.snapshotHash?{snapshotHash:input.snapshotHash}:{},input.deploymentUrl?{deploymentUrl:input.deploymentUrl}:{},input.phase==='failed'?{error:'workflow_failed'}:{});
   await tx.put(key(record.requestId),record);
   return {accepted:true,status:publicStatus(record)};
  });
 }

 private async arm(time:number){
  const alarm=await this.state.storage.getAlarm();
  if(alarm===null||alarm>time)await this.state.storage.setAlarm(time);
 }

 async alarm(){
  // Rearm first: even an exception or process termination cannot strand the queue.
  await this.state.storage.setAlarm(Date.now()+LEASE);
  const records=await this.state.storage.list<StoredPublication>({prefix:PREFIX});
  let processed=0;
  for(const [recordKey,snapshot] of records){
   const now=Date.now();
   if(snapshot.expiresAt<=now){
    await this.state.storage.transaction(async tx=>{await tx.delete(recordKey);if(snapshot.eventKey){const owner=await tx.get(snapshot.eventKey);if(owner===snapshot.requestId)await tx.delete(snapshot.eventKey)}});continue;
   }
   if((snapshot.phase==='pending'&&Date.parse(snapshot.createdAt)+MAX_QUEUE_AGE<=now)||(snapshot.phase==='running'&&Date.parse(snapshot.updatedAt)+MAX_RUNNING_AGE<=now)){
    await this.state.storage.transaction(async tx=>{const latest=await tx.get<StoredPublication>(recordKey);if(latest&&(latest.phase==='pending'||latest.phase==='running')){latest.phase='failed';latest.error='workflow_timeout';latest.updatedAt=new Date().toISOString();await tx.put(recordKey,latest)}});continue;
   }
   if(processed>=10||snapshot.phase!=='pending'||snapshot.dispatch==='sent'||snapshot.nextAttempt>now)continue;
   const leased=await this.state.storage.transaction(async tx=>{
    const record=await tx.get<StoredPublication>(recordKey);
    if(!record||record.phase!=='pending'||record.dispatch==='sent'||record.nextAttempt>Date.now())return null;
    const reconcile=record.dispatch==='sending';
    record.dispatch='sending';record.attempts++;record.nextAttempt=Date.now()+LEASE;
    await tx.put(recordKey,record);return {record,reconcile};
   });
   if(!leased)continue;processed++;
   const result=await dispatchPublication(this.env,leased.record,leased.reconcile);
   await this.state.storage.transaction(async tx=>{
    const record=await tx.get<StoredPublication>(recordKey);
    if(!record||record.phase!=='pending')return;
    if(result==='sent')record.dispatch='sent';
    if(result==='failed'){record.phase='failed';record.error='dispatch_failed';record.updatedAt=new Date().toISOString()}
    await tx.put(recordKey,record);
   });
  }
  // Pending work is serviced at most 90 seconds later. Terminal records still
  // need the alarm for seven-day retention cleanup.
  // Keep the maintenance alarm alive even when this snapshot was empty: a new
  // request can be committed while this handler awaits network/storage work.
 }
}
