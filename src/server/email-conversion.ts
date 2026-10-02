import{assetReferences,resolveAssetManifest}from'./assets';
import {z}from'zod';
import {ConversionProposalInput,ConversionAcceptInput,conversionProposal}from'../domain/email-conversion';
import {type EmailSpec}from'../domain/email';
import {EmailSourceSpecSchema}from'../domain/email-schema';
import {withPrincipal,type Principal}from'./auth';
import type{Tx}from'./db';
import {assertCurrentAuthority}from'./current-authority';
import {getEmail,checkpoint,saveDraft}from'./emails';
import {keyed}from'./commands';
import {audit}from'./audit';
import {fail}from'./errors';
async function authority(tx:Tx,p:Principal){return assertCurrentAuthority(tx,p,'edit',p.api_key?'emails:write':undefined);}
function savedView(row:{id:string;title:string;doc_version:number;spec:EmailSpec;updated_at?:unknown}){
 return {id:row.id,title:row.title,doc_version:row.doc_version,spec:EmailSourceSpecSchema.parse(row.spec),updated_at:row.updated_at instanceof Date?row.updated_at.toISOString():String(row.updated_at)};
}
async function lockedEmail(tx:Tx,p:Principal,id:string,lock:'SHARE'|'UPDATE'){
 const row=await tx.query('SELECT id FROM emails WHERE id=$1 FOR '+lock,[z.uuid().parse(id)]);
 await authority(tx,p);if(!row.rowCount)fail(404,'RESOURCE_NOT_FOUND','Email not found.');return getEmail(tx,id);
}
export async function prepareEmailConversion(tx:Tx,p:Principal,id:string,value:unknown){
 const input=ConversionProposalInput.parse(value);await authority(tx,p);const email=await lockedEmail(tx,p,id,'SHARE');
 if(email.doc_version!==input.expected_version)fail(412,'VERSION_MISMATCH','Save or reload the current raw draft before reviewing conversion.');
 if(email.spec.editing_mode!=='raw_html')fail(409,'RAW_MODE_REQUIRED','Only a raw HTML draft can create a block conversion proposal.');
 const proposal=await conversionProposal(email.spec,email.doc_version,assetReferences(email.spec).length?await resolveAssetManifest(tx,p,email.spec,'revision'):undefined,email.raw_source_profile??'exact-utf8-1');await authority(tx,p);return proposal;
}
export async function acceptEmailConversion(tx:Tx,p:Principal,id:string,value:unknown,key:string|null){
 const input=ConversionAcceptInput.parse(value);await authority(tx,p);
 const response=await keyed(tx,p,'email.convert-to-blocks:'+z.uuid().parse(id),key,input,async()=>{
  await authority(tx,p);const email=await lockedEmail(tx,p,id,'UPDATE');
  if(email.doc_version!==input.expected_version)fail(412,'VERSION_MISMATCH','The raw draft changed. Review a new proposal; your source remains intact.');
  if(email.spec.editing_mode!=='raw_html')fail(409,'RAW_MODE_REQUIRED','The draft is already in structured mode. Reload its current saved head.');
  const proposal=await conversionProposal(email.spec,email.doc_version,assetReferences(email.spec).length?await resolveAssetManifest(tx,p,email.spec,'revision'):undefined,email.raw_source_profile??'exact-utf8-1');await authority(tx,p);
  if(proposal.source_hash!==input.source_hash||proposal.proposal_hash!==input.proposal_hash)fail(409,'CONVERSION_SOURCE_CHANGED','The conversion source or policy changed. Review the current raw draft before accepting.');
  if(proposal.status!=='available'||!proposal.spec)fail(409,'CONVERSION_UNSUPPORTED','This source cannot be converted safely. Keep editing the original raw HTML.');
  await checkpoint(tx,p,id,email.doc_version);await authority(tx,p);
  const saved=await saveDraft(tx,p,id,email.doc_version,proposal.spec);await authority(tx,p);
  await checkpoint(tx,p,id,saved.doc_version);await authority(tx,p);
  await audit(tx,p.workspace,p.user,'email.conversion_accepted',id);return {email:savedView(saved)};
 });
 await getEmail(tx,id);await authority(tx,p);return response;
}
export async function emailConversionRoute(req:Request,id:string,command:string,value:unknown,key:string|null){
 if(new URL(req.url).searchParams.size)fail(422,'VALIDATION_FAILED','Conversion commands accept no query parameters.');
 return withPrincipal(req,'edit',async(tx,p)=>{
  const expectedActor=req.headers.get('x-actor-id');if(expectedActor!==null){z.string().min(1).parse(expectedActor);if(expectedActor!==p.user)fail(409,'ACTOR_CHANGED','Your signed-in account changed. Reload before recovering conversion.');}
  if(command==='conversion-proposal')return {proposal:await prepareEmailConversion(tx,p,id,value)};
  const input=ConversionAcceptInput.parse(value),header=req.headers.get('if-match');
  if(header!==String(input.expected_version)&&header!=='"draft-'+input.expected_version+'"'&&header!=='"'+input.expected_version+'"')fail(428,'VERSION_REQUIRED','Supply If-Match matching the original command expected_version.');
  return acceptEmailConversion(tx,p,id,input,key);
 });
}
