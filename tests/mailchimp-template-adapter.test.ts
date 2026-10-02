import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { blankSpec, compileEmail } from '../src/domain/email';
import { compileMailchimpArtifact, type MailchimpArtifact } from '../src/domain/mailchimp-export';
import { createAndInspectMailchimpTemplate } from '../src/server/mailchimp-template-adapter';

const ORIGIN = 'https://us12.api.mailchimp.com';
const RESOURCE = ORIGIN + '/3.0/templates/42';
const SECRET = 'fixture-token';
const MAX_RESPONSE = 5 * 1024 * 1024 - 1;
async function artifact() {
  const spec = blankSpec(randomUUID(), 'Fixture');
  spec.subject = 'Fixture subject';
  spec.sections = spec.sections.map(b => b.type === 'legal_footer' ? { ...b, address: '123 Fixture Road' } : b.type === 'button' ? { ...b, href: 'https://example.org/offer' } : b);
  const a = await compileEmail(spec);
  return compileMailchimpArtifact({ id: randomUUID(), spec, manifest: a.manifest, html: a.html, plaintext: a.text, artifact_hash: a.hash });
}
const metadata = () => ({ id: 42, name: 'Fixture', type: 'user', content_type: 'html', active: true, drag_and_drop: false, _links: [{ rel: 'self', href: RESOURCE, method: 'GET' }] });
function json(value: unknown, status = 200, headers?: HeadersInit) { return new Response(JSON.stringify(value), { status, headers }); }
function options(a: MailchimpArtifact) {
  return { artifact: a, name: 'Fixture', accessToken: SECRET, serverPrefix: 'us12', markSubmission: async () => {}, persistRemoteId: async () => {} };
}
function rehash(a: MailchimpArtifact): MailchimpArtifact {
  const sha = (s: string) => createHash('sha256').update(s).digest('hex');
  return { ...a, html_sha256: sha(a.html), text_sha256: sha(a.text), destination_hash: sha(JSON.stringify([a.mapping_version, a.api_revision, a.source_artifact_hash, a.html, a.text])) };
}
function assertPrivate(result: unknown) {
  assert.doesNotMatch(JSON.stringify(result), /fixture-token|remote-private-content|provider-private-error/);
}

test('POST sends only name/html and persists numeric ID before exact metadata GET; never certifies content', async () => {
  const a = await artifact(), order: string[] = [], requests: { url: string; init: RequestInit }[] = [];
  const r = await createAndInspectMailchimpTemplate({ ...options(a),
    markSubmission: async () => { order.push('marker'); },
    persistRemoteId: async id => { assert.equal(id, '42'); order.push('id'); },
    fetcher: async (url, init) => { order.push(String(init?.method)); requests.push({ url: String(url), init: init! }); return json(metadata()); },
  });
  assert.deepEqual(order, ['marker', 'POST', 'id', 'GET']);
  assert.deepEqual(requests.map(r => r.url), [ORIGIN + '/3.0/templates', RESOURCE]);
  assert.deepEqual(JSON.parse(requests[0].init.body as string), { name: 'Fixture', html: a.html });
  for (const request of requests) {
    assert.equal(request.init.redirect, 'error');
    assert.equal(new Headers(request.init.headers).get('authorization'), 'Bearer ' + SECRET);
    assert.ok(request.init.signal instanceof AbortSignal);
  }
  assert.deepEqual(r, { state: 'needs_attention', code: 'EXPORT_TEMPLATE_CONTENT_UNVERIFIED', remote_id: '42', resource_url: RESOURCE, destination_url: null, content_verified: false });
});

