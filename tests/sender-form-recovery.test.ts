import {test} from 'node:test';
import assert from 'node:assert/strict';
import {senderRecoveryScope,readSenderSelection,rememberSenderSelection,acknowledgeSenderSave,formForSender,senderFormDirty,parseSenderForm,readSenderForm,rememberSenderForm,clearSenderForm,type SenderForm} from '../src/ui/sender-form-recovery';
const id='00000000-0000-4000-8000-000000000001',other='00000000-0000-4000-8000-000000000002',timestamp='2026-10-02T11:00:00.000Z';
const base={id,version:1,name:'Owned',provider:'ses' as const,account_label:'Owned account reference',region:'us-east-1',from_name:'Owned team',from_address:'team@example.test',reply_to:null,domain:'example.test',connection_status:'not_connected' as const,sending_enabled:false as const,created_at:timestamp,updated_at:timestamp};
const versionBody=JSON.stringify({expected_version:1,name:base.name,provider:base.provider,account_label:base.account_label,region:base.region,from_name:base.from_name,from_address:base.from_address,reply_to:base.reply_to});
test('invalid working fields survive roundtrip separately from acknowledged base and exact pending version command',()=>{
 const form:SenderForm={...formForSender(base),working:{...formForSender(base).working,name:'',from_address:'not an email\n'},pending:{actor_id:'owned-actor',kind:'version',path:'sender-identities/'+id+'/versions',key:other,body:versionBody}};
 assert.deepEqual(parseSenderForm(JSON.stringify(form)),form);assert.equal(senderFormDirty(form),true);assert.equal(form.base?.version,1);
});
test('all maximum-length escaped invalid fields are recoverable while above-bound forms are refused',()=>{
 const form=formForSender(base);form.working={name:'\u0001'.repeat(100),provider:'ses',account_label:'\\'.repeat(100),region:'\u0001'.repeat(40),from_name:'"'.repeat(100),from_address:'\u0001'.repeat(254),reply_to:'\u0001'.repeat(254)};
 assert.deepEqual(parseSenderForm(JSON.stringify(form)),form);
 for(const [field,max] of [['name',100],['account_label',100],['region',40],['from_name',100],['from_address',254],['reply_to',254]] as const)assert.equal(parseSenderForm(JSON.stringify({...form,working:{...form.working,[field]:'x'.repeat(max+1)}})),null);
});
test('pending recovery binds kind/path/body/source/version and rejects unknown private fields',()=>{
 const form=formForSender(base),pending={actor_id:'owned-actor',kind:'version',path:'sender-identities/'+id+'/versions',key:other,body:versionBody};
 for(const patch of [{path:'sender-identities/'+other+'/versions'},{actor_id:'owned-actor',kind:'dns'},{body:versionBody.replace('"expected_version":1','"expected_version":2')},{body:JSON.stringify({expected_version:1,credential:'private'})},{key:'invalid'}])assert.equal(parseSenderForm(JSON.stringify({...form,pending:{...pending,...patch}})),null);
 assert.equal(parseSenderForm(JSON.stringify({...form,secret:'private'})),null);
 assert.equal(parseSenderForm(JSON.stringify({...form,base:{...base,sending_enabled:true}})),null);
 const dns={...form,pending:{actor_id:'owned-actor',kind:'dns',path:'sender-identities/'+id+'/dns-checks',key:other,body:'{"expected_version":1}'}};
 assert.deepEqual(parseSenderForm(JSON.stringify(dns)),dns);
 const create={...formForSender(null),pending:{actor_id:'owned-actor',kind:'create',path:'sender-identities',key:other,body:versionBody.replace('"expected_version":1,','')}};
 assert.deepEqual(parseSenderForm(JSON.stringify(create)),create);
 assert.equal(parseSenderForm(JSON.stringify({...form,pending:create.pending})),null);
});
test('stale receipts never advance the original base or replace working edits',()=>{
 const form={...formForSender(base),working:{...formForSender(base).working,name:'My saved change'},pending:{actor_id:'owned-actor',kind:'version' as const,path:'sender-identities/'+id+'/versions',key:other,body:versionBody}};
 const receipt={...base,version:2,name:'My saved change'},current={...receipt,version:3,name:'Newer truth'};
 const retained=acknowledgeSenderSave(form,receipt,current);
 assert.equal(retained.base?.version,1);assert.equal(retained.working.name,'My saved change');assert.equal(retained.pending,undefined);
 assert.deepEqual(acknowledgeSenderSave(form,receipt,receipt),formForSender(receipt));
});
test('stale create receipts retain the exact pending command so reload cannot create a duplicate sender',()=>{
 const original={...formForSender(null),pending:{actor_id:'owned-actor',kind:'create' as const,path:'sender-identities',key:other,body:versionBody.replace('"expected_version":1,','')}};
 const retained=acknowledgeSenderSave(original,base,{...base,version:2,name:'Newer current sender'});
 assert.deepEqual(retained,original);assert.deepEqual(parseSenderForm(JSON.stringify(retained)),original);
});
test('storage failures retain tab memory scoped by workspace and identity and protect only unsaved work',()=>{
 const previous=Object.getOwnPropertyDescriptor(globalThis,'localStorage');const events:((event:{preventDefault:()=>void;returnValue:string})=>void)[]=[];
 const previousWindow=Object.getOwnPropertyDescriptor(globalThis,'window');
 Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem(){throw new Error('blocked');},setItem(){throw new Error('quota');},removeItem(){throw new Error('blocked');}}});
 Object.defineProperty(globalThis,'window',{configurable:true,value:{addEventListener(name:string,handler:(event:{preventDefault:()=>void;returnValue:string})=>void){if(name==='beforeunload')events.push(handler);}}});
 const workspace={workspace:'sender-test-'+id,actor:'owned-actor'};
 try {
  const dirty={...formForSender(base),working:{...formForSender(base).working,name:''}};
  assert.equal(rememberSenderForm(workspace,id,dirty),false);assert.deepEqual(readSenderForm(workspace,id),{form:dirty,persisted:false});
  assert.deepEqual(readSenderForm(workspace,other),{form:null,persisted:false});assert.deepEqual(readSenderForm({...workspace,workspace:workspace.workspace+'other'},id),{form:null,persisted:false});
  let prevented=false;events[0]({preventDefault(){prevented=true;},returnValue:''});assert.equal(prevented,true);
  assert.equal(rememberSenderForm(workspace,id,formForSender(base)),false);prevented=false;events[0]({preventDefault(){prevented=true;},returnValue:''});assert.equal(prevented,false);
  const oversized={...dirty,working:{...dirty.working,from_address:'x'.repeat(255)}};
  assert.equal(rememberSenderForm(workspace,id,oversized),false);assert.deepEqual(readSenderForm(workspace,id).form,oversized);
  clearSenderForm(workspace,id);
 }finally {if(previous)Object.defineProperty(globalThis,'localStorage',previous);else Reflect.deleteProperty(globalThis,'localStorage');if(previousWindow)Object.defineProperty(globalThis,'window',previousWindow);else Reflect.deleteProperty(globalThis,'window');}
});
test('storage reads reject forms for a different saved identity',()=>{
 const previous=Object.getOwnPropertyDescriptor(globalThis,'localStorage');
 Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem(){return JSON.stringify(formForSender(base));}}});
 try{assert.equal(readSenderForm({workspace:'wrong-source',actor:'owned-actor'},other).form,null);assert.equal(readSenderForm({workspace:'wrong-source',actor:'owned-actor'},'new').form,null);}finally{if(previous)Object.defineProperty(globalThis,'localStorage',previous);else Reflect.deleteProperty(globalThis,'localStorage');}
});

