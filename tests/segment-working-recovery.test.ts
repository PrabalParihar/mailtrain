import { test } from 'node:test';
import assert from 'node:assert/strict';
import { workingFromRule } from '../src/domain/segment-working';
import { parseSegmentRecovery, normalizeSavedRule } from '../src/ui/segment-working-recovery';
test('recovery preserves incomplete typed text and exact pending command identity', () => {
  const root = workingFromRule({kind:'attribute',field:'first_name',op:'eq',value:''});
  const input = {segment_id:null,base_version:0,saved_fingerprint:null,name:'Owned',root,
    pending:{kind:'create',path:'segments',key:'00000000-0000-4000-8000-000000000001',body:'{"name":"Owned","rule":{"kind":"attribute","field":"first_name","op":"eq","value":""}}',source_id:null,source_version:0}};
  assert.deepEqual(parseSegmentRecovery(JSON.stringify(input)), input);
  assert.equal(parseSegmentRecovery(JSON.stringify({...input,pending:{...input.pending,path:'campaigns'}})), null);
  assert.equal(parseSegmentRecovery(JSON.stringify({...input,root:{...root,secret:'no'}})), null);
});
test('recovery rejects excess depth, duplicate edit IDs and malformed saved rule', () => {
  const leaf=workingFromRule({kind:'attribute',field:'first_name',op:'exists'});
  const record={segment_id:null,base_version:0,saved_fingerprint:null,name:'',root:{nodeId:'group',kind:'all',children:[leaf,leaf]}};
  assert.equal(parseSegmentRecovery(JSON.stringify(record)),null);
  assert.throws(()=>normalizeSavedRule({kind:'all',children:[]}));
  assert.deepEqual(normalizeSavedRule({value:3,op:'gte',field:'score',kind:'attribute'}),{kind:'attribute',field:'score',op:'gte',value:3});
});
