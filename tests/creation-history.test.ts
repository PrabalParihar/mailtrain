import test from'node:test';import assert from'node:assert/strict';import{randomUUID}from'node:crypto';
const contract=await import('../src/domain/creation-history').catch(()=>null);
test('creation history exposes strict bounded metadata without context or private lease tokens',()=>{
 assert.ok(contract?.CreationMetadata);const value={policy_version:'creation-1',phase:'unknown',failure_attempts:0,attempt_limit:3,deadline_at:null,next_at:new Date().toISOString(),accounting:'retained'};
 assert.deepEqual(contract.CreationMetadata.parse(value),value);for(const patch of[{token:randomUUID()},{input:{prompt:'private'}},{failure_attempts:4},{accounting:'refunded'}])assert.equal(contract.CreationMetadata.safeParse({...value,...patch}).success,false);
 const attempt={id:randomUUID(),operation_id:randomUUID(),lease_epoch:1,phase:'recovered',outcome_code:'AI_RECONCILIATION_REQUIRED',recorded_at:new Date().toISOString()};assert.deepEqual(contract.CreationAttempt.parse(attempt),attempt);assert.equal(contract.CreationAttempt.safeParse({...attempt,lease_token:randomUUID()}).success,false);
});
