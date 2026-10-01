import assert from 'node:assert/strict';
import{randomUUID,randomBytes}from'node:crypto';
import pg from'pg';import env from'@next/env';import{digest}from'../src/server/audit';
env.loadEnvConfig(process.cwd());const origin=process.env.APP_ORIGIN??'http://127.0.0.1:3000';
if(process.env.LOCAL_DEVELOPMENT!=='true'||!['127.0.0.1','localhost'].includes(new URL(origin).hostname))throw new Error('Local review fixtures only');
const db=new pg.Pool({connectionString:process.env.MIGRATION_DATABASE_URL});const w=randomUUID(),user='contract-review-'+randomUUID(),cookie=randomBytes(32).toString('hex');
const kit={name:'QA current v2',website:'https://example.com',description:'Fixture',voice:'Clear',accent:'#0B625D',background:'#F7F6F2',font_stack:'Arial, sans-serif',address:'Fixture address',forbidden_phrases:[],approved_claims:['Current v2 claim'],provenance:[]};
async function call(path:string){const response=await fetch(origin+'/v1/'+path,{headers:{Cookie:'mailcraft_local_session='+cookie,'X-Workspace-Id':w}});return{status:response.status,body:await response.json()};}
try {
 await db.query('INSERT INTO workspaces(id,name) VALUES($1,$2)',[w,'Contract review QA']);await db.query("INSERT INTO memberships(workspace_id,user_id,role) VALUES($1,$2,'Owner')",[w,user]);await db.query("INSERT INTO auth_sessions(token_hash,user_id,expires_at)VALUES($1,$2,now()+interval '1 hour')",[digest(cookie),user]);
 await db.query("INSERT INTO contacts(workspace_id,email_original,email_lookup,created_at)VALUES($1,'micros-a@example.com','micros-a@example.com','2026-10-01T00:00:00.000600Z'),($1,'micros-b@example.com','micros-b@example.com','2026-10-01T00:00:00.000800Z')",[w]);
 const newer=randomUUID(),older=randomUUID();
 await db.query("INSERT INTO brands(workspace_id,id,version,data,created_at)VALUES($1,$2,2,$4::jsonb,'2026-10-01T00:00:00.000600Z'),($1,$3,1,$5::jsonb,'2026-10-01T00:00:00.000800Z')",[w,newer,older,JSON.stringify(kit),JSON.stringify({...kit,name:'QA obsolete v1',approved_claims:['Obsolete claim']})]);
 const bounds='created_after=2026-10-01T00%3A00%3A00.000500Z&created_before=2026-10-01T00%3A00%3A00.000900Z';
 const exact=await call('contacts?'+bounds),current=await call('brands/current');
 const problems=[];if(exact.body.data?.length!==2)problems.push('microsecond interval lost');if(current.status!==200||current.body.brand?.id!==newer)problems.push('latest approved brand not selected');
 console.log(JSON.stringify({microsecond_interval_count:exact.body.data?.length,current_brand_status:current.status,current_brand_version:current.body.brand?.version??null}));assert.deepEqual(problems,[]);
 const first=await call('contacts?limit=1&'+bounds);assert.ok(first.body.next_cursor);const second=await call('contacts?limit=1&'+bounds+'&after='+encodeURIComponent(first.body.next_cursor));assert.equal(second.body.data.length,1);assert.notEqual(first.body.data[0].id,second.body.data[0].id);
 const changed=await call('contacts?limit=1&created_after=2026-10-01T00%3A00%3A00.000700Z&created_before=2026-10-01T00%3A00%3A00.000900Z&after='+encodeURIComponent(first.body.next_cursor));assert.equal(changed.status,400);
 const collection=await call('brands');assert.equal(collection.body.data[0].version,1,'Collection order remains stable creation time, distinct from current version');
 const{chromium}=await import('playwright');const browser=await chromium.launch({headless:true});try{const context=await browser.newContext({viewport:{width:390,height:844}});await context.addCookies([{name:'mailcraft_local_session',value:cookie,url:origin,sameSite:'Strict'}]);const page=await context.newPage();await page.goto(origin+'/app/brand');await page.getByLabel('Brand name').waitFor();await page.waitForFunction(()=>Array.from(document.querySelectorAll('input')).some(i=>i.value==='QA current v2'));await page.goto(origin+'/app/emails/new');await page.getByText('QA current v2',{exact:false}).waitFor();await page.screenshot({path:'output/playwright/lettercape-current-brand-review.png',fullPage:true});}finally{await browser.close();}
 console.log('Microsecond interval/cursor binding and explicit highest brand version pass in HTTP and Chromium; zero provider calls.');
}finally{for(const table of ['audit_events','brands','contacts','memberships'])await db.query(`DELETE FROM ${table} WHERE workspace_id=$1`,[w]);await db.query('DELETE FROM auth_sessions WHERE user_id=$1',[user]);await db.query('DELETE FROM workspaces WHERE id=$1',[w]);await db.end();}
