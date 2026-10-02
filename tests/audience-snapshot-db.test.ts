import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import pg from 'pg';
import env from '@next/env';
import { withCreationDatabase } from './fixtures/creation-database';
import { digest } from '../src/server/audit';
env.loadEnvConfig(process.cwd());

async function seed(db: pg.Pool) {
  const workspace = randomUUID(), user = 'snapshot-storage-' + randomUUID(), segment = randomUUID(),
    snapshot = randomUUID(), campaign = randomUUID(), revision = randomUUID(), email = randomUUID(),
    contact = randomUUID(), hash = digest('Owned snapshot artifact');
  const evaluated_at = '2026-10-02T09:00:00.123Z';
  await db.query("INSERT INTO workspaces(id,name) VALUES($1,'Owned snapshot storage')", [workspace]);
  await db.query("INSERT INTO memberships(workspace_id,user_id,role) VALUES($1,$2,'Owner')", [workspace, user]);
  await db.query("INSERT INTO contacts(workspace_id,id,email_original,email_lookup,subscription) VALUES($1,$2,'fixture@example.test','fixture@example.test','subscribed')", [workspace, contact]);
  await db.query("INSERT INTO segments(workspace_id,id,name) VALUES($1,$2,'Owned rule')", [workspace, segment]);
  await db.query("INSERT INTO segment_versions(workspace_id,segment_id,version,schema_version,rule,created_by) VALUES($1,$2,1,1,$3,$4)", [workspace, segment, JSON.stringify({ kind: 'attribute', field: 'first_name', op: 'exists' }), user]);
  const members = [{ id: contact, locale: 'en-US', consent_version: 1, eligible: true, reason: 'ELIGIBLE' }];
  const source = { schema_version: 1, segment_id: segment, segment_version: 1, evaluated_at, members, matched_count: 1, eligible_count: 1, excluded_count: 0 };
  const pointer = { id: snapshot, segment_id: segment, segment_version: 1, evaluated_at, matched_count: 1, eligible_count: 1, digest: digest(source) };
  await db.query('INSERT INTO audience_snapshots(workspace_id,id,segment_id,segment_version,evaluated_at,members,matched_count,eligible_count,digest,created_by) VALUES($1,$2,$3,1,$4,$5,1,1,$6,$7)', [workspace, snapshot, segment, evaluated_at, JSON.stringify(members), pointer.digest, user]);
  await db.query("INSERT INTO emails(workspace_id,id,title,spec,created_by) VALUES($1,$2,'Owned fixture','{}',$3)", [workspace, email, user]);
  await db.query("INSERT INTO revisions(workspace_id,id,email_id,revision_no,spec,html,plaintext,artifact_hash,manifest,created_by) VALUES($1,$2,$3,1,'{}','<p>Owned fixture</p>','Owned fixture',$4,'{}',$5)", [workspace, revision, email, hash, user]);
  const intent = { revision_id: revision, artifact_hash: hash, audience: [], provider: null, sender: null, topic: 'marketing', schedule: null, tracking: false };
  await db.query("INSERT INTO campaigns(workspace_id,id,name,revision_id,intent,digest,created_by) VALUES($1,$2,'Original capture',$3,$4,$5,$6)", [workspace, campaign, revision, JSON.stringify(intent), digest(intent), user]);
  return { workspace, user, segment, snapshot, campaign, intent, members, pointer };
}
async function runtime<T>(pool: pg.Pool, fixture: { workspace: string; user: string }, run: (tx: pg.PoolClient) => Promise<T>) {
  const tx = await pool.connect();
  try {
    await tx.query('BEGIN');
    await tx.query("SELECT set_config('app.workspace_id',$1,true),set_config('app.user_id',$2,true)", [fixture.workspace, fixture.user]);
    const result = await run(tx); await tx.query('COMMIT'); return result;
  } catch (error) { await tx.query('ROLLBACK'); throw error; } finally { tx.release(); }
}
const code = (expected: string) => (error: unknown) => (error as { code?: string }).code === expected;
async function bind(tx: pg.PoolClient, f: Awaited<ReturnType<typeof seed>>, intent: Record<string, unknown> = { ...f.intent, audience: f.members, audience_snapshot: f.pointer }) {
  return tx.query("UPDATE campaigns SET intent=$2,digest=$3,version=version+1,state='draft',approval=NULL WHERE id=$1 RETURNING *", [f.campaign, JSON.stringify(intent), digest(intent)]);
}

