import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
const queue=await import('../src/domain/creation-queue').catch(()=>null);
const input={type:'email.generate' as const,outcome:'safe_transient' as const,external_started:true,cancel_requested:false,failure_attempts:0,now_ms:10000,deadline_ms:130000,jitter:1};
test('creation wakeups contain only exact tenant and operation IDs',()=>{
 assert.ok(queue?.CreationWake,'Creation queue contracts must exist.');const wake={workspace_id:randomUUID(),operation_id:randomUUID()};assert.deepEqual(queue.CreationWake.parse(wake),wake);
 for(const extra of[{role:'Owner'},{input:{prompt:'private'}},{token:randomUUID()},{user_id:'private'},{workspace_id:'foreign'}])assert.equal(queue.CreationWake.safeParse({...wake,...extra}).success,false);
 assert.equal(queue.creationJobId(wake),wake.workspace_id+'-'+wake.operation_id);assert.ok(!queue.creationJobId(wake).includes(':'));assert.notEqual(queue.creationJobId(wake),queue.creationJobId({...wake,workspace_id:randomUUID()}));
});
test('creation engineering budgets are finite and versioned',()=>{
 assert.ok(queue?.CREATION_POLICY,'Creation queue contracts must exist.');assert.deepEqual(queue.CREATION_POLICY,{version:'creation-1',execution_ms:120000,max_failure_attempts:3,global_concurrency:2,workspace_concurrency:1,workspace_backlog:1000,scheduler_batch:25,lease_ms:30000,renew_ms:10000,start_grant_ms:5000});
});
test('unknown external generation outcome is not retry permission',()=>{
 assert.ok(queue?.decideCreationOutcome,'Creation queue contracts must exist.');const result=queue.decideCreationOutcome({...input,outcome:'ambiguous'});assert.deepEqual(result,{state:'failed',next_at_ms:null,failure_attempts:0,accounting:'retain',code:'AI_RECONCILIATION_REQUIRED'});
 assert.equal(queue.decideCreationOutcome({...input,outcome:'ambiguous',cancel_requested:true}).state,'cancelled');assert.equal(queue.decideCreationOutcome({...input,outcome:'ambiguous',cancel_requested:true}).accounting,'retain');
 assert.equal(queue.decideCreationOutcome({...input,outcome:'ambiguous',now_ms:140000}).accounting,'retain');assert.throws(()=>queue.decideCreationOutcome({...input,outcome:'ambiguous',external_started:false}));
});
test('cancellation before an external start releases unused reservation',()=>{
 assert.ok(queue?.decideCreationOutcome);assert.deepEqual(queue.decideCreationOutcome({...input,outcome:'not_started',external_started:false,cancel_requested:true}),{state:'cancelled',next_at_ms:null,failure_attempts:0,accounting:'release',code:'CREATION_CANCELLED'});
});
test('known success remains accounted even after cancellation or deadline',()=>{
 assert.ok(queue?.decideCreationOutcome);assert.deepEqual(queue.decideCreationOutcome({...input,outcome:'success',now_ms:140000}),{state:'succeeded',next_at_ms:null,failure_attempts:0,accounting:'consume',code:null});
 const cancelled=queue.decideCreationOutcome({...input,outcome:'success',cancel_requested:true});assert.equal(cancelled.state,'cancelled');assert.equal(cancelled.accounting,'consume');assert.throws(()=>queue.decideCreationOutcome({...input,outcome:'success',external_started:false}));
});
test('proven-safe transient failures stop at the third finite attempt',()=>{
 assert.ok(queue?.decideCreationOutcome);const first=queue.decideCreationOutcome(input);assert.equal(first.state,'queued');assert.equal(first.failure_attempts,1);assert.equal(first.next_at_ms,11000);assert.equal(first.accounting,'retain');
 const second=queue.decideCreationOutcome({...input,failure_attempts:1});assert.equal(second.next_at_ms,12000);assert.equal(second.failure_attempts,2);
 const third=queue.decideCreationOutcome({...input,failure_attempts:2});assert.equal(third.state,'failed');assert.equal(third.failure_attempts,3);assert.equal(third.accounting,'release');assert.equal(third.code,'CREATION_RETRY_EXHAUSTED');
 assert.equal(queue.decideCreationOutcome({...input,deadline_ms:10500}).state,'failed');assert.equal(queue.decideCreationOutcome({...input,cancel_requested:true}).accounting,'release');
});
test('rate deferrals preserve failure budget and respect the original deadline',()=>{
 assert.ok(queue?.decideCreationOutcome);const rate=queue.decideCreationOutcome({...input,outcome:'rate_limited',failure_attempts:1,retry_after_ms:20000});assert.equal(rate.next_at_ms,30000);assert.equal(rate.failure_attempts,1);assert.equal(rate.accounting,'retain');
 assert.equal(queue.decideCreationOutcome({...input,outcome:'rate_limited',retry_after_ms:0}).next_at_ms,11000);
 const exhausted=queue.decideCreationOutcome({...input,outcome:'rate_limited',retry_after_ms:120000});assert.equal(exhausted.state,'failed');assert.equal(exhausted.code,'CREATION_RETRY_WINDOW_EXHAUSTED');assert.equal(exhausted.failure_attempts,0);
});
test('terminal generation errors retain post-start accounting but never retry',()=>{
 assert.ok(queue?.decideCreationOutcome);const attempted=queue.decideCreationOutcome({...input,outcome:'terminal'});assert.equal(attempted.state,'failed');assert.equal(attempted.accounting,'retain');assert.equal(attempted.next_at_ms,null);
 assert.equal(queue.decideCreationOutcome({...input,outcome:'terminal',external_started:false}).accounting,'release');assert.equal(queue.decideCreationOutcome({...input,type:'brand.extract',outcome:'terminal'}).accounting,'release');
 assert.equal(queue.decideCreationOutcome({...input,type:'brand.extract',outcome:'ambiguous'}).state,'queued');
});
test('creation decisions reject malformed budgets rather than admit unbounded work',()=>{
 assert.ok(queue?.decideCreationOutcome);
 for(const change of[{failure_attempts:-1},{failure_attempts:4},{now_ms:NaN},{now_ms:Infinity},{deadline_ms:Number.MAX_SAFE_INTEGER+1},{retry_after_ms:-1},{retry_after_ms:Infinity},{jitter:-1},{jitter:1.1},{type:'campaign.send'},{role:'Owner'},{outcome:'not_started',external_started:true}])assert.throws(()=>queue.decideCreationOutcome({...input,...change} as Parameters<typeof queue.decideCreationOutcome>[0]));
});
