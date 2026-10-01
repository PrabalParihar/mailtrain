import assert from 'node:assert/strict';
import { randomUUID, randomBytes } from 'node:crypto';
import pg from 'pg';
import env from '@next/env';
import { chromium } from 'playwright';
import { digest } from '../src/server/audit';
import { issuePreferenceToken } from '../src/server/preferences';
import { closeDb } from '../src/server/db';
import { EventEnvelope } from '../src/domain/events';
import { apiSpec, validateSchema, absoluteSchema } from './api-validation';
env.loadEnvConfig(process.cwd());
const origin=process.env.APP_ORIGIN??'http://127.0.0.1:3000';
if(process.env.LOCAL_DEVELOPMENT!=='true'||!['localhost','127.0.0.1'].includes(new URL(origin).hostname))throw new Error('Owned local event fixtures only');
const db=new pg.Pool({connectionString:process.env.MIGRATION_DATABASE_URL});
const w=randomUUID(),other=randomUUID(),user='event-http-'+randomUUID(),cookie=randomBytes(32).toString('hex'),topic=randomUUID();
let browser:Awaited<ReturnType<typeof chromium.launch>>|undefined;
async function call(path:string,method='GET',body?:unknown,workspace=w,secret?:string,key=randomUUID()){
 const r=await fetch(origin+'/v1/'+path,{method,headers:{Origin:origin,'Content-Type':'application/json','Idempotency-Key':key,...(secret?{Authorization:'Bearer '+secret}:{Cookie:'mailcraft_local_session='+cookie,'X-Workspace-Id':workspace})},body:body===undefined?undefined:JSON.stringify(body)});
 return {r,j:await r.json()};
}
async function recipient(path:string,body:Record<string,string>){return fetch(origin+path,{method:'POST',headers:{Origin:origin,'Content-Type':'application/x-www-form-urlencoded',Accept:'application/json'},body:new URLSearchParams(body),redirect:'manual'});}
try{
 await db.query('INSERT INTO workspaces(id,name)VALUES($1,$3),($2,$3)',[w,other,'Event HTTP fixture']);
 await db.query("INSERT INTO memberships(workspace_id,user_id,role)VALUES($1,$3,'Owner'),($2,$3,'Owner')",[w,other,user]);
 await db.query("INSERT INTO auth_sessions(token_hash,user_id,expires_at)VALUES($1,$2,now()+interval '1 hour')",[digest(cookie),user]);
 const empty=await call('events');assert.equal(empty.r.status,200,'Versioned event history endpoint');assert.equal(empty.j.total_count,0);
 assert.equal((await call('events','POST',{})).r.status,405);
 const legacy=randomUUID();await db.query("INSERT INTO outbox(workspace_id,id,type,aggregate_id,data)VALUES($1,$2,'legacy.private',$3,'{\"email\":\"never-expose@example.org\"}')",[w,legacy,randomUUID()]);
 assert.equal((await call('events/'+legacy)).r.status,404);
 browser=await chromium.launch({headless:true});const context=await browser.newContext({viewport:{width:390,height:844}});
 await context.addInitScript((workspace)=>localStorage.setItem('mailcraft.workspace',workspace),w);
 await context.addCookies([{name:'mailcraft_local_session',value:cookie,url:origin,sameSite:'Strict'}]);
 const page=await context.newPage();await page.goto(origin+'/app/settings');const panel=page.locator('.events-panel');
 await panel.getByText('No new versioned event yet.',{exact:true}).waitFor();assert.match(await panel.innerText(),/Outbound webhook delivery is unconfigured/);
 for(let i=0;i<26;i++){
  const contact=randomUUID();await db.query("INSERT INTO contacts(workspace_id,id,email_original,email_lookup,subscription)VALUES($1,$2,$3,$3,'subscribed')",[w,contact,'event'+i+'@example.org']);
  const token=await issuePreferenceToken(w,contact);const path='/preferences/'+token+'/unsubscribe';
  assert.equal((await recipient(path,{human_confirmation:'unsubscribe'})).status,303);
  assert.equal((await recipient(path,{human_confirmation:'unsubscribe'})).status,303);
  const rows=(await db.query('SELECT event_body FROM outbox WHERE workspace_id=$1 AND aggregate_id=$2',[w,contact])).rows;
  assert.equal(rows.length,1);const event=EventEnvelope.parse(JSON.parse(rows[0].event_body));assert.equal(event.type,'contact.unsubscribed');
  assert.equal(event.aggregate.version,(await db.query('SELECT consent_version FROM contacts WHERE id=$1',[contact])).rows[0].consent_version);
 }
 const contact=randomUUID();await db.query("INSERT INTO contacts(workspace_id,id,email_original,email_lookup,subscription)VALUES($1,$2,'topic-event@example.org','topic-event@example.org','subscribed')",[w,contact]);
 await db.query("INSERT INTO lists(workspace_id,id,name)VALUES($1,$2,'Event topic')",[w,topic]);
 await db.query("INSERT INTO topic_subscriptions(workspace_id,contact_id,topic_id,subscription)VALUES($1,$2,$3,'subscribed')",[w,contact,topic]);
 const topicToken=await issuePreferenceToken(w,contact,topic);
 assert.equal((await recipient('/preferences/'+topicToken+'/unsubscribe',{'List-Unsubscribe':'One-Click'})).status,200);
 assert.equal((await recipient('/preferences/'+topicToken+'/unsubscribe',{'List-Unsubscribe':'One-Click'})).status,200);
 assert.equal((await db.query('SELECT subscription FROM contacts WHERE id=$1',[contact])).rows[0].subscription,'subscribed');
 const extraTopics:string[]=[randomUUID(),randomUUID()];
 for(const id of extraTopics){await db.query("INSERT INTO lists(workspace_id,id,name)VALUES($1,$2,$3)",[w,id,'Saved topic '+id]);await db.query("INSERT INTO topic_subscriptions(workspace_id,contact_id,topic_id,subscription)VALUES($1,$2,$3,'subscribed')",[w,contact,id]);}
 const globalToken=await issuePreferenceToken(w,contact);
 const beforeSave=(await db.query('SELECT preference_version FROM contacts WHERE id=$1',[contact])).rows[0].preference_version;
 assert.equal((await recipient('/preferences/'+globalToken+'/save',{expected_version:String(beforeSave),frequency:'weekly'})).status,200);
 assert.equal((await recipient('/preferences/'+globalToken+'/save',{expected_version:String(beforeSave+1),frequency:'monthly'})).status,200);
 const topicEvents=(await db.query("SELECT event_body FROM outbox WHERE workspace_id=$1 AND aggregate_id=$2 AND type='contact.topic_unsubscribed'",[w,contact])).rows.map((row)=>EventEnvelope.parse(JSON.parse(row.event_body)));
 assert.equal(topicEvents.length,3);assert.equal(new Set(topicEvents.filter((event)=>event.type==='contact.topic_unsubscribed'&&extraTopics.includes(event.data.topic_id)).map((event)=>event.aggregate.version)).size,1);
 const imported=await call('contact-imports','POST',{csv:'email\nimport-event@example.org'});assert.equal(imported.r.status,200);
 const operation=imported.j.operation_id;
 assert.equal((await call('contact-imports/'+operation+'/confirm','POST',{})).r.status,200);
 assert.equal((await call('contact-imports/'+operation+'/confirm','POST',{})).r.status,200);
 const imports=await call('events?type=contacts.imported');assert.equal(imports.j.total_count,1);assert.equal(imports.j.data[0].data.opt_in_granted,0);assert.equal(imports.j.data[0].data.created,1);
 const first=await call('events');assert.equal(first.r.status,200);validateSchema(absoluteSchema(apiSpec.components.schemas.EventsPage),first.j);
 assert.equal(first.j.data.length,25);assert.equal(first.j.total_count,30);assert.equal(first.j.has_more,true);
 first.j.data.forEach((event:unknown)=>EventEnvelope.parse(event));assert.ok(!JSON.stringify(first.j).includes('@example.org'));
 const second=await call('events?after='+encodeURIComponent(first.j.next_cursor));assert.equal(second.j.data.length,5);
 assert.equal(new Set([...first.j.data,...second.j.data].map((event:{id:string})=>event.id)).size,30);
 assert.equal((await call('events?type=contact.unsubscribed&after='+encodeURIComponent(first.j.next_cursor))).r.status,400);
 assert.equal((await call('events?after='+encodeURIComponent(first.j.next_cursor),'GET',undefined,other)).r.status,400);
 assert.equal((await call('events?type=campaign.delivered')).r.status,422);assert.equal((await call('events?limit=101')).r.status,422);
 assert.equal((await call('events','GET',undefined,other)).j.total_count,0);
 const eventId=first.j.data[0].id;assert.equal((await call('events/'+eventId,'GET',undefined,other)).r.status,404);
 const individual=await call('events/'+eventId);validateSchema(absoluteSchema(apiSpec.components.schemas.EventResponse),individual.j);assert.deepEqual(individual.j.event,first.j.data[0]);
 for(const role of ['Editor','Viewer','Billing']){
  await db.query('UPDATE memberships SET role=$1 WHERE workspace_id=$2 AND user_id=$3',[role,w,user]);
  assert.equal((await call('events')).r.status,403);assert.equal((await call('events/'+eventId)).r.status,403);
 }
 await db.query("UPDATE memberships SET role='Owner' WHERE workspace_id=$1 AND user_id=$2",[w,user]);
 const narrow=(await call('api-keys','POST',{name:'Event denial fixture',scopes:['emails:read'],expires_in_days:1})).j.secret;
 const allowed=(await call('api-keys','POST',{name:'Event read fixture',scopes:['events:read'],expires_in_days:1})).j.secret;
 assert.ok(narrow&&allowed);
 for(const path of ['events','%65vents']){
  assert.equal((await call(path,'GET',undefined,w,narrow)).r.status,403);assert.equal((await call(path,'GET',undefined,w,allowed)).r.status,200);
 }
 assert.equal((await call('events/'+eventId,'GET',undefined,w,allowed)).r.status,200);
 await db.query("UPDATE memberships SET role='Editor' WHERE workspace_id=$1 AND user_id=$2",[w,user]);
 assert.equal((await call('events','GET',undefined,w,allowed)).r.status,401);
 await db.query("UPDATE memberships SET role='Owner' WHERE workspace_id=$1 AND user_id=$2",[w,user]);
 await db.query('UPDATE api_keys SET revoked_at=now() WHERE workspace_id=$1 AND key_hash=$2',[w,digest(allowed)]);
 assert.equal((await call('events','GET',undefined,w,allowed)).r.status,401);
 await panel.getByRole('button',{name:'Reload event history',exact:true}).click();await panel.getByText('30 versioned events',{exact:true}).waitFor();
 assert.equal(await panel.locator('details').count(),25);
 let olderRequests=0;await page.route('**/v1/events?after=*',async(route)=>{olderRequests++;await route.continue();});
 await panel.getByRole('button',{name:'Load older events',exact:true}).evaluate((element)=>{(element as HTMLButtonElement).click();(element as HTMLButtonElement).click();});
 await page.waitForFunction(()=>document.querySelectorAll('.events-panel details').length===30);assert.equal(olderRequests,1);
 await panel.locator('details summary').first().click();assert.ok(!((await panel.innerText()).includes('@example.org')));
 await context.setOffline(true);await panel.getByRole('button',{name:'Reload event history',exact:true}).click();await panel.getByRole('alert').waitFor();assert.equal(await panel.locator('details').count(),30);
 await context.setOffline(false);await panel.getByRole('button',{name:'Reload event history',exact:true}).click();await panel.getByText('30 versioned events',{exact:true}).waitFor();
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await panel.scrollIntoViewIfNeeded();await page.screenshot({path:'output/playwright/lettercape-events-mobile.png',fullPage:true});
 let entered!:()=>void,release!:()=>void;const ready=new Promise<void>((resolve)=>{entered=resolve;}),gate=new Promise<void>((resolve)=>{release=resolve;});
 await page.route('**/v1/events',async(route)=>{const response=await route.fetch();entered();await gate;await route.fulfill({response});});
 await panel.getByRole('button',{name:'Reload event history',exact:true}).click();await ready;
 await page.getByRole('button',{name:'Open navigation'}).click();await page.getByLabel('Active brand workspace').selectOption(other);
 await page.getByRole('heading',{name:'Make something worth opening.',exact:true}).waitFor();release();
 await page.evaluate(()=>new Promise((resolve)=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve(true)))));
 assert.equal(await page.getByLabel('Active brand workspace').inputValue(),other);assert.equal(await page.locator('.events-panel').count(),0);
 console.log('Real global/topic opt-out and import receipts, duplicate transition exclusion, strict envelopes, signed pages, legacy omission, current role/tenant/bearer scope and encoded paths; Chromium empty/paging/repeated clicks/offline/mobile/workspace interruption pass. No external delivery.');
}finally{
 await browser?.close();
 for(const table of ['api_rate_events','api_keys','dispatch_policy_events','dispatch_controls','outbox','idempotency','audit_events','frequency_reservations','opt_in_requests','topic_subscriptions','consent_events','suppressions','contact_tags','contact_lists','contacts','lists','operations','memberships'])await db.query(`DELETE FROM ${table} WHERE workspace_id=ANY($1::uuid[])`,[[w,other]]);
 await db.query('DELETE FROM auth_sessions WHERE user_id=$1',[user]);await db.query('DELETE FROM workspaces WHERE id=ANY($1::uuid[])',[[w,other]]);await db.end();await closeDb();
}
