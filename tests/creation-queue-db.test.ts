import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import pg from 'pg';
import env from '@next/env';
import {withCreationQueueFixture} from './fixtures/creation-queue-lock';
import {tenant,closeDb} from '../src/server/db';
import {operation} from '../src/server/operations';
import {AppError} from '../src/server/errors';
env.loadEnvConfig(process.cwd());
const store=await import('../src/server/creation-queue-store').catch(()=>null);
const admin=new pg.Pool({connectionString:process.env.MIGRATION_DATABASE_URL});
const worker=new pg.Pool({connectionString:process.env.MIGRATION_DATABASE_URL,options:'-c role=mailcraft_creation_worker'});
const scheduler=new pg.Pool({connectionString:process.env.MIGRATION_DATABASE_URL,options:'-c role=mailcraft_creation_scheduler'});
after(async()=>{await Promise.all([admin.end(),worker.end(),scheduler.end(),closeDb()]);});
type Fixture={workspaces:string[];user:string;jobs:string[];wake:(index:number)=>{workspace_id:string;operation_id:string}};
async function fixture(run:(fixture:Fixture)=>Promise<void>,generation=false){
 assert.ok(store?.claimCreation,'Restricted creation queue storage must exist.');
 const workspaces=[randomUUID(),randomUUID()],user='creation-db-'+randomUUID(),jobs=[randomUUID(),randomUUID(),randomUUID()],brand=randomUUID();
 try{
  for(const workspace of workspaces){await admin.query("INSERT INTO workspaces(id,name)VALUES($1,'Creation queue fixture')",[workspace]);await admin.query("INSERT INTO memberships(workspace_id,user_id,role)VALUES($1,$2,'Owner')",[workspace,user]);}
  if(generation)await admin.query('INSERT INTO brands(workspace_id,id,version,data)VALUES($1,$2,1,$3)',[workspaces[0],brand,JSON.stringify({name:'Creation fixture',website:'https://example.org',description:'Owned fixture',voice:'Plain',accent:'#0B625D',background:'#F7F6F2',font_stack:'Arial, sans-serif',address:'Reserved fixture address',approved_claims:[],forbidden_phrases:[],provenance:[]})]);
  for(let i=0;i<jobs.length;i++)await admin.query('INSERT INTO operations(workspace_id,id,type,input,created_by)VALUES($1,$2,$3,$4,$5)',[i<2?workspaces[0]:workspaces[1],jobs[i],generation&&i===0?'email.generate':'brand.extract',JSON.stringify(generation&&i===0?{brand_kit_version_id:brand,prompt:'Owned fixture',locale:'en-US',mode:'single'}:{url:'https://example.org'}),user]);
  await run({workspaces,user,jobs,wake:index=>({workspace_id:index<2?workspaces[0]:workspaces[1],operation_id:jobs[index]})});
 }finally{
  for(const table of['outbox','usage_ledger','operations','api_keys','memberships'])await admin.query(`DELETE FROM ${table} WHERE workspace_id=ANY($1::uuid[])`,[workspaces]);
  await admin.query('DELETE FROM brands WHERE workspace_id=ANY($1::uuid[])',[workspaces]);
  await admin.query('DELETE FROM workspaces WHERE id=ANY($1::uuid[])',[workspaces]);
 }
}
test('restricted creation claims enforce tenant identity, finite global and workspace concurrency',async()=>withCreationQueueFixture(()=>fixture(async f=>{
 const due=await store!.dueCreation(scheduler);for(const item of due)assert.deepEqual(Object.keys(item).sort(),['operation_id','workspace_id']);
 const one=await store!.claimCreation(worker,f.wake(0));assert.ok(one);assert.equal(one.workspace_id,f.workspaces[0]);assert.equal(await store!.claimCreation(worker,f.wake(0)),null);assert.equal(await store!.claimCreation(worker,f.wake(1)),null);
 const two=await store!.claimCreation(worker,f.wake(2));assert.ok(two);assert.equal(await store!.claimCreation(worker,{workspace_id:f.workspaces[1],operation_id:f.jobs[1]}),null);
 const probe=await admin.connect();try{await probe.query('BEGIN');await probe.query('SET LOCAL ROLE mailcraft_runtime');await assert.rejects(probe.query('SELECT mailcraft_creation_due()'),/permission denied/);}finally{await probe.query('ROLLBACK');probe.release();}
 assert.equal(await store!.renewCreation(worker,one),true);assert.equal(await store!.renewCreation(worker,{...one,token:randomUUID()}),false);
})));
test('recorded external generation crash retains accounting and never becomes a safe retry',async()=>withCreationQueueFixture(()=>fixture(async f=>{
 const job=f.jobs[0];await admin.query("INSERT INTO usage_ledger(workspace_id,operation_id,metric,kind,units)VALUES($1,$2,'generation','reserve',1)",[f.workspaces[0],job]);
 try{
  const claim=await store!.claimCreation(worker,f.wake(0));assert.ok(claim);const context=await store!.beginCreationAttempt(worker,claim);assert.ok(context);assert.equal(context.operation.id,job);
  await admin.query("UPDATE creation_jobs SET lease_until=clock_timestamp()-interval '1 second'WHERE operation_id=$1",[job]);await store!.recoverCreation(scheduler,f.wake(0));
  const operation=(await admin.query('SELECT state,error FROM operations WHERE id=$1',[job])).rows[0];assert.equal(operation.state,'failed');assert.equal(operation.error.code,'AI_RECONCILIATION_REQUIRED');assert.equal(await store!.claimCreation(worker,f.wake(0)),null);assert.equal(await store!.settleCreation(worker,claim,{outcome:'success',result:{proposal:'late'}}),false);
  assert.equal((await admin.query("SELECT count(*)::int AS count FROM usage_ledger WHERE operation_id=$1 AND kind IN('consume','release')",[job])).rows[0].count,0);
 }finally{await admin.query('DELETE FROM usage_ledger WHERE operation_id=$1',[job]);await admin.query('DELETE FROM operations WHERE id=$1',[job]);}
},true)));
test('pre-start recovery requeues safely and current revocation denies the next external grant',async()=>withCreationQueueFixture(()=>fixture(async f=>{
 const claim=await store!.claimCreation(worker,f.wake(0));assert.ok(claim);await admin.query("UPDATE creation_jobs SET lease_until=clock_timestamp()-interval '1 second'WHERE operation_id=$1",[f.jobs[0]]);await store!.recoverCreation(scheduler,f.wake(0));
 const fresh=await store!.claimCreation(worker,f.wake(0));assert.ok(fresh);assert.notEqual(fresh.token,claim.token);assert.equal(await store!.beginCreationAttempt(worker,claim),null);
 await admin.query("UPDATE memberships SET status='revoked'WHERE workspace_id=$1 AND user_id=$2",[f.workspaces[0],f.user]);assert.equal(await store!.beginCreationAttempt(worker,fresh),null);assert.equal((await admin.query('SELECT state FROM operations WHERE id=$1',[f.jobs[0]])).rows[0].state,'failed');
})));
test('readonly extraction crash recovery spends the finite transient budget',async()=>withCreationQueueFixture(()=>fixture(async f=>{
 for(let index=1;index<=3;index++){
  const claim=await store!.claimCreation(worker,f.wake(0));assert.ok(claim);assert.ok(await store!.beginCreationAttempt(worker,claim));await admin.query("UPDATE creation_jobs SET lease_until=clock_timestamp()-interval '1 second'WHERE operation_id=$1",[f.jobs[0]]);assert.equal(await store!.recoverCreation(scheduler,f.wake(0)),true);
  const job=(await admin.query('SELECT failure_attempts,phase FROM creation_jobs WHERE operation_id=$1',[f.jobs[0]])).rows[0];assert.equal(job.failure_attempts,index);assert.equal(job.phase,index<3?'pending':'settled');
 }
 assert.equal((await admin.query('SELECT error FROM operations WHERE id=$1',[f.jobs[0]])).rows[0].error.code,'CREATION_RETRY_EXHAUSTED');
})));
test('definitive settlement writes one immutable attempt, usage and outbox effect',async()=>withCreationQueueFixture(()=>fixture(async f=>{
 const claim=await store!.claimCreation(worker,f.wake(0));assert.ok(claim);assert.ok(await store!.beginCreationAttempt(worker,claim));assert.equal(await store!.settleCreation(worker,claim,{outcome:'success',result:{proposal:'Owned contract fixture'}}),true);assert.equal(await store!.settleCreation(worker,claim,{outcome:'success',result:{proposal:'Duplicate'}}),false);
 assert.equal((await admin.query("SELECT count(*)::int AS count FROM creation_attempts WHERE workspace_id=$1 AND operation_id=$2 AND phase='settled'",[f.workspaces[0],f.jobs[0]])).rows[0].count,1);
 assert.equal((await admin.query("SELECT count(*)::int AS count FROM outbox WHERE workspace_id=$1 AND aggregate_id=$2 AND type='brand.extract.completed'",[f.workspaces[0],f.jobs[0]])).rows[0].count,1);
 const probe=await admin.connect();try{await probe.query('BEGIN');await probe.query('SET LOCAL ROLE mailcraft_runtime');await assert.rejects(probe.query('UPDATE creation_attempts SET outcome_code=NULL'),/permission denied/);}finally{await probe.query('ROLLBACK');probe.release();}
})));
test('expired queued credentials deny once and release only unused reservation',async()=>withCreationQueueFixture(()=>fixture(async f=>{
 const key=randomUUID();await admin.query("INSERT INTO api_keys(workspace_id,id,key_hash,name,scopes,created_by,expires_at)VALUES($1,$2,$3,'Creation expiry fixture','[\"brands:write\"]',$4,clock_timestamp()-interval '1 second')",[f.workspaces[0],key,randomUUID(),f.user]);await admin.query('UPDATE operations SET created_api_key_id=$2 WHERE id=$1',[f.jobs[0],key]);await admin.query("INSERT INTO usage_ledger(workspace_id,operation_id,metric,kind,units)VALUES($1,$2,'fixture','reserve',1)",[f.workspaces[0],f.jobs[0]]);
 assert.equal(await store!.claimCreation(worker,f.wake(0)),null);assert.equal(await store!.claimCreation(worker,f.wake(0)),null);assert.equal((await admin.query('SELECT state,error FROM operations WHERE id=$1',[f.jobs[0]])).rows[0].state,'failed');assert.equal((await admin.query("SELECT count(*)::int AS count FROM usage_ledger WHERE operation_id=$1 AND kind='release'",[f.jobs[0]])).rows[0].count,1);
})));
test('creation runtime sees only tenant metadata and cannot write private queue authority',async()=>withCreationQueueFixture(()=>fixture(async f=>{
 const claim=await store!.claimCreation(worker,f.wake(0));assert.ok(claim);
 const run=(query:string)=>tenant(f.workspaces[0],f.user,tx=>tx.query(query));
 assert.equal((await run('SELECT DISTINCT workspace_id FROM creation_jobs')).rows.length,1);
 for(const query of['SELECT lease_token FROM creation_jobs','UPDATE creation_jobs SET phase=\'pending\'','DELETE FROM creation_attempts','UPDATE operations SET input=\'{}\'','DELETE FROM operations','SELECT mailcraft_claim_creation(null,null,null)','SET ROLE mailcraft_creation_admin'])await assert.rejects(run(query),/permission denied/);
 await assert.rejects(scheduler.query('SELECT mailcraft_begin_creation($1,$2,$3)',[claim.workspace_id,claim.operation_id,claim.token]),/permission denied/);
 const forged={...claim,workspace_id:f.workspaces[1]};assert.equal(await store!.beginCreationAttempt(worker,forged),null);assert.equal(await store!.settleCreation(worker,forged,{outcome:'terminal'}),false);
 const roles=(await admin.query("SELECT rolname,rolsuper,rolbypassrls,rolcanlogin,rolcreaterole FROM pg_roles WHERE rolname IN('mailcraft_creation_admin','mailcraft_creation_worker','mailcraft_creation_scheduler')")).rows;assert.equal(roles.length,3);assert.ok(roles.every(role=>!role.rolsuper&&!role.rolbypassrls&&!role.rolcanlogin&&!role.rolcreaterole));
})));
test('queued backlog rejects new admission before any outbox or reservation is added',async()=>withCreationQueueFixture(()=>fixture(async f=>{
 await admin.query("INSERT INTO operations(workspace_id,type,input,created_by)SELECT $1,'brand.extract','{\"url\":\"https://example.org\"}',$2 FROM generate_series(1,998)",[f.workspaces[0],f.user]);
 const before=(await admin.query('SELECT count(*)::int AS count FROM operations WHERE workspace_id=$1',[f.workspaces[0]])).rows[0].count;assert.equal(before,1000);
 await assert.rejects(tenant(f.workspaces[0],f.user,tx=>operation(tx,{workspace:f.workspaces[0],user:f.user,role:'Owner'},'brand.extract',{url:'https://example.org'})),error=>error instanceof AppError&&error.code==='CREATION_BACKLOG_FULL');
 assert.equal((await admin.query('SELECT count(*)::int AS count FROM operations WHERE workspace_id=$1',[f.workspaces[0]])).rows[0].count,before);assert.equal((await admin.query('SELECT count(*)::int AS count FROM outbox WHERE workspace_id=$1',[f.workspaces[0]])).rows[0].count,0);
})));
test('a queued retry that loses its execution window ends without leaking its unused reservation',async()=>withCreationQueueFixture(()=>fixture(async f=>{
 const claim=await store!.claimCreation(worker,f.wake(0));assert.ok(claim);await admin.query("UPDATE creation_jobs SET lease_until=clock_timestamp()-interval '1 second'WHERE operation_id=$1",[f.jobs[0]]);await store!.recoverCreation(scheduler,f.wake(0));await admin.query("UPDATE creation_jobs SET deadline_at=clock_timestamp()-interval '1 second'WHERE operation_id=$1",[f.jobs[0]]);await admin.query("INSERT INTO usage_ledger(workspace_id,operation_id,metric,kind,units)VALUES($1,$2,'fixture','reserve',1)",[f.workspaces[0],f.jobs[0]]);
 assert.equal(await store!.claimCreation(worker,f.wake(0)),null);const ended=(await admin.query('SELECT state,error FROM operations WHERE id=$1',[f.jobs[0]])).rows[0];assert.equal(ended.state,'failed');assert.equal(ended.error.code,'CREATION_RETRY_WINDOW_EXHAUSTED');assert.equal((await admin.query("SELECT count(*)::int AS count FROM usage_ledger WHERE operation_id=$1 AND kind='release'",[f.jobs[0]])).rows[0].count,1);
})));
test('ready batches interleave tenant work instead of draining one workspace backlog',async()=>withCreationQueueFixture(()=>fixture(async f=>{
 const due=(await store!.dueCreation(scheduler)).filter(item=>f.workspaces.includes(item.workspace_id));assert.equal(due.length,3);assert.notEqual(due[0].workspace_id,due[1].workspace_id);assert.equal(due[2].workspace_id,f.workspaces[0]);
})));
test('credential expiry while an unchanged job row is locked denies before admission',async()=>withCreationQueueFixture(()=>fixture(async f=>{
 const key=randomUUID();await admin.query("INSERT INTO api_keys(workspace_id,id,key_hash,name,scopes,created_by,expires_at)VALUES($1,$2,$3,'Creation lock expiry','[\"brands:write\"]',$4,clock_timestamp()+interval '1 second')",[f.workspaces[0],key,randomUUID(),f.user]);await admin.query('UPDATE operations SET created_api_key_id=$2 WHERE id=$1',[f.jobs[0],key]);
 const blocker=await admin.connect();let pending:Promise<unknown>|undefined;try{await blocker.query('BEGIN');const pid=(await blocker.query('SELECT pg_backend_pid()AS pid')).rows[0].pid;await blocker.query('SELECT operation_id FROM creation_jobs WHERE operation_id=$1 FOR UPDATE',[f.jobs[0]]);pending=store!.claimCreation(worker,f.wake(0));let blocked=false;for(let i=0;i<100;i++){blocked=!!(await admin.query('SELECT FROM pg_stat_activity WHERE $1::int=ANY(pg_blocking_pids(pid))',[pid])).rowCount;if(blocked)break;await new Promise(resolve=>setTimeout(resolve,10));}assert.equal(blocked,true);while(!(await admin.query('SELECT expires_at<=clock_timestamp()AS expired FROM api_keys WHERE id=$1',[key])).rows[0].expired)await new Promise(resolve=>setTimeout(resolve,10));await blocker.query('COMMIT');assert.equal(await pending,null);assert.equal((await admin.query('SELECT state FROM operations WHERE id=$1',[f.jobs[0]])).rows[0].state,'failed');}finally{await blocker.query('ROLLBACK');blocker.release();await pending?.catch(()=>undefined);}
})));
test('generation cancellation after known success consumes once and suppresses the proposal',async()=>withCreationQueueFixture(()=>fixture(async f=>{
 await admin.query("INSERT INTO usage_ledger(workspace_id,operation_id,metric,kind,units)VALUES($1,$2,'generation','reserve',1)",[f.workspaces[0],f.jobs[0]]);
 const claim=await store!.claimCreation(worker,f.wake(0));assert.ok(claim);assert.ok(await store!.beginCreationAttempt(worker,claim));await admin.query("UPDATE operations SET state='cancel_requested' WHERE id=$1",[f.jobs[0]]);
 assert.equal(await store!.settleCreation(worker,claim,{outcome:'success',result:{proposals:[]}}),true);assert.equal(await store!.settleCreation(worker,claim,{outcome:'success',result:{proposals:[]}}),false);
 const ended=(await admin.query('SELECT state,result FROM operations WHERE id=$1',[f.jobs[0]])).rows[0];assert.equal(ended.state,'cancelled');assert.equal(ended.result,null);
 assert.deepEqual((await admin.query("SELECT kind FROM usage_ledger WHERE operation_id=$1 AND kind<>'reserve'",[f.jobs[0]])).rows.map(r=>r.kind),['consume']);
},true)));
test('cancellation before external start releases once and scope removal denies the next claim',async()=>withCreationQueueFixture(()=>fixture(async f=>{
 await admin.query("INSERT INTO usage_ledger(workspace_id,operation_id,metric,kind,units)VALUES($1,$2,'fixture','reserve',1)",[f.workspaces[0],f.jobs[0]]);const claim=await store!.claimCreation(worker,f.wake(0));assert.ok(claim);await admin.query("UPDATE operations SET state='cancel_requested' WHERE id=$1",[f.jobs[0]]);assert.equal(await store!.beginCreationAttempt(worker,claim),null);assert.equal(await store!.beginCreationAttempt(worker,claim),null);
 assert.equal((await admin.query("SELECT count(*)::int AS count FROM usage_ledger WHERE operation_id=$1 AND kind='release'",[f.jobs[0]])).rows[0].count,1);
 const key=randomUUID();await admin.query("INSERT INTO api_keys(workspace_id,id,key_hash,name,scopes,created_by,expires_at)VALUES($1,$2,$3,'Wrong scope','[\"emails:write\"]',$4,clock_timestamp()+interval '1 hour')",[f.workspaces[0],key,randomUUID(),f.user]);await admin.query('UPDATE operations SET created_api_key_id=$2 WHERE id=$1',[f.jobs[1],key]);assert.equal(await store!.claimCreation(worker,f.wake(1)),null);assert.equal((await admin.query('SELECT state FROM operations WHERE id=$1',[f.jobs[1]])).rows[0].state,'failed');
})));
test('rate deferral preserves failures and stops when Retry-After exceeds the original window',async()=>withCreationQueueFixture(()=>fixture(async f=>{
 const claim=await store!.claimCreation(worker,f.wake(0));assert.ok(claim);assert.ok(await store!.beginCreationAttempt(worker,claim));assert.equal(await store!.settleCreation(worker,claim,{outcome:'rate_limited',retry_after_ms:5000}),true);
 const job=(await admin.query('SELECT failure_attempts,next_at>clock_timestamp()+interval \'4 seconds\' AS deferred FROM creation_jobs WHERE operation_id=$1',[f.jobs[0]])).rows[0];assert.equal(job.failure_attempts,0);assert.equal(job.deferred,true);assert.equal(await store!.claimCreation(worker,f.wake(0)),null);
 await admin.query('UPDATE creation_jobs SET next_at=clock_timestamp() WHERE operation_id=$1',[f.jobs[0]]);const fresh=await store!.claimCreation(worker,f.wake(0));assert.ok(fresh);assert.ok(await store!.beginCreationAttempt(worker,fresh));assert.equal(await store!.settleCreation(worker,fresh,{outcome:'rate_limited',retry_after_ms:86400000}),true);assert.equal((await admin.query('SELECT error FROM operations WHERE id=$1',[f.jobs[0]])).rows[0].error.code,'CREATION_RETRY_WINDOW_EXHAUSTED');
})));
test('terminal recovery emits one atomic outbox effect and rejects empty success evidence',async()=>withCreationQueueFixture(()=>fixture(async f=>{
 const claim=await store!.claimCreation(worker,f.wake(0));assert.ok(claim);assert.ok(await store!.beginCreationAttempt(worker,claim));await assert.rejects(worker.query("SELECT mailcraft_settle_creation($1,$2,$3,'success',NULL,NULL)",[claim.workspace_id,claim.operation_id,claim.token]),/CREATION_OUTCOME_INVALID/);
 await admin.query("UPDATE creation_jobs SET lease_until=clock_timestamp()-interval '1 second' WHERE operation_id=$1",[f.jobs[0]]);assert.equal(await store!.recoverCreation(scheduler,f.wake(0)),true);assert.equal(await store!.recoverCreation(scheduler,f.wake(0)),false);
 assert.equal((await admin.query("SELECT count(*)::int AS count FROM outbox WHERE aggregate_id=$1 AND type='email.generate.failed'",[f.jobs[0]])).rows[0].count,1);
},true)));
test('credential expiry during a renewal lock wait cannot extend the existing execution lease',async()=>withCreationQueueFixture(()=>fixture(async f=>{
 const key=randomUUID();await admin.query("INSERT INTO api_keys(workspace_id,id,key_hash,name,scopes,created_by,expires_at)VALUES($1,$2,$3,'Renew expiry','[\"brands:write\"]',$4,clock_timestamp()+interval '1 second')",[f.workspaces[0],key,randomUUID(),f.user]);await admin.query('UPDATE operations SET created_api_key_id=$2 WHERE id=$1',[f.jobs[0],key]);const claim=await store!.claimCreation(worker,f.wake(0));assert.ok(claim);
 const blocker=await admin.connect();let pending:Promise<boolean>|undefined;try{await blocker.query('BEGIN');const pid=(await blocker.query('SELECT pg_backend_pid()AS pid')).rows[0].pid;await blocker.query('SELECT operation_id FROM creation_jobs WHERE operation_id=$1 FOR UPDATE',[f.jobs[0]]);pending=store!.renewCreation(worker,claim);let blocked=false;for(let i=0;i<100;i++){blocked=!!(await admin.query('SELECT FROM pg_stat_activity WHERE $1::int=ANY(pg_blocking_pids(pid))',[pid])).rowCount;if(blocked)break;await new Promise(resolve=>setTimeout(resolve,10));}assert.equal(blocked,true);let expired=false;for(let i=0;i<200;i++){expired=(await admin.query('SELECT expires_at<=clock_timestamp()AS expired FROM api_keys WHERE id=$1',[key])).rows[0].expired;if(expired)break;await new Promise(resolve=>setTimeout(resolve,10));}assert.equal(expired,true);await blocker.query('COMMIT');assert.equal(await pending,false);}finally{await blocker.query('ROLLBACK');blocker.release();await pending?.catch(()=>undefined);}
})));
