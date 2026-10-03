import assert from 'node:assert/strict';
import {createHash, randomBytes, randomUUID} from 'node:crypto';
import {spawn, type ChildProcess} from 'node:child_process';
import {mkdir, open, readFile, writeFile} from 'node:fs/promises';
import {createServer} from 'node:net';
import {chromium, type BrowserContext, type Page, type Route} from 'playwright';
import type pg from 'pg';
import env from '@next/env';
import {sourceDatabase} from './smoke-source-truth';
import {blankSpec} from '../src/domain/email';
import {digest} from '../src/server/audit';
import {SubmissionLedgerView, StagedRecipientView, DeliveryHistoryView, DeliveryAttemptView} from '../src/domain/submission-ledgers';
import {ledgerRecoverySlot} from '../src/ui/submission-ledger-recovery';

const artifactDirectory = '/tmp/lettercape-submission-browser';
const port = 3015;
type Fixture = {
  db: pg.Pool;
  p: {workspace: string; user: string; role: 'Owner'};
  brand: string;
  tx: <T>(fn: (c: pg.PoolClient) => Promise<T>, actor?: string) => Promise<T>;
};
type Campaign = {id: string; name: string; version: number; digest: string; revision_id: string};
type Command = {key: string; body: unknown; actor: string; workspace: string};
const checks: string[] = [];
const routeErrors: string[] = [];
function passed(message: string) {checks.push(message); console.log('PASS', message);}
const delay = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));
function gate() {
  let resolve!: () => void;
  const promise = new Promise<void>(r => {resolve = r;});
  async function wait() {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {await Promise.race([promise, new Promise<never>((_, reject) => {timer = setTimeout(() => reject(Error('Owned browser interception gate timed out')), 30000);})]);}
    finally {if (timer) clearTimeout(timer);}
  }
  return {wait, resolve};
}
function safeRoute(handler: (route: Route) => Promise<unknown>) {
  return async (route: Route) => {
    try {await handler(route);} catch (error) {
      routeErrors.push(error instanceof Error ? error.message : 'Browser route handler failed');
      try {await route.abort('failed');} catch {}
    }
  };
}
function recorded(route: Route): Command {
  const request = route.request(), headers = request.headers();
  return {key: headers['idempotency-key'], body: request.postDataJSON(), actor: headers['x-actor-id'], workspace: headers['x-workspace-id']};
}
function guardOrigin(value: string) {
  const url = new URL(value);
  assert.equal(url.protocol, 'http:');
  assert.ok(['127.0.0.1', 'localhost'].includes(url.hostname));
  assert.equal(url.username + url.password + url.search + url.hash, '');
  return url.origin;
}
function ownedDatabaseURL(connection: string | undefined, kind: 'migration' | 'runtime' | 'fixture') {
  let url: URL;
  try {url = new URL(connection!);} catch {throw Error(`Owned ${kind} database requires a PostgreSQL loopback connection URL.`);}
  if (!['postgres:', 'postgresql:'].includes(url.protocol) || url.href.includes('?') || url.href.includes('#') ||
      !['127.0.0.1', 'localhost'].includes(url.hostname))
    throw Error(`Owned ${kind} database requires a strict PostgreSQL loopback connection URL.`);
  return url;
}
function sameDatabaseAuthority(runtime: URL, fixture: URL) {
  if (runtime.hostname !== fixture.hostname || Number(runtime.port || '5432') !== Number(fixture.port || '5432'))
    throw Error('Owned runtime database must use the fixture PostgreSQL loopback host and effective port.');
}
function guardDatabase(connection: string) {
  const url = ownedDatabaseURL(connection, 'fixture');
  assert.match(url.pathname, /^\/creation_fixture_[a-f0-9]{32}$/);
  return url;
}
function guardOwnedDatabaseEnvironment() {
  // Match sourceDatabase's existing owned mirror loader, in memory only, so both
  // connection authorities are checked before its CREATE DATABASE can connect.
  if (!process.env.MIGRATION_DATABASE_URL)
    env.loadEnvConfig('/Users/prabalpratapsingh/Documents/Codex/2026-10-01/task/mailcraft', false, undefined, true);
  if (process.env.LOCAL_DEVELOPMENT !== 'true') throw Error('Owned migration database requires explicit local development.');
  const migration = ownedDatabaseURL(process.env.MIGRATION_DATABASE_URL, 'migration');
  const runtime = ownedDatabaseURL(process.env.DATABASE_URL, 'runtime');
  sameDatabaseAuthority(runtime, migration);
}
function fixtureRuntimeDatabase(connection: string, fixtureConnection: string) {
  const fixture = guardDatabase(fixtureConnection);
  // pg connection-string query parameters can override the hostname and port.
  // Admit an unambiguous authority before replacing only the database pathname.
  const runtime = ownedDatabaseURL(connection, 'runtime');
  sameDatabaseAuthority(runtime, fixture);
  runtime.pathname = fixture.pathname;
  return runtime;
}
type BrowserEvidence = {external: number; errors: string[]};
async function guardBrowserContext(context: BrowserContext, origin: string, evidence: BrowserEvidence) {
  context.on('page', page => page.on('pageerror', error => evidence.errors.push(error.message)));
  await context.route(url => url.origin !== origin && !['blob:', 'data:'].includes(url.protocol), route => {
    evidence.external++;
    return route.abort();
  });
}
async function stopOwned(child: ChildProcess) {
  if (child.exitCode !== null) return;
  await new Promise<void>(resolve => {
    const timer = setTimeout(() => {if (child.exitCode === null) child.kill('SIGKILL');}, 5000);
    child.once('exit', () => {clearTimeout(timer); resolve();});
    child.kill('SIGTERM');
  });
  passed('Owned Next process stopped by its recorded PID; no other local service was signalled');
}
async function probePort() {
  await new Promise<void>((resolve, reject) => {
    const probe = createServer();
    probe.once('error', reject);
    probe.listen(port, '127.0.0.1', () => probe.close(error => error ? reject(error) : resolve()));
  });
}

