import{z}from'zod';
export const WebhookDeliveryState=z.enum(['pending','leased','acknowledged','blocked','terminal','dead_letter','disabled']);
export const WebhookDeliveryError=z.enum(['authority_revoked','event_integrity','unsafe_target','capacity','aborted','transient','rate_deferred','retry_budget_exhausted','http_terminal','key_unavailable']);
export const WebhookDelivery=z.object({id:z.uuid(),workspace_id:z.uuid(),endpoint_id:z.uuid(),event_id:z.uuid(),state:WebhookDeliveryState,failure_attempts:z.number().int().min(0).max(10),attempt_number:z.number().int().min(0),created_at:z.iso.datetime({offset:true}),deadline:z.iso.datetime({offset:true}),next_at:z.iso.datetime({offset:true}),error_class:WebhookDeliveryError.nullable(),policy_version:z.literal(1)}).strict();
export const WebhookAttempt=z.object({id:z.uuid(),workspace_id:z.uuid(),delivery_id:z.uuid(),attempt_number:z.number().int().positive(),phase:z.enum(['started','authorized','settled','recovered']),recorded_at:z.iso.datetime({offset:true}),status_code:z.number().int().min(100).max(599).nullable(),secret_version:z.number().int().positive().nullable(),error_class:WebhookDeliveryError.nullable()}).strict();
export const WebhookReplayInput=z.object({expected_attempt:z.number().int().min(1).max(2147483647),acknowledge_duplicate_effect:z.literal(true)}).strict();
export type WebhookDeliveryRecord=z.infer<typeof WebhookDelivery>;
export type WebhookAttemptRecord=z.infer<typeof WebhookAttempt>;
