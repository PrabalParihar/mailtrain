import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import pg from 'pg';
import {sourceDatabase} from '../scripts/smoke-source-truth';

const blockers=['CONNECTION_AUTH_MODE_UNAPPROVED','ACCOUNT_ENTITLEMENT_UNVERIFIED','REAL_CLIENT_PREFLIGHT_UNAVAILABLE','DESTINATION_CONFORMANCE_UNVERIFIED','DURABLE_REMOTE_EXPORT_UNAVAILABLE','MANAGEMENT_LINK_UNVERIFIED'];
const keys=['id','provider','auth_mode','region','state','record_version','credential_version','created_at','updated_at','revoked_at','can_export','blockers'];
const binding=()=>({id:randomUUID(),provider:'klaviyo',account:'Owned private account '+randomUUID(),mode:'oauth',region:'eu-west-1',credential:randomUUID()});
type Binding=ReturnType<typeof binding>;
type Fixture=Parameters<Parameters<typeof sourceDatabase>[0]>[0];
async function register(f:Fixture,b:Binding,actor?:string){return f.tx(async c=>(await c.query('SELECT public.mailcraft_register_integration($1,$2,$3,$4,$5,$6,$7) AS value',[f.p.workspace,b.id,b.provider,b.account,b.mode,b.region,b.credential])).rows[0].value,actor);}
async function read(f:Fixture,id:string,actor?:string){return f.tx(async c=>(await c.query('SELECT public.mailcraft_read_integration($1,$2) AS value',[f.p.workspace,id])).rows[0].value,actor);}
async function rotate(f:Fixture,id:string,version:number|null,credential:string|null){return f.tx(async c=>(await c.query('SELECT public.mailcraft_rotate_integration($1,$2,$3,$4) AS value',[f.p.workspace,id,version,credential])).rows[0].value);}
async function revoke(f:Fixture,id:string){return f.tx(async c=>(await c.query('SELECT public.mailcraft_revoke_integration($1,$2) AS value',[f.p.workspace,id])).rows[0].value);}
const fixed=(code:string)=>(error:unknown)=>error instanceof Error&&error.message===code;
function redacted(value:Record<string,unknown>,b:Binding,state='unverified'){
 assert.equal(value.can_export,false,'Registry metadata must never claim readiness.');
 assert.deepEqual(Object.keys(value).sort(),[...keys].sort());
 assert.equal(value.id,b.id);assert.equal(value.state,state);
 assert.deepEqual(value.blockers,state==='revoked'?['CONNECTION_REVOKED',...blockers]:blockers);
 assert.equal(JSON.stringify(value).includes(b.account),false);assert.equal(JSON.stringify(value).includes(b.credential),false);
 for(const key of ['created_at','updated_at'])assert.ok(Number.isFinite(Date.parse(value[key] as string)));
 assert.equal(value.revoked_at===null,state==='unverified');
}
async function history(f:Fixture,id:string){return(await f.db.query('SELECT * FROM integration_connection_history WHERE workspace_id=$1 AND connection_id=$2 ORDER BY record_version',[f.p.workspace,id])).rows;}
async function waitBlocked(db:pg.Pool,pid:number){
 const deadline=Date.now()+4000;
 while(Date.now()<deadline){if((await db.query('SELECT cardinality(pg_blocking_pids($1))>0 AS waiting',[pid])).rows[0].waiting)return;await new Promise(resolve=>setTimeout(resolve,10));}
 assert.fail('The production operation must actually wait on the held lock.');
}

