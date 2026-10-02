import{z}from'zod';
export const CreationType=z.enum(['brand.extract','email.generate']);
const time=z.iso.datetime({offset:true});
export const CreationMetadata=z.object({policy_version:z.literal('creation-1'),phase:z.enum(['pending','leased','started','settled','unknown']),failure_attempts:z.number().int().min(0).max(3),attempt_limit:z.literal(3),deadline_at:time.nullable(),next_at:time,accounting:z.enum(['none','reserved','consumed','released','retained'])}).strict();
export const CreationAttempt=z.object({id:z.uuid(),operation_id:z.uuid(),lease_epoch:z.number().int().positive(),phase:z.enum(['claimed','started','settled','recovered']),outcome_code:z.string().max(80).nullable(),recorded_at:time}).strict();
export const CreationSummary=z.object({id:z.uuid(),type:CreationType,state:z.enum(['queued','running','succeeded','failed','cancelled','cancel_requested']),created_at:time,started_at:time.nullable(),completed_at:time.nullable(),error:z.object({code:z.string(),message:z.string(),accounting:z.string().optional()}).nullable(),creation:CreationMetadata.nullable()}).strict();
export type CreationSummaryData=z.infer<typeof CreationSummary>;
