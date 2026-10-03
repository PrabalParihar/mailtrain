import{withPrincipal}from'./auth';import{assertCurrentAuthority}from'./current-authority';import{audit}from'./audit';import{fail}from'./errors';
import{compileKlaviyoArtifact,klaviyoReview,type FrozenExportRevision}from'../domain/esp-export';
import{compileMailchimpArtifact,mailchimpReview}from'../domain/mailchimp-export';
import{compileOmnisendArtifact,omnisendReview}from'../domain/omnisend-export';
import{compileBrevoArtifact,brevoReview}from'../domain/brevo-export';
const messages:Record<string,string>={
 EXPORT_SUBJECT_REQUIRED:'Add a subject to the frozen version before preparing a Brevo draft.',
 EXPORT_SUBJECT_UNSUPPORTED:'The frozen subject contains characters unsupported by this destination. Update it and save a new version.',
 EXPORT_STATIC_BLOCKED:'Blocking static content checks need correction. Use Review and check to inspect the frozen findings.',
 EXPORT_SOURCE_LIMIT:'The frozen source exceeds the bounded destination preparation budget.',
 EXPORT_SOURCE_INTEGRITY:'This frozen artifact does not match its compiler/source. Freeze and review a current revision; the original remains preserved.',
 EXPORT_SOURCE_UNSUPPORTED:'This mapping supports structured blocks. Raw or custom HTML is preserved; use its original source download until destination fidelity is qualified.',
 EXPORT_ASSET_UNPUBLISHED:'Private or registered images cannot be mapped to this destination until public immutable asset delivery is qualified. Your original images remain unchanged.',
 EXPORT_FOOTER_REQUIRED:'Add the sender identity and postal address in a legal footer before preparing this destination.',
 EXPORT_TOKEN_UNSUPPORTED:'Unresolved or unsupported template syntax requires an explicit destination mapping. The original content is preserved.',
};
export const DESTINATION_EXPORT_MESSAGES = messages;
export async function destinationReviewResponse(req:Request,id:string,command:'destination-review'|'destination-artifact',request_id:string):Promise<Response>{
 const artifact=await withPrincipal(req,'edit',async(tx,p)=>{
  await assertCurrentAuthority(tx,p,'edit','emails:export');
  const url=new URL(req.url),allowed=command==='destination-artifact'?['destination','format']:['destination'];
  for(const name of url.searchParams.keys())if(!allowed.includes(name)||url.searchParams.getAll(name).length!==1)fail(422,'VALIDATION_FAILED','Use one explicit destination and a supported download format.');
  const destination=url.searchParams.get('destination');if(destination!=='klaviyo'&&destination!=='mailchimp'&&destination!=='omnisend'&&destination!=='brevo')fail(422,'VALIDATION_FAILED','Choose a locally implemented Klaviyo, Mailchimp Classic, Omnisend HTML-import or Brevo marketing-draft mapping. Other required adapters remain unavailable.');
  const format=url.searchParams.get('format')??'html';if(!['html','txt'].includes(format))fail(422,'VALIDATION_FAILED','Choose HTML or plaintext.');
  const row=(await tx.query('SELECT id,spec,html,plaintext,artifact_hash,manifest FROM revisions WHERE id=$1',[id])).rows[0] as FrozenExportRevision|undefined;
  if(!row)fail(404,'RESOURCE_NOT_FOUND','Revision not found.');
  if(req.signal.aborted)fail(499,'EXPORT_CANCELLED','Destination preparation interrupted.');
  let prepared;try{prepared=destination==='klaviyo'?await compileKlaviyoArtifact(row):destination==='mailchimp'?await compileMailchimpArtifact(row):destination==='omnisend'?await compileOmnisendArtifact(row):await compileBrevoArtifact(row);}catch(error){const code=error instanceof Error&&Object.hasOwn(messages,error.message)?error.message:'EXPORT_SOURCE_INTEGRITY';fail(code==='EXPORT_SOURCE_LIMIT'?413:409,code,messages[code]);}
  if(req.signal.aborted)fail(499,'EXPORT_CANCELLED','Destination preparation interrupted.');
  await audit(tx,p.workspace,p.user,command==='destination-review'?'revision.destination_reviewed':'revision.destination_downloaded',id);
  return prepared;
 });
 const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','X-Request-Id':request_id};
 if(command==='destination-review')return Response.json({request_id,review:artifact.destination==='klaviyo'?klaviyoReview(artifact):artifact.destination==='mailchimp'?mailchimpReview(artifact):artifact.destination==='omnisend'?omnisendReview(artifact):brevoReview(artifact)},{headers});
 const format=new URL(req.url).searchParams.get('format')??'html';
 return new Response(format==='html'?artifact.html:artifact.text,{headers:{...headers,'Content-Type':format==='html'?'text/html; charset=utf-8':'text/plain; charset=utf-8','Content-Disposition':`attachment; filename="${artifact.destination}-prepared-${artifact.revision_id}.${format}"`,'Content-Security-Policy':"sandbox; default-src 'none'",'X-Artifact-Hash':artifact.destination_hash,'X-Source-Artifact-Hash':artifact.source_artifact_hash,'X-Content-SHA256':format==='html'?artifact.html_sha256:artifact.text_sha256,'X-Destination-Mapping':artifact.mapping_version,'X-Remote-Export-Enabled':'false','X-Mailcraft-Notice':`Locally prepared ${artifact.destination} content. No remote export, live destination or real-client conformance is verified.`}});
}
