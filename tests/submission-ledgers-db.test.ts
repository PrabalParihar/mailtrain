import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { sourceDatabase } from '../scripts/smoke-source-truth';
import { digest } from '../src/server/audit';

export async function seedSubmission(f: Parameters<Parameters<typeof sourceDatabase>[0]>[0], count = 1) {
  const { db, p } = f, campaign = randomUUID(), revision = randomUUID(), email = randomUUID(), snapshot = randomUUID(), segment = randomUUID();
  const members = Array.from({ length: count }, (_, index) => ({ id: randomUUID(), locale: 'en-US', consent_version: 1, eligible: index !== 1, reason: index === 1 ? 'SUPPRESSED' : 'ELIGIBLE' })).sort((a, b) => a.id.localeCompare(b.id));
  await db.query("INSERT INTO segments(workspace_id,id,name) VALUES($1,$2,$3)", [p.workspace, segment, 'Staging rule ' + segment]);
  await db.query("INSERT INTO segment_versions(workspace_id,segment_id,version,schema_version,rule,created_by) VALUES($1,$2,1,1,'{}',$3)", [p.workspace, segment, p.user]);
  const evaluated_at = '2026-10-02T09:00:00.000Z', eligible_count = members.filter(m => m.eligible).length;
  const pointer = { id: snapshot, segment_id: segment, segment_version: 1, evaluated_at, matched_count: count, eligible_count, digest: digest({ schema_version: 1, segment_id: segment, segment_version: 1, evaluated_at, members, matched_count: count, eligible_count, excluded_count: count - eligible_count }) };
  await db.query('INSERT INTO audience_snapshots(workspace_id,id,segment_id,segment_version,evaluated_at,members,matched_count,eligible_count,digest,created_by) VALUES($1,$2,$3,1,$4,$5,$6,$7,$8,$9)', [p.workspace, snapshot, segment, evaluated_at, JSON.stringify(members), count, eligible_count, pointer.digest, p.user]);
  await db.query("INSERT INTO emails(workspace_id,id,title,spec,created_by) VALUES($1,$2,'Staging fixture','{}',$3)", [p.workspace, email, p.user]);
  await db.query("INSERT INTO revisions(workspace_id,id,email_id,revision_no,spec,html,plaintext,artifact_hash,manifest,created_by) VALUES($1,$2,$3,1,'{}','<p>Fixture</p>','Fixture',$4,'{}',$5)", [p.workspace, revision, email, digest('fixture'), p.user]);
  const intent = { audience: members, audience_snapshot: pointer }, hash = digest(intent);
  await db.query("INSERT INTO campaigns(workspace_id,id,name,revision_id,intent,digest,created_by) VALUES($1,$2,'Staging fixture',$3,$4,$5,$6)", [p.workspace, campaign, revision, JSON.stringify(intent), hash, p.user]);
  return { campaign, revision, snapshot, members, input: { expected_version: 1, expected_digest: hash } };
}

test('durable staged storage forces RLS and closes attempts and identity mutation', async () => sourceDatabase(async ({ db }) => {
  for (const table of ['submission_ledgers', 'submission_ledger_jobs', 'campaign_recipients', 'deliveries', 'delivery_state_history', 'delivery_attempts']) {
    const row = (await db.query('SELECT relrowsecurity,relforcerowsecurity FROM pg_class WHERE oid=to_regclass($1)', [table])).rows[0];
    assert.deepEqual(row, { relrowsecurity: true, relforcerowsecurity: true }, table + ' must exist with forced RLS');
    for (const privilege of ['DELETE', 'TRUNCATE']) assert.equal((await db.query('SELECT has_table_privilege($1,$2,$3) AS allowed', ['mailcraft_runtime', table, privilege])).rows[0].allowed, false);
  }
  for (const privilege of ['INSERT', 'UPDATE', 'DELETE']) assert.equal((await db.query('SELECT has_table_privilege($1,$2,$3) AS allowed', ['mailcraft_runtime', 'delivery_attempts', privilege])).rows[0].allowed, false);
}));

