import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {blankSpec,compileEmail} from '../src/domain/email';
const raw=(source:string)=>({...blankSpec('brand','Brand'),editing_mode:'raw_html' as const,raw_html:source,sections:[]});
test('raw compiler freezes exact source evidence and derives separate inert browser and email views',async()=>{
  const source='\uFEFF<DIV onclick="run()">\r\n<!-- keep --><script>run()</script><a href="https://example.com">Go</a></DIV>\r';
  const result=await compileEmail(raw(source));
  assert.equal(result.manifest.spec.raw_html,source);
  assert.ok('source'in result.manifest);
  assert.deepEqual(result.manifest.source,{profile:'exact-utf8-1',sha256:createHash('sha256').update(source).digest('hex'),bytes:Buffer.byteLength(source)});
  assert.ok(!result.html.includes('onclick')&&!result.html.includes('<script'));
  assert.ok('preview_html'in result&&typeof result.preview_html==='string');
  assert.ok(!result.preview_html.includes('href='));
});
test('unsupported and empty source can checkpoint with explicit output blocking',async()=>{
  for(const source of ['', '<!--[if mso]><v:rect>content</v:rect><![endif]--><p>fallback</p>']){
    const result=await compileEmail(raw(source));assert.equal(result.manifest.spec.raw_html,source);
    assert.ok('raw_projection'in result.manifest&&result.manifest.raw_projection);
    assert.equal(result.manifest.raw_projection.delivery_status,'blocked');
  }
});

test('opaque fragments retain exact source and expose blocked, inert derived views including nested columns',async()=>{
 const source='\uFEFF<!-- exact -->\r\n<DIV onclick="run()"><script>run()</script><a href="https://example.com/?utm_source=wrong">Go</a><!--[if mso]><v:rect>VML</v:rect><![endif]--></DIV>\r';
 const spec={...blankSpec('brand','Brand'),tracking:{utm_source:'expected',utm_medium:'email',utm_campaign:'test'},sections:[{id:'cols',type:'columns' as const,columns:[[{id:'opaque',type:'custom_html' as const,html:source}],[]]}]};
 const before=structuredClone(spec),result=await compileEmail(spec);
 assert.deepEqual(spec,before);assert.deepEqual(result.manifest.spec,spec);
 assert.ok('fragment_projection'in result.manifest&&result.manifest.fragment_projection);
 assert.equal(result.manifest.fragment_projection.delivery_status,'blocked');
 assert.deepEqual(result.manifest.fragment_projection.sources,[{node_id:'opaque',source_sha256:createHash('sha256').update(source).digest('hex'),source_bytes:Buffer.byteLength(source)}]);
 assert.ok(result.manifest.fragment_projection.diagnostics.some(d=>d.node_id==='opaque'&&d.code==='VML_FIDELITY_UNSUPPORTED'));
 assert.ok(result.preview_html&&!result.preview_html.includes('<script')&&!result.preview_html.includes('onclick')&&!result.preview_html.includes('href='));
 assert.ok(!result.html.includes('<script')&&!result.html.includes('onclick'));
});
test('eligible fragment tracking changes only email projection and preserves source/hash provenance',async()=>{
 const source='<p><a href="https://example.com/offer">Go</a></p>',spec={...blankSpec('brand','Brand'),tracking:{utm_source:'source',utm_medium:'email',utm_campaign:'test'},sections:[{id:'opaque',type:'custom_html' as const,html:source}]};
 const result=await compileEmail(spec);assert.ok('fragment_projection'in result.manifest&&result.manifest.fragment_projection);
 assert.equal(result.manifest.fragment_projection.delivery_status,'eligible_for_checks');assert.equal(result.manifest.spec.sections[0].type,'custom_html');
 assert.deepEqual(result.manifest.spec,spec);assert.ok(result.html.includes('utm_source=source'));assert.ok(!result.preview_html?.includes('href='));
 assert.equal(result.manifest.fragment_projection.email_hash,createHash('sha256').update(result.html).digest('hex'));
 const changed=await compileEmail({...spec,sections:[{...spec.sections[0],html:source+'\r\n'}]});assert.notEqual(changed.hash,result.hash);
});
test('fragment repair accepts conflicting opaque UTM source while typed destinations stay strict',async()=>{
 const {EmailSourceSpecSchema}=await import('../src/domain/email-schema');
 const tracking={utm_source:'source',utm_medium:'email',utm_campaign:'test'},source='<a href="https://example.com/?utm_source=other">Go</a>';
 const spec={...blankSpec('brand','Brand'),tracking,sections:[{id:'opaque',type:'custom_html' as const,html:source}]};
 assert.equal(EmailSourceSpecSchema.safeParse(spec).success,true);const result=await compileEmail(spec);
 assert.ok('fragment_projection'in result.manifest&&result.manifest.fragment_projection);assert.equal(result.manifest.fragment_projection.delivery_status,'blocked');
 assert.deepEqual(result.manifest.spec,spec);assert.equal(EmailSourceSpecSchema.safeParse({...spec,sections:[{id:'button',type:'button',label:'Go',href:'https://example.com/?utm_source=other'}]}).success,false);
});
test('aggregate fragment tree budget blocks projection without truncating canonical source',async()=>{
 const html='<br>'.repeat(11000),spec={...blankSpec('brand','Brand'),sections:[{id:'first',type:'custom_html' as const,html},{id:'second',type:'custom_html' as const,html}]},result=await compileEmail(spec);
 assert.ok('fragment_projection'in result.manifest&&result.manifest.fragment_projection);assert.equal(result.manifest.fragment_projection.delivery_status,'unavailable');
 assert.deepEqual(result.manifest.spec,spec);assert.equal(result.html,'');assert.equal(result.text,'');assert.equal(result.preview_html,null);
 assert.equal(result.manifest.fragment_projection.sources.length,2);assert.ok(result.manifest.fragment_projection.diagnostics.some(d=>d.code==='RAW_PROJECTION_LIMIT'));
});

test('shared fragment budget counts authored text nodes as well as lexical tags across fragments',async()=>{
 const html='<br>x'.repeat(6000),spec={...blankSpec('brand','Brand'),sections:[{id:'first',type:'custom_html' as const,html},{id:'second',type:'custom_html' as const,html}]};
 // Each fragment individually projects within bounds, and aggregate lexical
 // tags stay below 20,000; actual authored tag+text nodes cross that boundary.
 const {projectRawHtml}=await import('../src/domain/raw-html-projection');assert.notEqual(projectRawHtml(html).delivery_status,'unavailable');
 const result=await compileEmail(spec);assert.ok('fragment_projection'in result.manifest&&result.manifest.fragment_projection);assert.equal(result.manifest.fragment_projection.delivery_status,'unavailable');assert.equal(result.html,'');assert.equal(result.preview_html,null);assert.deepEqual(result.manifest.spec,spec);
});