test('same-workspace actor recovery and selection stay separate and preserve the original actor command',()=>{
 const previous=Object.getOwnPropertyDescriptor(globalThis,'localStorage'),stored=new Map<string,string>();
 Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem(key:string){return stored.get(key)??null;},setItem(key:string,value:string){stored.set(key,value);},removeItem(key:string){stored.delete(key);}}});
 const a=senderRecoveryScope('actor-workspace-'+id,'owned-actor'),b=senderRecoveryScope(a.workspace,'other-actor');
 const form={...formForSender(null),working:{...formForSender(null).working,name:'Actor A retained'},pending:{actor_id:a.actor,kind:'create' as const,path:'sender-identities',key:other,body:versionBody.replace('"expected_version":1,','')}};
 try{
  assert.equal(rememberSenderForm(a,'new',form),true);rememberSenderSelection(a,id);
  assert.equal(readSenderForm(b,'new').form,null);assert.equal(readSenderSelection(b),'new');
  assert.deepEqual(readSenderForm(a,'new').form,form);assert.equal(readSenderSelection(a),id);
  assert.equal(rememberSenderForm(b,'new',form),false);assert.equal(readSenderForm(b,'new').form,null);
  assert.notDeepEqual(senderRecoveryScope('a:b','c'),senderRecoveryScope('a','b:c'));
 }finally{clearSenderForm(a,'new');clearSenderForm(b,'new');if(previous)Object.defineProperty(globalThis,'localStorage',previous);else Reflect.deleteProperty(globalThis,'localStorage');}
});

test('legacy unbound and mismatched actor commands cannot acquire the current recovery authority',()=>{
 const form={...formForSender(null),pending:{kind:'create',path:'sender-identities',key:other,body:versionBody.replace('"expected_version":1,','')}};
 assert.equal(parseSenderForm(JSON.stringify(form)),null);
 const previous=Object.getOwnPropertyDescriptor(globalThis,'localStorage');
 Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem(){return JSON.stringify({...form,pending:{...form.pending,actor_id:'actor-A'}});}}});
 try{assert.equal(readSenderForm(senderRecoveryScope('actor-mismatch','actor-B'),'new').form,null);}finally{if(previous)Object.defineProperty(globalThis,'localStorage',previous);else Reflect.deleteProperty(globalThis,'localStorage');}
});
