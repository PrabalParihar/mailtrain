import type{PoolClient}from'pg';import{createHash}from'node:crypto';import{verifyWebhook}from'../../src/server/webhook-protocol';import{selectWebhookSigningKey}from'../../src/server/webhook-secrets';
// Caller must BEGIN; receipt and effect are committed together before replying 2xx.
export async function acceptWebhookEvent(tx:PoolClient,consumer:string,workspace:string,body:Uint8Array,headers:Record<string,string>|Headers,keys:{secret_version:number;valid_until:string|null;secret:string}[]){
 const header=(name:string)=>{if(headers instanceof Headers)return headers.get(name);const names=Object.keys(headers).filter((key)=>key.toLowerCase()===name.toLowerCase());if(names.length!==1)throw new Error('Missing or ambiguous signing key version');return headers[names[0]];};
 const version=header('X-Lettercape-Key-Version');if(!version)throw new Error('Missing signing key version');
 const key=selectWebhookSigningKey(keys,version),event=verifyWebhook(body,headers,key.secret,workspace),hash=createHash('sha256').update(body).digest('hex');
 const inserted=await tx.query('INSERT INTO webhook_consumer_receipts(consumer_id,event_id,workspace_id,body_hash)VALUES($1,$2,$3,$4)ON CONFLICT DO NOTHING RETURNING event_id',[consumer,event.id,workspace,hash]);
 if(!inserted.rowCount){const previous=(await tx.query('SELECT workspace_id,body_hash FROM webhook_consumer_receipts WHERE consumer_id=$1 AND event_id=$2',[consumer,event.id])).rows[0];if(!previous||previous.workspace_id!==workspace||previous.body_hash!==hash)throw new Error('Webhook event identity conflict');return{duplicate:true,event_id:event.id};}
 const scope=event.type==='contact.topic_unsubscribed'?event.data.topic_id:'';
 await tx.query(`INSERT INTO webhook_resource_observations(consumer_id,workspace_id,resource_type,resource_id,event_type,scope_id,resource_version,event_id,recorded_at)VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)
 ON CONFLICT(consumer_id,workspace_id,resource_type,resource_id,event_type,scope_id)DO UPDATE SET resource_version=EXCLUDED.resource_version,event_id=EXCLUDED.event_id,recorded_at=EXCLUDED.recorded_at WHERE webhook_resource_observations.resource_version<EXCLUDED.resource_version`,[consumer,workspace,event.aggregate.type,event.aggregate.id,event.type,scope,event.aggregate.version,event.id,event.recorded_at]);
 return{duplicate:false,event_id:event.id};
}
