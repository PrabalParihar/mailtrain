import { z } from 'zod';
export const MEDIA_LIMITS = Object.freeze({
  upload: 20 * 1024 * 1024,
  derivatives: 40 * 1024 * 1024,
  quota: 256 * 1024 * 1024,
  entries: 200,
  profile: 'local-private-v1',
  rights: 'local-upload-attestation-v1',
});
export type AssetState =
  'quarantined' | 'processing' | 'ready_private' | 'published' | 'deleting' | 'deleted';
export type AssetVariantRef = { asset_id: string; variant_id: string };
export type AssetManifestEntry = AssetVariantRef & {
  source_sha256: string;
  sha256: string;
  mime: 'image/png' | 'image/jpeg' | 'image/gif';
  bytes: number;
  width: number;
  height: number;
  role: 'static' | 'animation' | 'fallback';
  frames: number;
  fallback?: AssetVariantRef;
  selected_frame?: number;
  processing_profile: string;
  storage_profile: string;
  visibility: 'private' | 'public';
  public_url?: string;
  rights_evidence_id: string;
  scan_evidence_ids: string[];
};
export type AssetManifest = { version: 'asset-manifest-1'; entries: AssetManifestEntry[] };
export const UploadIntentInput = z
  .object({
    filename: z
      .string()
      .min(1)
      .max(200)
      .refine((s) => !/[\x00-\x1f]/.test(s)),
    declared_mime: z.enum(['image/png', 'image/jpeg', 'image/gif']),
    byte_size: z.number().int().min(1).max(MEDIA_LIMITS.upload),
    sha256: z.string().regex(/^[a-f0-9]{64}$/),
    rights: z
      .object({ attested: z.literal(true), terms_version: z.literal(MEDIA_LIMITS.rights) })
      .strict(),
    alt: z.string().max(1000).default(''),
    decorative: z.boolean().default(false),
  })
  .strict();
export type UploadIntent = z.infer<typeof UploadIntentInput>;
export type AssetMetadata = {
  id: string;
  state: AssetState;
  version: number;
  mime: string | null;
  bytes: number | null;
  source_sha256: string | null;
  alt: string;
  decorative: boolean;
  failure_code: string | null;
  variants: AssetManifestEntry[];
};
export function privateAssetBinding(
  entry: Pick<AssetManifestEntry, 'asset_id' | 'variant_id' | 'sha256'>,
) {
  if (
    !/^[a-f0-9]{64}$/.test(entry.sha256) ||
    !z.uuid().safeParse(entry.asset_id).success ||
    !z.uuid().safeParse(entry.variant_id).success
  )
    throw new Error('ASSET_BINDING_INVALID');
  return `https://mailcraft-assets.invalid/${entry.asset_id}/${entry.variant_id}/${entry.sha256}`;
}
export const AssetVariantRefSchema = z
  .object({ asset_id: z.uuid(), variant_id: z.uuid() })
  .strict();
export const AssetManifestEntrySchema = AssetVariantRefSchema.extend({
  source_sha256: z.string().regex(/^[a-f0-9]{64}$/),
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
  mime: z.enum(['image/png', 'image/jpeg', 'image/gif']),
  bytes: z.number().int().min(1).max(MEDIA_LIMITS.upload),
  width: z.number().int().min(1).max(8192),
  height: z.number().int().min(1).max(8192),
  role: z.enum(['static', 'animation', 'fallback']),
  frames: z.number().int().min(1).max(200),
  fallback: AssetVariantRefSchema.optional(),
  selected_frame: z.number().int().min(0).max(199).optional(),
  processing_profile: z.string().max(200),
  storage_profile: z.string().max(200),
  visibility: z.enum(['private', 'public']),
  public_url: z.url().optional(),
  rights_evidence_id: z.uuid(),
  scan_evidence_ids: z.array(z.uuid()).min(2).max(3),
}).strict();
export const AssetManifestSchema = z
  .object({
    version: z.literal('asset-manifest-1'),
    entries: z.array(AssetManifestEntrySchema).max(MEDIA_LIMITS.entries),
  })
  .strict();
export const AssetMetadataSchema = z
  .object({
    id: z.uuid(),
    state: z.enum([
      'quarantined',
      'processing',
      'ready_private',
      'published',
      'deleting',
      'deleted',
    ]),
    version: z.number().int().positive(),
    mime: z.string().nullable(),
    bytes: z.number().int().positive().nullable(),
    source_sha256: z.string().nullable(),
    alt: z.string().max(1000),
    decorative: z.boolean(),
    failure_code: z.string().nullable(),
    variants: z.array(AssetManifestEntrySchema),
  })
  .strict();
export const UploadIntentResponseSchema = z
  .object({
    upload: z
      .object({
        id: z.uuid(),
        token: z.string().regex(/^[a-f0-9]{64}$/),
        expires_at: z.iso.datetime({ offset: true }),
      })
      .strict(),
    operation: z.object({ id: z.uuid(), state: z.string() }).strict(),
  })
  .strict();
export const FallbackInput = z
  .object({ selected_frame: z.number().int().min(0).max(199) })
  .strict();
export const UploadContentResponseSchema = z
  .object({
    upload: z.object({ id: z.uuid(), status: z.literal('finalized') }).strict(),
    operation: z.object({ id: z.uuid(), state: z.string() }).strict(),
    asset_id: z.uuid(),
  })
  .strict();
export const FallbackResponseSchema = z
  .object({
    operation: z.object({ id: z.uuid(), state: z.literal('queued') }).strict(),
    asset: AssetMetadataSchema,
  })
  .strict();
