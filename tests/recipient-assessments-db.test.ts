import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { sourceDatabase } from '../scripts/smoke-source-truth';
import { digest } from '../src/server/audit';

test('recipient assessment storage forces RLS and denies rewriting historical evidence', async () => sourceDatabase(async ({db,tx}) => {
  for (const table of ['recipient_assessments','recipient_assessment_jobs','recipient_observations','recipient_assessment_history']) {
    const row = (await db.query('SELECT relrowsecurity,relforcerowsecurity FROM pg_class WHERE oid=to_regclass($1)',[table])).rows[0];
    assert.deepEqual(row,{relrowsecurity:true,relforcerowsecurity:true},table+' must exist with forced RLS');
  }
  for (const table of ['recipient_assessments','recipient_observations','recipient_assessment_history']) {
    for (const privilege of ['UPDATE','DELETE']) assert.equal((await db.query('SELECT has_table_privilege($1,$2,$3) AS allowed',['mailcraft_runtime',table,privilege])).rows[0].allowed,false);
    await assert.rejects(tx(c=>c.query('DELETE FROM '+table)),e=>(e as {code:string}).code==='42501');
  }
}));

async function seed(f: Parameters<Parameters<typeof sourceDatabase>[0]>[0],count=1) {
  const {db,p}=f, campaign=randomUUID(), revision=randomUUID(), email=randomUUID(), snapshot=randomUUID(), segment=randomUUID(),topic=randomUUID();
  const members=Array.from({length:count},()=>({id:randomUUID(),locale:'en-US',consent_version:1,eligible:true,reason:'ELIGIBLE'})).sort((a,b)=>a.id.localeCompare(b.id));
  await db.query("INSERT INTO lists(workspace_id,id,name)VALUES($1,$2,'Assessment topic')",[p.workspace,topic]);
  for (const member of members) {
    await db.query("INSERT INTO contacts(workspace_id,id,email_original,email_lookup,subscription)VALUES($1,$2,$3,$3,'subscribed')",[p.workspace,member.id,member.id+'@example.test']);
    await db.query("INSERT INTO topic_subscriptions(workspace_id,contact_id,topic_id,subscription)VALUES($1,$2,$3,'subscribed')",[p.workspace,member.id,topic]);
  }
  await db.query("INSERT INTO segments(workspace_id,id,name)VALUES($1,$2,'Assessment rule')",[p.workspace,segment]);
  await db.query("INSERT INTO segment_versions(workspace_id,segment_id,version,schema_version,rule,created_by)VALUES($1,$2,1,1,'{}',$3)",[p.workspace,segment,p.user]);
  const evaluated_at='2026-10-02T09:00:00.000Z',source={schema_version:1,segment_id:segment,segment_version:1,evaluated_at,members,matched_count:count,eligible_count:count,excluded_count:0};
  const pointer={id:snapshot,segment_id:segment,segment_version:1,evaluated_at,matched_count:count,eligible_count:count,digest:digest(source)};
  await db.query('INSERT INTO audience_snapshots(workspace_id,id,segment_id,segment_version,evaluated_at,members,matched_count,eligible_count,digest,created_by)VALUES($1,$2,$3,1,$4,$5,$6,$6,$7,$8)',[p.workspace,snapshot,segment,evaluated_at,JSON.stringify(members),count,pointer.digest,p.user]);
  await db.query("INSERT INTO emails(workspace_id,id,title,spec,created_by)VALUES($1,$2,'Assessment fixture','{}',$3)",[p.workspace,email,p.user]);
  await db.query("INSERT INTO revisions(workspace_id,id,email_id,revision_no,spec,html,plaintext,artifact_hash,manifest,created_by)VALUES($1,$2,$3,1,'{}','<p>Fixture</p>','Fixture',$4,'{}',$5)",[p.workspace,revision,email,digest('fixture'),p.user]);
  const intent={audience:members,audience_snapshot:pointer},hash=digest(intent);
  await db.query("INSERT INTO campaigns(workspace_id,id,name,revision_id,intent,digest,created_by)VALUES($1,$2,'Assessment fixture',$3,$4,$5,$6)",[p.workspace,campaign,revision,JSON.stringify(intent),hash,p.user]);
  return {campaign,revision,snapshot,members,topic,input:{expected_version:1,expected_digest:hash,topic_id:topic}};
}

