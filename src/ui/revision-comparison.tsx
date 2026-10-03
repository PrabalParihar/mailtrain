'use client';
import{useEffect,useLayoutEffect,useRef,useState,useCallback,useMemo}from'react';
import{RevisionComparisonSchema,revisionComparisonRows,type RevisionComparison}from'@/domain/revision-comparison';
import{api,ApiError}from'./api';import{readComparisonSelection,writeComparisonSelection,type ComparisonSelection,type ComparisonScope}from'./revision-comparison-selection';
type Checkpoint={id:string;revision_no:number;subject:string;artifact_hash:string};
const sameUUID=(first:string,second:string)=>first.toLowerCase()===second.toLowerCase();
const empty:ComparisonSelection={before:'',after:'',open:false};
function excerpt(value:string,peer:string,source:boolean){let start=0;if(value.length>8192&&value!==peer){let at=0;while(at<Math.min(value.length,peer.length)&&value[at]===peer[at])at++;start=Math.max(0,Math.min(at,value.length-1)-500);}let sample=value.slice(start,start+8192);if(/[\uD800-\uDBFF]$/.test(sample))sample=sample.slice(0,-1);return{value:source?JSON.stringify(sample).replaceAll('\ufeff','\\ufeff'):sample,partial:start>0||start+sample.length<value.length};}
export function RevisionComparisonPanel({scope,revisions,hasMore,loadMore,pagingBusy}:{scope:ComparisonScope;revisions:Checkpoint[];hasMore:boolean;loadMore:()=>Promise<void>;pagingBusy:boolean}){
 const{workspace,actor,email}=scope;const stableScope=useMemo(()=>({workspace,actor,email}),[workspace,actor,email]);
 const[selection,setSelection]=useState(empty),[loaded,setLoaded]=useState(false),[comparison,setComparison]=useState<RevisionComparison|null>(null),[error,setError]=useState(''),[storageError,setStorageError]=useState(''),[busy,setBusy]=useState(false),[unchanged,setUnchanged]=useState(false);
 const live=useRef(empty),mounted=useRef(false),epoch=useRef(0),running=useRef<{key:string;controller:AbortController}|null>(null),initial=useRef(false);
 useLayoutEffect(()=>{const fence=epoch;mounted.current=true;return()=>{mounted.current=false;fence.current++;running.current?.controller.abort();};},[]);
 const invalidate=()=>{epoch.current++;running.current?.controller.abort();running.current=null;setBusy(false);setComparison(null);setError('');};
 const remember=useCallback((value:ComparisonSelection)=>{live.current=value;setSelection(value);try{writeComparisonSelection(stableScope,value,localStorage);setStorageError('');}catch{setStorageError('Checkpoint selection cannot be saved on this browser. Your current draft recovery is independent.');}},[stableScope]);
 const compare=useCallback(async(value=live.current)=>{
  if(!value.before||!value.after||!mounted.current)return;const key=JSON.stringify([value.before,value.after]);if(running.current?.key===key)return;
  running.current?.controller.abort();const controller=new AbortController(),generation=++epoch.current;running.current={key,controller};setBusy(true);setComparison(null);setError('');
  try{const response=await api<{comparison:RevisionComparison}>(stableScope.workspace,'revision-comparisons?'+new URLSearchParams({email_id:stableScope.email,before:value.before,after:value.after}), 'GET',undefined,undefined,undefined,controller.signal,stableScope.actor);
   if(!mounted.current||generation!==epoch.current)return;
   const receipt=RevisionComparisonSchema.safeParse(response.comparison);if(!receipt.success||!sameUUID(receipt.data.workspace_id,stableScope.workspace)||receipt.data.actor_id!==stableScope.actor||!sameUUID(receipt.data.email_id,stableScope.email)||!sameUUID(receipt.data.before.id,value.before)||!sameUUID(receipt.data.after.id,value.after))throw Error('Invalid comparison receipt');
   setComparison(receipt.data);
  }catch(caught){if(mounted.current&&generation===epoch.current&&!controller.signal.aborted)setError(caught instanceof ApiError?caught.message:'Comparison could not be verified. Retry the selected checkpoints; your draft is preserved.');}
  finally{if(mounted.current&&generation===epoch.current){running.current=null;setBusy(false);}}
 },[stableScope]);
 useEffect(()=>{let active=true;void Promise.resolve().then(()=>{if(!active)return;let restored:ComparisonSelection|null=null;try{restored=readComparisonSelection(stableScope,localStorage);}catch{setStorageError('Checkpoint selection recovery is unavailable. Choose checkpoints again; your current draft recovery is independent.');}if(restored){live.current=restored;setSelection(restored);initial.current=true;if(restored.open)void compare(restored);}setLoaded(true);});return()=>{active=false;};},[compare,stableScope]); // Scope is the parent's immutable React key.
 useEffect(()=>{if(!loaded||initial.current||!revisions.length)return;void Promise.resolve().then(()=>{if(!mounted.current||initial.current)return;initial.current=true;remember({before:revisions[1]?.id??revisions[0].id,after:revisions[0].id,open:live.current.open});});},[loaded,revisions,remember]);
 const rows=comparison?revisionComparisonRows(comparison.before.spec,comparison.after.spec):[],changed=rows.filter(row=>row.changed),visible=unchanged?rows:changed;
 const optionLabel=(id:string)=>{const row=revisions.find(r=>r.id===id)??(comparison?.before.id===id?comparison.before:comparison?.after.id===id?comparison.after:null);return row?'v'+row.revision_no+' · '+('subject'in row?row.subject:row.spec.subject||'No subject'):'Recovered older checkpoint · '+id.slice(0,8);};
 return <section className="revision-comparison" aria-label="Saved checkpoint comparison">
  <button type="button" disabled={!loaded} onClick={()=>{const value={...live.current,open:!live.current.open};invalidate();remember(value);}}>{selection.open?'Close checkpoint comparison':'Open checkpoint comparison'}</button>
  {selection.open&&<><h3>Compare saved checkpoints</h3><p className="small">Read-only comparison. Current edits, save recovery and frozen checkpoints are preserved.</p>
  {!revisions.length&&!selection.before?<p>No saved checkpoints to compare. Create a checkpoint after saving your draft.</p>:<>
  <div className="revision-comparison-selectors">{(['before','after']as const).map(side=><label key={side}>{side==='before'?'Before checkpoint':'After checkpoint'}<select aria-label={side==='before'?'Before checkpoint':'After checkpoint'} value={selection[side]} onChange={event=>{invalidate();remember({...live.current,[side]:event.target.value});}}><option value="">Choose a checkpoint</option>{Array.from(new Set([...revisions.map(r=>r.id),...(selection[side]?[selection[side]]:[])])).map(id=><option key={id} value={id}>{optionLabel(id)}</option>)}</select></label>)}</div>
  {hasMore&&<button type="button" disabled={pagingBusy} onClick={()=>void loadMore()}>Load older comparison checkpoints</button>}
  <button type="button" disabled={!loaded||!selection.before||!selection.after||busy} onClick={()=>void compare()}>{busy?'Comparing checkpoints…':'Compare checkpoints'}</button>
  {busy&&<p role="status">Loading the two saved checkpoints…</p>}{error&&<p role="alert" className="alert danger">{error}</p>}
  {comparison&&<div data-compared-before={comparison.before.id} data-compared-after={comparison.after.id}>
   <p role="status">Compared v{comparison.before.revision_no} → v{comparison.after.revision_no}: {changed.length} authoring changes.</p>
   <div className="revision-comparison-selectors">{(['before','after']as const).map(side=><div key={side}><strong>{side==='before'?'Before':'After'} · v{comparison[side].revision_no}</strong><p className="small break-word">{comparison[side].created_at} · {comparison[side].spec.locale} · {comparison[side].spec.editing_mode==='raw_html'?'Raw HTML':'Structured blocks'}</p><code className="break-word">Artifact {comparison[side].artifact_hash}</code></div>)}</div>
   {comparison.before.artifact_hash!==comparison.after.artifact_hash&&<p className="small">Frozen artifact hashes differ. This view compares stored authoring values; it does not certify rendered or real-client fidelity.</p>}
   <label className="checkbox-label"><input type="checkbox" checked={unchanged} onChange={event=>setUnchanged(event.target.checked)}/> Show unchanged fields</label>
   {!changed.length&&<p>No stored authoring differences between these checkpoints.</p>}
   {(comparison.before.spec.editing_mode==='raw_html'||comparison.after.spec.editing_mode==='raw_html')&&<p className="small">Raw source is literal escaped text. Stored blocks are inactive in raw checkpoints.</p>}
   <ol className="revision-change-list">{visible.map(row=><li key={row.key} data-revision-change={row.key}><h4 className="break-word">{row.label} <span className="badge neutral">{row.kind==='source'?'Literal source':row.kind}</span></h4><div className="revision-comparison-values">{(['before','after']as const).map(side=>{const part=excerpt(row[side],row[side==='before'?'after':'before'],row.kind==='source'),localized=row.kind==='content'||row.key==='subject'||row.key==='preheader';return <div key={side}><strong>{side==='before'?'Before':'After'} · v{comparison[side].revision_no}</strong>{row[side==='before'?'before_present':'after_present']?<pre dir={localized?comparison[side].spec.direction:'ltr'} lang={localized?comparison[side].spec.locale:undefined}>{part.value}</pre>:<p className="small">No stored value.</p>}{part.partial&&<p className="small">Excerpt near the first difference. The full saved value is preserved.</p>}</div>;})}</div></li>)}</ol>
  </div>}
  </>}
  </>}{storageError&&<p role="alert" className="alert warning">{storageError}</p>}
 </section>;
}
