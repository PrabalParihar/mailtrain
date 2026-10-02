import test from 'node:test';
import assert from 'node:assert/strict';
import {apiSpec,validateSchema} from '../scripts/api-validation';
import {operationRegistry} from '../sdk/operations';
import {assertRouteMethod} from '../src/server/http';
import {KeyInput,scopeForResource} from '../src/domain/api-keys';
import {normalizeSender,SenderDraftInput,SenderVersionInput,SenderCheckInput,SenderVersionView} from '../src/domain/sender-domain';

const id='11111111-1111-4111-8111-111111111111',time='2026-10-02T12:00:00.000Z';
const draft={name:'Owned sender',provider:'ses',account_label:'Operator reference only',region:'us-east-1',from_name:'Owned sender',from_address:'team@example.test',reply_to:null};
const snapshot=normalizeSender(draft),sender={...snapshot,id,version:1,created_at:time,updated_at:time,connection_status:'not_connected',sending_enabled:false};
const history={sender_id:id,version:1,snapshot,created_by:'owned-manager',created_at:time};
const check={id,sender_id:id,sender_version:1,created_at:time,created_by:'owned-manager',observation:{domain:snapshot.domain,observed_at:time,scope:'exact_domain_txt',spf:{owner:snapshot.domain,records:[],status:'unavailable',error:'reserved_domain'},dmarc:{owner:'_dmarc.'+snapshot.domain,records:[],status:'unavailable',error:'reserved_domain'},provider_verified:false,authentication_verified:false,sending_enabled:false}};
const operations=[['/v1/sender-identities','get'],['/v1/sender-identities','post'],['/v1/sender-identities/{id}','get'],['/v1/sender-identities/{id}/versions','get'],['/v1/sender-identities/{id}/versions','post'],['/v1/sender-identities/{id}/dns-checks','get'],['/v1/sender-identities/{id}/dns-checks','post']]as const;
function definition(path:string,method:string){const value=apiSpec.paths[path]?.[method];assert.ok(value,'Missing public sender contract '+method+' '+path);return value;}
function response(path:string,method:string,value:unknown){const status=path==='/v1/sender-identities'&&method==='post'?201:200,schema=definition(path,method).responses[status]?.content?.['application/json']?.schema;assert.ok(schema);validateSchema(schema,value);}
const page=(data:unknown[])=>({request_id:'owned-request',data,total_count:data.length,has_more:false,next_cursor:null});

test('sender routes expose exactly the seven managed methods and reject invented provider/setup/send commands',()=>{
 for(const [path,method]of operations)assert.doesNotThrow(()=>assertRouteMethod(path.replace('{id}',id).split('/').slice(2),method.toUpperCase()));
 for(const path of [['sender-identities'],['sender-identities',id],['sender-identities',id,'versions'],['sender-identities',id,'dns-checks']])for(const method of ['PUT','PATCH','DELETE'])assert.throws(()=>assertRouteMethod(path,method));
 for(const command of ['connect','verify','dkim','send','credentials','unknown'])assert.throws(()=>assertRouteMethod(['sender-identities',id,command],'POST'));
 for(const path of [['sender-identities','not-a-uuid'],['sender-identities',id+'/versions'],['sender-identities',id,'versions','extra']])assert.throws(()=>assertRouteMethod(path,'GET'));
});

test('sender scopes are explicit and cannot be substituted with integration or campaign scopes',()=>{
 assert.deepEqual(KeyInput.parse({name:'Owned sender reader',scopes:['sender:read'],expires_in_days:1}).scopes,['sender:read']);
 assert.deepEqual(KeyInput.parse({name:'Owned sender manager',scopes:['sender:read','sender:write'],expires_in_days:1}).scopes,['sender:read','sender:write']);
 for(const command of [undefined,'versions','dns-checks']){assert.equal(scopeForResource('sender-identities','GET',command),'sender:read');assert.equal(scopeForResource('sender-identities','POST',command),'sender:write');}
 assert.equal(KeyInput.safeParse({name:'Invented',scopes:['sender:send'],expires_in_days:1}).success,false);
});

test('generated sender operations have matching SDK entries, strict typed requests and exact idempotency contracts',()=>{
 for(const [path,method]of operations){const operation=definition(path,method);assert.equal(Object.values(operationRegistry).filter(entry=>entry.path===path&&entry.method===method.toUpperCase()).length,1);assert.equal(typeof operation.operationId,'string');
  if(method==='post'){const media=operation.requestBody?.content?.['application/json'];assert.ok(media?.schema);assert.ok(media.example);validateSchema(media.schema,media.example);assert.ok(operation.parameters.some((parameter:{in:string;name:string;required?:boolean})=>parameter.in==='header'&&parameter.name.toLowerCase()==='idempotency-key'&&parameter.required===true));
   const schema=path.endsWith('/dns-checks')?SenderCheckInput:path.endsWith('/versions')?SenderVersionInput:SenderDraftInput;schema.parse(media.example);
   for(const extra of [{credentials:{private_token:'synthetic-only'}},{connection_status:'connected'},{sending_enabled:true},{provider_verified:true},{domain:'invented.test'}])assert.throws(()=>validateSchema(media.schema,{...media.example,...extra}));
  }
 }
});

test('public current/version/check responses expose only draft and observation fields with disabled readiness',()=>{
 response('/v1/sender-identities','post',{request_id:'r',sender});response('/v1/sender-identities/{id}','get',{request_id:'r',sender});response('/v1/sender-identities/{id}/versions','post',{request_id:'r',sender,changed:true});
 response('/v1/sender-identities/{id}/dns-checks','post',{request_id:'r',check});assert.deepEqual(SenderVersionView.parse(history),history);
 for(const patch of [{connection_status:'connected'},{sending_enabled:true},{credentials:{secret:'synthetic-only'}},{workspace_id:id},{created_by:'private-actor'}])assert.throws(()=>response('/v1/sender-identities/{id}','get',{request_id:'r',sender:{...sender,...patch}}));
 for(const field of ['provider_verified','authentication_verified','sending_enabled'])assert.throws(()=>response('/v1/sender-identities/{id}/dns-checks','post',{request_id:'r',check:{...check,observation:{...check.observation,[field]:true}}}));
 assert.throws(()=>response('/v1/sender-identities/{id}/dns-checks','post',{request_id:'r',check:{...check,observation:{...check.observation,private_resolver_error:'synthetic-only'}}}));
});

test('sender collection/version/check pages require complete paging metadata and reject private or forged history fields',()=>{
 for(const [path,row]of [['/v1/sender-identities',sender],['/v1/sender-identities/{id}/versions',history],['/v1/sender-identities/{id}/dns-checks',check]]as const){response(path,'get',page([row]));response(path,'get',page([]));for(const field of ['total_count','has_more','next_cursor']){const incomplete={...page([row])}as Record<string,unknown>;delete incomplete[field];assert.throws(()=>response(path,'get',incomplete));}assert.throws(()=>response(path,'get',page([{...row,workspace_id:id,private_token:'synthetic-only'}])));}
 assert.throws(()=>response('/v1/sender-identities/{id}/versions','get',page([{...history,snapshot:{...snapshot,credential:'synthetic-only'}}])));
 assert.throws(()=>response('/v1/sender-identities/{id}/versions','get',page([{...history,snapshot:{...snapshot,sending_enabled:true}}])));
});
