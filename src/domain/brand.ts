import { z } from 'zod';
export const BrandSchema = z
  .object({
    name: z.string().min(1).max(100),
    website: z.string().max(2048),
    description: z.string().max(3000),
    voice: z.string().max(1000),
    accent: z.string().regex(/^#[\da-f]{6}$/i),
    background: z.string().regex(/^#[\da-f]{6}$/i),
    font_stack: z.enum(['Arial, sans-serif', 'Georgia, serif', 'Verdana, sans-serif']),
    address: z.string().max(1000),
    forbidden_phrases: z.array(z.string().max(200)).max(50),
    approved_claims: z.array(z.string().max(1000)).max(50),
    provenance: z
      .array(
        z.object({
          source: z.string().max(2048),
          captured_at: z.string().max(50),
          status: z.enum(['suggested', 'confirmed', 'edited']),
        }),
      )
      .max(50),
  })
  .strict();
export type Brand = z.infer<typeof BrandSchema>;
