// Browser-safe command identity. This module performs no storage or network writes.
import {z} from 'zod';
import type {EmailSpec} from '../domain/email-schema';
import {SavedEmailResponseSchema, type SavedEmailResponse} from '../domain/email-source-contracts';
import {canonicalSpecString, rawSourceBytes, validateSourceMetadata, MAX_SOURCE_COMMAND_JSON_BYTES} from '../domain/email-source-values';

export type SourceSaveScope={workspace:string;actor:string;email:string;lifecycle:string;epoch:number};
export type SourceSaveContext=SourceSaveScope & {baseVersion:number;spec:EmailSpec};
export type SourceSaveCommand={version:1;scope:SourceSaveScope;baseVersion:number;key:string;action?:'draft'|'source-fork';expectedArtifactHash?:string;forkBaseSpecHash?:string;adoptBaseSpecHash?:string;spec:EmailSpec;specHash:string;source:{profile:'exact-utf8-1';sha256:string;bytes:number}|null};
export type ValidatedSourceSaveReceipt={response:SavedEmailResponse;acknowledgedSpec:EmailSpec;acknowledgedCanonicalSpec:string;savedVersion:number;dirty:boolean};

const hash=z.string().regex(/^[a-f0-9]{64}$/);
const scopeSchema=z.object({workspace:z.uuid(),actor:z.string().min(1).max(200),email:z.uuid(),lifecycle:z.string().min(1).max(200),epoch:z.number().int().min(0).max(Number.MAX_SAFE_INTEGER)}).strict();
const baseSchema=z.number().int().min(1).max(Number.MAX_SAFE_INTEGER-1);
const keySchema=z.string().min(1).max(200);
const commandSchema=z.object({version:z.literal(1),scope:scopeSchema,baseVersion:baseSchema,key:keySchema,action:z.enum(['draft','source-fork']).optional(),expectedArtifactHash:hash.optional(),forkBaseSpecHash:hash.optional(),adoptBaseSpecHash:hash.optional(),spec:z.record(z.string(),z.unknown()),specHash:hash,source:z.object({profile:z.literal('exact-utf8-1'),sha256:hash,bytes:z.number().int().min(0).max(2*1024*1024)}).strict().nullable()}).strict().refine(c=>c.action==='source-fork'?c.expectedArtifactHash!==undefined&&c.forkBaseSpecHash!==undefined:c.expectedArtifactHash===undefined&&c.forkBaseSpecHash===undefined,'Fork action must bind the original artifact hash');

function immutable<T>(value:T):T {
  if(value&&typeof value==='object'){for(const item of Object.values(value))immutable(item);Object.freeze(value);}
  return value;
}
function ownSnapshot<T>(value:T):T{return JSON.parse(canonicalSpecString(value)) as T;}
function checkSpec(spec:EmailSpec):string {
  validateSourceMetadata(spec);
  if(spec.editing_mode!=='structured'&&spec.editing_mode!=='raw_html')throw Error('The submitted document mode is unavailable.');
  if(spec.editing_mode==='raw_html')rawSourceBytes(spec.raw_html!);
  return canonicalSpecString(spec);
}
async function sha256(bytes:Uint8Array):Promise<string>{
  // Own ArrayBuffer bytes keep the browser WebCrypto input bounded and portable.
  const result=await crypto.subtle.digest('SHA-256',new Uint8Array(bytes));
  return Array.from(new Uint8Array(result),n=>n.toString(16).padStart(2,'0')).join('');
}
async function identity(spec:EmailSpec):Promise<{canonical:string;specHash:string;source:SourceSaveCommand['source']}> {
  const canonical=checkSpec(spec),specHash=await sha256(new TextEncoder().encode(canonical));
  if(spec.editing_mode!=='raw_html')return {canonical,specHash,source:null};
  const bytes=rawSourceBytes(spec.raw_html!);
  return {canonical,specHash,source:{profile:'exact-utf8-1',sha256:await sha256(bytes),bytes:bytes.length}};
}
function sameScope(a:SourceSaveScope,b:SourceSaveScope){return a.workspace===b.workspace&&a.actor===b.actor&&a.email===b.email&&a.lifecycle===b.lifecycle&&a.epoch===b.epoch;}
function sameSource(a:SourceSaveCommand['source'],b:SourceSaveCommand['source']){return a===null||b===null?a===b:a.profile===b.profile&&a.sha256===b.sha256&&a.bytes===b.bytes;}
async function checkedCommand(input:SourceSaveCommand):Promise<SourceSaveCommand> {
  const command=commandSchema.parse(ownSnapshot(input)) as SourceSaveCommand,result=await identity(command.spec);
  if(command.specHash!==result.specHash||!sameSource(command.source,result.source))throw Error('The retained save command does not match its exact document bytes.');
  return immutable(command);
}

