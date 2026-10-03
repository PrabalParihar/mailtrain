import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash, randomUUID} from 'node:crypto';
import {blankSpec, compileEmail, type EmailSpec} from '../src/domain/email';
import {compileHubSpotArtifact, hubspotReview} from '../src/domain/hubspot-export';
import {HUBSPOT_COMPARISON_VERSION, HUBSPOT_MAPPING_VERSION, HUBSPOT_SOURCE_LIMIT, HubSpotReview, type HubSpotFooterSettingsData} from '../src/domain/hubspot-footer-contracts';
import type {FrozenExportRevision} from '../src/domain/frozen-export-source';

const settings:HubSpotFooterSettingsData={company_name:'Fixture & Books 📚',company_street_address_1:'42 <Main> Street',company_street_address_2:'Suite 7',company_city:'東京',company_state:'NY',company_zip:'10001',company_country:'US'};
const address='42 <Main> Street, Suite 7, 東京, NY 10001, US';
const htmlName='{{ site_settings.company_name|escape_html }}';
const htmlAddress='{{ site_settings.company_street_address_1|escape_html }}, {{ site_settings.company_street_address_2|escape_html }}, {{ site_settings.company_city|escape_html }}, {{ site_settings.company_state|escape_html }} {{ site_settings.company_zip|escape_html }}, {{ site_settings.company_country|escape_html }}';
const textName='{{ site_settings.company_name }}';
const textAddress='{{ site_settings.company_street_address_1 }}, {{ site_settings.company_street_address_2 }}, {{ site_settings.company_city }}, {{ site_settings.company_state }} {{ site_settings.company_zip }}, {{ site_settings.company_country }}';
const htmlHref='href="{{ unsubscribe_link|escape_url }}" class="hubspot-mergetag" data-unsubscribe="true"';
const sha=(value:string)=>createHash('sha256').update(value,'utf8').digest('hex');
async function revision(change?:(spec:EmailSpec)=>void):Promise<FrozenExportRevision>{
 const spec=blankSpec(randomUUID(),settings.company_name);spec.subject='Fixture subject';
 spec.sections=spec.sections.map(b=>b.type==='legal_footer'?{...b,address}:b.type==='button'?{...b,href:'https://example.org/offer'}:b);
 change?.(spec);const artifact=await compileEmail(spec);
 return {id:randomUUID(),html:artifact.html,plaintext:artifact.text,artifact_hash:artifact.hash,manifest:artifact.manifest,spec};
}
function deepFreeze<T>(value:T):T{
 if(value&&typeof value==='object'){Object.freeze(value);for(const child of Object.values(value))if(child&&typeof child==='object'&&!Object.isFrozen(child))deepFreeze(child);}
 return value;
}
function expectedHtml(html:string):string{
 return html.replaceAll('<p>Fixture &amp; Books 📚<br/>42 &lt;Main&gt; Street, Suite 7, 東京, NY 10001, US</p>',`<p>${htmlName}<br/>${htmlAddress}</p>`).replaceAll('href="{{UNSUBSCRIBE_URL}}"',htmlHref);
}
function expectedText(text:string):string{
 return text.replaceAll(settings.company_name+'\n'+address+'\nUnsubscribe: {{UNSUBSCRIBE_URL}}',textName+'\n'+textAddress+'\nUnsubscribe: {{ unsubscribe_link }}');
}

