'use client';
import{useCallback,useEffect,useRef,useState}from'react';import{EVENT_TYPES}from'@/domain/events';import type{WebhookEndpointRecord}from'@/domain/webhooks';import{api}from'./api';import{beginWebhookCommand,finishWebhookCommand,type WebhookCommandReceipt}from'./webhook-command';
type Page={data:WebhookEndpointRecord[];has_more:boolean;next_cursor:string|null;total_count:number;configuration:{key_configured:boolean;delivery_enabled:false}};
type Result={endpoint:WebhookEndpointRecord;secret?:string;secret_available:boolean;issued_secret_version?:number};
export function WebhookEndpoints(props:{workspace:string;role:string}){return<ScopedWebhookEndpoints key={props.workspace+':'+props.role}{...props}/>;}
function ScopedWebhookEndpoints({workspace,role}:{workspace:string;role:string}){
 const manager=['Owner','Admin'].includes(role),epoch=useRef(0),running=useRef(false),alive=useRef(true),snapshot=useRef<Page|null>(null);
 const[page,setPage]=useState<Page|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState(''),[secret,setSecret]=useState(''),[secretVersion,setSecretVersion]=useState(0),[name,setName]=useState(''),[url,setUrl]=useState(''),[subscriptions,setSubscriptions]=useState<string[]>(['contact.unsubscribed']),[cutover,setCutover]=useState(false);
 const load=useCallback(async(older=false)=>{
  if(running.current||!manager||!alive.current)return;const previous=snapshot.current;if(older&&!previous?.next_cursor)return;
  running.current=true;setBusy(true);setError('');setMessage('');const current=++epoch.current;
  try{
   const result=await api<Page>(workspace,'webhook-endpoints'+(older?'?after='+encodeURIComponent(previous!.next_cursor!):''));
   if(epoch.current!==current)return;
   const next=older?{...result,data:[...previous!.data,...result.data.filter((item)=>!previous!.data.some((old)=>old.id===item.id))]}:result;snapshot.current=next;setPage(next);
  }catch(cause){if(epoch.current===current)setError(cause instanceof Error?cause.message:'Endpoint history could not be loaded.');}
  finally{if(epoch.current===current){running.current=false;setBusy(false);}}
 },[manager,workspace]);
 useEffect(()=>{alive.current=true;void Promise.resolve().then(()=>load());const fence=epoch,life=alive;return()=>{life.current=false;fence.current++;};},[load]); // Wrapper remounts on workspace or role change.
 async function command(path:string,input:unknown){
  if(running.current)return;running.current=true;setBusy(true);setError('');setMessage('');setSecret('');const current=++epoch.current;let acknowledged=false,receipt:WebhookCommandReceipt|undefined;
  try{
   receipt=await beginWebhookCommand(workspace,path,input);const result=await api<Result>(workspace,path,'POST',receipt.input??input,undefined,receipt.key);finishWebhookCommand(receipt);if(epoch.current!==current)return;acknowledged=true;
   setSecret(result.secret??'');setSecretVersion(result.issued_secret_version??0);
   setMessage(result.secret?'Signing key created. Save it privately now; it is shown once.':path.endsWith('/pause')?'Endpoint pause acknowledged. Authorized in-flight requests may still complete.':'Command already acknowledged. The secret cannot be recovered; rotate this endpoint if needed.');
   if(path==='webhook-endpoints'){setName('');setUrl('');}
   const refreshed=await api<Page>(workspace,'webhook-endpoints');if(epoch.current===current){snapshot.current=refreshed;setPage(refreshed);}
  }catch(cause){if(epoch.current===current)setError((acknowledged?'The command is saved; refreshing its state failed. ':'')+(cause instanceof Error?cause.message:'Webhook command failed. Your values remain here.'));}
  finally{if(epoch.current===current){running.current=false;setBusy(false);}}
 }
 const locked=busy||!!secret;
 return<section className="panel webhook-endpoints-panel">
  <h2>Webhook endpoints</h2><p className="muted">Resource IDs and versions, with signed receipts. Targets are checked against public DNS; HTTP delivery and receiver acknowledgment require a configured worker.</p>
  <p className="alert warning">Outbound delivery is disabled. New endpoints stay paused. A saved endpoint does not prove target availability, external acknowledgment or email delivery.</p>
  {!manager?<p>Owner or Admin access is required to manage webhook endpoints.</p>:<>
   {error&&<p role="alert"className="alert danger">{error}</p>}{message&&<p role="status">{message}</p>}
   {!page&&!error&&<p role="status">Loading webhook endpoints…</p>}
   {page&&!page.configuration.key_configured&&<p className="alert warning">Private encryption keys are unconfigured. Create and rotation remain unavailable; existing endpoint history is readable.</p>}
   {secret&&<div className="alert warning"><p>Signing key version {secretVersion}. Keep it in the receiver&apos;s private secret manager.</p><label htmlFor={'webhook-signing-secret-'+workspace}>One-time webhook signing secret</label><textarea id={'webhook-signing-secret-'+workspace}readOnly value={secret}style={{overflowWrap:'anywhere'}}/><button onClick={()=>setSecret('')}>Dismiss signing secret</button></div>}
   <label>Endpoint name<input value={name}disabled={locked}onChange={(event)=>setName(event.target.value)}maxLength={100}/></label>
   <label>Webhook HTTPS URL<input value={url}disabled={locked}onChange={(event)=>setUrl(event.target.value)}placeholder="https://receiver.example/webhook"maxLength={2048}/></label>
   <fieldset disabled={locked}><legend>Event subscriptions</legend>{EVENT_TYPES.map((type)=><label className="checkbox-label"key={type}><input type="checkbox"checked={subscriptions.includes(type)}onChange={(event)=>setSubscriptions(event.target.checked?[...subscriptions,type]:subscriptions.filter((value)=>value!==type))}/>{type}</label>)}</fieldset>
   <button disabled={locked||!page?.configuration.key_configured||!name.trim()||!url.trim()||!subscriptions.length}onClick={()=>void command('webhook-endpoints',{name,url,subscriptions})}>Create paused endpoint</button>
   <div className="toolbar"><p>{page?.total_count??0} endpoints</p><button disabled={locked}onClick={()=>void load()}>Reload webhook endpoints</button></div>
   {page&&!page.total_count&&<p className="muted">No webhook endpoint yet.</p>}
   <label className="checkbox-label"><input type="checkbox"checked={cutover}disabled={locked}onChange={(event)=>setCutover(event.target.checked)}/>Retire the earlier overlap key if needed. I acknowledge that receivers using that key must cut over.</label>
   <p className="small muted">Proposed development overlap:24 hours. Rotation shows a fresh secret once; the previous key remains available through its recorded expiry. Early retirement requires this explicit acknowledgment.</p>
   {page?.data.map((endpoint)=><article key={endpoint.id}className="event-receipt"style={{overflowWrap:'anywhere'}}>
    <h3>{endpoint.name}</h3><p>{endpoint.target_origin} · {endpoint.status} · version {endpoint.version} · signing key {endpoint.secret_version}</p><p className="small muted">{endpoint.subscriptions.join(', ')}</p>
    <button disabled={locked||!page.configuration.key_configured||endpoint.status==='disabled'}onClick={()=>void command('webhook-endpoints/'+endpoint.id+'/rotate',{expected_version:endpoint.version,retire_previous:cutover,acknowledge_key_cutover:cutover})}>Rotate signing key for {endpoint.name}</button>
    <button disabled={locked||endpoint.status==='disabled'}onClick={()=>void command('webhook-endpoints/'+endpoint.id+'/pause',{expected_version:endpoint.version})}>Pause {endpoint.name}</button>
   </article>)}
   {page?.has_more&&<button disabled={locked}onClick={()=>void load(true)}>Load older webhook endpoints</button>}
  </>}
 </section>;
}
