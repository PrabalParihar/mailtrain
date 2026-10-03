import assert from 'node:assert/strict';
import {randomBytes,randomUUID} from 'node:crypto';
import {spawn,type ChildProcess} from 'node:child_process';
import {open,readFile,mkdir} from 'node:fs/promises';
import {chromium,type Page} from 'playwright';
import {sourceDatabase} from './smoke-source-truth';
import {digest} from '../src/server/audit';
import {creationReportCSV} from '../src/domain/creation-report';
import {validateApiResponse} from './api-validation';

const origin='http://127.0.0.1:3032';
async function noOverflow(page:Page){assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Report must fit viewport.');}
await sourceDatabase(async({db,p})=>{
  const cookie=randomBytes(32).toString('hex');
  await db.query("INSERT INTO auth_sessions(token_hash,user_id,expires_at)VALUES($1,$2,clock_timestamp()+interval '1 hour')",[digest(cookie),p.user]);
  const emptyWorkspace=randomUUID();
  await db.query("INSERT INTO workspaces(id,name)VALUES($1,'Empty reporting workspace')",[emptyWorkspace]);
  await db.query("INSERT INTO memberships(workspace_id,user_id,role)VALUES($1,$2,'Owner')",[emptyWorkspace,p.user]);
  for(const [state,created,completed]of [['succeeded','2026-03-08T04:30:00Z','2026-03-08T04:30:10Z'],['succeeded','2026-03-08T05:30:00Z','2026-03-08T05:30:30Z'],['succeeded','2026-03-08T07:30:00Z',null],['failed','2026-03-08T08:00:00Z',null],['running','2026-03-08T09:00:00Z',null],['cancel_requested','2026-03-08T10:00:00Z',null]])
    await db.query('INSERT INTO operations(workspace_id,id,type,state,input,result,created_by,created_at,completed_at)VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)',[p.workspace,randomUUID(),'email.generate',state,{prompt:'PRIVATE SYNTHETIC PROMPT'},{text:'PRIVATE SYNTHETIC RESPONSE'},p.user,created,completed]);
  const original=(await db.query('SELECT * FROM operations ORDER BY id')).rows;
  const runtime=new URL(process.env.DATABASE_URL!);runtime.pathname=new URL(db.options.connectionString!).pathname;
  assert.match(runtime.pathname,/^\/creation_fixture_[a-f0-9]{32}$/);
  const log=await open('/tmp/lettercape-creation-report-app.log','w');let app:ChildProcess|undefined,browser:Awaited<ReturnType<typeof chromium.launch>>|undefined;
  try{
    app=spawn(process.execPath,['node_modules/next/dist/bin/next','dev','--hostname','127.0.0.1','--port','3032'],{env:{PATH:process.env.PATH,NODE_ENV:'development',LOCAL_DEVELOPMENT:'true',APP_ORIGIN:origin,DATABASE_URL:runtime.toString(),MIGRATION_DATABASE_URL:db.options.connectionString!,PREFERENCE_SIGNING_SECRET:process.env.PREFERENCE_SIGNING_SECRET,NEXT_TELEMETRY_DISABLED:'1',AI_GENERATION_ALLOWANCE:'0'},stdio:['ignore',log.fd,log.fd]});
    for(let n=0;n<120;n++){if(app.exitCode!==null)throw Error('Owned report app exited');try{if((await fetch(origin)).ok)break;}catch{}if(n===119)throw Error('Owned report app unavailable');await new Promise(r=>setTimeout(r,250));}
    browser=await chromium.launch({headless:true});const context=await browser.newContext({viewport:{width:1440,height:1000},acceptDownloads:true});
    await context.addCookies([{name:'mailcraft_local_session',value:cookie,url:origin,sameSite:'Strict'}]);
    await context.addInitScript(w=>{if(top===window&&!localStorage.getItem('mailcraft.workspace'))localStorage.setItem('mailcraft.workspace',w);},p.workspace);
    let external=0,writes=0;await context.route(url=>url.origin!==origin&&url.protocol!=='data:'&&url.protocol!=='blob:',route=>{external++;return route.abort();});
    const page=await context.newPage(),errors:string[]=[];
    page.on('pageerror',e=>errors.push(e.message));page.on('request',request=>{if(new URL(request.url()).pathname.startsWith('/v1/')&&request.method()!=='GET')writes++;});
    await page.goto(origin+'/app/reports');
    const snapshot=page.getByRole('region',{name:'Creation activity snapshot',exact:true}),apply=page.getByRole('button',{name:'Apply report window',exact:true}),refresh=page.getByRole('button',{name:'Refresh report',exact:true}),csv=page.getByRole('button',{name:'Download report CSV',exact:true});
    await snapshot.getByRole('heading',{name:'No recorded operations in this window.'}).waitFor();
    await snapshot.getByText('Completion timing is unavailable for this window.',{exact:true}).waitFor();
    const start=page.getByLabel('Start date (inclusive, UTC)',{exact:true}),end=page.getByLabel('End date (exclusive, UTC)',{exact:true}),zone=page.getByLabel('Daily grouping time zone',{exact:true});
    await start.fill('2026-03-08');await end.fill('2026-03-09');await zone.fill('America/New_York');assert.equal(await csv.isEnabled(),false);
    let reads=0;const endpoint=origin+'/v1/operations/report**';
    await page.route(endpoint,async route=>{reads++;await new Promise(r=>setTimeout(r,200));await route.continue();});
    await apply.evaluate((button:HTMLButtonElement)=>{button.click();button.click();});
    await snapshot.getByText('2 valid successful completion samples; 1 successful operations missing usable timing.',{exact:true}).waitFor();assert.equal(reads,1);await page.unroute(endpoint);
    assert.equal(await snapshot.locator('dt').filter({hasText:/^Total operations$/}).locator('+ dd').innerText(),'6');
    await snapshot.getByText('20.0 seconds',{exact:true}).waitFor();await snapshot.getByText('28.0 seconds',{exact:true}).waitFor();
    const rows=snapshot.getByRole('row');assert.equal(await rows.count(),3);
    assert.ok((await snapshot.innerText()).includes('2026-03-07'));
    const reportURL=origin+'/v1/operations/report?type=email.generate&created_after=2026-03-08T00:00:00.000Z&created_before=2026-03-09T00:00:00.000Z&time_zone=America%2FNew_York';
    const response=await context.request.get(reportURL,{headers:{'X-Workspace-Id':p.workspace,'X-Actor-Id':p.user}}),payload=await response.json();assert.equal(response.status(),200);validateApiResponse('getCreationActivityReport',200,payload);
    assert.equal(JSON.stringify(payload).includes('PRIVATE SYNTHETIC'),false);
    const [download]=await Promise.all([page.waitForEvent('download'),csv.click()]);const contents=await readFile((await download.path())!,'utf8');
    // Compare to the displayed report's actual captured generated_at, not a later server read.
    const cells=contents.split('\r\n')[1].split(',');const actualSnapshot={...payload.report,generated_at:cells[1]};assert.equal(contents,creationReportCSV(actualSnapshot));
    console.log('Actual durable cohort, cutoff, daily timezone, measured/missing timing, repeated click and exact snapshot CSV PASS.');

    await start.fill('2026-01-01');await apply.click();await page.getByRole('alert').filter({hasText:'up to 31 days'}).waitFor();assert.equal(await start.inputValue(),'2026-01-01');assert.equal(await csv.isEnabled(),false);
    await start.fill('2026-03-08');
    await page.route(endpoint,route=>route.fulfill({status:503,json:{error:{code:'FIXTURE_UNAVAILABLE',message:'Owned report unavailable'}}}));
    await apply.click();await page.getByRole('alert').filter({hasText:'Owned report unavailable'}).waitFor();assert.equal(await snapshot.count(),0);assert.equal(await csv.isEnabled(),false);assert.equal(await zone.inputValue(),'America/New_York');
    await page.unroute(endpoint);await page.getByRole('button',{name:'Retry report',exact:true}).click();await snapshot.getByText('20.0 seconds',{exact:true}).waitFor();
    let started!:()=>void,release!:()=>void;
    const delayed=new Promise<void>(resolve=>{started=resolve;}),resume=new Promise<void>(resolve=>{release=resolve;});
    await page.route(endpoint,async route=>{const actual=await route.fetch();started();await resume;try{await route.fulfill({response:actual});}catch{/* Leaving the report may abort this owned read. */}});
    await refresh.click();await delayed;await page.goto(origin+'/app/emails');release();await page.unroute(endpoint);
    assert.equal(await snapshot.count(),0);await page.goto(origin+'/app/reports');await snapshot.getByRole('heading',{name:'No recorded operations in this window.'}).waitFor();
    console.log('Actual invalid/error preservation, retry and interrupted navigation PASS.');

    await start.fill('2026-03-08');await end.fill('2026-03-09');await zone.fill('America/New_York');await apply.click();await snapshot.getByText('20.0 seconds',{exact:true}).waitFor();
    for(const width of [390,320]){await page.setViewportSize({width,height:1000});await noOverflow(page);await csv.scrollIntoViewIfNeeded();assert.equal(await csv.isEnabled(),true);await snapshot.getByRole('region',{name:'Daily creation activity',exact:true}).focus();}
    await mkdir('output/creation-report',{recursive:true});await page.screenshot({path:'output/creation-report/mobile.png',fullPage:true});
    await page.setViewportSize({width:1440,height:1000});
    await page.getByLabel('Active brand workspace',{exact:true}).selectOption(emptyWorkspace);await page.waitForURL(origin+'/app');await page.goto(origin+'/app/reports');await snapshot.getByRole('heading',{name:'No recorded operations in this window.'}).waitFor();
    assert.equal(await snapshot.locator('dt').filter({hasText:/^Total operations$/}).locator('+ dd').innerText(),'0');
    const viewer='report-viewer-'+randomUUID(),viewerCookie=randomBytes(32).toString('hex');
    await db.query("INSERT INTO memberships(workspace_id,user_id,role)VALUES($1,$2,'Viewer')",[p.workspace,viewer]);await db.query("INSERT INTO auth_sessions(token_hash,user_id,expires_at)VALUES($1,$2,clock_timestamp()+interval '1 hour')",[digest(viewerCookie),viewer]);
    const view=await browser.newContext({viewport:{width:1440,height:1000}});await view.addCookies([{name:'mailcraft_local_session',value:viewerCookie,url:origin,sameSite:'Strict'}]);const viewerPage=await view.newPage();await viewerPage.goto(origin+'/app/reports');await viewerPage.getByRole('heading',{name:'No recorded operations in this window.'}).waitFor();await view.close();
    assert.deepEqual((await db.query('SELECT * FROM operations ORDER BY id')).rows,original);assert.equal(writes,0);assert.equal(external,0);assert.deepEqual(errors,[]);
    console.log('Actual320/390px, workspace change, ordinary Viewer read and unchanged records PASS; no providers or writes.');
  }finally{
    if(browser)await browser.close();
    if(app&&app.exitCode===null){const exited=new Promise<void>(resolve=>app!.once('exit',()=>resolve()));app.kill('SIGTERM');await Promise.race([exited,new Promise<void>(resolve=>setTimeout(resolve,5000))]);if(app.exitCode===null){app.kill('SIGKILL');await exited;}}
    await log.close();
  }
});
console.log('Owned creation-report app stopped and disposable database removed PASS.');
