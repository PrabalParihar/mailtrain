import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import pg from 'pg';
import {sourceDatabase} from '../scripts/smoke-source-truth';
import {IntegrationConnection} from '../src/domain/integration-registry';
import {registerIntegration,readIntegration,rotateIntegration,revokeIntegration} from '../src/server/integration-registry';

type Fixture=Parameters<Parameters<typeof sourceDatabase>[0]>[0];
const binding=()=>({id:randomUUID(),provider:'klaviyo',external_account_id:' Owned private account 😀 '+randomUUID()+' ',auth_mode:'oauth',region:' EU ',credential_reference:randomUUID()});
const fixed=(code:string)=>(error:unknown)=>{assert.ok(error instanceof Error);assert.equal(error.message,code);assert.deepEqual(Object.keys(error),[]);assert.equal('cause' in error,false);return true;};
async function history(f:Fixture,id:string){return(await f.db.query('SELECT * FROM public.integration_connection_history WHERE workspace_id=$1 AND connection_id=$2 ORDER BY record_version',[f.p.workspace,id])).rows;}
function redacted(value:unknown,b:ReturnType<typeof binding>){const parsed=IntegrationConnection.parse(value);assert.equal(parsed.can_export,false);for(const privateValue of [b.external_account_id,b.credential_reference])assert.equal(JSON.stringify(parsed).includes(privateValue),false);return parsed;}
async function emptyExportTables(f:Fixture){for(const table of ['operations','outbox','usage_ledger'])assert.equal((await f.db.query('SELECT count(*)::int AS n FROM '+table)).rows[0].n,0);}

test('actual wrappers register/replay/rotate/revoke with durable private history and new-pool readback',async()=>sourceDatabase(async f=>{
 const originalFetch=globalThis.fetch;let providerCalls=0;globalThis.fetch=async()=>{providerCalls++;throw new Error('Unexpected provider IO');};
 try{
 const b=binding(),first=redacted(await f.tx(c=>registerIntegration(c,f.p.workspace,{...b,id:b.id.toUpperCase(),credential_reference:b.credential_reference.toUpperCase()})),b);
 assert.equal(first.record_version,1);assert.equal(first.region,b.region);assert.deepEqual(await f.tx(c=>registerIntegration(c,f.p.workspace,b)),first);assert.equal((await history(f,b.id)).length,1);
 await assert.rejects(f.tx(c=>registerIntegration(c,f.p.workspace,{...b,external_account_id:b.external_account_id+'changed'})),fixed('CONNECTION_BINDING_CONFLICT'));
 await assert.rejects(f.tx(c=>registerIntegration(c,f.p.workspace,{...b,id:randomUUID()})),fixed('CONNECTION_ACCOUNT_CONFLICT'));
 const nextCredential=randomUUID(),second=redacted(await f.tx(c=>rotateIntegration(c,f.p.workspace,b.id,{expected_record_version:1,credential_reference:nextCredential})),b);assert.equal(second.record_version,2);assert.equal(second.credential_version,2);assert.deepEqual(await f.tx(c=>registerIntegration(c,f.p.workspace,b)),second);
 await assert.rejects(f.tx(c=>rotateIntegration(c,f.p.workspace,b.id,{expected_record_version:1,credential_reference:randomUUID()})),fixed('CONNECTION_VERSION_CONFLICT'));
 await assert.rejects(f.tx(c=>rotateIntegration(c,f.p.workspace,b.id,{expected_record_version:2,credential_reference:b.credential_reference})),fixed('CONNECTION_CREDENTIAL_REUSED'));
 const revoked=redacted(await f.tx(c=>revokeIntegration(c,f.p.workspace,b.id)),b);assert.equal(revoked.state,'revoked');assert.equal(revoked.record_version,3);assert.equal(revoked.credential_version,2);assert.deepEqual(await f.tx(c=>revokeIntegration(c,f.p.workspace,b.id)),revoked);assert.deepEqual(await f.tx(c=>registerIntegration(c,f.p.workspace,b)),revoked);
 await assert.rejects(f.tx(c=>rotateIntegration(c,f.p.workspace,b.id,{expected_record_version:3,credential_reference:randomUUID()})),fixed('CONNECTION_REVOKED'));
 const rows=await history(f,b.id);assert.deepEqual(rows.map(r=>[r.event,r.record_version,r.credential_version]),[['registered',1,1],['rotated',2,2],['revoked',3,2]]);assert.deepEqual(rows.map(r=>r.credential_reference),[b.credential_reference,nextCredential,nextCredential]);assert.ok(rows.every(r=>r.actor===f.p.user));
 assert.equal((await f.db.query('SELECT external_account_id,credential_reference,can_export,verified_at FROM public.integration_connections WHERE id=$1',[b.id])).rows[0].external_account_id,b.external_account_id);
 const replacement={...b,id:randomUUID(),credential_reference:randomUUID()};assert.equal((await f.tx(c=>registerIntegration(c,f.p.workspace,replacement))).state,'unverified');
 const freshPool=new pg.Pool({connectionString:f.db.options.connectionString,options:'-c role=mailcraft_runtime'});
 try{const c=await freshPool.connect();try{await c.query('BEGIN');await c.query("SELECT set_config('app.workspace_id',$1,true),set_config('app.user_id',$2,true)",[f.p.workspace,f.p.user]);assert.deepEqual(await readIntegration(c,f.p.workspace,b.id.toUpperCase()),revoked);await c.query('COMMIT');}finally{c.release();}}finally{await freshPool.end();}
 assert.deepEqual(await history(f,b.id),rows);await emptyExportTables(f);assert.equal(providerCalls,0);
 }finally{globalThis.fetch=originalFetch;}
}));

