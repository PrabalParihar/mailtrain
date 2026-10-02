import { z } from 'zod';

const uuid = z.string().uuid();
const integer = z.number().int().positive().max(2147483647);
const count = z.number().int().min(0).max(10000);
const utc = z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/).refine((value) => {
  const time = new Date(value);
  return Number.isFinite(time.getTime()) && time.toISOString() === value;
}, 'Use an exact UTC timestamp.');
const timestamp = z.union([utc, z.date().transform((value) => value.toISOString()).pipe(utc)]);

export const AudienceSnapshotMemberSchema = z.object({
  id: uuid.regex(/^[0-9a-f-]+$/),
  locale: z.string().max(35).regex(/^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/),
  consent_version: integer,
  eligible: z.boolean(),
  reason: z.enum(['ELIGIBLE', 'SUPPRESSED', 'CONTACT_DELETED', 'CONSENT_NOT_CONFIRMED']),
}).strict().refine((member) => member.eligible === (member.reason === 'ELIGIBLE'), {
  message: 'Captured eligibility and reason must agree.', path: ['reason'],
});
export type AudienceSnapshotMember = z.infer<typeof AudienceSnapshotMemberSchema>;

const pointerShape = {
  id: uuid, segment_id: uuid, segment_version: integer, evaluated_at: utc,
  matched_count: count, eligible_count: count, digest: z.string().regex(/^[0-9a-f]{64}$/),
};
export const AudienceSnapshotPointerSchema = z.object(pointerShape).strict().refine(
  (value) => value.eligible_count <= value.matched_count,
  { message: 'Eligible count cannot exceed the matched count.', path: ['eligible_count'] },
);
export type AudienceSnapshotPointer = z.infer<typeof AudienceSnapshotPointerSchema>;
export const AudienceSnapshotMetadataSchema = z.object({
  ...pointerShape, segment_name: z.string().min(1).max(100), excluded_count: count, created_at: utc,
}).strict().refine(
  (value) => value.eligible_count + value.excluded_count === value.matched_count,
  { message: 'Snapshot counts must agree.', path: ['excluded_count'] },
);
export type AudienceSnapshotMetadata = z.infer<typeof AudienceSnapshotMetadataSchema>;

const SourceSchema = z.object({
  segment_id: uuid, segment_version: integer, evaluated_at: timestamp,
  members: z.array(AudienceSnapshotMemberSchema).max(10000), matched_count: count, eligible_count: count,
}).strict().superRefine((source, ctx) => {
  if (source.matched_count !== source.members.length ||
      source.eligible_count !== source.members.filter((member) => member.eligible).length)
    ctx.addIssue({ code: 'custom', message: 'Stored snapshot counts must match its members.', path: ['members'] });
  let previous: string | undefined;
  for (const member of source.members) {
    if (previous !== undefined && previous >= member.id) {
      ctx.addIssue({ code: 'custom', message: 'Snapshot members must be sorted and unique.', path: ['members'] });
      break;
    }
    previous = member.id;
  }
});

/** This key order is the original snapshot v1 digest contract, including member keys. */
export function snapshotSource(input: unknown) {
  const source = SourceSchema.parse(input);
  return {
    schema_version: 1 as const,
    segment_id: source.segment_id,
    segment_version: source.segment_version,
    evaluated_at: source.evaluated_at,
    members: source.members,
    matched_count: source.matched_count,
    eligible_count: source.eligible_count,
    excluded_count: source.matched_count - source.eligible_count,
  };
}
