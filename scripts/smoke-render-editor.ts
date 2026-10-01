import assert from 'node:assert/strict';
import { randomUUID, randomBytes } from 'node:crypto';
import pg from 'pg';
import env from '@next/env';
import { chromium } from 'playwright';
import { digest } from '../src/server/audit';
import { blankSpec } from '../src/domain/email';
env.loadEnvConfig(process.cwd());
const origin = process.env.APP_ORIGIN ?? 'http://127.0.0.1:3000';
if (process.env.LOCAL_DEVELOPMENT !== 'true' || !['127.0.0.1', 'localhost'].includes(new URL(origin).hostname)) throw new Error('Local renderer browser fixtures only');
const db = new pg.Pool({ connectionString: process.env.MIGRATION_DATABASE_URL });
const w = randomUUID(), user = 'render-editor-' + randomUUID(), cookie = randomBytes(32).toString('hex'), brand = randomUUID(), email = randomUUID();
let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
try {
  await db.query('INSERT INTO workspaces(id,name)VALUES($1,$2)', [w, 'Renderer editor fixture']);
  await db.query("INSERT INTO memberships(workspace_id,user_id,role)VALUES($1,$2,'Owner')", [w, user]);
  await db.query("INSERT INTO auth_sessions(token_hash,user_id,expires_at)VALUES($1,$2,now()+interval '1 hour')", [digest(cookie), user]);
  await db.query("INSERT INTO brands(workspace_id,id,version,data)VALUES($1,$2,1,'{}')", [w, brand]);
  await db.query('INSERT INTO emails(workspace_id,id,title,spec,created_by)VALUES($1,$2,$3,$4,$5)', [w, email, 'Renderer editor fixture', JSON.stringify(blankSpec(brand, 'Fixture')), user]);
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await context.addCookies([{ name: 'mailcraft_local_session', value: cookie, url: origin, sameSite: 'Strict' }]);
  const page = await context.newPage();
  await page.addInitScript(() => {
    const original = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function () {
      if (this.href.startsWith('blob:')) document.documentElement.dataset.exportClicks = String(Number(document.documentElement.dataset.exportClicks ?? 0) + 1);
      return original.call(this);
    };
  });
  await page.goto(origin + '/app/emails/' + email);
  await page.getByRole('button', { name: 'PNG', exact: true }).waitFor();
  let release!: () => void, entered!: () => void;
  const gate = new Promise<void>((resolve) => { release = resolve; });
  const ready = new Promise<void>((resolve) => { entered = resolve; });
  await page.route('**/download?format=png', async (route) => {
    const response = await route.fetch();
    entered(); await gate;
    await route.fulfill({ response }).catch(() => {});
  });
  await page.getByRole('button', { name: 'PNG', exact: true }).evaluate((el) => { (el as HTMLButtonElement).click(); (el as HTMLButtonElement).click(); });
  await ready;
  await page.getByLabel('Subject', { exact: true }).fill('Edited while export waits');
  release();
  await page.waitForFunction(() => !Array.from(document.querySelectorAll('button')).find((b) => b.textContent?.trim() === 'PNG')?.disabled);
  assert.equal(await page.evaluate(() => Number(document.documentElement.dataset.exportClicks ?? 0)), 0, 'stale draft must not trigger an export');
  await page.unroute('**/download?format=png');
  let releaseNext!: () => void, enteredNext!: () => void;
  const nextGate = new Promise<void>((resolve) => { releaseNext = resolve; }), nextReady = new Promise<void>((resolve) => { enteredNext = resolve; });
  await page.route('**/download?format=pdf', async (route) => { const response = await route.fetch(); enteredNext(); await nextGate; await route.fulfill({ response }).catch(() => {}); });
  await page.getByRole('button', { name: 'PDF', exact: true }).click();
  await nextReady;
  await page.locator('.back-link').click();
  await page.waitForURL(origin + '/app/emails');
  releaseNext();
  await page.waitForResponse((r) => r.url().includes('/download?format=pdf')).catch(() => {});
  assert.equal(await page.evaluate(() => Number(document.documentElement.dataset.exportClicks ?? 0)), 0, 'unmounted editor must not download previous-workspace bytes');
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  console.log('Delayed export edit/navigation fences, repeated clicks and mobile width pass in actual Chromium.');
} finally {
  await browser?.close();
  for (const table of ['render_downloads', 'preflights', 'idempotency', 'audit_events', 'revisions', 'emails', 'brands', 'memberships']) await db.query(`DELETE FROM ${table} WHERE workspace_id=$1`, [w]);
  await db.query('DELETE FROM auth_sessions WHERE user_id=$1', [user]);
  await db.query('DELETE FROM workspaces WHERE id=$1', [w]);
  await db.end();
}
