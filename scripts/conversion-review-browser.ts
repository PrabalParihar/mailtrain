import {sourceFixtureQuery} from './fixtures/email-source-context';
import assert from 'node:assert/strict';
import {randomUUID,randomBytes} from 'node:crypto';
import pg from 'pg';
import env from '@next/env';
import {chromium} from 'playwright';
import {digest} from '../src/server/audit';
import {blankSpec} from '../src/domain/email';
env.loadEnvConfig(process.cwd());
const origin=process.env.APP_ORIGIN??'http://127.0.0.1:3003';
if(process.env.LOCAL_DEVELOPMENT!=='true'||!['127.0.0.1','localhost'].includes(new URL(origin).hostname))throw Error('Owned loopback conversion fixture required.');
for(const name of ['DATABASE_URL','MIGRATION_DATABASE_URL']){const value=new URL(process.env[name]!);assert.equal(value.hostname,'127.0.0.1');assert.equal(value.port,'55439');}
const db=new pg.Pool({connectionString:process.env.MIGRATION_DATABASE_URL}),workspace=randomUUID(),user='conversion-ui-'+randomUUID(),otherUser='conversion-other-'+randomUUID(),cookie=randomBytes(32).toString('hex'),otherCookie=randomBytes(32).toString('hex'),brand=randomUUID(),email=randomUUID();
const source={...blankSpec(brand,'Owned conversion'),editing_mode:'raw_html' as const,sections:[],raw_html:'<p>Keep the exact raw source</p><div>Opaque safe fragment</div>'};
let browser:Awaited<ReturnType<typeof chromium.launch>>|undefined;
try {
 await db.query("INSERT INTO workspaces(id,name)VALUES($1,'Owned conversion UI')",[workspace]);await db.query("INSERT INTO memberships(workspace_id,user_id,role)VALUES($1,$2,'Owner'),($1,$3,'Owner')",[workspace,user,otherUser]);await db.query("INSERT INTO auth_sessions(token_hash,user_id,expires_at)VALUES($1,$2,clock_timestamp()+interval '1 hour'),($3,$4,clock_timestamp()+interval '1 hour')",[digest(cookie),user,digest(otherCookie),otherUser]);
 await db.query("INSERT INTO brands(workspace_id,id,version,data)VALUES($1,$2,1,'{}')",[workspace,brand]);await sourceFixtureQuery(db,workspace,user,'INSERT INTO emails(workspace_id,id,title,spec,created_by)VALUES($1,$2,$3,$4,$5)',[workspace,email,'Owned conversion UI',JSON.stringify(source),user]);
 browser=await chromium.launch({headless:true});const context=await browser.newContext({viewport:{width:1440,height:1000}});await context.addCookies([{name:'mailcraft_local_session',value:cookie,url:origin,sameSite:'Strict'}]);await context.addInitScript(w=>localStorage.setItem('mailcraft.workspace',w),workspace);const page=await context.newPage();page.on('dialog',dialog=>dialog.accept());
 await page.goto(origin+'/app/emails/'+email);await page.getByRole('textbox',{name:'Subject',exact:true}).waitFor();
 const panel=page.getByRole('region',{name:'Block conversion',exact:true}),review=panel.getByRole('button',{name:'Review block conversion',exact:true});
 assert.equal(await review.count(),1,'Raw editor must expose explicit block conversion review; absent control RED.');
 assert.equal(await review.isEnabled(),true);
 const accept=panel.getByRole('button',{name:'Accept block conversion',exact:true}),ack=panel.getByRole('checkbox',{name:'I reviewed both previews and acknowledge that block rendering can change layout.',exact:true});
 const commands:{email:string;body:string;key:string}[]=[];page.on('request',request=>{if(request.url().endsWith('/convert-to-blocks'))commands.push({email:new URL(request.url()).pathname.split('/')[3],body:request.postData()??'',key:request.headers()['idempotency-key']});});
 async function seed(raw_html=source.raw_html){const id=randomUUID();await sourceFixtureQuery(db,workspace,user,'INSERT INTO emails(workspace_id,id,title,spec,created_by)VALUES($1,$2,$3,$4,$5)',[workspace,id,'Owned conversion case',JSON.stringify({...source,raw_html}),user]);return id;}
 async function open(id:string){await page.goto(origin+'/app/emails/'+id);await page.getByRole('textbox',{name:'Subject',exact:true}).waitFor();await review.waitFor();await page.waitForFunction(()=>{const button=Array.from(document.querySelectorAll('button')).find(button=>button.textContent==='Review block conversion');return !!button&&!button.disabled;});}
 async function available(){await review.click();await panel.locator('iframe[title="Proposed block conversion preview"]').waitFor();assert.equal(await accept.isDisabled(),true);await ack.check();assert.equal(await accept.isEnabled(),true);}
 async function truth(id:string){return(await db.query('SELECT doc_version,spec FROM emails WHERE workspace_id=$1 AND id=$2',[workspace,id])).rows[0];}

 // Retained native F1/F2 regressions against owned HTTP/Chromium fixtures.
 let externalRequests=0;await context.route(url=>url.origin!==origin,route=>{externalRequests++;return route.abort('blockedbyclient');});
 if(process.argv.includes('--preview')){
  const long=await seed('<p>Review starting copy</p>'.repeat(30)+'<p>Decision-critical bottom copy</p><a href="https://example.invalid/blocked">Inert review link</a>');await open(long);await available();
  for(const title of ['Original raw conversion preview','Proposed block conversion preview']){
   const preview=panel.locator('iframe[title="'+title+'"]'),frame=preview.contentFrame(),bottom=frame.getByText('Decision-critical bottom copy',{exact:true});
   assert.equal(await preview.getAttribute('sandbox'),'');assert.equal(await preview.getAttribute('referrerpolicy'),'no-referrer');assert.equal(await preview.getAttribute('tabindex'),'0');
   const before=await bottom.evaluate(element=>({top:element.getBoundingClientRect().top,height:innerHeight}));assert.ok(before.top>before.height);
   await preview.scrollIntoViewIfNeeded();const box=await preview.boundingBox();assert.ok(box);await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.wheel(0,3000);
   await page.waitForTimeout(300);let after=await bottom.evaluate(element=>({top:element.getBoundingClientRect().top,height:innerHeight,bottom:element.getBoundingClientRect().bottom,scroll:scrollY}));assert.ok(after.scroll>0&&after.top>=0&&after.bottom<=after.height,'Pointer must reveal bottom copy in '+title);
   // Native keyboard scroll must work inside the opaque sandbox too.
   await review.focus();let reached=false;for(let step=0;step<30;step++){await page.keyboard.press('Tab');reached=await page.evaluate(expected=>document.activeElement instanceof HTMLIFrameElement&&document.activeElement.title===expected,title);if(reached)break;}assert.equal(reached,true,'Keyboard Tab must enter '+title);for(let step=0;step<12;step++){await page.keyboard.press('PageUp');await page.waitForTimeout(150);}await page.waitForTimeout(500);const first=await frame.getByText('Review starting copy',{exact:true}).first().evaluate(element=>({top:element.getBoundingClientRect().top,bottom:element.getBoundingClientRect().bottom,height:innerHeight}));assert.ok(first.top>=0&&first.bottom<=first.height,'Keyboard Page Up must reveal the complete first copy in '+title);
   for(let step=0;step<12;step++){await page.keyboard.press('PageDown');await page.waitForTimeout(150);}await page.waitForTimeout(500);after=await bottom.evaluate(element=>({top:element.getBoundingClientRect().top,height:innerHeight,bottom:element.getBoundingClientRect().bottom,scroll:scrollY}));console.log('Keyboard review geometry',title,JSON.stringify({...after,focus:await frame.locator('body').evaluate(()=>({hasFocus:document.hasFocus(),active:document.activeElement?.tagName}))}));assert.ok(after.scroll>0&&after.top>=0&&after.bottom<=after.height,'Keyboard must reveal bottom copy in '+title);
   const link=frame.getByText('Inert review link',{exact:true});assert.equal(await link.getAttribute('href'),null);await link.click();assert.equal(await frame.locator('body').evaluate(()=>location.href),'about:srcdoc');assert.equal(page.url(),origin+'/app/emails/'+long);
  }
  assert.equal(externalRequests,0,'Static review links must never reach the outbound interception sentinel.');assert.equal((await truth(long)).doc_version,1);console.log('Native F2 full pointer/keyboard review and inert sandbox links PASS.');
 }else{
  await available();await sourceFixtureQuery(db,workspace,user,"UPDATE emails SET doc_version=doc_version+1,spec=jsonb_set(spec,'{raw_html}',to_jsonb('<p>Competing saved raw source</p>'::text)) WHERE workspace_id=$1 AND id=$2",[workspace,email]);
  const response=page.waitForResponse(r=>r.url().endsWith('/convert-to-blocks'));await accept.click();assert.equal((await response).status(),412);
  const discard=panel.getByRole('button',{name:'Discard refused conversion command',exact:true});await discard.waitFor();assert.equal(await panel.getByRole('button',{name:'Retry original conversion',exact:true}).count(),0);
  await page.reload();await discard.waitFor();assert.equal(commands.length,1);await discard.click();await review.waitFor();assert.equal(await review.isEnabled(),true);assert.equal((await truth(email)).doc_version,2);assert.equal((await truth(email)).spec.raw_html,'<p>Competing saved raw source</p>');
  await available();assert.equal(await panel.getByText(/Saved source v2/).count(),1);assert.equal(commands.length,1);await accept.click();await panel.getByRole('status').filter({hasText:'Conversion acknowledged.'}).waitFor();assert.equal((await truth(email)).doc_version,3);assert.equal(commands.length,2);assert.notEqual(commands[0].key,commands[1].key);assert.equal(JSON.parse(commands[1].body).expected_version,2);
  console.log('Native F1 authoritative412 survives reload and explicit discard/current-truth review/new command PASS.');
  // A failed current-truth read retains the refused command; local changes remain
  // recoverable through the existing conflict controls after explicit discard.
  const dirty=await seed();await open(dirty);await available();await sourceFixtureQuery(db,workspace,user,"UPDATE emails SET doc_version=2,spec=jsonb_set(spec,'{raw_html}',to_jsonb('<p>New saved truth for conflict</p>'::text)) WHERE workspace_id=$1 AND id=$2",[workspace,dirty]);
  await accept.click();await discard.waitFor();const detailPattern='**/v1/emails/'+dirty;
  await page.route(detailPattern,route=>route.request().method()==='GET'?route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:{code:'CONTROLLED_TRUTH_FAILURE',message:'Controlled refused-command current-read failure'}})}):route.continue());
  await discard.click();await panel.getByRole('alert').filter({hasText:'Controlled refused-command current-read failure'}).waitFor();assert.equal(await discard.isEnabled(),true);assert.equal((await truth(dirty)).doc_version,2);await page.unroute(detailPattern);
  const subject=page.getByRole('textbox',{name:'Subject',exact:true});await subject.fill('Local work must survive refusal discard');await page.getByRole('button',{name:'Reload newer',exact:true}).waitFor();await discard.click();await review.waitFor();assert.equal(await subject.inputValue(),'Local work must survive refusal discard');assert.equal(await review.isDisabled(),true);assert.equal((await truth(dirty)).spec.raw_html,'<p>New saved truth for conflict</p>');assert.equal((await db.query('SELECT count(*)::int AS n FROM revisions WHERE email_id=$1',[dirty])).rows[0].n,0);
  console.log('Native F1 failed current-read retention and preserved local conflict work PASS.');

 }
}catch(error){console.error('NATIVE_CONVERSION_REVIEW_FAILURE',error);throw error;}finally{
 await browser?.close();const cleanup=await db.connect();try{await cleanup.query('BEGIN');await cleanup.query('SELECT id FROM emails WHERE workspace_id=$1 FOR UPDATE',[workspace]);for(const table of['email_source_provenance','render_downloads','preflights','idempotency','audit_events','revisions','emails','brands','memberships'])await cleanup.query('DELETE FROM '+table+' WHERE workspace_id=$1',[workspace]);await cleanup.query('DELETE FROM workspaces WHERE id=$1',[workspace]);await cleanup.query('DELETE FROM auth_sessions WHERE user_id=ANY($1::text[])',[[user,otherUser]]);await cleanup.query('COMMIT');assert.equal((await db.query('SELECT count(*)::int AS n FROM workspaces WHERE id=$1',[workspace])).rows[0].n,0);assert.equal((await db.query('SELECT count(*)::int AS n FROM auth_sessions WHERE user_id=ANY($1::text[])',[[user,otherUser]])).rows[0].n,0);console.log('Owned native exact fixture cleanup PASS.');}catch(error){await cleanup.query('ROLLBACK');throw error;}finally{cleanup.release();await db.end();}
}
