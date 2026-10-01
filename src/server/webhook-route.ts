import { WebhookEndpointInput } from '../domain/webhooks';
import { withPrincipal } from './auth';
import { parseWebhookVault } from './webhook-secrets';
import { resolveWebhookTarget } from './webhook-transport';
import { webhookMetadata,asWebhookEndpoint,persistWebhookEndpoint,rotateWebhookEndpoint,pauseWebhookEndpoint } from './webhook-endpoints';
import { resourcePage } from './pagination';import { keyed } from './commands';import { digest } from './audit';import { fail } from './errors';
function vault(){return parseWebhookVault(process.env.WEBHOOK_ENCRYPTION_KEYS_JSON,process.env.WEBHOOK_ENCRYPTION_ACTIVE_KEY);}
export function webhookConfiguration(){let key_configured=false;try{vault();key_configured=true;}catch{}return{key_configured,delivery_enabled:false as const};}
export async function webhookRoute(req:Request,path:string[],body:Record<string,unknown>,key:string|null){
 const [,id,command]=path,configuration=webhookConfiguration();
 if(req.method==='GET')return withPrincipal(req,'manage',async(tx,p)=>{
  if(id){const row=(await tx.query('SELECT '+webhookMetadata+' FROM webhook_endpoints WHERE id=$1',[id])).rows[0];if(!row)fail(404,'RESOURCE_NOT_FOUND','Webhook endpoint not found.');return{endpoint:asWebhookEndpoint(row),configuration};}
  const page=await resourcePage(req,tx,p,{resource:'webhook-endpoints',from:'webhook_endpoints',fields:webhookMetadata});return{...page,data:page.data.map(asWebhookEndpoint),configuration};
 });
 if(!key||key.length>200)fail(400,'IDEMPOTENCY_KEY_REQUIRED','Use an idempotency key for this webhook command.');
 const action='webhook-endpoint.'+(command??'create')+':'+(id??'');
 // Complete remote DNS verification outside a database transaction. Replay skips DNS/key setup.
 const replay=await withPrincipal(req,'manage',async(tx,p)=>{
  const prior=(await tx.query('SELECT payload_hash,response FROM idempotency WHERE principal=$1 AND action=$2 AND key=$3',[p.user,action,key])).rows[0];
  if(prior&&prior.payload_hash!==digest(body))fail(409,'IDEMPOTENCY_MISMATCH','This key was already used for a different payload.');return !!prior;
 });
 let verified:Awaited<ReturnType<typeof resolveWebhookTarget>>|undefined;
 if(!replay&&!id){vault();const input=WebhookEndpointInput.parse(body);verified=await resolveWebhookTarget(input.url,req.signal);}
 // Revalidate current role/issuer/scope after DNS; each incoming bearer is debited only once.
 return withPrincipal(req,'manage',async(tx,p)=>{
  let secret:string|undefined;
  const result=await keyed(tx,p,action,key,body,async()=>{
   if(!id){if(!verified)fail(503,'WEBHOOK_DNS_UNAVAILABLE','The webhook target still requires verification.');const created=await persistWebhookEndpoint(tx,p,body,vault(),verified.dns_checked_at);secret=created.secret;return{endpoint:created.endpoint,issued_secret_version:created.issued_secret_version};}
   if(command==='rotate'){const rotated=await rotateWebhookEndpoint(tx,p,id,body,vault());secret=rotated.secret;return{endpoint:rotated.endpoint,issued_secret_version:rotated.issued_secret_version};}
   return pauseWebhookEndpoint(tx,p,id,body);
  });
  const current=(await tx.query('SELECT '+webhookMetadata+' FROM webhook_endpoints WHERE id=$1',[result.endpoint.id])).rows[0];
  if(!current)fail(404,'RESOURCE_NOT_FOUND','Webhook endpoint not found.');
  return{...result,endpoint:asWebhookEndpoint(current),secret,secret_available:!!secret,configuration};
 });
}