/** Capture the original payload and key before dispatch; later edits cannot change it. */
export async function createSourceSaveCommand(context:SourceSaveContext,key:string=crypto.randomUUID()):Promise<SourceSaveCommand> {
  const snapshot=ownSnapshot(context),scope=scopeSchema.parse({workspace:snapshot.workspace,actor:snapshot.actor,email:snapshot.email,lifecycle:snapshot.lifecycle,epoch:snapshot.epoch}),baseVersion=baseSchema.parse(snapshot.baseVersion);
  keySchema.parse(key);const result=await identity(snapshot.spec);
  return immutable({version:1,scope,baseVersion,key,spec:snapshot.spec,specHash:result.specHash,source:result.source});
}
export async function createSourceReplacementCommand(context:SourceSaveContext,baseSpec:EmailSpec,key?:string):Promise<SourceSaveCommand>{return immutable({...await createSourceSaveCommand(context,key),adoptBaseSpecHash:(await identity(baseSpec)).specHash});}
export async function createSourceForkCommand(context:SourceSaveContext,artifactHash:string,key?:string,baseSpec:EmailSpec=context.spec):Promise<SourceSaveCommand>{
  hash.parse(artifactHash);if(context.spec.editing_mode!=='raw_html')throw Error('A fork command must bind the expected raw source.');
  return immutable({...await createSourceSaveCommand(context,key),action:'source-fork',expectedArtifactHash:artifactHash,forkBaseSpecHash:(await identity(baseSpec)).specHash});
}
/** Persist only this command; the caller chooses actor/document-scoped storage. */
export function serializeSourceSaveCommand(command:SourceSaveCommand):string {
  const encoded=canonicalSpecString(command);
  if(new TextEncoder().encode(encoded).length>MAX_SOURCE_COMMAND_JSON_BYTES)throw Error('The source recovery command exceeds its transport bound.');
  commandSchema.parse(JSON.parse(encoded));return encoded;
}
/** Explicit recovery requires the exact original document/base; it never dispatches. */
export async function recoverSourceSaveCommand(serialized:string,current:SourceSaveContext):Promise<SourceSaveCommand|null> {
  try {
    if(typeof serialized!=='string'||serialized.length>MAX_SOURCE_COMMAND_JSON_BYTES||new TextEncoder().encode(serialized).length>MAX_SOURCE_COMMAND_JSON_BYTES)return null;
    const command=await checkedCommand(JSON.parse(serialized)),live=ownSnapshot(current),scope=scopeSchema.parse({workspace:live.workspace,actor:live.actor,email:live.email,lifecycle:live.lifecycle,epoch:live.epoch});
    if(command.scope.workspace!==scope.workspace||command.scope.actor!==scope.actor||command.scope.email!==scope.email||command.baseVersion!==baseSchema.parse(live.baseVersion)||canonicalSpecString(command.spec)!==checkSpec(live.spec))return null;
    return immutable({...command,scope});
  }catch{return null;}
}

/** A 200 alone is insufficient. Call before adopting a version or marking Saved.
 * The live getter is deliberately read after all asynchronous hashing, so a
 * context switch while hashing cannot validate an old lifecycle. Later edits
 * remain caller-owned; only the original acknowledged snapshot is returned.
 */
export async function validateSourceSaveReceipt(command:SourceSaveCommand,input:unknown,getLiveContext:()=>SourceSaveContext):Promise<ValidatedSourceSaveReceipt> {
  const submitted=await checkedCommand(command),response=SavedEmailResponseSchema.parse(ownSnapshot(input)),receipt=response.receipt;
  if(receipt.workspace_id!==submitted.scope.workspace||receipt.email_id!==submitted.scope.email||receipt.request_base_version!==submitted.baseVersion||receipt.saved_doc_version!==submitted.baseVersion+1||receipt.command_id!==submitted.key)throw Error('The save receipt belongs to a different document, base or command.');
  const returnedSpec=response.email.spec as EmailSpec,returned=await identity(returnedSpec),originalCanonical=canonicalSpecString(submitted.spec);
  if(returned.canonical!==originalCanonical||returned.specHash!==submitted.specHash||receipt.spec_hash!==submitted.specHash||!sameSource(returned.source,submitted.source)||!sameSource(receipt.source as SourceSaveCommand['source'],submitted.source))throw Error('The saved receipt does not acknowledge the exact submitted source and document.');
  if(response.email.raw_source_profile!==undefined&&response.email.raw_source_profile!==(submitted.source?.profile??null))throw Error('The saved document source profile does not match its receipt.');
  const live=ownSnapshot(getLiveContext()),liveScope=scopeSchema.parse({workspace:live.workspace,actor:live.actor,email:live.email,lifecycle:live.lifecycle,epoch:live.epoch});
  if(!sameScope(submitted.scope,liveScope)||live.baseVersion!==submitted.baseVersion)throw Error('The editor context changed before the save was acknowledged.');
  const dirty=checkSpec(live.spec)!==originalCanonical;
  return immutable({response,acknowledgedSpec:submitted.spec,acknowledgedCanonicalSpec:originalCanonical,savedVersion:receipt.saved_doc_version,dirty});
}