test('registry output is redacted and permanently blocked, with durable replay/rotation/revocation history',async()=>sourceDatabase(async f=>{
 const b=binding(),first=await register(f,b);redacted(first,b);assert.equal(first.record_version,1);assert.equal(first.credential_version,1);
 assert.deepEqual(await register(f,b),first);assert.equal((await history(f,b.id)).length,1);
 await assert.rejects(register(f,{...b,account:b.account+' changed'}),fixed('CONNECTION_BINDING_CONFLICT'));
 await assert.rejects(register(f,{...b,id:randomUUID()}),fixed('CONNECTION_ACCOUNT_CONFLICT'));
 const second=await rotate(f,b.id,1,randomUUID());redacted(second,b);assert.equal(second.record_version,2);assert.equal(second.credential_version,2);assert.deepEqual(await register(f,b),second);
 await assert.rejects(rotate(f,b.id,1,randomUUID()),fixed('CONNECTION_VERSION_CONFLICT'));
 await assert.rejects(rotate(f,b.id,2,b.credential),fixed('CONNECTION_CREDENTIAL_REUSED'));
 const revoked=await revoke(f,b.id);redacted(revoked,b,'revoked');assert.equal(revoked.record_version,3);assert.equal(revoked.credential_version,2);
 assert.deepEqual(await revoke(f,b.id),revoked);assert.deepEqual(await register(f,b),revoked);
 await assert.rejects(rotate(f,b.id,3,randomUUID()),fixed('CONNECTION_REVOKED'));
 const replacement={...b,id:randomUUID(),credential:randomUUID()};redacted(await register(f,replacement),replacement);
 const rows=await history(f,b.id);assert.deepEqual(rows.map(r=>[r.event,r.record_version,r.credential_version]),[['registered',1,1],['rotated',2,2],['revoked',3,2]]);assert.equal(rows[0].credential_reference,b.credential);assert.ok(rows.every(r=>r.actor===f.p.user));
 const restarted=new pg.Pool({connectionString:f.db.options.connectionString,options:'-c role=mailcraft_runtime'});
 try{const c=await restarted.connect();try{await c.query('BEGIN');await c.query("SELECT set_config('app.workspace_id',$1,true),set_config('app.user_id',$2,true)",[f.p.workspace,f.p.user]);assert.deepEqual((await c.query('SELECT mailcraft_read_integration($1,$2) AS value',[f.p.workspace,b.id])).rows[0].value,revoked);await c.query('COMMIT');}finally{c.release();}}finally{await restarted.end();}
 for(const table of ['operations','outbox','usage_ledger'])assert.equal((await f.db.query('SELECT count(*)::int AS n FROM '+table)).rows[0].n,0);
}));

test('registry uses current browser manager authority and hides foreign identities',async()=>sourceDatabase(async f=>{
 const b=binding();await register(f,b);
 for(const role of ['Viewer','Editor','Billing']){
  await f.db.query('UPDATE memberships SET role=$1 WHERE workspace_id=$2 AND user_id=$3',[role,f.p.workspace,f.p.user]);
  for(const run of [()=>read(f,b.id),()=>register(f,binding()),()=>rotate(f,b.id,1,randomUUID()),()=>revoke(f,b.id)])await assert.rejects(run(),fixed('CONNECTION_PERMISSION_DENIED'));
 }
 await f.db.query("UPDATE memberships SET role='Admin' WHERE workspace_id=$1",[f.p.workspace]);assert.equal((await read(f,b.id)).id,b.id);await register(f,binding());
 await assert.rejects(read(f,b.id,'api-key:'+randomUUID()),fixed('CONNECTION_PERMISSION_DENIED'));await assert.rejects(register(f,binding(),'api-key:'+randomUUID()),fixed('CONNECTION_PERMISSION_DENIED'));
 await assert.rejects(read(f,b.id,'unknown-actor'),fixed('CONNECTION_PERMISSION_DENIED'));
 await assert.rejects(read(f,randomUUID()),fixed('CONNECTION_NOT_FOUND'));
 const foreign=randomUUID();await f.db.query("INSERT INTO workspaces(id,name)VALUES($1,'foreign owned fixture')",[foreign]);
 await assert.rejects(f.tx(c=>c.query('SELECT mailcraft_read_integration($1,$2)',[foreign,b.id])),fixed('CONNECTION_PERMISSION_DENIED'));
 await f.db.query("INSERT INTO memberships(workspace_id,user_id,role)VALUES($1,$2,'Owner')",[foreign,f.p.user]);
 await assert.rejects(f.tx(async c=>{await c.query("SELECT set_config('app.workspace_id',$1,true)",[foreign]);return c.query('SELECT mailcraft_read_integration($1,$2)',[foreign,b.id]);}),fixed('CONNECTION_NOT_FOUND'));
 await f.db.query("UPDATE memberships SET status='revoked' WHERE workspace_id=$1",[f.p.workspace]);await assert.rejects(read(f,b.id),fixed('CONNECTION_PERMISSION_DENIED'));
 await f.db.query("UPDATE memberships SET status='active' WHERE workspace_id=$1",[f.p.workspace]);await f.db.query("UPDATE workspaces SET status='locked' WHERE id=$1",[f.p.workspace]);await assert.rejects(read(f,b.id),fixed('CONNECTION_PERMISSION_DENIED'));
}));

