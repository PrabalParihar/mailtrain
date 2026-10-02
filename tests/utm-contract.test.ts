import test from'node:test';import assert from'node:assert/strict';import{apiSpec,absoluteSchema,validateSchema}from'../scripts/api-validation';import{blankSpec}from'../src/domain/email';
const policy={utm_source:'newsletter',utm_medium:'email',utm_campaign:'early-access'};
test('generated EmailSpec accepts optional explicit tracking and retains strict three-field bounds',()=>{
 const schema=absoluteSchema({$ref:'#/components/schemas/EmailSpec'}),spec={...blankSpec('11111111-1111-4111-8111-111111111111','Fixture'),tracking:policy};validateSchema(schema,spec);
 for(const tracking of[{},null,{...policy,recipient:'private'},{...policy,utm_source:''},{...policy,utm_campaign:'x'.repeat(129)}])assert.throws(()=>validateSchema(schema,{...spec,tracking}));
});
test('published draft and preview examples carry the same explicit public metadata policy',()=>{
 for(const[path,method]of[['/v1/emails/{id}/draft','patch'],['/v1/emails/{id}/preview','post']]as const){const example=apiSpec.paths[path][method].requestBody.content['application/json'].example;assert.deepEqual(example.spec.tracking,policy);assert.ok(!JSON.stringify(example).includes('recipient'));}
});
