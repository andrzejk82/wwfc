import {evaluate,parse} from 'groq-js';
import {fetchSanityContent,SANITY_CONTENT_QUERY} from '../../../src/lib/content/sanity';
import {PROJECT,DATASET,DOCUMENT_TYPES,type Env,HttpError,boundedText,parseJson} from './contracts';

export const RAW_QUERY=`*[_type in $types && (!(_id in path("drafts.**")) && !(_id in path("versions.**")) || _id == $draftId)][0...2001]`;
type RawDoc={_id:string;_type:string;_rev?:string;[key:string]:unknown};
export async function validateCandidate(documents:unknown,documentId:string,revision:string){
 if(!Array.isArray(documents)||documents.length>2000||documents.some(doc=>!doc||typeof doc!=='object'||typeof doc._id!=='string'||typeof doc._type!=='string'))throw new HttpError(422,'invalid_content');
 const docs=documents as RawDoc[],draftId=`drafts.${documentId}`;
 const draft=docs.find(doc=>doc._id===draftId);
 if(!draft)throw new HttpError(404,'draft_not_found');
 if(draft._rev!==revision)throw new HttpError(409,'revision_changed');
 if(!DOCUMENT_TYPES.includes(draft._type as typeof DOCUMENT_TYPES[number]))throw new HttpError(400,'unsupported_document');
 const dataset=docs.filter(doc=>!doc._id.startsWith('drafts.')&&!doc._id.startsWith('versions.')&&doc._id!==documentId);
 dataset.push({...draft,_id:documentId});
 try{await fetchSanityContent(async()=>await(await evaluate(parse(SANITY_CONTENT_QUERY),{dataset})).get())}
 catch{throw new HttpError(422,'invalid_content')}
 return {valid:true,documentId,revision,validatedAt:new Date().toISOString()};
}
export async function preflight(env:Env,documentId:string,revision:string){
 if(!env.SANITY_READ_TOKEN)throw new HttpError(503,'sanity_not_configured');
 let response:Response;
 try{response=await fetch(`https://${PROJECT}.api.sanity.io/v2026-09-01/data/query/${DATASET}?perspective=raw`,{method:'POST',redirect:'error',signal:AbortSignal.timeout(15000),headers:{Authorization:`Bearer ${env.SANITY_READ_TOKEN}`,'Content-Type':'application/json'},body:JSON.stringify({query:RAW_QUERY,params:{types:[...DOCUMENT_TYPES,'sanity.imageAsset','sanity.fileAsset'],draftId:`drafts.${documentId}`}})})}catch{throw new HttpError(502,'sanity_unavailable')}
 if(!response.ok)throw new HttpError(502,'sanity_unavailable');
 const result=parseJson(await boundedText(response,4_000_000)) as {result?:unknown};
 return validateCandidate(result.result,documentId,revision);
}