test('registry forces RLS and least privileges, immutable binding/history and readiness constraints',async()=>sourceDatabase(async f=>{
 const b=binding();await register(f,b);
 for(const table of ['integration_connections','integration_connection_history']){
  assert.deepEqual((await f.db.query('SELECT relrowsecurity,relforcerowsecurity FROM pg_class WHERE oid=$1::regclass',[table])).rows[0],{relrowsecurity:true,relforcerowsecurity:true});
  for(const privilege of ['SELECT','INSERT','UPDATE','DELETE','TRUNCATE'])assert.equal((await f.db.query('SELECT has_table_privilege($1,$2,$3) AS allowed',['mailcraft_runtime',table,privilege])).rows[0].allowed,false);
  await assert.rejects(f.tx(c=>c.query('SELECT * FROM '+table)),e=>(e as{code:string}).code==='42501');
 }
 const role=(await f.db.query("SELECT rolcanlogin,rolsuper,rolbypassrls,rolcreatedb,rolcreaterole FROM pg_roles WHERE rolname='mailcraft_integration_admin'")).rows[0];assert.equal(Object.values(role).some(Boolean),false);
 assert.equal((await f.db.query("SELECT pg_has_role('mailcraft_runtime','mailcraft_integration_admin','MEMBER') AS allowed")).rows[0].allowed,false);
 const funcs=(await f.db.query("SELECT p.oid::regprocedure::text AS name,p.prosecdef,p.proconfig,has_function_privilege('public',p.oid,'EXECUTE') AS public_access FROM pg_proc p WHERE proname LIKE 'mailcraft_%integration%'" )).rows;
 for(const fn of funcs){assert.equal(fn.public_access,false);assert.ok(fn.proconfig.includes('search_path=pg_catalog, public'));}
 const exposed=['mailcraft_register_integration','mailcraft_read_integration','mailcraft_rotate_integration','mailcraft_revoke_integration'];
 const privileges=(await f.db.query("SELECT proname,prosecdef,pg_get_userbyid(proowner) AS owner,has_function_privilege('mailcraft_runtime',oid,'EXECUTE') AS runtime FROM pg_proc WHERE pronamespace='public'::regnamespace AND proname LIKE 'mailcraft_%integration%'")).rows;
 for(const fn of privileges){assert.equal(fn.owner,'mailcraft_integration_admin');assert.equal(fn.runtime,exposed.includes(fn.proname));assert.equal(fn.prosecdef,exposed.includes(fn.proname));}
 for(const role of ['mailcraft_creation_worker','mailcraft_creation_scheduler','mailcraft_media_worker','mailcraft_media_scheduler','mailcraft_webhook_worker']){
  for(const table of ['integration_connections','integration_connection_history'])assert.equal((await f.db.query('SELECT has_table_privilege($1,$2,\'SELECT\') AS allowed',[role,table])).rows[0].allowed,false);
  for(const fn of funcs)assert.equal((await f.db.query('SELECT has_function_privilege($1,$2,\'EXECUTE\') AS allowed',[role,fn.name])).rows[0].allowed,false);
  assert.equal((await f.db.query('SELECT pg_has_role($1,\'mailcraft_integration_admin\',\'MEMBER\') AS allowed',[role])).rows[0].allowed,false);
 }
 const service=await f.db.connect();try{await service.query('BEGIN');await service.query('SET LOCAL ROLE mailcraft_integration_admin');await service.query("SELECT set_config('app.workspace_id',$1,true),set_config('app.user_id',$2,true)",[randomUUID(),f.p.user]);assert.equal((await service.query('SELECT * FROM integration_connections')).rowCount,0);assert.equal((await service.query('SELECT * FROM integration_connection_history')).rowCount,0);await service.query('ROLLBACK');}finally{service.release();}
 for(const assignment of ["external_account_id='forged'","provider='brevo'","auth_mode='api_key'","region='elsewhere'","created_by='forged'","created_at=clock_timestamp()","can_export=true","verified_at=clock_timestamp()"]){await assert.rejects(f.db.query('UPDATE integration_connections SET '+assignment+' WHERE id=$1',[b.id]),/CONNECTION_IMMUTABLE|CONNECTION_INPUT_INVALID|check constraint/);}
 for(const sql of ['UPDATE integration_connection_history SET actor=\'forged\'','DELETE FROM integration_connection_history','TRUNCATE integration_connection_history','DELETE FROM integration_connections'])await assert.rejects(f.db.query(sql),/CONNECTION_HISTORY_IMMUTABLE|CONNECTION_IMMUTABLE/);
 await assert.rejects(f.db.query('DELETE FROM workspaces WHERE id=$1',[f.p.workspace]),e=>(e as{code:string}).code==='23503');
 assert.equal((await history(f,b.id)).length,1);
}));

