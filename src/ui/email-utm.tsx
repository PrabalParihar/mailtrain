'use client';
import{useRef,useState}from'react';import{UTMParameters,type UTMParameterData}from'@/domain/utm';import{trackingFingerprint}from'@/domain/email-utm';
const empty={utm_source:'',utm_medium:'',utm_campaign:''};
export function EmailUTM({policy,canEdit,blocked,onApply}:{policy:UTMParameterData|undefined;canEdit:boolean;blocked:boolean;onApply:(policy:UTMParameterData|undefined,expected:string)=>string|null}){
 const[form,setForm]=useState(()=>({...policy??empty})),[enabled,setEnabled]=useState(!!policy),[base,setBase]=useState(()=>trackingFingerprint(policy)),[error,setError]=useState(''),[notice,setNotice]=useState('');const baseRef=useRef(base);
 const stale=trackingFingerprint(policy)!==base,locked=!canEdit||blocked||stale;
 function reload(){setForm({...policy??empty});setEnabled(!!policy);const next=trackingFingerprint(policy);baseRef.current=next;setBase(next);setError('');setNotice('Current UTM settings loaded. Other draft fields are unchanged.');}
 function apply(remove=false){if(locked)return;let value:UTMParameterData|undefined;
  if(enabled&&!remove){const parsed=UTMParameters.safeParse(form);if(!parsed.success){setError('Enter all three nonblank UTM values. Use shorter text without control characters. Your settings are retained.');setNotice('');return;}value=parsed.data;}
  const refused=onApply(value,baseRef.current);if(refused){setError(refused);setNotice('');return;}
  const next=trackingFingerprint(value);baseRef.current=next;setBase(next);setEnabled(!!value);setError('');setNotice(value?'UTM applied to the draft. Check the save status above.':'UTM removed from the draft. Existing source links and frozen checkpoints keep their own values. Check the save status above.');
 }
 return<section className="panel utm-panel" aria-label="UTM parameters">
  <h2>UTM parameters</h2><p className="small muted">Optional source, medium and campaign values for marketing links. These settings do not enable engagement collection or establish recipient consent. Source links and older checkpoints stay intact.</p>
  {!canEdit&&<p className="small muted">Your role can view these settings.</p>}
  {stale&&<p className="alert warning" role="alert">The draft’s UTM policy changed. Your working settings are retained. Reload UTM settings before applying them.</p>}
  {blocked&&canEdit&&<p className="small muted">Resolve the draft conflict or wait for the current action before applying UTM.</p>}
  <fieldset disabled={!canEdit||blocked}>
   <label className="checkbox-label"><input type="checkbox" checked={enabled} onChange={event=>{setEnabled(event.target.checked);setError('');setNotice('');}}/>Enable UTM parameters</label>
   <div className="field-row">{(['utm_source','utm_medium','utm_campaign']as const).map((name,index)=><label key={name}>{['UTM source','UTM medium','UTM campaign'][index]}<input disabled={!enabled} maxLength={128} value={form[name]} onChange={event=>{setForm(current=>({...current,[name]:event.target.value}));setError('');setNotice('');}}/></label>)}</div>
   <div className="toolbar"><button type="button" disabled={stale} onClick={()=>apply()}>Apply UTM to draft</button><button type="button" disabled={stale||!policy} onClick={()=>apply(true)}>Remove UTM from draft</button></div>
  </fieldset>
  {stale&&<button type="button" disabled={blocked} onClick={reload}>Reload UTM settings</button>}
  {error&&<p className="alert danger" role="alert">{error}</p>}{notice&&<p className="small" role="status">{notice}</p>}
 </section>;
}
