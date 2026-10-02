import test from 'node:test';
import assert from 'node:assert/strict';
import type { AudienceSnapshotMember } from '../src/domain/audience-snapshots';

const contract = await import('../src/domain/recipient-assessments').catch(() => null);
function domain() {
  assert.ok(contract, 'Recipient assessment contract and evaluator must exist');
  return contract;
}
const id = '11111111-1111-4111-8111-111111111111';
const digest = 'a'.repeat(64);
const timestamp = '2026-10-02T10:00:00.000Z';
const blockers = ['CAMPAIGN_APPROVAL_UNAVAILABLE', 'PROVIDER_SENDER_UNAVAILABLE', 'REAL_CLIENT_PREFLIGHT_UNAVAILABLE', 'SEND_BUDGET_UNAVAILABLE', 'LOCALE_POLICY_UNAVAILABLE'];
const input = { expected_version: 1, expected_digest: digest, topic_id: null };
const assessment = {
  id, campaign_id: id, configuration_id: id, configuration_version: 1,
  configuration_digest: digest, revision_id: id, snapshot_id: id, topic_id: null,
  status: 'queued', total_count: 3, processed_count: 0, checks_clear_count: 0,
  excluded_count: 0, created_at: timestamp, updated_at: timestamp, completed_at: null,
  rule_version: 'recipient-assessment-1', authorization_issued: false,
  global_blockers: blockers, created_by: 'owned-actor', created_api_key_id: null,
};
const member: AudienceSnapshotMember = { id, locale: 'en-US', consent_version: 2, eligible: true, reason: 'ELIGIBLE' };
const current = {
  deleted: false, suppressed: false, subscription: 'subscribed', preferred_locale: 'fr-FR',
  consent_version: 3, preference_version: 4, topic_confirmed: true, frequency_limited: false,
};
const observation = {
  id, assessment_id: id, contact_id: id, captured_reason: 'ELIGIBLE',
  captured_locale: 'en-US', current_locale: 'fr-FR', consent_version: 3,
  preference_version: 4, current_reason: 'CHECKS_CLEAR', reasons: [],
  observed_at: timestamp, rule_version: 'recipient-assessment-1', authorization_issued: false,
};

test('assessment command requires exact CAS fields and an explicit nullable topic', () => {
  const schema = domain().RecipientAssessmentInput;
  assert.deepEqual(schema.parse(input), input);
  assert.deepEqual(schema.parse({ ...input, topic_id: id }), { ...input, topic_id: id });
  for (const fields of [{ topic_id: undefined }, { topic_id: 'marketing' }, { expected_digest: undefined }, { expected_digest: digest.toUpperCase() }, { expected_digest: 'a'.repeat(63) }, { expected_digest: 'g'.repeat(64) }, { expected_version: undefined }, { authorization_issued: true }, { provider: 'ses' }, { email: 'private@example.invalid' }])
    assert.equal(schema.safeParse({ ...input, ...fields }).success, false);
  for (const expected_version of [0, -1, 1.5, 2147483647, '1'])
    assert.equal(schema.safeParse({ ...input, expected_version }).success, false);
  assert.equal(schema.safeParse({ ...input, expected_version: 2147483646 }).success, true);
});

test('assessment view retains fixed global blockers and cannot assert authorization', () => {
  const schema = domain().RecipientAssessmentView;
  assert.deepEqual(schema.parse(assessment), assessment);
  for (const fields of [{ global_blockers: [] }, { global_blockers: blockers.slice(1) }, { global_blockers: [...blockers].reverse() }, { global_blockers: [...blockers, 'INVENTED'] }, { authorization_issued: true }, { rule_version: 'recipient-assessment-2' }, { email: 'private@example.invalid' }, { configuration_digest: digest.toUpperCase() }, { created_at: 'yesterday' }, { completed_at: 'invalid' }, { configuration_version: 0 }, { created_api_key_id: 'api-key' }])
    assert.equal(schema.safeParse({ ...assessment, ...fields }).success, false);
  assert.equal(schema.safeParse({ ...assessment, created_api_key_id: id }).success, true);
});

