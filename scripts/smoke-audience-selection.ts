import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import pg from 'pg';
import env from '@next/env';
import { digest } from '../src/server/audit';
import { validateApiResponse } from './api-validation';
env.loadEnvConfig(process.cwd());
const origin = process.env.APP_ORIGIN ?? 'http://127.0.0.1:3003';
if (process.env.LOCAL_DEVELOPMENT !== 'true' || !['127.0.0.1', 'localhost'].includes(new URL(origin).hostname))
  throw new Error('Owned local audience fixture required.');
const db = new pg.Pool({ connectionString: process.env.MIGRATION_DATABASE_URL }),
  workspace = randomUUID(), other = randomUUID(), user = 'audience-selection-' + randomUUID(),
  secondUser = 'audience-second-' + randomUUID(), cookie = randomBytes(32).toString('hex'),
  secondCookie = randomBytes(32).toString('hex');
const cutoffProbe = process.argv.includes('--cutoff-red') || process.argv.includes('--probe-cutoff');
async function call(path: string, method = 'GET', body?: unknown, key = randomUUID(), w = workspace, bearer?: string, session = cookie) {
  const r = await fetch(origin + '/v1/' + path, { method, headers: {
    Origin: origin, 'Content-Type': 'application/json', 'Idempotency-Key': key,
    ...(bearer ? { Authorization: 'Bearer ' + bearer } : { Cookie: 'mailcraft_local_session=' + session, 'X-Workspace-Id': w }),
  }, body: body === undefined ? undefined : JSON.stringify(body) });
  return { r, j: await r.json() };
}
function contract(operation: string, response: Awaited<ReturnType<typeof call>>) {
  validateApiResponse(operation as Parameters<typeof validateApiResponse>[0], response.r.status, response.j);
}
function redacted(campaign: Record<string, unknown>) {
  assert.deepEqual(Object.keys(campaign.intent as object).sort(), ['artifact_hash', 'planned_timing']);
  for (const field of ['members', 'audience', 'provider', 'sender', 'created_by', 'workspace_id', 'approval', 'private_extra'])
    assert.equal(campaign[field], undefined, field + ' must stay private');
  assert.equal(typeof campaign.audience_count, 'number');
}
try {
  await db.query("INSERT INTO workspaces(id,name) VALUES($1,'Owned audience selection'),($2,'Owned foreign audience')", [workspace, other]);
  for (const w of [workspace, other]) await db.query("INSERT INTO memberships(workspace_id,user_id,role) VALUES($1,$2,'Owner')", [w, user]);
  await db.query("INSERT INTO memberships(workspace_id,user_id,role) VALUES($1,$2,'Owner')", [workspace, secondUser]);
  for (const [token, actor] of [[cookie, user], [secondCookie, secondUser]])
    await db.query("INSERT INTO auth_sessions(token_hash,user_id,expires_at) VALUES($1,$2,clock_timestamp()+interval '1 hour')", [digest(token), actor]);
  const contacts = [randomUUID(), randomUUID(), randomUUID()].sort();
  for (let i = 0; i < contacts.length; i++) await db.query(
    'INSERT INTO contacts(workspace_id,id,email_original,email_lookup,attrs,subscription,preferred_locale,consent_version) VALUES($1,$2,$3,$3,$4,$5,$6,$7)',
    [workspace, contacts[i], `owned-${i}@example.test`, JSON.stringify({ first_name: 'Owned' }), i === 0 ? 'subscribed' : 'pending_confirmation', i === 0 ? 'fr-FR' : 'en-US', i + 1],
  );
  // Synthetic immutable content isolates selection; it is not compiler/provider acceptance.
  const email = randomUUID(), revision = randomUUID(), hash = digest('Owned audience fixture');
  await db.query("INSERT INTO emails(workspace_id,id,title,spec,created_by) VALUES($1,$2,'Owned selection content','{}',$3)", [workspace, email, user]);
  await db.query("INSERT INTO revisions(workspace_id,id,email_id,revision_no,spec,html,plaintext,artifact_hash,manifest,created_by) VALUES($1,$2,$3,1,'{}','<p>Owned selection</p>','Owned selection',$4,'{}',$5)", [workspace, revision, email, hash, user]);
  const created = await call('campaigns', 'POST', { name: 'Owned captured campaign', revision_id: revision });
  assert.equal(created.r.status, 200); const campaign = created.j.campaign, path = 'campaigns/' + campaign.id;
  const initialIntent = (await db.query('SELECT intent FROM campaigns WHERE id=$1', [campaign.id])).rows[0].intent;
  if (process.argv.includes('--redaction')) {
    redacted(created.j.campaign); redacted((await call('campaigns')).j.data[0]);
    console.log('Owned content-role campaign redaction PASS.');
  } else if (process.argv.includes('--metadata-red')) {
    assert.equal((await call('audience-snapshots')).r.status, 200);
  } else if (process.argv.includes('--selection-red')) {
    assert.equal((await call(path + '/configuration', 'POST', { expected_version: 1, name: campaign.name, revision_id: revision, planned_timing: null, audience_snapshot_id: randomUUID() })).r.status, 404);
  } else if (process.argv.includes('--expiry-red') || process.argv.includes('--session-expiry-red') || cutoffProbe) {
    const segment = (await call('segments', 'POST', { name: 'Owned lock probe', rule: { kind: 'attribute', field: 'first_name', op: 'exists' } })).j.segment;
    let bearer: string | undefined;
    if (process.argv.includes('--expiry-red')) {
      const probe = (await call('api-keys', 'POST', { name: 'Owned lock expiry', scopes: ['audience:write'], expires_in_days: 1 })).j;
      bearer = probe.secret;
      await db.query("UPDATE api_keys SET expires_at=clock_timestamp()+interval '2 seconds' WHERE id=$1", [probe.key.id]);
    } else if (process.argv.includes('--session-expiry-red')) {
      await db.query("UPDATE auth_sessions SET expires_at=clock_timestamp()+interval '2 seconds' WHERE token_hash=$1", [digest(secondCookie)]);
    }
    const blocker = await db.connect();
    try {
      await blocker.query('BEGIN'); await blocker.query('SELECT id FROM segments WHERE id=$1 FOR UPDATE', [segment.id]);
      const pending = call('segments/' + segment.id + '/preview', 'POST', { expected_version: 1 }, randomUUID(), workspace, bearer, process.argv.includes('--session-expiry-red') ? secondCookie : cookie);
      await blocker.query('SELECT pg_sleep(2.3)');
      const boundary = (await blocker.query('SELECT clock_timestamp() AS time')).rows[0].time;
      await blocker.query('COMMIT');
      const result = await pending;
      if (cutoffProbe) {
        assert.equal(result.r.status, 200);
        assert.ok(Date.parse(result.j.preview.evaluated_at) >= boundary.getTime(), 'Evaluation evidence must describe the query after the lock wait, not transaction admission.');
        console.log('Owned audience query-time cutoff PASS after actual row wait.');
      } else assert.equal(result.r.status, 401, 'Passive expiry after a resource wait must deny preview.');
    } finally { await blocker.query('ROLLBACK'); blocker.release(); }
  } else {
    redacted(campaign); contract('createCampaign', created);
    assert.equal(campaign.audience_snapshot, null); assert.equal(campaign.audience_count, 3);
    const privateIntent = { ...initialIntent, provider: { private_token: 'synthetic-only-field' }, private_extra: 'synthetic-only-private' };
    await db.query("UPDATE campaigns SET intent=$2,version=version+1,state='draft',approval=NULL WHERE id=$1", [campaign.id, JSON.stringify(privateIntent)]);
    const list = await call('campaigns'); contract('listCampaigns', list); redacted(list.j.data[0]);
    const legacyKey = randomUUID(), legacyInput = { name: 'Owned captured campaign', revision_id: revision };
    const legacyRow = (await db.query('SELECT * FROM campaigns WHERE id=$1', [campaign.id])).rows[0];
    await db.query('INSERT INTO idempotency(workspace_id,principal,action,key,payload_hash,response) VALUES($1,$2,$3,$4,$5,$6)',
      [workspace, user, 'campaign.create', legacyKey, digest(legacyInput), JSON.stringify({ campaign: legacyRow })]);
    const legacyReplay = await call('campaigns', 'POST', legacyInput, legacyKey);
    redacted(legacyReplay.j.campaign); contract('createCampaign', legacyReplay);
    assert.equal(legacyReplay.j.campaign.version, 2); assert.equal(legacyReplay.j.campaign.audience_count, 3);
    const segment = (await call('segments', 'POST', { name: 'Owned nested source', rule: { kind: 'any', children: [{ kind: 'attribute', field: 'first_name', op: 'exists' }] } })).j.segment;
    assert.ok(segment.id);
    const empty = await call('audience-snapshots'); assert.equal(empty.r.status, 200); contract('listAudienceSnapshots', empty); assert.equal(empty.j.total_count, 0);
    const frozen = [];
    for (let i = 0; i < 26; i++) {
      const result = await call('segments/' + (i === 0 ? segment.id.toUpperCase() : segment.id) + '/snapshots', 'POST', { expected_version: 1 });
      assert.equal(result.r.status, 200); frozen.push(result.j.snapshot);
    }
    const first = frozen[0], latest = frozen.at(-1)!;
    const pointer = { id: first.id, segment_id: first.segment_id, segment_version: first.segment_version,
      evaluated_at: first.evaluated_at, matched_count: first.matched_count, eligible_count: first.eligible_count, digest: first.digest };
    const page = await call('audience-snapshots?limit=25'); assert.equal(page.r.status, 200); contract('listAudienceSnapshots', page);
    assert.equal(page.j.total_count, 26); assert.equal(page.j.has_more, true); assert.equal(page.j.data.some((row: { id: string }) => row.id === first.id), false);
    for (const row of page.j.data) {
      assert.equal(row.members, undefined); assert.equal(row.created_by, undefined); assert.equal(row.workspace_id, undefined);
      assert.equal(row.excluded_count, 2); assert.equal(row.segment_name, 'Owned nested source');
    }
    const older = await call('audience-snapshots?limit=25&after=' + encodeURIComponent(page.j.next_cursor));
    assert.equal(older.j.data[0].id, first.id); assert.equal(older.j.has_more, false);
    const detail = await call('audience-snapshots/' + first.id + '/metadata'); contract('getAudienceSnapshotMetadata', detail); assert.equal(detail.j.snapshot.id, first.id); assert.equal(detail.j.snapshot.members, undefined);
    assert.deepEqual((await call('audience-snapshots/' + first.id)).j.snapshot.members, first.members);
    for (const query of ['?unknown=true', '?limit=2&limit=3', '?limit=0', '?limit=101', '?created_after=bad', '?after=', '?segment_id=bad', '?segment_id=' + segment.id + '&segment_id=' + segment.id])
      assert.equal((await call('audience-snapshots' + query)).r.status, 422, query);
    assert.equal((await call('audience-snapshots?after=' + encodeURIComponent(page.j.next_cursor) + 'x')).j.error.code, 'INVALID_CURSOR');
    assert.equal((await call('audience-snapshots?segment_id=' + segment.id + '&after=' + encodeURIComponent(page.j.next_cursor))).j.error.code, 'INVALID_CURSOR');
    assert.equal((await call('audience-snapshots?after=' + encodeURIComponent(page.j.next_cursor), 'GET', undefined, randomUUID(), other)).j.error.code, 'INVALID_CURSOR');
    assert.equal((await call('audience-snapshots?after=' + encodeURIComponent(page.j.next_cursor), 'GET', undefined, randomUUID(), workspace, undefined, secondCookie)).j.error.code, 'INVALID_CURSOR');
    assert.equal((await call('audience-snapshots/' + first.id + '/metadata', 'GET', undefined, randomUUID(), other)).r.status, 404);
    assert.equal((await call('audience-snapshots?segment_id=' + segment.id)).j.total_count, 26);
    assert.equal((await call('audience-snapshots?segment_id=' + randomUUID())).j.total_count, 0);
    assert.equal((await call('audience-snapshots', 'POST', {})).r.status, 405);
    assert.equal((await call('audience-snapshots/' + first.id + '/metadata', 'POST', {})).r.status, 405);
    assert.equal((await call('audience-snapshots/' + first.id + '/metadata?limit=1')).r.status, 422);
    const input = { expected_version: 2, name: 'Explicit selected campaign', revision_id: revision, planned_timing: null, audience_snapshot_id: first.id }, key = randomUUID();
    for (const audience_snapshot_id of [null, 'all', '']) assert.equal((await call(path + '/configuration', 'POST', { ...input, audience_snapshot_id })).r.status, 422);
    assert.equal((await call(path + '/configuration', 'POST', { ...input, audience_snapshot_id: randomUUID() })).r.status, 404);
    const corrupt = randomUUID();
    await db.query('INSERT INTO audience_snapshots(workspace_id,id,segment_id,segment_version,evaluated_at,members,matched_count,eligible_count,digest,created_by) SELECT workspace_id,$2,segment_id,segment_version,evaluated_at,members,matched_count,eligible_count,$3,created_by FROM audience_snapshots WHERE id=$1', [first.id, corrupt, 'a'.repeat(64)]);
    const corruptSave = await call(path + '/configuration', 'POST', { ...input, audience_snapshot_id: corrupt });
    assert.equal(corruptSave.r.status, 409); assert.equal(corruptSave.j.error.code, 'SNAPSHOT_INVALID');
    assert.equal((await call(path)).j.campaign.version, 2);
    await db.query('DELETE FROM audience_snapshots WHERE id=$1', [corrupt]);
    const foreignSegment = (await call('segments', 'POST', { name: 'Foreign', rule: { kind: 'attribute', field: 'first_name', op: 'exists' } }, randomUUID(), other)).j.segment;
    const foreign = (await call('segments/' + foreignSegment.id + '/snapshots', 'POST', { expected_version: 1 }, randomUUID(), other)).j.snapshot;
    assert.equal((await call(path + '/configuration', 'POST', { ...input, audience_snapshot_id: foreign.id })).r.status, 404);
    const saved = await call(path + '/configuration', 'POST', input, key); assert.equal(saved.r.status, 200); contract('configureCampaign', saved); redacted(saved.j.campaign);
    assert.equal(saved.j.changed, true); assert.equal(saved.j.campaign.version, 3); assert.deepEqual(saved.j.campaign.audience_snapshot, pointer);
    const stored = (await db.query('SELECT * FROM campaigns WHERE id=$1', [campaign.id])).rows[0];
    assert.deepEqual(stored.intent.audience, first.members); assert.deepEqual(stored.intent.audience_snapshot, pointer);
    assert.deepEqual(stored.intent.provider, privateIntent.provider); assert.equal(stored.intent.private_extra, privateIntent.private_extra);
    const replay = await call(path + '/configuration', 'POST', input, key); assert.equal(replay.j.campaign.version, 3);
    assert.equal((await call(path + '/configuration', 'POST', { ...input, audience_snapshot_id: latest.id }, key)).j.error.code, 'IDEMPOTENCY_MISMATCH');
    assert.equal((await call(path + '/configuration', 'POST', { ...input, name: 'Stale' })).j.error.code, 'VERSION_CONFLICT');
    const noop = await call(path + '/configuration', 'POST', { ...input, expected_version: 3 }); assert.equal(noop.j.changed, false);
    await db.query("UPDATE contacts SET subscription='unsubscribed',consent_version=consent_version+1 WHERE id=$1", [contacts[0]]);
    const newContact = randomUUID(); await db.query("INSERT INTO contacts(workspace_id,id,email_original,email_lookup,attrs,subscription) VALUES($1,$2,'new-owned@example.test','new-owned@example.test','{\"first_name\":\"New\"}','subscribed')", [workspace, newContact]);
    const omit = await call(path + '/configuration', 'POST', { expected_version: 3, name: 'Omission retains selected source', revision_id: revision, planned_timing: null });
    assert.equal(omit.j.campaign.version, 4); assert.deepEqual(omit.j.campaign.audience_snapshot, pointer);
    assert.deepEqual((await db.query('SELECT intent FROM campaigns WHERE id=$1', [campaign.id])).rows[0].intent.audience, first.members);
    const review = await call(path + '/submit-review', 'POST', {}); redacted(review.j.campaign); contract('submitCampaignReview', review);
    const refreshed = await call(path + '/configuration', 'POST', { ...input, expected_version: 4, name: 'Reviewed material source change', audience_snapshot_id: latest.id });
    assert.equal(refreshed.j.campaign.version, 5); assert.equal(refreshed.j.campaign.state, 'draft'); assert.equal((await db.query('SELECT approval FROM campaigns WHERE id=$1', [campaign.id])).rows[0].approval, null);
    assert.deepEqual(refreshed.j.campaign.audience_snapshot.id, latest.id);
    const history = await call(path + '/configurations'); contract('listCampaignConfigurations', history); assert.equal(history.j.total_count, 5);
    assert.equal(history.j.data[0].audience_snapshot.id, latest.id); assert.deepEqual(history.j.data.find((row: { revision_no: number }) => row.revision_no === 3).audience_snapshot, pointer);
    for (const role of ['Editor', 'Viewer']) {
      await db.query('UPDATE memberships SET role=$1 WHERE workspace_id=$2 AND user_id=$3', [role, workspace, user]);
      for (const source of ['audience-snapshots', 'audience-snapshots/' + first.id + '/metadata', 'audience-snapshots/' + first.id]) assert.equal((await call(source)).r.status, 403);
      redacted((await call('campaigns')).j.data[0]); redacted((await call(path)).j.campaign);
      assert.equal((await call(path + '/configuration', 'POST', { ...input, expected_version: 5, audience_snapshot_id: latest.id })).r.status, 403);
      if (role === 'Editor') {
        const edited = await call(path + '/configuration', 'POST', { expected_version: 5, name: 'Editor preserves source', revision_id: revision, planned_timing: null });
        assert.equal(edited.r.status, 200); assert.deepEqual(edited.j.campaign.audience_snapshot.id, latest.id);
        assert.equal((await call(path + '/configuration', 'POST', input, key)).r.status, 403, 'Replay requires current recipient authority');
      }
    }
    await db.query("UPDATE memberships SET role='Owner' WHERE workspace_id=$1 AND user_id=$2", [workspace, user]);
    const writeOnly = (await call('api-keys', 'POST', { name: 'Owned campaign only', scopes: ['campaigns:read', 'campaigns:write'], expires_in_days: 1 })).j.secret;
    const selected = { ...input, expected_version: 6, name: 'Delegated selection', audience_snapshot_id: first.id };
    assert.equal((await call(path + '/configuration', 'POST', selected, randomUUID(), workspace, writeOnly)).r.status, 403);
    const delegated = (await call('api-keys', 'POST', { name: 'Owned source and campaign', scopes: ['campaigns:read', 'campaigns:write', 'audience:read'], expires_in_days: 1 })).j.secret;
    const delegatedSave = await call(path + '/configuration', 'POST', selected, randomUUID(), workspace, delegated);
    assert.equal(delegatedSave.r.status, 200); assert.equal(delegatedSave.j.campaign.version, 7);
    const metadataRead = await call('audience-snapshots', 'GET', undefined, randomUUID(), workspace, delegated); assert.equal(metadataRead.r.status, 200);
    assert.equal((await call('audience-snapshots', 'GET', undefined, randomUUID(), workspace, writeOnly)).r.status, 403);
    // After a resource lock waits, a passively expired key cannot create a snapshot.
    const audienceKey = (await call('api-keys', 'POST', { name: 'Owned expiry probe', scopes: ['audience:read', 'audience:write'], expires_in_days: 1 })).j;
    await db.query("UPDATE api_keys SET expires_at=clock_timestamp()+interval '2 seconds' WHERE id=$1", [audienceKey.key.id]);
    const blocker = await db.connect(); await blocker.query('BEGIN'); await blocker.query('SELECT id FROM segments WHERE id=$1 FOR UPDATE', [segment.id]);
    const pending = call('segments/' + segment.id + '/snapshots', 'POST', { expected_version: 1 }, randomUUID(), workspace, audienceKey.secret);
    await blocker.query('SELECT pg_sleep(2.3)'); await blocker.query('COMMIT'); blocker.release();
    assert.equal((await pending).r.status, 401); assert.equal((await call('audience-snapshots')).j.total_count, 26);
    // Identical lock-wait evidence must also fence an expiring local test session.
    await db.query("UPDATE auth_sessions SET expires_at=clock_timestamp()+interval '2 seconds' WHERE token_hash=$1", [digest(secondCookie)]);
    const sessionBlocker = await db.connect(); await sessionBlocker.query('BEGIN'); await sessionBlocker.query('SELECT id FROM segments WHERE id=$1 FOR UPDATE', [segment.id]);
    const sessionPending = call('segments/' + segment.id + '/preview', 'POST', { expected_version: 1 }, randomUUID(), workspace, undefined, secondCookie);
    await sessionBlocker.query('SELECT pg_sleep(2.3)'); await sessionBlocker.query('COMMIT'); sessionBlocker.release();
    assert.equal((await sessionPending).r.status, 401);
    const cancelled = await call(path + '/cancel', 'POST', {}); redacted(cancelled.j.campaign); contract('cancelCampaign', cancelled);
    const oldReceipt = await call(path + '/configuration', 'POST', input, key);
    assert.equal(oldReceipt.r.status, 200); assert.equal(oldReceipt.j.campaign.version, 3);
    const currentAfterReceipt = (await call(path)).j.campaign;
    assert.equal(currentAfterReceipt.version, 7); assert.equal(currentAfterReceipt.state, 'cancelled');
    assert.equal((await call(path + '/configuration', 'POST', { ...selected, expected_version: 7 })).j.error.code, 'STATE_CONFLICT');
    assert.equal((await call(path + '/send', 'POST', {})).r.status, 409);
    console.log('Owned audience selection HTTP PASS: strict signed26-source metadata, actor/tenant/filter/role/scope fences, redacted campaign collection/create/lifecycle/history, immutable exact source/no-op/omit/CAS/replay/review reset/current consent preservation and passive key/session expiry after row wait. No model/provider/send requests.');
  }
} finally {
  for (const w of [workspace, other]) {
    await db.query('DELETE FROM idempotency WHERE workspace_id=$1', [w]);
    await db.query('DELETE FROM api_rate_events WHERE workspace_id=$1', [w]);
    await db.query('DELETE FROM api_keys WHERE workspace_id=$1', [w]);
    await db.query('DELETE FROM campaigns WHERE workspace_id=$1', [w]);
    await db.query('DELETE FROM audience_snapshots WHERE workspace_id=$1', [w]);
    await db.query('DELETE FROM segment_versions WHERE workspace_id=$1', [w]);
    await db.query('DELETE FROM segments WHERE workspace_id=$1', [w]);
    await db.query('DELETE FROM revisions WHERE workspace_id=$1', [w]);
    await db.query('DELETE FROM emails WHERE workspace_id=$1', [w]);
    await db.query('DELETE FROM contacts WHERE workspace_id=$1', [w]);
    await db.query('DELETE FROM audit_events WHERE workspace_id=$1', [w]);
    await db.query('DELETE FROM memberships WHERE workspace_id=$1', [w]);
    await db.query('DELETE FROM workspaces WHERE id=$1', [w]);
  }
  await db.query('DELETE FROM auth_sessions WHERE user_id=ANY($1)', [[user, secondUser]]);
  await db.end();
}
