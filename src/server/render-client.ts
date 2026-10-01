import { randomUUID } from 'node:crypto';
import {
  renderRequestHeaders,
  verifyRenderResponse,
  MAX_RENDER_OUTPUT,
  MAX_RENDER_INPUT,
  validateRenderInput,
  RenderProtocolError,
  type RenderInput,
} from '../../renderer/protocol.mjs';
import { fail, AppError } from './errors';
async function workerErrorCode(response: Response): Promise<string | undefined> {
  const reader = response.body?.getReader();
  if (!reader) return;
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => { void reader.cancel().catch(() => {}); reject(new Error('Error body deadline')); }, 1000);
  });
  try {
    for (;;) {
      const value = await Promise.race([reader.read(), deadline]);
      if (value.done) break;
      bytes += value.value.byteLength;
      if (bytes > 4096) return;
      chunks.push(value.value);
    }
    const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    return typeof body?.error?.code === 'string' ? body.error.code : undefined;
  } catch { return; } finally {
    clearTimeout(timer);
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}
export function renderWorkerUrl(value: string): URL {
  const url = new URL(value),
    host = url.hostname;
  if (
    !['http:', 'https:'].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.pathname !== '/' ||
    url.search ||
    url.hash ||
    !(host === '127.0.0.1' || host === 'localhost' || host.endsWith('.railway.internal'))
  )
    throw new Error('RENDER_ORIGIN_INVALID');
  url.pathname = '/render';
  return url;
}
async function renderTransport(
  input: RenderInput,
  config: { url: string; secret: string; transport?: typeof fetch; signal?: AbortSignal },
): Promise<Buffer> {
  validateRenderInput(input);
  const body = JSON.stringify(input),
    raw = Buffer.from(body),
    id = randomUUID();
  if (raw.length > MAX_RENDER_INPUT)
    fail(413, 'RENDER_INPUT_TOO_LARGE', 'This frozen artifact exceeds the render request limit.');
  const signal = AbortSignal.any([
    AbortSignal.timeout(30000),
    ...(config.signal ? [config.signal] : []),
  ]);
  const response = await (config.transport ?? fetch)(renderWorkerUrl(config.url), {
    method: 'POST',
    body,
    headers: {
      'Content-Type': 'application/json',
      ...renderRequestHeaders(raw, config.secret, id),
    },
    signal,
    redirect: 'error',
  });
  if (!response.ok) {
    if ([413, 422].includes(response.status)) {
      const code = await workerErrorCode(response);
      const permanent: Record<string, number> = { RENDER_INPUT_TOO_LARGE: 413, RENDER_OUTPUT_TOO_LARGE: 413, RENDER_INPUT_INVALID: 422, RENDER_DIMENSIONS_EXCEEDED: 422 };
      fail(response.status, code && permanent[code] === response.status ? code : 'RENDER_ARTIFACT_REJECTED', 'The frozen artifact cannot be rendered within the supported input, size or dimension limits.');
    }
    await response.body?.cancel().catch(() => {});
    fail(response.status === 429 ? 429 : 503, 'RENDER_UNAVAILABLE', 'The isolated renderer did not acknowledge a completed export. Try again later.');
  }
  if (
    response.headers.get('Content-Type') !==
      (input.format === 'png' ? 'image/png' : 'application/pdf') ||
    Number(response.headers.get('Content-Length') ?? 0) > MAX_RENDER_OUTPUT
  )
    fail(
      502,
      'RENDER_RESPONSE_INVALID',
      'Renderer response did not match the requested format or size.',
    );
  const reader = response.body?.getReader();
  if (!reader) fail(502, 'RENDER_RESPONSE_INVALID', 'Renderer returned no export bytes.');
  const chunks: Uint8Array[] = [];
  let total = 0;
  let abort: () => void = () => {};
  const cancelled = new Promise<never>((_resolve, reject) => {
    abort = () => {
      void reader.cancel().catch(() => {});
      reject(new Error('RENDER_CANCELLED'));
    };
    signal.addEventListener('abort', abort, { once: true });
    if (signal.aborted) abort();
  });
  try {
    for (;;) {
      const result = await Promise.race([reader.read(), cancelled]);
      if (result.done) break;
      total += result.value.byteLength;
      if (total > MAX_RENDER_OUTPUT)
        fail(502, 'RENDER_RESPONSE_INVALID', 'Renderer output exceeded its limit.');
      chunks.push(result.value);
    }
    if (signal.aborted) throw new Error('RENDER_CANCELLED');
    const bytes = Buffer.concat(chunks);
    try {
      verifyRenderResponse(bytes, response.headers, input, config.secret, id);
    } catch {
      fail(502, 'RENDER_RESPONSE_INVALID', 'Renderer response failed its signed artifact checks.');
    }
    return bytes;
  } finally {
    signal.removeEventListener('abort', abort);
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}
export async function callRenderWorker(
  input: RenderInput,
  config: { url: string; secret: string; transport?: typeof fetch; signal?: AbortSignal },
): Promise<Buffer> {
  try {
    return await renderTransport(input, config);
  } catch (error) {
    if (error instanceof AppError) throw error;
    if (config.signal?.aborted) fail(499, 'RENDER_CANCELLED', 'The export request was cancelled.');
    if (error instanceof RenderProtocolError)
      fail(error.status, error.code, 'The isolated renderer response failed its protocol checks.');
    fail(503, 'RENDER_UNAVAILABLE', 'The isolated renderer did not acknowledge a completed export. Try again later.');
  }
}
