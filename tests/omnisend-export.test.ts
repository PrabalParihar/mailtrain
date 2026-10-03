import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash, randomUUID} from 'node:crypto';
import {blankSpec, compileEmail} from '../src/domain/email';
import {compileOmnisendArtifact, omnisendReview} from '../src/domain/omnisend-export';
import {OMNISEND_API_REVISION, OMNISEND_MAPPING_VERSION, OMNISEND_IMPORT_BODY_LIMIT, OmnisendReview} from '../src/domain/omnisend-export-contracts';
import {validateFrozenExportSource, type FrozenExportRevision} from '../src/domain/frozen-export-source';

async function revision(change?: (s:ReturnType<typeof blankSpec>) => void):Promise<FrozenExportRevision> {
 const spec=blankSpec(randomUUID(),'Fixture');spec.subject='Fixture subject';
 spec.sections=spec.sections.map(b=>b.type==='legal_footer'?{...b,address:'123 Fixture Road'}:b.type==='button'?{...b,href:'https://example.org/offer'}:b);
 change?.(spec);const a=await compileEmail(spec);
 return {id:randomUUID(),html:a.html,plaintext:a.text,artifact_hash:a.hash,manifest:a.manifest,spec};
}
const sha256=(s:string)=>createHash('sha256').update(s,'utf8').digest('hex');
function reorderKeys(value:unknown):unknown {
 if(Array.isArray(value))return value.map(reorderKeys);
 if(value!==null&&typeof value==='object')return Object.fromEntries(Object.entries(value).reverse().map(([key,item])=>[key,reorderKeys(item)]));
 return value;
}

test('Omnisend maps only canonical slots, hashes exact UTF-8 bytes and preserves frozen source',async()=>{
 const r=await revision(s=>{s.sections[0]={id:'unicode',type:'text',text:'Café, 東京, 📨 — exact bytes'};});
 const before=structuredClone(r),a=await compileOmnisendArtifact(r);
 assert.equal(a.destination,'omnisend');assert.equal(OMNISEND_MAPPING_VERSION,'omnisend-html-import-1');assert.equal(OMNISEND_API_REVISION,'2026-03-15');
 assert.equal(a.mapping_version,OMNISEND_MAPPING_VERSION);assert.equal(a.api_revision,OMNISEND_API_REVISION);
 assert.equal(a.html,r.html.replaceAll('{{UNSUBSCRIBE_URL}}','[[unsubscribe_link]]'));
 assert.equal(a.text,r.plaintext.replaceAll('{{UNSUBSCRIBE_URL}}','[[unsubscribe_link]]'));
 assert.equal(a.html_sha256,sha256(a.html));assert.equal(a.text_sha256,sha256(a.text));
 assert.equal(a.destination_hash,sha256(JSON.stringify([OMNISEND_MAPPING_VERSION,OMNISEND_API_REVISION,r.artifact_hash,a.html,a.text])));
 assert.equal(a.source_artifact_hash,r.artifact_hash);assert.equal(a.revision_id,r.id);assert.equal(a.remote_export_enabled,false);
 assert.equal(a.transformations.length,1);assert.match(a.transformations[0],/unsubscribe/i);
 assert.deepEqual(r,before);assert.deepEqual(await compileOmnisendArtifact(r),a);
});

test('each legal footer, including column footers, has exactly one HTML href and plaintext slot',async()=>{
 const r=await revision(s=>{s.sections.push({id:'cols',type:'columns',columns:[[{id:'footer2',type:'legal_footer',identity:'Second identity',address:'456 Road',unsubscribe_slot:true}]]});});
 assert.deepEqual(await validateFrozenExportSource(r),{footerCount:2});
 const a=await compileOmnisendArtifact(r);
 assert.equal(a.html.split('[[unsubscribe_link]]').length-1,2);assert.equal(a.text.split('[[unsubscribe_link]]').length-1,2);
 assert.equal(a.html.split('href="[[unsubscribe_link]]"').length-1,2);
});

