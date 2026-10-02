import{CREATION_POLICY}from'../domain/creation-queue';import{AppError}from'./errors';
import type{CreationClaim,CreationContext,CreationSettlement}from'./creation-queue-store';
export type CreationStore={prepare(claim:CreationClaim):Promise<CreationContext|null>;begin(claim:CreationClaim):Promise<CreationContext|null>;renew(claim:CreationClaim):Promise<boolean>;settle(claim:CreationClaim,outcome:CreationSettlement):Promise<boolean>};
export type CreationAdapters={preflight(context:CreationContext):void;extract(context:CreationContext,signal:AbortSignal,beforeRead:()=>Promise<void>):Promise<Record<string,unknown>>;generate(context:CreationContext,signal:AbortSignal):Promise<Record<string,unknown>>};
// Only an adapter with definitive nonacceptance/no-charge evidence may use a retry disposition.
export class CreationAdapterError extends Error{constructor(readonly disposition:'terminal'|'safe_transient'|'rate_limited'|'ambiguous',readonly retry_after_ms?:number){super('Creation adapter did not produce a usable proposal.');}}
export async function runCreation(claim:CreationClaim,{store,adapters,signal}:{store:CreationStore;adapters:CreationAdapters;signal:AbortSignal}):Promise<void>{
 let started=false,context:CreationContext|null=null,renewing=false;const stop=new AbortController();const combined=AbortSignal.any([signal,stop.signal,AbortSignal.timeout(Math.max(1,Date.parse(claim.deadline_at)-Date.now()))]);
 const heartbeat=setInterval(()=>{if(renewing||combined.aborted)return;renewing=true;void store.renew(claim).then(valid=>{if(!valid)stop.abort();},()=>stop.abort()).finally(()=>{renewing=false;});},CREATION_POLICY.renew_ms);heartbeat.unref();
 try{
  combined.throwIfAborted();context=await store.prepare(claim);if(!context)return;adapters.preflight(context);combined.throwIfAborted();
  context=await store.begin(claim);if(!context)return;started=true;
  // The start grant is short and separate from the renewable execution lease.
  if(Date.parse(context.grant_until)<=Date.now())throw new Error('Creation start grant expired.');combined.throwIfAborted();
  const result=await(context.operation.type==='email.generate'?adapters.generate(context,combined):adapters.extract(context,combined,async()=>{combined.throwIfAborted();if(!await store.renew(claim)){stop.abort();throw new Error('Creation authority or cancellation changed before the next read.');}combined.throwIfAborted();}));
  await store.settle(claim,{outcome:'success',result});
 }catch(error){
  let outcome:CreationSettlement;
  if(!started)outcome={outcome:'terminal',result:{failure_code:error instanceof AppError?error.code:'CREATION_CONTEXT_INVALID'}};
  else if(error instanceof CreationAdapterError)outcome={outcome:error.disposition,...(error.retry_after_ms===undefined?{}:{retry_after_ms:error.retry_after_ms})};
  else if(error instanceof AppError&&['UNSAFE_URL','REDIRECT_LIMIT','AI_REFUSAL','AI_TRUNCATED','AI_SCHEMA_INVALID','AI_PROVIDER_ERROR','AI_QUOTA_EXHAUSTED'].includes(error.code))outcome={outcome:'terminal',result:{failure_code:error.code}};
  else outcome={outcome:'ambiguous'};
  // Token/lease fences remain SQL-owned. Lost acknowledgment is recovered by SQL, never retried here.
  await store.settle(claim,outcome).catch(()=>undefined);
 }finally{clearInterval(heartbeat);stop.abort();}
}
