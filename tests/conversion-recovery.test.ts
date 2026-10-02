import test from 'node:test';
import assert from 'node:assert/strict';
import {blankSpec} from '../src/domain/email';
const recovery=await import('../src/ui/conversion-recovery').catch(()=>null);
function module(){assert.ok(recovery,'Conversion recovery must exist.');return recovery;}
const workspace='11111111-1111-4111-8111-111111111111',email='22222222-2222-4222-8222-222222222222',key='33333333-3333-4333-8333-333333333333';
const scope={workspace,email,actor:'verified-actor'},source={...blankSpec('owned-brand','Owned'),editing_mode:'raw_html' as const,raw_html:'<p>Preserve this exact source</p>'};
const context={version:7,spec:JSON.stringify(source)},command={body:{expected_version:7,source_hash:'a'.repeat(64),proposal_hash:'b'.repeat(64),acknowledge_layout_change:true as const},key};
const pending={schema_version:1 as const,...scope,context,command};

test('conversion pending recovery roundtrips only the original strict body/key and source context',()=>{
 const m=module();assert.deepEqual(m.parseConversionRecovery(JSON.stringify(pending),scope),pending);assert.equal(m.conversionContextMatches(context,7,source),true);assert.equal(m.conversionContextMatches(context,8,source),false);assert.equal(m.conversionContextMatches(context,7,{...source,subject:'Changed source'}),false);
});
test('legacy unknown and mismatched actor/workspace/email recovery cannot borrow current authority',()=>{
 const m=module();for(const patch of[{schema_version:undefined},{actor:undefined},{actor:'other-actor'},{workspace:key},{email:key},{credential:'synthetic-only'},{command:{...command,private_token:'synthetic-only'}},{context:{...context,extra:'unknown'}}])assert.equal(m.parseConversionRecovery(JSON.stringify({...pending,...patch}),scope),null);
 for(const body of[{...command.body,expected_version:8},{...command.body,acknowledge_layout_change:false},{...command.body,source_hash:'invalid'},{...command.body,private_key:'synthetic-only'}])assert.equal(m.parseConversionRecovery(JSON.stringify({...pending,command:{...command,body}}),scope),null);
 assert.equal(m.parseConversionRecovery(JSON.stringify({...pending,command:{...command,key:'invalid'}}),scope),null);
});
test('maximum admitted escaped raw source context survives recovery without truncation or proposal persistence',()=>{
 const m=module(),maximum={...source,sections:[],raw_html:'\u0001'.repeat(2000000)},full={...pending,context:{version:7,spec:JSON.stringify(maximum)}};
 assert.deepEqual(m.parseConversionRecovery(JSON.stringify(full),scope),full);
 assert.equal(m.parseConversionRecovery(JSON.stringify({...pending,proposal:{original_html:source.raw_html}}),scope),null);
 assert.equal(m.parseConversionRecovery(JSON.stringify({...pending,context:{version:7,spec:'not-json'}}),scope),null);
});
test('pending tab memory remains isolated across actors and unavailable storage and unload guard clears only on acknowledgment',()=>{
 const m=module(),previousStorage=Object.getOwnPropertyDescriptor(globalThis,'localStorage'),previousWindow=Object.getOwnPropertyDescriptor(globalThis,'window'),events:((event:{preventDefault:()=>void;returnValue:string})=>void)[]=[];
 Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem(){throw Error('blocked');},setItem(){throw Error('quota');},removeItem(){throw Error('blocked');}}});
 Object.defineProperty(globalThis,'window',{configurable:true,value:{addEventListener(name:string,handler:(event:{preventDefault:()=>void;returnValue:string})=>void){if(name==='beforeunload')events.push(handler);}}});
 try{assert.equal(m.rememberConversionRecovery(scope,pending),false);assert.deepEqual(m.readConversionRecovery(scope),{pending,persisted:false});assert.equal(m.readConversionRecovery({...scope,actor:'other'}).pending,null);assert.equal(m.readConversionRecovery({...scope,email:key}).pending,null);assert.equal(m.readConversionRecovery({...scope,workspace:key}).pending,null);
  let prevented=false;events[0]({preventDefault(){prevented=true;},returnValue:''});assert.equal(prevented,true);m.clearConversionRecovery(scope);assert.equal(m.readConversionRecovery(scope).pending,null);prevented=false;events[0]({preventDefault(){prevented=true;},returnValue:''});assert.equal(prevented,false);
 }finally{if(previousStorage)Object.defineProperty(globalThis,'localStorage',previousStorage);else Reflect.deleteProperty(globalThis,'localStorage');if(previousWindow)Object.defineProperty(globalThis,'window',previousWindow);else Reflect.deleteProperty(globalThis,'window');}
});
test('persistent recovery keeps the exact old command after current source has advanced and refuses mismatched storage records',()=>{
 const m=module(),previous=Object.getOwnPropertyDescriptor(globalThis,'localStorage'),values=new Map<string,string>();
 Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem(slot:string){return values.get(slot)??null;},setItem(slot:string,value:string){values.set(slot,value);},removeItem(slot:string){values.delete(slot);}}});
 try{assert.equal(m.rememberConversionRecovery(scope,pending),true);assert.deepEqual(m.readConversionRecovery(scope).pending,pending);assert.equal(m.conversionContextMatches(context,8,{...source,editing_mode:'structured'}),false);assert.equal(m.rememberConversionRecovery({...scope,actor:'other'},pending),false);assert.equal(m.readConversionRecovery({...scope,actor:'other'}).pending,null);m.clearConversionRecovery(scope);assert.equal(m.readConversionRecovery(scope).pending,null);
 }finally{if(previous)Object.defineProperty(globalThis,'localStorage',previous);else Reflect.deleteProperty(globalThis,'localStorage');}
});
