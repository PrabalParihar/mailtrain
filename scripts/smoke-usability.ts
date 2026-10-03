import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium, type Page } from 'playwright';

// Render the real application with explicitly simulated, read-only list responses.
// No sessions, database fixtures, providers or state-changing API calls are used.
const origin = process.env.APP_ORIGIN ?? 'http://127.0.0.1:3000';
const url = new URL(origin);
assert.ok(url.protocol === 'http:' && ['127.0.0.1', 'localhost'].includes(url.hostname), 'Use a local UI server.');
assert.equal(url.pathname, '/');
assert.equal(url.search, '');
assert.equal(url.hash, '');
const output = process.env.USABILITY_OUTPUT ?? 'output/usability';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const evidence: { check: string; detail: string }[] = [];
const workspace = '11111111-1111-4111-8111-111111111111';
const sample = {
  id: '22222222-2222-4222-8222-222222222222', title: 'A long draft title '.repeat(9).slice(0, 160),
  spec: { subject: 'UnbrokenSubject'.repeat(14).slice(0, 200) }, doc_version: 3, updated_at: '2026-10-01T10:00:00Z',
};
let mode: 'empty' | 'rows' | 'delayed' | 'error' = 'empty';
let registerDelayedRead: ((finish: () => void) => void) | undefined;
const pendingReads = new Set<() => void>();
let emailReads = 0;
let unexpectedWrites = 0;
const unexpectedReads: string[] = [];
function delayRead() {
  mode = 'delayed';
  return new Promise<() => void>(resolve => { registerDelayedRead = resolve; });
}
async function registeredRead(read: Promise<() => void>) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([read, new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error('The delayed UI read was not registered within 15 seconds.')), 15_000);
    })]);
  } finally {
    clearTimeout(timer);
  }
}
async function noOverflow(page: Page, label: string) {
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), label + ' overflowed.');
}
try {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  await context.route(origin + '/v1/**', async route => {
    if (route.request().method() !== 'GET') {
      unexpectedWrites++;
      await route.abort();
      return;
    }
    const path = new URL(route.request().url()).pathname;
    if (path === '/v1/workspaces') {
      await route.fulfill({ json: { actor_id: 'ui-review', data: [{ id: workspace, name: 'UI review workspace', role: 'Owner' }] } });
      return;
    }
    if (path === '/v1/brands/current') {
      await route.fulfill({ json: { brand: null } });
      return;
    }
    if (path === '/v1/operations') {
      await route.fulfill({ json: { data: [], total_count: 0, has_more: false, next_cursor: null } });
      return;
    }
    if (path !== '/v1/emails') {
      unexpectedReads.push(path);
      await route.fulfill({ status: 503, json: { error: { code: 'UI_FIXTURE_UNAVAILABLE', message: 'This UI read is outside the fixture.' } } });
      return;
    }
    emailReads++;
    const responseMode = mode;
    if (responseMode === 'delayed') {
      const register = registerDelayedRead;
      registerDelayedRead = undefined;
      if (!register) {
        unexpectedReads.push('Unregistered delayed email read');
        await route.abort();
        return;
      }
      await new Promise<void>(resolve => {
        const finish = () => { pendingReads.delete(finish); resolve(); };
        pendingReads.add(finish);
        register(finish);
      });
    }
    if (responseMode === 'error') {
      await route.fulfill({ status: 503, json: { error: { code: 'UI_FIXTURE_UNAVAILABLE', message: 'Emails could not be loaded. Try again.' } } });
      return;
    }
    const data = responseMode === 'rows' ? [sample] : [];
    await route.fulfill({ json: { data, total_count: data.length, has_more: responseMode === 'rows', next_cursor: responseMode === 'rows' ? 'ui-fixture-page' : null } });
  });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));

  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    for (const path of ['/', '/docs', '/status', '/support', '/legal', '/app', '/app/emails', '/app/integrations']) {
      await page.goto(origin + path);
      await page.locator('h1').waitFor();
      await noOverflow(page, path + ' at ' + width);
    }
    await page.goto(origin);
    const publicNavigation = page.getByRole('navigation', { name: 'Product navigation' });
    await publicNavigation.getByRole('link', { name: 'Documentation', exact: true }).waitFor({ state: 'visible' });
    await publicNavigation.getByRole('link', { name: 'Status', exact: true }).waitFor({ state: 'visible' });
    await page.screenshot({ path: join(output, 'landing-' + width + '.png'), fullPage: true });
  }
  evidence.push({ check: 'responsive public and workspace screens', detail: '8 real screens at 320, 390, 768 and 1440 CSS pixels; mobile documentation/status links visible.' });

  await page.setViewportSize({ width: 390, height: 600 });
  await page.goto(origin + '/app');
  const toggle = page.getByRole('button', { name: 'Open navigation', exact: true });
  await toggle.waitFor();
  for (let i = 0; i < 14; i++) {
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => !!document.activeElement?.closest('.sidebar')), false, 'Closed navigation received invisible focus.');
  }
  await toggle.focus();
  await page.keyboard.press('Enter');
  assert.equal(await toggle.getAttribute('aria-expanded'), 'true');
  assert.ok(await page.getByLabel('Active brand workspace', { exact: true }).evaluate(el => document.activeElement === el));
  const sidebar = page.locator('.sidebar');
  assert.equal(await sidebar.evaluate(el => getComputedStyle(el).overflowY), 'auto');
  await page.getByRole('link', { name: 'Help & documentation', exact: true }).scrollIntoViewIfNeeded();
  assert.ok(await sidebar.evaluate(el => el.scrollTop > 0), 'Short-screen navigation did not scroll.');
  await page.screenshot({ path: join(output, 'navigation-scrolled.png') });
  await page.keyboard.press('Escape');
  assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
  assert.ok(await toggle.evaluate(el => document.activeElement === el));
  await toggle.click();
  await page.getByRole('button', { name: 'Close navigation', exact: true }).click();
  assert.ok(await toggle.evaluate(el => document.activeElement === el));
  await toggle.click();
  await page.getByRole('link', { name: 'Emails', exact: true }).click();
  await page.waitForURL(origin + '/app/emails');
  assert.equal(await page.getByRole('button', { name: 'Open navigation', exact: true }).getAttribute('aria-expanded'), 'false');
  await page.getByRole('heading', { name: 'Begin with a blank page.' }).waitFor();
  await page.getByRole('link', { name: 'Skip to content', exact: true }).focus();
  await page.keyboard.press('Enter');
  assert.equal(await page.evaluate(() => document.activeElement?.id), 'main');
  evidence.push({ check: 'short-screen keyboard navigation', detail: 'Hidden menu excluded from Tab; Enter, scroll to Help, Escape, explicit Close, link navigation and skip-link focus passed.' });

  const initialRead = delayRead();
  await page.goto(origin + '/app/emails');
  await page.getByRole('status').filter({ hasText: 'Loading emails…' }).waitFor();
  assert.equal(await page.getByRole('heading', { name: 'Begin with a blank page.' }).count(), 0);
  (await registeredRead(initialRead))();
  await page.getByRole('heading', { name: 'Begin with a blank page.' }).waitFor();

  const interruptedRead = delayRead();
  await page.reload();
  await page.getByRole('status').filter({ hasText: 'Loading emails…' }).waitFor();
  const finishInterruptedRead = await registeredRead(interruptedRead);
  mode = 'empty';
  await page.getByRole('button', { name: 'Open navigation', exact: true }).click();
  await page.getByRole('link', { name: 'Integrations', exact: true }).click();
  await page.waitForURL(origin + '/app/integrations');
  finishInterruptedRead();
  await page.getByRole('heading', { name: 'A clear handoff.', exact: true }).waitFor();
  assert.equal(await page.getByRole('heading', { name: 'Begin with a blank page.' }).count(), 0);
  evidence.push({ check: 'navigation during a pending read', detail: 'Leaving the library remains possible while its simulated read is delayed; completing that read does not replace the destination screen.' });

  await page.goto(origin + '/app/emails');
  await page.getByRole('heading', { name: 'Begin with a blank page.' }).waitFor();

  mode = 'error';
  await page.reload();
  await page.getByRole('alert').filter({ hasText: 'Emails could not be loaded.' }).waitFor();
  assert.equal(await page.getByRole('heading', { name: 'Begin with a blank page.' }).count(), 0);
  const retryRead = delayRead();
  const beforeRetry = emailReads;
  await page.getByRole('button', { name: 'Retry loading emails', exact: true }).evaluate(button => { (button as HTMLButtonElement).click(); (button as HTMLButtonElement).click(); });
  await page.waitForFunction(() => (document.querySelector('.alert button') as HTMLButtonElement)?.disabled === true);
  const finishRetryRead = await registeredRead(retryRead);
  assert.equal(emailReads, beforeRetry + 1, 'Repeated Retry started duplicate reads.');
  finishRetryRead();
  await page.getByRole('heading', { name: 'Begin with a blank page.' }).waitFor();
  mode = 'error';
  await page.goto(origin + '/app');
  await page.getByRole('alert').filter({ hasText: 'Emails could not be loaded.' }).waitFor();
  assert.equal(await page.getByRole('heading', { name: 'A fresh page is waiting.' }).count(), 0);
  await page.screenshot({ path: join(output, 'list-error.png'), fullPage: true });
  evidence.push({ check: 'loading, empty and unavailable lists', detail: 'Delayed and failed simulated reads never masquerade as an empty library; repeated Retry makes one read; Home also shows the failure.' });

  mode = 'rows';
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto(origin + '/app/emails');
    await page.locator('.email-rows strong').waitFor();
    await noOverflow(page, 'Long titles and unbroken subjects at ' + width);
    assert.equal(await page.locator('.email-rows strong').innerText(), sample.title.trim());
    assert.equal(await page.locator('.email-rows span:not(.badge)').innerText(), sample.spec.subject);
  }
  await page.screenshot({ path: join(output, 'email-long-title.png'), fullPage: true });
  mode = 'error';
  await page.getByRole('button', { name: 'Load older emails', exact: true }).click();
  await page.getByRole('alert').filter({ hasText: 'Showing the last loaded drafts.' }).waitFor();
  assert.equal(await page.locator('.email-rows strong').innerText(), sample.title.trim());
  evidence.push({ check: 'long draft metadata', detail: 'Full titles and unbroken subjects wrap without widening the viewport at all 4 widths.' });

  mode = 'empty';
  for (const path of ['/docs', '/app', '/app/emails', '/app/integrations']) {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(origin + path);
    await page.locator('h1').waitFor();
    await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
    await noOverflow(page, '200% text sizing ' + path);
    assert.ok(await page.locator('h1').evaluate(el => parseFloat(getComputedStyle(el).fontSize) >= 50));
    assert.ok(await page.locator('button, .button').evaluateAll(elements => elements.every(el => {
      const style = getComputedStyle(el);
      return parseFloat(style.lineHeight) >= parseFloat(style.fontSize);
    })), 'Enlarged button labels have overlapping lines on ' + path);
  }
  await page.screenshot({ path: join(output, 'text-200-percent.png'), fullPage: true });
  await page.goto(origin + '/app/emails/new');
  await page.getByLabel('Email name', { exact: true }).waitFor();
  assert.ok(await page.getByLabel('Email name', { exact: true }).evaluate(el => parseFloat(getComputedStyle(el).fontSize) >= 16), 'Form text is too small for the mobile default.');
  await page.goto(origin + '/docs');
  await page.getByRole('navigation', { name: 'On this page', exact: true }).getByRole('link', { name: 'Keyboard and mobile', exact: true }).click();
  await page.waitForURL(origin + '/docs#keyboard-mobile');
  await page.getByRole('heading', { name: 'Keyboard and smaller screens', exact: true }).waitFor();
  await page.screenshot({ path: join(output, 'docs-mobile.png'), fullPage: true });
  evidence.push({ check: 'text sizing and help', detail: '200% root text sizing reflows the 4 reviewed screens; readable mobile form text; docs section links and guidance render.' });
  assert.equal(unexpectedWrites, 0);
  assert.deepEqual(unexpectedReads, []);
  assert.deepEqual(errors, []);
  await writeFile(join(output, 'report.json'), JSON.stringify({ status: 'pass', fixture: 'simulated read-only UI data; real Chromium/Next rendering', evidence, unexpectedWrites, pageErrors: errors }, null, 2));
  console.log('Usability PASS: ' + evidence.length + ' groups; no database/provider calls or mutations. Evidence: ' + output);
} finally {
  for (const finish of pendingReads) finish();
  await browser.close();
}
