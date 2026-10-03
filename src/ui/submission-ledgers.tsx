'use client';

import {useCallback,useEffect,useLayoutEffect,useState,useSyncExternalStore} from 'react';
import {SubmissionLedgerInput,type SubmissionLedgerView,type StagedRecipientView,type DeliveryHistoryView,type DeliveryAttemptView} from '../domain/submission-ledgers';
import {api} from './api';
import {LedgerFence,getSubmissionLedgerCoordinator,initialLedgerMutationSnapshot,parseLedgerConfiguration,parseLedgerDetail,parseLedgerPage,parseRecipientPage,parseDeliveryDetail,parseHistoryPage,parseAttemptPage,type SubmissionLedgerCoordinator,type LedgerCommand,type LedgerRequest} from './submission-ledger-recovery';

type Props={workspace:string;actor:string;role:string;id:string;version:number;digest:string};
type Page<T>={data:T[];has_more:boolean;next_cursor:string|null;total_count:number};
function emptyPage<T>():Page<T>{return {data:[],has_more:false,next_cursor:null,total_count:0};}
function appendPage<T extends {id:string}>(prior:Page<T>,next:Page<T>):Page<T>{return {...next,data:[...prior.data,...next.data.filter(row=>!prior.data.some(old=>old.id===row.id))]};}
function errorMessage(error:unknown){return error instanceof Error?error.message:'Ledger request failed. Retry an unresolved original command.';}
const subscribeEmpty=()=>()=>{};
const emptySnapshot=()=>initialLedgerMutationSnapshot;

export function SubmissionLedgers(props:Props){
 if(!['Owner','Admin'].includes(props.role))return <section className="recipient-assessments" data-submission-ledgers={props.id}><h3>Staged recipient ledgers</h3><p className="small muted">An Owner or Admin with audience access can inspect staged recipient ledgers.</p></section>;
 return <LedgerPanel key={JSON.stringify([props.workspace,props.actor,props.role,props.id])} {...props}/>;
}

