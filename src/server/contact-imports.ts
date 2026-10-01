import { recordEvent } from './events';
import { z } from 'zod';
import { MappingSchema, inspectCsv, prepareImport, type ImportRow } from '../domain/contact-import';
import { fail } from './errors';
import { keyed } from './commands';
import { audit, digest } from './audit';
import type { Tx } from './db';
import type { Principal } from './auth';
function csvChecked<T>(fn: () => T): T {
  try {
    return fn();
  } catch (e) {
    if (e instanceof z.ZodError) throw e;
    fail(
      422,
      'CSV_INVALID',
      e instanceof Error ? e.message : 'Check the CSV structure and mapping.',
    );
  }
}
async function checkDefinitions(tx: Tx, list_ids: string[], tag_ids: string[]) {
  for (const [table, ids] of [
    ['lists', list_ids],
    ['tags', tag_ids],
  ] as const)
    if (
      ids.length &&
      (await tx.query(`SELECT id FROM ${table} WHERE id=ANY($1::uuid[])`, [[...new Set(ids)]]))
        .rowCount !== new Set(ids).size
    )
      fail(404, 'RESOURCE_NOT_FOUND', 'A selected list or tag was not found.');
}
async function collisions(tx: Tx, rows: ImportRow[]) {
  const current = (
    await tx.query(
      'SELECT email_lookup,email_original FROM contacts WHERE email_lookup=ANY($1::text[])',
      [rows.filter((r) => !r.error).map((r) => r.lookup)],
    )
  ).rows;
  const originals = new Map(current.map((c) => [c.email_lookup, c.email_original]));
  return rows.filter(
    (r) => !r.error && originals.has(r.lookup) && originals.get(r.lookup) !== r.original,
  );
}
export async function importCommand(
  tx: Tx,
  p: Principal,
  id: string | undefined,
  command: string | undefined,
  body: Record<string, unknown>,
  key: string | null,
) {
  if (id === 'inspect') {
    const csv = z
      .object({ csv: z.string().max(2 * 1024 * 1024) })
      .strict()
      .parse(body).csv;
    const inspected = csvChecked(() => inspectCsv(csv));
    return { headers: inspected.headers, total: inspected.total };
  }
  if (!id)
    return keyed(tx, p, 'contacts.import.dryrun', key, body, async () => {
      const input = z
        .object({
          csv: z.string().max(2 * 1024 * 1024),
          mapping: MappingSchema.optional(),
          list_ids: z.array(z.string().uuid()).max(20).default([]),
          tag_ids: z.array(z.string().uuid()).max(20).default([]),
        })
        .strict()
        .parse(body);
      await checkDefinitions(tx, input.list_ids, input.tag_ids);
      const fields = (await tx.query('SELECT key,type FROM contact_fields')).rows;
      const prepared = csvChecked(() => prepareImport(input.csv, input.mapping, fields));
      for (const row of await collisions(tx, prepared.rows))
        row.error =
          'Existing case-collision address. Resolve its identity and consent before import.';
      prepared.valid = prepared.rows.filter((r) => !r.error).length;
      prepared.held = prepared.valid;
      const errors = prepared.rows.filter((r) => r.error);
      const op = (
        await tx.query(
          "INSERT INTO operations(workspace_id,type,state,input,result,created_by) VALUES($1,'contacts.import','succeeded',$2,$3,$4) RETURNING id",
          [
            p.workspace,
            JSON.stringify({
              digest: digest(input.csv),
              mapping: prepared.mapping,
              list_ids: [...new Set(input.list_ids)],
              tag_ids: [...new Set(input.tag_ids)],
            }),
            JSON.stringify({ ...prepared, confirmed: false }),
            p.user,
          ],
        )
      ).rows[0];
      await audit(tx, p.workspace, p.user, 'contacts.import_dryrun', op.id);
      return {
        operation_id: op.id,
        preview: {
          ...prepared,
          rows: prepared.rows.slice(0, 100),
          sample_limit: 100,
          error_count: errors.length,
          errors: errors.slice(0, 100),
          next_error_cursor: errors.length > 100 ? 100 : null,
        },
        notice:
          'Consent columns are unverified claims. Imports never grant confirmed opt-in or clear blocks.',
      };
    });
  if (command === 'confirm')
    return keyed(tx, p, 'contacts.import.confirm:' + id, key, body, async () => {
      z.object({}).strict().parse(body);
      const op = (
        await tx.query(
          "SELECT * FROM operations WHERE id=$1 AND type='contacts.import' FOR UPDATE",
          [id],
        )
      ).rows[0];
      if (!op) fail(404, 'RESOURCE_NOT_FOUND', 'Import not found.');
      if (op.result.confirmed)
        return op.result.counts
          ? { ...op.result.counts, counts: op.result.counts }
          : { imported: op.result.imported, held: op.result.imported, eligible: 0 };
      if (op.result.consent_conflicts?.length)
        fail(
          409,
          'CONSENT_CONFLICT',
          'Resolve conflicting consent rows before importing this file. No rows were applied.',
        );
      const rows: ImportRow[] = op.result.rows
        .filter((r: ImportRow) => !r.error)
        .map((r: ImportRow & { first_name?: string }) => ({
          ...r,
          attrs: r.attrs ?? { first_name: r.first_name ?? '' },
          preferred_locale: r.preferred_locale ?? 'en-US',
          consent_claim: r.consent_claim ?? { verified: false, status: 'pending_confirmation' },
        }));
      const list_ids: string[] = op.input.list_ids ?? [],
        tag_ids: string[] = op.input.tag_ids ?? [];
      await checkDefinitions(tx, list_ids, tag_ids);
      await tx.query('SELECT pg_advisory_xact_lock(hashtext($1))', [
        p.workspace + ':contact-import',
      ]);
      if ((await collisions(tx, rows)).length)
        fail(409, 'IMPORT_CONFLICT', 'A case-collision appeared after the dry run. Run it again.');
      const payload = JSON.stringify(rows),
        lookups = rows.map((r) => r.lookup);
      const created = (
        await tx.query(
          `INSERT INTO contacts(workspace_id,email_original,email_lookup,attrs,preferred_locale) SELECT $1,r.original,r.lookup,r.attrs,r.preferred_locale FROM jsonb_to_recordset($2::jsonb) AS r(original text,lookup text,attrs jsonb,preferred_locale text) ON CONFLICT(workspace_id,email_lookup) DO NOTHING RETURNING id,email_lookup`,
          [p.workspace, payload],
        )
      ).rows;
      await tx.query(
        'SELECT id FROM contacts WHERE email_lookup=ANY($1::text[]) ORDER BY id FOR UPDATE',
        [lookups],
      );
      if (created.length)
        await tx.query(
          `INSERT INTO consent_events(workspace_id,contact_id,action,evidence) SELECT $1,c.id,'import_held',jsonb_build_object('source_operation',$3::text,'reason','No verified opt-in proof','claim',r.consent_claim) FROM contacts c JOIN jsonb_to_recordset($2::jsonb) AS r(lookup text,consent_claim jsonb) ON r.lookup=c.email_lookup WHERE c.id=ANY($4::uuid[])`,
          [p.workspace, payload, id, created.map((c) => c.id)],
        );
      const changed = new Set<string>();
      for (const [table, column, ids] of [
        ['contact_lists', 'list_id', list_ids],
        ['contact_tags', 'tag_id', tag_ids],
      ] as const) {
        if (!ids.length) continue;
        const attached = (
          await tx.query(
            `INSERT INTO ${table}(workspace_id,contact_id,${column}) SELECT $1,c.id,unnest($3::uuid[]) FROM contacts c WHERE c.email_lookup=ANY($2::text[]) ON CONFLICT DO NOTHING RETURNING contact_id`,
            [p.workspace, lookups, ids],
          )
        ).rows;
        attached.forEach((r) => changed.add(r.contact_id));
      }
      if (changed.size)
        await tx.query(
          'UPDATE contacts SET profile_version=profile_version+1 WHERE id=ANY($1::uuid[])',
          [[...changed]],
        );
      const optouts = rows
        .filter((r) => r.consent_claim.status === 'unsubscribed')
        .map((r) => r.lookup);
      if (optouts.length) {
        const updated = (
          await tx.query(
            "UPDATE contacts c SET subscription='unsubscribed',consent_version=consent_version+1,preference_version=preference_version+1 WHERE email_lookup=ANY($1::text[]) AND (subscription<>'unsubscribed' OR EXISTS(SELECT 1 FROM opt_in_requests r WHERE r.contact_id=c.id AND r.status='pending' AND r.expires_at>now() AND r.expected_consent_version=c.consent_version)) RETURNING id",
            [optouts],
          )
        ).rows;
        const suppressed = (
          await tx.query(
            "INSERT INTO suppressions(workspace_id,contact_id,reason) SELECT $1,id,'import_unsubscribe' FROM contacts WHERE email_lookup=ANY($2::text[]) ON CONFLICT DO NOTHING RETURNING contact_id",
            [p.workspace, optouts],
          )
        ).rows;
        const events = [
          ...new Set([...updated.map((c) => c.id), ...suppressed.map((c) => c.contact_id)]),
        ];
        if (events.length)
          await tx.query(
            `INSERT INTO consent_events(workspace_id,contact_id,action,evidence) SELECT $1,c.id,'import_optout',jsonb_build_object('source_operation',$3::text,'claim',r.consent_claim) FROM contacts c JOIN jsonb_to_recordset($2::jsonb) AS r(lookup text,consent_claim jsonb) ON r.lookup=c.email_lookup WHERE c.id=ANY($4::uuid[])`,
            [p.workspace, payload, id, events],
          );
      }
      const current = (
        await tx.query(
          "SELECT count(*) FILTER(WHERE subscription='pending_confirmation')::int AS held,count(*) FILTER(WHERE subscription='unsubscribed')::int AS unsubscribed,count(*) FILTER(WHERE subscription='subscribed' AND NOT deleted AND NOT EXISTS(SELECT 1 FROM suppressions s WHERE s.contact_id=c.id))::int AS eligible FROM contacts c WHERE email_lookup=ANY($1::text[])",
          [lookups],
        )
      ).rows[0];
      const counts = {
        processed: rows.length,
        created: created.length,
        existing: rows.length - created.length,
        imported: created.length,
        opt_in_granted: 0,
        ...current,
      };
      await tx.query('UPDATE operations SET result=$1 WHERE id=$2', [
        JSON.stringify({ ...op.result, confirmed: true, imported: created.length, counts }),
        id,
      ]);
      await recordEvent(tx,p.workspace,{type:'contacts.imported',aggregate:{type:'operation',id,version:1},data:{operation_id:id,processed:counts.processed,created:counts.created,existing:counts.existing,opt_in_granted:0}});
      await audit(tx, p.workspace, p.user, 'contacts.imported', id);
      return { ...counts, counts };
    });
  fail(404, 'RESOURCE_NOT_FOUND', 'Import command not found.');
}
export async function readImportErrors(tx: Tx, id: string, cursor: string | null) {
  const offset = z.coerce
    .number()
    .int()
    .min(0)
    .max(10000)
    .parse(cursor ?? 0);
  const op = (
    await tx.query("SELECT result FROM operations WHERE id=$1 AND type='contacts.import'", [id])
  ).rows[0];
  if (!op) fail(404, 'RESOURCE_NOT_FOUND', 'Import not found.');
  const errors = op.result.rows.filter((r: ImportRow) => r.error);
  return {
    rows: errors.slice(offset, offset + 100),
    total_errors: errors.length,
    next_cursor: offset + 100 < errors.length ? offset + 100 : null,
  };
}
