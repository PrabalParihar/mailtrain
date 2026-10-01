import { z } from 'zod';
import { EventType } from './events';
export const WebhookEndpointInput=z.object({name:z.string().trim().min(1).max(100),url:z.string().min(1).max(2048),subscriptions:z.array(EventType).min(1).max(3).refine((values)=>new Set(values).size===values.length)}).strict();
const expected_version=z.number().int().min(1).max(2147483646);
export const WebhookVersionInput=z.object({expected_version}).strict();
export const WebhookRotateInput=z.object({expected_version,retire_previous:z.boolean().default(false),acknowledge_key_cutover:z.boolean().default(false)}).strict().refine((input)=>!input.retire_previous||input.acknowledge_key_cutover,{message:'Explicitly acknowledge retiring the earlier overlap key.'});
export const WebhookEndpoint=z.object({id:z.uuid(),name:z.string(),target_origin:z.string().url(),subscriptions:z.array(EventType),status:z.enum(['paused','enabled','disabled']),version:z.number().int().positive(),secret_version:z.number().int().positive(),created_at:z.iso.datetime({offset:true}),updated_at:z.iso.datetime({offset:true}),dns_checked_at:z.iso.datetime({offset:true}),created_by:z.string()}).strict();
export type WebhookEndpointRecord=z.infer<typeof WebhookEndpoint>;
