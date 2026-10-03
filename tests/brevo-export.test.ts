import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash, randomUUID} from 'node:crypto';
import {blankSpec, compileEmail} from '../src/domain/email';
import {compileBrevoArtifact, brevoReview} from '../src/domain/brevo-export';
import {BREVO_API_REVISION, BREVO_MAPPING_VERSION, BREVO_HTML_LIMIT, BrevoReview} from '../src/domain/brevo-export-contracts';
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

test('Brevo maps only canonical slots, hashes exact UTF-8 bytes and preserves frozen source',async()=>{
 const r=await revision(s=>{s.sections[0]={id:'unicode',type:'text',text:'Café, 東京, 📨 — exact bytes'};});
 const before=structuredClone(r),a=await compileBrevoArtifact(r);
 assert.equal(a.destination,'brevo');assert.equal(BREVO_MAPPING_VERSION,'brevo-campaign-html-1');assert.equal(BREVO_API_REVISION,'v3');
 assert.equal(a.mapping_version,BREVO_MAPPING_VERSION);assert.equal(a.api_revision,BREVO_API_REVISION);
 assert.equal(a.html,r.html.replaceAll('{{UNSUBSCRIBE_URL}}','{{ unsubscribe }}'));
 assert.equal(a.text,r.plaintext.replaceAll('{{UNSUBSCRIBE_URL}}','{{ unsubscribe }}'));
 assert.equal(a.html_sha256,sha256(a.html));assert.equal(a.text_sha256,sha256(a.text));
 assert.equal(a.destination_hash,sha256(JSON.stringify([BREVO_MAPPING_VERSION,BREVO_API_REVISION,r.artifact_hash,a.subject,a.html,a.text])));
 assert.equal(a.source_artifact_hash,r.artifact_hash);assert.equal(a.revision_id,r.id);assert.equal(a.remote_export_enabled,false);
 assert.equal(a.transformations.length,1);assert.match(a.transformations[0],/unsubscribe/i);
 assert.deepEqual(r,before);assert.deepEqual(await compileBrevoArtifact(r),a);
});

test('each legal footer, including column footers, has exactly one HTML href and plaintext slot',async()=>{
 const r=await revision(s=>{s.sections.push({id:'cols',type:'columns',columns:[[{id:'footer2',type:'legal_footer',identity:'Second identity',address:'456 Road',unsubscribe_slot:true}]]});});
 assert.deepEqual(await validateFrozenExportSource(r),{footerCount:2});
 const a=await compileBrevoArtifact(r);
 assert.equal(a.html.split('{{ unsubscribe }}').length-1,2);assert.equal(a.text.split('{{ unsubscribe }}').length-1,2);
 assert.equal(a.html.split('href="{{ unsubscribe }}"').length-1,2);
});

test('client review contains strict metadata and every unresolved Brevo blocker without companion content',async()=>{
 const a=await compileBrevoArtifact(await revision()),review=brevoReview(a);
 const {html,text,subject,...metadata}=a;assert.ok(html);assert.ok(text);assert.ok(subject);
 assert.deepEqual(review,{...metadata,blockers:['CONNECTION_AUTH_MODE_UNAPPROVED','ACCOUNT_ENTITLEMENT_UNVERIFIED','SENDER_UNVERIFIED','REAL_CLIENT_PREFLIGHT_UNAVAILABLE','DESTINATION_CONFORMANCE_UNVERIFIED','DURABLE_REMOTE_EXPORT_UNAVAILABLE','MANAGEMENT_LINK_UNVERIFIED']});
 assert.equal(Object.hasOwn(review,'html'),false);assert.equal(Object.hasOwn(review,'text'),false);assert.equal(Object.hasOwn(review,'subject'),false);
 assert.equal(BrevoReview.safeParse({...review,subject}).success,false);
 assert.equal(BrevoReview.safeParse({...review,html}).success,false);
 assert.equal(BrevoReview.safeParse({...review,text}).success,false);
 assert.equal(BrevoReview.safeParse({...review,destination:'mailchimp'}).success,false);
 assert.equal(BrevoReview.safeParse({...review,remote_export_enabled:true}).success,false);
 assert.equal(BrevoReview.safeParse({...review,blockers:review.blockers.slice(0,-1)}).success,false);
 assert.equal(BrevoReview.safeParse({...review,blockers:[...review.blockers].reverse()}).success,false);
 assert.equal(BrevoReview.safeParse({...review,blockers:[...review.blockers,'UNKNOWN']}).success,false);
});

