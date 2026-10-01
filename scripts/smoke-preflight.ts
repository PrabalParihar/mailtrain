import assert from 'node:assert/strict';
import { randomUUID, randomBytes } from 'node:crypto';
import pg from 'pg';
import env from '@next/env';
import { digest } from '../src/server/audit';
import { blankSpec } from '../src/domain/email';
import { LINT_RULES_VERSION } from '../src/domain/preflight';
env.loadEnvConfig(process.cwd());
const origin = process.env.APP_ORIGIN ?? 'http://127.0.0.1:3000';
if (
  process.env.LOCAL_DEVELOPMENT !== 'true' ||
  !['127.0.0.1', 'localhost'].includes(new URL(origin).hostname)
)
  throw new Error('Local preflight fixtures only');
const db = new pg.Pool({ connectionString: process.env.MIGRATION_DATABASE_URL }),
  w = randomUUID(),
  user = 'preflight-' + randomUUID(),
  cookie = randomBytes(32).toString('hex');
async function call(
  path: string,
  method = 'GET',
  body?: unknown,
  key = randomUUID(),
  version?: number,
) {
  const r = await fetch(origin + '/v1/' + path, {
    method,
    headers: {
      Cookie: 'mailcraft_local_session=' + cookie,
      'X-Workspace-Id': w,
      Origin: origin,
      'Content-Type': 'application/json',
      'Idempotency-Key': key,
      ...(version ? { 'If-Match': String(version) } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  assert.ok(r.ok, `${path}:${r.status}`);
  return r.json();
}
try {
  await db.query('INSERT INTO workspaces(id,name)VALUES($1,$2)', [w, 'Preflight QA']);
  await db.query("INSERT INTO memberships(workspace_id,user_id,role)VALUES($1,$2,'Owner')", [
    w,
    user,
  ]);
  await db.query(
    "INSERT INTO auth_sessions(token_hash,user_id,expires_at)VALUES($1,$2,now()+interval '1 hour')",
    [digest(cookie), user],
  );
  const kit = {
    name: 'Fixture',
    website: 'https://example.org',
    description: 'Fixture',
    voice: 'Clear',
    accent: '#ffffff',
    background: '#F7F6F2',
    font_stack: 'Arial, sans-serif',
    address: 'Fixture address',
    forbidden_phrases: ['risk free'],
    approved_claims: [],
    provenance: [],
  };
  const brand = (await call('brands', 'POST', kit)).brand;
  const spec = blankSpec(brand.id, 'Fixture');
  spec.subject = 'BUY NOW!!!';
  spec.preheader = 'Grounded details';
  spec.theme.accent = '#ffffff';
  spec.sections = [
    {
      id: 'group',
      type: 'columns',
      columns: [
        [{ id: 'copy', type: 'text', text: 'This is risk free' }],
        [{ id: 'cta', type: 'button', label: 'Explore', href: 'https://example.org/offer' }],
      ],
    },
    {
      id: 'opaque',
      type: 'custom_html',
      html: '<p>Hi</p><a>Missing destination</a><img src="https://example.org/image.png">',
    },
    {
      id: 'footer',
      type: 'legal_footer',
      identity: 'Fixture',
      address: 'Fixture address',
      unsubscribe_slot: true,
    },
  ];
  const email = (await call('emails', 'POST', { title: 'Preflight fixture', spec })).email;
  const revision = (await call('emails/' + email.id + '/revisions', 'POST', {}, randomUUID(), 1))
    .revision;
  const frozen = (
    await db.query('SELECT html,artifact_hash FROM revisions WHERE id=$1', [revision.id])
  ).rows[0];
  const key = randomUUID(),
    report = (await call('email-revisions/' + revision.id + '/preflight', 'POST', {}, key)).report;
  assert.equal(report.rule_set_version, LINT_RULES_VERSION);
  assert.equal(report.state, 'blocked');
  assert.equal(report.artifact_hash, frozen.artifact_hash);
  assert.ok(
    report.findings.some(
      (f: { code: string; location: string }) =>
        f.code === 'VOICE_FORBIDDEN' && f.location === 'copy',
    ),
  );
  assert.ok(report.findings.some((f: { code: string }) => f.code === 'LOW_CONTRAST'));
  assert.ok(report.findings.some((f: { code: string }) => f.code === 'REAL_CLIENT_UNAVAILABLE'));
  assert.equal(
    (await call('email-revisions/' + revision.id + '/preflight', 'POST', {}, key)).report.id,
    report.id,
  );
  assert.deepEqual(
    (await db.query('SELECT html,artifact_hash FROM revisions WHERE id=$1', [revision.id])).rows[0],
    frozen,
  );
  // Actual saved/frozen raw mode must apply all four fresh-review safeguards.
  const rawSpec = {
    ...spec,
    editing_mode: 'raw_html',
    raw_html:
      '<title>risk free</title><textarea>risk free</textarea><p>Ordinary</p><img src="https://example.org/x.png" alt="risk free"><a href="mailto:not-an-email-address">Contact</a><a href="tel:hello">Call</a><a href="{{UNSUBSCRIBE_URL}}"></a>',
  };
  const rawEmail = (await call('emails', 'POST', { title: 'Raw review fixture', spec: rawSpec }))
    .email;
  const rawRevision = (
    await call('emails/' + rawEmail.id + '/revisions', 'POST', {}, randomUUID(), 1)
  ).revision;
  const rawReport = (await call('email-revisions/' + rawRevision.id + '/preflight', 'POST', {}))
    .report;
  assert.equal(rawReport.state, 'blocked');
  assert.ok(
    rawReport.findings.some(
      (f: { code: string; location: string }) =>
        f.code === 'VOICE_FORBIDDEN' && f.location === 'raw_html/image[1]',
    ),
  );
  assert.ok(
    !rawReport.findings.some(
      (f: { code: string; location: string }) =>
        f.code === 'VOICE_FORBIDDEN' && f.location === 'raw_html',
    ),
  );
  assert.equal(
    rawReport.findings.filter((f: { code: string }) => f.code === 'UNSAFE_LINK').length,
    2,
  );
  assert.ok(rawReport.findings.some((f: { code: string }) => f.code === 'UNSUBSCRIBE_REQUIRED'));
  const { chromium } = await import('playwright');
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await context.addCookies([
      { name: 'mailcraft_local_session', value: cookie, url: origin, sameSite: 'Strict' },
    ]);
    const page = await context.newPage();
    await page.goto(origin + '/app/emails/' + email.id);
    await page.getByRole('button', { name: 'Review and check', exact: true }).waitFor();
    let requests = 0;
    page.on('request', (r) => {
      if (r.method() === 'POST' && new URL(r.url()).pathname.endsWith('/preflight')) requests++;
    });
    await page.getByRole('button', { name: 'Review and check', exact: true }).evaluate((el) => {
      (el as HTMLButtonElement).click();
      (el as HTMLButtonElement).click();
    });
    await page.locator('.preflight-panel').waitFor();
    assert.equal(requests, 1);
    await page.locator('.preflight-panel').getByText('Location: copy', { exact: true }).waitFor();
    assert.match(await page.locator('.preflight-panel').innerText(), /Rules static-2/);
    await context.setOffline(true);
    await page.getByRole('button', { name: 'Review and check', exact: true }).click();
    await page
      .getByRole('alert')
      .filter({ hasText: /acknowledged|fetch|network|Failed/i })
      .waitFor();
    assert.match(await page.locator('.preflight-panel').innerText(), /Rules static-2/);
    await context.setOffline(false);
    await page.getByRole('button', { name: 'Review and check', exact: true }).click();
    await page.waitForFunction(
      () =>
        !Array.from(document.querySelectorAll('button')).find((b) =>
          b.textContent?.includes('Review and check'),
        )?.disabled,
    );
    assert.match(await page.locator('.preflight-panel').innerText(), /Rules static-2/);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.screenshot({
      path: 'output/playwright/lettercape-preflight-mobile.png',
      fullPage: true,
    });
    await page.goto(origin + '/app/emails');
    await page.getByText('Preflight fixture', { exact: true }).waitFor();
  } finally {
    await browser.close();
  }
  console.log(
    JSON.stringify({
      checks:
        'frozen bytes/hash unchanged, pinned voice locations, static contrast/link/alt, rules version, replay, repeated click, offline retry, mobile/navigation',
      live_provider_calls: 0,
    }),
  );
} finally {
  for (const table of [
    'preflights',
    'idempotency',
    'audit_events',
    'revisions',
    'emails',
    'brands',
    'memberships',
  ])
    await db.query(`DELETE FROM ${table} WHERE workspace_id=$1`, [w]);
  await db.query('DELETE FROM auth_sessions WHERE user_id=$1', [user]);
  await db.query('DELETE FROM workspaces WHERE id=$1', [w]);
  await db.end();
}
