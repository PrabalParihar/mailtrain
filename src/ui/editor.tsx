'use client';
import{DestinationExportPanel}from'./klaviyo-export';
import{KlaviyoReview as KlaviyoReviewSchema,type KlaviyoReview}from'../domain/esp-export-contracts';
import{MailchimpReview as MailchimpReviewSchema,type MailchimpReview}from'../domain/mailchimp-export-contracts';
import{OmnisendReview as OmnisendReviewSchema,type OmnisendReview}from'../domain/omnisend-export-contracts';
import{BrevoReview as BrevoReviewSchema,type BrevoReview}from'../domain/brevo-export-contracts';
import{HubSpotReview as HubSpotReviewSchema,type HubSpotReview,type HubSpotFooterSettingsData}from'../domain/hubspot-footer-contracts';
import{snapshotHubSpotSettings,hubspotSettingsDigest,sameHubSpotSettings,requestHubSpotReview,hubspotArtifactRequest,hubspotErrorMessage}from'./hubspot-preparation';
type Destination='klaviyo'|'mailchimp'|'omnisend'|'brevo'|'hubspot';type DestinationReview=KlaviyoReview|MailchimpReview|OmnisendReview|BrevoReview|HubSpotReview;
function emptyHubSpotSettings():HubSpotFooterSettingsData{return {company_name:'',company_street_address_1:'',company_street_address_2:'',company_city:'',company_state:'',company_zip:'',company_country:''};}
import {LocaleSourceComparison} from './locale-source-comparison';
import {LocaleContentReview} from './locale-content-review';
import {BlockFields} from './email-block-fields';
import {EmailLinearOutline} from './email-linear-outline';
import {moveEmailSection,replaceEmailSection,removeEmailSection} from '@/domain/linear-editor';
import {addColumnChild,moveColumnChild,replaceColumnChild,removeColumnChild,emailNodeCount,MAX_EMAIL_NODES} from '@/domain/column-editor';
import type {ColumnEditorActions} from './email-column-controls';
import { useEffect, useLayoutEffect,useRef, useState,useCallback } from 'react';
import {EmailConversion}from'./email-conversion';
import {effectiveProjectionStatus} from '@/domain/projection-status';
import {EmailSourceSpecSchema} from '@/domain/email-schema';
import {canonicalSpecString} from '@/domain/email-source-values';
import {SavedEmailResponseSchema,type SourceProfile,type RawDiagnostic} from '@/domain/email-source-contracts';
import {createSourceSaveCommand,createSourceReplacementCommand,createSourceForkCommand,serializeSourceSaveCommand,recoverSourceSaveCommand,validateSourceSaveReceipt,type SourceSaveCommand,type SourceSaveContext} from './source-save-command';
import {readSourceRecovery,writeSourceDraftRecovery,writeSourceCommandRecovery,removeSourceRecovery} from './source-recovery-store';
import {HtmlCodeEditor}from'./html-code-editor';
import{AssetPicker,type AssetPickerAnchor}from'./asset-picker';
import type{AssetVariantRef,AssetMetadata}from'@/domain/assets';
import{ConversionProposalSchema}from'@/domain/email-conversion-contracts';
import{originalConversionRefusal}from'./conversion-recovery';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowDown,
  ArrowUp,
  Trash2,
  Plus,
  Monitor,
  Smartphone,
  Undo2,
  History,
  ScanLine,
  Download,
  Code2,
  Sparkles,
  FileCheck,
  Copy,
  Save,
} from 'lucide-react';
import { useResourcePage } from './paged';
import { api, ApiError, poll } from './api';
import type { Role } from '@/domain/permissions';
import { allowed } from '@/domain/permissions';
import type { EmailSpec, Block, Finding } from '@/domain/email';
import { DerivedEmails } from './derived-emails';
import { SaveEmailTemplate } from './email-templates';
import {EmailUTM}from'./email-utm';
import{assertEmailUTMTargets,trackingFingerprint,copyProposalWithCurrentUTM}from'@/domain/email-utm';
import type{UTMParameterData}from'@/domain/utm';
import { derivationSlot, pendingDerivation, rememberDerivation, acknowledgeDerivation } from './derivation-receipt';
import type { emailLineage } from '@/server/emails';
type Doc = { id: string; title: string; doc_version: number; spec: EmailSpec; raw_source_profile?: SourceProfile|null; lineage?: Awaited<ReturnType<typeof emailLineage>> };
function checkedDoc(value:Doc):Doc{const envelope=SavedEmailResponseSchema.shape.email.parse({id:value.id,title:value.title,doc_version:value.doc_version,spec:value.spec,...(value.lineage!==undefined?{lineage:value.lineage}:{}),...(value.raw_source_profile!==undefined?{raw_source_profile:value.raw_source_profile}:{})});return {...envelope,spec:EmailSourceSpecSchema.parse(envelope.spec)} as Doc;}
type Revision = { id: string; revision_no: number; artifact_hash: string; subject: string };
type Anchor = { epoch: number; version: number; spec: string };
type Frozen = Revision & { anchor: Anchor };
type Report = {
  state: string;
  artifact_hash: string;
  rule_set_version: string;
  findings: Finding[];
};
export function Editor({ workspace, id, actor, role }: { workspace: string; id: string; actor:string; role: Role }) {
  const editRole = allowed(role, 'edit');
  const router = useRouter(),
    [doc, setDoc] = useState<Doc | null>(null),
    [hasPendingSave,setHasPendingSave]=useState(false),
    [status, setStatus] = useState('Loading'),
    [error, setError] = useState(''),
    [validationError, setValidationError] = useState(''),
    [selected, setSelected] = useState(''),
    [html, setHtml] = useState(''),
    [previewHtml,setPreviewHtml]=useState(''),
    [rawDiagnostics,setRawDiagnostics]=useState<Array<RawDiagnostic&{node_id?:string}>>([]),
    [rawDelivery,setRawDelivery]=useState(''),
    [showAssets,setShowAssets]=useState(false),
    [text, setText] = useState(''),
    [view, setView] = useState<'canvas' | 'code' | 'text' | 'outline'>('canvas'),
    [mobile, setMobile] = useState(false),
    [showHistory, setShowHistory] = useState(false),
    [revision, setRevision] = useState<Frozen | null>(null),
    [report, setReport] = useState<Report | null>(null),
    [destination,setDestination]=useState<Destination>('klaviyo'),
    [hubspotSettings,setHubSpotSettings]=useState(()=>({workspace,actor,email:id,values:emptyHubSpotSettings()})),
    [destinationPreparation,setDestinationPreparation]=useState<{review:DestinationReview;anchor:Anchor;workspace:string;actor:string;email:string;generation:number;settings?:Readonly<HubSpotFooterSettingsData>}|null>(null),
    [busy, setBusy] = useState(''),
    [conflict, setConflict] = useState<Doc | null>(null),
    [aiPrompt, setAiPrompt] = useState(''),
    [proposal, setProposal] = useState<{
      spec: EmailSpec;
      review_notes: string[];
      base: number;
      anchor: Anchor;
    } | null>(null),
    [addType, setAddType] = useState<Block['type']>('text'),
    [undoCount, setUndoCount] = useState(0),
    [renderEpoch, setRenderEpoch] = useState(0);
  useEffect(()=>{
    let active=true;
    if(window.matchMedia('(max-width: 767px)').matches)void Promise.resolve().then(()=>{if(active)setView('outline');});
    return ()=>{active=false;};
  },[]);
  const selectedRef=useRef(selected),roleRef=useRef(editRole);useLayoutEffect(()=>{selectedRef.current=selected;roleRef.current=editRole;});
  const historyPage = useResourcePage<Revision>(workspace, 'email-revisions?email_id=' + id);
  const history = historyPage.data;
  const epoch = useRef(0),
    busyRef = useRef(''),
    editorActive = useRef(false),
    exportController = useRef<AbortController | null>(null),
    destinationRef=useRef<Destination>('klaviyo'),
    destinationSelectionGeneration=useRef(0),
    hubspotSettingsRef=useRef(hubspotSettings.values);
  const writable = editRole && !['raw', 'restore', 'reload', 'fork','convert','asset'].includes(busy);
  const live = useRef<Doc | null>(null),
    ack = useRef(''),
    dirtyAt = useRef(0),
    lastEdit = useRef(0),
    saving = useRef<Promise<boolean> | null>(null),
    conflictRef = useRef(false),
    undo = useRef<EmailSpec[]>([]),
    storage = 'mailcraft.draft.' + workspace + '.' + id;
  const recoveryWrites=useRef<Promise<void>>(Promise.resolve()),pendingUncertain=useRef(false);
  const lifecycle=useRef(crypto.randomUUID()),saveEpoch=useRef(0),pendingSave=useRef<SourceSaveCommand|null>(null),scopeRef=useRef({workspace,actor,email:id});
  const columnFocus=useRef<{workspace:string;actor:string;email:string;parent:string;child:string}|null>(null);
  useLayoutEffect(()=>{
    const pending=columnFocus.current;if(!pending)return;columnFocus.current=null;
    if(!editorActive.current||pending.workspace!==workspace||pending.actor!==actor||pending.email!==id)return;
    const control=Array.from(document.querySelectorAll<HTMLSelectElement>('select[data-column-destination]')).find(control=>control.dataset.columnParent===pending.parent&&control.dataset.columnDestination===pending.child);
    if(control&&!control.disabled)control.focus();
  },[doc?.spec,workspace,actor,id]);
  useLayoutEffect(()=>{
    if(scopeRef.current.workspace!==workspace||scopeRef.current.actor!==actor||scopeRef.current.email!==id){
      destinationSelectionGeneration.current++;exportController.current?.abort();hubspotSettingsRef.current=emptyHubSpotSettings();
    }
    scopeRef.current={workspace,actor,email:id};
  });
  function sameContext(scope:{workspace:string;actor:string;email:string},life:string){return editorActive.current&&scopeRef.current.workspace===scope.workspace&&scopeRef.current.actor===scope.actor&&scopeRef.current.email===scope.email&&lifecycle.current===life;}
  function saveContext(spec:EmailSpec=live.current!.spec):SourceSaveContext{return {...scopeRef.current,lifecycle:lifecycle.current,epoch:saveEpoch.current,baseVersion:live.current!.doc_version,spec};}
  function preserveLocal(draft:Doc){const scope={...scopeRef.current},life=lifecycle.current;const snapshot=structuredClone(draft);recoveryWrites.current=recoveryWrites.current.catch(()=>{}).then(()=>writeSourceDraftRecovery(scope,snapshot));void recoveryWrites.current.catch(()=>{if(sameContext(scope,life))setError('Local draft recovery is unavailable. Keep this tab open until the draft is saved.');});}
  function anchor(): Anchor {
    return {
      epoch: epoch.current,
      version: live.current!.doc_version,
      spec: JSON.stringify(live.current!.spec),
    };
  }
  function matches(a: Anchor) {
    return (
      editorActive.current && !!live.current &&
      a.epoch === epoch.current &&
      a.version === live.current.doc_version &&
      a.spec === JSON.stringify(live.current.spec)
    );
  }
  const install=useCallback((input: Doc) => {
    const d=checkedDoc(input);if(d.id!==scopeRef.current.email)throw Error('The returned document belongs to a different editor. Your local work is preserved.');saveEpoch.current++;
    epoch.current++;
    setRenderEpoch(epoch.current);
    live.current = d;
    setDoc(d);
    ack.current = canonicalSpecString(d.spec);
    setValidationError('');
    dirtyAt.current = 0;
    setStatus('Saved · v' + d.doc_version);
    setSelected((prev) => prev || d.spec.sections[0]?.id || '');
  },[]);
  async function reload() {
    const scope={...scopeRef.current},life=lifecycle.current;
    const r = await api<{ email: Doc }>(workspace, 'emails/' + id,'GET',undefined,undefined,undefined,undefined,actor);
    if(!sameContext(scope,life))return;
    install(r.email);pendingSave.current=null;pendingUncertain.current=false;setHasPendingSave(false);
    setConflict(null);conflictRef.current = false;setError('');
    await removeSourceRecovery(scope,{draft:true,command:true});
  }
  useEffect(() => {
    let mounted = true;
    lifecycle.current=crypto.randomUUID();saveEpoch.current=0;pendingSave.current=null;pendingUncertain.current=false;saving.current=null;live.current=null;ack.current='';conflictRef.current=false;
    editorActive.current = true;
    const scope={workspace,actor,email:id},life=lifecycle.current;
    void (async()=>{
      await Promise.resolve();if(!mounted)return;setDoc(null);setConflict(null);setError('');setHasPendingSave(false);setDestinationPreparation(null);
      hubspotSettingsRef.current=emptyHubSpotSettings();setHubSpotSettings({...scope,values:hubspotSettingsRef.current});
      const r=await api<{email:Doc}>(workspace,'emails/'+id,'GET',undefined,undefined,undefined,undefined,actor);
      if(!mounted||!sameContext(scope,life))return;
      // Read recovery before mounting dependent forms; a server-only first mount
      // would turn recovered settings into a stale unrelated form baseline.
      let recovery:Awaited<ReturnType<typeof readSourceRecovery>>={};
      if(editRole){try{recovery=await readSourceRecovery(scope);}catch{if(mounted&&sameContext(scope,life))setError('Local recovery is unavailable. The server draft is intact; keep current edits in this tab until a save is acknowledged.');}}
      if(!mounted||!sameContext(scope,life))return;
      install(r.email);
      // Old actor-unbound storage remains untouched and is never adopted.
      try{if(localStorage.getItem(storage))setError('An older recovery copy is retained on this browser. It is not associated with your current account and has not been installed.');}catch{}
      if(!editRole)return;
      const local=recovery.draft ? checkedDoc(recovery.draft as Doc) : null;
      if(local&&canonicalSpecString(local.spec)!==canonicalSpecString(r.email.spec)){
        live.current={...local,lineage:r.email.lineage};setDoc({...live.current});dirtyAt.current=Date.now();lastEdit.current=Date.now();
        if(local.doc_version!==r.email.doc_version&&!recovery.command){conflictRef.current=true;setConflict(r.email);setStatus('Conflict · local work preserved');}
        else setStatus('Recovered local work · unsaved');
      }
      if(recovery.command){
        const original=JSON.parse(recovery.command) as SourceSaveCommand;
        const recovered=await recoverSourceSaveCommand(recovery.command,{...scope,lifecycle:life,epoch:saveEpoch.current,baseVersion:original.baseVersion,spec:original.spec});
        if(!mounted||!sameContext(scope,life))return;
        if(!recovered)throw Error('The retained original save command cannot be verified. Your server draft and recovery are preserved.');
        pendingSave.current=recovered;pendingUncertain.current=true;setHasPendingSave(true);
        // Keep the original base for explicit replay, including a lost response
        // after the server committed. A later mutable head cannot acknowledge it.
        live.current={...(local??r.email),doc_version:recovered.baseVersion,spec:local?.spec??recovered.spec};setDoc({...live.current});
        dirtyAt.current=Date.now();lastEdit.current=Date.now();conflictRef.current=true;setConflict(r.email);setStatus('Save acknowledgment unresolved · original command retained');
      }
    })().catch(e=>{if(mounted&&sameContext(scope,life))setError(e.message);});
    return () => {mounted=false;editorActive.current=false;exportController.current?.abort();};
  }, [workspace, actor, id, storage, editRole,install]);
  const flushRef = useRef<() => Promise<boolean>>(async () => true);
  async function flush(): Promise<boolean> {
    if (!editRole) return !dirtyAt.current;
    if (saving.current) return saving.current;
    if (!live.current) return true;
    if (!pendingSave.current&&canonicalSpecString(live.current.spec)===ack.current) {
      // Undo/reorder can return to the already acknowledged spec without a write.
      if(!conflictRef.current&&!pendingUncertain.current){dirtyAt.current=0;setStatus('Saved · v'+live.current.doc_version);setValidationError('');}
      return true;
    }
    if (conflictRef.current||pendingUncertain.current) return false;
    if (!navigator.onLine) {setStatus('Offline · local only');return false;}
    const scope={...scopeRef.current},life=lifecycle.current,context=saveContext();
    if(!pendingSave.current){
      const validation=EmailSourceSpecSchema.safeParse(context.spec);
      if(!validation.success){
        const issue=validation.error.issues[0],position=issue.path[0]==='sections'&&typeof issue.path[1]==='number'?`block ${issue.path[1]+1}`:'the draft fields';
        setValidationError(`Complete ${position} before saving: ${issue.message}. Your edits remain in this tab.`);
        setStatus('Incomplete fields · local work retained');
        return false;
      }
    }
    setStatus('Saving…');
    const task=(async()=>{
      try{
        const command=pendingSave.current??await createSourceSaveCommand(context);
        if(!sameContext(scope,life))return false;
        pendingSave.current=command;setHasPendingSave(true);
        // Durability is transaction completion, before the network dispatch.
        await writeSourceCommandRecovery(scope,serializeSourceSaveCommand(command));
        if(!sameContext(scope,life))return false;
        const response=await api<unknown>(scope.workspace,'emails/'+scope.email+'/'+(command.action==='source-fork'?'source-fork':'draft'),command.action==='source-fork'?'POST':'PATCH',command.action==='source-fork'?{expected_artifact_hash:command.expectedArtifactHash}:{spec:command.spec},command.baseVersion,command.key,undefined,scope.actor);
        const validated=await validateSourceSaveReceipt(command,response,()=>saveContext());
        EmailSourceSpecSchema.parse(validated.response.email.spec);
        const current=await api<{email:Doc}>(scope.workspace,'emails/'+scope.email,'GET',undefined,undefined,undefined,undefined,scope.actor);
        if(!sameContext(scope,life)||saveEpoch.current!==command.scope.epoch||live.current?.doc_version!==command.baseVersion)return false;
        const server=checkedDoc(current.email);if(server.id!==scope.email)throw Error("The current server response belongs to a different document.");
        if(server.doc_version!==validated.savedVersion||canonicalSpecString(server.spec)!==validated.acknowledgedCanonicalSpec){conflictRef.current=true;setConflict(server);setStatus('Conflict · local work preserved');throw Error('The original save was acknowledged, but the current server head changed. Compare or reload before continuing.');}
        if((command.action==='source-fork'&&live.current.spec.editing_mode==='structured')||command.adoptBaseSpecHash){
          const original=canonicalSpecString(live.current.spec),identity=await createSourceSaveCommand(saveContext());
          if(!sameContext(scope,life)||live.current.doc_version!==command.baseVersion||canonicalSpecString(live.current.spec)!==original)return false;
          if(identity.specHash!==(command.adoptBaseSpecHash??command.forkBaseSpecHash)&&!(command.adoptBaseSpecHash&&identity.specHash===command.specHash)){conflictRef.current=true;setConflict(server);setStatus('Conflict · local work preserved');throw Error('The replacement was acknowledged while newer local work changed. Compare or reload before adopting it.');}
          install(server);
        }else{
          ack.current=validated.acknowledgedCanonicalSpec;
          live.current={...live.current,doc_version:validated.savedVersion,raw_source_profile:server.raw_source_profile,lineage:server.lineage};setDoc({...live.current});
        }
        pendingSave.current=null;setHasPendingSave(false);
        const dirty=canonicalSpecString(live.current.spec)!==ack.current;
        if(dirty){dirtyAt.current=Date.now();preserveLocal(live.current);setStatus('Unsaved changes');}
        else{dirtyAt.current=0;setStatus('Saved · v'+validated.savedVersion);}
        await removeSourceRecovery(scope,{draft:!dirty,command:true,expectedDraft:{docVersion:command.baseVersion,specHash:command.specHash},expectedCommandKey:command.key});
        if(sameContext(scope,life)){setError('');setValidationError('');}return true;
      }catch(e){
        if(!sameContext(scope,life))return false;
        if(pendingSave.current)pendingUncertain.current=true;
        setError((e as Error).message);
        if(e instanceof ApiError&&e.status===412){conflictRef.current=true;setStatus('Conflict · local work preserved');const server=await api<{email:Doc}>(scope.workspace,'emails/'+scope.email,'GET',undefined,undefined,undefined,undefined,scope.actor);if(sameContext(scope,life))setConflict(checkedDoc(server.email));}
        else if(!conflictRef.current)setStatus(navigator.onLine?(pendingSave.current?'Save failed · original command retained':'Save failed · local work retained'):'Offline · local only');
        return false;
      }finally{if(sameContext(scope,life))saving.current=null;}
    })();saving.current=task;return task;
  }
  useEffect(() => {
    flushRef.current = flush;
  });
  useEffect(() => {
    const timer = setInterval(() => {
      if (
        dirtyAt.current && !pendingUncertain.current &&
        (Date.now() - lastEdit.current > 750 || Date.now() - dirtyAt.current >= 4000)
      )
        void flushRef.current();
    }, 250);
    const before = (e: BeforeUnloadEvent) => {
      if (dirtyAt.current) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    const online = async () => {
      if (!live.current) return;
      try {
        const r = await api<{ email: Doc }>(workspace, 'emails/' + id);
        if (r.email.doc_version !== live.current.doc_version) {
          setConflict(r.email);
          conflictRef.current = true;
          setStatus('Conflict · local work preserved');
        } else {
          live.current = { ...live.current, lineage: r.email.lineage };
          setDoc({ ...live.current });
          void flushRef.current();
        }
      } catch {
        setStatus('Offline · local only');
      }
    };
    window.addEventListener('beforeunload', before);
    window.addEventListener('online', online);
    return () => {
      clearInterval(timer);
      window.removeEventListener('beforeunload', before);
      window.removeEventListener('online', online);
    };
  }, [workspace, id]);
  useEffect(() => {
    if (!doc) return;
    let active = true;
    const timer = setTimeout(() => {
      void api<{ artifact: { html: string; text: string;preview_html?:string|null;manifest?:{raw_projection?:{delivery_status:string;diagnostics:RawDiagnostic[]};fragment_projection?:{delivery_status:string;diagnostics:Array<RawDiagnostic&{node_id?:string}>}} } }>(
        workspace,
        'emails/' + id + '/preview',
        'POST',
        { spec: doc.spec },undefined,undefined,undefined,actor,
      )
        .then((r) => {
          if (active) {
            setHtml(r.artifact.html);
            setPreviewHtml(r.artifact.preview_html===undefined?r.artifact.html:r.artifact.preview_html??'');
            const projection=r.artifact.manifest?.raw_projection??r.artifact.manifest?.fragment_projection;setRawDiagnostics(projection?.diagnostics??[]);setRawDelivery(projection?.delivery_status??'');
            setText(r.artifact.text);
          }
        })
        .catch((e) => {
          if (active){setError(e.message);setPreviewHtml('');}
        });
    }, 450);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [doc, workspace, id,actor]);
  function update(spec: EmailSpec) {
    if (
      !editRole ||
      !live.current ||
      ['raw', 'restore', 'reload', 'fork','convert','asset'].includes(busyRef.current)
    )
      return;
    epoch.current++;
    exportController.current?.abort();
    setRenderEpoch(epoch.current);
    undo.current = [...undo.current.slice(-49), structuredClone(live.current.spec)];
    setUndoCount(undo.current.length);
    live.current = { ...live.current, spec };
    setDoc({ ...live.current });
    if (!dirtyAt.current) dirtyAt.current = Date.now();
    lastEdit.current = Date.now();
    preserveLocal(live.current);
    setStatus(navigator.onLine ? 'Unsaved changes' : 'Offline · local only');
    setReport(null);
    setRevision(null);
  }
  function applyUTM(policy:UTMParameterData|undefined,expected:string):string|null{
    if(!editorActive.current||!live.current||!editRole||busyRef.current||conflictRef.current)return 'Resolve the current draft action or conflict before applying UTM. Your settings are retained.';
    if(trackingFingerprint(live.current.spec.tracking)!==expected)return 'The current UTM policy changed. Reload UTM settings before applying your retained values.';
    const spec={...live.current.spec};if(policy)spec.tracking=structuredClone(policy);else delete spec.tracking;
    try{assertEmailUTMTargets(spec);}catch(error){return error instanceof Error?error.message:'These links need correction before applying UTM.';}
    if(trackingFingerprint(policy)!==trackingFingerprint(live.current.spec.tracking))update(spec);
    return null;
  }
  function outlineCommand(command:(spec:EmailSpec)=>EmailSpec){
    if(!writable||!live.current)return;
    try{
      const current=live.current.spec,next=command(current);
      if(next!==current)update(next);
    }catch(error){setError(error instanceof Error?error.message:'The block changed. Select its current fields.');}
  }
  const changeBlock = (value:Block) => outlineCommand(spec=>replaceEmailSection(spec,value));
  const columnActions:ColumnEditorActions={
    canAdd:!!doc&&emailNodeCount(doc.spec)<MAX_EMAIL_NODES,
    onAdd:(parent,column,type)=>outlineCommand(spec=>addColumnChild(spec,parent,column,newBlock(type))),
    onMove:(parent,child,column,position)=>outlineCommand(spec=>{
      const next=moveColumnChild(spec,parent,child,column,position),block=spec.sections.find(block=>block.id===parent),control=document.activeElement;
      if(next!==spec&&block?.type==='columns'&&block.columns.findIndex(nodes=>nodes.some(node=>node.id===child))!==column&&control instanceof HTMLSelectElement&&control.dataset.columnParent===parent&&control.dataset.columnDestination===child)columnFocus.current={...scopeRef.current,parent,child};
      return next;
    }),
    onRemove:(parent,child)=>outlineCommand(spec=>removeColumnChild(spec,parent,child)),
    onChange:(parent,child)=>outlineCommand(spec=>replaceColumnChild(spec,parent,child)),
  };
  async function applyAsset(ref:AssetVariantRef,a:AssetPickerAnchor){
    const check=()=>{const current=live.current,block=current?.spec.sections.find(b=>b.id===a.nodeId);if(!editorActive.current||!roleRef.current||workspace!==a.workspace||actor!==a.actor||id!==a.email||selectedRef.current!==a.nodeId||!current||current.doc_version!==a.docVersion||block?.type!=='image'||JSON.stringify(block)!==a.sourceRef||conflictRef.current)throw Error('The selected image or account changed. Reopen uploaded media; your current image is preserved.');return{current,block};};
    if(busyRef.current)throw Error('Finish the current editor action first.');check();busyRef.current='asset';setBusy('asset');setError('');
    try{if(!(await flush())||dirtyAt.current)throw Error('Save or resolve the current draft before applying this image.');const baseline=check(),origin=anchor();const result=await api<{asset:AssetMetadata}>(workspace,'assets/'+ref.asset_id,'GET',undefined,undefined,undefined,undefined,actor);check();if(!matches(origin))throw Error('The draft changed while resolving the image.');const variant=result.asset.variants.find(v=>v.variant_id===ref.variant_id);if(!variant||!['ready_private','published'].includes(result.asset.state))throw Error('This private variant is not ready.');if(variant.role==='animation'&&!variant.fallback)throw Error('Choose a static fallback before applying this animation.');const image={...baseline.block,asset_ref:ref,...(variant.role==='animation'?{fallback_ref:variant.fallback}:{} )};delete image.src;if(variant.role!=='animation')delete image.fallback_ref;
      const spec:EmailSpec={...baseline.current.spec,schema_version:'1.1',sections:baseline.current.spec.sections.map(b=>b.id===a.nodeId?image:b)};
      const command=await createSourceReplacementCommand(saveContext(spec),baseline.current.spec);pendingSave.current=command;setHasPendingSave(true);await writeSourceCommandRecovery({...scopeRef.current},serializeSourceSaveCommand(command));await writeSourceDraftRecovery({...scopeRef.current},{...baseline.current,spec});const saved=await api<unknown>(workspace,'emails/'+id+'/draft','PATCH',{spec:command.spec},command.baseVersion,command.key,undefined,actor);const validated=await validateSourceSaveReceipt(command,saved,()=>saveContext());const head=await api<{email:Doc}>(workspace,'emails/'+id,'GET',undefined,undefined,undefined,undefined,actor);const response={email:checkedDoc(head.email)};if(response.email.id!==id||response.email.doc_version!==validated.savedVersion||canonicalSpecString(response.email.spec)!==validated.acknowledgedCanonicalSpec)throw Error('The original image save was acknowledged, but the current server head changed. Reload before continuing.');
      if(!matches(origin)){setError('An image save was acknowledged after local work changed. Reload the current server version before continuing.');conflictRef.current=true;setConflict(response.email);throw Error('Current local image preserved after an interrupted acknowledgment.');}
      undo.current=[...undo.current.slice(-49),structuredClone(baseline.current.spec)];setUndoCount(undo.current.length);install(response.email);pendingSave.current=null;setHasPendingSave(false);await removeSourceRecovery({...scopeRef.current},{draft:true,command:true,expectedDraft:{docVersion:command.baseVersion,specHash:command.specHash},expectedCommandKey:command.key});setReport(null);setRevision(null);
    }catch(error){if(pendingSave.current){pendingUncertain.current=true;setStatus('Save failed · original command retained');}if(error instanceof ApiError&&error.status===412){conflictRef.current=true;setStatus('Conflict · local work preserved');const server=await api<{email:Doc}>(workspace,'emails/'+id,'GET',undefined,undefined,undefined,undefined,actor);setConflict(checkedDoc(server.email));}setError(error instanceof Error?error.message:String(error));throw error;}finally{busyRef.current='';setBusy('');}
  }
  async function freeze(expectedActor?:string,canStart?:()=>boolean,contextCurrent?:()=>boolean) {
    if((expectedActor&&scopeRef.current.actor!==expectedActor)||(canStart&&!canStart()))return null;
    if (!(await flush())) {
      return null;
    }
    if(canStart&&!canStart())return null;
    if (dirtyAt.current) {
      setError('Finish the current edits before freezing a revision.');
      return null;
    }
    if(expectedActor&&scopeRef.current.actor!==expectedActor)return null;
    const current = live.current!;
    const origin = anchor();
    const r = await api<{ revision: Revision }>(
      workspace,
      'emails/' + id + '/revisions',
      'POST',
      {},
      current.doc_version,undefined,undefined,expectedActor,
    );
    if(contextCurrent&&!contextCurrent())return null;
    if (!matches(origin)) {
      if(!canStart||canStart())setError(
        'The draft changed during freezing. The older checkpoint is in history; freeze the current draft again.',
      );
      return null;
    }
    const frozen = { ...r.revision, anchor: origin };
    setRevision(frozen);
    return frozen;
  }
  function chooseDestination(next:Destination){
    if(destinationRef.current===next)return;
    destinationSelectionGeneration.current++;destinationRef.current=next;exportController.current?.abort();setDestination(next);setDestinationPreparation(null);setError('');
  }
  function changeHubSpotSettings(field:keyof HubSpotFooterSettingsData,value:string){
    if(!roleRef.current||hubspotSettingsRef.current[field]===value)return;
    // Invalidate before state scheduling, including during the initial freeze.
    destinationSelectionGeneration.current++;exportController.current?.abort();
    hubspotSettingsRef.current={...hubspotSettingsRef.current,[field]:value};
    setHubSpotSettings({...scopeRef.current,values:hubspotSettingsRef.current});
    setDestinationPreparation(null);setError('');
  }
  async function reviewDestination(){
    const scope={...scopeRef.current},life=lifecycle.current,selectedDestination=destinationRef.current,selectionGeneration=destinationSelectionGeneration.current;
    let settings:Readonly<HubSpotFooterSettingsData>|undefined,controller:AbortController|undefined;
    const selected=()=>destinationSelectionGeneration.current===selectionGeneration&&destinationRef.current===selectedDestination&&(!settings||sameHubSpotSettings(settings,hubspotSettingsRef.current));
    const contextCurrent=()=>sameContext(scope,life);
    const fresh=()=>!controller?.signal.aborted&&selected()&&contextCurrent();
    try{
      // Validation and exact cloning happen before any freeze/checkpoint awaits.
      if(selectedDestination==='hubspot')settings=snapshotHubSpotSettings(hubspotSettingsRef.current);
      const r=revision&&matches(revision.anchor)?revision:await freeze(scope.actor,selectedDestination==='hubspot'?()=>selected()&&contextCurrent():undefined,selectedDestination==='hubspot'?contextCurrent:undefined);
      if(!r||!fresh()||!matches(r.anchor))return;
      controller=new AbortController();exportController.current=controller;
      const result=settings
        ?await requestHubSpotReview(scope,r.id,settings,controller.signal)
        :await api<{review:unknown}>(scope.workspace,'email-revisions/'+r.id+'/destination-review?destination='+selectedDestination,'GET',undefined,undefined,undefined,controller.signal,scope.actor);
      if(!fresh()||!matches(r.anchor))return;
      const review=selectedDestination==='klaviyo'?KlaviyoReviewSchema.parse(result.review):selectedDestination==='mailchimp'?MailchimpReviewSchema.parse(result.review):selectedDestination==='omnisend'?OmnisendReviewSchema.parse(result.review):selectedDestination==='brevo'?BrevoReviewSchema.parse(result.review):HubSpotReviewSchema.parse(result.review);
      if(review.revision_id!==r.id||review.source_artifact_hash!==r.artifact_hash)throw Error('The destination receipt belongs to a different frozen version. Review again.');
      if(review.destination==='hubspot'){
        const digest=await hubspotSettingsDigest(settings);
        if(!fresh()||!matches(r.anchor))return;
        if(review.settings_digest!==digest)throw Error('The HubSpot settings receipt differs from the explicit comparison. Review again.');
      }
      if(!fresh()||!matches(r.anchor))return;
      setDestinationPreparation({review,anchor:r.anchor,...scope,generation:selectionGeneration,...(settings?{settings}:{})});
    }catch(error){if(fresh()&&!(error instanceof DOMException&&error.name==='AbortError')){setDestinationPreparation(null);setError(selectedDestination==='hubspot'?hubspotErrorMessage(error):error instanceof Error?error.message:'Destination preparation unavailable.');}}
    finally{if(controller&&exportController.current===controller)exportController.current=null;}
  }
  async function downloadDestination(format:'html'|'txt'){
    const scope={...scopeRef.current},life=lifecycle.current,current=destinationPreparation,selectionGeneration=destinationSelectionGeneration.current;
    if(!current||current.generation!==selectionGeneration||current.review.destination!==destinationRef.current||current.workspace!==scope.workspace||current.actor!==scope.actor||current.email!==scope.email||!matches(current.anchor))return;
    if(current.review.destination==='hubspot'&&(!current.settings||!sameHubSpotSettings(current.settings,hubspotSettingsRef.current)))return;
    const controller=new AbortController();exportController.current=controller;
    const fresh=()=>!controller.signal.aborted&&destinationSelectionGeneration.current===selectionGeneration&&destinationRef.current===current.review.destination&&sameContext(scope,life)&&matches(current.anchor)&&(!current.settings||sameHubSpotSettings(current.settings,hubspotSettingsRef.current));
    try{
      let response:Response;
      if(current.review.destination==='hubspot'){
        const request=hubspotArtifactRequest(scope,current.review.revision_id,current.settings,format,current.review.destination_hash,controller.signal);
        if(!fresh())return;
        response=await fetch(request.url,request.init);
      }else response=await fetch('/v1/email-revisions/'+current.review.revision_id+'/destination-artifact?destination='+current.review.destination+'&format='+format,{signal:controller.signal,headers:{'X-Workspace-Id':scope.workspace,'X-Actor-Id':scope.actor}});
      if(!fresh())return;
      if(!response.ok){const body=await response.json();if(fresh())throw current.review.destination==='hubspot'?new ApiError(body.error?.code??'REQUEST_FAILED','HubSpot download unavailable.',response.status):Error(body.error?.message??'Destination download unavailable.');return;}
      const expected=format==='html'?current.review.html_sha256:current.review.text_sha256;
      if(response.headers.get('X-Artifact-Hash')!==current.review.destination_hash||response.headers.get('X-Source-Artifact-Hash')!==current.review.source_artifact_hash||response.headers.get('X-Content-SHA256')!==expected||response.headers.get('X-Remote-Export-Enabled')!=='false'||response.headers.get('X-Destination-Mapping')!==current.review.mapping_version)throw Error('Destination download receipt differs from the reviewed version. Review again.');
      if(!response.body)throw Error('Destination download is empty.');
      const reader=response.body.getReader(),parts:Uint8Array[]=[];let size=0;
      try{for(;;){const part=await reader.read();if(!fresh())return;if(part.done)break;size+=part.value.byteLength;if(size>2*1024*1024)throw Error('Destination download exceeded its bounded content budget.');parts.push(part.value);}}
      finally{await reader.cancel().catch(()=>{});reader.releaseLock();}
      const bytes=new Uint8Array(size);let offset=0;for(const part of parts){bytes.set(part,offset);offset+=part.byteLength;}if(!fresh())return;
      const actual=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))).map(b=>b.toString(16).padStart(2,'0')).join('');if(!fresh())return;
      if(actual!==expected)throw Error('Destination download integrity failed. No file was adopted.');
      const url=URL.createObjectURL(new Blob([bytes],{type:format==='html'?'text/html':'text/plain'})),link=document.createElement('a');link.href=url;link.download=current.review.destination+'-prepared-'+current.review.revision_id+'.'+format;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
    }catch(error){if(fresh()){if(current.review.destination==='hubspot')setDestinationPreparation(null);setError(current.review.destination==='hubspot'?hubspotErrorMessage(error):error instanceof Error?error.message:'Destination download unavailable.');}}
    finally{if(exportController.current===controller)exportController.current=null;}
  }
  async function act(name: string, fn: () => Promise<void>) {
    if (busyRef.current) return;
    busyRef.current = name;
    setBusy(name);
    setError('');
    setValidationError('');
    try {
      await fn();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      busyRef.current = '';
      setBusy('');
    }
  }
  if (!doc)
    return (
      <div className="panel">
        <p role="status">{error || 'Opening the acknowledged draft…'}</p>
        {error && <button onClick={() => void act('reload', reload)}>Reload draft</button>}
      </div>
    );
  const block = doc.spec.sections.find((b) => b.id === selected);
  const proposalMatches =
    !!proposal &&
    proposal.anchor.epoch === renderEpoch &&
    proposal.anchor.version === doc.doc_version &&
    proposal.anchor.spec === JSON.stringify(doc.spec);
  return (
    <>
      {!editRole && (
        <p className="alert info">
          Your {role} role can view this draft. Editing, AI and exports require an editing role.
        </p>
      )}
      <div className="editor-heading">
        <div>
          <Link href="/app/emails" className="back-link">
            <ArrowLeft size={16} /> Emails
          </Link>
          <h1>{doc.title}</h1>
          <p className="small muted" role="status">
            {status} · {report ? report.state + ' checks' : 'Checks out of date'} · Not sent
          </p>
        </div>
        <div className="toolbar">
          <button
            disabled={!editRole || !!busy}
            onClick={() =>
              void act('save', async () => {
                pendingUncertain.current=false;await flush();
              })
            }
          >
            <Save size={17} /> Save
          </button>
          <button
            disabled={!editRole || !undoCount || !!busy}
            onClick={() => {
              const previous = undo.current.pop();
              if (previous) {
                const remaining = undo.current;
                update(previous);
                undo.current = remaining;
                setUndoCount(remaining.length);
              }
            }}
          >
            <Undo2 size={17} /> Undo
          </button>
          <button
            onClick={() =>
              void act('history', async () => {
                await historyPage.reload();
                setShowHistory(!showHistory);
              })
            }
          >
            <History size={17} /> History
          </button>
          <button
            className="primary"
            disabled={!editRole || !!busy || !!conflict}
            onClick={() =>
              void act('check', async () => {
                const r = await freeze();
                if (!r) return;
                const p = await api<{ report: Report }>(
                  workspace,
                  'email-revisions/' + r.id + '/preflight',
                  'POST',
                  {},
                );
                if (matches(r.anchor)) setReport(p.report);
              })
            }
          >
            <ScanLine size={17} /> Review and check
          </button>
        </div>
      </div>
      {(error || validationError) && (
        <div className="alert danger" role="alert">
          {error || validationError}
        </div>
      )}
      {conflict && (
        <div className="panel conflict-panel" role="alert">
          <h2>A newer version is saved.</h2>
          <p>Your local work is preserved. Compare the subjects and choose how to continue.</p>
          <div className="field-row">
            <div>
              <strong>Your local draft</strong>
              <p>{doc.spec.subject || '(empty subject)'}</p>
            </div>
            <div>
              <strong>Server · v{conflict.doc_version}</strong>
              <p>{conflict.spec.subject || '(empty subject)'}</p>
            </div>
          </div>
          <button
            disabled={!writable}
            onClick={() =>
              void act('fork', async () => {
                const r = await api<{ email: Doc }>(workspace, 'emails', 'POST', {
                  title: doc.title + ' (recovered copy)',
                  spec: doc.spec,
                });
                await removeSourceRecovery({...scopeRef.current},{draft:true,command:true});
                router.push('/app/emails/' + r.email.id);
              })
            }
          >
            <Copy size={17} /> Keep mine as a copy
          </button>
          <button onClick={() => void act('reload', reload)}>Reload newer</button>
        </div>
      )}
      {hasPendingSave&&<button disabled={!editRole||!!busy} onClick={()=>void act('recover-save',async()=>{conflictRef.current=false;pendingUncertain.current=false;setConflict(null);await flush();})}>Retry original save acknowledgment</button>}
      {(doc.spec.editing_mode==='raw_html'||doc.spec.sections.some(b=>b.type==='custom_html'||b.type==='columns'&&b.columns.flat().some(n=>n.type==='custom_html')))&&<section className="panel" aria-label="Raw source diagnostics"><p>Source profile: {doc.spec.editing_mode==='raw_html'?(doc.raw_source_profile??'exact-utf8-1'):'custom-html-source-1'} · {rawDelivery||'Projection pending'}. Your authored source is retained separately from the preview.</p>{rawDiagnostics.map((d,i)=><p key={i} className={d.severity==='blocking'?'alert danger':'small'}>{d.code}: {d.message} (source {d.node_id?d.node_id+': ':''}{d.start}–{d.end})</p>)}</section>}
      {showHistory && (
        <section className="panel history-panel">
          <div className="section-heading">
            <h2>Immutable checkpoints</h2>
            <button onClick={() => setShowHistory(false)}>Close history</button>
          </div>
          {historyPage.error && (
            <p className="alert danger" role="alert">
              {historyPage.error}
            </p>
          )}
          <button
            disabled={!editRole || !!busy || !!conflict}
            onClick={() =>
              void act('checkpoint', async () => {
                await freeze();
                await historyPage.reload();
              })
            }
          >
            <Plus size={16} /> Create checkpoint
          </button>
          {historyPage.hasMore && (
            <button
              disabled={!!busy || historyPage.busy}
              onClick={() => void historyPage.loadMore()}
            >
              Load older checkpoints
            </button>
          )}
          {history.length ? (
            history.map((r) => (
              <div className="history-row" key={r.id}>
                <span>
                  v{r.revision_no} · {r.subject || 'No subject'}
                </span>
                <code>{r.artifact_hash.slice(0, 12)}</code>
                <button
                  disabled={!editRole || !!busy || !!conflict}
                  onClick={() =>
                    void act('restore', async () => {
                      if (!(await flush()) || dirtyAt.current) return;
                      const origin = anchor();
                      const restored = await api<{ email: Doc }>(
                        workspace,
                        'emails/' + id + '/restore',
                        'POST',
                        { revision_id: r.id },
                        live.current!.doc_version,
                      );
                      if (!matches(origin))
                        throw new Error(
                          'The draft changed during restore. Reload the acknowledged server version; your local copy is preserved.',
                        );
                      install(restored.email);
                      await removeSourceRecovery({...scopeRef.current},{draft:true,command:true});
                      setReport(null);
                      setRevision(null);
                    })
                  }
                >
                  Restore as new head
                </button>
                <SaveEmailTemplate workspace={workspace} actor={actor} role={role} revisionId={r.id} artifactHash={r.artifact_hash} />
              </div>
            ))
          ) : (
            <p className="muted">
              No checkpoint yet. Saving a draft and freezing a revision are separate actions.
            </p>
          )}
        </section>
      )}
      <div className="subject-fields panel">
        <label>
          Subject
          <input
            readOnly={!writable}
            maxLength={200}
            value={doc.spec.subject}
            onChange={(e) => update({ ...doc.spec, subject: e.target.value })}
          />
        </label>
        <label>
          Preheader
          <input
            readOnly={!writable}
            maxLength={250}
            value={doc.spec.preheader}
            onChange={(e) => update({ ...doc.spec, preheader: e.target.value })}
          />
        </label>
      </div>
      <EmailUTM key={workspace+':'+id} workspace={workspace} email={id} policy={doc.spec.tracking} canEdit={editRole} blocked={!!busy||!!conflict} onApply={applyUTM}/>
      <EmailConversion key={JSON.stringify([workspace,actor,id])} workspace={workspace} email={id} actor={actor} spec={doc.spec} version={doc.doc_version} canEdit={editRole&&!!actor} blocked={!!busy||!!conflict}
        onPrepare={async()=>{
          if(busyRef.current||conflictRef.current||!editRole||!actor)return null;
          let prepared:{proposal:ReturnType<typeof ConversionProposalSchema.parse>;context:{version:number;spec:string}}|null=null;
          await act('conversion-review',async()=>{
            if(!(await flush())||dirtyAt.current||!live.current)return;
            const origin=anchor();
            const response=await api<{proposal:unknown}>(workspace,'emails/'+id+'/conversion-proposal','POST',{expected_version:origin.version},undefined,undefined,undefined,actor);
            if(!matches(origin))throw Error('The draft changed during conversion review. Your source is preserved; review the current draft again.');
            const value=ConversionProposalSchema.parse(response.proposal);
            if(value.source_doc_version!==origin.version||value.original_html!==live.current!.spec.raw_html)throw Error('The conversion proposal does not match the saved raw source.');
            prepared={proposal:value,context:{version:origin.version,spec:origin.spec}};
          });
          return prepared;
        }}
        onAccept={async(command,context)=>{
          if(busyRef.current||conflictRef.current||!editRole||!actor)throw Error('Resolve the current draft action or conflict before recovering conversion.');
          busyRef.current='convert';setBusy('convert');setError('');const origin=anchor();
          try{
            if(command.body.expected_version!==context.version)throw Error('The original conversion context is inconsistent.');
            const response=await api<{email:Doc}>(workspace,'emails/'+id+'/convert-to-blocks','POST',command.body,command.body.expected_version,command.key,undefined,actor).catch(caught=>{throw originalConversionRefusal(caught)??caught;});
            const current=await api<{email:Doc}>(workspace,'emails/'+id,'GET',undefined,undefined,undefined,undefined,actor);
            if(current.email.id!==id||response.email.id!==id||current.email.doc_version<response.email.doc_version)throw Error('The conversion receipt does not match current saved truth. Keep the original command and retry.');
            if(matches(origin)&&!dirtyAt.current){install(current.email);await removeSourceRecovery({...scopeRef.current},{draft:true,command:true});setReport(null);setRevision(null);setSelected(current.email.spec.sections[0]?.id??'');}
            else if(editorActive.current)setError('Conversion was acknowledged; newer local edits are preserved. Compare or reload the current saved head before continuing.');
          }finally{busyRef.current='';setBusy('');}
        }}
        onDiscardRefused={async()=>{
          if(busyRef.current||!editRole||!actor)throw Error('Wait for the current draft action before checking saved source.');
          busyRef.current='conversion-refresh';setBusy('conversion-refresh');const origin=anchor();
          try{
            const current=await api<{email:Doc}>(workspace,'emails/'+id,'GET',undefined,undefined,undefined,undefined,actor);
            if(current.email.id!==id)throw Error('Current saved source does not match this document.');
            if(!matches(origin))throw Error('The editor changed while checking saved source. Your local work is preserved; try again.');
            if(!dirtyAt.current){install(current.email);setConflict(null);conflictRef.current=false;setReport(null);setRevision(null);}
            else if(current.email.doc_version!==live.current!.doc_version||JSON.stringify(current.email.spec)!==ack.current){setConflict(current.email);conflictRef.current=true;setError('The refused conversion was not saved. Local edits are preserved; compare the newer saved source before reviewing again.');}
          }finally{busyRef.current='';setBusy('');}
        }}/>
      {doc.lineage?.kind==='locale'&&<LocaleSourceComparison key={workspace+':'+actor+':'+id} workspace={workspace} email={id} actor={actor} spec={doc.spec} version={doc.doc_version} canEdit={editRole} blocked={!!busy||!!conflict||hasPendingSave} onApply={(next,expected)=>{
        if(!editorActive.current||!live.current||!editRole||busyRef.current||conflictRef.current||pendingSave.current||scopeRef.current.actor!==actor||live.current.id!==id||canonicalSpecString(live.current.spec)!==expected)return 'The editor changed or a save is unresolved. Your local translations are preserved; compare again after the current action.';
        update(EmailSourceSpecSchema.parse(next));return null;
      }}/>}
      {doc.lineage?.kind==='locale'&&<LocaleContentReview key={'content-review:'+workspace+':'+actor+':'+id} workspace={workspace} email={id} actor={actor} version={doc.doc_version} canEdit={editRole} blocked={!!busy||!!conflict||hasPendingSave||status!=='Saved · v'+doc.doc_version} canRecord={()=>!!editorActive.current&&!!live.current&&live.current.id===id&&scopeRef.current.actor===actor&&!!roleRef.current&&!busyRef.current&&!conflictRef.current&&!pendingSave.current&&canonicalSpecString(live.current.spec)===ack.current}/>}
      <DerivedEmails workspace={workspace} id={id} sourceLocale={doc.spec.locale} lineage={doc.lineage ?? null} canEdit={editRole} busy={!!busy || !!conflict}
        onCreate={(input) => void act('derive', async () => {
          if (!(await flush()) || dirtyAt.current || !live.current) return;
          const origin = anchor();
          const slot = await derivationSlot(workspace, id, input, origin.version, origin.spec);
          if (!matches(origin)) return;
          const pending = pendingDerivation(slot);
          const r = pending ? { id: pending.source, anchor: origin } : revision && matches(revision.anchor) ? revision : await freeze();
          if (!r || !matches(r.anchor)) return;
          const receipt = pending ?? rememberDerivation(slot, r.id);
          const result = await api<{ email: Doc }>(workspace, 'email-revisions/' + receipt.source + '/' + (input.kind === 'remix' ? 'remix' : 'localize'), 'POST', input.kind === 'remix' ? { title: input.title } : { title: input.title, locale: input.locale }, undefined, receipt.key);
          acknowledgeDerivation(slot);
          if (matches(r.anchor)) router.push('/app/emails/' + result.email.id);
          else if (editorActive.current) setError('The source changed while the new draft was created. Your separate draft is in Emails; current edits are preserved.');
        })} />
      <div className={`editor-grid${view === 'outline' ? ' linear-mode' : ''}`}>
        <aside className="outline panel">
          <div className="section-heading">
            <h2>Outline</h2>
            <span className="badge neutral">
              {doc.spec.editing_mode === 'raw_html' ? 'Raw HTML' : 'Blocks'}
            </span>
          </div>
          {doc.spec.editing_mode === 'structured' ? (
            <>
              {view !== 'outline' && <ol>
                {doc.spec.sections.map((b, i) => (
                  <li key={b.id} className={selected === b.id ? 'selected' : ''}>
                    <button
                      className="outline-select"
                      onClick={() => setSelected(b.id)}
                      aria-pressed={selected === b.id}
                    >
                      <span>{String(i + 1).padStart(2, '0')}</span>
                      {b.type.replaceAll('_', ' ')}
                    </button>
                    <div className="block-controls">
                      <button
                        className="icon-button"
                        aria-label={`Move ${b.type} ${i + 1} up`}
                        disabled={!writable || i === 0}
                        onClick={() => {
                          const a = [...doc.spec.sections];
                          [a[i - 1], a[i]] = [a[i], a[i - 1]];
                          update({ ...doc.spec, sections: a });
                        }}
                      >
                        <ArrowUp size={15} />
                      </button>
                      <button
                        className="icon-button"
                        aria-label={`Move ${b.type} ${i + 1} down`}
                        disabled={!writable || i === doc.spec.sections.length - 1}
                        onClick={() => {
                          const a = [...doc.spec.sections];
                          [a[i + 1], a[i]] = [a[i], a[i + 1]];
                          update({ ...doc.spec, sections: a });
                        }}
                      >
                        <ArrowDown size={15} />
                      </button>
                      <button
                        className="icon-button"
                        disabled={!writable}
                        aria-label={`Delete ${b.type} ${i + 1}`}
                        onClick={() =>
                          update({
                            ...doc.spec,
                            sections: doc.spec.sections.filter((n) => n.id !== b.id),
                          })
                        }
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </li>
                ))}
              </ol>}
              <label>
                Block type
                <select
                  aria-label="Block type"
                  value={addType}
                  onChange={(e) => setAddType(e.target.value as Block['type'])}
                >
                  {[
                    'hero',
                    'text',
                    'image',
                    'button',
                    'columns',
                    'divider',
                    'social',
                    'legal_footer',
                    'product_card',
                    'custom_html',
                  ].map((t) => (
                    <option key={t} value={t}>
                      {t.replaceAll('_', ' ')}
                    </option>
                  ))}
                </select>
              </label>
              <button
                disabled={!writable}
                onClick={() => {
                  const b = newBlock(addType);
                  outlineCommand(spec=>({ ...spec, sections: [...spec.sections, b] }));
                  setSelected(b.id);
                }}
              >
                <Plus size={16} /> Add block
              </button>
            </>
          ) : (
            <p className="muted small">
              Raw mode is authoritative. Converting to blocks requires a separate reviewed proposal;
              no automatic round trip is claimed.
            </p>
          )}
          <div className="divider" />
          <label>
            Email direction
            <select
              disabled={!writable}
              value={doc.spec.direction}
              onChange={(e) => update({ ...doc.spec, direction: e.target.value as 'ltr' | 'rtl' })}
            >
              <option value="ltr">Left to right</option>
              <option value="rtl">Right to left</option>
            </select>
          </label>
          <p className="small muted">Locale: {doc.spec.locale}</p>
        </aside>
        <section className="canvas-area">
          <div className="canvas-toolbar">
            <div role="group" aria-label="Editor view">
              <button
                className={view === 'canvas' ? 'selected' : ''}
                onClick={() => setView('canvas')}
              >
                Preview
              </button>
              <button aria-pressed={view === 'outline'} className={view === 'outline' ? 'selected' : ''} onClick={() => setView('outline')}>Outline</button>
              <button className={view === 'code' ? 'selected' : ''} onClick={() => setView('code')}>
                <Code2 size={16} /> HTML
              </button>
              <button className={view === 'text' ? 'selected' : ''} onClick={() => setView('text')}>
                Plaintext
              </button>
            </div>
            {view === 'canvas' && <div role="group" aria-label="Simulated viewport">
              <button
                aria-label="Desktop simulation"
                className={!mobile ? 'selected' : ''}
                onClick={() => setMobile(false)}
              >
                <Monitor size={17} />
              </button>
              <button
                aria-label="390 pixel mobile simulation"
                className={mobile ? 'selected' : ''}
                onClick={() => setMobile(true)}
              >
                <Smartphone size={17} />
              </button>
            </div>}
          </div>
          {view === 'canvas' && <p className="simulation-label">
            <span className="badge warning">Simulation</span> {mobile ? '390px mobile' : 'Desktop'}{' '}
            · Same draft revision · No real-client verification
          </p>}
          {view === 'outline' ? (
            doc.spec.editing_mode === 'structured' ? <EmailLinearOutline
              sections={doc.spec.sections} readOnly={!writable} locale={doc.spec.locale} direction={doc.spec.direction}
              onChangeBlock={changeBlock} onMove={(id,position)=>outlineCommand(spec=>moveEmailSection(spec,id,position))}
              onRemove={id=>outlineCommand(spec=>removeEmailSection(spec,id))} onSelect={setSelected} columnActions={columnActions}
            /> : <section className="panel linear-email-outline" aria-label="Linear email Outline">
              <h2>Raw source Outline</h2>
              <p>Raw HTML remains the authoritative source. Subject and preheader can be edited above. Use HTML view on a larger screen to edit source; switching views preserves this draft.</p>
              <label>Raw HTML source in Outline<textarea readOnly dir="ltr" rows={12} value={doc.spec.raw_html??''}/></label>
              <h3>Plaintext projection</h3><pre className="code-view" lang={doc.spec.locale} dir={doc.spec.direction}>{text}</pre>
            </section>
          ) : view === 'canvas' ? (
            <iframe
              title="Email browser simulation"
              sandbox=""
              referrerPolicy="no-referrer"
              className={`email-preview ${mobile ? 'mobile' : ''}`}
              srcDoc={
                "<meta http-equiv=\"Content-Security-Policy\" content=\"default-src 'none'; style-src 'unsafe-inline'; img-src data:; base-uri 'none'; form-action 'none'\">" +
                previewHtml
              }
            />
          ) : view === 'text' ? (
            <pre className="code-view">{text}</pre>
          ) : (
            <div className="panel code-panel">
              {doc.spec.editing_mode === 'raw_html' ? (
                <HtmlCodeEditor key="raw-source" label="Raw HTML source" readOnly={!writable} value={doc.spec.raw_html??''} onChange={raw_html=>update({...doc.spec,raw_html})}/>
              ) : (
                <>
                  <p className="alert info">
                    Compiled HTML is read-only. Editing raw source creates a checkpoint and changes
                    the authoritative editing mode.
                  </p>
                  <HtmlCodeEditor key="compiled-source" label="Compiled HTML source" readOnly value={html}/>
                  <button
                    disabled={!editRole || !!busy}
                    onClick={() =>
                      void act('raw', async () => {
                        if (!(await flush()) || dirtyAt.current) return;
                        const origin = anchor(),
                          snapshot = structuredClone(live.current!);
                        const compiled=await api<{artifact:{html:string;hash:string;manifest:{assets?:{entries:Array<{asset_id:string;variant_id:string}>};raw_projection?:{delivery_status:string};fragment_projection?:{delivery_status:string}}}}>(workspace,'emails/'+id+'/preview','POST',{spec:snapshot.spec},undefined,undefined,undefined,actor);
                        if(!matches(origin))throw Error('The draft changed before raw conversion. Review the current version.');
                        const projectionStatus=effectiveProjectionStatus(compiled.artifact.manifest);if(projectionStatus!=='eligible_for_checks')throw Error(projectionStatus==='unavailable'?'Generated source is unavailable. Exact authored fragments remain in the structured draft; correct the source diagnostics before switching modes.':'Correct the blocking source diagnostics before switching modes. Exact authored fragments remain in the structured draft.');
                        const entries=compiled.artifact.manifest.assets?.entries;
                        const registry=entries?Array.from(new Map(entries.map(e=>[e.asset_id+':'+e.variant_id,{asset_id:e.asset_id,variant_id:e.variant_id}])).values()):undefined;
                        const spec=EmailSourceSpecSchema.parse({...snapshot.spec,editing_mode:'raw_html',raw_html:compiled.artifact.html,...(registry?.length?{schema_version:'1.1',asset_registry:registry}:{})});
                        const command=await createSourceForkCommand(saveContext(spec),compiled.artifact.hash,undefined,snapshot.spec);
                        if(!matches(origin))throw Error('The draft changed before the fork command was captured.');
                        pendingSave.current=command;setHasPendingSave(true);
                        await writeSourceCommandRecovery({...scopeRef.current},serializeSourceSaveCommand(command));
                        await writeSourceDraftRecovery({...scopeRef.current},{...snapshot,spec});
                        const response=await api<unknown>(workspace,'emails/'+id+'/source-fork','POST',{expected_artifact_hash:command.expectedArtifactHash},command.baseVersion,command.key,undefined,actor);
                        const validated=await validateSourceSaveReceipt(command,response,()=>saveContext());
                        if(!matches(origin))throw Error('The draft changed during raw conversion. Your local copy and original command are preserved.');
                        const server=await api<{email:Doc}>(workspace,'emails/'+id,'GET',undefined,undefined,undefined,undefined,actor);
                        if(!matches(origin)||server.email.doc_version!==validated.savedVersion||canonicalSpecString(server.email.spec)!==validated.acknowledgedCanonicalSpec)throw Error('The current server head differs from the fork receipt. Compare or reload before continuing.');
                        install(server.email);pendingSave.current=null;setHasPendingSave(false);
                        await removeSourceRecovery({...scopeRef.current},{draft:true,command:true,expectedDraft:{docVersion:command.baseVersion,specHash:command.specHash},expectedCommandKey:command.key});
                        setReport(null);
                        setRevision(null);
                      })
                    }
                  >
                    <Code2 size={16} /> Edit raw HTML
                  </button>
                </>
              )}
            </div>
          )}
        </section>
        <aside className="inspector panel">
          <fieldset className="inspector-fields" disabled={!writable}>
            <h2>{block ? block.type.replaceAll('_', ' ') + ' settings' : 'Document settings'}</h2>
            {view !== 'outline' && block && doc.spec.editing_mode === 'structured' && (
              <BlockFields block={block} onChange={changeBlock} columnActions={columnActions}/>
            )}
            <div className="divider" />
            <div className="ai-panel">
              <h2>
                <Sparkles size={18} /> A second draft
              </h2>
              <label>
                Propose changes
                <textarea
                  rows={3}
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Describe the changes and any approved facts."
                />
              </label>
              <button
                disabled={!editRole || !!busy || !aiPrompt || !editRole}
                onClick={() =>
                  void act('ai', async () => {
                    if (!(await flush()) || dirtyAt.current) return;
                    const origin = anchor();
                    const base = live.current!.doc_version;
                    const r = await api<{ operation: { id: string } }>(
                      workspace,
                      'emails/generate',
                      'POST',
                      {
                        prompt: aiPrompt,
                        brand_kit_version_id: doc.spec.brand_kit_version_id,
                        base_email_id: id,
                        base_version: base,
                        locale: doc.spec.locale,
                        mode: 'single',
                      },
                    );
                    const r2 = await poll<{
                      proposals: { spec: EmailSpec; review_notes: string[] }[];
                    }>(workspace, r.operation.id);
                    setProposal({ ...r2.proposals[0], base, anchor: origin });
                  })
                }
              >
                <Sparkles size={16} /> Generate proposal
              </button>
              <p className="small muted">
                Proposals stay separate until you apply them. Paid AI is unavailable until
                configured.
              </p>
              {proposal && (
                <div className="proposal">
                  <strong>{proposal.spec.subject}</strong>
                  {proposal.review_notes.map((n, i) => (
                    <p key={i} className="small">
                      {n}
                    </p>
                  ))}
                  {!proposalMatches && (
                    <p className="alert warning small">
                      The draft changed. Compare or create a copy; this proposal cannot replace the
                      newer draft.
                    </p>
                  )}
                  <button
                    disabled={!editRole || !proposalMatches}
                    onClick={() => {
                      if (!matches(proposal.anchor)) {
                        setError(
                          'The draft changed. This proposal cannot replace newer local work.',
                        );
                        return;
                      }
                      try{
                        update(copyProposalWithCurrentUTM(live.current!.spec,proposal.spec));
                        setProposal(null);
                      }catch(error){setError(error instanceof Error?error.message:'Proposal links need correction before applying. Your draft and UTM policy are retained.');}
                    }}
                  >
                    Apply proposal
                  </button>
                  <button onClick={() => setProposal(null)}>Discard</button>
                </div>
              )}
            </div>
          </fieldset>
          {block?.type==='image'&&doc.spec.editing_mode==='structured'&&<><button type="button" disabled={!!busy||!!conflict} onClick={()=>setShowAssets(v=>!v)}>Choose uploaded image</button>{showAssets&&<AssetPicker workspace={workspace} actor={actor} email={id} nodeId={block.id} docVersion={doc.doc_version} sourceRef={JSON.stringify(block)} canEdit={editRole} blocked={!!busy||!!conflict} onApply={applyAsset}/>}</>}
        </aside>
      </div>
      {report && (
        <section className="panel preflight-panel">
          <div className="section-heading">
            <h2>
              <FileCheck size={22} /> Review evidence
            </h2>
            <span className={`badge ${report.state === 'blocked' ? 'danger' : 'warning'}`}>
              {report.state}
            </span>
          </div>
          <p className="small muted">
            Frozen artifact {report.artifact_hash} · Rules {report.rule_set_version} · Missing
            real-client captures remain incomplete.
          </p>
          <div className="finding-list">
            {report.findings.map((f, i) => (
              <div key={i}>
                <span
                  className={`badge ${f.severity === 'blocking' ? 'danger' : f.severity === 'warning' ? 'warning' : 'info'}`}
                >
                  {f.severity}
                </span>
                <div>
                  <strong>{f.code.replaceAll('_', ' ')}</strong>
                  <p>{f.message}</p>
                  <span className="small muted">Location: {f.location}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
      <DestinationExportPanel hubspotSettings={hubspotSettings.workspace===workspace&&hubspotSettings.actor===actor&&hubspotSettings.email===id?hubspotSettings.values:emptyHubSpotSettings()} onHubSpotSettings={changeHubSpotSettings} destination={destination} onDestination={chooseDestination} canEdit={editRole} blocked={!!busy||!!conflict} review={destinationPreparation&&destinationPreparation.review.destination===destination&&destinationPreparation.workspace===workspace&&destinationPreparation.actor===actor&&destinationPreparation.email===id&&destinationPreparation.anchor.epoch===renderEpoch&&destinationPreparation.anchor.version===doc.doc_version&&destinationPreparation.anchor.spec===JSON.stringify(doc.spec)?destinationPreparation.review:null} onReview={()=>void act('destination-review',reviewDestination)} onDownload={format=>void act('destination-download',()=>downloadDestination(format))}/>
      <section className="panel export-panel">
        <div>
          <h2>Export a frozen version</h2>
          <p className="muted small">
            Downloads retain explicit merge/unsubscribe slots. Configure them in your recipient
            system before sending. PNG/PDF use an isolated browser simulation with remote images
            blocked.
          </p>
        </div>
        <div className="toolbar">
          {['html', 'txt', 'png', 'pdf','zip',...(doc.spec.editing_mode==='raw_html'?['source']:[])].map((format) => (
            <button
              disabled={!editRole || !!busy || !!conflict}
              key={format}
              onClick={() =>
                void act('download', async () => {
                  const controller = new AbortController();
                  exportController.current = controller;
                  try {
                    const r = revision && matches(revision.anchor) ? revision : await freeze();
                    if (!r || controller.signal.aborted || !matches(r.anchor)) return;
                    const response = await fetch(
                      '/v1/email-revisions/' + r.id + '/download?format=' + format,
                      { headers: { 'X-Workspace-Id': workspace,'X-Actor-Id':actor }, signal: controller.signal },
                    );
                    if (!response.ok) {
                      const j = await response.json();
                      throw new Error(j.error?.message ?? 'Download failed');
                    }
                    const blob = await response.blob();
                    if (controller.signal.aborted || !matches(r.anchor)) return;
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `email-v${r.revision_no}.${format==='source'?'source.html.txt':format}`;
                    a.click();
                    setTimeout(() => URL.revokeObjectURL(url), 1000);
                  } catch (error) {
                    if (!controller.signal.aborted) throw error;
                  } finally {
                    if (exportController.current === controller) exportController.current = null;
                  }
                })
              }
            >
              <Download size={16} />
              {format==='source'?'SOURCE (INERT TEXT)':format.toUpperCase()}
            </button>
          ))}
        </div>
      </section>
    </>
  );
}
function newBlock(type: Block['type']): Block {
  const id = crypto.randomUUID();
  switch (type) {
    case 'hero':
      return { id, type, heading: 'Your heading', text: 'Add supporting copy.' };
    case 'text':
      return { id, type, text: 'Write your story.' };
    case 'image':
      return { id, type, src: 'https://example.com/image.png', alt: '' };
    case 'button':
      return { id, type, label: 'Explore', href: 'https://example.com' };
    case 'divider':
      return { id, type };
    case 'columns':
      return {
        id,
        type,
        columns: [
          [{ id: crypto.randomUUID(), type: 'text', text: 'First column' }],
          [{ id: crypto.randomUUID(), type: 'text', text: 'Second column' }],
        ],
      };
    case 'social':
      return { id, type, links: [{ label: 'Website', href: 'https://example.com' }] };
    case 'legal_footer':
      return { id, type, identity: '', address: '', unsubscribe_slot: true };
    case 'product_card':
      return {
        id,
        type,
        title: 'Product name',
        description: 'Approved product details',
        price: '',
        href: 'https://example.com',
      };
    case 'custom_html':
      return { id, type, html: '<p>Custom content</p>' };
  }
}
