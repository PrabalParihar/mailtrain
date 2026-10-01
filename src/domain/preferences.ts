import { z } from 'zod';
export const Frequency = z.enum(['daily', 'weekly', 'monthly']);
export type Frequency = z.infer<typeof Frequency>;
export const PreferenceInput = z
  .object({
    expected_version: z.number().int().positive(),
    frequency: Frequency,
    topics: z
      .array(z.string().uuid())
      .max(100)
      .refine((ids) => new Set(ids).size === ids.length),
    reactivate_global: z.boolean().default(false),
  })
  .strict();
export function frequencyWindowMs(value: Frequency) {
  return { daily: 1, weekly: 7, monthly: 30 }[value] * 24 * 60 * 60 * 1000;
}
