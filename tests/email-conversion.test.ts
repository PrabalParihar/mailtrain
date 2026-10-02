import {test} from 'node:test';
import assert from 'node:assert/strict';
import {blankSpec,compileEmail,type EmailSpec} from '../src/domain/email';
import {ConversionProposalInput,ConversionAcceptInput,ConversionProposalSchema,conversionProposal} from '../src/domain/email-conversion';
import {parse,type DefaultTreeAdapterTypes} from 'parse5';
const raw=(html:string):EmailSpec=>({...blankSpec('owned-kit','Owned brand'),editing_mode:'raw_html',raw_html:html});
const hex='a'.repeat(64);
test('conversion request and proposal contracts are strict and require explicit source-bound acknowledgment',async()=>{
 assert.equal(ConversionProposalInput.safeParse({expected_version:1}).success,true);
 for(const value of [{expected_version:0},{expected_version:1.5},{expected_version:1,source:'private'}])assert.equal(ConversionProposalInput.safeParse(value).success,false);
 const accept={expected_version:1,source_hash:hex,proposal_hash:hex,acknowledge_layout_change:true};
 assert.equal(ConversionAcceptInput.safeParse(accept).success,true);
 for(const patch of [{acknowledge_layout_change:false},{source_hash:'A'.repeat(64)},{proposal_hash:'short'},{credential:'private'}])assert.equal(ConversionAcceptInput.safeParse({...accept,...patch}).success,false);
 const proposal=await conversionProposal(raw('<p>Hello</p>'),1);
 assert.equal(ConversionProposalSchema.safeParse(proposal).success,true);
 for(const patch of [{extra:'private'},{spec:null},{preview_html:null},{converted_nodes:201},{notes:[{code:'layout_change',message:'x'.repeat(501)}]},{spec:{...proposal.spec,credential:'private'}}])assert.equal(ConversionProposalSchema.safeParse({...proposal,...patch}).success,false);
 assert.equal(ConversionProposalSchema.safeParse({...proposal,status:'unsupported',spec:null,preview_html:null}).success,true);
});
test('plain paragraphs/headings, safe anchors, HTTPS images and dividers convert without source mutation',async()=>{
 const html='<p>Plain &amp; exact 😀</p><h1>One</h1><h2>Two</h2><h3>Three</h3><a href="https://example.com/path?q=x&amp;z=y#keep">Read</a><img src="https://example.com/image.png" alt="Picture" /><hr />';
 const source=raw(html),saved=structuredClone(source),proposal=await conversionProposal(source,7);
 assert.equal(proposal.status,'available');assert.equal(proposal.original_html,html);assert.deepEqual(source,saved);
 assert.equal(proposal.source_doc_version,7);assert.equal(proposal.converted_nodes,7);assert.equal(proposal.opaque_nodes,0);
 assert.deepEqual(proposal.spec?.sections.map(block=>block.type),['text','hero','hero','hero','button','image','divider']);
 assert.deepEqual(proposal.spec?.sections[0],{id:'conversion-1',type:'text',text:'Plain & exact 😀'});
 assert.equal(proposal.spec?.editing_mode,'structured');assert.equal(proposal.spec?.raw_html,undefined);
 assert.deepEqual(proposal.spec?.theme,source.theme);assert.equal(proposal.spec?.brand_kit_version_id,source.brand_kit_version_id);
 assert.equal(proposal.preview_html,(await compileEmail(proposal.spec!)).html);
 assert.equal(proposal.notes.some(note=>note.code==='layout_change'),true);
});
test('nested layouts, rich attributes and unknown safe constructs remain exact opaque source slices',async()=>{
 const fragments=['<p style="color:#123456">Styled</p>','<div class="layout"><p>Nested <strong>copy</strong></p></div>','<table><tbody><tr><td>Cell</td></tr></tbody></table>','<a href="https://example.com" title="Tooltip">Rich link</a>'];
 const html=' \n'+fragments.join('\n \t')+'\n<p>Plain</p>  ',proposal=await conversionProposal(raw(html),1);
 assert.equal(proposal.status,'available');assert.equal(proposal.original_html,html);assert.equal(proposal.opaque_nodes,4);assert.equal(proposal.converted_nodes,1);
 assert.deepEqual(proposal.spec?.sections.filter(block=>block.type==='custom_html').map(block=>block.html),fragments);
 assert.equal(proposal.notes.filter(note=>note.code==='opaque_preserved').length,4);
 const unicode='<p>😀é</p>\n<div>Rich 😀 <strong>é</strong></div>',located=await conversionProposal(raw(unicode),1);
 assert.equal(located.status,'available');assert.deepEqual(located.spec?.sections[1],{id:'conversion-2',type:'custom_html',html:'<div>Rich 😀 <strong>é</strong></div>'});
});
test('safe mailto/tel anchors convert and unsubscribe/attribute-rich images remain opaque without invented metadata',async()=>{
 const html='<a href="mailto:team@example.com">Email</a><a href="tel:+15555555555">Phone</a><a href="{{UNSUBSCRIBE_URL}}">Unsubscribe</a><img src="https://example.com/a.png" alt="" /><img src="https://example.com/b.png" alt="B" width="100" />';
 const proposal=await conversionProposal(raw(html),1);
 assert.equal(proposal.status,'available');assert.deepEqual(proposal.spec?.sections.map(block=>block.type),['button','button','custom_html','image','custom_html']);
 assert.deepEqual(proposal.spec?.sections[3],{id:'conversion-4',type:'image',src:'https://example.com/a.png',alt:'',decorative:true});
});
test('full source and proposal hashes are deterministic, key-order independent and sensitive beyond raw HTML',async()=>{
 const source=raw('<p>Hello</p>'),proposal=await conversionProposal(source,4),again=await conversionProposal(structuredClone(source),4);
 assert.deepEqual(again,proposal);assert.match(proposal.source_hash,/^[a-f0-9]{64}$/);assert.match(proposal.proposal_hash,/^[a-f0-9]{64}$/);
 const reordered=Object.fromEntries(Object.entries(source).reverse()) as EmailSpec;
 assert.deepEqual(await conversionProposal(reordered,4),proposal);
 const cases:[EmailSpec,number][]=[[{...source,subject:'Changed'},4],[{...source,raw_html:'<p>Hello!</p>'},4],[{...source,sections:[]},4],[source,5]];
 for(const [changed,version] of cases) {
  const next=await conversionProposal(changed,version);assert.notEqual(next.source_hash,proposal.source_hash);assert.notEqual(next.proposal_hash,proposal.proposal_hash);
 }
});
test('tracking stays on the proposed spec and decorates only the render copy once',async()=>{
 const source={...raw('<a href="https://example.com/path?q=original#fragment">Read</a>'),tracking:{utm_source:'source',utm_medium:'email',utm_campaign:'launch'}};
 const saved=structuredClone(source),proposal=await conversionProposal(source,1);assert.equal(proposal.status,'available');assert.deepEqual(source,saved);assert.deepEqual(proposal.spec?.tracking,source.tracking);
 const button=proposal.spec?.sections[0];assert.equal(button?.type,'button');if(button?.type==='button')assert.equal(button.href,'https://example.com/path?q=original#fragment');
 const tree=parse(proposal.preview_html!);const hrefs:string[]=[];
 function walk(node:DefaultTreeAdapterTypes.Node){if('tagName'in node&&node.tagName==='a')hrefs.push(node.attrs.find(attr=>attr.name==='href')!.value);if('childNodes'in node)for(const child of node.childNodes)walk(child);}
 walk(tree);assert.equal(hrefs.length,1);const url=new URL(hrefs[0]);assert.deepEqual(url.searchParams.getAll('utm_source'),['source']);assert.equal(url.searchParams.get('q'),'original');assert.equal(url.hash,'#fragment');
 const managed={...source,raw_html:'<a href="https://example.com/path?utm_source=source&amp;utm_medium=email&amp;utm_campaign=launch">Read</a>'};
 const matching=await conversionProposal(managed,1);assert.equal(matching.status,'available');assert.equal((matching.preview_html!.match(/utm_source=/g)??[]).length,1);
});
test('document wrappers, comments/VML, namespaces, parser repairs and sanitizer changes return honest unsupported proposals',async()=>{
 for(const html of ['<!DOCTYPE html><p>Copy</p>','<html><head><title>Title</title></head><body><p>Copy</p></body></html>','<body><p>Copy</p></body>','<p>Copy</p><!--safe comment-->','<!--[if mso]><v:rect>VML</v:rect><![endif]-->','<v:rect>VML</v:rect>','<svg><text>Vector</text></svg>','<p>Missing close','<table><tr><td>Implicit tbody</td></tr></table>','<p><b><i>Repair</b></i></p>','<script>alert(1)</script><p>Copy</p>','<p onclick="alert(1)">Active</p>','<P>Case normalized</P>']) {
  const source=raw(html),saved=structuredClone(source),proposal=await conversionProposal(source,1);
  assert.equal(proposal.status,'unsupported',html);assert.equal(proposal.original_html,html);assert.equal(proposal.spec,null);assert.equal(proposal.preview_html,null);assert.deepEqual(source,saved);
  assert.equal(proposal.notes.some(note=>note.code==='unsupported_source'),true);assert.equal(ConversionProposalSchema.safeParse(proposal).success,true);
 }
});
test('text exceeding a typed field limit remains opaque instead of being truncated',async()=>{
 const html='<p>'+'x'.repeat(10001)+'</p>',proposal=await conversionProposal(raw(html),1);
 assert.equal(proposal.status,'available');assert.equal(proposal.converted_nodes,0);assert.equal(proposal.opaque_nodes,1);assert.deepEqual(proposal.spec?.sections,[{id:'conversion-1',type:'custom_html',html}]);
});
test('opaque chunk and node limits are inclusive and exceeding them never truncates source',async()=>{
 const exact=await conversionProposal(raw('x'.repeat(200000)),1);assert.equal(exact.status,'available');assert.equal(exact.opaque_nodes,1);
 const count=await conversionProposal(raw('<p>x</p>'.repeat(200)),1);assert.equal(count.status,'available');assert.equal(count.converted_nodes,200);
 for(const html of ['x'.repeat(200001),'<p>x</p>'.repeat(201)]) {
  const proposal=await conversionProposal(raw(html),1);assert.equal(proposal.status,'unsupported');assert.equal(proposal.original_html,html);assert.equal(proposal.spec,null);assert.equal(proposal.notes.some(note=>note.code==='limit'),true);
 }
});
test('structured UTF-8 byte and compiled preview limits report unsupported without mutation',async()=>{
 for(const [html,reason] of [[('<div>'+'é'.repeat(100000)+'</div>').repeat(6),'structured document'],[('<p>'+'&amp;'.repeat(1998)+'</p>').repeat(200),'preview']]) {
  const source=raw(html),proposal=await conversionProposal(source,1);assert.equal(proposal.status,'unsupported');assert.equal(proposal.original_html,html);assert.equal(proposal.spec,null);assert.equal(proposal.preview_html,null);assert.equal(proposal.notes.some(note=>note.code==='limit'&&note.message.includes(reason)),true);
 }
});
test('an oversized opaque fragment with many children returns a limit without a spread overflow',async()=>{
 const html='<div>'+'<br />'.repeat(150000)+'</div>',proposal=await conversionProposal(raw(html),1);
 assert.equal(proposal.status,'unsupported');assert.equal(proposal.original_html,html);assert.equal(proposal.notes.some(note=>note.code==='limit'),true);
});
test('nonraw and empty-content sources are unavailable and out-of-contract source/version reject without truncation',async()=>{
 const structured=await conversionProposal(blankSpec('owned-kit','Owned'),1);assert.equal(structured.status,'unsupported');assert.equal(structured.original_html,'');
 const empty=await conversionProposal(raw(' \n\t'),1);assert.equal(empty.status,'unsupported');assert.equal(empty.original_html,' \n\t');
 await assert.rejects(conversionProposal(raw('x'.repeat(2000001)),1));await assert.rejects(conversionProposal(raw('<p>x</p>'),0));
});
