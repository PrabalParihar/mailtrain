import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import pg from 'pg';
import env from '@next/env';
import {withCreationDatabase} from './fixtures/creation-database';
env.loadEnvConfig(process.cwd());

async function fixture(db:pg.Pool) {
 const workspace=randomUUID(),sender=randomUUID(),user='sender-storage-'+randomUUID();
 await db.query("INSERT INTO workspaces(id,name)VALUES($1,'Owned sender storage')",[workspace]);
 await db.query("INSERT INTO memberships(workspace_id,user_id,role)VALUES($1,$2,'Owner')",[workspace,user]);
 return {workspace,sender,user};
}
async function runtime<T>(db:pg.Pool,f:{workspace:string;user:string},run:(tx:pg.PoolClient)=>Promise<T>) {
 const tx=await db.connect();try{await tx.query('BEGIN');await tx.query("SELECT set_config('app.workspace_id',$1,true),set_config('app.user_id',$2,true)",[f.workspace,f.user]);const result=await run(tx);await tx.query('COMMIT');return result;}catch(e){await tx.query('ROLLBACK');throw e;}finally{tx.release();}
}
function insert(tx:pg.PoolClient,f:{workspace:string;sender:string;user:string},version=1) {
 return tx.query("INSERT INTO sender_identities(workspace_id,id,version,name,provider,account_label,region,from_name,from_address,reply_to,domain,created_by)VALUES($1,$2,$4,'Synthetic sender','ses','Operator reference','us-east-1','Sender','sender@example.com',NULL,'example.com',$3)RETURNING *",[f.workspace,f.sender,f.user,version]);
}
function observation(domain='example.com') {
 return {domain,observed_at:new Date().toISOString(),scope:'exact_domain_txt',spf:{owner:domain,records:['v=spf1 -all'],status:'single_record'},dmarc:{owner:'_dmarc.'+domain,records:[],status:'missing'},provider_verified:false,authentication_verified:false,sending_enabled:false};
}
function check(tx:pg.PoolClient,f:{workspace:string;sender:string;user:string},version=1,value=observation()) {
 return tx.query('INSERT INTO domain_checks(workspace_id,sender_id,sender_version,observation,created_by)VALUES($1,$2,$3,$4,$5)RETURNING *',[f.workspace,f.sender,version,JSON.stringify(value),f.user]);
}
const code=(value:string)=>(e:unknown)=>(e as {code?:string}).code===value;
async function isolated(run:(db:pg.Pool,app:pg.Pool)=>Promise<void>) {
 await withCreationDatabase(async connection=>{const db=new pg.Pool({connectionString:connection}),app=new pg.Pool({connectionString:connection,options:'-c role=mailcraft_runtime'});try{await run(db,app);}finally{await Promise.all([app.end(),db.end()]);}});
}

