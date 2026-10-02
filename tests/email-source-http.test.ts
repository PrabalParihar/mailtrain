import test from'node:test';import assert from'node:assert/strict';
import{createServer}from'node:http';import{Readable}from'node:stream';import{once}from'node:events';
import{readEmailSourceText,readEmailSourceJson}from'../src/server/email-source-body';
const request=(bytes:Uint8Array,type='text/plain; charset=utf-8',extra:Record<string,string>={})=>new Request('http://localhost/v1/emails/id/source-import',{method:'POST',headers:{'content-type':type,...extra},body:bytes as BodyInit});
test('text source reader retains BOM and mixed endings at exact actual UTF8 boundary',async()=>{
 const source='\ufeffx\r\n\n\r☃';assert.equal(await readEmailSourceText(request(Buffer.from(source))),source);
 assert.equal((await readEmailSourceText(request(Buffer.alloc(2*1024*1024,65)))).length,2*1024*1024);
 await assert.rejects(readEmailSourceText(request(Buffer.alloc(2*1024*1024+1,65))),{status:413});
 await assert.rejects(readEmailSourceText(request(Buffer.from([0xc0,0x80]))),{code:'RAW_SOURCE_ENCODING_INVALID'});
 await assert.rejects(readEmailSourceText(request(Buffer.from('x'),'text/html')),{status:415});
 await assert.rejects(readEmailSourceText(request(Buffer.from('x'),'text/plain;charset=latin1')),{status:415});
 await assert.rejects(readEmailSourceText(request(Buffer.from('x'),'text/plain',{'content-encoding':'gzip'})),{status:415});
 await assert.rejects(readEmailSourceText(request(Buffer.from('xyz'),'text/plain',{'content-length':'1'})),{code:'SOURCE_LENGTH_MISMATCH'});
});
test('actual loopback chunked HTTP reads exact inert source without JSON or replacement decoding',async()=>{
 const source='\ufeff<!--literal-->\r\n<script>globalThis.__sourceExecuted=true</script><p>☃</p>\r';
 const server=createServer(async(req,res)=>{try{const request=new Request('http://localhost/source-import',{method:'POST',headers:req.headers as Record<string,string>,body:Readable.toWeb(req) as ReadableStream,duplex:'half'} as RequestInit);const actual=await readEmailSourceText(request);res.setHeader('content-type','text/plain; charset=utf-8');res.end(Buffer.from(actual));}catch(error){res.statusCode=(error as{status?:number}).status??500;res.end('rejected');}});
 server.listen(0,'127.0.0.1');await once(server,'listening');
 try{const address=server.address();assert.ok(address&&typeof address==='object');const chunks=new ReadableStream<Uint8Array>({start(c){for(const chunk of [source.slice(0,12),source.slice(12)])c.enqueue(Buffer.from(chunk));c.close();}});const response=await fetch(`http://127.0.0.1:${address.port}/source-import`,{method:'POST',headers:{'content-type':'text/plain; charset=utf-8'},body:chunks,duplex:'half'} as RequestInit);assert.equal(response.status,200);assert.deepEqual(Buffer.from(await response.arrayBuffer()),Buffer.from(source));assert.equal((globalThis as{__sourceExecuted?:unknown}).__sourceExecuted,undefined);}finally{server.closeAllConnections();await new Promise<void>((resolve,reject)=>server.close(e=>e?reject(e):resolve()));}
});
test('interrupted source stream releases admission and aborts before an accepted body',async()=>{
 const controller=new AbortController();const stream=new ReadableStream<Uint8Array>({start(c){c.enqueue(Buffer.from('partial'));}});
 const reading=readEmailSourceText(new Request('http://localhost/source-import',{method:'POST',headers:{'content-type':'text/plain'},body:stream,signal:controller.signal,duplex:'half'}as RequestInit));controller.abort();await assert.rejects(reading,{code:'SOURCE_TRANSFER_ABORTED'});assert.equal(await readEmailSourceText(request(Buffer.from('after'))),'after');
});
test('source JSON transport permits escaped source, rejects invalid encoding and oversized canonical source',async()=>{
 const raw_html='\u0001'.repeat(2*1024*1024),body=Buffer.from(JSON.stringify({spec:{editing_mode:'raw_html',raw_html}}));assert.ok(body.length>12*1024*1024);
 assert.equal((await readEmailSourceJson(request(body,'application/json'))).spec!==undefined,true);
 await assert.rejects(readEmailSourceJson(request(Buffer.from('{"spec":{"raw_html":"\\ud800"}}'),'application/json')),{code:'RAW_SOURCE_ENCODING_INVALID'});
 await assert.rejects(readEmailSourceJson(request(Buffer.from(JSON.stringify({spec:{raw_html:'☃'.repeat(800000)}})),'application/json')),{status:413});
 await assert.rejects(readEmailSourceJson(request(Buffer.from([0xff]),'application/json')),{code:'RAW_SOURCE_ENCODING_INVALID'});
});

test('source CAS accepts established exact header forms and rejects unmatched quotes',async()=>{const {sourceExpectedVersion}=await import('../src/server/email-source-route');for(const header of ['1','draft-1','\"1\"','\"draft-1\"'])assert.equal(sourceExpectedVersion(new Request('http://localhost/source',{headers:{'if-match':header}})),1);for(const header of ['0','draft-0','1\"','\"1','draft-1\"','W/\"draft-1\"'])assert.throws(()=>sourceExpectedVersion(new Request('http://localhost/source',{headers:{'if-match':header}})),{code:'VERSION_REQUIRED'});});
