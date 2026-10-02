import {randomUUID} from 'node:crypto';
import type pg from 'pg';
import {z} from 'zod';
import {CreationWake,type CreationWakeData} from '../domain/creation-queue';
import {BrandSchema,type Brand} from '../domain/brand';
import {BrandMemoryChunk,BrandMemoryContext,selectMemoryChunks,type MemoryContext} from '../domain/brand-memory';
const timestamp=z.iso.datetime({offset:true});
const Claim=z.object({workspace_id:z.uuid(),operation_id:z.uuid(),token:z.uuid(),lease_until:timestamp,deadline_at:timestamp}).strict();
export type CreationClaim=z.infer<typeof Claim>;
const Operation=z.object({id:z.uuid(),workspace_id:z.uuid(),type:z.enum(['brand.extract','email.generate']),input:z.record(z.string(),z.unknown()),created_by:z.string(),created_api_key_id:z.uuid().nullable()});
export type CreationContext={operation:z.infer<typeof Operation>;brand:Brand|null;memory:MemoryContext|null;grant_until:string};
const Outcome=z.object({outcome:z.enum(['success','not_started','safe_transient','rate_limited','terminal','ambiguous']),result:z.record(z.string(),z.unknown()).optional(),retry_after_ms:z.number().int().min(0).max(86400000).optional()}).strict().refine(value=>value.outcome!=='success'||value.result!==undefined,'Known success requires result evidence.');
export type CreationSettlement=z.infer<typeof Outcome>;
export async function dueCreation(pool:pg.Pool):Promise<CreationWakeData[]>{return(await pool.query('SELECT * FROM public.mailcraft_creation_due()')).rows.map(row=>CreationWake.parse(row));}
export async function claimCreation(pool:pg.Pool,input:CreationWakeData):Promise<CreationClaim|null>{
 const wake=CreationWake.parse(input),row=(await pool.query('SELECT public.mailcraft_claim_creation($1,$2,$3)AS result',[wake.workspace_id,wake.operation_id,randomUUID()])).rows[0].result;return row===null?null:Claim.parse(row);
}
async function creationContext(pool:pg.Pool,input:CreationClaim,start:boolean):Promise<CreationContext|null>{
 const claim=Claim.parse(input),row=(await pool.query(start?'SELECT public.mailcraft_begin_creation($1,$2,$3)AS result':'SELECT public.mailcraft_prepare_creation($1,$2,$3)AS result',[claim.workspace_id,claim.operation_id,claim.token])).rows[0].result;
 if(row===null)return null;
 const operation=Operation.parse(row.operation);if(operation.workspace_id!==claim.workspace_id||operation.id!==claim.operation_id)throw new Error('Creation context identity mismatch.');
 let brand:Brand|null=null,memory:MemoryContext|null=null;
 if(operation.type==='email.generate'){
  brand=BrandSchema.parse(row.brand);const kit=z.uuid().parse(operation.input.brand_kit_version_id),brief=z.string().max(8000).parse(operation.input.prompt),candidates=z.array(BrandMemoryChunk).max(6400).parse(row.memory_candidates);
  memory=BrandMemoryContext.parse({brand_kit_version_id:kit,retrieval_version:'lexical-1',retrieved_at:new Date().toISOString(),chunks:selectMemoryChunks(candidates,brief)});
 }
 return{operation,brand,memory,grant_until:timestamp.parse(row.grant_until)};
}
export function prepareCreationAttempt(pool:pg.Pool,input:CreationClaim){return creationContext(pool,input,false);}
export function beginCreationAttempt(pool:pg.Pool,input:CreationClaim){return creationContext(pool,input,true);}
export async function renewCreation(pool:pg.Pool,input:CreationClaim):Promise<boolean>{const claim=Claim.parse(input);return(await pool.query('SELECT public.mailcraft_renew_creation($1,$2,$3)AS result',[claim.workspace_id,claim.operation_id,claim.token])).rows[0].result;}
export async function settleCreation(pool:pg.Pool,input:CreationClaim,provided:CreationSettlement):Promise<boolean>{const claim=Claim.parse(input),outcome=Outcome.parse(provided);return(await pool.query('SELECT public.mailcraft_settle_creation($1,$2,$3,$4,$5,$6)AS result',[claim.workspace_id,claim.operation_id,claim.token,outcome.outcome,outcome.result===undefined?null:JSON.stringify(outcome.result),outcome.retry_after_ms??null])).rows[0].result;}
export async function recoverCreation(pool:pg.Pool,input:CreationWakeData):Promise<boolean>{const wake=CreationWake.parse(input);return(await pool.query('SELECT public.mailcraft_recover_creation($1,$2)AS result',[wake.workspace_id,wake.operation_id])).rows[0].result;}
