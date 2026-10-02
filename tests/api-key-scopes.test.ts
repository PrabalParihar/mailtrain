import test from 'node:test';
import assert from 'node:assert/strict';
import {scopeForResource} from '../src/domain/api-keys';
test('source writes and inert revision downloads retain email permission boundaries',()=>{
  for(const command of ['source-import','source-fork','import-html','draft'])assert.equal(scopeForResource('emails',command==='draft'?'PATCH':'POST',command),'emails:write');
  assert.equal(scopeForResource('email-revisions','GET','download'),'emails:export');
});
