import { z } from 'zod';
import type { AudienceSnapshotMember } from './audience-snapshots';

export const RECIPIENT_ASSESSMENT_RULE_VERSION = 'recipient-assessment-1' as const;
export const RECIPIENT_ASSESSMENT_GLOBAL_BLOCKERS = [
  'CAMPAIGN_APPROVAL_UNAVAILABLE',
  'PROVIDER_SENDER_UNAVAILABLE',
  'REAL_CLIENT_PREFLIGHT_UNAVAILABLE',
  'SEND_BUDGET_UNAVAILABLE',
  'LOCALE_POLICY_UNAVAILABLE',
] as const;

const integer = z.number().int().min(1).max(2147483647);
const count = z.number().int().min(0).max(10000);
const digest = z.string().regex(/^[0-9a-f]{64}$/);
const capturedReason = z.enum(['ELIGIBLE', 'SUPPRESSED', 'CONTACT_DELETED', 'CONSENT_NOT_CONFIRMED']);
const exclusionReasons = [
  'CONTACT_MISSING', 'CONTACT_DELETED', 'CAPTURED_EXCLUDED', 'SUPPRESSED',
  'CONSENT_NOT_CONFIRMED', 'TOPIC_NOT_SELECTED', 'TOPIC_NOT_CONFIRMED', 'FREQUENCY_LIMIT',
] as const;
const exclusionReason = z.enum(exclusionReasons);
const observationReason = z.enum(['CHECKS_CLEAR', ...exclusionReasons]);

export const RecipientAssessmentInput = z.strictObject({
  expected_version: z.number().int().min(1).max(2147483646),
  expected_digest: digest,
  topic_id: z.uuid().nullable(),
});
export type RecipientAssessmentInput = z.infer<typeof RecipientAssessmentInput>;

export const RecipientAssessmentView = z.strictObject({
  id: z.uuid(),
  campaign_id: z.uuid(),
  configuration_id: z.uuid(),
  configuration_version: integer,
  configuration_digest: digest,
  revision_id: z.uuid(),
  snapshot_id: z.uuid(),
  topic_id: z.uuid().nullable(),
  status: z.enum(['queued', 'running', 'completed', 'cancelled', 'failed']),
  total_count: count,
  processed_count: count,
  checks_clear_count: count,
  excluded_count: count,
  created_at: z.iso.datetime(),
  updated_at: z.iso.datetime(),
  completed_at: z.iso.datetime().nullable(),
  rule_version: z.literal(RECIPIENT_ASSESSMENT_RULE_VERSION),
  authorization_issued: z.literal(false),
  global_blockers: z.tuple([
    z.literal(RECIPIENT_ASSESSMENT_GLOBAL_BLOCKERS[0]),
    z.literal(RECIPIENT_ASSESSMENT_GLOBAL_BLOCKERS[1]),
    z.literal(RECIPIENT_ASSESSMENT_GLOBAL_BLOCKERS[2]),
    z.literal(RECIPIENT_ASSESSMENT_GLOBAL_BLOCKERS[3]),
    z.literal(RECIPIENT_ASSESSMENT_GLOBAL_BLOCKERS[4]),
  ]),
  created_by: z.string(),
  created_api_key_id: z.uuid().nullable(),
}).superRefine((assessment, ctx) => {
  if (assessment.processed_count !== assessment.checks_clear_count + assessment.excluded_count ||
      assessment.processed_count > assessment.total_count) {
    ctx.addIssue({ code: 'custom', message: 'Assessment progress must agree with its captured member counts.', path: ['processed_count'] });
  }
  if (assessment.status === 'completed' && assessment.processed_count !== assessment.total_count) {
    ctx.addIssue({ code: 'custom', message: 'Completed assessments must have observed every captured member.', path: ['status'] });
  }
});
export type RecipientAssessmentView = z.infer<typeof RecipientAssessmentView>;

export const RecipientObservationView = z.strictObject({
  id: z.uuid(),
  assessment_id: z.uuid(),
  contact_id: z.uuid(),
  captured_reason: capturedReason,
  captured_locale: z.string(),
  current_locale: z.string().nullable(),
  consent_version: integer.nullable(),
  preference_version: integer.nullable(),
  current_reason: observationReason,
  reasons: z.array(exclusionReason).max(exclusionReasons.length),
  observed_at: z.iso.datetime(),
  rule_version: z.literal(RECIPIENT_ASSESSMENT_RULE_VERSION),
  authorization_issued: z.literal(false),
}).superRefine((observation, ctx) => {
  const primary = observation.reasons[0] ?? 'CHECKS_CLEAR';
  if (observation.current_reason !== primary || new Set(observation.reasons).size !== observation.reasons.length) {
    ctx.addIssue({ code: 'custom', message: 'Observation reasons must be unique and agree with the primary check result.', path: ['reasons'] });
  }
});
export type RecipientObservationView = z.infer<typeof RecipientObservationView>;
export type RecipientObservationFacts = Omit<RecipientObservationView,
  'id' | 'assessment_id' | 'observed_at' | 'rule_version' | 'authorization_issued'>;
export type RecipientObservationCurrent = {
  deleted: boolean;
  suppressed: boolean;
  subscription: string;
  preferred_locale: string;
  consent_version: number;
  preference_version: number;
  topic_confirmed: boolean;
  frequency_limited: boolean;
};

/** Captured membership and current checks are evidence; this issues no send authority. */
export function evaluateRecipientObservation(
  member: AudienceSnapshotMember,
  current: RecipientObservationCurrent | null,
  topicSelected: boolean,
): RecipientObservationFacts {
  const reasons: RecipientObservationFacts['reasons'] = [];
  if (current === null) reasons.push('CONTACT_MISSING');
  else if (current.deleted) reasons.push('CONTACT_DELETED');
  if (!member.eligible) reasons.push('CAPTURED_EXCLUDED');
  if (current?.suppressed) reasons.push('SUPPRESSED');
  if (current !== null && current.subscription !== 'subscribed') reasons.push('CONSENT_NOT_CONFIRMED');
  if (!topicSelected) reasons.push('TOPIC_NOT_SELECTED');
  else if (current !== null && !current.topic_confirmed) reasons.push('TOPIC_NOT_CONFIRMED');
  if (current?.frequency_limited) reasons.push('FREQUENCY_LIMIT');
  return {
    contact_id: member.id,
    captured_reason: member.reason,
    captured_locale: member.locale,
    current_locale: current?.preferred_locale ?? null,
    consent_version: current?.consent_version ?? null,
    preference_version: current?.preference_version ?? null,
    current_reason: reasons[0] ?? 'CHECKS_CLEAR',
    reasons,
  };
}