test('recursive JSONB key reordering preserves frozen integrity and exact mapped bytes',async()=>{
 const r=await revision(),expected=await compileBrevoArtifact(r);
 r.manifest=reorderKeys(r.manifest) as Record<string,unknown>;
 assert.deepEqual(await compileBrevoArtifact(r),expected);
});

for(const field of ['renderer','mapping','schema','brand','locale','link_policy']) {
 test(`altered frozen manifest ${field} refuses Brevo preparation`,async()=>{
  const r=await revision(s=>{s.tracking={utm_source:'fixture',utm_medium:'email',utm_campaign:'offer'};});
  assert.ok(Object.hasOwn(r.manifest,field));
  await assert.rejects(()=>compileBrevoArtifact({...r,manifest:{...r.manifest,[field]:'CORRUPTED'}}),/EXPORT_SOURCE_INTEGRITY/);
 });
}
test('all frozen manifest fields, nested metadata and array ordering remain integrity-bound',async()=>{
 const r=await revision(),missing={...r.manifest};delete missing.renderer;
 const nested=structuredClone(r.manifest);(nested.spec as Record<string,unknown>).unexpected='metadata';
 const reordered=structuredClone(r.manifest);(reordered.spec as {sections:unknown[]}).sections.reverse();
 for(const manifest of [missing,{...r.manifest,unexpected:'metadata'},nested,reordered])await assert.rejects(()=>compileBrevoArtifact({...r,manifest}),/EXPORT_SOURCE_INTEGRITY/);
});
test('HTML, plaintext, spec, revision ID and hash corruption refuse preparation',async()=>{
 const r=await revision();
 for(const altered of [{...r,html:r.html+'x'},{...r,plaintext:r.plaintext+'x'},{...r,spec:{...r.spec,subject:'Changed'}},{...r,id:'not-a-uuid'},{...r,artifact_hash:'A'.repeat(64)},{...r,artifact_hash:'0'.repeat(64)}])await assert.rejects(()=>compileBrevoArtifact(altered),/EXPORT_SOURCE_INTEGRITY/);
});
test('source byte bounds and source string types are checked before recompilation',async()=>{
 const r=await revision();
 for(const field of ['html','plaintext'] as const){
  await assert.rejects(()=>compileBrevoArtifact({...r,[field]:'é'.repeat(1024*1024+1)}),/EXPORT_SOURCE_LIMIT/);
  await assert.rejects(()=>compileBrevoArtifact({...r,[field]:null} as unknown as FrozenExportRevision),/EXPORT_SOURCE_LIMIT/);
 }
});
test('missing legal footer identity or address refuses preparation without changing source',async()=>{
 for(const kind of ['identity','address','footer'] as const){
  const r=await revision(s=>{s.sections=s.sections.filter(b=>kind!=='footer'||b.type!=='legal_footer').map(b=>b.type==='legal_footer'?{...b,[kind]:' '}:b);});
  const before=structuredClone(r);await assert.rejects(()=>compileBrevoArtifact(r),/EXPORT_FOOTER_REQUIRED/);assert.deepEqual(r,before);
 }
});
test('raw and custom HTML, including column fragments, refuse preparation',async()=>{
 for(const kind of ['raw','custom','column'] as const){
  const r=await revision(s=>{
   if(kind==='raw'){s.editing_mode='raw_html';s.raw_html='<p>Exact source</p>';}
   if(kind==='custom')s.sections.push({id:'custom',type:'custom_html',html:'<p>Opaque</p>'});
   if(kind==='column')s.sections.push({id:'columns',type:'columns',columns:[[{id:'custom',type:'custom_html',html:'<p>Opaque</p>'}]]});
  });
  const before=structuredClone(r);await assert.rejects(()=>compileBrevoArtifact(r),/EXPORT_SOURCE_UNSUPPORTED/);assert.deepEqual(r,before);
 }
});
test('private asset manifests, asset references and private delivery bindings cannot enter artifacts',async()=>{
 const r=await revision();
 const manifest={...r.manifest,assets:{entries:[{visibility:'private'}]}};
 await assert.rejects(()=>compileBrevoArtifact({...r,manifest}),/EXPORT_ASSET_UNPUBLISHED/);
 const spec=structuredClone(r.spec);spec.sections.push({id:'image',type:'image',alt:'Private',asset_ref:{asset_id:randomUUID(),variant_id:randomUUID()}});
 await assert.rejects(()=>compileBrevoArtifact({...r,spec}),/EXPORT_ASSET_UNPUBLISHED/);
 const binding={...r,html:r.html+'<img src="https://mailcraft-assets.invalid/private.png" />'};
 await assert.rejects(()=>compileBrevoArtifact(binding),/EXPORT_ASSET_UNPUBLISHED/);
});
test('static blocking source findings take precedence over a missing subject',async()=>{
 const r=await revision(s=>{s.subject='';s.sections=s.sections.map(b=>b.type==='button'?{...b,href:'https://example.com'}:b);});await assert.rejects(()=>compileBrevoArtifact(r),/EXPORT_STATIC_BLOCKED/);
});