test('campaign snapshot pins guard exact source members and metadata against runtime forgery', async () => withCreationDatabase(async connection => {
  const db = new pg.Pool({ connectionString: connection }), app = new pg.Pool({ connectionString: connection, options: '-c role=mailcraft_runtime' });
  try {
    const f = await seed(db);
    const saved = (await runtime(app, f, tx => bind(tx, f))).rows[0];
    assert.equal(saved.audience_snapshot_id, f.snapshot);
    assert.deepEqual(saved.intent.audience, f.members);
    const history = (await db.query('SELECT * FROM campaign_revisions WHERE campaign_id=$1 ORDER BY revision_no', [f.campaign])).rows;
    assert.deepEqual(history.map(row => row.audience_snapshot_id), [null, f.snapshot]);
    assert.deepEqual(history[1].intent.audience_snapshot, f.pointer);
    for (const audience of [[], [{ ...f.members[0], locale: 'fr-FR' }], [{ ...f.members[0], consent_version: 2 }]])
      await assert.rejects(runtime(app, f, tx => bind(tx, f, { ...f.intent, audience, audience_snapshot: f.pointer })), /AUDIENCE_SNAPSHOT_BINDING_INVALID/);
    for (const change of [{ digest: 'a'.repeat(64) }, { segment_version: 2 }, { eligible_count: 0 }, { evaluated_at: '2026-10-02T10:00:00.123Z' }, { secret: 'forged' }])
      await assert.rejects(runtime(app, f, tx => bind(tx, f, { ...f.intent, audience: f.members, audience_snapshot: { ...f.pointer, ...change } })), /AUDIENCE_SNAPSHOT_BINDING_INVALID/);
    await assert.rejects(runtime(app, f, tx => bind(tx, f, f.intent)), /AUDIENCE_SNAPSHOT_BINDING_INVALID/);
    await assert.rejects(runtime(app, f, tx => tx.query('UPDATE campaigns SET audience_snapshot_id=$2 WHERE id=$1', [f.campaign, randomUUID()])), code('428C9'));
    assert.equal((await db.query('SELECT version FROM campaigns WHERE id=$1', [f.campaign])).rows[0].version, 2);
    assert.equal((await db.query('SELECT count(*)::int AS n FROM campaign_revisions WHERE campaign_id=$1', [f.campaign])).rows[0].n, 2);
  } finally { await Promise.all([app.end(), db.end()]); }
}));

test('snapshot bindings and source reads are tenant fenced with nullable composite foreign keys', async () => withCreationDatabase(async connection => {
  const db = new pg.Pool({ connectionString: connection }), app = new pg.Pool({ connectionString: connection, options: '-c role=mailcraft_runtime' });
  try {
    const f = await seed(db), other = await seed(db);
    assert.equal((await runtime(app, f, tx => tx.query('SELECT id FROM audience_snapshots'))).rowCount, 1);
    assert.equal((await runtime(app, f, tx => tx.query('SELECT id FROM audience_snapshots WHERE id=$1', [other.snapshot]))).rowCount, 0);
    await assert.rejects(runtime(app, f, tx => bind(tx, f, { ...f.intent, audience: other.members, audience_snapshot: other.pointer })), /AUDIENCE_SNAPSHOT_BINDING_INVALID/);
    const source = (await db.query("SELECT relrowsecurity,relforcerowsecurity FROM pg_class WHERE oid='audience_snapshots'::regclass")).rows[0];
    assert.deepEqual(source, { relrowsecurity: true, relforcerowsecurity: true });
    const keys = (await db.query("SELECT conrelid::regclass::text AS table_name,pg_get_constraintdef(oid) AS definition FROM pg_constraint WHERE contype='f' AND confrelid='audience_snapshots'::regclass ORDER BY table_name")).rows;
    assert.deepEqual(keys.map(row => row.table_name), ['campaign_revisions', 'campaigns', 'recipient_assessments']);
    for (const row of keys) assert.match(row.definition, row.table_name==='recipient_assessments'?/FOREIGN KEY \(workspace_id, snapshot_id\) REFERENCES audience_snapshots\(workspace_id, id\)/:/FOREIGN KEY \(workspace_id, audience_snapshot_id\) REFERENCES audience_snapshots\(workspace_id, id\)/);
    const role = (await db.query("SELECT rolcanlogin,rolsuper,rolbypassrls FROM pg_roles WHERE rolname='mailcraft_campaign_history_admin'")).rows[0];
    assert.deepEqual(role, { rolcanlogin: false, rolsuper: false, rolbypassrls: false });
  } finally { await Promise.all([app.end(), db.end()]); }
}));

test('immutable audience sources cannot be rewritten or deleted while pinned history remains', async () => withCreationDatabase(async connection => {
  const db = new pg.Pool({ connectionString: connection }), app = new pg.Pool({ connectionString: connection, options: '-c role=mailcraft_runtime' });
  try {
    const f = await seed(db);
    await runtime(app, f, tx => bind(tx, f));
    await assert.rejects(db.query('UPDATE audience_snapshots SET members=\'[]\' WHERE id=$1', [f.snapshot]), /AUDIENCE_SNAPSHOT_IMMUTABLE/);
    await assert.rejects(runtime(app, f, tx => tx.query('UPDATE audience_snapshots SET digest=$1', ['a'.repeat(64)])), code('42501'));
    await assert.rejects(runtime(app, f, tx => tx.query('DELETE FROM audience_snapshots')), code('42501'));
    await assert.rejects(db.query('DELETE FROM audience_snapshots WHERE id=$1', [f.snapshot]), code('23503'));
    await assert.rejects(runtime(app, f, tx => tx.query('DELETE FROM campaigns WHERE id=$1', [f.campaign])), /CAMPAIGN_HISTORY_IMMUTABLE/);
    await db.query('DELETE FROM campaigns WHERE id=$1', [f.campaign]);
    assert.equal((await db.query('DELETE FROM audience_snapshots WHERE id=$1', [f.snapshot])).rowCount, 1);
  } finally { await Promise.all([app.end(), db.end()]); }
}));

