import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import pg from 'pg';
import env from '@next/env';
import { tenant } from '../src/server/db';
import { readDispatchControls, setWorkspaceDispatchPolicy, setOperatorDispatchPolicy, dispatchPolicyFence } from '../src/server/dispatch-controls';
env.loadEnvConfig(process.cwd());
test('dispatch policy authority is isolated, immutable evidence survives, and shared fences deny post-cutover races', async () => {
  assert.equal(process.env.LOCAL_DEVELOPMENT,'true','global policy fixtures require local development');
  assert.ok(['127.0.0.1','localhost'].includes(new URL(process.env.MIGRATION_DATABASE_URL!).hostname));
  const db = new pg.Pool({ connectionString: process.env.MIGRATION_DATABASE_URL });
  const w=randomUUID(), other=randomUUID(), user='policy-test-'+randomUUID(), p={workspace:w,user,role:'Owner' as const};
  const runtimePool=new pg.Pool({connectionString:process.env.DATABASE_URL});
  let fence: pg.PoolClient|undefined;
  async function operator(target: 'global'|'ses', paused: boolean) {
    const tx=await db.connect();
    try {
      await tx.query('BEGIN'); await tx.query("SELECT set_config('app.user_id',$1,true)",[user]); await tx.query('SET LOCAL ROLE mailcraft_dispatch_operator');
      const scope=target==='global'?'global':'provider';
      const version=(await tx.query('SELECT version FROM dispatch_controls WHERE scope=$1 AND target=$2',[scope,target])).rows[0].version;
      await setOperatorDispatchPolicy(tx,target,{expected_version:version,paused,reason:paused?'incident':'verified_recovery'});
      await tx.query('COMMIT');
    } catch(error) { await tx.query('ROLLBACK'); throw error; }
    finally { tx.release(); }
  }
  let policiesExisted=false;
  try {
    await db.query('INSERT INTO workspaces(id,name)VALUES($1,$3),($2,$3)',[w,other,'Dispatch policy fixture']);
    await db.query("INSERT INTO memberships(workspace_id,user_id,role)VALUES($1,$3,'Owner'),($2,$3,'Owner')",[w,other,user]);
    assert.equal((await tenant(w,user,(tx)=>dispatchPolicyFence(tx,w,'ses'))).reason,'POLICY_UNAVAILABLE');
    const initial=await tenant(w,user,(tx)=>readDispatchControls(tx,w));
    assert.equal(initial.global?.paused,true,'never run global fixture changes over an existing released operator stop');
    assert.equal(initial.providers.find((row)=>row.provider==='ses')?.policy?.paused,true);
    policiesExisted=true;
    assert.equal(initial.workspace.paused,true); assert.equal(initial.workspace.version,0);
    await assert.rejects(()=>tenant(w,user,(tx)=>setOperatorDispatchPolicy(tx,'global',{expected_version:initial.global!.version,paused:false,reason:'verified_recovery'})));
    const unpaused=await tenant(w,user,(tx)=>setWorkspaceDispatchPolicy(tx,p,{expected_version:0,paused:false,reason:'verified_recovery'}));
    assert.equal(unpaused.workspace.version,1); assert.equal(unpaused.dispatch_enabled,false);
    await assert.rejects(()=>tenant(w,user,(tx)=>setWorkspaceDispatchPolicy(tx,p,{expected_version:0,paused:true,reason:'incident'})));
    assert.equal((await tenant(other,user,(tx)=>tx.query("SELECT * FROM dispatch_controls WHERE scope='workspace' AND target=$1",[w]))).rowCount,0);
    await assert.rejects(()=>tenant(w,user,(tx)=>tx.query("INSERT INTO dispatch_controls(scope,target,workspace_id,paused,reason)VALUES('workspace',$1,$1,true,'incident')",[other])));
    await assert.rejects(()=>tenant(w,user,(tx)=>tx.query("UPDATE dispatch_controls SET target=$1,workspace_id=$1 WHERE scope='workspace'",[other])));
    await assert.rejects(()=>tenant(w,user,(tx)=>tx.query("DELETE FROM dispatch_controls WHERE scope='workspace'")));
    await assert.rejects(()=>tenant(w,user,(tx)=>tx.query("UPDATE dispatch_policy_events SET paused=false WHERE workspace_id=$1",[w])));
    await assert.rejects(()=>tenant(w,user,(tx)=>tx.query("INSERT INTO dispatch_policy_events(scope,target,workspace_id,version,paused,reason,actor)VALUES('workspace',$1,$1,99,false,'verified_recovery','forged')",[w])));
    const op=await db.connect();
    try { await op.query('BEGIN'); await op.query('SET LOCAL ROLE mailcraft_dispatch_operator'); await assert.rejects(()=>op.query('SELECT * FROM contacts')); await op.query('ROLLBACK'); } finally { op.release(); }
    for(const role of ['Editor','Viewer','Billing']) {
      await db.query('UPDATE memberships SET role=$1 WHERE workspace_id=$2 AND user_id=$3',[role,w,user]);
      await assert.rejects(()=>tenant(w,user,(tx)=>setWorkspaceDispatchPolicy(tx,p,{expected_version:1,paused:true,reason:'incident'})));
    }
    await db.query("UPDATE memberships SET role='Owner',status='revoked' WHERE workspace_id=$1 AND user_id=$2",[w,user]);
    await assert.rejects(()=>tenant(w,user,(tx)=>setWorkspaceDispatchPolicy(tx,p,{expected_version:1,paused:true,reason:'incident'})));
    await db.query("UPDATE memberships SET status='active' WHERE workspace_id=$1 AND user_id=$2",[w,user]);
    await operator('global',false); await operator('ses',false);
    assert.equal((await tenant(w,user,(tx)=>dispatchPolicyFence(tx,w,'ses'))).allowed,true);
    for(const target of ['global','ses','workspace'] as const) {
      const before=await tenant(w,user,(tx)=>readDispatchControls(tx,w));
      assert.equal(before.workspace.paused,false);
      if(target==='workspace') await tenant(w,user,(tx)=>setWorkspaceDispatchPolicy(tx,p,{expected_version:before.workspace.version,paused:true,reason:'incident'}));
      else await operator(target,true);
      const after=await tenant(w,user,(tx)=>dispatchPolicyFence(tx,w,'ses'));
      assert.equal(after.allowed,false); assert.equal(after.reason,target==='global'?'GLOBAL_PAUSED':target==='ses'?'PROVIDER_PAUSED':'WORKSPACE_PAUSED');
      if(target==='workspace') {
        const now=await tenant(w,user,(tx)=>readDispatchControls(tx,w));
        await tenant(w,user,(tx)=>setWorkspaceDispatchPolicy(tx,p,{expected_version:now.workspace.version,paused:false,reason:'verified_recovery'}));
      } else await operator(target,false);
    }
    fence=await runtimePool.connect();
    await fence.query('BEGIN'); await fence.query("SELECT set_config('app.workspace_id',$1,true),set_config('app.user_id',$2,true)",[w,user]);
    assert.equal((await dispatchPolicyFence(fence,w,'ses')).allowed,true);
    let pauseCommitted=false;
    const pause=operator('global',true).then(()=>{pauseCommitted=true;});
    await new Promise((resolve)=>setTimeout(resolve,100));
    assert.equal(pauseCommitted,false,'pause cannot commit while an earlier final policy fence remains open');
    await fence.query('COMMIT'); await pause;
    assert.equal((await tenant(w,user,(tx)=>dispatchPolicyFence(tx,w,'ses'))).reason,'GLOBAL_PAUSED');
    const evidence=await tenant(w,user,(tx)=>tx.query('SELECT version,paused FROM dispatch_policy_events ORDER BY version'));
    assert.deepEqual(evidence.rows.map((row)=>row.version),[1,2,3]);
    assert.equal((await tenant(other,user,(tx)=>tx.query('SELECT * FROM dispatch_policy_events'))).rowCount,0);
    const roles=(await db.query("SELECT rolcanlogin,rolsuper,rolbypassrls,rolcreatedb,rolcreaterole FROM pg_roles WHERE rolname IN('mailcraft_dispatch_operator','mailcraft_policy_evidence')")).rows;
    assert.equal(roles.length,2); assert.ok(roles.every((row)=>Object.values(row).every((value)=>value===false)));
  } finally {
    await fence?.query('ROLLBACK').catch(()=>{}); fence?.release(); await runtimePool.end();
    if(policiesExisted) { await operator('global',true); await operator('ses',true); }
    if((await db.query("SELECT to_regclass('public.dispatch_controls') AS t")).rows[0].t) {
      await db.query('DELETE FROM dispatch_policy_events WHERE workspace_id IS NULL AND actor=$1',[user]);
      await db.query('DELETE FROM dispatch_policy_events WHERE workspace_id=ANY($1::uuid[])',[[w,other]]);
      await db.query('DELETE FROM dispatch_controls WHERE workspace_id=ANY($1::uuid[])',[[w,other]]);
    }
    for(const table of ['audit_events','memberships']) await db.query(`DELETE FROM ${table} WHERE workspace_id=ANY($1::uuid[])`,[[w,other]]);
    await db.query('DELETE FROM workspaces WHERE id=ANY($1::uuid[])',[[w,other]]); await db.end();
  }
});
