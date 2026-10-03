'use client';
import {useLayoutEffect,useRef,useState} from 'react';
import {z} from 'zod';
import {api,ApiError} from './api';
import {LocaleReviewInput,LocaleReviewCommand,LocaleReviewRecord,LocaleReviewPage,LocaleReviewOutcome,type LocaleReviewCommandValue,type LocaleReviewPageValue} from '@/domain/locale-content-review';
import {canonicalSpecString} from '@/domain/email-source-values';

const storedSchema=z.object({note:z.string().max(4000),outcome:LocaleReviewOutcome,command:LocaleReviewCommand.nullable()}).strict();
const labels={content_reviewed:'Content reviewed',changes_requested:'Changes requested'};
const applicability={current:'Applies to the current saved locale and observed source.',target_changed:'Locale changed since this review.',source_changed:'Source changed since this review.',both_changed:'Locale and source changed since this review.'};

export function LocaleContentReview({workspace,email,actor,version,canEdit,blocked,canRecord}:{workspace:string;email:string;actor:string;version:number;canEdit:boolean;blocked:boolean;canRecord:()=>boolean}){
  const scope=JSON.stringify([workspace,actor,email]),token=JSON.stringify([scope,version]),storageKey='lettercape.locale-review.'+scope;
  const runtime=useRef({token,generation:0,running:false,controller:null as AbortController|null,command:null as LocaleReviewCommandValue|null});
  const [page,setPage]=useState<LocaleReviewPageValue|null>(null),[note,setNote]=useState(''),[outcome,setOutcome]=useState<'content_reviewed'|'changes_requested'>('content_reviewed');
  const [pending,setPending]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState(''),[storageWarning,setStorageWarning]=useState('');
  function persist(text:string,choice:typeof outcome,command:LocaleReviewCommandValue|null){
    try{if(!text&&!command)sessionStorage.removeItem(storageKey);else sessionStorage.setItem(storageKey,JSON.stringify({note:text,outcome:choice,command}));}
    catch{setStorageWarning('Browser review recovery is unavailable. Keep a copy of your note before leaving this page.');}
  }
  useLayoutEffect(()=>{
    const state=runtime.current;state.token=token;state.running=false;state.controller?.abort();const epoch=++state.generation;
    void Promise.resolve().then(()=>{
      if(state.generation!==epoch)return;
      try{
        const bytes=sessionStorage.getItem(storageKey);
        if(bytes){const stored=storedSchema.parse(JSON.parse(bytes)),command=stored.command;
          if(command&&(command.workspace_id!==workspace||command.actor_id!==actor||command.email_id!==email))throw Error('Review recovery context differs.');
          setNote(stored.note);setOutcome(stored.outcome);state.command=command;setPending(!!command);
        }
      }catch{setStorageWarning('Stored review recovery could not be read. Keep a copy of your note and inspect history before recording a review.');}
      void load();
    });
    return()=>{state.generation++;state.controller?.abort();};
    // The parent keys this component to the workspace, account and locale draft.
    // A version change refreshes applicability; notes and original commands persist.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[token]);
  async function load(append=false){
    const state=runtime.current;if(state.running)return;
    const old=page,cursor=append?old?.next_cursor:null;if(append&&!cursor)return;
    state.running=true;setBusy(true);setError('');if(!append)setPage(null);
    const epoch=++state.generation,controller=new AbortController();state.controller=controller;
    const owns=()=>state.generation===epoch&&state.token===token&&!controller.signal.aborted;
    try{
      const response=await api<Record<string,unknown>>(workspace,'emails/'+email+'/locale-reviews?limit=10'+(cursor?'&after='+encodeURIComponent(cursor):''),'GET',undefined,undefined,undefined,controller.signal,actor);
      const value=LocaleReviewPage.parse({context:response.context,data:response.data,total_count:response.total_count,has_more:response.has_more,next_cursor:response.next_cursor});
      if(!owns())return;
      if(value.context.workspace_id!==workspace||value.context.actor_id!==actor||value.context.email_id!==email||value.context.doc_version!==version)throw Error('The saved locale draft changed. Reload the editor before recording a review.');
      if(append&&old&&canonicalSpecString(old.context)!==canonicalSpecString(value.context))throw Error('The locale or source changed while loading history. Refresh review history.');
      setPage({...value,data:append&&old?[...old.data,...value.data]:value.data});
    }catch(e){if(owns()){setPage(null);setError(e instanceof Error?e.message:'Review history is unavailable. Your note is preserved.');}}
    finally{if(owns()){state.running=false;state.controller=null;setBusy(false);}}
  }
  async function record(){
    const state=runtime.current;if(state.running||!canEdit)return;
    let command=state.command;
    if(!command){
      if(blocked||!page?.context.target_revision||!canRecord())return;
      const value=LocaleReviewInput.safeParse({revision_id:page.context.target_revision.id,source_revision_id:page.context.source_revision_id,expected_source_doc_version:page.context.current_source_doc_version,outcome,note});
      if(!value.success){setError('Choose an outcome and enter a valid review note of up to 4,000 characters.');return;}
      command={workspace_id:workspace,actor_id:actor,email_id:email,version,key:crypto.randomUUID(),input:value.data};
      state.command=command;setPending(true);persist(note,outcome,command);
    }
    const original=command;state.running=true;setBusy(true);setError('');setNotice('');
    const epoch=++state.generation,controller=new AbortController();state.controller=controller;
    const owns=()=>state.generation===epoch&&state.token===token&&!controller.signal.aborted;
    let saved=false;
    try{
      const response=await api<{review:unknown}>(workspace,'emails/'+email+'/locale-reviews','POST',original.input,original.version,original.key,controller.signal,actor);
      const review=LocaleReviewRecord.parse(response.review);if(!owns())return;
      if(review.email_id!==email||review.created_by!==actor||review.target_doc_version!==original.version||review.revision_id!==original.input.revision_id||review.source_revision_id!==original.input.source_revision_id||review.observed_source_doc_version!==original.input.expected_source_doc_version||review.outcome!==original.input.outcome||review.note!==original.input.note)throw Error('The review receipt differs. Retry the original review to recover its acknowledgment.');
      state.command=null;setPending(false);setNote('');persist('',outcome,null);saved=true;
      setNotice('Recorded content review for locale checkpoint '+review.revision_no+'. Sending is not approved.');
    }catch(e){if(owns()){
      if(e instanceof ApiError&&['VERSION_MISMATCH','LOCALE_SOURCE_CHANGED','LOCALE_CHECKPOINT_REQUIRED','VALIDATION_FAILED','VERSION_REQUIRED','IDEMPOTENCY_KEY_REQUIRED'].includes(e.code)){state.command=null;setPending(false);persist(note,outcome,null);setPage(null);}
      setError(e instanceof Error?e.message:'Review acknowledgment is unavailable. Retry the original review.');
    }}finally{if(owns()){state.running=false;state.controller=null;setBusy(false);}}
    if(saved&&owns())await load();
  }
  const validNote=!!note.trim()&&LocaleReviewInput.shape.note.safeParse(note).success;
  return <section className="panel" aria-label="Manual language review">
    <h2>Manual language review</h2>
    <p>Record your own content review of a saved locale checkpoint. This does not translate content, update original source lineage or approve sending.</p>
    <button type="button" disabled={busy} onClick={()=>void load()}>Refresh review history</button>
    {busy&&<p role="status">{pending?'Recording or recovering the original review…':'Loading review history…'}</p>}
    {error&&<p role="alert" className="alert danger">{error}</p>}
    {storageWarning&&<p role="status">{storageWarning}</p>}
    {notice&&<p role="status">{notice}</p>}
    {page&&<>
      <p>Original source checkpoint {page.context.source_revision_no} · parent draft observed v{page.context.current_source_doc_version} · saved locale v{page.context.doc_version}.</p>
      {page.context.source_doc_version!==page.context.current_source_doc_version&&<p className="alert">The parent differs from the original source checkpoint, or its original version is unknown. Compare the source before reviewing. A content review does not make this lineage current.</p>}
      {!page.context.target_revision&&<p>Create a checkpoint of this saved locale draft before recording a review.</p>}
      {page.context.target_revision&&<p>Review target: locale checkpoint {page.context.target_revision.revision_no}.</p>}
      {!page.data.length&&<p>No language review has been recorded.</p>}
      <ol aria-label="Language review history">{page.data.map(item=><li key={item.id}>
        <h3>{labels[item.outcome]}</h3><p>{applicability[item.applicability]}</p>
        <p className="small">Locale checkpoint {item.revision_no} (v{item.target_doc_version}) · original source checkpoint {item.source_revision_no} · parent observed v{item.observed_source_doc_version}.</p>
        <p className="small">Recorded by account <bdi>{item.created_by}</bdi> · <time dateTime={item.created_at}>{new Date(item.created_at).toLocaleString()}</time></p>
        <p dir="auto" style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{item.note}</p>
      </li>)}</ol>
      {page.has_more&&<button type="button" disabled={busy} onClick={()=>void load(true)}>Load older language reviews</button>}
    </>}
    {canEdit?<>
      <label>Review outcome<select aria-label="Review outcome" value={outcome} disabled={busy||pending} onChange={e=>{const next=LocaleReviewOutcome.parse(e.target.value);setOutcome(next);persist(note,next,null);}}><option value="content_reviewed">Content reviewed</option><option value="changes_requested">Changes requested</option></select></label>
      <label>Review note<textarea aria-label="Review note" dir="auto" rows={4} maxLength={4000} value={note} readOnly={busy||pending} onChange={e=>{setNote(e.target.value);persist(e.target.value,outcome,null);}}/></label>
      <p className="small">A note is required (up to 4,000 characters). The signed-in account is recorded as the reviewer; no qualified translator participation is implied.</p>
      {blocked&&<p>Finish saving or resolving the current editor action before recording a new review.</p>}
      {pending?<><p>The original review acknowledgment is unresolved. Retry that same review before creating another one.</p><button type="button" disabled={busy} onClick={()=>void record()}>Retry original review</button></>:<button type="button" disabled={busy||blocked||!page?.context.target_revision||!validNote} onClick={()=>void record()}>Record content review</button>}
    </>:<p>Owner, Admin and Editor accounts can record a content review. Your role can read its history.</p>}
  </section>;
}
