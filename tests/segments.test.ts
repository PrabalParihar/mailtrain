import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compileRule, validateAttributes, validateRule } from '../src/domain/segments';
const fields = [
  { key: 'score', type: 'number' as const },
  { key: 'vip', type: 'boolean' as const },
  { key: 'joined', type: 'date' as const },
  { key: 'city', type: 'string' as const },
];
test('segment rules reject unknown fields, mismatched values and unbounded trees', () => {
  assert.throws(() =>
    validateRule({ kind: 'attribute', field: 'score', op: 'gt', value: '5' }, fields),
  );
  assert.throws(() =>
    validateRule(
      { kind: 'attribute', field: 'subscription', op: 'eq', value: 'subscribed' },
      fields,
    ),
  );
  assert.throws(() =>
    validateRule({ kind: 'attribute', field: 'vip', op: 'contains', value: true }, fields),
  );
  let rule: unknown = { kind: 'attribute', field: 'score', op: 'exists' };
  for (let i = 0; i < 8; i++) rule = { kind: 'all', children: [rule] };
  assert.throws(() => validateRule(rule, fields));
  assert.throws(() => validateRule({ kind: 'any', children: [] }, fields));
  assert.throws(() =>
    validateRule({ kind: 'engagement', event: 'opened', op: 'observed', within_days: 0 }, fields),
  );
});
test('typed attributes retain exact types, valid dates and explicit deletion; consent is not writable', () => {
  assert.deepEqual(
    validateAttributes({ score: 3, vip: false, joined: '2026-10-01', city: null }, fields),
    { score: 3, vip: false, joined: '2026-10-01', city: null },
  );
  assert.throws(() => validateAttributes({ score: '3' }, fields));
  assert.throws(() => validateAttributes({ joined: '2026-02-30' }, fields));
  assert.throws(() => validateAttributes({ subscription: 'subscribed' }, fields));
  assert.throws(() => validateAttributes({ city: 'x'.repeat(2001) }, fields));
});
test('rule SQL binds attacker text as parameters and guards missing typed values', () => {
  const value = "x'); DROP TABLE contacts; --";
  const rule = validateRule(
    {
      kind: 'all',
      children: [
        { kind: 'attribute', field: 'city', op: 'neq', value },
        { kind: 'attribute', field: 'score', op: 'gte', value: 7 },
        { kind: 'engagement', event: 'clicked', op: 'observed', within_days: 30 },
      ],
    },
    fields,
  );
  const sql = compileRule(rule, fields);
  assert.equal(sql.sql.includes(value), false);
  assert.ok(sql.params.includes(value));
  assert.match(sql.sql, /jsonb_typeof/);
  assert.match(sql.sql, /engagement_events/);
  assert.match(sql.sql, /workspace_id=c.workspace_id/);
});
