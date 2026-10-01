import assert from 'node:assert/strict';
import { randomUUID, randomBytes } from 'node:crypto';
import pg from 'pg';
import env from '@next/env';
import { digest } from '../src/server/audit';
env.loadEnvConfig(process.cwd());
const origin = process.env.APP_ORIGIN ?? 'http://127.0.0.1:3000';
if (
  process.env.LOCAL_DEVELOPMENT !== 'true' ||
  !['localhost', '127.0.0.1'].includes(new URL(origin).hostname)
)
  throw new Error('Local reserved fixture test only.');
const db = new pg.Pool({ connectionString: process.env.MIGRATION_DATABASE_URL });
const workspace = randomUUID(),
  user = 'import-fixture-' + randomUUID(),
  token = randomBytes(32).toString('hex');
async function call(path: string, body: unknown, key = randomUUID()) {
  const response = await fetch(origin + '/v1/' + path, {
    method: 'POST',
    headers: {
      Origin: origin,
      Cookie: 'mailcraft_local_session=' + token,
      'X-Workspace-Id': workspace,
      'Content-Type': 'application/json',
      'Idempotency-Key': key,
    },
    body: JSON.stringify(body),
  });
  return { status: response.status, result: await response.json() };
}
try {
  await db.query('INSERT INTO workspaces(id,name) VALUES($1,$2)', [
    workspace,
    'Bulk import fixture',
  ]);
  await db.query("INSERT INTO memberships(workspace_id,user_id,role) VALUES($1,$2,'Owner')", [
    workspace,
    user,
  ]);
  await db.query(
    "INSERT INTO auth_sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '1 hour')",
    [digest(token), user],
  );
  const inspect = await call('contact-imports/inspect', {
    csv: 'Address,Points,Permission\na@example.com,2,subscribed',
  });
  assert.equal(inspect.status, 200);
  assert.deepEqual(inspect.result.headers, ['Address', 'Points', 'Permission']);
  await call('contact-fields', { key: 'score', label: 'Score', type: 'number' });
  const list = (await call('lists', { name: 'Bulk readers' })).result.item,
    tag = (await call('tags', { name: 'Bulk tag' })).result.item;
  const existing = (
    await db.query(
      "INSERT INTO contacts(workspace_id,email_original,email_lookup,attrs,subscription) VALUES($1,'reader0@example.com','reader0@example.com','{\"score\":99}','subscribed') RETURNING id",
      [workspace],
    )
  ).rows[0];
  await db.query(
    "INSERT INTO suppressions(workspace_id,contact_id,reason) VALUES($1,$2,'manual')",
    [workspace, existing.id],
  );
  const csv = [
    'Address,Points,Permission,Source,Proof',
    ...Array.from(
      { length: 10000 },
      (_, i) =>
        `reader${i}@example.com,${i},${i === 0 ? 'unsubscribed' : 'subscribed'},explicit-test-fixture,form-${i}`,
    ),
  ].join('\n');
  const input = {
    csv,
    mapping: {
      email: 'Address',
      attributes: { score: 'Points' },
      consent_status: 'Permission',
      consent_source: 'Source',
      consent_proof: 'Proof',
    },
    list_ids: [list.id],
    tag_ids: [tag.id],
  };
  const start = performance.now();
  const dry = await call('contact-imports', input);
  assert.equal(dry.status, 200);
  assert.equal(dry.result.preview.valid, 10000);
  assert.equal(dry.result.preview.rows[1].attrs.score, 1);
  assert.equal(dry.result.preview.eligible, 0);
  const first = await call('contact-imports/' + dry.result.operation_id + '/confirm', {});
  assert.equal(first.status, 200);
  assert.equal(first.result.created, 9999);
  assert.equal(first.result.existing, 1);
  assert.equal(first.result.processed, 10000);
  const elapsed_ms = Math.round(performance.now() - start);
  assert.ok(elapsed_ms < 120000, `Local throughput exceeded two minutes: ${elapsed_ms}ms`);
  assert.deepEqual(
    (await call('contact-imports/' + dry.result.operation_id + '/confirm', {})).result.counts,
    first.result.counts,
  );
  const again = await call('contact-imports', input);
  const second = await call('contact-imports/' + again.result.operation_id + '/confirm', {});
  assert.equal(second.result.created, 0);
  assert.equal(second.result.existing, 10000);
  assert.equal(
    (await db.query('SELECT count(*)::int AS n FROM contacts WHERE workspace_id=$1', [workspace]))
      .rows[0].n,
    10000,
  );
  assert.equal(
    (
      await db.query('SELECT count(*)::int AS n FROM contact_lists WHERE workspace_id=$1', [
        workspace,
      ])
    ).rows[0].n,
    10000,
  );
  assert.equal(
    (
      await db.query('SELECT count(*)::int AS n FROM contact_tags WHERE workspace_id=$1', [
        workspace,
      ])
    ).rows[0].n,
    10000,
  );
  const retained = (
    await db.query('SELECT attrs,subscription FROM contacts WHERE workspace_id=$1 AND id=$2', [
      workspace,
      existing.id,
    ])
  ).rows[0];
  assert.equal(retained.attrs.score, 99);
  assert.equal(retained.subscription, 'unsubscribed');
  assert.equal(
    (
      await db.query(
        "SELECT count(*)::int AS n FROM contacts WHERE workspace_id=$1 AND subscription='subscribed'",
        [workspace],
      )
    ).rows[0].n,
    0,
  );
  assert.equal(
    (
      await db.query(
        "SELECT count(*)::int AS n FROM suppressions WHERE workspace_id=$1 AND contact_id=$2 AND reason='manual'",
        [workspace, existing.id],
      )
    ).rows[0].n,
    1,
  );
  const collision = await call('contact-imports', { csv: 'email\nREADER1@example.com' });
  assert.equal(collision.result.preview.valid, 0);
  assert.match(collision.result.preview.rows[0].error, /collision/i);
  const lateError = await call('contact-imports', {
    csv: [
      'email',
      ...Array.from({ length: 100 }, (_, i) => `late${i}@example.com`),
      'invalid',
    ].join('\n'),
  });
  assert.equal(lateError.result.preview.error_count, 1);
  assert.equal(lateError.result.preview.errors[0].row, 102);
  const manyErrors = await call('contact-imports', {
    csv: ['email', ...Array.from({ length: 201 }, () => 'invalid')].join('\n'),
  });
  assert.equal(manyErrors.result.preview.errors.length, 100);
  const errorsUrl =
    origin + '/v1/contact-imports/' + manyErrors.result.operation_id + '/errors?cursor=100';
  const errorResponse = await fetch(errorsUrl, {
    headers: { Cookie: 'mailcraft_local_session=' + token, 'X-Workspace-Id': workspace },
  });
  const errorPage = await errorResponse.json();
  assert.equal(errorResponse.status, 200);
  assert.equal(errorPage.total_errors, 201);
  assert.equal(errorPage.rows[0].row, 102);
  assert.equal(errorPage.next_cursor, 200);
  await db.query(
    "UPDATE contacts SET subscription='subscribed' WHERE workspace_id=$1 AND email_lookup='reader1@example.com'",
    [workspace],
  );
  const conflict = await call('contact-imports', {
    csv: 'email,consent\nreader1@example.com,subscribed\nREADER1@example.com,unsubscribed',
    mapping: { email: 'email', consent_status: 'consent' },
  });
  assert.equal(conflict.result.preview.consent_conflicts.length, 1);
  assert.equal(conflict.result.preview.valid, 0);
  const blocked = await call('contact-imports/' + conflict.result.operation_id + '/confirm', {});
  assert.equal(blocked.status, 409);
  assert.equal(blocked.result.error.code, 'CONSENT_CONFLICT');
  const resolved = await call('contact-imports', {
    csv: 'email,consent\nreader1@example.com,unsubscribed',
    mapping: { email: 'email', consent_status: 'consent' },
  });
  assert.equal(
    (await call('contact-imports/' + resolved.result.operation_id + '/confirm', {})).result
      .unsubscribed,
    1,
  );
  console.log(
    JSON.stringify({
      valid_rows: 10000,
      elapsed_ms,
      created: 9999,
      existing: 1,
      retry_created: 0,
      opt_in_granted: 0,
      suppression: 'retained',
      capacity: 'local PostgreSQL17; single HTTP client; not production acceptance',
    }),
  );
} finally {
  for (const table of [
    'audience_snapshots',
    'segment_versions',
    'segments',
    'engagement_events',
    'contact_tags',
    'contact_lists',
    'contact_fields',
    'tags',
    'lists',
    'consent_events',
    'suppressions',
    'contacts',
    'usage_ledger',
    'outbox',
    'idempotency',
    'operations',
    'audit_events',
    'memberships',
  ])
    await db.query('DELETE FROM ' + table + ' WHERE workspace_id=$1', [workspace]);
  await db.query('DELETE FROM workspaces WHERE id=$1', [workspace]);
  await db.query('DELETE FROM auth_sessions WHERE user_id=$1', [user]);
  await db.end();
}