function LedgerPanel({workspace,actor,role,id,version,digest}:Props){
 const [fence]=useState(()=>new LedgerFence());
 const [coordinator,setCoordinator]=useState<SubmissionLedgerCoordinator|null>(null);
 const mutation=useSyncExternalStore(coordinator?.subscribe??subscribeEmpty,coordinator?.getSnapshot??emptySnapshot,emptySnapshot);
 const [base,setBase]=useState({version,digest});
 const [observed,setObserved]=useState({version,digest});
 const [readBusy,setReadBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const [ledgers,setLedgers]=useState<Page<SubmissionLedgerView>>(emptyPage),[ledgersLoaded,setLedgersLoaded]=useState(false);
 const [selected,setSelected]=useState<SubmissionLedgerView|null>(null);
 const [recipients,setRecipients]=useState<Page<StagedRecipientView>>(emptyPage),[recipientsLoaded,setRecipientsLoaded]=useState(false);
 const [filter,setFilter]=useState('');
 const [delivery,setDelivery]=useState<StagedRecipientView|null>(null);
 const [history,setHistory]=useState<Page<DeliveryHistoryView>>(emptyPage),[historyLoaded,setHistoryLoaded]=useState(false);
 const [attempts,setAttempts]=useState<Page<DeliveryAttemptView>>(emptyPage),[attemptsLoaded,setAttemptsLoaded]=useState(false);
 const current=observed.version>version?observed:{version,digest};
 const identity=JSON.stringify([workspace,actor,role,id,current.version,current.digest]);
 const changed=base.version!==current.version||base.digest!==current.digest;
 const busy=readBusy||mutation.busy;
 const ledgerPath='campaigns/'+id+'/submission-ledgers?limit=10';
 useLayoutEffect(()=>{fence.activate(identity);return()=>fence.invalidate();},[fence,identity]);

 const loadLedgers=useCallback(async(more=false)=>{
  if(more&&!ledgers.next_cursor)return;
  const request=fence.begin();if(!request)return;
  setReadBusy(true);setError('');
  try{
   const page=parseLedgerPage(await api(workspace,ledgerPath+(more?'&after='+encodeURIComponent(ledgers.next_cursor!):''),'GET',undefined,undefined,undefined,request.signal,actor),id);
   if(!fence.current(request))return;
   setLedgers(prior=>more?appendPage(prior,page):page);setLedgersLoaded(true);
  }catch(error){if(fence.current(request))setError(errorMessage(error));}
  finally{if(fence.current(request)){fence.finish(request);setReadBusy(false);}}
 },[fence,workspace,actor,id,ledgerPath,ledgers.next_cursor]);

 useEffect(()=>{
  let active=true;
  void Promise.resolve().then(()=>{
   if(!active)return;
   try{
    const shared=getSubmissionLedgerCoordinator(localStorage,{workspace,actor,campaign:id});
    shared.reconcile();setCoordinator(shared);
   }catch(error){setError(errorMessage(error));}
   setReadBusy(false);
  });
  return()=>{active=false;};
 },[workspace,actor,id]);
 useEffect(()=>{
  let active=true;
  void Promise.resolve().then(()=>{if(active)void loadLedgers();});
  return()=>{active=false;};
  // Initial loading is fenced by context. Pagination changes do not trigger refresh.
  // eslint-disable-next-line react-hooks/exhaustive-deps
 },[identity]);

 async function read(path:string,request:LedgerRequest){return api(workspace,path,'GET',undefined,undefined,undefined,request.signal,actor);}
 function clearDelivery(){setDelivery(null);setHistory(emptyPage());setAttempts(emptyPage());setHistoryLoaded(false);setAttemptsLoaded(false);}
 async function viewLedger(ledgerId:string,more=false,state=filter){
  if(more&&(!selected||selected.id!==ledgerId||!recipients.next_cursor))return;
  const request=fence.begin();if(!request)return;
  setReadBusy(true);setError('');
  if(!more){setRecipients(emptyPage());setRecipientsLoaded(false);clearDelivery();}
  try{
   const detail=parseLedgerDetail(await read('submission-ledgers/'+ledgerId,request),id,ledgerId);
   if(!fence.current(request))return;
   setSelected(detail);
   const path='submission-ledgers/'+ledgerId+'/recipients?limit=25'+(state?'&state='+encodeURIComponent(state):'')+(more?'&after='+encodeURIComponent(recipients.next_cursor!):'');
   const page=parseRecipientPage(await read(path,request),ledgerId);
   if(page.data.some(row=>row.configuration_id!==detail.configuration_id))throw Error('Recipient configuration does not match the ledger.');
   if(!fence.current(request))return;
   setRecipients(prior=>more?appendPage(prior,page):page);setRecipientsLoaded(true);
  }catch(error){if(fence.current(request))setError(errorMessage(error));}
  finally{if(fence.current(request)){fence.finish(request);setReadBusy(false);}}
 }
 async function viewDelivery(deliveryId:string){
  if(!selected)return;
  const request=fence.begin();if(!request)return;
  setReadBusy(true);setError('');clearDelivery();
  try{
   const detail=parseDeliveryDetail(await read('deliveries/'+deliveryId,request),selected.id,deliveryId);
   if(detail.configuration_id!==selected.configuration_id)throw Error('Delivery configuration does not match the ledger.');
   if(!fence.current(request))return;
   setDelivery(detail);
   const statePage=parseHistoryPage(await read('deliveries/'+deliveryId+'/history?limit=25',request),deliveryId);
   if(!fence.current(request))return;
   setHistory(statePage);setHistoryLoaded(true);
   const attemptPage=parseAttemptPage(await read('deliveries/'+deliveryId+'/attempts?limit=25',request),deliveryId);
   if(!fence.current(request))return;
   setAttempts(attemptPage);setAttemptsLoaded(true);
  }catch(error){if(fence.current(request))setError(errorMessage(error));}
  finally{if(fence.current(request)){fence.finish(request);setReadBusy(false);}}
 }
 async function moreDelivery(kind:'history'|'attempts'){
  if(!delivery)return;
  const cursor=kind==='history'?history.next_cursor:attempts.next_cursor;
  if(!cursor)return;
  const request=fence.begin();if(!request)return;
  setReadBusy(true);setError('');
  try{
   const response=await read('deliveries/'+delivery.delivery_id+'/'+kind+'?limit=25&after='+encodeURIComponent(cursor),request);
   if(!fence.current(request))return;
   if(kind==='history'){const page=parseHistoryPage(response,delivery.delivery_id);setHistory(prior=>appendPage(prior,page));}
   else{const page=parseAttemptPage(response,delivery.delivery_id);setAttempts(prior=>appendPage(prior,page));}
  }catch(error){if(fence.current(request))setError(errorMessage(error));}
  finally{if(fence.current(request)){fence.finish(request);setReadBusy(false);}}
 }
 async function dispatch(kind:'create'|'cancel'|'retry'){
  if(!coordinator)return;
  const request=fence.begin();if(!request)return;
  setReadBusy(true);setError('');setNotice('');
  try{
   let command:LedgerCommand|undefined;
   if(kind==='create'){
    if(changed)throw Error('Reload ledger configuration before creating a new command.');
    const input=SubmissionLedgerInput.parse({expected_version:base.version,expected_digest:base.digest});
    command={kind:'create',key:crypto.randomUUID(),body:JSON.stringify(input)};
   }else if(kind==='cancel'){
    if(!selected||!['queued','running','completed'].includes(selected.status))throw Error('Choose a queued, running or completed ledger to cancel.');
    command={kind:'cancel',key:crypto.randomUUID(),ledger_id:selected.id,body:'{}'};
   }
   const truth=await coordinator.run(command,original=>api(workspace,original.kind==='create'?'campaigns/'+id+'/submission-ledgers':'submission-ledgers/'+original.ledger_id+'/cancel','POST',JSON.parse(original.body),undefined,original.key,request.signal,actor),()=>fence.current(request),ledgerId=>read('submission-ledgers/'+ledgerId,request));
   if(!fence.current(request)||!truth)return;
   setSelected(truth);setRecipients(emptyPage());setRecipientsLoaded(false);clearDelivery();
   setNotice('Original command acknowledged. Fresh ledger status: '+truth.status+'. Staged; sending unavailable.');
   const page=parseLedgerPage(await read(ledgerPath,request),id);
   if(!fence.current(request))return;
   setLedgers(page);setLedgersLoaded(true);
  }catch(error){if(fence.current(request))setError(errorMessage(error));}
  finally{if(fence.current(request)){fence.finish(request);setReadBusy(false);}}
 }
 async function reloadConfiguration(){
  const request=fence.begin();if(!request)return;
  setReadBusy(true);setError('');
  try{
   const fresh=parseLedgerConfiguration(await read('campaigns/'+id,request),id,current);
   if(!fence.current(request))return;
   setObserved(fresh);setBase(fresh);coordinator?.reconcile();
   setNotice('Current configuration loaded. Any unresolved original command retains its original version, digest and key.');
  }catch(error){if(fence.current(request))setError(errorMessage(error));}
  finally{if(fence.current(request)){fence.finish(request);setReadBusy(false);}}
 }
 async function dismissRejected(){
  if(!coordinator||!mutation.pending)return;
  const request=fence.begin();if(!request)return;
  setReadBusy(true);setError('');
  try{
   const dismissed=await coordinator.dismiss(mutation.pending,()=>fence.current(request));
   if(dismissed&&fence.current(request))setNotice('The server definitively rejected the original staging command. Reload configuration before explicitly staging new work.');
  }finally{if(fence.current(request)){fence.finish(request);setReadBusy(false);}}
 }

 return <section className="recipient-assessments break-word" data-submission-ledgers={id} aria-label="Staged recipient ledgers" style={{minWidth:0}}>
  <h3>Staged recipient ledgers</h3>
  <p className="alert warning"><strong>Staged; sending unavailable.</strong> Pending means unapproved work. Staging does not authorize sending, consume quota or reserve frequency. Delivery outcomes remain unknown.</p>
  <p className="small muted">Each ledger preserves the captured audience, configuration and recipient identities. Captured consent, locale and exclusion reasons are historical facts; current eligibility and approval have not been established. The local development worker must run to materialize queued staging work.</p>
  {(error||mutation.error)&&<p className="alert danger break-word" role="alert">{error||mutation.error}</p>}
  {notice&&<p className="small break-word" role="status">{notice}</p>}
  {!mutation.ready&&<p className="small">Creating and cancelling requires durable browser storage and origin Web Locks. History can still be inspected.</p>}
  <p className="small break-word">New ledger base: configuration v{base.version} · digest {base.digest}</p>
  {changed&&<p className="alert warning">Campaign configuration changed. Reload configuration before staging new work. Retry an unresolved original command unchanged.</p>}
  <div className="toolbar">
   <button className="primary" disabled={busy||!mutation.ready||!!mutation.pending||changed} onClick={()=>void dispatch('create')}>Stage recipient ledger</button>
   {mutation.pending&&<button disabled={busy||!mutation.ready} onClick={()=>void dispatch('retry')}>Retry original ledger command</button>}
   {mutation.pending?.kind==='create'&&mutation.pending.rejection&&<button disabled={busy||!mutation.ready} onClick={()=>void dismissRejected()}>Dismiss rejected ledger command</button>}
   <button disabled={busy} onClick={()=>void reloadConfiguration()}>Reload ledger configuration</button>
  </div>
  {mutation.pending&&!(mutation.pending.kind==='create'&&mutation.pending.rejection)&&<p className="small">The original {mutation.pending.kind==='create'?'staging':'cancellation'} acknowledgment remains unresolved. Its exact key and body are retained for retry.</p>}
  {mutation.pending?.kind==='create'&&mutation.pending.rejection&&<p className="small">The server rejected this exact original staging command with {mutation.pending.rejection.code} after checking its historical receipt. You may explicitly dismiss this rejected command and reload configuration.</p>}
  {busy&&<p role="status">Loading staged ledger evidence…</p>}
  <section aria-label="Ledger history">
   <h4>Ledger history{ledgersLoaded?' ('+ledgers.total_count+')':''}</h4>
   {!ledgersLoaded?<p>Refresh ledger history to load staged work.</p>:!ledgers.data.length?<p>No staged recipient ledgers recorded.</p>:<ol>{ledgers.data.map(row=><li key={row.id}>
    <p className="small break-word">{row.created_at} · {row.status} · captured configuration v{row.configuration_version} · {row.processed_count}/{row.total_count} processed</p>
    <button className="small break-word" style={{maxWidth:'100%'}} disabled={busy} onClick={()=>void viewLedger(row.id)}>View ledger {row.id}</button>
   </li>)}</ol>}
   <div className="toolbar"><button disabled={busy} onClick={()=>void loadLedgers()}>Refresh ledger history</button>{ledgers.has_more&&<button disabled={busy} onClick={()=>void loadLedgers(true)}>Load older ledgers</button>}</div>
  </section>
  {selected&&<section aria-label="Ledger detail" data-submission-ledger-detail={selected.id}>
   <h4>Staging progress</h4>
   <p className="small break-word">Ledger {selected.id} · <strong data-ledger-status>{selected.status}</strong> · last read {selected.updated_at}</p>
   <p className="small" data-ledger-progress>{selected.processed_count}/{selected.total_count} processed · {selected.pending_count} pending (unapproved) · {selected.skipped_count} skipped · {selected.cancelled_count} cancelled</p>
   <p className="small">{selected.accepted_count} accepted · {selected.uncertain_count} uncertain · {selected.attempt_count} actual attempts. Authorization issued: false. Dispatch enabled: false.</p>
   <p className="small break-word">Captured configuration {selected.configuration_id} · v{selected.configuration_version} · digest {selected.configuration_digest}</p>
   <p className="small break-word">Revision {selected.revision_id} · artifact hash {selected.artifact_hash} · snapshot {selected.snapshot_id} · snapshot digest {selected.snapshot_digest}</p>
   <div className="toolbar"><button disabled={busy} onClick={()=>void viewLedger(selected.id)}>Refresh ledger status</button>{['queued','running','completed'].includes(selected.status)&&<button disabled={busy||!!mutation.pending||!mutation.ready} onClick={()=>void dispatch('cancel')}>Cancel staged ledger</button>}</div>
   <h5>Staged recipients{recipientsLoaded?' ('+recipients.total_count+')':''}</h5>
   <label>Recipient state<select aria-label="Recipient state" value={filter} disabled={busy} onChange={event=>{const state=event.target.value;setFilter(state);void viewLedger(selected.id,false,state);}}><option value="">All staged states</option><option value="pending">Pending (unapproved)</option><option value="skipped">Skipped</option><option value="cancelled">Cancelled</option></select></label>
   {!recipientsLoaded?<p>Refresh ledger status to load recipients.</p>:!recipients.data.length?<p>No staged recipients match this view.</p>:<ol>{recipients.data.map(row=><li key={row.id} data-staged-recipient={row.id}>
    <p className="small break-word">Contact {row.contact_id} · {row.submission_state==='pending'?'pending (unapproved)':row.submission_state} · outcome {row.outcome}</p>
    <p className="small break-word">Captured locale {row.captured_locale} · reason {row.captured_reason} · consent v{row.captured_consent_version}</p>
    <button className="small break-word" style={{maxWidth:'100%'}} disabled={busy} onClick={()=>void viewDelivery(row.delivery_id)}>View delivery {row.delivery_id}</button>
   </li>)}</ol>}
   {recipients.has_more&&<button disabled={busy} onClick={()=>void viewLedger(selected.id,true)}>Load more staged recipients</button>}
  </section>}
  {delivery&&<section aria-label="Delivery detail" data-staged-delivery-detail={delivery.delivery_id}>
   <h4>Logical delivery</h4>
   <p className="small break-word">Delivery {delivery.delivery_id} · recipient {delivery.id} · contact {delivery.contact_id}</p>
   <p className="small break-word">Logical send key {delivery.logical_send_key}</p>
   <p className="small">Submission {delivery.submission_state==='pending'?'pending (unapproved)':delivery.submission_state} · outcome {delivery.outcome} · authorization issued: false</p>
   <button disabled={busy} onClick={()=>void viewDelivery(delivery.delivery_id)}>Refresh delivery history</button>
   <h5>State history{historyLoaded?' ('+history.total_count+')':''}</h5>
   {!historyLoaded?<p>Refresh delivery history to load state history.</p>:!history.data.length?<p>No state history recorded.</p>:<ol>{history.data.map(row=><li key={row.id}><p className="small break-word">{row.recorded_at} · {row.submission_state} · outcome {row.outcome} · reason {row.reason}</p></li>)}</ol>}
   {history.has_more&&<button disabled={busy} onClick={()=>void moreDelivery('history')}>Load more state history</button>}
   <h5>Actual attempts{attemptsLoaded?' ('+attempts.total_count+')':''}</h5>
   {!attemptsLoaded?<p>Refresh delivery history to load actual attempts.</p>:!attempts.data.length?<p>No actual attempts recorded. Sending remains unavailable.</p>:<ol>{attempts.data.map(row=><li key={row.id}><p className="small break-word">Attempt {row.attempt_no} · {row.submission_state} · started {row.request_started_at} · accepted {row.accepted_at??'not recorded'} · error class {row.error_class??'none recorded'}</p></li>)}</ol>}
   {attempts.has_more&&<button disabled={busy} onClick={()=>void moreDelivery('attempts')}>Load more actual attempts</button>}
  </section>}
 </section>;
}
