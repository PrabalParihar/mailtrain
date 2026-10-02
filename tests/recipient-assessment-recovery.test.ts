import {test} from 'node:test';
import assert from 'node:assert/strict';

const workspace='workspace-1', campaign='00000000-0000-4000-8000-000000000001', actor='actor-1';
const key='00000000-0000-4000-8000-000000000002';
const scope={workspace,campaign,actor};
const body=JSON.stringify({expected_version:1,expected_digest:'a'.repeat(64),topic_id:null});
const command={kind:'create' as const,key,body};
const timestamp='2026-10-02T11:00:00.000Z';
const assessment={id:key,campaign_id:campaign,configuration_id:campaign,configuration_version:1,configuration_digest:'a'.repeat(64),revision_id:campaign,snapshot_id:campaign,topic_id:null,status:'queued',total_count:1,processed_count:0,checks_clear_count:0,excluded_count:0,created_at:timestamp,updated_at:timestamp,completed_at:null,rule_version:'recipient-assessment-1',authorization_issued:false,global_blockers:['CAMPAIGN_APPROVAL_UNAVAILABLE','PROVIDER_SENDER_UNAVAILABLE','REAL_CLIENT_PREFLIGHT_UNAVAILABLE','SEND_BUDGET_UNAVAILABLE','LOCALE_POLICY_UNAVAILABLE'],created_by:actor,created_api_key_id:null};

async function recovery(){
 const helpers=await import('../src/ui/recipient-assessment-recovery').catch(()=>null);
 assert.ok(helpers,'the assessment recovery helpers must exist');
 return helpers;
}
function storage(){const records=new Map<string,string>();return {records,getItem:(id:string)=>records.get(id)??null,setItem:(id:string,value:string)=>{records.set(id,value);},removeItem:(id:string)=>{records.delete(id);}};}
function lockManager(){
 const slots=new Map<string,{busy:boolean;queue:Array<()=>void>}>();
 return {request<T>(name:string,options:{mode:'exclusive';signal?:AbortSignal},callback:()=>T|PromiseLike<T>):Promise<T>{
  return new Promise<T>((resolve,reject)=>{
   const slot=slots.get(name)??{busy:false,queue:[]};slots.set(name,slot);
   const abort=()=>reject(new DOMException('Aborted','AbortError'));
   if(options.signal?.aborted){abort();return;}
   options.signal?.addEventListener('abort',abort,{once:true});
   const finish=()=>{options.signal?.removeEventListener('abort',abort);slot.busy=false;slot.queue.shift()?.();};
   const run=()=>{
    slot.busy=true;
    if(options.signal?.aborted){abort();finish();return;}
    try{Promise.resolve(callback()).then(resolve,reject).finally(finish);}
    catch(error){reject(error);finish();}
   };
   if(slot.busy)slot.queue.push(run);else run();
  });
 }};
}

test('original creation body and key are durable before dispatch and survive reload',async()=>{
 const r=await recovery(),store=storage();
 assert.equal(r.rememberAssessmentCommand(scope,command,store),true);
 assert.deepEqual(r.readAssessmentCommand(scope,store),{command,available:true,error:''});
 const persisted=JSON.parse([...store.records.values()][0]);
 assert.deepEqual(persisted,{...scope,command});
 assert.equal(r.clearAssessmentCommand(scope,key,store),true);
 assert.equal(r.readAssessmentCommand(scope,store).command,null);
});

test('actor workspace and campaign binding prevent recovery or overwrite from another scope',async()=>{
 const r=await recovery(),store=storage();r.rememberAssessmentCommand(scope,command,store);
 for(const other of [{...scope,actor:'actor-2'},{...scope,workspace:'workspace-2'},{...scope,campaign:key}]) {
  assert.equal(r.readAssessmentCommand(other,store).command,null);
  const foreign=JSON.stringify({...scope,command});store.setItem(r.assessmentRecoverySlot(other),foreign);
  assert.equal(r.readAssessmentCommand(other,store).available,false);
 }
 assert.deepEqual(r.readAssessmentCommand(scope,store).command,command);
});

