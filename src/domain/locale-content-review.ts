import {z} from 'zod';
const uuid=z.uuid().transform(value=>value.toLowerCase());
const version=z.number().int().min(1).max(2147483647);
const note=z.string().trim().min(1).max(4000).refine(value=>
  !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/.test(value),
  'Use valid text without control characters.');
export const LocaleReviewOutcome=z.enum(['content_reviewed','changes_requested']);
export const LocaleReviewInput=z.object({
  revision_id:uuid,source_revision_id:uuid,expected_source_doc_version:version,
  outcome:LocaleReviewOutcome,note,
}).strict();
export type LocaleReviewInputValue=z.infer<typeof LocaleReviewInput>;
export const LocaleReviewCommand=z.object({workspace_id:uuid,actor_id:z.string().min(1),email_id:uuid,version,key:uuid,input:LocaleReviewInput}).strict();
export type LocaleReviewCommandValue=z.infer<typeof LocaleReviewCommand>;
export const LocaleReviewRecord=z.object({
  id:uuid,email_id:uuid,revision_id:uuid,revision_no:version,target_doc_version:version,
  source_revision_id:uuid,source_revision_no:version,observed_source_doc_version:version,
  outcome:LocaleReviewOutcome,note,created_by:z.string().min(1),created_at:z.iso.datetime({offset:true}),
}).strict();
export const LocaleReviewContext=z.object({
  workspace_id:uuid,actor_id:z.string().min(1),email_id:uuid,doc_version:version,
  source_email_id:uuid,source_revision_id:uuid,source_revision_no:version,
  source_doc_version:version.nullable(),current_source_doc_version:version,
  target_revision:z.object({id:uuid,revision_no:version,source_doc_version:version}).strict().nullable(),
}).strict();
export const LocaleReviewApplicability=z.enum(['current','target_changed','source_changed','both_changed']);
export const LocaleReviewHistoryItem=LocaleReviewRecord.extend({applicability:LocaleReviewApplicability});
export const LocaleReviewPage=z.object({context:LocaleReviewContext,data:z.array(LocaleReviewHistoryItem).max(100),total_count:z.number().int().nonnegative(),has_more:z.boolean(),next_cursor:z.string().nullable()}).strict();
export type LocaleReviewPageValue=z.infer<typeof LocaleReviewPage>;
export function reviewApplicability(target:number,source:number,currentTarget:number,currentSource:number):z.infer<typeof LocaleReviewApplicability>{
  return target===currentTarget?(source===currentSource?'current':'source_changed'):(source===currentSource?'target_changed':'both_changed');
}
