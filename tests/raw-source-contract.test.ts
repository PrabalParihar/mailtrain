import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {build} from 'esbuild';
import * as values from '../src/domain/email-source-values';
import * as digest from '../src/domain/email-source-digest';
import * as contracts from '../src/domain/email-source-contracts';

test('exact UTF8 source retains BOM, mixed EOL, supplementary and combining characters',()=>{
  assert.ok(values,'source values must exist');assert.ok(digest,'source digests must exist');
  const source='\uFEFF<P>A &amp; B</P>\r\n<!-- note -->\n😀e\u0301\r';
  const bytes=values.rawSourceBytes(source);
  assert.deepEqual(bytes,new Uint8Array(readFileSync(new URL('./fixtures/raw-source/exact-utf8.html.txt',import.meta.url))));
  assert.deepEqual(bytes,new TextEncoder().encode(source));
  assert.equal(values.decodeRawSource(bytes),source);
  assert.deepEqual(digest.validateRawSource(source),{bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')});
  assert.notEqual(digest.validateRawSource('e\u0301').sha256,digest.validateRawSource('é').sha256);
  assert.deepEqual(digest.validateRawSource(''),{bytes:0,sha256:createHash('sha256').update('').digest('hex')});
});
test('raw source bounds count actual UTF8 bytes and reject unrepresentable input without replacement',()=>{
  assert.ok(values);
  assert.equal(values.MAX_RAW_SOURCE_BYTES,2097152);assert.equal(values.MAX_SOURCE_METADATA_BYTES,1048576);
  assert.equal(values.MAX_SOURCE_COMMAND_JSON_BYTES,13697024);
  assert.equal(values.rawSourceBytes('a'.repeat(2097152)).length,2097152);
  for(const source of ['a'.repeat(2097153),'😀'.repeat(524289),'\u0000','\uD800','\uDC00','x\uD800y'])assert.throws(()=>values.rawSourceBytes(source));
  for(const bytes of [Uint8Array.of(0xC3,0x28),Uint8Array.of(0xED,0xA0,0x80),Uint8Array.of(0),new Uint8Array(2097153)])assert.throws(()=>values.decodeRawSource(bytes));
});
test('canonical spec identity orders own JSON keys and retains exact string and array values',()=>{
  assert.ok(values);assert.ok(digest);
  const a={z:['\r\n','é','e\u0301'],a:{b:2,a:'\uFEFF'}},b={a:{a:'\uFEFF',b:2},z:['\r\n','é','e\u0301']};
  assert.equal(values.canonicalSpecString(a),values.canonicalSpecString(b));
  assert.equal(digest.canonicalSpecHash(a),digest.canonicalSpecHash(b));
  assert.notEqual(digest.canonicalSpecHash(a),digest.canonicalSpecHash({...a,z:['\n','é','e\u0301']}));
  assert.equal(values.canonicalSpecString(JSON.parse('{"__proto__":{"safe":true},"constructor":1}')),'{"__proto__":{"safe":true},"constructor":1}');
});
test('canonical values reject coercion, accessors, unsupported JSON and cycles without executing getters',()=>{
  assert.ok(values);let calls=0;
  const getter=Object.defineProperty({},'x',{get(){calls++;return 1;},enumerable:true});
  const coercion={toJSON(){calls++;return 1;}};const cycle:Record<string,unknown>={};cycle.self=cycle;
  for(const value of [undefined,NaN,Infinity,BigInt(1),{x:undefined},{x:()=>1},new Date(),Object.create({x:1}),getter,coercion,cycle,[,1],{x:Symbol('x')}])assert.throws(()=>values.canonicalSpecString(value));
  assert.equal(calls,0);
});
test('non-source metadata retains its separate finite budget',()=>{
  assert.ok(values);
  const source='x'.repeat(2097152);
  assert.deepEqual(values.validateSourceMetadata({raw_html:source,title:'x'}),{bytes:13});
  assert.throws(()=>values.validateSourceMetadata({raw_html:'',title:'x'.repeat(1048576)}));
  assert.throws(()=>values.validateSourceMetadata(Object.defineProperty({},'raw_html',{get(){throw Error('must not run');},enumerable:true})));
});
test('strict receipts bind version increment, exact source evidence and supported profiles',()=>{
  assert.ok(contracts);
  const uuid='11111111-1111-4111-8111-111111111111',hash='a'.repeat(64);
  const receipt={receipt_version:1,workspace_id:uuid,email_id:uuid,request_base_version:3,saved_doc_version:4,command_id:'command-1',spec_hash:hash,source:{profile:'exact-utf8-1',sha256:hash,bytes:0}};
  assert.equal(contracts.SaveReceiptSchema.safeParse(receipt).success,true);
  for(const patch of [{saved_doc_version:3},{saved_doc_version:5},{request_base_version:0},{source:{...receipt.source,profile:'provider-ready'}},{source:{...receipt.source,bytes:2097153}},{secret:'forged'}])assert.equal(contracts.SaveReceiptSchema.safeParse({...receipt,...patch}).success,false);
  assert.equal(contracts.SourceProfileSchema.safeParse('legacy-stored-1').success,true);
});
test('projection contracts enforce UTF8 output limits rather than character count',()=>{
  assert.ok(contracts);const hash='a'.repeat(64);
  const projection={source_hash:hash,source_bytes:0,browser_profile:'raw-browser-1',browser_html:'',browser_hash:hash,email_profile:'raw-email-2',email_html:'界'.repeat(1398102),email_hash:hash,delivery_status:'eligible_for_checks',diagnostics:[],omitted_diagnostics:0};
  assert.equal(contracts.RawProjectionSchema.safeParse(projection).success,false);
});
test('browser source contracts and values bundle without Node runtime dependencies',async()=>{
  const result=await build({entryPoints:['src/domain/email-source-values.ts','src/domain/email-source-contracts.ts'],outdir:'/tmp/lettercape-source-contract-browser-unused',bundle:true,platform:'browser',write:false,metafile:true,logLevel:'silent'});
  assert.equal(result.outputFiles.length,2);
  assert.equal(Object.keys(result.metafile!.inputs).some(name=>name.startsWith('node:')),false);
});
