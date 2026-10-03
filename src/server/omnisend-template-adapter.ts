// Unmounted transport. A future verified OAuth/account admission supplies the
// token and durable callbacks. This module does not implement an export queue.
import { createHash } from 'node:crypto';
import type { OmnisendArtifact } from '../domain/omnisend-export';
import { OMNISEND_API_REVISION, OMNISEND_IMPORT_BODY_LIMIT, OMNISEND_MAPPING_VERSION } from '../domain/omnisend-export-contracts';

const IMPORT_URL = 'https://api.omnisend.com/api/email-templates/import';
const RESOURCE_PREFIX = 'https://api.omnisend.com/api/email-templates/';
const MAX_RESPONSE = 5 * 1024 * 1024 - 1;
const SHA256 = /^[a-f0-9]{64}$/;
const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const REMOTE_ID = /^[a-f0-9]{24}$/i;

export type OmnisendTemplateResult = {
  state: 'needs_attention' | 'outcome_unknown'; code: string;
  remote_id: string | null; resource_url: string | null; destination_url: null;
  content_verified: false; retry_after?: number;
};
type Options = {
  artifact: OmnisendArtifact; name: string; accessToken: string; signal?: AbortSignal;
  markSubmission: () => Promise<void>; persistRemoteId: (id: string) => Promise<void>; fetcher?: typeof fetch;
};
function result(state: OmnisendTemplateResult['state'], code: string, id: string | null = null, retry_after?: number): OmnisendTemplateResult {
  return { state, code, remote_id: id, resource_url: id === null ? null : RESOURCE_PREFIX + id, destination_url: null, content_verified: false, ...(retry_after === undefined ? {} : { retry_after }) };
}
const sha = (value: string) => createHash('sha256').update(value, 'utf8').digest('hex');
function wellFormed(value: string) {
  for (let i = 0; i < value.length; i++) {
    const unit = value.charCodeAt(i);
    if (unit >= 0xd800 && unit <= 0xdbff) {
      const next = value.charCodeAt(++i);
      if (!(next >= 0xdc00 && next <= 0xdfff)) return false;
    } else if (unit >= 0xdc00 && unit <= 0xdfff) return false;
  }
  return true;
}
function validateArtifact(a: OmnisendArtifact) {
  if (!a || a.destination !== 'omnisend' || a.mapping_version !== OMNISEND_MAPPING_VERSION || a.api_revision !== OMNISEND_API_REVISION || a.remote_export_enabled !== false ||
    typeof a.revision_id !== 'string' || !UUID.test(a.revision_id) ||
    typeof a.source_artifact_hash !== 'string' || !SHA256.test(a.source_artifact_hash) ||
    typeof a.html !== 'string' || typeof a.text !== 'string' || !wellFormed(a.html) || !wellFormed(a.text) ||
    Buffer.byteLength(a.html, 'utf8') > OMNISEND_IMPORT_BODY_LIMIT || Buffer.byteLength(a.text, 'utf8') > OMNISEND_IMPORT_BODY_LIMIT ||
    a.html_sha256 !== sha(a.html) || a.text_sha256 !== sha(a.text) ||
    a.destination_hash !== sha(JSON.stringify([a.mapping_version, a.api_revision, a.source_artifact_hash, a.html, a.text])) ||
    !Array.isArray(a.transformations) || a.transformations.length > 10 || a.transformations.some(value => typeof value !== 'string')) throw Error('EXPORT_ARTIFACT_INVALID');
}
function discard(response: Response) {
  // Never let broken or signal-ignoring provider streams delay the result.
  try { void response.body?.cancel().catch(() => {}); } catch { /* sanitized */ }
}
function withSignal<T>(pending: Promise<T>, signal: AbortSignal): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const abort = () => { signal.removeEventListener('abort', abort); reject(Error('interrupted')); };
    signal.addEventListener('abort', abort, { once: true });
    pending.then(value => { signal.removeEventListener('abort', abort); resolve(value); }, () => {
      signal.removeEventListener('abort', abort); reject(Error('transport'));
    });
    if (signal.aborted) abort();
  });
}
async function request(fetcher: typeof fetch, url: string, init: RequestInit, signal: AbortSignal) {
  if (signal.aborted) throw Error('interrupted');
  const pending = fetcher(url, init);
  void pending.then(response => { if (signal.aborted) discard(response); }, () => {});
  return withSignal(pending, signal);
}
function trustedResponse(response: Response, expectedUrl: string) {
  if (response.redirected) return false;
  if (!response.url) return true; // In-memory injected Responses have no URL.
  try {
    const url = new URL(response.url);
    return url.href === expectedUrl && !url.username && !url.password;
  } catch { return false; }
}
async function boundedJson(response: Response, signal: AbortSignal): Promise<unknown> {
  const length = response.headers.get('content-length');
  if (length !== null && (!/^\d+$/.test(length) || Number(length) > MAX_RESPONSE)) { discard(response); throw Error('bounded'); }
  if (!response.body) throw Error('empty');
  const reader = response.body.getReader(), chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      if (signal.aborted) throw Error('interrupted');
      const next = await withSignal(reader.read(), signal);
      if (signal.aborted) throw Error('interrupted');
      if (next.done) break;
      size += next.value.byteLength;
      if (size > MAX_RESPONSE) throw Error('bounded');
      chunks.push(next.value);
    }
    return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(Buffer.concat(chunks, size)));
  } finally {
    try { void reader.cancel().catch(() => {}); } catch { /* sanitized */ }
    try { reader.releaseLock(); } catch { /* pending read is being cancelled */ }
  }
}
function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw Error('receipt');
  return value as Record<string, unknown>;
}
function rateSeconds(response: Response): number | undefined {
  const raw = response.headers.get('retry-after');
  return raw !== null && /^\d{1,5}$/.test(raw) ? Math.min(86400, Number(raw)) : undefined;
}
function rejectionCode(status: number) {
  switch (status) {
    case 401: return 'EXPORT_GRANT_EXPIRED';
    case 403: return 'EXPORT_PERMISSION_DENIED';
    // Conservative unexpected-response handling, not proof of paid-tier rules.
    case 402: return 'EXPORT_ACCOUNT_ENTITLEMENT_REQUIRED';
    case 410: return 'EXPORT_API_VERSION_RETIRED';
    case 413: return 'EXPORT_IMPORT_BODY_TOO_LARGE';
    case 429: return 'EXPORT_RATE_LIMITED';
    default: return 'EXPORT_PROVIDER_REJECTED';
  }
}

