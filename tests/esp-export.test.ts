import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {blankSpec,compileEmail} from '../src/domain/email';
import {compileKlaviyoArtifact,type FrozenExportRevision} from '../src/domain/esp-export';
async function revision(change?:(s:ReturnType<typeof blankSpec>)=>void):Promise<FrozenExportRevision>{
 const spec=blankSpec(randomUUID(),'Fixture'); spec.subject='Fixture subject';
 spec.sections=spec.sections.map(b=>b.type==='legal_footer'?{...b,address:'123 Fixture Road'}:b.type==='button'?{...b,href:'https://example.org/offer'}:b);
 change?.(spec);const a=await compileEmail(spec);return{id:randomUUID(),html:a.html,plaintext:a.text,artifact_hash:a.hash,manifest:a.manifest,spec};
}
test('frozen native unsubscribe mapping changes only documented slot and binds hashes',async()=>{
 const r=await revision(),before=JSON.stringify(r),a=await compileKlaviyoArtifact(r);
 assert.equal(a.mapping_version,'klaviyo-html-1');assert.equal(a.html,r.html.replaceAll('{{UNSUBSCRIBE_URL}}','{% unsubscribe_link %}'));assert.equal(a.text,r.plaintext.replaceAll('{{UNSUBSCRIBE_URL}}','{% unsubscribe_link %}'));
 assert.equal(a.source_artifact_hash,r.artifact_hash);assert.equal(a.remote_export_enabled,false);assert.equal(JSON.stringify(r),before);assert.match(a.destination_hash,/^[a-f0-9]{64}$/);
});
test('corruption or mismatched revision spec refuses preparation',async()=>{
 const r=await revision();await assert.rejects(()=>compileKlaviyoArtifact({...r,html:r.html+'x'}),/EXPORT_SOURCE_INTEGRITY/);
 await assert.rejects(()=>compileKlaviyoArtifact({...r,spec:{...r.spec,subject:'Changed'}}),/EXPORT_SOURCE_INTEGRITY/);
});
test('unknown personalization and raw/custom source remain preserved and refuse mapping',async()=>{
 for(const kind of ['merge','raw','custom']as const){const r=await revision(s=>{if(kind==='merge')s.sections[0]={id:'m',type:'text',text:'Hello {{FIRST_NAME}}'};if(kind==='raw'){s.editing_mode='raw_html';s.raw_html='<p>Exact source</p>';}if(kind==='custom')s.sections.push({id:'custom',type:'custom_html',html:'<p>Opaque</p>'});});const before=JSON.stringify(r);await assert.rejects(()=>compileKlaviyoArtifact(r),/EXPORT_(TOKEN_UNSUPPORTED|SOURCE_UNSUPPORTED)/);assert.equal(JSON.stringify(r),before);}
});
test('missing legal identity/address/footer and bounded source refuse preparation',async()=>{
 for(const kind of ['identity','address','footer']as const){const r=await revision(s=>{s.sections=s.sections.filter(b=>kind!=='footer'||b.type!=='legal_footer').map(b=>b.type==='legal_footer'?{...b,[kind]:''}:b);});await assert.rejects(()=>compileKlaviyoArtifact(r),/EXPORT_FOOTER_REQUIRED/);}
 const r=await revision();await assert.rejects(()=>compileKlaviyoArtifact({...r,html:'x'.repeat(2*1024*1024+1)}),/EXPORT_SOURCE_LIMIT/);
});
test('foreign template delimiters and private asset bindings cannot leak into prepared downloads',async()=>{
 const r=await revision(s=>{s.sections[0]={id:'m',type:'text',text:'{% recipient %}'};});await assert.rejects(()=>compileKlaviyoArtifact(r),/EXPORT_TOKEN_UNSUPPORTED/);
 const p=await revision();p.manifest.assets={entries:[{visibility:'private'}]};await assert.rejects(()=>compileKlaviyoArtifact(p),/EXPORT_ASSET_UNPUBLISHED/);
});

