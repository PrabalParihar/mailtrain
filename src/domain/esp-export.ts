import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import {z} from 'zod';
import {compileEmail,lintEmail,type EmailSpec} from './email';

import{KLAVIYO_API_REVISION,KLAVIYO_MAPPING_VERSION,KlaviyoReview}from'./esp-export-contracts';
export{KLAVIYO_API_REVISION,KLAVIYO_MAPPING_VERSION,KlaviyoReview}from'./esp-export-contracts';
const MAX_CONTENT=2*1024*1024;
export type FrozenExportRevision={id:string;html:string;plaintext:string;artifact_hash:string;manifest:Record<string,unknown>;spec:EmailSpec};
export type KlaviyoArtifact={destination:'klaviyo';mapping_version:typeof KLAVIYO_MAPPING_VERSION;api_revision:typeof KLAVIYO_API_REVISION;revision_id:string;source_artifact_hash:string;destination_hash:string;html_sha256:string;text_sha256:string;html:string;text:string;remote_export_enabled:false;transformations:string[]};
export function klaviyoReview(a:KlaviyoArtifact):KlaviyoReview{const{html: _html,text: _text,...metadata}=a;void _html;void _text;return KlaviyoReview.parse({...metadata,blockers:['OAUTH_CONNECTION_UNAVAILABLE','ACCOUNT_ENTITLEMENT_UNVERIFIED','REAL_CLIENT_PREFLIGHT_UNAVAILABLE','DESTINATION_CONFORMANCE_UNVERIFIED','DURABLE_REMOTE_EXPORT_UNAVAILABLE']});}
export async function compileKlaviyoArtifact(r:FrozenExportRevision):Promise<KlaviyoArtifact>{
 if(typeof r.html!=='string'||typeof r.plaintext!=='string'||Buffer.byteLength(r.html)>MAX_CONTENT||Buffer.byteLength(r.plaintext)>MAX_CONTENT)throw new Error('EXPORT_SOURCE_LIMIT');
 if(!z.uuid().safeParse(r.id).success||!/^([a-f0-9]{64})$/.test(r.artifact_hash))throw new Error('EXPORT_SOURCE_INTEGRITY');
 const nodes=r.spec.sections.flatMap(b=>b.type==='columns'?b.columns.flat():[b]);
 if(r.spec.editing_mode==='raw_html'||nodes.some(b=>b.type==='custom_html'))throw new Error('EXPORT_SOURCE_UNSUPPORTED');
 const manifestAssets=r.manifest.assets as {entries?:unknown[]}|undefined;
 if(manifestAssets?.entries?.length||nodes.some(b=>b.type==='image'&&b.asset_ref)||/mailcraft-assets\.invalid/i.test(r.html))throw new Error('EXPORT_ASSET_UNPUBLISHED');
 const footer=nodes.filter(b=>b.type==='legal_footer');
 if(!footer.length||footer.some(b=>b.type==='legal_footer'&&(!b.identity.trim()||!b.address.trim())))throw new Error('EXPORT_FOOTER_REQUIRED');
 // Recompile through the versioned compiler; JSONB object ordering cannot validate
 // the old hash by JSON.stringify(stored manifest). Older compiler artifacts
 // intentionally refuse until a new immutable checkpoint is explicitly selected.
 const compiled=await compileEmail(r.spec);
 // Deep comparison ignores object key order at every level, while preserving
 // array order, values, and the presence of every stored manifest field.
 if(compiled.hash!==r.artifact_hash||compiled.html!==r.html||compiled.text!==r.plaintext||!isDeepStrictEqual(r.manifest,compiled.manifest))throw new Error('EXPORT_SOURCE_INTEGRITY');
 if(lintEmail(r.spec,[],{html:r.html}).some(f=>f.severity==='blocking'))throw new Error('EXPORT_STATIC_BLOCKED');
 const withoutSlot=(r.html+'\n'+r.plaintext).replaceAll('{{UNSUBSCRIBE_URL}}','');
 if(/\{\{|\}\}|\{%|%\}/.test(withoutSlot))throw new Error('EXPORT_TOKEN_UNSUPPORTED');
 if(r.html.split('{{UNSUBSCRIBE_URL}}').length-1!==footer.length||r.plaintext.split('{{UNSUBSCRIBE_URL}}').length-1!==footer.length)throw new Error('EXPORT_TOKEN_UNSUPPORTED');
 if(r.html.split('href="{{UNSUBSCRIBE_URL}}"').length-1!==footer.length||!r.plaintext.includes('{{UNSUBSCRIBE_URL}}'))throw new Error('EXPORT_FOOTER_REQUIRED');
 const html=r.html.replaceAll('{{UNSUBSCRIBE_URL}}','{% unsubscribe_link %}'),text=r.plaintext.replaceAll('{{UNSUBSCRIBE_URL}}','{% unsubscribe_link %}');
 if(Buffer.byteLength(html)>MAX_CONTENT||Buffer.byteLength(text)>MAX_CONTENT)throw new Error('EXPORT_SOURCE_LIMIT');
 const destination_hash=createHash('sha256').update(JSON.stringify([KLAVIYO_MAPPING_VERSION,KLAVIYO_API_REVISION,r.artifact_hash,html,text])).digest('hex');
 return{destination:'klaviyo',mapping_version:KLAVIYO_MAPPING_VERSION,api_revision:KLAVIYO_API_REVISION,revision_id:r.id,source_artifact_hash:r.artifact_hash,destination_hash,html_sha256:createHash('sha256').update(html).digest('hex'),text_sha256:createHash('sha256').update(text).digest('hex'),html,text,remote_export_enabled:false,transformations:['Canonical unsubscribe URL slot mapped to Klaviyo unsubscribe_link. Other frozen content is unchanged.']};
}
