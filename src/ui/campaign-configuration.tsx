'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import {CampaignConfigurationInput,CampaignConfigurationView,resolveCampaignTiming,type CampaignConfigurationSnapshotData} from '../domain/campaign-configuration';
import {api,ApiError} from './api';
import {useResourcePage} from './paged';
import {AudienceSnapshotSelector} from './audience-snapshot-selector';
import {campaignFormDirty,campaignRevisionTextLimit,formForCampaign,readCampaignForm,rememberCampaignForm,type CampaignForm,type CampaignView} from './campaign-form-recovery';
export function CampaignConfiguration({workspace,id,role,savedState,savedVersion,onUpdate}:{workspace:string;id:string;role:string;savedState:string;savedVersion:number;onUpdate:()=>Promise<void>}) {
 const [form,setForm]=useState<CampaignForm|null>(null),[observed,setObserved]=useState<CampaignView|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState(''),[persisted,setPersisted]=useState(true),[verifiedAudience,setVerifiedAudience]=useState<string|null>(null);
 const epoch=useRef(0),running=useRef(false),latest=useRef<CampaignForm|null>(null),path='campaigns/'+id;
 const record=form?.base??null,pending=form?.pending,history=useResourcePage<CampaignConfigurationSnapshotData>(workspace,path+'/configurations?limit=5',String(record?.version??0));
 let currentState=observed?.state??record?.state??savedState;
 if(savedVersion>=(observed?.version??record?.version??0)){
  if(!['draft','review_pending'].includes(savedState))currentState=savedState;
  else if(['draft','review_pending'].includes(currentState))currentState=savedState==='review_pending'||currentState==='review_pending'?'review_pending':'draft';
 }
 const currentVersion=Math.max(savedVersion,observed?.version??0),configurationChanged=!!record&&currentVersion>record.version;
 const editingRole=['Owner','Admin','Editor'].includes(role),editable=editingRole&&!!form&&!!observed&&['draft','review_pending'].includes(currentState);
 const sourceUnverified=!!form?.audience_id&&(verifiedAudience!==form.audience_id||!['Owner','Admin'].includes(role));
 function install(next:CampaignForm){latest.current=next;setForm(next);setPersisted(rememberCampaignForm(workspace,id,next));}
 const load=useCallback(async(replace=true)=>{
  if(running.current)return;running.current=true;const generation=++epoch.current;setBusy(true);setError('');
  const recovery=replace?null:readCampaignForm(workspace,id);
  try{
   const response=await api<{campaign:CampaignView}>(workspace,path),campaign=CampaignConfigurationView.parse(response.campaign);if(epoch.current!==generation)return;
   setObserved(campaign);const recovered=recovery?.form?.base.id===id?recovery.form:null,next=recovered??formForCampaign(campaign);
   latest.current=next;setForm(next);setPersisted(recovery&&!recovery.persisted?false:rememberCampaignForm(workspace,id,next));setVerifiedAudience(null);
   setNotice(recovered?(next.pending?'Original configuration command recovered.':campaignFormDirty(next)?'Unapplied campaign configuration edits recovered.':''):'Saved configuration loaded. Unsaved form edits were replaced.');
  }catch(e){if(epoch.current===generation){setError((e as Error).message);if(!replace&&recovery?.form?.base.id===id){latest.current=recovery.form;setForm(recovery.form);setPersisted(recovery.persisted);}}}
  finally{if(epoch.current===generation){running.current=false;setBusy(false);}}
 },[workspace,id,path]);
 useEffect(()=>{let active=true;void Promise.resolve().then(()=>{if(active)void load(false);});const fence=epoch;return()=>{active=false;fence.current++;};},[load]);
 function change(patch:Partial<CampaignForm>){if(!form||running.current||form.pending||!editable)return;install({...form,...patch});}
 let candidate='',timingError='';
 if(form?.planned){try{candidate=resolveCampaignTiming({local_time:form.local,time_zone:form.zone,utc_offset:form.offset}).utc;}catch(e){timingError=(e as Error).message;}}
 async function save(retry=false){
  const captured=latest.current;
  if(running.current||!editingRole||!captured||(!retry&&(!editable||configurationChanged||sourceUnverified))||(captured.pending&&!retry))return;
  let command;
  try{command=retry&&captured.pending?CampaignConfigurationInput.parse(JSON.parse(captured.pending.body)):CampaignConfigurationInput.parse({expected_version:captured.base.version,name:captured.name,revision_id:captured.revision,planned_timing:captured.planned?{local_time:captured.local,time_zone:captured.zone,utc_offset:captured.offset}:null,...(captured.audience_id?{audience_snapshot_id:captured.audience_id}:{})});if(command.planned_timing)resolveCampaignTiming(command.planned_timing);}catch(e){setError(e instanceof Error?e.message:'Check the configuration.');return;}
  running.current=true;const generation=++epoch.current,original=captured.pending??{key:crypto.randomUUID(),body:JSON.stringify(command)},locked={...captured,pending:original};
  install(locked);setBusy(true);setError('');setNotice('');let acknowledged=false;
  try{
   const response=await api<{campaign:CampaignView;changed:boolean;notice:string}>(workspace,path+'/configuration','POST',JSON.parse(original.body),undefined,original.key);acknowledged=true;
   if(epoch.current!==generation)return;
   const acknowledgment=CampaignConfigurationView.parse(response.campaign),current=await api<{campaign:CampaignView}>(workspace,path);if(epoch.current!==generation)return;
   const truth=CampaignConfigurationView.parse(current.campaign);setObserved(truth);
   if(truth.version===acknowledgment.version)install(formForCampaign(truth));
   else{const retained={...captured,base:acknowledgment,audience_id:''};delete retained.pending;install(retained);}
   setVerifiedAudience(null);setNotice(response.notice+(truth.version!==acknowledgment.version?' A newer saved configuration exists; this form retains its acknowledged base until explicit reload.':'')+(truth.state!==acknowledgment.state?' Current campaign state: '+truth.state.replaceAll('_',' ')+'. The original receipt does not change it.':''));await onUpdate();
  }catch(e){
   if(epoch.current!==generation)return;setError((e as Error).message);
   if(!acknowledged&&e instanceof ApiError&&e.status<500&&![401,403,408,429].includes(e.status)){const retained={...captured};delete retained.pending;install(retained);}
  }finally{if(epoch.current===generation){running.current=false;setBusy(false);}}
 }
 return <div className="campaign-configuration" data-campaign-configuration={id}>
  <h3>Draft configuration</h3>
  <p className="small muted">Save a content checkpoint, a frozen audience selection and an optional planned time. Scheduling and delivery require separate verified approval.</p>
  {error&&<p className="alert danger" role="alert">{error}</p>}
  {notice&&<p className="small" role="status">{notice}</p>}
  {!persisted&&<p className="alert warning">Browser storage is unavailable. Configuration edits and the original command remain in this tab; leaving requires confirmation while unsaved work remains.</p>}
  {!record&&<p role="status">{busy?'Loading saved configuration…':'Saved configuration is unavailable. Reload before editing.'}</p>}
  {record&&<><p className="small break-word">Configuration v{record.version} · {currentState.replaceAll('_',' ')} · Artifact {record.intent.artifact_hash??'not captured'}</p><p className="small">{record.audience_count} captured matched · {record.eligible_count} captured eligible · {record.excluded_count} captured excluded.</p></>}
  {configurationChanged&&<p className="alert warning" role="status">Saved configuration advanced to v{currentVersion}. This form keeps base v{record!.version} and your edits. Reload saved configuration to replace them before saving.</p>}
  <form onSubmit={e=>{e.preventDefault();void save();}}>
   <fieldset disabled={busy||!!pending||!editable}>
    <legend>Campaign settings</legend>
    <label>Configuration name<input required maxLength={160} value={form?.name??''} onChange={e=>change({name:e.target.value})}/></label>
    <label>Configuration frozen revision<input required maxLength={campaignRevisionTextLimit} value={form?.revision??''} onChange={e=>change({revision:e.target.value})} spellCheck={false}/></label>
    <p className="small muted">Copy a saved checkpoint ID from the email editor. The server verifies ownership and pins its immutable artifact.</p>
    <label className="checkbox-label"><input type="checkbox" checked={form?.planned??false} onChange={e=>change({planned:e.target.checked})}/>Add planned timing</label>
    {form?.planned&&<>
     <label>Planned local minute<input type="datetime-local" required step={60} value={form.local} onChange={e=>change({local:e.target.value})}/></label>
     <label>Planned IANA time zone<input required maxLength={100} value={form.zone} onChange={e=>change({zone:e.target.value})} placeholder="America/New_York"/></label>
     <label>Planned UTC offset<input required maxLength={100} pattern="[+-](0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]" value={form.offset} onChange={e=>change({offset:e.target.value})} placeholder="-04:00"/></label>
     <p className="small muted">Choose the intended offset explicitly for a repeated daylight-saving minute. Nonexistent minutes cannot be saved.</p>
    </>}
   </fieldset>
   <p className="small" data-planned-candidate>{form?.planned?(candidate?'Planned UTC candidate: '+candidate:timingError):'No planned timing.'} No delivery is scheduled.</p>
   <div className="toolbar"><button className="primary" disabled={busy||!!pending||!editable||configurationChanged||!!timingError||sourceUnverified}>Save draft configuration</button></div>
  </form>
  {record&&<AudienceSnapshotSelector key={workspace+':'+id+':'+role} workspace={workspace} role={role} disabled={busy||!!pending||!editable||configurationChanged} value={form!.audience_id} captured={record.audience_snapshot} onChange={audience_id=>{setVerifiedAudience(null);change({audience_id});}} onVerified={setVerifiedAudience}/>}
  {pending&&<p className="small">Acknowledgment is unresolved. Retry the original command or reload saved configuration to replace this form.</p>}
  <div className="toolbar">
   {pending&&<button disabled={busy||!editingRole} onClick={()=>void save(true)}>Retry original configuration</button>}
   <button disabled={busy} onClick={()=>void load(true)}>Reload saved configuration</button>
  </div>
  {!editingRole&&<p className="small muted">Your role can view configuration history.</p>}
  <section className="campaign-configuration-history" aria-label="Configuration history">
   <h4>Observed configuration history ({history.total})</h4>
   {history.error&&<p role="alert" className="alert danger">{history.error}</p>}
   {!history.loaded?<p>{history.busy?'Loading configuration history…':'History could not be loaded.'}</p>:!history.data.length?<p>No observed configuration history.</p>:<ol>{history.data.map(snapshot=><li key={snapshot.id}>
    <strong>v{snapshot.revision_no} · {snapshot.name}</strong>
    <p className="small break-word">{snapshot.captured_at} · {snapshot.origin==='migration_current'?'Observed at migration; earlier history and actor unknown':snapshot.actor_id} · {snapshot.eligible_count}/{snapshot.audience_count} captured eligible · {snapshot.excluded_count} excluded</p>
    {snapshot.audience_snapshot?<p className="small break-word">Audience source {snapshot.audience_snapshot.id} · segment v{snapshot.audience_snapshot.segment_version} · evaluated {snapshot.audience_snapshot.evaluated_at} · digest {snapshot.audience_snapshot.digest}</p>:<p className="small">No saved segment source captured.</p>}
    <p className="small break-word">Revision {snapshot.revision_id} · Artifact {snapshot.artifact_hash??'not captured'}</p>
    <p className="small break-word">{snapshot.planned_timing?`${snapshot.planned_timing.local_time} ${snapshot.planned_timing.time_zone} (${snapshot.planned_timing.utc_offset}) → ${snapshot.planned_timing.utc}`:'No planned timing'} · No delivery scheduled by this configuration.</p>
   </li>)}</ol>}
   <div className="toolbar"><button disabled={history.busy} onClick={()=>void history.reload()}>Refresh configuration history</button>{history.hasMore&&<button disabled={history.busy} onClick={()=>void history.loadMore()}>Load older configurations</button>}</div>
  </section>
 </div>;
}
