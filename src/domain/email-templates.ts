import {z} from 'zod';
import {EmailSpecSchema} from './email-schema';
const uuid=z.uuid().transform(value=>value.toLowerCase());
const text=z.string().trim().min(1).max(160);
const hash=z.string().regex(/^[0-9a-f]{64}$/);
const version=z.number().int().positive().max(2147483647);
export const SaveEmailTemplateInput=z.object({name:text,source_revision_id:uuid,expected_artifact_hash:hash}).strict();
export const ArchiveEmailTemplateInput=z.object({expected_version:version}).strict();
export const RemixEmailTemplateInput=z.object({title:text,expected_version:version,expected_artifact_hash:hash}).strict();
export const EmailTemplateViewSchema=z.object({
 id:uuid,name:text,state:z.enum(['active','archived']),version,
 source_revision_id:uuid,source_email_id:uuid,source_revision_no:version,source_doc_version:version.nullable(),source_title:text,
 artifact_hash:hash,brand_kit_version_id:uuid,locale:EmailSpecSchema.shape.locale,direction:z.enum(['ltr','rtl']),editing_mode:z.enum(['structured','raw_html']),
 created_at:z.iso.datetime({offset:true}),archived_at:z.iso.datetime({offset:true}).nullable(),
}).strict();
export type EmailTemplateView=z.infer<typeof EmailTemplateViewSchema>;
