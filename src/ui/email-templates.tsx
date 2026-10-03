'use client';
import {useEffect,useRef,useState} from 'react';
import {useRouter} from 'next/navigation';
import {api} from './api';
import {useResourcePage} from './paged';
import type {Role} from '../domain/permissions';
import {EmailTemplateViewSchema,type EmailTemplateView} from '../domain/email-templates';
import {getTemplateCoordinator,initialTemplateMutationSnapshot,type TemplateMutationCoordinator,type TemplateScope} from './template-recovery';
type Context=TemplateScope&{role:Role};
const writable=(role:Role)=>['Owner','Admin','Editor'].includes(role);
function useTemplateMutation(scope:Context,onSuccess:()=>void,onDismiss?:()=>void){
 const [snapshot,setSnapshot]=useState(initialTemplateMutationSnapshot),active=useRef(true),coordinator=useRef<TemplateMutationCoordinator|null>(null),router=useRouter();
 const workspace=scope.workspace,actor=scope.actor;
 useEffect(()=>{
  active.current=true;let mounted=true,unsubscribe:(()=>void)|undefined;
  void Promise.resolve().then(()=>{
   if(!mounted)return;
   try{
    const shared=getTemplateCoordinator(localStorage,{workspace,actor});coordinator.current=shared;
    unsubscribe=shared.subscribe(()=>{if(mounted)setSnapshot(shared.getSnapshot());});shared.reconcile();
   }catch(e){setSnapshot({...initialTemplateMutationSnapshot,error:(e as Error).message});}
  });
  return()=>{mounted=false;active.current=false;unsubscribe?.();};
 },[workspace,actor]);
 async function run(path?:string,body?:unknown,sourceRevision?:string){
  if(!snapshot.ready||!writable(scope.role)||!coordinator.current)return;
  const result=await coordinator.current.run(path?{path,body,sourceRevision}:undefined,command=>api(workspace,command.path,'POST',command.body,undefined,command.key,undefined,actor),()=>active.current);
  if(!active.current||!result)return;
  onSuccess();if(result.emailId)router.push('/app/emails/'+result.emailId);
 }
 async function dismiss(){
  if(!snapshot.ready||!writable(scope.role)||!coordinator.current||!snapshot.pending)return;
  const dismissed=await coordinator.current.dismiss(snapshot.pending);
  if(dismissed&&active.current)onDismiss?.();
 }
 return {...snapshot,run,dismiss};
}
function Recovery({mutation}:{mutation:ReturnType<typeof useTemplateMutation>}){return <>{mutation.error&&<p className="alert danger" role="alert">{mutation.error}</p>}{mutation.pending&&<div className="alert warning">{mutation.pending.rejection?<p>The server rejected this original command without committing it ({mutation.pending.rejection.code}). Dismiss it to continue with refreshed template metadata.</p>:<p>The original template command is awaiting acknowledgment. Its original name, frozen revision and command key are preserved.</p>}<p className="small break-word">{mutation.pending.path} · {'name'in mutation.pending.body?mutation.pending.body.name:'title'in mutation.pending.body?mutation.pending.body.title:'Archive template'}</p>{mutation.pending.rejection?<button disabled={mutation.busy||!mutation.ready} onClick={()=>void mutation.dismiss()}>Dismiss rejected command</button>:<button disabled={mutation.busy||!mutation.ready} onClick={()=>void mutation.run()}>Retry original command</button>}</div>}</>;}
export function EmailTemplatesPanel(props:Context){return <Catalogue key={JSON.stringify([props.workspace,props.actor,props.role])} {...props}/>;}
function Catalogue(scope:Context){
 const [state,setState]=useState<'active'|'archived'>('active'),[refresh,setRefresh]=useState(0),[detail,setDetail]=useState<EmailTemplateView|null>(null),[title,setTitle]=useState(''),[detailError,setDetailError]=useState(''),inspectGuard=useRef(false),alive=useRef(true),detailEpoch=useRef(0);
 const page=useResourcePage<EmailTemplateView>(scope.role==='Billing'?'':scope.workspace,'templates?state='+state,String(refresh)),mutation=useTemplateMutation(scope,()=>{detailEpoch.current++;setRefresh(v=>v+1);setDetail(null);},()=>{detailEpoch.current++;setRefresh(v=>v+1);setDetail(null);});
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
 async function inspect(id:string){if(inspectGuard.current)return;inspectGuard.current=true;const epoch=++detailEpoch.current;setDetailError('');try{const result=await api<{template:EmailTemplateView}>(scope.workspace,'templates/'+id,'GET',undefined,undefined,undefined,undefined,scope.actor);const template=EmailTemplateViewSchema.parse(result.template);if(template.id!==id)throw Error('The template detail response did not match the selected template.');if(alive.current&&epoch===detailEpoch.current){setDetail(template);setTitle((template.name+' draft').slice(0,160));}}catch(e){if(alive.current&&epoch===detailEpoch.current)setDetailError((e as Error).message);}finally{inspectGuard.current=false;}}
 if(scope.role==='Billing')return <section className="panel"><h1>Templates</h1><p>Your role cannot view email templates.</p></section>;
 return <section className="panel" aria-label="Email templates"><div className="section-heading"><h1>Templates</h1><button disabled={page.busy} onClick={()=>void page.reload()}>Refresh templates</button></div><p className="muted">Templates preserve a saved email revision. Reusing one creates a separate editable draft.</p><label>Template state <select value={state} onChange={e=>{detailEpoch.current++;setState(e.target.value as 'active'|'archived');setDetail(null);}}><option value="active">Active</option><option value="archived">Archived</option></select></label>{page.busy&&<p role="status">Loading templates…</p>}{page.error&&<p className="alert danger" role="alert">{page.error}</p>}{page.loaded&&!page.data.length&&<p>No {state} templates yet.{state==='active'?' Save a frozen revision from an email editor to get started.':''}</p>}{writable(scope.role)&&<Recovery mutation={mutation}/>} {detailError&&<p role="alert" className="alert danger">{detailError}</p>}{page.data.map(t=><article className="panel" key={t.id}><h2 className="break-word">{t.name}</h2><Metadata template={t}/><button onClick={()=>void inspect(t.id)}>View template {t.name}</button></article>)}{page.hasMore&&<button disabled={page.busy} onClick={()=>void page.loadMore()}>Load more templates</button>}{detail&&<section className="panel" aria-label="Template details"><h2 className="break-word">{detail.name}</h2><Metadata template={detail}/>{writable(scope.role)&&detail.state==='active'&&<><label>New draft title<input maxLength={160} value={title} onChange={e=>setTitle(e.target.value)}/></label><button disabled={!mutation.ready||mutation.busy||!!mutation.pending||!title.trim()} onClick={()=>void mutation.run('templates/'+detail.id+'/remix',{title:title.trim(),expected_version:detail.version,expected_artifact_hash:detail.artifact_hash},detail.source_revision_id)}>Create separate draft</button><button disabled={!mutation.ready||mutation.busy||!!mutation.pending} onClick={()=>void mutation.run('templates/'+detail.id+'/archive',{expected_version:detail.version})}>Archive template</button></>}<button onClick={()=>{detailEpoch.current++;setDetail(null);}}>Close details</button></section>}</section>;
}
function Metadata({template:t}:{template:EmailTemplateView}){return <><p className="break-word">Source title when saved: {t.source_title} · revision {t.source_revision_no}</p><p className="small">Frozen {t.locale} · {t.direction} · {t.editing_mode} · {t.state}</p><p className="small break-word">Brand: {t.brand_kit_version_id} · Hash: {t.artifact_hash}</p></>;}
export function SaveEmailTemplate(props:Context&{revisionId:string;artifactHash:string}){return <SaveControl key={JSON.stringify([props.workspace,props.actor,props.role])} {...props}/>;}
function SaveControl(props:Context&{revisionId:string;artifactHash:string}){
 const [name,setName]=useState(''),[saved,setSaved]=useState(false),mutation=useTemplateMutation(props,()=>setSaved(true));
 if(!writable(props.role))return null;
 return <section className="panel" aria-label="Save frozen revision as template"><h3>Save as template</h3><p className="small muted">This saves the selected frozen revision. Save working changes first to include them.</p><label>Template name<input maxLength={160} value={name} onChange={e=>{setName(e.target.value);setSaved(false);}}/></label><button disabled={!mutation.ready||mutation.busy||!!mutation.pending||!name.trim()||!props.revisionId||!props.artifactHash} onClick={()=>void mutation.run('templates',{name:name.trim(),source_revision_id:props.revisionId,expected_artifact_hash:props.artifactHash})}>Save frozen revision as template</button>{saved&&<p role="status">Frozen revision saved as a template.</p>}<Recovery mutation={mutation}/></section>;
}