test('assessment counters cannot exceed captured membership or disagree with progress', () => {
  const schema = domain().RecipientAssessmentView;
  for (const fields of [{ total_count: 10001 }, { total_count: -1 }, { processed_count: 1.5 }, { processed_count: 4, checks_clear_count: 4 }, { processed_count: 2, checks_clear_count: 1 }, { processed_count: 0, excluded_count: 1 }, { checks_clear_count: -1 }])
    assert.equal(schema.safeParse({ ...assessment, ...fields }).success, false);
  assert.equal(schema.safeParse({ ...assessment, status: 'running', processed_count: 2, checks_clear_count: 1, excluded_count: 1 }).success, true);
  assert.equal(schema.safeParse({ ...assessment, status: 'completed', completed_at: timestamp }).success, false);
  assert.equal(schema.safeParse({ ...assessment, status: 'completed', processed_count: 3, checks_clear_count: 2, excluded_count: 1, completed_at: timestamp }).success, true);
  assert.equal(schema.safeParse({ ...assessment, status: 'completed', total_count: 0, completed_at: timestamp }).success, true);
  for (const status of ['queued', 'running', 'completed', 'cancelled', 'failed'])
    assert.equal(schema.safeParse({ ...assessment, status, total_count: 0 }).success, true);
});

test('observation schema accepts only address-free versioned check facts', () => {
  const schema = domain().RecipientObservationView;
  assert.deepEqual(schema.parse(observation), observation);
  for (const fields of [{ email: 'private@example.invalid' }, { address: 'private@example.invalid' }, { authorization_issued: true }, { rule_version: 'delivery-1' }, { captured_reason: 'CHECKS_CLEAR' }, { current_reason: 'ELIGIBLE' }, { reasons: ['INVENTED'] }, { observed_at: 'yesterday' }, { consent_version: 0 }, { preference_version: -1 }, { contact_id: 'contact' }])
    assert.equal(schema.safeParse({ ...observation, ...fields }).success, false);
  assert.equal(schema.safeParse({ ...observation, current_locale: null, consent_version: null, preference_version: null, current_reason: 'CONTACT_MISSING', reasons: ['CONTACT_MISSING'] }).success, true);
});

test('observation reason arrays agree with their primary reason and cannot include clear as exclusion', () => {
  const schema = domain().RecipientObservationView;
  for (const fields of [{ reasons: ['SUPPRESSED'] }, { current_reason: 'SUPPRESSED', reasons: [] }, { current_reason: 'SUPPRESSED', reasons: ['CONSENT_NOT_CONFIRMED', 'SUPPRESSED'] }, { current_reason: 'SUPPRESSED', reasons: ['SUPPRESSED', 'SUPPRESSED'] }, { current_reason: 'SUPPRESSED', reasons: ['SUPPRESSED', 'CHECKS_CLEAR'] }])
    assert.equal(schema.safeParse({ ...observation, ...fields }).success, false);
  assert.equal(schema.safeParse({ ...observation, current_reason: 'SUPPRESSED', reasons: ['SUPPRESSED', 'CONSENT_NOT_CONFIRMED'] }).success, true);
});

test('clear evaluation records current versions and locales without declaring locale eligibility or authorization', () => {
  const result = domain().evaluateRecipientObservation(member, current, true);
  assert.deepEqual(result, {
    contact_id: id, captured_reason: 'ELIGIBLE', captured_locale: 'en-US',
    current_locale: 'fr-FR', consent_version: 3, preference_version: 4,
    current_reason: 'CHECKS_CLEAR', reasons: [],
  });
  for (const field of ['id', 'assessment_id', 'observed_at', 'rule_version', 'authorization_issued', 'email', 'locale_eligible'])
    assert.equal(Object.hasOwn(result, field), false);
});

