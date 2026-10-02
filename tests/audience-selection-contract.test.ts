import test from 'node:test';
import assert from 'node:assert/strict';
import { CampaignConfigurationInput, CampaignConfigurationView, CampaignConfigurationSnapshot } from '../src/domain/campaign-configuration';
import { assertRouteMethod } from '../src/server/http';

const id = '11111111-1111-4111-8111-111111111111';
test('campaign selection is an optional explicit UUID, while omission preserves the existing source', () => {
  const original = { expected_version: 1, name: 'Draft', revision_id: id, planned_timing: null };
  assert.deepEqual(CampaignConfigurationInput.parse(original), original);
  assert.deepEqual(CampaignConfigurationInput.parse({ ...original, audience_snapshot_id: id }), { ...original, audience_snapshot_id: id });
  for (const audience_snapshot_id of [null, '', 'all', [], { id }])
    assert.equal(CampaignConfigurationInput.safeParse({ ...original, audience_snapshot_id }).success, false);
});
test('audience metadata routes enable only GET without accepting unrelated commands', () => {
  assert.doesNotThrow(() => assertRouteMethod(['audience-snapshots'], 'GET'));
  assert.doesNotThrow(() => assertRouteMethod(['audience-snapshots', id, 'metadata'], 'GET'));
  assert.throws(() => assertRouteMethod(['audience-snapshots'], 'POST'));
  assert.throws(() => assertRouteMethod(['audience-snapshots', id, 'metadata'], 'POST'));
  assert.throws(() => assertRouteMethod(['audience-snapshots', id, 'other'], 'GET'));
});
test('content-role campaign metadata explicitly labels the absence of a selected source', () => {
  const current = { id, name: 'Draft', version: 1, state: 'draft', revision_id: id,
    intent: { artifact_hash: null, planned_timing: null }, audience_count: 3,
    eligible_count: 1, excluded_count: 2, audience_snapshot: null,
    digest: 'fixture', created_at: '2026-10-02T09:00:00.000Z' };
  assert.deepEqual(CampaignConfigurationView.parse(current), current);
  const history = { id, campaign_id: id, revision_no: 1, name: 'Draft', revision_id: id,
    artifact_hash: null, planned_timing: null, audience_count: 3, eligible_count: 1,
    excluded_count: 2, audience_snapshot: null, digest: 'fixture', actor_id: null,
    captured_at: current.created_at, origin: 'migration_current' };
  assert.deepEqual(CampaignConfigurationSnapshot.parse(history), history);
  assert.equal(CampaignConfigurationView.safeParse({ ...current, intent: { ...current.intent, audience: [{ id, locale: 'en-US' }] } }).success, false);
});
