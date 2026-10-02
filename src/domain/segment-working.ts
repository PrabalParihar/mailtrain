import { builtinFields, validateRule, type Field, type Rule } from './segments';

type Attribute = Extract<Rule, { kind: 'attribute' }>;
type Engagement = Extract<Rule, { kind: 'engagement' }>;
export type WorkingLeaf =
  | { nodeId: string; kind: 'tag' | 'list'; relationId: string; op: 'in' | 'not_in' }
  | { nodeId: string; kind: 'attribute'; field: string; op: Attribute['op']; value: string }
  | { nodeId: string; kind: 'engagement'; event: Engagement['event']; op: Engagement['op']; within_days: string };
export type WorkingRule = WorkingLeaf | { nodeId: string; kind: 'all' | 'any'; children: WorkingRule[] };

/** Structural bounds also apply while leaves contain incomplete working text. */
export function workingBounds(root: WorkingRule) {
  let nodes = 0, depth = 0, maxChildren = 0;
  const ids = new Set<string>();
  const walk = (node: WorkingRule, at: number) => {
    if (++nodes > 100 || at > 5) throw new Error('Rules allow at most 100 nodes and depth five.');
    if (!node || typeof node !== 'object' || typeof node.nodeId !== 'string' ||
        !node.nodeId || node.nodeId.length > 100 || ids.has(node.nodeId))
      throw new Error('Every rule needs a unique edit ID.');
    ids.add(node.nodeId);
    depth = Math.max(depth, at);
    if (node.kind === 'all' || node.kind === 'any') {
      if (!Array.isArray(node.children) || node.children.length > 20)
        throw new Error('A group allows at most 20 children.');
      maxChildren = Math.max(maxChildren, node.children.length);
      for (const child of node.children) walk(child, at + 1);
    } else if (!['attribute', 'tag', 'list', 'engagement'].includes(node.kind)) {
      throw new Error('Unsupported rule.');
    }
  };
  walk(root, 0);
  return { nodes, depth, maxChildren };
}

export function workingFromRule(rule: Rule): WorkingRule {
  let count = 0;
  const walk = (node: Rule, depth: number): WorkingRule => {
    if (++count > 100 || depth > 5) throw new Error('Rules allow at most 100 nodes and depth five.');
    const nodeId = 'rule-' + count;
    if ('children' in node) {
      if (node.children.length > 20) throw new Error('A group allows at most 20 children.');
      return { nodeId, kind: node.kind, children: node.children.map((child) => walk(child, depth + 1)) };
    }
    if (node.kind === 'tag' || node.kind === 'list')
      return { nodeId, kind: node.kind, relationId: node.id, op: node.op };
    if (node.kind === 'engagement')
      return { nodeId, ...node, within_days: String(node.within_days) };
    if (node.kind === 'attribute')
      return { nodeId, kind: node.kind, field: node.field, op: node.op, value: node.value === undefined ? '' : String(node.value) };
    throw new Error('Unsupported rule.');
  };
  return walk(rule, 0);
}

function workingText(value: unknown) {
  if (typeof value !== 'string' || value.length > 2000)
    throw new Error('Keep rule values within 2,000 characters.');
  return value;
}

export function workingToRule(root: WorkingRule, fields: Field[]): Rule {
  workingBounds(root);
  const walk = (node: WorkingRule): Rule => {
    if ('children' in node) return { kind: node.kind, children: node.children.map(walk) };
    if (node.kind === 'tag' || node.kind === 'list')
      return { kind: node.kind, id: workingText(node.relationId), op: node.op };
    if (node.kind === 'engagement') {
      const text = workingText(node.within_days);
      if (!/^\d+$/.test(text)) throw new Error('Use whole days from 1 to 365.');
      return { kind: node.kind, event: node.event, op: node.op, within_days: Number(text) };
    }
    if (node.kind !== 'attribute') throw new Error('Unsupported rule.');
    const field = [...builtinFields, ...fields].find((item) => item.key === node.field);
    if (!field) throw new Error(`Unknown custom field: ${node.field}.`);
    const attribute = { kind: node.kind, field: node.field, op: node.op };
    if (node.op === 'exists' || node.op === 'not_exists') return attribute;
    const text = workingText(node.value);
    let value: string | number | boolean = text;
    if (field.type === 'number') {
      if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(text) || !Number.isFinite(Number(text)))
        throw new Error(`Use a finite decimal number for ${field.key}.`);
      value = Number(text);
    } else if (field.type === 'boolean') {
      if (text !== 'true' && text !== 'false') throw new Error(`Use true or false for ${field.key}.`);
      value = text === 'true';
    }
    return { ...attribute, value };
  };
  return validateRule(walk(root), fields);
}

export function workingRuleFingerprint(root: WorkingRule, fields: Field[]) {
  return JSON.stringify(workingToRule(root, fields));
}

/** Return a bounded new tree. Deleting the root requires an explicit replacement. */
export function replaceWorkingNode(
  root: WorkingRule,
  nodeId: string,
  change: (node: WorkingRule) => WorkingRule | null,
): WorkingRule {
  workingBounds(root);
  let found = false;
  const walk = (node: WorkingRule): WorkingRule | null => {
    if (node.nodeId === nodeId) {
      found = true;
      return change(structuredClone(node));
    }
    if ('children' in node) {
      const children = node.children.map(walk).filter((child): child is WorkingRule => child !== null);
      return { ...node, children };
    }
    return node;
  };
  const result = walk(root);
  if (!found) throw new Error('The selected rule is unavailable.');
  if (!result) throw new Error('Replace the root rule explicitly.');
  workingBounds(result);
  return result;
}
