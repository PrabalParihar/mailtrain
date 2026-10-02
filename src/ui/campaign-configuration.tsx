'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { CampaignConfigurationInput, resolveCampaignTiming, type CampaignConfigurationData, type CampaignConfigurationSnapshotData, type ResolvedCampaignTiming } from '../domain/campaign-configuration';
import { api, ApiError } from './api';
import { useResourcePage } from './paged';
type Campaign = { id:string; name:string; version:number; revision_id:string; state:string; intent:{artifact_hash?:string|null; planned_timing?:ResolvedCampaignTiming|null} };
export function CampaignConfiguration({workspace,id,role,savedState,savedVersion,onUpdate}:{workspace:string;id:string;role:string;savedState:string;savedVersion:number;onUpdate:()=>Promise<void>}) {
 const [record,setRecord]=useState<Campaign|null>(null),[name,setName]=useState(''),[revision,setRevision]=useState(''),[planned,setPlanned]=useState(false),[local,setLocal]=useState(''),[zone,setZone]=useState('UTC'),[offset,setOffset]=useState('+00:00');
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState(''),[pending,setPending]=useState<CampaignConfigurationData|null>(null);
 const epoch=useRef(0),running=useRef(false),pendingCommand=useRef<CampaignConfigurationData|null>(null),pendingKey=useRef<string|null>(null);
 const path='campaigns/'+id,history=useResourcePage<CampaignConfigurationSnapshotData>(workspace,path+'/configurations?limit=5',String(record?.version??0));
 // Lifecycle-only actions do not advance the configuration version. Keep the
 // form's captured base/settings, while conservatively applying observed state.
 let currentState=record?.state??savedState;
 if(savedVersion>(record?.version??0))currentState=savedState;
 else if(record&&savedVersion===record.version){
  if(!['draft','review_pending'].includes(savedState))currentState=savedState;
  else if(['draft','review_pending'].includes(record.state))currentState=savedState==='review_pending'||record.state==='review_pending'?'review_pending':'draft';
 }
 const configurationChanged=!!record&&savedVersion>record.version;
 const editingRole=['Owner','Admin','Editor'].includes(role);
 const editable=editingRole&&!!record&&['draft','review_pending'].includes(currentState);
 const hydrate=useCallback((campaign:Campaign)=>{setRecord(campaign);setName(campaign.name);setRevision(campaign.revision_id);const timing=campaign.intent.planned_timing;setPlanned(!!timing);setLocal(timing?.local_time??'');setZone(timing?.time_zone??'UTC');setOffset(timing?.utc_offset??'+00:00');},[]);
 const reload=useCallback(async()=>{
  if(running.current)return;running.current=true;const generation=++epoch.current;setBusy(true);setError('');
  try{const response=await api<{campaign:Campaign}>(workspace,path);if(epoch.current!==generation)return;hydrate(response.campaign);pendingCommand.current=null;pendingKey.current=null;setPending(null);setNotice('Saved configuration loaded. Unsaved form edits were replaced.');}
  catch(e){if(epoch.current===generation)setError((e as Error).message);}
  finally{if(epoch.current===generation){running.current=false;setBusy(false);}}
 },[workspace,path,hydrate]);
 useEffect(()=>{let active=true;void Promise.resolve().then(()=>{if(active)void reload();});const fence=epoch;return()=>{active=false;fence.current++;};},[reload]);
 let candidate='',timingError='';
 if(planned){try{candidate=resolveCampaignTiming({local_time:local,time_zone:zone,utc_offset:offset}).utc;}catch(e){timingError=(e as Error).message;}}
 async function save(retry=false){
  if(running.current||!editingRole||!record||(!retry&&!editable)||(!retry&&configurationChanged)||(pendingCommand.current&&!retry))return;
  let command=retry?pendingCommand.current:null;
  if(!command){try{command=CampaignConfigurationInput.parse({expected_version:record!.version,name,revision_id:revision,planned_timing:planned?{local_time:local,time_zone:zone,utc_offset:offset}:null});if(command.planned_timing)resolveCampaignTiming(command.planned_timing);}catch(e){setError(e instanceof Error?e.message:'Check the configuration.');return;}}
  running.current=true;const generation=++epoch.current;pendingCommand.current=command;pendingKey.current??=crypto.randomUUID();setPending(command);setBusy(true);setError('');setNotice('');let acknowledged=false;
  try{
   const response=await api<{campaign:Campaign;changed:boolean;notice:string}>(workspace,path+'/configuration','POST',command,undefined,pendingKey.current);acknowledged=true;
   if(epoch.current!==generation)return;
   // A replay acknowledges its original version. Read current truth before unlocking edits.
   const current=await api<{campaign:Campaign}>(workspace,path);if(epoch.current!==generation)return;
   hydrate(current.campaign);pendingCommand.current=null;pendingKey.current=null;setPending(null);setNotice(response.notice+(current.campaign.version!==response.campaign.version?' A newer saved configuration is now displayed.':'')+(current.campaign.state!==response.campaign.state?' Current campaign state: '+current.campaign.state.replaceAll('_',' ')+'. The original receipt does not change it.':''));await onUpdate();
  }catch(e){if(epoch.current!==generation)return;setError((e as Error).message);if(!acknowledged&&e instanceof ApiError&&e.status<500){pendingCommand.current=null;pendingKey.current=null;setPending(null);}}
  finally{if(epoch.current===generation){running.current=false;setBusy(false);}}
 }
 return <div className="campaign-configuration" data-campaign-configuration={id}>
  <h3>Draft configuration</h3>
  <p className="small muted">Save a content checkpoint and an optional planned time. Scheduling and delivery require separate verified approval.</p>
  {error&&<p className="alert danger" role="alert">{error}</p>}
  {notice&&<p className="small" role="status">{notice}</p>}
  {!record&&<p role="status">{busy?'Loading saved configuration…':'Saved configuration is unavailable. Reload before editing.'}</p>}
  {record&&<p className="small break-word">Configuration v{record.version} · {currentState.replaceAll('_',' ')} · Artifact {record.intent.artifact_hash??'not captured'}</p>}
  {configurationChanged&&<p className="alert warning" role="status">Saved configuration advanced to v{savedVersion}. This form keeps base v{record!.version} and your edits. Reload saved configuration to replace them before saving.</p>}
  <form onSubmit={e=>{e.preventDefault();void save();}}>
   <fieldset disabled={busy||!!pending||!editable}>
    <legend>Campaign settings</legend>
    <label>Configuration name<input required maxLength={160} value={name} onChange={e=>setName(e.target.value)}/></label>
    <label>Configuration frozen revision<input required value={revision} onChange={e=>setRevision(e.target.value)} spellCheck={false}/></label>
    <p className="small muted">Copy a saved checkpoint ID from the email editor. The server verifies ownership and pins its immutable artifact.</p>
    <label className="checkbox-label"><input type="checkbox" checked={planned} onChange={e=>setPlanned(e.target.checked)}/>Add planned timing</label>
    {planned&&<>
     <label>Planned local minute<input type="datetime-local" required step={60} value={local} onChange={e=>setLocal(e.target.value)}/></label>
     <label>Planned IANA time zone<input required maxLength={100} value={zone} onChange={e=>setZone(e.target.value)} placeholder="America/New_York"/></label>
     <label>Planned UTC offset<input required pattern="[+-](0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]" value={offset} onChange={e=>setOffset(e.target.value)} placeholder="-04:00"/></label>
     <p className="small muted">Choose the intended offset explicitly for a repeated daylight-saving minute. Nonexistent minutes cannot be saved.</p>
    </>}
   </fieldset>
   <p className="small" data-planned-candidate>{planned?(candidate?'Planned UTC candidate: '+candidate:timingError):'No planned timing.'} No delivery is scheduled.</p>
   <div className="toolbar"><button className="primary" disabled={busy||!!pending||!editable||configurationChanged||!!timingError}>Save draft configuration</button></div>
  </form>
  {pending&&<p className="small">Acknowledgment is unresolved. Retry the original command or reload saved configuration to replace this form.</p>}
  <div className="toolbar">
   {pending&&<button disabled={busy||!editingRole} onClick={()=>void save(true)}>Retry original configuration</button>}
   <button disabled={busy} onClick={()=>void reload()}>Reload saved configuration</button>
  </div>
  {!['Owner','Admin','Editor'].includes(role)&&<p className="small muted">Your role can view configuration history.</p>}
  <section className="campaign-configuration-history" aria-label="Configuration history">
   <h4>Observed configuration history ({history.total})</h4>
   {history.error&&<p role="alert" className="alert danger">{history.error}</p>}
   {!history.loaded?<p>{history.busy?'Loading configuration history…':'History could not be loaded.'}</p>:!history.data.length?<p>No observed configuration history.</p>:<ol>{history.data.map(snapshot=><li key={snapshot.id}>
    <strong>v{snapshot.revision_no} · {snapshot.name}</strong>
    <p className="small break-word">{snapshot.captured_at} · {snapshot.origin==='migration_current'?'Observed at migration; earlier history and actor unknown':snapshot.actor_id} · {snapshot.eligible_count}/{snapshot.audience_count} captured eligible</p>
    <p className="small break-word">Revision {snapshot.revision_id} · Artifact {snapshot.artifact_hash??'not captured'}</p>
    <p className="small break-word">{snapshot.planned_timing?`${snapshot.planned_timing.local_time} ${snapshot.planned_timing.time_zone} (${snapshot.planned_timing.utc_offset}) → ${snapshot.planned_timing.utc}`:'No planned timing'} · No delivery scheduled by this configuration.</p>
   </li>)}</ol>}
   <div className="toolbar"><button disabled={history.busy} onClick={()=>void history.reload()}>Refresh configuration history</button>{history.hasMore&&<button disabled={history.busy} onClick={()=>void history.loadMore()}>Load older configurations</button>}</div>
  </section>
 </div>;
}