test('client review contains strict metadata and every unresolved Omnisend blocker without companion content',async()=>{
 const a=await compileOmnisendArtifact(await revision()),review=omnisendReview(a);
 const {html,text,...metadata}=a;assert.ok(html);assert.ok(text);
 assert.deepEqual(review,{...metadata,blockers:['OAUTH_CONNECTION_UNAVAILABLE','ACCOUNT_ENTITLEMENT_UNVERIFIED','REAL_CLIENT_PREFLIGHT_UNAVAILABLE','DESTINATION_CONFORMANCE_UNVERIFIED','DURABLE_REMOTE_EXPORT_UNAVAILABLE','IMPORT_FIDELITY_UNVERIFIED','MANAGEMENT_LINK_UNVERIFIED']});
 assert.equal(Object.hasOwn(review,'html'),false);assert.equal(Object.hasOwn(review,'text'),false);
 assert.equal(OmnisendReview.safeParse({...review,html}).success,false);
 assert.equal(OmnisendReview.safeParse({...review,text}).success,false);
 assert.equal(OmnisendReview.safeParse({...review,destination:'mailchimp'}).success,false);
 assert.equal(OmnisendReview.safeParse({...review,remote_export_enabled:true}).success,false);
 assert.equal(OmnisendReview.safeParse({...review,blockers:review.blockers.slice(0,-1)}).success,false);
 assert.equal(OmnisendReview.safeParse({...review,blockers:[...review.blockers].reverse()}).success,false);
 assert.equal(OmnisendReview.safeParse({...review,blockers:[...review.blockers,'UNKNOWN']}).success,false);
});

test('recursive JSONB key reordering preserves frozen integrity and exact mapped bytes',async()=>{
 const r=await revision(),expected=await compileOmnisendArtifact(r);
 r.manifest=reorderKeys(r.manifest) as Record<string,unknown>;
 assert.deepEqual(await compileOmnisendArtifact(r),expected);
});

