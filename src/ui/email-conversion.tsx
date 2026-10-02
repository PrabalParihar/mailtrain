'use client';
import {useEffect,useRef,useState} from 'react';
import type {EmailSpec} from '../domain/email';
import {ConversionAcceptInput,ConversionProposalSchema,type ConversionProposal} from '../domain/email-conversion-contracts';
import {ConversionContextSchema,ConversionRefused,conversionContextMatches,readConversionRecovery,rememberConversionRecovery,clearConversionRecovery,type ConversionContext,type ConversionRecovery} from './conversion-recovery';
import {conversionPreview} from './conversion-preview';

export type EmailConversionProps={workspace:string;email:string;actor:string;spec:EmailSpec;version:number;canEdit:boolean;blocked:boolean;
 onPrepare:()=>Promise<{proposal:ConversionProposal;context:ConversionContext}|null>;
 onAccept:(command:{body:ReturnType<typeof ConversionAcceptInput.parse>;key:string},context:ConversionContext)=>Promise<void>;
 onDiscardRefused:()=>Promise<void>};
export function EmailConversion(props:EmailConversionProps){
 if(!props.actor)return <section aria-label="Block conversion"><p role="status">Verified account context is unavailable. Reload before reviewing conversion.</p></section>;
 return <ConversionController key={JSON.stringify([props.workspace,props.actor,props.email])} {...props}/>;
}
function ConversionController(props:EmailConversionProps){
 const scope={workspace:props.workspace,email:props.email,actor:props.actor};
 const [proposal,setProposal]=useState<{value:ConversionProposal;context:ConversionContext}|null>(null),[pending,setPending]=useState<ConversionRecovery|null>(null),[ack,setAck]=useState(false),[busy,setBusy]=useState(false),[loaded,setLoaded]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState(''),[persisted,setPersisted]=useState(true),[denied,setDenied]=useState(false);
 const active=useRef(true),running=useRef(false);
 useEffect(()=>{active.current=true;const recovered=readConversionRecovery({workspace:props.workspace,email:props.email,actor:props.actor});void Promise.resolve().then(()=>{if(active.current){setPending(recovered.pending);setPersisted(recovered.persisted);setLoaded(true);if(recovered.pending)setNotice(recovered.pending.refusal?'Refused conversion command recovered. Discard it explicitly to check saved source again.':'Original conversion command recovered. Retry its exact acknowledgment.');}});return()=>{active.current=false;};},[props.workspace,props.email,props.actor]);
 const stale=!!proposal&&!conversionContextMatches(proposal.context,props.version,props.spec),allowed=loaded&&props.canEdit&&!props.blocked&&!denied;
 async function prepare(){
  if(running.current||!allowed||pending||props.spec.editing_mode!=='raw_html')return;
  running.current=true;setBusy(true);setError('');setNotice('');setAck(false);setProposal(null);
  try{const result=await props.onPrepare();if(!active.current)return;if(!result){setNotice('Conversion proposal is unavailable. Your raw source is preserved.');return;}
   const value=ConversionProposalSchema.parse(result.proposal),context=ConversionContextSchema.parse(result.context);
   if(value.source_doc_version!==context.version)throw Error('The conversion proposal does not match its saved source version.');
   setProposal({value,context});
  }catch(caught){if(active.current){setError(caught instanceof Error?caught.message:'Conversion proposal could not be prepared.');if([401,403].includes((caught as {status?:number})?.status??0))setDenied(true);}}
  finally{running.current=false;if(active.current)setBusy(false);}
 }
 async function accept(retry=false){
  if(running.current||!loaded||!props.canEdit||props.blocked||denied)return;
  let original=pending;
  if(!retry){if(pending||!proposal||proposal.value.status!=='available'||stale||!ack)return;
   original={schema_version:1,...scope,context:proposal.context,command:{body:ConversionAcceptInput.parse({expected_version:proposal.context.version,source_hash:proposal.value.source_hash,proposal_hash:proposal.value.proposal_hash,acknowledge_layout_change:true}),key:crypto.randomUUID()}};
  }
  if(!original||original.refusal||original.actor!==props.actor||original.workspace!==props.workspace||original.email!==props.email)return;
  running.current=true;setBusy(true);setError('');setNotice('');setPending(original);setPersisted(rememberConversionRecovery(scope,original));
  try{await props.onAccept(original.command,original.context);if(!active.current)return;clearConversionRecovery(scope);setPending(null);setProposal(null);setAck(false);setPersisted(true);setNotice('Conversion acknowledged. The editor shows its current saved document.');}
  catch(caught){if(active.current){setError(caught instanceof Error?caught.message:'Conversion acknowledgment remains unresolved.');if(caught instanceof ConversionRefused){const refused={...original,refusal:caught.refusal};setPending(refused);setPersisted(rememberConversionRecovery(scope,refused));}if([401,403].includes((caught as {status?:number})?.status??0))setDenied(true);}}
  finally{running.current=false;if(active.current)setBusy(false);}
 }
 async function discardRefused(){
  if(running.current||!loaded||!props.canEdit||denied||!pending?.refusal)return;
  running.current=true;setBusy(true);setError('');
  try{await props.onDiscardRefused();if(!active.current)return;clearConversionRecovery(scope);setPending(null);setProposal(null);setAck(false);setPersisted(true);setNotice('Refused command discarded. Current saved source was checked; any local edits are preserved. Review again after resolving any draft conflict.');}
  catch(caught){if(active.current){setError(caught instanceof Error?caught.message:'Current source could not be checked. The refused command is retained.');if([401,403].includes((caught as {status?:number})?.status??0))setDenied(true);}}
  finally{running.current=false;if(active.current)setBusy(false);}
 }
 return <section className="panel" aria-label="Block conversion" data-email-conversion style={{maxWidth:'100%',minWidth:0}}>
  <h3>Review raw HTML conversion</h3>
  <p>Review a separate block proposal before changing this document. The original raw source stays intact until acceptance, and is checkpointed when conversion succeeds.</p>
  {error&&<p role="alert" className="alert danger">{error}</p>}{notice&&<p role="status" className="small">{notice}</p>}
  {!loaded&&<p role="status">Loading conversion recovery…</p>}
  {!persisted&&pending&&<p role="alert" className="alert warning">Browser storage is unavailable. The original conversion command remains in this tab. Closing or reloading requires confirmation while acknowledgment is unresolved.</p>}
  {!props.canEdit&&<p role="status">Editing permission is required to review or accept conversion.</p>}
  {denied&&<p role="status">Current permission was denied. The original command is retained. Reload after your account access is restored.</p>}
  {pending?pending.refusal?<><p className="alert warning" role="status">The original acceptance was refused before saving: {pending.refusal.message} Discard this refused command explicitly to check current saved source and review again. Your local edits will be preserved.</p><button disabled={busy||!loaded||!props.canEdit||denied} onClick={()=>void discardRefused()}>Discard refused conversion command</button></>:<><p className="alert warning" role="status">The original conversion acknowledgment is unresolved. Retry the same body and key, even if the current document has advanced. No new conversion command will be created.</p><button disabled={busy||!allowed} onClick={()=>void accept(true)}>Retry original conversion</button></>:<button disabled={busy||!allowed||props.spec.editing_mode!=='raw_html'} onClick={()=>void prepare()}>Review block conversion</button>}
  {!proposal&&!pending&&<p className="small muted">{props.spec.editing_mode==='raw_html'?'No conversion proposal has been reviewed.':'This document is in block mode. Raw HTML conversion is available only for a raw draft.'}</p>}
  {proposal&&<>
   {stale&&<p role="status" className="alert warning">The source changed after this proposal was prepared. Your current edits are preserved. Discard this proposal and review the saved source again.</p>}
   <p className="small">Saved source v{proposal.context.version} · {proposal.value.converted_nodes} converted nodes · {proposal.value.opaque_nodes} preserved opaque nodes.</p>
   <ul>{proposal.value.notes.map((note,index)=><li key={index} style={{overflowWrap:'anywhere'}}>{note.message}</li>)}</ul>
   {proposal.value.status==='unsupported'&&<p role="status" className="alert warning">Conversion is unavailable for this source. The original raw document is preserved.</p>}
   <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,340px),1fr))',gap:12,maxWidth:'100%',minWidth:0}}>
    <div style={{minWidth:0}}><h4>Original raw preview</h4><iframe title="Original raw conversion preview" sandbox="" referrerPolicy="no-referrer" tabIndex={0} srcDoc={conversionPreview(proposal.value.original_html)} style={{width:'100%',height:280,border:'1px solid #dce2e0',boxSizing:'border-box'}}/></div>
    <div style={{minWidth:0}}><h4>Proposed block preview</h4>{proposal.value.preview_html!==null?<iframe title="Proposed block conversion preview" sandbox="" referrerPolicy="no-referrer" tabIndex={0} srcDoc={conversionPreview(proposal.value.preview_html)} style={{width:'100%',height:280,border:'1px solid #dce2e0',boxSizing:'border-box'}}/>:<p>No safe block proposal is available.</p>}</div>
   </div>
   <p className="small muted">Scroll each preview to review its full content. Keyboard users can focus a preview and use Page Up and Page Down. These static previews disable link destinations and remote images; browser-normalized preview markup can differ from the saved source.</p>
   {!pending&&<><label style={{display:'flex',alignItems:'flex-start',gap:8,marginTop:12}}><input type="checkbox" checked={ack} disabled={busy||!allowed||stale||proposal.value.status!=='available'} onChange={event=>setAck(event.target.checked)} style={{width:'auto',flexShrink:0}}/>I reviewed both previews and acknowledge that block rendering can change layout.</label><div className="toolbar"><button disabled={busy||!allowed||stale||!ack||proposal.value.status!=='available'} onClick={()=>void accept()}>Accept block conversion</button><button disabled={busy} onClick={()=>{setProposal(null);setAck(false);setError('');setNotice('Proposal discarded. The raw document was not converted.');}}>Discard conversion proposal</button></div></>}
  </>}
 </section>;
}