test('creation pins immutable configuration, replays one receipt and rejects CAS or missing snapshot',async()=>sourceDatabase(async f=>{
  const {prepareRecipientAssessment,assessmentDetail}=await import('../src/server/recipient-assessments');
  const a=await seed(f),key=randomUUID();
  const response=await f.tx(c=>prepareRecipientAssessment(c,f.p,a.campaign,a.input,key));
  assert.equal(response.assessment.status,'queued');assert.equal(response.assessment.total_count,1);
  assert.equal(response.assessment.authorization_issued,false);assert.equal(response.assessment.global_blockers.length,5);
  const replay=await f.tx(c=>prepareRecipientAssessment(c,f.p,a.campaign,a.input,key));assert.deepEqual(replay,response);
  const configuration=(await f.db.query('SELECT id FROM campaign_revisions WHERE campaign_id=$1',[a.campaign])).rows[0].id;
  assert.equal(response.assessment.configuration_id,configuration);assert.equal(response.assessment.snapshot_id,a.snapshot);
  await assert.rejects(f.tx(c=>prepareRecipientAssessment(c,f.p,a.campaign,{...a.input,expected_version:2},randomUUID())),e=>(e as {code:string}).code==='VERSION_CONFLICT');
  await assert.rejects(f.tx(c=>prepareRecipientAssessment(c,f.p,a.campaign,{...a.input,expected_digest:'0'.repeat(64)},randomUUID())),e=>(e as {code:string}).code==='DIGEST_CONFLICT');
  await f.db.query("INSERT INTO memberships(workspace_id,user_id,role)VALUES($1,'viewer','Viewer')",[f.p.workspace]);
  await assert.rejects(f.tx(c=>assessmentDetail(c,{...f.p,user:'viewer',role:'Viewer'},response.assessment.id),'viewer'),e=>(e as {code:string}).code==='INSUFFICIENT_SCOPE');
  assert.equal((await f.db.query('SELECT count(*)::int AS n FROM operations')).rows[0].n,0);
}));

test('bounded batches survive rollback and competing claims, freeze membership and never reserve frequency',async()=>sourceDatabase(async f=>{
  const {prepareRecipientAssessment,assessmentDetail}=await import('../src/server/recipient-assessments');
  const {processRecipientAssessmentBatch}=await import('../src/server/recipient-assessment-worker');
  const a=await seed(f,101),response=await f.tx(c=>prepareRecipientAssessment(c,f.p,a.campaign,a.input,randomUUID()));
  await assert.rejects(f.tx(async c=>{const result=await processRecipientAssessmentBatch(c,f.p);assert.equal(result?.processed_count,100);throw new Error('Owned crash rollback');}),/Owned crash rollback/);
  assert.equal((await f.tx(c=>assessmentDetail(c,f.p,response.assessment.id))).assessment.processed_count,0);
  assert.equal((await f.db.query('SELECT count(*)::int AS n FROM recipient_observations')).rows[0].n,0);
  await f.db.query("INSERT INTO contacts(workspace_id,email_original,email_lookup,subscription)VALUES($1,'late@example.test','late@example.test','subscribed')",[f.p.workspace]);
  await f.db.query("INSERT INTO frequency_reservations(workspace_id,contact_id,delivery_id,topic_id,state,reserved_at)VALUES($1,$2,$3,$4,'uncertain',clock_timestamp()-interval '60 days')",[f.p.workspace,a.members[0].id,randomUUID(),a.topic]);
  const before=(await f.db.query('SELECT * FROM frequency_reservations')).rows;
  const claim=await f.tx(async c=>{
    await c.query('SELECT id FROM recipient_assessment_jobs WHERE id=$1 FOR UPDATE',[response.assessment.id]);
    assert.equal(await f.tx(other=>processRecipientAssessmentBatch(other,f.p)),null);
    return processRecipientAssessmentBatch(c,f.p);
  });
  assert.equal(claim?.processed_count,100);
  await f.tx(c=>processRecipientAssessmentBatch(c,f.p));
  const view=(await f.tx(c=>assessmentDetail(c,f.p,response.assessment.id))).assessment;
  assert.equal(view.status,'completed');assert.equal(view.processed_count,101);assert.equal(view.excluded_count,1);assert.equal(view.checks_clear_count,100);
  assert.equal(await f.tx(c=>processRecipientAssessmentBatch(c,f.p)),null);
  assert.deepEqual((await f.db.query('SELECT * FROM frequency_reservations')).rows,before);
  assert.equal((await f.db.query('SELECT count(*)::int AS n FROM recipient_observations')).rows[0].n,101);
  assert.equal((await f.db.query('SELECT current_reason FROM recipient_observations WHERE contact_id=$1',[a.members[0].id])).rows[0].current_reason,'FREQUENCY_LIMIT');
}));

