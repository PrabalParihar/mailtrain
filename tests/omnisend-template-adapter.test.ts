import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { blankSpec, compileEmail } from '../src/domain/email';
import { compileOmnisendArtifact, omnisendReview, type OmnisendArtifact } from '../src/domain/omnisend-export';
import { OMNISEND_API_REVISION, OMNISEND_IMPORT_BODY_LIMIT } from '../src/domain/omnisend-export-contracts';
import { createAndInspectOmnisendTemplate } from '../src/server/omnisend-template-adapter';

const IMPORT = 'https://api.omnisend.com/api/email-templates/import';
const ID = '0123456789abcdef01234567';
const RESOURCE = 'https://api.omnisend.com/api/email-templates/' + ID;
const SECRET = 'fixture-token';
const MAX_RESPONSE = 5 * 1024 * 1024 - 1;
const sha = (value: string) => createHash('sha256').update(value, 'utf8').digest('hex');
async function artifact() {
  const spec = blankSpec(randomUUID(), 'Fixture');
  spec.subject = 'Fixture subject';
  spec.sections = spec.sections.map(b => b.type === 'legal_footer' ? { ...b, address: '123 Fixture Road' } : b.type === 'button' ? { ...b, href: 'https://example.org/offer' } : b);
  const compiled = await compileEmail(spec);
  return compileOmnisendArtifact({ id: randomUUID(), spec, manifest: compiled.manifest, html: compiled.html, plaintext: compiled.text, artifact_hash: compiled.hash });
}
function rehash(a: OmnisendArtifact): OmnisendArtifact {
  return { ...a, html_sha256: sha(a.html), text_sha256: sha(a.text), destination_hash: sha(JSON.stringify([a.mapping_version, a.api_revision, a.source_artifact_hash, a.html, a.text])) };
}
function json(value: unknown, status = 200, headers?: HeadersInit) { return new Response(JSON.stringify(value), { status, headers }); }
function options(a: OmnisendArtifact) {
  return { artifact: a, name: 'Fixture', accessToken: SECRET, markSubmission: async () => {}, persistRemoteId: async () => {} };
}
const metadata = () => ({ id: ID, name: 'Fixture', sections: [], generalSettings: {}, createdAt: 'fixture', updatedAt: 'fixture' });
function assertPrivate(value: unknown) { assert.doesNotMatch(JSON.stringify(value), /fixture-token|remote-private-content|provider-private-error/); }
function withUrl(response: Response, url: string) { Object.defineProperty(response, 'url', { value: url }); return response; }

// Removing validation, marker ordering, or conservative readback changes these
// tests' observable IO/results. Every fetcher is injected; no provider is called.
test('real compiled artifact sends exact name/html POST and version/Bearer, persists ID before the sole GET', async () => {
  const a = await artifact(), order: string[] = [], requests: { url: string; init: RequestInit }[] = [];
  const r = await createAndInspectOmnisendTemplate({ ...options(a),
    markSubmission: async () => { order.push('marker'); },
    persistRemoteId: async id => { assert.equal(id, ID); order.push('id'); },
    fetcher: async (url, init) => { order.push(String(init?.method)); requests.push({ url: String(url), init: init! }); return json(metadata(), init?.method === 'POST' ? 201 : 200); },
  });
  assert.deepEqual(order, ['marker', 'POST', 'id', 'GET']);
  assert.deepEqual(requests.map(r => r.url), [IMPORT, RESOURCE]);
  assert.equal(requests[0].init.body, JSON.stringify({ name: 'Fixture', html: a.html }));
  assert.equal(requests[1].init.body, undefined);
  for (const request of requests) {
    const headers = new Headers(request.init.headers);
    assert.equal(request.init.redirect, 'error');
    assert.equal(headers.get('authorization'), 'Bearer ' + SECRET);
    assert.equal(headers.get('omnisend-version'), OMNISEND_API_REVISION);
    assert.equal(headers.get('content-type'), 'application/json');
    assert.equal(headers.get('accept'), 'application/json');
    assert.equal([...headers].length, 4);
    assert.ok(request.init.signal instanceof AbortSignal);
  }
  assert.deepEqual(r, { state: 'needs_attention', code: 'EXPORT_IMPORT_CONTENT_UNVERIFIED', remote_id: ID, resource_url: RESOURCE, destination_url: null, content_verified: false });
});