test('sender tables force tenant RLS, strict composite references and restricted immutable captures',async()=>isolated(async(db,app)=>{
 const f=await fixture(db),other=await fixture(db);await runtime(app,f,tx=>insert(tx,f));await runtime(app,other,tx=>insert(tx,other));
 for(const table of ['sender_identities','sender_identity_versions','domain_checks']) {
  const security=(await db.query('SELECT relrowsecurity,relforcerowsecurity FROM pg_class WHERE oid=$1::regclass',[table])).rows[0];assert.deepEqual(security,{relrowsecurity:true,relforcerowsecurity:true});
 }
 const histories=await runtime(app,f,tx=>tx.query('SELECT * FROM sender_identity_versions'));assert.equal(histories.rowCount,1);assert.equal(histories.rows[0].sender_id,f.sender);assert.equal(histories.rows[0].created_by,f.user);
 assert.equal((await runtime(app,f,tx=>tx.query('SELECT * FROM sender_identities WHERE id=$1',[other.sender]))).rowCount,0);
 await runtime(app,f,tx=>check(tx,f));assert.equal((await runtime(app,other,tx=>tx.query('SELECT * FROM domain_checks'))).rowCount,0);
 await assert.rejects(runtime(app,f,tx=>check(tx,{...f,sender:other.sender})),/SENDER_CHECK_SOURCE_REQUIRED|23503/);
 await assert.rejects(db.query('INSERT INTO domain_checks(workspace_id,sender_id,sender_version,observation,created_by)VALUES($1,$2,1,$3,$4)',[f.workspace,other.sender,JSON.stringify(observation()),f.user]),code('23503'));
 for(const command of ['INSERT','UPDATE','DELETE'])assert.equal((await db.query('SELECT has_table_privilege($1,$2,$3)AS allowed',['mailcraft_runtime','sender_identity_versions',command])).rows[0].allowed,false);
 await assert.rejects(runtime(app,f,tx=>tx.query('INSERT INTO sender_identity_versions(workspace_id,sender_id,version,snapshot,created_by)SELECT workspace_id,id,99,to_jsonb(sender_identities),created_by FROM sender_identities')),code('42501'));
 await assert.rejects(runtime(app,f,tx=>tx.query('UPDATE sender_identity_versions SET snapshot=\'{}\'')),code('42501'));
 await assert.rejects(runtime(app,f,tx=>tx.query('DELETE FROM sender_identity_versions')),code('42501'));
 await assert.rejects(db.query('UPDATE sender_identity_versions SET snapshot=\'{}\''),/SENDER_HISTORY_IMMUTABLE/);
 await assert.rejects(runtime(app,f,tx=>tx.query('UPDATE domain_checks SET observation=$1',[JSON.stringify(observation())])),code('42501'));
 await assert.rejects(runtime(app,f,tx=>tx.query('DELETE FROM domain_checks')),code('42501'));
 await assert.rejects(db.query('UPDATE domain_checks SET created_by=\'forged\''),/SENDER_HISTORY_IMMUTABLE/);
 await assert.rejects(runtime(app,f,tx=>tx.query('DELETE FROM sender_identities')),code('42501'));
 const capture=(await db.query("SELECT rolcanlogin,rolsuper,rolbypassrls,rolcreatedb,rolcreaterole FROM pg_roles WHERE rolname='mailcraft_campaign_history_admin'")).rows[0];assert.equal(Object.values(capture).some(Boolean),false);
 assert.equal((await db.query("SELECT pg_has_role('mailcraft_runtime','mailcraft_campaign_history_admin','MEMBER')AS allowed")).rows[0].allowed,false);
 await assert.rejects(db.query('INSERT INTO domain_checks(workspace_id,sender_id,sender_version,observation,created_by)VALUES($1,$2,99,$3,$4)',[f.workspace,f.sender,JSON.stringify(observation()),f.user]),code('23503'));
 // Cleanup is exact to synthetic workspace IDs and explicitly uses the trusted fixture operator.
 await db.query('DELETE FROM domain_checks WHERE workspace_id=ANY($1::uuid[])',[[f.workspace,other.workspace]]);
 await db.query('DELETE FROM sender_identities WHERE workspace_id=ANY($1::uuid[])',[[f.workspace,other.workspace]]);
 assert.equal((await db.query('SELECT count(*)::int AS n FROM sender_identity_versions')).rows[0].n,0);
}));