async function qualify(origin: string, fixture: Fixture) {
  const {db, p, brand, tx} = fixture;
  guardOrigin(origin);
  guardDatabase(db.options.connectionString!);
  assert.equal(process.env.LOCAL_DEVELOPMENT, 'true');
  // The authority matrix uses several API keys in this generated workspace.
  // Keep its request allowance above the fixture request count; this is not a rate-limit test.
  await db.query('UPDATE workspaces SET api_rpm=100 WHERE id=$1', [p.workspace]);
  const cookie = randomBytes(32).toString('hex'), other = randomUUID();
  const admin = 'ledger-admin-' + randomUUID(), adminCookie = randomBytes(32).toString('hex');
  await db.query("INSERT INTO workspaces(id,name)VALUES($1,'Owned empty ledger workspace')", [other]);
  await db.query("INSERT INTO memberships(workspace_id,user_id,role)VALUES($1,$2,'Owner'),($3,$4,'Admin')", [other, p.user, p.workspace, admin]);
  for (const [user, value] of [[p.user, cookie], [admin, adminCookie]])
    await db.query("INSERT INTO auth_sessions(token_hash,user_id,expires_at)VALUES($1,$2,clock_timestamp()+interval '1 hour')", [digest(value), user]);

  async function call(path: string, method = 'GET', body?: unknown, options: {key?: string; workspace?: string; actor?: string | null; bearer?: string; cookie?: string; origin?: string | null} = {}) {
    const actor = options.actor === undefined ? p.user : options.actor;
    const headers: Record<string, string> = {'Content-Type': 'application/json', 'Idempotency-Key': options.key ?? randomUUID(), 'X-Workspace-Id': options.workspace ?? p.workspace};
    if (actor !== null && !options.bearer) headers['X-Actor-Id'] = actor;
    if (options.origin !== null) headers.Origin = options.origin ?? origin;
    if (options.bearer) headers.Authorization = 'Bearer ' + options.bearer;
    else headers.Cookie = 'mailcraft_local_session=' + (options.cookie ?? cookie);
    const response = await fetch(origin + '/v1/' + path, {method, headers, body: body === undefined ? undefined : JSON.stringify(body)});
    const raw = await response.text();
    let json;
    try {json = JSON.parse(raw);} catch {assert.equal(response.status, 405, `Unexpected non-JSON ${method} ${path} (${response.status})`);}
    return {response, json};
  }
  async function expectStatus(path: string, status: number, method = 'GET', body?: unknown, options?: Parameters<typeof call>[3]) {
    const result = await call(path, method, body, options);
    assert.equal(result.response.status, status, `${method} ${path}: ${result.json?.error?.code ?? 'response status mismatch'}`);
    return result.json;
  }
  async function configure(campaign: Campaign, name: string) {
    return (await expectStatus(`campaigns/${campaign.id}/configuration`, 200, 'POST', {
      expected_version: campaign.version, name, revision_id: campaign.revision_id, planned_timing: null, audience_snapshot_id: snapshot,
    })).campaign as Campaign;
  }
  const email = (await expectStatus('emails', 200, 'POST', {title: 'Owned staged source', spec: blankSpec(brand, 'Owned staging')})).email;
  const revisionResponse = await fetch(origin + `/v1/emails/${email.id}/revisions`, {method: 'POST', headers: {
    Cookie: 'mailcraft_local_session=' + cookie, Origin: origin, 'X-Workspace-Id': p.workspace, 'X-Actor-Id': p.user,
    'Content-Type': 'application/json', 'Idempotency-Key': randomUUID(), 'If-Match': '1',
  }, body: '{}'});
  assert.equal(revisionResponse.status, 200);
  const revision = (await revisionResponse.json()).revision;
  const snapshot = randomUUID(), segment = randomUUID(), evaluated = new Date().toISOString();
  const contacts = Array.from({length: 130}, () => randomUUID()).sort();
  const members = contacts.map((id, index) => ({id, locale: index % 2 ? 'fr-FR' : 'en-US', consent_version: 1, eligible: index < 100, reason: index < 100 ? 'ELIGIBLE' : 'CONSENT_NOT_CONFIRMED'}));
  for (const [index, id] of contacts.entries()) await db.query("INSERT INTO contacts(workspace_id,id,email_original,email_lookup,subscription)VALUES($1,$2,$3,$3,'subscribed')", [p.workspace, id, 'owned-ledger-' + index + '@example.test']);
  await db.query("INSERT INTO segments(workspace_id,id,name)VALUES($1,$2,'Owned frozen ledger audience')", [p.workspace, segment]);
  await db.query('INSERT INTO segment_versions(workspace_id,segment_id,version,schema_version,rule,created_by)VALUES($1,$2,1,1,$3,$4)', [p.workspace, segment, JSON.stringify({kind: 'attribute', field: 'first_name', op: 'exists'}), p.user]);
  const snapshotDigest = digest({schema_version: 1, segment_id: segment, segment_version: 1, evaluated_at: evaluated, members, matched_count: 130, eligible_count: 100, excluded_count: 30});
  await db.query('INSERT INTO audience_snapshots(workspace_id,id,segment_id,segment_version,evaluated_at,members,matched_count,eligible_count,digest,created_by)VALUES($1,$2,$3,1,$4,$5,130,100,$6,$7)', [p.workspace, snapshot, segment, evaluated, JSON.stringify(members), snapshotDigest, p.user]);
  let campaign = (await expectStatus('campaigns', 200, 'POST', {name: 'Owned submission ledger campaign', revision_id: revision.id})).campaign as Campaign;
  campaign = await configure(campaign, campaign.name);
  const createPath = `campaigns/${campaign.id}/submission-ledgers`;
  const body = {expected_version: campaign.version, expected_digest: campaign.digest}, key = randomUUID();
  const baseline = (await db.query('SELECT (SELECT count(*)::int FROM frequency_reservations) frequency,(SELECT count(*)::int FROM usage_ledger) usage,(SELECT count(*)::int FROM operations) operations,(SELECT count(*)::int FROM outbox) outbox')).rows;
  assert.deepEqual((await expectStatus(createPath, 200)).data, []);
  const admitted = SubmissionLedgerView.parse((await expectStatus(createPath, 201, 'POST', body, {key})).ledger);
  assert.equal(admitted.total_count, 130);
  assert.equal(admitted.processed_count, 0);
  assert.equal(admitted.revision_id, revision.id);
  assert.equal(admitted.artifact_hash, revision.artifact_hash);
  assert.equal(admitted.snapshot_id, snapshot);
  assert.equal(admitted.snapshot_digest, snapshotDigest);
  assert.equal((await expectStatus(createPath, 201, 'POST', body, {key})).ledger.id, admitted.id);
  assert.equal((await expectStatus(createPath, 201, 'POST', body)).ledger.id, admitted.id);
  assert.equal((await db.query('SELECT count(*)::int n FROM submission_ledgers')).rows[0].n, 1);
  await expectStatus(createPath, 409, 'POST', {...body, expected_digest: 'a'.repeat(64)}, {key});
  await expectStatus(createPath, 422, 'POST', {...body, authorization_issued: true});
  await expectStatus(createPath, 403, 'POST', body, {origin: 'https://foreign.example.test'});
  await expectStatus(createPath, 403, 'POST', body, {origin: null});
  await expectStatus(createPath, 409, 'POST', body, {actor: 'foreign-actor'});
  await expectStatus(createPath, 404, 'GET', undefined, {workspace: other});
  const ledgerPath = `submission-ledgers/${admitted.id}`;
  const routes = [createPath, ledgerPath, ledgerPath + '/cancel', ledgerPath + '/recipients'];
  for (const path of routes) for (const method of ['PUT', 'PATCH', 'DELETE']) await expectStatus(path, 405, method, {});
  await expectStatus(ledgerPath + '/cancel', 405);
  await expectStatus(ledgerPath, 405, 'POST', {});
  await expectStatus(ledgerPath + '/recipients', 405, 'POST', {});
  await expectStatus(ledgerPath + '/cancel?actor=forged', 422, 'POST', {});
  await expectStatus(ledgerPath + '/cancel', 403, 'POST', {}, {origin: 'https://foreign.example.test'});
  await expectStatus(ledgerPath + '/cancel', 409, 'POST', {}, {actor: 'foreign-actor'});
  await expectStatus(ledgerPath + '/cancel', 404, 'POST', {}, {workspace: other});
  for (const path of [createPath, ledgerPath, ledgerPath + '/recipients']) {
    await expectStatus(path + '?actor=forged', 422);
    await expectStatus(path + '?limit=', 422);
  }
  await expectStatus(createPath + '?limit=25&limit=25', 422);
  await expectStatus(createPath + '?limit=101', 422);
  await expectStatus(ledgerPath + '/recipients?state=accepted', 422);
  for (const role of ['Editor', 'Viewer', 'Billing']) {
    await db.query('UPDATE memberships SET role=$1 WHERE workspace_id=$2 AND user_id=$3', [role, p.workspace, p.user]);
    for (const path of [createPath, ledgerPath, ledgerPath + '/recipients']) await expectStatus(path, 403);
    await expectStatus(createPath, 403, 'POST', body, {key});
    await expectStatus(ledgerPath + '/cancel', 403, 'POST', {});
  }
  await db.query("UPDATE memberships SET role='Owner' WHERE workspace_id=$1 AND user_id=$2", [p.workspace, p.user]);
  const scopedReaders: {secret: string; admitted: boolean}[] = [];
  for (const scopes of [['campaigns:read'], ['audience:read'], ['campaigns:write'], ['campaigns:read', 'audience:read']]) {
    const access = await expectStatus('api-keys', 201, 'POST', {name: 'Owned scope fixture', scopes, expires_in_days: 1});
    const reader = scopes.includes('campaigns:read') && scopes.includes('audience:read');
    scopedReaders.push({secret: access.secret, admitted: reader});
    await expectStatus(ledgerPath, reader ? 200 : 403, 'GET', undefined, {bearer: access.secret});
    await expectStatus(createPath, 403, 'POST', body, {bearer: access.secret});
  }
  const delegated = await expectStatus('api-keys', 201, 'POST', {name: 'Owned ledger writer', scopes: ['campaigns:read', 'campaigns:write', 'audience:read'], expires_in_days: 1});
  const delegatedKey = randomUUID();
  await expectStatus(createPath, 201, 'POST', body, {key: delegatedKey, bearer: delegated.secret});
  await expectStatus(`api-keys/${delegated.key.id}/revoke`, 200, 'POST', {});
  await expectStatus(createPath, 401, 'POST', body, {key: delegatedKey, bearer: delegated.secret});
  passed('HTTP current manager, actor, workspace, API campaigns/audience scope and revoked-key fences apply before keyed replay; strict bodies, queries, CSRF and methods');

  // This is a trusted local fixture transaction, never a public dispatch path.
  const {processSubmissionLedgerBatch} = await import('../src/server/submission-ledger-worker');
  await tx(c => processSubmissionLedgerBatch(c, p));
  let progress = SubmissionLedgerView.parse((await expectStatus(ledgerPath, 200)).ledger);
  assert.equal(progress.processed_count, 100);
  await tx(c => processSubmissionLedgerBatch(c, p));
  progress = SubmissionLedgerView.parse((await expectStatus(ledgerPath, 200)).ledger);
  assert.equal(progress.status, 'completed');
  assert.equal(progress.pending_count, 100);
  assert.equal(progress.skipped_count, 30);
  const first = await expectStatus(ledgerPath + '/recipients', 200);
  assert.equal(first.data.length, 25);
  assert.equal(first.total_count, 130);
  assert.equal(first.has_more, true);
  first.data.forEach((row: unknown) => StagedRecipientView.parse(row));
  const hundred = await expectStatus(ledgerPath + '/recipients?limit=100', 200);
  assert.equal(hundred.data.length, 100);
  const remainder = await expectStatus(ledgerPath + '/recipients?limit=100&after=' + encodeURIComponent(hundred.next_cursor), 200);
  assert.equal(remainder.data.length, 30);
  const pending = await expectStatus(ledgerPath + '/recipients?state=pending&limit=25', 200);
  assert.equal(pending.total_count, 100);
  assert.ok(pending.data.every((row: {submission_state: string}) => row.submission_state === 'pending'));
  await expectStatus(ledgerPath + '/recipients?state=skipped&after=' + encodeURIComponent(pending.next_cursor), 400);
  await expectStatus(ledgerPath + '/recipients?after=' + encodeURIComponent(pending.next_cursor), 400);
  await expectStatus(ledgerPath + '/recipients?after=' + encodeURIComponent(pending.next_cursor), 404, 'GET', undefined, {workspace: other});
  await expectStatus(ledgerPath + '/recipients?state=pending&after=' + encodeURIComponent(pending.next_cursor), 400, 'GET', undefined, {actor: admin, cookie: adminCookie});
  const recipient = StagedRecipientView.parse(pending.data[0]);
  const deliveryPath = `deliveries/${recipient.delivery_id}`;
  assert.equal(StagedRecipientView.parse((await expectStatus(deliveryPath, 200)).delivery).id, recipient.id);
  const history = await expectStatus(deliveryPath + '/history', 200);
  assert.equal(history.data.length, 1);
  history.data.forEach((row: unknown) => DeliveryHistoryView.parse(row));
  const attempts = await expectStatus(deliveryPath + '/attempts', 200);
  attempts.data.forEach((row: unknown) => DeliveryAttemptView.parse(row));
  assert.deepEqual(attempts.data, []);
  assert.equal(attempts.total_count, 0);
  for (const path of [deliveryPath, deliveryPath + '/history', deliveryPath + '/attempts']) {
    for (const method of ['PUT', 'PATCH', 'DELETE']) await expectStatus(path, 405, method, {});
    await expectStatus(path, 405, 'POST', {});
    await expectStatus(path + '?actor=forged', 422);
    await expectStatus(path, 404, 'GET', undefined, {workspace: other});
    await expectStatus(path, 409, 'GET', undefined, {actor: 'foreign-actor'});
  }
  const readPaths = [createPath, ledgerPath, ledgerPath + '/recipients', deliveryPath, deliveryPath + '/history', deliveryPath + '/attempts'];
  for (const credential of scopedReaders) {
    for (const path of readPaths) await expectStatus(path, credential.admitted ? 200 : 403, 'GET', undefined, {bearer: credential.secret});
    await expectStatus(ledgerPath + '/cancel', 403, 'POST', {}, {bearer: credential.secret});
  }
  for (const role of ['Editor', 'Viewer', 'Billing']) {
    await db.query('UPDATE memberships SET role=$1 WHERE workspace_id=$2 AND user_id=$3', [role, p.workspace, p.user]);
    for (const path of readPaths) await expectStatus(path, 403);
    await expectStatus(createPath, 403, 'POST', body, {key});
    await expectStatus(ledgerPath + '/cancel', 403, 'POST', {});
  }
  await db.query("UPDATE memberships SET role='Owner' WHERE workspace_id=$1 AND user_id=$2", [p.workspace, p.user]);
  await db.query("UPDATE workspaces SET status='suspended' WHERE id=$1", [p.workspace]);
  await expectStatus(createPath, 409, 'POST', body, {key});
  await expectStatus(ledgerPath, 409);
  await db.query("UPDATE workspaces SET status='active' WHERE id=$1", [p.workspace]);
  await expectStatus(deliveryPath + '/history?after=' + encodeURIComponent(pending.next_cursor), 400);
  passed('All eight HTTP operations reject unsupported methods/current forbidden roles and missing scopes; signed cursors bind actor, resource and filters; suspended workspace refuses old replay');
  await expectStatus(ledgerPath + '/cancel', 422, 'POST', {unexpected: true});
  for (const projection of [progress, first, hundred, remainder, history, attempts]) {
    const raw = JSON.stringify(projection);
    assert.ok(!raw.includes('@example.test'));
    for (const field of ['email_original', 'email_lookup', 'raw_html', 'payload', 'provider_message_id', 'lease_token']) assert.ok(!raw.includes('"' + field + '"'));
  }
  await db.query("UPDATE contacts SET subscription='pending_confirmation',consent_version=consent_version+1 WHERE workspace_id=$1", [p.workspace]);
  assert.equal((await expectStatus(deliveryPath, 200)).delivery.captured_consent_version, 1);
  assert.deepEqual((await db.query('SELECT members FROM submission_ledgers WHERE id=$1', [admitted.id])).rows[0].members, members);
  assert.deepEqual((await db.query('SELECT (SELECT count(*)::int FROM frequency_reservations) frequency,(SELECT count(*)::int FROM usage_ledger) usage,(SELECT count(*)::int FROM operations) operations,(SELECT count(*)::int FROM outbox) outbox')).rows, baseline);
  passed('Real bounded batches produce 130 frozen mixed recipients, default25/max100 signed state paging, delivery history and actual zero attempts; no current addresses/payloads, quota/frequency/send outbox or authorization');

  campaign = await configure(campaign, 'Owned source drift');
  assert.equal((await expectStatus(createPath, 201, 'POST', body, {key})).ledger.id, admitted.id);
  assert.equal((await expectStatus(ledgerPath, 200)).ledger.configuration_digest, body.expected_digest);
  await expectStatus(createPath, 409, 'POST', body);
  const newestBody = {expected_version: campaign.version, expected_digest: campaign.digest};
  const newest = SubmissionLedgerView.parse((await expectStatus(createPath, 201, 'POST', newestBody)).ledger);
  assert.notEqual(newest.id, admitted.id);
  assert.equal(newest.configuration_digest, campaign.digest);
  assert.equal((await db.query('SELECT count(*)::int n FROM submission_ledgers')).rows[0].n, 2);
  await expectStatus(`submission-ledgers/${newest.id}/recipients?state=pending&after=` + encodeURIComponent(pending.next_cursor), 400);
  passed('Distinct command keys dedupe one immutable configuration; material configuration drift admits a new ledger and preserves the old receipt and manifest');

  let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
  try {
    browser = await chromium.launch({headless: true});
    const context = await browser.newContext({viewport: {width: 1440, height: 1050}});
    await context.addCookies([{name: 'mailcraft_local_session', value: cookie, url: origin, sameSite: 'Strict'}]);
    await context.addInitScript(workspace => {if (top === window && location.protocol === 'http:') localStorage.setItem('mailcraft.workspace', workspace);}, p.workspace);
    const browserEvidence: BrowserEvidence = {external: 0, errors: []};
    await guardBrowserContext(context, origin, browserEvidence);
    const page = await context.newPage();
    const panel = page.locator(`[data-submission-ledgers="${campaign.id}"]`);
    const endpoint = origin + '/v1/' + createPath;
    const scope = {workspace: p.workspace, actor: p.user, campaign: campaign.id};
    const slot = ledgerRecoverySlot(scope);
    async function openPanel() {await page.goto(origin + '/app/campaigns'); await panel.waitFor();}
    async function receipt() {return page.evaluate(name => localStorage.getItem(name), slot);}
    await openPanel();
    const requests: Command[] = [];
    let lose = true;
    const originalCommitted = gate();
    await page.route(endpoint, safeRoute(async route => {
      if (route.request().method() !== 'POST') return route.continue();
      requests.push(recorded(route));
      const response = await route.fetch();
      assert.equal(response.status(), 201);
      if (lose) {lose = false; await route.abort('failed'); originalCommitted.resolve();} else await route.fulfill({response});
    }));
    await panel.getByRole('button', {name: 'Stage recipient ledger', exact: true}).click({trial: true});
    await panel.getByRole('button', {name: 'Stage recipient ledger', exact: true}).evaluate((button: HTMLButtonElement) => {button.click(); button.click();});
    await originalCommitted.wait();
    await panel.getByRole('button', {name: 'Retry original ledger command', exact: true}).waitFor();
    assert.equal(requests.length, 1);
    const originalReceipt = await receipt();
    assert.ok(originalReceipt);
    campaign = await configure(campaign, 'Owned drift after browser acknowledgment loss');
    await page.reload();
    assert.equal(await receipt(), originalReceipt);
    await panel.getByRole('button', {name: 'Retry original ledger command', exact: true}).click();
    await panel.locator(`[data-submission-ledger-detail="${newest.id}"]`).waitFor();
    assert.deepEqual(requests[1], requests[0]);
    assert.equal(await receipt(), null);
    await page.unroute(endpoint);
    passed('Chromium lost actual committed201 response: two synchronous clicks issue one command; exact original key/body survives reload and configuration drift and recovers original ledger');

    await twoTabs(context, page, campaign.id, endpoint, slot, db);
    await openPanel();
    const latest = (await expectStatus(createPath + '?limit=100', 200)).data.find((row: {configuration_version: number}) => row.configuration_version === campaign.version);
    assert.ok(latest);
    await panel.getByRole('button', {name: 'View ledger ' + latest.id, exact: true}).click();
    const latestDetail = panel.locator(`[data-submission-ledger-detail="${latest.id}"]`);
    const cancelEndpoint = origin + `/v1/submission-ledgers/${latest.id}/cancel`;
    const cancellations: Command[] = [];
    lose = true;
    const cancelCommitted = gate();
    await page.route(cancelEndpoint, safeRoute(async route => {
      cancellations.push(recorded(route));
      const response = await route.fetch();
      assert.equal(response.status(), 200);
      if (lose) {lose = false; await route.abort('failed'); cancelCommitted.resolve();} else await route.fulfill({response});
    }));
    await latestDetail.getByRole('button', {name: 'Cancel staged ledger', exact: true}).click();
    await cancelCommitted.wait();
    await panel.getByRole('button', {name: 'Retry original ledger command', exact: true}).waitFor();
    await page.reload();
    await panel.getByRole('button', {name: 'Retry original ledger command', exact: true}).click();
    await latestDetail.getByText('cancelled', {exact: true}).first().waitFor();
    assert.deepEqual(cancellations[1], cancellations[0]);
    assert.equal(await receipt(), null);
    await page.unroute(cancelEndpoint);
    assert.equal((await expectStatus(`submission-ledgers/${latest.id}`, 200)).ledger.status, 'cancelled');
    passed('Chromium committed cancellation acknowledgment loss retains exact empty body/key and original ledger binder across reload, preserving rows/history');

    const keyboardSelection = panel.getByRole('button', {name: 'View ledger ' + admitted.id, exact: true});
    await keyboardSelection.click({trial: true});
    await keyboardSelection.focus();
    await page.keyboard.press('Enter');
    const detail = panel.locator(`[data-submission-ledger-detail="${admitted.id}"]`);
    await detail.waitFor();
    await detail.getByText('completed', {exact: true}).first().waitFor();
    await detail.locator('[data-staged-recipient]').first().waitFor();
    assert.equal(await detail.locator('[data-staged-recipient]').count(), 25);
    await detail.getByRole('button', {name: 'Load more staged recipients', exact: true}).click();
    await detail.locator('[data-staged-recipient]').nth(49).waitFor();
    assert.equal(await detail.locator('[data-staged-recipient]').count(), 50);
    await detail.getByLabel('Recipient state', {exact: true}).selectOption('skipped');
    await detail.locator('[data-staged-recipient]').first().waitFor();
    assert.equal(await detail.locator('[data-staged-recipient]').count(), 25);
    await detail.getByRole('button', {name: 'Load more staged recipients', exact: true}).click();
    await detail.locator('[data-staged-recipient]').nth(29).waitFor();
    assert.equal(await detail.locator('[data-staged-recipient]').count(), 30);
    await detail.getByLabel('Recipient state', {exact: true}).selectOption('pending');
    await detail.getByRole('button', {name: 'View delivery ' + recipient.delivery_id, exact: true}).waitFor();
    await detail.getByRole('button', {name: 'View delivery ' + recipient.delivery_id, exact: true}).click();
    const deliveryDetail = panel.locator(`[data-staged-delivery-detail="${recipient.delivery_id}"]`);
    await deliveryDetail.getByText('No actual attempts recorded. Sending remains unavailable.', {exact: true}).waitFor();
    assert.ok((await deliveryDetail.innerText()).includes('ELIGIBLE'));
    passed('Actual browser recipient pagination and skipped filter read real rows; logical delivery detail renders stored state history and truthful empty attempts');
    await page.setViewportSize({width: 390, height: 844});
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await panel.screenshot({path: artifactDirectory + '/owner-progress-mobile.png'});
    await page.screenshot({path: artifactDirectory + '/owner-page-mobile.png', fullPage: true});
    await panel.locator('h3').scrollIntoViewIfNeeded();
    await page.screenshot({path: artifactDirectory + '/owner-top-mobile.png'});
    await deliveryDetail.screenshot({path: artifactDirectory + '/owner-delivery-mobile.png'});
    await detail.evaluate(element => element.scrollIntoView({block: 'start'}));
    await page.evaluate(() => window.scrollBy(0, -80));
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const progressClip = await detail.evaluate(element => {
      const root = element.getBoundingClientRect(), heading = element.querySelector('h5')!.getBoundingClientRect();
      return {x: root.left, y: root.top, width: root.width, height: heading.bottom - root.top};
    });
    assert.ok(progressClip.height <= 844);
    await page.screenshot({path: artifactDirectory + '/owner-progress-top-mobile.png', clip: progressClip});
    passed('Owner keyboard selection and 390px progress panel show actual completed mixed counts with no horizontal page overflow');

    await page.route(origin + '/v1/' + ledgerPath, route => route.fulfill({status: 503, contentType: 'application/json', body: JSON.stringify({error: {code: 'OWNED_UNAVAILABLE', message: 'Owned transient ledger read interruption'}})}));
    await detail.getByRole('button', {name: 'Refresh ledger status', exact: true}).click();
    await panel.getByRole('alert').filter({hasText: 'Owned transient ledger read interruption'}).waitFor();
    await page.unroute(origin + '/v1/' + ledgerPath);
    await detail.getByRole('button', {name: 'Refresh ledger status', exact: true}).click();
    await detail.locator('[data-staged-recipient]').first().waitFor();
    await detail.getByLabel('Recipient state', {exact: true}).selectOption('cancelled');
    await detail.getByText('No staged recipients match this view.', {exact: true}).waitFor();
    await panel.screenshot({path: artifactDirectory + '/empty-recipients-mobile.png'});
    passed('Actual browser transient status error refresh recovers; empty state filter renders no invented recipients');

    // Original commands are seeded through the exact durable recovery format, then
    // submitted by the real retry control to the real keyed service. No 409 is mocked.
    for (const code of ['VERSION_CONFLICT', 'DIGEST_CONFLICT', 'STATE_CONFLICT']) {
      const fresh = (await expectStatus(`campaigns/${campaign.id}`, 200)).campaign as Campaign;
      const rejectionKey = randomUUID();
      const rejectionBody = {expected_version: code === 'VERSION_CONFLICT' ? fresh.version - 1 : fresh.version, expected_digest: code === 'DIGEST_CONFLICT' ? '0'.repeat(64) : fresh.digest};
      if (code === 'STATE_CONFLICT') await db.query("UPDATE campaigns SET state='paused' WHERE id=$1", [campaign.id]);
      const seeded = JSON.stringify({...scope, command: {kind: 'create', key: rejectionKey, body: JSON.stringify(rejectionBody)}});
      await page.evaluate(({name, value}) => localStorage.setItem(name, value), {name: slot, value: seeded});
      await page.reload();
      const rejectionResponse = page.waitForResponse(response => response.url() === endpoint && response.request().method() === 'POST');
      await panel.getByRole('button', {name: 'Retry original ledger command', exact: true}).click();
      const response = await rejectionResponse;
      assert.equal(response.status(), 409);
      assert.equal((await response.json()).error.code, code);
      await panel.getByRole('button', {name: 'Dismiss rejected ledger command', exact: true}).waitFor();
      assert.equal((await db.query('SELECT count(*)::int n FROM idempotency WHERE key=$1', [rejectionKey])).rows[0].n, 0);
      const rejected = await receipt();
      assert.ok(rejected);
      await page.reload();
      assert.equal(await receipt(), rejected);
      await panel.getByRole('button', {name: 'Dismiss rejected ledger command', exact: true}).click();
      await page.waitForFunction(name => localStorage.getItem(name) === null, slot);
      if (code === 'STATE_CONFLICT') await db.query("UPDATE campaigns SET state='draft' WHERE id=$1", [campaign.id]);
      await panel.getByRole('button', {name: 'Reload ledger configuration', exact: true}).click();
    }
    passed('Real keyed-service VERSION/DIGEST/STATE409 responses to seeded original browser commands persist exact rejected identity across reload; explicit dismissal has zero committed receipt');

    await unknownHeld(page, panel, endpoint, slot);
    await heldWorkspaceSuccess(page, panel, endpoint, slot, p.workspace, other, campaign.id);
    await heldActorSuccess(context, page, panel, endpoint, slot, scope, cookie, adminCookie, admin);
    await unsupportedLocks(browser, origin, cookie, p.workspace, campaign.id, admitted.id, browserEvidence);
    await context.addCookies([{name: 'mailcraft_local_session', value: adminCookie, url: origin, sameSite: 'Strict'}]);
    await openPanel();
    await panel.getByRole('button', {name: 'Stage recipient ledger', exact: true}).click({trial: true});
    assert.equal(await panel.getByRole('button', {name: 'Stage recipient ledger', exact: true}).isEnabled(), true);
    await panel.screenshot({path: artifactDirectory + '/admin-mobile.png'});
    await db.query("UPDATE memberships SET role='Viewer' WHERE workspace_id=$1 AND user_id=$2", [p.workspace, admin]);
    await page.reload();
    await panel.getByText('An Owner or Admin with audience access can inspect staged recipient ledgers.', {exact: true}).waitFor();
    assert.equal(await page.getByRole('button', {name: 'Stage recipient ledger', exact: true}).count(), 0);
    assert.equal(await page.locator('[data-submission-ledger-detail]').count(), 0);
    assert.equal(await page.getByText(contacts[0], {exact: false}).count(), 0);
    await page.screenshot({path: artifactDirectory + '/viewer-mobile.png', fullPage: true});
    await panel.screenshot({path: artifactDirectory + '/viewer-panel-mobile.png'});
    assert.equal(browserEvidence.external, 0);
    assert.deepEqual(browserEvidence.errors, []);
    assert.deepEqual(routeErrors, []);
    passed('Admin has staging controls; current Viewer renders no ledger detail or recipient identifiers; zero browser external requests/page errors');
    await context.close();
  } finally {await browser?.close();}
  assert.equal((await db.query('SELECT count(*)::int n FROM delivery_attempts')).rows[0].n, 0);
}

