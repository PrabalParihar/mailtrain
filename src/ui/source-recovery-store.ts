// One draft and one original command per actor/document. Nothing is replayed.
import {z} from 'zod';
import {EmailSourceSpecSchema, type EmailSpec} from '../domain/email-schema';
import {SavedEmailResponseSchema, type SourceProfile} from '../domain/email-source-contracts';
import {canonicalSpecString,validateSourceMetadata,MAX_SOURCE_COMMAND_JSON_BYTES} from '../domain/email-source-values';
import {recoverSourceSaveCommand,type SourceSaveCommand} from './source-save-command';

export const SOURCE_RECOVERY_DATABASE='lettercape-source-recovery-1';
export const MAX_SOURCE_RECOVERY_SLOTS=20;
export type SourceRecoveryScope={workspace:string;actor:string;email:string};
export type SourceRecoveryDraft={id:string;title:string;doc_version:number;spec:EmailSpec;lineage?:unknown;updated_at?:string;raw_source_profile?:SourceProfile|null};
export type SourceRecovery={draft?:SourceRecoveryDraft;command?:string};
export type SourceRecoveryRemoval={draft?:boolean;command?:boolean;expectedDraft?:{docVersion:number;specHash:string};expectedCommandKey?:string};
type RecordValue=SourceRecovery & {scope:SourceRecoveryScope};
const scopeSchema=z.object({workspace:z.uuid(),actor:z.string().min(1).max(200),email:z.uuid()}).strict();
const slotSchema=z.object({scope:scopeSchema,draft:z.unknown().optional(),command:z.string().optional()}).strict();
function own<T>(value:T):T{return JSON.parse(canonicalSpecString(value)) as T;}
function slot(scope:SourceRecoveryScope){return JSON.stringify([scope.workspace,scope.actor,scope.email]);}
function checkedScope(scope:SourceRecoveryScope){return scopeSchema.parse(own(scope));}
function checkedRecord(value:unknown,scope:SourceRecoveryScope):RecordValue|undefined{
  if(value===undefined)return undefined;
  const record=slotSchema.parse(own(value));
  if(slot(record.scope)!==slot(scope))throw Error('The recovery record belongs to a different actor or document.');
  return record as RecordValue;
}
function checkedDraft(scope:SourceRecoveryScope,input:SourceRecoveryDraft):SourceRecoveryDraft {
  const snapshot=own(input),draft=SavedEmailResponseSchema.shape.email.parse(snapshot);
  if(draft.id!==scope.email||!Number.isSafeInteger(draft.doc_version))throw Error('The recovery draft belongs to a different document or version.');
  const spec=EmailSourceSpecSchema.parse(draft.spec),metadata={...spec};delete metadata.raw_html;
  // Include the document envelope in the non-source budget as well.
  validateSourceMetadata({...draft,spec:metadata,...(spec.raw_html!==undefined?{raw_html:spec.raw_html}:{})});
  return {...draft,spec};
}
async function checkedCommand(scope:SourceRecoveryScope,serialized:string):Promise<string> {
  if(typeof serialized!=='string'||serialized.length>MAX_SOURCE_COMMAND_JSON_BYTES||new TextEncoder().encode(serialized).length>MAX_SOURCE_COMMAND_JSON_BYTES)throw Error('The recovery command exceeds its finite source command bound.');
  let command:SourceSaveCommand;
  try{command=JSON.parse(serialized);}catch{throw Error('The original recovery command is malformed.');}
  if(!command?.scope||slot(checkedScope({workspace:command.scope.workspace,actor:command.scope.actor,email:command.scope.email}))!==slot(scope))throw Error('The recovery command belongs to a different actor or document.');
  const checked=await recoverSourceSaveCommand(serialized,{...command.scope,baseVersion:command.baseVersion,spec:command.spec});
  if(!checked)throw Error('The original recovery command hash, source or payload is invalid.');
  // Admission remains the integrating shared schema, not just transport JSON.
  EmailSourceSpecSchema.parse(checked.spec);return serialized;
}
async function open():Promise<IDBDatabase> {
  let factory:IDBFactory;
  try{factory=globalThis.indexedDB;if(!factory)throw Error('unavailable');}catch{throw Error('IndexedDB recovery storage is unavailable. Keep the original draft and command in memory.');}
  return new Promise((resolve,reject)=>{
    let rejected=false;const request=factory.open(SOURCE_RECOVERY_DATABASE,1);
    request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains('slots'))request.result.createObjectStore('slots');};
    request.onerror=()=>reject(request.error??Error('IndexedDB recovery storage could not open.'));
    request.onblocked=()=>{rejected=true;reject(Error('IndexedDB recovery storage is blocked by another connection.'));};
    request.onsuccess=()=>{const db=request.result;if(rejected){db.close();return;}db.onversionchange=()=>db.close();resolve(db);};
  });
}
async function quotaAdmission(bytes:number):Promise<void> {
  // Some engines retain an old IndexedDB quota grant after the available origin
  // quota falls. Deny known insufficient capacity before reporting persistence.
  // This is conservative for replacements; it never deletes previous work.
  const storage=globalThis.navigator?.storage;
  if(!storage?.estimate)return;
  const estimate=await storage.estimate();
  if(typeof estimate.quota==='number'&&Number.isFinite(estimate.quota)&&typeof estimate.usage==='number'&&Number.isFinite(estimate.usage)&&bytes>Math.max(0,estimate.quota-estimate.usage))throw new DOMException('Available browser storage cannot retain this original source recovery. Keep it in memory and save or explicitly remove an existing recovery.','QuotaExceededError');
}
async function readRecord(scope:SourceRecoveryScope):Promise<RecordValue|undefined> {
  const db=await open();
  try{return await new Promise((resolve,reject)=>{const tx=db.transaction('slots','readonly'),request=tx.objectStore('slots').get(slot(scope));let result:RecordValue|undefined,failure:unknown;
    request.onsuccess=()=>{try{result=checkedRecord(request.result,scope);}catch(error){failure=error;tx.abort();}};
    tx.oncomplete=()=>resolve(result);tx.onabort=()=>reject(failure??tx.error??new DOMException('Recovery read aborted','AbortError'));tx.onerror=()=>{};
  });}finally{db.close();}
}
async function change(scope:SourceRecoveryScope,update:(record:RecordValue|undefined)=>RecordValue|undefined):Promise<void> {
  const db=await open();
  try{await new Promise<void>((resolve,reject)=>{const tx=db.transaction('slots','readwrite'),store=tx.objectStore('slots'),get=store.get(slot(scope));let failure:unknown;
    const deny=(error:unknown)=>{failure=error;tx.abort();};
    get.onsuccess=()=>{try{const previous=checkedRecord(get.result,scope),next=update(previous);
      if(!next){if(previous)store.delete(slot(scope));return;}
      if(previous){store.put(next,slot(scope));return;}
      // Count and insertion share one serialized readwrite transaction.
      const count=store.count();count.onsuccess=()=>{try{if(count.result>=MAX_SOURCE_RECOVERY_SLOTS)throw Error('Local recovery has 20 document slots. Save or explicitly remove an existing recovery before adding another.');store.put(next,slot(scope));}catch(error){deny(error);}};
    }catch(error){deny(error);}};
    tx.oncomplete=()=>resolve();tx.onabort=()=>reject(failure??tx.error??new DOMException('Recovery write aborted; original command remains caller-owned','AbortError'));tx.onerror=()=>{};
  });}finally{db.close();}
}

