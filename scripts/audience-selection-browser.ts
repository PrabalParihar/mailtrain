import assert from 'node:assert/strict';
import { randomUUID, randomBytes } from 'node:crypto';
import pg from 'pg';
import env from '@next/env';
import { chromium } from 'playwright';
import { digest } from '../src/server/audit';
env.loadEnvConfig(process.cwd());
const origin = process.env.APP_ORIGIN ?? 'http://127.0.0.1:3003';
if (process.env.LOCAL_DEVELOPMENT !== 'true' || !['localhost', '127.0.0.1'].includes(new URL(origin).hostname))
  throw new Error('Owned local audience browser fixture required.');
const db = new pg.Pool({ connectionString: process.env.MIGRATION_DATABASE_URL }),
  workspace = randomUUID(), other = randomUUID(), user = 'audience-browser-' + randomUUID(),
  cookie = randomBytes(32).toString('hex'), tag = randomUUID();
let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
async function call(path: string, method = 'GET', body?: unknown, key = randomUUID(), w = workspace) {
  const r = await fetch(origin + '/v1/' + path, { method, headers: {
    Origin: origin, 'Content-Type': 'application/json', 'Idempotency-Key': key,
    Cookie: 'mailcraft_local_session=' + cookie, 'X-Workspace-Id': w,
  }, body: body === undefined ? undefined : JSON.stringify(body) });
  return { r, j: await r.json() };
}
try {
  await db.query("INSERT INTO workspaces(id,name) VALUES($1,'Owned nested audience'),($2,'Owned browser other')", [workspace, other]);
  for (const w of [workspace, other]) await db.query("INSERT INTO memberships(workspace_id,user_id,role) VALUES($1,$2,'Owner')", [w, user]);
  await db.query("INSERT INTO auth_sessions(token_hash,user_id,expires_at) VALUES($1,$2,clock_timestamp()+interval '1 hour')", [digest(cookie), user]);
  for (const field of [{ key: 'score', label: 'Score', type: 'number' }, { key: 'vip', label: 'VIP', type: 'boolean' }, { key: 'joined', label: 'Joined', type: 'date' }])
    assert.equal((await call('contact-fields', 'POST', field)).r.status, 200);
  await db.query("INSERT INTO tags(workspace_id,name) SELECT $1,'A tag '||lpad(n::text,3,'0') FROM generate_series(1,200)n", [workspace]);
  await db.query("INSERT INTO tags(workspace_id,id,name) VALUES($1,$2,'Z saved-only tag')", [workspace, tag]);
  for (let i = 0; i < 2; i++) await db.query('INSERT INTO contacts(workspace_id,email_original,email_lookup,attrs,subscription) VALUES($1,$2,$2,$3,$4)',
    [workspace, `nested-${i}@example.test`, JSON.stringify({ first_name: 'Owned', score: i ? 18 : 7, vip: !!i, joined: '2026-10-02' }), i ? 'pending_confirmation' : 'subscribed']);
  const rule = { kind: 'any', children: [
    { kind: 'attribute', field: 'score', op: 'gte', value: 10 },
    { kind: 'all', children: [
      { kind: 'attribute', field: 'vip', op: 'eq', value: false },
      { kind: 'tag', id: tag, op: 'not_in' },
      { kind: 'engagement', event: 'clicked', op: 'not_observed', within_days: 30 },
    ] },
  ] };
  const largeRule={kind:'all',children:Array.from({length:3},()=>({kind:'any',children:Array.from({length:20},()=>({kind:'attribute',field:'first_name',op:'eq',value:'a'.repeat(2000)}))}))};
  const made = await call('segments', 'POST', { name: 'Owned nested saved rule', rule:process.argv.includes('--probe-large-recovery')?largeRule:rule });
  assert.equal(made.r.status, 200); const segment = made.j.segment;
  const leafMade=await call('segments','POST',{name:'Owned leaf source',rule:{kind:'attribute',field:'first_name',op:'exists'}},randomUUID(),other);
  assert.equal(leafMade.r.status,200);const leafSegment=leafMade.j.segment;
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await context.addCookies([{ name: 'mailcraft_local_session', value: cookie, url: origin, sameSite: 'Strict' }]);
  await context.addInitScript(w => localStorage.setItem('mailcraft.workspace', w), workspace);
  const page = await context.newPage();
  await page.goto(origin + '/app/audience');
  await page.getByLabel(/^Saved segment/).waitFor();
  async function switchWorkspace(id:string){await page.getByRole('button',{name:'Open navigation',exact:true}).click();await page.getByLabel('Active brand workspace',{exact:true}).selectOption(id);await page.waitForURL(url=>url.pathname==='/app');await page.getByRole('button',{name:'Open navigation',exact:true}).click();await page.getByRole('link',{name:'Audience',exact:true}).click();}
  if(process.argv.includes('--probe-large-recovery')) {
    const panel=page.getByRole('region',{name:'Segments and frozen selections',exact:true});
    await page.getByLabel(/^Saved segment/).selectOption(segment.id);
    const value=panel.getByLabel('Rule 1.1 comparison value',{exact:true});await value.waitFor();await value.fill('b'.repeat(2000));
    await page.reload();await value.waitFor({timeout:5000});assert.equal(await value.inputValue(),'b'.repeat(2000));
    const sent:{key:string;body:string}[]=[];
    await page.route('**/v1/segments/'+segment.id+'/versions',async route=>{sent.push({key:route.request().headers()['idempotency-key'],body:route.request().postData()!});assert.equal((await route.fetch()).status(),200);await route.abort('failed');});
    await panel.getByRole('button',{name:'Save new segment version',exact:true}).click();await panel.getByRole('alert').filter({hasText:/fetch|Failed/i}).waitFor();
    await page.unroute('**/v1/segments/'+segment.id+'/versions');await page.reload();await panel.getByRole('button',{name:'Retry original segment command',exact:true}).waitFor({timeout:5000});
    await page.route('**/v1/segments/'+segment.id+'/versions',async route=>{sent.push({key:route.request().headers()['idempotency-key'],body:route.request().postData()!});await route.continue();});
    await panel.getByRole('button',{name:'Retry original segment command',exact:true}).click();await panel.getByRole('status').filter({hasText:'Segment version saved.'}).waitFor();
    assert.deepEqual(sent[1],sent[0]);assert.equal((await call('segments/'+segment.id)).j.segment.current_version,2);assert.equal(await value.inputValue(),'b'.repeat(2000));
    console.log('Owned large-rule reload/lost acknowledgment PASS: 64 nodes, 2000-character values, saved source + dirty tree + original body/key, no duplicate version.');
  }else if (process.argv.includes('--controls-red')) {
    await page.getByRole('button', { name: 'Add group to Root', exact: true }).waitFor({ timeout: 3000 });
  } else {
    await page.getByLabel(/^Saved segment/).selectOption(segment.id);
    await page.getByLabel('Rule 2 group match', { exact: true }).waitFor({ timeout: 5000 });
    if (process.argv.includes('--load-red')) {
      assert.equal(await page.getByLabel('Root group match', { exact: true }).inputValue(), 'any');
      assert.equal(await page.getByLabel('Rule 2 group match', { exact: true }).inputValue(), 'all');
    } else {
      const panel = page.getByRole('region', { name: 'Segments and frozen selections', exact: true });
      const value = panel.getByLabel('Rule 1 comparison value', { exact: true });
      const save = panel.getByRole('button', { name: 'Save new segment version', exact: true });
      const preview = panel.getByRole('button', { name: 'Preview saved segment', exact: true });
      const freeze = panel.getByRole('button', { name: 'Freeze saved selection', exact: true });
      assert.equal(await value.inputValue(), '10');
      assert.equal(await panel.getByLabel('Rule 2.2 tag', { exact: true }).inputValue(), tag);
      assert.match(await panel.getByLabel('Rule 2.2 tag', { exact: true }).locator('option:checked').innerText(), /Unavailable/);
      await value.fill(''); assert.equal(await save.isDisabled(), true);
      assert.equal(await preview.isDisabled(), true); assert.equal(await freeze.isDisabled(), true);
      await page.reload(); await value.waitFor(); assert.equal(await value.inputValue(), '');
      await panel.getByText('Unapplied segment edits recovered.', { exact: true }).waitFor();
      assert.equal((await call('segments/' + segment.id)).j.segment.current_version, 1);
      await value.fill('18'); await save.click();
      await panel.getByRole('status').filter({ hasText: 'Segment version saved.' }).waitFor();
      assert.equal((await call('segments/' + segment.id)).j.segment.current_version, 2);
      await preview.click(); await panel.getByText('Matched 2', { exact: false }).waitFor();
      await freeze.click(); await panel.getByRole('status').filter({ hasText: 'Selection frozen' }).waitFor();
      assert.equal((await call('audience-snapshots')).j.total_count, 1);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await panel.locator('h2').scrollIntoViewIfNeeded(); await page.screenshot({ path: '/tmp/lettercape-audience-nested-mobile.png' });
      console.log('Owned nested audience Chromium first flow PASS: exact nested load, unknown saved relation retention, invalid input blocks old preview/freeze, reload recovery, saved new version, actual preview/freeze and390px layout.');
      // Lose a real accepted response and synchronously repeat the click before React paints disabled controls.
      const requests:{key:string;body:string}[]=[];
      await page.route('**/v1/segments/'+segment.id+'/versions',async route=>{
        requests.push({key:route.request().headers()['idempotency-key'],body:route.request().postData()!});
        const accepted=await route.fetch();assert.equal(accepted.status(),200);await route.abort('failed');
      });
      await value.fill('17');
      await save.evaluate((button:HTMLButtonElement)=>{button.click();button.click();});
      await panel.getByRole('button',{name:'Retry original segment command',exact:true}).waitFor();
      await panel.getByRole('alert').filter({hasText:/fetch|Failed/i}).waitFor();
      assert.equal(requests.length,1);
      const retained=await page.evaluate(w=>JSON.parse(localStorage.getItem('lettercape.segment-form.'+w)!),workspace);
      assert.equal(retained.pending.key,requests[0].key,'Repeated click must retain the one transmitted command key');
      assert.equal(retained.pending.body,requests[0].body);
      assert.equal((await call('segments/'+segment.id)).j.segment.current_version,3);
      await page.unroute('**/v1/segments/'+segment.id+'/versions');
      await page.reload();await panel.getByRole('button',{name:'Retry original segment command',exact:true}).waitFor();
      assert.equal(await value.isDisabled(),true);
      await panel.getByRole('button',{name:'Retry original segment command',exact:true}).click();
      await panel.getByRole('status').filter({hasText:'Segment version saved.'}).waitFor();
      assert.equal((await call('segments/'+segment.id)).j.segment.current_version,3);
      assert.equal(await value.inputValue(),'17');
      // Invalid recovered input must survive observing a newer server version until explicit replacement.
      await value.fill('');
      const newer={...rule,children:[{kind:'attribute',field:'score',op:'gte',value:19},rule.children[1]]};
      assert.equal((await call('segments/'+segment.id+'/versions','POST',{expected_version:3,rule:newer})).r.status,200);
      await page.reload();await value.waitFor();assert.equal(await value.inputValue(),'');
      await panel.getByText('The saved segment changed.',{exact:false}).waitFor();
      assert.equal(await preview.isDisabled(),true);assert.equal(await save.isDisabled(),true);
      await panel.getByRole('button',{name:'Reload saved segment (replace working rule)',exact:true}).click();
      await panel.getByRole('status').filter({hasText:'Saved segment loaded.'}).waitFor();
      assert.equal(await value.inputValue(),'19');
      console.log('Owned Chromium recovery PASS: one accepted request under repeated clicks, exact key/body retry after reload without duplicate version, invalid stale input preserved until explicit reload.');
      const boolean=panel.getByLabel('Rule 2.1 comparison value',{exact:true}),days=panel.getByLabel('Rule 2.3 within days',{exact:true});
      await boolean.fill('perhaps');assert.equal(await save.isDisabled(),true);await page.reload();await boolean.waitFor();assert.equal(await boolean.inputValue(),'perhaps');await boolean.fill('false');
      await days.fill('0');assert.equal(await save.isDisabled(),true);await days.fill('30');
      await panel.getByLabel('Rule 1 field',{exact:true}).selectOption('joined');await value.fill('2026-02-30');
      assert.equal(await save.isDisabled(),true);await page.reload();await value.waitFor();assert.equal(await value.inputValue(),'2026-02-30');assert.equal(await save.isDisabled(),true);
      await panel.getByRole('button',{name:'Reload saved segment (replace working rule)',exact:true}).click();await panel.getByRole('status').filter({hasText:'Saved segment loaded.'}).waitFor();
      // Failure to read the source cannot expose an editable substitute for that saved segment.
      await page.route('**/v1/segments/'+segment.id,route=>route.request().method()==='GET'?route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:{code:'OWNED_READ_INTERRUPTION',message:'Owned saved source temporarily unavailable.'}})}):route.continue());
      await page.reload();await panel.getByRole('alert').filter({hasText:'Owned saved source temporarily unavailable.'}).waitFor();
      assert.equal(await value.isDisabled(),true);assert.equal(await save.isDisabled(),true);assert.equal(await preview.isDisabled(),true);
      await page.unroute('**/v1/segments/'+segment.id);
      await panel.getByRole('button',{name:'Reload saved segment (replace working rule)',exact:true}).click();await panel.getByRole('status').filter({hasText:'Saved segment loaded.'}).waitFor();
      // Target only the editor's storage, preserving workspace/session storage and unrelated application state.
      await page.evaluate(()=>{const original=Storage.prototype.setItem;(window as unknown as {restoreSegmentStorage:()=>void}).restoreSegmentStorage=()=>{Storage.prototype.setItem=original;};Storage.prototype.setItem=function(key,value){if(key.startsWith('lettercape.segment-form.'))throw new DOMException('Owned quota fixture','QuotaExceededError');return original.call(this,key,value);};});
      await value.fill('');await panel.getByText('Browser storage is unavailable.',{exact:false}).waitFor();
      await switchWorkspace(other);
      await page.getByLabel('Saved segment',{exact:true}).waitFor();assert.equal(await page.getByLabel('Segment name',{exact:true}).inputValue(),'');
      await switchWorkspace(workspace);await value.waitFor();assert.equal(await value.inputValue(),'');
      await panel.getByText('Unapplied segment edits recovered.',{exact:true}).waitFor();
      let protectedExit=false;
      page.once('dialog',async dialog=>{assert.equal(dialog.type(),'beforeunload');protectedExit=true;await dialog.dismiss();});
      await page.goto(origin+'/app/emails').catch(error=>assert.match(String(error),/ERR_ABORTED/));
      assert.equal(protectedExit,true);assert.ok(page.url().endsWith('/app/audience'));
      await page.evaluate(()=>(window as unknown as {restoreSegmentStorage:()=>void}).restoreSegmentStorage());
      await panel.getByRole('button',{name:'Reload saved segment (replace working rule)',exact:true}).click();await panel.getByRole('status').filter({hasText:'Saved segment loaded.'}).waitFor();
      // A response to an old workspace must not install that segment in the new workspace.
      let releaseRead!:()=>void;const heldRead=new Promise<void>(resolve=>{releaseRead=resolve;});let observedRead!:()=>void;const readStarted=new Promise<void>(resolve=>{observedRead=resolve;});let completeRead!:()=>void;const readCompleted=new Promise<void>(resolve=>{completeRead=resolve;});
      await page.route('**/v1/segments/'+segment.id,async route=>{const response=await route.fetch();observedRead();await heldRead;try{await route.fulfill({response});}catch(e){assert.match(String(e),/Route is already handled|Target.*closed/);}finally{completeRead();}});
      await panel.getByRole('button',{name:'Reload saved segment (replace working rule)',exact:true}).click();await readStarted;
      await switchWorkspace(other);await page.getByLabel('Segment name',{exact:true}).waitFor();releaseRead();
      await readCompleted;await page.unroute('**/v1/segments/'+segment.id);assert.equal(await page.getByLabel('Segment name',{exact:true}).inputValue(),'');
      const otherPanel=page.getByRole('region',{name:'Segments and frozen selections',exact:true});
      await otherPanel.getByLabel('Saved segment',{exact:true}).selectOption(leafSegment.id);await otherPanel.getByRole('status').filter({hasText:'Saved segment loaded.'}).waitFor();
      assert.equal(await otherPanel.getByLabel('Root group match',{exact:true}).count(),0);
      await otherPanel.getByLabel('Root comparison',{exact:true}).selectOption('eq');await otherPanel.getByLabel('Root comparison value',{exact:true}).fill('Owned');
      await otherPanel.getByRole('button',{name:'Save new segment version',exact:true}).click();await otherPanel.getByRole('status').filter({hasText:'Segment version saved.'}).waitFor();
      assert.deepEqual((await call('segments/'+leafSegment.id,'GET',undefined,randomUUID(),other)).j.segment.rule,{kind:'attribute',field:'first_name',op:'eq',value:'Owned'});
      await otherPanel.getByRole('button',{name:'New segment (replace working rule)',exact:true}).click();
      for(let i=0;i<19;i++)await otherPanel.getByRole('button',{name:'Add condition to Root',exact:true}).click();
      assert.equal(await otherPanel.getByRole('button',{name:'Add condition to Root',exact:true}).isDisabled(),true);
      assert.equal(await otherPanel.getByRole('button',{name:'Add group to Root',exact:true}).isDisabled(),true);
      await otherPanel.getByRole('button',{name:'New segment (replace working rule)',exact:true}).click();
      for(const group of ['Root','Rule 2','Rule 2.2','Rule 2.2.2'])await otherPanel.getByRole('button',{name:'Add group to '+group,exact:true}).click();
      assert.equal(await otherPanel.getByRole('button',{name:'Add group to Rule 2.2.2.2',exact:true}).isDisabled(),true);
      assert.equal(await otherPanel.getByRole('button',{name:'Add condition to Rule 2.2.2.2',exact:true}).isDisabled(),false);
      await otherPanel.getByRole('button',{name:'New segment (replace working rule)',exact:true}).click();
      await otherPanel.getByRole('button',{name:'Remove Rule 1 condition',exact:true}).click();await otherPanel.getByLabel('Segment name',{exact:true}).fill('Owned empty group');
      assert.equal(await otherPanel.getByRole('button',{name:'Create segment',exact:true}).isDisabled(),true);
      await otherPanel.getByRole('button',{name:'New segment (replace working rule)',exact:true}).click();
      await switchWorkspace(workspace);await value.waitFor();assert.equal(await value.inputValue(),'19');
      // Current authorization failure must not discard an earlier accepted command awaiting acknowledgment.
      await page.route('**/v1/segments/'+segment.id+'/versions',async route=>{assert.equal((await route.fetch()).status(),200);await route.abort('failed');});
      await value.fill('20');await save.click();await panel.getByRole('alert').filter({hasText:/fetch|Failed/i}).waitFor();
      const authorizedPending=await page.evaluate(w=>JSON.parse(localStorage.getItem('lettercape.segment-form.'+w)!).pending,workspace);
      await page.unroute('**/v1/segments/'+segment.id+'/versions');await db.query("UPDATE memberships SET role='Editor' WHERE workspace_id=$1 AND user_id=$2",[workspace,user]);
      await panel.getByRole('button',{name:'Retry original segment command',exact:true}).click();await panel.getByRole('alert').waitFor();
      assert.deepEqual(await page.evaluate(w=>JSON.parse(localStorage.getItem('lettercape.segment-form.'+w)!).pending,workspace),authorizedPending);
      await db.query("UPDATE memberships SET role='Owner' WHERE workspace_id=$1 AND user_id=$2",[workspace,user]);
      await panel.getByRole('button',{name:'Retry original segment command',exact:true}).click();await panel.getByRole('status').filter({hasText:'Segment version saved.'}).waitFor();
      assert.equal((await call('segments/'+segment.id)).j.segment.current_version,5);
      await page.route('**/v1/segments/'+segment.id,route=>route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:{code:'OWNED_ACK_READ_INTERRUPTION',message:'Owned acknowledgment read unavailable.'}})}));
      await value.fill('21');await save.click();await panel.getByRole('alert').filter({hasText:'Owned acknowledgment read unavailable.'}).waitFor();
      assert.equal(await value.isDisabled(),true);const acceptedPending=await page.evaluate(w=>JSON.parse(localStorage.getItem('lettercape.segment-form.'+w)!).pending,workspace);
      assert.equal((await call('segments/'+segment.id)).j.segment.current_version,6);
      const newest={...rule,children:[{kind:'attribute',field:'score',op:'gte',value:22},rule.children[1]]};
      assert.equal((await call('segments/'+segment.id+'/versions','POST',{expected_version:6,rule:newest})).r.status,200);
      await page.reload();await panel.getByRole('button',{name:'Retry original segment command',exact:true}).waitFor();
      assert.deepEqual(await page.evaluate(w=>JSON.parse(localStorage.getItem('lettercape.segment-form.'+w)!).pending,workspace),acceptedPending);
      await page.unroute('**/v1/segments/'+segment.id);await panel.getByRole('button',{name:'Retry original segment command',exact:true}).click();
      await panel.getByRole('status').filter({hasText:'Segment version saved.'}).waitFor();assert.equal(await value.inputValue(),'21');
      await panel.getByText('The saved segment changed.',{exact:false}).waitFor();assert.equal(await preview.isDisabled(),true);
      assert.equal((await call('segments/'+segment.id)).j.segment.current_version,7);
      await panel.getByRole('button',{name:'Reload saved segment (replace working rule)',exact:true}).click();await panel.getByRole('status').filter({hasText:'Saved segment loaded.'}).waitFor();assert.equal(await value.inputValue(),'22');
      await page.route('**/v1/segments/'+segment.id+'/snapshots',async route=>{assert.equal((await route.fetch()).status(),200);await route.abort('failed');});
      await freeze.click();await panel.getByRole('alert').filter({hasText:/fetch|Failed/i}).waitFor();
      assert.equal((await call('audience-snapshots')).j.total_count,2);
      await page.unroute('**/v1/segments/'+segment.id+'/snapshots');await page.reload();await panel.getByRole('button',{name:'Retry original segment command',exact:true}).waitFor();
      await panel.getByRole('button',{name:'Retry original segment command',exact:true}).click();await panel.getByRole('status').filter({hasText:'Selection frozen'}).waitFor();
      assert.equal((await call('audience-snapshots')).j.total_count,2);
      await db.query("UPDATE memberships SET role='Viewer' WHERE workspace_id=$1 AND user_id=$2",[workspace,user]);
      const denied=page.waitForResponse(r=>r.url().endsWith('/v1/audience-schema')&&r.status()===403);await page.reload();await denied;
      await page.getByRole('alert').filter({hasText:/permission|allowed|access|role|permitted/i}).first().waitFor();
      assert.equal(await page.getByRole('button',{name:'Save new segment version',exact:true}).count(),0);
      console.log('Owned Chromium interruption PASS: boolean/date/day invalid recovery, failed initial source read, tab-only storage recovery/workspace switching/unload refusal, delayed old-workspace response fence, root-leaf round-trip/20-child refusal, retained original command under current authority denial, failed acknowledgment read/original receipt against newer current truth, no duplicate lost-response freeze and Viewer refusal.');
    }
  }
} finally {
  await browser?.close();
  for (const w of [workspace, other]) {
    for (const table of ['idempotency', 'api_rate_events', 'api_keys', 'campaigns', 'audience_snapshots', 'segment_versions', 'segments', 'contact_tags', 'contact_lists', 'tags', 'lists', 'contact_fields', 'contacts', 'audit_events', 'memberships'])
      await db.query('DELETE FROM ' + table + ' WHERE workspace_id=$1', [w]);
    await db.query('DELETE FROM workspaces WHERE id=$1', [w]);
  }
  await db.query('DELETE FROM auth_sessions WHERE user_id=$1', [user]);
  await db.end();
}