for(const field of ['renderer','mapping','schema','brand','locale','link_policy']) {
 test(`altered frozen manifest ${field} refuses Omnisend preparation`,async()=>{
  const r=await revision(s=>{s.tracking={utm_source:'fixture',utm_medium:'email',utm_campaign:'offer'};});
  assert.ok(Object.hasOwn(r.manifest,field));
  await assert.rejects(()=>compileOmnisendArtifact({...r,manifest:{...r.manifest,[field]:'CORRUPTED'}}),/EXPORT_SOURCE_INTEGRITY/);
 });
}
test('all frozen manifest fields, nested metadata and array ordering remain integrity-bound',async()=>{
 const r=await revision(),missing={...r.manifest};delete missing.renderer;
 const nested=structuredClone(r.manifest);(nested.spec as Record<string,unknown>).unexpected='metadata';
 const reordered=structuredClone(r.manifest);(reordered.spec as {sections:unknown[]}).sections.reverse();
 for(const manifest of [missing,{...r.manifest,unexpected:'metadata'},nested,reordered])await assert.rejects(()=>compileOmnisendArtifact({...r,manifest}),/EXPORT_SOURCE_INTEGRITY/);
});
test('HTML, plaintext, spec, revision ID and hash corruption refuse preparation',async()=>{
 const r=await revision();
 for(const altered of [{...r,html:r.html+'x'},{...r,plaintext:r.plaintext+'x'},{...r,spec:{...r.spec,subject:'Changed'}},{...r,id:'not-a-uuid'},{...r,artifact_hash:'A'.repeat(64)},{...r,artifact_hash:'0'.repeat(64)}])await assert.rejects(()=>compileOmnisendArtifact(altered),/EXPORT_SOURCE_INTEGRITY/);
});
test('source byte bounds and source string types are checked before recompilation',async()=>{
 const r=await revision();
 for(const field of ['html','plaintext'] as const){
  await assert.rejects(()=>compileOmnisendArtifact({...r,[field]:'é'.repeat(1024*1024+1)}),/EXPORT_SOURCE_LIMIT/);
  await assert.rejects(()=>compileOmnisendArtifact({...r,[field]:null} as unknown as FrozenExportRevision),/EXPORT_SOURCE_LIMIT/);
 }
});
test('missing legal footer identity or address refuses preparation without changing source',async()=>{
 for(const kind of ['identity','address','footer'] as const){
  const r=await revision(s=>{s.sections=s.sections.filter(b=>kind!=='footer'||b.type!=='legal_footer').map(b=>b.type==='legal_footer'?{...b,[kind]:' '}:b);});
  const before=structuredClone(r);await assert.rejects(()=>compileOmnisendArtifact(r),/EXPORT_FOOTER_REQUIRED/);assert.deepEqual(r,before);
 }
});
test('raw and custom HTML, including column fragments, refuse preparation',async()=>{
 for(const kind of ['raw','custom','column'] as const){
  const r=await revision(s=>{
   if(kind==='raw'){s.editing_mode='raw_html';s.raw_html='<p>Exact source</p>';}
   if(kind==='custom')s.sections.push({id:'custom',type:'custom_html',html:'<p>Opaque</p>'});
   if(kind==='column')s.sections.push({id:'columns',type:'columns',columns:[[{id:'custom',type:'custom_html',html:'<p>Opaque</p>'}]]});
  });
  const before=structuredClone(r);await assert.rejects(()=>compileOmnisendArtifact(r),/EXPORT_SOURCE_UNSUPPORTED/);assert.deepEqual(r,before);
 }
});
test('private asset manifests, asset references and private delivery bindings cannot enter artifacts',async()=>{
 const r=await revision();
 const manifest={...r.manifest,assets:{entries:[{visibility:'private'}]}};
 await assert.rejects(()=>compileOmnisendArtifact({...r,manifest}),/EXPORT_ASSET_UNPUBLISHED/);
 const spec=structuredClone(r.spec);spec.sections.push({id:'image',type:'image',alt:'Private',asset_ref:{asset_id:randomUUID(),variant_id:randomUUID()}});
 await assert.rejects(()=>compileOmnisendArtifact({...r,spec}),/EXPORT_ASSET_UNPUBLISHED/);
 const binding={...r,html:r.html+'<img src="https://mailcraft-assets.invalid/private.png" />'};
 await assert.rejects(()=>compileOmnisendArtifact(binding),/EXPORT_ASSET_UNPUBLISHED/);
});
test('static blocking source findings refuse preparation',async()=>{
 const r=await revision(s=>{s.subject='';});await assert.rejects(()=>compileOmnisendArtifact(r),/EXPORT_STATIC_BLOCKED/);
});

for(const token of ['{{FIRST_NAME}}','{{unsubscribe_url}}','{% recipient %}','{{','}}','{%','%}','*|FNAME|*','*|UNSUB|*','[[unsubscribe_link]]','*|','|*','[[FIRST_NAME]]','[[',']]','[% if contact %]','[%','%]','{{UNSUBSCRIBE_URL}}']) {
 test(`authored or unknown provider delimiter ${JSON.stringify(token)} refuses mapping`,async()=>{
  const r=await revision(s=>{s.sections[0]={id:'token',type:'text',text:'Literal '+token};});
  const before=structuredClone(r);await assert.rejects(()=>compileOmnisendArtifact(r),/EXPORT_TOKEN_UNSUPPORTED/);assert.deepEqual(r,before);
 });
}
test('authored canonical slots in CTA hrefs cannot be mistaken for legal footer slots',async()=>{
 const r=await revision(s=>{s.sections=s.sections.map(b=>b.type==='button'?{...b,href:'https://example.org/{{UNSUBSCRIBE_URL}}'}:b);});
 await assert.rejects(()=>compileOmnisendArtifact(r),/EXPORT_TOKEN_UNSUPPORTED/);
});

