import test from 'node:test';import assert from 'node:assert/strict';import {randomUUID}from'node:crypto';
import {blankSpec,compileEmail}from'../src/domain/email';import{compileKlaviyoArtifact}from'../src/domain/esp-export';
import{createAndVerifyKlaviyoTemplate}from'../src/server/klaviyo-template-adapter';
async function artifact(){const spec=blankSpec(randomUUID(),'Fixture');spec.subject='Fixture subject';spec.sections=spec.sections.map(b=>b.type==='legal_footer'?{...b,address:'123 Fixture Road'}:b.type==='button'?{...b,href:'https://example.org/offer'}:b);const a=await compileEmail(spec);return compileKlaviyoArtifact({id:randomUUID(),spec,manifest:a.manifest,html:a.html,plaintext:a.text,artifact_hash:a.hash});}
function response(a:Awaited<ReturnType<typeof artifact>>,status=200,html=a.html){return new Response(JSON.stringify({data:{id:'FIXTURE1',type:'template',attributes:{name:'Fixture',editor_type:'CODE',html,text:a.text}},links:{self:'https://a.klaviyo.com/api/templates/FIXTURE1'}}),{status,headers:{'content-type':'application/vnd.api+json'}});}
test('commit submission before POST and persist opaque ID before exact readback; no campaigns or retry',async()=>{const a=await artifact(),order:string[]=[],requests:{url:string;init:RequestInit}[]=[];const result=await createAndVerifyKlaviyoTemplate({artifact:a,name:'Fixture',accessToken:'fixture-token',markSubmission:async()=>{order.push('marker');},persistRemoteId:async id=>{assert.equal(id,'FIXTURE1');order.push('id');},fetcher:async(url,init)=>{requests.push({url:String(url),init:init!});order.push(String(init?.method));return response(a,init?.method==='POST'?201:200);}});assert.equal(result.state,'verified');assert.deepEqual(order,['marker','POST','id','GET']);assert.equal(requests.length,2);assert.equal(requests[0].init.redirect,'error');assert.equal(new Headers(requests[0].init.headers).get('revision'),'2026-07-15');assert.equal(new Headers(requests[0].init.headers).get('authorization'),'Bearer fixture-token');assert.equal(JSON.parse(requests[0].init.body as string).data.attributes.editor_type,'CODE');assert.match(result.resource_url!,/^https:\/\/a.klaviyo.com\/api\/templates\/FIXTURE1$/);});
test('lost acknowledgment and invalid201 cannot authorize blind retry or expose raw token/errors',async()=>{const a=await artifact();for(const kind of ['transport','malformed','server']as const){let n=0;const r=await createAndVerifyKlaviyoTemplate({artifact:a,name:'Fixture',accessToken:'fixture-token',markSubmission:async()=>{},persistRemoteId:async()=>assert.fail('untrusted ID'),fetcher:async()=>{n++;if(kind==='transport')throw new Error('secret fixture-token remote body');return kind==='malformed'?new Response('{"data":{"id":"../evil"}}',{status:201}):new Response('secret fixture-token',{status:503});}});assert.equal(r.state,'outcome_unknown');assert.equal(n,1);assert.equal(JSON.stringify(r).includes('fixture-token'),false);}});
test('failed durable marker performs no IO; known ID survives failed persistence/readback or edited content',async()=>{const a=await artifact();let calls=0;await assert.rejects(()=>createAndVerifyKlaviyoTemplate({artifact:a,name:'Fixture',accessToken:'fixture-token',markSubmission:async()=>{throw new Error('db');},persistRemoteId:async()=>{},fetcher:async()=>{calls++;return response(a,201);}}),/db/);assert.equal(calls,0);for(const kind of ['persist','transport','changed']as const){calls=0;const r=await createAndVerifyKlaviyoTemplate({artifact:a,name:'Fixture',accessToken:'fixture-token',markSubmission:async()=>{},persistRemoteId:async()=>{if(kind==='persist')throw new Error('db');},fetcher:async(_u,i)=>{calls++;if(i?.method==='POST')return response(a,201);if(kind==='transport')throw new Error('read failed');return response(a,200,'remote edit');}});assert.equal(r.state,'needs_attention');assert.equal(r.remote_id,'FIXTURE1');assert.equal(calls,kind==='persist'?1:2);}});
test('declined authorization/rate-limit produces actionable state without creation claim or retry',async()=>{const a=await artifact();for(const status of [401,403,429,422]){let n=0;const r=await createAndVerifyKlaviyoTemplate({artifact:a,name:'Fixture',accessToken:'fixture-token',markSubmission:async()=>{},persistRemoteId:async()=>assert.fail(),fetcher:async()=>{n++;return new Response('provider-private-error',{status,headers:{'retry-after':'12'}});}});assert.equal(r.state,'needs_attention');assert.equal(r.remote_id,null);assert.equal(n,1);if(status===429)assert.equal(r.retry_after,12);}});
test('oversized success, foreign resource link, cancelled request fail conservatively',async()=>{const a=await artifact();for(const kind of ['large','foreign']as const){const r=await createAndVerifyKlaviyoTemplate({artifact:a,name:'Fixture',accessToken:'fixture-token',markSubmission:async()=>{},persistRemoteId:async()=>{},fetcher:async()=>kind==='large'?new Response('x'.repeat(5*1024*1024),{status:201}):new Response(JSON.stringify({data:{id:'FIXTURE1',type:'template'},links:{self:'https://evil.test/?secret'}}),{status:201})});assert.equal(r.state,'outcome_unknown');}
 const controller=new AbortController();controller.abort();let called=false;const r=await createAndVerifyKlaviyoTemplate({artifact:a,name:'Fixture',accessToken:'fixture-token',signal:controller.signal,markSubmission:async()=>{called=true;},persistRemoteId:async()=>{},fetcher:async()=>{called=true;return response(a,201);}});assert.equal(r.code,'EXPORT_CANCELLED');assert.equal(called,false);
});