test('same verified configuration returns original ledger across keys and replay rechecks authority', async () => sourceDatabase(async f => {
  const s = await import('../src/server/submission-ledgers'), a = await seedSubmission(f), key = randomUUID();
  const original = await f.tx(c => s.stageSubmissionLedger(c, f.p, a.campaign, a.input, key));
  assert.equal(original.ledger.authorization_issued, false); assert.equal(original.ledger.dispatch_enabled, false);
  assert.deepEqual(await f.tx(c => s.stageSubmissionLedger(c, f.p, a.campaign, a.input, randomUUID())), original);
  assert.deepEqual(await f.tx(c => s.stageSubmissionLedger(c, f.p, a.campaign, a.input, key)), original);
  await assert.rejects(f.tx(c => s.stageSubmissionLedger(c, f.p, a.campaign, { ...a.input, expected_version: 2 }, randomUUID())), { code: 'VERSION_CONFLICT' });
  await f.db.query("UPDATE memberships SET role='Editor' WHERE workspace_id=$1", [f.p.workspace]);
  await assert.rejects(f.tx(c => s.stageSubmissionLedger(c, f.p, a.campaign, a.input, key)), { code: 'INSUFFICIENT_SCOPE' });
}));

test('strict database transitions and immutable guards reject fabricated dispatch evidence', async () => sourceDatabase(async f => {
  const s = await import('../src/server/submission-ledgers'), { processSubmissionLedgerBatch } = await import('../src/server/submission-ledger-worker');
  const a = await seedSubmission(f, 2), original = await f.tx(c => s.stageSubmissionLedger(c, f.p, a.campaign, a.input, randomUUID()));
  await f.tx(c => processSubmissionLedgerBatch(c, f.p));
  const rows = (await f.db.query('SELECT * FROM deliveries ORDER BY id')).rows, pending = rows.find(r => r.submission_state === 'pending');
  assert.ok(pending);
  for (const state of ['reserved', 'submitting', 'accepted', 'uncertain', 'failed_permanent', 'cancelled'])
    await assert.rejects(f.tx(c => c.query('UPDATE deliveries SET submission_state=$2 WHERE id=$1', [pending.id, state])), /SUBMISSION_STATE_INVALID/);
  for (const sql of ["UPDATE deliveries SET outcome='delivered' WHERE id=$1", 'UPDATE deliveries SET authorization_issued=true WHERE id=$1'])
    await assert.rejects(f.tx(c => c.query(sql, [pending.id])), e => (e as { code: string }).code === '42501');
  await assert.rejects(f.tx(c => c.query("INSERT INTO delivery_attempts(workspace_id,delivery_id,attempt_no,submission_state,request_started_at) VALUES($1,$2,1,'accepted',clock_timestamp())", [f.p.workspace, pending.id])), e => (e as { code: string }).code === '42501');
  await assert.rejects(f.db.query("INSERT INTO delivery_attempts(workspace_id,delivery_id,attempt_no,submission_state,request_started_at) VALUES($1,$2,1,'accepted',clock_timestamp())", [f.p.workspace, pending.id]), e => (e as { code: string }).code === '23514');
  for (const table of ['submission_ledgers', 'submission_ledger_jobs', 'campaign_recipients', 'deliveries', 'delivery_state_history']) {
    await assert.rejects(f.db.query('DELETE FROM ' + table), /SUBMISSION_IMMUTABLE/);
    await assert.rejects(f.db.query('TRUNCATE ' + table + ' CASCADE'), /SUBMISSION_IMMUTABLE/);
  }
  await assert.rejects(f.tx(c => c.query("INSERT INTO delivery_state_history(workspace_id,delivery_id,submission_state,outcome,reason) VALUES($1,$2,'accepted','unknown','ELIGIBLE')", [f.p.workspace, pending.id])), e => (e as { code: string }).code === '42501');
  const cancelled = await f.tx(c => s.cancelSubmissionLedger(c, f.p, original.ledger.id, randomUUID()));
  assert.equal(cancelled.ledger.cancelled_count, 1); assert.equal(cancelled.ledger.skipped_count, 1); assert.equal(cancelled.ledger.pending_count, 0);
  assert.equal((await f.tx(c => s.deliveryHistory(new Request('http://fixture/history'), c, f.p, pending.id))).total_count, 2);
  assert.equal((await f.tx(c => s.deliveryAttempts(new Request('http://fixture/attempts'), c, f.p, pending.id))).total_count, 0);
  assert.deepEqual((await f.tx(c => s.deliveryDetail(c, f.p, pending.id))).delivery.submission_state, 'cancelled');
  assert.deepEqual(await f.tx(c => s.stageSubmissionLedger(c, f.p, a.campaign, a.input, randomUUID())), cancelled);
  await assert.rejects(f.tx(c => c.query("UPDATE deliveries SET submission_state='pending' WHERE id=$1", [pending.id])), /SUBMISSION_STATE_INVALID/);
}));

