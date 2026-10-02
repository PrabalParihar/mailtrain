import{z}from'zod';
import { AudienceSnapshotPointerSchema } from './audience-snapshots';
export const RequestedCampaignTiming=z.object({
 local_time:z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/),
 time_zone:z.string().min(1).max(100).regex(/^[A-Za-z][A-Za-z0-9_+\-]*(?:\/[A-Za-z0-9_+\-]+)*$/),
 utc_offset:z.string().regex(/^[+-](?:0\d|1\d|2[0-3]):[0-5]\d$/),
}).strict();
export type RequestedCampaignTimingData=z.infer<typeof RequestedCampaignTiming>;
export type ResolvedCampaignTiming=RequestedCampaignTimingData&{utc:string};
export const ResolvedCampaignTimingSchema=RequestedCampaignTiming.extend({utc:z.iso.datetime()});
export const CampaignConfigurationSnapshot=z.object({id:z.uuid(),campaign_id:z.uuid(),revision_no:z.number().int().positive(),name:z.string(),revision_id:z.uuid(),artifact_hash:z.string().regex(/^[0-9a-f]{64}$/).nullable(),planned_timing:ResolvedCampaignTimingSchema.nullable(),audience_count:z.number().int().nonnegative(),eligible_count:z.number().int().nonnegative(),excluded_count:z.number().int().nonnegative(),audience_snapshot:AudienceSnapshotPointerSchema.nullable(),digest:z.string(),actor_id:z.string().nullable(),captured_at:z.iso.datetime(),origin:z.enum(['migration_current','runtime_change'])}).strict();
export type CampaignConfigurationSnapshotData=z.infer<typeof CampaignConfigurationSnapshot>;
export const CampaignConfigurationView=z.object({id:z.uuid(),name:z.string(),version:z.number().int().positive(),state:z.string(),revision_id:z.uuid(),intent:z.object({artifact_hash:z.string().regex(/^[0-9a-f]{64}$/).nullable(),planned_timing:ResolvedCampaignTimingSchema.nullable()}).strict(),audience_count:z.number().int().nonnegative(),eligible_count:z.number().int().nonnegative(),excluded_count:z.number().int().nonnegative(),audience_snapshot:AudienceSnapshotPointerSchema.nullable(),digest:z.string(),created_at:z.iso.datetime()}).strict();
export const CampaignConfigurationInput=z.object({expected_version:z.number().int().min(1).max(2147483646),name:z.string().trim().min(1).max(160),revision_id:z.string().uuid(),planned_timing:RequestedCampaignTiming.nullable(),audience_snapshot_id:z.string().uuid().optional()}).strict();
export type CampaignConfigurationData=z.infer<typeof CampaignConfigurationInput>;
export class CampaignTimingError extends Error{
 readonly code='INVALID_CAMPAIGN_TIMING';
 constructor(readonly field:keyof RequestedCampaignTimingData,message:string){super(message);}
}
// A planned minute is one explicit candidate, checked in the chosen zone.
// This does not authorize scheduling, infer an offset or normalize a date.
export function resolveCampaignTiming(provided:RequestedCampaignTimingData):ResolvedCampaignTiming{
 const input=RequestedCampaignTiming.parse(provided),local=new Date(input.local_time+':00.000Z');
 if(!Number.isFinite(local.getTime())||local.toISOString().slice(0,16)!==input.local_time)throw new CampaignTimingError('local_time','Use a real Gregorian date and time at minute precision.');
 let formatter:Intl.DateTimeFormat;
 try{formatter=new Intl.DateTimeFormat('en-CA',{timeZone:input.time_zone,calendar:'gregory',numberingSystem:'latn',hourCycle:'h23',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'});}catch{throw new CampaignTimingError('time_zone','Use a supported IANA time zone.');}
 const offset=(Number(input.utc_offset.slice(1,3))*60+Number(input.utc_offset.slice(4,6)))*(input.utc_offset[0]==='-'?-1:1),candidate=new Date(local.getTime()-offset*60000),parts=new Map(formatter.formatToParts(candidate).map(p=>[p.type,p.value]));
 const observed=String(parts.get('year')).padStart(4,'0')+'-'+parts.get('month')+'-'+parts.get('day')+'T'+parts.get('hour')+':'+parts.get('minute');
 if(observed!==input.local_time)throw new CampaignTimingError('utc_offset','This local minute does not have that offset in the selected time zone. Check daylight saving and choose the intended offset explicitly.');
 return{...input,utc:candidate.toISOString()};
}
// Disclosed deterministic JSON ordering; arrays keep their original order.
// Only JSON data from the strict command and stored campaign enters hashing.
export function campaignCanonicalJSON(value:unknown):string{
 const encoded=JSON.stringify(value,(_key,item)=>item&&typeof item==='object'&&!Array.isArray(item)?Object.fromEntries(Object.entries(item).sort(([a],[b])=>a<b?-1:a>b?1:0)):item);
 if(encoded===undefined)throw new TypeError('Campaign configuration must contain JSON data.');
 return encoded;
}
