'use client';
import {useEffect,useRef,useState} from 'react';
import {AudienceSnapshotMetadataSchema,type AudienceSnapshotMetadata,type AudienceSnapshotPointer} from '../domain/audience-snapshots';
import {api} from './api';
import {useResourcePage} from './paged';
export function AudienceSnapshotSelector({workspace,role,disabled,value,captured,onChange,onVerified}:{workspace:string;role:string;disabled:boolean;value:string;captured:AudienceSnapshotPointer|null;onChange:(id:string)=>void;onVerified:(id:string|null)=>void}){
 const canChoose=['Owner','Admin'].includes(role),sources=useResourcePage<AudienceSnapshotMetadata>(canChoose?workspace:'','audience-snapshots?limit=5');
 const [metadata,setMetadata]=useState<AudienceSnapshotMetadata|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false);const epoch=useRef(0),running=useRef(false);
 useEffect(()=>{const generation=++epoch.current;queueMicrotask(()=>{if(epoch.current!==generation)return;setMetadata(null);setError('');setBusy(false);running.current=false;onVerified(null);if(!value||!canChoose)return;setBusy(true);running.current=true;void api<{snapshot:AudienceSnapshotMetadata}>(workspace,`audience-snapshots/${value}/metadata`).then(r=>{const source=AudienceSnapshotMetadataSchema.parse(r.snapshot);if(epoch.current===generation){setMetadata(source);onVerified(source.id);}}).catch(e=>{if(epoch.current===generation)setError(e.message);}).finally(()=>{if(epoch.current===generation){setBusy(false);running.current=false;}});});return()=>{epoch.current=generation+1;};},[workspace,value,canChoose,onVerified]);
 async function verify(){if(running.current||!canChoose||disabled||!value)return;const generation=++epoch.current;running.current=true;setBusy(true);setError('');onVerified(null);try{const r=await api<{snapshot:AudienceSnapshotMetadata}>(workspace,`audience-snapshots/${value}/metadata`),source=AudienceSnapshotMetadataSchema.parse(r.snapshot);if(epoch.current===generation){setMetadata(source);onVerified(source.id);}}catch(e){if(epoch.current===generation)setError((e as Error).message);}finally{if(epoch.current===generation){setBusy(false);running.current=false;}}}
 return <section className="campaign-audience-selection" aria-label="Frozen audience source">
  <h4>Frozen audience selection</h4>
  {captured?<div className="small break-word"><p>Captured audience source {captured.id} · segment v{captured.segment_version} · {captured.evaluated_at}</p><p>{captured.matched_count} captured matched · {captured.eligible_count} captured eligible · {captured.matched_count-captured.eligible_count} captured excluded.</p><p>Captured digest {captured.digest}</p></div>:<p className="small">No saved segment source is selected. The campaign retains its existing captured audience.</p>}
  <p className="small muted">Selecting a source copies its immutable captured membership. Current consent and suppression must be checked again before dispatch.</p>
  {!canChoose?<p className="small muted">Your role can view the captured source and counts. Owner or Admin access is required to choose a frozen audience.</p>:<>
   {sources.error&&<p className="alert danger" role="alert">{sources.error}</p>}
   {!sources.loaded?<p role="status">{sources.busy?'Loading frozen audience metadata…':'Frozen audience metadata is unavailable.'}</p>:!sources.data.length?<p>No frozen selections are available.</p>:null}
   <label>Frozen audience selection<select aria-label="Frozen audience selection" value={value} disabled={disabled||busy||!sources.loaded} onChange={e=>{onVerified(null);onChange(e.target.value);}}><option value="">Keep captured audience</option>
   {captured&&!sources.data.some(s=>s.id===captured.id)&&<option value={captured.id}>Captured source outside this page · {captured.id}</option>}
   {value&&value!==captured?.id&&!sources.data.some(s=>s.id===value)&&<option value={value}>Working source outside this page · {value}</option>}
   {sources.data.map(source=><option key={source.id} value={source.id}>{source.segment_name} · v{source.segment_version} · {source.id}</option>)}</select></label>
   <div className="toolbar"><button disabled={sources.busy||disabled} onClick={()=>void sources.reload()}>Refresh frozen selections</button>{sources.hasMore&&<button disabled={sources.busy||disabled} onClick={()=>void sources.loadMore()}>Load older frozen selections</button>}</div>
   <label>Frozen audience snapshot ID<input aria-label="Frozen audience snapshot ID" value={value} maxLength={36} disabled={disabled} spellCheck={false} onChange={e=>{onVerified(null);onChange(e.target.value);}}/></label>
   <button disabled={disabled||busy||!value} onClick={()=>void verify()}>Verify frozen audience ID</button>
   {error&&<p className="alert danger" role="alert">{error}</p>}
   {value&&!metadata&&<p className="small">Verify this frozen source before saving its selection.</p>}
   {metadata&&metadata.id===value&&<div className="small break-word"><p role="status">Frozen audience verified.</p><p>{metadata.segment_name} · v{metadata.segment_version} · {metadata.matched_count} matched · {metadata.eligible_count} captured eligible · {metadata.excluded_count} excluded · {metadata.evaluated_at}</p><p>Source digest {metadata.digest}</p></div>}
  </>}
 </section>;
}