test('old keyed receipt survives source drift while new commands, filters and current keys are fenced', async () => sourceDatabase(async f => {
  const s = await import('../src/server/submission-ledgers'), a = await seedSubmission(f), key = randomUUID();
  const original = await f.tx(c => s.stageSubmissionLedger(c, f.p, a.campaign, a.input, key));
  await f.db.query("UPDATE campaigns SET name='Next version',version=2,digest=$2 WHERE id=$1", [a.campaign, 'b'.repeat(64)]);
  assert.deepEqual(await f.tx(c => s.stageSubmissionLedger(c, f.p, a.campaign, a.input, key)), original);
  await assert.rejects(f.tx(c => s.stageSubmissionLedger(c, f.p, a.campaign, a.input, randomUUID())), { code: 'VERSION_CONFLICT' });
  assert.equal((await f.tx(c => s.submissionLedgerList(new Request('http://fixture/ledgers'), c, f.p, a.campaign))).total_count, 1);
  for (const query of ['limit=', 'limit=1&limit=2', 'topic_id=x', 'state=accepted'])
    await assert.rejects(f.tx(c => s.submissionLedgerRecipients(new Request('http://fixture/recipients?' + query), c, f.p, original.ledger.id)));
  const credential = randomUUID();
  await f.db.query("INSERT INTO api_keys(workspace_id,id,key_hash,name,scopes,created_by,expires_at) VALUES($1,$2,$3,'Ledger read',$4,$5,clock_timestamp()+interval '1 hour')", [f.p.workspace, credential, digest(credential), JSON.stringify(['campaigns:read']), f.p.user]);
  const api = { ...f.p, user: 'api-key:' + credential, api_key: { id: credential, delegator: f.p.user, scopes: ['campaigns:read', 'audience:read'] } };
  await assert.rejects(f.tx(c => s.submissionLedgerDetail(c, api, original.ledger.id), api.user), { code: 'INSUFFICIENT_SCOPE' });
  await f.db.query('UPDATE api_keys SET scopes=$2 WHERE id=$1', [credential, JSON.stringify(['campaigns:read', 'audience:read'])]);
  assert.equal((await f.tx(c => s.submissionLedgerDetail(c, api, original.ledger.id), api.user)).ledger.id, original.ledger.id);
  await f.db.query('UPDATE api_keys SET revoked_at=clock_timestamp() WHERE id=$1', [credential]);
  await assert.rejects(f.tx(c => s.submissionLedgerDetail(c, api, original.ledger.id), api.user), { code: 'AUTH_REQUIRED' });
  await f.db.query("UPDATE workspaces SET status='paused' WHERE id=$1", [f.p.workspace]);
  await assert.rejects(f.tx(c => s.stageSubmissionLedger(c, f.p, a.campaign, a.input, key)), { code: 'WORKSPACE_LOCKED' });
}));

