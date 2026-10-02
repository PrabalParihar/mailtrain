'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import {z} from 'zod';
import {SenderDraftInput,SenderVersionInput,SenderCheckInput,SenderView,SenderVersionView,DNSCheckView,normalizeSender,SENDER_PROVIDERS,type SenderData,type SenderVersionData} from '../domain/sender-domain';
import {allowed,type Role} from '../domain/permissions';
import {api,ApiError} from './api';
import {acknowledgeSenderSave,formForSender,senderFormDirty,readSenderForm,rememberSenderForm,clearSenderForm,readSenderSelection,rememberSenderSelection,type SenderForm} from './sender-form-recovery';

function useSenderPage<T>(workspace:string,path:string|null,schema:z.ZodType<T>,refresh='') {
 const [state,setState]=useState<{data:T[];total:number;cursor:string|null;loaded:boolean;busy:boolean;error:string}>({data:[],total:0,cursor:null,loaded:false,busy:false,error:''});
 const generation=useRef(0),running=useRef(false),snapshot=useRef(state);
 const read=useCallback(async(more=false)=>{
  if(!path||(more&&(running.current||!snapshot.current.cursor)))return;
  const epoch=++generation.current;running.current=true;setState(before=>({...before,busy:true,error:''}));
  try {
   const value=await api<unknown>(workspace,path+(more?'&after='+encodeURIComponent(snapshot.current.cursor!):''));
   const page=z.object({data:z.array(schema),total_count:z.number().int().nonnegative(),has_more:z.boolean(),next_cursor:z.string().nullable(),request_id:z.string()}).strict().parse(value);
   if(generation.current!==epoch)return;
   const next={data:more?[...snapshot.current.data,...page.data]:page.data,total:page.total_count,cursor:page.has_more?page.next_cursor:null,loaded:true,busy:false,error:''};
   snapshot.current=next;setState(next);
  }catch(error){if(generation.current===epoch)setState(before=>({...before,busy:false,error:error instanceof Error?error.message:'Records could not be loaded.'}));}
  finally{if(generation.current===epoch)running.current=false;}
 },[workspace,path,schema]);
 useEffect(()=>{let active=true;void Promise.resolve().then(()=>{if(active)void read();});const fence=generation;return()=>{active=false;fence.current++;};},[read,refresh]);
 return {...state,reload:()=>read(),loadMore:()=>read(true)};
}

