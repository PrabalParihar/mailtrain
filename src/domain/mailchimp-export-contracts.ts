import {z} from 'zod';

export const MAILCHIMP_MAPPING_VERSION='mailchimp-classic-html-1' as const;
export const MAILCHIMP_API_REVISION='3.0.91' as const;
export const MailchimpReview=z.strictObject({
 destination:z.literal('mailchimp'),mapping_version:z.literal(MAILCHIMP_MAPPING_VERSION),api_revision:z.literal(MAILCHIMP_API_REVISION),revision_id:z.uuid(),source_artifact_hash:z.string().regex(/^[a-f0-9]{64}$/),destination_hash:z.string().regex(/^[a-f0-9]{64}$/),html_sha256:z.string().regex(/^[a-f0-9]{64}$/),text_sha256:z.string().regex(/^[a-f0-9]{64}$/),remote_export_enabled:z.literal(false),transformations:z.array(z.string()).max(10),
 blockers:z.tuple([z.literal('OAUTH_CONNECTION_UNAVAILABLE'),z.literal('STANDARD_OR_HIGHER_UNVERIFIED'),z.literal('REAL_CLIENT_PREFLIGHT_UNAVAILABLE'),z.literal('DESTINATION_CONFORMANCE_UNVERIFIED'),z.literal('DURABLE_REMOTE_EXPORT_UNAVAILABLE'),z.literal('TEMPLATE_HTML_READBACK_UNAVAILABLE'),z.literal('MANAGEMENT_LINK_UNVERIFIED')]),
});
export type MailchimpReview=z.infer<typeof MailchimpReview>;
