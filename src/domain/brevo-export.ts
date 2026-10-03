import {createHash} from 'node:crypto';
import {lintEmail} from './email';
import {validateFrozenExportSource,type FrozenExportRevision} from './frozen-export-source';
import {BREVO_API_REVISION,BREVO_MAPPING_VERSION,BREVO_HTML_LIMIT,BrevoReview} from './brevo-export-contracts';
export {BREVO_API_REVISION,BREVO_MAPPING_VERSION,BREVO_HTML_LIMIT,BrevoReview} from './brevo-export-contracts';

export type BrevoArtifact={
 destination:'brevo';
 mapping_version:typeof BREVO_MAPPING_VERSION;
 api_revision:typeof BREVO_API_REVISION;
 revision_id:string;
 source_artifact_hash:string;
 destination_hash:string;
 html_sha256:string;
 text_sha256:string;
 subject:string;
 html:string;
 text:string;
 remote_export_enabled:false;
 transformations:string[];
};

export function brevoReview(a:BrevoArtifact):BrevoReview{
 const {html:_html,text:_text,subject:_subject,...metadata}=a;
 void _html;void _text;void _subject;
 return BrevoReview.parse({...metadata,blockers:[
  'CONNECTION_AUTH_MODE_UNAPPROVED',
  'ACCOUNT_ENTITLEMENT_UNVERIFIED',
  'SENDER_UNVERIFIED',
  'REAL_CLIENT_PREFLIGHT_UNAVAILABLE',
  'DESTINATION_CONFORMANCE_UNVERIFIED',
  'DURABLE_REMOTE_EXPORT_UNAVAILABLE',
  'MANAGEMENT_LINK_UNVERIFIED',
 ]});
}

export async function compileBrevoArtifact(r:FrozenExportRevision):Promise<BrevoArtifact>{
 let footerCount:number;
 try{
  ({footerCount}=await validateFrozenExportSource(r));
 }catch(error){
  // Preserve frozen-source precedence. Only the sole existing subject finding
  // receives Brevo's more specific code; no source validation is bypassed.
  if(error instanceof Error&&error.message==='EXPORT_STATIC_BLOCKED'){
   const blocking=lintEmail(r.spec,[],{html:r.html}).filter(f=>f.severity==='blocking');
   if(blocking.length&&blocking.every(f=>f.code==='SUBJECT_REQUIRED'))throw new Error('EXPORT_SUBJECT_REQUIRED');
  }
  throw error;
 }
 const subject=r.spec.subject;
 if(!subject.trim())throw new Error('EXPORT_SUBJECT_REQUIRED');
 if(subject.length>200||!subject.isWellFormed()||/[\u0000-\u001f\u007f-\u009f]/.test(subject))throw new Error('EXPORT_SUBJECT_UNSUPPORTED');
 const withoutSlot=(r.html+'\n'+r.plaintext).replaceAll('{{UNSUBSCRIBE_URL}}','');
 if(/\{\{|\}\}|\{%|%\}|\*\||\|\*|\[\[|\]\]|\[%|%\]/.test(withoutSlot))throw new Error('EXPORT_TOKEN_UNSUPPORTED');
 if(r.html.split('{{UNSUBSCRIBE_URL}}').length-1!==footerCount||r.plaintext.split('{{UNSUBSCRIBE_URL}}').length-1!==footerCount)throw new Error('EXPORT_TOKEN_UNSUPPORTED');
 if(r.html.split('href="{{UNSUBSCRIBE_URL}}"').length-1!==footerCount||!r.plaintext.includes('{{UNSUBSCRIBE_URL}}'))throw new Error('EXPORT_FOOTER_REQUIRED');
 const html=r.html.replaceAll('{{UNSUBSCRIBE_URL}}','{{ unsubscribe }}'),text=r.plaintext.replaceAll('{{UNSUBSCRIBE_URL}}','{{ unsubscribe }}');
 // Brevo's exclusive decimal limit applies to the HTML field, not total JSON.
 if(html.length<=10||Buffer.byteLength(html,'utf8')>=BREVO_HTML_LIMIT||Buffer.byteLength(text,'utf8')>=BREVO_HTML_LIMIT)throw new Error('EXPORT_SOURCE_LIMIT');
 const sha256=(value:string)=>createHash('sha256').update(value,'utf8').digest('hex');
 return{
  destination:'brevo',mapping_version:BREVO_MAPPING_VERSION,api_revision:BREVO_API_REVISION,
  revision_id:r.id,source_artifact_hash:r.artifact_hash,
  destination_hash:sha256(JSON.stringify([BREVO_MAPPING_VERSION,BREVO_API_REVISION,r.artifact_hash,subject,html,text])),
  html_sha256:sha256(html),text_sha256:sha256(text),subject,html,text,remote_export_enabled:false,
  transformations:['Canonical unsubscribe URL slot mapped to Brevo {{ unsubscribe }}. Other frozen content is unchanged.'],
 };
}
