import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';

test('staging input excludes topic or authority and admits only canonical UUID projections', async () => {
  assert.ok(existsSync('src/domain/submission-ledgers.ts'), 'strict staged ledger domain is missing');
  const { SubmissionLedgerInput, StagedRecipientView, DeliveryAttemptView } = await import('../src/domain/submission-ledgers');
  const input = { expected_version: 1, expected_digest: 'a'.repeat(64) };
  assert.deepEqual(SubmissionLedgerInput.parse(input), input);
  for (const extra of [{ topic_id: null }, { authorization_issued: true }, { expected_version: 0 }, { expected_digest: 'A'.repeat(64) }])
    assert.equal(SubmissionLedgerInput.safeParse({ ...input, ...extra }).success, false);
  const id = '12345678-1234-4234-8234-123456789abc';
  const recipient = { id, ledger_id: id, configuration_id: id, delivery_id: id, contact_id: id,
    captured_locale: 'en-US', captured_reason: 'ELIGIBLE', captured_consent_version: 1,
    logical_send_key: 'b'.repeat(64), submission_state: 'pending', outcome: 'unknown',
    authorization_issued: false, created_at: '2026-10-03T00:00:00.000Z', updated_at: '2026-10-03T00:00:00.000Z' };
  assert.deepEqual(StagedRecipientView.parse(recipient), recipient);
  for (const extra of [{ submission_state: 'accepted' }, { outcome: 'delivered' }, { authorization_issued: true }, { email: 'private@example.test' }, { id: id.toUpperCase() }])
    assert.equal(StagedRecipientView.safeParse({ ...recipient, ...extra }).success, false);
  assert.equal(DeliveryAttemptView.safeParse({ id, delivery_id: id, attempt_no: 1, submission_state: 'accepted', request_started_at: recipient.created_at, accepted_at: recipient.created_at, error_class: null }).success, true);
});