test('partial create metadata cannot discard independently trusted ID, and share URL never becomes a destination', async () => {
  const a = await artifact();
  for (const value of [{ id: 42 }, { id: 42, name: null, type: [], active: 'bad', share_url: { secret: SECRET } }, { id: 42, _links: 'malformed optional metadata' }]) {
    let calls = 0, persisted = '';
    const r = await createAndInspectMailchimpTemplate({ ...options(a), persistRemoteId: async id => { persisted = id; }, fetcher: async () => json(++calls === 1 ? value : { ...metadata(), share_url: 'https://evil.test/' + SECRET, html: 'remote-private-content' }) });
    assert.equal(persisted, '42'); assert.equal(calls, 2);
    assert.equal(r.code, 'EXPORT_TEMPLATE_CONTENT_UNVERIFIED'); assert.equal(r.content_verified, false);
    assert.equal(r.destination_url, null); assert.equal(r.resource_url, RESOURCE); assertPrivate(r);
  }
});

test('failed submission marker performs no provider IO and exposes only a fixed error', async () => {
  const a = await artifact(); let calls = 0;
  await assert.rejects(() => createAndInspectMailchimpTemplate({ ...options(a), markSubmission: async () => { throw Error(SECRET + ' remote-private-content'); }, fetcher: async () => { calls++; return json(metadata()); } }), /^Error: EXPORT_SUBMISSION_MARKER_FAILED$/);
  assert.equal(calls, 0);
});

test('known ID survives persistence failure and no GET follows it', async () => {
  const a = await artifact(); let calls = 0;
  const r = await createAndInspectMailchimpTemplate({ ...options(a), persistRemoteId: async () => { throw Error(SECRET); }, fetcher: async () => { calls++; return json({ id: 42 }); } });
  assert.equal(calls, 1); assert.equal(r.remote_id, '42'); assert.equal(r.resource_url, RESOURCE);
  assert.equal(r.code, 'EXPORT_RECEIPT_PERSISTENCE_FAILED'); assert.equal(r.content_verified, false); assertPrivate(r);
});

for (const [field, value] of [['id', 43], ['id', '42'], ['name', 'Renamed'], ['type', 'base'], ['content_type', 'template'], ['active', false], ['drag_and_drop', true]] as const) {
  test(`GET metadata mismatch in ${field} retains known ID`, async () => {
    const a = await artifact(); let calls = 0;
    const r = await createAndInspectMailchimpTemplate({ ...options(a), fetcher: async () => json(++calls === 1 ? { id: 42 } : { ...metadata(), [field]: value }) });
    assert.equal(calls, 2); assert.equal(r.remote_id, '42'); assert.equal(r.code, 'EXPORT_READBACK_MISMATCH'); assert.equal(r.content_verified, false);
  });
}

test('GET loss, malformed response, rejection, foreign origin, redirect and self-link all retain known ID', async () => {
  const a = await artifact();
  for (const kind of ['network', 'malformed', 'status', 'origin', 'redirect', 'self'] as const) {
    let calls = 0;
    const r = await createAndInspectMailchimpTemplate({ ...options(a), fetcher: async () => {
      if (++calls === 1) return json({ id: 42 });
      if (kind === 'network') throw Error(SECRET);
      if (kind === 'malformed') return new Response('provider-private-error');
      if (kind === 'status') return json({ detail: SECRET }, 403);
      const response = json(kind === 'self' ? { ...metadata(), _links: [{ rel: 'self', href: ORIGIN + '/3.0/templates/43', method: 'GET' }] } : metadata());
      if (kind === 'origin') Object.defineProperty(response, 'url', { value: 'https://evil.test/' + SECRET });
      if (kind === 'redirect') Object.defineProperty(response, 'redirected', { value: true });
      return response;
    } });
    assert.equal(calls, 2); assert.equal(r.state, 'needs_attention'); assert.equal(r.remote_id, '42'); assert.equal(r.content_verified, false); assertPrivate(r);
  }
});

