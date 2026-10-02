// Unmounted server transport only. A future verified OAuth connection must
// supply the region and qualify account/client admission before calling this.
// Callbacks require durable caller implementation; they are not a product queue.
import { createHash } from 'node:crypto';
import type { MailchimpArtifact } from '../domain/mailchimp-export';
import { MAILCHIMP_API_REVISION, MAILCHIMP_MAPPING_VERSION } from '../domain/mailchimp-export-contracts';

const MAX_CONTENT = 2 * 1024 * 1024;
const MAX_RESPONSE = 5 * 1024 * 1024 - 1;
const SHA256 = /^[a-f0-9]{64}$/;

export type MailchimpTemplateResult = {
  state: 'needs_attention' | 'outcome_unknown'; code: string;
  remote_id: string | null; resource_url: string | null; destination_url: null;
  content_verified: false; retry_after?: number;
};
type Options = {
  artifact: MailchimpArtifact; name: string; accessToken: string; serverPrefix: string;
  signal?: AbortSignal; markSubmission: () => Promise<void>;
  persistRemoteId: (id: string) => Promise<void>; fetcher?: typeof fetch;
};

function result(origin: string, state: MailchimpTemplateResult['state'], code: string, id: string | null = null, retry_after?: number): MailchimpTemplateResult {
  return { state, code, remote_id: id, resource_url: id ? origin + '/3.0/templates/' + id : null, destination_url: null, content_verified: false, ...(retry_after === undefined ? {} : { retry_after }) };
}
const sha = (value: string) => createHash('sha256').update(value, 'utf8').digest('hex');
function validateArtifact(a: MailchimpArtifact) {
  if (!a || a.destination !== 'mailchimp' || a.mapping_version !== MAILCHIMP_MAPPING_VERSION || a.api_revision !== MAILCHIMP_API_REVISION || a.remote_export_enabled !== false ||
    typeof a.html !== 'string' || typeof a.text !== 'string' || Buffer.byteLength(a.html) > MAX_CONTENT || Buffer.byteLength(a.text) > MAX_CONTENT ||
    typeof a.source_artifact_hash !== 'string' || !SHA256.test(a.source_artifact_hash) ||
    a.html_sha256 !== sha(a.html) || a.text_sha256 !== sha(a.text) ||
    a.destination_hash !== sha(JSON.stringify([a.mapping_version, a.api_revision, a.source_artifact_hash, a.html, a.text]))) {
    throw Error('EXPORT_ARTIFACT_INVALID');
  }
}
function discard(response: Response) {
  // A broken or stalled provider stream must not prevent a bounded result.
  try { void response.body?.cancel().catch(() => {}); } catch { /* sanitized */ }
}
function withSignal<T>(pending: Promise<T>, signal: AbortSignal): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const abort = () => reject(Error('interrupted'));
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
  // An injected transport may ignore its signal. Dispose a late response too.
  void pending.then(response => { if (signal.aborted) discard(response); }, () => {});
  return withSignal(pending, signal);
}
function trustedOrigin(response: Response, origin: string) {
  if (response.redirected) return false;
  if (!response.url) return true; // Injected Response objects have no URL.
  try { const url = new URL(response.url); return url.origin === origin && !url.username && !url.password; } catch { return false; }
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
      if (next.done) break;
      size += next.value.byteLength;
      if (size > MAX_RESPONSE) throw Error('bounded');
      chunks.push(next.value);
    }
    return JSON.parse(Buffer.concat(chunks, size).toString('utf8'));
  } finally {
    try { void reader.cancel().catch(() => {}); } catch { /* sanitized */ }
    try { reader.releaseLock(); } catch { /* pending read is being cancelled */ }
  }
}
function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw Error('receipt');
  return value as Record<string, unknown>;
}
function numericId(value: unknown): string {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value <= 0) throw Error('receipt');
  return String(value);
}
function validateSelf(value: Record<string, unknown>, origin: string, id: string, partialCreate = false) {
  if (value._links === undefined) return;
  if (!Array.isArray(value._links) && !partialCreate) throw Error('binding');
  const links = Array.isArray(value._links) ? value._links : [value._links];
  const resource = origin + '/3.0/templates/' + id;
  for (const entry of links) {
    // Links are never followed. Only a supplied self link binds this receipt.
    if (entry && typeof entry === 'object' && 'rel' in entry && entry.rel === 'self') {
      const link = object(entry);
      if ((link.href !== resource && link.href !== resource + '/') || (link.method !== undefined && link.method !== 'GET')) throw Error('binding');
    }
  }
}
function rateSeconds(response: Response): number | undefined {
  const raw = response.headers.get('retry-after');
  return raw !== null && /^\d{1,5}$/.test(raw) ? Math.min(86400, Number(raw)) : undefined;
}