test('pending original command cannot be replaced with a new key or cleared by another key',async()=>{
 const r=await recovery(),store=storage();r.rememberAssessmentCommand(scope,command,store);
 assert.equal(r.rememberAssessmentCommand(scope,{...command,key:campaign},store),false);
 assert.equal(r.clearAssessmentCommand(scope,campaign,store),false);
 assert.deepEqual(r.readAssessmentCommand(scope,store).command,command);
});

test('malformed oversized and unexpected recovered data fails closed',async()=>{
 const r=await recovery(),store=storage(),slot=r.assessmentRecoverySlot(scope);
 const invalid=['','{','x'.repeat(17000),JSON.stringify({...scope,command,private:'unexpected'}),JSON.stringify({...scope,command:{...command,key:'bad'}}),JSON.stringify({...scope,command:{...command,body:JSON.stringify({expected_version:1,expected_digest:'a'.repeat(64),topic_id:null,extra:true})}})];
 for(const raw of invalid){store.setItem(slot,raw);assert.equal(r.readAssessmentCommand(scope,store).available,false);assert.equal(r.rememberAssessmentCommand(scope,command,store),false);}
});

test('unavailable storage and a silent write failure refuse command creation',async()=>{
 const r=await recovery();
 const unavailable={getItem:()=>{throw Error('disabled');},setItem:()=>{throw Error('disabled');},removeItem:()=>{throw Error('disabled');}};
 assert.equal(r.readAssessmentCommand(scope,unavailable).available,false);
 assert.equal(r.rememberAssessmentCommand(scope,command,unavailable),false);
 const silent={getItem:()=>null,setItem:()=>{},removeItem:()=>{}};
 assert.equal(r.rememberAssessmentCommand(scope,command,silent),false);
});

test('cancellation persists one original key and strictly empty body',async()=>{
 const r=await recovery(),store=storage(),cancel={kind:'cancel' as const,key,assessment_id:campaign,body:'{}'};
 assert.equal(r.rememberAssessmentCommand(scope,cancel,store),true);
 assert.deepEqual(r.readAssessmentCommand(scope,store).command,cancel);
 assert.equal(r.clearAssessmentCommand(scope,key,store),true);
 assert.equal(r.rememberAssessmentCommand(scope,{...cancel,body:'{"extra":true}'},store),false);
});

test('synchronous busy guard rejects duplicate clicks and aborts stale actor or configuration requests',async()=>{
 const r=await recovery(),fence=new r.RecipientAssessmentFence();fence.activate('actor-1:configuration-1');
 const first=fence.begin();assert.ok(first);assert.equal(fence.begin(),null);
 fence.activate('actor-2:configuration-1');assert.equal(first.signal.aborted,true);assert.equal(fence.current(first),false);
 const second=fence.begin();assert.ok(second);fence.finish(first);assert.equal(fence.begin(),null);
 fence.activate('actor-2:configuration-2');assert.equal(second.signal.aborted,true);
 const third=fence.begin();assert.ok(third);fence.invalidate();assert.equal(third.signal.aborted,true);assert.equal(fence.current(third),false);assert.equal(fence.begin(),null);
 fence.activate('actor-2:configuration-2');const fourth=fence.begin();assert.ok(fourth);fence.finish(fourth);assert.ok(fence.begin());
});

test('original queued receipt resolves through a fresh detail read without reviving old status',async()=>{
 const r=await recovery();assert.equal(typeof r.resolveAssessmentAcknowledgment,'function');
 const fresh={...assessment,status:'cancelled'};
 const result=await r.resolveAssessmentAcknowledgment({assessment},scope,command,async id=>{assert.equal(id,key);return {assessment:fresh};});
 assert.deepEqual(result,fresh);
 await assert.rejects(()=>r.resolveAssessmentAcknowledgment({assessment},scope,command,async()=>{throw Error('lost fresh read');}),/lost fresh read/);
 await assert.rejects(()=>r.resolveAssessmentAcknowledgment({assessment:{...assessment,configuration_digest:'b'.repeat(64)}},scope,command,async()=>({assessment:fresh})),/original command/);
});

