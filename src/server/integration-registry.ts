import {z} from 'zod';
import type {Tx} from './db';
import {IntegrationRegistration,IntegrationRotation,IntegrationConnection,type IntegrationConnectionData} from '../domain/integration-registry';

const identity=z.preprocess(value=>typeof value==='string'?value.toLowerCase():value,z.uuid());
const fixedDatabaseErrors=new Set([
 'CONNECTION_INPUT_INVALID','CONNECTION_PERMISSION_DENIED','CONNECTION_BINDING_CONFLICT',
 'CONNECTION_ACCOUNT_CONFLICT','CONNECTION_NOT_FOUND','CONNECTION_VERSION_CONFLICT',
 'CONNECTION_REVOKED','CONNECTION_CREDENTIAL_REUSED',
]);
function validate<S extends z.ZodType>(schema:S,value:unknown):z.output<S>{
 const parsed=schema.safeParse(value);
 if(!parsed.success)throw new Error('CONNECTION_INPUT_INVALID');
 return parsed.data;
}
async function invoke(tx:Tx,sql:string,params:unknown[],requestedId:string):Promise<IntegrationConnectionData>{
 let rows;
 try{rows=(await tx.query(sql,params)).rows;}
 catch(error){throw new Error(error instanceof Error&&fixedDatabaseErrors.has(error.message)?error.message:'CONNECTION_STORAGE_UNAVAILABLE');}
 if(!Array.isArray(rows)||rows.length!==1)throw new Error('CONNECTION_STORAGE_UNAVAILABLE');
 const parsed=IntegrationConnection.safeParse(rows[0]?.value);
 if(!parsed.success||parsed.data.id!==requestedId)throw new Error('CONNECTION_STORAGE_UNAVAILABLE');
 return parsed.data;
}
/** Unmounted: SQL derives current browser manager authority from the tenant transaction. */
export async function registerIntegration(tx:Tx,workspace:string,input:unknown){
 const w=validate(identity,workspace),b=validate(IntegrationRegistration,input);
 const value=await invoke(tx,'SELECT public.mailcraft_register_integration($1,$2,$3,$4,$5,$6,$7) AS value',[w,b.id,b.provider,b.external_account_id,b.auth_mode,b.region,b.credential_reference],b.id);
 if(value.provider!==b.provider||value.auth_mode!==b.auth_mode||value.region!==b.region)throw new Error('CONNECTION_STORAGE_UNAVAILABLE');
 return value;
}
export async function readIntegration(tx:Tx,workspace:string,id:string){
 const w=validate(identity,workspace),connectionId=validate(identity,id);
 return invoke(tx,'SELECT public.mailcraft_read_integration($1,$2) AS value',[w,connectionId],connectionId);
}
export async function rotateIntegration(tx:Tx,workspace:string,id:string,input:unknown){
 const w=validate(identity,workspace),connectionId=validate(identity,id),b=validate(IntegrationRotation,input);
 const value=await invoke(tx,'SELECT public.mailcraft_rotate_integration($1,$2,$3,$4) AS value',[w,connectionId,b.expected_record_version,b.credential_reference],connectionId);
 if(value.state!=='unverified'||value.record_version!==b.expected_record_version+1)throw new Error('CONNECTION_STORAGE_UNAVAILABLE');
 return value;
}
export async function revokeIntegration(tx:Tx,workspace:string,id:string){
 const w=validate(identity,workspace),connectionId=validate(identity,id);
 const value=await invoke(tx,'SELECT public.mailcraft_revoke_integration($1,$2) AS value',[w,connectionId],connectionId);
 if(value.state!=='revoked')throw new Error('CONNECTION_STORAGE_UNAVAILABLE');
 return value;
}
