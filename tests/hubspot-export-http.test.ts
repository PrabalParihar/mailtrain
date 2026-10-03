import test from 'node:test';
import assert from 'node:assert/strict';
import {readJson} from '../src/server/http';

const max=16*1024,strict={strict:true,timeoutMs:30000};
function request(body:BodyInit|null='{}',headers:HeadersInit={'Content-Type':'application/json'},signal?:AbortSignal){
 return new Request('https://example.test/v1/email-revisions/11111111-1111-4111-8111-111111111111/hubspot-review',{method:'POST',headers,body,signal,...(body instanceof ReadableStream?{duplex:'half' as const}:{})});
}
const rejects=(req:Request,status:number,code:string,options=strict)=>assert.rejects(readJson(req,max,options),{status,code});
test('strict JSON admits exact 16KiB streamed bytes and rejects actual oversize without declared length',async()=>{
 const value={padding:'x'.repeat(max-14)},bytes=new TextEncoder().encode(JSON.stringify(value));
 assert.equal(bytes.byteLength,max);
 const stream=new ReadableStream<Uint8Array>({start(c){c.enqueue(bytes.slice(0,8000));c.enqueue(bytes.slice(8000));c.close();}});
 assert.deepEqual(await readJson(request(stream),max,strict),value);
 let cancelled=false;
 const oversized=new ReadableStream<Uint8Array>({start(c){c.enqueue(new Uint8Array(max+1));},cancel(){cancelled=true;}});
 await rejects(request(oversized),413,'PAYLOAD_TOO_LARGE');assert.equal(cancelled,true);assert.equal(oversized.locked,false);
});
test('strict JSON rejects unsupported content type, charset and every Content-Encoding',async()=>{
 for(const type of ['', 'text/plain','application/json; charset=latin1','application/json; profile=example','application/json; charset=utf-8; charset=utf-8'])await rejects(request('{}',{'Content-Type':type}),415,'JSON_CONTENT_TYPE_UNSUPPORTED');
 for(const encoding of ['gzip','identity',''])await rejects(request('{}',{'Content-Type':'application/json','Content-Encoding':encoding}),415,'JSON_ENCODING_UNSUPPORTED');
 for(const type of ['application/json','Application/JSON; charset=UTF-8','application/json; charset="utf-8"'])assert.deepEqual(await readJson(request('{}',{'Content-Type':type}),max,strict),{});
});
test('strict JSON validates declared and actual byte lengths before parsing',async()=>{
 for(const length of ['-1','1.5','NaN','Infinity','1e2','9007199254740992',''])await rejects(request('{}',{'Content-Type':'application/json','Content-Length':length}),400,'JSON_LENGTH_INVALID');
 await rejects(request('{}',{'Content-Type':'application/json','Content-Length':String(max+1)}),413,'PAYLOAD_TOO_LARGE');
 for(const length of ['0','1','3'])await rejects(request('{}',{'Content-Type':'application/json','Content-Length':length}),400,'JSON_LENGTH_MISMATCH');
 assert.deepEqual(await readJson(request('{}',{'Content-Type':'application/json','Content-Length':'2'}),max,strict),{});
});
test('strict JSON requires an object body and fatal UTF8 without exposing bytes',async()=>{
 await rejects(request(null),400,'JSON_BODY_REQUIRED');await rejects(request(''),400,'JSON_BODY_REQUIRED');
 for(const body of ['[]','null','true','"private-marker"','{private-marker'])await rejects(request(body),400,'MALFORMED_JSON');
 await rejects(request(new Uint8Array([123,34,120,34,58,34,0xff,34,125])),400,'MALFORMED_JSON');
});
test('strict JSON cancels a pre-aborted body, releases its lock and hides the signal reason',async()=>{
 const abort=new AbortController();abort.abort('private-marker');let cancelled=false;
 const stream=new ReadableStream<Uint8Array>({start(c){c.enqueue(new TextEncoder().encode('{}'));setTimeout(()=>{if(!cancelled)c.close();},80);},cancel(){cancelled=true;}});
 await rejects(request(stream,{'Content-Type':'application/json'},abort.signal),499,'EXPORT_CANCELLED');
 assert.equal(cancelled,true);assert.equal(stream.locked,false);
});
test('strict JSON aborts an outstanding read even when stream cancellation never settles',async()=>{
 const abort=new AbortController();let cancelled=false;
 const stream=new ReadableStream<Uint8Array>({start(c){setTimeout(()=>{if(!cancelled)c.close();},80);},cancel(){cancelled=true;return new Promise<void>(()=>{});}});
 const pending=rejects(request(stream,{'Content-Type':'application/json'},abort.signal),499,'EXPORT_CANCELLED');
 setTimeout(()=>abort.abort('private-marker'),5);await pending;assert.equal(cancelled,true);assert.equal(stream.locked,false);
});
test('strict JSON deadline cancels a stalled read without waiting for cancellation and cleans listeners',async()=>{
 let cancelled=false;
 const stream=new ReadableStream<Uint8Array>({start(c){setTimeout(()=>{if(!cancelled)c.close();},80);},cancel(){cancelled=true;return new Promise<void>(()=>{});}});
 const req=request(stream),signal=req.signal;let attached=0,removed=0;
 const add=signal.addEventListener.bind(signal),remove=signal.removeEventListener.bind(signal);
 signal.addEventListener=((...args:Parameters<typeof add>)=>{attached++;return add(...args);}) as typeof add;
 signal.removeEventListener=((...args:Parameters<typeof remove>)=>{removed++;return remove(...args);}) as typeof remove;
 await rejects(req,408,'JSON_TRANSFER_TIMEOUT',{strict:true,timeoutMs:10});
 assert.equal(cancelled,true);assert.equal(stream.locked,false);assert.equal(attached,1);assert.equal(removed,1);
});
test('strict JSON sanitizes stream failures and validates injectable finite positive deadlines',async()=>{
 const stream=new ReadableStream<Uint8Array>({start(c){c.error(new Error('private-marker'));}});
 await rejects(request(stream),400,'MALFORMED_JSON');assert.equal(stream.locked,false);
 for(const timeoutMs of [0,-1,Infinity,NaN])await assert.rejects(readJson(request(),max,{strict:true,timeoutMs}),/positive finite/);
});