test('assessment and observation pages strictly reject foreign scopes malformed counts and private fields',async()=>{
 const r=await recovery();assert.equal(typeof r.parseAssessmentPage,'function');assert.equal(typeof r.parseObservationPage,'function');
 const page={data:[assessment],has_more:false,next_cursor:null,total_count:1};
 assert.deepEqual(r.parseAssessmentPage(page,campaign),page);
 assert.throws(()=>r.parseAssessmentPage({...page,data:[{...assessment,campaign_id:key}]},campaign));
 assert.throws(()=>r.parseAssessmentPage({...page,data:[{...assessment,recipient_address:'private@example.test'}]},campaign));
 assert.throws(()=>r.parseAssessmentPage({...page,has_more:true},campaign));
 assert.throws(()=>r.parseAssessmentPage({...page,data:[{...assessment,processed_count:2}]},campaign));
 const observation={id:campaign,assessment_id:key,contact_id:campaign,captured_reason:'ELIGIBLE',captured_locale:'en',current_locale:'fr',consent_version:1,preference_version:1,current_reason:'CHECKS_CLEAR',reasons:[],observed_at:timestamp,rule_version:'recipient-assessment-1',authorization_issued:false};
 const observations={...page,data:[observation]};assert.deepEqual(r.parseObservationPage(observations,key),observations);
 assert.throws(()=>r.parseObservationPage(observations,campaign));
 assert.throws(()=>r.parseObservationPage({...observations,data:[{...observation,address:'private@example.test'}]},key));
});

test('actual HTTP request metadata is validated without admitting unknown response fields',async()=>{
 const r=await recovery(),request_id='req-owned-1';
 assert.deepEqual(r.parseAssessmentDetail({assessment,request_id},campaign),assessment);
 const page={data:[assessment],has_more:false,next_cursor:null,total_count:1,request_id};
 assert.deepEqual(r.parseAssessmentPage(page,campaign),page);
 const observations={data:[],has_more:false,next_cursor:null,total_count:0,request_id};
 assert.deepEqual(r.parseObservationPage(observations,key),observations);
 assert.throws(()=>r.parseAssessmentDetail({assessment,request_id:3},campaign));
 assert.throws(()=>r.parseAssessmentPage({...page,unknown:true},campaign));
 assert.throws(()=>r.parseObservationPage({...observations,request_id:null},key));
});

test('explicit configuration reload adopts verified fresh version and leaves the stored original body unchanged',async()=>{
 const r=await recovery();assert.equal(typeof r.parseAssessmentConfiguration,'function');
 const campaignView={id:campaign,name:'Owned',version:2,state:'draft',revision_id:campaign,intent:{artifact_hash:null,planned_timing:null},audience_count:0,eligible_count:0,excluded_count:0,audience_snapshot:null,digest:'b'.repeat(64),created_at:timestamp};
 const store=storage();r.rememberAssessmentCommand(scope,command,store);
 const fresh=r.parseAssessmentConfiguration({campaign:campaignView,request_id:'owned'},campaign,{version:1,digest:'a'.repeat(64)});
 assert.deepEqual(fresh,{version:2,digest:'b'.repeat(64)});
 assert.deepEqual(r.readAssessmentCommand(scope,store).command,command);
 assert.throws(()=>r.parseAssessmentConfiguration({campaign:campaignView},campaign,{version:3,digest:'c'.repeat(64)}),/older/);
 assert.throws(()=>r.parseAssessmentConfiguration({campaign:{...campaignView,digest:'c'.repeat(64)}},campaign,fresh),/digest/);
 assert.throws(()=>r.parseAssessmentConfiguration({campaign:{...campaignView,id:key}},campaign));
});

test('two interleaved clients admit only one original command under the same origin lock',async()=>{
 const r=await recovery(),store=storage(),locks=lockManager(),other={...command,key:'00000000-0000-4000-8000-000000000003'};
 const admit=r.rememberAssessmentCommandAtomic??((s:typeof scope,c:typeof command,options:{store:ReturnType<typeof storage>})=>Promise.resolve(r.rememberAssessmentCommand(s,c,options.store)));
 const originalGet=store.getItem;
 let interleave=true,clientA:Promise<boolean>|undefined;
 store.getItem=id=>{
  const value=originalGet(id);
  if(interleave&&value===null){interleave=false;clientA=admit(scope,command,{store,locks});}
  return value;
 };
 const acceptedB=await admit(scope,other,{store,locks});
 assert.ok(clientA);const acceptedA=await clientA;
 assert.equal(acceptedB,true);assert.equal(acceptedA,false,'a competing client must not overwrite an admitted original');
 assert.deepEqual(r.readAssessmentCommand(scope,store).command,other);
});

