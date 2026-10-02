'use client';
import{useRef,useState}from'react';import{UTMParameters,type UTMParameterData}from'@/domain/utm';import{trackingFingerprint}from'@/domain/email-utm';import{readUTMWorking,rememberUTMWorking,clearUTMWorking,formAtFingerprint}from'./utm-recovery';
const empty={utm_source:'',utm_medium:'',utm_campaign:''};
export function EmailUTM({workspace,email,policy,canEdit,blocked,onApply}:{workspace:string;email:string;policy:UTMParameterData|undefined;canEdit:boolean;blocked:boolean;onApply:(policy:UTMParameterData|undefined,expected:string)=>string|null}){
 const[recovery]=useState(()=>canEdit?readUTMWorking(workspace,email):null);
 const[form,setForm]=useState(()=>({...recovery?.working.form??policy??empty})),[enabled,setEnabled]=useState(recovery?.working.enabled??!!policy),[base,setBase]=useState(()=>recovery?.working.base??trackingFingerprint(policy)),[error,setError]=useState(''),[notice,setNotice]=useState(''),[persisted,setPersisted]=useState(recovery?.persisted??true);const baseRef=useRef(base);
 const stale=trackingFingerprint(policy)!==base,locked=!canEdit||blocked||stale;
 const baseline=formAtFingerprint(base);const unapplied=enabled!==(base!=='none')||(['utm_source','utm_medium','utm_campaign']as const).some(name=>form[name]!==baseline[name]);
 function remember(nextForm:UTMParameterData,nextEnabled:boolean){const changed=nextEnabled!==(baseRef.current!=='none')||(['utm_source','utm_medium','utm_campaign']as const).some(name=>nextForm[name]!==baseline[name]);setPersisted(changed?rememberUTMWorking(workspace,email,{base:baseRef.current,enabled:nextEnabled,form:nextForm}):clearUTMWorking(workspace,email));}
 function reload(){setForm({...policy??empty});setEnabled(!!policy);const next=trackingFingerprint(policy);baseRef.current=next;setBase(next);setPersisted(clearUTMWorking(workspace,email));setError('');setNotice('Current UTM settings loaded. Other draft fields are unchanged.');}
 function apply(remove=false){if(locked)return;let value:UTMParameterData|undefined;
  if(enabled&&!remove){const parsed=UTMParameters.safeParse(form);if(!parsed.success){setError('Enter all three nonblank UTM values. Use shorter text without control characters. Your settings are retained.');setNotice('');return;}value=parsed.data;}
  const refused=onApply(value,baseRef.current);if(refused){setError(refused);setNotice('');return;}
  const next=trackingFingerprint(value);baseRef.current=next;setBase(next);setEnabled(!!value);setForm({...value??empty});setPersisted(clearUTMWorking(workspace,email));setError('');setNotice(value?'UTM applied to the draft. Check the save status above.':'UTM removed from the draft. Existing source links and frozen checkpoints keep their own values. Check the save status above.');
 }
 return<section className="panel utm-panel" aria-label="UTM parameters">
  <h2>UTM parameters</h2><p className="small muted">Optional source, medium and campaign values for marketing links. These settings do not enable engagement collection or establish recipient consent. Source links and older checkpoints stay intact.</p>
  {!canEdit&&<p className="small muted">Your role can view these settings.</p>}
  {stale&&<p className="alert warning" role="alert">The draft’s UTM policy changed. Your working settings are retained. Reload UTM settings before applying them.</p>}
  {blocked&&canEdit&&<p className="small muted">Resolve the draft conflict or wait for the current action before applying UTM.</p>}
  {unapplied&&<p className="small" role="status">Unapplied UTM settings are retained separately from the saved draft. Apply them explicitly to change the draft.</p>}
  {unapplied&&!persisted&&<p className="alert warning" role="alert">Local recovery storage is unavailable. Your UTM settings stay in this tab during navigation. Leaving or reloading this tab requires discarding these unapplied settings.</p>}
  <fieldset disabled={!canEdit||blocked}>
   <label className="checkbox-label"><input type="checkbox" checked={enabled} onChange={event=>{setEnabled(event.target.checked);remember(form,event.target.checked);setError('');setNotice('');}}/>Enable UTM parameters</label>
   <div className="field-row">{(['utm_source','utm_medium','utm_campaign']as const).map((name,index)=><label key={name}>{['UTM source','UTM medium','UTM campaign'][index]}<input disabled={!enabled} maxLength={128} value={form[name]} onChange={event=>{const next={...form,[name]:event.target.value};setForm(next);remember(next,enabled);setError('');setNotice('');}}/></label>)}</div>
   <div className="toolbar"><button type="button" disabled={stale} onClick={()=>apply()}>Apply UTM to draft</button><button type="button" disabled={stale||!policy} onClick={()=>apply(true)}>Remove UTM from draft</button></div>
  </fieldset>
  {stale&&<button type="button" disabled={blocked} onClick={reload}>Reload UTM settings</button>}
  {error&&<p className="alert danger" role="alert">{error}</p>}{notice&&<p className="small" role="status">{notice}</p>}
 </section>;
}
