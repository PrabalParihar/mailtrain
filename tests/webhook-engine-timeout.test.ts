import test from'node:test';import assert from'node:assert/strict';import{randomBytes,randomUUID,createHash}from'node:crypto';import{runWebhookDelivery}from'../src/server/webhook-engine';import{parseWebhookVault,sealWebhookSecret}from'../src/server/webhook-secrets';import type{Tx}from'../src/server/db';
test('grant timeout spends failure budget while explicit shutdown cancellation defers without spending',async()=>{
 for(const shutdown of[false,true]){
 const workspace=randomUUID(),endpoint=randomUUID(),id=randomUUID(),eventId=randomUUID(),contact=randomUUID(),secret=randomBytes(32).toString('hex'),vault=parseWebhookVault(JSON.stringify({fixture:randomBytes(32).toString('hex')}),'fixture'),wrapped=sealWebhookSecret({workspace_id:workspace,endpoint_id:endpoint,secret_version:1},secret,vault);
 const body=JSON.stringify({id:eventId,workspace_id:workspace,schema_version:1,type:'contact.unsubscribed',occurred_at:new Date().toISOString(),recorded_at:new Date().toISOString(),trace_id:randomUUID(),aggregate:{type:'contact',id:contact,version:2},data:{contact_id:contact,scope:'marketing',reason:'recipient_opt_out'}}),claim={id,workspace_id:workspace,endpoint_id:endpoint,event_id:eventId,attempt_number:1,lease_token:randomUUID()},row={...claim,deadline:new Date(Date.now()+86400000),lease_until:new Date(Date.now()+30000),failure_attempts:0,authorized_until:null as Date|null,authorized_key_version:1};let settled:unknown[]=[];
 const tx={async query(sql:string,values:unknown[]=[]){
  let rows:unknown[]=[];
  if(sql.includes('AS acquired'))rows=[{acquired:true}];
  else if(sql.startsWith('SELECT count(*)::int AS n'))rows=[{n:0}];
  else if(sql.startsWith('SELECT d.*'))rows=[row];
  else if(sql.includes('RETURNING id,workspace_id'))rows=[claim];
  else if(sql.startsWith('SELECT * FROM webhook_deliveries WHERE workspace_id'))rows=[row];
  else if(sql.includes('AS allowed'))rows=[{allowed:true}];
  else if(sql.startsWith('SELECT e.target_url'))rows=[{target_url:'https://example.org/hook',secret_version:1,wrapped_secret:wrapped}];
  else if(sql.startsWith('SELECT workspace_id,id,type'))rows=[{workspace_id:workspace,id:eventId,type:'contact.unsubscribed',aggregate_id:contact,event_schema_version:1,event_body:body,event_hash:createHash('sha256').update(body).digest('hex')}];
  else if(sql.includes('RETURNING authorized_until')){row.authorized_until=new Date(Date.now()+(shutdown?1000:30));rows=[{authorized_until:row.authorized_until}];}
  else if(sql==='SELECT clock_timestamp()AS now')rows=[{now:new Date()}];
  else if(sql.includes('SET state=$3,failure_attempts=$4'))settled=values;
  return{rows,rowCount:rows.length};
 }}as unknown as Tx;
 const stop=new AbortController();await runWebhookDelivery({enabled:true,vault,transaction:async(fn)=>fn(tx),signal:stop.signal,jitter:()=>0.5,transport:async(_url,_body,_key,_version,signal)=>{if(shutdown)setTimeout(()=>stop.abort(),2);return new Promise((resolve,reject)=>{const guard=setTimeout(()=>reject(new Error('Fixture grant abort missing')),2000);signal!.addEventListener('abort',()=>{clearTimeout(guard);resolve({status:null,error_class:'aborted'});},{once:true});});}});
 assert.equal(settled[3],shutdown?0:1);assert.equal(settled[5],shutdown?'aborted':'transient');
 }
});
