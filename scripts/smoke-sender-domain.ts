import assert from 'node:assert/strict';
import {randomBytes,randomUUID} from 'node:crypto';
import pg from 'pg';
import env from '@next/env';
import {digest} from '../src/server/audit';
import {SenderView,DNSCheckView,SenderVersionView} from '../src/domain/sender-domain';
import {apiSpec,validateSchema} from './api-validation';
env.loadEnvConfig(process.cwd());
const origin=process.env.APP_ORIGIN??'http://127.0.0.1:3003';
if(process.env.LOCAL_DEVELOPMENT!=='true'||!['localhost','127.0.0.1'].includes(new URL(origin).hostname))throw new Error('Owned local sender fixture required.');
if(process.argv.includes('--route-red')) {
 const response=await fetch(origin+'/v1/sender-identities');
 assert.equal(response.status,401,'Sender route must reach authentication instead of an absent route/handler; RED.');
 console.log('Sender route existence probe passed.');
} else {
 const db=new pg.Pool({connectionString:process.env.MIGRATION_DATABASE_URL});
 const workspace=randomUUID(),other=randomUUID(),user='sender-http-'+randomUUID(),cookie=randomBytes(32).toString('hex');
 const body={name:'Synthetic sender',provider:'ses',account_label:'Operator reference only',region:'us-east-1',from_name:'Synthetic sender',from_address:'Team@BÜCHER.test',reply_to:null};
 async function call(path:string,method='GET',input?:unknown,key:string|null=randomUUID(),w=workspace,bearer?:string,session=cookie) {
  const r=await fetch(origin+'/v1/'+path,{method,signal:AbortSignal.timeout(15000),headers:{Origin:origin,'Content-Type':'application/json',...(key?{'Idempotency-Key':key}:{}),...(bearer?{Authorization:'Bearer '+bearer}:{Cookie:'mailcraft_local_session='+session,'X-Workspace-Id':w})},body:input===undefined?undefined:JSON.stringify(input)});
  const j=await r.json();return{r,j};
 }
 function contract(path:string,method:string,result:{r:Response;j:unknown}) {
  const schema=apiSpec.paths['/v1/'+path]?.[method.toLowerCase()]?.responses[result.r.status]?.content?.['application/json']?.schema;
  assert.ok(schema,'Documented sender response required: '+method+' '+path+' '+result.r.status);validateSchema(schema,result.j);
 }
 async function expiresAfterWait(hold:(blocker:pg.PoolClient)=>Promise<unknown>,request:()=>ReturnType<typeof call>,deadline:Date) {
  const blocker=await db.connect();let pending:ReturnType<typeof call>|undefined;
  try {
   await blocker.query('BEGIN');await hold(blocker);const pid=(await blocker.query('SELECT pg_backend_pid()AS pid')).rows[0].pid;
   pending=request();const admitted=Date.now()+3000;let waiting=false;
   while(Date.now()<admitted){waiting=(await db.query('SELECT EXISTS(SELECT FROM pg_stat_activity WHERE $1=ANY(pg_blocking_pids(pid)))AS waiting',[pid])).rows[0].waiting;if(waiting)break;await new Promise(resolve=>setTimeout(resolve,10));}
   assert.equal(waiting,true,'The HTTP command must actually wait for the owned held lock.');
   await blocker.query('SELECT pg_sleep(greatest(0,extract(epoch FROM($1::timestamptz-clock_timestamp())))+0.05)',[deadline]);await blocker.query('COMMIT');
   const result=await pending;assert.equal(result.r.status,401,'Passively expired current authority must deny after an actual wait.');
  }finally{await blocker.query('ROLLBACK');await pending;blocker.release();}
 }
 try {
  await db.query("INSERT INTO workspaces(id,name,api_rpm)VALUES($1,'Owned sender HTTP',1000),($2,'Owned sender foreign',1000)",[workspace,other]);
  for(const w of[workspace,other])await db.query("INSERT INTO memberships(workspace_id,user_id,role)VALUES($1,$2,'Owner')",[w,user]);
  await db.query("INSERT INTO auth_sessions(token_hash,user_id,expires_at)VALUES($1,$2,clock_timestamp()+interval '1 hour')",[digest(cookie),user]);
  const empty=await call('sender-identities');assert.equal(empty.r.status,200);contract('sender-identities','GET',empty);assert.deepEqual(empty.j.data,[]);assert.equal(empty.j.total_count,0);assert.equal(empty.j.next_cursor,null);assert.equal(empty.j.has_more,false);
  assert.equal((await call('sender-identities','POST',body,null)).r.status,400);
  for(const extra of[{credential:'synthetic-only'},{private_key:'synthetic-only'},{connection_status:'connected'},{sending_enabled:true},{provider_verified:true},{domain:'invented.test'}])assert.equal((await call('sender-identities','POST',{...body,...extra})).r.status,422);
  for(const from_address of['a@localhost','a@127.0.0.1','a@https://example.test','a@example.test\nBcc:b@example.test'])assert.ok([400,422].includes((await call('sender-identities','POST',{...body,from_address})).r.status));
  const createKey=randomUUID(),created=await call('sender-identities','POST',body,createKey);assert.equal(created.r.status,201);contract('sender-identities','POST',created);SenderView.parse(created.j.sender);
  const sender=created.j.sender,path='sender-identities/'+sender.id;assert.equal(sender.version,1);assert.equal(sender.domain,'xn--bcher-kva.test');assert.equal(sender.from_address,'Team@xn--bcher-kva.test');assert.equal(sender.connection_status,'not_connected');assert.equal(sender.sending_enabled,false);
  const createReplay=await call('sender-identities','POST',body,createKey);assert.deepEqual(createReplay.j.sender,sender);assert.equal((await call('sender-identities','POST',{...body,name:'Different original'},createKey)).j.error.code,'IDEMPOTENCY_MISMATCH');
  const detail=await call(path);contract('sender-identities/{id}','GET',detail);assert.deepEqual(detail.j.sender,sender);
  const initial=await call(path+'/versions');contract('sender-identities/{id}/versions','GET',initial);assert.equal(initial.j.total_count,1);SenderVersionView.parse(initial.j.data[0]);assert.equal(initial.j.data[0].created_by,user);
  const checkKey=randomUUID(),firstCheck=await call(path+'/dns-checks','POST',{expected_version:1},checkKey);assert.equal(firstCheck.r.status,200);contract('sender-identities/{id}/dns-checks','POST',firstCheck);DNSCheckView.parse(firstCheck.j.check);
  assert.equal(firstCheck.j.check.sender_version,1);assert.equal(firstCheck.j.check.observation.domain,sender.domain);
  for(const purpose of['spf','dmarc']){assert.equal(firstCheck.j.check.observation[purpose].status,'unavailable');assert.equal(firstCheck.j.check.observation[purpose].error,'reserved_domain');assert.deepEqual(firstCheck.j.check.observation[purpose].records,[]);}
  for(const field of['provider_verified','authentication_verified','sending_enabled'])assert.equal(firstCheck.j.check.observation[field],false);
  const saveBody={...body,expected_version:1,provider:'resend',account_label:'Second reference',region:'global',reply_to:'help@EXAMPLE.test'},saveKey=randomUUID();
  assert.equal((await call(path+'/versions','POST',saveBody,null)).r.status,400);assert.equal((await call(path+'/dns-checks','POST',{expected_version:1},null)).r.status,400);
  for(const extra of[{credentials:{secret:'synthetic-only'}},{connection_status:'connected'},{sending_enabled:true}])assert.equal((await call(path+'/versions','POST',{...saveBody,...extra})).r.status,422);
  for(const extra of[{provider_verified:true},{authentication_verified:true},{sending_enabled:true},{observation:firstCheck.j.check.observation}])assert.equal((await call(path+'/dns-checks','POST',{expected_version:1,...extra})).r.status,422);
  const saved=await call(path+'/versions','POST',saveBody,saveKey);assert.equal(saved.r.status,200);contract('sender-identities/{id}/versions','POST',saved);assert.equal(saved.j.changed,true);assert.equal(saved.j.sender.version,2);assert.equal(saved.j.sender.reply_to,'help@example.test');
  const noop=await call(path+'/versions','POST',{...saveBody,expected_version:2});assert.equal(noop.r.status,200);assert.equal(noop.j.changed,false);assert.equal(noop.j.sender.version,2);assert.equal((await call(path+'/versions')).j.total_count,2);
  const stale=await call(path+'/versions','POST',{...saveBody,name:'Stale'});assert.equal(stale.r.status,409);assert.equal(stale.j.error.code,'VERSION_CONFLICT');
  const staleCheck=await call(path+'/dns-checks','POST',{expected_version:1});assert.equal(staleCheck.r.status,409);assert.equal(staleCheck.j.error.code,'VERSION_CONFLICT');
  assert.equal((await call(path+'/versions','POST',{...saveBody,name:'Different'},saveKey)).j.error.code,'IDEMPOTENCY_MISMATCH');
  const third=await call(path+'/versions','POST',{...saveBody,expected_version:2,name:'Changed exact source',from_address:'news@second.test'});assert.equal(third.r.status,200);assert.equal(third.j.sender.version,3);assert.equal(third.j.sender.domain,'second.test');
  const oldSave=await call(path+'/versions','POST',saveBody,saveKey);assert.equal(oldSave.j.sender.version,2);assert.equal((await call(path)).j.sender.version,3);assert.equal((await call('sender-identities','POST',body,createKey)).j.sender.version,1);
  const oldCheck=await call(path+'/dns-checks','POST',{expected_version:1},checkKey);assert.deepEqual(oldCheck.j.check,firstCheck.j.check);assert.equal((await call(path+'/dns-checks')).j.total_count,1);
  const sibling=(await call('sender-identities','POST',{...body,name:'Sibling'})).j.sender;
  const foreign=(await call('sender-identities','POST',{...body,name:'Foreign'},randomUUID(),other)).j.sender;assert.ok(foreign.id);
  for(const suffix of['','/versions','/dns-checks'])assert.equal((await call(path+suffix,'GET',undefined,randomUUID(),other)).r.status,404);
  assert.equal((await call(path+'/versions','POST',{...saveBody,expected_version:3},randomUUID(),other)).r.status,404);assert.equal((await call(path+'/dns-checks','POST',{expected_version:3},randomUUID(),other)).r.status,404);
  const history=await call(path+'/versions?limit=1');contract('sender-identities/{id}/versions','GET',history);assert.equal(history.j.total_count,3);assert.equal(history.j.has_more,true);assert.equal(history.j.data[0].version,3);assert.equal(typeof history.j.next_cursor,'string');
  const older=await call(path+'/versions?limit=1&after='+encodeURIComponent(history.j.next_cursor));assert.equal(older.j.data[0].version,2);SenderVersionView.parse(older.j.data[0]);assert.equal(older.j.data[0].snapshot.domain,'xn--bcher-kva.test');
  assert.equal((await call('sender-identities/'+sibling.id+'/versions?after='+encodeURIComponent(history.j.next_cursor))).j.error.code,'INVALID_CURSOR');assert.equal((await call(path+'/versions?after='+encodeURIComponent(history.j.next_cursor)+'x')).j.error.code,'INVALID_CURSOR');
  const listed=await call('sender-identities?limit=1');contract('sender-identities','GET',listed);assert.equal(listed.j.total_count,2);assert.equal(listed.j.has_more,true);assert.equal((await call('sender-identities?limit=1&after='+encodeURIComponent(listed.j.next_cursor))).j.data.length,1);
  assert.equal((await call('sender-identities?after='+encodeURIComponent(listed.j.next_cursor),'GET',undefined,randomUUID(),other)).j.error.code,'INVALID_CURSOR');
  for(const resource of['sender-identities',path+'/versions',path+'/dns-checks'])for(const query of['?unknown=true','?limit=0','?limit=101','?limit=1&limit=2','?after=','?created_after=bad'])assert.equal((await call(resource+query)).r.status,422,resource+query);
  assert.equal((await call(path+'?unknown=true')).r.status,422);assert.equal((await call(path+'/versions','PATCH',{})).r.status,405);assert.equal((await call(path+'/dns-checks','DELETE')).r.status,405);assert.equal((await call(path+'/unknown')).r.status,404);assert.equal((await call(path+'%2fversions')).r.status,404);
  for(const role of['Editor','Viewer','Billing']){await db.query('UPDATE memberships SET role=$1 WHERE workspace_id=$2 AND user_id=$3',[role,workspace,user]);for(const resource of['sender-identities',path,path+'/versions',path+'/dns-checks'])assert.equal((await call(resource)).r.status,403);assert.equal((await call('sender-identities','POST',body)).r.status,403);assert.equal((await call(path+'/versions','POST',saveBody,saveKey)).r.status,403,'Receipt replay requires current manager authority');assert.equal((await call(path+'/dns-checks','POST',{expected_version:1},checkKey)).r.status,403);}
  await db.query("UPDATE memberships SET role='Admin'WHERE workspace_id=$1 AND user_id=$2",[workspace,user]);assert.equal((await call(path)).r.status,200);assert.equal((await call(path+'/versions','POST',{...saveBody,name:'Changed exact source',from_address:'news@second.test',expected_version:3})).j.changed,false);
  await db.query("UPDATE memberships SET role='Owner'WHERE workspace_id=$1 AND user_id=$2",[workspace,user]);
  const reader=(await call('api-keys','POST',{name:'Owned sender reader',scopes:['sender:read'],expires_in_days:1})).j;
  const writer=(await call('api-keys','POST',{name:'Owned sender writer',scopes:['sender:read','sender:write'],expires_in_days:1})).j;
  const unrelated=(await call('api-keys','POST',{name:'Owned unrelated reader',scopes:['integrations:read'],expires_in_days:1})).j;
  for(const credential of[reader,writer,unrelated])assert.ok(credential.secret,'Sender key scopes must be accepted by managed key issuance.');
  for(const resource of['sender-identities',path,path+'/versions',path+'/dns-checks'])assert.equal((await call(resource,'GET',undefined,randomUUID(),workspace,reader.secret)).r.status,200);
  assert.equal((await call(path+'/versions','POST',{...saveBody,expected_version:3},randomUUID(),workspace,reader.secret)).r.status,403);assert.equal((await call(path,'GET',undefined,randomUUID(),workspace,unrelated.secret)).r.status,403);
  const wrongWorkspace=await fetch(origin+'/v1/'+path,{headers:{Authorization:'Bearer '+writer.secret,'X-Workspace-Id':other},signal:AbortSignal.timeout(15000)});assert.equal(wrongWorkspace.status,403);assert.equal((await wrongWorkspace.json()).error.code,'WORKSPACE_KEY_BOUND');
  const delegated=await call('sender-identities','POST',{...body,name:'Delegated sender'},randomUUID(),workspace,writer.secret);assert.equal(delegated.r.status,201);assert.equal((await call('sender-identities/'+foreign.id,'GET',undefined,randomUUID(),workspace,writer.secret)).r.status,404);
  await db.query("UPDATE memberships SET role='Editor'WHERE workspace_id=$1 AND user_id=$2",[workspace,user]);assert.equal((await call(path,'GET',undefined,randomUUID(),workspace,reader.secret)).r.status,401);await db.query("UPDATE memberships SET role='Owner'WHERE workspace_id=$1 AND user_id=$2",[workspace,user]);
  await db.query('UPDATE api_keys SET revoked_at=clock_timestamp()WHERE id=$1',[reader.key.id]);assert.equal((await call(path,'GET',undefined,randomUUID(),workspace,reader.secret)).r.status,401);
  const waitingSender=delegated.j.sender.id;
  const keyDeadline=(await db.query("UPDATE api_keys SET expires_at=clock_timestamp()+interval '2 seconds'WHERE id=$1 RETURNING expires_at",[writer.key.id])).rows[0].expires_at;
  await expiresAfterWait(blocker=>blocker.query('SELECT id FROM sender_identities WHERE id=$1 FOR UPDATE',[waitingSender]),()=>call('sender-identities/'+waitingSender+'/versions','POST',{...body,name:'Must remain unapplied',expected_version:1},randomUUID(),workspace,writer.secret),keyDeadline);
  const shortCookie=randomBytes(32).toString('hex');
  const sessionDeadline=(await db.query("INSERT INTO auth_sessions(token_hash,user_id,expires_at)VALUES($1,$2,clock_timestamp()+interval '2 seconds')RETURNING expires_at",[digest(shortCookie),user])).rows[0].expires_at;
  await expiresAfterWait(blocker=>blocker.query('SELECT id FROM sender_identities WHERE id=$1 FOR UPDATE',[waitingSender]),()=>call('sender-identities/'+waitingSender+'/dns-checks','POST',{expected_version:1},randomUUID(),workspace,undefined,shortCookie),sessionDeadline);
  const replayCookie=randomBytes(32).toString('hex');
  const replayDeadline=(await db.query("INSERT INTO auth_sessions(token_hash,user_id,expires_at)VALUES($1,$2,clock_timestamp()+interval '2 seconds')RETURNING expires_at",[digest(replayCookie),user])).rows[0].expires_at;
  await expiresAfterWait(blocker=>blocker.query('SELECT pg_advisory_xact_lock(hashtext($1))',[workspace+':'+user+':sender.versions:'+sender.id+':'+saveKey]),()=>call(path+'/versions','POST',saveBody,saveKey,workspace,undefined,replayCookie),replayDeadline);
  assert.equal((await call('sender-identities/'+waitingSender)).j.sender.version,1);assert.equal((await call('sender-identities/'+waitingSender+'/dns-checks')).j.total_count,0);
  // Quota covers newly stored observations; exact original replay never consumes another slot.
  const checkReceipts=[firstCheck.j.check];for(let i=0;i<9;i++){const result=await call(path+'/dns-checks','POST',{expected_version:3});assert.equal(result.r.status,200);contract('sender-identities/{id}/dns-checks','POST',result);checkReceipts.push(result.j.check);}
  const limited=await call(path+'/dns-checks','POST',{expected_version:3});assert.equal(limited.r.status,429);assert.equal(limited.j.error.code,'RATE_LIMITED');assert.deepEqual((await call(path+'/dns-checks','POST',{expected_version:1},checkKey)).j.check,firstCheck.j.check);
  const checks=await call(path+'/dns-checks?limit=1');contract('sender-identities/{id}/dns-checks','GET',checks);assert.equal(checks.j.total_count,10);assert.equal(checks.j.has_more,true);DNSCheckView.parse(checks.j.data[0]);assert.equal(checks.j.data[0].sender_version,3);assert.equal(checks.j.data[0].observation.domain,'second.test');
  const checksNext=await call(path+'/dns-checks?limit=1&after='+encodeURIComponent(checks.j.next_cursor));assert.notEqual(checksNext.j.data[0].id,checks.j.data[0].id);assert.equal((await call(path+'/versions?after='+encodeURIComponent(checks.j.next_cursor))).j.error.code,'INVALID_CURSOR');
  assert.equal((await db.query('SELECT count(*)::int AS n FROM domain_checks WHERE workspace_id=$1',[workspace])).rows[0].n,10);assert.equal((await db.query('SELECT count(*)::int AS n FROM sender_identity_versions WHERE workspace_id=$1 AND sender_id=$2',[workspace,sender.id])).rows[0].n,3);
  console.log('Sender owned HTTP PASS: strict canonical drafts, disabled readiness, exact original receipts/CAS/no-op, immutable version-bound reserved-domain observations, scoped pages/cursors, tenant/role/key denial, passive key/session expiry after actual sender/receipt waits and 10-check quota excluding replay.');
 }finally {
  for(const table of['domain_checks','sender_identities','api_rate_events','api_keys','idempotency','audit_events','memberships'])if((await db.query('SELECT to_regclass($1)AS name',[table])).rows[0].name)await db.query(`DELETE FROM ${table} WHERE workspace_id=ANY($1::uuid[])`,[[workspace,other]]);
  await db.query('DELETE FROM auth_sessions WHERE user_id=$1',[user]);await db.query('DELETE FROM workspaces WHERE id=ANY($1::uuid[])',[[workspace,other]]);await db.end();
 }
}