test('create accepts only positive safe numeric integer IDs', async () => {
  const a = await artifact();
  for (const id of [null, 0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1, '42', '../42', {}, []]) {
    let calls = 0;
    const r = await createAndInspectMailchimpTemplate({ ...options(a), persistRemoteId: async () => assert.fail('Untrusted ID'), fetcher: async () => { calls++; return json({ id }); } });
    assert.equal(calls, 1); assert.equal(r.state, 'outcome_unknown'); assert.equal(r.remote_id, null);
  }
  let calls = 0;
  const id = Number.MAX_SAFE_INTEGER;
  const r = await createAndInspectMailchimpTemplate({ ...options(a), persistRemoteId: async value => assert.equal(value, String(id)), fetcher: async () => json(++calls === 1 ? { id } : { ...metadata(), id, _links: [] }) });
  assert.equal(r.remote_id, String(id)); assert.equal(r.content_verified, false);
});

test('lost create acknowledgement, malformed JSON and non-documented success status remain unknown with no POST retry', async () => {
  const a = await artifact();
  for (const kind of ['network', 'malformed', 'missing-id', '201', '408', '500', '503'] as const) {
    let calls = 0;
    const r = await createAndInspectMailchimpTemplate({ ...options(a), persistRemoteId: async () => assert.fail('Untrusted ID'), fetcher: async () => {
      calls++; if (kind === 'network') throw Error(SECRET + ' remote-private-content');
      if (kind === 'malformed') return new Response('provider-private-error');
      return json(kind === 'missing-id' ? {} : { id: 42, detail: SECRET }, kind === 'missing-id' ? 200 : Number(kind));
    } });
    assert.equal(calls, 1); assert.equal(r.state, 'outcome_unknown'); assert.equal(r.remote_id, null); assertPrivate(r);
  }
});

test('auth, permissions, rate limit and other 4xx are actionable and never include provider detail', async () => {
  const a = await artifact();
  for (const [status, code] of [[401, 'EXPORT_GRANT_EXPIRED'], [403, 'EXPORT_PERMISSION_DENIED'], [429, 'EXPORT_RATE_LIMITED'], [422, 'EXPORT_PROVIDER_REJECTED']] as const) {
    let calls = 0;
    const r = await createAndInspectMailchimpTemplate({ ...options(a), fetcher: async () => { calls++; return json({ detail: SECRET + ' provider-private-error' }, status, { 'retry-after': '12' }); } });
    assert.equal(r.state, 'needs_attention'); assert.equal(r.code, code); assert.equal(r.remote_id, null); assert.equal(calls, 1);
    assert.equal(r.retry_after, status === 429 ? 12 : undefined); assertPrivate(r);
  }
});

test('retry-after is bounded numeric seconds, present only for 429', async () => {
  const a = await artifact();
  for (const [raw, expected] of [['99999', 86400], ['0', 0], ['-1', undefined], ['1.5', undefined], [SECRET, undefined], ['999999999999', undefined], ['Wed, 21 Oct 2026 07:28:00 GMT', undefined]] as const) {
    const r = await createAndInspectMailchimpTemplate({ ...options(a), fetcher: async () => new Response(SECRET, { status: 429, headers: { 'retry-after': raw } }) });
    assert.equal(r.retry_after, expected); assertPrivate(r);
  }
});

test('prefix, artifact hash/bytes, name and bearer token refusals perform no marker or network IO', async () => {
  const a = await artifact();
  const changes = [
    ...['https://us12.api.mailchimp.com', 'us0', 'us01', 'us1000', 'us12.evil.test', 'US12', 'us12/3.0', 'us12\n'].map(serverPrefix => ({ serverPrefix })),
    ...['', '  ', 'x'.repeat(201), 'Fixture\n', 'Fi\u007fxture'].map(name => ({ name })),
    ...['', 'x'.repeat(4097), 'token\n', 'Bearer ' + SECRET].map(accessToken => ({ accessToken })),
    ...[{ ...a, html: a.html + 'remote-private-content' }, { ...a, html_sha256: '0'.repeat(64) }, { ...a, text_sha256: '0'.repeat(64) }, { ...a, destination_hash: '0'.repeat(64) }, { ...a, source_artifact_hash: 'secret' }, { ...a, mapping_version: 'other' }, { ...a, api_revision: 'other' }, { ...a, destination: 'klaviyo' }, rehash({ ...a, html: 'é'.repeat(1024 * 1024 + 1) }), rehash({ ...a, text: 'x'.repeat(2 * 1024 * 1024 + 1) })].map(artifact => ({ artifact })),
  ];
  for (const change of changes) {
    let io = 0;
    await assert.rejects(() => createAndInspectMailchimpTemplate({ ...options(a), ...change, markSubmission: async () => { io++; }, fetcher: async () => { io++; return json(metadata()); } } as Parameters<typeof createAndInspectMailchimpTemplate>[0]), error => { assertPrivate(String(error)); return true; });
    assert.equal(io, 0);
  }
});

