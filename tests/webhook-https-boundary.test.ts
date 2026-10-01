import test from 'node:test';import assert from 'node:assert/strict';import {randomBytes,randomUUID}from'node:crypto';import{EventEmitter}from'node:events';import{PassThrough}from'node:stream';import https from'node:https';import type http from'node:http';import{Resolver}from'node:dns/promises';
import{postWebhook}from'../src/server/webhook-transport';import{verifyWebhook}from'../src/server/webhook-protocol';
test('HTTPS boundary pins TLS peer before payload, refuses redirects, discards oversized bodies and handles interruption/deadline',async(t)=>{
 const workspace=randomUUID(),contact=randomUUID(),key=randomBytes(32).toString('hex'),body=Buffer.from(JSON.stringify({id:randomUUID(),workspace_id:workspace,schema_version:1,type:'contact.unsubscribed',occurred_at:new Date().toISOString(),recorded_at:new Date().toISOString(),trace_id:randomUUID(),aggregate:{type:'contact',id:contact,version:2},data:{contact_id:contact,scope:'marketing',reason:'recipient_opt_out'}}));
 t.mock.method(Resolver.prototype,'resolve4',async()=>['93.184.216.34']);t.mock.method(Resolver.prototype,'resolve6',async()=>{throw Object.assign(new Error('No AAAA'),{code:'ENODATA'});});
 let status=429,peer='93.184.216.34',responseBytes=0,hold=false,requests=0,sent=0,ready:()=>void=()=>{};
 t.mock.method(https,'request',((_url:URL,options:https.RequestOptions,callback:(res:http.IncomingMessage)=>void)=>{
  requests++;assert.equal(options.rejectUnauthorized,true);assert.equal(options.agent,false);assert.equal(options.servername,'example.org');assert.equal(options.method,'POST');
  let pinned='';(options.lookup as (host:string,options:object,callback:(error:Error|null,address:string,family:number)=>void)=>void)('example.org',{},(_error,address)=>{pinned=address;});assert.equal(pinned,'93.184.216.34');
  const headers=options.headers as Record<string,string>;assert.equal(headers['X-Lettercape-Key-Version'],'2');assert.equal(headers.Cookie,undefined);assert.equal(headers.Authorization,undefined);
  const req=Object.assign(new EventEmitter(),{destroyed:false,destroy(this:EventEmitter&{destroyed:boolean}){this.destroyed=true;this.emit('error',new Error('Fixture transport closed'));return this;},end(this:EventEmitter&{destroyed:boolean},payload:Buffer){
   queueMicrotask(()=>{
    const socket=Object.assign(new EventEmitter(),{remoteAddress:peer});this.emit('socket',socket);socket.emit('secureConnect');
    if(this.destroyed)return;sent++;assert.deepEqual(payload,body);verifyWebhook(payload,headers,key,workspace);ready();if(hold)return;
    const res=Object.assign(new PassThrough(),{statusCode:status,socket:{remoteAddress:peer},headers:{'retry-after':'60',location:'https://127.0.0.1/private'}});callback(res as unknown as http.IncomingMessage);res.end(Buffer.alloc(responseBytes));
   });return this;
  }});return req as unknown as http.ClientRequest;
 })as typeof https.request);
 const rate=await postWebhook('https://example.org/hook',body,key,2);assert.equal(rate.status,429);assert.equal(rate.retry_after,'60');
 status=302;const redirect=await postWebhook('https://example.org/hook',body,key,2);assert.equal(redirect.status,302);assert.equal(requests,2);
 peer='127.0.0.1';const denied=await postWebhook('https://example.org/hook',body,key,2);assert.equal(denied.error_class,'unsafe_target');assert.equal(sent,2);
 peer='93.184.216.34';responseBytes=8193;const oversized=await postWebhook('https://example.org/hook',body,key,2);assert.equal(oversized.error_class,'invalid_response');
 hold=true;responseBytes=0;const abort=new AbortController();const receiving=new Promise<void>((resolve)=>{ready=resolve;});const interrupted=postWebhook('https://example.org/hook',body,key,2,abort.signal);await receiving;abort.abort();assert.equal((await interrupted).error_class,'aborted');
 t.mock.timers.enable({apis:['setTimeout','Date']});const timeoutReady=new Promise<void>((resolve)=>{ready=resolve;});const timed=postWebhook('https://example.org/hook',body,key,2);await timeoutReady;t.mock.timers.tick(10000);assert.equal((await timed).error_class,'timeout');
});
test('real Node request requests a compatible pinned DNS result before fixture denies every connection',async(t)=>{
 const nativeRequest=https.request;
 t.mock.method(Resolver.prototype,'resolve4',async()=>['93.184.216.34']);t.mock.method(Resolver.prototype,'resolve6',async()=>{throw Object.assign(new Error('No AAAA'),{code:'ENODATA'});});
 let compatible=false,lookups=0,observed='';
 t.mock.method(https,'request',((_url:URL,options:https.RequestOptions,cb:(r:http.IncomingMessage)=>void)=>{
  const productionLookup=options.lookup!;
  const lookup:NonNullable<https.RequestOptions['lookup']>=(host,lookupOptions,done)=>{
   lookups++;
   productionLookup(host,lookupOptions,((error:Error|null,address:unknown,family:unknown)=>{
    compatible=!error&&(lookupOptions.all?Array.isArray(address)&&address.length===1&&address[0].address==='93.184.216.34':address==='93.184.216.34'&&family===4);
    // Observe the native request's all/single contract, then prohibit connection unconditionally.
    queueMicrotask(()=>done(Object.assign(new Error('Owned fixture denies all egress'),{code:'FIXTURE_EGRESS_DENIED'}),'',4));
   })as Parameters<typeof productionLookup>[2]);
  };
  const req=nativeRequest(_url,{...options,lookup},cb);req.on('error',(e:NodeJS.ErrnoException)=>{observed=e.code??'';});return req;
 })as typeof https.request);
 const workspace=randomUUID(),contact=randomUUID(),body=Buffer.from(JSON.stringify({id:randomUUID(),workspace_id:workspace,schema_version:1,type:'contact.unsubscribed',occurred_at:new Date().toISOString(),recorded_at:new Date().toISOString(),trace_id:randomUUID(),aggregate:{type:'contact',id:contact,version:2},data:{contact_id:contact,scope:'marketing',reason:'recipient_opt_out'}}));
 await postWebhook('https://example.org/hook',body,randomBytes(32).toString('hex'),1);
 assert.equal(lookups,1);assert.equal(observed,'FIXTURE_EGRESS_DENIED');assert.equal(compatible,true,'Pinned lookup must satisfy the real native request all/single contract');
});
