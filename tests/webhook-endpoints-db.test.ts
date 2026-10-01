import test from 'node:test';import assert from 'node:assert/strict';import {randomBytes,randomUUID} from 'node:crypto';import pg from 'pg';import env from '@next/env';
import{tenant,closeDb}from'../src/server/db';import{parseWebhookVault,openWebhookSecret}from'../src/server/webhook-secrets';
import{persistWebhookEndpoint,rotateWebhookEndpoint,pauseWebhookEndpoint}from'../src/server/webhook-endpoints';
import type{Principal}from'../src/server/auth';
env.loadEnvConfig(process.cwd());
test('webhook endpoint secrets stay encrypted/tenant-bound, CAS rotation overlaps and current database authority revalidates',async()=>{
 const db=new pg.Pool({connectionString:process.env.MIGRATION_DATABASE_URL}),w=randomUUID(),other=randomUUID(),user='webhook-db-'+randomUUID(),p:Principal={workspace:w,user,role:'Owner'},vault=parseWebhookVault(JSON.stringify({fixture:randomBytes(32).toString('hex')}),'fixture');
 try{
  await db.query('INSERT INTO workspaces(id,name)VALUES($1,$3),($2,$3)',[w,other,'Webhook endpoint DB fixture']);await db.query("INSERT INTO memberships(workspace_id,user_id,role)VALUES($1,$2,'Owner')",[w,user]);
  const created=await tenant(w,user,(tx)=>persistWebhookEndpoint(tx,p,{name:'Owned fixture',url:'https://example.org/hook?opaque=never-log',subscriptions:['contact.unsubscribed']},vault,new Date().toISOString()));
  assert.equal(created.endpoint.status,'paused');assert.equal(created.endpoint.version,1);assert.ok(created.secret);
  const endpoint=created.endpoint.id;
  const stored=(await db.query('SELECT * FROM webhook_signing_keys WHERE workspace_id=$1 AND endpoint_id=$2',[w,endpoint])).rows[0];
  assert.equal(openWebhookSecret({workspace_id:w,endpoint_id:endpoint,secret_version:1},stored.wrapped_secret,vault),created.secret);
  assert.equal(JSON.stringify(stored).includes(created.secret),false);assert.equal(JSON.stringify(created.endpoint).includes('never-log'),false);
  assert.equal((await tenant(other,user,(tx)=>tx.query('SELECT * FROM webhook_endpoints WHERE id=$1',[endpoint]))).rowCount,0);
  await assert.rejects(()=>tenant(other,user,(tx)=>rotateWebhookEndpoint(tx,{...p,workspace:other},endpoint,{expected_version:1,retire_previous:false,acknowledge_key_cutover:false},vault)));
  const rotated=await tenant(w,user,(tx)=>rotateWebhookEndpoint(tx,p,endpoint,{expected_version:1,retire_previous:false,acknowledge_key_cutover:false},vault));assert.equal(rotated.endpoint.secret_version,2);assert.equal(rotated.endpoint.version,2);assert.notEqual(rotated.secret,created.secret);
  const keys=(await db.query('SELECT state,valid_until,secret_version FROM webhook_signing_keys WHERE workspace_id=$1 ORDER BY secret_version',[w])).rows;
  assert.equal(keys[0].state,'previous');assert.equal(keys[1].state,'current');assert.ok(keys[0].valid_until instanceof Date);
  await assert.rejects(()=>tenant(w,user,(tx)=>rotateWebhookEndpoint(tx,p,endpoint,{expected_version:2,retire_previous:false,acknowledge_key_cutover:false},vault)),/overlap/i);
  await assert.rejects(()=>tenant(w,user,(tx)=>rotateWebhookEndpoint(tx,p,endpoint,{expected_version:1,retire_previous:true,acknowledge_key_cutover:true},vault)),/changed/i);
  const forced=await tenant(w,user,(tx)=>rotateWebhookEndpoint(tx,p,endpoint,{expected_version:2,retire_previous:true,acknowledge_key_cutover:true},vault));assert.equal(forced.endpoint.secret_version,3);
  assert.equal((await db.query("SELECT count(*)::int AS n FROM webhook_signing_keys WHERE workspace_id=$1 AND state='retired'",[w])).rows[0].n,1);
  await assert.rejects(()=>tenant(w,user,(tx)=>tx.query("UPDATE webhook_signing_keys SET wrapped_secret='{}' WHERE endpoint_id=$1",[endpoint])));
  await assert.rejects(()=>tenant(w,user,(tx)=>tx.query('DELETE FROM webhook_signing_keys WHERE endpoint_id=$1',[endpoint])));
  await db.query("UPDATE memberships SET role='Viewer' WHERE workspace_id=$1 AND user_id=$2",[w,user]);
  await assert.rejects(()=>tenant(w,user,(tx)=>pauseWebhookEndpoint(tx,p,endpoint,{expected_version:3})));
  await assert.rejects(()=>tenant(w,user,(tx)=>persistWebhookEndpoint(tx,p,{name:'No authority',url:'https://example.org',subscriptions:['contacts.imported']},vault,new Date().toISOString())));
 }finally{
  for(const table of['webhook_signing_keys','webhook_endpoints','audit_events','memberships'])await db.query(`DELETE FROM ${table} WHERE workspace_id=ANY($1::uuid[])`,[[w,other]]);await db.query('DELETE FROM workspaces WHERE id=ANY($1::uuid[])',[[w,other]]);await db.end();await closeDb();
 }
});
