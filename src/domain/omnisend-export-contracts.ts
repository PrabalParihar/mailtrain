import {z} from 'zod';

export const OMNISEND_MAPPING_VERSION='omnisend-html-import-1' as const;
export const OMNISEND_API_REVISION='2026-03-15' as const;
export const OMNISEND_IMPORT_BODY_LIMIT=1000000;
export const OmnisendReview=z.strictObject({
 destination:z.literal('omnisend'),mapping_version:z.literal(OMNISEND_MAPPING_VERSION),api_revision:z.literal(OMNISEND_API_REVISION),revision_id:z.uuid(),source_artifact_hash:z.string().regex(/^[a-f0-9]{64}$/),destination_hash:z.string().regex(/^[a-f0-9]{64}$/),html_sha256:z.string().regex(/^[a-f0-9]{64}$/),text_sha256:z.string().regex(/^[a-f0-9]{64}$/),remote_export_enabled:z.literal(false),transformations:z.array(z.string()).max(10),
 blockers:z.tuple([z.literal('OAUTH_CONNECTION_UNAVAILABLE'),z.literal('ACCOUNT_ENTITLEMENT_UNVERIFIED'),z.literal('REAL_CLIENT_PREFLIGHT_UNAVAILABLE'),z.literal('DESTINATION_CONFORMANCE_UNVERIFIED'),z.literal('DURABLE_REMOTE_EXPORT_UNAVAILABLE'),z.literal('IMPORT_FIDELITY_UNVERIFIED'),z.literal('MANAGEMENT_LINK_UNVERIFIED')]),
});
export type OmnisendReview=z.infer<typeof OmnisendReview>;