test('actual wrapper transactions roll back both state and history and serialize replay/CAS',async()=>sourceDatabase(async f=>{
 const b=binding();
 await assert.rejects(f.tx(async c=>{await registerIntegration(c,f.p.workspace,b);throw new Error('Owned register rollback');}),/Owned register rollback/);assert.equal((await history(f,b.id)).length,0);await assert.rejects(f.tx(c=>readIntegration(c,f.p.workspace,b.id)),fixed('CONNECTION_NOT_FOUND'));
 const duplicate=await Promise.all([f.tx(c=>registerIntegration(c,f.p.workspace,b)),f.tx(c=>registerIntegration(c,f.p.workspace,b))]);assert.deepEqual(duplicate[0],duplicate[1]);assert.equal((await history(f,b.id)).length,1);
 await assert.rejects(f.tx(async c=>{await rotateIntegration(c,f.p.workspace,b.id,{expected_record_version:1,credential_reference:randomUUID()});throw new Error('Owned rotate rollback');}),/Owned rotate rollback/);assert.equal((await history(f,b.id)).length,1);assert.equal((await f.tx(c=>readIntegration(c,f.p.workspace,b.id))).record_version,1);
 const outcomes=await Promise.allSettled([f.tx(c=>rotateIntegration(c,f.p.workspace,b.id,{expected_record_version:1,credential_reference:randomUUID()})),f.tx(c=>rotateIntegration(c,f.p.workspace,b.id,{expected_record_version:1,credential_reference:randomUUID()}))]);assert.equal(outcomes.filter(r=>r.status==='fulfilled').length,1);assert.equal(outcomes.filter(r=>r.status==='rejected'&&r.reason.message==='CONNECTION_VERSION_CONFLICT').length,1);
 await assert.rejects(f.tx(async c=>{await revokeIntegration(c,f.p.workspace,b.id);throw new Error('Owned revoke rollback');}),/Owned revoke rollback/);assert.equal((await history(f,b.id)).length,2);assert.equal((await f.tx(c=>readIntegration(c,f.p.workspace,b.id))).state,'unverified');await emptyExportTables(f);
}));

