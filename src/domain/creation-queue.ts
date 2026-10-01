import { z } from 'zod';

export const CREATION_POLICY=Object.freeze({version:'creation-1',execution_ms:120000,max_failure_attempts:3,global_concurrency:2,workspace_concurrency:1,workspace_backlog:1000,scheduler_batch:25,lease_ms:30000,renew_ms:10000,start_grant_ms:5000});
export const CreationWake=z.object({workspace_id:z.uuid(),operation_id:z.uuid()}).strict();
export type CreationWakeData=z.infer<typeof CreationWake>;
export function creationJobId(input:CreationWakeData):string{
 const wake=CreationWake.parse(input);return wake.workspace_id+'-'+wake.operation_id;
}
const instant=z.number().int().min(0).max(Number.MAX_SAFE_INTEGER);
export const CreationOutcome=z.object({
 type:z.enum(['brand.extract','email.generate']),
 outcome:z.enum(['success','not_started','safe_transient','rate_limited','terminal','ambiguous']),
 external_started:z.boolean(),cancel_requested:z.boolean(),
 failure_attempts:z.number().int().min(0).max(CREATION_POLICY.max_failure_attempts),
 now_ms:instant,deadline_ms:instant,
 retry_after_ms:z.number().int().min(0).max(86400000).optional(),
 jitter:z.number().min(0).max(1).default(0.5),
}).strict().superRefine((input,ctx)=>{
 if((input.outcome==='success'||input.outcome==='ambiguous')&&!input.external_started)
  ctx.addIssue({code:'custom',message:'This outcome requires a recorded external start.'});
 if(input.outcome==='not_started'&&input.external_started)
  ctx.addIssue({code:'custom',message:'An external start cannot be classified as not started.'});
});
export type CreationOutcomeInput=z.input<typeof CreationOutcome>;
export type CreationDecision={state:'queued'|'succeeded'|'failed'|'cancelled';next_at_ms:number|null;failure_attempts:number;accounting:'consume'|'release'|'retain';code:string|null};
export function decideCreationOutcome(value:CreationOutcomeInput):CreationDecision{
 const input=CreationOutcome.parse(value),generation=input.type==='email.generate';
 const done=(state:CreationDecision['state'],accounting:CreationDecision['accounting'],code:string|null,failure_attempts=input.failure_attempts):CreationDecision=>({state,next_at_ms:null,failure_attempts,accounting,code});
 // Observed success remains chargeable after cancellation/deadline; a deadline
 // cannot undo an external effect or authorize its duplicate.
 if(input.outcome==='success')return done(input.cancel_requested?'cancelled':'succeeded','consume',input.cancel_requested?'CREATION_CANCELLED':null);
 if(input.cancel_requested){
  const unresolved=generation&&input.external_started&&['ambiguous','terminal'].includes(input.outcome);
  return done('cancelled',unresolved?'retain':'release',unresolved?'AI_RECONCILIATION_REQUIRED':'CREATION_CANCELLED');
 }
 if(input.outcome==='terminal')return done('failed',generation&&input.external_started?'retain':'release','CREATION_TERMINAL');
 if(input.outcome==='ambiguous'&&generation)return done('failed','retain','AI_RECONCILIATION_REQUIRED');
 // safe_transient is supplied only by an adapter with definitive nonacceptance
 // AND accounting evidence. Generic transport/503 errors never imply it.
 const failures=Math.min(CREATION_POLICY.max_failure_attempts,input.failure_attempts+(['safe_transient','ambiguous'].includes(input.outcome)?1:0));
 if(failures>=CREATION_POLICY.max_failure_attempts)return done('failed','release','CREATION_RETRY_EXHAUSTED',failures);
 const delay=input.outcome==='rate_limited'?Math.max(1000,input.retry_after_ms??1000):input.outcome==='not_started'?1000:Math.ceil(1000*2**(failures-1)*(0.5+input.jitter*0.5));
 const next=instant.parse(input.now_ms+delay);
 if(next>=input.deadline_ms)return done('failed','release','CREATION_RETRY_WINDOW_EXHAUSTED',failures);
 return{state:'queued',next_at_ms:next,failure_attempts:failures,accounting:'retain',code:null};
}
