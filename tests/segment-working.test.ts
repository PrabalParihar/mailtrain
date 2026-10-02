import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Field, Rule } from '../src/domain/segments';
import {
  workingFromRule,
  workingToRule,
  workingBounds,
  workingRuleFingerprint,
  replaceWorkingNode,
  type WorkingRule,
} from '../src/domain/segment-working';

const fields: Field[] = [
  { key: 'score', type: 'number' },
  { key: 'vip', type: 'boolean' },
  { key: 'joined', type: 'date' },
  { key: 'city', type: 'string' },
];
const unknownRelation = '12345678-1234-4234-8234-123456789012';
const nested: Rule = {
  kind: 'any',
  children: [
    { kind: 'attribute', field: 'score', op: 'gte', value: 12.5 },
    {
      kind: 'all',
      children: [
        { kind: 'attribute', field: 'vip', op: 'eq', value: false },
        { kind: 'attribute', field: 'joined', op: 'lt', value: '2026-10-02' },
        { kind: 'attribute', field: 'city', op: 'contains', value: '  München  ' },
        { kind: 'tag', id: unknownRelation, op: 'not_in' },
        { kind: 'list', id: unknownRelation, op: 'in' },
        { kind: 'engagement', event: 'clicked', op: 'not_observed', within_days: 365 },
      ],
    },
  ],
};

test('nested typed rules round-trip without flattening, mutating or serializing edit IDs', () => {
  const before = JSON.stringify(nested);
  const working = workingFromRule(nested);
  assert.deepEqual(workingToRule(working, fields), nested);
  assert.equal(JSON.stringify(nested), before);
  assert.deepEqual(workingBounds(working), { nodes: 9, depth: 2, maxChildren: 6 });
  assert.equal(JSON.stringify(workingToRule(working, fields)).includes('nodeId'), false);
  assert.equal(workingRuleFingerprint(working, fields), JSON.stringify(nested));
  assert.equal(workingRuleFingerprint(workingFromRule(nested), fields), JSON.stringify(nested));
});

test('leaf roots and unknown saved relation IDs retain exact server meaning', () => {
  for (const rule of [
    { kind: 'list', id: unknownRelation, op: 'not_in' },
    { kind: 'attribute', field: 'score', op: 'exists' },
    { kind: 'engagement', event: 'delivered', op: 'observed', within_days: 1 },
  ] as Rule[]) assert.deepEqual(workingToRule(workingFromRule(rule), fields), rule);
});

test('invalid number, boolean, date and day text remains correctable instead of coercing', () => {
  const cases: WorkingRule[] = [];
  for (const value of ['', ' ', 'Infinity', 'NaN', '0x10', '1e999', '--2'])
    cases.push({ nodeId: 'n', kind: 'attribute', field: 'score', op: 'eq', value });
  for (const value of ['', 'yes', 'False', ' true '])
    cases.push({ nodeId: 'n', kind: 'attribute', field: 'vip', op: 'eq', value });
  for (const value of ['', '2026-02-30', '2026-2-01'])
    cases.push({ nodeId: 'n', kind: 'attribute', field: 'joined', op: 'eq', value });
  for (const within_days of ['', ' ', '0', '366', '1.5', '1e2', '0x10'])
    cases.push({ nodeId: 'n', kind: 'engagement', event: 'opened', op: 'observed', within_days });
  for (const working of cases) {
    const before = JSON.stringify(working);
    assert.throws(() => workingToRule(working, fields), before);
    assert.equal(JSON.stringify(working), before);
  }
  assert.deepEqual(
    workingToRule({ nodeId: 'n', kind: 'attribute', field: 'score', op: 'eq', value: '-1.25e2' }, fields),
    { kind: 'attribute', field: 'score', op: 'eq', value: -125 },
  );
});