export async function createAndInspectOmnisendTemplate(o: Options): Promise<OmnisendTemplateResult> {
  validateArtifact(o.artifact);
  if (typeof o.name !== 'string' || !o.name.trim() || o.name.length > 255 || /[\x00-\x1f\x7f-\x9f]/.test(o.name) || !wellFormed(o.name)) throw Error('EXPORT_NAME_INVALID');
  if (typeof o.accessToken !== 'string' || !/^[A-Za-z0-9._~+\/-]{1,4096}$/.test(o.accessToken)) throw Error('EXPORT_TOKEN_INVALID');
  if (typeof o.markSubmission !== 'function' || typeof o.persistRemoteId !== 'function' || (o.fetcher !== undefined && typeof o.fetcher !== 'function')) throw Error('EXPORT_CALLBACK_INVALID');
  if (o.signal !== undefined && !(o.signal instanceof AbortSignal)) throw Error('EXPORT_SIGNAL_INVALID');
  // Capture validated bytes and dependencies before any asynchronous callback.
  const name = o.name.trim(), body = JSON.stringify({ name, html: o.artifact.html }), accessToken = o.accessToken;
  if (Buffer.byteLength(body, 'utf8') > OMNISEND_IMPORT_BODY_LIMIT) throw Error('EXPORT_IMPORT_BODY_TOO_LARGE');
  const { signal: externalSignal, markSubmission, persistRemoteId } = o, fetcher = o.fetcher ?? fetch;
  if (externalSignal?.aborted) return result('needs_attention', 'EXPORT_CANCELLED');
  try { await markSubmission(); } catch { throw Error('EXPORT_SUBMISSION_MARKER_FAILED'); }
  if (externalSignal?.aborted) return result('outcome_unknown', 'EXPORT_INTERRUPTED_AFTER_MARKER');
  const budget = new AbortController(), timer = setTimeout(() => budget.abort(), 30000);
  const signal = AbortSignal.any([budget.signal, ...(externalSignal ? [externalSignal] : [])]);
  const headers = { authorization: 'Bearer ' + accessToken, 'Omnisend-Version': OMNISEND_API_REVISION, accept: 'application/json', 'content-type': 'application/json' };
  try {
    let response: Response;
    try { response = await request(fetcher, IMPORT_URL, { method: 'POST', headers, redirect: 'error', signal, body }, signal); }
    catch { return result('outcome_unknown', 'EXPORT_OUTCOME_UNKNOWN'); }
    if (!trustedResponse(response, IMPORT_URL)) { discard(response); return result('outcome_unknown', 'EXPORT_RESPONSE_UNTRUSTED'); }
    if (response.status !== 201) {
      discard(response);
      if (response.status >= 500 || response.status === 408 || response.status < 400) return result('outcome_unknown', 'EXPORT_OUTCOME_UNKNOWN');
      return result('needs_attention', rejectionCode(response.status), null, response.status === 429 ? rateSeconds(response) : undefined);
    }
    let id: string;
    try {
      const receipt = object(await boundedJson(response, signal));
      if (typeof receipt.id !== 'string' || !REMOTE_ID.test(receipt.id)) throw Error('receipt');
      id = receipt.id;
      // Optional attributes cannot discard this independently trusted identity.
    } catch { return result('outcome_unknown', 'EXPORT_RESPONSE_UNTRUSTED'); }
    try { await persistRemoteId(id); }
    catch { return result('needs_attention', 'EXPORT_RECEIPT_PERSISTENCE_FAILED', id); }
    // Every failure from this point retains ID; there is never a POST retry.
    try {
      const url = RESOURCE_PREFIX + id;
      const read = await request(fetcher, url, { method: 'GET', headers, redirect: 'error', signal }, signal);
      if (read.status !== 200 || !trustedResponse(read, url)) { discard(read); return result('needs_attention', 'EXPORT_READBACK_UNAVAILABLE', id); }
      const metadata = object(await boundedJson(read, signal));
      if (metadata.id !== id || metadata.name !== name) return result('needs_attention', 'EXPORT_READBACK_MISMATCH', id);
      // GET identity/name is only metadata. Unsolicited HTML/links are ignored:
      // import transforms content and no management handoff is established.
      return result('needs_attention', 'EXPORT_IMPORT_CONTENT_UNVERIFIED', id);
    } catch { return result('needs_attention', 'EXPORT_READBACK_UNAVAILABLE', id); }
  } finally { clearTimeout(timer); }
}
