import{z}from'zod';import{WebhookDelivery,WebhookAttempt,WebhookDeliveryState,WebhookReplayInput}from'../domain/webhook-history';import{withPrincipal}from'./auth';import{resourcePage}from'./pagination';import{webhookConfiguration}from'./webhook-route';import{parseWebhookVault}from'./webhook-secrets';import{keyed}from'./commands';import{audit}from'./audit';import{fail}from'./errors';
export const deliveryFields='id,workspace_id,endpoint_id,event_id,state,failure_attempts,attempt_number,created_at,deadline,next_at,error_class,policy_version';
export const attemptFields='id,workspace_id,delivery_id,attempt_number,phase,recorded_at,status_code,secret_version,error_class';
function dates(row:Record<string,unknown>){return Object.fromEntries(Object.entries(row).map(([key,value])=>[key,value instanceof Date?value.toISOString():value]));}
function delivery(row:Record<string,unknown>){return WebhookDelivery.parse(dates(row));}
function attempt(row:Record<string,unknown>){return WebhookAttempt.parse(dates(row));}
export async function webhookHistoryRoute(req:Request,path:string[],body:Record<string,unknown>,key:string|null){
 const[,id,command]=path,configuration=webhookConfiguration();
 return withPrincipal(req,'manage',async(tx,p)=>{
  if(req.method==='GET'){
   if(id){const row=(await tx.query('SELECT '+deliveryFields+' FROM webhook_deliveries WHERE id=$1',[id])).rows[0];if(!row)fail(404,'RESOURCE_NOT_FOUND','Webhook delivery not found.');if(!command)return{delivery:delivery(row),configuration};
    const page=await resourcePage(req,tx,p,{resource:'webhook-attempts',from:'webhook_attempts',fields:attemptFields,created:'recorded_at',where:'delivery_id=$1',values:[id],filters:{delivery_id:id}});return{...page,data:page.data.map(attempt),configuration};}
   const params=new URL(req.url).searchParams,endpoint=params.has('endpoint_id')?z.uuid().parse(params.get('endpoint_id')):null,state=params.has('state')?WebhookDeliveryState.parse(params.get('state')):null,values:unknown[]=[],filters={endpoint_id:endpoint,state};let where='TRUE';
   if(endpoint){if(!(await tx.query('SELECT id FROM webhook_endpoints WHERE id=$1',[endpoint])).rowCount)fail(404,'RESOURCE_NOT_FOUND','Webhook endpoint not found.');values.push(endpoint);where+=' AND endpoint_id=$'+values.length;}
   if(state){values.push(state);where+=' AND state=$'+values.length;}
   const page=await resourcePage(req,tx,p,{resource:'webhook-deliveries',from:'webhook_deliveries',fields:deliveryFields,where,values,filters});return{...page,data:page.data.map(delivery),configuration};
  }
  if(!key||key.length>200)fail(400,'IDEMPOTENCY_KEY_REQUIRED','Use an idempotency key for replay.');
  const input=WebhookReplayInput.parse(body);
  const result=await keyed(tx,p,'webhook.delivery.replay:'+id,key,input,async()=>{
   parseWebhookVault(process.env.WEBHOOK_ENCRYPTION_KEYS_JSON,process.env.WEBHOOK_ENCRYPTION_ACTIVE_KEY);
   let row:Record<string,unknown>;
   try{row=(await tx.query('SELECT '+deliveryFields+' FROM mailcraft_replay_webhook($1,$2,$3,$4)',[p.workspace,id,input.expected_attempt,input.acknowledge_duplicate_effect])).rows[0];}
   catch(error){const message=error instanceof Error?error.message:'';const code=message==='RESOURCE_NOT_FOUND'?404:message==='REPLAY_FORBIDDEN'?403:['WEBHOOK_QUEUE_BUSY','WEBHOOK_BACKLOG_FULL'].includes(message)?429:message.startsWith('REPLAY_')?409:null;
    if(code)fail(code,message,code===429?'Webhook processing capacity is busy. Retry the same command.':code===403?'Current webhook management authority is required.':code===404?'Webhook delivery not found.':'Replay is unavailable for this current state, attempt or retry budget. Read the receipt and reconcile before retrying.');throw error;}
   await audit(tx,p.workspace,p.user,'webhook.delivery.replay',id);return{delivery:delivery(row)};
  });
  const current=(await tx.query('SELECT '+deliveryFields+' FROM webhook_deliveries WHERE id=$1',[result.delivery.id])).rows[0];if(!current)fail(404,'RESOURCE_NOT_FOUND','Webhook delivery not found.');return{delivery:delivery(current),configuration};
 });
}
