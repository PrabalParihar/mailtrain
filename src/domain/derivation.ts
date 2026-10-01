import { z } from 'zod';
import { EmailSpecSchema, type EmailSpec } from './email';
const title = z.string().trim().min(1).max(160);
export const RemixInput = z.object({ title }).strict();
export const LocaleDraftInput = z.object({ title, locale: EmailSpecSchema.shape.locale }).strict();
export const DerivationInput = z.discriminatedUnion('kind', [
  RemixInput.extend({ kind: z.literal('remix') }).strict(),
  LocaleDraftInput.extend({ kind: z.literal('locale') }).strict(),
]);
export type Derivation = z.infer<typeof DerivationInput>;
export function derivativeSpec(source: EmailSpec, input: Derivation): EmailSpec {
  const value = DerivationInput.parse(input), spec = structuredClone(EmailSpecSchema.parse(source));
  if (value.kind === 'locale') {
    if (value.locale === spec.locale) throw new Error('Choose a locale different from the source.');
    spec.locale = value.locale;
    spec.direction = ['ar-SA', 'he-IL'].includes(value.locale) ? 'rtl' : 'ltr';
  }
  return spec;
}
export function sourceStatus(sourceVersion: number | null, currentVersion: number): 'current' | 'outdated' | 'unknown' {
  return sourceVersion === null ? 'unknown' : sourceVersion === currentVersion ? 'current' : 'outdated';
}