test('partial trusted create ID persists despite malformed optional attributes; unsolicited HTML and links cannot prove content or cause IO', async () => {
  const a = await artifact();
  for (const receipt of [{ id: ID }, { id: ID, name: null, sections: 'bad', generalSettings: [], html: 'remote-private-content', _links: 'bad' }]) {
    let calls = 0, persisted = '';
    const r = await createAndInspectOmnisendTemplate({ ...options(a), persistRemoteId: async id => { persisted = id; }, fetcher: async () => json(++calls === 1 ? receipt : { ...metadata(), html: a.html, url: 'https://evil.test/' + SECRET, _links: [{ rel: 'self', href: 'https://evil.test/' + SECRET }] }, calls === 1 ? 201 : 200) });
    assert.equal(persisted, ID); assert.equal(calls, 2); assert.equal(r.code, 'EXPORT_IMPORT_CONTENT_UNVERIFIED');
    assert.equal(r.destination_url, null); assert.equal(r.resource_url, RESOURCE); assert.equal(r.content_verified, false); assertPrivate(r);
  }
});

test('complete validation refuses invalid constants/hashes/formats/source identity/name/token/callbacks before any marker or fetch', async () => {
  const a = await artifact();
  const invalidArtifacts = [
    { ...a, html: a.html + 'x' }, { ...a, text: a.text + 'x' }, { ...a, html_sha256: '0'.repeat(64) }, { ...a, text_sha256: '0'.repeat(64) },
    { ...a, destination_hash: '0'.repeat(64) }, { ...a, source_artifact_hash: 'secret' }, { ...a, revision_id: 'not-an-id' },
    { ...a, mapping_version: 'other' }, { ...a, api_revision: 'other' }, { ...a, destination: 'mailchimp' }, { ...a, remote_export_enabled: true },
    rehash({ ...a, text: 'x'.repeat(OMNISEND_IMPORT_BODY_LIMIT + 1) }), rehash({ ...a, html: 'x'.repeat(OMNISEND_IMPORT_BODY_LIMIT + 1) }),
    rehash({ ...a, html: '\ud800' }), rehash({ ...a, text: '\udc00' }), { ...a, transformations: [null] },
  ];
  const changes: Record<string, unknown>[] = [
    ...invalidArtifacts.map(artifact => ({ artifact })),
    ...['', '  ', 'x'.repeat(256), 'Fixture\n', 'Fi\u007fxture', '\ud800', '\udc00', 'x\ud800y'].map(name => ({ name })),
    ...['', 'x'.repeat(4097), 'token\n', 'Bearer ' + SECRET].map(accessToken => ({ accessToken })),
    { markSubmission: null }, { persistRemoteId: null }, { fetcher: 'invalid' }, { signal: {} },
  ];
  for (const change of changes) {
    let io = 0;
    await assert.rejects(() => createAndInspectOmnisendTemplate({ ...options(a), markSubmission: async () => { io++; }, fetcher: async () => { io++; return json(metadata(), 201); }, ...change } as Parameters<typeof createAndInspectOmnisendTemplate>[0]), error => { assertPrivate(String(error)); return true; });
    assert.equal(io, 0);
  }
});

for (const [kind, revision_id] of [
  ['variant', '11111111-1111-1111-1111-111111111111'],
  ['version', '11111111-1111-9111-8111-111111111111'],
] as const) {
  test(`correctly grouped invalid UUID ${kind} refuses before marker, requests or persistence`, async () => {
    const a = { ...await artifact(), revision_id };
    assert.throws(() => omnisendReview(a));
    const io = { markers: 0, requests: 0, persisted: 0 };
    const error = await createAndInspectOmnisendTemplate({ ...options(a),
      markSubmission: async () => { io.markers++; },
      persistRemoteId: async () => { io.persisted++; },
      fetcher: async () => json(metadata(), ++io.requests === 1 ? 201 : 200),
    }).then(() => undefined, (error: unknown) => error);
    assert.deepEqual(io, { markers: 0, requests: 0, persisted: 0 });
    assert.ok(error instanceof Error);
    assert.equal(error.message, 'EXPORT_ARTIFACT_INVALID');
  });
}

