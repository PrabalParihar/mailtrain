import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import {compileBrevoArtifact, type BrevoArtifact} from '../src/domain/brevo-export';
import {BREVO_HTML_LIMIT} from '../src/domain/brevo-export-contracts';
import {blankSpec, compileEmail} from '../src/domain/email';
import { createAndInspectBrevoDraft } from '../src/server/brevo-draft-adapter';

const IMPORT = 'https://api.brevo.com/v3/emailCampaigns';
const ID = '42';
const RESOURCE = IMPORT + '/' + ID;
const SECRET = 'fixture-token';
const MAX_RESPONSE = 5 * 1024 * 1024 - 1;
const sha = (value: string) => createHash('sha256').update(value, 'utf8').digest('hex');
async function artifact(): Promise<BrevoArtifact> {
  return rehash({destination: 'brevo', mapping_version: 'brevo-campaign-html-1', api_revision: 'v3', revision_id: randomUUID(), source_artifact_hash: 'a'.repeat(64), subject: 'Fixture subject', html: '<html><a href="{{ unsubscribe }}">Unsubscribe</a></html>', text: 'Unsubscribe {{ unsubscribe }}', html_sha256: '', text_sha256: '', destination_hash: '', remote_export_enabled: false, transformations: ['Canonical unsubscribe slot mapped.']});
}
function rehash(a: BrevoArtifact): BrevoArtifact {
  return { ...a, html_sha256: sha(a.html), text_sha256: sha(a.text), destination_hash: sha(JSON.stringify([a.mapping_version, a.api_revision, a.source_artifact_hash, a.subject, a.html, a.text])) };
}
function json(value: unknown, status = 200, headers?: HeadersInit) { return new Response(JSON.stringify(value), { status, headers }); }
function options(a: BrevoArtifact) {
  return { artifact: a, name: 'Fixture', senderId: 7, apiKey: SECRET, markSubmission: async () => {}, persistRemoteId: async () => {} };
}
const metadata = () => ({id: Number(ID), name: 'Fixture', status: 'draft', type: 'classic', subject: 'Fixture subject', sender: {id: 7}, htmlContent: '<html><a href="{{ unsubscribe }}">Unsubscribe</a></html>', modifiedAt: '2026-10-03T12:00:00.000Z', testSent: false, recipients: {exclusionLists: [], lists: []}});
function assertPrivate(value: unknown) { assert.doesNotMatch(JSON.stringify(value), /fixture-token|remote-private-content|provider-private-error/); }
function withUrl(response: Response, url: string) { Object.defineProperty(response, 'url', { value: url }); return response; }

// Removing validation, marker ordering, or conservative readback changes these
// tests' observable IO/results. Every fetcher is injected; no provider is called.
test('validated artifact sends exact four-key draft POST and api-key, persists ID before the sole GET', async () => {
  const a = await artifact(), order: string[] = [], requests: { url: string; init: RequestInit }[] = [];
  const r = await createAndInspectBrevoDraft({ ...options(a),
    markSubmission: async () => { order.push('marker'); },
    persistRemoteId: async id => { assert.equal(id, ID); order.push('id'); },
    fetcher: async (url, init) => { order.push(String(init?.method)); requests.push({ url: String(url), init: init! }); return json(metadata(), init?.method === 'POST' ? 201 : 200); },
  });
  assert.deepEqual(order, ['marker', 'POST', 'id', 'GET']);
  assert.deepEqual(requests.map(r => r.url), [IMPORT, RESOURCE]);
  assert.equal(requests[0].init.body, JSON.stringify({ name: 'Fixture', sender: {id: 7}, subject: a.subject, htmlContent: a.html }));
  assert.equal(requests[1].init.body, undefined);
  for (const request of requests) {
    const headers = new Headers(request.init.headers);
    assert.equal(request.init.redirect, 'error');
    assert.equal(headers.get('api-key'), SECRET);
    assert.equal(headers.get('content-type'), 'application/json');
    assert.equal(headers.get('accept'), 'application/json');
    assert.equal([...headers].length, 3);
    assert.ok(request.init.signal instanceof AbortSignal);
  }
  assert.deepEqual(r, { state: 'needs_attention', code: 'EXPORT_MANAGEMENT_LINK_UNVERIFIED', remote_id: ID, resource_url: RESOURCE, destination_url: null, content_verified: true, native_fidelity_verified: false, readback_html_sha256: a.html_sha256, remote_modified_at: metadata().modifiedAt });
});

