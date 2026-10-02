import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {parse,type DefaultTreeAdapterTypes} from 'parse5';
import {privateAssetBinding,type AssetManifestEntry} from '../src/domain/assets';
import * as projectionModule from '../src/domain/raw-html-projection';
import * as contracts from '../src/domain/email-source-contracts';
const project=(source:string,context?:{assets?:{version:'asset-manifest-1';entries:AssetManifestEntry[]}})=>{assert.ok(projectionModule,'raw projection implementation must exist');return projectionModule.projectRawHtml(source,context);};
const entry:AssetManifestEntry={asset_id:'11111111-1111-4111-8111-111111111111',variant_id:'22222222-2222-4222-8222-222222222222',source_sha256:'a'.repeat(64),sha256:'b'.repeat(64),mime:'image/png',bytes:20,width:2,height:2,role:'static',frames:1,processing_profile:'fixture-1',storage_profile:'local-private-v1',visibility:'private',rights_evidence_id:'33333333-3333-4333-8333-333333333333',scan_evidence_ids:['44444444-4444-4444-8444-444444444444','55555555-5555-4555-8555-555555555555']};
function elements(html:string){const tree=parse(html),pending:DefaultTreeAdapterTypes.Node[]=[tree],found:DefaultTreeAdapterTypes.Element[]=[];while(pending.length){const n=pending.pop()!;if('tagName'in n)found.push(n);if('childNodes'in n)pending.push(...n.childNodes);if('content'in n)pending.push(n.content);}return found;}