for(const token of ['{{ unsubscribe }}','[[unsubscribe_link]]','{{FIRST_NAME}}','{{unsubscribe_url}}','{% recipient %}','{{','}}','{%','%}','*|FNAME|*','*|UNSUB|*','*|','|*','[[FIRST_NAME]]','[[',']]','[% if contact %]','[%','%]','{{UNSUBSCRIBE_URL}}']) {
 test(`authored or unknown provider delimiter ${JSON.stringify(token)} refuses mapping`,async()=>{
  const r=await revision(s=>{s.sections[0]={id:'token',type:'text',text:'Literal '+token};});
  const before=structuredClone(r);await assert.rejects(()=>compileBrevoArtifact(r),/EXPORT_TOKEN_UNSUPPORTED/);assert.deepEqual(r,before);
 });
}
test('authored canonical slots in CTA hrefs cannot be mistaken for legal footer slots',async()=>{
 const r=await revision(s=>{s.sections=s.sections.map(b=>b.type==='button'?{...b,href:'https://example.org/{{UNSUBSCRIBE_URL}}'}:b);});
 await assert.rejects(()=>compileBrevoArtifact(r),/EXPORT_TOKEN_UNSUPPORTED/);
});

const mappedHtml=(r:FrozenExportRevision)=>r.html.replaceAll('{{UNSUBSCRIBE_URL}}','{{ unsubscribe }}');
async function sizedRevision(htmlBytes:number,unit='x'):Promise<FrozenExportRevision>{
 const empty=await revision(s=>{s.sections=[...Array.from({length:100},(_,i)=>({id:`large-${i}`,type:'text' as const,text:''})),...s.sections.filter(b=>b.type==='legal_footer')];});
 const padding=htmlBytes-Buffer.byteLength(mappedHtml(empty),'utf8'),perBlock=Math.floor(9990/unit.length);
 const units=Math.floor(padding/Buffer.byteLength(unit,'utf8')),remainder=padding-units*Buffer.byteLength(unit,'utf8');
 assert.ok(padding>=0&&units<=1000000);
 return revision(s=>{s.sections=[...Array.from({length:100},(_,i)=>({id:`large-${i}`,type:'text' as const,text:unit.repeat(Math.max(0,Math.min(perBlock,units-i*perBlock)))+(i===0?'x'.repeat(remainder):'')})),...s.sections.filter(b=>b.type==='legal_footer')];});
}

test('HTML field limit exports the exclusive decimal one megabyte constant',()=>{
 assert.equal(BREVO_HTML_LIMIT,1000000);
});
for(const unit of ['x','é','東京','📨']){
 test(`HTML UTF-8 boundary accepts 999999 and refuses 1000000/1000001 bytes for ${unit}`,async()=>{
  const accepted=await sizedRevision(999999,unit),before=structuredClone(accepted),a=await compileBrevoArtifact(accepted);
  assert.equal(Buffer.byteLength(a.html,'utf8'),999999);assert.deepEqual(accepted,before);
  for(const bytes of [1000000,1000001]){
   const r=await sizedRevision(bytes,unit),before=structuredClone(r);
   assert.equal(Buffer.byteLength(mappedHtml(r),'utf8'),bytes);
   await assert.rejects(()=>compileBrevoArtifact(r),/EXPORT_SOURCE_LIMIT/);assert.deepEqual(r,before);
  }
 });
}
test('JSON escaping and metadata have no total request body reserve',async()=>{
 const r=await revision(s=>{s.sections=[...Array.from({length:50},(_,i)=>({id:`escaped-${i}`,type:'text' as const,text:'\\'.repeat(10000)})),...s.sections.filter(b=>b.type==='legal_footer')];});
 const a=await compileBrevoArtifact(r);
 assert.ok(Buffer.byteLength(a.html)<1000000);assert.ok(Buffer.byteLength(a.text)<1000000);
 assert.ok(Buffer.byteLength(JSON.stringify({name:'\uffff'.repeat(255),sender:{id:1},subject:a.subject,htmlContent:a.html}))>1000000);
});

