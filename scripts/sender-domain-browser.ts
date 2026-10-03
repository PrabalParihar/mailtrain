import assert from 'node:assert/strict';
import {randomUUID,randomBytes} from 'node:crypto';
import pg from 'pg';
import env from '@next/env';
import {chromium} from 'playwright';
import {digest} from '../src/server/audit';
import type {SenderData} from '../src/domain/sender-domain';
env.loadEnvConfig(process.cwd());
const origin=process.env.APP_ORIGIN??'http://127.0.0.1:3003';
if(process.env.LOCAL_DEVELOPMENT!=='true'||!['localhost','127.0.0.1'].includes(new URL(origin).hostname))throw new Error('Owned local sender browser fixture required.');
const db=new pg.Pool({connectionString:process.env.MIGRATION_DATABASE_URL}),workspace=randomUUID(),other=randomUUID(),user='sender-browser-'+randomUUID(),cookie=randomBytes(32).toString('hex');
let browser:Awaited<ReturnType<typeof chromium.launch>>|undefined;
async function call(path:string,method='GET',body?:unknown,key=randomUUID(),scope=workspace) {
 const r=await fetch(origin+'/v1/'+path,{method,headers:{Origin:origin,'Content-Type':'application/json','Idempotency-Key':key,Cookie:'mailcraft_local_session='+cookie,'X-Workspace-Id':scope},body:body===undefined?undefined:JSON.stringify(body)});
 return {r,j:await r.json()};
}
function draft(sender:SenderData,name=sender.name) {return {name,provider:sender.provider,account_label:sender.account_label,region:sender.region,from_name:sender.from_name,from_address:sender.from_address,reply_to:sender.reply_to};}
async function current(id:string):Promise<SenderData>{const result=await call('sender-identities/'+id);assert.equal(result.r.status,200);return result.j.sender;}
async function advance(id:string,name:string) {const sender=await current(id),result=await call('sender-identities/'+id+'/versions','POST',{...draft(sender,name),expected_version:sender.version});assert.equal(result.r.status,200);return result.j.sender as SenderData;}
try {
 await db.query("INSERT INTO workspaces(id,name)VALUES($1,'Owned sender browser'),($2,'Owned sender other')",[workspace,other]);
 for(const w of [workspace,other])await db.query("INSERT INTO memberships(workspace_id,user_id,role)VALUES($1,$2,'Owner')",[w,user]);
 await db.query("INSERT INTO auth_sessions(token_hash,user_id,expires_at)VALUES($1,$2,clock_timestamp()+interval '1 hour')",[digest(cookie),user]);
 browser=await chromium.launch({headless:true});
 const context=await browser.newContext({viewport:{width:390,height:844}});
 await context.addCookies([{name:'mailcraft_local_session',value:cookie,url:origin,sameSite:'Strict'}]);
 await context.addInitScript(w=>{if(!localStorage.getItem('mailcraft.workspace'))localStorage.setItem('mailcraft.workspace',w);},workspace);
 const page=await context.newPage(),panel=page.getByRole('region',{name:'Sender domains',exact:true});
 if(process.argv.includes('--controls-red')) {
  await page.goto(origin+'/app/delivery');await panel.getByRole('button',{name:'Save sender draft',exact:true}).waitFor({timeout:3000});
  console.log('Sender controls present.');
 }else {
  await page.route('**/v1/sender-identities?*',route=>route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:{code:'OWNED_INITIAL_FAILURE',message:'Owned sender list unavailable'}})}));
  await page.goto(origin+'/app/delivery');await panel.getByRole('alert').filter({hasText:'Owned sender list unavailable'}).waitFor();
  assert.equal(await panel.getByRole('button',{name:'Save sender draft',exact:true}).isDisabled(),true);
  await page.unroute('**/v1/sender-identities?*');await panel.getByRole('button',{name:'Refresh sender drafts',exact:true}).click();
  await panel.getByText('No sender drafts yet.',{exact:true}).waitFor();
  const name=panel.getByLabel('Sender draft name',{exact:true}),from=panel.getByLabel('From address',{exact:true}),account=panel.getByLabel('Provider account label',{exact:true});
  await name.fill('Owned sender');await account.fill('Operator reference');await panel.getByLabel('Provider region',{exact:true}).fill('us-east-1');await panel.getByLabel('From name',{exact:true}).fill('Owned team');await from.fill('invalid email');
  await page.reload();await name.waitFor();assert.equal(await name.inputValue(),'Owned sender');assert.equal(await from.inputValue(),'invalid email');assert.equal(await panel.getByRole('button',{name:'Save sender draft',exact:true}).isDisabled(),true);
  for(const [label,max] of [['Sender draft name',100],['Provider account label',100],['Provider region',40],['From name',100],['From address',254],['Reply-to address (optional)',254]] as const)assert.equal(await panel.getByLabel(label,{exact:true}).getAttribute('maxlength'),String(max));
  await from.fill('team@example.test');
  const createRequests:{key:string;body:string}[]=[];
  await page.route('**/v1/sender-identities',async route=>{if(route.request().method()!=='POST'){await route.continue();return;}createRequests.push({key:route.request().headers()['idempotency-key'],body:route.request().postData()!});assert.equal((await route.fetch()).status(),201);await route.abort('failed');});
  await panel.getByRole('button',{name:'Save sender draft',exact:true}).evaluate((button:HTMLButtonElement)=>{button.click();button.click();});
  await panel.getByRole('alert').filter({hasText:/fetch|Failed/i}).waitFor();await panel.getByRole('button',{name:'Retry original sender command',exact:true}).waitFor();assert.equal(createRequests.length,1);
  await page.unroute('**/v1/sender-identities');await page.reload();await panel.getByRole('button',{name:'Retry original sender command',exact:true}).waitFor();
  await page.route('**/v1/sender-identities',async route=>{if(route.request().method()==='POST')createRequests.push({key:route.request().headers()['idempotency-key'],body:route.request().postData()!});await route.continue();});
  await panel.getByRole('button',{name:'Retry original sender command',exact:true}).click();await panel.getByRole('button',{name:'Save new sender version',exact:true}).waitFor();await page.unroute('**/v1/sender-identities');
  assert.deepEqual(createRequests[1],createRequests[0]);const listed=await call('sender-identities');assert.equal(listed.j.total_count,1);const id=listed.j.data[0].id as string;
  assert.equal((await current(id)).version,1);
  const save=panel.getByRole('button',{name:'Save new sender version',exact:true}),observe=panel.getByRole('button',{name:'Observe saved domain DNS',exact:true}),reload=panel.getByRole('button',{name:'Reload saved sender (replace working edits)',exact:true});
  await name.fill('');await page.reload();await name.waitFor();assert.equal(await name.inputValue(),'');assert.equal(await save.isDisabled(),true);assert.equal(await observe.isDisabled(),true);assert.equal((await current(id)).version,1);
  await name.fill('Owned version two');const versionRequests:{key:string;body:string}[]=[];
  const versionURL='**/v1/sender-identities/'+id+'/versions';
  await page.route(versionURL,async route=>{versionRequests.push({key:route.request().headers()['idempotency-key'],body:route.request().postData()!});assert.equal((await route.fetch()).status(),200);await route.abort('failed');});
  await save.evaluate((button:HTMLButtonElement)=>{button.click();button.click();});await panel.getByRole('alert').filter({hasText:/fetch|Failed/i}).waitFor();assert.equal(versionRequests.length,1);assert.equal((await current(id)).version,2);
  await page.unroute(versionURL);await page.reload();await panel.getByRole('button',{name:'Retry original sender command',exact:true}).waitFor();
  await db.query("UPDATE memberships SET role='Viewer'WHERE workspace_id=$1 AND user_id=$2",[workspace,user]);
  const denial=page.waitForResponse(response=>response.url().endsWith('/sender-identities/'+id+'/versions')&&response.status()===403);
  await panel.getByRole('button',{name:'Retry original sender command',exact:true}).click();await denial;
  assert.equal(await panel.getByRole('button',{name:'Retry original sender command',exact:true}).isDisabled(),true);
  const stored=await page.evaluate(({w,id,actor})=>JSON.parse(localStorage.getItem('lettercape.sender-form.'+JSON.stringify([w,actor,id]))!),{w:workspace,id,actor:user});assert.deepEqual(stored.pending.key,versionRequests[0].key);assert.equal(stored.pending.actor_id,user);assert.equal(stored.base.version,1);
  await db.query("UPDATE memberships SET role='Owner'WHERE workspace_id=$1 AND user_id=$2",[workspace,user]);await page.reload();await panel.getByRole('button',{name:'Retry original sender command',exact:true}).waitFor();
  await page.route(versionURL,async route=>{versionRequests.push({key:route.request().headers()['idempotency-key'],body:route.request().postData()!});await route.continue();});
  await panel.getByRole('button',{name:'Retry original sender command',exact:true}).click();await panel.getByRole('status').filter({hasText:'Sender draft saved.'}).waitFor();await page.unroute(versionURL);assert.deepEqual(versionRequests[1],versionRequests[0]);assert.equal((await current(id)).version,2);
  const dnsURL='**/v1/sender-identities/'+id+'/dns-checks',dnsRequests:{key:string;body:string}[]=[];
  await page.route(dnsURL,async route=>{dnsRequests.push({key:route.request().headers()['idempotency-key'],body:route.request().postData()!});assert.equal((await route.fetch()).status(),200);await route.abort('failed');});
  await observe.evaluate((button:HTMLButtonElement)=>{button.click();button.click();});await panel.getByRole('alert').filter({hasText:/fetch|Failed/i}).waitFor();assert.equal(dnsRequests.length,1);assert.equal((await call('sender-identities/'+id+'/dns-checks')).j.total_count,1);
  await page.unroute(dnsURL);await page.reload();await panel.getByRole('button',{name:'Retry original sender command',exact:true}).waitFor();
  await page.route(dnsURL,async route=>{dnsRequests.push({key:route.request().headers()['idempotency-key'],body:route.request().postData()!});await route.continue();});
  await panel.getByRole('button',{name:'Retry original sender command',exact:true}).click();await panel.getByRole('status').filter({hasText:'DNS observation saved for v2.'}).waitFor();await page.unroute(dnsURL);
  assert.deepEqual(dnsRequests[1],dnsRequests[0]);assert.equal((await call('sender-identities/'+id+'/dns-checks')).j.total_count,1);await panel.getByText(/reserved domain/).first().waitFor();
  await from.fill('news@news.example.test');await save.click();await panel.getByRole('status').filter({hasText:'Sender draft saved.'}).waitFor();assert.equal((await current(id)).version,3);await panel.getByText(/Sender v2 · Older-version evidence/).waitFor();
  // An old receipt cannot advance the form to an unrelated newer current version.
  await name.fill('Original v4 working text');await page.route(versionURL,async route=>{assert.equal((await route.fetch()).status(),200);await route.abort('failed');});await save.click();await panel.getByRole('alert').filter({hasText:/fetch|Failed/i}).waitFor();
  await page.unroute(versionURL);await advance(id,'External newer v5');await panel.getByRole('button',{name:'Retry original sender command',exact:true}).click();await panel.getByRole('status').filter({hasText:'A newer saved version exists.'}).waitFor();
  assert.equal(await name.inputValue(),'Original v4 working text');await panel.getByText(/Acknowledged saved version v3:/).waitFor();assert.equal(await save.isDisabled(),true);
  await reload.click();await panel.getByRole('status').filter({hasText:'Saved sender loaded. Working edits were replaced.'}).waitFor();assert.equal(await name.inputValue(),'External newer v5');
  await name.fill('CAS working text');await advance(id,'External newer v6');await save.click();await panel.getByRole('alert').first().waitFor();await panel.getByRole('button',{name:'Retry original sender command',exact:true}).waitFor();assert.equal(await name.inputValue(),'CAS working text');await panel.getByText(/Acknowledged saved version v5:/).waitFor();
  await page.reload();await panel.getByRole('button',{name:'Retry original sender command',exact:true}).waitFor();assert.equal(await name.inputValue(),'CAS working text');await reload.click();await panel.getByRole('status').filter({hasText:'Saved sender loaded. Working edits were replaced.'}).waitFor();
  for(let version=7;version<=12;version++)await advance(id,'History v'+version);
  await reload.click();await panel.getByRole('status').filter({hasText:'Saved sender loaded. Working edits were replaced.'}).waitFor();await panel.getByRole('button',{name:'Refresh sender versions',exact:true}).click();
  const versionHistory=panel.getByRole('region',{name:'Sender version history',exact:true});await versionHistory.getByRole('button',{name:'Load older sender versions',exact:true}).click();await versionHistory.getByText('v3 · Owned version two',{exact:true}).waitFor();
  if(await versionHistory.getByRole('button',{name:'Load older sender versions',exact:true}).count())await versionHistory.getByRole('button',{name:'Load older sender versions',exact:true}).click();
  await versionHistory.getByRole('button',{name:'Use version 1 as working draft',exact:true}).click();assert.equal(await name.inputValue(),'Owned sender');assert.equal(await from.inputValue(),'team@example.test');await panel.getByText(/Acknowledged saved version v12:/).waitFor();await save.click();await panel.getByRole('status').filter({hasText:'Sender draft saved.'}).waitFor();assert.equal((await current(id)).version,13);
  // Trusted fixture insertion marks old evidence without DNS queries or rewriting immutable history.
  const old=(await call('sender-identities/'+id+'/dns-checks')).j.data[0],stale={...old.observation,observed_at:new Date(Date.now()-16*60*1000).toISOString()};
  for(let i=0;i<6;i++)await db.query('INSERT INTO domain_checks(workspace_id,sender_id,sender_version,observation,created_by)VALUES($1,$2,$3,$4,$5)',[workspace,id,old.sender_version,JSON.stringify(stale),user]);
  await panel.getByRole('button',{name:'Refresh DNS observations',exact:true}).click();const history=panel.getByRole('region',{name:'DNS observation history',exact:true});await history.getByText(/Stale evidence/).first().waitFor();await history.getByRole('button',{name:'Load older DNS observations',exact:true}).click();await history.locator('li').nth(6).waitFor();assert.equal(await history.locator('li').count(),7);
  assert.equal(await panel.getByRole('button',{name:'Provider account setup unavailable',exact:true}).isDisabled(),true);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await panel.locator('h2').scrollIntoViewIfNeeded();await page.screenshot({path:'/tmp/lettercape-sender-domain-mobile.png'});
  console.log('Sender Chromium saved/invalid/lost-create/version/DNS/CAS/current-role/history/390px PASS; all DNS names reserved, no network resolver queries.');
  await context.addInitScript(()=>{const original=Storage.prototype.setItem;Storage.prototype.setItem=function(key:string,value:string){if(key.startsWith('lettercape.sender-'))throw new DOMException('Owned quota fixture','QuotaExceededError');return original.call(this,key,value);};});
  await page.reload();await name.waitFor();await account.fill('Tab-only account edit');await panel.getByText(/Browser storage is unavailable/).waitFor();
  async function visit(section:'Reports'|'Delivery'){
   const toggle=page.getByRole('button',{name:'Open navigation',exact:true});await toggle.click();
   const link=page.getByRole('link',{name:section,exact:true}),href=await link.getAttribute('href');assert.equal(href,section==='Reports'?'/app/reports':'/app/delivery');
   await link.click();await page.waitForURL(url=>url.pathname===href);
   await page.getByRole('heading',{name:section==='Reports'?'Know what actually happened.':'Sending starts with trust.',exact:true}).waitFor();
   await page.locator('#workspace-navigation:not(.open)').waitFor({state:'attached'});assert.equal(await toggle.getAttribute('aria-expanded'),'false');
  }
  await visit('Reports');await visit('Delivery');await account.waitFor();assert.equal(await account.inputValue(),'Tab-only account edit');
  async function switchWorkspace(w:string){await page.getByRole('button',{name:'Open navigation',exact:true}).click();await page.getByLabel('Active brand workspace',{exact:true}).selectOption(w);await page.waitForURL(url=>url.pathname==='/app');await visit('Delivery');}
  await switchWorkspace(other);await panel.getByText('No sender drafts yet.',{exact:true}).waitFor();assert.equal(await account.inputValue(),'');await switchWorkspace(workspace);await account.waitFor();assert.equal(await account.inputValue(),'Tab-only account edit');
  const dialog=page.waitForEvent('dialog');const attemptedReload=page.reload().catch(()=>null);await (await dialog).dismiss();await attemptedReload;assert.equal(await account.inputValue(),'Tab-only account edit');
  console.log('Sender Chromium tab-only quota/workspace/navigation/unload protection PASS.');
  // Start a detail read, switch workspace, then release the old response.
  await reload.click();await panel.getByRole('status').filter({hasText:'Saved sender loaded. Working edits were replaced.'}).waitFor();
  let release!:()=>void,started!:()=>void;const delayed=new Promise<void>(resolve=>{release=resolve;}),ready=new Promise<void>(resolve=>{started=resolve;});
  const detailURL='**/v1/sender-identities/'+id;
  await page.route(detailURL,async route=>{const response=await route.fetch();started();await delayed;try{await route.fulfill({response});}catch{/* Old mounted editor was discarded. */}});
  await reload.click();await ready;await switchWorkspace(other);release();await page.unroute(detailURL);await panel.getByText('No sender drafts yet.',{exact:true}).waitFor();assert.equal(await account.inputValue(),'');
  await db.query("UPDATE memberships SET role='Viewer'WHERE workspace_id=$1 AND user_id=$2",[other,user]);await page.reload();await panel.getByText('Owner or Admin access is required to manage sender drafts and DNS observations.',{exact:true}).waitFor();assert.equal(await panel.getByRole('button',{name:'Save sender draft',exact:true}).count(),0);
  console.log('Sender Chromium delayed old-workspace response fence and Viewer refusal PASS.');
 }
}finally {
 await browser?.close();
 for(const w of [workspace,other]) {
  for(const table of ['idempotency','api_rate_events','domain_checks','sender_identities','audit_events','memberships'])await db.query('DELETE FROM '+table+' WHERE workspace_id=$1',[w]);
  await db.query('DELETE FROM workspaces WHERE id=$1',[w]);
 }
 await db.query('DELETE FROM auth_sessions WHERE user_id=$1',[user]);await db.end();
}
