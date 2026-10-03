import {z} from 'zod';

export const BREVO_MAPPING_VERSION='brevo-campaign-html-1' as const;
export const BREVO_API_REVISION='v3' as const;
export const BREVO_HTML_LIMIT=1000000;

// Browser-safe metadata only: subject and companion bytes stay server-side.
export const BrevoReview=z.strictObject({
 destination:z.literal('brevo'),
 mapping_version:z.literal(BREVO_MAPPING_VERSION),
 api_revision:z.literal(BREVO_API_REVISION),
 revision_id:z.uuid(),
 source_artifact_hash:z.string().regex(/^[a-f0-9]{64}$/),
 destination_hash:z.string().regex(/^[a-f0-9]{64}$/),
 html_sha256:z.string().regex(/^[a-f0-9]{64}$/),
 text_sha256:z.string().regex(/^[a-f0-9]{64}$/),
 remote_export_enabled:z.literal(false),
 transformations:z.array(z.string()).max(10),
 blockers:z.tuple([
  z.literal('CONNECTION_AUTH_MODE_UNAPPROVED'),
  z.literal('ACCOUNT_ENTITLEMENT_UNVERIFIED'),
  z.literal('SENDER_UNVERIFIED'),
  z.literal('REAL_CLIENT_PREFLIGHT_UNAVAILABLE'),
  z.literal('DESTINATION_CONFORMANCE_UNVERIFIED'),
  z.literal('DURABLE_REMOTE_EXPORT_UNAVAILABLE'),
  z.literal('MANAGEMENT_LINK_UNVERIFIED'),
 ]),
});
export type BrevoReview=z.infer<typeof BrevoReview>;
