import test from 'node:test';
import assert from 'node:assert/strict';
import {assertRouteMethod,readJson} from '../src/server/http';
import {scopeForResource} from '../src/domain/api-keys';
test('source mutations have exact POST routes and leave generic JSON at two MiB',async()=>{
  const id='11111111-1111-4111-8111-111111111111';
  for(const command of ['source-import','source-fork']){
    assert.doesNotThrow(()=>assertRouteMethod(['emails',id,command],'POST'));
    for(const method of ['GET','PUT','PATCH','DELETE'])assert.throws(()=>assertRouteMethod(['emails',id,command],method),/method is not allowed/);
    assert.throws(()=>assertRouteMethod(['emails',id,command,'extra'],'POST'),/not found/);
    assert.throws(()=>assertRouteMethod(['emails','invalid',command],'POST'),/not found/);
  }
  await assert.rejects(readJson(new Request('https://example.test/v1/brands',{method:'POST',headers:{'Content-Length':String(2*1024*1024+1)}})),/2 MiB/);
});
test('recipient assessment routes expose bounded read/prepare/cancel methods only',()=>{
 const id='11111111-1111-4111-8111-111111111111';
 for(const method of ['GET','POST'])assert.doesNotThrow(()=>assertRouteMethod(['campaigns',id,'recipient-assessments'],method));
 for(const method of ['PUT','PATCH','DELETE'])assert.throws(()=>assertRouteMethod(['campaigns',id,'recipient-assessments'],method),/method is not allowed/);
 for(const path of [['recipient-assessments',id],['recipient-assessments',id,'observations']]){assert.doesNotThrow(()=>assertRouteMethod(path,'GET'));assert.throws(()=>assertRouteMethod(path,'POST'),/method is not allowed/);}
 assert.doesNotThrow(()=>assertRouteMethod(['recipient-assessments',id,'cancel'],'POST'));
 assert.throws(()=>assertRouteMethod(['recipient-assessments',id,'cancel'],'GET'),/method is not allowed/);
 assert.throws(()=>assertRouteMethod(['recipient-assessments','bad','observations'],'GET'),/not found/);
 assert.throws(()=>assertRouteMethod(['recipient-assessments',id,'observations','extra'],'GET'),/not found/);
});
test('dedicated small JSON admission reports its actual byte bound for headers and streams',async()=>{
 const max=16*1024,headers={'Content-Length':String(max+1)};
 for(const request of [new Request('https://example.test/v1/recipient-assessments',{method:'POST',headers}),new Request('https://example.test/v1/recipient-assessments',{method:'POST',body:JSON.stringify({padding:'x'.repeat(max)})})])await assert.rejects(readJson(request,max),{status:413,message:'Request exceeds 16384 bytes.'});
 const input={padding:'x'.repeat(max-14)};assert.deepEqual(await readJson(new Request('https://example.test/v1/recipient-assessments',{method:'POST',body:JSON.stringify(input)}),max),input);
});
test('HubSpot preparation exposes only two exact POST commands without changing legacy destination GETs',()=>{
 const id='11111111-1111-4111-8111-111111111111';
 for(const command of ['hubspot-review','hubspot-artifact']){
  assert.doesNotThrow(()=>assertRouteMethod(['email-revisions',id,command],'POST'));
  for(const method of ['GET','HEAD','OPTIONS','PUT','PATCH','DELETE'])assert.throws(()=>assertRouteMethod(['email-revisions',id,command],method),{status:405,code:'METHOD_NOT_ALLOWED'});
  for(const path of [['email-revisions','bad',command],['email-revisions',id,command,'extra']])assert.throws(()=>assertRouteMethod(path,'POST'),{status:404,code:'RESOURCE_NOT_FOUND'});
 }
 for(const command of ['destination-review','destination-artifact']){assert.doesNotThrow(()=>assertRouteMethod(['email-revisions',id,command],'GET'));assert.throws(()=>assertRouteMethod(['email-revisions',id,command],'POST'),{status:405});}
});
test('HubSpot POST authority requires the documented export scope rather than an unrelated write scope',()=>{
 for(const command of ['hubspot-review','hubspot-artifact'])assert.equal(scopeForResource('email-revisions','POST',command),'emails:export');
});