test('delayed matching-key clear cannot delete a newer original admitted by another client',async()=>{
 const r=await recovery(),store=storage(),locks=lockManager(),other={...command,key:'00000000-0000-4000-8000-000000000003'};
 r.rememberAssessmentCommand(scope,command,store);
 const clear=r.clearAssessmentCommandAtomic??((s:typeof scope,k:string,options:{store:ReturnType<typeof storage>})=>Promise.resolve(r.clearAssessmentCommand(s,k,options.store)));
 const originalGet=store.getItem;let interleave=true;
 store.getItem=id=>{
  const value=originalGet(id);
  if(interleave){
   interleave=false;
   void locks.request(r.assessmentRecoverySlot(scope),{mode:'exclusive'},()=>{
    r.clearAssessmentCommand(scope,key,store);r.rememberAssessmentCommand(scope,other,store);
   });
  }
  return value;
 };
 await clear(scope,key,{store,locks});
 // Wait until the competing document's critical section completes.
 await locks.request(r.assessmentRecoverySlot(scope),{mode:'exclusive'},()=>undefined);
 assert.deepEqual(r.readAssessmentCommand(scope,store).command,other);
 // A later stale acknowledgment must also leave the replacement intact.
 assert.equal(await clear(scope,key,{store,locks}),false);
 assert.deepEqual(r.readAssessmentCommand(scope,store).command,other);
});

test('unsupported locks and aborted queued locks refuse mutation and release subsequent work',async()=>{
 const r=await recovery(),store=storage(),locks=lockManager();
 assert.equal(typeof r.rememberAssessmentCommandAtomic,'function');assert.equal(typeof r.clearAssessmentCommandAtomic,'function');
 assert.equal(await r.rememberAssessmentCommandAtomic(scope,command,{store,locks:null}),false);
 assert.equal(store.records.size,0);
 let release!:()=>void;
 const held=locks.request(r.assessmentRecoverySlot(scope),{mode:'exclusive'},()=>new Promise<void>(resolve=>{release=resolve;}));
 await Promise.resolve();await Promise.resolve();
 const controller=new AbortController();
 const queued=r.rememberAssessmentCommandAtomic(scope,command,{store,locks,signal:controller.signal});
 controller.abort();assert.equal(await queued,false);assert.equal(store.records.size,0);
 release();await held;
 assert.equal(await r.rememberAssessmentCommandAtomic(scope,command,{store,locks}),true);
 const cancelled=new AbortController();cancelled.abort();
 assert.equal(await r.clearAssessmentCommandAtomic(scope,key,{store,locks,signal:cancelled.signal}),false);
 assert.deepEqual(r.readAssessmentCommand(scope,store).command,command);
 assert.equal(await r.clearAssessmentCommandAtomic(scope,key,{store,locks}),true);
 assert.equal(store.records.size,0);
});

test('actor change aborts queued atomic recovery and fences dispatch while preserving the next actor original',async()=>{
 const r=await recovery(),store=storage(),locks=lockManager(),fence=new r.RecipientAssessmentFence();
 fence.activate('actor-1:configuration-1');const request=fence.begin();assert.ok(request);
 let release!:()=>void;
 const held=locks.request(r.assessmentRecoverySlot(scope),{mode:'exclusive'},()=>new Promise<void>(resolve=>{release=resolve;}));
 const queued=r.rememberAssessmentCommandAtomic(scope,command,{store,locks,signal:request.signal});
 fence.activate('actor-2:configuration-1');
 const nextScope={...scope,actor:'actor-2'};
 assert.equal(await r.rememberAssessmentCommandAtomic(nextScope,command,{store,locks}),true);
 assert.equal(await queued,false);assert.equal(fence.current(request),false);
 release();await held;
 assert.equal(r.readAssessmentCommand(scope,store).command,null);
 assert.deepEqual(r.readAssessmentCommand(nextScope,store).command,command);
 assert.equal(await r.clearAssessmentCommandAtomic(scope,key,{store,locks,signal:request.signal}),false);
 assert.deepEqual(r.readAssessmentCommand(nextScope,store).command,command);
});