test('visible native HTML and anchored local plaintext preserve every byte outside verified footer spans',async()=>{
 const r=await revision(s=>{s.sections.unshift({id:'repeated',type:'text',text:settings.company_name+' | '+address+' | Café 📨'});s.preheader=settings.company_name;s.subject=address;});
 const before=structuredClone(r),a=await compileHubSpotArtifact(deepFreeze(r),deepFreeze(structuredClone(settings)));
 assert.equal(a.html,expectedHtml(r.html));assert.equal(a.text,expectedText(r.plaintext));
 assert.ok(a.html.includes('<!--$--><!--html--><!--head--><!--body-->'));assert.ok(a.html.includes('style="white-space:pre-wrap;line-height:1.6"'));
 assert.ok(a.html.includes('Fixture &amp; Books 📚 | 42 &lt;Main&gt; Street'));
 assert.ok(a.text.includes(settings.company_name+' | '+address));
 assert.deepEqual(r,before);assert.deepEqual(await compileHubSpotArtifact(r,settings),a);
});
test('UTF-8 output and ordered exact settings bind all local digests independently of object key order',async()=>{
 const r=await revision(),a=await compileHubSpotArtifact(r,settings);
 const digest=sha(JSON.stringify([HUBSPOT_COMPARISON_VERSION,'Fixture & Books 📚','42 <Main> Street','Suite 7','東京','NY','10001','US']));
 assert.equal(a.settings_digest,digest);assert.equal(a.html_sha256,sha(a.html));assert.equal(a.text_sha256,sha(a.text));
 assert.equal(a.destination_hash,sha(JSON.stringify([HUBSPOT_MAPPING_VERSION,HUBSPOT_COMPARISON_VERSION,r.artifact_hash,digest,a.html,a.text])));
 assert.equal(a.revision_id,r.id);assert.equal(a.source_artifact_hash,r.artifact_hash);
 assert.deepEqual(await compileHubSpotArtifact(r,Object.fromEntries(Object.entries(settings).reverse())),a);
});
test('multiple nested and top-level footers follow flattened source order and map every canonical href once',async()=>{
 const r=await revision(s=>{s.sections.unshift({id:'cols',type:'columns',columns:[[{id:'nested-1',type:'legal_footer',identity:settings.company_name,address,unsubscribe_slot:true}],[{id:'nested-2',type:'legal_footer',identity:settings.company_name,address,unsubscribe_slot:true}]]});});
 const a=await compileHubSpotArtifact(r,settings);assert.equal(a.html,expectedHtml(r.html));assert.equal(a.text,expectedText(r.plaintext));
 assert.equal(a.html.split(htmlHref).length-1,3);assert.equal(a.text.split('{{ unsubscribe_link }}').length-1,3);
});
for(const empty of [[],['company_street_address_2'],['company_zip'],['company_country'],['company_street_address_2','company_zip','company_country']] as const){
 test(`native address expressions include only exact nonempty optional values ${empty.join(',')}`,async()=>{
  const local={...settings};for(const key of empty)local[key]='';
  const expected=['42 <Main> Street',local.company_street_address_2,'東京','NY'+(local.company_zip?' 10001':''),local.company_country].filter(Boolean).join(', ');
  const r=await revision(s=>{s.sections=s.sections.map(b=>b.type==='legal_footer'?{...b,address:expected}:b);});
  const a=await compileHubSpotArtifact(r,local);
  const h=['{{ site_settings.company_street_address_1|escape_html }}',local.company_street_address_2?'{{ site_settings.company_street_address_2|escape_html }}':'','{{ site_settings.company_city|escape_html }}','{{ site_settings.company_state|escape_html }}'+(local.company_zip?' {{ site_settings.company_zip|escape_html }}':''),local.company_country?'{{ site_settings.company_country|escape_html }}':''].filter(Boolean).join(', ');
  assert.ok(a.html.includes(`<p>${htmlName}<br/>${h}</p>`));assert.ok(a.text.includes(textName+'\n'+h.replaceAll('|escape_html','')+'\nUnsubscribe: {{ unsubscribe_link }}'));
  for(const key of empty){assert.ok(!a.html.includes('site_settings.'+key));assert.ok(!a.text.includes('site_settings.'+key));}
 });
}
test('exact whitespace is compared without normalization and entity decoding retains quotes and ampersands',async()=>{
 const local={...settings,company_name:'  Books "quoted" & café  ',company_street_address_1:'  Road & Lane  '};
 const exact='  Road & Lane  , Suite 7, 東京, NY 10001, US';
 const r=await revision(s=>{s.sections=s.sections.map(b=>b.type==='legal_footer'?{...b,identity:local.company_name,address:exact}:b);});
 const a=await compileHubSpotArtifact(r,local);assert.ok(a.html.includes(`<p>${htmlName}<br/>${htmlAddress}</p>`));
 await assert.rejects(()=>compileHubSpotArtifact(r,{...local,company_name:local.company_name.trim()}),/^Error: HUBSPOT_FOOTER_MISMATCH$/);
});
for(const invalid of [null,{}, {...settings,extra:'PRIVATE'}, {...settings,company_zip:undefined}, {...settings,company_name:' '}, {...settings,company_street_address_2:' '}, {...settings,company_name:'x'.repeat(501)}, {...settings,company_name:'private\u0000value'}, {...settings,company_city:'private\u0085value'}, {...settings,company_country:'\ud800'}, {...settings,company_city:'{{ authored }}'}, {...settings,company_city:'{# private #}'}]){
 test(`invalid declared settings refuse with one content-free error (${JSON.stringify(invalid).slice(0,45)})`,async()=>{
  const r=await revision();await assert.rejects(()=>compileHubSpotArtifact(r,invalid),/^Error: HUBSPOT_SETTINGS_INVALID$/);
 });
}
for(const mismatch of [{...settings,company_name:'Different'},{...settings,company_zip:'10002'},{...settings,company_street_address_1:'42 <main> Street'}]){
 test('any exact identity or address mismatch refuses without changing either input',async()=>{
  const r=await revision(),before=structuredClone(r),declared=structuredClone(mismatch);await assert.rejects(()=>compileHubSpotArtifact(deepFreeze(r),deepFreeze(mismatch)),/^Error: HUBSPOT_FOOTER_MISMATCH$/);assert.deepEqual(r,before);assert.deepEqual(mismatch,declared);
 });
}
test('any later footer mismatch is compared before mapping including nested footers',async()=>{
 for(const nested of [false,true]){
  const r=await revision(s=>{const footer={id:'other',type:'legal_footer' as const,identity:'Other identity',address,unsubscribe_slot:true as const};s.sections.push(nested?{id:'cols',type:'columns',columns:[[footer]]}:footer);});
  await assert.rejects(()=>compileHubSpotArtifact(r,settings),/^Error: HUBSPOT_FOOTER_MISMATCH$/);
 }
});
for(const token of ['{{ authored }}','{{','}}','{% if x %}','{%','%}','{# HubL comment #}','{#','#}','*|FNAME|*','*|','|*','[[foreign]]','[[',']]','[% foreign %]','[%','%]','{{UNSUBSCRIBE_URL}}']){
 test(`unsupported authored delimiter ${JSON.stringify(token)} in content refuses after canonical slots only`,async()=>{
  const r=await revision(s=>{s.sections.unshift({id:'token',type:'text',text:'Authored '+token});});await assert.rejects(()=>compileHubSpotArtifact(r,settings),/^Error: EXPORT_TOKEN_UNSUPPORTED$/);
 });
}
test('HTML-only unsupported syntax in the frozen title is also refused',async()=>{
 const r=await revision(s=>{s.subject='Subject {# comment #}';});await assert.rejects(()=>compileHubSpotArtifact(r,settings),/^Error: EXPORT_TOKEN_UNSUPPORTED$/);
});
test('canonical-looking authored CTA hrefs cannot be mistaken for footer slots',async()=>{
 const r=await revision(s=>{s.sections=s.sections.map(b=>b.type==='button'?{...b,href:'https://example.org/{{UNSUBSCRIBE_URL}}'}:b);});await assert.rejects(()=>compileHubSpotArtifact(r,settings),/^Error: EXPORT_TOKEN_UNSUPPORTED$/);
});
test('strict review exposes only fixed content-free metadata with all readiness flags false and exact blockers',async()=>{
 const a=await compileHubSpotArtifact(await revision(),settings),review=hubspotReview(a);
 const {html,text,...metadata}=a;assert.ok(html);assert.ok(text);assert.deepEqual(review,metadata);
 assert.deepEqual(review.blockers,['CONNECTION_AUTH_MODE_UNAPPROVED','HUBSPOT_ACCOUNT_SETTINGS_UNVERIFIED','ACCOUNT_ENTITLEMENT_UNVERIFIED','REAL_CLIENT_PREFLIGHT_UNAVAILABLE','DESTINATION_CONFORMANCE_UNVERIFIED','DURABLE_REMOTE_EXPORT_UNAVAILABLE','MANAGEMENT_LINK_UNVERIFIED']);
 assert.equal(review.remote_export_enabled,false);assert.equal(review.account_settings_verified,false);assert.equal(review.native_conformance_verified,false);assert.equal(review.management_link_verified,false);assert.equal(review.settings_origin,'locally_declared');
 assert.doesNotMatch(JSON.stringify(review),/Fixture|Main|10001|東京|📚/);
 assert.deepEqual(hubspotReview(await compileHubSpotArtifact(await revision(s=>{s.sections[0]={id:'new',type:'text',text:'Different campaign'};}),settings)).transformations,review.transformations);
 for(const extra of [{html},{text},{settings},{subject:'PRIVATE'},{api_revision:'v3'},{access_token:'SECRET'},{management_url:'https://example.org'}])assert.equal(HubSpotReview.safeParse({...review,...extra}).success,false);
 assert.throws(()=>hubspotReview({...a,secret:'PRIVATE'} as typeof a));
 assert.throws(()=>hubspotReview({...a,account_settings_verified:true} as unknown as typeof a));
});
test('source integrity failures precede invalid settings and preserve immutable source',async()=>{
 const r=await revision();
 const changes:Partial<FrozenExportRevision>[]=[{id:'bad'},{artifact_hash:'0'.repeat(64)},{html:r.html+'x'},{plaintext:r.plaintext+'x'},{html:r.html.replace('<br/>','<hr/>')},{html:r.html.replace('href="{{UNSUBSCRIBE_URL}}"','href="{{UNSUBSCRIBE_URL}}" class="conflict"')},{manifest:{...r.manifest,renderer:'corrupt'}},{spec:{...r.spec,subject:'Changed'}}];
 for(const change of changes)await assert.rejects(()=>compileHubSpotArtifact({...r,...change},null),/^Error: EXPORT_SOURCE_INTEGRITY$/);
});
test('JSONB manifest key ordering is immaterial but missing extra nested fields and array order are integrity-bound',async()=>{
 const reorder=(value:unknown):unknown=>Array.isArray(value)?value.map(reorder):value&&typeof value==='object'?Object.fromEntries(Object.entries(value).reverse().map(([key,item])=>[key,reorder(item)])):value;
 const r=await revision(),a=await compileHubSpotArtifact(r,settings);assert.deepEqual(await compileHubSpotArtifact({...r,manifest:reorder(r.manifest) as Record<string,unknown>},settings),a);
 const missing={...r.manifest};delete missing.renderer;const nested=structuredClone(r.manifest);(nested.spec as Record<string,unknown>).extra=true;const order=structuredClone(r.manifest);(order.spec as {sections:unknown[]}).sections.reverse();
 for(const manifest of [missing,{...r.manifest,extra:true},nested,order])await assert.rejects(()=>compileHubSpotArtifact({...r,manifest},settings),/^Error: EXPORT_SOURCE_INTEGRITY$/);
});
test('missing or blank footers preserve frozen-source precedence',async()=>{
 for(const kind of ['missing','identity','address']){
  const r=await revision(s=>{s.sections=s.sections.filter(b=>kind!=='missing'||b.type!=='legal_footer').map(b=>b.type==='legal_footer'?{...b,[kind]:' '}:b);});await assert.rejects(()=>compileHubSpotArtifact(r,null),/^Error: EXPORT_FOOTER_REQUIRED$/);
 }
});
test('raw HTML and custom blocks including columns refuse before settings comparison',async()=>{
 for(const kind of ['raw','custom','nested']){
  const r=await revision(s=>{if(kind==='raw'){s.editing_mode='raw_html';s.raw_html='<p>Source</p>';}else{const block={id:'custom',type:'custom_html' as const,html:'<p>Opaque</p>'};s.sections.push(kind==='nested'?{id:'cols',type:'columns',columns:[[block]]}:block);}});await assert.rejects(()=>compileHubSpotArtifact(r,null),/^Error: EXPORT_SOURCE_UNSUPPORTED$/);
 }
});
test('private manifests asset references and delivery bindings refuse before comparison',async()=>{
 const r=await revision(),spec=structuredClone(r.spec);spec.sections.push({id:'image',type:'image',alt:'Private',asset_ref:{asset_id:randomUUID(),variant_id:randomUUID()}});
 for(const altered of [{...r,manifest:{...r.manifest,assets:{entries:[{visibility:'private'}]}}},{...r,spec},{...r,html:r.html+'<img src="https://mailcraft-assets.invalid/private.png"/>'}])await assert.rejects(()=>compileHubSpotArtifact(altered,null),/^Error: EXPORT_ASSET_UNPUBLISHED$/);
});
test('static blocking findings precede invalid settings',async()=>{
 const r=await revision(s=>{s.subject='';});await assert.rejects(()=>compileHubSpotArtifact(r,null),/^Error: EXPORT_STATIC_BLOCKED$/);
});
test('source UTF-8 size and type limits precede settings comparison',async()=>{
 const r=await revision();for(const field of ['html','plaintext'])for(const value of ['é'.repeat(HUBSPOT_SOURCE_LIMIT/2+1),null])await assert.rejects(()=>compileHubSpotArtifact({...r,[field]:value} as FrozenExportRevision,null),/^Error: EXPORT_SOURCE_LIMIT$/);
});
async function sizedRevision(bytes:number):Promise<FrozenExportRevision>{
 const empty=await revision(s=>{s.sections=[...Array.from({length:150},(_,i)=>({id:'large-'+i,type:'text' as const,text:''})),...s.sections.filter(b=>b.type==='legal_footer')];});
 const padding=bytes-Buffer.byteLength(expectedHtml(empty.html),'utf8'),units=Math.floor(padding/5),remainder=padding%5;
 assert.ok(padding>=0&&units<=150*9990);
 return revision(s=>{s.sections=[...Array.from({length:150},(_,i)=>({id:'large-'+i,type:'text' as const,text:'&'.repeat(Math.max(0,Math.min(9990,units-i*9990)))+(i===0?'x'.repeat(remainder):'')})),...s.sections.filter(b=>b.type==='legal_footer')];});
}
test('mapped HTML local UTF-8 budget admits exactly 2 MiB and refuses the next byte even when frozen source fits',async()=>{
 const r=await sizedRevision(HUBSPOT_SOURCE_LIMIT),a=await compileHubSpotArtifact(r,settings);assert.equal(Buffer.byteLength(a.html),HUBSPOT_SOURCE_LIMIT);assert.ok(Buffer.byteLength(r.html)<HUBSPOT_SOURCE_LIMIT);
 const over=await sizedRevision(HUBSPOT_SOURCE_LIMIT+1);assert.ok(Buffer.byteLength(over.html)<HUBSPOT_SOURCE_LIMIT);await assert.rejects(()=>compileHubSpotArtifact(over,settings),/^Error: EXPORT_SOURCE_LIMIT$/);
});
test('local compiler performs no provider fetch and remains deterministic with frozen inputs',async()=>{
 const old=globalThis.fetch;globalThis.fetch=async()=>{throw new Error('UNEXPECTED_NETWORK');};
 try{const r=deepFreeze(await revision()),local=deepFreeze(structuredClone(settings));assert.deepEqual(await compileHubSpotArtifact(r,local),await compileHubSpotArtifact(r,local));}finally{globalThis.fetch=old;}
});

test('settings are captured once so comparison and digest cannot observe different declared values',async()=>{
 let reads=0;const supplied={...settings,get company_name(){return ++reads===1?settings.company_name:'Different company';}};
 const r=await revision(),a=await compileHubSpotArtifact(r,supplied);
 assert.equal(reads,1);assert.equal(a.settings_digest,sha(JSON.stringify([HUBSPOT_COMPARISON_VERSION,'Fixture & Books 📚','42 <Main> Street','Suite 7','東京','NY','10001','US'])));
});
