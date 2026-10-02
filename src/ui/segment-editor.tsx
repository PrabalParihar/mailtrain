'use client';
import { useEffect, useRef, useState } from 'react';
import { ApiError, api } from './api';
import { workingFromRule, workingToRule } from '../domain/segment-working';
import { defaultWorkingRule, RuleBuilder, type SegmentField, type SegmentNamed } from './segment-rule-builder';
import { normalizeSavedRule, readSegmentRecovery, rememberSegmentRecovery, type SegmentRecovery } from './segment-working-recovery';
import type { Rule } from '../domain/segments';
type Catalog={fields:SegmentField[];lists:SegmentNamed[];tags:SegmentNamed[];segments:(SegmentNamed&{current_version:number})[];engagement_status:string};
type Saved={id:string;name:string;current_version:number;rule:Rule};
type Counts={evaluated_at:string;matched_count:number;eligible_count:number;excluded_count:number;segment_version:number};
const empty=():SegmentRecovery=>({segment_id:null,base_version:0,saved_fingerprint:null,name:'',root:defaultWorkingRule()});
function isDirty(r:SegmentRecovery){return r.segment_id?JSON.stringify(r.root)!==JSON.stringify(workingFromRule(normalizeSavedRule(JSON.parse(r.saved_fingerprint!)))):r.name!==''||JSON.stringify(r.root)!==JSON.stringify(defaultWorkingRule());}
export function SegmentEditor({workspace,role,catalog,onCatalogUpdate}:{workspace:string;role:string;catalog:Catalog;onCatalogUpdate:()=>Promise<void>}) {
  const [form,setForm]=useState<SegmentRecovery>(empty),[ready,setReady]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState(''),[persisted,setPersisted]=useState(true),[observed,setObserved]=useState<Saved|null>(null),[verified,setVerified]=useState(false),[preview,setPreview]=useState<Counts|null>(null),[snapshot,setSnapshot]=useState<(Counts&{id:string;digest:string})|null>(null);
  const epoch=useRef(0),running=useRef(false),latest=useRef(form);
  const editable=role==='Owner'||role==='Admin';
  const dirty=isDirty(form),stale=!!form.segment_id&&!!observed&&(form.base_version!==observed.current_version||form.saved_fingerprint!==JSON.stringify(observed.rule));
  let rule:Rule|undefined,invalid='';try{rule=workingToRule(form.root,catalog.fields);}catch(e){invalid=(e as Error).message;}
  const writable=ready&&editable&&!busy&&!form.pending&&(!form.segment_id||verified);
  const sourceReady=writable&&!!form.segment_id&&!dirty&&!stale;
  const current=(n:number)=>epoch.current===n;
  function install(next:SegmentRecovery){latest.current=next;setPersisted(rememberSegmentRecovery(workspace,next,isDirty(next)||!!next.pending));setForm(next);}
  async function read(id:string,n:number){if(current(n))setVerified(false);const r=await api<{segment:Saved}>(workspace,'segments/'+id);const saved={...r.segment,rule:normalizeSavedRule(r.segment.rule)};if(current(n)){setObserved(saved);setVerified(true);}return saved;}
  useEffect(()=>{
    const n=++epoch.current;running.current=false;
    queueMicrotask(()=>{if(!current(n))return;const recovery=readSegmentRecovery(workspace),record=recovery.record??empty();latest.current=record;
      setForm(record);setPersisted(recovery.persisted);setReady(true);setVerified(!record.segment_id);setObserved(null);setPreview(null);setSnapshot(null);setError('');setNotice(isDirty(record)?'Unapplied segment edits recovered.':record.pending?'An unresolved segment command was recovered.':'');
      if(record.segment_id)void read(record.segment_id,n).catch(e=>{if(current(n))setError(e.message);});
    });
    return()=>{epoch.current=n+1;};
    // The controller is scoped by workspace and current role; catalog updates must not replace working input.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[workspace,role]);
  async function action(fn:(n:number)=>Promise<void>){if(running.current)return;running.current=true;const n=epoch.current;setBusy(true);setError('');setNotice('');try{await fn(n);}catch(e){if(current(n))setError((e as Error).message);}finally{if(current(n)){running.current=false;setBusy(false);}}}
  async function load(id:string,n:number){setVerified(false);setPreview(null);setSnapshot(null);const saved=await read(id,n);if(current(n)){install({segment_id:saved.id,base_version:saved.current_version,saved_fingerprint:JSON.stringify(saved.rule),name:saved.name,root:workingFromRule(saved.rule)});setNotice('Saved segment loaded.');}}
  async function command(record:SegmentRecovery,n:number){const pending=record.pending!;
    let response:{segment?:Saved;snapshot?:Counts&{id:string;digest:string}};
    try{response=await api(workspace,pending.path,'POST',JSON.parse(pending.body),undefined,pending.key);}catch(e){
      if(current(n)&&e instanceof ApiError&&e.status<500&&![401,403,408,429].includes(e.status)){
        const retained={...record};delete retained.pending;install(retained);
        if(record.segment_id)await read(record.segment_id,n).catch(()=>{if(current(n))setVerified(false);});
      }throw e;
    }
    if(!current(n))return;
    if(pending.kind==='freeze'){
      const frozen=response.snapshot;if(!frozen)throw new Error('Missing freeze receipt; original command is retained.');
      // Keep only public metadata in the UI. Frozen member rows never enter local recovery.
      setSnapshot({id:frozen.id,digest:frozen.digest,evaluated_at:frozen.evaluated_at,matched_count:frozen.matched_count,eligible_count:frozen.eligible_count,excluded_count:frozen.matched_count-frozen.eligible_count,segment_version:frozen.segment_version});
      const retained={...record};delete retained.pending;install(retained);setNotice('Selection frozen · v'+frozen.segment_version);
      await read(record.segment_id!,n);return;
    }
    const ack=response.segment;if(!ack)throw new Error('Missing save receipt; original command is retained.');
    // A receipt acknowledges the original write. A fresh read determines what is saved now.
    const saved=await read(ack.id,n);if(!current(n))return;
    const acknowledged=normalizeSavedRule(ack.rule);
    const retained:SegmentRecovery={...record,segment_id:ack.id,base_version:ack.current_version,saved_fingerprint:JSON.stringify(acknowledged),name:ack.name};delete retained.pending;
    if(saved.current_version===ack.current_version&&JSON.stringify(saved.rule)===JSON.stringify(acknowledged))retained.root=workingFromRule(saved.rule);
    install(retained);setPreview(null);setSnapshot(null);setNotice(pending.kind==='create'?'Segment created.':'Segment version saved.');await onCatalogUpdate();
  }
  function start(kind:'create'|'version'|'freeze'){
    if(running.current||latest.current.pending||!editable||!writable||!rule||((kind==='freeze')&&!sourceReady))return;
    const record=latest.current,path=kind==='create'?'segments':`segments/${record.segment_id}/${kind==='version'?'versions':'snapshots'}`;
    const body=kind==='create'?{name:record.name,rule}:kind==='version'?{expected_version:record.base_version,rule}:{expected_version:record.base_version};
    const next={...record,pending:{kind,path,key:crypto.randomUUID(),body:JSON.stringify(body),source_id:record.segment_id,source_version:record.base_version}};
    install(next);void action(n=>command(next,n));
  }
  return <section className="panel audience-segments" aria-label="Segments and frozen selections"><h2>Segments & frozen selections</h2>
    <p className="muted">Build a saved selection, then preview or freeze that exact version. Counts respect current permission and blocks.</p>
    {error&&<p className="alert danger" role="alert">{error}</p>}{notice&&<p className="alert success" role="status">{notice}</p>}
    {!persisted&&<p className="alert warning">Browser storage is unavailable. Working edits are retained in this tab; leaving the page requires confirmation while unsaved work remains.</p>}
    {!editable&&<p className="alert warning">Owner or Admin access is required to manage audience selections.</p>}
    <label>Saved segment<select aria-label="Saved segment" value={form.segment_id??''} disabled={!ready||busy||!!form.pending||dirty||!editable} onChange={e=>{if(e.target.value)void action(n=>load(e.target.value,n));else{install(empty());setObserved(null);setVerified(true);}}}><option value="">New segment</option>{form.segment_id&&!catalog.segments.some(s=>s.id===form.segment_id)&&<option value={form.segment_id}>{form.name} · outside this catalog</option>}{catalog.segments.map(s=><option key={s.id} value={s.id}>{s.name} · v{s.current_version}</option>)}</select></label>
    <div className="button-row"><button disabled={!editable||busy||!!form.pending} onClick={()=>{install(empty());setObserved(null);setVerified(true);setPreview(null);setSnapshot(null);setNotice('New segment form.');}}>New segment (replace working rule)</button>
    {form.segment_id&&<button disabled={!editable||busy||!!form.pending} onClick={()=>void action(n=>load(form.segment_id!,n))}>Reload saved segment (replace working rule)</button>}</div>
    <label>Segment name<input aria-label="Segment name" maxLength={100} value={form.name} readOnly={!!form.segment_id} disabled={!writable} onChange={e=>install({...form,name:e.target.value})}/></label>
    {form.segment_id&&<p className="small">Working base v{form.base_version}{observed?` · current saved v${observed.current_version}`:' · checking saved source'}</p>}
    {stale&&<p className="alert warning">The saved segment changed. Working input is preserved; explicitly reload to replace it before using the current version.</p>}
    {dirty&&<p className="alert warning">Unapplied edits. Preview and freeze use a saved version and remain blocked until these edits are saved or explicitly replaced.</p>}
    <RuleBuilder value={form.root} fields={catalog.fields} lists={catalog.lists} tags={catalog.tags} disabled={!writable} onChange={root=>{install({...form,root});setPreview(null);setSnapshot(null);}}/>
    {invalid&&<p className="alert warning" role="status">{invalid}</p>}
    <p className="small muted">{catalog.engagement_status}</p>
    <div className="button-row"><button disabled={!writable||!rule||stale||(!form.segment_id&&!form.name.trim())||!!form.segment_id&&!dirty} onClick={()=>start(form.segment_id?'version':'create')}>{form.segment_id?'Save new segment version':'Create segment'}</button>
    <button disabled={!sourceReady} onClick={()=>void action(async n=>{const r=await api<{preview:Counts}>(workspace,`segments/${form.segment_id}/preview`,'POST',{expected_version:form.base_version});if(current(n))setPreview(r.preview);})}>Preview saved segment</button>
    <button disabled={!sourceReady} onClick={()=>start('freeze')}>Freeze saved selection</button>
    {form.pending&&<button disabled={!editable||busy} onClick={()=>void action(n=>command(latest.current,n))}>Retry original segment command</button>}</div>
    {form.pending&&<p className="alert warning">A command has not been reconciled. Its exact source, request and key are retained; retry the original command before editing.</p>}
    {preview&&<p role="status">Matched {preview.matched_count} · eligible {preview.eligible_count} · excluded {preview.excluded_count} · v{preview.segment_version} · {preview.evaluated_at}</p>}
    {snapshot&&<div className="alert success"><p>Frozen selection {snapshot.id} · v{snapshot.segment_version}</p><p>{snapshot.matched_count} matched · {snapshot.eligible_count} eligible. Permission must be checked again before dispatch.</p><p className="small break-word">Digest {snapshot.digest}</p></div>}
  </section>;
}