test('tenant and composite source pins cannot be rebound by restricted SQL', async () => sourceDatabase(async f => {
  const s = await import('../src/server/submission-ledgers'), a = await seedSubmission(f), original = await f.tx(c => s.stageSubmissionLedger(c, f.p, a.campaign, a.input, randomUUID()));
  const foreign = randomUUID();
  await f.db.query("INSERT INTO workspaces(id,name) VALUES($1,'Foreign fixture')", [foreign]);
  await f.db.query("INSERT INTO memberships(workspace_id,user_id,role) VALUES($1,$2,'Owner')", [foreign, f.p.user]);
  assert.equal((await f.tx(async c => { await c.query("SELECT set_config('app.workspace_id',$1,true)", [foreign]); return c.query('SELECT id FROM submission_ledgers'); })).rowCount, 0);
  await assert.rejects(f.tx(c => c.query('INSERT INTO submission_ledger_jobs(workspace_id,id) VALUES($1,$2)', [foreign, original.ledger.id])), e => (e as { code: string }).code === '42501');
  await assert.rejects(f.db.query('INSERT INTO submission_ledger_jobs(workspace_id,id) VALUES($1,$2)', [foreign, original.ledger.id]), /SUBMISSION_PROGRESS_INVALID|foreign key/);
  await assert.rejects(f.db.query("UPDATE submission_ledgers SET artifact_hash=$2 WHERE id=$1", [original.ledger.id, 'b'.repeat(64)]), /SUBMISSION_IMMUTABLE/);
  await assert.rejects(f.tx(c => c.query(`INSERT INTO submission_ledgers(workspace_id,campaign_id,configuration_id,configuration_version,configuration_digest,revision_id,artifact_hash,snapshot_id,snapshot_digest,members,total_count,created_by)
    SELECT workspace_id,campaign_id,configuration_id,configuration_version,configuration_digest,revision_id,artifact_hash,snapshot_id,snapshot_digest,'[]',0,created_by FROM submission_ledgers WHERE id=$1`, [original.ledger.id])), /SUBMISSION_MANIFEST_INVALID/);
}));

test('concurrent distinct commands create exactly one ledger and cancellation remains idempotent', async () => sourceDatabase(async f => {
  const s = await import('../src/server/submission-ledgers'), a = await seedSubmission(f);
  const [first, second] = await Promise.all([f.tx(c => s.stageSubmissionLedger(c, f.p, a.campaign, a.input, randomUUID())), f.tx(c => s.stageSubmissionLedger(c, f.p, a.campaign, a.input, randomUUID()))]);
  assert.deepEqual(first, second);
  assert.equal((await f.db.query('SELECT count(*)::int AS n FROM submission_ledgers')).rows[0].n, 1);
  const key = randomUUID(), cancelled = await f.tx(c => s.cancelSubmissionLedger(c, f.p, first.ledger.id, key));
  assert.equal(cancelled.ledger.status, 'cancelled'); assert.equal(cancelled.ledger.processed_count, 0);
  assert.deepEqual(await f.tx(c => s.cancelSubmissionLedger(c, f.p, first.ledger.id, key)), cancelled);
  assert.deepEqual(await f.tx(c => s.cancelSubmissionLedger(c, f.p, first.ledger.id, randomUUID())), cancelled);
  assert.deepEqual(await f.tx(c => s.stageSubmissionLedger(c, f.p, a.campaign, a.input, randomUUID())), cancelled);
}));

