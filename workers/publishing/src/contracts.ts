import {z} from 'zod';

export const PROJECT = 'objbb93c';
export const DATASET = 'production';
export const DOCUMENT_TYPES = ['siteSettings','coach','discipline','scheduleRelease','pricingPage','priceGroup','faqItem'] as const;
export const DocumentId = z.string().min(1).max(128).regex(/^[a-zA-Z0-9_-][a-zA-Z0-9_.-]*$/).refine(id => !id.startsWith('drafts.') && !id.startsWith('versions.'));
export const RequestId = z.uuid();
export const Target = z.enum(['production','draft-preview']);
export const Webhook = z.object({eventId:z.string().min(1).max(256),projectId:z.literal(PROJECT),dataset:z.literal(DATASET),operation:z.enum(['create','update','delete']),documentId:DocumentId,documentType:z.enum(DOCUMENT_TYPES),revision:z.string().min(1).max(128).optional()}).strict();
export const Preflight = z.object({documentId:DocumentId,revision:z.string().min(1).max(128)}).strict();
export const Completion = z.object({requestId:RequestId,target:Target,dataset:z.literal(DATASET),phase:z.enum(['running','succeeded','failed']),commit:z.string().regex(/^[a-f0-9]{40}$/).optional(),snapshotHash:z.string().regex(/^[a-f0-9]{64}$/).optional(),deploymentUrl:z.url().max(512).optional()}).strict().refine(value=>value.phase!=='succeeded'||Boolean(value.commit&&value.snapshotHash&&value.deploymentUrl));
export type CompletionInput = z.infer<typeof Completion>;
export interface PublicationStatus {
 requestId:string; dataset:typeof DATASET; target:z.infer<typeof Target>; phase:'pending'|'running'|'succeeded'|'failed';
 createdAt:string; updatedAt:string; documentId?:string; documentRevision?:string; commit?:string; snapshotHash?:string; deploymentUrl?:string; error?:string;
}
export interface StoredPublication extends PublicationStatus {eventKey?:string; dispatch:'waiting'|'sending'|'sent'; attempts:number; nextAttempt:number; expiresAt:number; retryId?:string}
export interface Env {
 PUBLICATIONS:DurableObjectNamespace;
 SANITY_WEBHOOK_SECRET:string; SANITY_READ_TOKEN:string; PUBLICATION_CALLBACK_SECRET:string;
 GITHUB_APP_PRIVATE_KEY:string; GITHUB_APP_ID:string; GITHUB_INSTALLATION_ID:string; GITHUB_REPOSITORY:string;
 STUDIO_ORIGIN:string; ACCESS_TEAM_DOMAIN:string; ACCESS_AUDIENCE:string; EDITOR_EMAILS:string;
 DRAFT_PREVIEW_ENABLED?:string; PRODUCTION_PAGES_PROJECT:string; PREVIEW_PAGES_PROJECT:string;
}
export class HttpError extends Error {constructor(public status:number,public code:string){super(code)}}
export function publicStatus(record:StoredPublication):PublicationStatus {
 const {eventKey,dispatch,attempts,nextAttempt,expiresAt,retryId,...status}=record; return status;
}
export function json(value:unknown,status=200){return Response.json(value,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}})}
export async function boundedText(input:Request|Response,limit:number):Promise<string>{
 const length=input.headers.get('content-length');
 if(length && (!/^\d+$/.test(length)||Number(length)>limit))throw new HttpError(413,'payload_too_large');
 const reader=input.body?.getReader();if(!reader)return '';
 const chunks:Uint8Array[]=[];let size=0;
 const deadline=Date.now()+15000;
 try{while(true){
  let timer:ReturnType<typeof setTimeout>|undefined;
  const result=await Promise.race([reader.read(),new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(new HttpError(408,'body_timeout')),Math.max(1,deadline-Date.now()))})]).finally(()=>clearTimeout(timer));
  if(result.done)break;
  size+=result.value.byteLength;if(size>limit)throw new HttpError(413,'payload_too_large');chunks.push(result.value);
 }}catch(error){await reader.cancel().catch(()=>{});throw error}
 const all=new Uint8Array(size);let offset=0;for(const chunk of chunks){all.set(chunk,offset);offset+=chunk.length}return new TextDecoder('utf-8',{fatal:true}).decode(all);
}
export function parseJson(text:string):unknown{try{return JSON.parse(text)}catch{throw new HttpError(400,'invalid_json')}}