function reorderKeys(value:unknown):unknown {
 if(Array.isArray(value))return value.map(reorderKeys);
 if(value!==null&&typeof value==='object')return Object.fromEntries(Object.entries(value).reverse().map(([key,item])=>[key,reorderKeys(item)]));
 return value;
}
test('recursive JSONB key reordering preserves native integrity; authored reserved slot is not blindly mapped',async()=>{const r=await revision();r.manifest=reorderKeys(r.manifest) as Record<string,unknown>;await compileKlaviyoArtifact(r);const reserved=await revision(s=>{s.sections[0]={id:'m',type:'text',text:'Literal {{UNSUBSCRIBE_URL}}'};});await assert.rejects(()=>compileKlaviyoArtifact(reserved),/EXPORT_TOKEN_UNSUPPORTED/);});

for(const field of ['renderer','mapping','schema','brand','locale','link_policy']) {
 test(`altered frozen manifest ${field} refuses preparation`,async()=>{
  const r=await revision(s=>{s.tracking={utm_source:'fixture',utm_medium:'email',utm_campaign:'offer'};});
  assert.ok(Object.hasOwn(r.manifest,field));
  await assert.rejects(()=>compileKlaviyoArtifact({...r,manifest:{...r.manifest,[field]:'CORRUPTED'}}),/EXPORT_SOURCE_INTEGRITY/);
 });
}
test('missing and added frozen manifest metadata refuse preparation',async()=>{
 const r=await revision(),missing={...r.manifest};delete missing.renderer;
 await assert.rejects(()=>compileKlaviyoArtifact({...r,manifest:missing}),/EXPORT_SOURCE_INTEGRITY/);
 await assert.rejects(()=>compileKlaviyoArtifact({...r,manifest:{...r.manifest,unexpected:'metadata'}}),/EXPORT_SOURCE_INTEGRITY/);
});
test('nested manifest metadata and array order remain part of frozen integrity',async()=>{
 const r=await revision();
 const extra=structuredClone(r.manifest);(extra.spec as Record<string,unknown>).unexpected='metadata';
 await assert.rejects(()=>compileKlaviyoArtifact({...r,manifest:extra}),/EXPORT_SOURCE_INTEGRITY/);
 const reordered=structuredClone(r.manifest);(reordered.spec as {sections:unknown[]}).sections.reverse();
 await assert.rejects(()=>compileKlaviyoArtifact({...r,manifest:reordered}),/EXPORT_SOURCE_INTEGRITY/);
});
test('generated destination download describes exact media and integrity receipts',()=>{
 const api=JSON.parse(readFileSync(new URL('../public/openapi.json',import.meta.url),'utf8'));
 const response=api.paths['/v1/email-revisions/{id}/destination-artifact'].get.responses['200'];
 assert.deepEqual(Object.keys(response.content).sort(),['text/html','text/plain']);
 assert.match(response.description,/Klaviyo/);assert.doesNotMatch(response.description,/image\/PDF/);
 for(const name of ['X-Artifact-Hash','X-Source-Artifact-Hash','X-Content-SHA256'])assert.equal(response.headers[name].schema.pattern,'^[a-f0-9]{64}$');
 assert.deepEqual(response.headers['X-Destination-Mapping'].schema.enum,['klaviyo-html-1','mailchimp-classic-html-1','omnisend-html-import-1','brevo-campaign-html-1']);
 assert.equal(response.headers['X-Remote-Export-Enabled'].schema.const,'false');
 assert.equal(response.headers['Cache-Control'].schema.const,'no-store');
 assert.equal(response.headers['X-Content-Type-Options'].schema.const,'nosniff');
 assert.equal(response.headers['Content-Security-Policy'].schema.const,"sandbox; default-src 'none'");
 assert.ok(response.headers['Content-Disposition']);assert.ok(response.headers['X-Request-Id']);assert.ok(response.headers['X-Mailcraft-Notice']);
});