async function twoTabs(context: BrowserContext, page: Page, campaign: string, endpoint: string, slot: string, db: pg.Pool) {
  const other = await context.newPage();
  await other.goto(new URL('/app/campaigns', endpoint).toString());
  const panels = [page, other].map(tab => tab.locator(`[data-submission-ledgers="${campaign}"]`));
  const entered = gate(), release = gate(), requests: Command[] = [];
  const before = Number((await db.query('SELECT count(*)::int n FROM submission_ledgers')).rows[0].n);
  await context.route(endpoint, safeRoute(async route => {
    if (route.request().method() !== 'POST') return route.continue();
    requests.push(recorded(route));
    const response = await route.fetch();
    assert.equal(response.status(), 201);
    entered.resolve();
    await release.wait();
    await route.abort('failed');
  }));
  try {
    for (const panel of panels) await panel.getByRole('button', {name: 'Stage recipient ledger', exact: true}).click({trial: true});
    await Promise.all(panels.map(panel => panel.getByRole('button', {name: 'Stage recipient ledger', exact: true}).evaluate((button: HTMLButtonElement) => button.click())));
    await entered.wait();
    assert.equal(requests.length, 1);
    assert.equal(await page.evaluate(name => localStorage.getItem(name), slot), await other.evaluate(name => localStorage.getItem(name), slot));
    release.resolve();
    await panels[0].getByRole('button', {name: 'Retry original ledger command', exact: true}).waitFor();
    assert.equal(Number((await db.query('SELECT count(*)::int n FROM submission_ledgers')).rows[0].n), before + 1);
  } finally {release.resolve(); await context.unroute(endpoint); await other.close();}
  await panels[0].getByRole('button', {name: 'Retry original ledger command', exact: true}).click();
  await page.waitForFunction(name => localStorage.getItem(name) === null, slot);
  passed('Actual two tabs contend for one origin lock and preserve one original durable command and one ledger');
}

