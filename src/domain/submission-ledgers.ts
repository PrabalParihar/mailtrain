import { z } from 'zod';

const uuid = z.uuid().regex(/^[0-9a-f-]+$/);
const digest = z.string().regex(/^[0-9a-f]{64}$/);
const count = z.number().int().min(0).max(10000);
const integer = z.number().int().min(1).max(2147483647);
const instant = z.iso.datetime();
export const SubmissionState = z.enum(['pending', 'skipped', 'cancelled']);
const capturedReason = z.enum(['ELIGIBLE', 'SUPPRESSED', 'CONTACT_DELETED', 'CONSENT_NOT_CONFIRMED']);

export const SubmissionLedgerInput = z.strictObject({
  expected_version: integer.max(2147483646), expected_digest: digest,
});
export type SubmissionLedgerInput = z.infer<typeof SubmissionLedgerInput>;
export const SubmissionLedgerView = z.strictObject({
  id: uuid, campaign_id: uuid, configuration_id: uuid, configuration_version: integer,
  configuration_digest: digest, revision_id: uuid, artifact_hash: digest,
  snapshot_id: uuid, snapshot_digest: digest,
  status: z.enum(['queued', 'running', 'completed', 'cancelled', 'failed']),
  total_count: count, processed_count: count, pending_count: count, skipped_count: count,
  cancelled_count: count, accepted_count: z.literal(0), uncertain_count: z.literal(0), attempt_count: z.literal(0),
  created_by: z.string().min(1), created_api_key_id: uuid.nullable(), created_at: instant,
  updated_at: instant, completed_at: instant.nullable(), authorization_issued: z.literal(false), dispatch_enabled: z.literal(false),
}).superRefine((row, ctx) => {
  if (row.processed_count !== row.pending_count + row.skipped_count + row.cancelled_count || row.processed_count > row.total_count)
    ctx.addIssue({ code: 'custom', message: 'Progress must equal committed recipient counts.', path: ['processed_count'] });
  if (row.status === 'completed' && row.processed_count !== row.total_count)
    ctx.addIssue({ code: 'custom', message: 'Completed ledgers require every captured member.', path: ['status'] });
});
export type SubmissionLedgerView = z.infer<typeof SubmissionLedgerView>;
export const StagedRecipientView = z.strictObject({
  id: uuid, ledger_id: uuid, configuration_id: uuid, delivery_id: uuid, contact_id: uuid,
  captured_locale: z.string().max(35).regex(/^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/),
  captured_reason: capturedReason, captured_consent_version: integer,
  logical_send_key: digest, submission_state: SubmissionState, outcome: z.literal('unknown'),
  authorization_issued: z.literal(false), created_at: instant, updated_at: instant,
}).superRefine((row, ctx) => {
  if ((row.submission_state === 'skipped') !== (row.captured_reason !== 'ELIGIBLE'))
    ctx.addIssue({ code: 'custom', message: 'Staging state must preserve the captured exclusion.', path: ['submission_state'] });
});
export type StagedRecipientView = z.infer<typeof StagedRecipientView>;
export const DeliveryHistoryView = z.strictObject({
  id: uuid, delivery_id: uuid, submission_state: SubmissionState, outcome: z.literal('unknown'),
  reason: z.enum(['ELIGIBLE', 'SUPPRESSED', 'CONTACT_DELETED', 'CONSENT_NOT_CONFIRMED', 'STAGING_CANCELLED']), recorded_at: instant,
});
export type DeliveryHistoryView = z.infer<typeof DeliveryHistoryView>;
// This redacted future contract conveys real stored attempts only. Current storage cannot admit attempts.
export const DeliveryAttemptView = z.strictObject({
  id: uuid, delivery_id: uuid, attempt_no: integer,
  submission_state: z.enum(['submitting', 'accepted', 'uncertain', 'failed_permanent']),
  request_started_at: instant, accepted_at: instant.nullable(),
  error_class: z.enum(['transport', 'provider_rejected', 'unknown']).nullable(),
}).superRefine((row, ctx) => {
  if ((row.submission_state === 'accepted') !== (row.accepted_at !== null))
    ctx.addIssue({ code: 'custom', message: 'Acceptance requires an actual acceptance timestamp.', path: ['accepted_at'] });
});
export type DeliveryAttemptView = z.infer<typeof DeliveryAttemptView>;