export function SenderDomainPanel({workspace,role}:{workspace:string;role:Role}) {
 if(!allowed(role,'manage'))return <section className="panel" aria-label="Sender domains"><h2>Sender domains</h2><p>Owner or Admin access is required to manage sender drafts and DNS observations.</p><p className="small muted">Sending remains disabled.</p></section>;
 return <SenderController key={workspace+':'+role} workspace={workspace}/>;
}
function SenderController({workspace}:{workspace:string}) {
 const senders=useSenderPage(workspace,'sender-identities?limit=5',SenderView);
 const [selected,setSelected]=useState<string|null>(null),[choice,setChoice]=useState('new'),[notice,setNotice]=useState('');
 useEffect(()=>{const id=readSenderSelection(workspace);void Promise.resolve().then(()=>{setSelected(id);setChoice(id);});},[workspace]);
 function open(id:string){rememberSenderSelection(workspace,id);setChoice(id);setSelected(id);setNotice('');}
 return <section className="panel audience-segments" aria-label="Sender domains" data-sender-domain>
  <h2>Sender drafts and DNS evidence</h2>
  <p>Save a provider-bound sender draft and observe public TXT records. Provider account verification, issued DNS values and sending remain unavailable.</p>
  <p className="alert warning">No provider is connected. Authentication is unverified. Sending is disabled.</p>
  {notice&&<p role="status">{notice}</p>}
  {senders.error&&<p className="alert danger" role="alert">{senders.error}</p>}
  {!senders.loaded?<p role="status">{senders.busy?'Loading sender drafts…':'Sender drafts could not be loaded. Refresh to try again.'}</p>:!senders.data.length?<p>No sender drafts yet.</p>:<p className="small">{senders.total} saved sender drafts</p>}
  <label>Saved sender draft<select value={choice} disabled={senders.busy} onChange={event=>setChoice(event.target.value)} style={{maxWidth:'100%'}}>
   <option value="new">New sender draft</option>
   {!senders.data.some(sender=>sender.id===choice)&&choice!=='new'&&<option value={choice}>Selected saved sender (not on this page)</option>}
   {senders.data.map(sender=><option value={sender.id} key={sender.id}>{sender.name} · v{sender.version} · {sender.provider}</option>)}
  </select></label>
  <div className="toolbar"><button disabled={senders.busy||selected===choice} onClick={()=>open(choice)}>Load selected sender</button><button disabled={senders.busy} onClick={()=>void senders.reload()}>Refresh sender drafts</button>{senders.cursor&&<button disabled={senders.busy} onClick={()=>void senders.loadMore()}>Load more sender drafts</button>}</div>
  {selected&&<SenderEditor key={workspace+':'+selected} workspace={workspace} id={selected} admitted={senders.loaded&&!senders.error} onSaved={()=>void senders.reload()} onCreated={sender=>{open(sender.id);setNotice('Sender draft saved. Sending remains disabled.');void senders.reload();}}/>}
 </section>;
}
const providerHelp={ses:'https://docs.aws.amazon.com/ses/latest/dg/mail-from.html',resend:'https://resend.com/docs/add-a-domain',sendgrid:'https://www.twilio.com/docs/sendgrid/api-reference/domain-authentication/authenticate-a-domain',mailgun:'https://documentation.mailgun.com/docs/mailgun/user-manual/domains/domains-verify'};
function SenderEditor({workspace,id,admitted,onSaved,onCreated}:{workspace:string;id:string;admitted:boolean;onSaved:()=>void;onCreated:(sender:SenderData)=>void}) {
 const [form,setForm]=useState<SenderForm|null>(null),[truth,setTruth]=useState<SenderData|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState(''),[persisted,setPersisted]=useState(true),[denied,setDenied]=useState(false),[refresh,setRefresh]=useState(0),[now,setNow]=useState(Date.now);
 const generation=useRef(0),running=useRef(false),latest=useRef<SenderForm|null>(null),isNew=id==='new';
 const versions=useSenderPage(workspace,isNew?null:'sender-identities/'+id+'/versions?limit=5',SenderVersionView,String(refresh));
 const checks=useSenderPage(workspace,isNew?null:'sender-identities/'+id+'/dns-checks?limit=5',DNSCheckView,String(refresh));
 function install(next:SenderForm){latest.current=next;setForm(next);setPersisted(rememberSenderForm(workspace,id,next));}
 const load=useCallback(async(replace=false)=>{
  if(running.current)return;running.current=true;const epoch=++generation.current;setBusy(true);setError('');
  const recovered=replace?null:readSenderForm(workspace,id);
  try {
   const current=isNew?null:SenderView.parse((await api<{sender:unknown}>(workspace,'sender-identities/'+id)).sender);
   if(generation.current!==epoch)return;
   if(current&&current.id!==id)throw new Error('The saved sender does not match this editor.');
   setTruth(current);setDenied(false);
   const next=recovered?.form??formForSender(current);latest.current=next;setForm(next);
   setPersisted(recovered?.persisted===false?false:rememberSenderForm(workspace,id,next));
   setNotice(recovered?.form?(next.pending?'Original sender command recovered.':senderFormDirty(next)?'Unapplied sender edits recovered.':'Saved sender loaded.'):(replace?'Saved sender loaded. Working edits were replaced.':isNew?'':'Saved sender loaded.'));
  }catch(caught){if(generation.current===epoch){setError(caught instanceof Error?caught.message:'Saved sender could not be loaded.');setDenied(caught instanceof ApiError&&[401,403].includes(caught.status));if(recovered?.form){latest.current=recovered.form;setForm(recovered.form);setPersisted(recovered.persisted);}}}
  finally{if(generation.current===epoch){running.current=false;setBusy(false);}}
 },[workspace,id,isNew]);
 useEffect(()=>{let active=true;void Promise.resolve().then(()=>{if(active)void load();});const fence=generation;return()=>{active=false;fence.current++;};},[load]);
 useEffect(()=>{void Promise.resolve().then(()=>setNow(Date.now()));const timer=setInterval(()=>setNow(Date.now()),60000);return()=>clearInterval(timer);},[refresh]);
 const pending=form?.pending,base=form?.base,dirty=!!form&&senderFormDirty(form),advanced=!!truth&&(!base||truth.version!==base.version);
 const editable=admitted&&!denied&&!!form&&(isNew||!!truth);
 let validation='';
 if(form)try{normalizeSender({...form.working,reply_to:form.working.reply_to||null});}catch{validation='Complete the sender fields with valid addresses and a public domain. Invalid edits are preserved in this form.';}
 function change(field:keyof SenderForm['working'],value:string){const captured=latest.current;if(!captured||running.current||captured.pending||!editable)return;install({...captured,working:{...captured.working,[field]:value}});}
 async function command(kind:'save'|'dns'|'retry') {
  const captured=latest.current;if(running.current||!captured||!admitted||denied||(kind!=='retry'&&(!editable||advanced||captured.pending)))return;
  let original=captured.pending;
  try {
   if(kind==='retry'){if(!original)return;}
   else if(kind==='dns') {
    if(!captured.base||senderFormDirty(captured))return;
    original={kind:'dns',path:'sender-identities/'+captured.base.id+'/dns-checks',key:crypto.randomUUID(),body:JSON.stringify(SenderCheckInput.parse({expected_version:captured.base.version}))};
   }else {
    const draft=SenderDraftInput.parse({...captured.working,reply_to:captured.working.reply_to||null});normalizeSender(draft);
    original=captured.base?{kind:'version',path:'sender-identities/'+captured.base.id+'/versions',key:crypto.randomUUID(),body:JSON.stringify(SenderVersionInput.parse({...draft,expected_version:captured.base.version}))}:{kind:'create',path:'sender-identities',key:crypto.randomUUID(),body:JSON.stringify(draft)};
   }
  }catch{setError('Check the sender fields before saving. Your working text is preserved.');return;}
  running.current=true;const epoch=++generation.current,locked={...captured,pending:original};install(locked);setBusy(true);setError('');setNotice('');
  try {
   const response=await api<{sender?:unknown;check?:unknown;changed?:boolean}>(workspace,original!.path,'POST',JSON.parse(original!.body),undefined,original!.key);
   if(generation.current!==epoch)return;
   const check=original!.kind==='dns'?DNSCheckView.parse(response.check):null,receipt=check?null:SenderView.parse(response.sender);
   if(check&&(check.sender_id!==captured.base?.id||check.sender_version!==captured.base?.version))throw new Error('DNS receipt does not match the original saved version.');
   const senderID=receipt?.id??captured.base!.id;
   const current=SenderView.parse((await api<{sender:unknown}>(workspace,'sender-identities/'+senderID)).sender);
   if(generation.current!==epoch)return;
   if(current.id!==senderID)throw new Error('Current sender does not match the original command.');
   setTruth(current);setDenied(false);
   if(check){const next={...captured};delete next.pending;install(next);setNotice('DNS observation saved for v'+check.sender_version+'. Authentication and sending remain unverified.');}
   else {
    const next=acknowledgeSenderSave(locked,receipt!,current);
    if(isNew&&next.base){rememberSenderForm(workspace,current.id,next);clearSenderForm(workspace,'new');onCreated(current);}
    else install(next);
    setNotice((response.changed===false?'No material change; saved version retained.':'Sender draft saved.')+(current.version!==receipt!.version?' A newer saved version exists. This form retains its original base and working edits until explicit reload.':''));
   }
   setRefresh(value=>value+1);onSaved();
  }catch(caught) {
   if(generation.current!==epoch)return;
   setError(caught instanceof Error?caught.message:'Sender command failed.');
   if(caught instanceof ApiError&&[401,403].includes(caught.status))setDenied(true);
   if(caught instanceof ApiError&&caught.status===409&&captured.base) {
    try{const current=SenderView.parse((await api<{sender:unknown}>(workspace,'sender-identities/'+captured.base.id)).sender);if(generation.current===epoch)setTruth(current);}catch{/* Original command remains recoverable until explicit reload. */}
   }
  }finally{if(generation.current===epoch){running.current=false;setBusy(false);}}
 }
 function copyVersion(snapshot:SenderVersionData){if(!form||busy||pending||!editable||!truth)return;install({...form,working:formForSender({...truth,...snapshot.snapshot}).working});setNotice('Version '+snapshot.version+' copied into working fields. Saving creates a change against the original acknowledged base.');}
 return <div className="campaign-configuration" data-sender-editor={id}>
  <h3>{isNew?'New sender draft':'Sender draft editor'}</h3>
  {error&&<p className="alert danger" role="alert">{error}</p>}{notice&&<p role="status" className="small">{notice}</p>}
  {!persisted&&<p className="alert warning">Browser storage is unavailable. Your working edits and original command remain in this tab. Closing or reloading requires confirmation while unsaved work remains.</p>}
  {!form&&<p role="status">{busy?'Loading saved sender…':'Saved sender is unavailable. Reload before editing.'}</p>}
  {base&&<p className="small break-word">Acknowledged saved version v{base.version}: {base.from_address} · {base.provider} · {base.region} · {base.account_label}. Connection: not connected. Sending: disabled.</p>}
  {advanced&&<p className="alert warning" role="status">Current saved sender is v{truth!.version}. This form retains {base?'base v'+base.version:'the original new draft'} and its working text. Reload saved sender to adopt current truth before saving.</p>}
  {form&&<form onSubmit={event=>{event.preventDefault();void command('save');}}>
   <fieldset disabled={busy||!!pending||!editable}>
    <legend>Sender draft fields</legend>
    <label>Sender draft name<input required maxLength={100} value={form.working.name} onChange={event=>change('name',event.target.value)}/></label>
    <label>Sending provider<select value={form.working.provider} onChange={event=>change('provider',event.target.value)}>{SENDER_PROVIDERS.map(provider=><option key={provider} value={provider}>{provider}</option>)}</select></label>
    <label>Provider account label<input required maxLength={100} value={form.working.account_label} onChange={event=>change('account_label',event.target.value)}/></label>
    <p className="small muted">Use an operator reference for the intended account. This is not a credential or account verification.</p>
    <label>Provider region<input required maxLength={40} value={form.working.region} onChange={event=>change('region',event.target.value)} placeholder="Intended provider region"/></label>
    <label>From name<input required maxLength={100} value={form.working.from_name} onChange={event=>change('from_name',event.target.value)}/></label>
    <label>From address<input required maxLength={254} value={form.working.from_address} onChange={event=>change('from_address',event.target.value)} inputMode="email"/></label>
    <label>Reply-to address (optional)<input maxLength={254} value={form.working.reply_to} onChange={event=>change('reply_to',event.target.value)} inputMode="email"/></label>
   </fieldset>
   {validation&&<p className="small" data-sender-validation>{validation}</p>}
   <div className="toolbar"><button className="primary" disabled={busy||!!pending||!editable||advanced||!!validation}>{isNew?'Save sender draft':'Save new sender version'}</button></div>
  </form>}
  {pending&&<p className="alert warning">The original sender command is unresolved. Retry its exact body and key. A conflict requires explicit reload before a new command.</p>}
  <div className="toolbar">
   {pending&&<button disabled={busy||!admitted||denied} onClick={()=>void command('retry')}>Retry original sender command</button>}
   {!isNew&&<button disabled={busy} onClick={()=>void load(true)}>Reload saved sender (replace working edits)</button>}
   {isNew&&truth&&<button disabled={busy} onClick={()=>{rememberSenderForm(workspace,truth.id,formForSender(truth));clearSenderForm(workspace,'new');onCreated(truth);}}>Load current saved sender (replace working edits)</button>}
   {isNew&&!truth&&<button disabled={busy||!!pending} onClick={()=>void load(true)}>Reset new sender draft</button>}
   {!isNew&&<button disabled={busy||!!pending||!editable||advanced||dirty} onClick={()=>void command('dns')}>Observe saved domain DNS</button>}
  </div>
  <p className="small muted">DNS discovery checks TXT at the exact saved From domain and its _dmarc owner. It does not evaluate full SPF or DMARC policy, DKIM, alignment or received authentication.</p>
  {form&&<p className="small"><a href={providerHelp[form.working.provider]} target="_blank" rel="noreferrer">Official {form.working.provider} domain guidance</a> · Provider-issued records unavailable.</p>}
  <button disabled>Provider account setup unavailable</button>
  {!isNew&&<>
   <section aria-label="Sender version history"><h4>Saved sender versions ({versions.total})</h4>
    {versions.error&&<p className="alert danger" role="alert">{versions.error}</p>}
    {!versions.loaded?<p>{versions.busy?'Loading sender history…':'Sender history unavailable.'}</p>:!versions.data.length?<p>No saved sender versions observed.</p>:<ol>{versions.data.map(version=><li key={version.version} className="break-word"><strong>v{version.version} · {version.snapshot.name}</strong><p className="small">{version.created_at} · {version.created_by}<br/>{version.snapshot.provider} · {version.snapshot.account_label} · {version.snapshot.region}<br/>{version.snapshot.from_name} &lt;{version.snapshot.from_address}&gt; · Reply-to: {version.snapshot.reply_to??'none'} · Domain: {version.snapshot.domain}</p><button disabled={busy||!!pending||!editable||advanced} onClick={()=>copyVersion(version)}>Use version {version.version} as working draft</button></li>)}</ol>}
    <div className="toolbar"><button disabled={versions.busy} onClick={()=>void versions.reload()}>Refresh sender versions</button>{versions.cursor&&<button disabled={versions.busy} onClick={()=>void versions.loadMore()}>Load older sender versions</button>}</div>
   </section>
   <section aria-label="DNS observation history"><h4>DNS observations ({checks.total})</h4>
    <p className="small muted">Freshness is a 15-minute display hint. Every observation is discovery evidence; it never authorizes a send.</p>
    {checks.error&&<p className="alert danger" role="alert">{checks.error}</p>}
    {!checks.loaded?<p>{checks.busy?'Loading DNS observations…':'DNS observations unavailable.'}</p>:!checks.data.length?<p>No DNS observations yet.</p>:<ol>{checks.data.map(check=>{const age=now-Date.parse(check.observation.observed_at),older=check.sender_version!==(truth?.version??base?.version),fresh=age>=0&&age<=15*60*1000;return <li key={check.id} className="break-word"><strong>Sender v{check.sender_version} · {older?'Older-version evidence':'Current-version evidence'} · {fresh?'Within 15-minute display window':'Stale evidence'}</strong><p className="small">Observed {check.observation.observed_at} · {check.created_by} · {check.observation.domain}<br/>Provider unverified · Authentication unverified · Sending disabled</p>{(['spf','dmarc'] as const).map(purpose=><div key={purpose}><p className="small"><strong>{purpose.toUpperCase()} exact-owner TXT</strong>: {check.observation[purpose].owner} · {check.observation[purpose].status.replaceAll('_',' ')}{check.observation[purpose].error?' · '+check.observation[purpose].error.replaceAll('_',' '):''}</p>{purpose==='spf'&&check.observation.spf.status==='multiple_records'&&<p className="alert warning">Multiple SPF records were observed. Do not publish another or conflicting SPF record.</p>}{check.observation[purpose].records.map((record,index)=><pre key={index} style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere',maxWidth:'100%'}}>{record}</pre>)}</div>)}</li>;})}</ol>}
    <div className="toolbar"><button disabled={checks.busy} onClick={()=>setRefresh(value=>value+1)}>Refresh DNS observations</button>{checks.cursor&&<button disabled={checks.busy} onClick={()=>void checks.loadMore()}>Load older DNS observations</button>}</div>
   </section>
  </>}
 </div>;
}
