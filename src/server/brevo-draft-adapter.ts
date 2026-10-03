// Unmounted API-key contract only. Future admission must supply verified
// account/sender authority and durable callbacks; this is not SaaS auth approval.
import {createHash} from 'node:crypto';
import {z} from 'zod';
import type {BrevoArtifact} from '../domain/brevo-export';
import {BREVO_API_REVISION, BREVO_HTML_LIMIT, BREVO_MAPPING_VERSION} from '../domain/brevo-export-contracts';

const CREATE_URL = 'https://api.brevo.com/v3/emailCampaigns';
const RESOURCE_PREFIX = CREATE_URL + '/';
const MAX_RESPONSE = 5 * 1024 * 1024 - 1;
const SHA256 = /^[a-f0-9]{64}$/;
const CONTROLS = /[\x00-\x1f\x7f-\x9f]/;
export type BrevoDraftResult = {
 state: 'needs_attention' | 'outcome_unknown'; code: string;
 remote_id: string | null; resource_url: string | null; destination_url: null;
 content_verified: boolean; native_fidelity_verified: false;
 readback_html_sha256: string | null; remote_modified_at: string | null; retry_after?: number;
};
type Options = {
 artifact: BrevoArtifact; name: string; senderId: number; apiKey: string; signal?: AbortSignal;
 markSubmission: () => Promise<void>; persistRemoteId: (id: string) => Promise<void>; fetcher?: typeof fetch;
};
function result(state: BrevoDraftResult['state'], code: string, id: string | null = null, retry_after?: number): BrevoDraftResult {
 return {state, code, remote_id: id, resource_url: id === null ? null : RESOURCE_PREFIX + id, destination_url: null, content_verified: false, native_fidelity_verified: false, readback_html_sha256: null, remote_modified_at: null, ...(retry_after === undefined ? {} : {retry_after})};
}
const sha = (value: string) => createHash('sha256').update(value, 'utf8').digest('hex');
function wellFormed(value: string) {
 for(let i = 0; i < value.length; i++) {
  const unit = value.charCodeAt(i);
  if(unit >= 0xd800 && unit <= 0xdbff) {const next = value.charCodeAt(++i); if(!(next >= 0xdc00 && next <= 0xdfff)) return false;}
  else if(unit >= 0xdc00 && unit <= 0xdfff) return false;
 }
 return true;
}
const Artifact = z.object({
 destination: z.literal('brevo'), mapping_version: z.literal(BREVO_MAPPING_VERSION), api_revision: z.literal(BREVO_API_REVISION), revision_id: z.uuid(),
 source_artifact_hash: z.string().regex(SHA256), destination_hash: z.string().regex(SHA256), html_sha256: z.string().regex(SHA256), text_sha256: z.string().regex(SHA256),
 subject: z.string(), html: z.string(), text: z.string(), remote_export_enabled: z.literal(false), transformations: z.array(z.string()).max(10),
}).strict();
function validateArtifact(value: BrevoArtifact) {
 const parsed = Artifact.safeParse(value);
 if(!parsed.success) throw Error('EXPORT_ARTIFACT_INVALID');
 const a = parsed.data;
 if(!a.subject.trim() || a.subject.length > 200 || CONTROLS.test(a.subject) || !wellFormed(a.subject) ||
  a.html.length <= 10 || !wellFormed(a.html) || !wellFormed(a.text) || Buffer.byteLength(a.html, 'utf8') >= BREVO_HTML_LIMIT || Buffer.byteLength(a.text, 'utf8') >= BREVO_HTML_LIMIT ||
  a.html_sha256 !== sha(a.html) || a.text_sha256 !== sha(a.text) || a.destination_hash !== sha(JSON.stringify([a.mapping_version, a.api_revision, a.source_artifact_hash, a.subject, a.html, a.text]))) throw Error('EXPORT_ARTIFACT_INVALID');
 return a;
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
 switch(status) {
  case 401: return 'EXPORT_GRANT_EXPIRED';
  case 403: return 'EXPORT_PERMISSION_DENIED';
  case 402: return 'EXPORT_ACCOUNT_ENTITLEMENT_REQUIRED';
  case 410: return 'EXPORT_API_VERSION_RETIRED';
  case 413: return 'EXPORT_IMPORT_BODY_TOO_LARGE';
  case 429: return 'EXPORT_RATE_LIMITED';
  default: return 'EXPORT_PROVIDER_REJECTED';
 }
}
// Only pinned documented400 codes are affirmative rejections. A duplicate or
// already-processing/sent response may describe a previously submitted draft.
const documented400 = new Set([
 'invalid_parameter', 'missing_parameter', 'out_of_range', 'document_not_found', 'duplicate_parameter', 'method_not_allowed', 'not_acceptable', 'bad_request', 'unprocessable_entity',
 'Domain does not exist', 'Contact email not found', 'Attribute not found', 'Category id not found', 'Invalid parameters passed', 'Record(s) for identifier not found', 'Returned when query params are invalid', 'Returned when invalid data posted', 'Feed not found', 'Campaign ID not found', 'DMARC policy requires domain authentication', 'DNS records not properly configured', 'Invalid OTP code provided', 'OTP code has expired', 'Domain already exists in your account', 'The sum of all IP weights must equal 100',
]);
function rejection400(value: unknown): BrevoDraftResult {
 const body = object(value);
 if(typeof body.code !== 'string' || typeof body.message !== 'string' || ['duplicate_request', 'Request already processed', 'campaign_processing', 'campaign_sent'].includes(body.code) || /request already processed/i.test(body.message)) return result('outcome_unknown', 'EXPORT_OUTCOME_UNKNOWN');
 if(['unauthorized', 'api-key not found', 'Authentication failed'].includes(body.code)) return result('needs_attention', 'EXPORT_GRANT_EXPIRED');
 if(body.code === 'permission_denied') return result('needs_attention', 'EXPORT_PERMISSION_DENIED');
 if(['not_enough_credits', 'Insufficient credits', 'account_under_validation'].includes(body.code)) return result('needs_attention', 'EXPORT_ACCOUNT_ENTITLEMENT_REQUIRED');
 return documented400.has(body.code) ? result('needs_attention', 'EXPORT_PROVIDER_REJECTED') : result('outcome_unknown', 'EXPORT_OUTCOME_UNKNOWN');
}
function emptyRecipients(value: unknown) {
 const recipients = object(value), keys = Object.keys(recipients);
 return keys.includes('lists') && keys.includes('exclusionLists') && keys.every(key => ['lists', 'exclusionLists', 'segments', 'excludedSegments'].includes(key) && Array.isArray(recipients[key]) && (recipients[key] as unknown[]).length === 0);
}
function validModifiedAt(value: unknown): value is string {
 if(typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) return false;
 const date = new Date(value);
 return Number.isFinite(date.getTime()) && date.toISOString() === value;
}
export async function createAndInspectBrevoDraft(o: Options): Promise<BrevoDraftResult> {
 const a = validateArtifact(o.artifact);
 if(typeof o.name !== 'string' || !o.name.trim() || o.name.trim().length > 255 || CONTROLS.test(o.name) || !wellFormed(o.name)) throw Error('EXPORT_NAME_INVALID');
 if(!Number.isSafeInteger(o.senderId) || o.senderId <= 0) throw Error('EXPORT_SENDER_INVALID');
 if(typeof o.apiKey !== 'string' || !/^[A-Za-z0-9._~+\/-]{1,4096}$/.test(o.apiKey)) throw Error('EXPORT_TOKEN_INVALID');
 if(typeof o.markSubmission !== 'function' || typeof o.persistRemoteId !== 'function' || (o.fetcher !== undefined && typeof o.fetcher !== 'function')) throw Error('EXPORT_CALLBACK_INVALID');
 if(o.signal !== undefined && !(o.signal instanceof AbortSignal)) throw Error('EXPORT_SIGNAL_INVALID');
 // Capture the parsed artifact and all dependencies before asynchronous marking.
 const name = o.name.trim(), senderId = o.senderId, apiKey = o.apiKey;
 const body = JSON.stringify({name, sender: {id: senderId}, subject: a.subject, htmlContent: a.html});
 const {signal: externalSignal, markSubmission, persistRemoteId} = o, fetcher = o.fetcher ?? fetch;
 if(externalSignal?.aborted) return result('needs_attention', 'EXPORT_CANCELLED');
 try {await markSubmission();} catch {throw Error('EXPORT_SUBMISSION_MARKER_FAILED');}
 if(externalSignal?.aborted) return result('outcome_unknown', 'EXPORT_INTERRUPTED_AFTER_MARKER');
 const budget = new AbortController(), timer = setTimeout(() => budget.abort(), 30000);
 const signal = AbortSignal.any([budget.signal, ...(externalSignal ? [externalSignal] : [])]);
 const headers = {'api-key': apiKey, accept: 'application/json', 'content-type': 'application/json'};
 try {
  let response: Response;
  try {response = await request(fetcher, CREATE_URL, {method: 'POST', headers: {...headers}, redirect: 'error', signal, body}, signal);}
  catch {return result('outcome_unknown', 'EXPORT_OUTCOME_UNKNOWN');}
  if(!trustedResponse(response, CREATE_URL)) {discard(response); return result('outcome_unknown', 'EXPORT_RESPONSE_UNTRUSTED');}
  if(response.status !== 201) {
   if(response.status === 400) {try {return rejection400(await boundedJson(response, signal));} catch {return result('outcome_unknown', 'EXPORT_OUTCOME_UNKNOWN');}}
   discard(response);
   if(response.status >= 500 || response.status === 408 || response.status < 400) return result('outcome_unknown', 'EXPORT_OUTCOME_UNKNOWN');
   return result('needs_attention', rejectionCode(response.status), null, response.status === 429 ? rateSeconds(response) : undefined);
  }
  let id: string;
  try {const receipt = object(await boundedJson(response, signal)); if(typeof receipt.id !== 'number' || !Number.isSafeInteger(receipt.id) || receipt.id <= 0) throw Error('receipt'); id = String(receipt.id);}
  catch {return result('outcome_unknown', 'EXPORT_RESPONSE_UNTRUSTED');}
  // A trusted ID is preserved despite malformed optional create attributes.
  try {await persistRemoteId(id);} catch {return result('needs_attention', 'EXPORT_RECEIPT_PERSISTENCE_FAILED', id);}
  try {
   const url = RESOURCE_PREFIX + id, read = await request(fetcher, url, {method: 'GET', headers: {...headers}, redirect: 'error', signal}, signal);
   if(read.status !== 200 || !trustedResponse(read, url)) {discard(read); return result('needs_attention', 'EXPORT_READBACK_UNAVAILABLE', id);}
   const m = object(await boundedJson(read, signal));
   if(m.id !== Number(id) || m.name !== name || m.status !== 'draft' || m.type !== 'classic' || m.subject !== a.subject || object(m.sender).id !== senderId || m.htmlContent !== a.html || !validModifiedAt(m.modifiedAt) || m.testSent !== false || !emptyRecipients(m.recipients) ||
    ('scheduledAt' in m && m.scheduledAt !== '') || ('abTesting' in m && m.abTesting !== false) || ('sendAtBestTime' in m && m.sendAtBestTime !== false)) return result('needs_attention', 'EXPORT_READBACK_MISMATCH', id);
   // HTML identity verifies bytes only. Neither native fidelity nor a management
   // destination follows from a draft receipt, API resource URL or shareLink.
   return {...result('needs_attention', 'EXPORT_MANAGEMENT_LINK_UNVERIFIED', id), content_verified: true, readback_html_sha256: sha(m.htmlContent as string), remote_modified_at: m.modifiedAt};
  } catch {return result('needs_attention', 'EXPORT_READBACK_UNAVAILABLE', id);}
 } finally {clearTimeout(timer);}
}
