import {z} from 'zod';
export const KLAVIYO_API_REVISION='2026-07-15' as const;
export const KLAVIYO_MAPPING_VERSION='klaviyo-html-1' as const;
export const KlaviyoReview=z.strictObject({
 destination:z.literal('klaviyo'),mapping_version:z.literal(KLAVIYO_MAPPING_VERSION),api_revision:z.literal(KLAVIYO_API_REVISION),revision_id:z.uuid(),source_artifact_hash:z.string().regex(/^[a-f0-9]{64}$/),destination_hash:z.string().regex(/^[a-f0-9]{64}$/),html_sha256:z.string().regex(/^[a-f0-9]{64}$/),text_sha256:z.string().regex(/^[a-f0-9]{64}$/),remote_export_enabled:z.literal(false),transformations:z.array(z.string()).max(10),
 blockers:z.tuple([z.literal('OAUTH_CONNECTION_UNAVAILABLE'),z.literal('ACCOUNT_ENTITLEMENT_UNVERIFIED'),z.literal('REAL_CLIENT_PREFLIGHT_UNAVAILABLE'),z.literal('DESTINATION_CONFORMANCE_UNVERIFIED'),z.literal('DURABLE_REMOTE_EXPORT_UNAVAILABLE')]),
});
export type KlaviyoReview=z.infer<typeof KlaviyoReview>;