type SubmissionFixture = Parameters<Parameters<typeof sourceDatabase>[0]>[0];
type CredentialMode = 'API key' | 'local session';
async function credentialForLockWait(f: SubmissionFixture, mode: CredentialMode) {
  const credential = randomUUID();
  if (mode === 'API key') {
    const scopes = ['campaigns:write', 'campaigns:read', 'audience:read'];
    await f.db.query("INSERT INTO api_keys(workspace_id,id,key_hash,name,scopes,created_by,expires_at) VALUES($1,$2,$3,'Receipt expiry fixture',$4,$5,clock_timestamp()+interval '1 hour')", [f.p.workspace, credential, digest(credential), JSON.stringify(scopes), f.p.user]);
    return { p: { ...f.p, user: 'api-key:' + credential, api_key: { id: credential, delegator: f.p.user, scopes } },
      table: 'api_keys', column: 'id', credential };
  }
  const token_hash = digest(credential);
  await f.db.query("INSERT INTO auth_sessions(token_hash,user_id,expires_at) VALUES($1,$2,clock_timestamp()+interval '1 hour')", [token_hash, f.p.user]);
  return { p: { ...f.p, local_session: { token_hash } }, table: 'auth_sessions', column: 'token_hash', credential: token_hash };
}
async function commandAfterExpiredLock(f: SubmissionFixture, identity: Awaited<ReturnType<typeof credentialForLockWait>>, action: string, key: string, run: Parameters<SubmissionFixture['tx']>[0]) {
  const blocker = await f.db.connect();
  let pending: Promise<unknown> | undefined;
  try {
    await blocker.query('BEGIN');
    await blocker.query('SELECT pg_advisory_xact_lock(hashtext($1))', [f.p.workspace + ':' + identity.p.user + ':' + action + ':' + key]);
    const pid = (await blocker.query('SELECT pg_backend_pid() AS pid')).rows[0].pid;
    await f.db.query(`UPDATE ${identity.table} SET expires_at=clock_timestamp()+interval '2 seconds' WHERE ${identity.column}=$1`, [identity.credential]);
    pending = f.tx(run, identity.p.user);
    void pending.catch(() => undefined);
    let waiting = false;
    for (let i = 0; i < 200 && !waiting; i++) {
      waiting = (await f.db.query("SELECT EXISTS(SELECT FROM pg_stat_activity WHERE datname=current_database() AND $1::int=ANY(pg_blocking_pids(pid)) AND query='SELECT pg_advisory_xact_lock(hashtext($1))') AS waiting", [pid])).rows[0].waiting;
      if (!waiting) await new Promise(resolve => setTimeout(resolve, 10));
    }
    assert.equal(waiting, true, 'initial authority passed and the command is waiting on its exact idempotency lock');
    assert.equal((await f.db.query(`SELECT expires_at>clock_timestamp() AS valid FROM ${identity.table} WHERE ${identity.column}=$1`, [identity.credential])).rows[0].valid, true);
    await blocker.query(`SELECT pg_sleep(greatest(0,extract(epoch FROM expires_at-clock_timestamp()))+0.05) FROM ${identity.table} WHERE ${identity.column}=$1`, [identity.credential]);
    assert.equal((await blocker.query(`SELECT expires_at<=clock_timestamp() AS expired FROM ${identity.table} WHERE ${identity.column}=$1`, [identity.credential])).rows[0].expired, true);
  } finally {
    await blocker.query('COMMIT');
    blocker.release();
  }
  return pending;
}

