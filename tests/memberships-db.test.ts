import { withCreationQueueFixture } from './fixtures/creation-queue-lock';
import { assertCurrentAuthority } from '../src/server/current-authority';
import test,{after}from'node:test';import assert from'node:assert/strict';import{randomUUID}from'node:crypto';import pg from'pg';import env from'@next/env';import{tenant,closeDb}from'../src/server/db';import type{Principal}from'../src/server/auth';import{AppError}from'../src/server/errors';env.loadEnvConfig(process.cwd());
const lifecycle=await import('../src/server/memberships').catch(()=>null);
const admin=new pg.Pool({connectionString:process.env.MIGRATION_DATABASE_URL});after(async()=>{await admin.end();await closeDb();});
const code=(c:string)=>(e:unknown)=>e instanceof AppError&&e.code===c;
async function fixture(run:(f:{workspace:string;other:string;users:string[];ids:string[];owner:Principal;manager:Principal;change:(actor:Principal,index:number,command:'role'|'remove'|'transfer-owner',input:Record<string,unknown>)=>Promise<{member:Record<string,unknown>;changes:Record<string,unknown>[]}>})=>Promise<void>){
 assert.ok(lifecycle?.changeMembership,'Membership lifecycle service must exist.');
 const workspace=randomUUID(),other=randomUUID(),users=Array.from({length:5},()=> 'member-'+randomUUID()),roles=['Owner','Admin','Editor','Viewer','Billing'];
 try{
  await admin.query("INSERT INTO workspaces(id,name)VALUES($1,'Membership fixture'),($2,'Membership foreign')",[workspace,other]);
  for(let i=0;i<roles.length;i++)await admin.query('INSERT INTO memberships(workspace_id,user_id,role)VALUES($1,$2,$3)',[workspace,users[i],roles[i]]);
  await admin.query("INSERT INTO memberships(workspace_id,user_id,role)VALUES($1,$2,'Owner')",[other,users[0]]);
  const rows=(await admin.query('SELECT id,user_id FROM memberships WHERE workspace_id=$1',[workspace])).rows;const ids=users.map(u=>rows.find(r=>r.user_id===u).id);
  const owner:Principal={workspace,user:users[0],role:'Owner'},manager:Principal={workspace,user:users[1],role:'Admin'};
  const change=(actor:Principal,index:number,command:'role'|'remove'|'transfer-owner',input:Record<string,unknown>)=>tenant(actor.workspace,actor.user,tx=>lifecycle.changeMembership(tx,actor,ids[index],command,input));
  await run({workspace,other,users,ids,owner,manager,change});
 }finally{
  for(const table of ['membership_changes','idempotency','api_rate_events','usage_ledger','operations','audit_events','outbox','api_keys','memberships'])await admin.query(`DELETE FROM ${table} WHERE workspace_id=ANY($1::uuid[])`,[[workspace,other]]);
  await admin.query('DELETE FROM workspaces WHERE id=ANY($1::uuid[])',[[workspace,other]]);
 }
}
test('real membership mutation protects final Owner, current version, role/seat policy and tenant boundary',async()=>fixture(async f=>{
 await assert.rejects(f.change(f.owner,0,'remove',{expected_version:1,acknowledge:true}),code('LAST_OWNER_REQUIRED'));
 await assert.rejects(f.change(f.owner,0,'role',{expected_version:1,role:'Admin'}),code('LAST_OWNER_REQUIRED'));
 await assert.rejects(f.change(f.manager,0,'remove',{expected_version:1,acknowledge:true}),code('ROLE_PROTECTED'));
 await assert.rejects(f.change(f.manager,4,'role',{expected_version:1,role:'Viewer'}),code('ROLE_PROTECTED'));
 await assert.rejects(f.change(f.owner,3,'role',{expected_version:1,role:'Editor'}),code('SEAT_POLICY_REQUIRED'));
 await assert.rejects(f.change({...f.owner,workspace:f.other},2,'role',{expected_version:1,role:'Viewer'}),code('RESOURCE_NOT_FOUND'));
 const changed=await f.change(f.owner,2,'role',{expected_version:1,role:'Viewer'});assert.equal(changed.member.role,'Viewer');assert.equal(changed.member.version,2);assert.equal(changed.changes.length,1);assert.equal(changed.changes[0].editing_seats_before,3);assert.equal(changed.changes[0].editing_seats_after,2);
 await assert.rejects(f.change(f.owner,2,'role',{expected_version:1,role:'Admin'}),code('MEMBERSHIP_VERSION_CONFLICT'));
 assert.equal((await admin.query('SELECT count(*)::int AS n FROM membership_changes WHERE workspace_id=$1',[f.workspace])).rows[0].n,1);
}));
test('ownership transfer promotes target and demotes initiator atomically without changing editing quantity',async()=>fixture(async f=>{
 await assert.rejects(f.change(f.manager,2,'transfer-owner',{expected_version:1,expected_owner_version:1,acknowledge:true}),code('OWNER_REQUIRED'));
 await assert.rejects(f.change(f.owner,0,'transfer-owner',{expected_version:1,expected_owner_version:1,acknowledge:true}),code('SELF_TRANSFER_DENIED'));
 const moved=await f.change(f.owner,2,'transfer-owner',{expected_version:1,expected_owner_version:1,acknowledge:true});assert.equal(moved.member.role,'Owner');assert.equal(moved.member.version,2);assert.equal(moved.changes.length,2);assert.ok(moved.changes.every(c=>c.editing_seats_before===3&&c.editing_seats_after===3));
 const actor=(await admin.query('SELECT role,version FROM memberships WHERE workspace_id=$1 AND user_id=$2',[f.workspace,f.users[0]])).rows[0];assert.equal(actor.role,'Admin');assert.equal(actor.version,2);
 assert.equal((await admin.query("SELECT count(*)::int AS n FROM memberships WHERE workspace_id=$1 AND role='Owner' AND status='active'",[f.workspace])).rows[0].n,1);
 await assert.rejects(f.change(f.owner,1,'transfer-owner',{expected_version:1,expected_owner_version:2,acknowledge:true}),code('OWNER_REQUIRED'));
}));
test('runtime cannot directly write memberships or alter immutable membership evidence while SHARE authority still works',async()=>fixture(async f=>{
 await assert.rejects(tenant(f.workspace,f.owner.user,tx=>tx.query("UPDATE memberships SET role='Viewer' WHERE id=$1",[f.ids[2]])),/permission denied/);
 await assert.rejects(tenant(f.workspace,f.owner.user,tx=>tx.query('UPDATE memberships SET version=version+1 WHERE id=$1',[f.ids[2]])),/MEMBERSHIP_DIRECT_WRITE_DENIED/);
 await assert.rejects(tenant(f.workspace,f.owner.user,tx=>tx.query('DELETE FROM memberships WHERE id=$1',[f.ids[2]])),/permission denied/);
 await assert.rejects(tenant(f.workspace,f.owner.user,tx=>tx.query("INSERT INTO memberships(workspace_id,user_id,role)VALUES($1,'untrusted','Owner')",[f.workspace])),/permission denied/);
 assert.equal((await tenant(f.workspace,f.owner.user,tx=>tx.query('SELECT role FROM memberships WHERE id=$1 FOR SHARE',[f.ids[0]]))).rows[0].role,'Owner');
 await f.change(f.owner,2,'role',{expected_version:1,role:'Viewer'});
 await assert.rejects(tenant(f.workspace,f.owner.user,tx=>tx.query('UPDATE membership_changes SET editing_seats_after=100')),/permission denied/);
 assert.equal((await tenant(f.other,f.owner.user,tx=>tx.query('SELECT * FROM membership_changes'))).rowCount,0);
 assert.equal((await tenant(f.workspace,f.users[3],tx=>tx.query('SELECT * FROM membership_changes'))).rowCount,0);
}));
test('two current managers serialize conflicting member versions without deadlock or duplicate seat evidence',async()=>fixture(async f=>{
 const results=await Promise.allSettled([f.change(f.owner,2,'role',{expected_version:1,role:'Viewer'}),f.change(f.manager,2,'remove',{expected_version:1,acknowledge:true})]);
 assert.equal(results.filter(r=>r.status==='fulfilled').length,1);const rejected=results.find(r=>r.status==='rejected');assert.ok(rejected?.status==='rejected'&&code('MEMBERSHIP_VERSION_CONFLICT')(rejected.reason));
 assert.equal((await admin.query('SELECT count(*)::int AS n FROM membership_changes WHERE workspace_id=$1',[f.workspace])).rows[0].n,1);
 assert.equal((await admin.query("SELECT count(*)::int AS n FROM memberships WHERE workspace_id=$1 AND status='active' AND role IN('Owner','Admin','Editor')",[f.workspace])).rows[0].n,2);
}));
test('membership removal revokes issued credentials and queued reservations once while running work remains in cancellation',async()=>withCreationQueueFixture(()=>fixture(async f=>{
 const key=randomUUID(),queued=randomUUID(),running=randomUUID();
 await admin.query("INSERT INTO api_keys(workspace_id,id,key_hash,name,scopes,created_by,expires_at)VALUES($1,$2,$3,'Membership fixture','[\"emails:write\"]',$4,clock_timestamp()+interval '1 hour')",[f.workspace,key,randomUUID(),f.users[1]]);
 for(const[id,state]of[[queued,'queued'],[running,'running']]){
  await admin.query("INSERT INTO operations(workspace_id,id,type,state,input,created_by,created_api_key_id)VALUES($1,$2,'email.generate',$3,'{}',$4,$5)",[f.workspace,id,state,f.users[1],key]);
  await admin.query("INSERT INTO usage_ledger(workspace_id,operation_id,metric,kind,units)VALUES($1,$2,'generation','reserve',1)",[f.workspace,id]);
 }
 const result=await f.change(f.owner,1,'remove',{expected_version:1,acknowledge:true});assert.equal(result.member.status,'revoked');assert.ok(result.member.revoked_at);assert.equal(result.changes[0].revoked_keys,1);assert.equal(result.changes[0].cancelled_operations,1);assert.equal(result.changes[0].cancel_requested_operations,1);
 const ops=(await admin.query('SELECT id,state FROM operations WHERE workspace_id=$1',[f.workspace])).rows;assert.equal(ops.find(o=>o.id===queued).state,'cancelled');assert.equal(ops.find(o=>o.id===running).state,'cancel_requested');
 assert.equal((await admin.query("SELECT count(*)::int AS n FROM usage_ledger WHERE operation_id=$1 AND kind='release'",[queued])).rows[0].n,1);assert.equal((await admin.query("SELECT count(*)::int AS n FROM usage_ledger WHERE operation_id=$1 AND kind='release'",[running])).rows[0].n,0);
 assert.ok((await admin.query('SELECT revoked_at FROM api_keys WHERE id=$1',[key])).rows[0].revoked_at);
 await assert.rejects(f.change(f.owner,1,'remove',{expected_version:1,acknowledge:true}),code('MEMBERSHIP_VERSION_CONFLICT'));await assert.rejects(f.change(f.owner,1,'role',{expected_version:2,role:'Editor'}),code('MEMBERSHIP_INACTIVE'));
 await assert.rejects(tenant(f.workspace,f.users[1],tx=>assertCurrentAuthority(tx,f.manager,'read')),code('RESOURCE_NOT_FOUND'));
 assert.equal((await admin.query('SELECT count(*)::int AS n FROM membership_changes WHERE workspace_id=$1',[f.workspace])).rows[0].n,1);
})));
test('exclusive workspace admission precedes member SHARE locks when two managers mutate concurrently',async()=>fixture(async f=>{
 const mutate=(actor:Principal,role:'Viewer'|'Billing')=>tenant(f.workspace,actor.user,async tx=>{
  const current=await assertCurrentAuthority(tx,actor,'manage',undefined,'exclusive');
  return lifecycle!.changeMembership(tx,current,f.ids[2],'role',{expected_version:1,role});
 });
 const outcomes=await Promise.allSettled([mutate(f.owner,'Billing'),mutate(f.manager,'Viewer')]);
 assert.equal(outcomes.filter(r=>r.status==='fulfilled').length,1);const rejected=outcomes.find(r=>r.status==='rejected');assert.ok(rejected?.status==='rejected');assert.equal((rejected.reason as {code?:string}).code,'MEMBERSHIP_VERSION_CONFLICT','Only current-version conflict may deny the second manager; no deadlock or lock timeout.');
}));
