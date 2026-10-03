import {z} from 'zod';

export const IntegrationProvider=z.enum(['klaviyo','mailchimp','hubspot','brevo','omnisend']);
const uuid=z.preprocess(value=>typeof value==='string'?value.toLowerCase():value,z.uuid());
const version=z.number().int().positive().max(2147483647);
// PostgreSQL character_length counts Unicode scalar values, not UTF-16 units.
const identityText=(max:number)=>z.string().refine(value=>value.trim().length>0&&[...value].length<=max&&!/\p{Cc}|[\ud800-\udfff]/u.test(value));
const mode=z.enum(['oauth','api_key']);
export const IntegrationRegistration=z.object({
 id:uuid,provider:IntegrationProvider,external_account_id:identityText(255),
 auth_mode:mode,region:identityText(48),credential_reference:uuid,
}).strict();
export const IntegrationRotation=z.object({expected_record_version:version,credential_reference:uuid}).strict();

// Keep the source timestamp (including offsets and microseconds) in public metadata.
const timestampPattern=/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(?:\.(\d{1,6}))?(Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/;
const timestamp=z.iso.datetime({offset:true}).refine(value=>timestampPattern.test(value));
function epochMicroseconds(value:string){
 const parts=timestampPattern.exec(value)!;
 return BigInt(Date.parse(parts[1]+parts[3]))*1000n+BigInt((parts[2]??'').padEnd(6,'0'));
}
const blockers=[
 z.literal('CONNECTION_AUTH_MODE_UNAPPROVED'),z.literal('ACCOUNT_ENTITLEMENT_UNVERIFIED'),
 z.literal('REAL_CLIENT_PREFLIGHT_UNAVAILABLE'),z.literal('DESTINATION_CONFORMANCE_UNVERIFIED'),
 z.literal('DURABLE_REMOTE_EXPORT_UNAVAILABLE'),z.literal('MANAGEMENT_LINK_UNVERIFIED'),
] as const;
const metadata={id:uuid,provider:IntegrationProvider,auth_mode:mode,region:identityText(48),
 record_version:version,credential_version:version,created_at:timestamp,updated_at:timestamp,can_export:z.literal(false)};
export const IntegrationConnection=z.discriminatedUnion('state',[
 z.object({...metadata,state:z.literal('unverified'),revoked_at:z.null(),blockers:z.tuple(blockers)}).strict(),
 z.object({...metadata,state:z.literal('revoked'),revoked_at:timestamp,blockers:z.tuple([z.literal('CONNECTION_REVOKED'),...blockers])}).strict(),
]).superRefine((value,ctx)=>{
 if(value.record_version!==value.credential_version+(value.state==='revoked'?1:0))ctx.addIssue({code:'custom',message:'Invalid connection versions.'});
 // Refinements also run for dirty strings: only compare validated timestamps.
 if(!timestamp.safeParse(value.created_at).success||!timestamp.safeParse(value.updated_at).success)return;
 if(epochMicroseconds(value.created_at)>epochMicroseconds(value.updated_at))ctx.addIssue({code:'custom',message:'Invalid connection chronology.'});
 if(value.state==='revoked'&&timestamp.safeParse(value.revoked_at).success&&epochMicroseconds(value.revoked_at)!==epochMicroseconds(value.updated_at))ctx.addIssue({code:'custom',message:'Invalid revocation instant.'});
});
export type IntegrationConnectionData=z.infer<typeof IntegrationConnection>;
