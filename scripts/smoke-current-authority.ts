import assert from 'node:assert/strict';
import { randomUUID, randomBytes } from 'node:crypto';
import pg from 'pg';
import env from '@next/env';
import { chromium } from 'playwright';
import { digest } from '../src/server/audit';
env.loadEnvConfig(process.cwd());
const origin=process.env.APP_ORIGIN ?? 'http://127.0.0.1:3000';
if(process.env.LOCAL_DEVELOPMENT!=='true'||!['127.0.0.1','localhost'].includes(new URL(origin).hostname))throw new Error('Owned loopback fixtures only.');
const db=new pg.Pool({connectionString:process.env.MIGRATION_DATABASE_URL});
const workspace=randomUUID(),other=randomUUID(),user='authority-http-'+randomUUID(),token=randomBytes(32).toString('hex'),key=randomUUID(),bearer='lc_'+randomBytes(32).toString('hex');
async function call(path:string,method='GET',body?:unknown,auth=false){
 const res=await fetch(origin+'/v1/'+path,{method,signal:AbortSignal.timeout(15000),headers:{Origin:origin,'Content-Type':'application/json','X-Workspace-Id':workspace,'Idempotency-Key':randomUUID(),...(auth?{Authorization:'Bearer '+bearer}:{Cookie:'mailcraft_local_session='+token})},body:body===undefined?undefined:JSON.stringify(body)});
 return{status:res.status,body:await res.json()};
}
// Hold a row UPDATE-compatible lock while initial authorization reads its old
// committed value. The resource transaction must block at the SHARE fence.
async function race(table:'memberships'|'api_keys'|'workspaces',mutation:string,code:string,auth=false,listing=false){
 const blocker=await db.connect();let active=false, pending:ReturnType<typeof call>|undefined;
 try{
  await blocker.query('BEGIN');active=true;
  const pid=(await blocker.query('SELECT pg_backend_pid() AS pid')).rows[0].pid;
  await blocker.query(`SELECT 1 FROM ${table} WHERE ${table==='api_keys'||table==='workspaces'?'id':'workspace_id'}=$1 FOR NO KEY UPDATE`,[table==='api_keys'?key:workspace]);
  let settled=false;
  pending=(listing?call('workspaces'):call('emails','POST',{title:'Must not cross revocation'},auth)).finally(()=>{settled=true;});
  let waiting=false;
  for(let i=0;i<100&&!settled;i++){
   waiting=!!(await db.query('SELECT 1 FROM pg_stat_activity WHERE $1::int=ANY(pg_blocking_pids(pid))',[pid])).rowCount;
   if(waiting)break;
   await new Promise(r=>setTimeout(r,25));
  }
  assert.ok(waiting,'The resource transaction must wait for the pending authority change.');
  await blocker.query(mutation,[table==='api_keys'?key:workspace]);
  await blocker.query('COMMIT');active=false;
  const result=await pending;
  if(listing){assert.equal(result.status,200);assert.ok(!result.body.data.some((w:{id:string})=>w.id===workspace));}
  else{assert.equal(result.body.error?.code,code);assert.ok(result.status>=400);}
  assert.equal((await db.query("SELECT count(*)::int AS n FROM emails WHERE workspace_id=$1 AND title='Must not cross revocation'",[workspace])).rows[0].n,0);
 }finally{if(active)await blocker.query('ROLLBACK');blocker.release();if(pending)await pending.catch(()=>undefined);}
}
let browser:Awaited<ReturnType<typeof chromium.launch>>|undefined;
try{
 await db.query("INSERT INTO workspaces(id,name)VALUES($1,'Authority browser'),($2,'Authority fallback')",[workspace,other]);
 await db.query("INSERT INTO memberships(workspace_id,user_id,role)VALUES($1,$3,'Owner'),($2,$3,'Owner')",[workspace,other,user]);
 await db.query("INSERT INTO auth_sessions(token_hash,user_id,expires_at)VALUES($1,$2,now()+interval '1 hour')",[digest(token),user]);
 await db.query("INSERT INTO api_keys(workspace_id,id,key_hash,name,scopes,created_by,expires_at)VALUES($1,$2,$3,'Authority fixture',$4,$5,now()+interval '1 hour')",[workspace,key,digest(bearer),JSON.stringify(['emails:read','emails:write']),user]);
 const brand=await call('brands','POST',{name:'Authority brand',website:'https://example.org',description:'Owned local fixture',voice:'Plain',accent:'#0B625D',background:'#F7F6F2',font_stack:'Arial, sans-serif',address:'Reserved fixture address',approved_claims:[],forbidden_phrases:[],provenance:[]});assert.equal(brand.status,201);
 await race('memberships',"UPDATE memberships SET status='revoked' WHERE workspace_id=$1",'RESOURCE_NOT_FOUND');
 await db.query("UPDATE memberships SET status='active' WHERE workspace_id=$1",[workspace]);
 await race('memberships',"UPDATE memberships SET role='Viewer' WHERE workspace_id=$1",'INSUFFICIENT_SCOPE');
 await db.query("UPDATE memberships SET role='Owner' WHERE workspace_id=$1",[workspace]);
 await race('api_keys','UPDATE api_keys SET revoked_at=now() WHERE id=$1','AUTH_REQUIRED',true);
 await db.query('UPDATE api_keys SET revoked_at=NULL WHERE id=$1',[key]);
 await race('api_keys',"UPDATE api_keys SET scopes='[\"emails:read\"]'::jsonb WHERE id=$1",'INSUFFICIENT_SCOPE',true);
 await db.query('UPDATE api_keys SET scopes=$1 WHERE id=$2',[JSON.stringify(['emails:read','emails:write']),key]);
 await race('workspaces',"UPDATE workspaces SET status='locked' WHERE id=$1",'WORKSPACE_LOCKED');
 await db.query("UPDATE workspaces SET status='active' WHERE id=$1",[workspace]);
 await race('memberships',"UPDATE memberships SET status='revoked' WHERE workspace_id=$1",'',false,true);
 await db.query("UPDATE memberships SET status='active' WHERE workspace_id=$1",[workspace]);
 const created=await call('emails','POST',{title:'Authority private draft'});assert.equal(created.status,200);
 browser=await chromium.launch({headless:true});const context=await browser.newContext();
 await context.addCookies([{name:'mailcraft_local_session',value:token,url:origin}]);
 await context.addInitScript(w=>localStorage.setItem('mailcraft.workspace',w),workspace);
 const page=await context.newPage();await page.goto(origin+'/app/emails');await page.getByText('Authority private draft',{exact:true}).waitFor();
 await db.query("UPDATE memberships SET status='revoked' WHERE workspace_id=$1",[workspace]);
 const rejected=await call('emails','POST',{title:'After removal'});assert.equal(rejected.body.error?.code,'RESOURCE_NOT_FOUND');
 await page.reload();await page.locator('#workspace').waitFor();await page.waitForFunction(w=>(document.querySelector('#workspace') as HTMLSelectElement)?.value===w,other);assert.equal(await page.getByText('Authority private draft',{exact:true}).count(),0);
 await page.getByRole('link',{name:'Brand',exact:true}).click();await page.getByRole('heading',{name:/brand/i}).first().waitFor();
 assert.equal((await call('emails')).body.error?.code,'RESOURCE_NOT_FOUND');assert.equal((await call('emails','POST',{title:'Repeated denied create'})).body.error?.code,'RESOURCE_NOT_FOUND');
 await browser.close();browser=undefined;
 console.log('Current authority:6 deterministic HTTP revocation/scope/workspace/listing races, no unauthorized writes, Chromium removal/reload/navigation and repeat-denial PASS.');
}finally{
 await browser?.close();
 for(const table of ['idempotency','api_rate_events','audit_events','outbox','emails','brands','api_keys','memberships'])await db.query(`DELETE FROM ${table} WHERE workspace_id=ANY($1::uuid[])`,[[workspace,other]]);
 await db.query('DELETE FROM auth_sessions WHERE user_id=$1',[user]);await db.query('DELETE FROM workspaces WHERE id=ANY($1::uuid[])',[[workspace,other]]);await db.end();
}
