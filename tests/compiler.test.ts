import {test} from 'node:test';
import assert from 'node:assert/strict';
import {EmailSpecSchema, blankSpec, compileEmail, sanitizeRaw, lintEmail} from '../src/domain/email.js';
test('same versioned manifest compiles to identical bytes and digest',async()=>{
 const s=blankSpec('brand','Brand');s.subject='<offer>';s.sections[0]={id:'t',type:'text',text:'A & B <script>'};
 const a=await compileEmail(s),b=await compileEmail(s);assert.deepEqual(a,b);assert.ok(a.html.includes('&lt;script&gt;'));assert.ok(a.text.includes('A & B'));assert.ok(a.html.includes('UNSUBSCRIBE_URL'));
});
test('rejects executable/unknown nodes and overlong subject',()=>{
 const s=blankSpec('brand','Brand');assert.equal(EmailSpecSchema.safeParse({...s,subject:'x'.repeat(201)}).success,false);assert.equal(EmailSpecSchema.safeParse({...s,sections:[{id:'a',type:'script',code:'alert(1)'}]}).success,false);
});
test('raw import strips scripts, handlers, frames, forms and unsafe URLs',()=>{
 const out=sanitizeRaw('<script>alert(1)</script><p onclick="x()">Hi</p><a href="javascript:alert(1)">go</a><iframe src="https://example.com"></iframe>');assert.ok(!/onclick|javascript:|iframe|<script/.test(out.html));assert.ok(out.warnings.length);
});
test('legal slots and primary CTA blockers cannot be presented as passed',async()=>{
 const s=blankSpec('brand','Brand');s.subject='';s.sections=[{id:'b',type:'button',label:'Shop',href:'https://example.com'}];const l=lintEmail(s);assert.ok(l.some(x=>x.code==='SUBJECT_REQUIRED'&&x.severity==='blocking'));assert.ok(l.some(x=>x.code==='FOOTER_REQUIRED'));
});
