import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID, randomBytes } from 'node:crypto';
import { renderWorkerUrl, callRenderWorker } from '../src/server/render-client';
import { renderResponseHeaders, RENDERER_VERSION } from '../renderer/protocol.mjs';
import { AppError } from '../src/server/errors';
const input = {
    schema_version: 1 as const,
    workspace_id: randomUUID(),
    revision_id: randomUUID(),
    artifact_hash: 'a'.repeat(64),
    renderer_version: RENDERER_VERSION,
    format: 'png' as const,
    html: '<p>Fixture</p>',
  },
  secret = randomBytes(32).toString('hex');
test('render transport targets only server-configured private origin and rejects redirect, wrong signed content and stalled stream', async () => {
  assert.equal(renderWorkerUrl('http://renderer.railway.internal:3024').pathname, '/render');
  assert.equal(renderWorkerUrl('http://127.0.0.1:3024').hostname, '127.0.0.1');
  for (const url of [
    'https://example.org',
    'http://169.254.169.254',
    'http://localhost:3024/path',
    'http://user:pass@renderer.railway.internal:3024',
    'http://renderer.railway.internal:3024?key=private',
  ])
    assert.throws(() => renderWorkerUrl(url));
  const bytes = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 1]);
  let attempts = 0;
  const transport: typeof fetch = async (_url, options) => {
    attempts++;
    assert.equal(options?.redirect, 'error');
    const headers = new Headers(options?.headers),
      id = headers.get('X-Render-Request-Id')!;
    return new Response(bytes, {
      headers: { 'Content-Type': 'image/png', ...renderResponseHeaders(bytes, input, secret, id) },
    });
  };
  assert.deepEqual(
    await callRenderWorker(input, { url: 'http://127.0.0.1:3024', secret, transport }),
    bytes,
  );
  assert.equal(attempts, 1);
  await assert.rejects(() =>
    callRenderWorker(input, {
      url: 'http://127.0.0.1:3024',
      secret,
      transport: async () => new Response(bytes, { headers: { 'Content-Type': 'image/png' } }),
    }),
  );
  const controller = new AbortController();
  let cancelled = false;
  const stream = new ReadableStream({
    cancel() {
      cancelled = true;
    },
  });
  const stalled = callRenderWorker(input, {
    url: 'http://127.0.0.1:3024',
    secret,
    signal: controller.signal,
    transport: async () => new Response(stream, { headers: { 'Content-Type': 'image/png' } }),
  });
  setTimeout(() => controller.abort(), 20);
  await assert.rejects(() => stalled);
  assert.equal(cancelled, true);
});
test('review: renderer outage is retryable but permanent dimensions and invalid receipts retain distinct errors', async () => {
  const config = { url: 'http://127.0.0.1:3024', secret };
  await assert.rejects(() => callRenderWorker(input, { ...config, transport: async () => { throw new TypeError('network unavailable'); } }),
    (e: unknown) => e instanceof AppError && e.status === 503 && e.code === 'RENDER_UNAVAILABLE');
  await assert.rejects(() => callRenderWorker(input, { ...config, transport: async () => new Response(JSON.stringify({ error: { code: 'RENDER_DIMENSIONS_EXCEEDED' } }), { status: 422 }) }),
    (e: unknown) => e instanceof AppError && e.status === 422 && e.code === 'RENDER_DIMENSIONS_EXCEEDED');
  await assert.rejects(() => callRenderWorker(input, { ...config, transport: async () => new Response(Buffer.from([137,80,78,71,13,10,26,10]), { headers: { 'Content-Type': 'image/png' } }) }),
    (e: unknown) => e instanceof AppError && e.status === 502 && e.code === 'RENDER_RESPONSE_INVALID');
});