test('actual wrappers enforce current tenant/member/workspace and browser manager authority',async()=>sourceDatabase(async f=>{
 const b=binding();await f.tx(c=>registerIntegration(c,f.p.workspace,b));
 const all=(actor?:string)=>[
 ()=>f.tx(c=>readIntegration(c,f.p.workspace,b.id),actor),()=>f.tx(c=>registerIntegration(c,f.p.workspace,binding()),actor),
 ()=>f.tx(c=>rotateIntegration(c,f.p.workspace,b.id,{expected_record_version:1,credential_reference:randomUUID()}),actor),()=>f.tx(c=>revokeIntegration(c,f.p.workspace,b.id),actor),
 ];
 for(const role of ['Viewer','Editor','Billing']){await f.db.query('UPDATE memberships SET role=$1 WHERE workspace_id=$2 AND user_id=$3',[role,f.p.workspace,f.p.user]);for(const run of all())await assert.rejects(run(),fixed('CONNECTION_PERMISSION_DENIED'));}
 await f.db.query("UPDATE memberships SET role='Admin' WHERE workspace_id=$1 AND user_id=$2",[f.p.workspace,f.p.user]);assert.equal((await f.tx(c=>readIntegration(c,f.p.workspace,b.id))).id,b.id);await f.tx(c=>registerIntegration(c,f.p.workspace,binding()));
 for(const actor of ['api-key:'+randomUUID(),'unknown-'+randomUUID()])for(const run of all(actor))await assert.rejects(run(),fixed('CONNECTION_PERMISSION_DENIED'));
 const foreign=randomUUID();await f.db.query("INSERT INTO workspaces(id,name)VALUES($1,'owned wrapper foreign tenant')",[foreign]);await f.db.query("INSERT INTO memberships(workspace_id,user_id,role)VALUES($1,$2,'Owner')",[foreign,f.p.user]);
 for(const run of [(c:pg.PoolClient)=>readIntegration(c,foreign,b.id),(c:pg.PoolClient)=>registerIntegration(c,foreign,binding()),(c:pg.PoolClient)=>rotateIntegration(c,foreign,b.id,{expected_record_version:1,credential_reference:randomUUID()}),(c:pg.PoolClient)=>revokeIntegration(c,foreign,b.id)])await assert.rejects(f.tx(run),fixed('CONNECTION_PERMISSION_DENIED'));
 for(const run of [(c:pg.PoolClient)=>readIntegration(c,foreign,b.id),(c:pg.PoolClient)=>rotateIntegration(c,foreign,b.id,{expected_record_version:1,credential_reference:randomUUID()}),(c:pg.PoolClient)=>revokeIntegration(c,foreign,b.id)])await assert.rejects(f.tx(async c=>{await c.query("SELECT set_config('app.workspace_id',$1,true)",[foreign]);return run(c);}),fixed('CONNECTION_NOT_FOUND'));
 await f.db.query("UPDATE memberships SET status='revoked' WHERE workspace_id=$1",[f.p.workspace]);for(const run of all())await assert.rejects(run(),fixed('CONNECTION_PERMISSION_DENIED'));
 await f.db.query("UPDATE memberships SET status='active' WHERE workspace_id=$1",[f.p.workspace]);await f.db.query("UPDATE workspaces SET status='locked' WHERE id=$1",[f.p.workspace]);for(const run of all())await assert.rejects(run(),fixed('CONNECTION_PERMISSION_DENIED'));
 assert.equal((await history(f,b.id)).length,1);await emptyExportTables(f);
}));

test('actual wrapper UUID parity and malformed-input refusal preserve private rows',async()=>sourceDatabase(async f=>{
 for(let version=1;version<=8;version++)for(const variant of ['8','9','a','b']){const b=binding(),uuid=`12345678-1234-${version}234-${variant}234-123456789abc`;const value=await f.tx(c=>registerIntegration(c,f.p.workspace,{...b,id:uuid.toUpperCase(),credential_reference:uuid.toUpperCase()}));assert.equal(value.id,uuid);assert.equal((await history(f,uuid))[0].credential_reference,uuid);}
 for(const uuid of ['00000000-0000-0000-0000-000000000000','ffffffff-ffff-ffff-ffff-ffffffffffff']){const b={...binding(),id:uuid.toUpperCase(),credential_reference:uuid.toUpperCase()};assert.equal((await f.tx(c=>registerIntegration(c,f.p.workspace,b))).id,uuid);}
 const b=binding();for(const patch of [{external_account_id:'\ud800'},{credential_reference:'12345678-1234-9234-8234-123456789abc'},{external_account_id:'SECRET_MARKER',token:'SECRET_MARKER'},{region:'x\u0080'}])await assert.rejects(f.tx(c=>registerIntegration(c,f.p.workspace,{...b,...patch})),fixed('CONNECTION_INPUT_INVALID'));
 assert.equal((await history(f,b.id)).length,0);await emptyExportTables(f);
}));
