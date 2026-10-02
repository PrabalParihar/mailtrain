import test from 'node:test';
import assert from 'node:assert/strict';
import {blankSpec,compileEmail,EmailSpecSchema,sanitizeRaw}from'../src/domain/email';
import {decorateHtmlMarketingLinks}from'../src/domain/utm-html';
const tracking={utm_source:'newsletter',utm_medium:'email',utm_campaign:'été 日本 & sale'};
test('strict optional tracking defaults absent and binds deterministic policy without source mutation',async()=>{
 const original=blankSpec('brand','Brand'),source=structuredClone({...original,tracking});
 assert.equal(EmailSpecSchema.safeParse(source).success,true);
 for(const invalid of[{},null,{...tracking,utm_term:'hidden'},{...tracking,utm_campaign:' '},{...tracking,utm_source:'bad\n'}])assert.equal(EmailSpecSchema.safeParse({...original,tracking:invalid}).success,false);
 const before=structuredClone(source),a=await compileEmail(source),b=await compileEmail(source);assert.deepEqual(a,b);assert.deepEqual(source,before);
 assert.equal(a.manifest.link_policy,'utm-explicit-1');assert.equal(a.manifest.renderer,'mailcraft-react-email-utm-1');assert.deepEqual(a.manifest.spec,source);
 assert.ok(a.html.includes('utm_source=newsletter'));assert.ok(a.text.includes('utm_source=newsletter'));
 assert.ok(a.html.includes('href="{{UNSUBSCRIBE_URL}}"'));assert.ok(a.text.includes('Unsubscribe: {{UNSUBSCRIBE_URL}}'));
 const without=await compileEmail(original);assert.notEqual(a.hash,without.hash);assert.equal('link_policy'in without.manifest,false);
 // Baseline literal digest was captured before compiler/policy integration.
 assert.equal(without.hash,'0bbd12a8263f5094a01d68e990f2ba5dacaa3de033733537d558142b46b4c87a');
});
test('nested buttons products social and custom anchors share the policy; images and nonmarketing targets remain exact',async()=>{
 const original=blankSpec('brand','Brand');original.sections=[{id:'cols',type:'columns',columns:[[{id:'b',type:'button',label:'Nested',href:'https://example.com/a%2fb?x=a%20b#part'}],[{id:'p',type:'product_card',title:'Product',description:'Info',price:'10',href:'https://example.com/product'}]]},{id:'s',type:'social',links:[{label:'Social',href:'https://example.com/social'},{label:'Mail',href:'mailto:help@example.com'},{label:'Call',href:'tel:+15555550123'}]},{id:'i',type:'image',src:'https://example.com/image?x=1',alt:'Example'},{id:'c',type:'custom_html',html:'<p>Custom <a href="https://example.com/custom?x=1&amp;flag=#part">Link</a></p>'},original.sections.at(-1)!];
 const source={...original,tracking},before=structuredClone(source),a=await compileEmail(source);assert.deepEqual(source,before);
 assert.ok(a.html.includes('a%2fb?x=a%20b&amp;utm_source=newsletter'));assert.ok(a.html.includes('#part'));
 for(const link of['https://example.com/product','https://example.com/social','https://example.com/custom'])assert.ok(a.html.includes(link)&&a.text.includes(link));
 assert.ok(a.html.includes('src="https://example.com/image?x=1"'));assert.ok(!a.html.includes('image?x=1&amp;utm_'));
 assert.ok(a.html.includes('href="mailto:help@example.com"'));assert.ok(a.html.includes('href="tel:+15555550123"'));
});
test('source-location HTML patches preserve every untouched byte and entity/query semantics',()=>{
 const html='<!-- ordinary -->\n<style>.x{color:red}</style><TABLE role="presentation"><tr><td><a  HREF = \'https://example.com/a%2fb?x=a%20b&amp;flag=#part\' title="A &amp; B">Link</a><img src="https://example.com/image?x=1"><a href=mailto:help@example.com>Mail</a><a href="{{UNSUBSCRIBE_URL}}">Exit</a></td></tr></TABLE>';
 const changed=decorateHtmlMarketingLinks(html,tracking);
 const expected="https://example.com/a%2fb?x=a%20b&amp;flag=&amp;utm_source=newsletter&amp;utm_medium=email&amp;utm_campaign=%C3%A9t%C3%A9%20%E6%97%A5%E6%9C%AC%20%26%20sale#part";
 assert.equal(changed,html.replace('https://example.com/a%2fb?x=a%20b&amp;flag=#part',expected));assert.equal(decorateHtmlMarketingLinks(changed,tracking),changed);
 assert.equal(decorateHtmlMarketingLinks('<a href=https://example.com/a>Link</a>',tracking),'<a href="https://example.com/a?utm_source=newsletter&amp;utm_medium=email&amp;utm_campaign=%C3%A9t%C3%A9%20%E6%97%A5%E6%9C%AC%20%26%20sale">Link</a>');
});
test('raw mode applies explicit policy to sanitized HTML without modifying original draft markup',async()=>{
 const original=blankSpec('brand','Brand'),raw='<p>Raw <a href="https://example.com/raw?x=a%20b&amp;flag=#part">Offer</a></p><img src="https://example.com/pixel?x=1" /><a href="{{UNSUBSCRIBE_URL}}">Exit</a>';
 const source={...original,editing_mode:'raw_html' as const,raw_html:raw,tracking},before=structuredClone(source),a=await compileEmail(source);assert.deepEqual(source,before);
 assert.equal(a.html,decorateHtmlMarketingLinks(sanitizeRaw(raw).html,tracking));assert.ok(a.text.includes('https://example.com/raw?x=a%20b&flag=&utm_source=newsletter'));assert.ok(!a.html.includes('pixel?x=1&amp;utm_'));
});
test('conflicts unsupported merge/signed links and ambiguous raw attributes produce located semantic refusal before saving',()=>{
 const original=blankSpec('brand','Brand');
 for(const href of['https://example.com/?utm_source=other','https://example.com/?utm_source=newsletter&utm_source=newsletter','https://example.com/?X-Amz-Signature=fixture','https://example.com/{{PRODUCT}}']){
  const typed={...original,tracking,sections:[{id:'b',type:'button',label:'Link',href}]};assert.equal(EmailSpecSchema.safeParse(typed).success,false);
 }
 for(const raw of['<a href="https://example.com/{{PRODUCT}}">Link</a>','<a href="https://example.com/?X-Goog-Signature=fixture">Link</a>','<a href="https://example.com" href="https://other.example">Ambiguous</a>','<!--[if mso]><v:roundrect href="https://example.com">Link</v:roundrect><![endif]-->']){
  assert.throws(()=>decorateHtmlMarketingLinks(raw,tracking));const parsed=EmailSpecSchema.safeParse({...original,tracking,editing_mode:'raw_html',raw_html:raw});assert.equal(parsed.success,false);if(!parsed.success)assert.ok(parsed.error.issues.some(x=>x.path.includes('tracking')));
 }
});
