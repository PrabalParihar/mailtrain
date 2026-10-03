import {test} from 'node:test';
import assert from 'node:assert/strict';
import {rememberTemplateCommand,readTemplateCommand,acknowledgeTemplateCommand,templateSlot,validateTemplateResult} from '../src/ui/template-recovery';
import {api,ApiError} from '../src/ui/api';
import * as recovery from '../src/ui/template-recovery';
const scope={workspace:'workspace',actor:'actor'};
const body={name:'Original',source_revision_id:'11111111-1111-4111-8111-111111111111',expected_artifact_hash:'a'.repeat(64)};
class Store {data=new Map<string,string>();get length(){return this.data.size;}key(i:number){return [...this.data.keys()][i]??null;}getItem(k:string){return this.data.get(k)??null;}setItem(k:string,v:string){this.data.set(k,v);}removeItem(k:string){this.data.delete(k);}}
test('original exact body/key survive repeated commands, reload and 401 ambiguity',()=>{const s=new Store();const first=rememberTemplateCommand(s,scope,'templates',body);assert.deepEqual(readTemplateCommand(s,scope),first);assert.deepEqual(rememberTemplateCommand(s,scope,'templates',{...body,name:'Changed'}),first);assert.deepEqual(readTemplateCommand(s,scope),first);});
test('actor and workspace scope separate commands',()=>{const s=new Store();rememberTemplateCommand(s,scope,'templates',body);assert.equal(readTemplateCommand(s,{...scope,actor:'other'}),null);assert.equal(readTemplateCommand(s,{...scope,workspace:'other'}),null);});
test('storage denial, corruption and capacity fail closed without eviction',()=>{const s=new Store();s.setItem(templateSlot(scope),'garbage');assert.throws(()=>readTemplateCommand(s,scope));assert.throws(()=>rememberTemplateCommand({...s,getItem(){throw Error('denied');}} as unknown as Store,scope,'templates',body));const full=new Store();for(let i=0;i<32;i++)rememberTemplateCommand(full,{...scope,actor:String(i)},'templates',body);assert.throws(()=>rememberTemplateCommand(full,scope,'templates',body));assert.equal(full.length,32);});
test('acknowledgment clears only the matching original command',()=>{const s=new Store();const first=rememberTemplateCommand(s,scope,'templates',body);assert.throws(()=>acknowledgeTemplateCommand(s,scope,{...first,key:'22222222-2222-4222-8222-222222222222'}));assert.deepEqual(readTemplateCommand(s,scope),first);acknowledgeTemplateCommand(s,scope,first);assert.equal(readTemplateCommand(s,scope),null);});
test('writes and acknowledged removals fail closed',()=>{const denied=new Store();denied.setItem=()=>{throw Error('quota');};assert.throws(()=>rememberTemplateCommand(denied,scope,'templates',body));const s=new Store();const pending=rememberTemplateCommand(s,scope,'templates',body);s.removeItem=()=>{throw Error('denied');};assert.throws(()=>acknowledgeTemplateCommand(s,scope,pending));assert.deepEqual(readTemplateCommand(s,scope),pending);});
test('all original mutation commands preserve exact bodies and keys',()=>{for(const [path,input,source] of [['templates',body,undefined],['templates/'+body.source_revision_id+'/archive',{expected_version:1},undefined],['templates/'+body.source_revision_id+'/remix',{title:'Original draft',expected_version:1,expected_artifact_hash:body.expected_artifact_hash},body.source_revision_id]] as const){const s=new Store();const receipt=rememberTemplateCommand(s,scope,path,input,source);assert.deepEqual(receipt.body,input);assert.equal(receipt.path,path);assert.deepEqual(readTemplateCommand(s,scope),receipt);assert.equal(rememberTemplateCommand(s,scope,path,input,source).key,receipt.key);}});
const template={id:'22222222-2222-4222-8222-222222222222',name:body.name,source_revision_id:body.source_revision_id,source_email_id:'33333333-3333-4333-8333-333333333333',source_revision_no:1,source_doc_version:1,source_title:'Source',artifact_hash:body.expected_artifact_hash,brand_kit_version_id:'44444444-4444-4444-8444-444444444444',locale:'en-US',direction:'ltr',editing_mode:'structured',state:'active',version:1,created_at:'2026-10-03T00:00:00Z',archived_at:null};
test('success validation binds frozen registration and archive identities before clearing',()=>{const s=new Store(),receipt=rememberTemplateCommand(s,scope,'templates',body);assert.equal(validateTemplateResult(receipt,{template,request_id:crypto.randomUUID()}),null);for(const replacement of [{name:'Different'},{artifact_hash:'b'.repeat(64)},{source_revision_id:template.id},{state:'archived'},{version:2}])assert.throws(()=>validateTemplateResult(receipt,{template:{...template,...replacement}}));assert.deepEqual(readTemplateCommand(s,scope),receipt);acknowledgeTemplateCommand(s,scope,receipt);const archive=rememberTemplateCommand(s,scope,'templates/'+template.id+'/archive',{expected_version:1});assert.equal(validateTemplateResult(archive,{template:{...template,state:'archived',version:2,archived_at:template.created_at}}),null);assert.throws(()=>validateTemplateResult(archive,{template}));});
test('reuse validation rejects wrong children and source lineage',()=>{const s=new Store(),receipt=rememberTemplateCommand(s,scope,'templates/'+template.id+'/remix',{title:'Child',expected_version:1,expected_artifact_hash:body.expected_artifact_hash},body.source_revision_id);const result={email:{id:template.id,title:'Child'},revision:{id:template.source_email_id,email_id:template.id},lineage:{source_revision_id:body.source_revision_id}};assert.equal(validateTemplateResult(receipt,result),template.id);assert.throws(()=>validateTemplateResult(receipt,{...result,lineage:{source_revision_id:template.id}}));assert.throws(()=>validateTemplateResult(receipt,{...result,revision:{...result.revision,email_id:template.source_email_id}}));assert.throws(()=>validateTemplateResult(receipt,{}));assert.deepEqual(readTemplateCommand(s,scope),receipt);});
test('401 and lost responses retain exact commands with original actor header',async()=>{const s=new Store(),receipt=rememberTemplateCommand(s,scope,'templates',body),original=globalThis.fetch;try{globalThis.fetch=async(_url,init)=>{assert.equal((init?.headers as Record<string,string>)['X-Actor-Id'],scope.actor);assert.equal((init?.headers as Record<string,string>)['Idempotency-Key'],receipt.key);assert.equal(init?.body,JSON.stringify(body));return new Response(JSON.stringify({error:{code:'UNAUTHENTICATED',message:'Sign in'}}),{status:401});};await assert.rejects(()=>api(scope.workspace,receipt.path,'POST',receipt.body,undefined,receipt.key,undefined,scope.actor),ApiError);assert.deepEqual(readTemplateCommand(s,scope),receipt);globalThis.fetch=async()=>{throw Error('lost response');};await assert.rejects(()=>api(scope.workspace,receipt.path,'POST',receipt.body,undefined,receipt.key,undefined,scope.actor));assert.deepEqual(readTemplateCommand(s,scope),receipt);}finally{globalThis.fetch=original;}});

