// Server-only transport primitive. No mounted route imports this module. The
// future connection/export service must qualify OAuth, account and real-client
// admission before calling it. This primitive never grants send/export authority.
import{createHash}from'node:crypto';import{z}from'zod';
import{KLAVIYO_API_REVISION,KLAVIYO_MAPPING_VERSION,type KlaviyoArtifact}from'../domain/esp-export';
const ORIGIN='https://a.klaviyo.com',MAX_RESPONSE=5*1024*1024-1;
const Id=z.string().regex(/^[A-Za-z0-9_-]{1,128}$/);
export type KlaviyoTemplateResult={state:'verified'|'needs_attention'|'outcome_unknown';code:string;remote_id:string|null;resource_url:string|null;destination_url:null;retry_after?:number};
type Options={artifact:KlaviyoArtifact;name:string;accessToken:string;signal?:AbortSignal;markSubmission:()=>Promise<void>;persistRemoteId:(id:string)=>Promise<void>;fetcher?:typeof fetch};
const result=(state:KlaviyoTemplateResult['state'],code:string,id:string|null=null,retry_after?:number):KlaviyoTemplateResult=>({state,code,remote_id:id,resource_url:id?ORIGIN+'/api/templates/'+encodeURIComponent(id):null,destination_url:null,...(retry_after===undefined?{}:{retry_after})});
async function discard(response:Response){await response.body?.cancel().catch(()=>{});}
async function boundedJson(response:Response,signal:AbortSignal):Promise<unknown>{
 const length=response.headers.get('content-length');if(length!==null&&(!/^\d+$/.test(length)||Number(length)>MAX_RESPONSE)){await discard(response);throw new Error('bounded');}
 if(!response.body)throw new Error('empty');const reader=response.body.getReader();const chunks:Uint8Array[]=[];let size=0;
 let rejectAbort:(reason:Error)=>void=()=>{};const aborted=new Promise<never>((_r,j)=>{rejectAbort=j;});
 const onAbort=()=>{void reader.cancel().catch(()=>{});rejectAbort(new Error('cancelled'));};signal.addEventListener('abort',onAbort,{once:true});
 try{if(signal.aborted)onAbort();while(true){const next=await Promise.race([reader.read(),aborted]);if(next.done)break;size+=next.value.byteLength;if(size>MAX_RESPONSE)throw new Error('bounded');chunks.push(next.value);}return JSON.parse(Buffer.concat(chunks).toString('utf8'));}
 finally{signal.removeEventListener('abort',onAbort);await reader.cancel().catch(()=>{});reader.releaseLock();}
}
function receipt(value:unknown,expectedId?:string){
 const r=z.object({data:z.object({type:z.literal('template'),id:Id,attributes:z.object({name:z.string(),editor_type:z.string(),html:z.string(),text:z.string().nullable()}).optional()}),links:z.object({self:z.string()}).optional()}).parse(value);
 if(expectedId&&r.data.id!==expectedId)throw new Error('binding');
 if(r.links&&r.links.self!==ORIGIN+'/api/templates/'+r.data.id&&r.links.self!==ORIGIN+'/api/templates/'+r.data.id+'/')throw new Error('binding');
 return r.data;
}
function artifactValid(a:KlaviyoArtifact){
 if(a.mapping_version!==KLAVIYO_MAPPING_VERSION||a.api_revision!==KLAVIYO_API_REVISION||a.destination!=='klaviyo'||Buffer.byteLength(a.html)>2*1024*1024||Buffer.byteLength(a.text)>2*1024*1024)throw new Error('EXPORT_ARTIFACT_INVALID');
 const hash=createHash('sha256').update(JSON.stringify([a.mapping_version,a.api_revision,a.source_artifact_hash,a.html,a.text])).digest('hex');
 if(hash!==a.destination_hash)throw new Error('EXPORT_ARTIFACT_INVALID');
}
export async function createAndVerifyKlaviyoTemplate(o:Options):Promise<KlaviyoTemplateResult>{
 artifactValid(o.artifact);const name=z.string().trim().min(1).max(200).refine(s=>!/[\x00-\x1f]/.test(s)).parse(o.name);
 const accessToken=z.string().min(1).max(4096).regex(/^[A-Za-z0-9._~+\/-]+$/).parse(o.accessToken);
 if(o.signal?.aborted)return result('needs_attention','EXPORT_CANCELLED');
 // A caller error here is deliberately propagated: no network has occurred and
 // the caller must not claim the submission marker was durably committed.
 await o.markSubmission();if(o.signal?.aborted)return result('outcome_unknown','EXPORT_INTERRUPTED_AFTER_MARKER');
 const signal=AbortSignal.any([AbortSignal.timeout(30000),...(o.signal?[o.signal]:[])]),fetcher=o.fetcher??fetch;
 const headers={'authorization':'Bearer '+accessToken,'revision':KLAVIYO_API_REVISION,'accept':'application/vnd.api+json','content-type':'application/vnd.api+json'};
 let response:Response;
 try{response=await fetcher(ORIGIN+'/api/templates',{method:'POST',headers,redirect:'error',signal,body:JSON.stringify({data:{type:'template',attributes:{name,editor_type:'CODE',html:o.artifact.html,text:o.artifact.text}}})});}
 catch{return result('outcome_unknown','EXPORT_OUTCOME_UNKNOWN');}
 if(response.redirected||response.url&&new URL(response.url).origin!==ORIGIN){await discard(response);return result('outcome_unknown','EXPORT_RESPONSE_UNTRUSTED');}
 if(response.status!==201){await discard(response);if(response.status>=500||response.status===408||response.status<400)return result('outcome_unknown','EXPORT_OUTCOME_UNKNOWN');
  const raw=response.headers.get('retry-after'),retry_after=raw&&/^\d{1,5}$/.test(raw)?Math.min(86400,Number(raw)):undefined;
  return result('needs_attention',response.status===401?'EXPORT_GRANT_EXPIRED':response.status===403?'EXPORT_PERMISSION_DENIED':response.status===429?'EXPORT_RATE_LIMITED':'EXPORT_PROVIDER_REJECTED',null,response.status===429?retry_after:undefined);
 }
 let id:string;try{id=receipt(await boundedJson(response,signal)).id;}catch{return result('outcome_unknown','EXPORT_RESPONSE_UNTRUSTED');}
 try{await o.persistRemoteId(id);}catch{return result('needs_attention','EXPORT_RECEIPT_PERSISTENCE_FAILED',id);}
 // All further work is read-only and a known ID survives every error. The caller
 // may retry verification of that ID; it must never repeat the create request.
 try{
  const read=await fetcher(ORIGIN+'/api/templates/'+encodeURIComponent(id),{method:'GET',headers,redirect:'error',signal});
  if(read.status!==200||read.redirected||read.url&&new URL(read.url).origin!==ORIGIN){await discard(read);return result('needs_attention','EXPORT_READBACK_UNAVAILABLE',id);}
  const object=receipt(await boundedJson(read,signal),id),attributes=object.attributes;
  if(!attributes||attributes.name!==name||attributes.editor_type!=='CODE'||attributes.html!==o.artifact.html||attributes.text!==o.artifact.text)return result('needs_attention','EXPORT_READBACK_MISMATCH',id);
  return result('verified','EXPORT_TEMPLATE_VERIFIED',id);
 }catch{return result('needs_attention','EXPORT_READBACK_UNAVAILABLE',id);}
}