test('review refuses content aliases, credentials, handoff and unverified content claims',async()=>{
 const review=brevoReview(await compileBrevoArtifact(await revision()));
 for(const [key,value] of Object.entries({plaintext:'companion',name:'private',accessToken:'secret',destination_url:'https://example.org',content_verified:true,sections:[],generalSettings:{}}))assert.equal(BrevoReview.safeParse({...review,[key]:value}).success,false,key);
 for(const [key,value] of Object.entries({mapping_version:'wrong',api_revision:'5.0',revision_id:'wrong',source_artifact_hash:'A'.repeat(64),destination_hash:'wrong',html_sha256:'wrong',text_sha256:'wrong',transformations:Array(11).fill('change')}))assert.equal(BrevoReview.safeParse({...review,[key]:value}).success,false,key);
});


test('subject is copied exactly including Unicode and leading/trailing whitespace and binds the six-field hash',async()=>{
 const r=await revision(s=>{s.subject='  Café 東京 📨 exact subject  ';});
 const a=await compileBrevoArtifact(r);
 assert.equal(a.subject,r.spec.subject);
 assert.equal(a.destination_hash,sha256(JSON.stringify([BREVO_MAPPING_VERSION,BREVO_API_REVISION,r.artifact_hash,r.spec.subject,a.html,a.text])));
 assert.notEqual(a.destination_hash,sha256(JSON.stringify([BREVO_MAPPING_VERSION,BREVO_API_REVISION,r.artifact_hash,a.html,a.text])));
 assert.notEqual(a.destination_hash,sha256(JSON.stringify([BREVO_MAPPING_VERSION,BREVO_API_REVISION,r.artifact_hash,a.subject.trim(),a.html,a.text])));
});
for(const subject of ['', ' ', '\t\n', '\u00a0']){
 test(`empty or whitespace subject ${JSON.stringify(subject)} has a specific required-subject failure`,async()=>{
  const r=await revision(s=>{s.subject=subject;}),before=structuredClone(r);
  await assert.rejects(()=>compileBrevoArtifact(r),/^Error: EXPORT_SUBJECT_REQUIRED$/);assert.deepEqual(r,before);
 });
}
for(const subject of ['a\u0000b','a\nb','a\rb','a\tb','a\u007fb','a\u0085b','a\ud800b','a\udfffb']){
 test(`controls or malformed UTF-16 subject ${JSON.stringify(subject)} are refused`,async()=>{
  const r=await revision(s=>{s.subject=subject;}),before=structuredClone(r);
  await assert.rejects(()=>compileBrevoArtifact(r),/^Error: EXPORT_SUBJECT_UNSUPPORTED$/);assert.deepEqual(r,before);
 });
}
test('subject maximum admits exactly 200 well-formed UTF-16 units',async()=>{
 for(const subject of ['x'.repeat(200),'📨'.repeat(100)])assert.equal((await compileBrevoArtifact(await revision(s=>{s.subject=subject;}))).subject,subject);
});
test('missing subject does not mask frozen integrity, raw source, or footer failures',async()=>{
 const r=await revision(s=>{s.subject='';});
 await assert.rejects(()=>compileBrevoArtifact({...r,html:r.html+'corrupt'}),/EXPORT_SOURCE_INTEGRITY/);
 await assert.rejects(()=>compileBrevoArtifact({...r,id:'bad'}),/EXPORT_SOURCE_INTEGRITY/);
 const raw=await revision(s=>{s.subject='';s.editing_mode='raw_html';s.raw_html='<p>Source</p>';});
 await assert.rejects(()=>compileBrevoArtifact(raw),/EXPORT_SOURCE_UNSUPPORTED/);
 const noFooter=await revision(s=>{s.subject='';s.sections=s.sections.filter(b=>b.type!=='legal_footer');});
 await assert.rejects(()=>compileBrevoArtifact(noFooter),/EXPORT_FOOTER_REQUIRED/);
});