async function unknownHeld(page: Page, panel: ReturnType<Page['locator']>, endpoint: string, slot: string) {
  const requests: Command[] = [];
  await page.route(endpoint, safeRoute(async route => {
    if (route.request().method() !== 'POST') return route.continue();
    requests.push(recorded(route));
    await route.fulfill({status: 401, contentType: 'application/json', body: JSON.stringify({error: {code: 'AUTH_REQUIRED', message: 'Owned synthetic authentication interruption'}})});
  }));
  await panel.getByRole('button', {name: 'Stage recipient ledger', exact: true}).click();
  await panel.getByRole('button', {name: 'Retry original ledger command', exact: true}).waitFor();
  await panel.getByRole('alert').filter({hasText: 'Owned synthetic authentication interruption'}).waitFor();
  const original = await page.evaluate(name => localStorage.getItem(name), slot);
  assert.ok(original);
  assert.equal(await panel.getByRole('button', {name: 'Dismiss rejected ledger command', exact: true}).count(), 0);
  await page.reload();
  await panel.getByRole('button', {name: 'Retry original ledger command', exact: true}).click();
  await panel.getByRole('alert').filter({hasText: 'Owned synthetic authentication interruption'}).waitFor();
  assert.deepEqual(requests[1], requests[0]);
  assert.equal(await page.evaluate(name => localStorage.getItem(name), slot), original);
  await page.unroute(endpoint);
  await panel.getByRole('button', {name: 'Retry original ledger command', exact: true}).click();
  await page.waitForFunction(name => localStorage.getItem(name) === null, slot);
  passed('Synthetic authentication interruption is explicitly an unknown result: no dismissal; exact command survives reload and real retry clears only a bound success');
}

