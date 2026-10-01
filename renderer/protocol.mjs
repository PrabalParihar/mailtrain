import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
export const RENDERER_VERSION = 'lettercape-linux-pw1.63-chromium153-export-1';
export const MAX_RENDER_INPUT = 2 * 1024 * 1024;
export const MAX_RENDER_OUTPUT = 20 * 1024 * 1024;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export class RenderProtocolError extends Error {
  constructor(code, status = 422) {
    super(code);
    this.code = code;
    this.status = status;
  }
}
const reject = (code, status) => {
  throw new RenderProtocolError(code, status);
};
const secretKey = (secret) => {
  if (!/^[0-9a-f]{64}$/.test(secret ?? '')) reject('RENDER_KEY_REQUIRED', 503);
  return Buffer.from(secret, 'hex');
};
export const bytesDigest = (bytes) => createHash('sha256').update(bytes).digest('hex');
const signature = (value, secret) =>
  createHmac('sha256', secretKey(secret)).update(value).digest('hex');
function validSignature(value, received, secret) {
  return (
    /^[0-9a-f]{64}$/.test(received ?? '') &&
    timingSafeEqual(Buffer.from(signature(value, secret), 'hex'), Buffer.from(received, 'hex'))
  );
}
function field(headers, name) {
  if (typeof headers.get === 'function') return headers.get(name);
  return headers[name] ?? headers[name.toLowerCase()];
}
function identity(headers, now) {
  const id = field(headers, 'X-Render-Request-Id'),
    time = field(headers, 'X-Render-Timestamp');
  if (!uuid.test(id ?? '') || !/^\d{1,12}$/.test(time ?? '')) reject('RENDER_AUTH_INVALID', 401);
  const seconds = Number(time);
  if (now - seconds > 300 || seconds - now > 30) reject('RENDER_AUTH_EXPIRED', 401);
  return { id, time };
}
export function renderRequestHeaders(raw, secret, id, now = Math.floor(Date.now() / 1000)) {
  if (!uuid.test(id)) reject('RENDER_REQUEST_INVALID');
  const time = String(now);
  return {
    'X-Render-Request-Id': id,
    'X-Render-Timestamp': time,
    'X-Render-Signature': signature(`request.${time}.${id}.${bytesDigest(raw)}`, secret),
  };
}
export function verifyRenderRequest(raw, headers, secret, now = Math.floor(Date.now() / 1000)) {
  secretKey(secret);
  const { id, time } = identity(headers, now);
  if (
    !validSignature(
      `request.${time}.${id}.${bytesDigest(raw)}`,
      field(headers, 'X-Render-Signature'),
      secret,
    )
  )
    reject('RENDER_AUTH_INVALID', 401);
  return id;
}
export function validateRenderInput(value) {
  const keys = [
    'schema_version',
    'workspace_id',
    'revision_id',
    'artifact_hash',
    'renderer_version',
    'format',
    'html',
  ];
  if (
    !value ||
    typeof value !== 'object' ||
    Array.isArray(value) ||
    Object.keys(value).length !== keys.length ||
    Object.keys(value).some((k) => !keys.includes(k))
  )
    reject('RENDER_INPUT_INVALID');
  if (
    value.schema_version !== 1 ||
    !uuid.test(value.workspace_id ?? '') ||
    !uuid.test(value.revision_id ?? '') ||
    !/^[0-9a-f]{64}$/.test(value.artifact_hash ?? '') ||
    value.renderer_version !== RENDERER_VERSION ||
    !['png', 'pdf'].includes(value.format) ||
    typeof value.html !== 'string' ||
    !value.html.trim()
  )
    reject('RENDER_INPUT_INVALID');
  if (Buffer.byteLength(value.html, 'utf8') > MAX_RENDER_INPUT)
    reject('RENDER_INPUT_TOO_LARGE', 413);
  return value;
}
export function renderResponseHeaders(
  bytes,
  input,
  secret,
  id,
  now = Math.floor(Date.now() / 1000),
) {
  const time = String(now),
    digest = bytesDigest(bytes);
  return {
    'X-Render-Request-Id': id,
    'X-Render-Timestamp': time,
    'X-Render-Digest': digest,
    'X-Render-Artifact': input.artifact_hash,
    'X-Render-Version': RENDERER_VERSION,
    'X-Render-Format': input.format,
    'X-Render-Signature': signature(
      `response.${time}.${id}.${digest}.${input.artifact_hash}.${input.format}.${RENDERER_VERSION}`,
      secret,
    ),
  };
}
export function verifyRenderResponse(
  bytes,
  headers,
  input,
  secret,
  id,
  now = Math.floor(Date.now() / 1000),
) {
  secretKey(secret);
  const received = identity(headers, now),
    digest = bytesDigest(bytes);
  if (
    received.id !== id ||
    bytes.length > MAX_RENDER_OUTPUT ||
    field(headers, 'X-Render-Digest') !== digest ||
    field(headers, 'X-Render-Artifact') !== input.artifact_hash ||
    field(headers, 'X-Render-Version') !== RENDERER_VERSION ||
    field(headers, 'X-Render-Format') !== input.format ||
    !validSignature(
      `response.${received.time}.${id}.${digest}.${input.artifact_hash}.${input.format}.${RENDERER_VERSION}`,
      field(headers, 'X-Render-Signature'),
      secret,
    )
  )
    reject('RENDER_RESPONSE_INVALID', 502);
  const magic =
    input.format === 'png' ? Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]) : Buffer.from('%PDF-');
  if (!bytes.subarray(0, magic.length).equals(magic)) reject('RENDER_RESPONSE_INVALID', 502);
  return digest;
}
