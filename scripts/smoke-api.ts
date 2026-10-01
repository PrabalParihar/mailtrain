import assert from 'node:assert/strict';
import { randomUUID, randomBytes } from 'node:crypto';
import pg from 'pg';
import env from '@next/env';
env.loadEnvConfig(process.cwd());
import { digest } from '../src/server/audit.js';
import { issuePreferenceToken } from '../src/server/preferences.js';
import { closeDb } from '../src/server/db.js';
const origin = process.env.APP_ORIGIN ?? 'http://127.0.0.1:3000';
if (
  process.env.LOCAL_DEVELOPMENT !== 'true' ||
  !['127.0.0.1', 'localhost'].includes(new URL(origin).hostname)
)
  throw new Error('Smoke tests use local fixtures only.');
const db = new pg.Pool({ connectionString: process.env.MIGRATION_DATABASE_URL });
const workspace = randomUUID(),
  other = randomUUID(),
  user = 'api-fixture-' + randomUUID(),
  token = randomBytes(32).toString('hex');
let checks = 0;
async function call(
  path: string,
  method = 'GET',
  body?: unknown,
  extra: Record<string, string> = {},
) {
  const response = await fetch(origin + '/v1/' + path, {
    method,
    headers: {
      Origin: origin,
      Cookie: 'mailcraft_local_session=' + token,
      'Content-Type': 'application/json',
      'X-Workspace-Id': workspace,
      'Idempotency-Key': randomUUID(),
      ...extra,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const result = await response.json();
  return { response, result };
}
try {
  await db.query('INSERT INTO workspaces(id,name) VALUES($1,$3),($2,$3)', [
    workspace,
    other,
    'API fixture',
  ]);
  await db.query("INSERT INTO memberships(workspace_id,user_id,role) VALUES($1,$2,'Owner')", [
    workspace,
    user,
  ]);
  await db.query(
    "INSERT INTO auth_sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '1 hour')",
    [digest(token), user],
  );
  const brandBody = {
    name: 'API Fixture',
    website: 'https://example.org',
    description: 'Test-only collection',
    voice: 'Warm and practical',
    accent: '#0B625D',
    background: '#F7F6F2',
    font_stack: 'Arial, sans-serif',
    address: 'Reserved fixture address',
    approved_claims: [],
    forbidden_phrases: [],
    provenance: [],
  };
  const brand = await call('brands', 'POST', brandBody);
  assert.equal(brand.response.status, 201);
  checks++;
  const key = randomUUID(),
    create = await call('emails', 'POST', { title: 'HTTP fixture' }, { 'Idempotency-Key': key }),
    again = await call('emails', 'POST', { title: 'HTTP fixture' }, { 'Idempotency-Key': key });
  assert.equal(create.result.email.id, again.result.email.id);
  assert.equal(
    (await call('emails', 'POST', { title: 'Different' }, { 'Idempotency-Key': key })).response
      .status,
    409,
  );
  checks++;
  const email = create.result.email;
  assert.equal(
    (
      await call(
        'emails/' + email.id + '/draft',
        'PATCH',
        { spec: { ...email.spec, subject: 'Saved through HTTP' } },
        { 'If-Match': '"draft-1"' },
      )
    ).response.status,
    200,
  );
  assert.equal(
    (
      await call(
        'emails/' + email.id + '/draft',
        'PATCH',
        { spec: email.spec },
        { 'If-Match': '"draft-1"' },
      )
    ).response.status,
    412,
  );
  assert.equal((await call('emails/' + email.id)).result.email.spec.subject, 'Saved through HTTP');
  checks++;
  assert.equal(
    (await call('emails/' + email.id, 'GET', undefined, { 'X-Workspace-Id': other })).response
      .status,
    404,
  );
  assert.equal(
    (
      await call(
        'emails/' + email.id + '/draft',
        'PATCH',
        { spec: email.spec },
        { Origin: 'https://evil.example', 'If-Match': '2' },
      )
    ).response.status,
    403,
  );
  assert.equal((await call('emails/' + email.id + '/revisions', 'GET')).response.status, 405);
  checks++;
  const frozen = await call('emails/' + email.id + '/revisions', 'POST', {}, { 'If-Match': '2' });
  assert.equal(frozen.response.status, 200);
  const revision = frozen.result.revision.id;
  for (const format of ['html', 'txt', 'png', 'pdf']) {
    const response = await fetch(
      origin + '/v1/email-revisions/' + revision + '/download?format=' + format,
      { headers: { Cookie: 'mailcraft_local_session=' + token, 'X-Workspace-Id': workspace } },
    );
    assert.equal(response.status, 200);
    const bytes = Buffer.from(await response.arrayBuffer());
    assert.ok(bytes.length > 100);
    assert.equal(response.headers.get('x-artifact-hash'), frozen.result.revision.artifact_hash);
    if (format === 'pdf') assert.ok(bytes.toString('ascii', 0, 5) === '%PDF-');
    if (format === 'png') assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  }
  checks++;
  for (const role of ['Viewer', 'Billing', 'Editor']) {
    await db.query('UPDATE memberships SET role=$1 WHERE workspace_id=$2 AND user_id=$3', [
      role,
      workspace,
      user,
    ]);
    if (role !== 'Editor')
      assert.equal(
        (
          await call(
            'emails/' + email.id + '/draft',
            'PATCH',
            { spec: email.spec },
            { 'If-Match': '2' },
          )
        ).response.status,
        403,
      );
    if (role === 'Viewer')
      assert.equal(
        (await call('emails/' + email.id + '/preview', 'POST', { spec: email.spec })).response
          .status,
        200,
      );
    if (role === 'Billing') assert.equal((await call('emails/' + email.id)).response.status, 403);
  }
  await db.query("UPDATE memberships SET role='Owner' WHERE workspace_id=$1 AND user_id=$2", [
    workspace,
    user,
  ]);
  checks++;
  const ai = await call('emails/generate', 'POST', {
    prompt: 'Draft the fixture story',
    brand_kit_version_id: brand.result.brand.id,
    locale: 'en-US',
    mode: 'single',
  });
  assert.equal(ai.response.status, 409);
  assert.equal(ai.result.error.code, 'PROVIDER_NOT_READY');
  assert.equal(
    (await db.query('SELECT * FROM usage_ledger WHERE workspace_id=$1', [workspace])).rowCount,
    0,
  );
  checks++;
  const dry = await call('contact-imports', 'POST', {
    csv: 'email,first_name\njane@example.com,Jane\nJANE@example.com,Collision\ninvalid,Bad\nreal@not-reserved-domain.com,Held',
  });
  assert.equal(dry.result.preview.valid, 1);
  assert.equal(dry.result.preview.eligible, 0);
  await call('contact-imports/' + dry.result.operation_id + '/confirm', 'POST', {});
  const contact = (await call('contacts')).result.data[0];
  assert.equal(contact.subscription, 'pending_confirmation');
  await call('contacts/' + contact.id + '/suppress', 'POST', {});
  await call('contact-imports/' + dry.result.operation_id + '/confirm', 'POST', {});
  assert.equal((await call('contacts')).result.data[0].suppressed, true);
  checks++;
  const pref = await issuePreferenceToken(workspace, contact.id);
  const link = origin + '/preferences/' + pref;
  const before = (
    await db.query('SELECT subscription,consent_version FROM contacts WHERE workspace_id=$1', [
      workspace,
    ])
  ).rows[0];
  assert.equal((await fetch(link)).status, 200);
  assert.deepEqual(
    (
      await db.query('SELECT subscription,consent_version FROM contacts WHERE workspace_id=$1', [
        workspace,
      ])
    ).rows[0],
    before,
  );
  for (let i = 0; i < 2; i++)
    assert.equal(
      (
        await fetch(link + '/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: 'List-Unsubscribe=One-Click',
        })
      ).status,
      200,
    );
  assert.equal(
    (
      await db.query("SELECT * FROM suppressions WHERE workspace_id=$1 AND reason='unsubscribe'", [
        workspace,
      ])
    ).rowCount,
    1,
  );
  checks++;
  const campaign = (
    await call('campaigns', 'POST', { name: 'Fixture campaign', revision_id: revision })
  ).result.campaign;
  assert.equal(
    (await call('campaigns/' + campaign.id + '/approve', 'POST', {})).response.status,
    422,
  );
  assert.equal((await call('campaigns/' + campaign.id + '/send', 'POST', {})).response.status, 409);
  checks++;
  console.log(`${checks} real HTTP smoke groups passed; no AI or sending providers invoked.`);
} finally {
  for (const table of [
    'preflights',
    'campaigns',
    'consent_events',
    'suppressions',
    'contacts',
    'usage_ledger',
    'outbox',
    'idempotency',
    'operations',
    'revisions',
    'emails',
    'brands',
    'audit_events',
    'api_keys',
    'memberships',
  ])
    await db.query('DELETE FROM ' + table + ' WHERE workspace_id IN($1,$2)', [workspace, other]);
  await db.query('DELETE FROM workspaces WHERE id IN($1,$2)', [workspace, other]);
  await db.query('DELETE FROM auth_sessions WHERE user_id=$1', [user]);
  await db.end();
  await closeDb();
}