test('creator membership and key revocation cancel remaining work without deleting observations',async()=>sourceDatabase(async f=>{
  const {prepareRecipientAssessment,cancelRecipientAssessment,assessmentDetail}=await import('../src/server/recipient-assessments');
  const {processRecipientAssessmentBatch}=await import('../src/server/recipient-assessment-worker');
  const a=await seed(f,101),key=randomUUID();
  await f.db.query("INSERT INTO memberships(workspace_id,user_id,role)VALUES($1,'worker','Owner')",[f.p.workspace]);
  const worker={...f.p,user:'worker'};
  const response=await f.tx(c=>prepareRecipientAssessment(c,f.p,a.campaign,a.input,key));
  await f.tx(c=>processRecipientAssessmentBatch(c,worker),'worker');
  await f.db.query("UPDATE memberships SET role='Viewer' WHERE workspace_id=$1 AND user_id=$2",[f.p.workspace,f.p.user]);
  assert.equal((await f.tx(c=>processRecipientAssessmentBatch(c,worker),'worker'))?.status,'cancelled');
  const cancelled=(await f.tx(c=>assessmentDetail(c,worker,response.assessment.id),'worker')).assessment;
  assert.equal(cancelled.processed_count,100);assert.equal(cancelled.status,'cancelled');
  assert.deepEqual(await f.tx(c=>cancelRecipientAssessment(c,worker,response.assessment.id,randomUUID()),'worker'),{assessment:cancelled});
  await f.db.query("UPDATE memberships SET role='Owner' WHERE workspace_id=$1 AND user_id=$2",[f.p.workspace,f.p.user]);
  const credential=randomUUID();await f.db.query("INSERT INTO api_keys(workspace_id,id,key_hash,name,scopes,created_by,expires_at)VALUES($1,$2,$3,'Assessment key',$4,$5,clock_timestamp()+interval '1 hour')",[f.p.workspace,credential,digest(credential),JSON.stringify(['campaigns:write','audience:read']),f.p.user]);
  const api={...f.p,user:'api-key:'+credential,api_key:{id:credential,delegator:f.p.user,scopes:['campaigns:write','audience:read']}};
  const keyed=await f.tx(c=>prepareRecipientAssessment(c,api,a.campaign,a.input,randomUUID()),api.user);
  await f.db.query('UPDATE api_keys SET revoked_at=clock_timestamp() WHERE id=$1',[credential]);
  assert.equal((await f.tx(c=>processRecipientAssessmentBatch(c,worker),'worker'))?.status,'cancelled');
  assert.equal((await f.tx(c=>assessmentDetail(c,worker,keyed.assessment.id),'worker')).assessment.processed_count,0);
  assert.equal((await f.db.query('SELECT count(*)::int AS n FROM recipient_observations')).rows[0].n,100);
}));

