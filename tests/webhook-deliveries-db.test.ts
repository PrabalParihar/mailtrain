import test,{after}from'node:test';import assert from'node:assert/strict';import{randomUUID,randomBytes}from'node:crypto';import pg from'pg';import env from'@next/env';import{tenant,closeDb}from'../src/server/db';import{parseWebhookVault}from'../src/server/webhook-secrets';import{persistWebhookEndpoint}from'../src/server/webhook-endpoints';import{recordEvent}from'../src/server/events';
import{admitWebhookEvents,claimWebhookDelivery,authorizeWebhookDelivery,settleWebhookDelivery}from'../src/server/webhook-deliveries';
env.loadEnvConfig(process.cwd());
test('webhook durable truth dedupes events, fairly leases bounded tenants, rechecks authority and preserves attempt/failure/lease history',async()=>{
 const db=new pg.Pool({connectionString:process.env.MIGRATION_DATABASE_URL}),workspaces=[randomUUID(),randomUUID(),randomUUID()],user='webhook-queue-'+randomUUID(),vault=parseWebhookVault(JSON.stringify({fixture:randomBytes(32).toString('hex')}),'fixture'),endpoints:string[]=[];
 const service=await db.connect();
 async function run<T>(fn:(tx:pg.PoolClient)=>Promise<T>):Promise<T>{await service.query('BEGIN');try{await service.query('SET LOCAL ROLE mailcraft_webhook_worker');const result=await fn(service);await service.query('COMMIT');return result;}catch(error){await service.query('ROLLBACK');throw error;}}
 try{
  for(const workspace of workspaces){
   await db.query("INSERT INTO workspaces(id,name)VALUES($1,'Webhook queue fixture')",[workspace]);await db.query("INSERT INTO memberships(workspace_id,user_id,role)VALUES($1,$2,'Owner')",[workspace,user]);
   const created=await tenant(workspace,user,(tx)=>persistWebhookEndpoint(tx,{workspace,user,role:'Owner'},{name:'Queue fixture',url:'https://example.org/hook',subscriptions:['contact.unsubscribed']},vault,new Date().toISOString()));endpoints.push(created.endpoint.id);
   await db.query("UPDATE webhook_endpoints SET status='enabled',version=version+1 WHERE workspace_id=$1",[workspace]);
   const contact=randomUUID();await db.query("INSERT INTO contacts(workspace_id,id,email_original,email_lookup,subscription,consent_version)VALUES($1,$2,'queue@example.org','queue@example.org','unsubscribed',2)",[workspace,contact]);await db.query("INSERT INTO suppressions(workspace_id,contact_id,reason)VALUES($1,$2,'unsubscribe')",[workspace,contact]);
   await tenant(workspace,user,(tx)=>recordEvent(tx,workspace,{type:'contact.unsubscribed',aggregate:{type:'contact',id:contact,version:2},data:{contact_id:contact,scope:'marketing',reason:'recipient_opt_out'}}));
  }
  await assert.rejects(()=>run((tx)=>tx.query('SELECT email_original FROM contacts')));
  for(let i=0;i<3;i++)assert.equal((await run((tx)=>admitWebhookEvents(tx))).inserted,1);
  for(let i=0;i<3;i++)assert.equal((await run((tx)=>admitWebhookEvents(tx))).inserted,0);
  const count=(await db.query('SELECT count(*)::int AS n FROM webhook_deliveries WHERE workspace_id=ANY($1::uuid[])',[workspaces])).rows[0].n;assert.equal(count,3);
  const first=await run((tx)=>claimWebhookDelivery(tx)),second=await run((tx)=>claimWebhookDelivery(tx));assert.ok(first&&second);assert.notEqual(first.workspace_id,second.workspace_id);assert.equal(await run((tx)=>claimWebhookDelivery(tx)),null);
  const authorized=await run((tx)=>authorizeWebhookDelivery(tx,first));assert.ok(authorized);assert.equal(authorized.secret_version,1);
  await run((tx)=>settleWebhookDelivery(tx,first,{status:429,retry_after:'60',error_class:null},0.5));
  const deferred=(await db.query('SELECT * FROM webhook_deliveries WHERE id=$1',[first.id])).rows[0];assert.equal(deferred.state,'pending');assert.equal(deferred.failure_attempts,0);assert.ok(new Date(deferred.next_at).getTime()>Date.now()+55000);
  await db.query("UPDATE memberships SET role='Viewer' WHERE workspace_id=$1 AND user_id=$2",[second.workspace_id,user]);assert.equal(await run((tx)=>authorizeWebhookDelivery(tx,second)),null);
  assert.equal((await db.query('SELECT state FROM webhook_deliveries WHERE id=$1',[second.id])).rows[0].state,'blocked');
  const third=await run((tx)=>claimWebhookDelivery(tx));assert.ok(third);await db.query("UPDATE webhook_deliveries SET lease_until=clock_timestamp()-interval '1 second' WHERE id=$1",[third.id]);
  const recovered=await run((tx)=>claimWebhookDelivery(tx));assert.equal(recovered?.id,third.id);assert.equal(recovered.attempt_number,2);assert.notEqual(recovered.lease_token,third.lease_token);
  assert.equal(await run((tx)=>authorizeWebhookDelivery(tx,third)),null);
  assert.ok(await run((tx)=>authorizeWebhookDelivery(tx,recovered)));await run((tx)=>settleWebhookDelivery(tx,recovered,{status:204,error_class:null},0.5));
  assert.equal((await db.query('SELECT state FROM webhook_deliveries WHERE id=$1',[third.id])).rows[0].state,'acknowledged');
  await assert.rejects(()=>run((tx)=>tx.query("UPDATE webhook_attempts SET phase='settled' WHERE delivery_id=$1",[third.id])));
  await assert.rejects(()=>run((tx)=>tx.query('DELETE FROM webhook_attempts WHERE delivery_id=$1',[third.id])));
  assert.equal((await db.query("SELECT count(*)::int AS n FROM webhook_attempts WHERE delivery_id=$1 AND phase='recovered'",[third.id])).rows[0].n,1);
 }finally{
  service.release();for(const table of['webhook_attempts','webhook_deliveries','webhook_queue_state','webhook_signing_keys','webhook_endpoints','outbox','consent_events','suppressions','contacts','audit_events','memberships'])await db.query(`DELETE FROM ${table} WHERE workspace_id=ANY($1::uuid[])`,[workspaces]);await db.query('DELETE FROM workspaces WHERE id=ANY($1::uuid[])',[workspaces]);await db.end();
 }
});
test('owned HTTP worker retries exact events with rotated keys and persistent receiver dedupe, then disables a410 target',async()=>{
 const{createServer}=await import('node:http'),{readFile}=await import('node:fs/promises'),{acceptWebhookEvent}=await import('../examples/webhook-consumer/consumer'),{runWebhookDelivery}=await import('../src/server/webhook-engine'),{openWebhookSecret}=await import('../src/server/webhook-secrets'),{rotateWebhookEndpoint}=await import('../src/server/webhook-endpoints'),{signWebhook}=await import('../src/server/webhook-protocol');
 const db=new pg.Pool({connectionString:process.env.MIGRATION_DATABASE_URL}),workspace=randomUUID(),user='webhook-engine-'+randomUUID(),consumer=randomUUID(),schema='hook_receiver_'+randomUUID().replaceAll('-',''),vault=parseWebhookVault(JSON.stringify({fixture:randomBytes(32).toString('hex')}),'fixture');
 async function transaction<T>(fn:(tx:pg.PoolClient)=>Promise<T>):Promise<T>{const tx=await db.connect();try{await tx.query('BEGIN');await tx.query('SET LOCAL ROLE mailcraft_webhook_worker');const r=await fn(tx);await tx.query('COMMIT');return r;}catch(e){await tx.query('ROLLBACK');throw e;}finally{tx.release();}}
 let status=429,requests=0;const bodies:Buffer[]=[],versions:string[]=[],keys:{secret_version:number;valid_until:string|null;secret:string}[]=[];
 const server=createServer(async(req,res)=>{try{requests++;const chunks:Buffer[]=[];for await(const chunk of req)chunks.push(Buffer.from(chunk));const body=Buffer.concat(chunks);bodies.push(body);versions.push(String(req.headers['x-lettercape-key-version']));if(status!==429&&status!==410){const tx=await db.connect();try{await tx.query('BEGIN');await tx.query('SET LOCAL search_path TO '+schema+',pg_catalog');await acceptWebhookEvent(tx,consumer,workspace,body,new Headers(Object.entries(req.headers).map(([k,v]):[string,string]=>[k,String(v)])),keys);await tx.query('COMMIT');}catch(e){await tx.query('ROLLBACK');throw e;}finally{tx.release();}}
 res.writeHead(status,status===429?{'Retry-After':'60'}:{});res.end();}catch{res.writeHead(400);res.end();}});
 try{
  await db.query('CREATE SCHEMA '+schema);const schemaTx=await db.connect();try{await schemaTx.query('SET search_path TO '+schema+',pg_catalog');await schemaTx.query(await readFile('examples/webhook-consumer/schema.sql','utf8'));}finally{await schemaTx.query('RESET search_path');schemaTx.release();}
  await db.query("INSERT INTO workspaces(id,name)VALUES($1,'Engine HTTP fixture')",[workspace]);await db.query("INSERT INTO memberships(workspace_id,user_id,role)VALUES($1,$2,'Owner')",[workspace,user]);
  const endpoint=await tenant(workspace,user,(tx)=>persistWebhookEndpoint(tx,{workspace,user,role:'Owner'},{name:'Engine fixture',url:'https://example.org/hook',subscriptions:['contact.unsubscribed']},vault,new Date().toISOString()));
  await db.query("UPDATE webhook_endpoints SET status='enabled',version=version+1 WHERE workspace_id=$1",[workspace]);
  const encrypted=(await db.query("SELECT wrapped_secret FROM webhook_signing_keys WHERE workspace_id=$1 AND state='current'",[workspace])).rows[0].wrapped_secret;keys.push({secret_version:1,valid_until:null,secret:openWebhookSecret({workspace_id:workspace,endpoint_id:endpoint.endpoint.id,secret_version:1},encrypted,vault)});
  async function source(){const contact=randomUUID();await db.query("INSERT INTO contacts(workspace_id,id,email_original,email_lookup,subscription,consent_version)VALUES($1,$2,$3,$3,'unsubscribed',2)",[workspace,contact,contact+'@example.org']);await db.query("INSERT INTO suppressions(workspace_id,contact_id,reason)VALUES($1,$2,'unsubscribe')",[workspace,contact]);return tenant(workspace,user,(tx)=>recordEvent(tx,workspace,{type:'contact.unsubscribed',aggregate:{type:'contact',id:contact,version:2},data:{contact_id:contact,scope:'marketing',reason:'recipient_opt_out'}}));}
  const event=await source();await new Promise<void>((resolve)=>server.listen(0,'127.0.0.1',resolve));const address=server.address();assert.ok(address&&typeof address==='object');
  const transport=async(url:string,body:Uint8Array,secret:string,keyVersion:number,signal?:AbortSignal)=>{assert.equal(url,'https://example.org/hook');const r=await fetch('http://127.0.0.1:'+address.port,{method:'POST',body:Buffer.from(body),headers:{...signWebhook(body,secret),'X-Lettercape-Key-Version':String(keyVersion)},signal});return{status:r.status,retry_after:r.headers.get('retry-after')??undefined,error_class:null};};
  async function run(){return runWebhookDelivery({enabled:true,transaction,vault,signal:new AbortController().signal,transport,jitter:()=>0.5});}
  assert.equal((await run()).recorded,true);assert.equal((await db.query('SELECT failure_attempts FROM webhook_deliveries WHERE workspace_id=$1',[workspace])).rows[0].failure_attempts,0);
  // Only this randomly named queue is created/deleted; existing Redis data is untouched.
  const{Queue}=await import('bullmq'),{Redis}=await import('ioredis');assert.ok(process.env.REDIS_URL,'Owned Redis fixture required');
  const redis=new Redis(process.env.REDIS_URL,{maxRetriesPerRequest:null}),wake=new Queue('lettercape-fixture-'+randomUUID(),{connection:redis});
  try{await wake.add('wake',{}, {jobId:'durable-wake'});await wake.obliterate({force:true});assert.equal((await db.query('SELECT state FROM webhook_deliveries WHERE workspace_id=$1',[workspace])).rows[0].state,'pending');}finally{await wake.close();await redis.quit();}

  const rotated=await tenant(workspace,user,(tx)=>rotateWebhookEndpoint(tx,{workspace,user,role:'Owner'},endpoint.endpoint.id,{expected_version:2,retire_previous:false,acknowledge_key_cutover:false},vault));keys[0].valid_until=new Date(Date.now()+86400000).toISOString();keys.push({secret_version:2,valid_until:null,secret:rotated.secret});
  await db.query('UPDATE webhook_deliveries SET next_at=clock_timestamp()WHERE workspace_id=$1',[workspace]);status=500;assert.equal((await run()).recorded,true);
  await db.query('UPDATE webhook_deliveries SET next_at=clock_timestamp()WHERE workspace_id=$1',[workspace]);status=204;assert.equal((await run()).recorded,true);
  assert.equal(requests,3);assert.deepEqual(versions,['1','2','2']);assert.deepEqual(bodies[0],bodies[1]);assert.deepEqual(bodies[1],bodies[2]);assert.equal(JSON.parse(bodies[0].toString()).id,event.id);
  assert.equal((await db.query('SELECT count(*)::int AS n FROM '+schema+'.webhook_consumer_receipts')).rows[0].n,1);assert.equal((await db.query('SELECT state FROM webhook_deliveries WHERE workspace_id=$1',[workspace])).rows[0].state,'acknowledged');
  await source();status=410;assert.equal((await run()).recorded,true);assert.equal((await db.query('SELECT status FROM webhook_endpoints WHERE workspace_id=$1',[workspace])).rows[0].status,'disabled');assert.equal((await run()).claimed,false);assert.equal(requests,4);
 }finally{await new Promise<void>((resolve)=>server.close(()=>resolve()));for(const table of['webhook_attempts','webhook_deliveries','webhook_queue_state','webhook_signing_keys','webhook_endpoints','outbox','suppressions','contacts','audit_events','memberships'])await db.query(`DELETE FROM ${table} WHERE workspace_id=$1`,[workspace]);await db.query('DELETE FROM workspaces WHERE id=$1',[workspace]);await db.query('DROP SCHEMA IF EXISTS '+schema+' CASCADE');await db.end();}
});

after(()=>closeDb());