test('missing contacts retain captured facts and all applicable captured and topic exclusions', () => {
  const excluded = { ...member, eligible: false, reason: 'SUPPRESSED' as const };
  assert.deepEqual(domain().evaluateRecipientObservation(excluded, null, false), {
    contact_id: id, captured_reason: 'SUPPRESSED', captured_locale: 'en-US',
    current_locale: null, consent_version: null, preference_version: null,
    current_reason: 'CONTACT_MISSING', reasons: ['CONTACT_MISSING', 'CAPTURED_EXCLUDED', 'TOPIC_NOT_SELECTED'],
  });
  assert.deepEqual(domain().evaluateRecipientObservation(member, null, true).reasons, ['CONTACT_MISSING']);
});

test('deleted current contacts keep every observed exclusion in specified precedence', () => {
  const result = domain().evaluateRecipientObservation({ ...member, eligible: false, reason: 'CONTACT_DELETED' }, {
    ...current, deleted: true, suppressed: true, subscription: 'unsubscribed', topic_confirmed: false, frequency_limited: true,
  }, true);
  assert.equal(result.current_reason, 'CONTACT_DELETED');
  assert.deepEqual(result.reasons, ['CONTACT_DELETED', 'CAPTURED_EXCLUDED', 'SUPPRESSED', 'CONSENT_NOT_CONFIRMED', 'TOPIC_NOT_CONFIRMED', 'FREQUENCY_LIMIT']);
});

test('captured exclusion remains excluded after current contact checks recover', () => {
  for (const reason of ['SUPPRESSED', 'CONTACT_DELETED', 'CONSENT_NOT_CONFIRMED'] as const) {
    const result = domain().evaluateRecipientObservation({ ...member, eligible: false, reason }, current, true);
    assert.equal(result.captured_reason, reason);
    assert.equal(result.current_reason, 'CAPTURED_EXCLUDED');
    assert.deepEqual(result.reasons, ['CAPTURED_EXCLUDED']);
  }
});

test('suppression consent topic and frequency each independently exclude current contact', () => {
  const cases = [
    [{ suppressed: true }, 'SUPPRESSED'],
    [{ subscription: 'pending' }, 'CONSENT_NOT_CONFIRMED'],
    [{ subscription: 'unsubscribed' }, 'CONSENT_NOT_CONFIRMED'],
    [{ subscription: 'unknown' }, 'CONSENT_NOT_CONFIRMED'],
    [{ topic_confirmed: false }, 'TOPIC_NOT_CONFIRMED'],
    [{ frequency_limited: true }, 'FREQUENCY_LIMIT'],
  ] as const;
  for (const [fields, reason] of cases) {
    const result = domain().evaluateRecipientObservation(member, { ...current, ...fields }, true);
    assert.equal(result.current_reason, reason);
    assert.deepEqual(result.reasons, [reason]);
  }
});

test('absent explicit topic records topic not selected without inferring confirmation', () => {
  for (const topic_confirmed of [false, true]) {
    const result = domain().evaluateRecipientObservation(member, { ...current, topic_confirmed }, false);
    assert.equal(result.current_reason, 'TOPIC_NOT_SELECTED');
    assert.deepEqual(result.reasons, ['TOPIC_NOT_SELECTED']);
  }
});

test('evaluator is deterministic and does not mutate captured or current inputs', () => {
  const captured = Object.freeze({ ...member });
  const contact = Object.freeze({ ...current, suppressed: true, frequency_limited: true });
  const before = JSON.stringify({ captured, contact });
  const first = domain().evaluateRecipientObservation(captured, contact, true);
  assert.deepEqual(first, domain().evaluateRecipientObservation(captured, contact, true));
  assert.equal(JSON.stringify({ captured, contact }), before);
  assert.deepEqual(first.reasons, ['SUPPRESSED', 'FREQUENCY_LIMIT']);
});
