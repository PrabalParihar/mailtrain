import {MAX_RAW_SOURCE_BYTES,MAX_SOURCE_COMMAND_JSON_BYTES,decodeRawSource,rawSourceBytes,validateSourceMetadata,SourceValueError}from'../domain/email-source-values';
import{fail}from'./errors';
let reading=0;
export function sourceValueFailure(error:unknown):never{
 if(error instanceof SourceValueError)fail(error.code==='RAW_SOURCE_TOO_LARGE'||error.code==='SOURCE_METADATA_TOO_LARGE'?413:422,error.code,error.message);
 throw error;
}
async function readBytes(request:Request,max:number,type:'text'|'json'):Promise<Uint8Array>{
 if(request.headers.has('content-encoding'))fail(415,'SOURCE_ENCODING_UNSUPPORTED','Compressed source requests are not supported.');
 const contentType=request.headers.get('content-type')??'';
 const accepted=type==='text'?/^text\/plain(?:\s*;\s*charset\s*=\s*(?:utf-8|"utf-8"))?\s*$/i:/^application\/json(?:\s*;\s*charset\s*=\s*(?:utf-8|"utf-8"))?\s*$/i;
 if(!accepted.test(contentType))fail(415,'SOURCE_CONTENT_TYPE_UNSUPPORTED','Use '+(type==='text'?'text/plain':'application/json')+' with UTF-8.');
 const declared=request.headers.get('content-length');
 if(declared!==null&&(!/^\d+$/.test(declared)||!Number.isSafeInteger(Number(declared))))fail(400,'SOURCE_LENGTH_INVALID','Use a valid byte length.');
 if(declared!==null&&Number(declared)>max)fail(413,'PAYLOAD_TOO_LARGE','Source request exceeds its transport bound.');
 if(reading>=2)fail(429,'SOURCE_ADMISSION_BUSY','Two source bodies are already being read. Retry after completion.');
 const reader=request.body?.getReader();if(!reader)fail(400,'SOURCE_BODY_REQUIRED','Provide a source request body.');
 reading++;let total=0;const chunks:Uint8Array[]=[];
 let timedOut=false,aborted=request.signal.aborted;
 const cancel=()=>{aborted=true;void reader.cancel().catch(()=>{});};
 const timer=setTimeout(()=>{timedOut=true;void reader.cancel().catch(()=>{});},30000);timer.unref();request.signal.addEventListener('abort',cancel,{once:true});
 try{
  for(;;){if(aborted)fail(400,'SOURCE_TRANSFER_ABORTED','Source transfer was interrupted.');const part=await reader.read();if(timedOut)fail(408,'SOURCE_TRANSFER_TIMEOUT','Source transfer exceeded 30 seconds.');if(aborted)fail(400,'SOURCE_TRANSFER_ABORTED','Source transfer was interrupted.');if(part.done)break;total+=part.value.byteLength;if(total>max)fail(413,'PAYLOAD_TOO_LARGE','Source request exceeds its actual byte bound.');chunks.push(part.value);}
  if(declared!==null&&Number(declared)!==total)fail(400,'SOURCE_LENGTH_MISMATCH','Declared and actual source body sizes differ.');
  return Buffer.concat(chunks,total);
 }catch(error){void reader.cancel().catch(()=>{});throw error;}finally{clearTimeout(timer);request.signal.removeEventListener('abort',cancel);reader.releaseLock();reading--;}
}
export async function readEmailSourceText(request:Request):Promise<string>{
 const bytes=await readBytes(request,MAX_RAW_SOURCE_BYTES,'text');try{return decodeRawSource(bytes);}catch(error){return sourceValueFailure(error);}
}
export async function readEmailSourceJson(request:Request):Promise<Record<string,unknown>>{
 const bytes=await readBytes(request,MAX_SOURCE_COMMAND_JSON_BYTES,'json');let body:unknown;
 try{body=JSON.parse(new TextDecoder('utf-8',{fatal:true,ignoreBOM:true}).decode(bytes));}catch(error){if(error instanceof TypeError)fail(422,'RAW_SOURCE_ENCODING_INVALID','Use valid UTF-8.');fail(400,'MALFORMED_JSON','Use a JSON object.');}
 if(!body||typeof body!=='object'||Array.isArray(body))fail(400,'MALFORMED_JSON','Use a JSON object.');
 const value=body as Record<string,unknown>;
 try{
  if(value.spec!==undefined)validateSourceMetadata(value.spec);
  if(value.html!==undefined)rawSourceBytes(value.html as string);
  if(value.source!==undefined)rawSourceBytes(value.source as string);
 }catch(error){sourceValueFailure(error);}
 return value;
}
