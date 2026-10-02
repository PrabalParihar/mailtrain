import assert from 'node:assert/strict';
import {randomUUID,randomBytes} from 'node:crypto';
import pg from 'pg';
import env from '@next/env';
import {chromium} from 'playwright';
import {digest} from '../src/server/audit';
env.loadEnvConfig(process.cwd());
const origin=process.env.APP_ORIGIN??'http://127.0.0.1:3003';
if(process.env.LOCAL_DEVELOPMENT!=='true'||!['127.0.0.1','localhost'].includes(new URL(origin).hostname))throw Error('Owned loopback navigation fixture required.');
const db=new pg.Pool({connectionString:process.env.MIGRATION_DATABASE_URL}),workspace=randomUUID(),user='keyboard-navigation-'+randomUUID(),cookie=randomBytes(32).toString('hex');
let browser:Awaited<ReturnType<typeof chromium.launch>>|undefined;
try{
 await db.query("INSERT INTO workspaces(id,name)VALUES($1,'Owned keyboard navigation')",[workspace]);await db.query("INSERT INTO memberships(workspace_id,user_id,role)VALUES($1,$2,'Owner')",[workspace,user]);await db.query("INSERT INTO auth_sessions(token_hash,user_id,expires_at)VALUES($1,$2,clock_timestamp()+interval '1 hour')",[digest(cookie),user]);
 browser=await chromium.launch({headless:true});const context=await browser.newContext({viewport:{width:390,height:844}});await context.addCookies([{name:'mailcraft_local_session',value:cookie,url:origin,sameSite:'Strict'}]);await context.addInitScript(w=>localStorage.setItem('mailcraft.workspace',w),workspace);const page=await context.newPage();await page.goto(origin+'/app');const toggle=page.getByRole('button',{name:'Open navigation',exact:true});await toggle.waitFor();
 // Closed off-canvas navigation must not receive invisible keyboard focus.
 await page.keyboard.press('Tab');await page.getByRole('link',{name:'Skip to content',exact:true}).waitFor();
 for(let i=0;i<14;i++){await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>!!document.activeElement?.closest('.sidebar')),false,'Closed mobile navigation received invisible keyboard focus.');}
 await toggle.focus();await page.keyboard.press('Enter');await page.waitForFunction(()=>document.querySelector('.sidebar')?.classList.contains('open'));
 assert.equal(await toggle.getAttribute('aria-expanded'),'true');assert.equal(await page.evaluate(()=>!!document.activeElement?.closest('.sidebar')),true,'Opening navigation must move focus into visible controls.');
 await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('.sidebar')?.classList.contains('open'));assert.equal(await toggle.getAttribute('aria-expanded'),'false');assert.equal(await toggle.evaluate(button=>document.activeElement===button),true);
 await page.keyboard.press('Enter');const campaigns=page.getByRole('link',{name:'Campaigns',exact:true});await campaigns.focus();await page.keyboard.press('Enter');await page.waitForURL(url=>url.pathname==='/app/campaigns');await page.locator('#main h1').waitFor();await page.waitForFunction(()=>{const sidebar=document.querySelector('.sidebar');return !!sidebar&&!sidebar.classList.contains('open');});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.screenshot({path:'/tmp/lettercape-keyboard-mobile.png'});
 await page.setViewportSize({width:1440,height:1000});await page.getByLabel('Active brand workspace',{exact:true}).waitFor();await page.getByRole('link',{name:'Audience',exact:true}).focus();await page.keyboard.press('Enter');await page.waitForURL(url=>url.pathname==='/app/audience');await page.getByLabel('Segment name',{exact:true}).waitFor();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:'/tmp/lettercape-keyboard-desktop.png'});
 console.log('Owned keyboard/responsive navigation PASS: closed mobile sidebar excluded from Tab, Enter opens/focuses, Escape closes/restores, keyboard navigation at390/1440px without overflow.');
}finally{await browser?.close();for(const table of ['audit_events','memberships'])await db.query('DELETE FROM '+table+' WHERE workspace_id=$1',[workspace]);await db.query('DELETE FROM workspaces WHERE id=$1',[workspace]);await db.query('DELETE FROM auth_sessions WHERE user_id=$1',[user]);await db.end();}
