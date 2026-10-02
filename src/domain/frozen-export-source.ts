import {isDeepStrictEqual} from 'node:util';
import {z} from 'zod';
import {compileEmail,lintEmail,type EmailSpec} from './email';

// Server compiler validation. Browser consumers import destination contracts only.
const MAX_CONTENT=2*1024*1024;
export type FrozenExportRevision={id:string;html:string;plaintext:string;artifact_hash:string;manifest:Record<string,unknown>;spec:EmailSpec};

export async function validateFrozenExportSource(r:FrozenExportRevision):Promise<{footerCount:number}>{
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
 return{footerCount:footer.length};
}
