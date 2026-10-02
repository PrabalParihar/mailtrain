import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import type {EmailSpec} from '../src/domain/email-schema';
import {canonicalSpecString, rawSourceBytes} from '../src/domain/email-source-values';
import type {SavedEmailResponse} from '../src/domain/email-source-contracts';
import type {SourceSaveContext, SourceSaveCommand} from '../src/ui/source-save-command';
const helper=await import('../src/ui/source-save-command').catch(()=>null);
const workspace='11111111-1111-4111-8111-111111111111',email='22222222-2222-4222-8222-222222222222';
const source='\uFEFF<P title="é">e\u0301 &amp; 😀</P>\r\n<!-- keep -->\n<script>inert()</script>\r';
function spec(raw=source):EmailSpec{return {schema_version:'1.0',editing_mode:'raw_html',locale:'en-US',direction:'ltr',subject:'Original',preheader:'',brand_kit_version_id:'brand-1',theme:{content_width_px:600,background:'#ffffff',accent:'#000000',font_stack:'Arial, sans-serif'},sections:[],raw_html:raw};}
function context():SourceSaveContext{return {workspace,actor:'actor-1',email,lifecycle:'mount-1',epoch:7,baseVersion:3,spec:spec()};}
function sha(bytes:string|Uint8Array){return createHash('sha256').update(bytes).digest('hex');}
function receipt(command:SourceSaveCommand):SavedEmailResponse{return {email:{id:email,title:'Stored title',doc_version:4,spec:JSON.parse(canonicalSpecString(command.spec)),raw_source_profile:command.source?.profile??null,updated_at:'2026-10-02T00:00:00.000Z',lineage:null},receipt:{receipt_version:1,workspace_id:workspace,email_id:email,request_base_version:3,saved_doc_version:4,command_id:command.key,spec_hash:sha(canonicalSpecString(command.spec)),source:command.source?{profile:'exact-utf8-1',sha256:sha(rawSourceBytes(command.spec.raw_html!)),bytes:rawSourceBytes(command.spec.raw_html!).length}:null},request_id:'33333333-3333-4333-8333-333333333333'};}

