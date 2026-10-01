import { z } from 'zod';
const uuid=z.string().uuid(), count=z.number().int().min(0).max(10000);
export const EVENT_TYPES=['contact.unsubscribed','contact.topic_unsubscribed','contacts.imported'] as const;
export const EventType=z.enum(EVENT_TYPES);
const common={id:uuid,schema_version:z.literal(1),workspace_id:uuid,occurred_at:z.iso.datetime({offset:true}),recorded_at:z.iso.datetime({offset:true}),trace_id:uuid};
const contactAggregate=z.object({type:z.literal('contact'),id:uuid,version:z.number().int().positive()}).strict();
const operationAggregate=z.object({type:z.literal('operation'),id:uuid,version:z.number().int().positive()}).strict();
export const EventEnvelopeShape=z.discriminatedUnion('type',[
  z.object({...common,type:z.literal('contact.unsubscribed'),aggregate:contactAggregate,data:z.object({contact_id:uuid,scope:z.literal('marketing'),reason:z.literal('recipient_opt_out')}).strict()}).strict(),
  z.object({...common,type:z.literal('contact.topic_unsubscribed'),aggregate:contactAggregate,data:z.object({contact_id:uuid,topic_id:uuid,scope:z.literal('topic'),reason:z.literal('recipient_opt_out')}).strict()}).strict(),
  z.object({...common,type:z.literal('contacts.imported'),aggregate:operationAggregate,data:z.object({operation_id:uuid,processed:count,created:count,existing:count,opt_in_granted:z.literal(0)}).strict()}).strict(),
]);
export const EventEnvelope=EventEnvelopeShape.refine((event)=>event.aggregate.id===('contact_id'in event.data?event.data.contact_id:event.data.operation_id),{message:'Event aggregate must match its typed resource.'}).refine((event)=>event.type!=='contacts.imported'||event.data.processed===event.data.created+event.data.existing,{message:'Import counts must reconcile.'});
export type DomainEvent=z.infer<typeof EventEnvelope>;
export const EVENT_SEMANTICS={
  'contact.unsubscribed':'Global marketing opt-out/safety proof invalidation committed. Repeated unchanged opt-out emits no transition.',
  'contact.topic_unsubscribed':'A topic opt-out committed; global subscription is not implied.',
  'contacts.imported':'Explicit import confirmation committed; this never grants opt-in.',
  'email.generated':'Reserved: a generation workflow must persist an authoritative generated email/revision before emitting. A proposal alone does not qualify.',
  'campaign.sent':'Reserved compatibility alias: documented dispatch submission completion/totals, never inbox delivery proof.',
  'domain.verified':'Reserved: provider/account/region-bound verified identity evidence, never a generic DNS or self-reported green state.',
} as const;