async function heldWorkspaceSuccess(page: Page, panel: ReturnType<Page['locator']>, endpoint: string, slot: string, workspace: string, other: string, campaign: string) {
  const entered = gate(), release = gate(), done = gate(), requests: Command[] = [];
  let hold = true;
  await page.route(endpoint, safeRoute(async route => {
    if (route.request().method() !== 'POST') return route.continue();
    requests.push(recorded(route));
    const response = await route.fetch();
    assert.equal(response.status(), 201);
    if (hold) {hold = false; entered.resolve(); await release.wait();}
    await route.fulfill({response});
    done.resolve();
  }));
  try {
    await panel.getByRole('button', {name: 'Stage recipient ledger', exact: true}).click();
    await entered.wait();
    const original = await page.evaluate(name => localStorage.getItem(name), slot);
    assert.ok(original);
    await page.getByRole('button', {name: 'Open navigation', exact: true}).click();
    await page.locator('#workspace').selectOption(other);
    await page.getByRole('heading', {name: 'Make something worth opening.', exact: true}).waitFor();
    release.resolve();
    await done.wait();
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    assert.equal(new URL(page.url()).pathname, '/app');
    assert.equal(await page.locator('#workspace').inputValue(), other);
    assert.equal(await page.evaluate(name => localStorage.getItem(name), slot), original);
    await page.getByRole('button', {name: 'Open navigation', exact: true}).click();
    await page.locator('#workspace').selectOption(workspace);
    await page.goto(new URL('/app/campaigns', endpoint).toString());
    await page.locator(`[data-submission-ledgers="${campaign}"]`).getByRole('button', {name: 'Retry original ledger command', exact: true}).click();
    await page.waitForFunction(name => localStorage.getItem(name) === null, slot);
    assert.deepEqual(requests[1], requests[0]);
  } finally {release.resolve(); await page.unroute(endpoint);}
  passed('Held real committed success across an actual workspace switch cannot clear the old receipt or navigate stale context; original workspace retry binds success');
}

