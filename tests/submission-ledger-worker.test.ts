import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { randomUUID, createHash } from 'node:crypto';
import { sourceDatabase } from '../scripts/smoke-source-truth';
import { digest } from '../src/server/audit';

async function seedSubmission(f: Parameters<Parameters<typeof sourceDatabase>[0]>[0], count = 1) {
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

test('staging batches survive rollback and locked duplicate workers, preserve source drift, and stop at 100', async () => sourceDatabase(async f => {
  assert.ok(existsSync('src/server/submission-ledger-worker.ts'), 'durable staged worker is missing');
  const s = await import('../src/server/submission-ledgers'), { processSubmissionLedgerBatch } = await import('../src/server/submission-ledger-worker');
  const a = await seedSubmission(f, 101), original = await f.tx(c => s.stageSubmissionLedger(c, f.p, a.campaign, a.input, randomUUID()));
  const id = original.ledger.id;
  await assert.rejects(f.tx(async c => { assert.equal((await processSubmissionLedgerBatch(c, f.p))?.processed_count, 100); throw Error('Owned simulated crash'); }), /Owned simulated crash/);
  assert.equal((await f.tx(c => s.submissionLedgerDetail(c, f.p, id))).ledger.processed_count, 0);
  assert.equal((await f.db.query('SELECT count(*)::int AS n FROM deliveries')).rows[0].n, 0);
  await f.db.query("UPDATE campaigns SET name='Changed config',version=2,digest=$2 WHERE id=$1", [a.campaign, 'b'.repeat(64)]);
  const first = await f.tx(async c => {
    await c.query('SELECT id FROM submission_ledger_jobs WHERE id=$1 FOR UPDATE', [id]);
    assert.equal(await f.tx(other => processSubmissionLedgerBatch(other, f.p)), null);
    return processSubmissionLedgerBatch(c, f.p);
  });
  assert.equal(first?.processed_count, 100);
  assert.equal((await f.tx(c => processSubmissionLedgerBatch(c, f.p)))?.status, 'completed');
  const ledger = (await f.tx(c => s.submissionLedgerDetail(c, f.p, id))).ledger;
  assert.equal(ledger.configuration_version, 1); assert.equal(ledger.processed_count, 101); assert.equal(ledger.skipped_count, 1);
  const page = await f.tx(c => s.submissionLedgerRecipients(new Request('http://fixture/v1/submission-ledgers/' + id + '/recipients?limit=100'), c, f.p, id));
  assert.equal(page.total_count, 101); assert.equal(page.data.length, 100); assert.ok(page.next_cursor);
  const second = await f.tx(c => s.submissionLedgerRecipients(new Request('http://fixture/v1/submission-ledgers/' + id + '/recipients?after=' + page.next_cursor), c, f.p, id));
  assert.equal(second.data.length, 1); assert.equal(new Set([...page.data, ...second.data].map(r => r.id)).size, 101);
  for (const row of [...page.data, ...second.data]) {
    assert.equal(row.logical_send_key, createHash('sha256').update(JSON.stringify([f.p.workspace, ledger.configuration_id, row.contact_id])).digest('hex'));
    assert.equal((await f.tx(c => s.deliveryHistory(new Request('http://fixture/v1/deliveries/' + row.delivery_id + '/history'), c, f.p, row.delivery_id))).total_count, 1);
  }
  for (const table of ['delivery_attempts', 'frequency_reservations', 'operations', 'outbox']) {
    assert.equal((await f.db.query('SELECT count(*)::int AS n FROM ' + table)).rows[0].n, 0, table);
  }
  assert.equal(await f.tx(c => processSubmissionLedgerBatch(c, f.p)), null);
}));

test('creator revocation cancels remaining staging and preserves every committed history record', async () => sourceDatabase(async f => {
  const s = await import('../src/server/submission-ledgers'), { processSubmissionLedgerBatch } = await import('../src/server/submission-ledger-worker');
  const a = await seedSubmission(f, 101), original = await f.tx(c => s.stageSubmissionLedger(c, f.p, a.campaign, a.input, randomUUID()));
  await f.db.query("INSERT INTO memberships(workspace_id,user_id,role) VALUES($1,'staging-worker','Owner')", [f.p.workspace]);
  const worker = { ...f.p, user: 'staging-worker' };
  await f.tx(c => processSubmissionLedgerBatch(c, worker), worker.user);
  await f.db.query("UPDATE memberships SET role='Viewer' WHERE workspace_id=$1 AND user_id=$2", [f.p.workspace, f.p.user]);
  assert.equal((await f.tx(c => processSubmissionLedgerBatch(c, worker), worker.user))?.status, 'cancelled');
  const ledger = (await f.tx(c => s.submissionLedgerDetail(c, worker, original.ledger.id), worker.user)).ledger;
  assert.equal(ledger.processed_count, 100); assert.equal(ledger.pending_count, 0); assert.equal(ledger.cancelled_count + ledger.skipped_count, 100);
  const before = (await f.db.query('SELECT * FROM delivery_state_history ORDER BY id')).rows;
  assert.deepEqual(await f.tx(c => s.cancelSubmissionLedger(c, worker, ledger.id, randomUUID()), worker.user), { ledger });
  assert.deepEqual((await f.db.query('SELECT * FROM delivery_state_history ORDER BY id')).rows, before);
  assert.equal((await f.db.query('SELECT count(*)::int AS n FROM campaign_recipients')).rows[0].n, 100);
}));

test('a transaction cannot materialize more than 100 and partial recipient insertion cannot commit', async () => sourceDatabase(async f => {
  const s = await import('../src/server/submission-ledgers'), { processSubmissionLedgerBatch } = await import('../src/server/submission-ledger-worker');
  const a = await seedSubmission(f, 201), original = await f.tx(c => s.stageSubmissionLedger(c, f.p, a.campaign, a.input, randomUUID()));
  await assert.rejects(f.tx(async c => { await processSubmissionLedgerBatch(c, f.p); await processSubmissionLedgerBatch(c, f.p); }), /SUBMISSION_RECIPIENT_INVALID/);
  assert.equal((await f.tx(c => s.submissionLedgerDetail(c, f.p, original.ledger.id))).ledger.processed_count, 0);
  await assert.rejects(f.tx(c => c.query(`INSERT INTO campaign_recipients(workspace_id,ledger_id,configuration_id,contact_id,captured_locale,captured_reason,captured_consent_version,logical_send_key)
    VALUES($1,$2,$3,$4,'false','ELIGIBLE',99,'')`, [f.p.workspace, original.ledger.id, original.ledger.configuration_id, a.members[0].id])), /SUBMISSION_PROGRESS_INVALID/);
  assert.equal((await f.db.query('SELECT count(*)::int AS n FROM campaign_recipients')).rows[0].n, 0);
  await f.tx(c => processSubmissionLedgerBatch(c, f.p));
  await assert.rejects(f.tx(c => c.query("UPDATE submission_ledger_jobs SET processed_count=101,status='running' WHERE id=$1", [original.ledger.id])), /SUBMISSION_PROGRESS_INVALID/);
  assert.equal((await f.tx(c => s.submissionLedgerDetail(c, f.p, original.ledger.id))).ledger.processed_count, 100);
}));

test('creator key revocation and campaign cancellation stop work; empty snapshots complete truthfully', async () => sourceDatabase(async f => {
  const s = await import('../src/server/submission-ledgers'), { processSubmissionLedgerBatch } = await import('../src/server/submission-ledger-worker');
  const a = await seedSubmission(f, 101), credential = randomUUID();
  await f.db.query("INSERT INTO api_keys(workspace_id,id,key_hash,name,scopes,created_by,expires_at) VALUES($1,$2,$3,'Staging key',$4,$5,clock_timestamp()+interval '1 hour')", [f.p.workspace, credential, digest(credential), JSON.stringify(['campaigns:write', 'audience:read']), f.p.user]);
  const api = { ...f.p, user: 'api-key:' + credential, api_key: { id: credential, delegator: f.p.user, scopes: ['campaigns:write', 'audience:read'] } };
  const original = await f.tx(c => s.stageSubmissionLedger(c, api, a.campaign, a.input, randomUUID()), api.user);
  await f.tx(c => processSubmissionLedgerBatch(c, f.p));
  await f.db.query('UPDATE api_keys SET revoked_at=clock_timestamp() WHERE id=$1', [credential]);
  assert.equal((await f.tx(c => processSubmissionLedgerBatch(c, f.p)))?.status, 'cancelled');
  assert.equal((await f.tx(c => s.submissionLedgerDetail(c, f.p, original.ledger.id))).ledger.pending_count, 0);
  const b = await seedSubmission(f, 1), blocked = await f.tx(c => s.stageSubmissionLedger(c, f.p, b.campaign, b.input, randomUUID()));
  await f.db.query("UPDATE campaigns SET state='cancelled' WHERE id=$1", [b.campaign]);
  assert.equal((await f.tx(c => processSubmissionLedgerBatch(c, f.p)))?.status, 'cancelled');
  assert.equal((await f.tx(c => s.submissionLedgerDetail(c, f.p, blocked.ledger.id))).ledger.processed_count, 0);
  const empty = await seedSubmission(f, 0), emptyLedger = await f.tx(c => s.stageSubmissionLedger(c, f.p, empty.campaign, empty.input, randomUUID()));
  assert.equal((await f.tx(c => processSubmissionLedgerBatch(c, f.p)))?.status, 'completed');
  assert.equal((await f.tx(c => s.submissionLedgerDetail(c, f.p, emptyLedger.ledger.id))).ledger.processed_count, 0);
  for (const p of [api, { ...f.p, local_session: { token_hash: 'fixture' } }])
    await assert.rejects(f.tx(c => processSubmissionLedgerBatch(c, p)), { code: 'LOCAL_WORKER_ACTOR_REQUIRED' });
}));

test('development CLI refuses production and remote databases before processing', async () => {
  const { spawnSync } = await import('node:child_process');
  for (const [nodeEnv, host] of [['production', '127.0.0.1'], ['development', 'remote.invalid']] as const) {
    const result = spawnSync(process.execPath, ['--import', 'tsx', 'scripts/run-submission-ledger.ts', '--workspace', randomUUID(), '--actor', 'fixture-owner'], {
      env: { ...process.env, NODE_ENV: nodeEnv, LOCAL_DEVELOPMENT: 'true', DATABASE_URL: 'postgres://fixture:fixture@' + host + ':1/fixture' }, encoding: 'utf8', timeout: 10000,
    });
    assert.notEqual(result.status, 0); assert.match(result.stderr, /explicit owned loopback configuration/);
    assert.equal(result.stdout.includes('submission-ledger-local'), false);
  }
});

test('key expiry while the campaign lock blocks admission cancels the remaining batch', async () => sourceDatabase(async f => {
  const s = await import('../src/server/submission-ledgers'), { processSubmissionLedgerBatch } = await import('../src/server/submission-ledger-worker');
  const a = await seedSubmission(f, 101), credential = randomUUID();
  await f.db.query("INSERT INTO api_keys(workspace_id,id,key_hash,name,scopes,created_by,expires_at) VALUES($1,$2,$3,'Expiry lock fixture',$4,$5,clock_timestamp()+interval '1 hour')", [f.p.workspace, credential, digest(credential), JSON.stringify(['campaigns:write', 'audience:read']), f.p.user]);
  const api = { ...f.p, user: 'api-key:' + credential, api_key: { id: credential, delegator: f.p.user, scopes: ['campaigns:write', 'audience:read'] } };
  const original = await f.tx(c => s.stageSubmissionLedger(c, api, a.campaign, a.input, randomUUID()), api.user);
  await f.tx(c => processSubmissionLedgerBatch(c, f.p));
  const blocker = await f.db.connect();
  let processing: Promise<Awaited<ReturnType<typeof processSubmissionLedgerBatch>>> | undefined;
  try {
    await blocker.query('BEGIN');
    await blocker.query('SELECT id FROM campaigns WHERE id=$1 FOR UPDATE', [a.campaign]);
    await blocker.query("UPDATE api_keys SET expires_at=clock_timestamp()+interval '2 seconds' WHERE id=$1", [credential]);
    await blocker.query('COMMIT');
    await blocker.query('BEGIN');
    await blocker.query('SELECT id FROM campaigns WHERE id=$1 FOR UPDATE', [a.campaign]);
    processing = f.tx(c => processSubmissionLedgerBatch(c, f.p));
    void processing.catch(() => undefined);
    let waiting = false;
    for (let i = 0; i < 200 && !waiting; i++) {
      waiting = (await f.db.query("SELECT EXISTS(SELECT FROM pg_stat_activity WHERE datname=current_database() AND wait_event_type='Lock' AND query='SELECT state FROM campaigns WHERE id=$1 FOR SHARE') AS waiting")).rows[0].waiting;
      if (!waiting) await new Promise(resolve => setTimeout(resolve, 10));
    }
    assert.equal(waiting, true, 'worker has passed its first creator key check and is blocked on the campaign lock');
    await blocker.query("SELECT pg_sleep(greatest(0,extract(epoch FROM expires_at-clock_timestamp()))+0.05) FROM api_keys WHERE id=$1", [credential]);
    assert.equal((await blocker.query('SELECT expires_at>clock_timestamp() AS valid FROM api_keys WHERE id=$1', [credential])).rows[0].valid, false);
  } finally {
    await blocker.query('COMMIT');
    blocker.release();
  }
  const result = await processing;
  assert.equal(result?.status, 'cancelled');
  assert.equal(result?.processed_count, 100);
  const ledger = (await f.tx(c => s.submissionLedgerDetail(c, f.p, original.ledger.id))).ledger;
  assert.equal(ledger.pending_count, 0); assert.equal(ledger.cancelled_count + ledger.skipped_count, 100);
  assert.equal((await f.db.query('SELECT count(*)::int AS n FROM campaign_recipients')).rows[0].n, 100);
  assert.equal((await f.db.query('SELECT count(*)::int AS n FROM delivery_attempts')).rows[0].n, 0);
}));

test('development CLI rejects PostgreSQL URL overrides, foreign protocols and fragments before connecting', async () => {
  const { spawnSync } = await import('node:child_process');
  const run = (connection: string) => spawnSync(process.execPath, [
    '--import', 'tsx', '--import', './tests/fixtures/submission-ledger-no-network.ts',
    'scripts/run-submission-ledger.ts', '--workspace', randomUUID(), '--actor', 'fixture-owner',
  ], {
    env: { ...process.env, NODE_ENV: 'development', LOCAL_DEVELOPMENT: 'true', DATABASE_URL: connection },
    encoding: 'utf8', timeout: 10000,
  });
  const base = 'postgres://fixture:fixture@127.0.0.1:1/fixture';
  const control = run(base);
  assert.match(control.stderr, /PG_CONNECTION_INTERCEPTED/, 'safe loopback input reaches the intercepted connection');
  for (const connection of [base + '?host=remote.invalid', base + '?port=5432', base.replace('postgres:', 'https:'), base + '#fragment', base + '?', base + '#']) {
    const result = run(connection);
    assert.notEqual(result.status, 0);
    assert.equal(result.stderr.includes('PG_CONNECTION_INTERCEPTED'), false, 'invalid configuration must fail before attempting a connection');
    assert.match(result.stderr, /explicit owned loopback configuration/);
    assert.equal(result.stdout.includes('submission-ledger-local'), false);
  }
});
