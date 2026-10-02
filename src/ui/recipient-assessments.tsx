'use client';

import {useCallback,useEffect,useLayoutEffect,useState} from 'react';
import {RecipientAssessmentInput,RECIPIENT_ASSESSMENT_GLOBAL_BLOCKERS,type RecipientAssessmentView,type RecipientObservationView} from '../domain/recipient-assessments';
import {api,ApiError} from './api';
import {RecipientAssessmentFence,readAssessmentCommand,rememberAssessmentCommandAtomic,clearAssessmentCommandAtomic,assessmentRecoveryLocksAvailable,parseAssessmentDetail,parseAssessmentPage,parseObservationPage,parseAssessmentConfiguration,resolveAssessmentAcknowledgment,type AssessmentCommand} from './recipient-assessment-recovery';

type Props={workspace:string;id:string;role:string;actor:string;version:number;digest:string};
type Page<T>={data:T[];has_more:boolean;next_cursor:string|null;total_count:number};
function emptyPage<T>():Page<T>{return {data:[],has_more:false,next_cursor:null,total_count:0};}
function message(error:unknown){return error instanceof Error?error.message:'Assessment request failed. Retry the original command if its acknowledgment is unresolved.';}
const blockerLabels:Record<string,string>={
 CAMPAIGN_APPROVAL_UNAVAILABLE:'Campaign approval',
 PROVIDER_SENDER_UNAVAILABLE:'Provider and sender connection',
 REAL_CLIENT_PREFLIGHT_UNAVAILABLE:'Real-client preflight',
 SEND_BUDGET_UNAVAILABLE:'Send budget',
 LOCALE_POLICY_UNAVAILABLE:'Locale mapping and policy',
};

export function RecipientAssessments(props:Props){
 if(!['Owner','Admin'].includes(props.role))return <section className="recipient-assessments" data-recipient-assessments={props.id}><h3>Recipient assessments</h3><p className="small muted">An Owner or Admin with audience access can inspect recipient assessment evidence.</p></section>;
 return <AssessmentPanel key={JSON.stringify([props.workspace,props.id,props.actor,props.role])} {...props}/>;
}

