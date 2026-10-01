import { randomBytes,randomUUID } from 'node:crypto';
import { WebhookEndpointInput,WebhookVersionInput,WebhookRotateInput,WebhookEndpoint } from '../domain/webhooks';
import type { Principal } from './auth';import type { Tx } from './db';
import { sealWebhookSecret,type WebhookVault } from './webhook-secrets';
import { webhookTarget } from './webhook-transport';
import { audit } from './audit';import { fail } from './errors';
export const webhookMetadata="id,name,split_part(target_url,'/',1)||'//'||split_part(target_url,'/',3) AS target_origin,subscriptions,status,version,secret_version,created_by,created_at,updated_at,dns_checked_at";
export function asWebhookEndpoint(row:Record<string,unknown>){
 const date=(value:unknown)=>value instanceof Date?value.toISOString():value;
 return WebhookEndpoint.parse({...row,created_at:date(row.created_at),updated_at:date(row.updated_at),dns_checked_at:date(row.dns_checked_at)});
}
async function manager(tx:Tx,p:Principal){
 const allowed=(await tx.query("SELECT mailcraft_webhook_manager($1,'webhooks:write')AS allowed",[p.workspace])).rows[0].allowed;
 if(!allowed)fail(403,'INSUFFICIENT_SCOPE','Current Owner or Admin webhook write authority is required.');
 await tx.query("SET LOCAL lock_timeout='2s'");
}
async function current(tx:Tx,id:string,version:number){
 const row=(await tx.query('SELECT '+webhookMetadata+' FROM webhook_endpoints WHERE id=$1 FOR UPDATE',[id])).rows[0];
 if(!row)fail(404,'RESOURCE_NOT_FOUND','Webhook endpoint not found.');
 if(row.version!==version)fail(409,'VERSION_CONFLICT','Webhook endpoint changed. Reload before retrying.');
 if(row.status==='disabled')fail(409,'WEBHOOK_ENDPOINT_DISABLED','This endpoint is disabled. Create a new endpoint.');
 return row;
}
export async function persistWebhookEndpoint(tx:Tx,p:Principal,input:unknown,vault:WebhookVault,dnsCheckedAt:string){
 await manager(tx,p);const data=WebhookEndpointInput.parse(input),url=webhookTarget(data.url);
 const locked=(await tx.query('SELECT pg_try_advisory_xact_lock(hashtextextended($1,0))AS locked',[p.workspace+':webhook-endpoints'])).rows[0].locked;
 if(!locked)fail(429,'WEBHOOK_ENDPOINT_BUSY','Another webhook endpoint command is in progress. Retry shortly.');
 if((await tx.query("SELECT count(*)::int AS n FROM webhook_endpoints WHERE status<>'disabled'")).rows[0].n>=10)fail(429,'WEBHOOK_ENDPOINT_LIMIT','The development workspace limit is10 active/paused webhook endpoints.');
 const id=randomUUID(),secret=randomBytes(32).toString('hex');
 const wrapped=sealWebhookSecret({workspace_id:p.workspace,endpoint_id:id,secret_version:1},secret,vault);
 const row=(await tx.query('INSERT INTO webhook_endpoints(workspace_id,id,name,target_url,subscriptions,created_by,created_api_key_id,dns_checked_at)VALUES($1,$2,$3,$4,$5,$6,$7,$8::timestamptz)RETURNING '+webhookMetadata,[p.workspace,id,data.name,url.href,JSON.stringify(data.subscriptions),p.api_key?.delegator??p.user,p.api_key?.id??null,dnsCheckedAt])).rows[0];
 await tx.query("INSERT INTO webhook_signing_keys(workspace_id,endpoint_id,secret_version,wrapped_secret,state)VALUES($1,$2,1,$3,'current')",[p.workspace,id,JSON.stringify(wrapped)]);
 await audit(tx,p.workspace,p.user,'webhook_endpoint.created',id);
 return{endpoint:asWebhookEndpoint(row),secret,issued_secret_version:1};
}
export async function rotateWebhookEndpoint(tx:Tx,p:Principal,id:string,input:unknown,vault:WebhookVault){
 await manager(tx,p);const data=WebhookRotateInput.parse(input),old=await current(tx,id,data.expected_version);
 const previous=(await tx.query("SELECT valid_until FROM webhook_signing_keys WHERE endpoint_id=$1 AND state='previous'FOR UPDATE",[id])).rows[0];
 if(previous&&new Date(previous.valid_until).getTime()>Date.now()&&!data.retire_previous)fail(409,'WEBHOOK_ROTATION_OVERLAP','The previous signing key overlap is still active. Explicit cutover acknowledgment is required to retire it early.');
 await tx.query("UPDATE webhook_signing_keys SET state='retired',valid_until=least(valid_until,clock_timestamp())WHERE endpoint_id=$1 AND state='previous'",[id]);
 await tx.query("UPDATE webhook_signing_keys SET state='previous',valid_until=clock_timestamp()+interval '24 hours'WHERE endpoint_id=$1 AND state='current'",[id]);
 const version=old.secret_version+1,secret=randomBytes(32).toString('hex'),wrapped=sealWebhookSecret({workspace_id:p.workspace,endpoint_id:id,secret_version:version},secret,vault);
 const row=(await tx.query('UPDATE webhook_endpoints SET version=version+1,secret_version=$2 WHERE id=$1 RETURNING '+webhookMetadata,[id,version])).rows[0];
 await tx.query("INSERT INTO webhook_signing_keys(workspace_id,endpoint_id,secret_version,wrapped_secret,state)VALUES($1,$2,$3,$4,'current')",[p.workspace,id,version,JSON.stringify(wrapped)]);
 await audit(tx,p.workspace,p.user,data.retire_previous?'webhook_endpoint.rotated_with_cutover':'webhook_endpoint.rotated',id);
 return{endpoint:asWebhookEndpoint(row),secret,issued_secret_version:version};
}
export async function pauseWebhookEndpoint(tx:Tx,p:Principal,id:string,input:unknown){
 await manager(tx,p);const data=WebhookVersionInput.parse(input);await current(tx,id,data.expected_version);
 const row=(await tx.query("UPDATE webhook_endpoints SET status='paused',version=version+1 WHERE id=$1 RETURNING "+webhookMetadata,[id])).rows[0];await audit(tx,p.workspace,p.user,'webhook_endpoint.paused',id);return{endpoint:asWebhookEndpoint(row)};
}