test('exact command is detached, immutable and acknowledges actual full-spec and raw UTF8 bytes',async()=>{
  assert.ok(helper,'source save helper must exist');const live=context(),command=await helper.createSourceSaveCommand(live,'original-command');
  assert.deepEqual(command.source,{profile:'exact-utf8-1',sha256:sha(rawSourceBytes(source)),bytes:rawSourceBytes(source).length});
  assert.equal(command.specHash,sha(canonicalSpecString(live.spec)));assert.equal(Object.isFrozen(command.spec.theme),true);
  live.spec.subject='Later';assert.equal(command.spec.subject,'Original');
  const result=await helper.validateSourceSaveReceipt(command,receipt(command),()=>live);
  assert.equal(result.savedVersion,4);assert.equal(result.acknowledgedSpec.raw_html,source);assert.equal(result.dirty,true);assert.equal(live.spec.subject,'Later');assert.equal(live.baseVersion,3);
});
test('canonical object-key order is accepted without normalizing source and empty raw source is durable',async()=>{
  assert.ok(helper);for(const raw of [source,'']){const live={...context(),spec:spec(raw)},command=await helper.createSourceSaveCommand(live,'same-key'),response=receipt(command);
    response.email.spec=Object.fromEntries(Object.entries(response.email.spec).reverse());
    const result=await helper.validateSourceSaveReceipt(command,response,()=>live);assert.equal(result.dirty,false);assert.equal(result.acknowledgedCanonicalSpec,canonicalSpecString(live.spec));}
});
test('wrong receipt source, spec hash, raw hash, bytes, base, identity, key, profile and shape all refuse acknowledgement',async()=>{
  assert.ok(helper);const live=context(),command=await helper.createSourceSaveCommand(live,'original-command');
  const changes:Array<(r:SavedEmailResponse)=>void>=[r=>{r.email.spec.raw_html=source.replace(/\r\n/g,'\n');},r=>{r.email.spec.subject='Other';},r=>{r.receipt.spec_hash='a'.repeat(64);},r=>{r.receipt.source!.sha256='b'.repeat(64);},r=>{r.receipt.source!.bytes++;},r=>{r.receipt.request_base_version=4;r.receipt.saved_doc_version=5;r.email.doc_version=5;},r=>{r.email.id='44444444-4444-4444-8444-444444444444';r.receipt.email_id=r.email.id;},r=>{r.receipt.workspace_id='55555555-5555-4555-8555-555555555555';},r=>{r.receipt.command_id='other-key';},r=>{r.receipt.source!.profile='legacy-stored-1';},r=>{r.email.raw_source_profile='legacy-stored-1';},r=>{r.receipt.source=null;},r=>{r.email.doc_version=99;}];
  for(const change of changes){const r=receipt(command);change(r);await assert.rejects(()=>helper.validateSourceSaveReceipt(command,r,()=>live));}
  for(const bad of [null,{}, {email:receipt(command).email}, {...receipt(command),success:true},{...receipt(command),email:{...receipt(command).email,secret:'extra'}},{...receipt(command),receipt:{...receipt(command).receipt,unknown:1}}])await assert.rejects(()=>helper.validateSourceSaveReceipt(command,bad,()=>live));
  assert.equal(live.baseVersion,3);assert.equal(live.spec.raw_html,source);
});
test('response spec changed together with internally consistent receipt still cannot acknowledge another command',async()=>{
  assert.ok(helper);const live=context(),command=await helper.createSourceSaveCommand(live,'original-command'),r=receipt(command);r.email.spec.raw_html='<p>Other</p>';r.receipt.spec_hash=sha(canonicalSpecString(r.email.spec));r.receipt.source={profile:'exact-utf8-1',sha256:sha('<p>Other</p>'),bytes:12};
  await assert.rejects(()=>helper.validateSourceSaveReceipt(command,r,()=>live));
});
test('actor, document, workspace, lifecycle, epoch and current base fence a stale receipt',async()=>{
  assert.ok(helper);const live=context(),command=await helper.createSourceSaveCommand(live,'original-command');
  for(const patch of [{actor:'actor-2'},{email:'44444444-4444-4444-8444-444444444444'},{workspace:'55555555-5555-4555-8555-555555555555'},{lifecycle:'mount-2'},{epoch:8},{baseVersion:4}])await assert.rejects(()=>helper.validateSourceSaveReceipt(command,receipt(command),()=>({...live,...patch})));
});
test('context is checked after asynchronous hashes, preserving later edits and rejecting unmounted context',async()=>{
  assert.ok(helper);const command=await helper.createSourceSaveCommand(context(),'original-command');let live=context();const result=helper.validateSourceSaveReceipt(command,receipt(command),()=>live);live={...live,lifecycle:'mount-2'};await assert.rejects(()=>result);
  live=context();const edited=helper.validateSourceSaveReceipt(command,receipt(command),()=>live);live={...live,spec:spec(source+'later')};assert.equal((await edited).dirty,true);assert.equal(live.spec.raw_html,source+'later');
});
test('explicit recovery rebinds lifecycle only after same actor document base and complete current payload proof',async()=>{
  assert.ok(helper);const original=context(),command=await helper.createSourceSaveCommand(original,'original-command'),raw=helper.serializeSourceSaveCommand(command),reloaded={...context(),lifecycle:'mount-2',epoch:0};
  const recovered=await helper.recoverSourceSaveCommand(raw,reloaded);assert.ok(recovered);assert.equal(recovered.key,command.key);assert.equal(recovered.baseVersion,command.baseVersion);assert.deepEqual(recovered.spec,command.spec);assert.equal(recovered.scope.lifecycle,'mount-2');assert.equal(recovered.scope.epoch,0);
  assert.equal((await helper.validateSourceSaveReceipt(recovered,receipt(command),()=>reloaded)).dirty,false);
  for(const patch of [{actor:'actor-2'},{email:'44444444-4444-4444-8444-444444444444'},{workspace:'55555555-5555-4555-8555-555555555555'},{baseVersion:4},{spec:spec(source+'later')},{spec:{...spec(),subject:'Changed'}}])assert.equal(await helper.recoverSourceSaveCommand(raw,{...reloaded,...patch}),null);
  const parsed=JSON.parse(raw);for(const patch of [{specHash:'a'.repeat(64)},{key:''},{baseVersion:0},{source:{...parsed.source,bytes:1}},{source:{...parsed.source,profile:'legacy-stored-1'}},{source:null},{extra:'unknown'}])assert.equal(await helper.recoverSourceSaveCommand(JSON.stringify({...parsed,...patch}),reloaded),null);
  assert.equal(await helper.recoverSourceSaveCommand('{',reloaded),null);
});
test('structured commands require null source and invalid own JSON or encoding fails before persistence',async()=>{
  assert.ok(helper);const live={...context(),spec:{...spec(),editing_mode:'structured' as const}};delete live.spec.raw_html;const command=await helper.createSourceSaveCommand(live,'structured');assert.equal(command.source,null);assert.equal((await helper.validateSourceSaveReceipt(command,receipt(command),()=>live)).dirty,false);
  const r=receipt(command);r.receipt.source={profile:'exact-utf8-1',sha256:'a'.repeat(64),bytes:0};await assert.rejects(()=>helper.validateSourceSaveReceipt(command,r,()=>live));
  for(const raw of ['\u0000','\uD800','界'.repeat(699051)])await assert.rejects(()=>helper.createSourceSaveCommand({...context(),spec:spec(raw)},'invalid'));
  await assert.rejects(()=>helper.createSourceSaveCommand({...context(),actor:''},'invalid'));
  await assert.rejects(()=>helper.createSourceSaveCommand({...context(),baseVersion:Number.MAX_SAFE_INTEGER},'invalid'));
});

test("fork recovery binds the original action and artifact hash",async()=>{assert.ok(helper);const live=context(),command=await helper.createSourceForkCommand(live,"a".repeat(64),"original-fork");assert.equal(command.action,"source-fork");const recovered=await helper.recoverSourceSaveCommand(helper.serializeSourceSaveCommand(command),live);assert.equal(recovered?.expectedArtifactHash,"a".repeat(64));assert.equal(recovered?.key,"original-fork");const changed=JSON.parse(helper.serializeSourceSaveCommand(command));delete changed.action;assert.equal(await helper.recoverSourceSaveCommand(JSON.stringify(changed),live),null);});

test("manual replacement retains original base identity without weakening the saved payload digest",async()=>{assert.ok(helper);const live=context(),desired={...live.spec,subject:"Explicit replacement"},command=await helper.createSourceReplacementCommand({...live,spec:desired},live.spec,"replacement-key");assert.equal(command.adoptBaseSpecHash,sha(canonicalSpecString(live.spec)));const recovered=await helper.recoverSourceSaveCommand(helper.serializeSourceSaveCommand(command),{...live,spec:desired});assert.equal(recovered?.adoptBaseSpecHash,command.adoptBaseSpecHash);const response=receipt(command);const valid=await helper.validateSourceSaveReceipt(command,response,()=>live);assert.equal(valid.dirty,true);assert.equal(valid.acknowledgedSpec.subject,"Explicit replacement");});