test('HTTP408 and failed error-stream discard never become retryable verified outcomes',async()=>{const a=await artifact();for(const status of [408,503,403]){const body=new ReadableStream({cancel(){throw Error('remote secret');}});let n=0;const r=await createAndVerifyKlaviyoTemplate({artifact:a,name:'Fixture',accessToken:'fixture-token',markSubmission:async()=>{},persistRemoteId:async()=>{},fetcher:async()=>{n++;return new Response(body,{status});}});assert.equal(r.state,status===403?'needs_attention':'outcome_unknown');assert.equal(n,1);}});

for(const attributes of [{name:'Fixture'},{name:42,editor_type:null,html:[],text:{}},null,'malformed']) {
 test(`trusted create identity survives ${JSON.stringify(attributes)} attributes before exact readback`,async()=>{
  const a=await artifact();
  for(const readback of ['valid','partial','transport'] as const){
   const order:string[]=[],requests:{url:string;method:string}[]=[];
   const r=await createAndVerifyKlaviyoTemplate({artifact:a,name:'Fixture',accessToken:'fixture-token',markSubmission:async()=>{order.push('marker');},persistRemoteId:async id=>{assert.equal(id,'FIXTURE1');order.push('id');},fetcher:async(url,init)=>{
    const method=String(init?.method);order.push(method);requests.push({url:String(url),method});
    if(method==='POST')return new Response(JSON.stringify({data:{id:'FIXTURE1',type:'template',attributes},links:{self:'https://a.klaviyo.com/api/templates/FIXTURE1'}}),{status:201});
    if(readback==='transport')throw new Error('private readback error');
    return readback==='valid'?response(a):new Response(JSON.stringify({data:{id:'FIXTURE1',type:'template',attributes:{name:'Fixture'}}}),{status:200});
   }});
   assert.deepEqual(order,['marker','POST','id','GET']);
   assert.equal(r.state,readback==='valid'?'verified':'needs_attention');assert.equal(r.remote_id,'FIXTURE1');
   assert.equal(r.resource_url,'https://a.klaviyo.com/api/templates/FIXTURE1');assert.equal(r.destination_url,null);
   assert.deepEqual(requests,[{url:'https://a.klaviyo.com/api/templates',method:'POST'},{url:'https://a.klaviyo.com/api/templates/FIXTURE1',method:'GET'}]);
  }
 });
}
test('create attributes cannot relax trusted origin, type, ID or self-link admission',async()=>{
 const a=await artifact();
 for(const kind of ['origin','type','id','self'] as const){
  let calls=0;
  const r=await createAndVerifyKlaviyoTemplate({artifact:a,name:'Fixture',accessToken:'fixture-token',markSubmission:async()=>{},persistRemoteId:async()=>assert.fail('untrusted identity'),fetcher:async()=>{
   calls++;const read=new Response(JSON.stringify({data:{id:kind==='id'?'../evil':'FIXTURE1',type:kind==='type'?'campaign':'template',attributes:{name:'Fixture'}},links:{self:kind==='self'?'https://a.klaviyo.com/api/templates/OTHER':'https://a.klaviyo.com/api/templates/FIXTURE1'}}),{status:201});
   if(kind==='origin')Object.defineProperty(read,'url',{value:'https://evil.test/api/templates'});return read;
  }});
  assert.equal(r.state,'outcome_unknown');assert.equal(r.remote_id,null);assert.equal(calls,1);
 }
});