test('pre-abort performs no IO; abort after marker never submits, and abort after persisted ID preserves it', async () => {
  const a = await artifact();
  for (const when of ['before', 'marker', 'persist'] as const) {
    const controller = new AbortController(); let marker = 0, calls = 0;
    if (when === 'before') controller.abort();
    const r = await createAndInspectMailchimpTemplate({ ...options(a), signal: controller.signal,
      markSubmission: async () => { marker++; if (when === 'marker') controller.abort(); },
      persistRemoteId: async () => { if (when === 'persist') controller.abort(); },
      fetcher: async () => { calls++; return json({ id: 42 }); },
    });
    assert.equal(marker, when === 'before' ? 0 : 1); assert.equal(calls, when === 'persist' ? 1 : 0);
    assert.equal(r.remote_id, when === 'persist' ? '42' : null); assert.equal(r.content_verified, false);
  }
});

test('foreign create origin, redirects and self API links are rejected without following links', async () => {
  const a = await artifact();
  for (const kind of ['origin', 'credentials', 'redirect', 'foreign-self', 'other-self', 'self-query', 'self-method', 'self-container'] as const) {
    let calls = 0;
    const r = await createAndInspectMailchimpTemplate({ ...options(a), persistRemoteId: async () => assert.fail('Untrusted receipt'), fetcher: async () => {
      calls++; const value = metadata();
      if (kind === 'foreign-self') value._links[0].href = 'https://evil.test/' + SECRET;
      if (kind === 'other-self') value._links[0].href = ORIGIN + '/3.0/templates/43';
      if (kind === 'self-query') value._links[0].href += '?secret=' + SECRET;
      if (kind === 'self-method') value._links[0].method = 'DELETE';
      const response = json(kind === 'self-container' ? { ...value, _links: { rel: 'self', href: 'https://evil.test/' + SECRET, method: 'GET' } } : value);
      if (kind === 'origin') Object.defineProperty(response, 'url', { value: 'https://evil.test/' + SECRET });
      if (kind === 'credentials') Object.defineProperty(response, 'url', { value: 'https://secret@us12.api.mailchimp.com/3.0/templates' });
      if (kind === 'redirect') Object.defineProperty(response, 'redirected', { value: true });
      return response;
    } });
    assert.equal(calls, 1); assert.equal(r.state, 'outcome_unknown'); assert.equal(r.remote_id, null); assertPrivate(r);
  }
});

test('oversized declared/streamed create responses cancel before parsing and cannot supply trusted IDs', async () => {
  const a = await artifact();
  for (const kind of ['declared', 'streamed', 'invalid-length'] as const) {
    let cancelled = 0, reads = 0;
    const body = new ReadableStream<Uint8Array>({ pull(controller) { reads++; controller.enqueue(new Uint8Array(1024 * 1024)); }, cancel() { cancelled++; } });
    const r = await createAndInspectMailchimpTemplate({ ...options(a), fetcher: async () => new Response(body, { headers: kind === 'streamed' ? {} : { 'content-length': kind === 'declared' ? String(MAX_RESPONSE + 1) : SECRET } }) });
    assert.equal(r.state, 'outcome_unknown'); assert.equal(r.remote_id, null); assert.equal(cancelled, 1); assert.ok(reads <= 6); assertPrivate(r);
  }
});

