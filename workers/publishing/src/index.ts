import {decodeSignatureHeader,isValidSignature,SIGNATURE_HEADER_NAME} from '@sanity/webhook';
import {z} from 'zod';
import {Completion,DocumentId,Preflight,RequestId,Webhook,HttpError,boundedText,json,parseJson,type Env} from './contracts';
import {constantTimeSecret,verifyEditor} from './auth';
import {preflight} from './preflight';
export {PublicationCoordinator} from './coordinator';

const editorPaths=new Set(['/preflight','/preview','/retry','/status']);
const knownPaths=new Set(['/cms','/complete',...editorPaths]);
function validStudioOrigin(origin:string|undefined){try{const url=new URL(origin??'');return url.protocol==='https:'&&url.origin===origin}catch{return false}}

export async function handleRequest(request:Request,env:Env):Promise<Response>{
 const url=new URL(request.url),origin=request.headers.get('origin');
 const editor=editorPaths.has(url.pathname);
 const cors=editor&&validStudioOrigin(env.STUDIO_ORIGIN)&&origin===env.STUDIO_ORIGIN;
 let response:Response;
 try{
  if(!knownPaths.has(url.pathname))throw new HttpError(404,'not_found');
  if(editor&&(!validStudioOrigin(env.STUDIO_ORIGIN)||origin!==env.STUDIO_ORIGIN))throw new HttpError(403,'origin_denied');
  if(request.method==='OPTIONS'){
   if(!editor||!cors)throw new HttpError(403,'origin_denied');
   response=new Response(null,{status:204,headers:{'Access-Control-Allow-Methods':'GET, POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type','Access-Control-Max-Age':'600'}});
  }else{
   if(request.method!==(url.pathname==='/status'?'GET':'POST'))throw new HttpError(405,'method_not_allowed');
   if(editor){const token=request.headers.get('cf-access-jwt-assertion');if(!token)throw new HttpError(401,'unauthorized');await verifyEditor(token,env)}
   if(url.pathname==='/complete'){
    const value=request.headers.get('authorization')??'';
    if(!value.startsWith('Bearer ')||!await constantTimeSecret(value.slice(7),env.PUBLICATION_CALLBACK_SECRET))throw new HttpError(401,'unauthorized');
   }
   let payload:unknown={};
   if(request.method==='POST'){
    if(!/^application\/json(?:;|$)/i.test(request.headers.get('content-type')??''))throw new HttpError(415,'json_required');
    const raw=await boundedText(request,16_384);
    if(url.pathname==='/cms'){
     const signature=request.headers.get(SIGNATURE_HEADER_NAME);
     let valid=false;
     if(signature&&env.SANITY_WEBHOOK_SECRET)try{
      const {timestamp}=decodeSignatureHeader(signature);
      valid=Number.isSafeInteger(timestamp)&&timestamp<=Date.now()+60_000&&timestamp>=Date.now()-24*60*60*1000&&await isValidSignature(raw,signature,env.SANITY_WEBHOOK_SECRET);
     }catch{/* Never expose signature parsing errors. */}
     if(!valid)throw new HttpError(401,'invalid_signature');
    }
    payload=parseJson(raw);
   }
   if(url.pathname==='/cms')payload=Webhook.parse(payload);
   if(url.pathname==='/complete')payload=Completion.parse(payload);
   if(url.pathname==='/preview'){
    z.object({}).strict().parse(payload);
    if(env.DRAFT_PREVIEW_ENABLED!=='true')throw new HttpError(403,'preview_disabled');
   }
   if(url.pathname==='/retry')payload=z.object({requestId:RequestId}).strict().parse(payload);
   if(url.pathname==='/status'){
    const id=url.searchParams.get('requestId');
    if(id)RequestId.parse(id);else{DocumentId.parse(url.searchParams.get('documentId'));z.iso.datetime().parse(url.searchParams.get('since'))}
   }
   if(url.pathname==='/preflight'){
    const input=Preflight.parse(payload);response=json(await preflight(env,input.documentId,input.revision));
   }else{
    const coordinator=env.PUBLICATIONS.get(env.PUBLICATIONS.idFromName('publication-coordinator-v1'));
    response=await coordinator.fetch(new Request(`https://coordinator.internal${url.pathname}${url.search}`,{method:request.method,...(request.method==='POST'?{body:JSON.stringify(payload),headers:{'content-type':'application/json'}}:{})}));
   }
  }
 }catch(error){response=json({error:error instanceof HttpError?error.code:error instanceof z.ZodError?'invalid_request':'service_unavailable'},error instanceof HttpError?error.status:error instanceof z.ZodError?400:503)}
 if(cors){response=new Response(response.body,response);response.headers.set('Access-Control-Allow-Origin',env.STUDIO_ORIGIN);response.headers.set('Access-Control-Allow-Credentials','true');response.headers.set('Vary','Origin')}
 return response;
}
export default {fetch:handleRequest};
