'use client';
import {useLayoutEffect,useRef,useState} from 'react';
import {api} from './api';
import {LocaleComparisonSchema,localeComparisonRows,applyLocaleSourceSelection,type LocaleComparison} from '@/domain/locale-source-comparison';
import {canonicalSpecString} from '@/domain/email-source-values';
import type {EmailSpec} from '@/domain/email-schema';

export function LocaleSourceComparison({workspace,email,actor,spec,version,canEdit,blocked,onApply}:{workspace:string;email:string;actor:string;spec:EmailSpec;version:number;canEdit:boolean;blocked:boolean;onApply:(next:EmailSpec,expected:string)=>string|null}){
 const token=canonicalSpecString([workspace,email,actor,version,canEdit,spec]);
 const runtime=useRef({token,generation:0,running:false,controller:null as AbortController|null});
 const[comparison,setComparison]=useState<{token:string;data:LocaleComparison}|null>(null),[selected,setSelected]=useState<string[]>([]),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState<{token:string;text:string}|null>(null);
 useLayoutEffect(()=>{const state=runtime.current;state.token=token;const epoch=++state.generation;state.running=false;state.controller?.abort();state.controller=null;void Promise.resolve().then(()=>{if(state.generation!==epoch)return;setComparison(null);setSelected([]);setBusy(false);setError('');setNotice(n=>n?.token===token?n:null);});return()=>{state.generation++;state.controller?.abort();};},[token]);
 const active=comparison?.token===token?comparison.data:null;
 const rows=active?localeComparisonRows(active.baseline.spec,active.parent.spec,spec):[];
 async function request(signal:AbortSignal){const response=await api<{comparison:unknown}>(workspace,'emails/'+email+'/locale-source','GET',undefined,undefined,undefined,signal,actor);const value=LocaleComparisonSchema.parse(response.comparison);if(value.workspace_id!==workspace||value.actor_id!==actor||value.child_id!==email||value.target.doc_version!==version)throw Error('The saved locale draft changed. Reload the draft before comparing again.');return value;}
 async function run(apply:boolean){
  const state=runtime.current;if(state.running||blocked||apply&&(!canEdit||!active||!selected.length))return;
  state.running=true;setBusy(true);setError('');const epoch=++state.generation,captured=active,keys=[...selected],local=canonicalSpecString(spec),abort=new AbortController();state.controller=abort;
  const owns=()=>state.generation===epoch&&state.token===token&&!abort.signal.aborted;
  try{
   const fresh=await request(abort.signal);if(!owns())return;
   if(apply){
    if(!captured||canonicalSpecString(fresh)!==canonicalSpecString(captured)){setComparison(null);setSelected([]);throw Error('The parent or saved locale draft changed. Local translations are preserved; compare the current source again.');}
    const next=applyLocaleSourceSelection(fresh.baseline.spec,fresh.parent.spec,spec,keys);const refused=onApply(next,local);if(refused)throw Error(refused);
    const nextToken=canonicalSpecString([workspace,email,actor,version,canEdit,next]);setNotice({token:nextToken,text:'Selected source text copied into the draft. It is untranslated; translate and review it. Check the save status above.'});
   }else{setComparison({token,data:fresh});setSelected([]);setNotice(null);}
  }catch(e){if(owns()){setComparison(null);setSelected([]);setError(e instanceof Error?e.message:'Source comparison is unavailable. Your draft is preserved.');}}
  finally{if(owns()){state.running=false;setBusy(false);state.controller=null;}}
 }
 return <section className="panel locale-comparison" aria-label="Locale source comparison">
  <h2>Compare locale source</h2>
  <p>Compare the original frozen source, current parent draft and this local language draft. Copy only the text fields you choose. Copied source text still needs translation and language review. Prices, links, images, layout and legal content require separate review.</p>
  <button type="button" disabled={busy||blocked} onClick={()=>void run(false)}>{active?'Refresh source comparison':'Compare current source'}</button>
  {busy&&<p role="status">{active?'Checking current source before applying…':'Loading source comparison…'}</p>}
  {error&&<p role="alert" className="alert danger">{error}</p>}
  {notice?.token===token&&<p role="status">{notice.text}</p>}
  {active&&<>
   <p>Original parent checkpoint {active.baseline.revision_no} · current parent draft v{active.parent.doc_version} · locale saved v{version}. The target column includes your local edits. Source {active.source_status==='current'?'current':active.source_status==='outdated'?'changed':'freshness unknown'}; language review remains required.</p>
   {!rows.some(r=>r.changed)&&<p role="status">No source text or block change since the original checkpoint.</p>}
   <div className="locale-comparison-rows">{rows.map(row=><article key={row.key} className="locale-comparison-row">
    <h3>{row.label}{row.changed?' · Source changed':''}</h3>
    {canEdit&&row.selectable&&<label className="checkbox-label"><input type="checkbox" aria-label={'Copy source '+row.label} disabled={busy||blocked} checked={selected.includes(row.key)} onChange={e=>setSelected(keys=>e.target.checked?[...keys,row.key]:keys.filter(k=>k!==row.key))}/>Copy this source text (untranslated)</label>}
    <div className="locale-comparison-columns">{[['Original source',row.original],['Current source',row.source],['Local language draft',row.target]].map(([label,text])=><div key={label}><h4>{label}</h4><pre dir="auto">{text}</pre></div>)}</div>
   </article>)}</div>
   {canEdit?<button type="button" disabled={busy||blocked||!selected.length} onClick={()=>void run(true)}>Copy selected source text to draft</button>:<p>Your role can compare this draft. Editing requires an Editor, Admin or Owner.</p>}
   <p className="small muted">Comparison and copying do not translate or approve this draft, advance its original source lineage, or mark source changes reviewed. Raw HTML, nested, structural, image and legal changes remain read only here.</p>
  </>}
 </section>;
}
