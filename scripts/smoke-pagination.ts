import assert from 'node:assert/strict';
import { randomUUID, randomBytes } from 'node:crypto';
import pg from 'pg';
import env from '@next/env';
import { LettercapeClient, LettercapeError } from '../sdk/client';
import { validateApiResponse } from './api-validation';
import { digest } from '../src/server/audit';
env.loadEnvConfig(process.cwd());
const origin = process.env.APP_ORIGIN ?? 'http://127.0.0.1:3000';
if (
  process.env.LOCAL_DEVELOPMENT !== 'true' ||
  !['127.0.0.1', 'localhost'].includes(new URL(origin).hostname)
)
  throw new Error('Local page fixtures only');
const db = new pg.Pool({ connectionString: process.env.MIGRATION_DATABASE_URL });
const workspace = randomUUID(),
  other = randomUUID(),
  user = 'page-fixture-' + randomUUID(),
  cookie = randomBytes(32).toString('hex');
async function call(path: string, selected = workspace) {
  const r = await fetch(origin + '/v1/' + path, {
    headers: { Cookie: 'mailcraft_local_session=' + cookie, 'X-Workspace-Id': selected },
  });
  return { status: r.status, body: await r.json() };
}
try {
  await db.query('INSERT INTO workspaces(id,name) VALUES($1,$3),($2,$3)', [
    workspace,
    other,
    'Pagination QA',
  ]);
  await db.query(
    "INSERT INTO memberships(workspace_id,user_id,role) VALUES($1,$3,'Owner'),($2,$3,'Owner')",
    [workspace, other, user],
  );
  await db.query(
    "INSERT INTO auth_sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '1 hour')",
    [digest(cookie), user],
  );
  await db.query(
    "INSERT INTO contacts(workspace_id,email_original,email_lookup) SELECT $1,'page-'||g||'@example.com','page-'||g||'@example.com' FROM generate_series(1,106) g",
    [workspace],
  );
  const first = await call('contacts');
  assert.equal(first.status, 200);
  assert.equal(first.body.data.length, 25);
  assert.equal(first.body.has_more, true);
  await db.query(
    "INSERT INTO contacts(workspace_id,email_original,email_lookup) VALUES($1,'later@example.com','later@example.com')",
    [workspace],
  );
  const ids = new Set<string>(first.body.data.map((c: { id: string }) => c.id));
  let cursor = first.body.next_cursor;
  while (cursor) {
    const page = await call('contacts?after=' + encodeURIComponent(cursor));
    assert.equal(page.status, 200);
    for (const row of page.body.data) {
      assert.ok(!ids.has(row.id));
      ids.add(row.id);
    }
    cursor = page.body.next_cursor;
  }
  assert.equal(
    ids.size,
    106,
    'Stable traversal excludes newer inserts without dropping timestamp ties',
  );
  assert.equal(
    (await call('contacts?after=' + encodeURIComponent(first.body.next_cursor), other)).status,
    400,
  );
  assert.equal(
    (await call('campaigns?after=' + encodeURIComponent(first.body.next_cursor))).status,
    400,
  );
  assert.equal(
    (
      await call(
        'contacts?created_before=2027-01-01T00:00:00Z&after=' +
          encodeURIComponent(first.body.next_cursor),
      )
    ).status,
    400,
  );
  assert.equal(
    (
      await call(
        'contacts?after=' + encodeURIComponent(first.body.next_cursor.slice(0, -8) + 'tampered'),
      )
    ).status,
    400,
  );
  const client = new LettercapeClient({
    baseUrl: origin,
    workspace,
    fetch: async (request) => {
      const headers = new Headers(request.headers);
      headers.set('Cookie', 'mailcraft_local_session=' + cookie);
      headers.set('Origin', origin);
      return fetch(new Request(request, { headers }));
    },
  });
  let found = 0;
  for await (const page of client.pages('listContacts', { query: { limit: 100 } })) {
    validateApiResponse('listContacts', page.status, page.data);
    found += page.data.data.length;
    assert.equal(page.data.total_count, 107);
  }
  assert.equal(found, 107);
  const brand = await client.call('confirmBrand', {
    body: {
      name: 'Page QA',
      website: 'https://example.com',
      description: 'Fixture',
      voice: 'Clear',
      accent: '#0B625D',
      background: '#F7F6F2',
      font_stack: 'Arial, sans-serif',
      address: 'Fixture address',
      forbidden_phrases: [],
      approved_claims: [],
      provenance: [],
    },
  });
  validateApiResponse('confirmBrand', brand.status, brand.data);
  const commandKey = randomUUID();
  const created = await client.call('createEmail', {
    body: { title: 'SDK fixture' },
    idempotencyKey: commandKey,
  });
  validateApiResponse('createEmail', created.status, created.data);
  const replay = await client.call('createEmail', {
    body: { title: 'SDK fixture' },
    idempotencyKey: commandKey,
  });
  assert.equal(replay.data.email.id, created.data.email.id);
  await assert.rejects(
    client.call('createEmail', { body: { title: 'Changed' }, idempotencyKey: commandKey }),
    (e) => e instanceof LettercapeError && e.code === 'IDEMPOTENCY_MISMATCH',
  );
  const email = created.data.email;
  const saved = await client.call('saveDraft', {
    path: { id: email.id },
    body: { spec: { ...email.spec, subject: 'SDK acknowledgment' } },
    ifMatch: '"draft-1"',
  });
  validateApiResponse('saveDraft', saved.status, saved.data);
  await assert.rejects(
    client.call('saveDraft', {
      path: { id: email.id },
      body: { spec: email.spec },
      ifMatch: '"draft-1"',
    }),
    (e) => e instanceof LettercapeError && e.status === 412,
  );
  const frozen = await client.call('checkpointEmail', {
    path: { id: email.id },
    body: {},
    ifMatch: '"draft-2"',
  });
  const revision = frozen.data.revision as { id: string };
  const downloaded = await client.call('downloadRevision', {
    path: { id: revision.id },
    query: { format: 'html' },
  });
  assert.ok(downloaded.requestId);
  assert.ok(downloaded.headers.get('X-Artifact-Hash'));
  assert.ok(new TextDecoder().decode(downloaded.data).includes('SDK acknowledgment'));
  const extracted = await client.call('extractBrand', {
    body: { url: 'http://127.0.0.1/private-fixture' },
  });
  validateApiResponse('extractBrand', extracted.status, extracted.data);
  assert.equal(extracted.status, 202);
  assert.equal(extracted.headers.get('Location'), '/v1/operations/' + extracted.data.operation.id);
  assert.equal(extracted.headers.get('Retry-After'), '2');
  await client.call('cancelOperation', { path: { id: extracted.data.operation.id }, body: {} });
  await db.query(
    "INSERT INTO emails(workspace_id,title,spec,created_by) SELECT $1,'Paging email '||g,$2::jsonb,$3 FROM generate_series(1,30) g",
    [workspace, JSON.stringify(email.spec), user],
  );
  const { chromium } = await import('playwright');
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await context.addCookies([
      { name: 'mailcraft_local_session', value: cookie, url: origin, sameSite: 'Strict' },
    ]);
    const page = await context.newPage();
    await page.goto(origin + '/app/audience');
    await page.getByRole('heading', { name: 'Contacts & suppression' }).waitFor();
    const button = page.getByRole('button', { name: 'Load older contacts', exact: true });
    await button.waitFor();
    await context.setOffline(true);
    await button.click();
    await page
      .getByRole('alert')
      .filter({ hasText: /fetch|network/i })
      .first()
      .waitFor();
    await context.setOffline(false);
    for (let i = 0; i < 6; i++) {
      if (!(await button.count())) break;
      const response = page.waitForResponse((r) => r.url().includes('/v1/contacts?after='));
      await button.click();
      assert.equal((await response).status(), 200);
      await page.waitForFunction(
        () => !document.querySelector('[data-contact-pages] button:disabled'),
      );
    }
    assert.equal(await page.locator('[data-contact-pages] tbody tr').count(), 107);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.getByRole('button', { name: 'Open navigation' }).click();
    await page.getByRole('link', { name: 'Emails', exact: true }).click();
    const olderEmails = page.getByRole('button', { name: 'Load older emails', exact: true });
    await olderEmails.waitFor();
    await olderEmails.click();
    await page.getByText('SDK fixture', { exact: true }).waitFor();
    await page.getByRole('button', { name: 'Open navigation' }).click();
    await page.getByRole('link', { name: 'Home', exact: true }).click();
    await page
      .getByText('Saved drafts', { exact: true })
      .locator('..')
      .locator('strong')
      .filter({ hasText: '31' })
      .waitFor();
    assert.equal(
      await page
        .getByText('Saved drafts', { exact: true })
        .locator('..')
        .locator('strong')
        .textContent(),
      '31',
    );
    await page.goto(origin + '/docs');
    await page.getByRole('link', { name: 'OpenAPI 3.1 contract' }).waitFor();
  } finally {
    await browser.close();
  }
  console.log(
    'Signed pages preserve exact timestamp ties under inserts; tenant/resource/filter/tamper checks and Chromium offline/mobile paging pass.',
  );
} finally {
  for (const table of [
    'outbox',
    'api_rate_events',
    'idempotency',
    'usage_ledger',
    'operations',
    'render_downloads',
    'preflights',
    'revisions',
    'emails',
    'brands',
    'contact_lists',
    'contact_tags',
    'suppressions',
    'consent_events',
    'contacts',
    'audit_events',
    'memberships',
  ])
    await db.query(`DELETE FROM ${table} WHERE workspace_id=ANY($1::uuid[])`, [[workspace, other]]);
  await db.query('DELETE FROM auth_sessions WHERE user_id=$1', [user]);
  await db.query('DELETE FROM workspaces WHERE id=ANY($1::uuid[])', [[workspace, other]]);
  await db.end();
}