test('database canonicalizes false current facts so suppressed contacts cannot persist as clear',async()=>sourceDatabase(async f=>{
  const {prepareRecipientAssessment}=await import('../src/server/recipient-assessments');
  const a=await seed(f),response=await f.tx(c=>prepareRecipientAssessment(c,f.p,a.campaign,a.input,randomUUID()));
  await f.db.query("INSERT INTO suppressions(workspace_id,contact_id,reason)VALUES($1,$2,'Owned suppression')",[f.p.workspace,a.members[0].id]);
  const actual=await f.tx(async c=>{
    const row=(await c.query("INSERT INTO recipient_observations(workspace_id,assessment_id,contact_id,captured_reason,captured_locale,current_locale,consent_version,preference_version,current_reason,reasons)VALUES($1,$2,$3,'ELIGIBLE','en-US','wrong-locale',99,99,'CHECKS_CLEAR','[]') RETURNING *",[f.p.workspace,response.assessment.id,a.members[0].id])).rows[0];
    await c.query("UPDATE recipient_assessment_jobs SET status='completed',processed_count=1,excluded_count=1 WHERE id=$1",[response.assessment.id]);return row;
  });
  assert.equal(actual.current_reason,'SUPPRESSED');assert.deepEqual(actual.reasons,['SUPPRESSED']);assert.equal(actual.current_locale,'en-US');assert.equal(actual.consent_version,1);assert.equal(actual.preference_version,1);assert.equal(actual.authorization_issued,false);
}));

test('tenant fencing composite pins and immutable history reject direct runtime forgery',async()=>sourceDatabase(async f=>{
  const {prepareRecipientAssessment}=await import('../src/server/recipient-assessments');
  const a=await seed(f),response=await f.tx(c=>prepareRecipientAssessment(c,f.p,a.campaign,a.input,randomUUID()));
  const other=randomUUID(),foreignTopic=randomUUID();await f.db.query("INSERT INTO workspaces(id,name)VALUES($1,'Foreign owned fixture')",[other]);
  await f.db.query("INSERT INTO memberships(workspace_id,user_id,role)VALUES($1,$2,'Owner')",[other,f.p.user]);
  await f.db.query("INSERT INTO lists(workspace_id,id,name)VALUES($1,$2,'Foreign topic')",[other,foreignTopic]);
  assert.equal((await f.tx(async c=>{await c.query("SELECT set_config('app.workspace_id',$1,true)",[other]);return c.query('SELECT id FROM recipient_assessments');})).rowCount,0);
  await assert.rejects(f.tx(c=>c.query('INSERT INTO recipient_assessments(workspace_id,campaign_id,configuration_id,configuration_version,configuration_digest,revision_id,snapshot_id,topic_id,members,total_count,created_by) SELECT workspace_id,campaign_id,configuration_id,configuration_version,configuration_digest,revision_id,snapshot_id,$1,members,total_count,created_by FROM recipient_assessments WHERE id=$2',[foreignTopic,response.assessment.id])),e=>(e as {code:string}).code==='23503');
  await assert.rejects(f.tx(c=>c.query("INSERT INTO recipient_assessments(workspace_id,campaign_id,configuration_id,configuration_version,configuration_digest,revision_id,snapshot_id,topic_id,members,total_count,created_by) SELECT workspace_id,campaign_id,configuration_id,configuration_version,configuration_digest,revision_id,snapshot_id,topic_id,'[]',0,created_by FROM recipient_assessments WHERE id=$1",[response.assessment.id])),/RECIPIENT_ASSESSMENT_MANIFEST_INVALID/);
  await assert.rejects(f.tx(c=>c.query("INSERT INTO recipient_assessment_history(workspace_id,assessment_id,status,processed_count,checks_clear_count,excluded_count)VALUES($1,$2,'completed',1,1,0)",[f.p.workspace,response.assessment.id])),e=>(e as {code:string}).code==='42501');
  await assert.rejects(f.tx(c=>c.query("UPDATE recipient_assessment_jobs SET status='completed',processed_count=1,checks_clear_count=1 WHERE id=$1",[response.assessment.id])),/RECIPIENT_PROGRESS_INVALID/);
  await assert.rejects(f.db.query("UPDATE recipient_assessments SET members='[]' WHERE id=$1",[response.assessment.id]),/RECIPIENT_ASSESSMENT_IMMUTABLE/);
}));

