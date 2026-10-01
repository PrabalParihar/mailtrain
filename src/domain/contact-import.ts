import { parse } from 'csv-parse/sync';
import { z } from 'zod';
import { normalizeEmail } from './audience';
import { builtinFields, validateAttributes, type Field } from './segments';
import { EmailSpecSchema } from './email';
const column = z.string().min(1).max(100);
export const MappingSchema = z
  .object({
    email: column,
    first_name: column.optional(),
    preferred_locale: column.optional(),
    attributes: z.record(z.string(), column).default({}),
    consent_status: column.optional(),
    consent_source: column.optional(),
    consent_timestamp: column.optional(),
    consent_proof: column.optional(),
  })
  .strict();
export type Mapping = z.input<typeof MappingSchema>;
export type ImportRow = {
  row: number;
  original: string;
  lookup: string;
  attrs: Record<string, string | number | boolean | null>;
  preferred_locale: string;
  error: string | null;
  consent_claim: {
    verified: false;
    status: string;
    source?: string;
    timestamp?: string;
    proof?: string;
  };
};
export function inspectCsv(csv: string): {
  headers: string[];
  records: Record<string, string>[];
  total: number;
} {
  if (!csv.trim() || Buffer.byteLength(csv) > 2 * 1024 * 1024)
    throw new Error('Use a nonempty CSV of at most 2 MiB.');
  let headers: string[] = [];
  const records: Record<string, string>[] = parse(csv, {
    bom: true,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: false,
    max_record_size: 100000,
    columns: (names: string[]) => {
      headers = names.map((name) => name.trim());
      if (
        !headers.length ||
        headers.length > 100 ||
        headers.some((name) => !name || name.length > 100) ||
        new Set(headers).size !== headers.length
      )
        throw new Error('Use unique, nonempty headers; at most 100 columns.');
      return headers;
    },
  });
  if (!headers.length) throw new Error('Include a CSV header row.');
  if (records.length > 10000) throw new Error('At most 10,000 rows per development import.');
  return { headers, records, total: records.length };
}
export function prepareImport(csv: string, input: Mapping | undefined, fields: Field[]) {
  const { headers, records, total } = inspectCsv(csv);
  const mapping = MappingSchema.parse(
    input ?? {
      email: 'email',
      ...(headers.includes('first_name') ? { first_name: 'first_name' } : {}),
    },
  );
  const references = Object.entries(mapping)
    .flatMap(([key, value]) =>
      key === 'attributes' ? Object.values(value as Record<string, string>) : [value as string],
    )
    .filter(Boolean);
  if (references.some((name) => !headers.includes(name)))
    throw new Error('A mapped CSV column was not found. Inspect the headers again.');
  const definitions = [...builtinFields, ...fields];
  for (const key of Object.keys(mapping.attributes))
    if (!definitions.some((f) => f.key === key)) throw new Error('Unknown custom field: ' + key);
  const seen = new Set<string>();
  const rows: ImportRow[] = records.map((record, index) => {
    const row: ImportRow = {
      row: index + 2,
      original: '',
      lookup: '',
      attrs: {},
      preferred_locale: 'en-US',
      error: null,
      consent_claim: { verified: false, status: 'pending_confirmation' },
    };
    try {
      const email = normalizeEmail(record[mapping.email] ?? '');
      if (!/@(example\.(com|org|net)|[^@]+\.(test|invalid|example))$/i.test(email.original))
        throw new Error(
          'Only reserved fixture addresses are admitted until consent/legal launch gates pass.',
        );
      row.original = email.original;
      row.lookup = email.lookup;
      const status = mapping.consent_status ? record[mapping.consent_status] : '';
      if (status)
        row.consent_claim.status = z
          .enum(['pending_confirmation', 'subscribed', 'unsubscribed'])
          .parse(status);
      if (mapping.consent_source && record[mapping.consent_source])
        row.consent_claim.source = z.string().max(500).parse(record[mapping.consent_source]);
      if (mapping.consent_timestamp && record[mapping.consent_timestamp])
        row.consent_claim.timestamp = z
          .string()
          .datetime({ offset: true })
          .parse(record[mapping.consent_timestamp]);
      if (mapping.consent_proof && record[mapping.consent_proof])
        row.consent_claim.proof = z.string().max(2000).parse(record[mapping.consent_proof]);
      if (seen.has(email.lookup))
        throw new Error('Duplicate/case-collision address in this import.');
      seen.add(email.lookup);
      const attrs: Record<string, string | number | boolean | null> = {};
      if (mapping.first_name) attrs.first_name = record[mapping.first_name] ?? '';
      for (const [key, header] of Object.entries(mapping.attributes)) {
        const value = record[header] ?? '',
          field = definitions.find((f) => f.key === key)!;
        if (!value.trim()) {
          attrs[key] = null;
          continue;
        }
        if (field.type === 'number') {
          if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(value))
            throw new Error(`Use a number for ${key}.`);
          attrs[key] = Number(value);
        } else if (field.type === 'boolean') {
          if (!/^(true|false|yes|no|1|0)$/i.test(value))
            throw new Error(`Use true/false for ${key}.`);
          attrs[key] = /^(true|yes|1)$/i.test(value);
        } else attrs[key] = value;
      }
      row.attrs = validateAttributes(attrs, fields);
      if (mapping.preferred_locale && record[mapping.preferred_locale])
        row.preferred_locale = EmailSpecSchema.shape.locale.parse(record[mapping.preferred_locale]);
    } catch (error) {
      row.error =
        error instanceof z.ZodError
          ? 'Invalid locale or consent field. Use an allowed status and ISO timestamp.'
          : error instanceof Error
            ? error.message
            : 'Invalid row.';
      // Keep bounded fixture claims for conflict review; prohibited addresses retain no data.
      row.attrs = {};
      if (!row.original) row.consent_claim = { verified: false, status: 'pending_confirmation' };
    }
    return row;
  });
  const groups = new Map<string, ImportRow[]>();
  for (const row of rows)
    if (row.lookup) groups.set(row.lookup, [...(groups.get(row.lookup) ?? []), row]);
  const consent_conflicts: { lookup: string; rows: number[] }[] = [];
  for (const [lookup, group] of groups)
    if (new Set(group.map((r) => r.consent_claim.status)).size > 1) {
      consent_conflicts.push({ lookup, rows: group.map((r) => r.row) });
      for (const row of group) {
        row.error =
          'Conflicting consent for this address. Resolve every conflicting row before import. ' +
          (row.error ?? '');
        row.attrs = {};
      }
    }
  return {
    rows,
    consent_conflicts,
    total,
    valid: rows.filter((r) => !r.error).length,
    held: rows.filter((r) => !r.error).length,
    eligible: 0,
    headers,
    mapping,
    ignored_columns: headers.filter((h) => !references.includes(h)),
  };
}
