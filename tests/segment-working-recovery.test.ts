import { test } from 'node:test';
import assert from 'node:assert/strict';
import { workingFromRule, workingBounds } from '../src/domain/segment-working';
import { validateRule, type Rule } from '../src/domain/segments';
import { parseSegmentRecovery, normalizeSavedRule, rememberSegmentRecovery } from '../src/ui/segment-working-recovery';
test('recovery preserves incomplete typed text and exact pending command identity', () => {
  const root = workingFromRule({kind:'attribute',field:'first_name',op:'eq',value:''});
  const input = {segment_id:null,base_version:0,saved_fingerprint:null,name:'Owned',root,
    pending:{kind:'create',path:'segments',key:'00000000-0000-4000-8000-000000000001',body:'{"name":"Owned","rule":{"kind":"attribute","field":"first_name","op":"eq","value":""}}',source_id:null,source_version:0}};
  assert.deepEqual(parseSegmentRecovery(JSON.stringify(input)), input);
  assert.equal(parseSegmentRecovery(JSON.stringify({...input,pending:{...input.pending,path:'campaigns'}})), null);
  assert.equal(parseSegmentRecovery(JSON.stringify({...input,root:{...root,secret:'no'}})), null);
});
test('all admitted nodes and maximally escaped values recover saved source and exact pending body', () => {
  const id='00000000-0000-4000-8000-000000000001';
  for(const value of ['a'.repeat(2000), '\u0001'.repeat(2000), '\\"'.repeat(1000)]) {
    const rule:Rule={kind:'all',children:[19,19,19,19,18].map(count=>({kind:'any',children:Array.from({length:count},()=>({kind:'attribute',field:'first_name',op:'eq',value}))}))};
    validateRule(rule,[]);const root=workingFromRule(rule);assert.equal(workingBounds(root).nodes,100);
    const record={segment_id:id,base_version:1,saved_fingerprint:JSON.stringify(rule),name:'Owned',root,pending:{kind:'version' as const,path:'segments/'+id+'/versions',key:id,body:JSON.stringify({expected_version:1,rule}),source_id:id,source_version:1}};
    assert.deepEqual(parseSegmentRecovery(JSON.stringify(record)),record);
  }
});
test('a successful storage write is reported durable only when its complete record is recoverable',()=>{
  let stored='';const prior=Object.getOwnPropertyDescriptor(globalThis,'localStorage');
  Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{setItem:(_key:string,value:string)=>{stored=value;}}});
  try {
    const record={segment_id:null,base_version:0,saved_fingerprint:null,name:'Owned',root:workingFromRule({kind:'attribute',field:'first_name',op:'eq',value:''})};
    assert.equal(rememberSegmentRecovery('owned-valid',record,true),true);assert.deepEqual(parseSegmentRecovery(stored),record);
    assert.equal(rememberSegmentRecovery('owned-invalid',{...record,name:'x'.repeat(101)},true),false);
  }finally{if(prior)Object.defineProperty(globalThis,'localStorage',prior);else Reflect.deleteProperty(globalThis,'localStorage');}
});
test('recovery rejects excess depth, duplicate edit IDs and malformed saved rule', () => {
  const leaf=workingFromRule({kind:'attribute',field:'first_name',op:'exists'});
  const record={segment_id:null,base_version:0,saved_fingerprint:null,name:'',root:{nodeId:'group',kind:'all',children:[leaf,leaf]}};
  assert.equal(parseSegmentRecovery(JSON.stringify(record)),null);
  assert.throws(()=>normalizeSavedRule({kind:'all',children:[]}));
  assert.deepEqual(normalizeSavedRule({value:3,op:'gte',field:'score',kind:'attribute'}),{kind:'attribute',field:'score',op:'gte',value:3});
});
