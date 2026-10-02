import {z} from 'zod';
import {EmailSpecSchema} from './email-schema';
import{MAX_RAW_SOURCE_BYTES,MAX_RAW_PROJECTION_BYTES,rawSourceBytes}from'./email-source-values';
import{SourceProfileSchema}from'./email-source-contracts';
const version=z.number().int().positive(),hash=z.string().regex(/^[a-f0-9]{64}$/);
export const ConversionProposalInput=z.object({expected_version:version}).strict();
export const ConversionAcceptInput=z.object({expected_version:version,source_hash:hash,proposal_hash:hash,acknowledge_layout_change:z.literal(true)}).strict();
const note=z.object({code:z.enum(['layout_change','opaque_preserved','unsupported_source','limit']),message:z.string().max(500)}).strict();
const fields={source_doc_version:version,source_hash:hash,proposal_hash:hash,original_html:z.string().max(MAX_RAW_SOURCE_BYTES).refine(v=>{try{rawSourceBytes(v);return true;}catch{return false;}},'Use representable bounded source'),original_preview_html:z.string().max(MAX_RAW_PROJECTION_BYTES).nullable(),source_profile:SourceProfileSchema,browser_profile:z.literal('raw-browser-1'),converted_nodes:z.number().int().min(0).max(200),opaque_nodes:z.number().int().min(0).max(200),notes:z.array(note).max(201)};
export const ConversionProposalSchema=z.discriminatedUnion('status',[
 z.object({...fields,status:z.literal('available'),spec:EmailSpecSchema.refine(spec=>spec.editing_mode==='structured','Conversion requires structured mode.'),preview_html:z.string().max(2000000)}).strict(),
 z.object({...fields,status:z.literal('unsupported'),spec:z.null(),preview_html:z.null()}).strict(),
]).refine(value=>value.converted_nodes+value.opaque_nodes<=200,'Conversion admits at most200nodes.');
export type ConversionProposal=z.infer<typeof ConversionProposalSchema>;
