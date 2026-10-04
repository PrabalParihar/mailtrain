import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {blankSpec} from '../src/domain/email';
import {saveConflictRows,conflictComparisonIdentity,checkedConflictDocument,conflictExcerpt} from '../src/domain/save-conflict-comparison';
const id=randomUUID(),scope={workspace:randomUUID(),actor:'CaseSensitiveActor',email:id};
const doc=()=>({id,title:'Draft title',doc_version:1,spec:blankSpec(randomUUID(),'Same subject'),raw_source_profile:null});
test('full conflict rows preserve both specs and distinguish title profile nested placement and retained literal absence',()=>{
 const local=doc();local.spec.sections=[{id:'a:text',type:'text',text:'Local body'},{id:'a',type:'columns',columns:[[{id:'nested',type:'custom_html',html:'(Absent)'}],[]]}];local.spec.raw_html='(Absent)';
 const server=structuredClone(local);server.title='Server title';server.doc_version=2;server.spec.preheader='Server preheader';server.spec.locale='he-IL';server.spec.direction='rtl';delete server.spec.raw_html;server.spec.sections=[{id:'a',type:'columns',columns:[[],[{id:'nested',type:'custom_html',html:'Server literal'}]]}];
 const before=JSON.stringify([local,server]),rows=saveConflictRows(local,server),changes=rows.filter(r=>r.changed);
 assert.ok(changes.some(r=>r.key==='document_title'&&r.before==='Draft title'&&r.after==='Server title'));
 assert.ok(changes.some(r=>r.key==='raw_html'&&r.before_present&&!r.after_present&&r.before==='(Absent)'));
 assert.ok(changes.some(r=>r.label.includes('nested')&&r.label.includes('placement')));
 assert.ok(changes.some(r=>r.label.includes('a:text')&&r.label.includes('removed')));
 assert.equal(new Set(rows.map(r=>r.key)).size,rows.length);assert.equal(JSON.stringify([local,server]),before);
 assert.equal(saveConflictRows(local,structuredClone(local)).filter(r=>r.changed).length,0);
});
test('conflict identity fences actor scope title version profile and exact source while ignoring object key order',()=>{
 const local=doc(),identity=conflictComparisonIdentity(scope,local);
 assert.equal(typeof identity,'string');assert.ok(identity.length>0);
 const reordered={...local,spec:{...local.spec,theme:{...local.spec.theme}}};assert.equal(conflictComparisonIdentity({...scope},reordered),identity);
 const absent={...local} as Omit<typeof local,'raw_source_profile'> & {raw_source_profile?:null};delete absent.raw_source_profile;assert.notEqual(conflictComparisonIdentity(scope,absent),identity);
 for(const next of [{...scope,actor:scope.actor.toLowerCase()},{...scope,email:randomUUID()},{...scope,workspace:randomUUID()}])assert.notEqual(conflictComparisonIdentity(next,local),identity);
 for(const next of [{...local,title:'Changed'},{...local,doc_version:2},{...local,raw_source_profile:'exact-utf8-1' as const},{...local,spec:{...local.spec,raw_html:'\ufeff<p>é 😀</p>\r\n'}}])assert.notEqual(conflictComparisonIdentity(scope,next),identity);
});
test('refresh admission normalizes existing GET metadata and rejects malformed specs wrong email and checkpoint envelopes',()=>{
 const local=doc();assert.deepEqual(checkedConflictDocument(local,id),local);
 assert.deepEqual(checkedConflictDocument({...local,workspace_id:scope.workspace,created_at:'2026-10-04T00:00:00Z'},id),local);
 assert.throws(()=>checkedConflictDocument({...local,workspace_id:randomUUID()},id,scope.workspace));
 assert.throws(()=>checkedConflictDocument({...local,id:randomUUID()},id));
 assert.throws(()=>checkedConflictDocument({...local,spec:{...local.spec,sections:[{id:'bad',type:'unknown'}]}},id));
 assert.throws(()=>checkedConflictDocument({before:local,after:local,artifact_hash:'a'.repeat(64)},id));
});
test('bounded conflict excerpt reaches late changes escapes literal source and never cuts a surrogate pair',()=>{
 const a='A'.repeat(9999)+'😀'+'B'.repeat(5000)+'BEFORE',b=a.replace('BEFORE','AFTER');
 const result=conflictExcerpt(a,b,false);assert.ok(result.partial);assert.ok(result.value.includes('BEFORE'));assert.ok(result.value.length<=8192);assert.ok(!/^[\uDC00-\uDFFF]/.test(result.value));assert.ok(!/[\uD800-\uDBFF]$/.test(result.value));
 const literal=conflictExcerpt('\ufeff<p>é 😀</p>\r\n<script>bad()</script>','',true);assert.equal(literal.partial,false);assert.ok(literal.value.includes('\\ufeff'));assert.ok(literal.value.includes('\\r\\n'));assert.ok(literal.value.includes('<script>'));
 assert.deepEqual(conflictExcerpt('','',false),{value:'',partial:false});
});
