'use client';
import { useEffect, useRef, useState } from 'react';
import { MembershipCommandResult, type Member, type MemberChange, type MemberSummary, editingSeat } from '../domain/memberships';
import { api } from './api';
import { useResourcePage } from './paged';
import { beginMembershipCommand, finishMembershipCommand, pendingMembershipCommand, reconcileMembershipRejection, type MembershipReceipt } from './membership-command';
type Command='role'|'remove'|'transfer-owner';
type Intent={member:Member;command:Command;input:Record<string,unknown>;recovery?:MembershipReceipt};
const message=(error:unknown)=>error instanceof Error?error.message:'Member action could not be completed.';
export function TeamMembers({workspace,role}:{workspace:string;role:string}){
 return ['Owner','Admin'].includes(role)?<MembersPanel key={workspace} workspace={workspace}/>:<section className="panel"><h2>Team members</h2><p className="muted">Owner or Admin access is required to manage members.</p></section>;
}
function MembersPanel({workspace}:{workspace:string}){
 const members=useResourcePage<Member>(workspace,'memberships'),history=useResourcePage<MemberChange>(workspace,'membership-changes');
 const [summary,setSummary]=useState<MemberSummary|null>(null),[error,setError]=useState(''),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false),[intent,setIntent]=useState<Intent|null>(null),[ack,setAck]=useState(false),[lostAccess,setLostAccess]=useState(false),[pending,setPending]=useState<Record<string,MembershipReceipt>>({});
 const alive=useRef(true),readEpoch=useRef(0),running=useRef(false);
 async function loadSummary(){const epoch=++readEpoch.current;try{const result=await api<{summary:MemberSummary}>(workspace,'memberships/summary');if(alive.current&&epoch===readEpoch.current)setSummary(result.summary);}catch(e){if(alive.current&&epoch===readEpoch.current)setError(message(e));}}
 useEffect(()=>{alive.current=true;void Promise.resolve().then(loadSummary);return()=>{alive.current=false;readEpoch.current++;};},[workspace]); // eslint-disable-line react-hooks/exhaustive-deps
 useEffect(()=>{
  let active=true;
  if(summary)void(async()=>{const found:Record<string,MembershipReceipt>={};for(const member of members.data)for(const command of ['role','remove','transfer-owner'] as const){const path=`memberships/${member.id}/${command}`,receipt=await pendingMembershipCommand(workspace,summary.actor.id,path);if(receipt)found[path]=receipt;}if(active)setPending(found);})().catch(e=>{if(active)setError(message(e));});
  return()=>{active=false;};
 },[workspace,summary,members.data,busy]);
 function confirm(value:Intent){if(running.current)return;setError('');setAck(false);setIntent(value);}
 async function submit(){
  if(running.current||!intent||!summary||((intent.command!=='role')&&!ack))return;
  running.current=true;setBusy(true);setError('');const frozen=intent,path=`memberships/${frozen.member.id}/${frozen.command}`;
  let receipt:MembershipReceipt|undefined;
  try{
   const old=await pendingMembershipCommand(workspace,summary.actor.id,path);
   if(old&&!frozen.recovery)throw new Error('An earlier change is unconfirmed. Use Retry same change to recover it first.');
   receipt=frozen.recovery??await beginMembershipCommand(workspace,summary.actor.id,path,frozen.input);
   const response=await api(workspace,path,'POST',receipt.input,undefined,receipt.key);
   const result=MembershipCommandResult.parse({member:response.member,changes:response.changes});
   finishMembershipCommand(receipt);
   if(!alive.current)return;
   setIntent(null);setNotice(`Confirmed ${frozen.command} at member version ${result.member.version}. Editing seats: ${result.changes[0].editing_seats_after}.`);
   const self=result.changes.find(change=>change.member_id===summary.actor.id);
   if(self&&(self.next_status!=='active'||!['Owner','Admin'].includes(self.next_role))){setLostAccess(true);return;}
   await Promise.all([members.reload(),history.reload(),loadSummary()]);
  }catch(e){
   if(!alive.current)return;
   try{if(receipt&&reconcileMembershipRejection(receipt,e)){setIntent(null);await Promise.all([members.reload(),loadSummary()]);}}
   catch(recoveryError){setError(message(recoveryError));return;}
   setError(message(e));
  }finally{running.current=false;if(alive.current)setBusy(false);}
 }
 if(lostAccess)return<section className="panel"><h2>Team members</h2><p role="status">{notice} Your management access changed.</p><button onClick={()=>window.location.reload()}>Reload workspace</button></section>;
 return<section className="panel">
  <h2>Team members</h2>
  <p className="muted">Manage existing members. Invitations and approved seat capacity require account setup.</p>
  {summary&&<><p>Editing seats: <strong>{summary.editing_seats}</strong>. Owner, Admin and Editor each use one seat.</p><p className="small muted">Seat increases are blocked until capacity is approved. These counts are local evidence; billing is not reconciled.</p><p className="small muted">{summary.mfa_mode==='local-development'?'Local development session. Production MFA has not been verified.':'Changes require both authentication factors verified less than ten minutes ago.'}</p></>}
  {(error||members.error||history.error)&&<p className="alert danger" role="alert">{error||members.error||history.error}</p>}
  {notice&&<p role="status">{notice}</p>}
  <button disabled={busy||members.busy} onClick={()=>{setError('');void Promise.all([members.reload(),history.reload(),loadSummary()]);}}>Refresh team</button>
  {!members.loaded?<p>Loading members…</p>:members.data.length===0?<p>No accessible members.</p>:summary&&members.data.map(member=><MemberRow key={member.id+':'+member.version} member={member} summary={summary} disabled={busy||!!intent} onConfirm={confirm} pending={pending}/>)}
  {members.hasMore&&<button disabled={busy||members.busy} onClick={()=>void members.loadMore()}>Load older members</button>}
  {intent&&<div className="panel" role="dialog" aria-label="Confirm membership change">
   <h3>{intent.recovery?'Recover previous change':'Confirm membership change'}</h3>
   <p>Member {intent.member.user_id}. {intent.command==='role'?`Change role to ${intent.input.role}.`:intent.command==='remove'?'Remove workspace access.':'Transfer ownership; your role becomes Admin.'}</p>
   <p className="small muted">Expected member version: {String(intent.input.expected_version)}. {intent.recovery?'This retries the original command and its original version.':'Changes take effect immediately. Already running provider work cannot be recalled.'}</p>
   {intent.command==='role'&&<p>Editing seat change: {editingSeat(intent.input.role as Member['role'])-editingSeat(intent.member.role)}.</p>}
   {intent.command!=='role'&&<label><input type="checkbox" checked={ack} disabled={busy} onChange={e=>setAck(e.target.checked)}/> I acknowledge this access change.</label>}
   <div className="button-row"><button disabled={busy||(intent.command!=='role'&&!ack)} onClick={()=>void submit()}>{busy?'Applying change…':intent.recovery?'Retry original command':'Confirm change'}</button><button disabled={busy} onClick={()=>setIntent(null)}>Cancel</button></div>
  </div>}
  <h3>Membership change history</h3>
  {!history.loaded?<p>Loading change history…</p>:history.data.length===0?<p>No membership changes yet.</p>:<div className="audit-list">{history.data.map(change=><div key={change.id} style={{display:'block',overflowWrap:'anywhere'}}><strong>{change.command}: {change.previous_role} → {change.next_role}; {change.next_status}</strong><p className="small muted">Member {change.subject_user_id}. Version {change.previous_version} → {change.next_version}. Editing seats {change.editing_seats_before} → {change.editing_seats_after}. Revoked keys {change.revoked_keys}; cancelled queued work {change.cancelled_operations}; running cancellation requests {change.cancel_requested_operations}.</p><time className="small muted">{new Date(change.created_at).toLocaleString()}</time></div>)}</div>}
  {history.hasMore&&<button disabled={busy||history.busy} onClick={()=>void history.loadMore()}>Load older member changes</button>}
 </section>;
}
function MemberRow({member,summary,disabled,onConfirm,pending}:{member:Member;summary:MemberSummary;disabled:boolean;onConfirm:(intent:Intent)=>void;pending:Record<string,MembershipReceipt>}){
 const [nextRole,setNextRole]=useState<Member['role']>(member.role==='Owner'?'Admin':member.role);
 const protectedMember=summary.actor.role==='Admin'&&['Owner','Billing'].includes(member.role),lastOwner=member.role==='Owner'&&summary.active_owners<=1,active=member.status==='active';
 return<div className="panel" style={{overflowWrap:'anywhere'}} data-member-id={member.id}>
  <h3>{member.user_id}</h3><p>{member.role} · {member.status} · version {member.version}{member.id===summary.actor.id?' · You':''}</p>
  {(['role','remove','transfer-owner'] as const).map(command=>{const receipt=pending[`memberships/${member.id}/${command}`];return receipt?<div key={command}><p className="alert warning">Unconfirmed {command}{receipt.input.role?` to ${receipt.input.role}`:''} at version {String(receipt.input.expected_version)}.</p><button disabled={disabled} onClick={()=>onConfirm({member,command,input:receipt.input,recovery:receipt})}>Retry same {command} change</button></div>:null;})}
  {active&&!protectedMember&&<><label htmlFor={'member-role-'+member.id}>Role for {member.user_id}</label><select id={'member-role-'+member.id} value={nextRole} disabled={disabled||lastOwner} onChange={e=>setNextRole(e.target.value as Member['role'])}>{(['Admin','Editor','Viewer','Billing'] as const).filter(role=>summary.actor.role==='Owner'||role!=='Billing').map(role=><option key={role}>{role}</option>)}</select><div className="button-row"><button disabled={disabled||lastOwner||nextRole===member.role} onClick={()=>onConfirm({member,command:'role',input:{role:nextRole,expected_version:member.version}})}>Change role</button><button disabled={disabled||lastOwner} onClick={()=>onConfirm({member,command:'remove',input:{expected_version:member.version,acknowledge:true}})}>Remove member</button>{summary.actor.role==='Owner'&&member.id!==summary.actor.id&&['Admin','Editor'].includes(member.role)&&<button disabled={disabled} onClick={()=>onConfirm({member,command:'transfer-owner',input:{expected_version:member.version,expected_owner_version:summary.actor.version,acknowledge:true}})}>Transfer ownership</button>}</div></>}
  {lastOwner&&<p className="small muted">The final Owner must transfer ownership before leaving or changing their role.</p>}
  {protectedMember&&<p className="small muted">Only an Owner can manage this role.</p>}
 </div>;
}