test('registry rejects null/invalid inputs without writes or input-bearing errors',async()=>sourceDatabase(async f=>{
 const b=binding();
 for(const patch of [{provider:null},{provider:'other'},{account:null},{account:''},{account:' \t'},{account:'a\nb'},{account:'a'.repeat(256)},{account:'\u00a0'},{account:'\ufeff'},{account:'a\u0080b'},{account:'a\u009fb'},{mode:null},{mode:'password'},{region:null},{region:' '},{region:'a\u007fb'},{region:'r'.repeat(49)},{region:'\u2003\u3000'},{region:'\ufeff'},{credential:null},{id:null}])await assert.rejects(register(f,{...b,...patch} as Binding),fixed('CONNECTION_INPUT_INVALID'));
 await assert.rejects(f.tx(c=>c.query('SELECT mailcraft_register_integration(NULL,$1,$2,$3,$4,$5,$6)',[b.id,b.provider,b.account,b.mode,b.region,b.credential])),fixed('CONNECTION_INPUT_INVALID'));
 await register(f,b);
 for(const [version,credential] of [[null,randomUUID()],[0,randomUUID()],[-1,randomUUID()],[1,null]] as [number|null,string|null][])await assert.rejects(rotate(f,b.id,version,credential),fixed('CONNECTION_INPUT_INVALID'));
 await assert.rejects(read(f,null as unknown as string),fixed('CONNECTION_INPUT_INVALID'));
 await assert.rejects(revoke(f,null as unknown as string),fixed('CONNECTION_INPUT_INVALID'));
 for(const signature of ['mailcraft_read_integration(NULL,$1)','mailcraft_revoke_integration(NULL,$1)','mailcraft_rotate_integration(NULL,$1,1,$2)','mailcraft_rotate_integration($1,NULL,1,$2)'])await assert.rejects(f.tx(c=>c.query('SELECT '+signature,signature.startsWith('mailcraft_rotate')?[signature.includes('(NULL')?b.id:f.p.workspace,b.credential]:[b.id])),fixed('CONNECTION_INPUT_INVALID'));
 assert.equal((await history(f,b.id)).length,1);assert.equal((await read(f,b.id)).record_version,1);
}));

