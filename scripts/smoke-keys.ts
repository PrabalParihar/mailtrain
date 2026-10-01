import assert from 'node:assert/strict';
import { randomUUID, randomBytes } from 'node:crypto';
import pg from 'pg';
import env from '@next/env';
import { digest } from '../src/server/audit.js';
env.loadEnvConfig(process.cwd());
const origin = process.env.APP_ORIGIN ?? 'http://127.0.0.1:3000';
if (
  process.env.LOCAL_DEVELOPMENT !== 'true' ||
  !['127.0.0.1', 'localhost'].includes(new URL(origin).hostname)
)
  throw new Error('Local key fixtures only');
const db = new pg.Pool({ connectionString: process.env.MIGRATION_DATABASE_URL });
const w = randomUUID(),
  other = randomUUID(),
  user = 'key-fixture-' + randomUUID(),
  cookie = randomBytes(32).toString('hex');
type KeyResult = {
  key: { id: string; name: string; scopes: string[] };
  secret?: string;
  data?: unknown[];
  next_cursor?: string | null;
  has_more?: boolean;
  error?: { code: string };
};
async function call(
  path: string,
  method = 'GET',
  body?: unknown,
  secret?: string,
  headers: Record<string, string> = {},
) {
  const response = await fetch(origin + '/v1/' + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(secret
        ? { Authorization: 'Bearer ' + secret }
        : { Cookie: 'mailcraft_local_session=' + cookie, Origin: origin, 'X-Workspace-Id': w }),
      'Idempotency-Key': randomUUID(),
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { response, result: (await response.json()) as KeyResult };
}
try {
  await db.query('INSERT INTO workspaces(id,name) VALUES($1,$3),($2,$3)', [w, other, 'Key QA']);
  await db.query("INSERT INTO memberships(workspace_id,user_id,role) VALUES($1,$2,'Owner')", [
    w,
    user,
  ]);
  await db.query(
    "INSERT INTO auth_sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '1 hour')",
    [digest(cookie), user],
  );
  const idempotency = randomUUID(),
    input = { name: 'Read only QA', scopes: ['emails:read'], expires_in_days: 90 };
  const issued = await call('api-keys', 'POST', input, undefined, {
    'Idempotency-Key': idempotency,
  });
  assert.equal(issued.response.status, 201);
  assert.ok(issued.result.secret);
  const secret = issued.result.secret!;
  const replay = await call('api-keys', 'POST', input, undefined, {
    'Idempotency-Key': idempotency,
  });
  assert.equal(replay.result.key.id, issued.result.key.id);
  assert.equal(replay.result.secret, undefined);
  assert.equal(
    (
      await call('api-keys', 'POST', { ...input, name: 'Other' }, undefined, {
        'Idempotency-Key': idempotency,
      })
    ).response.status,
    409,
  );
  const persisted = (await db.query('SELECT key_hash FROM api_keys WHERE workspace_id=$1', [w]))
    .rows[0];
  assert.equal(persisted.key_hash, digest(secret));
  for (const table of ['api_keys', 'idempotency', 'audit_events'])
    assert.equal(
      (
        await db.query(
          'SELECT count(*)::int AS n FROM ' +
            table +
            ' t WHERE workspace_id=$1 AND to_jsonb(t)::text LIKE $2',
          [w, '%' + secret + '%'],
        )
      ).rows[0].n,
      0,
    );
  assert.equal((await call('emails', 'GET', undefined, secret)).response.status, 200);
  assert.equal((await call('contacts', 'GET', undefined, secret)).response.status, 403);
  const privateOperation = randomUUID();
  await db.query(
    "INSERT INTO operations(workspace_id,id,type,state,input,result,created_by) VALUES($1,$2,'contacts.import','succeeded','{}',$3,$4)",
    [
      w,
      privateOperation,
      JSON.stringify({ rows: [{ original: 'private-fixture@example.com' }] }),
      user,
    ],
  );
  assert.equal(
    (await call('operations/' + privateOperation, 'GET', undefined, secret)).response.status,
    403,
  );
  assert.equal(
    (await call('emails', 'GET', undefined, secret, { 'X-Workspace-Id': other })).response.status,
    403,
  );
  assert.equal((await call('api-keys', 'GET', undefined, secret)).response.status, 403);
  assert.equal(
    (
      await call('workspaces', 'POST', { name: 'Evil' }, undefined, {
        Authorization: 'Bearer invalid',
        Origin: 'https://evil.example',
      })
    ).response.status,
    403,
  );
  await db.query("UPDATE memberships SET role='Viewer' WHERE workspace_id=$1 AND user_id=$2", [
    w,
    user,
  ]);
  assert.equal((await call('emails', 'GET', undefined, secret)).response.status, 401);
  await db.query("UPDATE memberships SET role='Owner' WHERE workspace_id=$1 AND user_id=$2", [
    w,
    user,
  ]);
  const rotated = await call('api-keys/' + issued.result.key.id + '/rotate', 'POST', {});
  assert.ok(rotated.result.secret);
  assert.equal((await call('emails', 'GET', undefined, secret)).response.status, 401);
  const replacement = rotated.result.secret!;
  await db.query("UPDATE api_keys SET expires_at=now()-interval '1 second' WHERE id=$1", [
    rotated.result.key.id,
  ]);
  assert.equal((await call('emails', 'GET', undefined, replacement)).response.status, 401);
  await db.query("UPDATE api_keys SET expires_at=now()+interval '1 hour' WHERE id=$1", [
    rotated.result.key.id,
  ]);
  assert.equal(
    (await call('api-keys/' + rotated.result.key.id + '/revoke', 'POST', {})).response.status,
    200,
  );
  assert.equal((await call('emails', 'GET', undefined, replacement)).response.status, 401);
  const a = await call('api-keys', 'POST', { ...input, name: 'Quota A' }),
    b = await call('api-keys', 'POST', { ...input, name: 'Quota B' });
  await db.query('DELETE FROM api_rate_events WHERE workspace_id=$1', [w]);
  const requests = await Promise.all(
    Array.from({ length: 11 }, (_, i) =>
      call('emails', 'GET', undefined, i % 2 ? a.result.secret! : b.result.secret!),
    ),
  );
  assert.equal(requests.filter((r) => r.response.status === 200).length, 10);
  assert.equal(requests.filter((r) => r.response.status === 429).length, 1);
  assert.ok(
    Number(requests.find((r) => r.response.status === 429)!.response.headers.get('Retry-After')) >
      0,
  );
  const { chromium } = await import('playwright');
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    await context.addCookies([
      { name: 'mailcraft_local_session', value: cookie, url: origin, sameSite: 'Strict' },
    ]);
    const page = await context.newPage();
    await page.goto(origin + '/app/settings');
    await page.getByRole('heading', { name: 'Workspace API keys', exact: true }).waitFor();
    await page.getByLabel('API key name').fill('QA lost response');
    await context.setOffline(true);
    await page.getByRole('button', { name: 'Create scoped API key' }).click();
    await page.locator('.api-key-panel [role="alert"]').waitFor();
    assert.equal(await page.getByLabel('API key name').inputValue(), 'QA lost response');
    await context.setOffline(false);
    let lost = true,
      creates = 0;
    await page.route('**/v1/api-keys', async (route) => {
      if (route.request().method() === 'POST') {
        creates++;
        if (lost) {
          lost = false;
          await route.fetch();
          await route.abort('failed');
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, 80));
      }
      await route.continue();
    });
    await page.getByRole('button', { name: 'Create scoped API key' }).click();
    await page.locator('.api-key-panel [role="alert"]').waitFor();
    await page.getByRole('button', { name: 'Create scoped API key' }).click();
    await page
      .locator('.api-key-panel [role="status"]')
      .filter({ hasText: 'already acknowledged' })
      .waitFor();
    assert.equal(await page.getByLabel('New API key secret').count(), 0);
    assert.equal(
      (
        await db.query(
          "SELECT count(*)::int AS n FROM api_keys WHERE workspace_id=$1 AND name='QA lost response'",
          [w],
        )
      ).rows[0].n,
      1,
    );
    creates = 0;
    await page.getByLabel('API key name').fill('QA browser key');
    await page.getByRole('button', { name: 'Create scoped API key' }).evaluate((button) => {
      (button as HTMLButtonElement).click();
      (button as HTMLButtonElement).click();
    });
    await page.getByLabel('New API key secret').waitFor();
    assert.equal(creates, 1);
    await page.getByRole('button', { name: 'Dismiss secret' }).click();
    const row = page
      .locator('.api-key-panel tbody tr')
      .filter({ hasText: 'QA browser key' })
      .first();
    const beforeExpiry = (
      await db.query(
        "SELECT expires_at FROM api_keys WHERE workspace_id=$1 AND name='QA browser key' AND revoked_at IS NULL",
        [w],
      )
    ).rows[0].expires_at;
    page.on('dialog', (dialog) => void dialog.accept());
    await row.getByRole('button', { name: 'Rotate key' }).click();
    await page.getByLabel('New API key secret').waitFor();
    await page.getByRole('button', { name: 'Dismiss secret' }).click();
    const afterExpiry = (
      await db.query(
        "SELECT expires_at FROM api_keys WHERE workspace_id=$1 AND name='QA browser key' AND revoked_at IS NULL",
        [w],
      )
    ).rows[0].expires_at;
    assert.equal(new Date(beforeExpiry).getTime(), new Date(afterExpiry).getTime());
    await row.getByRole('button', { name: 'Revoke key' }).click();
    await page
      .locator('.api-key-panel [role="status"]')
      .filter({ hasText: 'Key revoked' })
      .waitFor();
    assert.equal(await page.getByLabel('New API key secret').count(), 0);
    await page.setViewportSize({ width: 390, height: 844 });
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      true,
    );
    assert.equal(
      await page.evaluate(() =>
        JSON.stringify({ ...localStorage, ...sessionStorage }).includes('lc_'),
      ),
      false,
    );
    await page
      .locator('.api-key-panel')
      .screenshot({ path: 'output/playwright/lettercape-api-keys.png' });
    await page.getByRole('button', { name: 'Open navigation' }).click();
    await page.getByRole('link', { name: 'Home', exact: true }).click();
    await page.getByRole('button', { name: 'Open navigation' }).click();
    await page.getByRole('link', { name: 'Settings', exact: true }).click();
    await page.getByRole('heading', { name: 'Workspace API keys', exact: true }).waitFor();
    assert.equal(await page.getByLabel('New API key secret').count(), 0);
    await db.query(
      "INSERT INTO api_keys(workspace_id,key_hash,name,scopes,prefix,created_by,expires_at) SELECT $1::uuid,$1::text||':'||g::text,'Pagination fixture '||g::text,'[\"emails:read\"]'::jsonb,'fixture',$2,now()+interval '1 hour' FROM generate_series(1,101) g",
      [w, user],
    );
    await page.reload();
    await page.getByRole('button', { name: 'Load older keys' }).waitFor();
    for (let i = 0; i < 6; i++) {
      const older = page.getByRole('button', { name: 'Load older keys' });
      if (!(await older.count())) break;
      const response = page.waitForResponse((r) => r.url().includes('/v1/api-keys?after='));
      await older.click();
      assert.equal((await response).status(), 200);
      await page.waitForFunction(() => !document.querySelector('.api-key-panel > button:disabled'));
    }
    assert.equal(
      await page.locator('.api-key-panel tbody tr').filter({ hasText: 'Quota A' }).count(),
      1,
    );
    assert.ok((await page.locator('.api-key-panel tbody tr').count()) > 100);
  } finally {
    await browser.close();
  }
  const first = await call('api-keys?limit=100');
  assert.equal(first.result.data?.length, 100);
  assert.equal(first.result.has_more, true);
  assert.ok(first.result.next_cursor);
  const second = await call(
    'api-keys?limit=100&after=' + encodeURIComponent(first.result.next_cursor!),
  );
  assert.ok(
    second.result.data?.some((k) => (k as { name: string }).name === 'Quota A'),
    'Older active key remains reachable',
  );
  await db.query("INSERT INTO memberships(workspace_id,user_id,role) VALUES($1,$2,'Owner')", [
    other,
    user,
  ]);
  assert.equal(
    (
      await call(
        'api-keys?after=' + encodeURIComponent(first.result.next_cursor!),
        'GET',
        undefined,
        undefined,
        { 'X-Workspace-Id': other },
      )
    ).response.status,
    400,
  );
  assert.equal(
    (
      await call(
        'api-keys?after=' + encodeURIComponent(first.result.next_cursor!.slice(0, -8) + 'tampered'),
      )
    ).response.status,
    400,
  );
  console.log(
    JSON.stringify({
      checks:
        'one-time reveal, hashed storage, safe receipts/audit, tenant binding, resource scopes, session-only management, CSRF, issuer permission, expiry, rotation/revocation, two keys share10rpm, Chromium offline/lost response/repeated click/mobile/navigation and signed cross-tenant/tamper-resistant pagination',
      real_provider_calls: 0,
    }),
  );
} finally {
  for (const t of [
    'api_rate_events',
    'idempotency',
    'audit_events',
    'operations',
    'api_keys',
    'memberships',
  ])
    if ((await db.query('SELECT to_regclass($1) AS table_name', [t])).rows[0].table_name)
      await db.query('DELETE FROM ' + t + ' WHERE workspace_id=ANY($1)', [[w, other]]);
  await db.query('DELETE FROM auth_sessions WHERE token_hash=$1', [digest(cookie)]);
  await db.query('DELETE FROM workspaces WHERE id=ANY($1)', [[w, other]]);
  await db.end();
}
