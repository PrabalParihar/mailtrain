import test from 'node:test';
import assert from 'node:assert/strict';
import {withRenderSlot}from'../src/server/render-admission';
import {frozenRenderDownload}from'../src/server/render-cache';
import {frozenPrivateImageBundle}from'../src/server/asset-output';
import {mediaRuntimeIdentity}from'../src/server/media-supervisor';
test('full output capacity rejects PNG and ZIP before authentication or private file reads, then releases on failure',async()=>{
 const controller=new AbortController();let finish!:()=>void;const hold=new Promise<void>(r=>finish=r);
 const a=withRenderSlot(controller.signal,()=>hold),b=withRenderSlot(controller.signal,()=>hold);
 const request=new Request('http://127.0.0.1:3003/v1/email-revisions/11111111-1111-4111-8111-111111111111/download?format=png');
 const revision={id:'11111111-1111-4111-8111-111111111111',html:'<p>Bounded</p>',plaintext:'Bounded',artifact_hash:'a'.repeat(64)};
 const busy=(error:unknown)=>!!error&&typeof error==='object'&&'status'in error&&error.status===429;
 try{await assert.rejects(frozenRenderDownload(request,revision,'png'),busy);await assert.rejects(frozenPrivateImageBundle(request,revision,{version:'asset-manifest-1',entries:[]}),busy);}finally{finish();await Promise.all([a,b]);}
 await assert.rejects(withRenderSlot(controller.signal,async()=>{throw Error('actual failure');}),/actual failure/);
 assert.equal(await withRenderSlot(controller.signal,async()=>true),true);
 controller.abort();await assert.rejects(withRenderSlot(controller.signal,async()=>true),(error:unknown)=>!!error&&typeof error==='object'&&'status'in error&&error.status===499);
});
test('committed operation and lease token deterministically identify every planned child and staging root',()=>{
 const job={operation_id:'11111111-1111-4111-8111-111111111111',token:'22222222-2222-4222-8222-222222222222'};
 const one=mediaRuntimeIdentity(job);assert.deepEqual(one,mediaRuntimeIdentity(job));assert.equal(new Set(one.containers).size,3);
 assert.ok(one.containers.every(name=>name.includes(job.operation_id)&&name.includes(job.token)));
 assert.throws(()=>mediaRuntimeIdentity({...job,token:'../other'}),/IDENTITY_INVALID/);
});
