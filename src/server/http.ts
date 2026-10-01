import { fail } from './errors';
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
  if (path.length > 3) fail(404, 'RESOURCE_NOT_FOUND', 'Route not found.');
  if (['health', 'integrations', 'usage', 'audit'].includes(root) && path.length === 1)
    methods = ['GET'];
  if (root === 'local-session' && path.length === 1) methods = ['POST'];
  if (root === 'session' && path.length === 1) methods = ['DELETE'];
  if (root === 'api-keys') {
    if (!id) methods = ['GET', 'POST'];
    else if (uuid.test(id) && ['rotate', 'revoke'].includes(command)) methods = ['POST'];
  }
  if (root === 'events' && (!id || (uuid.test(id) && !command))) methods = ['GET'];
  if (root === 'dispatch-controls') {
    if (!id) methods = ['GET'];
    else if (id === 'workspace' && !command) methods = ['POST'];
  }
  if (root === 'workspaces' && path.length === 1) methods = ['GET', 'POST'];
  if (root === 'brands') {
    if (!id) methods = ['GET', 'POST'];
    else if (id === 'from-url' && !command) methods = ['POST'];
    else if (id === 'current' && !command) methods = ['GET'];
  }
  if (root === 'emails') {
    if (!id) methods = ['GET', 'POST'];
    else if (id === 'generate' && !command) methods = ['POST'];
    else if (uuid.test(id)) {
      if (!command) methods = ['GET'];
      else if (command === 'derivatives') methods = ['GET'];
      else if (command === 'draft') methods = ['PATCH'];
      else if (['revisions', 'restore', 'preview', 'import-html'].includes(command))
        methods = ['POST'];
    }
  }
  if (root === 'email-revisions') {
    if (!id) methods = ['GET'];
    else if (uuid.test(id)) {
      if (command === 'download') methods = ['GET'];
      else if (['preflight', 'export', 'remix', 'localize'].includes(command)) methods = ['POST'];
    }
  }
  if (root === 'operations' && id && uuid.test(id)) {
    if (!command) methods = ['GET'];
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
  if (root === 'audience-snapshots' && id && uuid.test(id) && !command) methods = ['GET'];
  if (root === 'contact-imports') {
    if (!id || (id === 'inspect' && !command)) methods = ['POST'];
    else if (uuid.test(id) && command === 'confirm') methods = ['POST'];
    else if (uuid.test(id) && command === 'errors') methods = ['GET'];
  }
  if (root === 'campaigns') {
    if (!id) methods = ['GET', 'POST'];
    else if (
      uuid.test(id) &&
      ['submit-review', 'approve', 'send', 'schedule', 'pause', 'resume', 'cancel'].includes(
        command,
      )
    )
      methods = ['POST'];
  }
  if (!methods.length) fail(404, 'RESOURCE_NOT_FOUND', 'Route not found.');
  if (!methods.includes(method))
    fail(405, 'METHOD_NOT_ALLOWED', 'This method is not allowed for this route.');
}
export async function readJson(
  request: Request,
  maxBytes = 2 * 1024 * 1024,
): Promise<Record<string, unknown>> {
  if (['GET', 'HEAD', 'DELETE'].includes(request.method)) return {};
  const length = Number(request.headers.get('content-length') ?? 0);
  if (length > maxBytes) fail(413, 'PAYLOAD_TOO_LARGE', 'Request exceeds 2 MiB.');
  const reader = request.body?.getReader();
  if (!reader) return {};
  let bytes = 0;
  const chunks: Uint8Array[] = [];
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > maxBytes) {
        await reader.cancel();
        fail(413, 'PAYLOAD_TOO_LARGE', 'Request exceeds 2 MiB.');
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  let result: unknown;
  try {
    const raw = Buffer.concat(chunks).toString('utf8');
    result = raw ? JSON.parse(raw) : {};
  } catch {
    fail(400, 'MALFORMED_JSON', 'Use valid JSON.');
  }
  if (!result || Array.isArray(result) || typeof result !== 'object')
    fail(400, 'MALFORMED_JSON', 'Use a JSON object.');
  return result as Record<string, unknown>;
}