async function heldActorSuccess(context: BrowserContext, page: Page, panel: ReturnType<Page['locator']>, endpoint: string, slot: string, scope: {workspace: string; actor: string; campaign: string}, ownerCookie: string, adminCookie: string, admin: string) {
  const entered = gate(), release = gate(), done = gate(), requests: Command[] = [];
  let hold = true;
  await page.route(endpoint, safeRoute(async route => {
    if (route.request().method() !== 'POST') return route.continue();
    requests.push(recorded(route));
    const response = await route.fetch();
    assert.equal(response.status(), 201);
    if (hold) {hold = false; entered.resolve(); await release.wait();}
    try {await route.fulfill({response});} catch {} finally {done.resolve();}
  }));
  const origin = new URL(endpoint).origin;
  try {
    await panel.getByRole('button', {name: 'Stage recipient ledger', exact: true}).click();
    await entered.wait();
    const original = await page.evaluate(name => localStorage.getItem(name), slot);
    assert.ok(original);
    await context.addCookies([{name: 'mailcraft_local_session', value: adminCookie, url: origin, sameSite: 'Strict'}]);
    await page.reload();
    await panel.getByRole('button', {name: 'Stage recipient ledger', exact: true}).waitFor();
    assert.equal(await panel.getByRole('button', {name: 'Retry original ledger command', exact: true}).count(), 0);
    release.resolve();
    await done.wait();
    assert.equal(await page.evaluate(name => localStorage.getItem(name), slot), original);
    assert.equal(await page.evaluate(name => localStorage.getItem(name), ledgerRecoverySlot({...scope, actor: admin})), null);
    await context.addCookies([{name: 'mailcraft_local_session', value: ownerCookie, url: origin, sameSite: 'Strict'}]);
    await page.reload();
    await panel.getByRole('button', {name: 'Retry original ledger command', exact: true}).click();
    await page.waitForFunction(name => localStorage.getItem(name) === null, slot);
    assert.deepEqual(requests[1], requests[0]);
  } finally {release.resolve(); await page.unroute(endpoint);}
  passed('Held committed success across a real session actor switch leaves original actor receipt intact and creates no new actor receipt; restoring actor retries exact command');
}

