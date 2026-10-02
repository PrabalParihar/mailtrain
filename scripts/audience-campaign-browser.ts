import assert from 'node:assert/strict';
import {randomUUID,randomBytes} from 'node:crypto';
import pg from 'pg';
import env from '@next/env';
import {chromium} from 'playwright';
import {digest} from '../src/server/audit';
import {blankSpec} from '../src/domain/email';
env.loadEnvConfig(process.cwd());
const origin=process.env.APP_ORIGIN??'http://127.0.0.1:3003';
if(process.env.LOCAL_DEVELOPMENT!=='true'||!['localhost','127.0.0.1'].includes(new URL(origin).hostname))throw Error('Owned loopback audience campaign browser required.');
const db=new pg.Pool({connectionString:process.env.MIGRATION_DATABASE_URL}),workspace=randomUUID(),other=randomUUID(),user='audience-campaign-'+randomUUID(),cookie=randomBytes(32).toString('hex');
let browser:Awaited<ReturnType<typeof chromium.launch>>|undefined;
async function call(path:string,method='GET',body?:unknown,version?:number,w=workspace){const r=await fetch(origin+'/v1/'+path,{method,headers:{Origin:origin,'Content-Type':'application/json','Idempotency-Key':randomUUID(),Cookie:'mailcraft_local_session='+cookie,'X-Workspace-Id':w,...(version?{'If-Match':'"draft-'+version+'"'}:{})},body:body===undefined?undefined:JSON.stringify(body)});const j=await r.json();assert.ok(r.ok,JSON.stringify(j));return j;}
try{
  await db.query("INSERT INTO workspaces(id,name)VALUES($1,'Owned frozen selection browser'),($2,'Owned empty snapshot workspace')",[workspace,other]);for(const w of[workspace,other])await db.query("INSERT INTO memberships(workspace_id,user_id,role)VALUES($1,$2,'Owner')",[w,user]);
  await db.query("INSERT INTO auth_sessions(token_hash,user_id,expires_at)VALUES($1,$2,clock_timestamp()+interval '1 hour')",[digest(cookie),user]);
  const brand=(await call('brands','POST',{name:'Owned audience campaign kit',website:'',description:'Owned fixture',voice:'Plain',accent:'#0B625D',background:'#F7F6F2',font_stack:'Arial, sans-serif',address:'Reserved fixture address',approved_claims:[],forbidden_phrases:[],provenance:[]})).brand;
  const email=(await call('emails','POST',{title:'Owned frozen campaign content',spec:blankSpec(brand.id,'Owned audience campaign kit')})).email;
  const revision=(await call('emails/'+email.id+'/revisions','POST',{},email.doc_version)).revision;
  const otherBrand=(await call('brands','POST',{name:'Owned empty kit',website:'',description:'Owned fixture',voice:'Plain',accent:'#0B625D',background:'#F7F6F2',font_stack:'Arial, sans-serif',address:'Reserved fixture address',approved_claims:[],forbidden_phrases:[],provenance:[]},undefined,other)).brand;
  const otherEmail=(await call('emails','POST',{title:'Owned empty audience content',spec:blankSpec(otherBrand.id,'Owned empty kit')},undefined,other)).email;
  const otherRevision=(await call('emails/'+otherEmail.id+'/revisions','POST',{},otherEmail.doc_version,other)).revision;
  const otherCampaign=(await call('campaigns','POST',{name:'Owned empty captured campaign',revision_id:otherRevision.id},undefined,other)).campaign;
  await db.query("INSERT INTO contacts(workspace_id,email_original,email_lookup,attrs,subscription)VALUES($1,'owned-selection@example.test','owned-selection@example.test','{\"first_name\":\"Owned\"}','subscribed')",[workspace]);
  const segment=(await call('segments','POST',{name:'Owned captured source',rule:{kind:'attribute',field:'first_name',op:'exists'}})).segment;
  const sources: {id:string;segment_version:number}[]=[];for(let i=0;i<26;i++)sources.push((await call('segments/'+segment.id+'/snapshots','POST',{expected_version:1})).snapshot);
  const campaign=(await call('campaigns','POST',{name:'Owned captured campaign',revision_id:revision.id})).campaign,path='campaigns/'+campaign.id;
  await call(path+'/configuration','POST',{expected_version:1,name:campaign.name,revision_id:revision.id,planned_timing:null,audience_snapshot_id:sources[0].id});
  browser=await chromium.launch({headless:true});const context=await browser.newContext({viewport:{width:390,height:844}});
  await context.addCookies([{name:'mailcraft_local_session',value:cookie,url:origin,sameSite:'Strict'}]);await context.addInitScript(w=>localStorage.setItem('mailcraft.workspace',w),workspace);
  const page=await context.newPage();await page.goto(origin+'/app/campaigns');const box=page.locator('[data-campaign-configuration="'+campaign.id+'"]');
  await box.getByLabel('Configuration name',{exact:true}).waitFor();
  await box.getByLabel('Frozen audience selection',{exact:true}).waitFor({timeout:5000});
  if(process.argv.includes('--probe-long-revision')){
    const name=box.getByLabel('Configuration name',{exact:true}),revisionInput=box.getByLabel('Configuration frozen revision',{exact:true}),source=box.getByLabel('Frozen audience snapshot ID',{exact:true});
    await name.fill('Keep my other changes');await revisionInput.fill('x'.repeat(101));await box.getByLabel('Add planned timing',{exact:true}).check();await box.getByLabel('Planned local minute',{exact:true}).fill('2026-11-02T12:30');await source.fill(sources[25].id);await box.getByRole('status').filter({hasText:'Frozen audience verified.'}).waitFor();
    await page.reload();await box.getByRole('status').filter({hasText:'Unapplied campaign configuration edits recovered.'}).waitFor({timeout:5000});
    assert.equal(await name.inputValue(),'Keep my other changes');assert.equal(await revisionInput.inputValue(),'x'.repeat(101));assert.equal(await box.getByLabel('Planned local minute',{exact:true}).inputValue(),'2026-11-02T12:30');assert.equal(await source.inputValue(),sources[25].id);assert.equal((await call(path)).campaign.version,2);
    await box.getByRole('button',{name:'Save draft configuration',exact:true}).click();await box.getByRole('alert').waitFor();assert.equal((await call(path)).campaign.version,2);assert.equal(await name.inputValue(),'Keep my other changes');
    console.log('Owned long invalid revision reload PASS: name, timing, source and 101-character invalid revision retained; invalid save does not change server configuration.');
  }else if(process.argv.includes('--clear-verification-red')||process.argv.includes('--probe-verification')){
    const input=box.getByLabel('Frozen audience snapshot ID',{exact:true});let release!:()=>void,start!:()=>void,complete!:()=>void;
    const held=new Promise<void>(resolve=>{release=resolve;}),started=new Promise<void>(resolve=>{start=resolve;}),completed=new Promise<void>(resolve=>{complete=resolve;});
    await page.route('**/v1/audience-snapshots/'+sources[25].id+'/metadata',async route=>{const response=await route.fetch();start();await held;try{await route.fulfill({response});}catch(e){assert.match(String(e),/Route is already handled|Target.*closed/);}finally{complete();}});
    try{await input.fill(sources[25].id);await started;await input.fill('');
      await page.waitForFunction(id=>!document.querySelector<HTMLSelectElement>('[data-campaign-configuration="'+id+'"] select[aria-label="Frozen audience selection"]')?.disabled,campaign.id,{timeout:3000});
      assert.equal(await box.getByRole('button',{name:'Save draft configuration',exact:true}).isEnabled(),true);
    }finally{release();await completed;await page.unroute('**/v1/audience-snapshots/'+sources[25].id+'/metadata');}
    assert.equal(await box.getByText('Frozen audience verified.',{exact:true}).count(),0);console.log('Owned metadata verification interruption PASS: clearing an in-flight source restores omission controls and fences its stale response.');
  }else if(!process.argv.includes('--selector-red')){
    await box.getByText('Captured audience source '+sources[0].id,{exact:false}).waitFor();
    assert.equal(await box.getByLabel('Frozen audience selection',{exact:true}).locator('option[value="'+sources[0].id+'"]').count(),1);
    await box.getByLabel('Frozen audience selection',{exact:true}).selectOption(sources[25].id);
    await box.getByRole('status').filter({hasText:'Frozen audience verified.'}).waitFor();
    await box.getByRole('button',{name:'Save draft configuration',exact:true}).click();await box.getByRole('status').filter({hasText:'Draft configuration saved.'}).waitFor();
    const saved=(await call(path)).campaign;assert.equal(saved.version,3);assert.equal(saved.audience_snapshot.id,sources[25].id);
    await box.getByRole('region',{name:'Configuration history',exact:true}).getByText('Audience source '+sources[25].id,{exact:false}).waitFor();
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await box.locator('h3').scrollIntoViewIfNeeded();await page.screenshot({path:'/tmp/lettercape-audience-campaign-mobile.png'});
    console.log('Owned frozen audience campaign browser first flow PASS: current source beyond first page retained, explicit verified source selection/save, strict readonly pin/history and390px layout.');
    const selector=box.getByLabel('Frozen audience selection',{exact:true}),snapshotID=box.getByLabel('Frozen audience snapshot ID',{exact:true}),save=box.getByRole('button',{name:'Save draft configuration',exact:true}),name=box.getByLabel('Configuration name',{exact:true});
    await selector.selectOption(sources[25].id);await box.getByRole('status').filter({hasText:'Frozen audience verified.'}).waitFor();await save.click();
    await box.getByRole('status').filter({hasText:'Configuration is unchanged.'}).waitFor();assert.equal((await call(path)).campaign.version,3);assert.equal((await call(path+'/configurations')).total_count,3);
    const pinBefore=(await db.query('SELECT intent FROM campaigns WHERE id=$1',[campaign.id])).rows[0].intent.audience;
    const contactID=(await db.query('SELECT id FROM contacts WHERE workspace_id=$1',[workspace])).rows[0].id;
    await call('contacts/'+contactID+'/suppress','POST',{});
    await db.query("INSERT INTO contacts(workspace_id,email_original,email_lookup,attrs,subscription)VALUES($1,'owned-new@example.test','owned-new@example.test','{\"first_name\":\"New\"}','subscribed')",[workspace]);
    await call('segments/'+segment.id+'/versions','POST',{expected_version:1,rule:{kind:'attribute',field:'first_name',op:'eq',value:'New'}});
    let omittedBody='';await page.route('**/v1/'+path+'/configuration',async route=>{omittedBody=route.request().postData()!;await route.continue();});
    await name.fill('Owned content-only edit');await save.click();await box.getByRole('status').filter({hasText:'Draft configuration saved.'}).waitFor();await page.unroute('**/v1/'+path+'/configuration');
    assert.equal(JSON.parse(omittedBody).audience_snapshot_id,undefined);assert.equal((await call(path)).campaign.audience_snapshot.id,sources[25].id);
    assert.deepEqual((await db.query('SELECT intent FROM campaigns WHERE id=$1',[campaign.id])).rows[0].intent.audience,pinBefore);
    // Failed page reads retain the captured pin and a repeated paging click sends one request.
    let pageRequests=0;await page.route('**/v1/audience-snapshots?*',route=>{if(new URL(route.request().url()).searchParams.has('after')){pageRequests++;return route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:{code:'OWNED_PAGE_FAIL',message:'Owned older selections temporarily unavailable.'}})});}return route.continue();});
    await box.getByRole('button',{name:'Load older frozen selections',exact:true}).click();await box.getByRole('alert').filter({hasText:'Owned older selections temporarily unavailable.'}).waitFor();
    assert.equal(await selector.inputValue(),'');await box.getByText('Captured audience source '+sources[25].id,{exact:false}).waitFor();await page.unroute('**/v1/audience-snapshots?*');
    pageRequests=0;await page.route('**/v1/audience-snapshots?*',async route=>{if(new URL(route.request().url()).searchParams.has('after'))pageRequests++;await route.continue();});
    await box.getByRole('button',{name:'Load older frozen selections',exact:true}).evaluate((button:HTMLButtonElement)=>{button.click();button.click();});
    await page.waitForFunction(id=>document.querySelectorAll('[data-campaign-configuration="'+id+'"] select[aria-label="Frozen audience selection"] option').length===11,campaign.id);
    assert.equal(pageRequests,1);const options=await selector.locator('option').evaluateAll(options=>options.map(option=>(option as HTMLOptionElement).value));assert.equal(new Set(options).size,options.length);await page.unroute('**/v1/audience-snapshots?*');
    // Initial collection failure does not manufacture an empty audience or clear the captured source.
    await page.route('**/v1/audience-snapshots?*',route=>route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:{code:'OWNED_INITIAL_SOURCE_FAIL',message:'Owned frozen source collection unavailable.'}})}));await page.reload();
    await box.getByRole('alert').filter({hasText:'Owned frozen source collection unavailable.'}).waitFor();assert.equal(await selector.isDisabled(),true);await box.getByText('Captured audience source '+sources[25].id,{exact:false}).waitFor();
    await page.unroute('**/v1/audience-snapshots?*');await box.getByRole('button',{name:'Refresh frozen selections',exact:true}).click();await selector.waitFor();
    await snapshotID.fill(randomUUID());await box.getByRole('alert').filter({hasText:/not found/i}).waitFor();assert.equal(await save.isDisabled(),true);
    await snapshotID.fill(sources[0].id);await box.getByRole('status').filter({hasText:'Frozen audience verified.'}).waitFor();
    assert.equal(await selector.locator('option[value="'+sources[0].id+'"]').count(),1);
    await page.locator('.campaign-card').filter({has:box}).getByRole('button',{name:'Request review',exact:true}).click();
    await page.locator('.campaign-card').filter({has:box}).locator('.section-heading .badge').filter({hasText:'review pending'}).waitFor();
    await save.click();await box.getByRole('status').filter({hasText:'Draft configuration saved.'}).waitFor();assert.equal((await call(path)).campaign.version,5);assert.equal((await call(path)).campaign.state,'draft');
    // Editor sees the source and can preserve it, but makes no recipient metadata request.
    await db.query("UPDATE memberships SET role='Editor' WHERE workspace_id=$1 AND user_id=$2",[workspace,user]);let editorAudienceReads=0;page.on('request',request=>{if(request.url().includes('/v1/audience-snapshots'))editorAudienceReads++;});await page.reload();
    await box.getByText('Captured audience source '+sources[0].id,{exact:false}).waitFor();assert.equal(await selector.count(),0);
    await name.fill('Owned Editor content edit');await save.click();await box.getByRole('status').filter({hasText:'Draft configuration saved.'}).waitFor();
    assert.equal(editorAudienceReads,0);assert.equal((await call(path)).campaign.audience_snapshot.id,sources[0].id);
    await db.query("UPDATE memberships SET role='Owner' WHERE workspace_id=$1 AND user_id=$2",[workspace,user]);await page.reload();await selector.waitFor();
    // A new saved configuration must not replace invalid recovered input or advance its base.
    await name.fill('');await call(path+'/configuration','POST',{expected_version:6,name:'Owned remote current name',revision_id:revision.id,planned_timing:null});await page.reload();
    await box.getByRole('status').filter({hasText:'Unapplied campaign configuration edits recovered.'}).waitFor();assert.equal(await name.inputValue(),'');
    await box.getByText('Saved configuration advanced to v7.',{exact:false}).waitFor();assert.equal(await save.isDisabled(),true);
    await box.getByRole('button',{name:'Reload saved configuration',exact:true}).click();await page.waitForFunction(id=>document.querySelector<HTMLInputElement>('[data-campaign-configuration="'+id+'"] input')?.value==='Owned remote current name',campaign.id);
    // A saved selection is accepted, but the following current read fails; reload/retry retains body and key.
    await snapshotID.fill(sources[24].id);await box.getByRole('status').filter({hasText:'Frozen audience verified.'}).waitFor();
    const transmitted:{key:string;body:string}[]=[];await page.route('**/v1/'+path+'/configuration',async route=>{transmitted.push({key:route.request().headers()['idempotency-key'],body:route.request().postData()!});await route.continue();});
    await page.route('**/v1/'+path,route=>route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:{code:'OWNED_SELECTED_ACK_READ',message:'Owned selected source acknowledgment read unavailable.'}})}));
    await save.evaluate((button:HTMLButtonElement)=>{button.click();button.click();});await box.getByRole('alert').filter({hasText:'Owned selected source acknowledgment read unavailable.'}).waitFor();assert.equal(transmitted.length,1);
    const pendingSlot='lettercape.campaign-form.'+workspace+'.'+campaign.id,pendingRecord=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)!),pendingSlot);assert.equal(pendingRecord.pending.key,transmitted[0].key);assert.equal(pendingRecord.pending.body,transmitted[0].body);assert.equal(JSON.parse(transmitted[0].body).audience_snapshot_id,sources[24].id);
    assert.equal((await call(path)).campaign.version,8);await page.reload();await box.getByRole('button',{name:'Retry original configuration',exact:true}).waitFor();assert.equal(await name.isDisabled(),true);await page.unroute('**/v1/'+path);
    await db.query("UPDATE memberships SET role='Editor' WHERE workspace_id=$1 AND user_id=$2",[workspace,user]);
    const deniedCommand=page.waitForResponse(response=>new URL(response.url()).pathname==='/v1/'+path+'/configuration'&&response.request().method()==='POST'&&response.status()===403);
    await box.getByRole('button',{name:'Retry original configuration',exact:true}).click();const deniedResponse=await deniedCommand;assert.equal(deniedResponse.status(),403);assert.equal((await deniedResponse.json()).error.code,'INSUFFICIENT_SCOPE');
    assert.deepEqual(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)!).pending,pendingSlot),pendingRecord.pending);await db.query("UPDATE memberships SET role='Owner' WHERE workspace_id=$1 AND user_id=$2",[workspace,user]);
    await box.getByRole('button',{name:'Retry original configuration',exact:true}).click();await box.getByRole('status').filter({hasText:'Draft configuration saved.'}).waitFor();assert.equal(transmitted[2].key,transmitted[0].key);assert.equal(transmitted[2].body,transmitted[0].body);assert.equal((await call(path)).campaign.version,8);await page.unroute('**/v1/'+path+'/configuration');
    // Response loss followed by cancellation still permits only the original receipt, not fresh editing.
    await snapshotID.fill(sources[23].id);await box.getByRole('status').filter({hasText:'Frozen audience verified.'}).waitFor();
    await page.route('**/v1/'+path+'/configuration',async route=>{assert.equal((await route.fetch()).status(),200);await route.abort('failed');});await save.click();await box.getByRole('alert').filter({hasText:/fetch|Failed/i}).waitFor();await page.unroute('**/v1/'+path+'/configuration');
    await call(path+'/cancel','POST',{});await page.reload();await box.getByRole('button',{name:'Retry original configuration',exact:true}).waitFor();assert.equal(await save.isDisabled(),true);
    await box.getByRole('button',{name:'Retry original configuration',exact:true}).click();await box.getByRole('status').filter({hasText:'Current campaign state: cancelled.'}).waitFor();
    assert.equal((await call(path)).campaign.state,'cancelled');assert.equal((await call(path)).campaign.version,9);assert.equal((await call(path+'/configurations')).total_count,9);assert.equal((await call(path)).campaign.audience_snapshot.id,sources[23].id);assert.equal(await name.isDisabled(),true);
    await db.query("UPDATE memberships SET role='Viewer' WHERE workspace_id=$1 AND user_id=$2",[workspace,user]);await page.reload();await box.getByText('Captured audience source '+sources[23].id,{exact:false}).waitFor();assert.equal(await selector.count(),0);assert.equal(await save.isDisabled(),true);
    await box.getByRole('region',{name:'Configuration history',exact:true}).getByText('Audience source '+sources[23].id,{exact:false}).waitFor();
    console.log('Owned campaign audience interruption PASS: same-source no-op/omit preserve immutable membership, current suppression/new segment do not rewrite pin, failed/repeated/initial paging, outside-page explicit ID/not-found refusal, review reset, Editor preserve-only/no metadata fetch, invalid stale recovery, exact selected command across failed GET/reload/repeated clicks/current role denial and original receipt after cancellation, Viewer readonly history.');
    await db.query("UPDATE memberships SET role='Owner' WHERE workspace_id=$1 AND user_id=$2",[workspace,user]);await page.reload();await box.getByText('Captured audience source '+sources[23].id,{exact:false}).waitFor();
    async function switchWorkspace(id:string){await page.getByRole('button',{name:'Open navigation',exact:true}).click();await page.getByLabel('Active brand workspace',{exact:true}).selectOption(id);await page.waitForURL(url=>url.pathname==='/app');await page.getByRole('button',{name:'Open navigation',exact:true}).click();await page.getByRole('link',{name:'Campaigns',exact:true}).click();}
    await switchWorkspace(other);const emptyBox=page.locator('[data-campaign-configuration="'+otherCampaign.id+'"]'),emptyName=emptyBox.getByLabel('Configuration name',{exact:true});
    await emptyBox.getByText('No frozen selections are available.',{exact:true}).waitFor();assert.equal(await emptyBox.getByLabel('Frozen audience selection',{exact:true}).locator('option').count(),1);
    await emptyBox.getByLabel('Frozen audience snapshot ID',{exact:true}).fill(sources[0].id);await emptyBox.getByRole('alert').filter({hasText:/not found/i}).waitFor();assert.equal(await emptyBox.getByRole('button',{name:'Save draft configuration',exact:true}).isDisabled(),true);
    await emptyBox.getByLabel('Frozen audience snapshot ID',{exact:true}).fill('');
    await page.evaluate(()=>{const original=Storage.prototype.setItem;(window as unknown as {restoreCampaignStorage:()=>void}).restoreCampaignStorage=()=>{Storage.prototype.setItem=original;};Storage.prototype.setItem=function(key,value){if(key.startsWith('lettercape.campaign-form.'))throw new DOMException('Owned campaign quota fixture','QuotaExceededError');return original.call(this,key,value);};});
    await emptyName.fill('');await emptyBox.getByText('Browser storage is unavailable.',{exact:false}).waitFor();await switchWorkspace(workspace);await box.waitFor();await switchWorkspace(other);
    await emptyBox.getByRole('status').filter({hasText:'Unapplied campaign configuration edits recovered.'}).waitFor();assert.equal(await emptyName.inputValue(),'');
    let protectedExit=false;page.once('dialog',async dialog=>{assert.equal(dialog.type(),'beforeunload');protectedExit=true;await dialog.dismiss();});await page.goto(origin+'/app/emails').catch(e=>assert.match(String(e),/ERR_ABORTED/));assert.equal(protectedExit,true);assert.ok(page.url().endsWith('/app/campaigns'));
    await page.evaluate(()=>(window as unknown as {restoreCampaignStorage:()=>void}).restoreCampaignStorage());await emptyBox.getByRole('button',{name:'Reload saved configuration',exact:true}).click();await page.waitForFunction(id=>document.querySelector<HTMLInputElement>('[data-campaign-configuration="'+id+'"] input')?.value==='Owned empty captured campaign',otherCampaign.id);
    assert.equal((await call('campaigns/'+otherCampaign.id,'GET',undefined,undefined,other)).campaign.version,1);
    console.log('Owned campaign empty/storage browser PASS: honest empty metadata state, foreign source refusal, tab-only incomplete form recovery across actual mobile workspace navigation, beforeunload protects unsaved edits and explicit reload preserves server version.');
  }
}finally{
  await browser?.close();for(const w of[workspace,other]){for(const table of['campaigns','preflights','revisions','emails','outbox','idempotency','api_rate_events','api_keys','audience_snapshots','segment_versions','segments','suppressions','consent_events','contacts','audit_events','memberships','brands'])await db.query('DELETE FROM '+table+' WHERE workspace_id=$1',[w]);await db.query('DELETE FROM workspaces WHERE id=$1',[w]);}await db.query('DELETE FROM auth_sessions WHERE user_id=$1',[user]);await db.end();
}