export async function readSourceRecovery(input:SourceRecoveryScope):Promise<SourceRecovery> {
  const scope=checkedScope(input),record=await readRecord(scope);if(!record)return {};
  const result:SourceRecovery={};if(record.draft!==undefined)result.draft=checkedDraft(scope,record.draft);if(record.command!==undefined)result.command=await checkedCommand(scope,record.command);return result;
}
export async function writeSourceDraftRecovery(input:SourceRecoveryScope,draft:SourceRecoveryDraft):Promise<void> {
  const scope=checkedScope(input),snapshot=checkedDraft(scope,draft);await quotaAdmission(new TextEncoder().encode(canonicalSpecString(snapshot)).length);await change(scope,record=>({...record,scope,draft:snapshot}));
}
export async function writeSourceCommandRecovery(input:SourceRecoveryScope,serialized:string):Promise<void> {
  const scope=checkedScope(input),command=await checkedCommand(scope,serialized);await quotaAdmission(new TextEncoder().encode(command).length);await change(scope,record=>({...record,scope,command}));
}
export async function removeSourceRecovery(input:SourceRecoveryScope,options:SourceRecoveryRemoval):Promise<void> {
  const scope=checkedScope(input),settings=z.object({draft:z.boolean().optional(),command:z.boolean().optional(),expectedDraft:z.object({docVersion:z.number().int().positive().max(Number.MAX_SAFE_INTEGER),specHash:z.string().regex(/^[a-f0-9]{64}$/)}).strict().optional(),expectedCommandKey:z.string().min(1).max(200).optional()}).strict().parse(own(options));
  let expectedCanonical:string|undefined;
  if(settings.draft&&settings.expectedDraft){const before=await readRecord(scope);if(before?.draft){const draft=checkedDraft(scope,before.draft),canonical=canonicalSpecString(draft.spec),digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(canonical)),hash=Array.from(new Uint8Array(digest),n=>n.toString(16).padStart(2,'0')).join('');if(draft.doc_version===settings.expectedDraft.docVersion&&hash===settings.expectedDraft.specHash)expectedCanonical=canonical;}}
  await change(scope,record=>{if(!record)return undefined;const next={...record};
    if(settings.draft&&next.draft!==undefined){if(!settings.expectedDraft)delete next.draft;else{const current=checkedDraft(scope,next.draft);if(expectedCanonical!==undefined&&current.doc_version===settings.expectedDraft.docVersion&&canonicalSpecString(current.spec)===expectedCanonical)delete next.draft;}}
    if(settings.command&&next.command!==undefined){if(!settings.expectedCommandKey)delete next.command;else{let key:unknown;try{key=JSON.parse(next.command).key;}catch{}if(key===settings.expectedCommandKey)delete next.command;}}
    return next.draft===undefined&&next.command===undefined?undefined:next;
  });
}