async function unsupportedLocks(browser: Awaited<ReturnType<typeof chromium.launch>>, origin: string, cookie: string, workspace: string, campaign: string, ledger: string, evidence: BrowserEvidence) {
  const context = await browser.newContext({viewport: {width: 390, height: 844}});
  try {
    await guardBrowserContext(context, origin, evidence);
    await context.addCookies([{name: 'mailcraft_local_session', value: cookie, url: origin, sameSite: 'Strict'}]);
    await context.addInitScript(w => {if (top !== window || location.protocol !== 'http:') return; localStorage.setItem('mailcraft.workspace', w); Object.defineProperty(navigator, 'locks', {value: undefined, configurable: true});}, workspace);
    const page = await context.newPage();
    await page.goto(origin + '/app/campaigns');
    const panel = page.locator(`[data-submission-ledgers="${campaign}"]`);
    await panel.waitFor();
    assert.equal(await panel.getByRole('button', {name: 'Stage recipient ledger', exact: true}).isEnabled(), false);
    await panel.getByRole('button', {name: 'View ledger ' + ledger, exact: true}).click();
    await panel.locator(`[data-submission-ledger-detail="${ledger}"]`).waitFor();
    await panel.screenshot({path: artifactDirectory + '/unsupported-locks-mobile.png'});
    passed('Unsupported browser Web Locks disables mutations while actual ledger reads remain available');
  } finally {await context.close();}
}

