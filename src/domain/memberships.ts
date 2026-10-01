import { z } from 'zod';
import type { Role } from './permissions';
const version=z.number().int().min(1).max(2147483647);
export const RoleChangeInput=z.object({role:z.enum(['Admin','Editor','Viewer','Billing']),expected_version:version}).strict();
export const RemoveMemberInput=z.object({expected_version:version,acknowledge:z.literal(true)}).strict();
export const TransferOwnerInput=z.object({expected_version:version,expected_owner_version:version,acknowledge:z.literal(true)}).strict();
export function editingSeat(role:Role):0|1{return ['Owner','Admin','Editor'].includes(role)?1:0;}
export function recentMfa(age:unknown):boolean{
 return Array.isArray(age)&&age.length===2&&age.every(value=>typeof value==='number'&&Number.isFinite(value)&&value>=0&&value<=10);
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