const remixCommand={path:'templates/'+template.id+'/remix',body:{title:'Child',expected_version:1,expected_artifact_hash:body.expected_artifact_hash},sourceRevision:body.source_revision_id};
test('authoritative original rejections survive reload and require deliberate matched dismissal',async()=>{
 for(const [code,status] of [['TEMPLATE_ARCHIVED',409],['VERSION_MISMATCH',412]] as const){
  const s=new Store(),coordinator=recovery.getTemplateCoordinator(s,scope);
  await coordinator.run(remixCommand,async()=>{throw new ApiError(code,'Rejected',status);},()=>true);
  const pending=coordinator.getSnapshot().pending;assert.ok(pending);assert.equal(pending.rejection?.code,code);assert.ok('title'in pending.body);assert.equal(pending.body.title,'Child');
  const reload=new Store();reload.data=new Map(s.data);const restored=recovery.getTemplateCoordinator(reload,scope);restored.reconcile();assert.deepEqual(restored.getSnapshot().pending,pending);
  let sent=0;await restored.run({path:'templates',body:{...body,name:'Replacement'}},async()=>{sent++;return {template};},()=>true);assert.equal(sent,0);assert.deepEqual(readTemplateCommand(reload,scope),pending);
  await restored.dismiss(pending);assert.equal(readTemplateCommand(reload,scope),null);assert.equal(restored.getSnapshot().pending,null);
  await restored.run({path:'templates',body},async()=>({template}),()=>true);assert.equal(restored.getSnapshot().pending,null);assert.equal(restored.getSnapshot().error,'');
 }
});
test('auth, unknown failures, wrong command/status and malformed success never become dismissible',async()=>{
 for(const [input,error] of [[remixCommand,new ApiError('TEMPLATE_ARCHIVED','Wrong status',500)],[{path:'templates',body},new ApiError('TEMPLATE_ARCHIVED','Wrong command',409)],[remixCommand,new ApiError('ACTOR_CHANGED','Actor',409)],[remixCommand,new ApiError('UNAUTHENTICATED','Sign in',401)],[remixCommand,new ApiError('UNKNOWN','Unknown',400)],[remixCommand,new ApiError('UNKNOWN','Server',500)],[remixCommand,new Error('lost')]] as const){
  const s=new Store(),c=recovery.getTemplateCoordinator(s,scope);await c.run(input,async()=>{throw error;},()=>true);const pending=c.getSnapshot().pending;assert.ok(pending);assert.equal(pending.rejection,undefined);await c.dismiss(pending);assert.deepEqual(readTemplateCommand(s,scope),pending);
 }
 const s=new Store(),c=recovery.getTemplateCoordinator(s,scope);await c.run(remixCommand,async()=>({}),()=>true);assert.equal(c.getSnapshot().pending?.rejection,undefined);assert.ok(c.getSnapshot().pending);
});
test('mounted subscribers share exact pending/busy state and a scope-wide synchronous guard',async()=>{
 const s=new Store(),a=recovery.getTemplateCoordinator(s,scope),b=recovery.getTemplateCoordinator(s,scope);assert.equal(a,b);
 const seenA:unknown[]=[],seenB:unknown[]=[],offA=a.subscribe(()=>seenA.push(a.getSnapshot())),offB=b.subscribe(()=>seenB.push(b.getSnapshot()));a.reconcile();
 let respond!:(value:unknown)=>void,sent=0;const operation=a.run({path:'templates',body},async()=>{sent++;return new Promise(resolve=>{respond=resolve;});},()=>true);
 await Promise.resolve();assert.equal(a.getSnapshot().busy,true);assert.deepEqual(a.getSnapshot(),b.getSnapshot());assert.ok(a.getSnapshot().pending);
 await b.run(undefined,async()=>{sent++;return {template};},()=>true);assert.equal(sent,1);
 respond({template});await operation;assert.equal(a.getSnapshot().pending,null);assert.equal(b.getSnapshot().busy,false);assert.equal(b.getSnapshot().error,'');assert.deepEqual(seenA,seenB);
 await b.run(undefined,async()=>{sent++;return {template};},()=>true);assert.equal(b.getSnapshot().error,'');assert.equal(sent,1);offA();offB();
});
test('existing storage commands are reconciled into every control instead of emitting unusable retry errors',async()=>{
 const s=new Store(),c=recovery.getTemplateCoordinator(s,scope);c.reconcile();const original=rememberTemplateCommand(s,scope,'templates',body);let sent=0;
 await c.run({path:'templates',body:{...body,name:'Different'}},async()=>{sent++;return {template};},()=>true);assert.equal(sent,0);assert.deepEqual(c.getSnapshot().pending,original);assert.equal(c.getSnapshot().error,'');
 s.removeItem(templateSlot(scope));c.reconcile();assert.equal(c.getSnapshot().pending,null);assert.equal(c.getSnapshot().error,'');
});
test('a late original response or rejection dismissal cannot clear a newer receipt',async()=>{
 const s=new Store(),c=recovery.getTemplateCoordinator(s,scope);let respond!:(value:unknown)=>void;
 const request=c.run({path:'templates',body},async()=>new Promise(resolve=>{respond=resolve;}),()=>true);await Promise.resolve();
 const original=c.getSnapshot().pending;assert.ok(original);const newer={...original,key:crypto.randomUUID(),body:{...body,name:'Newer'}};s.setItem(templateSlot(scope),JSON.stringify(newer));c.reconcile();respond({template});await request;assert.deepEqual(readTemplateCommand(s,scope),newer);assert.deepEqual(c.getSnapshot().pending,newer);assert.equal(c.getSnapshot().error,'');
 const rejectedStore=new Store(),d=recovery.getTemplateCoordinator(rejectedStore,scope);await d.run(remixCommand,async()=>{throw new ApiError('TEMPLATE_ARCHIVED','Rejected',409);},()=>true);const rejected=d.getSnapshot().pending;assert.ok(rejected);rejectedStore.setItem(templateSlot(scope),JSON.stringify(newer));await d.dismiss(rejected);assert.deepEqual(readTemplateCommand(rejectedStore,scope),newer);
});
test('cross-context lock refusal fails closed before persisting or issuing a new command',async()=>{
 const s=new Store(),c=recovery.getTemplateCoordinator(s,scope,async()=>{throw Error('Another tab is processing this command.');});let sent=0;await c.run({path:'templates',body},async()=>{sent++;return {template};},()=>true);assert.equal(sent,0);assert.equal(readTemplateCommand(s,scope),null);assert.equal(c.getSnapshot().busy,false);assert.match(c.getSnapshot().error,/Another tab/);
});
test('runtime component props contribute only actor/workspace to the persisted strict command',()=>{
 const s=new Store(),props={...scope,role:'Editor',revisionId:body.source_revision_id,artifactHash:body.expected_artifact_hash};
 const pending=rememberTemplateCommand(s,props,'templates',body);assert.deepEqual(Object.keys(pending).sort(),['actor','body','key','path','workspace']);assert.deepEqual(readTemplateCommand(s,scope),pending);
});
test('storage events reconcile pending, resolved, corrupted and repaired state for subscribed controls',()=>{
 const original=Object.getOwnPropertyDescriptor(globalThis,'window'),target=new EventTarget();Object.defineProperty(globalThis,'window',{value:target,configurable:true});
 const s=new Store(),c=recovery.getTemplateCoordinator(s,scope);let notifications=0;const off=c.subscribe(()=>{notifications++;});
 const dispatch=(key:string|null)=>target.dispatchEvent(Object.assign(new Event('storage'),{storageArea:s,key}));
 try{
  c.reconcile();const pending=rememberTemplateCommand(s,scope,'templates',body);assert.equal(c.getSnapshot().pending,null);dispatch(templateSlot(scope));assert.deepEqual(c.getSnapshot().pending,pending);
  const before=notifications;dispatch('unrelated');assert.equal(notifications,before);
  s.setItem(templateSlot(scope),'corrupt');dispatch(templateSlot(scope));assert.equal(c.getSnapshot().ready,false);assert.ok(c.getSnapshot().error);
  s.setItem(templateSlot(scope),JSON.stringify(pending));dispatch(templateSlot(scope));assert.equal(c.getSnapshot().ready,true);assert.equal(c.getSnapshot().error,'');
  s.removeItem(templateSlot(scope));dispatch(null);assert.equal(c.getSnapshot().pending,null);
 }finally{off();if(original)Object.defineProperty(globalThis,'window',original);else Reflect.deleteProperty(globalThis,'window');}
});
test('Web Locks claim is nonqueued and refusal never invokes the mutation action',async()=>{
 const original=Object.getOwnPropertyDescriptor(globalThis,'navigator');let invoked=0;
 const request=async(name:string,options:{ifAvailable:boolean},callback:(lock:object|null)=>Promise<unknown>)=>{assert.equal(name,templateSlot(scope));assert.deepEqual(options,{ifAvailable:true});return callback(null);};
 Object.defineProperty(globalThis,'navigator',{value:{locks:{request}},configurable:true});
 try{await assert.rejects(()=>recovery.claimTemplateLock(scope,async()=>{invoked++;return 'claimed';}),/Another tab/);assert.equal(invoked,0);}finally{if(original)Object.defineProperty(globalThis,'navigator',original);else Reflect.deleteProperty(globalThis,'navigator');}
});
test('asset-refused original remix retains identity through reload, dismisses deliberately and permits an unrelated healthy draft',async()=>{
 const s=new Store(),c=recovery.getTemplateCoordinator(s,scope);
 const original=rememberTemplateCommand(s,scope,remixCommand.path,remixCommand.body,remixCommand.sourceRevision);
 assert.equal(await c.run(undefined,async command=>{assert.deepEqual(command,original);throw new ApiError('ASSET_NOT_READY','Source image unavailable',409);},()=>true),null);
 const rejected=c.getSnapshot().pending;assert.ok(rejected);assert.equal(rejected.rejection?.code,'ASSET_NOT_READY');
 const {rejection,...retained}=rejected;assert.deepEqual(retained,original);assert.deepEqual(rejection,{code:'ASSET_NOT_READY',status:409});
 const reload=new Store();reload.data=new Map(s.data);const restored=recovery.getTemplateCoordinator(reload,scope);restored.reconcile();assert.deepEqual(restored.getSnapshot().pending,rejected);
 const healthy={path:'templates/'+template.source_email_id+'/remix',body:{...remixCommand.body,title:'Healthy draft'},sourceRevision:template.source_email_id};let sent=0;
 await restored.run(healthy,async()=>{sent++;return {};},()=>true);assert.equal(sent,0);assert.deepEqual(readTemplateCommand(reload,scope),rejected);
 assert.equal(await restored.dismiss(rejected),true);assert.equal(readTemplateCommand(reload,scope),null);
 const child={email:{id:template.brand_kit_version_id,title:'Healthy draft'},revision:{id:template.id,email_id:template.brand_kit_version_id},lineage:{source_revision_id:healthy.sourceRevision}};
 const result=await restored.run(healthy,async command=>{sent++;assert.notEqual(command.key,original.key);assert.deepEqual(command.body,healthy.body);return child;},()=>true);
 assert.equal(sent,1);assert.equal(result?.emailId,child.email.id);assert.equal(readTemplateCommand(reload,scope),null);assert.equal(restored.getSnapshot().error,'');
});
test('asset refusal is dismissible only for remix409 and forged save/archive classifications fail closed',async()=>{
 const archive={path:'templates/'+template.id+'/archive',body:{expected_version:1}};
 for(const [input,status] of [[{path:'templates',body},409],[archive,409],[remixCommand,400],[remixCommand,401],[remixCommand,500]] as const){
  const s=new Store(),c=recovery.getTemplateCoordinator(s,scope);await c.run(input,async()=>{throw new ApiError('ASSET_NOT_READY','Unavailable',status);},()=>true);
  const pending=c.getSnapshot().pending;assert.ok(pending);assert.equal(pending.rejection,undefined);assert.equal(await c.dismiss(pending),false);assert.deepEqual(readTemplateCommand(s,scope),pending);
 }
 for(const input of [{path:'templates',body},archive]){
  const s=new Store(),pending=rememberTemplateCommand(s,scope,input.path,input.body);s.setItem(templateSlot(scope),JSON.stringify({...pending,rejection:{code:'ASSET_NOT_READY',status:409}}));assert.throws(()=>readTemplateCommand(s,scope));
 }
});
test('asset refusal cannot classify a newer command, and a historical remix success remains a validated success',async()=>{
 const s=new Store(),c=recovery.getTemplateCoordinator(s,scope);let refuse!:(reason:unknown)=>void;
 const request=c.run(remixCommand,async()=>new Promise((_resolve,reject)=>{refuse=reject;}),()=>true);await Promise.resolve();const original=c.getSnapshot().pending;assert.ok(original);
 const newer={...original,key:crypto.randomUUID(),body:{...remixCommand.body,title:'Newer'}};s.setItem(templateSlot(scope),JSON.stringify(newer));refuse(new ApiError('ASSET_NOT_READY','Unavailable',409));await request;assert.deepEqual(readTemplateCommand(s,scope),newer);assert.equal(c.getSnapshot().pending?.rejection,undefined);
 const successfulStore=new Store(),successful=recovery.getTemplateCoordinator(successfulStore,scope),historical=rememberTemplateCommand(successfulStore,scope,remixCommand.path,remixCommand.body,remixCommand.sourceRevision);
 const child={email:{id:template.brand_kit_version_id,title:remixCommand.body.title},revision:{id:template.id,email_id:template.brand_kit_version_id},lineage:{source_revision_id:remixCommand.sourceRevision}};
 const replay=await successful.run(undefined,async command=>{assert.deepEqual(command,historical);return child;},()=>true);assert.equal(replay?.emailId,child.email.id);assert.equal(successful.getSnapshot().pending,null);assert.equal(successful.getSnapshot().error,'');
});
