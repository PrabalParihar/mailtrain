import{z}from'zod';
import type{Tx}from'./db';import type{Principal}from'./auth';
import{assertCurrentAuthority}from'./current-authority';import{keyed}from'./commands';import{fail}from'./errors';
import{getEmail,saveDraft,checkpoint}from'./emails';
import{canonicalSpecHash,validateRawSource}from'../domain/email-source-digest';
import{canonicalSpecString,validateSourceMetadata}from'../domain/email-source-values';
import{SavedEmailResponseSchema,SourceProfileSchema,type SavedEmailResponse}from'../domain/email-source-contracts';
import{sourceValueFailure}from'./email-source-body';
import{EmailSourceSpecSchema}from'../domain/email-schema';
type CompactReceipt={email:Omit<SavedEmailResponse['email'],'spec'>;receipt:SavedEmailResponse['receipt'];metadata?:Record<string,unknown>;source_revision?:string};
function compact(value:SavedEmailResponse):CompactReceipt{const email={...value.email};delete (email as Partial<SavedEmailResponse['email']>).spec;return {email,receipt:value.receipt};}
function hydrate(stored:CompactReceipt,spec:unknown):SavedEmailResponse{
 const value=EmailSourceSpecSchema.parse(spec),source=value.editing_mode==='raw_html'?validateRawSource(value.raw_html!):null;
 if(canonicalSpecHash(value)!==stored.receipt.spec_hash||
  (source===null)!==(stored.receipt.source===null)||
  (source&&stored.receipt.source&&(source.sha256!==stored.receipt.source.sha256||source.bytes!==stored.receipt.source.bytes||stored.receipt.source.profile!==stored.email.raw_source_profile)))
  fail(500,'SOURCE_RECEIPT_MISMATCH','The stored command receipt does not match its original source. Keep the original command and contact support.');
 return SavedEmailResponseSchema.parse({email:{...stored.email,spec:value},receipt:stored.receipt});
}
function rawForkSpec(spec:unknown,frozen:{html:string;manifest:{assets?:{entries:Array<{asset_id:string;variant_id:string}>}}}){
 const original=EmailSourceSpecSchema.parse(spec),entries=frozen.manifest.assets?.entries;
 const registry=entries?Array.from(new Map(entries.map(e=>[e.asset_id+':'+e.variant_id,{asset_id:e.asset_id,variant_id:e.variant_id}])).values()):undefined;
 return {...original,editing_mode:'raw_html',raw_html:frozen.html,...(registry?.length?{schema_version:'1.1',asset_registry:registry}:{})};
}
async function authority(tx:Tx,p:Principal,write=true){return assertCurrentAuthority(tx,p,write?'edit':'read',p.api_key?(write?'emails:write':'emails:read'):undefined);}
function command(base:number,key:string){z.number().int().positive().parse(base);z.string().min(1).max(200).parse(key);}
async function lockEmail(tx:Tx,p:Principal,id:string){await authority(tx,p);if(!(await tx.query('SELECT id FROM emails WHERE id=$1 FOR UPDATE',[z.uuid().parse(id)])).rowCount)fail(404,'RESOURCE_NOT_FOUND','Email not found.');await authority(tx,p);return getEmail(tx,id);}
function response(p:Principal,email:Awaited<ReturnType<typeof getEmail>>,base:number,key:string):SavedEmailResponse{
 const source=email.spec.editing_mode==='raw_html'?{profile:SourceProfileSchema.parse(email.raw_source_profile),...validateRawSource(email.spec.raw_html!)}:null;
 const updated:unknown=email.updated_at;
 return SavedEmailResponseSchema.parse({email:{id:email.id,title:email.title,doc_version:email.doc_version,spec:email.spec,raw_source_profile:email.raw_source_profile,updated_at:updated instanceof Date?updated.toISOString():String(updated),lineage:email.lineage},receipt:{receipt_version:1,workspace_id:p.workspace,email_id:email.id,request_base_version:base,saved_doc_version:email.doc_version,command_id:key,spec_hash:canonicalSpecHash(email.spec),source}});
}
async function replay<T>(tx:Tx,p:Principal,id:string,action:string,key:string,input:unknown,run:()=>Promise<T>){
 await authority(tx,p);await getEmail(tx,id);const value=await keyed(tx,p,action+':'+z.uuid().parse(id),key,input,run);await getEmail(tx,id);await authority(tx,p);return value;
}
export async function saveSourceDraft(tx:Tx,p:Principal,id:string,expectedVersion:number,spec:unknown,commandId:string):Promise<SavedEmailResponse>{
 command(expectedVersion,commandId);let canonical:string;try{validateSourceMetadata(spec);canonical=canonicalSpecString(spec);}catch(error){return sourceValueFailure(error);}
 const original=JSON.parse(canonical);
 const stored=await replay(tx,p,id,'email.source-save',commandId,{expected_version:expectedVersion,spec:canonical},async()=>{await lockEmail(tx,p,id);const saved=await saveDraft(tx,p,id,expectedVersion,original,{origin:'edit',commandId});await authority(tx,p);return compact(response(p,saved,expectedVersion,commandId));});
 // The original caller supplies the same canonical command. The durable receipt
 // was computed from the committed row, and must match before hydration. A newer
 // mutable head is never used to reconstruct the acknowledged old source.
 return hydrate(stored,original);
}
export async function importEmailSource(tx:Tx,p:Principal,id:string,expectedVersion:number,source:string,commandId:string):Promise<SavedEmailResponse>{
 command(expectedVersion,commandId);try{validateRawSource(source);}catch(error){return sourceValueFailure(error);}
 const stored=await replay(tx,p,id,'email.source-import',commandId,{expected_version:expectedVersion,source},async()=>{
  const email=await lockEmail(tx,p,id);if(email.doc_version!==expectedVersion)fail(412,'VERSION_MISMATCH','The draft changed before import.');
  const frozen=await checkpoint(tx,p,id,expectedVersion);const spec={...email.spec,editing_mode:'raw_html',raw_html:source};
  const saved=await saveDraft(tx,p,id,expectedVersion,spec,{origin:'import',revision:frozen.id,commandId});await authority(tx,p);const metadata:Record<string,unknown>={...saved.spec};delete metadata.raw_html;validateSourceMetadata(metadata);return {...compact(response(p,saved,expectedVersion,commandId)),metadata};
 });
 return hydrate(stored,{...stored.metadata,raw_html:source});
}
export async function forkEmailToRaw(tx:Tx,p:Principal,id:string,expectedVersion:number,expectedArtifactHash:string,commandId:string):Promise<SavedEmailResponse>{
 command(expectedVersion,commandId);z.string().regex(/^[a-f0-9]{64}$/).parse(expectedArtifactHash);
 const stored=await replay(tx,p,id,'email.source-fork',commandId,{expected_version:expectedVersion,artifact_hash:expectedArtifactHash},async()=>{
  const email=await lockEmail(tx,p,id);if(email.doc_version!==expectedVersion)fail(412,'VERSION_MISMATCH','The draft changed before raw fork.');if(email.spec.editing_mode!=='structured')fail(409,'STRUCTURED_MODE_REQUIRED','Only a structured draft can fork its generated source.');
  const frozen=await checkpoint(tx,p,id,expectedVersion);if(frozen.artifact_hash!==expectedArtifactHash)fail(409,'SOURCE_ARTIFACT_CHANGED','The current artifact differs. Review the current generated source.');
  if(frozen.manifest.raw_projection?.delivery_status==='unavailable')fail(409,'SOURCE_PROJECTION_UNAVAILABLE','Generated source is unavailable.');
  const spec=rawForkSpec(frozen.spec,frozen);
  const saved=await saveDraft(tx,p,id,expectedVersion,spec,{origin:'structured_fork',revision:frozen.id,commandId});await authority(tx,p);return {...compact(response(p,saved,expectedVersion,commandId)),source_revision:frozen.id as string};
 });
 const frozen=(await tx.query('SELECT spec,html,manifest,artifact_hash FROM revisions WHERE id=$1 AND email_id=$2',[stored.source_revision,id])).rows[0];
 if(!frozen||frozen.artifact_hash!==expectedArtifactHash)fail(409,'SOURCE_ARTIFACT_CHANGED','The immutable fork checkpoint is unavailable or does not match the original command.');
 return hydrate(stored,rawForkSpec(frozen.spec,frozen));
}
export async function downloadRevisionSource(tx:Tx,p:Principal,revisionId:string){
 await assertCurrentAuthority(tx,p,'edit',p.api_key?'emails:export':undefined);const row=(await tx.query('SELECT spec,raw_source_profile,revision_no FROM revisions WHERE id=$1',[z.uuid().parse(revisionId)])).rows[0];
 if(!row)fail(404,'RESOURCE_NOT_FOUND','Revision not found.');if(row.spec.editing_mode!=='raw_html')fail(409,'RAW_MODE_REQUIRED','This revision has no authored raw source.');
 const {sha256}=validateRawSource(row.spec.raw_html),bytes=Buffer.from(row.spec.raw_html,'utf8'),profile=SourceProfileSchema.parse(row.raw_source_profile);await assertCurrentAuthority(tx,p,'edit',p.api_key?'emails:export':undefined);return {bytes,sha256,profile,revision_no:row.revision_no as number};
}