test('partial trusted create ID persists despite malformed optional attributes; unsolicited links cannot prove native fidelity or cause IO', async () => {
  const a = await artifact();
  for (const receipt of [{ id: Number(ID) }, { id: Number(ID), name: null, sections: 'bad', generalSettings: [], html: 'remote-private-content', _links: 'bad' }]) {
    let calls = 0, persisted = '';
    const r = await createAndInspectBrevoDraft({ ...options(a), persistRemoteId: async id => { persisted = id; }, fetcher: async () => json(++calls === 1 ? receipt : { ...metadata(), html: a.html, url: 'https://evil.test/' + SECRET, _links: [{ rel: 'self', href: 'https://evil.test/' + SECRET }] }, calls === 1 ? 201 : 200) });
    assert.equal(persisted, ID); assert.equal(calls, 2); assert.equal(r.code, 'EXPORT_MANAGEMENT_LINK_UNVERIFIED');
    assert.equal(r.destination_url, null); assert.equal(r.resource_url, RESOURCE); assert.equal(r.native_fidelity_verified, false); assertPrivate(r);
  }
});

test('complete validation refuses invalid constants/hashes/formats/source identity/name/token/callbacks before any marker or fetch', async () => {
  const a = await artifact();
  const invalidArtifacts = [
    { ...a, html: a.html + 'x' }, { ...a, subject: 'Changed subject without hash' }, { ...a, unknown: 'extra' }, { ...a, transformations: Array(11).fill('x') }, { ...a, text: a.text + 'x' }, { ...a, html_sha256: '0'.repeat(64) }, { ...a, text_sha256: '0'.repeat(64) },
    { ...a, destination_hash: '0'.repeat(64) }, { ...a, source_artifact_hash: 'secret' }, { ...a, revision_id: 'not-an-id' }, { ...a, revision_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' },
    { ...a, mapping_version: 'other' }, { ...a, api_revision: 'other' }, { ...a, destination: 'mailchimp' }, { ...a, remote_export_enabled: true },
    rehash({ ...a, text: 'x'.repeat(BREVO_HTML_LIMIT + 1) }), rehash({ ...a, html: 'x'.repeat(BREVO_HTML_LIMIT + 1) }),
    rehash({ ...a, html: '\ud800' }), rehash({...a, html: 'x'.repeat(10)}), rehash({...a, subject: ' '}), rehash({...a, subject: 'a'.repeat(201)}), rehash({...a, subject: 'bad\n'}), rehash({...a, subject: '\ud800'}), rehash({ ...a, text: '\udc00' }), { ...a, transformations: [null] },
  ];
  const changes: Record<string, unknown>[] = [
    ...invalidArtifacts.map(artifact => ({ artifact })),
    ...['', '  ', 'x'.repeat(256), 'Fixture\n', 'Fi\u007fxture', '\ud800', '\udc00', 'x\ud800y'].map(name => ({ name })),
    ...['', 'x'.repeat(4097), 'token\n', 'Bearer ' + SECRET].map(apiKey => ({ apiKey })),
    ...[0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1, '7'].map(senderId => ({senderId})), { markSubmission: null }, { persistRemoteId: null }, { fetcher: 'invalid' }, { signal: {} },
  ];
  for (const change of changes) {
    let io = 0;
    await assert.rejects(() => createAndInspectBrevoDraft({ ...options(a), markSubmission: async () => { io++; }, fetcher: async () => { io++; return json(metadata(), 201); }, ...change } as Parameters<typeof createAndInspectBrevoDraft>[0]), error => { assertPrivate(String(error)); return true; });
    assert.equal(io, 0);
  }
});

test('HTML/text enforce strict decimal byte boundary without applying total JSON reserve', async () => {
 const a = await artifact();
 for (const field of ['html', 'text'] as const) for (const size of [BREVO_HTML_LIMIT - 1, BREVO_HTML_LIMIT]) {
  const sized = rehash({...a, [field]: 'x'.repeat(size)}); let calls = 0, marked = 0;
  const run = () => createAndInspectBrevoDraft({...options(sized), markSubmission: async () => {marked++;}, fetcher: async (_url, init) => {calls++; if(init?.method === 'POST') assert.equal(JSON.parse(init.body as string).htmlContent, sized.html); return json(init?.method === 'POST' ? {id: Number(ID)} : {...metadata(), htmlContent: sized.html}, init?.method === 'POST' ? 201 : 200);}});
  if(size === BREVO_HTML_LIMIT) {await assert.rejects(run, /^Error: EXPORT_ARTIFACT_INVALID$/); assert.equal(calls, 0); assert.equal(marked, 0);}
  else {const r = await run(); assert.equal(r.content_verified, true); assert.equal(calls, 2); assert.equal(marked, 1);}
 }
});

test('trimmed well-formed name and exact validated bytes/token survive asynchronous callback mutation', async () => {
  const a = await artifact(), originalHtml = a.html;
  const input = { ...options(a), name: ' Fixture ', markSubmission: async () => { a.html = 'remote-private-content'; input.name = 'Mutated'; input.apiKey = 'mutated'; input.senderId = 99; a.subject = 'Mutated'; }, fetcher: async (_url: string | URL | Request, init?: RequestInit) => {
    assert.equal(new Headers(init?.headers).get('api-key'), SECRET);
    if (init?.method === 'POST') assert.equal(init.body, JSON.stringify({ name: 'Fixture', sender: {id: 7}, subject: 'Fixture subject', htmlContent: originalHtml }));
    return json(metadata(), init?.method === 'POST' ? 201 : 200);
  } };
  const r = await createAndInspectBrevoDraft(input); assert.equal(r.code, 'EXPORT_MANAGEMENT_LINK_UNVERIFIED');
});

test('marker failure exposes fixed error and performs no fetch', async () => {
  const a = await artifact(); let calls = 0;
  await assert.rejects(() => createAndInspectBrevoDraft({ ...options(a), markSubmission: async () => { throw Error(SECRET); }, fetcher: async () => { calls++; return json({ id: Number(ID) }, 201); } }), /^Error: EXPORT_SUBMISSION_MARKER_FAILED$/);
  assert.equal(calls, 0);
});

test('only positive safe integer numeric IDs are trusted and normalized to decimal strings', async () => {
 const a = await artifact();
 for(const id of [null, 0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1, '42', '', {}, []]) {
  let calls = 0; const r = await createAndInspectBrevoDraft({...options(a), persistRemoteId: async () => assert.fail('untrusted ID'), fetcher: async () => {calls++; return json({id}, 201);}});
  assert.equal(r.state, 'outcome_unknown'); assert.equal(r.remote_id, null); assert.equal(calls, 1); assertPrivate(r);
 }
});

test('known ID survives persistence failure; no GET follows', async () => {
  const a = await artifact(); let calls = 0;
  const r = await createAndInspectBrevoDraft({ ...options(a), persistRemoteId: async () => { throw Error(SECRET); }, fetcher: async () => { calls++; return json({ id: Number(ID) }, 201); } });
  assert.equal(calls, 1); assert.equal(r.code, 'EXPORT_RECEIPT_PERSISTENCE_FAILED'); assert.equal(r.remote_id, ID); assert.equal(r.resource_url, RESOURCE); assertPrivate(r);
});

for (const [field, value] of [['id', 43], ['id', '42'], ['name', 'Renamed'], ['name', null], ['subject', 'Changed'], ['sender', {id: 8}], ['htmlContent', 'Changed content'], ['status', 'sent'], ['type', 'trigger'], ['modifiedAt', 'bad'], ['testSent', true], ['recipients', {exclusionLists: [], lists: [1]}], ['scheduledAt', null], ['abTesting', true], ['sendAtBestTime', true]] as const) {
  test(`GET mismatch in ${field} retains ID and unverified result`, async () => {
    const a = await artifact(); let calls = 0;
    const r = await createAndInspectBrevoDraft({ ...options(a), fetcher: async () => json(++calls === 1 ? { id: Number(ID) } : { ...metadata(), [field]: value }, calls === 1 ? 201 : 200) });
    assert.equal(r.code, 'EXPORT_READBACK_MISMATCH'); assert.equal(r.remote_id, ID); assert.equal(r.content_verified, false); assert.equal(calls, 2);
  });
}

test('lost/malformed/undocumented successful/timeout/server create outcomes remain unknown with no retry', async () => {
  const a = await artifact();
  for (const kind of ['network', 'malformed', 'missing-id', 'array', '200', '202', '204', '301', '302', '307', '408', '500', '503']) {
    let calls = 0;
    const r = await createAndInspectBrevoDraft({ ...options(a), fetcher: async () => {
      calls++; if (kind === 'network') throw Error(SECRET);
      if (kind === 'malformed') return new Response('provider-private-error', { status: 201 });
      if (kind === '204') return new Response(null, { status: 204 });
      return json(kind === 'missing-id' ? {} : kind === 'array' ? [{ id: Number(ID) }] : { id: Number(ID), detail: SECRET }, ['missing-id', 'array'].includes(kind) ? 201 : Number(kind));
    } });
    assert.equal(calls, 1); assert.equal(r.state, 'outcome_unknown'); assert.equal(r.remote_id, null); assertPrivate(r);
  }
});

test('fixed auth/permission/entitlement/version/size/rate/validation codes sanitize provider errors', async () => {
  const a = await artifact();
  for (const [status, code] of [[401, 'EXPORT_GRANT_EXPIRED'], [403, 'EXPORT_PERMISSION_DENIED'], [402, 'EXPORT_ACCOUNT_ENTITLEMENT_REQUIRED'], [410, 'EXPORT_API_VERSION_RETIRED'], [413, 'EXPORT_IMPORT_BODY_TOO_LARGE'], [429, 'EXPORT_RATE_LIMITED'], [422, 'EXPORT_PROVIDER_REJECTED']] as const) {
    let calls = 0;
    const r = await createAndInspectBrevoDraft({ ...options(a), fetcher: async () => { calls++; return json({ detail: SECRET }, status, { 'retry-after': '12' }); } });
    assert.equal(calls, 1); assert.equal(r.code, code); assert.equal(r.state, 'needs_attention'); assert.equal(r.retry_after, status === 429 ? 12 : undefined); assertPrivate(r);
  }
});

test('retry-after is bounded integer seconds only on 429', async () => {
  const a = await artifact();
  for (const [raw, expected] of [['99999', 86400], ['0', 0], ['-1', undefined], ['1.5', undefined], [SECRET, undefined], ['999999999999', undefined], ['Wed, 21 Oct 2026 07:28:00 GMT', undefined]] as const) {
    const r = await createAndInspectBrevoDraft({ ...options(a), fetcher: async () => new Response(SECRET, { status: 429, headers: { 'retry-after': raw } }) });
    assert.equal(r.retry_after, expected); assertPrivate(r);
  }
});

for (const phase of ['create', 'read'] as const) {
  test(`${phase} response must bind fixed origin/exact path and refuse redirect/userinfo/query/fragment`, async () => {
    const a = await artifact(), expectedUrl = phase === 'create' ? IMPORT : RESOURCE;
    for (const kind of ['foreign', 'other-path', 'userinfo', 'query', 'fragment', 'redirect']) {
      let calls = 0;
      const r = await createAndInspectBrevoDraft({ ...options(a), fetcher: async () => {
        if (++calls === 1 && phase === 'read') return json({ id: Number(ID) }, 201);
        const response = json(metadata(), phase === 'create' ? 201 : 200);
        if (kind === 'redirect') Object.defineProperty(response, 'redirected', { value: true });
        else withUrl(response, kind === 'foreign' ? 'https://evil.test/' + SECRET : kind === 'other-path' ? 'https://api.brevo.com/v3/other' : kind === 'userinfo' ? expectedUrl.replace('https://', 'https://secret@') : expectedUrl + (kind === 'query' ? '?secret=' + SECRET : '#fragment'));
        return response;
      } });
      assert.equal(calls, phase === 'create' ? 1 : 2); assert.equal(r.state, phase === 'create' ? 'outcome_unknown' : 'needs_attention'); assert.equal(r.remote_id, phase === 'create' ? null : ID); assertPrivate(r);
    }
    let calls = 0;
    const r = await createAndInspectBrevoDraft({ ...options(a), fetcher: async () => { calls++; return withUrl(json(metadata(), calls === 1 ? 201 : 200), calls === 1 ? IMPORT : RESOURCE); } });
    assert.equal(r.code, 'EXPORT_MANAGEMENT_LINK_UNVERIFIED');
  });
}

test('known ID survives every readback status/network/malformed/size failure with sanitized result', async () => {
  const a = await artifact();
  for (const kind of ['network', 'malformed', 'missing-body', 'size', '201', '401', '403', '404', '408', '429', '503']) {
    let calls = 0;
    const r = await createAndInspectBrevoDraft({ ...options(a), fetcher: async () => {
      if (++calls === 1) return json({ id: Number(ID) }, 201);
      if (kind === 'network') throw Error(SECRET);
      if (kind === 'malformed') return new Response('provider-private-error');
      if (kind === 'missing-body') return new Response(null);
      if (kind === 'size') return json(metadata(), 200, { 'content-length': String(MAX_RESPONSE + 1) });
      return json({ detail: SECRET }, Number(kind));
    } });
    assert.equal(r.state, 'needs_attention'); assert.equal(r.remote_id, ID); assert.equal(r.resource_url, RESOURCE); assert.equal(r.native_fidelity_verified, false); assertPrivate(r);
  }
});

test('declared/streamed oversized response and invalid declared length cancel before identity trust', async () => {
  const a = await artifact();
  for (const kind of ['declared', 'streamed', 'invalid-length']) {
    let cancelled = 0, reads = 0;
    const body = new ReadableStream<Uint8Array>({ pull(controller) { reads++; controller.enqueue(new Uint8Array(1024 * 1024)); }, cancel() { cancelled++; } });
    const r = await createAndInspectBrevoDraft({ ...options(a), fetcher: async () => new Response(body, { status: 201, headers: kind === 'streamed' ? {} : { 'content-length': kind === 'declared' ? String(MAX_RESPONSE + 1) : SECRET } }) });
    assert.equal(r.state, 'outcome_unknown'); assert.equal(r.remote_id, null); assert.equal(cancelled, 1); assert.ok(reads <= 6); assertPrivate(r);
  }
});

test('5MiB-1 exact declared and observed response boundary accepts, one extra byte refuses', async () => {
  const a = await artifact(), receipt = JSON.stringify({ id: Number(ID) });
  for (const declared of [false, true]) for (const extra of [0, 1]) {
    const body = receipt + ' '.repeat(MAX_RESPONSE - Buffer.byteLength(receipt) + extra); let calls = 0;
    const r = await createAndInspectBrevoDraft({ ...options(a), fetcher: async () => ++calls === 1 ? new Response(body, { status: 201, headers: declared ? { 'content-length': String(Buffer.byteLength(body)) } : {} }) : json(metadata()) });
    assert.equal(calls, extra ? 1 : 2); assert.equal(r.remote_id, extra ? null : ID); assert.equal(r.content_verified, !extra);
  }
});

test('pre-abort causes zero IO; post-marker abort is uncertain; post-ID abort retains known ID without GET', async () => {
  const a = await artifact();
  for (const when of ['before', 'marker', 'persist']) {
    const controller = new AbortController(); let marked = 0, calls = 0;
    if (when === 'before') controller.abort();
    const r = await createAndInspectBrevoDraft({ ...options(a), signal: controller.signal,
      markSubmission: async () => { marked++; if (when === 'marker') controller.abort(); },
      persistRemoteId: async () => { if (when === 'persist') controller.abort(); },
      fetcher: async () => { calls++; return json({ id: Number(ID) }, 201); },
    });
    assert.equal(marked, when === 'before' ? 0 : 1); assert.equal(calls, when === 'persist' ? 1 : 0); assert.equal(r.remote_id, when === 'persist' ? ID : null); assert.equal(r.content_verified, false);
    assert.equal(r.state, when === 'marker' ? 'outcome_unknown' : 'needs_attention');
  }
});

test('abort races stalled streams and signal-ignoring fetches in both phases, retaining known ID', async () => {
  const a = await artifact();
  for (const phase of ['create', 'read']) for (const kind of ['stream', 'fetch']) {
    const controller = new AbortController(); let calls = 0, cancelled = 0;
    const r = await createAndInspectBrevoDraft({ ...options(a), signal: controller.signal, fetcher: async () => {
      if (++calls === 1 && phase === 'read') return json({ id: Number(ID) }, 201);
      setTimeout(() => controller.abort(), 5);
      if (kind === 'fetch') return new Promise<Response>(() => {});
      return new Response(new ReadableStream({ cancel() { cancelled++; } }), { status: phase === 'create' ? 201 : 200 });
    } });
    assert.equal(r.remote_id, phase === 'read' ? ID : null); assert.equal(r.content_verified, false); assert.equal(cancelled, kind === 'stream' ? 1 : 0); assertPrivate(r);
  }
});

test('signal-ignoring late fetch response is discarded after bounded sanitized result', async () => {
  const a = await artifact(), controller = new AbortController(); let cancelled = 0, resolve!: (response: Response) => void;
  const pending = createAndInspectBrevoDraft({ ...options(a), signal: controller.signal, fetcher: async () => { queueMicrotask(() => controller.abort()); return new Promise<Response>(r => { resolve = r; }); } });
  const r = await pending; assert.equal(r.state, 'outcome_unknown'); assertPrivate(r);
  resolve(new Response(new ReadableStream({ cancel() { cancelled++; throw Error(SECRET); } }), { status: 201 }));
  await new Promise<void>(r => setImmediate(r)); assert.equal(cancelled, 1);
});

test('one 30 second budget is shared by POST and GET, including signal-ignoring readback', async t => {
  const a = await artifact(), delays: number[] = [], nativeTimeout = globalThis.setTimeout;
  t.mock.method(globalThis, 'setTimeout', (callback: () => void, delay: number) => { delays.push(delay); return nativeTimeout(callback, 1); });
  for (const phase of ['create', 'read']) {
    let calls = 0;
    const r = await createAndInspectBrevoDraft({ ...options(a), fetcher: async () => ++calls === 1 && phase === 'read' ? json({ id: Number(ID) }, 201) : new Promise<Response>(() => {}) });
    assert.equal(r.state, phase === 'read' ? 'needs_attention' : 'outcome_unknown'); assert.equal(r.remote_id, phase === 'read' ? ID : null);
  }
  assert.deepEqual(delays, [30000, 30000]);
});


test('bounded400 duplicate/processing/sent ambiguity is unknown; documented rejections are sanitized', async () => {
 const a = await artifact();
 const cases = [
  ['duplicate_request', 'outcome_unknown', 'EXPORT_OUTCOME_UNKNOWN'], ['Request already processed', 'outcome_unknown', 'EXPORT_OUTCOME_UNKNOWN'], ['campaign_processing', 'outcome_unknown', 'EXPORT_OUTCOME_UNKNOWN'], ['campaign_sent', 'outcome_unknown', 'EXPORT_OUTCOME_UNKNOWN'],
  ['unauthorized', 'needs_attention', 'EXPORT_GRANT_EXPIRED'], ['api-key not found', 'needs_attention', 'EXPORT_GRANT_EXPIRED'], ['Authentication failed', 'needs_attention', 'EXPORT_GRANT_EXPIRED'], ['permission_denied', 'needs_attention', 'EXPORT_PERMISSION_DENIED'], ['not_enough_credits', 'needs_attention', 'EXPORT_ACCOUNT_ENTITLEMENT_REQUIRED'], ['Insufficient credits', 'needs_attention', 'EXPORT_ACCOUNT_ENTITLEMENT_REQUIRED'], ['account_under_validation', 'needs_attention', 'EXPORT_ACCOUNT_ENTITLEMENT_REQUIRED'],
  ['invalid_parameter', 'needs_attention', 'EXPORT_PROVIDER_REJECTED'], ['missing_parameter', 'needs_attention', 'EXPORT_PROVIDER_REJECTED'], ['unknown', 'outcome_unknown', 'EXPORT_OUTCOME_UNKNOWN'],
 ];
 for(const [code, state, expected] of cases) {let calls = 0; const r = await createAndInspectBrevoDraft({...options(a), fetcher: async () => {calls++; return json({code, message: SECRET}, 400);}}); assert.equal(calls, 1); assert.equal(r.state, state); assert.equal(r.code, expected); assertPrivate(r);}
 for(const response of [new Response(SECRET, {status: 400}), json({message: 'Request already processed'}, 400), json({code: 'invalid_parameter', message: 'Request already processed'}, 400), json({code: 'invalid_parameter', message: SECRET}, 400, {'content-length': String(MAX_RESPONSE + 1)})]) {
  const r = await createAndInspectBrevoDraft({...options(a), fetcher: async () => response}); assert.equal(r.state, 'outcome_unknown'); assertPrivate(r);
 }
});

test('safe GET requires documented empty recipient shape and fully valid time; never returns provider content', async () => {
 const a = await artifact();
 const unsafe = [
  {recipients: null}, {recipients: {}}, {recipients: {lists: []}}, {recipients: {lists: [], exclusionLists: [], unknown: []}}, {recipients: {lists: [], exclusionLists: [], segments: [1]}}, {recipients: {lists: [], exclusionLists: [], excludedSegments: null}},
  {scheduledAt: '2026-10-04T12:00:00.000Z'}, {scheduledAt: false}, {abTesting: null}, {sendAtBestTime: null}, {testSent: undefined}, {modifiedAt: '2026-02-30T12:00:00.000Z'}, {modifiedAt: '2026-10-03'}, {htmlContent: a.html + '\n'}, {sender: {id: '7'}},
 ];
 for(const change of unsafe) {let calls = 0; const r = await createAndInspectBrevoDraft({...options(a), fetcher: async () => json(++calls === 1 ? {id: Number(ID)} : {...metadata(), ...change}, calls === 1 ? 201 : 200)}); assert.equal(r.remote_id, ID); assert.equal(r.content_verified, false); assert.equal(r.native_fidelity_verified, false); assert.equal(r.readback_html_sha256, null); assert.equal(r.remote_modified_at, null); assertPrivate(r);}
 let calls = 0; const r = await createAndInspectBrevoDraft({...options(a), fetcher: async () => json(++calls === 1 ? {id: Number(ID)} : {...metadata(), recipients: {lists: [], exclusionLists: [], segments: [], excludedSegments: []}, scheduledAt: '', abTesting: false, sendAtBestTime: false, shareLink: 'https://evil.test/' + SECRET}, calls === 1 ? 201 : 200)}); assert.equal(r.content_verified, true); assert.equal(r.destination_url, null); assertPrivate(r);
});


test('real frozen compiler artifact binds exact subject, HTML, sender and readback digest', async () => {
 const spec = blankSpec(randomUUID(), 'Fixture'); spec.subject = '  Frozen subject 😀  ';
 spec.sections = spec.sections.map(b => b.type === 'legal_footer' ? {...b, address: '123 Fixture Road'} : b.type === 'button' ? {...b, href: 'https://example.org/offer'} : b);
 const compiled = await compileEmail(spec), a = await compileBrevoArtifact({id: randomUUID(), spec, manifest: compiled.manifest, html: compiled.html, plaintext: compiled.text, artifact_hash: compiled.hash});
 let calls = 0; const r = await createAndInspectBrevoDraft({...options(a), fetcher: async (_url, init) => {calls++; if(calls === 1) {assert.deepEqual(JSON.parse(init?.body as string), {name: 'Fixture', sender: {id: 7}, subject: spec.subject, htmlContent: a.html}); return json({id: Number(ID)}, 201);} return json({...metadata(), htmlContent: a.html, subject: a.subject});}});
 assert.equal(calls, 2); assert.equal(r.content_verified, true); assert.equal(r.readback_html_sha256, a.html_sha256); assert.equal(r.native_fidelity_verified, false);
});

test('exclusive HTML limit counts UTF8 bytes while quoted JSON and trimmed names remain admissible', async () => {
 const a = await artifact(), html = '"'.repeat(BREVO_HTML_LIMIT - 1), name = ' '.repeat(10) + 'x'.repeat(255) + ' '.repeat(10);
 const sized = rehash({...a, html}); let calls = 0;
 const r = await createAndInspectBrevoDraft({...options(sized), name, fetcher: async (_url, init) => {calls++; if(calls === 1) {assert.ok(Buffer.byteLength(init?.body as string) > BREVO_HTML_LIMIT); return json({id: Number(ID)}, 201);} return json({...metadata(), name: name.trim(), htmlContent: html});}});
 assert.equal(r.content_verified, true); assert.equal(calls, 2);
 for(const value of ['😀'.repeat(250000), 'é'.repeat(500000)]) {let marked = 0; await assert.rejects(() => createAndInspectBrevoDraft({...options(rehash({...a, html: value})), markSubmission: async () => {marked++;}}), /^Error: EXPORT_ARTIFACT_INVALID$/); assert.equal(marked, 0);}
});

test('validated callback/fetch/signal dependencies survive marker mutation', async () => {
 const a = await artifact(), controller = new AbortController(); let calls = 0, persisted = 0;
 const input = {...options(a), signal: controller.signal, persistRemoteId: async (id: string) => {assert.equal(id, ID); persisted++;}, fetcher: async (_url: string | URL | Request, init?: RequestInit) => {calls++; return json(init?.method === 'POST' ? {id: Number(ID)} : metadata(), init?.method === 'POST' ? 201 : 200);}, markSubmission: async () => {input.fetcher = async () => {throw Error(SECRET);}; input.persistRemoteId = async () => {throw Error(SECRET);}; input.signal = AbortSignal.abort();}};
 const r = await createAndInspectBrevoDraft(input); assert.equal(r.content_verified, true); assert.equal(calls, 2); assert.equal(persisted, 1);
});

test('bounded400 stream refusal cancels without treating rejected request as safe retry', async () => {
 const a = await artifact(); let cancelled = 0;
 const r = await createAndInspectBrevoDraft({...options(a), fetcher: async () => new Response(new ReadableStream<Uint8Array>({pull(c) {c.enqueue(new Uint8Array(1024 * 1024));}, cancel() {cancelled++;}}), {status: 400})});
 assert.equal(r.state, 'outcome_unknown'); assert.equal(r.remote_id, null); assert.equal(cancelled, 1); assertPrivate(r);
});


test('already processed400 message with contextual text stays uncertain despite validation code', async () => {
 const a = await artifact(); let calls = 0;
 const r = await createAndInspectBrevoDraft({...options(a), fetcher: async () => {calls++; return json({code: 'invalid_parameter', message: 'Request already processed: provider-private-error'}, 400);}});
 assert.equal(calls, 1); assert.equal(r.state, 'outcome_unknown'); assert.equal(r.remote_id, null); assertPrivate(r);
});
