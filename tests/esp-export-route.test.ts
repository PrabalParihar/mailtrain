import test from 'node:test';import assert from 'node:assert/strict';
import{assertRouteMethod}from'../src/server/http';import{scopeForResource}from'../src/domain/api-keys';
const id='11111111-1111-4111-8111-111111111111';
test('destination review/download are exact GET-only export-scoped paths',()=>{for(const command of ['destination-review','destination-artifact']){assert.doesNotThrow(()=>assertRouteMethod(['email-revisions',id,command],'GET'));assert.throws(()=>assertRouteMethod(['email-revisions',id,command],'POST'));assert.throws(()=>assertRouteMethod(['email-revisions',id,command,'extra'],'GET'));assert.equal(scopeForResource('email-revisions','GET',command),'emails:export');}});
