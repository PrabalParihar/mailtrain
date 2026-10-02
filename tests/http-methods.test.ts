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
