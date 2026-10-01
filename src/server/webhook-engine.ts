import type{Tx}from'./db';import{admitWebhookEvents,claimWebhookDelivery,authorizeWebhookDelivery,settleWebhookDelivery}from'./webhook-deliveries';import{openWebhookSecret,type WebhookVault}from'./webhook-secrets';import{postWebhook,type WebhookHttpResult}from'./webhook-transport';
export type WebhookTransaction=<T>(fn:(tx:Tx)=>Promise<T>)=>Promise<T>;
// The optional transport is a code dependency for owned fixtures, never a URL/environment bypass.
export async function runWebhookDelivery(options:{enabled:boolean;transaction:WebhookTransaction;vault:WebhookVault;signal:AbortSignal;transport?:typeof postWebhook;jitter?:()=>number}){
 if(!options.enabled)throw new Error('Webhook delivery is disabled');if(options.signal.aborted)return{claimed:false};
 await options.transaction((tx)=>admitWebhookEvents(tx));
 const claim=await options.transaction((tx)=>claimWebhookDelivery(tx));if(!claim)return{claimed:false};
 const grant=await options.transaction((tx)=>authorizeWebhookDelivery(tx,claim));if(!grant)return{claimed:true,authorized:false};
 let secret:string;
 try{secret=openWebhookSecret({workspace_id:claim.workspace_id,endpoint_id:claim.endpoint_id,secret_version:grant.secret_version},grant.wrapped_secret,options.vault);}catch{
  await options.transaction((tx)=>settleWebhookDelivery(tx,claim,{status:null,error_class:'key_unavailable'},(options.jitter??Math.random)()));return{claimed:true,authorized:false};
 }
 const remaining=Date.parse(grant.authorized_until)-Date.now();
 let result:WebhookHttpResult;
 if(options.signal.aborted)result={status:null,error_class:'aborted'};
 else if(remaining<=0)result={status:null,error_class:'timeout'};
 else{
  const budget=AbortSignal.timeout(remaining),signal=AbortSignal.any([options.signal,budget]);
  try{result=await(options.transport??postWebhook)(grant.target_url,Buffer.from(grant.body,'utf8'),secret,grant.secret_version,signal);}catch{result={status:null,error_class:options.signal.aborted?'aborted':budget.aborted?'timeout':'transport'};}
  if(result.status===null&&result.error_class==='aborted'&&budget.aborted&&!options.signal.aborted)result={status:null,error_class:'timeout'};
 }
 secret=''; // JS strings are not securely erasable; signing keys must remain confined to this worker.
 const recorded=await options.transaction((tx)=>settleWebhookDelivery(tx,claim,result,(options.jitter??Math.random)()));return{claimed:true,authorized:true,recorded};
}
