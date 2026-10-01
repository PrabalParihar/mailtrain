import { z } from 'zod';
import type { Tx } from './db';
import type { Principal } from './auth';
import { RoleChangeInput, RemoveMemberInput, TransferOwnerInput, MembershipCommandResult } from '../domain/memberships';
import { fail } from './errors';
import { audit, digest } from './audit';
const errors:Record<string,{status:number;message:string}>={
 RESOURCE_NOT_FOUND:{status:404,message:'Member not found in this workspace.'},SESSION_REQUIRED:{status:403,message:'Manage members with a signed-in session.'},INSUFFICIENT_SCOPE:{status:403,message:'Your current role cannot manage members.'},WORKSPACE_LOCKED:{status:409,message:'This workspace cannot accept new work.'},MEMBERSHIP_VERSION_CONFLICT:{status:409,message:'Membership changed. Reload before choosing a new command.'},MEMBERSHIP_VERSION_EXHAUSTED:{status:409,message:'This membership cannot accept another version.'},ROLE_PROTECTED:{status:403,message:'Only an Owner can manage this role.'},OWNER_REQUIRED:{status:403,message:'Only an Owner can transfer ownership.'},SELF_TRANSFER_DENIED:{status:409,message:'Choose another active member for ownership transfer.'},LAST_OWNER_REQUIRED:{status:409,message:'Transfer ownership before removing or demoting the final Owner.'},MEMBERSHIP_INACTIVE:{status:409,message:'This membership is no longer active.'},MEMBERSHIP_UNCHANGED:{status:409,message:'This membership already has the selected role.'},SEAT_POLICY_REQUIRED:{status:409,message:'An approved editing-seat capacity policy is required before increasing seats.'},OWNER_TRANSFER_REQUIRED:{status:422,message:'Use explicit ownership transfer to grant Owner.'},MEMBERSHIP_ACK_REQUIRED:{status:422,message:'Confirm this membership action.'},VALIDATION_FAILED:{status:422,message:'Choose a valid membership action.'},
};
export async function changeMembership(tx:Tx,p:Principal,id:string,command:'role'|'remove'|'transfer-owner',body:Record<string,unknown>):Promise<{member:Record<string,unknown>;changes:Record<string,unknown>[]}>{
 if(p.api_key)fail(403,'SESSION_REQUIRED','Manage members with a signed-in session.');
 z.uuid().parse(id);
 const input=command==='role'?RoleChangeInput.parse(body):command==='remove'?RemoveMemberInput.parse(body):TransferOwnerInput.parse(body);
 let result:{member:Record<string,unknown>;changes:Record<string,unknown>[]};
 try{
  result=MembershipCommandResult.parse((await tx.query('SELECT public.mailcraft_change_member($1,$2,$3,$4,$5,$6,$7)AS result',[p.workspace,id,input.expected_version,command,'role'in input?input.role:null,'expected_owner_version'in input?input.expected_owner_version:null,'acknowledge'in input?input.acknowledge:false])).rows[0].result);
 }catch(error){
  if((error as{code?:string}).code==='55P03')fail(503,'MEMBERSHIP_BUSY','Member controls are busy. Keep the same command and retry shortly.');
  const name=(error as{message?:string}).message??'',mapped=errors[name];
  if(mapped)fail(mapped.status,name,mapped.message);throw error;
 }
 for(const change of result.changes)await audit(tx,p.workspace,p.user,'membership.'+command,String(change.id)+':'+digest(change));
 return result;
}
export async function readMembershipSummary(tx:Tx,p:Principal){
 if(p.api_key)fail(403,'SESSION_REQUIRED','Manage members with a signed-in session.');
 const actor=(await tx.query("SELECT id,user_id,role,status,version FROM memberships WHERE workspace_id=$1 AND user_id=$2 AND status='active'",[p.workspace,p.user])).rows[0];
 if(!actor||!['Owner','Admin'].includes(actor.role))fail(403,'INSUFFICIENT_SCOPE','Your current role cannot manage members.');
 const editing=Number((await tx.query("SELECT count(*)::text AS count FROM memberships WHERE workspace_id=$1 AND status='active' AND role IN('Owner','Admin','Editor')",[p.workspace])).rows[0].count);
 const owners=Number((await tx.query("SELECT count(*)::text AS count FROM memberships WHERE workspace_id=$1 AND status='active' AND role='Owner'",[p.workspace])).rows[0].count);
 return{actor,editing_seats:editing,active_owners:owners,capacity_policy_configured:false,billing_reconciled:false};
}