test('cancellation retains partial observations and reads require both current scopes',async()=>sourceDatabase(async f=>{
  const {prepareRecipientAssessment,cancelRecipientAssessment,assessmentDetail,assessmentHistory,assessmentObservations}=await import('../src/server/recipient-assessments');
  const {processRecipientAssessmentBatch}=await import('../src/server/recipient-assessment-worker');
  const a=await seed(f,101),response=await f.tx(c=>prepareRecipientAssessment(c,f.p,a.campaign,a.input,randomUUID()));
  await f.tx(c=>processRecipientAssessmentBatch(c,f.p));const key=randomUUID();
  const cancelled=await f.tx(c=>cancelRecipientAssessment(c,f.p,response.assessment.id,key));
  assert.equal(cancelled.assessment.status,'cancelled');assert.equal(cancelled.assessment.processed_count,100);
  assert.deepEqual(await f.tx(c=>cancelRecipientAssessment(c,f.p,response.assessment.id,key)),cancelled);
  assert.equal(await f.tx(c=>processRecipientAssessmentBatch(c,f.p)),null);
  const page=await f.tx(c=>assessmentObservations(new Request('http://fixture.test/v1/recipient-assessments/'+response.assessment.id+'/observations?limit=100'),c,f.p,response.assessment.id));
  assert.equal(page.total_count,100);assert.equal(page.data.length,100);assert.equal(page.data[0].authorization_issued,false);
  assert.equal((await f.tx(c=>assessmentHistory(new Request('http://fixture.test/v1/campaigns/'+a.campaign+'/recipient-assessments'),c,f.p,a.campaign))).data[0].status,'cancelled');
  await assert.rejects(f.db.query('DELETE FROM recipient_observations WHERE assessment_id=$1',[response.assessment.id]),/RECIPIENT_ASSESSMENT_IMMUTABLE/);
  const credential=randomUUID();await f.db.query("INSERT INTO api_keys(workspace_id,id,key_hash,name,scopes,created_by,expires_at)VALUES($1,$2,$3,'Read key',$4,$5,clock_timestamp()+interval '1 hour')",[f.p.workspace,credential,digest(credential),JSON.stringify(['campaigns:read']),f.p.user]);
  const api={...f.p,user:'api-key:'+credential,api_key:{id:credential,delegator:f.p.user,scopes:['campaigns:read','audience:read']}};
  await assert.rejects(f.tx(c=>assessmentDetail(c,api,response.assessment.id),api.user),e=>(e as {code:string}).code==='INSUFFICIENT_SCOPE');
  await f.db.query('UPDATE api_keys SET scopes=$2 WHERE id=$1',[credential,JSON.stringify(['campaigns:read','audience:read'])]);
  assert.equal((await f.tx(c=>assessmentDetail(c,api,response.assessment.id),api.user)).assessment.id,response.assessment.id);
  await assert.rejects(f.tx(c=>prepareRecipientAssessment(c,api,a.campaign,a.input,randomUUID()),api.user),e=>(e as {code:string}).code==='INSUFFICIENT_SCOPE');
  const legacy=randomUUID();await f.db.query("INSERT INTO campaigns(workspace_id,id,name,revision_id,intent,digest,created_by)VALUES($1,$2,'Legacy audience',$3,'{}',$4,$5)",[f.p.workspace,legacy,a.revision,digest({}),f.p.user]);
  await assert.rejects(f.tx(c=>prepareRecipientAssessment(c,f.p,legacy,{expected_version:1,expected_digest:digest({}),topic_id:null},randomUUID())),e=>(e as {code:string}).code==='AUDIENCE_SNAPSHOT_REQUIRED');
}));

