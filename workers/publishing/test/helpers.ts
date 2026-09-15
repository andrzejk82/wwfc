import {PublicationCoordinator} from '../src/coordinator';
import type {Env} from '../src/contracts';

// Local transaction adapter: it serializes and rolls back transactions, but does
// not emulate Cloudflare input/output gates or alarm delivery. Runtime validation
// remains a separate integration check.
export class MemoryStorage {
 data=new Map<string,unknown>(); alarm:number|null=null;private tail:Promise<unknown>=Promise.resolve();
 async get<T=unknown>(key:string):Promise<T|undefined>{return structuredClone(this.data.get(key)) as T|undefined}
 async put(key:string,value:unknown){this.data.set(key,structuredClone(value))}
 async delete(key:string){return this.data.delete(key)}
 async list<T=unknown>({prefix='',limit=Infinity}:{prefix?:string;limit?:number}={}){return new Map([...this.data.entries()].filter(([key])=>key.startsWith(prefix)).sort(([a],[b])=>a.localeCompare(b)).slice(0,limit).map(([key,value])=>[key,structuredClone(value) as T]))}
 async getAlarm(){return this.alarm}
 async setAlarm(time:number){this.alarm=time}
 async deleteAlarm(){this.alarm=null}
 async transaction<T>(callback:(tx:MemoryStorage)=>Promise<T>):Promise<T>{
  const result=this.tail.then(async()=>{const saved=structuredClone(this.data);try{return await callback(this)}catch(error){this.data=saved;throw error}});
  this.tail=result.catch(()=>{});return result;
 }
}
export function testEnv(){return {SANITY_WEBHOOK_SECRET:'sanity-secret-long-enough-for-tests',PUBLICATION_CALLBACK_SECRET:'callback-secret-long-enough-for-tests',SANITY_READ_TOKEN:'test-read-token',GITHUB_APP_PRIVATE_KEY:'',GITHUB_APP_ID:'1',GITHUB_INSTALLATION_ID:'2',GITHUB_REPOSITORY:'example/wwfc',STUDIO_ORIGIN:'https://studio.example.test',ACCESS_TEAM_DOMAIN:'wwfc.cloudflareaccess.com',ACCESS_AUDIENCE:'editor-audience',EDITOR_EMAILS:'editor@example.test',DRAFT_PREVIEW_ENABLED:'true',PRODUCTION_PAGES_PROJECT:'wwfc-production',PREVIEW_PAGES_PROJECT:'wwfc-draft-preview'} as Env}
export function setup(){
 const storage=new MemoryStorage(),env=testEnv();
 const coordinator=new PublicationCoordinator({storage} as never,env);
 env.PUBLICATIONS={idFromName:()=>'',get:()=>({fetch:(request:Request)=>coordinator.fetch(request)})} as never;
 return {storage,env,coordinator};
}
export const event={eventId:'event-1',projectId:'objbb93c',dataset:'production',operation:'update',documentId:'schedule-september',documentType:'scheduleRelease',revision:'rev-1'};
export function internal(path:string,body?:unknown){return new Request(`https://coordinator.internal${path}`,body===undefined?{}:{method:'POST',body:JSON.stringify(body),headers:{'content-type':'application/json'}})}
