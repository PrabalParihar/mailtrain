'use client';
import {useEffect,useRef,useState}from'react';
import {InvitationPlanningContext,InvitationCommandResult,InvitationRequestView,INVITATION_PREREQUISITES,type InvitationRequest,type InvitationHistory,type InvitationContext,type InvitationFields}from'../domain/invitation-requests';
import {api,ApiError}from'./api';import{useResourcePage}from'./paged';import{editingSeat}from'../domain/memberships';
type Form={email:string;role:InvitationFields['role'];notes:string;due:string};
type Pending={path:string;input:Record<string,unknown>;key:string;label:string};
const empty=():Form=>({email:'',role:'Editor',notes:'',due:''});
const formFor=(r:InvitationRequest):Form=>({email:r.email,role:r.role,notes:r.notes,due:r.review_due_at?.replace(/Z$/,'')??''});
const message=(e:unknown)=>e instanceof Error?e.message:'Planning request unavailable. Your proposed fields are retained.';
export function InvitationRequests({workspace,actor,role}:{workspace:string;actor:string;role:'Owner'|'Admin'}){
 const requests=useResourcePage<InvitationRequest>(workspace,'invitation-requests');
 const [context,setContext]=useState<InvitationContext|null>(null),[contextError,setContextError]=useState(''),[form,setForm]=useState<Form>(empty),[editing,setEditing]=useState<InvitationRequest|null>(null),[error,setError]=useState(''),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false),[pending,setPending]=useState<Pending|null>(null),[history,setHistory]=useState<InvitationRequest|null>(null);
 const active=useRef(true),running=useRef(false),pendingRef=useRef<Pending|null>(null),readEpoch=useRef(0);
 async function readiness(){const epoch=++readEpoch.current;try{const result=await api<{context:InvitationContext}>(workspace,'invitation-requests/readiness','GET',undefined,undefined,undefined,undefined,actor);const current=InvitationPlanningContext.parse(result.context);if(current.workspace_id!==workspace||current.actor_id!==actor)throw Error('Planning context changed. Refresh the selected workspace.');if(active.current&&epoch===readEpoch.current){setContext(current);setContextError('');}}catch(e){if(active.current&&epoch===readEpoch.current)setContextError(message(e));}}
 useEffect(()=>{active.current=true;void Promise.resolve().then(readiness);return()=>{active.current=false;readEpoch.current++;};},[workspace,actor]); // eslint-disable-line react-hooks/exhaustive-deps
 function clear(){if(running.current||pendingRef.current)return;setForm(empty());setEditing(null);setError('');}
 async function perform(command:Pending){
  if(running.current||!context)return;running.current=true;pendingRef.current=command;setPending(command);setBusy(true);setError('');setNotice('');
  try{
   const response=await api<{request:InvitationRequest;changed:boolean}>(workspace,command.path,'POST',command.input,undefined,command.key,undefined,actor);
   const result=InvitationCommandResult.parse({request:response.request,changed:response.changed});
   if(result.request.workspace_id!==workspace)throw Error('Planning response belongs to another workspace. Keep the original command and retry.');
   if(!active.current)return;
   pendingRef.current=null;setPending(null);setNotice(`Planning request confirmed at version ${result.request.version}. Not sent; no access granted.`);setForm(empty());setEditing(null);
   await requests.reload();
  }catch(e){if(!active.current)return;if(e instanceof ApiError&&e.status<500){pendingRef.current=null;setPending(null);}setError(message(e));}
  finally{running.current=false;if(active.current)setBusy(false);}
 }
 function submit(){if(running.current||pendingRef.current||!context)return;try{const values={email:form.email,role:form.role,notes:form.notes,review_due_at:form.due?new Date(form.due+'Z').toISOString():null};void perform({path:editing?'invitation-requests/'+editing.id+'/update':'invitation-requests',input:editing?{...values,expected_version:editing.version}:{...values,request_id:crypto.randomUUID()},key:crypto.randomUUID(),label:editing?'save changes':'create request'});}catch(e){setError(message(e));}}
 async function reloadEditing(){if(!editing||running.current||pendingRef.current)return;running.current=true;setBusy(true);try{const r=await api<{request:InvitationRequest}>(workspace,'invitation-requests/'+editing.id,'GET',undefined,undefined,undefined,undefined,actor),latest=InvitationRequestView.parse(r.request);if(!active.current)return;setEditing(latest);setForm(formFor(latest));setError('');setNotice('Loaded current planning version. Not sent.');await requests.reload();}catch(e){if(active.current)setError(message(e));}finally{running.current=false;if(active.current)setBusy(false);}}
 const locked=busy||!!pending,formLocked=locked||!context||!requests.loaded||!!requests.error;
 return<section className="panel invitation-planning" role="region" aria-label="Invitation planning">
  <h3>Invitation planning</h3><p>Not sent. Acceptance is disabled.</p><p className="muted">Save a proposed teammate and role for review. Planning requests create no invitation link, reserve no seats and grant no access.</p>
  <p>Workspace: {context?.workspace_name??'Loading selected workspace…'}</p>
  <form onSubmit={e=>{e.preventDefault();submit();}}>
   <h4>{editing?'Edit planning request':'New planning request'}</h4>
   <label>Recipient email (unverified)<input type="email" dir="ltr" required maxLength={254} disabled={formLocked} value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></label>
   <label>Proposed role<select disabled={formLocked} value={form.role} onChange={e=>setForm({...form,role:e.target.value as Form['role']})}>{(['Admin','Editor','Viewer','Billing'] as const).map(r=><option key={r} disabled={r==='Billing'&&role!=='Owner'}>{r}</option>)}</select></label>
   <p className="small muted">{editingSeat(form.role)} proposed editing seat. No seat is reserved. Owner, Admin and Editor count as editing roles; no plan capacity is approved.</p>
   <label>Planning notes<textarea dir="auto" maxLength={4000} disabled={formLocked} value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/></label>
   <label>Review deadline (UTC, optional)<input type="datetime-local" step="0.001" dir="ltr" disabled={formLocked} value={form.due} onChange={e=>setForm({...form,due:e.target.value})}/></label><p className="small muted">Planning review only. This date does not expire access or schedule a message. Review status is checked when requests refresh.</p>
   <div className="button-row"><button type="submit" disabled={formLocked}>{busy?'Saving planning request…':editing?'Save request changes':'Save planning request'}</button><button type="button" disabled={locked} onClick={clear}>{editing?'Cancel editing':'Clear form'}</button>{editing&&<button type="button" disabled={locked} onClick={()=>void reloadEditing()}>Reload current request</button>}</div>
  </form>
  {(error||contextError||requests.error)&&<p role="alert" className="alert danger">{error||contextError||requests.error}</p>}
  {pending&&<div className="alert warning"><p>Unconfirmed {pending.label}. Your original input and command are retained in this view; no invitation was sent.</p><button disabled={busy} onClick={()=>void perform(pending)}>Retry same planning command</button></div>}
  {notice&&<p role="status">{notice}</p>}
  <button disabled={busy||requests.busy} onClick={()=>{setError('');void Promise.all([requests.reload(),readiness()]);}}>Refresh requests</button>
  {!requests.loaded?<p>Loading invitation requests…</p>:requests.data.length===0?<p>No saved invitation requests.</p>:requests.data.map(r=>{
   const protectedRole=role==='Admin'&&r.role==='Billing';return<div className="panel invitation-request-card" key={r.id} data-invitation-request={r.id}>
    <h4 dir="ltr">{r.email}</h4><p>Proposed {r.role} · version {r.version} · {r.planning_status==='withdrawn'?<span>Withdrawn</span>:r.planning_status==='review_due'?<span>Review deadline passed</span>:<span>Draft request</span>}</p>
    {r.notes&&<p dir="auto">{r.notes}</p>}{r.review_due_at&&<p className="small muted">Review deadline UTC: {r.review_due_at}</p>}
    <p className="small muted">Not sent · No access granted · Zero seats reserved</p>
    <div className="button-row"><button disabled={locked||protectedRole||r.state!=='draft'} onClick={()=>{setEditing(r);setForm(formFor(r));setError('');setNotice('');}}>Edit request</button><button disabled={locked||protectedRole} onClick={()=>void perform({path:'invitation-requests/'+r.id+'/'+(r.state==='draft'?'withdraw':'reopen'),input:{expected_version:r.version},key:crypto.randomUUID(),label:r.state==='draft'?'withdraw request':'reopen request'})}>{r.state==='draft'?'Withdraw request':'Reopen request'}</button><button disabled={busy} onClick={()=>setHistory(r)}>View request history</button></div>
    {protectedRole&&<p className="small muted">Only an Owner can manage this Billing planning request.</p>}
   </div>;
  })}
  {requests.hasMore&&<button disabled={locked||requests.busy} onClick={()=>void requests.loadMore()}>Load older requests</button>}
  {history&&<PlanningHistory key={history.id} workspace={workspace} request={history} onClose={()=>setHistory(null)}/>}
  <h4>What remains disabled</h4><p>Commercial entitlements are not approved. Sending and acceptance remain disabled while these prerequisites are completed:</p><ul>{(context?.prerequisites??INVITATION_PREREQUISITES).map(p=><li key={p}>{p}</li>)}</ul>
  <div className="button-row"><button disabled>Send invitation</button><button disabled>Accept invitation</button></div>
 </section>;
}
function PlanningHistory({workspace,request,onClose}:{workspace:string;request:InvitationRequest;onClose:()=>void}){
 const history=useResourcePage<InvitationHistory>(workspace,'invitation-requests/'+request.id+'/history');
 return<section className="panel" role="region" aria-label="Planning request history"><h4>Planning request history</h4><p dir="ltr">{request.email}</p><button onClick={onClose}>Close request history</button><button disabled={history.busy} onClick={()=>void history.reload()}>Refresh request history</button>{history.error&&<p role="alert" className="alert danger">{history.error}</p>}{!history.loaded?<p>Loading request history…</p>:history.data.length===0?<p>No request history.</p>:history.data.map(h=><div className="panel" key={h.id} data-invitation-history={h.id}><strong>{h.command} · version {h.version}</strong><p>{h.snapshot.role} · {h.snapshot.state} · Not sent</p>{h.snapshot.notes&&<p dir="auto">{h.snapshot.notes}</p>}<p className="small muted">Recorded by {h.created_by} · {h.created_at}</p></div>)}{history.hasMore&&<button disabled={history.busy} onClick={()=>void history.loadMore()}>Load older request history</button>}</section>;
}
