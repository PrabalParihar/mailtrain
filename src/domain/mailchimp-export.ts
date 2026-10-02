import {createHash} from 'node:crypto';
import {validateFrozenExportSource,type FrozenExportRevision} from './frozen-export-source';
import {MAILCHIMP_API_REVISION,MAILCHIMP_MAPPING_VERSION,MailchimpReview} from './mailchimp-export-contracts';
export {MAILCHIMP_API_REVISION,MAILCHIMP_MAPPING_VERSION,MailchimpReview} from './mailchimp-export-contracts';

const MAX_CONTENT=2*1024*1024;
export type MailchimpArtifact={destination:'mailchimp';mapping_version:typeof MAILCHIMP_MAPPING_VERSION;api_revision:typeof MAILCHIMP_API_REVISION;revision_id:string;source_artifact_hash:string;destination_hash:string;html_sha256:string;text_sha256:string;html:string;text:string;remote_export_enabled:false;transformations:string[]};
export function mailchimpReview(a:MailchimpArtifact):MailchimpReview{
 const {html:_html,text:_text,...metadata}=a;void _html;void _text;
 return MailchimpReview.parse({...metadata,blockers:['OAUTH_CONNECTION_UNAVAILABLE','STANDARD_OR_HIGHER_UNVERIFIED','REAL_CLIENT_PREFLIGHT_UNAVAILABLE','DESTINATION_CONFORMANCE_UNVERIFIED','DURABLE_REMOTE_EXPORT_UNAVAILABLE','TEMPLATE_HTML_READBACK_UNAVAILABLE','MANAGEMENT_LINK_UNVERIFIED']});
}
export async function compileMailchimpArtifact(r:FrozenExportRevision):Promise<MailchimpArtifact>{
 const {footerCount}=await validateFrozenExportSource(r);
 const withoutSlot=(r.html+'\n'+r.plaintext).replaceAll('{{UNSUBSCRIBE_URL}}','');
 if(/\{\{|\}\}|\{%|%\}|\*\||\|\*|\[\[|\]\]/.test(withoutSlot))throw new Error('EXPORT_TOKEN_UNSUPPORTED');
 if(r.html.split('{{UNSUBSCRIBE_URL}}').length-1!==footerCount||r.plaintext.split('{{UNSUBSCRIBE_URL}}').length-1!==footerCount)throw new Error('EXPORT_TOKEN_UNSUPPORTED');
 if(r.html.split('href="{{UNSUBSCRIBE_URL}}"').length-1!==footerCount||!r.plaintext.includes('{{UNSUBSCRIBE_URL}}'))throw new Error('EXPORT_FOOTER_REQUIRED');
 const html=r.html.replaceAll('{{UNSUBSCRIBE_URL}}','*|UNSUB|*'),text=r.plaintext.replaceAll('{{UNSUBSCRIBE_URL}}','*|UNSUB|*');
 if(Buffer.byteLength(html)>MAX_CONTENT||Buffer.byteLength(text)>MAX_CONTENT)throw new Error('EXPORT_SOURCE_LIMIT');
 const destination_hash=createHash('sha256').update(JSON.stringify([MAILCHIMP_MAPPING_VERSION,MAILCHIMP_API_REVISION,r.artifact_hash,html,text]),'utf8').digest('hex');
 return{destination:'mailchimp',mapping_version:MAILCHIMP_MAPPING_VERSION,api_revision:MAILCHIMP_API_REVISION,revision_id:r.id,source_artifact_hash:r.artifact_hash,destination_hash,html_sha256:createHash('sha256').update(html,'utf8').digest('hex'),text_sha256:createHash('sha256').update(text,'utf8').digest('hex'),html,text,remote_export_enabled:false,transformations:['Canonical unsubscribe URL slot mapped to Mailchimp *|UNSUB|*. Other frozen content is unchanged.']};
}
