import { z } from 'zod';
export const DispatchProvider = z.enum(['ses', 'resend', 'sendgrid', 'mailgun']);
export type DispatchProviderId = z.infer<typeof DispatchProvider>;
export const DispatchPolicyInput = z.object({
  expected_version: z.number().int().min(0).max(2147483646),
  paused: z.boolean(),
  reason: z.enum(['incident', 'abuse_review', 'maintenance', 'verified_recovery']),
}).strict().refine((input) => input.paused || input.reason === 'verified_recovery', { message: 'Releasing a stop requires verified recovery.' });
export type PolicyInput = z.infer<typeof DispatchPolicyInput>;
export type PolicyStamp = { paused: boolean; version: number };
export function policyDecision(policies: { global: PolicyStamp|null; provider: PolicyStamp|null; workspace: PolicyStamp|null }) {
  const values = [policies.global, policies.provider, policies.workspace];
  if (values.some((value) => !value || typeof value.paused !== 'boolean' || !Number.isSafeInteger(value.version) || value.version < 1)) return { allowed: false, reason: 'POLICY_UNAVAILABLE' };
  if (policies.global!.paused) return { allowed: false, reason: 'GLOBAL_PAUSED' };
  if (policies.provider!.paused) return { allowed: false, reason: 'PROVIDER_PAUSED' };
  if (policies.workspace!.paused) return { allowed: false, reason: 'WORKSPACE_PAUSED' };
  return { allowed: true, reason: 'POLICY_CLEAR' };
}
