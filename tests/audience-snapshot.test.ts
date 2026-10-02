import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  AudienceSnapshotMemberSchema,
  AudienceSnapshotMetadataSchema,
  AudienceSnapshotPointerSchema,
  snapshotSource,
} from '../src/domain/audience-snapshots';

const member = {
  id: '11111111-1111-4111-8111-111111111111', locale: 'en-US',
  consent_version: 4, eligible: true, reason: 'ELIGIBLE',
};
const input = {
  segment_id: '22222222-2222-4222-8222-222222222222', segment_version: 3,
  evaluated_at: '2026-10-02T09:00:00.123Z', members: [member],
  matched_count: 1, eligible_count: 1,
};
const pointer = {
  id: '33333333-3333-4333-8333-333333333333', segment_id: input.segment_id,
  segment_version: 3, evaluated_at: input.evaluated_at, matched_count: 1,
  eligible_count: 1, digest: 'a'.repeat(64),
};

test('snapshot source reconstructs the original v1 digest bytes from JSONB key order', () => {
  const source = snapshotSource({ ...input, evaluated_at: new Date(input.evaluated_at), members: [{
    reason: 'ELIGIBLE', eligible: true, consent_version: 4, locale: 'en-US', id: member.id,
  }] });
  const expected = '{"schema_version":1,"segment_id":"22222222-2222-4222-8222-222222222222","segment_version":3,"evaluated_at":"2026-10-02T09:00:00.123Z","members":[{"id":"11111111-1111-4111-8111-111111111111","locale":"en-US","consent_version":4,"eligible":true,"reason":"ELIGIBLE"}],"matched_count":1,"eligible_count":1,"excluded_count":0}';
  assert.equal(JSON.stringify(source), expected);
  assert.equal(createHash('sha256').update(JSON.stringify(source)).digest('hex'), createHash('sha256').update(expected).digest('hex'));
  assert.equal(JSON.stringify(input.members), JSON.stringify([member]));
});

test('snapshot source refuses duplicates, unsorted IDs, corrupt counts and inconsistent eligibility', () => {
  const other = { ...member, id: '44444444-4444-4444-8444-444444444444', eligible: false, reason: 'SUPPRESSED' };
  assert.equal(snapshotSource({ ...input, members: [member, other], matched_count: 2 }).excluded_count, 1);
  for (const change of [
    { members: [member, member], matched_count: 2, eligible_count: 2 },
    { members: [other, member], matched_count: 2 },
    { matched_count: 2 }, { eligible_count: 0 }, { eligible_count: 2 },
    { members: [{ ...member, reason: 'SUPPRESSED' }] },
    { members: [{ ...member, eligible: false }] },
    { members: [{ ...member, email_original: 'private@example.test' }] },
    { members: [{ ...member, consent_version: 0 }] },
    { members: [{ ...member, consent_version: 2147483648 }] },
    { evaluated_at: '2026-02-30T00:00:00.000Z' },
    { evaluated_at: '2026-10-02T09:00:00Z' },
    { provider_secret: 'private-fixture' },
  ]) assert.throws(() => snapshotSource({ ...input, ...change }));
  assert.equal(snapshotSource({ ...input, members: [], matched_count: 0, eligible_count: 0 }).excluded_count, 0);
});

test('snapshot member and metadata contracts expose strict bounded values with no private payload', () => {
  assert.deepEqual(AudienceSnapshotMemberSchema.parse(member), member);
  assert.deepEqual(AudienceSnapshotPointerSchema.parse(pointer), pointer);
  const metadata = { ...pointer, segment_name: 'Saved selection', excluded_count: 0, created_at: input.evaluated_at };
  assert.deepEqual(AudienceSnapshotMetadataSchema.parse(metadata), metadata);
  for (const value of [
    { ...metadata, members: [member] }, { ...metadata, workspace_id: input.segment_id },
    { ...metadata, digest: 'no-proof' }, { ...metadata, excluded_count: 1 },
    { ...metadata, eligible_count: 2 }, { ...metadata, matched_count: 10001 },
  ]) assert.equal(AudienceSnapshotMetadataSchema.safeParse(value).success, false);
});

test('snapshot source refuses over-capacity input without truncating a selection', () => {
  assert.throws(() => snapshotSource({ ...input, members: Array.from({ length: 10001 }, () => member), matched_count: 10001, eligible_count: 10001 }));
});