test('accepted frequency observations use fixed UTC milliseconds across a nonUTC DST boundary',async()=>sourceDatabase(async f=>{
  const {prepareRecipientAssessment}=await import('../src/server/recipient-assessments');
  const {processRecipientAssessmentBatch}=await import('../src/server/recipient-assessment-worker');
  const a=await seed(f),response=await f.tx(c=>prepareRecipientAssessment(c,f.p,a.campaign,a.input,randomUUID()));
  await f.db.query("UPDATE contacts SET frequency='monthly' WHERE id=$1",[a.members[0].id]);
  const result=await f.tx(async c=>{
    // A fixture-local POSIX zone places a DST transition yesterday irrespective of test date.
    const day=Number((await c.query("SELECT to_char(clock_timestamp() AT TIME ZONE 'UTC','DDD') AS day")).rows[0].day);
    const start=day===1?365:day-1,end=day>=364?2:day+2;
    const timezone='XST0XDT,J'+start+'/0,J'+end+'/0';
    await c.query("SELECT set_config('TimeZone',$1,true)",[timezone]);
    const cutoffs=(await c.query("SELECT clock_timestamp()-interval '2592000000 milliseconds' AS fixed,clock_timestamp()-interval '30 days' AS calendar")).rows[0];
    const delta=cutoffs.fixed.getTime()-cutoffs.calendar.getTime();assert.ok(Math.abs(delta)>3000000,'fixture must cross a daylight-saving calendar boundary');
    const reserved=new Date((cutoffs.fixed.getTime()+cutoffs.calendar.getTime())/2);
    await c.query("INSERT INTO frequency_reservations(workspace_id,contact_id,delivery_id,topic_id,state,reserved_at)VALUES($1,$2,$3,$4,'accepted',$5)",[f.p.workspace,a.members[0].id,randomUUID(),a.topic,reserved]);
    const processed=await processRecipientAssessmentBatch(c,f.p);
    const observation=(await c.query('SELECT current_reason,reasons,observed_at FROM recipient_observations WHERE assessment_id=$1',[response.assessment.id])).rows[0];
    const limited=reserved.getTime()>observation.observed_at.getTime()-2592000000;
    assert.equal(observation.current_reason,limited?'FREQUENCY_LIMIT':'CHECKS_CLEAR');
    return processed;
  });
  assert.equal(result?.status,'completed');
}));