export async function createAndInspectMailchimpTemplate(o: Options): Promise<MailchimpTemplateResult> {
  validateArtifact(o.artifact);
  if (typeof o.serverPrefix !== 'string' || !/^us[1-9][0-9]{0,2}$/.test(o.serverPrefix)) throw Error('EXPORT_REGION_INVALID');
  if (typeof o.name !== 'string' || !o.name.trim() || o.name.length > 200 || /[\x00-\x1f\x7f]/.test(o.name)) throw Error('EXPORT_NAME_INVALID');
  if (typeof o.accessToken !== 'string' || !/^[A-Za-z0-9._~+\/-]{1,4096}$/.test(o.accessToken)) throw Error('EXPORT_TOKEN_INVALID');
  const origin = 'https://' + o.serverPrefix + '.api.mailchimp.com', name = o.name.trim();
  // Keep the validated immutable bytes through asynchronous caller callbacks.
  const html = o.artifact.html, accessToken = o.accessToken;
  if (o.signal?.aborted) return result(origin, 'needs_attention', 'EXPORT_CANCELLED');
  // Failure here means no submission occurred. Do not expose caller exception
  // details or suggest the durable marker was successfully committed.
  try { await o.markSubmission(); } catch { throw Error('EXPORT_SUBMISSION_MARKER_FAILED'); }
  if (o.signal?.aborted) return result(origin, 'outcome_unknown', 'EXPORT_INTERRUPTED_AFTER_MARKER');
  const budget = new AbortController(), timer = setTimeout(() => budget.abort(), 30000);
  const signal = AbortSignal.any([budget.signal, ...(o.signal ? [o.signal] : [])]);
  const fetcher = o.fetcher ?? fetch;
  const headers = { authorization: 'Bearer ' + accessToken, accept: 'application/json', 'content-type': 'application/json' };
  try {
    let response: Response;
    try {
      response = await request(fetcher, origin + '/3.0/templates', { method: 'POST', headers, redirect: 'error', signal, body: JSON.stringify({ name, html }) }, signal);
    } catch { return result(origin, 'outcome_unknown', 'EXPORT_OUTCOME_UNKNOWN'); }
    if (!trustedOrigin(response, origin)) { discard(response); return result(origin, 'outcome_unknown', 'EXPORT_RESPONSE_UNTRUSTED'); }
    // 200 is the documented create acknowledgement; do not infer acceptance
    // from other success statuses, provider errors, or a network interruption.
    if (response.status !== 200) {
      discard(response);
      if (response.status >= 500 || response.status === 408 || response.status < 400) return result(origin, 'outcome_unknown', 'EXPORT_OUTCOME_UNKNOWN');
      const code = response.status === 401 ? 'EXPORT_GRANT_EXPIRED' : response.status === 403 ? 'EXPORT_PERMISSION_DENIED' : response.status === 429 ? 'EXPORT_RATE_LIMITED' : 'EXPORT_PROVIDER_REJECTED';
      return result(origin, 'needs_attention', code, null, response.status === 429 ? rateSeconds(response) : undefined);
    }
    let id: string;
    try {
      const receipt = object(await boundedJson(response, signal));
      id = numericId(receipt.id); validateSelf(receipt, origin, id, true);
      // Optional create metadata does not determine independently trusted ID.
    } catch { return result(origin, 'outcome_unknown', 'EXPORT_RESPONSE_UNTRUSTED'); }
    try { await o.persistRemoteId(id); } catch { return result(origin, 'needs_attention', 'EXPORT_RECEIPT_PERSISTENCE_FAILED', id); }
    // Once identity is known, every failure retains it. Never repeat POST.
    try {
      const read = await request(fetcher, origin + '/3.0/templates/' + id, { method: 'GET', headers, redirect: 'error', signal }, signal);
      if (read.status !== 200 || !trustedOrigin(read, origin)) { discard(read); return result(origin, 'needs_attention', 'EXPORT_READBACK_UNAVAILABLE', id); }
      const metadata = object(await boundedJson(read, signal));
      validateSelf(metadata, origin, id);
      if (metadata.id !== Number(id) || metadata.name !== name || metadata.type !== 'user' || metadata.content_type !== 'html' || metadata.active !== true || metadata.drag_and_drop !== false) return result(origin, 'needs_attention', 'EXPORT_READBACK_MISMATCH', id);
      // Schema 3.0.91 GET returns metadata, not HTML. share_url is sharing, not
      // a management link. Neither can establish content or handoff fidelity.
      return result(origin, 'needs_attention', 'EXPORT_TEMPLATE_CONTENT_UNVERIFIED', id);
    } catch { return result(origin, 'needs_attention', 'EXPORT_READBACK_UNAVAILABLE', id); }
  } finally { clearTimeout(timer); }
}
