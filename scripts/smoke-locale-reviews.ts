import assert from 'node:assert/strict';
import {randomBytes,randomUUID} from 'node:crypto';
import {spawn,type ChildProcess} from 'node:child_process';
import {open} from 'node:fs/promises';
import {chromium} from 'playwright';
import {sourceDatabase} from './smoke-source-truth';
import {blankSpec} from '../src/domain/email';
import {createEmail,checkpoint,saveDraft} from '../src/server/emails';
import {deriveEmail} from '../src/server/derivation';
import {digest} from '../src/server/audit';
import {validateApiResponse} from './api-validation';

const origin='http://127.0.0.1:3031';
await sourceDatabase(async({db,p,brand,tx})=>{
  const parent=await tx(c=>createEmail(c,p,'Review source',blankSpec(brand,'Source')));
  const source=await tx(c=>checkpoint(c,p,parent.id,1));
  const child=(await tx(c=>deriveEmail(c,p,source.id,{kind:'locale',title:'Manual Hebrew review fixture',locale:'he-IL'}))).email;
  const other=(await tx(c=>deriveEmail(c,p,source.id,{kind:'locale',title:'Manual French fixture',locale:'fr-FR'}))).email;
  const cookie=randomBytes(32).toString('hex');
  await db.query("INSERT INTO auth_sessions(token_hash,user_id,expires_at)VALUES($1,$2,clock_timestamp()+interval '1 hour')",[digest(cookie),p.user]);
  const runtime=new URL(process.env.DATABASE_URL!);runtime.pathname=new URL(db.options.connectionString!).pathname;
  assert.match(runtime.pathname,/^\/creation_fixture_[a-f0-9]{32}$/);
  const log=await open('/tmp/lettercape-review-app.log','w');let app:ChildProcess|undefined,browser:Awaited<ReturnType<typeof chromium.launch>>|undefined;
  try{
    app=spawn(process.execPath,['node_modules/next/dist/bin/next','dev','--hostname','127.0.0.1','--port','3031'],{env:{PATH:process.env.PATH,NODE_ENV:'development',LOCAL_DEVELOPMENT:'true',APP_ORIGIN:origin,DATABASE_URL:runtime.toString(),MIGRATION_DATABASE_URL:db.options.connectionString!,PREFERENCE_SIGNING_SECRET:process.env.PREFERENCE_SIGNING_SECRET,NEXT_TELEMETRY_DISABLED:'1',AI_GENERATION_ALLOWANCE:'0'},stdio:['ignore',log.fd,log.fd]});
    for(let n=0;n<120;n++){if(app.exitCode!==null)throw Error('Owned review app exited');try{if((await fetch(origin)).ok)break;}catch{}if(n===119)throw Error('Owned review app unavailable');await new Promise(r=>setTimeout(r,250));}
    browser=await chromium.launch({headless:true});const context=await browser.newContext({viewport:{width:1440,height:1000}});
    await context.addCookies([{name:'mailcraft_local_session',value:cookie,url:origin,sameSite:'Strict'}]);
    await context.addInitScript(w=>{if(top===window)localStorage.setItem('mailcraft.workspace',w);},p.workspace);
    let external=0;await context.route(url=>url.origin!==origin&&url.protocol!=='data:'&&url.protocol!=='blob:',route=>{external++;return route.abort();});
    const page=await context.newPage(),errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&m.text().includes('same key'))errors.push(m.text());});
    await page.goto(origin+'/app/emails/'+child.id);
    const region=page.getByRole('region',{name:'Manual language review'}),endpoint=origin+'/v1/emails/'+child.id+'/locale-reviews';
    await region.waitFor({timeout:10000});
    await region.getByText('No language review has been recorded.').waitFor();
    const note=region.getByRole('textbox',{name:'Review note'}),record=region.getByRole('button',{name:'Record content review',exact:true});
    assert.equal(await record.isEnabled(),false);
    const bodyBefore=(await db.query('SELECT id,doc_version,spec FROM emails ORDER BY id')).rows;
    await note.fill('בדקתי את הנוסח. <script>window.__reviewExecuted=true</script>');
    let posts=0;await page.route(endpoint+'**',async route=>{if(route.request().method()==='POST'){posts++;await new Promise(r=>setTimeout(r,250));}await route.continue();});
    await record.evaluate((b:HTMLButtonElement)=>{b.click();b.click();});
    await region.getByRole('heading',{name:'Content reviewed',exact:true}).waitFor();assert.equal(posts,1);await page.unroute(endpoint+'**');
    assert.deepEqual((await db.query('SELECT id,doc_version,spec FROM emails ORDER BY id')).rows,bodyBefore);
    assert.equal(await page.evaluate(()=>Reflect.get(window,'__reviewExecuted')),undefined);
    await page.reload();await region.getByRole('heading',{name:'Content reviewed',exact:true}).waitFor();
    assert.ok((await region.innerText()).includes('<script>window.__reviewExecuted=true</script>'));
    assert.equal((await db.query('SELECT count(*)::int n FROM locale_content_reviews')).rows[0].n,1);
    console.log('Actual manual review empty/required-note, repeated click, escaped note, durable reload and unchanged draft PASS.');

    // Commit the actual command, then deliberately lose its HTTP receipt.
    await note.fill('Second manual note');await region.getByRole('combobox',{name:'Review outcome'}).selectOption('changes_requested');
    await page.route(endpoint+'**',async route=>{if(route.request().method()==='POST'){await route.fetch();await route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:{code:'FIXTURE_RECEIPT_LOST',message:'Owned review receipt unavailable'}})});}else await route.continue();});
    await record.click();await region.getByRole('alert').filter({hasText:'Owned review receipt unavailable'}).waitFor();
    await page.unroute(endpoint+'**');await page.reload();await region.getByRole('button',{name:'Retry original review'}).waitFor();
    await region.getByRole('button',{name:'Retry original review'}).click();await region.getByRole('heading',{name:'Changes requested',exact:true}).first().waitFor();
    assert.equal((await db.query('SELECT count(*)::int n FROM locale_content_reviews')).rows[0].n,2);
    console.log('Actual committed/lost receipt survives reload and same-command retry without duplicate review PASS.');

    await tx(c=>saveDraft(c,p,parent.id,1,{...parent.spec,subject:'Changed original source'}));
    await region.getByRole('button',{name:'Refresh review history',exact:true}).click();
    await region.getByText('Source changed since this review.',{exact:true}).first().waitFor();
    await note.fill('Preserve this note on stale source refusal');
    await tx(c=>saveDraft(c,p,parent.id,2,{...parent.spec,subject:'Source changed again'}));
    await record.click();await region.getByRole('alert').filter({hasText:'source changed'}).waitFor();assert.equal(await note.inputValue(),'Preserve this note on stale source refusal');
    assert.equal((await db.query('SELECT count(*)::int n FROM locale_content_reviews')).rows[0].n,2);
    await region.getByRole('button',{name:'Refresh review history',exact:true}).click();
    await page.getByRole('textbox',{name:'Subject',exact:true}).fill('נוסח חדש');
    assert.equal(await record.isEnabled(),false);
    await page.getByRole('button',{name:'Save',exact:true}).click();await page.getByRole('status').filter({hasText:'Saved · v2'}).waitFor();
    await region.getByText('Create a checkpoint of this saved locale draft before recording a review.',{exact:true}).waitFor();
    await region.getByText('Locale and source changed since this review.',{exact:true}).first().waitFor();
    await page.getByRole('button',{name:'History',exact:true}).click();
    const checkpointResponse=page.waitForResponse(response=>response.url()===origin+'/v1/emails/'+child.id+'/revisions'&&response.request().method()==='POST').then(response=>({response}),error=>({error}));
    await page.getByRole('button',{name:'Create checkpoint',exact:true}).click();const checkpointResult=await checkpointResponse;if('error'in checkpointResult)throw checkpointResult.error;assert.equal(checkpointResult.response.status(),200);
    await region.getByRole('button',{name:'Refresh review history',exact:true}).click();await region.getByText('Review target: locale checkpoint 2.',{exact:true}).waitFor();
    assert.equal(await record.isEnabled(),true);
    console.log('Actual source drift refusal retains note; unsaved/local changes and checkpoint requirements remain visible PASS.');

    await page.route(endpoint+'**',route=>route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:{code:'FIXTURE_UNAVAILABLE',message:'Owned review history unavailable'}})}));
    await region.getByRole('button',{name:'Refresh review history',exact:true}).click();await region.getByRole('alert').filter({hasText:'Owned review history unavailable'}).waitFor();
    assert.equal(await record.isEnabled(),false);assert.equal(await note.inputValue(),'Preserve this note on stale source refusal');
    await page.unroute(endpoint+'**');await region.getByRole('button',{name:'Refresh review history',exact:true}).click();await region.getByRole('heading',{name:'Changes requested',exact:true}).first().waitFor();
    const headers={'X-Workspace-Id':p.workspace,'X-Actor-Id':p.user,Origin:origin};
    const contextResponse=await context.request.get(endpoint,{headers}),current=await contextResponse.json();
    validateApiResponse('listLocaleReviews',200,current);
    for(let n=0;n<11;n++){
      const response=await context.request.post(endpoint,{headers:{...headers,'If-Match':'"draft-2"','Idempotency-Key':randomUUID()},data:{revision_id:current.context.target_revision.id,source_revision_id:source.id,expected_source_doc_version:3,outcome:'content_reviewed',note:'Synthetic pagination review '+n}});
      assert.equal(response.status(),201);validateApiResponse('recordLocaleReview',201,await response.json());
    }
    await region.getByRole('button',{name:'Refresh review history',exact:true}).click();await region.getByRole('button',{name:'Load older language reviews'}).waitFor();
    const items=region.getByRole('list',{name:'Language review history'}).getByRole('listitem');assert.equal(await items.count(),10);
    await region.getByRole('button',{name:'Load older language reviews'}).click();await region.getByText('Second manual note',{exact:true}).waitFor();assert.equal(await items.count(),13);
    console.log('Actual paged history and generated API response conformance PASS.');
    await page.setViewportSize({width:390,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    await region.scrollIntoViewIfNeeded();await page.screenshot({path:'/tmp/lettercape-review-mobile.png'});
    // A delayed read cannot replace a different draft after navigation.
    let release!:()=>void,arrived!:()=>void;const held=new Promise<void>(r=>release=r),fetched=new Promise<void>(r=>arrived=r);
    await page.route(endpoint+'**',async route=>{const response=await route.fetch();arrived();await held;try{await route.fulfill({response});}catch{}});
    await region.getByRole('button',{name:'Refresh review history',exact:true}).click();await fetched;
    await page.goto(origin+'/app/emails/'+other.id);release();await page.unroute(endpoint+'**');
    await region.getByText('No language review has been recorded.').waitFor();assert.equal(await note.inputValue(),'');
    const viewer='review-viewer-'+randomUUID(),viewerCookie=randomBytes(32).toString('hex');
    await db.query("INSERT INTO memberships(workspace_id,user_id,role)VALUES($1,$2,'Viewer')",[p.workspace,viewer]);
    await db.query("INSERT INTO auth_sessions(token_hash,user_id,expires_at)VALUES($1,$2,clock_timestamp()+interval '1 hour')",[digest(viewerCookie),viewer]);
    await context.addCookies([{name:'mailcraft_local_session',value:viewerCookie,url:origin,sameSite:'Strict'}]);
    await page.goto(origin+'/app/emails/'+child.id);await region.getByRole('heading',{name:'Content reviewed',exact:true}).first().waitFor();
    assert.equal(await region.getByRole('textbox',{name:'Review note'}).count(),0);assert.equal(await region.getByRole('button',{name:'Record content review'}).count(),0);
    await region.getByText('Owner, Admin and Editor accounts can record a content review.',{exact:false}).waitFor();
    assert.equal(external,0);assert.deepEqual(errors,[]);
    console.log('Actual unavailable/retry, note preservation, Hebrew390px and delayed navigation isolation PASS; no providers.');
  }finally{
    await browser?.close();
    if(app&&app.exitCode===null){app.kill('SIGTERM');await new Promise<void>((resolve,reject)=>{const timer=setTimeout(()=>{app!.kill('SIGKILL');reject(Error('Owned review app required forced termination'));},10000);app!.once('exit',()=>{clearTimeout(timer);resolve();});});}
    await log.close();
  }
});
console.log('Owned locale review app stopped and disposable database removed PASS.');