test('creator key expiry during admitted batch commits historical facts and cancels the next batch',async()=>sourceDatabase(async f=>{
  const {prepareRecipientAssessment,assessmentDetail}=await import('../src/server/recipient-assessments');
  const {processRecipientAssessmentBatch}=await import('../src/server/recipient-assessment-worker');
  const a=await seed(f,101),credential=randomUUID();
  await f.db.query("INSERT INTO api_keys(workspace_id,id,key_hash,name,scopes,created_by,expires_at)VALUES($1,$2,$3,'Expiring assessment key',$4,$5,clock_timestamp()+interval '1 hour')",[f.p.workspace,credential,digest(credential),JSON.stringify(['campaigns:write','audience:read']),f.p.user]);
  const api={...f.p,user:'api-key:'+credential,api_key:{id:credential,delegator:f.p.user,scopes:['campaigns:write','audience:read']}};
  const response=await f.tx(c=>prepareRecipientAssessment(c,api,a.campaign,a.input,randomUUID()),api.user);
  const blocker=await f.db.connect();let processing:Promise<{result?:Awaited<ReturnType<typeof processRecipientAssessmentBatch>>;error?:unknown}>|undefined;
  try {
    await blocker.query('BEGIN');await blocker.query('SELECT id FROM contacts WHERE id=$1 FOR UPDATE',[a.members[0].id]);
    await f.db.query("UPDATE api_keys SET expires_at=clock_timestamp()+interval '1500 milliseconds' WHERE id=$1",[credential]);
    let pid=0;
    processing=f.tx(async c=>{pid=(await c.query('SELECT pg_backend_pid() AS pid')).rows[0].pid;return processRecipientAssessmentBatch(c,f.p);}).then(result=>({result}),error=>({error}));
    let waiting=false;
    for(let attempt=0;attempt<100;attempt++) {
      if(pid) waiting=(await f.db.query("SELECT wait_event_type='Lock' AND query LIKE 'SELECT id%FROM contacts%' AS waiting FROM pg_stat_activity WHERE pid=$1",[pid])).rows[0]?.waiting===true;
      if(waiting) break;await new Promise(resolve=>setTimeout(resolve,10));
    }
    assert.equal(waiting,true,'worker must admit creator and then block on contact lock before expiry');
    await blocker.query('SELECT pg_sleep(1.6)');await blocker.query('COMMIT');
    const first=await processing;if(first.error) throw first.error;
    assert.equal(first.result?.status,'running');assert.equal(first.result?.processed_count,100);
    const afterExpiry=(await f.db.query('SELECT count(*)::int AS n FROM recipient_observations o JOIN api_keys k ON k.workspace_id=o.workspace_id AND k.id=$1 WHERE o.assessment_id=$2 AND o.observed_at>k.expires_at',[credential,response.assessment.id])).rows[0].n;
    assert.equal(afterExpiry,100);
    assert.equal((await f.tx(c=>processRecipientAssessmentBatch(c,f.p)))?.status,'cancelled');
    const final=(await f.tx(c=>assessmentDetail(c,f.p,response.assessment.id))).assessment;
    assert.equal(final.processed_count,100);assert.equal(final.authorization_issued,false);
  } finally {await blocker.query('ROLLBACK');blocker.release();if(processing)await processing;}
}));

test('the database observation instant canonicalizes a frequency cutoff that passes before insertion',async()=>sourceDatabase(async f=>{
  const {prepareRecipientAssessment}=await import('../src/server/recipient-assessments');
  const a=await seed(f),response=await f.tx(c=>prepareRecipientAssessment(c,f.p,a.campaign,a.input,randomUUID()));
  const observation=await f.tx(async c=>{
    await c.query("INSERT INTO frequency_reservations(workspace_id,contact_id,delivery_id,topic_id,state,reserved_at)VALUES($1,$2,$3,$4,'accepted',clock_timestamp()-interval '604800000 milliseconds'+interval '400 milliseconds')",[f.p.workspace,a.members[0].id,randomUUID(),a.topic]);
    assert.equal((await c.query("SELECT reserved_at>clock_timestamp()-interval '604800000 milliseconds' AS limited FROM frequency_reservations WHERE contact_id=$1",[a.members[0].id])).rows[0].limited,true);
    await c.query('SELECT pg_sleep(0.5)');
    const row=(await c.query("INSERT INTO recipient_observations(workspace_id,assessment_id,contact_id,captured_reason,captured_locale,current_locale,consent_version,preference_version,current_reason,reasons,observed_at)VALUES($1,$2,$3,'ELIGIBLE','en-US','en-US',1,1,'FREQUENCY_LIMIT','[\"FREQUENCY_LIMIT\"]',clock_timestamp()-interval '1 hour') RETURNING *",[f.p.workspace,response.assessment.id,a.members[0].id])).rows[0];
    await c.query("UPDATE recipient_assessment_jobs SET status='completed',processed_count=1,checks_clear_count=1 WHERE id=$1",[response.assessment.id]);return row;
  });
  assert.equal(observation.current_reason,'CHECKS_CLEAR');assert.deepEqual(observation.reasons,[]);
  const elapsed=(await f.db.query('SELECT extract(epoch FROM ($1::timestamptz-reserved_at))*1000 AS elapsed FROM frequency_reservations WHERE contact_id=$2',[observation.observed_at,a.members[0].id])).rows[0].elapsed;
  assert.ok(Number(elapsed)>604800000);assert.equal(observation.authorization_issued,false);
}));
