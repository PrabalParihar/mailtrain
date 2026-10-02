import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';
const origin=process.env.APP_ORIGIN??'http://127.0.0.1:3003',address=new URL(origin);
assert.equal(address.hostname,'127.0.0.1');assert.equal(address.protocol,'http:');assert.ok(['3002','3003'].includes(address.port)||(process.env.CI==='true'&&address.port==='3000'));
const browser=await chromium.launch({headless:true});
const context=await browser.newContext();
const external=[];await context.route(url=>url.origin!==origin,route=>{external.push(route.request().url());return route.abort('blockedbyclient');});
const page=await context.newPage();const errors=[];page.on('pageerror',error=>errors.push({message:error.message,stack:error.stack}));
await page.addInitScript(()=>{
 const NativeWorker=globalThis.Worker;
 globalThis.__completionProof={requests:[],messages:[],held:[],release:false,workerUrls:[]};
 globalThis.Worker=class HeldCompletionWorker extends NativeWorker{
  constructor(url,options){super(url,options);this.__pendingCompletion=new Set();const state=globalThis.__completionProof;state.workerUrls.push(String(url));this.addEventListener('message',event=>{const m=event.data;if(state.release)return;if(m?.type===1&&this.__pendingCompletion.has(String(m.seq))){event.stopImmediatePropagation();state.held.push({worker:this,message:m,result_items:Array.isArray(m.res?.items)?m.res.items.length:null});}},true);}
  postMessage(message,transfer){globalThis.__completionProof.messages.push(message);if(message?.type===0&&(message.method==='doComplete'||message.method==='$fmr'&&message.args?.[0]==='doComplete')){this.__pendingCompletion.add(String(message.req));globalThis.__completionProof.requests.push({method:message.method,req:message.req,args:message.args});}return super.postMessage(message,transfer??[]);}
 };
});
try{
 await page.goto(origin+'/code-editor/manifest.json');
 const manifest=await page.evaluate(async()=>await(await fetch('/code-editor/manifest.json')).json());
 const created=await page.evaluate(async manifest=>{
  const css=document.createElement('link');css.rel='stylesheet';css.href=manifest.stylesheet;document.head.append(css);await new Promise((resolve,reject)=>{css.onload=resolve;css.onerror=reject;});
  const runtime=await import(manifest.module);const host=document.createElement('div');host.style.cssText='height:220px;width:650px';document.body.append(host);const handle=runtime.create(host,{value:'<',readOnly:false,label:'Owned held completion proof'},()=>{});globalThis.__proofRuntime=runtime;globalThis.__proofHandle=handle;globalThis.__proofHost=host;handle.focus();return{model_count:runtime.getActiveModelCount(),host_nodes:host.childElementCount};
 },manifest);assert.equal(created.model_count,1);
 await page.getByRole('textbox',{name:'Owned held completion proof',exact:true}).focus();
 const end=await page.evaluate(()=>/Mac/.test(navigator.platform)?'Meta+ArrowDown':'Control+End');await page.keyboard.press(end);
 for(let n=0;n<5;n++){await page.keyboard.press('Control+Space');try{await page.waitForFunction(()=>globalThis.__completionProof.held.length>0,{},{timeout:1200});break;}catch{}}
 const held=await page.evaluate(()=>({requests:globalThis.__completionProof.requests,held:globalThis.__completionProof.held.map(h=>({seq:h.message.seq,result_items:h.result_items})),workers:globalThis.__completionProof.workerUrls}));assert(held.requests.length>0,'real worker doComplete requested');assert(held.held.length>0,'real worker completion reply held');assert(held.held.some(h=>h.result_items>0),'real worker produced actual HTML completion items');assert.equal(errors.length,0,'No page error before model disposal');
 const disposed=await page.evaluate(()=>{globalThis.__proofHandle.dispose();globalThis.__proofHandle.dispose();return{model_count:globalThis.__proofRuntime.getActiveModelCount(),host_nodes:globalThis.__proofHost.childElementCount};});assert.equal(disposed.model_count,0);assert.equal(disposed.host_nodes,0);
 await page.evaluate(()=>{const state=globalThis.__completionProof;state.release=true;for(const held of state.held)held.worker.dispatchEvent(new MessageEvent('message',{data:held.message}));});
 await page.waitForTimeout(500);
 // Also require live language completion to remain available. A disabled
 // provider could otherwise make a cancellation-only check misleading.
 await page.evaluate(()=>{const runtime=globalThis.__proofRuntime,host=globalThis.__proofHost;const handle=runtime.create(host,{value:'<',readOnly:false,label:'Owned live completion proof'},()=>{});globalThis.__proofHandle=handle;handle.focus();});
 await page.keyboard.press(end);await page.keyboard.press('Control+Space');
 await page.locator('.suggest-widget.visible').waitFor({state:'visible'});
 const live={models:await page.evaluate(()=>globalThis.__proofRuntime.getActiveModelCount()),visible_items:await page.locator('.suggest-widget.visible .monaco-list-row').count()};assert.equal(live.models,1);assert.ok(live.visible_items>0,'Live HTML completion must show real suggestions');
 await page.screenshot({path:'/tmp/lettercape-monaco-live-completion.png'});
 await page.evaluate(()=>globalThis.__proofHandle.dispose());assert.equal(await page.evaluate(()=>globalThis.__proofRuntime.getActiveModelCount()),0);
 const result={at:new Date().toISOString(),origin,manifest,created,held,disposed,live,errors,external_requests:external,status:errors.length?'RED':'GREEN'};
 await writeFile('/tmp/lettercape-monaco-late-completion-current.json',JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify(result,null,2));
 assert.deepEqual(errors,[],'Real held-completion release after dispose must have zero uncaught page errors');
}catch(error){const state=await page.evaluate(()=>({requests:globalThis.__completionProof.requests,messages:globalThis.__completionProof.messages,held:globalThis.__completionProof.held.map(h=>({seq:h.message.seq,result_items:h.result_items})),workers:globalThis.__completionProof.workerUrls,active:document.activeElement?.outerHTML.slice(0,500)}));console.log(JSON.stringify({failure_diagnostic:state},null,2));console.error(error);process.exitCode=1;}finally{await browser.close();}