test('supported UUID versions, uppercase, nil and max keep normal compiled-artifact transport behavior', async () => {
  const compiled = await artifact();
  const revisionIds = [
    ...Array.from({ length: 8 }, (_, i) => `11111111-1111-${i + 1}111-8111-111111111111`),
    'ABCDEFAB-CDEF-4ABC-ABCD-EFABCDEFABCD',
    '00000000-0000-0000-0000-000000000000',
    'ffffffff-ffff-ffff-ffff-ffffffffffff',
  ];
  for (const revision_id of revisionIds) {
    const a = { ...compiled, revision_id }, order: string[] = [];
    assert.equal(omnisendReview(a).revision_id, revision_id);
    const r = await createAndInspectOmnisendTemplate({ ...options(a),
      markSubmission: async () => { order.push('marker'); },
      persistRemoteId: async id => { assert.equal(id, ID); order.push('id'); },
      fetcher: async (_url, init) => { order.push(init!.method!); return json(metadata(), init?.method === 'POST' ? 201 : 200); },
    });
    assert.deepEqual(order, ['marker', 'POST', 'id', 'GET']);
    assert.equal(r.code, 'EXPORT_IMPORT_CONTENT_UNVERIFIED');
    assert.equal(r.remote_id, ID);
    assert.equal(r.content_verified, false);
    assert.equal(r.destination_url, null);
  }
});

test('actual final JSON size boundary includes escaping and Unicode name bytes', async () => {
  const a = await artifact();
  for (const name of ['Fixture', '"\\'.repeat(127) + 'x', '\uffff'.repeat(255), '😀'.repeat(127) + 'x']) {
    const emptyBytes = Buffer.byteLength(JSON.stringify({ name, html: '' }));
    for (const extra of [0, 1]) {
      const sized = rehash({ ...a, html: 'x'.repeat(OMNISEND_IMPORT_BODY_LIMIT - emptyBytes + extra) });
      let calls = 0, marked = 0;
      const run = () => createAndInspectOmnisendTemplate({ ...options(sized), name, markSubmission: async () => { marked++; }, fetcher: async (_url, init) => { calls++; if (init?.method === 'POST') assert.equal(Buffer.byteLength(init.body as string), OMNISEND_IMPORT_BODY_LIMIT); return json({ id: ID, name }, calls === 1 ? 201 : 200); } });
      if (extra) { await assert.rejects(run, /^Error: EXPORT_IMPORT_BODY_TOO_LARGE$/); assert.equal(calls, 0); assert.equal(marked, 0); }
      else { const r = await run(); assert.equal(r.code, 'EXPORT_IMPORT_CONTENT_UNVERIFIED'); assert.equal(calls, 2); }
    }
  }
  let calls = 0;
  const escaping = rehash({ ...a, html: '"'.repeat(OMNISEND_IMPORT_BODY_LIMIT / 2) });
  await assert.rejects(() => createAndInspectOmnisendTemplate({ ...options(escaping), fetcher: async () => { calls++; return json({ id: ID }, 201); } }), /^Error: EXPORT_IMPORT_BODY_TOO_LARGE$/);
  assert.equal(calls, 0);
});

test('trimmed well-formed name and exact validated bytes/token survive asynchronous callback mutation', async () => {
  const a = await artifact(), originalHtml = a.html;
  const input = { ...options(a), name: ' Fixture ', markSubmission: async () => { a.html = 'remote-private-content'; input.name = 'Mutated'; input.accessToken = 'mutated'; }, fetcher: async (_url: string | URL | Request, init?: RequestInit) => {
    assert.equal(new Headers(init?.headers).get('authorization'), 'Bearer ' + SECRET);
    if (init?.method === 'POST') assert.equal(init.body, JSON.stringify({ name: 'Fixture', html: originalHtml }));
    return json(metadata(), init?.method === 'POST' ? 201 : 200);
  } };
  const r = await createAndInspectOmnisendTemplate(input); assert.equal(r.code, 'EXPORT_IMPORT_CONTENT_UNVERIFIED');
});

test('marker failure exposes fixed error and performs no fetch', async () => {
  const a = await artifact(); let calls = 0;
  await assert.rejects(() => createAndInspectOmnisendTemplate({ ...options(a), markSubmission: async () => { throw Error(SECRET); }, fetcher: async () => { calls++; return json({ id: ID }, 201); } }), /^Error: EXPORT_SUBMISSION_MARKER_FAILED$/);
  assert.equal(calls, 0);
});

