import test from 'node:test';
import assert from 'node:assert/strict';
import type {Tx} from '../src/server/db';
import {IntegrationProvider,IntegrationRegistration,IntegrationRotation,IntegrationConnection} from '../src/domain/integration-registry';
import {registerIntegration,readIntegration,rotateIntegration,revokeIntegration} from '../src/server/integration-registry';

const workspace='12345678-1234-4234-8234-123456789abc',id='87654321-4321-4321-a321-cba987654321',credential='12345678-1234-4234-9234-123456789abc';
const blockers=['CONNECTION_AUTH_MODE_UNAPPROVED','ACCOUNT_ENTITLEMENT_UNVERIFIED','REAL_CLIENT_PREFLIGHT_UNAVAILABLE','DESTINATION_CONFORMANCE_UNVERIFIED','DURABLE_REMOTE_EXPORT_UNAVAILABLE','MANAGEMENT_LINK_UNVERIFIED'];
const registration=()=>({id,provider:'klaviyo',external_account_id:' Account Case 😀 é ',auth_mode:'oauth',region:' EU ',credential_reference:credential});
const connection=()=>({id,provider:'klaviyo',auth_mode:'oauth',region:' EU ',state:'unverified',record_version:1,credential_version:1,created_at:'2026-10-03T12:00:00.123456Z',updated_at:'2026-10-03T12:00:00.123457Z',revoked_at:null,can_export:false,blockers:[...blockers]});
const revoked=()=>({...connection(),state:'revoked',record_version:2,revoked_at:connection().updated_at,blockers:['CONNECTION_REVOKED',...blockers]});
function fixture(value:unknown=connection(),error?:unknown){const calls:{sql:string;params:unknown[]}[]=[];const tx={async query(sql:string,params:unknown[]){calls.push({sql,params});if(error)throw error;return {rows:[{value}]};}} as unknown as Tx;return {tx,calls};}
const fixed=(code:string)=>(error:unknown)=>{assert.ok(error instanceof Error);assert.equal(error.message,code);assert.equal('cause' in error,false);assert.deepEqual(Object.keys(error),[]);assert.equal(JSON.stringify(error).includes('SECRET_MARKER'),false);assert.equal(String(error).includes('SECRET_MARKER'),false);return true;};

test('declared providers and exact identity strings are preserved without folding',()=>{
 for(const provider of ['klaviyo','mailchimp','hubspot','brevo','omnisend'])assert.equal(IntegrationProvider.parse(provider),provider);
 assert.equal(IntegrationProvider.safeParse('Klaviyo').success,false);
 assert.deepEqual(IntegrationRegistration.parse(registration()),registration());
 for(const account of ['x'.repeat(255),'😀'.repeat(255)])assert.equal(IntegrationRegistration.safeParse({...registration(),external_account_id:account}).success,true);
});

test('strict schemas reject private/unknown fields and true readiness',()=>{
 for(const [schema,value] of [[IntegrationRegistration,registration()],[IntegrationRotation,{expected_record_version:1,credential_reference:credential}],[IntegrationConnection,connection()]] as const){for(const field of ['token','password','api_key','actor','history','private_extra'])assert.equal(schema.safeParse({...value,[field]:'SECRET_MARKER'}).success,false,field);}
 assert.equal(IntegrationConnection.safeParse({...connection(),can_export:true}).success,false);
});

test('UUIDs match versions 1–8, RFC variants, nil/max and canonicalize case',()=>{
 const valid=['00000000-0000-0000-0000-000000000000','ffffffff-ffff-ffff-ffff-ffffffffffff'];
 for(let version=1;version<=8;version++)for(const variant of ['8','9','a','b'])valid.push(`12345678-1234-${version}234-${variant}234-123456789abc`);
 for(const uuid of valid){const parsed=IntegrationRegistration.parse({...registration(),id:uuid.toUpperCase(),credential_reference:uuid.toUpperCase()});assert.equal(parsed.id,uuid);assert.equal(parsed.credential_reference,uuid);assert.equal(IntegrationConnection.parse({...connection(),id:uuid.toUpperCase()}).id,uuid);}
 for(const uuid of ['12345678-1234-9234-8234-123456789abc','12345678-1234-4234-7234-123456789abc','12345678123442348234123456789abc','not-a-uuid',' '+id,id+' '])assert.equal(IntegrationRegistration.safeParse({...registration(),id:uuid}).success,false,uuid);
});

test('bounded private identity text rejects whitespace, controls and unpaired surrogates',()=>{
 for(const field of ['external_account_id','region'])for(const value of ['', ' \t','\u00a0\ufeff\u2003\u3000','x\u0000y','x\u001fy','x\u007fy','x\u0080y','x\u009fy','\ud800','\udc00','x\ud800y'])assert.equal(IntegrationRegistration.safeParse({...registration(),[field]:value}).success,false,field+' '+JSON.stringify(value));
 assert.equal(IntegrationRegistration.safeParse({...registration(),external_account_id:'😀'.repeat(256)}).success,false);
 assert.equal(IntegrationRegistration.safeParse({...registration(),region:'😀'.repeat(48)}).success,true);
 assert.equal(IntegrationRegistration.safeParse({...registration(),region:'r'.repeat(49)}).success,false);
});

