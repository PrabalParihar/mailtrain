import { z } from 'zod';
export type Field = { key: string; type: 'string' | 'number' | 'boolean' | 'date' };
export const FieldSchema = z
  .object({
    key: z.string().regex(/^[a-z][a-z0-9_]{0,47}$/),
    label: z.string().trim().min(1).max(100),
    type: z.enum(['string', 'number', 'boolean', 'date']),
  })
  .strict();
export const builtinFields: Field[] = [{ key: 'first_name', type: 'string' }];
type Group = { kind: 'all' | 'any'; children: Rule[] };
type Relation = { kind: 'tag' | 'list'; id: string; op: 'in' | 'not_in' };
type Attribute = {
  kind: 'attribute';
  field: string;
  op: 'eq' | 'neq' | 'contains' | 'gt' | 'gte' | 'lt' | 'lte' | 'exists' | 'not_exists';
  value?: string | number | boolean;
};
type Engagement = {
  kind: 'engagement';
  event: 'opened' | 'clicked' | 'delivered';
  op: 'observed' | 'not_observed';
  within_days: number;
};
export type Rule = Group | Relation | Attribute | Engagement;
const scalar = z.union([z.string().max(2000), z.number().finite(), z.boolean()]);
export const RuleLeafSchema = z.discriminatedUnion('kind', [
  z
    .object({ kind: z.enum(['tag', 'list']), id: z.string().uuid(), op: z.enum(['in', 'not_in']) })
    .strict(),
  z
    .object({
      kind: z.literal('attribute'),
      field: FieldSchema.shape.key,
      op: z.enum(['eq', 'neq', 'contains', 'gt', 'gte', 'lt', 'lte', 'exists', 'not_exists']),
      value: scalar.optional(),
    })
    .strict(),
  z
    .object({
      kind: z.literal('engagement'),
      event: z.enum(['opened', 'clicked', 'delivered']),
      op: z.enum(['observed', 'not_observed']),
      within_days: z.number().int().min(1).max(365),
    })
    .strict(),
]);
function validDate(value: unknown) {
  return (
    typeof value === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(Date.parse(value + 'T00:00:00Z')) &&
    new Date(value + 'T00:00:00Z').toISOString().slice(0, 10) === value
  );
}
function checkValue(value: unknown, field: Field) {
  if (field.type === 'date' ? !validDate(value) : typeof value !== field.type)
    throw new Error(`Use a ${field.type} value for ${field.key}.`);
  if (typeof value === 'number' && !Number.isFinite(value)) throw new Error('Use a finite number.');
  if (typeof value === 'string' && value.length > 2000)
    throw new Error('Attribute values cannot exceed 2,000 characters.');
}
export function validateAttributes(input: unknown, fields: Field[]) {
  const values = z.record(z.string(), scalar.nullable()).parse(input);
  if (Object.keys(values).length > 100) throw new Error('At most 100 fields may be changed.');
  for (const [key, value] of Object.entries(values)) {
    const field = [...builtinFields, ...fields].find((f) => f.key === key);
    if (!field) throw new Error(`Unknown custom field: ${key}.`);
    if (value !== null) checkValue(value, field);
  }
  return values;
}
export function validateRule(input: unknown, fields: Field[]): Rule {
  let count = 0;
  const walk = (value: unknown, depth: number): Rule => {
    if (++count > 100 || depth > 5)
      throw new Error('Rules allow at most 100 nodes and five nested groups.');
    if (
      value &&
      typeof value === 'object' &&
      'kind' in value &&
      (value.kind === 'all' || value.kind === 'any')
    ) {
      const group = z
        .object({ kind: z.enum(['all', 'any']), children: z.array(z.unknown()).min(1).max(20) })
        .strict()
        .parse(value);
      return { kind: group.kind, children: group.children.map((c) => walk(c, depth + 1)) };
    }
    const leaf = RuleLeafSchema.parse(value);
    if (leaf.kind === 'attribute') {
      const field = [...builtinFields, ...fields].find((f) => f.key === leaf.field);
      if (!field) throw new Error(`Unknown custom field: ${leaf.field}.`);
      if (['exists', 'not_exists'].includes(leaf.op)) {
        if (leaf.value !== undefined) throw new Error('Existence rules do not take a value.');
      } else {
        checkValue(leaf.value, field);
        if (leaf.op === 'contains' && field.type !== 'string')
          throw new Error('Contains requires a text field.');
        if (
          ['gt', 'gte', 'lt', 'lte'].includes(leaf.op) &&
          !['number', 'date'].includes(field.type)
        )
          throw new Error('Ordering requires a number or date field.');
      }
    }
    return leaf;
  };
  return walk(input, 0);
}
export function relationIds(rule: Rule): Relation[] {
  if ('children' in rule) return rule.children.flatMap(relationIds);
  return rule.kind === 'list' || rule.kind === 'tag' ? [rule] : [];
}
export function compileRule(input: Rule, fields: Field[]) {
  const rule = validateRule(input, fields),
    params: unknown[] = [];
  const bind = (v: unknown) => {
    params.push(v);
    return '$' + params.length;
  };
  const walk = (node: Rule): string => {
    if ('children' in node)
      return '(' + node.children.map(walk).join(node.kind === 'all' ? ' AND ' : ' OR ') + ')';
    if (node.kind === 'tag' || node.kind === 'list') {
      const table = node.kind === 'tag' ? 'contact_tags' : 'contact_lists',
        key = node.kind === 'tag' ? 'tag_id' : 'list_id';
      return `${node.op === 'not_in' ? 'NOT ' : ''}EXISTS(SELECT 1 FROM ${table} m WHERE m.workspace_id=c.workspace_id AND m.contact_id=c.id AND m.${key}=${bind(node.id)}::uuid)`;
    }
    if (node.kind === 'engagement')
      return `${node.op === 'not_observed' ? 'NOT ' : ''}EXISTS(SELECT 1 FROM engagement_events e WHERE e.workspace_id=c.workspace_id AND e.contact_id=c.id AND e.event=${bind(node.event)} AND e.occurred_at<=statement_timestamp() AND e.occurred_at>=statement_timestamp()-(${bind(node.within_days)}::int*interval '1 day'))`;
    if (node.kind !== 'attribute') throw new Error('Unsupported rule.');
    const field = [...builtinFields, ...fields].find((f) => f.key === node.field)!;
    const key = bind(field.key),
      value = `(c.attrs->>${key})`,
      jsonType = field.type === 'date' ? 'string' : field.type;
    const present = `(jsonb_typeof(c.attrs->${key})='${jsonType}')`;
    if (node.op === 'exists') return `coalesce(${present},false)`;
    if (node.op === 'not_exists') return `NOT coalesce(${present},false)`;
    // CASE prevents casts from being evaluated on legacy or missing values.
    const typed =
      field.type === 'number'
        ? `${value}::numeric`
        : field.type === 'boolean'
          ? `${value}::boolean`
          : `${value} COLLATE "C"`;
    const param = bind(node.value);
    const operators = { eq: '=', neq: '<>', gt: '>', gte: '>=', lt: '<', lte: '<=' };
    const comparison =
      node.op === 'contains'
        ? `position(${param}::text in ${value})>0`
        : `${typed} ${operators[node.op as keyof typeof operators]} ${param}`;
    return `(CASE WHEN ${present} THEN (${comparison}) ELSE false END)`;
  };
  return { sql: walk(rule), params };
}
