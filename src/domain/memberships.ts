import { z } from 'zod';
import type { Role } from './permissions';
const version=z.number().int().min(1).max(2147483647);
export const RoleChangeInput=z.object({role:z.enum(['Admin','Editor','Viewer','Billing']),expected_version:version}).strict();
export const RemoveMemberInput=z.object({expected_version:version,acknowledge:z.literal(true)}).strict();
export const TransferOwnerInput=z.object({expected_version:version,expected_owner_version:version,acknowledge:z.literal(true)}).strict();
export function editingSeat(role:Role):0|1{return ['Owner','Admin','Editor'].includes(role)?1:0;}
export function recentMfa(age:unknown):boolean{
 return Array.isArray(age)&&age.length===2&&age.every(value=>typeof value==='number'&&Number.isFinite(value)&&value>=0&&value<10);
}
type Decision={ok:true;editing_seat_delta:number}|{ok:false;code:'INSUFFICIENT_SCOPE'|'ROLE_PROTECTED'|'MEMBERSHIP_INACTIVE'|'LAST_OWNER_REQUIRED'|'OWNER_REQUIRED'|'OWNER_TRANSFER_REQUIRED'|'SELF_TRANSFER_DENIED'|'MEMBERSHIP_UNCHANGED'|'SEAT_POLICY_REQUIRED'};
export function decideMembershipChange(input:{actor:Role;target:Role;status:string;command:'role'|'remove'|'transfer-owner';next_role?:Role;active_owners:number;self:boolean}):Decision{
 if(!['Owner','Admin'].includes(input.actor))return{ok:false,code:'INSUFFICIENT_SCOPE'};
 if(input.command==='transfer-owner'){
  if(input.actor!=='Owner')return{ok:false,code:'OWNER_REQUIRED'};
  if(input.self)return{ok:false,code:'SELF_TRANSFER_DENIED'};
 }
 if(input.actor==='Admin'&&(['Owner','Billing'].includes(input.target)||input.next_role==='Billing'))return{ok:false,code:'ROLE_PROTECTED'};
 if(input.status!=='active')return{ok:false,code:'MEMBERSHIP_INACTIVE'};
 if(input.command==='transfer-owner'){
  if(input.target==='Owner')return{ok:false,code:'MEMBERSHIP_UNCHANGED'};
  if(!editingSeat(input.target))return{ok:false,code:'SEAT_POLICY_REQUIRED'};
  return{ok:true,editing_seat_delta:0};
 }
 if(input.command==='role'){
  if(!input.next_role||input.next_role==='Owner')return{ok:false,code:'OWNER_TRANSFER_REQUIRED'};
  if(input.next_role===input.target)return{ok:false,code:'MEMBERSHIP_UNCHANGED'};
 }
 if(input.target==='Owner'&&input.active_owners<=1)return{ok:false,code:'LAST_OWNER_REQUIRED'};
 const delta=(input.command==='remove'?0:editingSeat(input.next_role!))-editingSeat(input.target);
 if(delta>0)return{ok:false,code:'SEAT_POLICY_REQUIRED'};
 return{ok:true,editing_seat_delta:delta};
}
export const Membership=z.object({workspace_id:z.uuid(),id:z.uuid(),user_id:z.string(),role:z.enum(['Owner','Admin','Editor','Viewer','Billing']),status:z.string(),version,created_at:z.iso.datetime({offset:true}),revoked_at:z.iso.datetime({offset:true}).nullable()}).strict();
export const MembershipChange=z.object({workspace_id:z.uuid(),id:z.uuid(),member_id:z.uuid(),subject_user_id:z.string(),actor_user_id:z.string(),command:z.enum(['role','remove','transfer-owner']),previous_version:version,next_version:version,previous_role:Membership.shape.role,next_role:Membership.shape.role,previous_status:z.string(),next_status:z.string(),editing_seats_before:z.number().int().min(0),editing_seats_after:z.number().int().min(0),revoked_keys:z.number().int().min(0),cancelled_operations:z.number().int().min(0),cancel_requested_operations:z.number().int().min(0),created_at:z.iso.datetime({offset:true})}).strict();
export const MembershipCommandResult=z.object({member:Membership,changes:z.array(MembershipChange).min(1).max(2)}).strict();
export const MembershipSummary=z.object({actor:Membership.pick({id:true,user_id:true,role:true,status:true,version:true}),editing_seats:z.number().int().min(0),active_owners:z.number().int().min(0),capacity_policy_configured:z.literal(false),billing_reconciled:z.literal(false),mfa_mode:z.enum(['local-development','verified-session-required'])}).strict();
export type Member=z.infer<typeof Membership>;
export type MemberChange=z.infer<typeof MembershipChange>;
export type MemberSummary=z.infer<typeof MembershipSummary>;
