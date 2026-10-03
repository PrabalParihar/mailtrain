import {withPrincipal} from './auth';
import {assertCurrentAuthority} from './current-authority';
import {audit} from './audit';
import {fail} from './errors';
import {readJson,STRICT_JSON_TIMEOUT_MS} from './http';
import {DESTINATION_EXPORT_MESSAGES} from './esp-export-review';
import {compileHubSpotArtifact,hubspotReview} from '../domain/hubspot-export';
import {HUBSPOT_FOOTER_MESSAGES,HubSpotReviewInput,HubSpotArtifactInput} from '../domain/hubspot-footer-contracts';
import type {FrozenExportRevision} from '../domain/frozen-export-source';

const reviewChanged='These settings or the reviewed destination changed. Review HubSpot preparation again.';
export async function hubspotExportResponse(req:Request,id:string,command:'hubspot-review'|'hubspot-artifact',request_id:string):Promise<Response>{
 const {artifact,format}=await withPrincipal(req,'edit',async(tx,p)=>{
  await assertCurrentAuthority(tx,p,'edit','emails:export');
  if(new URL(req.url).searchParams.size)fail(422,'VALIDATION_FAILED','Use the explicit HubSpot JSON body without query parameters.');
  const cancelled=()=>{if(req.signal.aborted)fail(499,'EXPORT_CANCELLED','Destination preparation interrupted.');};
  cancelled();
  const row=(await tx.query('SELECT id,spec,html,plaintext,artifact_hash,manifest FROM revisions WHERE id=$1',[id])).rows[0] as FrozenExportRevision|undefined;
  if(!row)fail(404,'RESOURCE_NOT_FOUND','Revision not found.');
  cancelled();
  const body=await readJson(req,16*1024,{strict:true,timeoutMs:STRICT_JSON_TIMEOUT_MS});
  const input=(command==='hubspot-review'?HubSpotReviewInput:HubSpotArtifactInput).safeParse(body);
  if(!input.success)fail(409,'HUBSPOT_SETTINGS_INVALID',HUBSPOT_FOOTER_MESSAGES.HUBSPOT_SETTINGS_INVALID);
  cancelled();
  let artifact;
  try{artifact=await compileHubSpotArtifact(row,input.data.settings);}catch(error){
   const message=error instanceof Error?error.message:'';
   if(Object.hasOwn(HUBSPOT_FOOTER_MESSAGES,message)){
    const code=message as keyof typeof HUBSPOT_FOOTER_MESSAGES;
    fail(409,code,HUBSPOT_FOOTER_MESSAGES[code]);
   }
   const code=Object.hasOwn(DESTINATION_EXPORT_MESSAGES,message)?message:'EXPORT_SOURCE_INTEGRITY';
   fail(code==='EXPORT_SOURCE_LIMIT'?413:409,code,DESTINATION_EXPORT_MESSAGES[code]);
  }
  cancelled();
  if('expected_destination_hash' in input.data&&input.data.expected_destination_hash!==artifact.destination_hash)
   fail(409,'HUBSPOT_REVIEW_CHANGED',reviewChanged);
  await audit(tx,p.workspace,p.user,command==='hubspot-review'?'revision.destination_reviewed':'revision.destination_downloaded',id);
  return {artifact,format:'format' in input.data?input.data.format:'html'};
 });
 const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','X-Request-Id':request_id};
 if(command==='hubspot-review')return Response.json({request_id,review:hubspotReview(artifact)},{headers});
 return new Response(format==='html'?artifact.html:artifact.text,{headers:{
  ...headers,
  'Content-Type':format==='html'?'text/html; charset=utf-8':'text/plain; charset=utf-8',
  'Content-Disposition':`attachment; filename="hubspot-prepared-${artifact.revision_id}.${format}"`,
  'Content-Security-Policy':"sandbox; default-src 'none'",
  'X-Artifact-Hash':artifact.destination_hash,
  'X-Source-Artifact-Hash':artifact.source_artifact_hash,
  'X-Content-SHA256':format==='html'?artifact.html_sha256:artifact.text_sha256,
  'X-Destination-Mapping':artifact.mapping_version,
  'X-Remote-Export-Enabled':'false',
  'X-Mailcraft-Notice':'Locally prepared HubSpot content. Account settings, native destination and real-client conformance are unverified. No remote export is enabled.',
 }});
}
