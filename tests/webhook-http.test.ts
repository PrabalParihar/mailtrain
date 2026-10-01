import test from 'node:test';import assert from 'node:assert/strict';import http from 'node:http';import{randomUUID,randomBytes}from'node:crypto';
import{signWebhook,verifyWebhook,webhookOutcome,WEBHOOK_BODY_MAX}from'../src/server/webhook-protocol';
test('actual owned HTTP receiver verifies raw bytes and dedupes retried event with a fresh delivery signature',async()=>{
 const workspace=randomUUID(),contact=randomUUID(),secret=randomBytes(32).toString('hex'),now=Math.floor(Date.now()/1000);
 const body=Buffer.from(JSON.stringify({id:randomUUID(),type:'contact.unsubscribed',schema_version:1,workspace_id:workspace,occurred_at:new Date().toISOString(),recorded_at:new Date().toISOString(),aggregate:{type:'contact',id:contact,version:2},data:{contact_id:contact,scope:'marketing',reason:'recipient_opt_out'},trace_id:randomUUID()}));
 const receipts=new Set<string>(),bodies:Buffer[]=[],signatures:string[]=[];let effects=0,attempts=0;
 const server=http.createServer(async(req,res)=>{
  try{
   const chunks:Buffer[]=[];let size=0;
   for await(const chunk of req){size+=chunk.length;if(size>WEBHOOK_BODY_MAX){res.writeHead(413).end();return;}chunks.push(chunk);}
   const raw=Buffer.concat(chunks),headers=new Headers();
   for(const name of['x-lettercape-event-id','x-lettercape-timestamp','x-lettercape-signature']){const value=req.headers[name];if(typeof value!=='string')throw new Error('Invalid header');headers.set(name,value);}
   const event=verifyWebhook(raw,headers,secret,workspace,now);
   bodies.push(raw);signatures.push(headers.get('x-lettercape-signature')!);attempts++;
   if(!receipts.has(event.id)){receipts.add(event.id);effects++;}
   if(attempts===1)res.writeHead(429,{'Retry-After':'1'}).end();else res.writeHead(204).end();
  }catch{res.writeHead(401).end();}
 });
 await new Promise<void>((resolve)=>server.listen(0,'127.0.0.1',resolve));
 try{
  const address=server.address();assert.ok(address&&typeof address!=='string');const url='http://127.0.0.1:'+address.port;
  const first=await fetch(url,{method:'POST',headers:signWebhook(body,secret,now),body});assert.equal(webhookOutcome(first.status),'retry');assert.equal(first.headers.get('Retry-After'),'1');
  const second=await fetch(url,{method:'POST',headers:signWebhook(body,secret,now+1),body});assert.equal(webhookOutcome(second.status),'acknowledged');
  assert.equal(effects,1);assert.equal(receipts.size,1);assert.deepEqual(bodies[0],bodies[1]);assert.notEqual(signatures[0],signatures[1]);
  const altered=await fetch(url,{method:'POST',headers:signWebhook(body,secret,now+2),body:Buffer.concat([body,Buffer.from(' ')])});assert.equal(altered.status,401);assert.equal(effects,1);
 }finally{server.closeAllConnections();await new Promise<void>((resolve,reject)=>server.close((error)=>error?reject(error):resolve()));}
});
