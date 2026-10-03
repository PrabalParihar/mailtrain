import test from 'node:test';
import assert from 'node:assert/strict';
import {assertRouteMethod} from '../src/server/http';
import {scopeForResource} from '../src/domain/api-keys';
const id='e6f9ffdf-22bb-479c-abdd-034fe959fcfa';
test('staged ledger routes expose only eight documented operations and no attempt mutation',()=>{
 for(const [path,method]of[
  [['campaigns',id,'submission-ledgers'],'GET'],[['campaigns',id,'submission-ledgers'],'POST'],
  [['submission-ledgers',id],'GET'],[['submission-ledgers',id,'cancel'],'POST'],
  [['submission-ledgers',id,'recipients'],'GET'],[['deliveries',id],'GET'],
  [['deliveries',id,'history'],'GET'],[['deliveries',id,'attempts'],'GET'],
 ]as const)assert.doesNotThrow(()=>assertRouteMethod([...path],method));
 for(const [path,method]of[
  [['submission-ledgers',id],'PATCH'],[['submission-ledgers',id,'cancel'],'GET'],
  [['submission-ledgers',id,'recipients'],'POST'],[['deliveries',id],'POST'],
  [['deliveries',id,'history'],'POST'],[['deliveries',id,'attempts'],'POST'],
 ]as const)assert.throws(()=>assertRouteMethod([...path],method),/method is not allowed/);
 for(const path of[['submission-ledgers'],['submission-ledgers','bad'],['deliveries'],['deliveries',id,'send'],['submission-ledgers',id,'recipients','extra']])
  assert.throws(()=>assertRouteMethod(path,'GET'),/not found/);
});
test('ledger and delivery API keys require explicit campaign scopes; recipient authority is additionally service checked',()=>{
 for(const root of['submission-ledgers','deliveries'])assert.equal(scopeForResource(root,'GET',undefined),'campaigns:read');
 assert.equal(scopeForResource('submission-ledgers','POST','cancel'),'campaigns:write');
 assert.equal(scopeForResource('campaigns','POST','submission-ledgers'),'campaigns:write');
});
