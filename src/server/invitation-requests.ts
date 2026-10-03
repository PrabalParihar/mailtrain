import {z} from 'zod';
import type {Tx} from './db';import type {Principal} from './auth';
import {assertCurrentAuthority} from './current-authority';import {keyed} from './commands';import {audit}from'./audit';import {fail}from'./errors';import {resourcePage}from'./pagination';
import {InvitationCreateInput,InvitationUpdateInput,InvitationStateInput,InvitationRequestRecord,InvitationRequestView,InvitationRequestHistory,InvitationPlanningContext,INVITATION_PREREQUISITES,invitationPlanningStatus,type InvitationFields}from'../domain/invitation-requests';
const instant=(value:unknown)=>value instanceof Date?value.toISOString():value;
function record(row:Record<string,unknown>){return InvitationRequestRecord.parse({...row,review_due_at:instant(row.review_due_at),created_at:instant(row.created_at),updated_at:instant(row.updated_at)});}
function view(row:Record<string,unknown>){const request=record(row),now=new Date();return InvitationRequestView.parse({...request,planning_status:invitationPlanningStatus(request,now),observed_at:now.toISOString(),delivery_enabled:false,acceptance_enabled:false,credentials_created:false,seats_reserved:0});}
function normalized(fields:InvitationFields){return {...fields,review_due_at:fields.review_due_at===null?null:new Date(fields.review_due_at).toISOString()};}
function roleCheck(p:Principal,role:string){if(p.role==='Admin'&&role==='Billing')fail(403,'ROLE_PROTECTED','Only an Owner can manage Billing planning requests. No membership has changed.');}
async function row(tx:Tx,p:Principal,id:string,lock=false){const uuid=z.uuid().parse(id).toLowerCase(),r=(await tx.query('SELECT * FROM invitation_requests WHERE workspace_id=$1 AND id=$2'+(lock?' FOR UPDATE':''),[p.workspace,uuid])).rows[0];if(!r)fail(404,'RESOURCE_NOT_FOUND','Invitation planning request not found.');return r;}
async function history(tx:Tx,p:Principal,r:Record<string,unknown>,command:'created'|'updated'|'withdrawn'|'reopened'){
 const snapshot=record(r);await tx.query('INSERT INTO invitation_request_history(workspace_id,request_id,version,command,snapshot,created_by)VALUES($1,$2,$3,$4,$5,$6)',[p.workspace,snapshot.id,snapshot.version,command,JSON.stringify(snapshot),p.user]);
 await audit(tx,p.workspace,p.user,'invitation_request.'+command,snapshot.id);
}
export async function invitationPlanningContext(tx:Tx,p:Principal){
 await assertCurrentAuthority(tx,p,'manage');const workspace=(await tx.query('SELECT name FROM workspaces WHERE id=$1',[p.workspace])).rows[0];if(!workspace)fail(404,'RESOURCE_NOT_FOUND','Workspace not found.');
 return InvitationPlanningContext.parse({workspace_id:p.workspace,workspace_name:workspace.name,actor_id:p.user,actor_role:p.role,delivery_enabled:false,acceptance_enabled:false,credentials_created:false,seats_reserved:0,prerequisites:[...INVITATION_PREREQUISITES]});
}
export async function invitationRequest(tx:Tx,p:Principal,id:string){await assertCurrentAuthority(tx,p,'manage');return{request:view(await row(tx,p,id))};}
export async function createInvitationRequest(tx:Tx,p:Principal,input:unknown,key:string|null){
 await assertCurrentAuthority(tx,p,'manage');const parsed=InvitationCreateInput.parse(input),{request_id,...value}=parsed,fields=normalized(value),id=request_id.toLowerCase();roleCheck(p,fields.role);
 return keyed(tx,p,'invitation_request.create:'+id,key,{request_id:id,...fields},async()=>{
  const r=(await tx.query("INSERT INTO invitation_requests(workspace_id,id,email,role,notes,review_due_at,state,version,created_by,updated_by)VALUES($1,$2,$3,$4,$5,$6,'draft',1,$7,$7) ON CONFLICT DO NOTHING RETURNING *",[p.workspace,id,fields.email,fields.role,fields.notes,fields.review_due_at,p.user])).rows[0];
  if(!r)fail(409,'INVITATION_REQUEST_EXISTS','A planning request already exists for this record or active email. Refresh the saved requests before creating another.');
  await history(tx,p,r,'created');return{request:view(r),changed:true};
 });
}
export async function changeInvitationRequest(tx:Tx,p:Principal,id:string,command:'update'|'withdraw'|'reopen',input:unknown,key:string|null){
 await assertCurrentAuthority(tx,p,'manage');const uuid=z.uuid().parse(id).toLowerCase(),parsed=command==='update'?InvitationUpdateInput.parse(input):InvitationStateInput.parse(input);
 return keyed(tx,p,'invitation_request.'+command+':'+uuid,key,parsed,async()=>{
  const current=await row(tx,p,uuid,true);roleCheck(p,current.role);
  if(current.version!==parsed.expected_version)fail(409,'VERSION_CONFLICT','This planning request changed. Your proposed fields are retained; reload the current request before saving.');
  const fields=command==='update'?normalized(InvitationUpdateInput.parse(input)):normalized({email:current.email,role:current.role,notes:current.notes,review_due_at:instant(current.review_due_at) as string|null});roleCheck(p,fields.role);
  if(command==='update'&&current.state!=='draft')fail(409,'INVITATION_REQUEST_WITHDRAWN','Reopen the planning request before editing. No access has been granted.');
  const state=command==='withdraw'?'withdrawn':'draft',old=record(current);
  if(state===old.state&&fields.email===old.email&&fields.role===old.role&&fields.notes===old.notes&&fields.review_due_at===old.review_due_at)return{request:view(current),changed:false};
  if(current.version===2147483647)fail(409,'VERSION_EXHAUSTED','This request cannot accept another version. Create a separate planning request.');
  let updated;try{updated=(await tx.query('UPDATE invitation_requests SET email=$1,role=$2,notes=$3,review_due_at=$4,state=$5,version=version+1,updated_by=$6,updated_at=clock_timestamp() WHERE workspace_id=$7 AND id=$8 RETURNING *',[fields.email,fields.role,fields.notes,fields.review_due_at,state,p.user,p.workspace,uuid])).rows[0];}
  catch(error){if((error as{code?:string}).code==='23505')fail(409,'INVITATION_REQUEST_EXISTS','Another active planning request uses this email. Keep both histories and withdraw the other request before reopening or changing this one.');throw error;}
  await history(tx,p,updated,command==='update'?'updated':command==='withdraw'?'withdrawn':'reopened');return{request:view(updated),changed:true};
 });
}
export async function invitationRequestPage(req:Request,tx:Tx,p:Principal,id?:string){
 await assertCurrentAuthority(tx,p,'manage');
 if(id){const current=await row(tx,p,id);const page=await resourcePage(req,tx,p,{resource:'invitation-request-history',from:'invitation_request_history',fields:'*',where:'workspace_id=$1 AND request_id=$2',values:[p.workspace,current.id],filters:{request:current.id}});return{...page,data:page.data.map(r=>InvitationRequestHistory.parse({...r,created_at:instant(r.created_at)}))};}
 const page=await resourcePage(req,tx,p,{resource:'invitation-requests',from:'invitation_requests',fields:'*',where:'workspace_id=$1',values:[p.workspace]});return{...page,data:page.data.map(view)};
}
