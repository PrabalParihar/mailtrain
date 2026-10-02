import test from 'node:test';
import assert from 'node:assert/strict';
import {blankSpec} from '../src/domain/email';
import * as schemas from '../src/domain/email-schema';
const sourceSchema=()=>{
  assert.ok('EmailSourceSpecSchema' in schemas,'canonical source admission schema must be exported');
  return (schemas as typeof schemas & {EmailSourceSpecSchema:typeof schemas.EmailSpecSchema}).EmailSourceSpecSchema;
};
const raw=(source='')=>({...blankSpec('brand','Brand'),editing_mode:'raw_html' as const,raw_html:source,sections:[]});
test('source admission preserves exact inert empty, mixed EOL and active-markup source',()=>{
  for(const value of ['', '\uFEFF<DIV onclick="x()">\r\n<!-- note --><script>x()</script>😀e\u0301</DIV>\r'])assert.equal(sourceSchema().parse(raw(value)).raw_html,value);
});
test('source admission enforces UTF8 budgets and representability',()=>{
  assert.equal(sourceSchema().safeParse(raw('a'.repeat(2097152))).success,true);
  for(const value of ['a'.repeat(2097153),'😀'.repeat(524289),'\u0000','\uD800'])assert.equal(sourceSchema().safeParse(raw(value)).success,false);
});
test('source admission retains structural, schema and managed-reference constraints',()=>{
  const uuid='11111111-1111-4111-8111-111111111111';
  const image={id:'image',type:'image',asset_ref:{asset_id:uuid,variant_id:uuid},alt:'Art'};
  for(const patch of [{unexpected:true},{locale:'made-up'},{raw_html:undefined},{sections:[image]},{schema_version:'1.1',sections:[{...image,src:'https://example.com/a.png'}]},{sections:[{id:'one',type:'text',text:'a'},{id:'one',type:'text',text:'b'}]}])assert.equal(sourceSchema().safeParse({...raw(),...patch}).success,false);
  assert.equal(sourceSchema().safeParse({...raw(),schema_version:'1.1',sections:[image]}).success,true);
});
