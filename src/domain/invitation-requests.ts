import {z} from 'zod';
const version=z.number().int().min(1).max(2147483647);
export const InvitationRequestId=z.uuid();
// JSON Schema validates raw input; preserve the server's trim and post-trim bound.
export const INVITATION_EMAIL_INPUT_PATTERN=String.raw`^\s*(?=\S{1,254}\s*$)`+z.regexes.email.source.slice(1,-1)+String.raw`\s*$`;
export const InvitationRole=z.enum(['Admin','Editor','Viewer','Billing']);
export const InvitationRequestInput=z.object({
 email:z.string().trim().min(1).max(254).pipe(z.email()),role:InvitationRole,
 notes:z.string().max(4000).default(''),review_due_at:z.iso.datetime({offset:true}).refine(value=>Number.isFinite(Date.parse(value))).nullable().default(null),
}).strict();
export const InvitationCreateInput=InvitationRequestInput.extend({request_id:InvitationRequestId});
export const InvitationUpdateInput=InvitationRequestInput.extend({expected_version:version});
export const InvitationStateInput=z.object({expected_version:version}).strict();
export const InvitationRequestRecord=z.object({workspace_id:z.uuid(),id:InvitationRequestId,email:z.email(),role:InvitationRole,notes:z.string().max(4000),review_due_at:z.iso.datetime({offset:true}).nullable(),state:z.enum(['draft','withdrawn']),version,created_by:z.string(),updated_by:z.string(),created_at:z.iso.datetime({offset:true}),updated_at:z.iso.datetime({offset:true})}).strict();
export const InvitationRequestView=InvitationRequestRecord.extend({planning_status:z.enum(['draft','withdrawn','review_due']),observed_at:z.iso.datetime({offset:true}),delivery_enabled:z.literal(false),acceptance_enabled:z.literal(false),credentials_created:z.literal(false),seats_reserved:z.literal(0)});
export const InvitationRequestHistory=z.object({workspace_id:z.uuid(),id:z.uuid(),request_id:InvitationRequestId,version,command:z.enum(['created','updated','withdrawn','reopened']),snapshot:InvitationRequestRecord,created_by:z.string(),created_at:z.iso.datetime({offset:true})}).strict();
export const InvitationPlanningContext=z.object({workspace_id:z.uuid(),workspace_name:z.string(),actor_id:z.string(),actor_role:z.enum(['Owner','Admin']),delivery_enabled:z.literal(false),acceptance_enabled:z.literal(false),credentials_created:z.literal(false),seats_reserved:z.literal(0),prerequisites:z.array(z.string()).min(1).max(10)}).strict();
export const InvitationCommandResult=z.object({request:InvitationRequestView,changed:z.boolean()}).strict();
export const INVITATION_PREREQUISITES=[
 'Approved commercial entitlements and editing-seat counting',
 'Approved recipient identity verification and expiry/reissue policy',
 'Verified transactional sender, templates, credentials and limits',
 'Production membership, MFA, audit and required acceptance evidence',
 'Explicit production activation after release gates pass',
] as const;
export function invitationPlanningStatus(request:{state:'draft'|'withdrawn';review_due_at:string|null},now:Date):'draft'|'withdrawn'|'review_due'{
 if(request.state==='withdrawn')return 'withdrawn';
 return request.review_due_at!==null&&Date.parse(request.review_due_at)<=now.getTime()?'review_due':'draft';
}
export function invitationRefusal(command:'send'|'accept'){
 return command==='send'?{code:'INVITATION_DELIVERY_DISABLED',message:'Invitation delivery is disabled. Save a planning request; approved entitlements, identity policy and transactional sender setup are required.'}:{code:'INVITATION_ACCEPTANCE_DISABLED',message:'Invitation acceptance is disabled until commercial entitlements and production acceptance are explicitly approved. This planning request grants no access.'};
}
export type InvitationRequest=z.infer<typeof InvitationRequestView>;
export type InvitationHistory=z.infer<typeof InvitationRequestHistory>;
export type InvitationContext=z.infer<typeof InvitationPlanningContext>;
export type InvitationFields=z.infer<typeof InvitationRequestInput>;
