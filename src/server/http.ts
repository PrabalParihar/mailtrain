import { fail } from './errors';
import {InvitationRequestId} from '../domain/invitation-requests';
export function requestPath(request: Request) {
  try {
    return new URL(request.url).pathname
      .split('/')
      .slice(2)
      .map((part) => decodeURIComponent(part));
  } catch {
    fail(400, 'PATH_INVALID', 'The request path is invalid.');
  }
}
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function assertRouteMethod(path: string[], method: string) {
  const [root, id, command] = path;
  let methods: string[] = [];
  if (root === 'assets') {
    if (path.length === 1) methods = ['GET'];
    else if (path.length === 2 && id === 'uploads') methods = ['POST'];
    else if (path.length === 2 && uuid.test(id)) methods = ['GET'];
    else if (path.length === 3 && uuid.test(id) && ['fallback', 'remove', 'publish'].includes(command)) methods = ['POST'];
    else if (path.length === 4 && id === 'uploads' && uuid.test(command) && path[3] === 'content') methods = ['PUT'];
    else if (path.length === 5 && uuid.test(id) && command === 'variants' && uuid.test(path[3]) && path[4] === 'content') methods = ['GET'];
    if (!methods.length) fail(404, 'RESOURCE_NOT_FOUND', 'Route not found.');
    if (!methods.includes(method)) fail(405, 'METHOD_NOT_ALLOWED', 'This method is not allowed for this route.');
    return;
  }
  if (path.length > 3) fail(404, 'RESOURCE_NOT_FOUND', 'Route not found.');
  if (['health', 'integrations', 'usage', 'audit'].includes(root) && path.length === 1)
    methods = ['GET'];
  if(root==='revision-comparisons'&&path.length===1)methods=['GET'];
  if (root === 'local-session' && path.length === 1) methods = ['POST'];
  if (root === 'session' && path.length === 1) methods = ['DELETE'];
  if (root === 'api-keys') {
    if (!id) methods = ['GET', 'POST'];
    else if (uuid.test(id) && ['rotate', 'revoke'].includes(command)) methods = ['POST'];
  }
  if (root === 'events' && (!id || (uuid.test(id) && !command))) methods = ['GET'];
  if(root==='sender-identities'){
    if(!id)methods=['GET','POST'];
    else if(uuid.test(id)&&!command)methods=['GET'];
    else if(uuid.test(id)&&['versions','dns-checks'].includes(command))methods=['GET','POST'];
  }
  if (root === 'webhook-endpoints') {
    if (!id) methods = ['GET','POST'];
    else if (uuid.test(id) && !command) methods = ['GET'];
    else if (uuid.test(id) && ['rotate','pause'].includes(command)) methods = ['POST'];
  }
  if(root==='webhook-deliveries'){if(!id)methods=['GET'];else if(uuid.test(id)&&(!command||command==='attempts'))methods=['GET'];else if(uuid.test(id)&&command==='replay')methods=['POST'];}
  if (root === 'dispatch-controls') {
    if (!id) methods = ['GET'];
    else if (id === 'workspace' && !command) methods = ['POST'];
  }
  if(root==='workspace-preferences'){if(!id)methods=['GET'];else if(id==='timezone'&&!command)methods=['POST'];}
  if (root === 'workspaces' && path.length === 1) methods = ['GET', 'POST'];
  if(root==='invitation-requests'){if(!id)methods=['GET','POST'];else if(id==='readiness'&&!command)methods=['GET'];else if(InvitationRequestId.safeParse(id).success&&(!command||command==='history'))methods=['GET'];else if(InvitationRequestId.safeParse(id).success&&['update','withdraw','reopen','send','accept'].includes(command))methods=['POST'];}
  if(root==='membership-changes'&&!id)methods=['GET'];
  if(root==='memberships'){if(!id||id==='summary'&&!command)methods=['GET'];else if(uuid.test(id)&&['role','remove','transfer-owner'].includes(command))methods=['POST'];}
  if (root === 'brands') {
    if (!id) methods = ['GET', 'POST'];
    else if (id === 'from-url' && !command) methods = ['POST'];
    else if (id === 'current' && !command) methods = ['GET'];
    else if(uuid.test(id)&&command==='memory-preview')methods=['POST'];
  }
  if(root==='brand-sources'){if(!id)methods=['GET','POST'];else if(uuid.test(id)&&!command)methods=['GET'];else if(uuid.test(id)&&command==='remove')methods=['POST'];}
  if (root === 'emails') {
    if (!id) methods = ['GET', 'POST'];
    else if (id === 'generate' && !command) methods = ['POST'];
    else if (uuid.test(id)) {
      if (!command) methods = ['GET'];
      else if (['derivatives','locale-source'].includes(command)) methods = ['GET'];
      else if (command==='locale-reviews') methods = ['GET','POST'];
      else if (command === 'draft') methods = ['PATCH'];
      else if (['revisions', 'restore', 'preview', 'import-html','source-import','source-fork','conversion-proposal','convert-to-blocks'].includes(command))
        methods = ['POST'];
    }
  }
  if (root === 'email-revisions') {
    if (!id) methods = ['GET'];
    else if (uuid.test(id)) {
      if (['download','destination-review','destination-artifact'].includes(command)) methods = ['GET'];
      else if (['preflight', 'export', 'remix', 'localize', 'hubspot-review', 'hubspot-artifact'].includes(command)) methods = ['POST'];
    }
  }
  if (root === 'templates') {
    if (!id) methods = ['GET', 'POST'];
    else if (uuid.test(id) && !command) methods = ['GET'];
    else if (uuid.test(id) && ['archive', 'remix'].includes(command)) methods = ['POST'];
  }
  if(root==='operations'&&!id)methods=['GET'];
  if(root==='operations'&&id==='report'&&!command)methods=['GET'];
  if (root === 'operations' && id && uuid.test(id)) {
    if (!command||command==='attempts') methods = ['GET'];
    else if (command === 'cancel') methods = ['POST'];
  }
  if (root === 'contacts') {
    if (!id) methods = ['GET'];
    else if (uuid.test(id) && command === 'suppress') methods = ['POST'];
    else if (uuid.test(id) && command === 'profile') methods = ['PATCH'];
  }
  if (root === 'audience-schema' && !id) methods = ['GET'];
  if (['lists', 'tags', 'contact-fields'].includes(root) && !id) methods = ['POST'];
  if (root === 'segments') {
    if (!id) methods = ['GET', 'POST'];
    else if (uuid.test(id)) {
      if (!command) methods = ['GET'];
      else if (['versions', 'preview', 'snapshots'].includes(command)) methods = ['POST'];
    }
  }
  if (root === 'audience-snapshots' && (!id || (uuid.test(id) && (!command || command === 'metadata')))) methods = ['GET'];
  if (root === 'contact-imports') {
    if (!id || (id === 'inspect' && !command)) methods = ['POST'];
    else if (uuid.test(id) && command === 'confirm') methods = ['POST'];
    else if (uuid.test(id) && command === 'errors') methods = ['GET'];
  }
  if (root === 'submission-ledgers' && uuid.test(id ?? '')) {
    if (!command || command === 'recipients') methods = ['GET'];
    else if (command === 'cancel') methods = ['POST'];
  }
  if (root === 'deliveries' && uuid.test(id ?? '') && (!command || ['history', 'attempts'].includes(command))) methods = ['GET'];
  if(root==='recipient-assessments'&&uuid.test(id??'')){if(!command||command==='observations')methods=['GET'];else if(command==='cancel')methods=['POST'];}
  if (root === 'campaigns') {
    if (!id) methods = ['GET', 'POST'];
    else if(id==='calendar'&&!command)methods=['GET'];
    else if(uuid.test(id)&&['recipient-assessments','submission-ledgers'].includes(command))methods=['GET','POST'];
    else if(uuid.test(id)&&(!command||command==='configurations'))methods=['GET'];
    else if (
      uuid.test(id) &&
      ['configuration', 'submit-review', 'approve', 'send', 'schedule', 'pause', 'resume', 'cancel'].includes(
        command,
      )
    )
      methods = ['POST'];
  }
  if (!methods.length) fail(404, 'RESOURCE_NOT_FOUND', 'Route not found.');
  if (!methods.includes(method))
    fail(405, 'METHOD_NOT_ALLOWED', 'This method is not allowed for this route.');
}
export const STRICT_JSON_TIMEOUT_MS = 30000;
export type JsonReadOptions = { strict?: boolean; timeoutMs?: number };
export async function readJson(
  request: Request,
  maxBytes = 2 * 1024 * 1024,
  options: JsonReadOptions = {},
): Promise<Record<string, unknown>> {
  const strict = options.strict === true;
  if (!strict && ['GET', 'HEAD', 'DELETE'].includes(request.method)) return {};
  const timeoutMs = options.timeoutMs ?? STRICT_JSON_TIMEOUT_MS;
  if (strict && (!Number.isFinite(timeoutMs) || timeoutMs <= 0))
    throw new Error('Use a positive finite JSON timeout.');
  const declared = request.headers.get('content-length');
  if (strict) {
    if (request.headers.has('content-encoding'))
      fail(415, 'JSON_ENCODING_UNSUPPORTED', 'Compressed JSON requests are not supported.');
    if (!/^application\/json(?:\s*;\s*charset\s*=\s*(?:utf-8|"utf-8"))?\s*$/i.test(request.headers.get('content-type') ?? ''))
      fail(415, 'JSON_CONTENT_TYPE_UNSUPPORTED', 'Use application/json with UTF-8.');
    if (declared !== null && (!/^\d+$/.test(declared) || !Number.isSafeInteger(Number(declared))))
      fail(400, 'JSON_LENGTH_INVALID', 'Use a valid JSON byte length.');
  }
  const length = Number(declared ?? 0);
  const limitMessage = maxBytes === 2 * 1024 * 1024 ? 'Request exceeds 2 MiB.' : 'Request exceeds ' + maxBytes + ' bytes.';
  if (length > maxBytes) fail(413, 'PAYLOAD_TOO_LARGE', limitMessage);
  const reader = request.body?.getReader();
  if (!reader) {
    if (strict) fail(400, 'JSON_BODY_REQUIRED', 'Provide a JSON object body.');
    return {};
  }
  let bytes = 0;
  const chunks: Uint8Array[] = [];
  let interrupted: 'abort' | 'timeout' | undefined;
  let wake: (() => void) | undefined;
  const interruption = new Promise<void>((resolve) => { wake = resolve; });
  const cancel = () => { void reader.cancel().catch(() => {}); };
  const abort = () => { interrupted = 'abort'; cancel(); wake?.(); };
  const checkInterrupted = () => {
    if (request.signal.aborted || interrupted === 'abort')
      fail(499, 'EXPORT_CANCELLED', 'Destination preparation interrupted.');
    if (interrupted === 'timeout')
      fail(408, 'JSON_TRANSFER_TIMEOUT', 'JSON transfer exceeded its time limit.');
  };
  const timer = strict ? setTimeout(() => { interrupted = 'timeout'; cancel(); wake?.(); }, timeoutMs) : undefined;
  if (strict) request.signal.addEventListener('abort', abort, { once: true });
  try {
    if (strict && request.signal.aborted) abort();
    for (;;) {
      if (strict) checkInterrupted();
      let part: ReadableStreamReadResult<Uint8Array> | void;
      try {
        part = strict ? await Promise.race([reader.read(), interruption]) : await reader.read();
      } catch (error) {
        if (!strict) throw error;
        checkInterrupted();
        fail(400, 'MALFORMED_JSON', 'Use valid JSON.');
      }
      if (strict) checkInterrupted();
      if (!part || part.done) break;
      bytes += part.value.byteLength;
      if (bytes > maxBytes) {
        if (strict) cancel(); else await reader.cancel();
        fail(413, 'PAYLOAD_TOO_LARGE', limitMessage);
      }
      chunks.push(part.value);
    }
    if (strict && declared !== null && length !== bytes)
      fail(400, 'JSON_LENGTH_MISMATCH', 'Declared and actual JSON body sizes differ.');
    if (strict && bytes === 0) fail(400, 'JSON_BODY_REQUIRED', 'Provide a JSON object body.');
  } catch (error) {
    if (strict) cancel();
    throw error;
  } finally {
    if (timer !== undefined) clearTimeout(timer);
    if (strict) request.signal.removeEventListener('abort', abort);
    reader.releaseLock();
  }
  let result: unknown;
  try {
    const raw = strict ? new TextDecoder('utf-8', { fatal: true }).decode(Buffer.concat(chunks, bytes)) : Buffer.concat(chunks).toString('utf8');
    result = raw ? JSON.parse(raw) : {};
  } catch {
    fail(400, 'MALFORMED_JSON', 'Use valid JSON.');
  }
  if (!result || Array.isArray(result) || typeof result !== 'object')
    fail(400, 'MALFORMED_JSON', 'Use a JSON object.');
  return result as Record<string, unknown>;
}
