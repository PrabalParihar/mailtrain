import test from 'node:test';
import assert from 'node:assert/strict';
import { DispatchPolicyInput, DispatchProvider, policyDecision } from '../src/domain/dispatch-controls';
test('dispatch policies require bounded explicit versions/reasons and fail closed on missing state', () => {
  assert.deepEqual(DispatchPolicyInput.parse({ expected_version: 0, paused: true, reason: 'incident' }), { expected_version: 0, paused: true, reason: 'incident' });
  for (const input of [{ expected_version: -1, paused: true, reason: 'incident' }, { expected_version: 1, paused: 'false', reason: 'incident' }, { expected_version: 1, paused: false, reason: 'misc' }, { expected_version: 1, paused: false, reason: 'verified_recovery', dispatch_enabled: true }]) assert.equal(DispatchPolicyInput.safeParse(input).success, false);
  assert.equal(DispatchProvider.safeParse('unknown').success, false);
  assert.deepEqual(policyDecision({ global: null, provider: { paused: false, version: 1 }, workspace: { paused: false, version: 1 } }), { allowed: false, reason: 'POLICY_UNAVAILABLE' });
  assert.equal(policyDecision({ global: { paused: false, version: 1 }, provider: { paused: true, version: 1 }, workspace: { paused: false, version: 1 } }).reason, 'PROVIDER_PAUSED');
  assert.deepEqual(policyDecision({ global: { paused: false, version: 1 }, provider: { paused: false, version: 1 }, workspace: { paused: false, version: 1 } }), { allowed: true, reason: 'POLICY_CLEAR' });
});