for (const mode of ['API key', 'local session'] as const) {
  for (const command of ['stage', 'cancel'] as const) {
    test(`cached ${command} receipt denies ${mode} expiry during its idempotency lock wait`, async () => sourceDatabase(async f => {
      const s = await import('../src/server/submission-ledgers'), a = await seedSubmission(f), identity = await credentialForLockWait(f, mode), key = randomUUID();
      const original = await f.tx(c => s.stageSubmissionLedger(c, identity.p, a.campaign, a.input, command === 'stage' ? key : randomUUID()), identity.p.user);
      if (command === 'cancel') await f.tx(c => s.cancelSubmissionLedger(c, identity.p, original.ledger.id, key), identity.p.user);
      const resource = command === 'stage' ? a.campaign : original.ledger.id, action = 'submission-ledger.' + (command === 'stage' ? 'create:' : 'cancel:') + resource;
      const before = (await f.db.query('SELECT * FROM idempotency ORDER BY action,key')).rows;
      const ledgers = (await f.db.query('SELECT * FROM submission_ledgers')).rows;
      const jobs = (await f.db.query('SELECT * FROM submission_ledger_jobs')).rows;
      await assert.rejects(commandAfterExpiredLock(f, identity, action, key, c => command === 'stage'
        ? s.stageSubmissionLedger(c, identity.p, a.campaign, a.input, key)
        : s.cancelSubmissionLedger(c, identity.p, original.ledger.id, key)), { code: 'AUTH_REQUIRED' });
      assert.deepEqual((await f.db.query('SELECT * FROM idempotency ORDER BY action,key')).rows, before);
      assert.deepEqual((await f.db.query('SELECT * FROM submission_ledgers')).rows, ledgers);
      assert.deepEqual((await f.db.query('SELECT * FROM submission_ledger_jobs')).rows, jobs);
    }));
  }
}

for (const command of ['stage', 'cancel'] as const) {
  test(`fresh ${command} changes roll back after local session expiry during its idempotency lock wait`, async () => sourceDatabase(async f => {
    const s = await import('../src/server/submission-ledgers'), a = await seedSubmission(f), identity = await credentialForLockWait(f, 'local session'), key = randomUUID();
    const original = command === 'cancel' ? await f.tx(c => s.stageSubmissionLedger(c, identity.p, a.campaign, a.input, randomUUID()), identity.p.user) : null;
    if (original) {
      const { processSubmissionLedgerBatch } = await import('../src/server/submission-ledger-worker');
      await f.tx(c => processSubmissionLedgerBatch(c, f.p));
    }
    const resource = original?.ledger.id ?? a.campaign, action = 'submission-ledger.' + (command === 'stage' ? 'create:' : 'cancel:') + resource;
    const tables = ['submission_ledgers', 'submission_ledger_jobs', 'deliveries', 'delivery_state_history', 'idempotency'];
    const before = await Promise.all(tables.map(table => f.db.query('SELECT * FROM ' + table + ' ORDER BY 1,2').then(result => result.rows)));
    await assert.rejects(commandAfterExpiredLock(f, identity, action, key, c => command === 'stage'
      ? s.stageSubmissionLedger(c, identity.p, a.campaign, a.input, key)
      : s.cancelSubmissionLedger(c, identity.p, resource, key)), { code: 'AUTH_REQUIRED' });
    const after = await Promise.all(tables.map(table => f.db.query('SELECT * FROM ' + table + ' ORDER BY 1,2').then(result => result.rows)));
    assert.deepEqual(after, before, 'fresh manifest, cancellation, history and receipt writes must roll back together');
  }));
}

test('fresh stale-version stage denies local session expiry during its idempotency lock wait', async () => sourceDatabase(async f => {
  const s = await import('../src/server/submission-ledgers'), a = await seedSubmission(f), identity = await credentialForLockWait(f, 'local session'), key = randomUUID();
  const before = (await f.db.query('SELECT * FROM campaigns')).rows;
  await assert.rejects(commandAfterExpiredLock(f, identity, 'submission-ledger.create:' + a.campaign, key,
    c => s.stageSubmissionLedger(c, identity.p, a.campaign, { ...a.input, expected_version: 2 }, key)), { code: 'AUTH_REQUIRED' });
  assert.deepEqual((await f.db.query('SELECT * FROM campaigns')).rows, before);
  assert.equal((await f.db.query('SELECT count(*)::int AS n FROM submission_ledgers')).rows[0].n, 0);
  assert.equal((await f.db.query('SELECT count(*)::int AS n FROM idempotency')).rows[0].n, 0);
}));
