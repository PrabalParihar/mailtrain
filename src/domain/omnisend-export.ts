import {createHash} from 'node:crypto';
import {validateFrozenExportSource,type FrozenExportRevision} from './frozen-export-source';
import {OMNISEND_API_REVISION,OMNISEND_MAPPING_VERSION,OMNISEND_IMPORT_BODY_LIMIT,OmnisendReview} from './omnisend-export-contracts';
export {OMNISEND_API_REVISION,OMNISEND_MAPPING_VERSION,OMNISEND_IMPORT_BODY_LIMIT,OmnisendReview} from './omnisend-export-contracts';

export type OmnisendArtifact={destination:'omnisend';mapping_version:typeof OMNISEND_MAPPING_VERSION;api_revision:typeof OMNISEND_API_REVISION;revision_id:string;source_artifact_hash:string;destination_hash:string;html_sha256:string;text_sha256:string;html:string;text:string;remote_export_enabled:false;transformations:string[]};
export function omnisendReview(a:OmnisendArtifact):OmnisendReview{
 const {html:_html,text:_text,...metadata}=a;void _html;void _text;
 return OmnisendReview.parse({...metadata,blockers:['OAUTH_CONNECTION_UNAVAILABLE','ACCOUNT_ENTITLEMENT_UNVERIFIED','REAL_CLIENT_PREFLIGHT_UNAVAILABLE','DESTINATION_CONFORMANCE_UNVERIFIED','DURABLE_REMOTE_EXPORT_UNAVAILABLE','IMPORT_FIDELITY_UNVERIFIED','MANAGEMENT_LINK_UNVERIFIED']});
}
export async function compileOmnisendArtifact(r:FrozenExportRevision):Promise<OmnisendArtifact>{
 const {footerCount}=await validateFrozenExportSource(r);
 const withoutSlot=(r.html+'\n'+r.plaintext).replaceAll('{{UNSUBSCRIBE_URL}}','');
 if(/\{\{|\}\}|\{%|%\}|\*\||\|\*|\[\[|\]\]|\[%|%\]/.test(withoutSlot))throw new Error('EXPORT_TOKEN_UNSUPPORTED');
 if(r.html.split('{{UNSUBSCRIBE_URL}}').length-1!==footerCount||r.plaintext.split('{{UNSUBSCRIBE_URL}}').length-1!==footerCount)throw new Error('EXPORT_TOKEN_UNSUPPORTED');
 if(r.html.split('href="{{UNSUBSCRIBE_URL}}"').length-1!==footerCount||!r.plaintext.includes('{{UNSUBSCRIBE_URL}}'))throw new Error('EXPORT_FOOTER_REQUIRED');
 const html=r.html.replaceAll('{{UNSUBSCRIBE_URL}}','[[unsubscribe_link]]'),text=r.plaintext.replaceAll('{{UNSUBSCRIBE_URL}}','[[unsubscribe_link]]');
 // U+FFFF consumes three UTF-8 bytes per well-formed UTF-16 unit: a
 // conservative reserve for every allowed 255-unit name in the final JSON.
 const reservedBody=JSON.stringify({name:'\uffff'.repeat(255),html});
 if(Buffer.byteLength(reservedBody,'utf8')>OMNISEND_IMPORT_BODY_LIMIT||Buffer.byteLength(text,'utf8')>OMNISEND_IMPORT_BODY_LIMIT)throw new Error('EXPORT_SOURCE_LIMIT');
 const destination_hash=createHash('sha256').update(JSON.stringify([OMNISEND_MAPPING_VERSION,OMNISEND_API_REVISION,r.artifact_hash,html,text]),'utf8').digest('hex');
 return{destination:'omnisend',mapping_version:OMNISEND_MAPPING_VERSION,api_revision:OMNISEND_API_REVISION,revision_id:r.id,source_artifact_hash:r.artifact_hash,destination_hash,html_sha256:createHash('sha256').update(html,'utf8').digest('hex'),text_sha256:createHash('sha256').update(text,'utf8').digest('hex'),html,text,remote_export_enabled:false,transformations:['Canonical unsubscribe URL slot mapped to Omnisend [[unsubscribe_link]]. Other frozen content is unchanged.']};
}
