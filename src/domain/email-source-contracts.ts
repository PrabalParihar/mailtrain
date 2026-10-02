import {z} from 'zod';
import {MAX_RAW_DIAGNOSTICS,MAX_RAW_PROJECTION_BYTES,MAX_RAW_SOURCE_BYTES} from './email-source-values';
export const SourceProfileSchema=z.enum(['legacy-stored-1','exact-utf8-1']);
export type SourceProfile=z.infer<typeof SourceProfileSchema>;
const hash=z.string().regex(/^[a-f0-9]{64}$/),version=z.number().int().positive();
export const RawDiagnosticCodeSchema=z.enum(['RAW_SOURCE_EMPTY','ACTIVE_CONTENT_REMOVED','UNSAFE_LINK_REMOVED','ATTRIBUTE_REMOVED','TAG_UNSUPPORTED','STYLE_REMOVED','STYLE_ELEMENT_UNSUPPORTED','EXTERNAL_RESOURCE_BLOCKED','IMAGE_REFERENCE_UNRESOLVED','VML_FIDELITY_UNSUPPORTED','CONDITIONAL_FIDELITY_UNSUPPORTED','NAMESPACE_UNSUPPORTED','PARSER_REPAIR','SOURCE_TRANSFORMED','COMMENT_OMITTED','BROWSER_LINKS_DISABLED','RAW_PROJECTION_LIMIT','DIAGNOSTICS_TRUNCATED','ANIMATION_BROWSER_FALLBACK']);
export const RawDiagnosticSchema=z.object({code:RawDiagnosticCodeSchema,severity:z.enum(['blocking','warning','info']),start:z.number().int().nonnegative(),end:z.number().int().nonnegative(),message:z.string().min(1).max(500)}).strict().refine(d=>d.end>=d.start,'Source range must be ordered');
export type RawDiagnostic=z.infer<typeof RawDiagnosticSchema>;
export const RawProjectionSchema=z.object({source_hash:hash,source_bytes:z.number().int().min(0).max(MAX_RAW_SOURCE_BYTES),browser_profile:z.literal('raw-browser-1'),browser_html:z.string().max(MAX_RAW_PROJECTION_BYTES).nullable(),browser_hash:hash.nullable(),email_profile:z.literal('raw-email-2'),email_html:z.string().max(MAX_RAW_PROJECTION_BYTES).nullable(),email_hash:hash.nullable(),delivery_status:z.enum(['eligible_for_checks','blocked','unavailable']),diagnostics:z.array(RawDiagnosticSchema).max(MAX_RAW_DIAGNOSTICS),omitted_diagnostics:z.number().int().nonnegative()}).strict().superRefine((p,c)=>{
  for(const field of ['browser_html','email_html'] as const){
    const value=p[field];
    if(value!==null&&new TextEncoder().encode(value).byteLength>MAX_RAW_PROJECTION_BYTES)c.addIssue({code:'custom',path:[field],message:'Projection exceeds the UTF-8 byte limit'});
  }
  if((p.browser_html===null)!==(p.browser_hash===null)||(p.email_html===null)!==(p.email_hash===null))c.addIssue({code:'custom',message:'Projection bytes and hash must be available together'});
  if(p.delivery_status==='unavailable'?(p.browser_html!==null||p.email_html!==null):(p.browser_html===null||p.email_html===null))c.addIssue({code:'custom',message:'Projection availability must match status'});
  const blocking=p.diagnostics.some(d=>d.severity==='blocking');
  if(p.delivery_status==='eligible_for_checks'&&blocking||p.delivery_status!=='eligible_for_checks'&&!blocking)c.addIssue({code:'custom',message:'Delivery status must reflect blocking diagnostics'});
  if(p.omitted_diagnostics>0&&!p.diagnostics.some(d=>d.code==='DIAGNOSTICS_TRUNCATED'))c.addIssue({code:'custom',message:'Omitted diagnostics must be disclosed'});
});
export type RawProjection=z.infer<typeof RawProjectionSchema>;
export const SaveReceiptSchema=z.object({receipt_version:z.literal(1),workspace_id:z.uuid(),email_id:z.uuid(),request_base_version:version,saved_doc_version:version,command_id:z.string().min(1).max(200),spec_hash:hash,source:z.object({profile:SourceProfileSchema,sha256:hash,bytes:z.number().int().min(0).max(MAX_RAW_SOURCE_BYTES)}).strict().nullable()}).strict().refine(r=>r.saved_doc_version===r.request_base_version+1,'Receipt must acknowledge exactly one CAS version increment');
export type SaveReceipt=z.infer<typeof SaveReceiptSchema>;
// Domain admission uses the integrating EmailSourceSpecSchema separately. This
// transport contract never treats an arbitrary spec record as render authority.
export const SavedEmailResponseSchema=z.object({email:z.object({id:z.uuid(),title:z.string().max(200),doc_version:version,spec:z.record(z.string(),z.unknown()),updated_at:z.string().optional(),lineage:z.unknown().optional(),raw_source_profile:SourceProfileSchema.nullable().optional()}).strict(),receipt:SaveReceiptSchema,request_id:z.uuid().optional()}).strict().refine(r=>r.email.id===r.receipt.email_id&&r.email.doc_version===r.receipt.saved_doc_version,'Saved document must match receipt identity/version');
export type SavedEmailResponse=z.infer<typeof SavedEmailResponseSchema>;
