'use client';
import {useLayoutEffect,useMemo,useRef,useState} from 'react';
import {api,ApiError} from './api';
import {checkedConflictDocument,conflictComparisonIdentity,conflictExcerpt,saveConflictRows,type ConflictDocument,type ConflictScope} from '@/domain/save-conflict-comparison';
type Anchor={localIdentity:string;initialIdentity:string};
type Pair=Anchor & {local:ConflictDocument;server:ConflictDocument;serverIdentity:string};
function downloadValue(value:string,side:'before'|'after'){
 const url=URL.createObjectURL(new Blob([value],{type:'text/plain;charset=utf-8'})),link=window.document.createElement('a');link.href=url;link.download='lettercape-compared-'+(side==='before'?'local':'server')+'.txt';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
export function SaveConflictComparison({scope,local,server}:{scope:ConflictScope;local:ConflictDocument;server:ConflictDocument}){
 const localIdentity=conflictComparisonIdentity(scope,local),initialIdentity=conflictComparisonIdentity(scope,server);
 const admitted=useMemo(()=>{try{return checkedConflictDocument(server,scope.email,scope.workspace);}catch{return null;}},[server,scope.email,scope.workspace]);
 const [open,setOpen]=useState(false),[pair,setPair]=useState<Pair|null>(null),[fetched,setFetched]=useState<{initialIdentity:string;doc:ConflictDocument}|null>(null),[busy,setBusy]=useState<Anchor|null>(null),[error,setError]=useState(''),[unchanged,setUnchanged]=useState(false),[page,setPage]=useState(0);
 const mounted=useRef(false),epoch=useRef(0),running=useRef<AbortController|null>(null),current=useRef<Anchor>({localIdentity,initialIdentity});
 useLayoutEffect(()=>{const fence=epoch;mounted.current=true;return()=>{mounted.current=false;fence.current++;running.current?.abort();};},[]);
 useLayoutEffect(()=>{
  current.current={localIdentity,initialIdentity};const generation=++epoch.current;running.current?.abort();running.current=null;
  queueMicrotask(()=>{if(mounted.current&&epoch.current===generation&&!running.current)setBusy(null);});
 },[localIdentity,initialIdentity]);
 const head=fetched?.initialIdentity===initialIdentity?fetched.doc:admitted,headIdentity=head?conflictComparisonIdentity(scope,head):'';
 const valid=!!pair&&pair.localIdentity===localIdentity&&pair.initialIdentity===initialIdentity&&pair.serverIdentity===headIdentity;
 const pending=!!busy&&busy.localIdentity===localIdentity&&busy.initialIdentity===initialIdentity;
 const capture=(remote=head)=>{if(!remote)return;setPair({local:structuredClone(local),server:structuredClone(remote),localIdentity,initialIdentity,serverIdentity:conflictComparisonIdentity(scope,remote)});setPage(0);setError('');};
 const close=()=>{epoch.current++;running.current?.abort();running.current=null;setBusy(null);setOpen(false);setPair(null);setError('');};
 const refresh=async()=>{
  if(running.current||!mounted.current)return;const controller=new AbortController(),generation=++epoch.current,anchor={localIdentity,initialIdentity};running.current=controller;setBusy(anchor);setError('');
  const matches=()=>mounted.current&&generation===epoch.current&&!controller.signal.aborted&&current.current.localIdentity===anchor.localIdentity&&current.current.initialIdentity===anchor.initialIdentity;
  try{
   const response=await api<{email:unknown}>(scope.workspace,'emails/'+scope.email,'GET',undefined,undefined,undefined,controller.signal,scope.actor);
   if(!matches())return;const fresh=checkedConflictDocument(response.email,scope.email,scope.workspace);if(head&&fresh.doc_version<head.doc_version)throw Error('The server returned an older document version.');
   setFetched({initialIdentity,doc:fresh});capture(fresh);
  }catch(caught){if(matches())setError(caught instanceof ApiError?caught.message:'Server refresh could not be verified. Your draft and current comparison are preserved.');}
  finally{if(matches()){running.current=null;setBusy(null);}}
 };
 const rows=valid?saveConflictRows(pair!.local,pair!.server):[],changed=rows.filter(row=>row.changed),visible=unchanged?rows:changed,pages=Math.max(1,Math.ceil(visible.length/50)),position=Math.min(page,pages-1),shown=visible.slice(position*50,(position+1)*50);
 return <section className="revision-comparison" aria-label="Draft and server comparison">
  <button type="button" disabled={!head} onClick={()=>{if(open)close();else{setOpen(true);capture();}}}>{open?'Close draft comparison':'Compare draft and server'}</button>
  {!head&&<p role="alert" className="alert danger">The conflict document could not be verified. Refresh before comparing; your local work is preserved.</p>}
  {(open||!head)&&<><button type="button" disabled={pending} onClick={()=>void refresh()}>{pending?'Refreshing server…':'Refresh server comparison'}</button>{pending&&<p role="status">Reading the latest server document…</p>}{error&&<p role="alert" className="alert danger">{error}</p>}</>}
  {open&&<><h3>Compare your draft and the server</h3><p>Read-only authoring comparison. Comparing does not save or replace either document. Your original save command and local recovery remain preserved.</p>
   {!valid?<><p role="status">Your draft or conflict changed. Compare again to use the current local work.</p><button type="button" disabled={pending||!head} onClick={()=>capture()}>Compare current draft</button></>:<>
    <p role="status">{changed.length?changed.length+' authoring differences.':'No authoring differences between this draft and the captured server document.'}</p>
    <div className="revision-comparison-selectors"><div><strong>Unsaved local draft</strong><p>Based on document v{pair!.local.doc_version}. No checkpoint is created.</p></div><div><strong>Captured server · v{pair!.server.doc_version}</strong><p>A later server change appears only after Refresh server comparison.</p></div></div>
    <label className="checkbox-label"><input type="checkbox" checked={unchanged} onChange={event=>{setUnchanged(event.target.checked);setPage(0);}}/> Show unchanged draft fields</label>
    <p className="small">All differing fields are available in pages of 50. Each value shows at most 8,192 source characters near the first difference; literal escapes can expand the display. Full values remain in the draft and captured server document. This does not certify rendered or real-client fidelity.</p>
    {!!visible.length&&<p role="status">Showing fields {position*50+1}–{Math.min((position+1)*50,visible.length)} of {visible.length}.</p>}
    {pages>1&&<div className="field-row"><button type="button" disabled={!position} onClick={()=>setPage(position-1)}>Previous draft fields</button><span>Page {position+1} of {pages}</span><button type="button" disabled={position===pages-1} onClick={()=>setPage(position+1)}>Next draft fields</button></div>}
    <ol className="revision-change-list" start={position*50+1}>{shown.map(row=><li key={row.key} data-conflict-change={row.key}><h4 className="break-word">{row.label} <span className="badge neutral">{row.kind==='source'?'Literal source':row.kind}</span></h4><div className="revision-comparison-values">{(['before','after'] as const).map(side=>{
     const document=side==='before'?pair!.local:pair!.server,part=conflictExcerpt(row[side],row[side==='before'?'after':'before'],row.kind==='source'),localized=row.kind==='content'||row.key==='subject'||row.key==='preheader';
     return <div key={side}><strong>{side==='before'?'Unsaved local draft':'Captured server · v'+document.doc_version}</strong>{row[side==='before'?'before_present':'after_present']?<pre tabIndex={part.partial?0:undefined} dir={localized?document.spec.direction:'ltr'} lang={localized?document.spec.locale:undefined}>{part.value}</pre>:<p className="small">No stored value.</p>}{part.partial&&<><p className="small">Excerpt near the first difference; this display omits part of the full retained value.</p><button type="button" onClick={()=>downloadValue(row[side],side)}>Download full {side==='before'?'local':'server'} value</button><p className="small">UTF-8 text of this compared field; not a rendered email.</p></>}</div>;
    })}</div></li>)}</ol>
   </>}
  </>}
 </section>;
}
