import { test } from 'node:test';
import assert from 'node:assert/strict';
import { inspectCsv, prepareImport } from '../src/domain/contact-import';
const fields = [
  { key: 'score', type: 'number' as const },
  { key: 'vip', type: 'boolean' as const },
  { key: 'joined', type: 'date' as const },
];
test('CSV header inspection supports quoted names and rejects duplicate, empty or oversized structures', () => {
  assert.deepEqual(inspectCsv('"Email, address",Name\nreader@example.com,Reader').headers, [
    'Email, address',
    'Name',
  ]);
  assert.throws(() => inspectCsv('email,email\na@example.com,b@example.com'));
  assert.throws(() => inspectCsv('email,\na@example.com,Reader'));
  assert.throws(() => inspectCsv(''));
  assert.throws(() => inspectCsv('email,name\na@example.com'));
});
test('explicit mapping converts typed attributes and keeps consent as unverified claims', () => {
  const result = prepareImport(
    'Address,Points,VIP,Joined,Permission,Source,Time,Proof\nreader@example.com,7,false,2026-10-01,subscribed,website,2026-10-01T00:00:00Z,form-123',
    {
      email: 'Address',
      attributes: { score: 'Points', vip: 'VIP', joined: 'Joined' },
      consent_status: 'Permission',
      consent_source: 'Source',
      consent_timestamp: 'Time',
      consent_proof: 'Proof',
    },
    fields,
  );
  assert.equal(result.valid, 1);
  assert.equal(result.eligible, 0);
  assert.deepEqual(result.rows[0].attrs, { score: 7, vip: false, joined: '2026-10-01' });
  assert.equal(result.rows[0].consent_claim.verified, false);
  assert.equal(result.rows[0].consent_claim.status, 'subscribed');
});
test('row errors reject invalid dates/types and collisions; prohibited recipient data is redacted', () => {
  const result = prepareImport(
    'email,score,joined\nreader@example.com,8,2026-10-01\nREADER@example.com,9,2026-10-01\nother@example.com,nan,2026-02-30\nprivate@real-company.com,8,2026-10-01',
    { email: 'email', attributes: { score: 'score', joined: 'joined' } },
    fields,
  );
  assert.equal(result.valid, 1);
  assert.match(result.rows[1].error!, /Duplicate/);
  assert.match(result.rows[2].error!, /number|date/i);
  assert.match(result.rows[3].error!, /reserved/i);
  assert.equal(result.rows[3].original, '');
  assert.deepEqual(result.rows[3].attrs, {});
  assert.throws(() => prepareImport('email,name\na@example.com,A', { email: 'Missing' }, fields));
  assert.throws(() =>
    prepareImport(
      'email,name\na@example.com,A',
      { email: 'email', attributes: { subscription: 'name' } },
      fields,
    ),
  );
});
test('conflicting duplicate consent flags the entire lookup group and preserves both claims independent of order', () => {
  for (const entries of [
    'reader@example.com,subscribed\nREADER@example.com,unsubscribed',
    'READER@example.com,unsubscribed\nreader@example.com,subscribed',
  ]) {
    const result = prepareImport(
      'email,consent\n' + entries,
      { email: 'email', consent_status: 'consent' },
      [],
    );
    assert.equal(result.valid, 0);
    assert.equal(result.consent_conflicts.length, 1);
    assert.deepEqual(result.rows.map((r) => r.consent_claim.status).sort(), [
      'subscribed',
      'unsubscribed',
    ]);
    assert.ok(result.rows.every((r) => r.error?.includes('Conflicting consent')));
  }
});
