import {z} from 'zod';
import {CreationType} from './creation-history';
import {validateDisplayTimeZone} from './workspace-calendar';

export const CreationReportWindow=z.strictObject({
  type:CreationType,
  created_after:z.iso.datetime(),
  created_before:z.iso.datetime(),
  time_zone:z.string().min(1).max(100),
});
export type ReportWindow=z.infer<typeof CreationReportWindow>;
export function parseCreationReportWindow(value:unknown):ReportWindow {
  const window=CreationReportWindow.parse(value);
  validateDisplayTimeZone(window.time_zone);
  const start=Date.parse(window.created_after),end=Date.parse(window.created_before);
  if(!Number.isFinite(start)||!Number.isFinite(end)||start<Date.UTC(2000,0,1)||end>Date.UTC(2101,0,1)||end<=start||end-start>31*86400000)
    throw new Error('Choose a UTC window of more than zero and at most 31 days, within years 2000–2100.');
  return {...window,created_after:new Date(start).toISOString(),created_before:new Date(end).toISOString()};
}
const count=z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
export const CreationReportCounts=z.strictObject({total:count,queued:count,running:count,succeeded:count,failed:count,cancelled:count,cancel_requested:count,other:count});
export const CreationActivityReport=z.strictObject({
  schema_version:z.literal('creation-activity-v1'),
  ...CreationReportWindow.shape,
  generated_at:z.iso.datetime(),
  counts:CreationReportCounts,
  daily:z.array(z.strictObject({date:z.iso.date(),counts:CreationReportCounts})).max(33),
  completion_time:z.strictObject({sample_count:count,missing_count:count,median_ms:z.number().nonnegative().nullable(),p90_ms:z.number().nonnegative().nullable()}),
}).superRefine((report,ctx)=>{
  const keys=['queued','running','succeeded','failed','cancelled','cancel_requested','other'] as const;
  for(const counts of [report.counts,...report.daily.map(day=>day.counts)])
    if(keys.reduce((sum,key)=>sum+counts[key],0)!==counts.total)ctx.addIssue({code:'custom',message:'Counts do not reconcile.'});
  if(report.daily.reduce((sum,day)=>sum+day.counts.total,0)!==report.counts.total||keys.some(key=>report.daily.reduce((sum,day)=>sum+day.counts[key],0)!==report.counts[key]))ctx.addIssue({code:'custom',message:'Daily counts do not reconcile.'});
  const timing=report.completion_time;
  if(timing.sample_count+timing.missing_count!==report.counts.succeeded||(timing.sample_count===0)!==(timing.median_ms===null)||(timing.sample_count===0)!==(timing.p90_ms===null)||(timing.median_ms!==null&&timing.p90_ms!==null&&timing.p90_ms<timing.median_ms))ctx.addIssue({code:'custom',message:'Completion measurements do not reconcile.'});
});
export type CreationActivityReportData=z.infer<typeof CreationActivityReport>;

export function reportCSVCell(value:string|number|null):string {
  if(value===null)return '';
  let text=String(value);
  if(/^[\s\u0000-\u001f]*[=+@-]/u.test(text))text="'"+text;
  return /[",\r\n\t]/.test(text)||text.startsWith("'")?'"'+text.replaceAll('"','""')+'"':text;
}
export function creationReportCSV(value:unknown):string {
  const report=CreationActivityReport.parse(value);
  const header=['schema_version','generated_at','operation_type','created_after_utc','created_before_utc','display_time_zone','row_kind','local_date','total','queued','running','succeeded','failed','cancelled','cancel_requested','other','completion_sample_count','completion_missing_count','median_completion_ms','p90_completion_ms'];
  const keys=['total','queued','running','succeeded','failed','cancelled','cancel_requested','other'] as const;
  const prefix=[report.schema_version,report.generated_at,report.type,report.created_after,report.created_before,report.time_zone];
  const timing=report.completion_time;
  const rows:(string|number|null)[][]=[header,[...prefix,'summary','',...keys.map(key=>report.counts[key]),timing.sample_count,timing.missing_count,timing.median_ms,timing.p90_ms],...report.daily.map(day=>[...prefix,'day',day.date,...keys.map(key=>day.counts[key]),null,null,null,null])];
  return rows.map(row=>row.map(reportCSVCell).join(',')).join('\r\n')+'\r\n';
}