test('sender material changes require the exact next version, capture canonical snapshots and roll back atomically',async()=>isolated(async(db,app)=>{
 const f=await fixture(db);const original=(await runtime(app,f,tx=>insert(tx,f))).rows[0];assert.equal(original.connection_status,'not_connected');assert.equal(original.sending_enabled,false);
 await assert.rejects(runtime(app,f,tx=>tx.query("UPDATE sender_identities SET account_label='Changed'WHERE id=$1",[f.sender])),/SENDER_VERSION_REQUIRED/);
 await assert.rejects(runtime(app,f,tx=>tx.query('UPDATE sender_identities SET version=version+1 WHERE id=$1',[f.sender])),/SENDER_VERSION_REQUIRED/);
 await assert.rejects(runtime(app,f,tx=>tx.query("UPDATE sender_identities SET name='Skipped',version=version+2 WHERE id=$1",[f.sender])),/SENDER_VERSION_REQUIRED/);
 const saved=(await runtime(app,f,tx=>tx.query("UPDATE sender_identities SET account_label='Second reference',region='eu-west-1',from_address='news@example.org',domain='example.org',version=version+1 WHERE id=$1 RETURNING *",[f.sender]))).rows[0];assert.equal(saved.version,2);
 await runtime(app,f,tx=>tx.query('UPDATE sender_identities SET name=name WHERE id=$1',[f.sender]));
 const history=(await db.query('SELECT * FROM sender_identity_versions WHERE sender_id=$1 ORDER BY version',[f.sender])).rows;
 assert.deepEqual(history.map(row=>[row.version,row.snapshot.account_label,row.snapshot.region,row.snapshot.domain]),[[1,'Operator reference','us-east-1','example.com'],[2,'Second reference','eu-west-1','example.org']]);
 assert.deepEqual(Object.keys(history[0].snapshot).sort(),['name','provider','account_label','region','from_name','from_address','reply_to','domain'].sort());
 assert.equal(history[1].created_by,f.user);
 await assert.rejects(runtime(app,f,async tx=>{await tx.query("UPDATE sender_identities SET name='Rollback',version=version+1 WHERE id=$1",[f.sender]);throw new Error('Owned sender rollback');}),/Owned sender rollback/);
 assert.equal((await db.query('SELECT version,name FROM sender_identities WHERE id=$1',[f.sender])).rows[0].version,2);assert.equal((await db.query('SELECT count(*)::int AS n FROM sender_identity_versions WHERE sender_id=$1',[f.sender])).rows[0].n,2);
 await assert.rejects(runtime(app,f,tx=>insert(tx,{...f,sender:randomUUID()},7)),/SENDER_VERSION_REQUIRED/);
}));

