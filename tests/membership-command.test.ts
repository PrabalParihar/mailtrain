import test from'node:test';import assert from'node:assert/strict';import{randomUUID}from'node:crypto';import{ApiError}from'../src/ui/api';
const commands=await import('../src/ui/membership-command').catch(()=>null);
class StorageFixture{values=new Map<string,string>();get length(){return this.values.size;}key(i:number){return[...this.values.keys()][i]??null;}getItem(k:string){return this.values.get(k)??null;}setItem(k:string,v:string){this.values.set(k,v);}removeItem(k:string){this.values.delete(k);}}
test('membership recovery preserves original actor/path/version/role across ambiguity and reload',async()=>{
 assert.ok(commands?.beginMembershipCommand,'Membership recovery must exist.');const storage=new StorageFixture(),workspace=randomUUID(),actor=randomUUID(),path='memberships/'+randomUUID()+'/role';
 const first=await commands.beginMembershipCommand(workspace,actor,path,{role:'Viewer',expected_version:1},storage),again=await commands.beginMembershipCommand(workspace,actor,path,{role:'Admin',expected_version:2},storage);assert.equal(again.key,first.key);assert.deepEqual(again.input,{role:'Viewer',expected_version:1});assert.deepEqual(await commands.pendingMembershipCommand(workspace,actor,path,storage),first);
 const another=await commands.beginMembershipCommand(workspace,randomUUID(),path,{role:'Viewer',expected_version:1},storage);assert.notEqual(another.key,first.key);assert.ok(![...storage.values.values()].join('').includes(workspace));assert.ok(![...storage.values.values()].join('').includes(actor));commands.finishMembershipCommand(first,storage);const next=await commands.beginMembershipCommand(workspace,actor,path,{role:'Admin',expected_version:2},storage);assert.notEqual(next.key,first.key);assert.deepEqual(next.input,{role:'Admin',expected_version:2});
});
test('only a definitive transactional membership CAS rejection releases its receipt',async()=>{
 assert.ok(commands?.reconcileMembershipRejection,'Membership recovery must exist.');const storage=new StorageFixture(),receipt=await commands.beginMembershipCommand(randomUUID(),randomUUID(),'memberships/'+randomUUID()+'/remove',{expected_version:1,acknowledge:true},storage);
 for(const error of[new Error('Network'),new ApiError('AUTH_REQUIRED','Sign in',401),new ApiError('INSUFFICIENT_SCOPE','Denied',403),new ApiError('AUTHORITY_BUSY','Retry',503)]){assert.equal(commands.reconcileMembershipRejection(receipt,error,storage),false);assert.ok(storage.getItem(receipt.slot));}
 assert.equal(commands.reconcileMembershipRejection(receipt,new ApiError('MEMBERSHIP_VERSION_CONFLICT','Changed',409),storage),true);assert.equal(storage.getItem(receipt.slot),null);
});
test('unresolved membership commands are bounded without eviction and malformed recovery fails closed',async()=>{
 assert.ok(commands?.beginMembershipCommand,'Membership recovery must exist.');const storage=new StorageFixture(),workspace=randomUUID(),actor=randomUUID();let first;let firstPath='';
 for(let i=0;i<32;i++){const path='memberships/'+randomUUID()+'/remove',receipt=await commands.beginMembershipCommand(workspace,actor,path,{expected_version:1,acknowledge:true},storage);if(!first){first=receipt;firstPath=path;}}
 await assert.rejects(()=>commands.beginMembershipCommand(workspace,actor,'memberships/'+randomUUID()+'/remove',{expected_version:1,acknowledge:true},storage),/32 unresolved/);assert.equal(storage.length,32);storage.setItem(first!.slot,'invalid');await assert.rejects(()=>commands.pendingMembershipCommand(workspace,actor,firstPath,storage));
});