test('shared semantic validation rejects unknown fields, wrong operators and empty groups', () => {
  const cases: WorkingRule[] = [
    { nodeId: 'n', kind: 'attribute', field: 'missing', op: 'eq', value: 'x' },
    { nodeId: 'n', kind: 'attribute', field: 'vip', op: 'gt', value: 'true' },
    { nodeId: 'n', kind: 'attribute', field: 'score', op: 'contains', value: '1' },
    { nodeId: 'n', kind: 'all', children: [] },
    { nodeId: 'n', kind: 'tag', relationId: '', op: 'in' },
  ];
  for (const working of cases) assert.throws(() => workingToRule(working, fields));
  // Switching to an existence comparison must not send hidden stale value text.
  assert.deepEqual(
    workingToRule({ nodeId: 'n', kind: 'attribute', field: 'score', op: 'exists', value: 'invalid' }, fields),
    { kind: 'attribute', field: 'score', op: 'exists' },
  );
});

test('nested edit and removal are immutable, target one node and retain invalid input', () => {
  const root = workingFromRule(nested);
  assert.ok('children' in root);
  const score = root.children[0];
  const before = JSON.stringify(root);
  const edited = replaceWorkingNode(root, score.nodeId, (node) => ({ ...node, value: '' } as WorkingRule));
  assert.equal(JSON.stringify(root), before);
  assert.throws(() => workingToRule(edited, fields));
  const removed = replaceWorkingNode(root, score.nodeId, () => null);
  assert.deepEqual(workingToRule(removed, fields), { kind: 'any', children: [nested.children[1]] });
  assert.throws(() => replaceWorkingNode(root, root.nodeId, () => null));
  assert.throws(() => replaceWorkingNode(root, 'unknown', () => score));
  const added = replaceWorkingNode(root, root.nodeId, (node) => {
    assert.ok('children' in node);
    return { ...node, children: [...node.children, { ...score, nodeId: 'new-score' }] };
  });
  assert.deepEqual(workingToRule(added, fields), { ...nested, children: [...nested.children, nested.children[0]] });
});

function leaf(nodeId: string): WorkingRule {
  return { nodeId, kind: 'attribute', field: 'first_name', op: 'exists', value: '' };
}
test('depth includes leaf nodes and over-depth edits refuse without changing the original', () => {
  let working = leaf('leaf');
  for (let i = 0; i < 5; i++) working = { nodeId: 'group' + i, kind: 'all', children: [working] };
  assert.equal(workingBounds(working).depth, 5);
  assert.doesNotThrow(() => workingToRule(working, fields));
  const before = JSON.stringify(working);
  assert.throws(() => replaceWorkingNode(working, 'leaf', (node) => ({ nodeId: 'deep', kind: 'any', children: [node] })));
  assert.equal(JSON.stringify(working), before);
});

test('node and child limits also bound invalid working trees before semantic conversion', () => {
  const root: WorkingRule = {
    nodeId: 'root', kind: 'all', children: Array.from({ length: 5 }, (_, group) => ({
      nodeId: 'g' + group, kind: 'any' as const,
      children: Array.from({ length: group === 4 ? 14 : 20 }, (_, i) => leaf(`${group}:${i}`)),
    })),
  };
  assert.deepEqual(workingBounds(root), { nodes: 100, depth: 2, maxChildren: 20 });
  assert.doesNotThrow(() => workingToRule(root, fields));
  assert.throws(() => replaceWorkingNode(root, 'g4', (node) => {
    assert.ok('children' in node);
    return { ...node, children: [...node.children, leaf('one-too-many')] };
  }));
  assert.throws(() => workingBounds({ nodeId: 'root', kind: 'all', children: Array.from({ length: 21 }, (_, i) => leaf('n' + i)) }));
});

test('duplicate edit IDs and cyclic working input refuse deterministically', () => {
  assert.throws(() => workingBounds({ nodeId: 'root', kind: 'all', children: [leaf('same'), leaf('same')] }));
  const cyclic: WorkingRule = { nodeId: 'root', kind: 'all', children: [] };
  cyclic.children.push(cyclic);
  assert.throws(() => workingBounds(cyclic));
});

test('even a mutating edit callback cannot change the original tree on refusal', () => {
  const root = workingFromRule(nested), before = JSON.stringify(root);
  assert.throws(() => replaceWorkingNode(root, root.nodeId, (node) => {
    assert.ok('children' in node);
    node.children.length = 0;
    node.children.push(node);
    return node;
  }));
  assert.equal(JSON.stringify(root), before);
});