test('registry rolls back connection and history atomically and serializes duplicate registration/CAS',async()=>sourceDatabase(async f=>{
 const b=binding();
 await assert.rejects(f.tx(async c=>{await c.query('SELECT mailcraft_register_integration($1,$2,$3,$4,$5,$6,$7)',[f.p.workspace,b.id,b.provider,b.account,b.mode,b.region,b.credential]);throw Error('Owned rollback');}),/Owned rollback/);
 assert.equal((await history(f,b.id)).length,0);await assert.rejects(read(f,b.id),fixed('CONNECTION_NOT_FOUND'));
 const replay=await Promise.all([register(f,b),register(f,b)]);assert.deepEqual(replay[0],replay[1]);assert.equal((await history(f,b.id)).length,1);
 await assert.rejects(f.tx(async c=>{await c.query('SELECT mailcraft_rotate_integration($1,$2,1,$3)',[f.p.workspace,b.id,randomUUID()]);throw Error('Owned rotation rollback');}),/Owned rotation rollback/);assert.equal((await history(f,b.id)).length,1);assert.equal((await read(f,b.id)).credential_version,1);
 const outcomes=await Promise.allSettled([rotate(f,b.id,1,randomUUID()),rotate(f,b.id,1,randomUUID())]);assert.equal(outcomes.filter(r=>r.status==='fulfilled').length,1);assert.equal(outcomes.filter(r=>r.status==='rejected'&&fixed('CONNECTION_VERSION_CONFLICT')(r.reason)).length,1);
 await assert.rejects(f.tx(async c=>{await c.query('SELECT mailcraft_revoke_integration($1,$2)',[f.p.workspace,b.id]);throw Error('Owned rollback');}),/Owned rollback/);
 assert.equal((await read(f,b.id)).state,'unverified');assert.equal((await history(f,b.id)).length,2);
 const duplicates=[binding(),binding()];duplicates[1].account=duplicates[0].account;const accountOutcomes=await Promise.allSettled(duplicates.map(b=>register(f,b)));assert.equal(accountOutcomes.filter(r=>r.status==='fulfilled').length,1);assert.equal(accountOutcomes.filter(r=>r.status==='rejected'&&fixed('CONNECTION_ACCOUNT_CONFLICT')(r.reason)).length,1);
}));

test('registry rechecks revocation after workspace/member lock waits',async()=>sourceDatabase(async f=>{
 const b=binding();await register(f,b);
 for(const table of ['workspaces','memberships']){
  const blocker=await f.db.connect();let pending:Promise<{value?:unknown;error?:unknown}>|undefined;
  try{await blocker.query('BEGIN');await blocker.query(table==='workspaces'?'SELECT id FROM workspaces WHERE id=$1 FOR UPDATE':'SELECT user_id FROM memberships WHERE workspace_id=$1 AND user_id=$2 FOR UPDATE',table==='workspaces'?[f.p.workspace]:[f.p.workspace,f.p.user]);
   let pid=0;const started=new Promise<void>(resolve=>{pending=f.tx(async c=>{pid=(await c.query('SELECT pg_backend_pid() AS pid')).rows[0].pid;resolve();return c.query('SELECT mailcraft_rotate_integration($1,$2,1,$3)',[f.p.workspace,b.id,randomUUID()]);}).then(value=>({value}),error=>({error}));});await started;await waitBlocked(f.db,pid);
   await blocker.query(table==='workspaces'?"UPDATE workspaces SET status='locked' WHERE id=$1":"UPDATE memberships SET status='revoked' WHERE workspace_id=$1",[f.p.workspace]);await blocker.query('COMMIT');assert.ok(fixed('CONNECTION_PERMISSION_DENIED')((await pending)?.error));
  }finally{await blocker.query('ROLLBACK');blocker.release();await pending;await f.db.query("UPDATE workspaces SET status='active' WHERE id=$1",[f.p.workspace]);await f.db.query("UPDATE memberships SET status='active' WHERE workspace_id=$1",[f.p.workspace]);}
 }
 assert.equal((await history(f,b.id)).length,1);
}));

