import assert from 'node:assert/strict';
import { randomUUID, randomBytes } from 'node:crypto';
import pg from 'pg';
import env from '@next/env';
import { chromium } from 'playwright';
import { digest } from '../src/server/audit';
import { issuePreferenceToken } from '../src/server/preferences';
import { closeDb } from '../src/server/db';
import { apiSpec, validateSchema, absoluteSchema } from './api-validation';
env.loadEnvConfig(process.cwd());
const origin=process.env.APP_ORIGIN ?? 'http://127.0.0.1:3000';
if(process.env.LOCAL_DEVELOPMENT!=='true'||!['127.0.0.1','localhost'].includes(new URL(origin).hostname))throw new Error('Local policy fixtures only');
const db=new pg.Pool({connectionString:process.env.MIGRATION_DATABASE_URL}), w=randomUUID(),other=randomUUID(),user='policy-http-'+randomUUID(),cookie=randomBytes(32).toString('hex'),contact=randomUUID();
let browser: Awaited<ReturnType<typeof chromium.launch>>|undefined;
async function call(path: string,method='GET',body?:unknown,key=randomUUID(),workspace=w,extra:Record<string,string>={}) {
  const r=await fetch(origin+'/v1/'+path,{method,headers:{Cookie:'mailcraft_local_session='+cookie,Origin:origin,'X-Workspace-Id':workspace,'Content-Type':'application/json','Idempotency-Key':key,...extra},body:body===undefined?undefined:JSON.stringify(body)});
  return {r,j:await r.json()};
}
try {
  await db.query('INSERT INTO workspaces(id,name)VALUES($1,$3),($2,$3)',[w,other,'Dispatch HTTP fixture']);
  await db.query("INSERT INTO memberships(workspace_id,user_id,role)VALUES($1,$3,'Owner'),($2,$3,'Owner')",[w,other,user]);
  await db.query("INSERT INTO auth_sessions(token_hash,user_id,expires_at)VALUES($1,$2,now()+interval '1 hour')",[digest(cookie),user]);
  const initial=await call('dispatch-controls'); assert.equal(initial.r.status,200);
  validateSchema(absoluteSchema(apiSpec.components.schemas.DispatchControlsResponse),initial.j);
  assert.equal(initial.j.controls.workspace.paused,true);assert.equal(initial.j.controls.workspace.version,0);assert.equal(initial.j.controls.dispatch_enabled,false);
  assert.equal((await call('dispatch-controls/workspace')).r.status,405);
  assert.equal((await call('dispatch-controls/global','POST',{paused:false})).r.status,404);
  const body={expected_version:0,paused:false,reason:'verified_recovery'},key=randomUUID();
  const released=await call('dispatch-controls/workspace','POST',body,key);assert.equal(released.r.status,200);assert.equal(released.j.controls.workspace.version,1);
  assert.equal((await call('dispatch-controls/workspace','POST',body,key)).j.controls.workspace.version,1);
  assert.equal((await call('dispatch-controls/workspace','POST',{...body,paused:true,reason:'incident'},key)).r.status,409);
  assert.equal((await call('dispatch-controls/workspace','POST',body)).r.status,409);
  assert.equal((await call('dispatch-controls/workspace','POST',{expected_version:1,paused:false,reason:'incident'})).r.status,422);
  assert.equal((await call('dispatch-controls/workspace','POST',{expected_version:1,paused:true,reason:'incident',global:false})).r.status,422);
  assert.equal((await call('dispatch-controls/workspace','POST',{expected_version:1,paused:true,reason:'incident'},randomUUID(),w,{Origin:'https://foreign.example'})).r.status,403);
  const paused=await call('dispatch-controls/workspace','POST',{expected_version:1,paused:true,reason:'incident'}); assert.equal(paused.j.controls.workspace.version,2);
  // Acknowledging an earlier command returns current policy, not a stale receipt snapshot.
  assert.equal((await call('dispatch-controls/workspace','POST',body,key)).j.controls.workspace.paused,true);
  assert.equal((await call('dispatch-controls', 'GET',undefined,randomUUID(),other)).j.controls.workspace.version,0);
  for(const role of ['Editor','Viewer','Billing']) {
    await db.query('UPDATE memberships SET role=$1 WHERE workspace_id=$2 AND user_id=$3',[role,w,user]);
    assert.equal((await call('dispatch-controls')).r.status,403);
    assert.equal((await call('dispatch-controls/workspace','POST',{expected_version:2,paused:false,reason:'verified_recovery'})).r.status,403);
  }
  await db.query("UPDATE memberships SET role='Owner' WHERE workspace_id=$1 AND user_id=$2",[w,user]);
  for(const path of ['dispatch-controls','%64ispatch-controls']) {
    assert.equal((await call(path,'GET',undefined,randomUUID(),w,{Authorization:'Bearer invalid'})).r.status,403);
    assert.equal((await call(path+'/workspace','POST',body,randomUUID(),w,{Authorization:'Bearer invalid',Origin:'https://foreign.example'})).r.status,403);
  }
  await db.query("INSERT INTO contacts(workspace_id,id,email_original,email_lookup,subscription)VALUES($1,$2,'policy@example.org','policy@example.org','subscribed')",[w,contact]);
  const token=await issuePreferenceToken(w,contact);
  const optout=await fetch(origin+'/preferences/'+token+'/unsubscribe',{method:'POST',headers:{Origin:origin,'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({human_confirmation:'unsubscribe'}),redirect:'manual'});
  assert.equal(optout.status,303);assert.equal((await db.query('SELECT subscription FROM contacts WHERE workspace_id=$1 AND id=$2',[w,contact])).rows[0].subscription,'unsubscribed');
  browser=await chromium.launch({headless:true});const context=await browser.newContext({viewport:{width:390,height:844}});
  await context.addInitScript((workspace)=>localStorage.setItem('mailcraft.workspace',workspace),w);
  await context.addCookies([{name:'mailcraft_local_session',value:cookie,url:origin,sameSite:'Strict'}]);
  const page=await context.newPage();await page.goto(origin+'/app/settings');const panel=page.locator('.dispatch-controls-panel');
  await panel.getByRole('heading',{name:'Dispatch safety controls'}).waitFor();await panel.getByText('Workspace:').waitFor();
  assert.match(await panel.innerText(),/Global: Stop engaged/);assert.match(await panel.innerText(),/Workspace: Stop engaged/);
  await context.setOffline(true);await panel.getByRole('button',{name:'Release workspace stop',exact:true}).click();
  await panel.getByRole('alert').filter({hasText:/fetch|network|Failed/i}).waitFor();assert.match(await panel.innerText(),/Workspace: Stop engaged/);
  await context.setOffline(false);
  let lost=true,requests=0;
  await page.route('**/dispatch-controls/workspace',async(route)=>{requests++;if(!lost)return route.continue();lost=false;await route.fetch();await route.abort('failed');});
  await panel.getByRole('button',{name:'Release workspace stop',exact:true}).click();await panel.getByRole('alert').filter({hasText:/fetch|network|Failed/i}).waitFor();
  await panel.getByRole('button',{name:'Release workspace stop',exact:true}).evaluate((el)=>{(el as HTMLButtonElement).click();(el as HTMLButtonElement).click();});
  await panel.getByRole('status').filter({hasText:/Command acknowledged.*Workspace stop is released/}).waitFor();
  assert.equal(requests,2);assert.equal((await call('dispatch-controls')).j.controls.workspace.version,3);
  await page.unroute('**/dispatch-controls/workspace');
  await call('dispatch-controls/workspace','POST',{expected_version:3,paused:true,reason:'incident'});
  await panel.getByRole('button',{name:'Stop workspace dispatch',exact:true}).click();
  await panel.getByRole('alert').filter({hasText:/policy changed/i}).waitFor();
  await panel.getByRole('button',{name:'Reload dispatch controls',exact:true}).click();await panel.getByText(/Workspace:.*Stop engaged/).waitFor();
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await panel.scrollIntoViewIfNeeded();await page.screenshot({path:'output/playwright/lettercape-dispatch-controls-mobile.png',fullPage:true});
  let entered!:()=>void,release!:()=>void;const ready=new Promise<void>((resolve)=>{entered=resolve;}),gate=new Promise<void>((resolve)=>{release=resolve;});
  await page.route('**/dispatch-controls/workspace',async(route)=>{const response=await route.fetch();entered();await gate;await route.fulfill({response});});
  await panel.getByRole('button',{name:'Release workspace stop',exact:true}).click();await ready;
  await page.getByRole('button',{name:'Open navigation'}).click();await page.getByLabel('Active brand workspace').selectOption(other);
  await page.getByRole('heading',{name:'Make something worth opening.',exact:true}).waitFor();release();
  await page.evaluate(()=>new Promise((resolve)=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve(true)))));
  assert.equal(await page.getByLabel('Active brand workspace').inputValue(),other);
  assert.ok(await page.getByRole('heading',{name:'Make something worth opening.',exact:true}).isVisible());
  console.log('Current policy/contract, replay/version/role/tenant/encoded CSRF denial, opt-out while stopped, Chromium offline/lost response/repeated clicks/conflict/mobile/workspace fencing pass; provider submissions zero.');
} finally {
  await browser?.close();
  for(const table of ['dispatch_policy_events','dispatch_controls','audit_events','idempotency','outbox','consent_events','suppressions','contacts','memberships'])await db.query(`DELETE FROM ${table} WHERE workspace_id=ANY($1::uuid[])`,[[w,other]]);
  await db.query('DELETE FROM auth_sessions WHERE user_id=$1',[user]);await db.query('DELETE FROM workspaces WHERE id=ANY($1::uuid[])',[[w,other]]);await db.end();await closeDb();
}