test('only 24 hexadecimal string IDs are trusted; optional receipt metadata cannot erase one', async () => {
  const a = await artifact();
  for (const id of [null, 42, '', 'a'.repeat(23), 'g'.repeat(24), '../' + ID, ID + '?secret', {}, []]) {
    let calls = 0;
    const r = await createAndInspectOmnisendTemplate({ ...options(a), persistRemoteId: async () => assert.fail('untrusted ID'), fetcher: async () => { calls++; return json({ id }, 201); } });
    assert.equal(r.state, 'outcome_unknown'); assert.equal(r.remote_id, null); assert.equal(calls, 1); assertPrivate(r);
  }
  const uppercase = ID.toUpperCase(); let calls = 0;
  const r = await createAndInspectOmnisendTemplate({ ...options(a), persistRemoteId: async id => assert.equal(id, uppercase), fetcher: async (url) => { if (++calls === 2) assert.equal(String(url), 'https://api.omnisend.com/api/email-templates/' + uppercase); return json({ id: uppercase, name: 'Fixture' }, calls === 1 ? 201 : 200); } });
  assert.equal(r.remote_id, uppercase);
});

test('known ID survives persistence failure; no GET follows', async () => {
  const a = await artifact(); let calls = 0;
  const r = await createAndInspectOmnisendTemplate({ ...options(a), persistRemoteId: async () => { throw Error(SECRET); }, fetcher: async () => { calls++; return json({ id: ID }, 201); } });
  assert.equal(calls, 1); assert.equal(r.code, 'EXPORT_RECEIPT_PERSISTENCE_FAILED'); assert.equal(r.remote_id, ID); assert.equal(r.resource_url, RESOURCE); assertPrivate(r);
});

for (const [field, value] of [['id', 'f'.repeat(24)], ['id', 42], ['name', 'Renamed'], ['name', null]] as const) {
  test(`GET mismatch in ${field} retains ID and unverified result`, async () => {
    const a = await artifact(); let calls = 0;
    const r = await createAndInspectOmnisendTemplate({ ...options(a), fetcher: async () => json(++calls === 1 ? { id: ID } : { ...metadata(), [field]: value }, calls === 1 ? 201 : 200) });
    assert.equal(r.code, 'EXPORT_READBACK_MISMATCH'); assert.equal(r.remote_id, ID); assert.equal(r.content_verified, false); assert.equal(calls, 2);
  });
}

test('lost/malformed/undocumented successful/timeout/server create outcomes remain unknown with no retry', async () => {
  const a = await artifact();
  for (const kind of ['network', 'malformed', 'missing-id', 'array', '200', '202', '204', '301', '302', '307', '408', '500', '503']) {
    let calls = 0;
    const r = await createAndInspectOmnisendTemplate({ ...options(a), fetcher: async () => {
      calls++; if (kind === 'network') throw Error(SECRET);
      if (kind === 'malformed') return new Response('provider-private-error', { status: 201 });
      if (kind === '204') return new Response(null, { status: 204 });
      return json(kind === 'missing-id' ? {} : kind === 'array' ? [{ id: ID }] : { id: ID, detail: SECRET }, ['missing-id', 'array'].includes(kind) ? 201 : Number(kind));
    } });
    assert.equal(calls, 1); assert.equal(r.state, 'outcome_unknown'); assert.equal(r.remote_id, null); assertPrivate(r);
  }
});

test('fixed auth/permission/entitlement/version/size/rate/validation codes sanitize provider errors', async () => {
  const a = await artifact();
  for (const [status, code] of [[401, 'EXPORT_GRANT_EXPIRED'], [403, 'EXPORT_PERMISSION_DENIED'], [402, 'EXPORT_ACCOUNT_ENTITLEMENT_REQUIRED'], [410, 'EXPORT_API_VERSION_RETIRED'], [413, 'EXPORT_IMPORT_BODY_TOO_LARGE'], [429, 'EXPORT_RATE_LIMITED'], [400, 'EXPORT_PROVIDER_REJECTED'], [422, 'EXPORT_PROVIDER_REJECTED']] as const) {
    let calls = 0;
    const r = await createAndInspectOmnisendTemplate({ ...options(a), fetcher: async () => { calls++; return json({ detail: SECRET }, status, { 'retry-after': '12' }); } });
    assert.equal(calls, 1); assert.equal(r.code, code); assert.equal(r.state, 'needs_attention'); assert.equal(r.retry_after, status === 429 ? 12 : undefined); assertPrivate(r);
  }
});