test('current consent changes, state-only no-op and rollback cannot rewrite frozen selection history', async () => withCreationDatabase(async connection => {
  const db = new pg.Pool({ connectionString: connection }), app = new pg.Pool({ connectionString: connection, options: '-c role=mailcraft_runtime' });
  try {
    const f = await seed(db);
    await runtime(app, f, tx => bind(tx, f));
    await db.query("UPDATE contacts SET subscription='unsubscribed',consent_version=2 WHERE id=$1", [f.members[0].id]);
    await runtime(app, f, tx => tx.query("UPDATE campaigns SET state='review_pending' WHERE id=$1", [f.campaign]));
    await runtime(app, f, tx => tx.query('UPDATE campaigns SET intent=intent WHERE id=$1', [f.campaign]));
    await assert.rejects(runtime(app, f, async tx => { await tx.query("UPDATE campaigns SET name='Rollback marker',version=version+1,state='draft' WHERE id=$1", [f.campaign]); throw new Error('Owned rollback'); }), /Owned rollback/);
    const current = (await db.query('SELECT * FROM campaigns WHERE id=$1', [f.campaign])).rows[0];
    assert.deepEqual(current.intent.audience, f.members);
    assert.deepEqual((await db.query('SELECT members FROM audience_snapshots WHERE id=$1', [f.snapshot])).rows[0].members, f.members);
    assert.equal(current.version, 2); assert.equal(current.name, 'Original capture');
    const history = (await db.query('SELECT * FROM campaign_revisions WHERE campaign_id=$1 ORDER BY revision_no', [f.campaign])).rows;
    assert.equal(history.length, 2); assert.deepEqual(history[1].intent.audience, f.members);
  } finally { await Promise.all([app.end(), db.end()]); }
}));

test('snapshot binding migration preserves unselected legacy rows and rejects reserved-key collisions atomically', async () => withCreationDatabase(async connection => {
  const db = new pg.Pool({ connectionString: connection });
  try {
    for (const file of (await readdir('db')).filter(file => /^0(24|25|26|27)-.*\.sql$/.test(file)).sort()) await db.query(await readFile('db/' + file, 'utf8'));
    const f = await seed(db);
    const before = (await db.query('SELECT intent,version,name FROM campaigns WHERE id=$1', [f.campaign])).rows[0];
    const history = (await db.query('SELECT intent,revision_no,name,actor_id,origin FROM campaign_revisions WHERE campaign_id=$1', [f.campaign])).rows;
    const migration = await readFile('db/028-audience-snapshot-bindings.sql', 'utf8');
    await db.query("UPDATE campaigns SET intent=intent||'{\"audience_snapshot\":null}'::jsonb,version=version+1 WHERE id=$1", [f.campaign]);
    await db.query('BEGIN');
    await assert.rejects(db.query(migration), /AUDIENCE_SNAPSHOT_RESERVED_KEY_COLLISION/);
    await db.query('ROLLBACK');
    assert.equal((await db.query("SELECT count(*)::int AS n FROM information_schema.columns WHERE table_name='campaigns' AND column_name='audience_snapshot_id'")).rows[0].n, 0);
    await db.query('DELETE FROM campaigns WHERE id=$1', [f.campaign]);
    const fresh = await seed(db), freshBefore = (await db.query('SELECT intent,version,name FROM campaigns WHERE id=$1', [fresh.campaign])).rows[0];
    const freshHistory = (await db.query('SELECT intent,revision_no,name,actor_id,origin FROM campaign_revisions WHERE campaign_id=$1', [fresh.campaign])).rows;
    await db.query(migration);
    assert.deepEqual((await db.query('SELECT intent,version,name FROM campaigns WHERE id=$1', [fresh.campaign])).rows[0], freshBefore);
    assert.deepEqual((await db.query('SELECT intent,revision_no,name,actor_id,origin FROM campaign_revisions WHERE campaign_id=$1', [fresh.campaign])).rows, freshHistory);
    assert.equal((await db.query('SELECT audience_snapshot_id FROM campaigns WHERE id=$1', [fresh.campaign])).rows[0].audience_snapshot_id, null);
    assert.equal((await db.query('SELECT audience_snapshot_id FROM campaign_revisions WHERE campaign_id=$1', [fresh.campaign])).rows[0].audience_snapshot_id, null);
    assert.deepEqual(before.intent, f.intent); assert.equal(history.length, 1);
  } finally { await db.end(); }
}, '023-creation-queue'));
