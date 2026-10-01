import assert from 'node:assert/strict';import{randomUUID,randomBytes}from'node:crypto';import pg from'pg';import env from'@next/env';import{chromium}from'playwright';import{digest}from'../src/server/audit';import{apiSpec,absoluteSchema,validateSchema}from'./api-validation';
env.loadEnvConfig(process.cwd());
const origin=process.env.APP_ORIGIN??'http://127.0.0.1:3000';if(process.env.LOCAL_DEVELOPMENT!=='true'||!['127.0.0.1','localhost'].includes(new URL(origin).hostname))throw new Error('Owned local webhook fixtures only');
const db=new pg.Pool({connectionString:process.env.MIGRATION_DATABASE_URL}),w=randomUUID(),other=randomUUID(),user='webhook-http-'+randomUUID(),cookie=randomBytes(32).toString('hex');
let browser:Awaited<ReturnType<typeof chromium.launch>>|undefined;
async function call(path:string,method='GET',body?:unknown,key=randomUUID(),workspace=w,secret?:string){const r=await fetch(origin+'/v1/'+path,{method,headers:{Origin:origin,'Content-Type':'application/json','Idempotency-Key':key,...(secret?{Authorization:'Bearer '+secret}:{Cookie:'mailcraft_local_session='+cookie,'X-Workspace-Id':workspace})},body:body===undefined?undefined:JSON.stringify(body)});return{r,j:await r.json()};}
const input={name:'Owned paused fixture',url:'https://example.org/hook?opaque=reserved-fixture',subscriptions:['contact.unsubscribed']};
try{
 await db.query('INSERT INTO workspaces(id,name)VALUES($1,$3),($2,$3)',[w,other,'Webhook HTTP fixture']);await db.query("INSERT INTO memberships(workspace_id,user_id,role)VALUES($1,$3,'Owner'),($2,$3,'Owner')",[w,other,user]);await db.query("INSERT INTO auth_sessions(token_hash,user_id,expires_at)VALUES($1,$2,now()+interval '1 hour')",[digest(cookie),user]);
 const initial=await call('webhook-endpoints');assert.equal(initial.r.status,200,'Webhook endpoints API exists');validateSchema(absoluteSchema(apiSpec.components.schemas.WebhookEndpointsPage),initial.j);assert.equal(initial.j.total_count,0);assert.equal(initial.j.configuration.delivery_enabled,false);
 if(!initial.j.configuration.key_configured){const unavailable=await call('webhook-endpoints','POST',input);assert.equal(unavailable.r.status,503);assert.equal(unavailable.j.error.code,'WEBHOOK_KEYS_UNCONFIGURED');}
 else{
  const key=randomUUID(),created=await call('webhook-endpoints','POST',input,key);assert.equal(created.r.status,201);validateSchema(absoluteSchema(apiSpec.components.schemas.WebhookEndpointCommandResponse),created.j);assert.match(created.j.secret,/^[0-9a-f]{64}$/);assert.equal(created.j.endpoint.status,'paused');assert.equal(created.j.endpoint.target_origin,'https://example.org');
  const id=created.j.endpoint.id,secret=created.j.secret;
  const replay=await call('webhook-endpoints','POST',input,key);validateSchema(absoluteSchema(apiSpec.components.schemas.WebhookEndpointCommandResponse),replay.j);assert.equal(replay.j.endpoint.id,id);assert.equal(replay.j.secret,undefined);assert.equal(replay.j.secret_available,false);
  assert.equal((await call('webhook-endpoints','POST',{...input,name:'Mismatch'},key)).r.status,409);
  for(const table of['webhook_endpoints','webhook_signing_keys','idempotency','audit_events'])assert.equal((await db.query(`SELECT count(*)::int AS n FROM ${table} t WHERE workspace_id=$1 AND to_jsonb(t)::text LIKE $2`,[w,'%'+secret+'%'])).rows[0].n,0);
  assert.equal((await call('webhook-endpoints/'+id,'GET',undefined,randomUUID(),other)).r.status,404);
  assert.equal((await call('webhook-endpoints/'+id+'/pause','POST',{expected_version:1})).j.endpoint.version,2);
  assert.equal((await call('webhook-endpoints/'+id+'/pause','POST',{expected_version:1})).r.status,409);
  const rotated=await call('webhook-endpoints/'+id+'/rotate','POST',{expected_version:2});assert.equal(rotated.r.status,200);assert.equal(rotated.j.endpoint.secret_version,2);assert.notEqual(rotated.j.secret,secret);
  assert.equal((await call('webhook-endpoints/'+id+'/rotate','POST',{expected_version:3})).r.status,409);
  assert.equal((await call('webhook-endpoints/'+id+'/rotate','POST',{expected_version:3,retire_previous:true})).r.status,422);
  assert.equal((await call('webhook-endpoints/'+id+'/rotate','POST',{expected_version:3,retire_previous:true,acknowledge_key_cutover:true})).j.endpoint.secret_version,3);
  for(const url of['https://127.0.0.1/hook','http://example.org/hook','https://example.org:80/hook','https://example.org/#fragment'])assert.equal((await call('webhook-endpoints','POST',{...input,url})).r.status,422);
  assert.equal((await call('webhook-endpoints','POST',{...input,subscriptions:['campaign.delivered']})).r.status,422);
  const narrow=(await call('api-keys','POST',{name:'Webhook denial',scopes:['events:read'],expires_in_days:1})).j.secret;
  const reader=(await call('api-keys','POST',{name:'Webhook reader',scopes:['webhooks:read'],expires_in_days:1})).j.secret;
  const writer=(await call('api-keys','POST',{name:'Webhook writer',scopes:['webhooks:write'],expires_in_days:1})).j.secret;
  for(const path of['webhook-endpoints','%77ebhook-endpoints']){assert.equal((await call(path,'GET',undefined,randomUUID(),w,narrow)).r.status,403);assert.equal((await call(path,'GET',undefined,randomUUID(),w,reader)).r.status,200);assert.equal((await call(path,'POST',input,randomUUID(),w,reader)).r.status,403);}
  await db.query('DELETE FROM api_rate_events WHERE workspace_id=$1',[w]);
  assert.equal((await call('webhook-endpoints/'+id+'/pause','POST',{expected_version:4},randomUUID(),w,writer)).r.status,200);
  await db.query("UPDATE memberships SET role='Editor' WHERE workspace_id=$1 AND user_id=$2",[w,user]);assert.equal((await call('webhook-endpoints','GET',undefined,randomUUID(),w,reader)).r.status,401);
  await db.query("UPDATE memberships SET role='Owner' WHERE workspace_id=$1 AND user_id=$2",[w,user]);
 }
 for(const role of['Editor','Viewer','Billing']){await db.query('UPDATE memberships SET role=$1 WHERE workspace_id=$2 AND user_id=$3',[role,w,user]);assert.equal((await call('webhook-endpoints')).r.status,403);assert.equal((await call('webhook-endpoints','POST',input)).r.status,403);}
 await db.query("UPDATE memberships SET role='Owner' WHERE workspace_id=$1 AND user_id=$2",[w,user]);
 browser=await chromium.launch({headless:true});const context=await browser.newContext({viewport:{width:390,height:844}});await context.addInitScript((workspace)=>localStorage.setItem('mailcraft.workspace',workspace),w);await context.addCookies([{name:'mailcraft_local_session',value:cookie,url:origin,sameSite:'Strict'}]);const page=await context.newPage();await page.goto(origin+'/app/settings');const panel=page.locator('.webhook-endpoints-panel');await panel.getByRole('heading',{name:'Webhook endpoints',exact:true}).waitFor();
 if(initial.j.configuration.key_configured){
  await panel.getByLabel('Endpoint name',{exact:true}).fill('UI paused endpoint');await panel.getByLabel('Webhook HTTPS URL',{exact:true}).fill('https://example.org/ui-hook');
  await context.setOffline(true);await panel.getByRole('button',{name:'Create paused endpoint',exact:true}).click();await panel.getByRole('alert').filter({hasText:/fetch|network|Failed/i}).waitFor();assert.equal(await panel.getByLabel('Endpoint name',{exact:true}).inputValue(),'UI paused endpoint');await context.setOffline(false);
  let lost=true,rejectRecovery=false,requests=0;await page.route('**/v1/webhook-endpoints',async(route)=>{if(route.request().method()!=='POST')return route.continue();requests++;if(rejectRecovery){rejectRecovery=false;return route.fulfill({status:401,contentType:'application/json',body:JSON.stringify({error:{code:'AUTH_REQUIRED',message:'Fixture authentication expired',retryable:false,request_id:randomUUID()}})});}if(!lost)return route.continue();lost=false;await route.fetch();await route.abort('failed');});
  await panel.getByRole('button',{name:'Create paused endpoint',exact:true}).click();await panel.getByRole('alert').filter({hasText:/fetch|network|Failed/i}).waitFor();rejectRecovery=true;await panel.getByRole('button',{name:'Create paused endpoint',exact:true}).click();await panel.getByRole('alert').filter({hasText:'Fixture authentication expired'}).waitFor();await page.reload();await panel.getByRole('heading',{name:'Webhook endpoints',exact:true}).waitFor();await panel.getByLabel('Endpoint name',{exact:true}).fill('UI paused endpoint');await panel.getByLabel('Webhook HTTPS URL',{exact:true}).fill('https://example.org/ui-hook');await panel.getByRole('button',{name:'Create paused endpoint',exact:true}).evaluate((element)=>{(element as HTMLButtonElement).click();(element as HTMLButtonElement).click();});
  await panel.getByRole('status').filter({hasText:/already acknowledged.*secret cannot be recovered/i}).waitFor();assert.equal(requests,3);assert.equal((await db.query("SELECT count(*)::int AS n FROM webhook_endpoints WHERE workspace_id=$1 AND name='UI paused endpoint'",[w])).rows[0].n,1);await page.unroute('**/v1/webhook-endpoints');
  await panel.getByLabel('Endpoint name',{exact:true}).fill('UI reveal endpoint');await panel.getByLabel('Webhook HTTPS URL',{exact:true}).fill('https://example.org/reveal-hook');await panel.getByRole('button',{name:'Create paused endpoint',exact:true}).click();await panel.getByLabel('One-time webhook signing secret',{exact:true}).waitFor({timeout:5000}).catch(async(error)=>{console.log(await panel.evaluate((element)=>({textarea_count:element.querySelectorAll('textarea').length,labels:[...element.querySelectorAll('label')].map((label)=>(label.textContent??'').replace(/[0-9a-f]{64}/g,'[redacted]'))})));throw error;});await panel.getByRole('button',{name:'Dismiss signing secret',exact:true}).click();assert.equal(await panel.getByLabel('One-time webhook signing secret',{exact:true}).count(),0);
  const uiEndpoint=(await db.query("SELECT id,version FROM webhook_endpoints WHERE workspace_id=$1 AND name='UI reveal endpoint'",[w])).rows[0];
  for(const action of['rotate','pause']){
   const path='**/v1/webhook-endpoints/'+uiEndpoint.id+'/'+action,requests:{key:string|null;input:unknown}[]=[];let lose=true;
   await page.route(path,async(route)=>{requests.push({key:route.request().headers()['idempotency-key']??null,input:route.request().postDataJSON()});if(!lose)return route.continue();lose=false;await route.fetch();await route.abort('failed');});
   const buttonName=action==='rotate'?'Rotate signing key for UI reveal endpoint':'Pause UI reveal endpoint';
   await panel.getByRole('button',{name:buttonName,exact:true}).click();await panel.getByRole('alert').filter({hasText:/fetch|network|Failed/i}).waitFor();
   await page.reload();await panel.getByRole('button',{name:buttonName,exact:true}).waitFor();await panel.getByRole('button',{name:buttonName,exact:true}).click();
   await panel.getByRole('status').filter({hasText:action==='pause'?/pause acknowledged/i:/already acknowledged.*secret cannot be recovered/i}).waitFor();
   assert.equal(requests.length,2);assert.equal(requests[0].key,requests[1].key);assert.deepEqual(requests[0].input,requests[1].input);
   assert.equal((await db.query('SELECT version FROM webhook_endpoints WHERE workspace_id=$1 AND id=$2',[w,uiEndpoint.id])).rows[0].version,action==='rotate'?2:3);
   await page.unroute(path);
  }

 }else{await panel.getByText(/Private encryption keys are unconfigured/).waitFor();assert.equal(await panel.getByRole('button',{name:'Create paused endpoint',exact:true}).isDisabled(),true);}
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await panel.scrollIntoViewIfNeeded();await page.screenshot({path:'output/playwright/lettercape-webhook-endpoints-mobile.png',fullPage:true});
 let entered!:()=>void,release!:()=>void;const ready=new Promise<void>((resolve)=>{entered=resolve;}),gate=new Promise<void>((resolve)=>{release=resolve;});await page.route('**/v1/webhook-endpoints',async(route)=>{const response=await route.fetch();entered();await gate;await route.fulfill({response});});
 await panel.getByRole('button',{name:'Reload webhook endpoints',exact:true}).click();await ready;await page.getByRole('button',{name:'Open navigation'}).click();await page.getByLabel('Active brand workspace').selectOption(other);await page.getByRole('heading',{name:'Make something worth opening.',exact:true}).waitFor();release();await page.evaluate(()=>new Promise((resolve)=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve(true)))));assert.equal(await page.locator('.webhook-endpoints-panel').count(),0);
 console.log('Actual endpoint API/role/configuration and Chromium lifecycle pass; configured='+initial.j.configuration.key_configured+'; endpoints paused, external HTTP deliveries zero.');
}finally{
 await browser?.close();for(const table of['webhook_signing_keys','webhook_endpoints','api_rate_events','api_keys','idempotency','audit_events','memberships'])await db.query(`DELETE FROM ${table} WHERE workspace_id=ANY($1::uuid[])`,[[w,other]]);await db.query('DELETE FROM auth_sessions WHERE user_id=$1',[user]);await db.query('DELETE FROM workspaces WHERE id=ANY($1::uuid[])',[[w,other]]);await db.end();
}
