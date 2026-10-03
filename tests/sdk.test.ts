import test from 'node:test';
import assert from 'node:assert/strict';
import { LettercapeClient, LettercapeError } from '../sdk/client';
const workspace = '11111111-1111-4111-8111-111111111111';
test('SDK sends exact binary upload bytes and token; token PUT loss is explicitly recovered', async () => {
  const bytes = new Uint8Array([0, 255, 137, 80, 78, 71]), token = 'a'.repeat(64);
  let calls = 0;
  const client = new LettercapeClient({ baseUrl:'https://example.test', workspace, fetch:async request => {
    calls++;
    assert.equal(request.method,'PUT');
    assert.equal(request.headers.get('Content-Type'),'application/octet-stream');
    assert.equal(request.headers.get('X-Upload-Token'),token);
    assert.equal(request.headers.get('Idempotency-Key'),null);
    assert.equal(request.redirect,'error');
    assert.deepEqual(new Uint8Array(await request.arrayBuffer()),bytes);
    throw new TypeError('Lost acknowledgment');
  }});
  await assert.rejects(client.call('uploadAssetContent',{path:{uploadId:workspace},body:bytes,uploadToken:token}),/Lost acknowledgment/);
  assert.equal(calls,1);
  await assert.rejects(client.call('uploadAssetContent',{path:{uploadId:workspace},body:new Uint8Array(20971521),uploadToken:token}),/20 MiB/);
  assert.equal(calls,1);
});
test('SDK acknowledges upload commands and returns private derivative bytes with request IDs', async () => {
  const bytes = new Uint8Array([137,80,78,71]);
  const client=new LettercapeClient({baseUrl:'https://example.test',fetch:async request=>{
    if(request.method==='PUT') return reply(202,{request_id:'upload-ack',upload:{id:workspace,status:'finalized'},operation:{id:workspace,state:'queued'},asset_id:workspace});
    assert.equal(request.headers.get('X-Upload-Token'),null);
    return new Response(bytes,{headers:{'Content-Type':'image/png','X-Request-Id':'image-ack','Cache-Control':'private, no-store'}});
  }});
  const transfer=await client.call('uploadAssetContent',{path:{uploadId:workspace},body:bytes,uploadToken:'a'.repeat(64)});
  assert.equal(transfer.data.asset_id,workspace);
  assert.equal(transfer.requestId,'upload-ack');
  const image=await client.call('getAssetVariantContent',{path:{id:workspace,variantId:workspace}});
  assert.deepEqual(image.data,bytes);
  assert.equal(image.requestId,'image-ack');
  assert.equal(image.headers.get('Content-Type'),'image/png');
});
function reply(
  status = 200,
  data: unknown = { request_id: 'req-test', data: [], has_more: false, next_cursor: null },
) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'X-Request-Id': 'req-header' },
  });
}
test('SDK lost command recovery retains key/body and exposes request ID; business errors never retry', async () => {
  const seen: Request[] = [];
  const client = new LettercapeClient({
    baseUrl: 'https://api.example.test',
    workspace,
    apiKey: 'private-fixture',
    wait: async () => {},
    fetch: async (input) => {
      const request = input as Request;
      seen.push(request.clone());
      if (seen.length === 1) throw new TypeError('lost response');
      return reply(201, { request_id: 'ack-1', email: { id: workspace } });
    },
  });
  const result = await client.call('createEmail', {
    body: { title: 'Test' },
    idempotencyKey: 'key-1',
  });
  assert.equal(result.requestId, 'ack-1');
  assert.equal(seen.length, 2);
  assert.equal(seen[0].headers.get('Idempotency-Key'), seen[1].headers.get('Idempotency-Key'));
  assert.equal(await seen[0].text(), await seen[1].text());
  let n = 0;
  const denied = new LettercapeClient({
    baseUrl: 'https://api.example.test',
    workspace,
    fetch: async () => {
      n++;
      return reply(409, {
        request_id: 'deny-1',
        error: { code: 'STATE_CONFLICT', message: 'Reload', retryable: false },
      });
    },
  });
  await assert.rejects(
    denied.call('createEmail', { body: { title: 'Test' } }),
    (e: unknown) =>
      e instanceof LettercapeError && e.requestId === 'deny-1' && e.code === 'STATE_CONFLICT',
  );
  assert.equal(n, 1);
});
test('SDK rate delay, signed pagination and interruption are bounded and keep filters', async () => {
  const urls: string[] = [],
    waits: number[] = [];
  const client = new LettercapeClient({
    baseUrl: 'https://api.example.test',
    workspace,
    wait: async (ms) => {
      waits.push(ms);
    },
    fetch: async (input) => {
      urls.push((input as Request).url);
      if (urls.length === 1)
        return new Response(
          JSON.stringify({ request_id: 'rate', error: { code: 'RATE_LIMITED', message: 'Wait' } }),
          { status: 429, headers: { 'Retry-After': '2', 'Content-Type': 'application/json' } },
        );
      return reply(200, {
        request_id: 'page-' + urls.length,
        data: [{ id: urls.length === 2 ? 'a' : 'b' }],
        has_more: urls.length === 2,
        next_cursor: urls.length === 2 ? 'signed.cursor' : null,
      });
    },
  });
  const ids: string[] = [];
  for await (const page of client.pages('listEmails', { query: { limit: 1 } }))
    ids.push(...page.data.data.map((row) => row.id));
  assert.deepEqual(ids, ['a', 'b']);
  assert.ok(waits[0] >= 2000);
  assert.ok(urls[2].includes('after=signed.cursor') && urls[2].includes('limit=1'));
  const aborted = new AbortController();
  aborted.abort();
  await assert.rejects(client.call('listEmails', { signal: aborted.signal }), {
    name: 'AbortError',
  });
  assert.equal(urls.length, 3);
});
test('SDK refuses insecure credential endpoints, redirects, unkeyed mutation retries and repeated page cursors', async () => {
  assert.throws(
    () => new LettercapeClient({ baseUrl: 'http://remote.example.test', apiKey: 'private' }),
  );
  let calls = 0;
  const client = new LettercapeClient({
    baseUrl: 'https://api.example.test',
    workspace,
    fetch: async (input) => {
      calls++;
      assert.equal((input as Request).redirect, 'error');
      return reply(200, { request_id: 'loop', data: [], has_more: true, next_cursor: 'same' });
    },
  });
  await assert.rejects(async () => {
    for await (const _page of client.pages('listEmails', {})) {
      void _page;
    }
  }, /cursor/i);
  assert.equal(calls, 2);
  const unsafe = new LettercapeClient({
    baseUrl: 'https://api.example.test',
    workspace,
    wait: async () => {},
    fetch: async () => {
      calls++;
      throw new TypeError('lost');
    },
  });
  const prior = calls;
  await assert.rejects(
    unsafe.call('importHtml', {
      path: { id: workspace },
      body: { html: '<p>Test</p>' },
      ifMatch: '"draft-1"',
    }),
  );
  assert.equal(calls, prior + 1);
});
test('SDK exposes uncertain generated command keys and aborts a stalled response stream', async () => {
  const uncertain = new LettercapeClient({
    baseUrl: 'https://api.example.test',
    maxRetries: 0,
    fetch: async () => {
      throw new TypeError('network');
    },
  });
  await assert.rejects(
    uncertain.call('createEmail', { body: { title: 'Uncertain' } }),
    (error: unknown) =>
      error instanceof LettercapeError &&
      typeof error.idempotencyKey === 'string' &&
      error.idempotencyKey.length === 36,
  );
  const signal = new AbortController();
  let cancelled = false;
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(new TextEncoder().encode('{'));
    },
    cancel() {
      cancelled = true;
    },
  });
  const client = new LettercapeClient({
    baseUrl: 'https://api.example.test',
    fetch: async () => new Response(stream, { headers: { 'Content-Type': 'application/json' } }),
  });
  const request = client.call('listEmails', { signal: signal.signal });
  setTimeout(() => signal.abort(), 20);
  await assert.rejects(
    Promise.race([
      request,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Stream did not abort')), 200)),
    ]),
    { name: 'AbortError' },
  );
  assert.equal(cancelled, true);
});
const hubspotSettings={company_name:'Example Company',company_street_address_1:'10 Example Road',company_street_address_2:'',company_city:'Example City',company_state:'Example State',company_zip:'12345',company_country:'Example Country'};
test('HubSpot SDK constructs private unkeyed POST JSON and returns review identity and binary receipt bytes',async()=>{
 const bytes=new TextEncoder().encode('<p>{{ site_settings.company_name|escape_html }}</p>'),hash='a'.repeat(64),seen:string[]=[];
 const client=new LettercapeClient({baseUrl:'https://example.test',workspace,apiKey:'synthetic-key',fetch:async request=>{
  seen.push(request.url);assert.equal(request.method,'POST');assert.equal(new URL(request.url).search,'');assert.equal(request.headers.get('Content-Type'),'application/json');assert.equal(request.headers.get('Idempotency-Key'),null);assert.equal(request.headers.get('X-Workspace-Id'),workspace);assert.equal(request.headers.get('Authorization'),'Bearer synthetic-key');assert.equal(request.headers.get('X-Actor-Id'),'example-actor');
  for(const value of request.headers.values())assert.equal(value.includes('Example Company'),false);
  const input=await request.json();assert.deepEqual(input.settings,hubspotSettings);
  if(request.url.endsWith('/hubspot-review')){assert.deepEqual(input,{settings:hubspotSettings});return reply(200,{request_id:'review-request',review:{destination:'hubspot',destination_hash:hash}});}
  assert.deepEqual(input,{settings:hubspotSettings,format:'html',expected_destination_hash:hash});
  return new Response(bytes,{headers:{'Content-Type':'text/html; charset=utf-8','X-Request-Id':'download-request','X-Artifact-Hash':hash,'X-Source-Artifact-Hash':'b'.repeat(64),'X-Content-SHA256':'c'.repeat(64),'X-Destination-Mapping':'hubspot-coded-footer-1','X-Remote-Export-Enabled':'false'}});
 }});
 const reviewed=await client.call('reviewHubSpotRevision',{path:{id:workspace},actorId:'example-actor',body:{settings:hubspotSettings}});assert.equal(reviewed.requestId,'review-request');assert.equal(reviewed.data.review.destination_hash,hash);
 const downloaded=await client.call('downloadHubSpotRevision',{path:{id:workspace},actorId:'example-actor',body:{settings:hubspotSettings,format:'html',expected_destination_hash:hash}});
 assert.deepEqual(downloaded.data,bytes);assert.equal(downloaded.requestId,'download-request');assert.equal(downloaded.headers.get('X-Artifact-Hash'),hash);assert.equal(downloaded.headers.get('X-Remote-Export-Enabled'),'false');assert.equal(seen.length,2);
});
test('HubSpot SDK does not retry unkeyed POST network loss and respects abort before and during transport',async()=>{
 let calls=0;
 const client=new LettercapeClient({baseUrl:'https://example.test',wait:async()=>assert.fail('must not retry'),fetch:async()=>{calls++;throw new TypeError('synthetic network loss');}}),input={path:{id:workspace},body:{settings:hubspotSettings}};
 await assert.rejects(client.call('reviewHubSpotRevision',input),/synthetic network loss/);assert.equal(calls,1);
 const abort=new AbortController();abort.abort();await assert.rejects(client.call('reviewHubSpotRevision',{...input,signal:abort.signal}),{name:'AbortError'});assert.equal(calls,1);
 const inflight=new AbortController();let aborted=false;
 const waiting=new LettercapeClient({baseUrl:'https://example.test',fetch:async request=>new Promise<Response>((_,reject)=>{request.signal.addEventListener('abort',()=>{aborted=true;reject(request.signal.reason);},{once:true});inflight.abort();})});
 await assert.rejects(waiting.call('reviewHubSpotRevision',{...input,signal:inflight.signal}),{name:'AbortError'});assert.equal(aborted,true);
});