test('sender storage denies domain, identity, readiness and DNS source/evidence forgery',async()=>isolated(async(db,app)=>{
 const f=await fixture(db);await runtime(app,f,tx=>insert(tx,f));await runtime(app,f,tx=>check(tx,f));
 for(const assignment of ["domain='evil.example',version=2","connection_status='connected'","sending_enabled=true","created_by='another'","id=gen_random_uuid()","from_address='sender@localhost',domain='localhost',version=2"])
  await assert.rejects(runtime(app,f,tx=>tx.query('UPDATE sender_identities SET '+assignment+' WHERE id=$1',[f.sender])),/SENDER_DOMAIN_DERIVED|SENDER_IDENTITY_IMMUTABLE|SENDER_DRAFT_INVALID|check constraint/);
 for(const value of [{...observation(),provider_verified:true},{...observation(),authentication_verified:true},{...observation(),sending_enabled:true},{...observation(),private_key:'not-a-key'},observation('evil.example'),{...observation(),spf:{owner:'example.com',records:['v=spf1 -all','v=spf1 +all'],status:'single_record'}},{...observation(),dmarc:{owner:'_dmarc.example.com',records:['x'.repeat(4097)],status:'single_record'}}])
  await assert.rejects(runtime(app,f,tx=>check(tx,f,1,value as ReturnType<typeof observation>)),/SENDER_CHECK_SOURCE_REQUIRED|SENDER_DNS_INVALID|check constraint/);
 for(const assignment of ["name='',version=2","region=repeat('r',41),version=2","account_label=repeat('a',101),version=2","provider='generic',version=2","reply_to='reply@localhost',version=2","from_address='a@127.0.0.1',domain='127.0.0.1',version=2"])
  await assert.rejects(runtime(app,f,tx=>tx.query('UPDATE sender_identities SET '+assignment+' WHERE id=$1',[f.sender])),code('23514'));
 for(const value of [
  {...observation(),observed_at:'not-a-date'},
  {...observation(),spf:{owner:'example.com',records:Array(41).fill('v=spf1 -all'),status:'multiple_records'}},
  {...observation(),spf:{owner:'example.com',records:Array(9).fill('v=spf1 '+ 'x'.repeat(4089)),status:'multiple_records'}},
  {...observation(),spf:{owner:'example.com',records:[],status:'missing',credential:'not-a-credential'}},
  {...observation(),dmarc:{owner:'_dmarc.example.com',records:[],status:'unavailable',error:'raw resolver details'}},
 ])await assert.rejects(runtime(app,f,tx=>check(tx,f,1,value as ReturnType<typeof observation>)),code('23514'));
 await assert.rejects(runtime(app,f,tx=>check(tx,{...f,user:'forged-actor'})),/SENDER_IDENTITY_IMMUTABLE/);
 const unavailable={...observation(),spf:{owner:'example.com',records:[],status:'unavailable',error:'timeout'},dmarc:{owner:'_dmarc.example.com',records:[],status:'missing',error:'not_found'}};
 await runtime(app,f,tx=>check(tx,f,1,unavailable as ReturnType<typeof observation>));
 await runtime(app,f,tx=>tx.query("UPDATE sender_identities SET provider='resend',version=2 WHERE id=$1",[f.sender]));
 await assert.rejects(runtime(app,f,tx=>check(tx,f,1)),/SENDER_CHECK_SOURCE_REQUIRED/);
 assert.deepEqual((await db.query('SELECT sender_version FROM domain_checks WHERE sender_id=$1',[f.sender])).rows.map(row=>row.sender_version),[1,1]);
 await runtime(app,f,tx=>check(tx,f,2));assert.equal((await db.query('SELECT count(*)::int AS n FROM domain_checks WHERE sender_id=$1',[f.sender])).rows[0].n,3);
}));

test('only current Owner/Admin managers and scoped current API-key delegators can read and write sender storage',async()=>isolated(async(db,app)=>{
 const f=await fixture(db);await runtime(app,f,tx=>insert(tx,f));
 for(const role of ['Editor','Viewer','Billing']) {
  await db.query('UPDATE memberships SET role=$1 WHERE workspace_id=$2 AND user_id=$3',[role,f.workspace,f.user]);
  assert.equal((await runtime(app,f,tx=>tx.query('SELECT * FROM sender_identities'))).rowCount,0);
  await assert.rejects(runtime(app,f,tx=>insert(tx,{...f,sender:randomUUID()})),/row-level security|SENDER_MANAGER_REQUIRED/);
  await assert.rejects(runtime(app,f,tx=>check(tx,f)),/row-level security|SENDER_MANAGER_REQUIRED/);
 }
 await db.query("UPDATE memberships SET role='Admin' WHERE workspace_id=$1 AND user_id=$2",[f.workspace,f.user]);
 const key=randomUUID();await db.query("INSERT INTO api_keys(workspace_id,id,key_hash,name,scopes,created_by,expires_at)VALUES($1,$2,$3,'Owned sender key','[\"sender:read\",\"sender:write\"]',$4,clock_timestamp()+interval '1 hour')",[f.workspace,key,randomUUID(),f.user]);
 const keyActor={...f,user:'api-key:'+key};await runtime(app,keyActor,tx=>insert(tx,{...keyActor,sender:randomUUID()}));
 await db.query("UPDATE api_keys SET scopes='[\"sender:read\"]'WHERE id=$1",[key]);
 assert.equal((await runtime(app,keyActor,tx=>tx.query('SELECT * FROM sender_identities'))).rowCount,2);
 await assert.rejects(runtime(app,keyActor,tx=>check(tx,keyActor)),/row-level security|SENDER_MANAGER_REQUIRED/);
 await db.query("UPDATE api_keys SET scopes='[\"sender:write\"]',expires_at=clock_timestamp()-interval '1 second'WHERE id=$1",[key]);
 assert.equal((await runtime(app,keyActor,tx=>tx.query('SELECT * FROM sender_identities'))).rowCount,0);
 await db.query("UPDATE api_keys SET expires_at=clock_timestamp()+interval '1 hour',revoked_at=clock_timestamp()WHERE id=$1",[key]);
 await assert.rejects(runtime(app,keyActor,tx=>insert(tx,{...keyActor,sender:randomUUID()})),/row-level security|SENDER_MANAGER_REQUIRED/);
 await db.query("UPDATE memberships SET status='revoked'WHERE workspace_id=$1 AND user_id=$2",[f.workspace,f.user]);
 assert.equal((await runtime(app,f,tx=>tx.query('SELECT * FROM sender_identity_versions'))).rowCount,0);
}));