test('versions are positive PostgreSQL-safe integers',()=>{
 for(const version of [0,-1,1.1,NaN,Infinity,2147483648,Number.MAX_SAFE_INTEGER,'1',null]){
  assert.equal(IntegrationRotation.safeParse({expected_record_version:version,credential_reference:credential}).success,false);
  assert.equal(IntegrationConnection.safeParse({...connection(),record_version:version}).success,false);
  assert.equal(IntegrationConnection.safeParse({...connection(),credential_version:version}).success,false);
 }
 assert.equal(IntegrationRotation.safeParse({expected_record_version:2147483647,credential_reference:credential}).success,true);
});

test('state, versions, revoked timestamp and blockers form exact ordered tuples',()=>{
 assert.equal(IntegrationConnection.safeParse(revoked()).success,true);
 for(const patch of [{state:'ready'},{record_version:2},{revoked_at:connection().updated_at},{blockers:[]},{blockers:[...blockers].reverse()},{blockers:[...blockers,'CONNECTION_REVOKED']},{blockers:['CONNECTION_REVOKED',...blockers]},{blockers:[...blockers,blockers[0]]}])assert.equal(IntegrationConnection.safeParse({...connection(),...patch}).success,false);
 for(const patch of [{revoked_at:null},{record_version:1},{credential_version:2},{blockers},{revoked_at:'2026-10-03T12:00:00.123458Z'}])assert.equal(IntegrationConnection.safeParse({...revoked(),...patch}).success,false);
});

test('timestamps retain microseconds and compare offset instants precisely',()=>{
 assert.deepEqual(IntegrationConnection.parse(connection()),connection());
 assert.equal(IntegrationConnection.safeParse({...revoked(),revoked_at:'2026-10-03T14:00:00.123457+02:00'}).success,true);
 assert.equal(IntegrationConnection.safeParse({...connection(),updated_at:'2026-10-03T14:00:00.123456+02:00'}).success,true);
 for(const timestamp of ['2026-10-03T12:00:00.123455Z','2026-10-03T12:00:00.1234567Z','2026-02-30T12:00:00Z','2026-10-03T12:00:00','2026-10-03T12:00:00+24:00','yesterday'])assert.equal(IntegrationConnection.safeParse({...connection(),updated_at:timestamp}).success,false,timestamp);
 assert.equal(IntegrationConnection.safeParse({...revoked(),revoked_at:'2026-10-03T12:00:00.123456Z'}).success,false);
});

test('every malformed wrapper input issues zero SQL with a fresh fixed error',async()=>{
 const runs=[(tx:Tx)=>registerIntegration(tx,workspace,{...registration(),token:'SECRET_MARKER'}),(tx:Tx)=>registerIntegration(tx,workspace,{...registration(),id:'malformed'}),(tx:Tx)=>readIntegration(tx,'invalid',id),(tx:Tx)=>readIntegration(tx,workspace,'invalid'),(tx:Tx)=>rotateIntegration(tx,workspace,id,{expected_record_version:0,credential_reference:credential}),(tx:Tx)=>rotateIntegration(tx,workspace,'invalid',{expected_record_version:1,credential_reference:credential}),(tx:Tx)=>revokeIntegration(tx,workspace,'invalid')];
 for(const run of runs){const f=fixture();await assert.rejects(run(f.tx),fixed('CONNECTION_INPUT_INVALID'));assert.equal(f.calls.length,0);}
});

test('wrappers use only fixed parameterized functions and canonical UUIDs',async()=>{
 const f=fixture();await registerIntegration(f.tx,workspace.toUpperCase(),{...registration(),id:id.toUpperCase(),credential_reference:credential.toUpperCase()});
 assert.equal(f.calls.length,1);assert.equal(f.calls[0].sql,'SELECT public.mailcraft_register_integration($1,$2,$3,$4,$5,$6,$7) AS value');assert.deepEqual(f.calls[0].params,[workspace,id,'klaviyo',registration().external_account_id,'oauth',' EU ',credential]);
 for(const [run,sql,params,value] of [[(tx:Tx)=>readIntegration(tx,workspace,id),'SELECT public.mailcraft_read_integration($1,$2) AS value',[workspace,id],connection()],[(tx:Tx)=>rotateIntegration(tx,workspace,id,{expected_record_version:1,credential_reference:credential}),'SELECT public.mailcraft_rotate_integration($1,$2,$3,$4) AS value',[workspace,id,1,credential],{...connection(),record_version:2,credential_version:2}],[(tx:Tx)=>revokeIntegration(tx,workspace,id),'SELECT public.mailcraft_revoke_integration($1,$2) AS value',[workspace,id],revoked()]] as const){const f=fixture(value);await run(f.tx);assert.deepEqual(f.calls,[{sql,params}]);}
});