function AssessmentPanel({workspace,id,actor,role,version,digest}:Props){
 const [fence]=useState(()=>new RecipientAssessmentFence());
 const [base,setBase]=useState({version,digest}),[topic,setTopic]=useState('');
 const [observedConfiguration,setObservedConfiguration]=useState({version,digest}),[configurationNeedsReload,setConfigurationNeedsReload]=useState(false);
 const [pending,setPending]=useState<AssessmentCommand|null>(null),[storageAvailable,setStorageAvailable]=useState(false),[initialized,setInitialized]=useState(false);
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const [history,setHistory]=useState<Page<RecipientAssessmentView>>(emptyPage),[historyLoaded,setHistoryLoaded]=useState(false);
 const [selected,setSelected]=useState<RecipientAssessmentView|null>(null),[observations,setObservations]=useState<Page<RecipientObservationView>>(emptyPage),[observationsLoaded,setObservationsLoaded]=useState(false);
 const currentConfiguration=observedConfiguration.version>version?observedConfiguration:{version,digest};
 const identity=JSON.stringify([workspace,id,actor,role,currentConfiguration.version,currentConfiguration.digest]);
 const changed=configurationNeedsReload||base.version!==currentConfiguration.version||base.digest!==currentConfiguration.digest;
 const scope={workspace,campaign:id,actor};
 const historyPath='campaigns/'+id+'/recipient-assessments?limit=10';

 useLayoutEffect(()=>{fence.activate(identity);return ()=>fence.invalidate();},[fence,identity]);
 const refreshHistory=useCallback(async()=>{
  const request=fence.begin();if(!request)return;
  setBusy(true);setError('');
  try{
   const page=parseAssessmentPage(await api(workspace,historyPath,'GET',undefined,undefined,undefined,request.signal,actor),id);
   if(!fence.current(request))return;setHistory(page);setHistoryLoaded(true);
  }catch(e){if(fence.current(request))setError(message(e));}
  finally{if(fence.current(request)){fence.finish(request);setBusy(false);}}
 },[fence,workspace,historyPath,actor,id]);
 useEffect(()=>{
  let active=true;
  void Promise.resolve().then(()=>{
   if(!active)return;
   const recovered=readAssessmentCommand({workspace,campaign:id,actor});
   setPending(recovered.command);setStorageAvailable(recovered.available&&assessmentRecoveryLocksAvailable());setInitialized(true);setBusy(false);
   if(recovered.error)setNotice(recovered.error);
   else if(recovered.command)setNotice('Original assessment command recovered. Retry it to resolve its acknowledgment.');
   void refreshHistory();
  });
  return ()=>{active=false;};
 },[workspace,id,actor,identity,refreshHistory]);

 async function loadOlder(){
  if(!history.next_cursor)return;const request=fence.begin();if(!request)return;setBusy(true);setError('');
  try{
   const page=parseAssessmentPage(await api(workspace,historyPath+'&after='+encodeURIComponent(history.next_cursor),'GET',undefined,undefined,undefined,request.signal,actor),id);
   if(fence.current(request))setHistory({...page,data:[...history.data,...page.data.filter(row=>!history.data.some(old=>old.id===row.id))]});
  }catch(e){if(fence.current(request))setError(message(e));}
  finally{if(fence.current(request)){fence.finish(request);setBusy(false);}}
 }
 async function viewAssessment(assessmentId:string,more=false){
  if(more&&(!selected||selected.id!==assessmentId||!observations.next_cursor))return;
  const request=fence.begin();if(!request)return;setBusy(true);setError('');
  if(!more){setSelected(null);setObservations(emptyPage());setObservationsLoaded(false);}
  try{
   const detail=parseAssessmentDetail(await api(workspace,'recipient-assessments/'+assessmentId,'GET',undefined,undefined,undefined,request.signal,actor),id);
   if(detail.id!==assessmentId)throw Error('Assessment detail does not match the requested assessment.');
   if(!fence.current(request))return;setSelected(detail);
   const path='recipient-assessments/'+assessmentId+'/observations?limit=25'+(more?'&after='+encodeURIComponent(observations.next_cursor!):'');
   const page=parseObservationPage(await api(workspace,path,'GET',undefined,undefined,undefined,request.signal,actor),assessmentId);
   if(!fence.current(request))return;
   setObservations(more?{...page,data:[...observations.data,...page.data.filter(row=>!observations.data.some(old=>old.id===row.id))]}:page);setObservationsLoaded(true);
  }catch(e){if(fence.current(request))setError(message(e));}
  finally{if(fence.current(request)){fence.finish(request);setBusy(false);}}
 }
 async function dispatch(kind:'create'|'cancel'|'retry'){
  if(!initialized)return;
  const request=fence.begin();if(!request)return;
  let command:AssessmentCommand|null=null,received=false;
  setBusy(true);setError('');setNotice('');
  try{
   const recovered=readAssessmentCommand(scope);setStorageAvailable(recovered.available&&assessmentRecoveryLocksAvailable());
   if(!recovered.available)throw Error(recovered.error);
   if(kind==='retry'){
    command=recovered.command;
    if(!command)throw Error('No original assessment command is available to retry.');
   }else{
    if(recovered.command){setPending(recovered.command);throw Error('Resolve the original assessment command before creating another command.');}
    if(kind==='create'){
     if(changed)throw Error('Campaign configuration changed. Reload assessment configuration before creating a new assessment.');
     const input=RecipientAssessmentInput.parse({expected_version:base.version,expected_digest:base.digest,topic_id:topic.trim()||null});
     command={kind:'create',key:crypto.randomUUID(),body:JSON.stringify(input)};
    }else{
     if(!selected||!['queued','running'].includes(selected.status))throw Error('Choose a queued or running assessment to cancel.');
     command={kind:'cancel',assessment_id:selected.id,key:crypto.randomUUID(),body:'{}'};
    }
   }
   const admitted=await rememberAssessmentCommandAtomic(scope,command,{signal:request.signal});
   if(!fence.current(request))return;
   if(!admitted){
    const current=readAssessmentCommand(scope);setPending(current.command);setStorageAvailable(current.available&&assessmentRecoveryLocksAvailable());
    throw Error(current.command?'Another unresolved assessment command occupies durable recovery. Retry that original command before creating another.':'The original assessment command could not be stored atomically and durably. Browser origin locks and storage are required. No request was sent.');
   }
   setPending(command);
   const path=command.kind==='create'?'campaigns/'+id+'/recipient-assessments':'recipient-assessments/'+command.assessment_id+'/cancel';
   const response=await api(workspace,path,'POST',JSON.parse(command.body),undefined,command.key,request.signal,actor);received=true;
   if(!fence.current(request))return;
   const truth=await resolveAssessmentAcknowledgment(response,scope,command,assessmentId=>api(workspace,'recipient-assessments/'+assessmentId,'GET',undefined,undefined,undefined,request.signal,actor));
   if(!fence.current(request))return;
   setSelected(truth);setObservations(emptyPage());setObservationsLoaded(false);
   const cleared=await clearAssessmentCommandAtomic(scope,command.key,{signal:request.signal});
   if(!fence.current(request))return;
   if(cleared){setPending(null);setStorageAvailable(true);setNotice('Original command acknowledged. Fresh assessment status: '+truth.status+'. Refresh observations to inspect historical evidence.');}
   else{setStorageAvailable(false);setNotice('Command acknowledged, but recovery could not be cleared durably. Retry the original command before creating another assessment.');}
   setHistoryLoaded(false);
   const page=parseAssessmentPage(await api(workspace,historyPath,'GET',undefined,undefined,undefined,request.signal,actor),id);
   if(fence.current(request)){setHistory(page);setHistoryLoaded(true);}
  }catch(e){
   if(!fence.current(request))return;setError(message(e));
   if(e instanceof ApiError&&['VERSION_CONFLICT','DIGEST_CONFLICT'].includes(e.code))setConfigurationNeedsReload(true);
   if(command&&!received&&e instanceof ApiError&&e.status<500&&![401,403,408,429].includes(e.status)){
    const cleared=await clearAssessmentCommandAtomic(scope,command.key,{signal:request.signal});
    if(!fence.current(request))return;
    if(cleared){setPending(null);setNotice('The server rejected the original command. Correct the issue before explicitly creating a new assessment.');}
   }
  }finally{if(fence.current(request)){fence.finish(request);setBusy(false);}}
 }
 async function reloadConfiguration(){
  const request=fence.begin();if(!request)return;setBusy(true);setError('');
  try{
   const fresh=parseAssessmentConfiguration(await api(workspace,'campaigns/'+id,'GET',undefined,undefined,undefined,request.signal,actor),id,currentConfiguration);
   if(!fence.current(request))return;
   setObservedConfiguration(fresh);setBase(fresh);setConfigurationNeedsReload(false);setTopic('');
   const recovered=readAssessmentCommand(scope);setPending(recovered.command);setStorageAvailable(recovered.available&&assessmentRecoveryLocksAvailable());
   setNotice(recovered.command?'Current configuration loaded. The original pending command retains its captured version, digest and topic.':recovered.error||'Current campaign configuration loaded for the next assessment.');
  }catch(e){if(fence.current(request))setError(message(e));}
  finally{if(fence.current(request)){fence.finish(request);setBusy(false);}}
 }

 return <section className="recipient-assessments" data-recipient-assessments={id} aria-label="Recipient assessments">
  <h3>Recipient assessments</h3>
  <p className="small muted">Inspect consent, preferences, suppression and existing frequency evidence for the frozen audience. Each assessment is historical preparation evidence. CHECKS_CLEAR means only inspected checks passed; it does not mean ready to send.</p>
  <p className="alert warning">Assessment execution currently requires the local development worker. Queued work remains queued until that worker runs. Production worker operations are not qualified.</p>
  <p className="small">Authorization issued: false. Delivery remains disabled. These global blockers remain unresolved:</p>
  <ul className="small">{RECIPIENT_ASSESSMENT_GLOBAL_BLOCKERS.map(blocker=><li key={blocker}>{blockerLabels[blocker]}</li>)}</ul>
  {error&&<p className="alert danger" role="alert">{error}</p>}
  {notice&&<p className="small break-word" role="status">{notice}</p>}
  {initialized&&!storageAvailable&&<p className="alert warning">Durable browser recovery is unavailable. Creating and cancelling assessments requires browser origin locks and durable storage for the original command before sending it. History can still be inspected.</p>}
  <p className="small break-word">New assessment base: configuration v{base.version} · digest {base.digest}</p>
  {changed&&<p className="alert warning">Campaign configuration changed. Latest observed version: v{currentConfiguration.version}. Reload assessment configuration before creating a new command. An existing pending command can still be retried unchanged.</p>}
  <form onSubmit={event=>{event.preventDefault();void dispatch('create');}}>
   <label>Assessment topic ID (optional)<input value={topic} onChange={event=>setTopic(event.target.value)} maxLength={36} spellCheck={false} placeholder="Topic UUID" disabled={busy||!!pending||!initialized}/></label>
   <p className="small muted">Choose an explicit workspace topic for this assessment only. Leaving it blank records TOPIC_NOT_SELECTED. This does not change campaign configuration. A verified frozen audience snapshot is required; select and save one in draft configuration first.</p>
   <div className="toolbar"><button className="primary" disabled={busy||!!pending||!initialized||!storageAvailable||changed}>Create recipient assessment</button></div>
  </form>
  {pending&&<p className="small">The original {pending.kind==='create'?'creation':'cancellation'} command has an unresolved acknowledgment. Retry uses its stored key and body.</p>}
  <div className="toolbar">
   {pending&&<button disabled={busy} onClick={()=>void dispatch('retry')}>Retry original assessment command</button>}
   <button disabled={busy} onClick={()=>void reloadConfiguration()}>Reload assessment configuration</button>
  </div>
  <section aria-label="Assessment history">
   <h4>Historical assessments {historyLoaded?'('+history.total_count+')':''}</h4>
   {!historyLoaded?<p role="status">{busy?'Loading assessment history…':'Assessment history could not be loaded. Refresh to retry.'}</p>:!history.data.length?<p>No recipient assessments have been recorded.</p>:<ol>{history.data.map(assessment=><li key={assessment.id}>
    <p className="small break-word">{assessment.created_at} · {assessment.status} · captured configuration v{assessment.configuration_version} · {assessment.processed_count}/{assessment.total_count} processed · {assessment.checks_clear_count} inspected checks clear · {assessment.excluded_count} excluded</p>
    <button disabled={busy} onClick={()=>void viewAssessment(assessment.id)}>View assessment {assessment.id}</button>
   </li>)}</ol>}
   <div className="toolbar"><button disabled={busy} onClick={()=>void refreshHistory()}>Refresh assessment history</button>{history.has_more&&<button disabled={busy} onClick={()=>void loadOlder()}>Load older assessments</button>}</div>
  </section>
  {selected&&<section aria-label="Assessment detail" data-recipient-assessment-detail={selected.id}>
   <h4>Historical assessment detail</h4>
   <p className="small break-word">Assessment {selected.id} · <strong data-assessment-status>{selected.status}</strong> · last status read {selected.updated_at}</p>
   <p className="small" data-assessment-progress>{selected.processed_count}/{selected.total_count} processed · {selected.checks_clear_count} inspected checks clear · {selected.excluded_count} excluded</p>
   <p className="small break-word">Captured configuration v{selected.configuration_version} · configuration {selected.configuration_id} · digest {selected.configuration_digest}</p>
   <p className="small break-word">Frozen revision {selected.revision_id} · audience snapshot {selected.snapshot_id} · topic {selected.topic_id??'not selected'}</p>
   <p className="small break-word">Created {selected.created_at} · creator {selected.created_by} · rule {selected.rule_version} · completed {selected.completed_at??'not completed'}</p>
   <p className="small">This manifest and its observations remain historical when campaign configuration or contact preferences change. Fresh status reads report job progress without updating earlier observations.</p>
   <div className="toolbar"><button disabled={busy} onClick={()=>void viewAssessment(selected.id)}>Refresh assessment status</button>{['queued','running'].includes(selected.status)&&<button disabled={busy||!!pending||!storageAvailable} onClick={()=>void dispatch('cancel')}>Cancel recipient assessment</button>}</div>
   <h5>Historical recipient observations {observationsLoaded?'('+observations.total_count+')':''}</h5>
   {!observationsLoaded?<p>{busy?'Loading observations…':'Refresh assessment status to load observations.'}</p>:!observations.data.length?<p>No recipient observations recorded yet.</p>:<ol>{observations.data.map(observation=><li key={observation.id} data-recipient-observation={observation.id}>
    <p className="small break-word">Contact {observation.contact_id} · observed {observation.observed_at} · <strong>{observation.current_reason==='CHECKS_CLEAR'?'CHECKS_CLEAR — inspected checks clear':observation.current_reason}</strong></p>
    <p className="small break-word">Captured exclusion: {observation.captured_reason} · captured locale {observation.captured_locale||'unset'} · locale at observation {observation.current_locale??'missing'} · consent v{observation.consent_version??'unknown'} · preferences v{observation.preference_version??'unknown'}</p>
    <p className="small break-word">All exclusion reasons: {observation.reasons.length?observation.reasons.join(', '):'none among inspected checks'} · rule {observation.rule_version} · authorization issued: false.</p>
   </li>)}</ol>}
   {observations.has_more&&<button disabled={busy} onClick={()=>void viewAssessment(selected.id,true)}>Load more observations</button>}
  </section>}
 </section>;
}