test('retry-after is bounded integer seconds only on 429', async () => {
  const a = await artifact();
  for (const [raw, expected] of [['99999', 86400], ['0', 0], ['-1', undefined], ['1.5', undefined], [SECRET, undefined], ['999999999999', undefined], ['Wed, 21 Oct 2026 07:28:00 GMT', undefined]] as const) {
    const r = await createAndInspectOmnisendTemplate({ ...options(a), fetcher: async () => new Response(SECRET, { status: 429, headers: { 'retry-after': raw } }) });
    assert.equal(r.retry_after, expected); assertPrivate(r);
  }
});

for (const phase of ['create', 'read'] as const) {
  test(`${phase} response must bind fixed origin/exact path and refuse redirect/userinfo/query/fragment`, async () => {
    const a = await artifact(), expectedUrl = phase === 'create' ? IMPORT : RESOURCE;
    for (const kind of ['foreign', 'other-path', 'userinfo', 'query', 'fragment', 'redirect']) {
      let calls = 0;
      const r = await createAndInspectOmnisendTemplate({ ...options(a), fetcher: async () => {
        if (++calls === 1 && phase === 'read') return json({ id: ID }, 201);
        const response = json(metadata(), phase === 'create' ? 201 : 200);
        if (kind === 'redirect') Object.defineProperty(response, 'redirected', { value: true });
        else withUrl(response, kind === 'foreign' ? 'https://evil.test/' + SECRET : kind === 'other-path' ? 'https://api.omnisend.com/api/campaigns' : kind === 'userinfo' ? expectedUrl.replace('https://', 'https://secret@') : expectedUrl + (kind === 'query' ? '?secret=' + SECRET : '#fragment'));
        return response;
      } });
      assert.equal(calls, phase === 'create' ? 1 : 2); assert.equal(r.state, phase === 'create' ? 'outcome_unknown' : 'needs_attention'); assert.equal(r.remote_id, phase === 'create' ? null : ID); assertPrivate(r);
    }
    let calls = 0;
    const r = await createAndInspectOmnisendTemplate({ ...options(a), fetcher: async () => { calls++; return withUrl(json(metadata(), calls === 1 ? 201 : 200), calls === 1 ? IMPORT : RESOURCE); } });
    assert.equal(r.code, 'EXPORT_IMPORT_CONTENT_UNVERIFIED');
  });
}

test('known ID survives every readback status/network/malformed/size failure with sanitized result', async () => {
  const a = await artifact();
  for (const kind of ['network', 'malformed', 'missing-body', 'size', '201', '401', '403', '404', '408', '429', '503']) {
    let calls = 0;
    const r = await createAndInspectOmnisendTemplate({ ...options(a), fetcher: async () => {
      if (++calls === 1) return json({ id: ID }, 201);
      if (kind === 'network') throw Error(SECRET);
      if (kind === 'malformed') return new Response('provider-private-error');
      if (kind === 'missing-body') return new Response(null);
      if (kind === 'size') return json(metadata(), 200, { 'content-length': String(MAX_RESPONSE + 1) });
      return json({ detail: SECRET }, Number(kind));
    } });
    assert.equal(r.state, 'needs_attention'); assert.equal(r.remote_id, ID); assert.equal(r.resource_url, RESOURCE); assert.equal(r.content_verified, false); assertPrivate(r);
  }
});

test('declared/streamed oversized response and invalid declared length cancel before identity trust', async () => {
  const a = await artifact();
  for (const kind of ['declared', 'streamed', 'invalid-length']) {
    let cancelled = 0, reads = 0;
    const body = new ReadableStream<Uint8Array>({ pull(controller) { reads++; controller.enqueue(new Uint8Array(1024 * 1024)); }, cancel() { cancelled++; } });
    const r = await createAndInspectOmnisendTemplate({ ...options(a), fetcher: async () => new Response(body, { status: 201, headers: kind === 'streamed' ? {} : { 'content-length': kind === 'declared' ? String(MAX_RESPONSE + 1) : SECRET } }) });
    assert.equal(r.state, 'outcome_unknown'); assert.equal(r.remote_id, null); assert.equal(cancelled, 1); assert.ok(reads <= 6); assertPrivate(r);
  }
});

