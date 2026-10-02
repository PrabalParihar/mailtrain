import test from 'node:test';
import assert from 'node:assert/strict';
import {assertRouteMethod,readJson} from '../src/server/http';
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
