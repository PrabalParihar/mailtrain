import { z } from 'zod';
import { resourcePage } from './pagination';
import { withPrincipal } from './auth';
import { keyed } from './commands';
import { audit, digest } from './audit';
import { fail } from './errors';
import type { Tx } from './db';
import {
  FieldSchema,
  builtinFields,
  compileRule,
  relationIds,
  validateAttributes,
  validateRule,
  type Field,
  type Rule,
} from '../domain/segments';
import { EmailSpecSchema } from '../domain/email';
import { eligibility } from '../domain/audience';
async function fieldDefinitions(tx: Tx): Promise<Field[]> {
  return (await tx.query('SELECT key,type FROM contact_fields ORDER BY key')).rows;
}
function checked<T>(fn: () => T): T {
  try {
    return fn();
  } catch (e) {
    if (e instanceof z.ZodError) throw e;
    fail(422, 'RULE_INVALID', e instanceof Error ? e.message : 'Check the rule values.');
  }
}
async function checkedRule(tx: Tx, input: unknown, fields: Field[]) {
  const rule = checked(() => validateRule(input, fields));
  for (const ref of relationIds(rule)) {
    const table = ref.kind === 'tag' ? 'tags' : 'lists';
    if (!(await tx.query(`SELECT id FROM ${table} WHERE id=$1`, [ref.id])).rowCount)
      fail(404, 'RESOURCE_NOT_FOUND', 'A referenced list or tag was not found.');
  }
  return rule;
}
async function evaluate(tx: Tx, rule: Rule, fields: Field[]) {
  const query = compileRule(rule, fields);
  const rows = (
    await tx.query(
      `SELECT c.id,c.email_original,c.preferred_locale,c.consent_version,c.subscription,c.deleted,EXISTS(SELECT 1 FROM suppressions s WHERE s.workspace_id=c.workspace_id AND s.contact_id=c.id) AS suppressed,now() AS evaluated_at FROM contacts c WHERE ${query.sql} ORDER BY c.id LIMIT 10001`,
      query.params,
    )
  ).rows;
  if (rows.length > 10000)
    fail(
      413,
      'AUDIENCE_LIMIT',
      'This development snapshot supports up to 10,000 matched contacts.',
    );
  const evaluated_at =
    rows[0]?.evaluated_at ?? (await tx.query('SELECT now() AS time')).rows[0].time;
  const members = rows.map((c) => ({
    id: c.id,
    locale: c.preferred_locale,
    consent_version: c.consent_version,
    ...eligibility(c),
  }));
  return {
    evaluated_at,
    members,
    matched_count: members.length,
    eligible_count: members.filter((c) => c.eligible).length,
    excluded_count: members.filter((c) => !c.eligible).length,
  };
}
export async function organizationRoute(
  req: Request,
  path: string[],
  body: Record<string, unknown>,
  key: string | null,
) {
  const [root, id, command] = path;
  return withPrincipal(req, 'audience', async (tx, p) => {
    if (root === 'audience-schema')
      return {
        fields: [
          ...builtinFields.map((f) => ({ ...f, label: 'First name', builtin: true })),
          ...(await tx.query('SELECT key,label,type FROM contact_fields ORDER BY key')).rows,
        ],
        lists: (await tx.query('SELECT * FROM lists ORDER BY name LIMIT 200')).rows,
        tags: (await tx.query('SELECT * FROM tags ORDER BY name LIMIT 200')).rows,
        segments: (await tx.query('SELECT * FROM segments ORDER BY created_at DESC LIMIT 100'))
          .rows,
        engagement_status:
          'No connected event source; only genuinely recorded observations can match.',
      };
    if (root === 'lists' || root === 'tags')
      return keyed(tx, p, root + '.create', key, body, async () => {
        const input = z
          .object({ name: z.string().trim().min(1).max(100) })
          .strict()
          .parse(body);
        const item = (
          await tx.query(
            `INSERT INTO ${root}(workspace_id,name) VALUES($1,$2) ON CONFLICT(workspace_id,name) DO NOTHING RETURNING *`,
            [p.workspace, input.name],
          )
        ).rows[0];
        if (!item) fail(409, 'NAME_CONFLICT', 'This name is already in use.');
        await audit(tx, p.workspace, p.user, root + '.created', item.id);
        return { item };
      });
    if (root === 'contact-fields')
      return keyed(tx, p, 'field.create', key, body, async () => {
        const field = FieldSchema.parse(body);
        if (builtinFields.some((f) => f.key === field.key))
          fail(409, 'FIELD_CONFLICT', 'This field key is reserved.');
        const item = (
          await tx.query(
            'INSERT INTO contact_fields(workspace_id,key,label,type) VALUES($1,$2,$3,$4) ON CONFLICT DO NOTHING RETURNING *',
            [p.workspace, field.key, field.label, field.type],
          )
        ).rows[0];
        if (!item)
          fail(
            409,
            'FIELD_CONFLICT',
            'A field with this key already exists. Field types are immutable.',
          );
        await audit(tx, p.workspace, p.user, 'field.created', field.key);
        return { item };
      });
    if (root === 'contacts' && command === 'profile')
      return keyed(tx, p, 'contact.profile:' + id, key, body, async () => {
        const input = z
          .object({
            expected_version: z.number().int().positive(),
            attrs: z.record(z.string(), z.unknown()).default({}),
            list_ids: z.array(z.string().uuid()).max(200).optional(),
            tag_ids: z.array(z.string().uuid()).max(200).optional(),
            preferred_locale: EmailSpecSchema.shape.locale.optional(),
          })
          .strict()
          .parse(body);
        const contact = (await tx.query('SELECT * FROM contacts WHERE id=$1 FOR UPDATE', [id]))
          .rows[0];
        if (!contact || contact.deleted) fail(404, 'RESOURCE_NOT_FOUND', 'Contact not found.');
        if (contact.profile_version !== input.expected_version)
          fail(409, 'VERSION_CONFLICT', 'The contact changed. Reload before saving.');
        const fields = await fieldDefinitions(tx);
        const attrs = checked(() => validateAttributes(input.attrs, fields));
        const merged = { ...contact.attrs };
        for (const [field, value] of Object.entries(attrs)) {
          if (value === null) delete merged[field];
          else merged[field] = value;
        }
        for (const [table, catalog, column, values] of [
          ['contact_lists', 'lists', 'list_id', input.list_ids],
          ['contact_tags', 'tags', 'tag_id', input.tag_ids],
        ] as const) {
          if (values === undefined) continue;
          const unique = [...new Set(values)];
          if (
            unique.length &&
            (await tx.query(`SELECT id FROM ${catalog} WHERE id=ANY($1::uuid[])`, [unique]))
              .rowCount !== unique.length
          )
            fail(404, 'RESOURCE_NOT_FOUND', 'A selected list or tag was not found.');
          await tx.query(`DELETE FROM ${table} WHERE contact_id=$1`, [id]);
          if (unique.length)
            await tx.query(
              `INSERT INTO ${table}(workspace_id,contact_id,${column}) SELECT $1,$2,unnest($3::uuid[])`,
              [p.workspace, id, unique],
            );
        }
        const updated = (
          await tx.query(
            'UPDATE contacts SET attrs=$1,preferred_locale=$2,profile_version=profile_version+1 WHERE id=$3 RETURNING *',
            [JSON.stringify(merged), input.preferred_locale ?? contact.preferred_locale, id],
          )
        ).rows[0];
        await audit(tx, p.workspace, p.user, 'contact.profile_updated', id);
        return {
          contact: updated,
          notice: 'Organization updated. Consent and suppression are unchanged.',
        };
      });
    if (root === 'audience-snapshots') {
      const snapshot = (await tx.query('SELECT * FROM audience_snapshots WHERE id=$1', [id]))
        .rows[0];
      if (!snapshot) fail(404, 'RESOURCE_NOT_FOUND', 'Snapshot not found.');
      return { snapshot };
    }
    if (root === 'segments') {
      if (req.method === 'GET' && !id)
        return resourcePage(req, tx, p, { resource: 'segments', from: 'segments', fields: '*' });
      const fields = await fieldDefinitions(tx);
      if (!id)
        return keyed(tx, p, 'segment.create', key, body, async () => {
          const name = z.string().trim().min(1).max(100).parse(body.name),
            rule = await checkedRule(tx, body.rule, fields);
          const segment = (
            await tx.query(
              'INSERT INTO segments(workspace_id,name) VALUES($1,$2) ON CONFLICT(workspace_id,name) DO NOTHING RETURNING *',
              [p.workspace, name],
            )
          ).rows[0];
          if (!segment) fail(409, 'NAME_CONFLICT', 'This segment name is already in use.');
          await tx.query(
            'INSERT INTO segment_versions(workspace_id,segment_id,version,schema_version,rule,created_by) VALUES($1,$2,1,1,$3,$4)',
            [p.workspace, segment.id, JSON.stringify(rule), p.user],
          );
          await audit(tx, p.workspace, p.user, 'segment.created', segment.id);
          return { segment: { ...segment, rule, schema_version: 1 } };
        });
      const segment = (await tx.query('SELECT * FROM segments WHERE id=$1 FOR UPDATE', [id]))
        .rows[0];
      if (!segment) fail(404, 'RESOURCE_NOT_FOUND', 'Segment not found.');
      const saved = (
        await tx.query(
          'SELECT rule,schema_version FROM segment_versions WHERE segment_id=$1 AND version=$2',
          [id, segment.current_version],
        )
      ).rows[0];
      segment.rule = saved.rule;
      segment.schema_version = saved.schema_version;
      if (req.method === 'GET')
        return {
          segment,
          versions: (
            await tx.query(
              'SELECT version,rule,schema_version,created_at FROM segment_versions WHERE segment_id=$1 ORDER BY version DESC LIMIT 50',
              [id],
            )
          ).rows,
        };
      if (command === 'versions')
        return keyed(tx, p, 'segment.version:' + id, key, body, async () => {
          const expected = z.number().int().positive().parse(body.expected_version);
          if (expected !== segment.current_version)
            fail(409, 'VERSION_CONFLICT', 'The segment changed. Reload its latest version.');
          const rule = await checkedRule(tx, body.rule, fields),
            version = expected + 1;
          await tx.query(
            'INSERT INTO segment_versions(workspace_id,segment_id,version,schema_version,rule,created_by) VALUES($1,$2,$3,1,$4,$5)',
            [p.workspace, id, version, JSON.stringify(rule), p.user],
          );
          await tx.query('UPDATE segments SET current_version=$1 WHERE id=$2', [version, id]);
          await audit(tx, p.workspace, p.user, 'segment.version_created', id);
          return { segment: { ...segment, rule, current_version: version } };
        });
      if (command === 'preview') {
        const input = z
          .object({ expected_version: z.number().int().positive() })
          .strict()
          .parse(body);
        if (input.expected_version !== segment.current_version)
          fail(
            409,
            'VERSION_CONFLICT',
            'The segment changed. Reload its latest version before previewing.',
          );
        const evaluated = await evaluate(tx, segment.rule, fields);
        return {
          preview: {
            ...evaluated,
            members: evaluated.members.slice(0, 100),
            segment_version: segment.current_version,
            sample_limit: 100,
          },
        };
      }
      if (command === 'snapshots')
        return keyed(tx, p, 'segment.snapshot:' + id, key, body, async () => {
          const input = z
            .object({ expected_version: z.number().int().positive() })
            .strict()
            .parse(body);
          if (input.expected_version !== segment.current_version)
            fail(
              409,
              'VERSION_CONFLICT',
              'The segment changed. Reload and review its latest version before freezing.',
            );
          const evaluated = await evaluate(tx, segment.rule, fields);
          const frozen = {
            schema_version: 1,
            segment_id: id,
            segment_version: segment.current_version,
            ...evaluated,
          };
          const snapshot = (
            await tx.query(
              'INSERT INTO audience_snapshots(workspace_id,segment_id,segment_version,evaluated_at,members,matched_count,eligible_count,digest,created_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *',
              [
                p.workspace,
                id,
                segment.current_version,
                evaluated.evaluated_at,
                JSON.stringify(evaluated.members),
                evaluated.matched_count,
                evaluated.eligible_count,
                digest(frozen),
                p.user,
              ],
            )
          ).rows[0];
          await audit(tx, p.workspace, p.user, 'audience.snapshot_created', snapshot.id);
          return {
            snapshot,
            notice:
              'Frozen selection only. Dispatch must check current consent and suppressions again.',
          };
        });
    }
    fail(404, 'RESOURCE_NOT_FOUND', 'Audience command not found.');
  });
}
