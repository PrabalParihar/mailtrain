import type{Tx}from'./db';import{readEventBody}from'./events';import{nextWebhookAttempt,type WebhookHttpResult}from'./webhook-transport';import type{WrappedWebhookSecret}from'./webhook-secrets';
export type WebhookClaim={id:string;workspace_id:string;endpoint_id:string;event_id:string;attempt_number:number;lease_token:string};
const lock='lettercape.webhook.queue.capacity.v1';
async function queueLock(tx:Tx){return(await tx.query('SELECT pg_try_advisory_xact_lock(hashtextextended($1,0))AS acquired',[lock])).rows[0].acquired as boolean;}
export async function admitWebhookEvents(tx:Tx):Promise<{inserted:number}>{
 if(!await queueLock(tx))return{inserted:0};
 await tx.query("INSERT INTO webhook_queue_state(workspace_id)SELECT DISTINCT workspace_id FROM webhook_endpoints WHERE status='enabled' ON CONFLICT DO NOTHING");
 const workspace=(await tx.query(`SELECT q.workspace_id FROM webhook_queue_state q WHERE
 (SELECT count(*) FROM webhook_deliveries d WHERE d.workspace_id=q.workspace_id AND d.state IN('pending','leased'))<1000 AND EXISTS(
 SELECT 1 FROM webhook_endpoints e JOIN outbox o ON o.workspace_id=e.workspace_id AND e.subscriptions ? o.type
 WHERE e.workspace_id=q.workspace_id AND e.status='enabled' AND o.event_body IS NOT NULL AND o.recorded_at>=date_trunc('milliseconds',e.created_at)
 AND mailcraft_webhook_service_authorized(e.workspace_id,e.id) AND NOT EXISTS(SELECT 1 FROM webhook_deliveries d WHERE d.workspace_id=e.workspace_id AND d.endpoint_id=e.id AND d.event_id=o.id))
 ORDER BY q.last_admitted,q.workspace_id LIMIT 1 FOR UPDATE OF q SKIP LOCKED`)).rows[0]?.workspace_id;
 if(!workspace)return{inserted:0};
 const inserted=await tx.query(`INSERT INTO webhook_deliveries(workspace_id,endpoint_id,event_id,created_at,deadline)
 SELECT e.workspace_id,e.id,o.id,statement_timestamp(),statement_timestamp()+interval '24 hours' FROM webhook_endpoints e JOIN outbox o ON o.workspace_id=e.workspace_id AND e.subscriptions ? o.type
 WHERE e.workspace_id=$1 AND e.status='enabled' AND o.event_body IS NOT NULL AND o.recorded_at>=date_trunc('milliseconds',e.created_at)
 AND mailcraft_webhook_service_authorized(e.workspace_id,e.id) AND NOT EXISTS(SELECT 1 FROM webhook_deliveries d WHERE d.workspace_id=e.workspace_id AND d.endpoint_id=e.id AND d.event_id=o.id)
 ORDER BY o.recorded_at,o.id,e.id LIMIT LEAST(25,1000-(SELECT count(*)::int FROM webhook_deliveries WHERE workspace_id=$1 AND state IN('pending','leased'))) ON CONFLICT DO NOTHING`,[workspace]);
 await tx.query('UPDATE webhook_queue_state SET last_admitted=clock_timestamp()WHERE workspace_id=$1',[workspace]);return{inserted:inserted.rowCount??0};
}
export async function claimWebhookDelivery(tx:Tx):Promise<WebhookClaim|null>{
 if(!await queueLock(tx))return null;
 const expired=(await tx.query("SELECT * FROM webhook_deliveries WHERE state='leased' AND lease_until<=clock_timestamp()ORDER BY lease_until LIMIT 2 FOR UPDATE SKIP LOCKED")).rows;
 for(const row of expired){
  await tx.query("INSERT INTO webhook_attempts(workspace_id,delivery_id,attempt_number,phase)VALUES($1,$2,$3,'recovered')ON CONFLICT DO NOTHING",[row.workspace_id,row.id,row.attempt_number]);
  await tx.query("UPDATE webhook_deliveries SET state=CASE WHEN deadline<=clock_timestamp()THEN 'dead_letter' ELSE 'pending' END,lease_token=NULL,lease_until=NULL,authorized_until=NULL,authorized_key_version=NULL,next_at=clock_timestamp(),error_class=CASE WHEN deadline<=clock_timestamp()THEN 'retry_budget_exhausted' ELSE error_class END WHERE workspace_id=$1 AND id=$2",[row.workspace_id,row.id]);
 }
 await tx.query("UPDATE webhook_deliveries SET state='dead_letter',error_class='retry_budget_exhausted'WHERE state='pending' AND deadline<=clock_timestamp()");
 if((await tx.query("SELECT count(*)::int AS n FROM webhook_deliveries WHERE state='leased'")).rows[0].n>=2)return null;
 const row=(await tx.query(`SELECT d.* FROM webhook_deliveries d JOIN webhook_queue_state q ON q.workspace_id=d.workspace_id WHERE d.state='pending' AND d.next_at<=clock_timestamp() AND d.deadline>clock_timestamp()
 AND NOT EXISTS(SELECT 1 FROM webhook_deliveries active WHERE active.workspace_id=d.workspace_id AND active.state='leased')
 ORDER BY q.last_claimed,d.next_at,d.id LIMIT 1 FOR UPDATE OF d SKIP LOCKED`)).rows[0];if(!row)return null;
 const claim=(await tx.query("UPDATE webhook_deliveries SET state='leased',attempt_number=attempt_number+1,lease_token=gen_random_uuid(),lease_until=clock_timestamp()+interval '30 seconds',authorized_until=NULL,authorized_key_version=NULL WHERE workspace_id=$1 AND id=$2 RETURNING id,workspace_id,endpoint_id,event_id,attempt_number,lease_token",[row.workspace_id,row.id])).rows[0]as WebhookClaim;
 await tx.query('UPDATE webhook_queue_state SET last_claimed=clock_timestamp()WHERE workspace_id=$1',[claim.workspace_id]);
 await tx.query("INSERT INTO webhook_attempts(workspace_id,delivery_id,attempt_number,phase)VALUES($1,$2,$3,'started')",[claim.workspace_id,claim.id,claim.attempt_number]);return claim;
}
async function currentLease(tx:Tx,claim:WebhookClaim){return(await tx.query("SELECT * FROM webhook_deliveries WHERE workspace_id=$1 AND id=$2 AND endpoint_id=$3 AND event_id=$4 AND state='leased' AND attempt_number=$5 AND lease_token=$6 AND lease_until>clock_timestamp()FOR UPDATE",[claim.workspace_id,claim.id,claim.endpoint_id,claim.event_id,claim.attempt_number,claim.lease_token])).rows[0];}
async function block(tx:Tx,claim:WebhookClaim,error:'authority_revoked'|'event_integrity'|'key_unavailable'){
 await tx.query("UPDATE webhook_deliveries SET state='blocked',error_class=$3,lease_token=NULL,lease_until=NULL,authorized_until=NULL,authorized_key_version=NULL WHERE workspace_id=$1 AND id=$2",[claim.workspace_id,claim.id,error]);
 await tx.query("INSERT INTO webhook_attempts(workspace_id,delivery_id,attempt_number,phase,error_class)VALUES($1,$2,$3,'settled',$4)",[claim.workspace_id,claim.id,claim.attempt_number,error]);
}
export async function authorizeWebhookDelivery(tx:Tx,claim:WebhookClaim):Promise<{target_url:string;body:string;secret_version:number;wrapped_secret:WrappedWebhookSecret;authorized_until:string}|null>{
 const lease=await currentLease(tx,claim);if(!lease||lease.authorized_until)return null;
 await tx.query("SELECT pg_advisory_xact_lock_shared(hashtextextended('lettercape.webhook.endpoint.'||$1::text||':'||$2::text,0))",[claim.workspace_id,claim.endpoint_id]);
 if(!(await tx.query('SELECT mailcraft_webhook_service_authorized($1,$2)AS allowed',[claim.workspace_id,claim.endpoint_id])).rows[0].allowed){await block(tx,claim,'authority_revoked');return null;}
 const endpoint=(await tx.query("SELECT e.target_url,e.secret_version,k.wrapped_secret FROM webhook_endpoints e JOIN webhook_signing_keys k ON k.workspace_id=e.workspace_id AND k.endpoint_id=e.id AND k.secret_version=e.secret_version AND k.state='current' WHERE e.workspace_id=$1 AND e.id=$2",[claim.workspace_id,claim.endpoint_id])).rows[0];
 if(!endpoint){await block(tx,claim,'key_unavailable');return null;}
 const source=(await tx.query('SELECT workspace_id,id,type,aggregate_id,event_schema_version,event_body,event_hash FROM outbox WHERE workspace_id=$1 AND id=$2',[claim.workspace_id,claim.event_id])).rows[0];
 try{readEventBody(source??{});}catch{await block(tx,claim,'event_integrity');return null;}
 const grant=(await tx.query("UPDATE webhook_deliveries SET authorized_until=LEAST(lease_until,clock_timestamp()+interval '10 seconds'),authorized_key_version=$3 WHERE workspace_id=$1 AND id=$2 RETURNING authorized_until",[claim.workspace_id,claim.id,endpoint.secret_version])).rows[0];
 await tx.query("INSERT INTO webhook_attempts(workspace_id,delivery_id,attempt_number,phase,secret_version)VALUES($1,$2,$3,'authorized',$4)",[claim.workspace_id,claim.id,claim.attempt_number,endpoint.secret_version]);
 return{target_url:endpoint.target_url,body:source.event_body,secret_version:endpoint.secret_version,wrapped_secret:endpoint.wrapped_secret,authorized_until:grant.authorized_until.toISOString()};
}
export async function settleWebhookDelivery(tx:Tx,claim:WebhookClaim,result:WebhookHttpResult|{status:null;error_class:'key_unavailable'},jitter:number):Promise<boolean>{
 if(result.status!==null&&(!Number.isSafeInteger(result.status)||result.status<100||result.status>599))throw new Error('Invalid webhook status receipt');
 const lease=await currentLease(tx,claim);if(!lease||!lease.authorized_until)return false;
 const now=(await tx.query('SELECT clock_timestamp()AS now')).rows[0].now.getTime()as number,deadline=lease.deadline.getTime()as number;
 let decision=nextWebhookAttempt({now,deadline,failure_attempts:lease.failure_attempts,status:result.status,retry_after:'retry_after'in result?result.retry_after:undefined,jitter});
 if(result.status===null&&(result.error_class==='capacity'||result.error_class==='aborted'))decision=now+30000>=deadline?{state:'dead_letter',next_at:null,failure_attempts:lease.failure_attempts,error_class:'retry_budget_exhausted'}:{state:'pending',next_at:now+30000,failure_attempts:lease.failure_attempts,error_class:null};
 if(result.status===null&&['unsafe_target','key_unavailable'].includes(result.error_class??''))decision={state:'terminal',next_at:null,failure_attempts:lease.failure_attempts,error_class:null};
 const error=result.status===null&&['unsafe_target','key_unavailable','capacity','aborted'].includes(result.error_class??'')?result.error_class:decision.error_class;
 if(decision.state==='disabled')await tx.query("UPDATE webhook_endpoints SET status='disabled',version=version+1 WHERE workspace_id=$1 AND id=$2 AND status<>'disabled'",[claim.workspace_id,claim.endpoint_id]);
 await tx.query("INSERT INTO webhook_attempts(workspace_id,delivery_id,attempt_number,phase,status_code,secret_version,error_class)VALUES($1,$2,$3,'settled',$4,$5,$6)",[claim.workspace_id,claim.id,claim.attempt_number,result.status,lease.authorized_key_version,error]);
 await tx.query("UPDATE webhook_deliveries SET state=$3,failure_attempts=$4,next_at=COALESCE($5,next_at),error_class=$6,lease_token=NULL,lease_until=NULL,authorized_until=NULL,authorized_key_version=NULL WHERE workspace_id=$1 AND id=$2",[claim.workspace_id,claim.id,result.status===null&&['unsafe_target','key_unavailable'].includes(result.error_class??'')?'blocked':decision.state,decision.failure_attempts,decision.next_at===null?null:new Date(decision.next_at),error]);return true;
}
