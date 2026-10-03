import {test} from 'node:test';
import assert from 'node:assert/strict';
import {renderToStaticMarkup} from 'react-dom/server';
import {createElement} from 'react';
import {ApiError} from '../src/ui/api';

const campaign='00000000-0000-4000-8000-000000000001';
const ledgerId='00000000-0000-4000-8000-000000000002';
const key='00000000-0000-4000-8000-000000000003';
const scope={workspace:'workspace-1',actor:'actor-1',campaign};
const body=JSON.stringify({expected_version:1,expected_digest:'a'.repeat(64)});
const command={kind:'create' as const,key,body};
const timestamp='2026-10-03T11:00:00.000Z';
const ledger={id:ledgerId,campaign_id:campaign,configuration_id:campaign,configuration_version:1,configuration_digest:'a'.repeat(64),revision_id:campaign,artifact_hash:'b'.repeat(64),snapshot_id:campaign,snapshot_digest:'c'.repeat(64),status:'queued',total_count:1,processed_count:0,pending_count:0,skipped_count:0,cancelled_count:0,accepted_count:0,uncertain_count:0,attempt_count:0,created_by:'actor-1',created_api_key_id:null,created_at:timestamp,updated_at:timestamp,completed_at:null,authorization_issued:false,dispatch_enabled:false};
async function recovery(){
 const helpers=await import('../src/ui/submission-ledger-recovery').catch(()=>null);
 assert.ok(helpers,'submission ledger recovery must exist');
 return helpers;
}
function storage(){
 const records=new Map<string,string>();
 return {records,get length(){return records.size;},key:(index:number)=>[...records.keys()][index]??null,getItem:(slot:string)=>records.get(slot)??null,setItem:(slot:string,value:string)=>{records.set(slot,value);},removeItem:(slot:string)=>{records.delete(slot);}};
}
function locks(){
 let active=false;
 return {async request<T>(_name:string,_options:unknown,callback:(lock:object|null)=>T|PromiseLike<T>):Promise<T>{
  if(active)return await callback(null);
  active=true;try{return await callback({});}finally{active=false;}
 }};
}
test('original canonical command is persisted before POST and acknowledged after identity validation',async()=>{
 const r=await recovery(),store=storage(),coordinator=new r.SubmissionLedgerCoordinator(store,scope,locks());
 const result=await coordinator.run(command,async actual=>{assert.deepEqual(r.readLedgerCommand(store,scope),actual);return {ledger};},()=>true);
 assert.equal(result?.id,ledgerId);assert.equal(r.readLedgerCommand(store,scope),null);
});
test('network ambiguity retains exact original key and body through reload and version drift',async()=>{
 const r=await recovery(),store=storage(),first=new r.SubmissionLedgerCoordinator(store,scope,locks());
 await first.run(command,async()=>{throw Error('lost acknowledgment');},()=>true);
 const reloaded=new r.SubmissionLedgerCoordinator(store,scope,locks());
 await reloaded.run({...command,key:campaign,body:JSON.stringify({expected_version:2,expected_digest:'d'.repeat(64)})},async()=>{assert.fail('must not replace original');},()=>true);
 await reloaded.run(undefined,async actual=>{assert.deepEqual(actual,command);return {ledger};},()=>true);
 assert.equal(r.readLedgerCommand(store,scope),null);
});
test('all auth generic4xx and unknown conflict errors retain the original without dismissal classification',async()=>{
 const r=await recovery();
 for(const [code,status] of [['UNAUTHENTICATED',401],['FORBIDDEN',403],['VERSION_CONFLICT',400],['DIGEST_CONFLICT',500],['STATE_CONFLICT',401],['UNKNOWN_CONFLICT',409],['BAD_INPUT',400]] as const){
  const store=storage(),coordinator=new r.SubmissionLedgerCoordinator(store,scope,locks());
  await coordinator.run(command,async()=>{throw new ApiError(code,'refused',status);},()=>true);
  assert.deepEqual(r.readLedgerCommand(store,scope),command);
  assert.equal(await coordinator.dismiss(command),false,'unproven refusals must never permit dismissal');
 }
});
test('missing or occupied origin lock refuses POST and any storage mutation',async()=>{
 const r=await recovery();
 for(const manager of [null,{request:async<T>(_name:string,_options:unknown,callback:(lock:null)=>T|PromiseLike<T>)=>await callback(null)}]){
  const store=storage(),coordinator=new r.SubmissionLedgerCoordinator(store,scope,manager);
  await coordinator.run(command,async()=>{assert.fail('POST without exclusive origin lock');},()=>true);
  assert.equal(store.length,0);assert.match(coordinator.getSnapshot().error,/lock|tab/i);
 }
});
test('shared mounted coordinator synchronously refuses repeated clicks',async()=>{
 const r=await recovery(),store=storage(),a=r.getSubmissionLedgerCoordinator(store,scope,locks()),b=r.getSubmissionLedgerCoordinator(store,scope);
 assert.equal(a,b);let release!:()=>void;const gate=new Promise<void>(resolve=>{release=resolve;});let calls=0;
 const first=a.run(command,async()=>{calls++;await gate;return {ledger};},()=>true);
 assert.equal(await b.run(command,async()=>{calls++;return {ledger};},()=>true),null);
 release();await first;assert.equal(calls,1);
});
test('two independent coordinators sharing origin locks cannot dispatch concurrently',async()=>{
 const r=await recovery(),store=storage(),manager=locks(),a=new r.SubmissionLedgerCoordinator(store,scope,manager),b=new r.SubmissionLedgerCoordinator(store,scope,manager);
 let release!:()=>void;const gate=new Promise<void>(resolve=>{release=resolve;});let calls=0;
 const first=a.run(command,async()=>{calls++;await gate;return {ledger};},()=>true);
 await b.run(command,async()=>{calls++;return {ledger};},()=>true);release();await first;assert.equal(calls,1);
});
test('actor workspace campaign records and strict scope reject enriched props and transplanted records',async()=>{
 const r=await recovery(),store=storage();
 await new r.SubmissionLedgerCoordinator(store,scope,locks()).run(command,async()=>{throw Error('network');},()=>true);
 for(const other of [{...scope,actor:'actor-2'},{...scope,workspace:'workspace-2'},{...scope,campaign:ledgerId}]){
  assert.equal(r.readLedgerCommand(store,other),null);
  store.setItem(r.ledgerRecoverySlot(other),JSON.stringify({...scope,command}));
  assert.throws(()=>r.readLedgerCommand(store,other));
 }
 const enriched={...scope,version:1};assert.throws(()=>r.ledgerRecoverySlot(enriched));
});
test('invalid oversized noncanonical bodies and unexpected fields fail closed',async()=>{
 const r=await recovery(),store=storage(),slot=r.ledgerRecoverySlot(scope);
 for(const value of ['{','x'.repeat(8193),JSON.stringify({...scope,command,extra:true}),JSON.stringify({...scope,command:{...command,key:'ABCDEF00-0000-4000-8000-000000000003'}}),JSON.stringify({...scope,command:{...command,body:' '+body}}),JSON.stringify({...scope,command:{...command,body:'{"expected_version":1,"expected_digest":"bad"}'}})]){
  store.setItem(slot,value);assert.throws(()=>r.readLedgerCommand(store,scope));
  await new r.SubmissionLedgerCoordinator(store,scope,locks()).run(command,async()=>{assert.fail('invalid recovery dispatched');},()=>true);
 }
});
test('capacity is finite and existing original command remains retryable at capacity',async()=>{
 const r=await recovery(),store=storage(),manager=locks();
 for(let index=0;index<32;index++)await new r.SubmissionLedgerCoordinator(store,{...scope,actor:'actor-'+index},manager).run(command,async()=>{throw Error('network');},()=>true);
 assert.equal(store.length,32);
 await new r.SubmissionLedgerCoordinator(store,{...scope,actor:'actor-33'},manager).run(command,async()=>{assert.fail('capacity overflow dispatched');},()=>true);
 await new r.SubmissionLedgerCoordinator(store,{...scope,actor:'actor-0'},manager).run(undefined,async()=>({ledger}),()=>true);
 assert.equal(store.length,31);
});
test('silent write and remove failures fail closed and preserve unresolved acknowledgment',async()=>{
 const r=await recovery(),store=storage();
 const silent={...store,setItem:()=>{}};
 await new r.SubmissionLedgerCoordinator(silent,scope,locks()).run(command,async()=>{assert.fail('unstored POST');},()=>true);
 const noClear={...store,removeItem:()=>{}};
 await new r.SubmissionLedgerCoordinator(noClear,scope,locks()).run(command,async()=>({ledger}),()=>true);
 assert.deepEqual(r.readLedgerCommand(store,scope),command);
});
test('malformed or foreign success never clears original recovery',async()=>{
 const r=await recovery();
 for(const response of [{ledger:{...ledger,campaign_id:key}},{ledger:{...ledger,configuration_version:2}},{ledger:{...ledger,configuration_digest:'d'.repeat(64)}},{ledger:{...ledger,dispatch_enabled:true}},{ledger:{...ledger,extra:'private'}},{}]){
  const store=storage();await new r.SubmissionLedgerCoordinator(store,scope,locks()).run(command,async()=>response,()=>true);
  assert.deepEqual(r.readLedgerCommand(store,scope),command);
 }
});
test('same immutable configuration ledger can be returned across creator identities',async()=>{
 const r=await recovery(),store=storage();
 assert.ok(await new r.SubmissionLedgerCoordinator(store,scope,locks()).run(command,async()=>({ledger:{...ledger,created_by:'another-owner'}}),()=>true));
});
test('cancel requires exact ledger identity and strict empty original body',async()=>{
 const r=await recovery(),store=storage(),cancel={kind:'cancel' as const,key,ledger_id:ledgerId,body:'{}' as const};
 await new r.SubmissionLedgerCoordinator(store,scope,locks()).run(cancel,async()=>({ledger:{...ledger,id:campaign,status:'cancelled'}}),()=>true);
 assert.deepEqual(r.readLedgerCommand(store,scope),cancel);
 await new r.SubmissionLedgerCoordinator(store,scope,locks()).run(undefined,async actual=>{assert.deepEqual(actual,cancel);return {ledger:{...ledger,status:'cancelled'}};},()=>true);
 assert.equal(r.readLedgerCommand(store,scope),null);
});
test('stale context before dispatch or after completion preserves command without acknowledgment',async()=>{
 const r=await recovery(),store=storage();
 await new r.SubmissionLedgerCoordinator(store,scope,locks()).run(command,async()=>{assert.fail('stale start');},()=>false);
 let current=true;
 await new r.SubmissionLedgerCoordinator(store,scope,locks()).run(command,async()=>{current=false;return {ledger};},()=>current);
 assert.deepEqual(r.readLedgerCommand(store,scope),command);
});
test('fence aborts actor version and lifecycle changes without finishing a newer request',async()=>{
 const r=await recovery(),fence=new r.LedgerFence();fence.activate('actor-1:v1');const first=fence.begin();assert.ok(first);assert.equal(fence.begin(),null);
 fence.activate('actor-2:v2');assert.equal(first.signal.aborted,true);assert.equal(fence.current(first),false);
 const second=fence.begin();assert.ok(second);fence.finish(first);assert.equal(fence.begin(),null);fence.finish(second);assert.ok(fence.begin());
});
test('recipient history attempt and ledger pages bind exact parents and cursor metadata',async()=>{
 const r=await recovery(),page={data:[ledger],total_count:1,has_more:false,next_cursor:null};
 assert.equal(r.parseLedgerPage(page,campaign).data.length,1);
 assert.throws(()=>r.parseLedgerPage(page,key));assert.throws(()=>r.parseLedgerPage({...page,has_more:true},campaign));
 const recipient={id:key,ledger_id:ledgerId,configuration_id:campaign,delivery_id:key,contact_id:campaign,captured_locale:'en',captured_reason:'ELIGIBLE',captured_consent_version:1,logical_send_key:'d'.repeat(64),submission_state:'pending',outcome:'unknown',authorization_issued:false,created_at:timestamp,updated_at:timestamp};
 assert.equal(r.parseRecipientPage({...page,data:[recipient]},ledgerId).data.length,1);
 assert.throws(()=>r.parseRecipientPage({...page,data:[recipient]},campaign));
 assert.throws(()=>r.parseDeliveryDetail({delivery:recipient},ledgerId,campaign));
 assert.throws(()=>r.parseHistoryPage({...page,data:[{id:campaign,delivery_id:key,submission_state:'pending',outcome:'unknown',reason:null,recorded_at:timestamp}]},campaign));
 assert.equal(r.parseAttemptPage({...page,data:[],total_count:0},key).data.length,0);
});
test('only exact create refusals after historical receipt lookup persist definitive classification',async()=>{
 const r=await recovery();
 for(const code of ['VERSION_CONFLICT','DIGEST_CONFLICT','STATE_CONFLICT']){
  const store=storage(),coordinator=new r.SubmissionLedgerCoordinator(store,scope,locks());
  await coordinator.run(command,async()=>{throw new ApiError(code,'refused',409);},()=>true);
  const rejected=r.readLedgerCommand(store,scope);assert.ok(rejected);
  assert.deepEqual(rejected,{...command,rejection:{code,status:409}});
  const reloaded=new r.SubmissionLedgerCoordinator(store,scope,locks());
  assert.equal(await reloaded.dismiss({...rejected,key:campaign}),false);
  assert.equal(await reloaded.dismiss(rejected),true);assert.equal(r.readLedgerCommand(store,scope),null);
 }
});
test('cancel conflicts fresh GET conflicts and stale POST failures never become dismissible',async()=>{
 const r=await recovery();
 for(const kind of ['cancel','fresh','stale'] as const){
  const store=storage(),coordinator=new r.SubmissionLedgerCoordinator(store,scope,locks());
  const original=kind==='cancel'?{kind:'cancel' as const,key,ledger_id:ledgerId,body:'{}' as const}:command;
  let current=true;
  await coordinator.run(original,async()=>{
   if(kind==='fresh')return {ledger};
   if(kind==='stale')current=false;
   throw new ApiError('VERSION_CONFLICT','refused',409);
  },()=>current,async()=>{throw new ApiError('VERSION_CONFLICT','GET refused',409);});
  assert.deepEqual(r.readLedgerCommand(store,scope),original);assert.equal(await coordinator.dismiss(original),false);
 }
});
test('definitive refusal storage failure cannot enable dismissal or silently release command',async()=>{
 const r=await recovery(),store=storage();let writes=0;
 const broken={...store,setItem:(slot:string,value:string)=>{if(++writes===1)store.setItem(slot,value);}};
 const coordinator=new r.SubmissionLedgerCoordinator(broken,scope,locks());
 await coordinator.run(command,async()=>{throw new ApiError('STATE_CONFLICT','refused',409);},()=>true);
 assert.deepEqual(r.readLedgerCommand(store,scope),command);assert.equal(await coordinator.dismiss(command),false);
});
test('fresh ledger immutable pins and stale context are checked before ACK',async()=>{
 const r=await recovery(),store=storage(),coordinator=new r.SubmissionLedgerCoordinator(store,scope,locks());
 await coordinator.run(command,async()=>({ledger}),()=>true,async()=>({ledger:{...ledger,snapshot_digest:'f'.repeat(64)}}));
 assert.deepEqual(r.readLedgerCommand(store,scope),command);
});
test('Editor Viewer and Billing markup exposes no recipient identifiers row counts or mutation controls',async()=>{
 const ui=await import('../src/ui/submission-ledgers').catch(()=>null);assert.ok(ui,'submission ledger UI must exist');
 for(const role of ['Editor','Viewer','Billing']){
  const markup=renderToStaticMarkup(createElement(ui.SubmissionLedgers,{workspace:scope.workspace,actor:scope.actor,id:campaign,role,version:1,digest:'a'.repeat(64)}));
  assert.match(markup,/Owner or Admin/);assert.doesNotMatch(markup,/<button|processed|pending_count|Contact|row count/);
 }
});
