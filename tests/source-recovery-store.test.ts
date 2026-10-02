import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {chromium} from 'playwright';
import type {EmailSpec} from '../src/domain/email-schema';
import {createSourceSaveCommand,serializeSourceSaveCommand} from '../src/ui/source-save-command';
const store=await import('../src/ui/source-recovery-store').catch(()=>null);
const scope={workspace:'11111111-1111-4111-8111-111111111111',actor:'recovery-owner',email:'22222222-2222-4222-8222-222222222222'};
function spec(raw=''):EmailSpec{return {schema_version:'1.0',editing_mode:'raw_html',locale:'en-US',direction:'ltr',subject:'Original',preheader:'',brand_kit_version_id:'brand-1',theme:{content_width_px:600,background:'#ffffff',accent:'#000000',font_stack:'Arial, sans-serif'},sections:[],raw_html:raw};}
function draft(){return {id:scope.email,title:'Owned recovery',doc_version:1,spec:spec()};}

test('unavailable IndexedDB refuses writes and reads without mutating caller draft or original command',async()=>{
  assert.ok(store,'source recovery store must exist');const d=draft(),command=serializeSourceSaveCommand(await createSourceSaveCommand({...scope,lifecycle:'mount-1',epoch:0,baseVersion:1,spec:d.spec},'original-key'));
  await assert.rejects(()=>store.writeSourceDraftRecovery(scope,d),/storage|IndexedDB|unavailable/i);
  await assert.rejects(()=>store.writeSourceCommandRecovery(scope,command),/storage|IndexedDB|unavailable/i);
  await assert.rejects(()=>store.readSourceRecovery(scope));await assert.rejects(()=>store.removeSourceRecovery(scope,{draft:true,command:true}));
  assert.equal(d.spec.raw_html,'');assert.equal(JSON.parse(command).key,'original-key');
});
test('scope, source budget and original command hashes validate before unavailable storage is accessed',async()=>{
  assert.ok(store);await assert.rejects(()=>store.writeSourceDraftRecovery({...scope,actor:''},draft()),error=>!/IndexedDB/.test(String(error)));
  await assert.rejects(()=>store.writeSourceDraftRecovery(scope,{...draft(),spec:spec('a'.repeat(2097153))}),error=>!/IndexedDB/.test(String(error)));
  await assert.rejects(()=>store.writeSourceDraftRecovery(scope,{...draft(),id:'33333333-3333-4333-8333-333333333333'}),error=>!/IndexedDB/.test(String(error)));
  const command=await createSourceSaveCommand({...scope,lifecycle:'mount-1',epoch:0,baseVersion:1,spec:spec()},'original-key');
  await assert.rejects(()=>store.writeSourceCommandRecovery(scope,JSON.stringify({...command,specHash:'a'.repeat(64)})),error=>!/IndexedDB/.test(String(error)));
  await assert.rejects(()=>store.writeSourceCommandRecovery({...scope,actor:'other'},serializeSourceSaveCommand(command)),error=>!/IndexedDB/.test(String(error)));
  await assert.rejects(()=>store.writeSourceCommandRecovery(scope,'x'.repeat(13697025)),error=>!/IndexedDB/.test(String(error)));
});