test('exact response size limit is accepted and one extra streamed byte is refused', async () => {
  const a = await artifact();
  for (const extra of [0, 1]) {
    const receipt = '{"id":42}', body = receipt + ' '.repeat(MAX_RESPONSE - Buffer.byteLength(receipt) + extra);
    let calls = 0;
    const r = await createAndInspectMailchimpTemplate({ ...options(a), fetcher: async () => ++calls === 1 ? new Response(body) : json(metadata()) });
    assert.equal(calls, extra ? 1 : 2); assert.equal(r.remote_id, extra ? null : '42'); assert.equal(r.content_verified, false);
  }
});

test('abort cancels stalled response stream and known ID survives readback stream cancellation', async () => {
  const a = await artifact();
  for (const phase of ['create', 'read'] as const) {
    const controller = new AbortController(); let cancelled = 0, calls = 0;
    const body = new ReadableStream<Uint8Array>({ start() { setTimeout(() => controller.abort(), 5); }, cancel() { cancelled++; } });
    const r = await createAndInspectMailchimpTemplate({ ...options(a), signal: controller.signal, fetcher: async () => ++calls === 1 && phase === 'read' ? json({ id: 42 }) : new Response(body) });
    assert.equal(cancelled, 1); assert.equal(r.remote_id, phase === 'read' ? '42' : null); assert.equal(r.content_verified, false);
  }
});

test('fetch that ignores abort cannot stall outcome and response discard failures are sanitized', async () => {
  const a = await artifact();
  const controller = new AbortController();
  const pending = createAndInspectMailchimpTemplate({ ...options(a), signal: controller.signal, fetcher: async () => { setTimeout(() => controller.abort(), 5); return new Promise<Response>(() => {}); } });
  const r = await pending; assert.equal(r.state, 'outcome_unknown'); assertPrivate(r);
  const error = await createAndInspectMailchimpTemplate({ ...options(a), fetcher: async () => new Response(new ReadableStream({ cancel() { throw Error(SECRET); } }), { status: 403 }) });
  assert.equal(error.code, 'EXPORT_PERMISSION_DENIED'); assertPrivate(error);
});

test('submission callback cannot mutate the validated HTML or bearer token before POST', async () => {
  const a = await artifact(), html = a.html;
  let submittedHtml: unknown, bearer: string | null = null;
  const input = { ...options(a), markSubmission: async () => { a.html = 'remote-private-content'; input.accessToken = 'modified-token'; }, fetcher: async (_url: string | URL | Request, init?: RequestInit) => {
    if (init?.method === 'POST') {
      submittedHtml = JSON.parse(init.body as string).html;
      bearer = new Headers(init.headers).get('authorization');
    }
    return json(metadata());
  } };
  const r = await createAndInspectMailchimpTemplate(input);
  assert.equal(submittedHtml, html); assert.equal(bearer, 'Bearer ' + SECRET);
  assert.equal(r.remote_id, '42'); assert.equal(r.content_verified, false);
});

test('30 second transport budget aborts a fetch that ignores signals and preserves known ID', async t => {
  const a = await artifact(), delays: number[] = [], nativeTimeout = globalThis.setTimeout;
  // Advance only this primitive's budget without a 30 second test delay.
  t.mock.method(globalThis, 'setTimeout', (callback: () => void, delay: number) => { delays.push(delay); return nativeTimeout(callback, 1); });
  for (const phase of ['create', 'read'] as const) {
    let calls = 0;
    const r = await createAndInspectMailchimpTemplate({ ...options(a), fetcher: async () => ++calls === 1 && phase === 'read' ? json({ id: 42 }) : new Promise<Response>(() => {}) });
    assert.equal(r.state, phase === 'read' ? 'needs_attention' : 'outcome_unknown');
    assert.equal(r.remote_id, phase === 'read' ? '42' : null); assert.equal(r.content_verified, false);
  }
  assert.deepEqual(delays, [30000, 30000]);
});
