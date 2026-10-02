import{z}from'zod';import{withPrincipal,checkOrigin}from'./auth';import{getEmail}from'./emails';import{fail}from'./errors';
import{readEmailSourceText,readEmailSourceJson}from'./email-source-body';
import{saveSourceDraft,importEmailSource,forkEmailToRaw,downloadRevisionSource}from'./email-source';
export function sourceExpectedVersion(request:Request){
 const header=request.headers.get('if-match'),match=header?.match(/^(?:"draft-(\d+)"|"(\d+)"|(?:draft-)?(\d+))$/);const value=match?Number(match[1]??match[2]??match[3]):0;
 if(!Number.isSafeInteger(value)||value<1)fail(428,'VERSION_REQUIRED','Supply If-Match for the original saved draft version.');return value;
}
function commandKey(request:Request){const key=request.headers.get('idempotency-key');if(!key||key.length>200)fail(400,'IDEMPOTENCY_KEY_REQUIRED','Supply the original command key.');return key;}
// Called before generic JSON parsing. Both precheck and final callback use fresh
// current authority, and the request stream is read between their transactions.
export async function emailSourceRoute(request:Request,id:string,command:'draft'|'source-import'|'import-html'|'source-fork'){
 checkOrigin(request);z.uuid().parse(id);
 if(request.method!==(command==='draft'?'PATCH':'POST'))fail(405,'METHOD_NOT_ALLOWED','Use the source command method.');
 if(new URL(request.url).searchParams.size)fail(422,'VALIDATION_FAILED','Source commands accept no query parameters.');
 const expected=sourceExpectedVersion(request),key=commandKey(request);
 await withPrincipal(request,'edit',async(tx)=>{await getEmail(tx,id);});
 const value=command==='source-import'?await readEmailSourceText(request):await readEmailSourceJson(request);
 return withPrincipal(request,'edit',async(tx,p)=>{
  if(command==='source-import')return importEmailSource(tx,p,id,expected,value as string,key);
  if(command==='import-html'){const input=z.object({html:z.string()}).strict().parse(value);return importEmailSource(tx,p,id,expected,input.html,key);}
  if(command==='source-fork'){const input=z.object({expected_artifact_hash:z.string().regex(/^[a-f0-9]{64}$/)}).strict().parse(value);return forkEmailToRaw(tx,p,id,expected,input.expected_artifact_hash,key);}
  const input=z.object({spec:z.unknown()}).strict().parse(value);return saveSourceDraft(tx,p,id,expected,input.spec,key);
 });
}
export async function revisionSourceResponse(request:Request,id:string):Promise<Response>{
 checkOrigin(request);if(request.method!=='GET')fail(405,'METHOD_NOT_ALLOWED','Source download uses GET.');
 const source=await withPrincipal(request,'edit',(tx,p)=>downloadRevisionSource(tx,p,id));
 return new Response(source.bytes as BodyInit,{headers:{'content-type':'text/plain; charset=utf-8','content-disposition':`attachment; filename="email-v${source.revision_no}.source.html.txt"`,'x-content-type-options':'nosniff','cache-control':'no-store','content-security-policy':"default-src 'none'; sandbox",'x-source-sha256':source.sha256,'x-source-profile':source.profile,'content-length':String(source.bytes.length)}});
}