test('malformed, private, mismatched identity and contradictory storage outputs are refused',async()=>{
 for(const value of [null,{...connection(),external_account_id:'SECRET_MARKER'},{...connection(),credential_reference:credential},{...connection(),can_export:true},{...connection(),id:credential}])for(const run of [(tx:Tx)=>readIntegration(tx,workspace,id),(tx:Tx)=>registerIntegration(tx,workspace,registration())])await assert.rejects(run(fixture(value).tx),fixed('CONNECTION_STORAGE_UNAVAILABLE'));
 for(const patch of [{provider:'brevo'},{auth_mode:'api_key'},{region:'eu'}])await assert.rejects(registerIntegration(fixture({...connection(),...patch}).tx,workspace,registration()),fixed('CONNECTION_STORAGE_UNAVAILABLE'));
 for(const value of [connection(),revoked(),{...connection(),record_version:3,credential_version:3}])await assert.rejects(rotateIntegration(fixture(value).tx,workspace,id,{expected_record_version:1,credential_reference:credential}),fixed('CONNECTION_STORAGE_UNAVAILABLE'));
 await assert.rejects(revokeIntegration(fixture().tx,workspace,id),fixed('CONNECTION_STORAGE_UNAVAILABLE'));
 for(const rows of [[],[{value:connection()},{value:connection()}]]){const tx={async query(){return {rows};}} as unknown as Tx;await assert.rejects(readIntegration(tx,workspace,id),fixed('CONNECTION_STORAGE_UNAVAILABLE'));}
});

test('current authority errors propagate only fixed codes and never PG details or causes',async()=>{
 for(const code of ['CONNECTION_INPUT_INVALID','CONNECTION_PERMISSION_DENIED','CONNECTION_BINDING_CONFLICT','CONNECTION_ACCOUNT_CONFLICT','CONNECTION_NOT_FOUND','CONNECTION_VERSION_CONFLICT','CONNECTION_REVOKED','CONNECTION_CREDENTIAL_REUSED']){
  const raw=Object.assign(new Error(code),{detail:'SECRET_MARKER private account/ref',code:'P0001',cause:new Error('SECRET_MARKER')});
  for(const run of [(tx:Tx)=>readIntegration(tx,workspace,id),(tx:Tx)=>registerIntegration(tx,workspace,registration()),(tx:Tx)=>rotateIntegration(tx,workspace,id,{expected_record_version:1,credential_reference:credential}),(tx:Tx)=>revokeIntegration(tx,workspace,id)])await assert.rejects(run(fixture(connection(),raw).tx),error=>{assert.notEqual(error,raw);return fixed(code)(error);});
 }
 for(const raw of [Object.assign(new Error('SECRET_MARKER'),{detail:credential}),new Error('CONNECTION_NOT_FOUND SECRET_MARKER'),{message:'CONNECTION_PERMISSION_DENIED',detail:'SECRET_MARKER'},'SECRET_MARKER',null])await assert.rejects(readIntegration(fixture(connection(),raw===null?{detail:'SECRET_MARKER'}:raw).tx,workspace,id),fixed('CONNECTION_STORAGE_UNAVAILABLE'));
});

// Individually named boundary regressions keep each required RED behavior observable.
for(const [name,schema,value] of [
 ['ready=true',IntegrationConnection,{...connection(),can_export:true}],
 ['malformed UUID version',IntegrationRegistration,{...registration(),id:'12345678-1234-9234-8234-123456789abc'}],
 ['control character',IntegrationRegistration,{...registration(),external_account_id:'x\u0080y'}],
 ['unpaired surrogate',IntegrationRegistration,{...registration(),external_account_id:'\ud800'}],
 ['blocker order',IntegrationConnection,{...connection(),blockers:[...blockers].reverse()}],
 ['one microsecond backwards',IntegrationConnection,{...connection(),updated_at:'2026-10-03T12:00:00.123455Z'}],
] as const)test('boundary rejects '+name,()=>assert.equal(schema.safeParse(value).success,false));

test('all wrapper identities reject malformed workspaces before SQL',async()=>{
 for(const run of [(tx:Tx)=>registerIntegration(tx,'malformed',registration()),(tx:Tx)=>rotateIntegration(tx,'malformed',id,{expected_record_version:1,credential_reference:credential}),(tx:Tx)=>revokeIntegration(tx,'malformed',id)]){const f=fixture();await assert.rejects(run(f.tx),fixed('CONNECTION_INPUT_INVALID'));assert.equal(f.calls.length,0);}
});

test('rotate and revoke reject otherwise valid rows for a foreign identity',async()=>{
 await assert.rejects(rotateIntegration(fixture({...connection(),id:credential,record_version:2,credential_version:2}).tx,workspace,id,{expected_record_version:1,credential_reference:credential}),fixed('CONNECTION_STORAGE_UNAVAILABLE'));
 await assert.rejects(revokeIntegration(fixture({...revoked(),id:credential}).tx,workspace,id),fixed('CONNECTION_STORAGE_UNAVAILABLE'));
});