await mkdir(artifactDirectory, {recursive: true});
const sourceHash = createHash('sha256').update(await readFile(new URL(import.meta.url))).digest('hex');
const startedAt = new Date().toISOString();
let ownedPid: number | undefined;
let verdict = 'FAIL';
try {
  if (process.env.APP_ORIGIN && !process.argv.includes('--isolated'))
    throw Error('External APP_ORIGIN qualification requires this harness-owned disposable database; use --isolated to start its guarded port3015 app.');
  guardOwnedDatabaseEnvironment();
  await sourceDatabase(async fixture => {
    const runtime = fixtureRuntimeDatabase(process.env.DATABASE_URL!, fixture.db.options.connectionString!);
    await probePort();
    const origin = `http://127.0.0.1:${port}`;
    const localEnv: NodeJS.ProcessEnv = {
      PATH: process.env.PATH, NODE_ENV: 'development', LOCAL_DEVELOPMENT: 'true', APP_ORIGIN: origin,
      DATABASE_URL: runtime.toString(), MIGRATION_DATABASE_URL: fixture.db.options.connectionString!,
      NEXT_TELEMETRY_DISABLED: '1', PREFERENCE_SIGNING_SECRET: randomBytes(32).toString('hex'),
    };
    const log = await open(artifactDirectory + '/server.log', 'w');
    const app = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'dev', '--hostname', '127.0.0.1', '--port', String(port)], {env: localEnv, stdio: ['ignore', log.fd, log.fd]});
    ownedPid = app.pid;
    console.log('Owned submission server PID', ownedPid, 'port', port);
    try {
      const deadline = Date.now() + 90000;
      for (;;) {
        if (app.exitCode !== null) throw Error('Owned submission app exited');
        try {if ((await fetch(origin + '/v1/health')).ok) break;} catch {}
        if (Date.now() > deadline) throw Error('Owned submission app readiness timeout');
        await delay(250);
      }
      await qualify(origin, fixture);
    } finally {await stopOwned(app); await log.close();}
  });
  verdict = 'PASS';
  passed('Disposable database callback completed and its helper dropped only the generated fixture database');
} finally {
  await writeFile(artifactDirectory + '/verdict.json', JSON.stringify({verdict, started_at: startedAt, completed_at: new Date().toISOString(), source_sha256: sourceHash, owned_pid: ownedPid, port, checks}, null, 2) + '\n');
}
