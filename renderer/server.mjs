import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import {
  MAX_RENDER_INPUT,
  verifyRenderRequest,
  validateRenderInput,
  renderResponseHeaders,
  RenderProtocolError,
} from './protocol.mjs';
import { renderBinary } from './browser.mjs';
const fixtures =
  process.env.NODE_ENV !== 'production' &&
  process.env.RENDER_LOCAL_FIXTURES_ONLY === 'true' &&
  ['127.0.0.1', 'localhost'].includes(process.env.HOST ?? '127.0.0.1');
if (!fixtures) {
  const release = JSON.parse(readFileSync('release-gates.json', 'utf8'));
  const complete =
    release.baseline === 'A-full-GA' &&
    release.environment === 'production' &&
    Array.from({ length: 13 }, (_, i) => 'GATE-' + String(i + 1).padStart(2, '0')).every((id) => {
      const e = release.evidence[id];
      return (
        release.gates[id] === 'passed' &&
        e?.build === process.env.RELEASE_BUILD &&
        e?.environment === 'production' &&
        e?.owner &&
        e?.time &&
        e?.path &&
        existsSync(e.path)
      );
    });
  if (!complete) {
    console.error('Renderer startup refused: full GA release evidence incomplete.');
    process.exit(1);
  }

}
  if (
    process.env.DATABASE_URL ||
    process.env.MIGRATION_DATABASE_URL ||
    process.env.OPENAI_API_KEY ||
    process.env.CLERK_SECRET_KEY ||
    process.env.STRIPE_SECRET_KEY
  ) {
    console.error('Renderer startup refused: unrelated credentials must not reach this worker.');
    process.exit(1);
  }
const secret = process.env.RENDER_WORKER_SECRET;
if (!/^[0-9a-f]{64}$/.test(secret ?? '')) {
  console.error('Renderer startup refused: private render authentication key required.');
  process.exit(1);
}
let active = 0;
const seen = new Map();
const server = createServer(async (req, res) => {
  const respond = (status, code) => {
    if (!res.destroyed)
      res
        .writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' })
        .end(JSON.stringify({ error: { code } }));
  };
  if (req.method !== 'POST' || req.url !== '/render') {
    respond(404, 'RESOURCE_NOT_FOUND');
    return;
  }
  const controller = new AbortController(),
    deadline = setTimeout(() => controller.abort(), 25000);
  req.once('aborted', () => controller.abort());
  res.once('close', () => {
    if (!res.writableFinished) controller.abort();
  });
  let admitted = false;
  try {
    let total = 0;
    const chunks = [];
    if (Number(req.headers['content-length'] ?? 0) > MAX_RENDER_INPUT)
      throw new RenderProtocolError('RENDER_INPUT_TOO_LARGE', 413);
    for await (const chunk of req) {
      total += chunk.length;
      if (total > MAX_RENDER_INPUT) throw new RenderProtocolError('RENDER_INPUT_TOO_LARGE', 413);
      chunks.push(chunk);
    }
    const raw = Buffer.concat(chunks),
      requestId = verifyRenderRequest(raw, req.headers, secret);
    for (const [id, expiry] of seen) if (expiry < Date.now()) seen.delete(id);
    if (seen.has(requestId)) throw new RenderProtocolError('RENDER_REPLAY', 409);
    if (active >= 2 || seen.size >= 10000) throw new RenderProtocolError('RENDER_CAPACITY', 429);
    let input;
    try {
      input = validateRenderInput(JSON.parse(raw.toString('utf8')));
    } catch (error) {
      if (error instanceof RenderProtocolError) throw error;
      throw new RenderProtocolError('RENDER_INPUT_INVALID');
    }
    seen.set(requestId, Date.now() + 330000);
    active++;
    admitted = true;
    const bytes = await renderBinary(input.html, input.format, controller.signal);
    if (controller.signal.aborted) throw new RenderProtocolError('RENDER_TIMEOUT', 504);
    res
      .writeHead(200, {
        'Content-Type': input.format === 'png' ? 'image/png' : 'application/pdf',
        'Content-Length': String(bytes.length),
        'Cache-Control': 'no-store',
        ...renderResponseHeaders(bytes, input, secret, requestId),
      })
      .end(bytes);
  } catch (error) {
    respond(
      error instanceof RenderProtocolError ? error.status : 503,
      error instanceof RenderProtocolError ? error.code : 'RENDER_UNAVAILABLE',
    );
  } finally {
    clearTimeout(deadline);
    if (admitted) active--;
  }
});
server.requestTimeout = 10000;
server.headersTimeout = 10000;
server.timeout = 30000;
server.maxConnections = 16;
server.listen(Number(process.env.PORT ?? 3024), process.env.HOST ?? '127.0.0.1', () =>
  console.log('Lettercape isolated renderer listening'),
);
for (const signal of ['SIGTERM', 'SIGINT'])
  process.on(signal, () => server.close(() => process.exit(0)));