test('5MiB-1 exact declared and observed response boundary accepts, one extra byte refuses', async () => {
  const a = await artifact(), receipt = JSON.stringify({ id: ID });
  for (const declared of [false, true]) for (const extra of [0, 1]) {
    const body = receipt + ' '.repeat(MAX_RESPONSE - Buffer.byteLength(receipt) + extra); let calls = 0;
    const r = await createAndInspectOmnisendTemplate({ ...options(a), fetcher: async () => ++calls === 1 ? new Response(body, { status: 201, headers: declared ? { 'content-length': String(Buffer.byteLength(body)) } : {} }) : json(metadata()) });
    assert.equal(calls, extra ? 1 : 2); assert.equal(r.remote_id, extra ? null : ID); assert.equal(r.content_verified, false);
  }
});

test('pre-abort causes zero IO; post-marker abort is uncertain; post-ID abort retains known ID without GET', async () => {
  const a = await artifact();
  for (const when of ['before', 'marker', 'persist']) {
    const controller = new AbortController(); let marked = 0, calls = 0;
    if (when === 'before') controller.abort();
    const r = await createAndInspectOmnisendTemplate({ ...options(a), signal: controller.signal,
      markSubmission: async () => { marked++; if (when === 'marker') controller.abort(); },
      persistRemoteId: async () => { if (when === 'persist') controller.abort(); },
      fetcher: async () => { calls++; return json({ id: ID }, 201); },
    });
    assert.equal(marked, when === 'before' ? 0 : 1); assert.equal(calls, when === 'persist' ? 1 : 0); assert.equal(r.remote_id, when === 'persist' ? ID : null); assert.equal(r.content_verified, false);
    assert.equal(r.state, when === 'marker' ? 'outcome_unknown' : 'needs_attention');
  }
});

test('abort races stalled streams and signal-ignoring fetches in both phases, retaining known ID', async () => {
  const a = await artifact();
  for (const phase of ['create', 'read']) for (const kind of ['stream', 'fetch']) {
    const controller = new AbortController(); let calls = 0, cancelled = 0;
    const r = await createAndInspectOmnisendTemplate({ ...options(a), signal: controller.signal, fetcher: async () => {
      if (++calls === 1 && phase === 'read') return json({ id: ID }, 201);
      setTimeout(() => controller.abort(), 5);
      if (kind === 'fetch') return new Promise<Response>(() => {});
      return new Response(new ReadableStream({ cancel() { cancelled++; } }), { status: phase === 'create' ? 201 : 200 });
    } });
    assert.equal(r.remote_id, phase === 'read' ? ID : null); assert.equal(r.content_verified, false); assert.equal(cancelled, kind === 'stream' ? 1 : 0); assertPrivate(r);
  }
});

test('signal-ignoring late fetch response is discarded after bounded sanitized result', async () => {
  const a = await artifact(), controller = new AbortController(); let cancelled = 0, resolve!: (response: Response) => void;
  const pending = createAndInspectOmnisendTemplate({ ...options(a), signal: controller.signal, fetcher: async () => { queueMicrotask(() => controller.abort()); return new Promise<Response>(r => { resolve = r; }); } });
  const r = await pending; assert.equal(r.state, 'outcome_unknown'); assertPrivate(r);
  resolve(new Response(new ReadableStream({ cancel() { cancelled++; throw Error(SECRET); } }), { status: 201 }));
  await new Promise<void>(r => setImmediate(r)); assert.equal(cancelled, 1);
});

test('one 30 second budget is shared by POST and GET, including signal-ignoring readback', async t => {
  const a = await artifact(), delays: number[] = [], nativeTimeout = globalThis.setTimeout;
  t.mock.method(globalThis, 'setTimeout', (callback: () => void, delay: number) => { delays.push(delay); return nativeTimeout(callback, 1); });
  for (const phase of ['create', 'read']) {
    let calls = 0;
    const r = await createAndInspectOmnisendTemplate({ ...options(a), fetcher: async () => ++calls === 1 && phase === 'read' ? json({ id: ID }, 201) : new Promise<Response>(() => {}) });
    assert.equal(r.state, phase === 'read' ? 'needs_attention' : 'outcome_unknown'); assert.equal(r.remote_id, phase === 'read' ? ID : null);
  }
  assert.deepEqual(delays, [30000, 30000]);
});
