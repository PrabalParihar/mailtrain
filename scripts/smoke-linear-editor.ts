import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {spawn,type ChildProcess} from 'node:child_process';
import {open,mkdir,readFile} from 'node:fs/promises';
import {chromium} from 'playwright';
import {sourceDatabase} from './smoke-source-truth';
import {blankSpec} from '../src/domain/email';
import {createEmail} from '../src/server/emails';
import {digest} from '../src/server/audit';

const origin='http://127.0.0.1:3034';
await sourceDatabase(async({db,p,brand,tx})=>{
  const spec=blankSpec(brand,'Linear editing fixture');
  spec.sections=[
    {id:'hero',type:'hero',heading:'Hero fixture',text:'Supporting copy'},
    {id:'body',type:'text',text:'Editable body'},
    {id:'image',type:'image',src:'https://example.com/image.png',alt:'Product photo',decorative:false},
    {id:'cta',type:'button',label:'Main action',href:'https://example.com/action'},
    {id:'columns',type:'columns',columns:[[{id:'column-text',type:'text',text:'Column copy'},{id:'column-source',type:'custom_html',html:'<!--retained column-->\r\n<p>Column source é 😀</p>'}],[{id:'column-button',type:'button',label:'Column action',href:'https://example.com/column'}]]},
    {id:'divider',type:'divider'},
    {id:'social',type:'social',links:[{label:'Community',href:'https://example.com/social'}]},
    {id:'footer',type:'legal_footer',identity:'Fixture brand',address:'Fixture postal address',unsubscribe_slot:true},
    {id:'product',type:'product_card',title:'Fixture product',description:'Product details',price:'Approved USD 10',href:'https://example.com/product'},
    {id:'source',type:'custom_html',html:'<!--retained source-->\r\n<p>Literal é 😀</p>'},
  ];
  const doc=await tx(c=>createEmail(c,p,'Linear editing fixture',spec));
  const emptySpec={...spec,sections:[]};const empty=await tx(c=>createEmail(c,p,'Empty Outline fixture',emptySpec));
  const rawSpec={...spec,editing_mode:'raw_html' as const,raw_html:'<!--raw fixture-->\r\n<p>Raw Outline source</p>',sections:[]};
  const raw=await tx(c=>createEmail(c,p,'Raw Outline fixture',rawSpec));
  const rtlSpec={...spec,locale:'ar-SA' as const,direction:'rtl' as const,sections:spec.sections.map(block=>block.type==='hero'?{...block,heading:'مرحبا بكم',text:'تفاصيل الرسالة'}:block)};const rtl=await tx(c=>createEmail(c,p,'RTL Outline fixture',rtlSpec));
  const siblingRows=(await db.query('SELECT id,spec,doc_version FROM emails WHERE id<>$1 ORDER BY id',[doc.id])).rows;
  const readDraft=async()=> (await db.query('SELECT spec,doc_version FROM emails WHERE id=$1',[doc.id])).rows[0];
  const cookie=randomBytes(32).toString('hex');await db.query("INSERT INTO auth_sessions(token_hash,user_id,expires_at)VALUES($1,$2,clock_timestamp()+interval '1 hour')",[digest(cookie),p.user]);
  const runtime=new URL(process.env.DATABASE_URL!);runtime.pathname=new URL(db.options.connectionString!).pathname;assert.match(runtime.pathname,/^\/creation_fixture_[a-f0-9]{32}$/);
  const log=await open('/tmp/lettercape-linear-editor-app.log','w');let app:ChildProcess|undefined,browser:Awaited<ReturnType<typeof chromium.launch>>|undefined;
  try{
    app=spawn(process.execPath,['node_modules/next/dist/bin/next','dev','--hostname','127.0.0.1','--port','3034'],{env:{PATH:process.env.PATH,NODE_ENV:'development',LOCAL_DEVELOPMENT:'true',APP_ORIGIN:origin,DATABASE_URL:runtime.toString(),MIGRATION_DATABASE_URL:db.options.connectionString!,PREFERENCE_SIGNING_SECRET:process.env.PREFERENCE_SIGNING_SECRET,NEXT_TELEMETRY_DISABLED:'1',AI_GENERATION_ALLOWANCE:'0'},stdio:['ignore',log.fd,log.fd]});
    for(let n=0;n<120;n++){if(app.exitCode!==null)throw Error('Owned linear editor app exited');try{if((await fetch(origin)).ok)break;}catch{}if(n===119)throw Error('Owned linear editor app unavailable');await new Promise(r=>setTimeout(r,250));}
    browser=await chromium.launch({headless:true});const context=await browser.newContext({viewport:{width:390,height:1000},acceptDownloads:true});await context.addCookies([{name:'mailcraft_local_session',value:cookie,url:origin,sameSite:'Strict'}]);await context.addInitScript(w=>{if(window.top===window)localStorage.setItem('mailcraft.workspace',w);},p.workspace);
    let external=0;await context.route(url=>url.origin!==origin&&url.protocol!=='data:'&&url.protocol!=='blob:',route=>{external++;return route.abort();});
    context.setDefaultTimeout(15000);const page=await context.newPage(),errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
    await page.goto(origin+'/app/emails/'+doc.id);await page.getByRole('textbox',{name:'Subject',exact:true}).waitFor();
    assert.equal(await page.getByRole('button',{name:'Outline',exact:true}).count(),1,'A real linear Outline view is missing');
    const outline=page.getByRole('region',{name:'Linear email Outline',exact:true});await outline.waitFor();
    assert.equal(await outline.locator('[data-linear-block]').count(),10);
    const block=(id:string)=>outline.locator(`[data-linear-block="${id}"]`);
    const order=()=>outline.locator('[data-linear-block]').evaluateAll(nodes=>nodes.map(node=>node.getAttribute('data-linear-block')));
    const saved=()=>page.getByRole('status').filter({hasText:/^Saved · v/}).waitFor();
    const save=async()=>{await page.getByRole('button',{name:'Save',exact:true}).click();await saved();};
    const noOverflow=async()=>assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Outline must reflow within app viewport');
    assert.equal(await block('source').getByRole('textbox',{name:'Custom HTML source',exact:true}).inputValue(),(spec.sections[9] as {html:string}).html.replace(/\r\n/g,'\n'));
    await page.getByRole('textbox',{name:'Subject',exact:true}).fill('Saved Outline subject');
    await page.getByRole('textbox',{name:'Preheader',exact:true}).fill('Saved Outline preheader');
    await block('hero').getByRole('textbox',{name:'Heading',exact:true}).fill('Edited Outline heading');
    await block('hero').getByRole('textbox',{name:'Supporting text',exact:true}).fill('Edited support');
    await block('body').getByRole('textbox',{name:'Body text',exact:true}).fill('Edited Outline body');
    await block('image').getByRole('textbox',{name:'Alternative text',exact:true}).fill('Edited image description');
    await block('image').getByRole('checkbox',{name:'Decorative image',exact:true}).check();
    await block('cta').getByRole('textbox',{name:'Button label',exact:true}).fill('Edited action');
    await block('cta').getByRole('textbox',{name:'Destination URL',exact:true}).fill('https://example.com/edited-action');
    await block('columns').getByRole('textbox',{name:'Body text',exact:true}).fill('Edited nested copy');
    await block('columns').getByRole('textbox',{name:'Button label',exact:true}).fill('Edited nested action');
    await block('social').getByRole('textbox',{name:'Label',exact:true}).fill('Edited community');
    await block('footer').getByRole('textbox',{name:'Sender identity',exact:true}).fill('Edited fixture brand');
    await block('footer').getByRole('textbox',{name:'Postal address',exact:true}).fill('Edited fixture postal address');
    await block('product').getByRole('textbox',{name:'Product title',exact:true}).fill('Edited product');
    await block('product').getByRole('textbox',{name:'Approved price and currency',exact:true}).fill('Approved USD 12');
    await save();
    const draft=await readDraft();const edited=draft.spec;
    assert.equal(edited.subject,'Saved Outline subject');assert.equal(edited.preheader,'Saved Outline preheader');
    assert.equal(edited.sections[0].heading,'Edited Outline heading');assert.equal(edited.sections[4].columns[0][0].text,'Edited nested copy');
    assert.equal(edited.sections[4].columns[1][0].label,'Edited nested action');assert.deepEqual(edited.sections[4].columns[0][1],(spec.sections[4] as {columns:unknown[][]}).columns[0][1]);
    assert.deepEqual(edited.sections[9],spec.sections[9]);assert.deepEqual(edited.theme,spec.theme);
    console.log('All ten block types, nested fields, acknowledged save and untouched literal CRLF/Unicode source PASS.');

    const position=block('source').getByRole('combobox',{name:'Move custom_html 10 to position',exact:true});
    await position.focus();await page.keyboard.press('1');await page.keyboard.press('Tab');
    await page.waitForFunction(()=>document.querySelector('[data-linear-block]')?.getAttribute('data-linear-block')==='source');
    assert.deepEqual(await order(),['source',...spec.sections.slice(0,-1).map(b=>b.id)]);
    await block('source').getByRole('button',{name:'Move custom_html 1 down',exact:true}).focus();await page.keyboard.press('Enter');
    assert.equal((await order())[1],'source');await block('source').getByRole('button',{name:'Move custom_html 2 up',exact:true}).click();
    await block('source').getByRole('combobox',{name:'Move custom_html 1 to position',exact:true}).selectOption({value:'9'});await page.waitForFunction(()=>Array.from(document.querySelectorAll('[data-linear-block]')).at(-1)?.getAttribute('data-linear-block')==='source');assert.deepEqual(await order(),spec.sections.map(b=>b.id));
    const remove=block('divider').getByRole('button',{name:'Delete divider 6',exact:true});
    await remove.evaluate((button:HTMLButtonElement)=>{button.click();button.click();});assert.equal(await block('divider').count(),0);assert.equal((await order()).length,9);
    await page.getByRole('button',{name:'Undo',exact:true}).click();assert.deepEqual(await order(),spec.sections.map(b=>b.id),'Repeated deletion must consume only one undo step');
    await page.getByLabel('Block type',{exact:true}).selectOption('text');await page.getByRole('button',{name:'Add block',exact:true}).click();
    const added=(await order())[10]!;await block(added).getByRole('textbox',{name:'Body text',exact:true}).fill('Added Outline block');
    await block(added).getByRole('button',{name:'Delete text 11',exact:true}).click();
    await save();assert.deepEqual((await readDraft()).spec,edited);
    console.log('Actual keyboard position/up/down, repeated stable-id delete, undo, add and remove PASS.');

    const source='<p>Explicit custom source é 😀</p>';
    await block('source').getByRole('textbox',{name:'Custom HTML source',exact:true}).fill(source);
    await page.getByRole('button',{name:'Preview',exact:true}).click();await page.locator('iframe[title="Email browser simulation"]').waitFor();
    assert.equal(await page.locator('iframe[title="Email browser simulation"]').getAttribute('sandbox'),'');
    await page.getByRole('button',{name:'Plaintext',exact:true}).click();await page.getByRole('button',{name:'Outline',exact:true}).click();
    assert.equal(await block('source').getByRole('textbox',{name:'Custom HTML source',exact:true}).inputValue(),source);
    await save();await page.reload();await outline.waitFor();assert.equal(await block('hero').getByRole('textbox',{name:'Heading',exact:true}).inputValue(),'Edited Outline heading');
    assert.equal(await block('source').getByRole('textbox',{name:'Custom HTML source',exact:true}).inputValue(),source);
    for(const format of ['HTML','TXT']){
      const [download]=await Promise.all([page.waitForEvent('download'),page.locator('.export-panel').getByRole('button',{name:format,exact:true}).click()]);
      const contents=await readFile((await download.path())!,'utf8');const revision=(await db.query('SELECT spec,html,plaintext AS text FROM revisions WHERE email_id=$1 ORDER BY revision_no DESC LIMIT 1',[doc.id])).rows[0];
      assert.equal(contents,format==='HTML'?revision.html:revision.text);assert.equal(revision.spec.sections[9].html,source);assert.ok(contents.includes('Edited Outline heading'));assert.ok(contents.includes('Edited nested copy'));
    }
    console.log('Actual view switches, saved reload, explicit source edit and exact frozen HTML/TXT downloads PASS.');

    const endpoint=origin+'/v1/emails/'+doc.id+'/draft';
    const captures:Array<{key:string|undefined,match:string|undefined,body:string|null}>=[];
    const capture=(request:import('playwright').Request)=>({key:request.headers()['idempotency-key'],match:request.headers()['if-match'],body:request.postData()});
    await page.route(endpoint,async route=>{captures.push(capture(route.request()));await route.fetch();await route.fulfill({status:503,json:{error:{code:'FIXTURE_ACK_LOST',message:'Owned save receipt lost'}}});});
    await block('body').getByRole('textbox',{name:'Body text',exact:true}).fill('Retained after lost acknowledgment');
    await page.getByRole('button',{name:'Save',exact:true}).evaluate((button:HTMLButtonElement)=>{button.click();button.click();});
    await page.getByRole('alert').filter({hasText:'Owned save receipt lost'}).waitFor();assert.equal(captures.length,1);
    const committed=await readDraft();assert.equal(committed.spec.sections[1].text,'Retained after lost acknowledgment');
    await page.reload();await page.getByRole('button',{name:'Retry original save acknowledgment',exact:true}).waitFor();
    assert.equal(await block('body').getByRole('textbox',{name:'Body text',exact:true}).inputValue(),'Retained after lost acknowledgment');
    await page.unroute(endpoint);await page.route(endpoint,async route=>{captures.push(capture(route.request()));await route.continue();});
    await page.getByRole('button',{name:'Retry original save acknowledgment',exact:true}).click();await saved();await page.unroute(endpoint);
    assert.equal(captures.length,2);assert.deepEqual(captures[1],captures[0]);assert.equal((await readDraft()).doc_version,committed.doc_version);
    console.log('Actual repeated Save, lost committed receipt, reload and original-command retry without a second version PASS.');

    // A partial URL stays editable through validation failure; correcting it saves the same draft.
    const beforeInvalid=await readDraft();let invalidDraftWrites=0;
    const invalidMonitor=(request:import('playwright').Request)=>{if(request.url()===endpoint&&request.method()==='PATCH')invalidDraftWrites++;};page.on('request',invalidMonitor);
    await block('cta').getByRole('textbox',{name:'Destination URL',exact:true}).fill('https://');
    await page.getByRole('button',{name:'Save',exact:true}).click();await page.locator('.alert.danger[role="alert"]').waitFor();
    assert.equal(await block('cta').getByRole('textbox',{name:'Destination URL',exact:true}).inputValue(),'https://');
    assert.equal(await page.getByRole('button',{name:'Retry original save acknowledgment',exact:true}).count(),0);assert.equal(invalidDraftWrites,0);assert.deepEqual(await readDraft(),beforeInvalid);page.off('request',invalidMonitor);
    await block('cta').getByRole('textbox',{name:'Destination URL',exact:true}).fill('https://example.com/corrected');await save();
    assert.equal((await readDraft()).spec.sections[3].href,'https://example.com/corrected');
    await page.getByRole('link',{name:'Emails',exact:true}).click();await page.waitForURL(origin+'/app/emails');await page.goBack();await outline.waitFor();
    assert.equal(await block('body').getByRole('textbox',{name:'Body text',exact:true}).inputValue(),'Retained after lost acknowledgment');
    for(const width of [390,320]){await page.setViewportSize({width,height:1000});await noOverflow();assert.ok(await outline.locator('input,textarea,select,button').evaluateAll(nodes=>nodes.every(node=>{const rect=node.getBoundingClientRect();return rect.left>=0&&rect.right<=innerWidth+1;})),'Outline controls must remain inside the visible viewport');}
    await mkdir('output/linear-editor',{recursive:true});await outline.getByRole('heading',{name:'Edit in Outline',exact:true}).scrollIntoViewIfNeeded();await page.screenshot({path:'output/linear-editor/mobile.png'});
    await page.setViewportSize({width:720,height:1000});await page.evaluate(()=>document.documentElement.style.fontSize='200%');await noOverflow();
    await block('columns').getByRole('textbox',{name:'Body text',exact:true}).focus();await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(()=>document.activeElement?.getAttribute('aria-label')),'Move text 1 in column 1 down');
    for(let tab=0;tab<4;tab++)await page.keyboard.press('Tab');
    assert.equal(await block('columns').getByRole('textbox',{name:'Custom HTML source',exact:true}).evaluate(field=>field===document.activeElement),true);
    await page.screenshot({path:'output/linear-editor/text-zoom.png'});await page.evaluate(()=>document.documentElement.style.fontSize='');
    console.log('Actual partial-input error/correction, navigation, 320px reflow and 200% root text zoom PASS.');

    assert.deepEqual((await db.query('SELECT id,spec,doc_version FROM emails WHERE id<>$1 ORDER BY id',[doc.id])).rows,siblingRows,'Editing one draft must preserve sibling drafts');
    await page.goto(origin+'/app/emails/'+empty.id);await outline.waitFor();await outline.getByText('This email has no blocks. Use Add block to start writing.',{exact:true}).waitFor();
    await page.getByLabel('Block type',{exact:true}).selectOption('text');await page.getByRole('button',{name:'Add block',exact:true}).click();assert.equal(await outline.locator('[data-linear-block]').count(),1);await save();
    await page.getByRole('button',{name:'Add block',exact:true}).evaluate((button:HTMLButtonElement)=>{button.click();button.click();});
    assert.equal(await outline.locator('[data-linear-block]').count(),3,'Repeated Add must preserve both new block IDs');await save();
    await page.goto(origin+'/app/emails/'+raw.id);await outline.getByRole('heading',{name:'Raw source Outline',exact:true}).waitFor();
    const rawField=outline.getByRole('textbox',{name:'Raw HTML source in Outline',exact:true});assert.equal(await rawField.getAttribute('readonly'),'');
    assert.equal(await rawField.inputValue(),rawSpec.raw_html.replace(/\r\n/g,'\n'));assert.equal(await outline.locator('[data-linear-block]').count(),0);
    await page.goto(origin+'/app/emails/'+rtl.id);await outline.waitFor();
    assert.equal(await block('hero').getByRole('textbox',{name:'Heading',exact:true}).getAttribute('lang'),'ar-SA');assert.equal(await block('hero').getByRole('textbox',{name:'Heading',exact:true}).inputValue(),'مرحبا بكم');assert.equal(await block('hero').getByRole('textbox',{name:'Heading',exact:true}).getAttribute('dir'),'rtl');
    assert.equal(await block('cta').getByRole('textbox',{name:'Destination URL',exact:true}).getAttribute('dir'),'ltr');assert.equal(await outline.getAttribute('dir'),'ltr');await noOverflow();await outline.getByRole('heading',{name:'Edit in Outline',exact:true}).scrollIntoViewIfNeeded();await page.screenshot({path:'output/linear-editor/rtl.png'});

    const beforeViewer=await readDraft();
    const viewer='outline-viewer-'+randomBytes(8).toString('hex'),viewerCookie=randomBytes(32).toString('hex');
    await db.query("INSERT INTO memberships(workspace_id,user_id,role)VALUES($1,$2,'Viewer')",[p.workspace,viewer]);
    await db.query("INSERT INTO auth_sessions(token_hash,user_id,expires_at)VALUES($1,$2,clock_timestamp()+interval '1 hour')",[digest(viewerCookie),viewer]);
    const viewerContext=await browser.newContext({viewport:{width:390,height:1000}});await viewerContext.route(url=>url.origin!==origin&&url.protocol!=='data:'&&url.protocol!=='blob:',route=>{external++;return route.abort();});await viewerContext.addCookies([{name:'mailcraft_local_session',value:viewerCookie,url:origin,sameSite:'Strict'}]);await viewerContext.addInitScript(w=>{if(window.top===window)localStorage.setItem('mailcraft.workspace',w);},p.workspace);
    let viewerWrites=0;const viewerPage=await viewerContext.newPage();viewerPage.on('request',r=>{if(new URL(r.url()).pathname.startsWith('/v1/')&&r.method()!=='GET'&&!new URL(r.url()).pathname.endsWith('/preview'))viewerWrites++;});
    await viewerPage.goto(origin+'/app/emails/'+doc.id);const viewerOutline=viewerPage.getByRole('region',{name:'Linear email Outline',exact:true});await viewerOutline.waitFor();
    const viewerText=viewerOutline.locator('[data-linear-block="body"]').getByRole('textbox',{name:'Body text',exact:true});assert.equal(await viewerText.getAttribute('readonly'),'');await viewerText.focus();
    assert.equal(await viewerText.isDisabled(),false);assert.equal(await viewerOutline.getByRole('button',{name:'Delete hero 1',exact:true}).isDisabled(),true);
    assert.equal(await viewerPage.getByRole('button',{name:'Save',exact:true}).isDisabled(),true);
    // Existing preview is a read-only POST and is expected; do not claim a new permission qualification.
    assert.equal(viewerWrites,0);assert.deepEqual(await readDraft(),beforeViewer);await viewerContext.close();
    await page.setViewportSize({width:1440,height:1000});await page.reload();await page.getByRole('button',{name:'Preview',exact:true}).waitFor();
    assert.equal(await page.getByRole('button',{name:'Outline',exact:true}).getAttribute('aria-pressed'),'false');
    await page.getByRole('button',{name:'Outline',exact:true}).click();await outline.waitFor();await outline.getByRole('heading',{name:'Edit in Outline',exact:true}).scrollIntoViewIfNeeded();await page.screenshot({path:'output/linear-editor/desktop.png'});
    assert.deepEqual(errors,[]);assert.equal(external,0);
    console.log('Actual empty/add, truthful raw authority, authored RTL/LTR links, copyable Viewer fields, desktop default and no external requests PASS.');
  }finally{
    if(browser)await browser.close();if(app&&app.exitCode===null){const exited=new Promise<void>(resolve=>app!.once('exit',()=>resolve()));app.kill('SIGTERM');await Promise.race([exited,new Promise<void>(resolve=>setTimeout(resolve,5000))]);if(app.exitCode===null){app.kill('SIGKILL');await exited;}}await log.close();
  }
});
console.log('Owned linear editor app stopped and disposable database removed PASS.');
