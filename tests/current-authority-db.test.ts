import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import pg from 'pg';
import env from '@next/env';
import { tenant, closeDb } from '../src/server/db';
import type { Principal } from '../src/server/auth';
import { AppError } from '../src/server/errors';
env.loadEnvConfig(process.cwd());
const admin = new pg.Pool({ connectionString: process.env.MIGRATION_DATABASE_URL });
const workspace = randomUUID(), other = randomUUID(), user = 'authority-' + randomUUID(), key = randomUUID();
const session: Principal = { workspace, user, role: 'Owner' };
const delegated: Principal = { workspace, user: 'api-key:' + key, role: 'Owner', api_key: { id: key, scopes: ['emails:read', 'emails:write'], delegator: user } };
const authorityModule = await import('../src/server/current-authority').catch(() => null);
const code = (expected: string) => (e: unknown) => e instanceof AppError && e.code === expected;
async function check(p: Principal, action: 'read' | 'edit' | 'manage', scope?: string) {
  assert.ok(authorityModule?.assertCurrentAuthority, 'The current transaction authority helper must exist.');
  return tenant(p.workspace, p.user, tx => authorityModule.assertCurrentAuthority(tx, p, action, scope));
}
before(async () => {
  await admin.query("INSERT INTO workspaces(id,name)VALUES($1,'Authority fixture'),($2,'Authority foreign')", [workspace, other]);
  await admin.query("INSERT INTO memberships(workspace_id,user_id,role)VALUES($1,$3,'Owner'),($2,$3,'Owner')", [workspace, other, user]);
  await admin.query("INSERT INTO api_keys(workspace_id,id,key_hash,name,scopes,created_by,expires_at)VALUES($1,$2,$3,'Authority fixture',$4,$5,now()+interval '1 hour')", [workspace,key,randomUUID(),JSON.stringify(delegated.api_key!.scopes),user]);
});
after(async () => {
  for (const table of ['api_keys','memberships']) await admin.query(`DELETE FROM ${table} WHERE workspace_id=ANY($1::uuid[])`, [[workspace,other]]);
  await admin.query('DELETE FROM workspaces WHERE id=ANY($1::uuid[])', [[workspace,other]]);
  await admin.end(); await closeDb();
});
test('a principal resolved before membership revocation cannot enter a resource transaction', async () => {
  assert.equal((await check(session,'edit')).role,'Owner');
  await admin.query("UPDATE memberships SET status='revoked' WHERE workspace_id=$1",[workspace]);
  try { await assert.rejects(check(session,'read'),code('RESOURCE_NOT_FOUND')); }
  finally { await admin.query("UPDATE memberships SET status='active' WHERE workspace_id=$1",[workspace]); }
});
test('current role replaces the resolved role and prevents stale editing/management authority', async () => {
  await admin.query("UPDATE memberships SET role='Viewer' WHERE workspace_id=$1",[workspace]);
  try {
    assert.equal((await check(session,'read')).role,'Viewer');
    await assert.rejects(check(session,'edit'),code('INSUFFICIENT_SCOPE'));
    await assert.rejects(check(session,'manage'),code('INSUFFICIENT_SCOPE'));
    await admin.query("UPDATE memberships SET role='Billing' WHERE workspace_id=$1",[workspace]);
    await assert.rejects(check(session,'read'),code('INSUFFICIENT_SCOPE'));
  } finally { await admin.query("UPDATE memberships SET role='Owner' WHERE workspace_id=$1",[workspace]); }
});
test('current API scopes, expiry, revocation, issuer and workspace binding fence delegation', async () => {
  assert.equal((await check(delegated,'edit','emails:write')).api_key?.id,key);
  await admin.query('UPDATE api_keys SET scopes=$1 WHERE id=$2',[JSON.stringify(['emails:read']),key]);
  try {
    await assert.rejects(check(delegated,'edit','emails:write'),code('INSUFFICIENT_SCOPE'));
    assert.deepEqual((await check(delegated,'read','emails:read')).api_key?.scopes,['emails:read']);
    // Operation routes select their concrete scope after fetching the operation. They must receive current scopes too.
    assert.deepEqual((await check(delegated,'read')).api_key?.scopes,['emails:read']);
    await admin.query('UPDATE api_keys SET revoked_at=now() WHERE id=$1',[key]);
    await assert.rejects(check(delegated,'read'),code('AUTH_REQUIRED'));
    await admin.query("UPDATE api_keys SET revoked_at=NULL,expires_at=now()-interval '1 second' WHERE id=$1",[key]);
    await assert.rejects(check(delegated,'read'),code('AUTH_REQUIRED'));
    await admin.query("UPDATE api_keys SET expires_at=now()+interval '1 hour' WHERE id=$1",[key]);
    await assert.rejects(check({...delegated, workspace:other},'read'),code('AUTH_REQUIRED'));
    await assert.rejects(check({...delegated,api_key:{...delegated.api_key!,delegator:'another-user'}},'read'),code('AUTH_REQUIRED'));
    await admin.query("UPDATE memberships SET role='Editor' WHERE workspace_id=$1",[workspace]);
    await assert.rejects(check(delegated,'edit'),code('AUTH_REQUIRED'));
    await admin.query("UPDATE memberships SET status='revoked' WHERE workspace_id=$1",[workspace]);
    await assert.rejects(check(delegated,'read'),code('AUTH_REQUIRED'));
  } finally {
    await admin.query("UPDATE memberships SET role='Owner',status='active' WHERE workspace_id=$1",[workspace]);
    await admin.query("UPDATE api_keys SET scopes=$1,revoked_at=NULL,expires_at=now()+interval '1 hour' WHERE id=$2",[JSON.stringify(delegated.api_key!.scopes),key]);
  }
});
test('missing/foreign transaction context and inactive workspaces deny private resource authority', async () => {
  assert.ok(authorityModule?.assertCurrentAuthority,'The current transaction authority helper must exist.');
  await assert.rejects(tenant('',user,tx => authorityModule.assertCurrentAuthority(tx,session,'read')),code('RESOURCE_NOT_FOUND'));
  await assert.rejects(tenant(other,user,tx => authorityModule.assertCurrentAuthority(tx,session,'read')),code('RESOURCE_NOT_FOUND'));
  await assert.rejects(tenant(workspace,'someone-else',tx => authorityModule.assertCurrentAuthority(tx,session,'read')),code('RESOURCE_NOT_FOUND'));
  await admin.query("UPDATE workspaces SET status='locked' WHERE id=$1",[workspace]);
  try { await assert.rejects(check(session,'read'),code('WORKSPACE_LOCKED')); }
  finally { await admin.query("UPDATE workspaces SET status='active' WHERE id=$1",[workspace]); }
});
test('a current transaction holds authority until commit and later admission observes committed revocation', async () => {
  assert.ok(authorityModule?.assertCurrentAuthority,'The current transaction authority helper must exist.');
  let release!:()=>void,admitted!:()=>void,runtimePid=0;
  const hold=new Promise<void>(r=>{release=r;}),ready=new Promise<void>(r=>{admitted=r;});
  const transaction=tenant(workspace,user,async tx=>{
    await authorityModule.assertCurrentAuthority(tx,session,'read');
    runtimePid=(await tx.query('SELECT pg_backend_pid() AS pid')).rows[0].pid;
    admitted();await hold;
    return (await tx.query('SELECT name FROM workspaces WHERE id=$1',[workspace])).rows[0].name;
  });
  const changer=await admin.connect();let update:Promise<pg.QueryResult>|undefined;
  try{
    await Promise.race([ready,new Promise<never>((_,reject)=>{const t=setTimeout(()=>reject(new Error('Admission timed out')),3000);t.unref();})]);
    update=changer.query("UPDATE memberships SET status='revoked' WHERE workspace_id=$1",[workspace]);
    let blocked=false;
    for(let i=0;i<100;i++){
      blocked=!!(await admin.query('SELECT 1 FROM pg_stat_activity WHERE $1::int=ANY(pg_blocking_pids(pid))',[runtimePid])).rowCount;
      if(blocked)break;
      await new Promise(r=>setTimeout(r,10));
    }
    assert.ok(blocked,'Revocation must wait for the admitted transaction to commit.');
    release();assert.equal(await transaction,'Authority fixture');await update;
    await assert.rejects(check(session,'read'),code('RESOURCE_NOT_FOUND'));
  }finally{
    release();await transaction.catch(()=>undefined);await update?.catch(()=>undefined);changer.release();
    await admin.query("UPDATE memberships SET status='active' WHERE workspace_id=$1",[workspace]);
  }
});
