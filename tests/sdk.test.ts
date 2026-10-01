import test from 'node:test';
import assert from 'node:assert/strict';
import { LettercapeClient, LettercapeError } from '../sdk/client';
const workspace = '11111111-1111-4111-8111-111111111111';
function reply(
  status = 200,
  data: unknown = { request_id: 'req-test', data: [], has_more: false, next_cursor: null },
) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'X-Request-Id': 'req-header' },
  });
}
test('SDK lost command recovery retains key/body and exposes request ID; business errors never retry', async () => {
  const seen: Request[] = [];
  const client = new LettercapeClient({
    baseUrl: 'https://api.example.test',
    workspace,
    apiKey: 'private-fixture',
    wait: async () => {},
    fetch: async (input) => {
      const request = input as Request;
      seen.push(request.clone());
      if (seen.length === 1) throw new TypeError('lost response');
      return reply(201, { request_id: 'ack-1', email: { id: workspace } });
    },
  });
  const result = await client.call('createEmail', {
    body: { title: 'Test' },
    idempotencyKey: 'key-1',
  });
  assert.equal(result.requestId, 'ack-1');
  assert.equal(seen.length, 2);
  assert.equal(seen[0].headers.get('Idempotency-Key'), seen[1].headers.get('Idempotency-Key'));
  assert.equal(await seen[0].text(), await seen[1].text());
  let n = 0;
  const denied = new LettercapeClient({
    baseUrl: 'https://api.example.test',
    workspace,
    fetch: async () => {
      n++;
      return reply(409, {
        request_id: 'deny-1',
        error: { code: 'STATE_CONFLICT', message: 'Reload', retryable: false },
      });
    },
  });
  await assert.rejects(
    denied.call('createEmail', { body: { title: 'Test' } }),
    (e: unknown) =>
      e instanceof LettercapeError && e.requestId === 'deny-1' && e.code === 'STATE_CONFLICT',
  );
  assert.equal(n, 1);
});
test('SDK rate delay, signed pagination and interruption are bounded and keep filters', async () => {
  const urls: string[] = [],
    waits: number[] = [];
  const client = new LettercapeClient({
    baseUrl: 'https://api.example.test',
    workspace,
    wait: async (ms) => {
      waits.push(ms);
    },
    fetch: async (input) => {
      urls.push((input as Request).url);
      if (urls.length === 1)
        return new Response(
          JSON.stringify({ request_id: 'rate', error: { code: 'RATE_LIMITED', message: 'Wait' } }),
          { status: 429, headers: { 'Retry-After': '2', 'Content-Type': 'application/json' } },
        );
      return reply(200, {
        request_id: 'page-' + urls.length,
        data: [{ id: urls.length === 2 ? 'a' : 'b' }],
        has_more: urls.length === 2,
        next_cursor: urls.length === 2 ? 'signed.cursor' : null,
      });
    },
  });
  const ids: string[] = [];
  for await (const page of client.pages('listEmails', { query: { limit: 1 } }))
    ids.push(...page.data.data.map((row) => row.id));
  assert.deepEqual(ids, ['a', 'b']);
  assert.ok(waits[0] >= 2000);
  assert.ok(urls[2].includes('after=signed.cursor') && urls[2].includes('limit=1'));
  const aborted = new AbortController();
  aborted.abort();
  await assert.rejects(client.call('listEmails', { signal: aborted.signal }), {
    name: 'AbortError',
  });
  assert.equal(urls.length, 3);
});
test('SDK refuses insecure credential endpoints, redirects, unkeyed mutation retries and repeated page cursors', async () => {
  assert.throws(
    () => new LettercapeClient({ baseUrl: 'http://remote.example.test', apiKey: 'private' }),
  );
  let calls = 0;
  const client = new LettercapeClient({
    baseUrl: 'https://api.example.test',
    workspace,
    fetch: async (input) => {
      calls++;
      assert.equal((input as Request).redirect, 'error');
      return reply(200, { request_id: 'loop', data: [], has_more: true, next_cursor: 'same' });
    },
  });
  await assert.rejects(async () => {
    for await (const _page of client.pages('listEmails', {})) {
      void _page;
    }
  }, /cursor/i);
  assert.equal(calls, 2);
  const unsafe = new LettercapeClient({
    baseUrl: 'https://api.example.test',
    workspace,
    wait: async () => {},
    fetch: async () => {
      calls++;
      throw new TypeError('lost');
    },
  });
  const prior = calls;
  await assert.rejects(
    unsafe.call('importHtml', {
      path: { id: workspace },
      body: { html: '<p>Test</p>' },
      ifMatch: '"draft-1"',
    }),
  );
  assert.equal(calls, prior + 1);
});
test('SDK exposes uncertain generated command keys and aborts a stalled response stream', async () => {
  const uncertain = new LettercapeClient({
    baseUrl: 'https://api.example.test',
    maxRetries: 0,
    fetch: async () => {
      throw new TypeError('network');
    },
  });
  await assert.rejects(
    uncertain.call('createEmail', { body: { title: 'Uncertain' } }),
    (error: unknown) =>
      error instanceof LettercapeError &&
      typeof error.idempotencyKey === 'string' &&
      error.idempotencyKey.length === 36,
  );
  const signal = new AbortController();
  let cancelled = false;
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(new TextEncoder().encode('{'));
    },
    cancel() {
      cancelled = true;
    },
  });
  const client = new LettercapeClient({
    baseUrl: 'https://api.example.test',
    fetch: async () => new Response(stream, { headers: { 'Content-Type': 'application/json' } }),
  });
  const request = client.call('listEmails', { signal: signal.signal });
  setTimeout(() => signal.abort(), 20);
  await assert.rejects(
    Promise.race([
      request,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Stream did not abort')), 200)),
    ]),
    { name: 'AbortError' },
  );
  assert.equal(cancelled, true);
});