test('registry holds current authority through commit and subsequent admission observes revocation',async()=>sourceDatabase(async f=>{
 const b=binding();await register(f,b);const blocker=await f.db.connect();let release!:()=>void,ready!:()=>void,pid=0;const hold=new Promise<void>(r=>{release=r;}),admitted=new Promise<void>(r=>{ready=r;});
 const current=f.tx(async c=>{await c.query('SELECT mailcraft_read_integration($1,$2)',[f.p.workspace,b.id]);pid=(await c.query('SELECT pg_backend_pid() AS pid')).rows[0].pid;ready();await hold;return c.query('SELECT mailcraft_revoke_integration($1,$2)',[f.p.workspace,b.id]);});let pending:Promise<unknown>|undefined;
 try{await admitted;const changerPid=(await blocker.query('SELECT pg_backend_pid() AS pid')).rows[0].pid;pending=blocker.query("UPDATE memberships SET status='revoked' WHERE workspace_id=$1",[f.p.workspace]);await waitBlocked(f.db,changerPid);assert.ok((await f.db.query('SELECT $1::int=ANY(pg_blocking_pids($2)) AS held',[pid,changerPid])).rows[0].held);release();await current;await pending;await assert.rejects(read(f,b.id),fixed('CONNECTION_PERMISSION_DENIED'));}finally{release();await current.catch(()=>undefined);await pending;blocker.release();}
}));


test('registry preserves exact account identities for every declared provider and mode',async()=>sourceDatabase(async f=>{
 for(const provider of ['klaviyo','mailchimp','hubspot','brevo','omnisend'])for(const mode of ['oauth','api_key']){
  const b={...binding(),provider,mode,account:'  Account Case 😀 é '+randomUUID()+'  ',region:' EU '};const value=await register(f,b);redacted(value,b);assert.equal(value.provider,provider);assert.equal(value.auth_mode,mode);assert.equal(value.region,b.region);assert.equal((await f.db.query('SELECT external_account_id FROM integration_connections WHERE id=$1',[b.id])).rows[0].external_account_id,b.account);
 }
}));

test('registry locks authority before waiting for the connection, blocking revocation until commit',async()=>sourceDatabase(async f=>{
 const b=binding();await register(f,b);const holder=await f.db.connect(),revoker=await f.db.connect();let readPending:Promise<unknown>|undefined,revoked:Promise<unknown>|undefined,readerPid=0;
 try{
  await holder.query('BEGIN');await holder.query('SELECT id FROM integration_connections WHERE workspace_id=$1 AND id=$2 FOR UPDATE',[f.p.workspace,b.id]);
  const started=new Promise<void>(resolve=>{readPending=f.tx(async c=>{readerPid=(await c.query('SELECT pg_backend_pid() AS pid')).rows[0].pid;resolve();return c.query('SELECT mailcraft_read_integration($1,$2)',[f.p.workspace,b.id]);});});await started;await waitBlocked(f.db,readerPid);
  const revokerPid=(await revoker.query('SELECT pg_backend_pid() AS pid')).rows[0].pid;revoked=revoker.query("UPDATE memberships SET status='revoked' WHERE workspace_id=$1",[f.p.workspace]);await waitBlocked(f.db,revokerPid);assert.ok((await f.db.query('SELECT $1::int=ANY(pg_blocking_pids($2)) AS held',[readerPid,revokerPid])).rows[0].held);
  await holder.query('COMMIT');await readPending;await revoked;await assert.rejects(read(f,b.id),fixed('CONNECTION_PERMISSION_DENIED'));assert.equal((await history(f,b.id)).length,1);
 }finally{await holder.query('ROLLBACK');await readPending;await revoked;holder.release();revoker.release();}
}));
