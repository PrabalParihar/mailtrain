import {createHash} from 'node:crypto';
import {validateFrozenExportSource,type FrozenExportRevision} from './frozen-export-source';
export type {FrozenExportRevision} from './frozen-export-source';

import{KLAVIYO_API_REVISION,KLAVIYO_MAPPING_VERSION,KlaviyoReview}from'./esp-export-contracts';
export{KLAVIYO_API_REVISION,KLAVIYO_MAPPING_VERSION,KlaviyoReview}from'./esp-export-contracts';
const MAX_CONTENT=2*1024*1024;
export type KlaviyoArtifact={destination:'klaviyo';mapping_version:typeof KLAVIYO_MAPPING_VERSION;api_revision:typeof KLAVIYO_API_REVISION;revision_id:string;source_artifact_hash:string;destination_hash:string;html_sha256:string;text_sha256:string;html:string;text:string;remote_export_enabled:false;transformations:string[]};
export function klaviyoReview(a:KlaviyoArtifact):KlaviyoReview{const{html: _html,text: _text,...metadata}=a;void _html;void _text;return KlaviyoReview.parse({...metadata,blockers:['OAUTH_CONNECTION_UNAVAILABLE','ACCOUNT_ENTITLEMENT_UNVERIFIED','REAL_CLIENT_PREFLIGHT_UNAVAILABLE','DESTINATION_CONFORMANCE_UNVERIFIED','DURABLE_REMOTE_EXPORT_UNAVAILABLE']});}
export async function compileKlaviyoArtifact(r:FrozenExportRevision):Promise<KlaviyoArtifact>{
 const {footerCount}=await validateFrozenExportSource(r);
 const withoutSlot=(r.html+'\n'+r.plaintext).replaceAll('{{UNSUBSCRIBE_URL}}','');
 if(/\{\{|\}\}|\{%|%\}/.test(withoutSlot))throw new Error('EXPORT_TOKEN_UNSUPPORTED');
 if(r.html.split('{{UNSUBSCRIBE_URL}}').length-1!==footerCount||r.plaintext.split('{{UNSUBSCRIBE_URL}}').length-1!==footerCount)throw new Error('EXPORT_TOKEN_UNSUPPORTED');
 if(r.html.split('href="{{UNSUBSCRIBE_URL}}"').length-1!==footerCount||!r.plaintext.includes('{{UNSUBSCRIBE_URL}}'))throw new Error('EXPORT_FOOTER_REQUIRED');
 const html=r.html.replaceAll('{{UNSUBSCRIBE_URL}}','{% unsubscribe_link %}'),text=r.plaintext.replaceAll('{{UNSUBSCRIBE_URL}}','{% unsubscribe_link %}');
 if(Buffer.byteLength(html)>MAX_CONTENT||Buffer.byteLength(text)>MAX_CONTENT)throw new Error('EXPORT_SOURCE_LIMIT');
 const destination_hash=createHash('sha256').update(JSON.stringify([KLAVIYO_MAPPING_VERSION,KLAVIYO_API_REVISION,r.artifact_hash,html,text])).digest('hex');
 return{destination:'klaviyo',mapping_version:KLAVIYO_MAPPING_VERSION,api_revision:KLAVIYO_API_REVISION,revision_id:r.id,source_artifact_hash:r.artifact_hash,destination_hash,html_sha256:createHash('sha256').update(html).digest('hex'),text_sha256:createHash('sha256').update(text).digest('hex'),html,text,remote_export_enabled:false,transformations:['Canonical unsubscribe URL slot mapped to Klaviyo unsubscribe_link. Other frozen content is unchanged.']};
}
