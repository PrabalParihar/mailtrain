import type {Tx} from './db';
import type {Principal} from './auth';
import {digest} from './audit';
import {fail} from './errors';
export async function keyed<T>(tx:Tx,p:Principal,action:string,key:string|null,input:unknown,run:()=>Promise<T>):Promise<T>{
 if(!key||key.length>200)fail(400,'IDEMPOTENCY_KEY_REQUIRED','Use an idempotency key for this command.');const ns=p.workspace+':'+p.user+':'+action+':'+key;await tx.query('SELECT pg_advisory_xact_lock(hashtext($1))',[ns]);const hash=digest(input);
 const old=(await tx.query('SELECT payload_hash,response FROM idempotency WHERE workspace_id=$1 AND principal=$2 AND action=$3 AND key=$4',[p.workspace,p.user,action,key])).rows[0];if(old){if(old.payload_hash!==hash)fail(409,'IDEMPOTENCY_MISMATCH','This key was already used for a different payload.');return old.response;}
 const response=await run();await tx.query('INSERT INTO idempotency(workspace_id,principal,action,key,payload_hash,response) VALUES($1,$2,$3,$4,$5,$6)',[p.workspace,p.user,action,key,hash,JSON.stringify(response)]);return response;
}
