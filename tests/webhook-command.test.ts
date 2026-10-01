import test from'node:test';import assert from'node:assert/strict';import{randomUUID}from'node:crypto';import{beginWebhookCommand,finishWebhookCommand,reconcileWebhookReplayRejection}from'../src/ui/webhook-command';import{ApiError}from'../src/ui/api';
test('webhook recovery stores bounded opaque command keys, binds intent/workspace, and refuses unavailable storage before mutation',async()=>{
 const entries=new Map<string,string>(),storage={get length(){return entries.size;},key(index:number){return [...entries.keys()][index]??null;},getItem(key:string){return entries.get(key)??null;},setItem(key:string,value:string){entries.set(key,value);},removeItem(key:string){entries.delete(key);}},w=randomUUID(),input={url:'https://example.org/?private=never-store',name:'Fixture',subscriptions:['contact.unsubscribed']};
 const first=await beginWebhookCommand(w,'webhook-endpoints',input,storage),again=await beginWebhookCommand(w,'webhook-endpoints',input,storage);assert.equal(first.key,again.key);assert.ok(!JSON.stringify([...entries]).includes('never-store'));
 assert.notEqual((await beginWebhookCommand(randomUUID(),'webhook-endpoints',input,storage)).key,first.key);assert.notEqual((await beginWebhookCommand(w,'webhook-endpoints',{...input,name:'New intent'},storage)).key,first.key);
 finishWebhookCommand(first,storage);assert.notEqual((await beginWebhookCommand(w,'webhook-endpoints',input,storage)).key,first.key);
 await assert.rejects(()=>beginWebhookCommand(w,'webhook-endpoints',input,{...storage,getItem(){throw new Error('Blocked storage');}}),/recovery storage/i);
 for(let i=entries.size;i<32;i++)entries.set('lettercape.webhook-command.'+String(i),'existing');
 await assert.rejects(()=>beginWebhookCommand(w,'webhook-endpoints',{...input,name:'Thirty-third'},storage),/32 unresolved/i);
 assert.equal(entries.size,32);
});
test('pending lifecycle command preserves original CAS and cutover after refreshed state',async()=>{
 const entries=new Map<string,string>(),storage={get length(){return entries.size;},key(i:number){return[...entries.keys()][i]??null;},getItem(k:string){return entries.get(k)??null;},setItem(k:string,v:string){entries.set(k,v);},removeItem(k:string){entries.delete(k);}},workspace=randomUUID(),path='webhook-endpoints/'+randomUUID()+'/rotate';
 const original={expected_version:1,retire_previous:false,acknowledge_key_cutover:false};
 const first=await beginWebhookCommand(workspace,path,original,storage),recovered=await beginWebhookCommand(workspace,path,{expected_version:2,retire_previous:true,acknowledge_key_cutover:true},storage);
 assert.equal(recovered.key,first.key);assert.deepEqual((recovered as typeof recovered&{input:unknown}).input,original);assert.equal(entries.size,1);
 const pause=path.replace('/rotate','/pause'),paused=await beginWebhookCommand(workspace,pause,{expected_version:2},storage),pauseAgain=await beginWebhookCommand(workspace,pause,{expected_version:3},storage);assert.equal(paused.key,pauseAgain.key);assert.deepEqual((pauseAgain as typeof pauseAgain&{input:unknown}).input,{expected_version:2});
 finishWebhookCommand(recovered,storage);assert.notEqual((await beginWebhookCommand(workspace,path,{expected_version:2},storage)).key,first.key);
});

test('pending delivery replay keeps original attempt identity after current state changes',async()=>{
 const entries=new Map<string,string>(),storage={get length(){return entries.size;},key(i:number){return[...entries.keys()][i]??null;},getItem(k:string){return entries.get(k)??null;},setItem(k:string,v:string){entries.set(k,v);},removeItem(k:string){entries.delete(k);}},workspace=randomUUID(),path='webhook-deliveries/'+randomUUID()+'/replay',input={expected_attempt:1,acknowledge_duplicate_effect:true};
 const first=await beginWebhookCommand(workspace,path,input,storage),again=await beginWebhookCommand(workspace,path,{...input,expected_attempt:2},storage);assert.equal(first.key,again.key);assert.deepEqual(again.input,input);
});

test('authoritative stale replay rejection releases only that receipt; ambiguous responses keep original identity',async()=>{
 const entries=new Map<string,string>(),storage={get length(){return entries.size;},key(i:number){return[...entries.keys()][i]??null;},getItem(k:string){return entries.get(k)??null;},setItem(k:string,v:string){entries.set(k,v);},removeItem(k:string){entries.delete(k);}},workspace=randomUUID(),path='webhook-deliveries/'+randomUUID()+'/replay',input={expected_attempt:1,acknowledge_duplicate_effect:true};
 const first=await beginWebhookCommand(workspace,path,input,storage);
 for(const error of[new Error('Lost response'),new ApiError('UNAUTHORIZED','Session expired',401),new ApiError('REPLAY_FORBIDDEN','Authority unavailable',403),new ApiError('REQUEST_FAILED','Unavailable',503)])assert.equal(reconcileWebhookReplayRejection(first,error,storage),false);
 assert.equal((await beginWebhookCommand(workspace,path,{...input,expected_attempt:2},storage)).key,first.key);
 assert.equal(reconcileWebhookReplayRejection(first,new ApiError('REPLAY_VERSION_CONFLICT','Stale attempt',409),storage),true);assert.equal(entries.size,0);
 const fresh=await beginWebhookCommand(workspace,path,{...input,expected_attempt:2},storage);assert.notEqual(fresh.key,first.key);assert.deepEqual(fresh.input,{...input,expected_attempt:2});
});