test('actual native IndexedDB preserves full2MiB source, exact command, actor boundaries, finite slots and aborted transactions',{skip:process.env.SOURCE_RECOVERY_BROWSER!=='true',timeout:120000},async()=>{
  assert.ok(store);const origin='http://127.0.0.1:3003';
  const bundled=await build({stdin:{contents:"import * as store from './src/ui/source-recovery-store';import * as helper from './src/ui/source-save-command';globalThis.sourceRecovery={...store,...helper};",resolveDir:process.cwd(),loader:'ts'},bundle:true,platform:'browser',format:'iife',write:false});
  const browser=await chromium.launch({headless:true}),context=await browser.newContext(),page=await context.newPage();
  await context.route(url=>url.origin!==origin&&url.protocol!=='data:'&&url.protocol!=='blob:',route=>route.abort('blockedbyclient'));
  try {
    await page.goto(origin);await page.addScriptTag({content:'globalThis.__name=value=>value;\n'+bundled.outputFiles[0].text});
    const proof=await page.evaluate(async()=>{
      const api=(globalThis as unknown as {sourceRecovery:typeof import('../src/ui/source-recovery-store')&typeof import('../src/ui/source-save-command')}).sourceRecovery;
      const s={workspace:'11111111-1111-4111-8111-111111111111',actor:'recovery-owner',email:'22222222-2222-4222-8222-222222222222'};
      const source='\uFEFF'+ 'a'.repeat(2097149),spec:EmailSpec={schema_version:'1.0',editing_mode:'raw_html',locale:'en-US',direction:'ltr',subject:'Original',preheader:'',brand_kit_version_id:'brand-1',theme:{content_width_px:600,background:'#ffffff',accent:'#000000',font_stack:'Arial, sans-serif'},sections:[],raw_html:source},d={id:s.email,title:'Owned recovery',doc_version:1,spec};
      const fail=(message:string)=>{throw Error(message);};
      const rejected=async(fn:()=>Promise<unknown>)=>{try{await fn();return false;}catch{return true;}};
      const command=api.serializeSourceSaveCommand(await api.createSourceSaveCommand({...s,lifecycle:'owned-mount',epoch:1,baseVersion:1,spec},'owned-original-key'));
      let completed=0;const transaction=IDBDatabase.prototype.transaction;
      IDBDatabase.prototype.transaction=function(...args:Parameters<typeof transaction>){const tx=transaction.apply(this,args);if(this.name===api.SOURCE_RECOVERY_DATABASE&&args[1]==='readwrite')tx.addEventListener('complete',()=>{completed++;});return tx;};
      await api.writeSourceDraftRecovery(s,d);if(completed!==1)fail('Draft transaction completion count '+completed);
      await api.writeSourceCommandRecovery(s,command);if(completed!==2)fail('Command transaction completion count '+completed);
      let saved=await api.readSourceRecovery(s);if(saved.draft?.spec.raw_html!==source||saved.command!==command)fail('Exact2MiB source/command recovery failed');
      if(new TextEncoder().encode(saved.draft!.spec.raw_html!).length!==2097152)fail('UTF8 source byte boundary changed');
      const original=JSON.parse(command),later={...d,spec:{...spec,subject:'Later edit'}},nextCommand=api.serializeSourceSaveCommand(await api.createSourceSaveCommand({...s,lifecycle:'owned-mount',epoch:2,baseVersion:1,spec:later.spec},'next-command-key'));
      await api.writeSourceDraftRecovery(s,later);await api.writeSourceCommandRecovery(s,nextCommand);
      await api.removeSourceRecovery(s,{draft:true,command:true,expectedDraft:{docVersion:1,specHash:original.specHash},expectedCommandKey:'owned-original-key'});
      saved=await api.readSourceRecovery(s);if(saved.draft?.spec.subject!=='Later edit'||saved.command!==nextCommand)fail('Old receipt cleanup erased later source or next command');
      await api.removeSourceRecovery(s,{draft:true,command:true,expectedDraft:{docVersion:1,specHash:JSON.parse(nextCommand).specHash},expectedCommandKey:'next-command-key'});if(Object.keys(await api.readSourceRecovery(s)).length)fail('Exact acknowledged cleanup failed');
      await api.writeSourceDraftRecovery(s,d);await api.writeSourceCommandRecovery(s,command);
      const other={...s,actor:'other-actor'};if(Object.keys(await api.readSourceRecovery(other)).length)fail('Different actor read source');await api.removeSourceRecovery(other,{draft:true,command:true});
      if((await api.readSourceRecovery(s)).command!==command)fail('Different actor removed source');
      if(!await rejected(()=>api.readSourceRecovery({...s,actor:''})))fail('Closed actor context accepted');
      if(!await rejected(()=>api.writeSourceDraftRecovery(s,{...d,spec:{...spec,raw_html:source+'x'}})))fail('Oversized source accepted');
      const corrupted=JSON.parse(command);corrupted.specHash='a'.repeat(64);if(!await rejected(()=>api.writeSourceCommandRecovery(s,JSON.stringify(corrupted))))fail('Corrupt fullspec digest persisted');
      corrupted.specHash=JSON.parse(command).specHash;corrupted.source.sha256='b'.repeat(64);if(!await rejected(()=>api.writeSourceCommandRecovery(s,JSON.stringify(corrupted))))fail('Corrupt source digest persisted');
      const put=IDBObjectStore.prototype.put;IDBObjectStore.prototype.put=function(...args:Parameters<typeof put>){const request=put.apply(this,args);request.addEventListener('success',()=>request.transaction!.abort());return request;};
      if(!await rejected(()=>api.writeSourceDraftRecovery(s,{...d,title:'Must rollback'})))fail('Aborted write claimed persistence');IDBObjectStore.prototype.put=put;
      if((await api.readSourceRecovery(s)).draft?.title!=='Owned recovery')fail('Aborted transaction changed saved draft');
      await api.removeSourceRecovery(s,{draft:true});saved=await api.readSourceRecovery(s);if(saved.draft||saved.command!==command)fail('Draft-only removal lost original command');
      await api.writeSourceDraftRecovery(s,d);await api.removeSourceRecovery(s,{command:true});saved=await api.readSourceRecovery(s);if(saved.command||saved.draft?.spec.raw_html!==source)fail('Command-only removal lost source');
      for(let n=1;n<20;n++){const email='33333333-3333-4333-8333-'+String(n).padStart(12,'0');await api.writeSourceDraftRecovery({...s,email},{...d,id:email,spec:{...spec,raw_html:''}});}
      const overflow='44444444-4444-4444-8444-444444444444';if(!await rejected(()=>api.writeSourceDraftRecovery({...s,email:overflow},{...d,id:overflow})))fail('More than20 slot records admitted');
      if((await api.readSourceRecovery(s)).draft?.spec.raw_html!==source)fail('Slot quota erased earlier work');
      // Deliberately corrupt an actual stored record; read must validate rather than restore it.
      const db=await new Promise<IDBDatabase>((resolve,reject)=>{const request=indexedDB.open(api.SOURCE_RECOVERY_DATABASE);request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});
      const key=JSON.stringify([s.workspace,s.actor,s.email]);await new Promise<void>((resolve,reject)=>{const tx=db.transaction('slots','readwrite'),slots=tx.objectStore('slots'),read=slots.get(key);read.onsuccess=()=>{const value=read.result;value.command=JSON.stringify(corrupted);slots.put(value,key);};tx.oncomplete=()=>resolve();tx.onabort=()=>reject(tx.error);});db.close();
      if(!await rejected(()=>api.readSourceRecovery(s)))fail('Corrupt persisted hash was restored');await api.removeSourceRecovery(s,{command:true});
      IDBDatabase.prototype.transaction=transaction;
      await new Promise<void>((resolve,reject)=>{const request=indexedDB.deleteDatabase(api.SOURCE_RECOVERY_DATABASE);request.onsuccess=()=>resolve();request.onerror=()=>reject(request.error);request.onblocked=()=>reject(Error('Owned database deletion blocked'));});
      return {fullSourceBytes:2097152,commandKey:'owned-original-key',slotLimit:20,abortRolledBack:true,hashRejected:true,cleanup:true};
    });
    assert.deepEqual(proof,{fullSourceBytes:2097152,commandKey:'owned-original-key',slotLimit:20,abortRolledBack:true,hashRejected:true,cleanup:true});
    console.log('Actual native IndexedDB full2MiB/transactioncomplete/actor/hash/20slots/conditional cleanup/abort rollback PASS.');
    if(process.env.SOURCE_RECOVERY_PHYSICAL_QUOTA==='true'){
    const cdp=await context.newCDPSession(page);assert.equal(new URL(page.url()).origin,origin);await cdp.send('Storage.overrideQuotaForOrigin',{origin,quotaSize:0});console.log('Owned native quota setup',JSON.stringify(await cdp.send('Storage.getUsageAndQuota',{origin})));
    try{const quota=await page.evaluate(async()=>{const api=(globalThis as unknown as {sourceRecovery:typeof import('../src/ui/source-recovery-store')}).sourceRecovery;const s={workspace:'11111111-1111-4111-8111-111111111111',actor:'quota-owner',email:'55555555-5555-4555-8555-555555555555'},spec:EmailSpec={schema_version:'1.0',editing_mode:'raw_html',locale:'en-US',direction:'ltr',subject:'Original',preheader:'',brand_kit_version_id:'brand-1',theme:{content_width_px:600,background:'#ffffff',accent:'#000000',font_stack:'Arial, sans-serif'},sections:[],raw_html:Array.from({length:32},()=>Array.from(crypto.getRandomValues(new Uint8Array(65536)),n=>String.fromCharCode(33+n%90)).join('')).join('')},d={id:s.email,title:'Keep memory',doc_version:1,spec};const estimate=await navigator.storage.estimate();try{await api.writeSourceDraftRecovery(s,d);return {rejected:false,memoryBytes:d.spec.raw_html!.length,estimate};}catch(error){return {rejected:true,memoryBytes:d.spec.raw_html!.length,name:(error as Error).name,message:String(error),estimate};}});console.log('Owned native quota outcome',JSON.stringify(quota));assert.equal(quota.rejected,true);assert.equal(quota.memoryBytes,2097152);assert.equal(quota.name,'QuotaExceededError');console.log('Actual native IndexedDB full2MiB/transactioncomplete/actor/hash/20slots/abort and physical quota refusal PASS.');}finally{await cdp.send('Storage.overrideQuotaForOrigin',{origin});await cdp.detach();}
    }else console.log('Physical origin quota qualification remains open; no physical quota probe performed.');
  }finally{
    if(!page.isClosed())await page.evaluate(()=>new Promise<void>((resolve,reject)=>{const request=indexedDB.deleteDatabase('lettercape-source-recovery-1');request.onsuccess=()=>resolve();request.onerror=()=>reject(request.error);request.onblocked=()=>reject(Error('Exact owned recovery database cleanup blocked'));}));
    await browser.close();
  }
});