test('sender mutations and DNS captures recheck current manager authority after actual sender lock waits',async()=>isolated(async(db,app)=>{
 const f=await fixture(db);await runtime(app,f,tx=>insert(tx,f));
 const key=randomUUID();await db.query("INSERT INTO api_keys(workspace_id,id,key_hash,name,scopes,created_by,expires_at)VALUES($1,$2,$3,'Owned waiting key','[\"sender:write\"]',$4,clock_timestamp()+interval '1 hour')",[f.workspace,key,randomUUID(),f.user]);
 for(const kind of ['member-update','key-check']) {
  const blocker=await db.connect(),writer=await app.connect();let pending:Promise<unknown>|undefined;
  try {
   await blocker.query('BEGIN');await blocker.query('SELECT id FROM sender_identities WHERE id=$1 FOR UPDATE',[f.sender]);
   await writer.query('BEGIN');await writer.query("SELECT set_config('app.workspace_id',$1,true),set_config('app.user_id',$2,true)",[f.workspace,kind==='member-update'?f.user:'api-key:'+key]);
   const pid=(await writer.query('SELECT pg_backend_pid()AS pid')).rows[0].pid;
   pending=(kind==='member-update'?writer.query("UPDATE sender_identities SET name='Denied after wait',version=2 WHERE id=$1",[f.sender]):check(writer,{...f,user:'api-key:'+key})).then(result=>({result}),error=>({error}));
   const deadline=Date.now()+3000;let waiting=false;
   while(Date.now()<deadline){waiting=(await db.query('SELECT cardinality(pg_blocking_pids($1))>0 AS waiting',[pid])).rows[0].waiting;if(waiting)break;await new Promise(resolve=>setTimeout(resolve,10));}
   assert.equal(waiting,true,'The production write must actually wait for the held sender lock.');
   if(kind==='member-update')await db.query("UPDATE memberships SET role='Viewer'WHERE workspace_id=$1 AND user_id=$2",[f.workspace,f.user]);
   else await db.query('UPDATE api_keys SET revoked_at=clock_timestamp()WHERE id=$1',[key]);
   await blocker.query('COMMIT');
   const outcome=await pending as {error?:Error};assert.match(outcome.error?.message??'',/SENDER_MANAGER_REQUIRED/);
   await writer.query('ROLLBACK');
   if(kind==='member-update')await db.query("UPDATE memberships SET role='Owner'WHERE workspace_id=$1 AND user_id=$2",[f.workspace,f.user]);
  }finally{await blocker.query('ROLLBACK');await pending;await writer.query('ROLLBACK');blocker.release();writer.release();}
 }
 assert.equal((await db.query('SELECT version FROM sender_identities WHERE id=$1',[f.sender])).rows[0].version,1);
 assert.equal((await db.query('SELECT count(*)::int AS n FROM sender_identity_versions WHERE sender_id=$1',[f.sender])).rows[0].n,1);
 assert.equal((await db.query('SELECT count(*)::int AS n FROM domain_checks WHERE sender_id=$1',[f.sender])).rows[0].n,0);
}));
