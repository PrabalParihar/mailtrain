import test from 'node:test';
import assert from 'node:assert/strict';
import {blankSpec,type Block} from '../src/domain/email';
const feature=await import('../src/domain/column-editor').catch(()=>null);
const fixture=()=>({...blankSpec('brand','Fixture'),sections:[{id:'columns',type:'columns',columns:[[{id:'literal',type:'custom_html',html:'<!--literal-->\r\n<p>é 😀</p>'},{id:'text',type:'text',text:'First'}],[{id:'button',type:'button',label:'Go',href:'https://example.com'}]]},{id:'sibling',type:'text',text:'Retained'}] as Block[]});
test('column commands preserve stable identity, literal source and unrelated objects across add, transfer, move, replace and remove',()=>{
 assert.ok(feature,'column child commands are missing');const spec=fixture(),before=structuredClone(spec);
 const added=feature.addColumnChild(spec,'columns',0,{id:'added',type:'divider'});
 const moved=feature.moveColumnChild(added,'columns','literal',1,1);
 const parent=moved.sections[0];assert.equal(parent.type,'columns');assert.deepEqual(parent.columns.map(c=>c.map(n=>n.id)),[['text','added'],['button','literal']]);
 assert.equal(parent.columns[1][1],(spec.sections[0] as Extract<Block,{type:'columns'}>).columns[0][0]);assert.equal(moved.sections[1],spec.sections[1]);
 const reordered=feature.moveColumnChild(moved,'columns','literal',1,0);assert.equal(feature.moveColumnChild(reordered,'columns','literal',1,0),reordered);
 const edited=feature.replaceColumnChild(reordered,'columns',{id:'text',type:'text',text:'Changed'});assert.equal(feature.replaceColumnChild(edited,'columns',{id:'text',type:'text',text:'Changed'}),edited);
 const removed=feature.removeColumnChild(edited,'columns','added');assert.equal(feature.removeColumnChild(removed,'columns','added'),removed);
 assert.deepEqual(spec,before);assert.deepEqual({...removed,sections:[]},{...spec,sections:[]});
});
test('column commands reject stale, invalid and raw operations without changing their input',()=>{
 assert.ok(feature);const spec=fixture(),before=structuredClone(spec);
 for(const column of [-1,2,0.5])assert.throws(()=>feature.addColumnChild(spec,'columns',column,{id:'new',type:'text',text:''}));
 assert.throws(()=>feature.addColumnChild(spec,'columns',0,{id:'sibling',type:'text',text:''}));
 assert.throws(()=>feature.addColumnChild(spec,'columns',0,{id:'new',type:'columns',columns:[[]]}));
 for(const position of [-1,3,0.5])assert.throws(()=>feature.moveColumnChild(spec,'columns','literal',0,position));
 assert.throws(()=>feature.moveColumnChild(spec,'columns','missing',0,0));assert.throws(()=>feature.moveColumnChild(spec,'columns','literal',2,0));
 assert.throws(()=>feature.replaceColumnChild(spec,'columns',{id:'text',type:'button',label:'No silent replacement',href:'https://example.com'}));
 assert.throws(()=>feature.removeColumnChild(spec,'sibling','text'));
 const raw={...spec,editing_mode:'raw_html' as const,raw_html:'Exact source'};assert.throws(()=>feature.removeColumnChild(raw,'columns','text'));assert.throws(()=>feature.addColumnChild(raw,'columns',0,{id:'new',type:'text',text:''}));
 assert.deepEqual(spec,before);
});
test('column limits and the shared node budget refuse additions/transfers before partial mutation',()=>{
 assert.ok(feature);const spec=fixture(),parent=spec.sections[0] as Extract<Block,{type:'columns'}>;
 parent.columns[1]=Array.from({length:20},(_,n)=>({id:'full-'+n,type:'text',text:''}));const before=structuredClone(spec);
 assert.throws(()=>feature.addColumnChild(spec,'columns',1,{id:'new',type:'divider'}));assert.throws(()=>feature.moveColumnChild(spec,'columns','literal',1,20));assert.deepEqual(spec,before);
 const budget=fixture();budget.sections.push(...Array.from({length:195},(_,n)=>({id:'budget-'+n,type:'divider' as const})));
 assert.throws(()=>feature.addColumnChild(budget,'columns',0,{id:'new',type:'divider'}));
 const cleared=feature.removeColumnChild(feature.removeColumnChild(fixture(),'columns','literal'),'columns','text');assert.deepEqual((cleared.sections[0] as Extract<Block,{type:'columns'}>).columns[0],[]);
 assert.equal((feature.addColumnChild(cleared,'columns',0,{id:'new',type:'text',text:''}).sections[0] as Extract<Block,{type:'columns'}>).columns[0][0].id,'new');
});
test('managed image references survive transfers and partial child fields remain local values for shared save admission',()=>{
 assert.ok(feature);const spec=fixture(),image={id:'image',type:'image' as const,asset_ref:{asset_id:'11111111-1111-4111-8111-111111111111',variant_id:'22222222-2222-4222-8222-222222222222'},fallback_ref:{asset_id:'11111111-1111-4111-8111-111111111111',variant_id:'33333333-3333-4333-8333-333333333333'},alt:'Authored description'};
 const added=feature.addColumnChild(spec,'columns',0,image),moved=feature.moveColumnChild(added,'columns','image',1,1),parent=moved.sections[0] as Extract<Block,{type:'columns'}>;
 assert.equal(parent.columns[1][1],image);assert.deepEqual(parent.columns[1][1],image);
 const partial=feature.replaceColumnChild(moved,'columns',{id:'button',type:'button',label:'Go',href:'https://'});
 assert.equal((partial.sections[0] as Extract<Block,{type:'columns'}>).columns[1][0].type,'button');assert.deepEqual((partial.sections[0] as Extract<Block,{type:'columns'}>).columns[1][1],image);assert.deepEqual(spec,fixture());
});