const reservedBodyBytes=(html:string)=>Buffer.byteLength(JSON.stringify({name:'\uffff'.repeat(255),html}),'utf8');
async function sizedRevision(bodyBytes:number):Promise<FrozenExportRevision>{
 const empty=await revision(s=>{s.sections=[...Array.from({length:100},(_,i)=>({id:`large-${i}`,type:'text' as const,text:''})),...s.sections.filter(b=>b.type==='legal_footer')];});
 const padding=bodyBytes-reservedBodyBytes(empty.html.replaceAll('{{UNSUBSCRIBE_URL}}','[[unsubscribe_link]]'));
 assert.ok(padding>=0&&padding<=1000000);
 return revision(s=>{s.sections=[...Array.from({length:100},(_,i)=>({id:`large-${i}`,type:'text' as const,text:'x'.repeat(Math.max(0,Math.min(10000,padding-i*10000)))})),...s.sections.filter(b=>b.type==='legal_footer')];});
}

test('request body limit exports the conservative decimal one megabyte constant',()=>{
 assert.equal(OMNISEND_IMPORT_BODY_LIMIT,1000000);
});
test('maximum well-formed 255-unit name reserve admits the exact final serialized body boundary',async()=>{
 const r=await sizedRevision(1000000),before=structuredClone(r),a=await compileOmnisendArtifact(r);
 assert.equal(reservedBodyBytes(a.html),1000000);
 for(const name of ['x'.repeat(255),'\uffff'.repeat(255),'📨'.repeat(127)+'x','"'.repeat(255),'\\'.repeat(255)])assert.ok(Buffer.byteLength(JSON.stringify({name,html:a.html}),'utf8')<=1000000);
 assert.deepEqual(r,before);
});
test('one byte beyond the serialized body reserve refuses otherwise-valid source',async()=>{
 const r=await sizedRevision(1000001),before=structuredClone(r);
 assert.equal(reservedBodyBytes(r.html.replaceAll('{{UNSUBSCRIBE_URL}}','[[unsubscribe_link]]')),1000001);
 await assert.rejects(()=>compileOmnisendArtifact(r),/EXPORT_SOURCE_LIMIT/);
 assert.deepEqual(r,before);
});
test('JSON escaping counts against total body even when both format byte sizes fit',async()=>{
 const r=await revision(s=>{s.sections=[...Array.from({length:50},(_,i)=>({id:`escaped-${i}`,type:'text' as const,text:'\\'.repeat(10000)})),...s.sections.filter(b=>b.type==='legal_footer')];});
 const html=r.html.replaceAll('{{UNSUBSCRIBE_URL}}','[[unsubscribe_link]]'),text=r.plaintext.replaceAll('{{UNSUBSCRIBE_URL}}','[[unsubscribe_link]]');
 assert.ok(Buffer.byteLength(html)<1000000);assert.ok(Buffer.byteLength(text)<1000000);assert.ok(reservedBodyBytes(html)>1000000);
 await assert.rejects(()=>compileOmnisendArtifact(r),/EXPORT_SOURCE_LIMIT/);
});
test('review refuses content aliases, credentials, handoff and unverified content claims',async()=>{
 const review=omnisendReview(await compileOmnisendArtifact(await revision()));
 for(const [key,value] of Object.entries({plaintext:'companion',name:'private',accessToken:'secret',destination_url:'https://example.org',content_verified:true,sections:[],generalSettings:{}}))assert.equal(OmnisendReview.safeParse({...review,[key]:value}).success,false,key);
 for(const [key,value] of Object.entries({mapping_version:'wrong',api_revision:'5.0',revision_id:'wrong',source_artifact_hash:'A'.repeat(64),destination_hash:'wrong',html_sha256:'wrong',text_sha256:'wrong',transformations:Array(11).fill('change')}))assert.equal(OmnisendReview.safeParse({...review,[key]:value}).success,false,key);
});
