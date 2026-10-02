import test from 'node:test';
import assert from 'node:assert/strict';
import {LettercapeClient,LettercapeError} from '../sdk/client';
const id='11111111-1111-4111-8111-111111111111';
test('source SDK sends exact inert UTF8, keeps original command on loss and never retries',async()=>{
  const source='\uFEFF<!-- authored -->\r\n<p>e\u0301 😀</p>\r<script>inert()</script>\n',key='source-command-1';
  let calls=0;
  const client=new LettercapeClient({baseUrl:'https://example.test',fetch:async request=>{
    calls++;
    assert.equal(request.method,'POST');
    assert.equal(request.headers.get('Content-Type'),'text/plain; charset=utf-8');
    assert.equal(request.headers.get('Idempotency-Key'),key);
    assert.equal(request.headers.get('If-Match'),'"draft-3"');
    assert.equal(request.headers.get('X-Actor-Id'),'actor-1');
    assert.deepEqual(new Uint8Array(await request.arrayBuffer()),new TextEncoder().encode(source));
    throw new TypeError('Lost response');
  }});
  const command={path:{id},body:source,idempotencyKey:key,ifMatch:'"draft-3"',actorId:'actor-1'};
  await assert.rejects(client.call('importEmailSource',command),error=>error instanceof LettercapeError&&error.idempotencyKey===key&&error.code==='TRANSPORT_UNCERTAIN');
  assert.equal(calls,1);
  await assert.rejects(client.call('importEmailSource',command));
  assert.equal(calls,2,'recovery is explicit and retains the same command');
});
test('source SDK rejects invalid text/oversize and missing recovery headers before fetch',async()=>{
  let calls=0;
  const client=new LettercapeClient({baseUrl:'https://example.test',fetch:async()=>{calls++;throw Error('must not fetch');}});
  const command={path:{id},idempotencyKey:'source-command-2',ifMatch:'"draft-1"'};
  for(const body of ['\uD800','\u0000','é'.repeat(1048577)])await assert.rejects(client.call('importEmailSource',{...command,body}),/UTF.?8|2 MiB/);
  // @ts-expect-error new source methods require an explicit durable command key
  await assert.rejects(client.call('importEmailSource',{path:{id},body:'',ifMatch:'"draft-1"'}),/command key/);
  // @ts-expect-error exact fork requires the original acknowledged CAS version
  await assert.rejects(client.call('forkEmailSource',{path:{id},body:{expected_artifact_hash:'a'.repeat(64)},idempotencyKey:'source-command-3'}),/If-Match/);
  assert.equal(calls,0);
});
test('source SDK accepts empty and exact two MiB UTF8 boundaries and preserves deferred command failures',async()=>{
  const sizes:number[]=[];
  const client=new LettercapeClient({baseUrl:'https://example.test',fetch:async request=>{
    sizes.push((await request.arrayBuffer()).byteLength);
    return new Response(JSON.stringify({request_id:'source-busy',error:{code:'SOURCE_ADMISSION_BUSY',message:'Retry explicitly',retryable:true}}),{status:429,headers:{'Retry-After':'1'}});
  }});
  for(const body of ['', 'é'.repeat(1048576)])await assert.rejects(client.call('importEmailSource',{path:{id},body,idempotencyKey:'source-boundary',ifMatch:'"draft-1"'}),error=>error instanceof LettercapeError&&error.idempotencyKey==='source-boundary'&&error.requestId==='source-busy'&&error.status===429);
  assert.deepEqual(sizes,[0,2097152],'even retryable429 is never automatically retried for source writes');
});
test('initial legacy source save retains a recoverable generated command without automatic retry',async()=>{
  let key:string|null=null,calls=0;
  const client=new LettercapeClient({baseUrl:'https://example.test',fetch:async request=>{calls++;key=request.headers.get('Idempotency-Key');throw new TypeError('lost');}});
  await assert.rejects(client.call('importHtml',{path:{id},body:{html:'<p>Exact</p>'},ifMatch:'"draft-1"'}),error=>error instanceof LettercapeError&&!!key&&error.idempotencyKey===key);
  assert.equal(calls,1);
});
test('source downloads retain attachment bytes and source evidence headers',async()=>{
  const bytes=new TextEncoder().encode('\uFEFF<!-- stored -->\r\n<script>inert()</script>');
  const client=new LettercapeClient({baseUrl:'https://example.test',fetch:async request=>{
    assert.equal(new URL(request.url).searchParams.get('format'),'source');
    return new Response(bytes,{headers:{'Content-Type':'text/plain; charset=utf-8','Content-Disposition':'attachment; filename="email-v1.source.html.txt"','X-Content-Type-Options':'nosniff','Cache-Control':'no-store','X-Source-SHA256':'a'.repeat(64),'X-Source-Profile':'exact-utf8-1','X-Request-Id':'source-download'}});
  }});
  const result=await client.call('downloadRevision',{path:{id},query:{format:'source'}});
  assert.deepEqual(result.data,bytes);
  assert.equal(result.headers.get('X-Source-Profile'),'exact-utf8-1');
  assert.equal(result.headers.get('X-Source-SHA256'),'a'.repeat(64));
  assert.equal(result.requestId,'source-download');
});
