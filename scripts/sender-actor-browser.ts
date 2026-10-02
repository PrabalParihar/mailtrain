import assert from 'node:assert/strict';
import {randomUUID,randomBytes} from 'node:crypto';
import pg from 'pg';
import env from '@next/env';
import {chromium} from 'playwright';
import {digest} from '../src/server/audit';
env.loadEnvConfig(process.cwd());
const origin=process.env.APP_ORIGIN??'http://127.0.0.1:3003';
if(process.env.LOCAL_DEVELOPMENT!=='true'||!['127.0.0.1','localhost'].includes(new URL(origin).hostname))throw Error('Owned local actor fixtures required.');
const db=new pg.Pool({connectionString:process.env.MIGRATION_DATABASE_URL}),workspace=randomUUID(),users=['sender-actor-A-'+randomUUID(),'sender-actor-B-'+randomUUID()],cookies=users.map(()=>randomBytes(32).toString('hex'));
let browser:Awaited<ReturnType<typeof chromium.launch>>|undefined;
try{
 await db.query("INSERT INTO workspaces(id,name,api_rpm)VALUES($1,'Owned sender actor recovery',1000)",[workspace]);
 for(let index=0;index<2;index++){await db.query("INSERT INTO memberships(workspace_id,user_id,role)VALUES($1,$2,'Owner')",[workspace,users[index]]);await db.query("INSERT INTO auth_sessions(token_hash,user_id,expires_at)VALUES($1,$2,clock_timestamp()+interval '1 hour')",[digest(cookies[index]),users[index]]);}
 browser=await chromium.launch({headless:true});const context=await browser.newContext({viewport:{width:390,height:844}});const login=async(index:number)=>context.addCookies([{name:'mailcraft_local_session',value:cookies[index],url:origin,sameSite:'Strict'}]);await login(0);await context.addInitScript(w=>localStorage.setItem('mailcraft.workspace',w),workspace);
 const page=await context.newPage(),panel=page.getByRole('region',{name:'Sender domains',exact:true});await page.goto(origin+'/app/delivery');await panel.getByText('No sender drafts yet.',{exact:true}).waitFor();
 for(const[label,value]of [['Sender draft name','Actor A original'],['Provider account label','A intended account'],['Provider region','us-east-1'],['From name','Owned actor'],['From address','owned@actor.test']])await panel.getByLabel(label,{exact:true}).fill(value);
 let original:{key:string;body:string}|undefined;
 await page.route('**/v1/sender-identities',async route=>{if(route.request().method()!=='POST')return route.continue();original={key:route.request().headers()['idempotency-key'],body:route.request().postData()!};assert.equal((await route.fetch()).status(),201);await route.abort('failed');});await panel.getByRole('button',{name:'Save sender draft',exact:true}).click();await panel.getByRole('alert').filter({hasText:/fetch|Failed/i}).waitFor();await page.unroute('**/v1/sender-identities');
 const count=async()=>Number((await db.query('SELECT count(*)::int AS count FROM sender_identities WHERE workspace_id=$1',[workspace])).rows[0].count);assert.equal(await count(),1);
 await login(1);
 const changedResponse=page.waitForResponse(response=>response.url().endsWith('/v1/sender-identities')&&response.request().method()==='POST');await panel.getByRole('button',{name:'Retry original sender command',exact:true}).click();const changed=await changedResponse;assert.equal(changed.status(),409);assert.equal((await changed.json()).error.code,'ACTOR_CHANGED');assert.equal(await count(),1);await panel.getByRole('alert').filter({hasText:'Your signed-in account changed.'}).waitFor();
 await page.reload();await panel.getByLabel('Sender draft name',{exact:true}).waitFor();
 // Exercise the old unsafe behavior when present, then require the safe durable count.
 if(await panel.getByRole('button',{name:'Retry original sender command',exact:true}).count()){
  await panel.getByRole('button',{name:'Retry original sender command',exact:true}).click();await panel.getByRole('button',{name:'Save new sender version',exact:true}).waitFor();
 }
 assert.equal(await count(),1,'A different actor must not create a duplicate by recovering the original command.');
 assert.equal(await panel.getByRole('button',{name:'Retry original sender command',exact:true}).count(),0);assert.equal(await panel.getByLabel('Sender draft name',{exact:true}).inputValue(),'');
 await login(0);await page.reload();await panel.getByRole('button',{name:'Retry original sender command',exact:true}).waitFor();assert.equal(await panel.getByLabel('Sender draft name',{exact:true}).inputValue(),'Actor A original');
 let replay:typeof original;await page.route('**/v1/sender-identities',async route=>{if(route.request().method()==='POST')replay={key:route.request().headers()['idempotency-key'],body:route.request().postData()!};await route.continue();});await panel.getByRole('button',{name:'Retry original sender command',exact:true}).click();await panel.getByRole('button',{name:'Save new sender version',exact:true}).waitFor();assert.deepEqual(replay,original);assert.equal(await count(),1);
 await page.unroute('**/v1/sender-identities');
 // Keep old unbound data intact, while refusing to recover it into an actor's namespace.
 const legacy=JSON.stringify({base:null,working:{name:'Unbound legacy sender',provider:'ses',account_label:'Legacy reference',region:'us-east-1',from_name:'Owned actor',from_address:'owned@actor.test',reply_to:''},pending:{kind:'create',path:'sender-identities',key:original!.key,body:original!.body}});
 await page.evaluate(({w,raw})=>localStorage.setItem('lettercape.sender-form.'+w+'.new',raw),{w:workspace,raw:legacy});await panel.getByLabel('Saved sender draft').selectOption('new');await panel.getByRole('button',{name:'Load selected sender',exact:true}).click();await panel.getByLabel('Sender draft name',{exact:true}).waitFor();assert.equal(await panel.getByLabel('Sender draft name',{exact:true}).inputValue(),'');assert.equal(await panel.getByRole('button',{name:'Retry original sender command',exact:true}).count(),0);assert.equal(await page.evaluate(w=>localStorage.getItem('lettercape.sender-form.'+w+'.new'),workspace),legacy);
 // A fetched actor-A detail is held while the same browser opens actor-B's controller.
 let release!:()=>void,entered!:()=>void;const gate=new Promise<void>(resolve=>{release=resolve;}),ready=new Promise<void>(resolve=>{entered=resolve;});
 await page.route('**/v1/sender-identities/*',async route=>{if(route.request().method()!=='GET'||!/^\/v1\/sender-identities\/[^/]+$/.test(new URL(route.request().url()).pathname))return route.continue();const response=await route.fetch();entered();await gate;await route.fulfill({response}).catch(()=>{});});
 const saved=(await db.query('SELECT id FROM sender_identities WHERE workspace_id=$1',[workspace])).rows[0].id;await panel.getByLabel('Saved sender draft').selectOption(saved);await panel.getByRole('button',{name:'Load selected sender',exact:true}).click();await ready;await login(1);await page.reload();await panel.getByLabel('Sender draft name',{exact:true}).waitFor();release();await page.unrouteAll({behavior:'wait'});assert.equal(await panel.getByLabel('Sender draft name',{exact:true}).inputValue(),'');assert.equal(await panel.getByRole('button',{name:'Retry original sender command',exact:true}).count(),0);assert.equal(await count(),1);
 console.log('Sender actor Chromium PASS: mounted account-change409, same-role B isolation, A original exact receipt recovery, legacy unbound preservation/refusal and delayed old-actor response fence; one durable sender.');
}finally{await browser?.close();for(const table of ['idempotency','api_rate_events','domain_checks','sender_identities','audit_events','memberships'])await db.query('DELETE FROM '+table+' WHERE workspace_id=$1',[workspace]);await db.query('DELETE FROM workspaces WHERE id=$1',[workspace]);await db.query('DELETE FROM auth_sessions WHERE user_id=ANY($1::text[])',[users]);await db.end();}
