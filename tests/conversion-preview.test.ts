import test from 'node:test';
import assert from 'node:assert/strict';
import {parse,type DefaultTreeAdapterTypes}from'parse5';
const helper=await import('../src/ui/conversion-preview').catch(()=>null);
test('static preview removes HTML and SVG navigation while preserving visible copy and authored styles',()=>{
 assert.ok(helper,'Static operable preview helper must exist.');
 const source='<a href="https://example.invalid" target="_blank" ping="https://example.invalid/ping" style="color:red">Visible link</a><svg><a xlink:href="https://example.invalid/svg">SVG copy</a></svg><area href="https://example.invalid/area"><p>Keep bottom content</p>';
 const html=helper.conversionPreview(source),stack:DefaultTreeAdapterTypes.Node[]=[parse(html)];let links=0,csp='';
 while(stack.length){const node=stack.pop()!;if('tagName'in node){if(['a','area'].includes(node.tagName)){links++;assert.equal(node.attrs.some(a=>['href','ping','target','download'].includes(a.name)),false);}
 if(node.tagName==='meta'&&node.attrs.some(a=>a.name==='http-equiv'&&a.value==='Content-Security-Policy'))csp=node.attrs.find(a=>a.name==='content')!.value;
 }if('childNodes'in node)for(const child of node.childNodes)stack.push(child);if('content'in node)stack.push(node.content);}
 assert.equal(links,3);assert.match(csp,/default-src 'none'/);assert.match(csp,/img-src 'none'/);assert.match(csp,/form-action 'none'/);assert.match(html,/color:red/);assert.match(html,/Visible link/);assert.match(html,/Keep bottom content/);assert.match(source,/href=/);
});
test('static preview neutralizes refresh and duplicate/entity navigation in repaired unsupported sources',()=>{
 assert.ok(helper);const html=helper.conversionPreview('<meta http-equiv="refresh" content="0;url=https://example.invalid"><a HREF="&#104;ttps://example.invalid" href="https://example.invalid/duplicate">Copy</a>');
 assert.doesNotMatch(html,/http-equiv="refresh"/i);assert.doesNotMatch(html,/<a[^>]+\bhref=/i);assert.match(html,/Copy/);
});