test('projection identity preserves exact source while deterministic output is distinct',()=>{
  const source='\uFEFF<P style="color:#123456">e\u0301 &amp; 😀</P>\r\n<!-- note -->\r';
  const a=project(source),b=project(source);
  assert.deepEqual(a,b);assert.equal(a.source_hash,createHash('sha256').update(source).digest('hex'));
  assert.equal(a.source_bytes,Buffer.byteLength(source));assert.equal(a.browser_profile,'raw-browser-1');assert.equal(a.email_profile,'raw-email-2');
  assert.ok(contracts);assert.equal(contracts.RawProjectionSchema.safeParse(a).success,true);
  assert.notEqual(a.browser_html,source);assert.notEqual(a.email_html,source);
  assert.notEqual(project(source.replace('\r\n','\n')).source_hash,a.source_hash);
  assert.equal(project('').email_html,'');
});
test('empty source remains exact and saveable while delivery is explicitly blocked',()=>{
  for(const source of ['', ' \r\n\t\uFEFF']){
    const out=project(source);
    assert.equal(out.delivery_status,'blocked');
    assert.equal(out.source_hash,createHash('sha256').update(source).digest('hex'));
    assert.equal(out.source_bytes,Buffer.byteLength(source));
    assert.ok(out.diagnostics.some(d=>d.code==='RAW_SOURCE_EMPTY'&&d.severity==='blocking'));
    assert.notEqual(out.email_html,null);assert.notEqual(out.browser_html,null);
  }
});
test('browser projection neutralizes links, navigation and executable elements independently of email output',()=>{
  const source='<script>globalThis.rawTripwire=1</script><p onclick="rawTripwire()">Keep copy</p><a href="https://example.invalid/shop" target="_blank" ping="https://example.invalid/ping">Shop</a><iframe srcdoc="<script>x()</script>"></iframe><form action="https://example.invalid"><button>Submit</button></form><meta http-equiv="refresh" content="0;url=https://example.invalid"><base href="https://example.invalid">';
  const out=project(source);
  for(const html of [out.browser_html!,out.email_html!]){const nodes=elements(html);assert.equal(nodes.some(n=>['script','iframe','form','button','base','object','embed','svg','math'].includes(n.tagName)),false);assert.equal(nodes.some(n=>n.attrs.some(a=>/^on/i.test(a.name)||['srcdoc','ping'].includes(a.name))),false);}
  assert.equal(elements(out.browser_html!).some(n=>n.tagName==='a'&&n.attrs.some(a=>a.name==='href')),false);
  assert.match(out.email_html!,/href="https:\/\/example.invalid\/shop"/);assert.match(out.browser_html!,/Keep copy/);
  assert.ok(out.diagnostics.some(d=>d.code==='ACTIVE_CONTENT_REMOVED'));
});
test('unsafe schemes, CSS loads and namespace markup cannot survive as active resources',()=>{
  for(const source of ['<a href="java&#x73;cript:alert(1)">X</a>','<img src="data:image/svg+xml,<svg onload=alert(1)>">','<p style="background-image:url(https://example.invalid);color:expression(alert(1))">Keep</p>','<style>@import "https://example.invalid/font";</style><p>Keep</p>','<svg><a xlink:href="javascript:alert(1)">X</a><foreignObject><iframe src="https://example.invalid"></iframe></foreignObject></svg>','<math><annotation-xml encoding="text/html"><script>alert(1)</script></annotation-xml></math>','<template><img src="https://example.invalid/trap" onerror="alert(1)"></template>']){
    const out=project(source);for(const html of [out.browser_html!,out.email_html!]){assert.doesNotMatch(html,/javascript:|expression\(|@import|background-image|<script|<iframe|<svg|<math|srcdoc=/i);}
  }
});
test('conditional and VML fidelity stays explicitly blocked while source identity remains exact',()=>{
  for(const source of ['<!--[if mso]><v:roundrect href="https://example.invalid" style="width:200px;height:40px">Offer</v:roundrect><![endif]--><p>Fallback</p>','<v:rect xmlns:v="urn:schemas-microsoft-com:vml">VML copy</v:rect>','<!--[if !mso]><!--><p>Fallback</p><!--<![endif]-->']){
    const out=project(source);assert.equal(out.delivery_status,'blocked');assert.equal(out.source_hash,createHash('sha256').update(source).digest('hex'));assert.ok(out.diagnostics.some(d=>/VML_FIDELITY|CONDITIONAL_FIDELITY/.test(d.code)&&d.severity==='blocking'));
  }
});
test('remote images and forged private markers are blocked without invoking network',()=>{
  for(const src of ['https://example.invalid/image.png',privateAssetBinding(entry),privateAssetBinding(entry)+'?changed=1']){
    const out=project(`<img src="${src}" alt="Photo">`);assert.equal(out.delivery_status,'blocked');assert.equal(elements(out.browser_html!).some(n=>n.attrs.some(a=>a.name==='src')),false);assert.equal(elements(out.email_html!).some(n=>n.attrs.some(a=>a.name==='src')),false);
  }
});
test('only exact manifest-backed image markers remain in email output and inert browser bindings',()=>{
  const marker=privateAssetBinding(entry),source=`<img src="${marker}" alt="Photo">`,assets={version:'asset-manifest-1' as const,entries:[entry]};
  const before=JSON.stringify(assets),out=project(source,{assets});assert.equal(JSON.stringify(assets),before);
  assert.equal(out.delivery_status,'eligible_for_checks');assert.match(out.email_html!,new RegExp(marker));
  const image=elements(out.browser_html!).find(n=>n.tagName==='img');assert.ok(image);assert.equal(image.attrs.some(a=>a.name==='src'),false);assert.equal(image.attrs.find(a=>a.name==='data-raw-asset-binding')?.value,marker);
  assert.equal(project(source.replace(entry.sha256,'c'.repeat(64)),{assets}).delivery_status,'blocked');
  assert.throws(()=>project(source,{assets:{...assets,entries:[entry,entry]}}));
});
test('an animation binds its exact registered static fallback in browser output',()=>{
  const fallback:AssetManifestEntry={...entry,role:'fallback',selected_frame:0};
  const animation:AssetManifestEntry={...entry,variant_id:'66666666-6666-4666-8666-666666666666',sha256:'c'.repeat(64),mime:'image/gif',role:'animation',frames:2,fallback:{asset_id:fallback.asset_id,variant_id:fallback.variant_id}};
  const source=`<img src="${privateAssetBinding(animation)}" alt="Animation">`,assets={version:'asset-manifest-1' as const,entries:[animation,fallback]};
  const out=project(source,{assets}),image=elements(out.browser_html!).find(n=>n.tagName==='img');
  assert.ok(image);assert.equal(image.attrs.some(a=>a.name==='src'),false);
  assert.equal(image.attrs.find(a=>a.name==='data-raw-asset-binding')?.value,privateAssetBinding(fallback));
  assert.ok(out.email_html!.includes(privateAssetBinding(animation)));
  assert.ok(out.diagnostics.some(d=>d.code==='ANIMATION_BROWSER_FALLBACK'));
  assert.throws(()=>project(source,{assets:{...assets,entries:[animation]}}));
});
test('work and diagnostic bounds preserve source digest without partial projection',()=>{
  for(const source of ['<div>'.repeat(65)+'X'+'</div>'.repeat(65),'<br>'.repeat(20001)]){
    const out=project(source);assert.equal(out.delivery_status,'unavailable');assert.equal(out.browser_html,null);assert.equal(out.email_html,null);assert.equal(out.source_hash,createHash('sha256').update(source).digest('hex'));assert.ok(out.diagnostics.some(d=>d.code==='RAW_PROJECTION_LIMIT'));
  }
  const source='<p onclick="x()">X</p>'.repeat(300),out=project(source);
  assert.ok(out.diagnostics.length<=100);assert.ok(out.omitted_diagnostics>0);assert.ok(out.diagnostics.some(d=>d.code==='DIAGNOSTICS_TRUNCATED'));
  for(const diagnostic of out.diagnostics){assert.ok(diagnostic.start>=0&&diagnostic.end>=diagnostic.start&&diagnostic.end<=source.length);assert.doesNotMatch(diagnostic.message,/<script|onclick=/i);}
});
test('entity expansion output is bounded without losing exact source identity',()=>{
  const source='&'.repeat(2097152),out=project(source);
  assert.equal(out.source_bytes,2097152);
  assert.equal(out.source_hash,createHash('sha256').update(source).digest('hex'));
  assert.equal(out.delivery_status,'unavailable');
  assert.equal(out.browser_html,null);assert.equal(out.email_html,null);
  assert.ok(out.diagnostics.some(d=>d.code==='RAW_PROJECTION_LIMIT'));
});
