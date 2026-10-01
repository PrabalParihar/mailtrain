import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import pg from 'pg';
import env from '@next/env';
import { issuePreferenceToken, savePreference } from '../src/server/preferences.js';
import { issueConfirmationToken, confirmOptIn } from '../src/server/opt-in.js';
import { reserveFrequency } from '../src/server/frequency.js';
import { tenant, closeDb } from '../src/server/db.js';
import { importCommand } from '../src/server/contact-imports.js';
env.loadEnvConfig(process.cwd());
const origin = process.env.APP_ORIGIN ?? 'http://127.0.0.1:3000';
if (
  process.env.LOCAL_DEVELOPMENT !== 'true' ||
  !['127.0.0.1', 'localhost'].includes(new URL(origin).hostname)
)
  throw new Error('Local fixtures only');
const db = new pg.Pool({ connectionString: process.env.MIGRATION_DATABASE_URL });
const workspace = randomUUID(),
  other = randomUUID(),
  contact = randomUUID(),
  topic = randomUUID(),
  foreign = randomUUID();
const post = (path: string, body: Record<string, string>) =>
  fetch(origin + path, {
    method: 'POST',
    headers: { Origin: origin, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(body),
    redirect: 'manual',
  });
try {
  await db.query('INSERT INTO workspaces(id,name) VALUES($1,$3),($2,$3)', [
    workspace,
    other,
    'Preference QA',
  ]);
  await db.query(
    "INSERT INTO contacts(workspace_id,id,email_original,email_lookup) VALUES($1,$2,'preference@example.com','preference@example.com')",
    [workspace, contact],
  );
  await db.query(
    "INSERT INTO lists(workspace_id,id,name) VALUES($1,$2,'QA product updates'),($3,$4,'Foreign topic')",
    [workspace, topic, other, foreign],
  );
  const token = await issuePreferenceToken(workspace, contact);
  const path = '/preferences/' + token;
  const snapshot = async () =>
    (
      await db.query(
        'SELECT subscription,consent_version,preference_version FROM contacts WHERE id=$1',
        [contact],
      )
    ).rows[0];
  const before = await snapshot();
  const get = await fetch(origin + path);
  assert.equal(get.status, 200);
  assert.ok((await get.text()).includes('Maximum email frequency'));
  assert.deepEqual(await snapshot(), before);
  await assert.rejects(
    savePreference(token, {
      expected_version: 1,
      frequency: 'daily',
      topics: [foreign],
      reactivate_global: false,
    }),
    /topic/i,
  );
  const requested = await savePreference(token, {
    expected_version: 1,
    frequency: 'daily',
    topics: [topic],
    reactivate_global: false,
  });
  assert.equal(requested.confirmation_delivery, 'not_configured');
  assert.equal((await snapshot()).subscription, 'pending_confirmation');
  const request = (
    await db.query(
      'SELECT id FROM opt_in_requests WHERE workspace_id=$1 ORDER BY created_at DESC LIMIT 1',
      [workspace],
    )
  ).rows[0].id;
  const confirmation = await issueConfirmationToken(workspace, request);
  const confirmPath = '/preferences/confirm/' + confirmation;
  const pending = await snapshot();
  assert.equal((await fetch(origin + confirmPath)).status, 200);
  assert.deepEqual(await snapshot(), pending);
  const forgedSuccess = await fetch(origin + confirmPath + '?confirmed=1');
  assert.ok(
    (await forgedSuccess.text()).includes('Confirm subscription'),
    'Pending proof cannot show recorded success from query text',
  );
  const denied = await fetch(origin + confirmPath + '/submit', {
    method: 'POST',
    headers: {
      Origin: 'https://evil.example',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'human_confirmation=confirm',
  });
  assert.equal(denied.status, 403);
  const confirmations = await Promise.all([
    post(confirmPath + '/submit', { human_confirmation: 'confirm' }),
    post(confirmPath + '/submit', { human_confirmation: 'confirm' }),
  ]);
  assert.deepEqual(
    confirmations.map((r) => r.status),
    [303, 303],
  );
  assert.equal((await snapshot()).subscription, 'subscribed');
  assert.equal(
    Number(
      (
        await db.query(
          "SELECT count(*) FROM consent_events WHERE workspace_id=$1 AND action='double_opt_in_confirmed'",
          [workspace],
        )
      ).rows[0].count,
    ),
    1,
  );
  const attempts = await Promise.all(
    [randomUUID(), randomUUID()].map((id) =>
      tenant(workspace, 'fixture', (tx) => reserveFrequency(tx, workspace, contact, topic, id)),
    ),
  );
  assert.equal(attempts.filter((x) => x.reserved).length, 1);
  assert.equal(attempts.filter((x) => x.reason === 'FREQUENCY_CAP').length, 1);
  const winner = attempts.find((x) => x.reserved)!;
  assert.equal(
    (
      await tenant(workspace, 'fixture', (tx) =>
        reserveFrequency(tx, workspace, contact, topic, winner.delivery_id),
      )
    ).reserved,
    true,
  );
  await db.query("UPDATE frequency_reservations SET state='uncertain' WHERE workspace_id=$1", [
    workspace,
  ]);
  await db.query(
    "UPDATE frequency_reservations SET reserved_at=now()-interval '90 days' WHERE workspace_id=$1",
    [workspace],
  );
  assert.equal(
    (
      await tenant(workspace, 'fixture', (tx) =>
        reserveFrequency(tx, workspace, contact, topic, randomUUID()),
      )
    ).reason,
    'FREQUENCY_CAP',
  );
  await db.query("UPDATE frequency_reservations SET state='released' WHERE workspace_id=$1", [
    workspace,
  ]);
  assert.equal(
    (
      await tenant(workspace, 'fixture', (tx) =>
        reserveFrequency(tx, workspace, contact, topic, randomUUID()),
      )
    ).reserved,
    true,
  );
  const scopedToken = await issuePreferenceToken(workspace, contact, topic);
  const scopedPath = '/preferences/' + scopedToken + '/unsubscribe';
  assert.equal((await post(scopedPath, { 'List-Unsubscribe': 'One-Click' })).status, 200);
  assert.equal((await post(scopedPath, { 'List-Unsubscribe': 'One-Click' })).status, 200);
  assert.equal((await snapshot()).subscription, 'subscribed');
  assert.equal(
    Number(
      (await db.query('SELECT count(*) FROM suppressions WHERE workspace_id=$1', [workspace]))
        .rows[0].count,
    ),
    0,
  );
  const current = await snapshot();
  await savePreference(token, {
    expected_version: current.preference_version,
    frequency: 'monthly',
    topics: [],
    reactivate_global: false,
  });
  assert.equal(
    (
      await tenant(workspace, 'fixture', (tx) =>
        reserveFrequency(tx, workspace, contact, topic, randomUUID()),
      )
    ).reason,
    'TOPIC_NOT_CONFIRMED',
  );
  const optout = await snapshot();
  await assert.rejects(
    savePreference(token, {
      expected_version: current.preference_version,
      frequency: 'daily',
      topics: [topic],
      reactivate_global: false,
    }),
    /changed/i,
  );
  await savePreference(token, {
    expected_version: optout.preference_version,
    frequency: 'monthly',
    topics: [topic],
    reactivate_global: false,
  });
  const later = (
    await db.query(
      'SELECT id FROM opt_in_requests WHERE workspace_id=$1 ORDER BY created_at DESC,id DESC LIMIT 1',
      [workspace],
    )
  ).rows[0].id;
  const stale = await issueConfirmationToken(workspace, later);
  assert.equal(
    (await post(path + '/unsubscribe', { 'List-Unsubscribe': 'One-Click' })).status,
    200,
  );
  await assert.rejects(confirmOptIn(stale), /changed|expired/i);
  assert.equal((await snapshot()).subscription, 'unsubscribed');
  // A later deliberate verified re-opt-in removes unsubscribe only; manual protection persists.
  await db.query(
    "INSERT INTO suppressions(workspace_id,contact_id,reason) VALUES($1,$2,'manual')",
    [workspace, contact],
  );
  const reversion = (await snapshot()).preference_version;
  await savePreference(token, {
    expected_version: reversion,
    frequency: 'weekly',
    topics: [topic],
    reactivate_global: true,
  });
  const re = (
    await db.query(
      'SELECT id FROM opt_in_requests WHERE workspace_id=$1 ORDER BY created_at DESC,id DESC LIMIT 1',
      [workspace],
    )
  ).rows[0].id;
  // Imported opt-out also invalidates a pending re-opt-in, even when already unsubscribed.
  const importToken = await issueConfirmationToken(workspace, re);
  const principal = { workspace, user: 'preference-fixture', role: 'Owner' as const };
  const dry = (await tenant(workspace, principal.user, (tx) =>
    importCommand(
      tx,
      principal,
      undefined,
      undefined,
      {
        csv: 'email,consent\npreference@example.com,unsubscribed',
        mapping: { email: 'email', consent_status: 'consent' },
      },
      randomUUID(),
    ),
  )) as { operation_id: string };
  await tenant(workspace, principal.user, (tx) =>
    importCommand(tx, principal, dry.operation_id, 'confirm', {}, randomUUID()),
  );
  await assert.rejects(confirmOptIn(importToken), /changed|expired/i);
  await savePreference(token, {
    expected_version: (await snapshot()).preference_version,
    frequency: 'weekly',
    topics: [topic],
    reactivate_global: true,
  });
  const repeatRequest = (
    await db.query(
      'SELECT id FROM opt_in_requests WHERE workspace_id=$1 ORDER BY created_at DESC,id DESC LIMIT 1',
      [workspace],
    )
  ).rows[0].id;
  const reBefore = await snapshot();
  assert.equal(
    (await post(path + '/unsubscribe', { 'List-Unsubscribe': 'One-Click' })).status,
    200,
  );
  await assert.rejects(
    confirmOptIn(await issueConfirmationToken(workspace, repeatRequest)),
    /changed|expired/i,
  );
  const invalidated = await snapshot();
  assert.ok(invalidated.consent_version > reBefore.consent_version);
  await savePreference(token, {
    expected_version: invalidated.preference_version,
    frequency: 'weekly',
    topics: [topic],
    reactivate_global: true,
  });
  const finalRequest = (
    await db.query(
      'SELECT id FROM opt_in_requests WHERE workspace_id=$1 ORDER BY created_at DESC,id DESC LIMIT 1',
      [workspace],
    )
  ).rows[0].id;
  const reToken = await issueConfirmationToken(workspace, finalRequest);
  await db.query("UPDATE opt_in_requests SET expires_at=now()-interval '1 second' WHERE id=$1", [
    finalRequest,
  ]);
  await assert.rejects(confirmOptIn(reToken), /expired/i);
  await db.query("UPDATE opt_in_requests SET expires_at=now()+interval '1 hour' WHERE id=$1", [
    finalRequest,
  ]);
  await confirmOptIn(reToken);
  const protectedPage = await fetch(origin + path);
  assert.ok((await protectedPage.text()).includes('Unsubscribe from all marketing'));
  assert.equal(
    Number(
      (
        await db.query(
          "SELECT count(*) FROM suppressions WHERE workspace_id=$1 AND reason='manual'",
          [workspace],
        )
      ).rows[0].count,
    ),
    1,
  );
  assert.equal(
    (
      await tenant(workspace, 'fixture', (tx) =>
        reserveFrequency(tx, workspace, contact, topic, randomUUID()),
      )
    ).reason,
    'SUPPRESSED',
  );
  assert.equal(
    (await post(path + '/unsubscribe', { 'List-Unsubscribe': 'One-Click' })).status,
    200,
  );
  await confirmOptIn(reToken); // used confirmation cannot reactivate a later unsubscribe
  assert.equal((await snapshot()).subscription, 'unsubscribed');
  await assert.rejects(issueConfirmationToken(other, re), /invalid|expired/i);
  const { chromium } = await import('playwright');
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.goto(origin + path);
    await page.getByRole('heading', { name: 'You are unsubscribed.' }).waitFor();
    await page.getByLabel('Maximum email frequency').selectOption('daily');
    await page.getByLabel('QA product updates').uncheck();
    const context = page.context();
    await context.setOffline(true);
    const offline = page
      .getByRole('button', { name: 'Save topic and frequency preferences' })
      .click()
      .catch(() => {});
    await offline;
    await page.getByRole('alert').waitFor();
    assert.equal(await page.getByLabel('Maximum email frequency').inputValue(), 'daily');
    await context.setOffline(false);
    await page.getByLabel('Maximum email frequency').selectOption('daily');
    await page.getByLabel('QA product updates').uncheck();
    let saves = 0;
    await page.route('**/preferences/**/save', async (route) => {
      saves++;
      await new Promise((resolve) => setTimeout(resolve, 100));
      await route.continue();
    });
    await page
      .getByRole('button', { name: 'Save topic and frequency preferences' })
      .evaluate((button) => {
        (button as HTMLButtonElement).click();
        (button as HTMLButtonElement).click();
      });
    await page.getByRole('status').filter({ hasText: 'Preferences saved' }).waitFor();
    assert.equal(saves, 1, 'Repeated clicks submit one preference command');
    assert.ok(
      (await page.locator('.preference-topic').first().innerText()).includes('Not subscribed'),
    );
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      true,
    );
    await page.screenshot({
      path: 'output/playwright/lettercape-preferences-mobile.png',
      fullPage: true,
    });
    await page.goto(origin + '/preferences/invalid');
    await page.getByRole('heading', { name: 'Preference link unavailable' }).waitFor();
  } finally {
    await browser.close();
  }
  console.log(
    JSON.stringify({
      checks:
        'GET non-mutation, topic tenant guard, consent CAS, no fabricated delivery, explicit proof, duplicate proof, expiry/staleness, suppression persistence, shared rolling cap, mobile and invalid link',
      confirmation_emails_sent: 0,
    }),
  );
} finally {
  for (const t of [
    'audit_events',
    'idempotency',
    'operations',
    'frequency_reservations',
    'topic_subscriptions',
    'opt_in_requests',
    'consent_events',
    'suppressions',
    'contact_lists',
    'contact_tags',
    'contacts',
    'lists',
    'outbox',
  ])
    await db.query('DELETE FROM ' + t + ' WHERE workspace_id=ANY($1)', [[workspace, other]]);
  await db.query('DELETE FROM workspaces WHERE id=ANY($1)', [[workspace, other]]);
  await closeDb();
  await db.end();
}
