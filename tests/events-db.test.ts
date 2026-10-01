import test from 'node:test';import assert from 'node:assert/strict';import {randomUUID}from'node:crypto';import pg from'pg';import env from'@next/env';
import{tenant}from'../src/server/db';import{recordEvent,readEventBody}from'../src/server/events';import{digest}from'../src/server/audit';
env.loadEnvConfig(process.cwd());
test('typed outbox events bind source versions, remain immutable and replay only the same transition',async()=>{
 const db=new pg.Pool({connectionString:process.env.MIGRATION_DATABASE_URL}),w=randomUUID(),other=randomUUID(),contact=randomUUID(),user='event-test-'+randomUUID();
 try{
  await db.query('INSERT INTO workspaces(id,name)VALUES($1,$3),($2,$3)',[w,other,'Event boundary fixture']);
  await db.query("INSERT INTO contacts(workspace_id,id,email_original,email_lookup,subscription,consent_version)VALUES($1,$2,'event@example.org','event@example.org','unsubscribed',2)",[w,contact]);
  await db.query("INSERT INTO suppressions(workspace_id,contact_id,reason)VALUES($1,$2,'unsubscribe')",[w,contact]);
  const input={type:'contact.unsubscribed' as const,aggregate:{type:'contact' as const,id:contact,version:2},data:{contact_id:contact,scope:'marketing' as const,reason:'recipient_opt_out' as const}};
  const first=await tenant(w,user,(tx)=>recordEvent(tx,w,input));
  const again=await tenant(w,user,(tx)=>recordEvent(tx,w,input));assert.equal(again.id,first.id);
  assert.equal((await db.query('SELECT count(*)::int AS n FROM outbox WHERE workspace_id=$1',[w])).rows[0].n,1);
  await assert.rejects(()=>tenant(other,user,(tx)=>recordEvent(tx,other,input)));
  await assert.rejects(()=>tenant(w,user,(tx)=>recordEvent(tx,w,{...input,aggregate:{...input.aggregate,version:1}})));
  await assert.rejects(()=>tenant(w,user,(tx)=>tx.query("UPDATE outbox SET data='{}' WHERE id=$1",[first.id])));
  await assert.rejects(()=>tenant(w,user,(tx)=>tx.query('DELETE FROM outbox WHERE id=$1',[first.id])));
  await tenant(w,user,(tx)=>tx.query('UPDATE outbox SET published_at=clock_timestamp() WHERE id=$1',[first.id]));
  assert.equal((await tenant(other,user,(tx)=>tx.query('SELECT * FROM outbox WHERE id=$1',[first.id]))).rowCount,0);
  const row=(await db.query('SELECT * FROM outbox WHERE id=$1',[first.id])).rows[0];assert.deepEqual(readEventBody(row),first);
  assert.throws(()=>readEventBody({...row,event_body:row.event_body+' '}));
  assert.throws(()=>readEventBody({...row,workspace_id:other}));
  await assert.rejects(()=>tenant(w,user,(tx)=>tx.query('INSERT INTO outbox(workspace_id,type,aggregate_id,data,event_schema_version,event_body,event_hash)VALUES($1,$2,$3,$4,1,$5,$6)',[w,first.type,contact,'{}','{}',digest('{}')])));
  await assert.rejects(()=>tenant(w,user,async(tx)=>{await tx.query('UPDATE contacts SET consent_version=3 WHERE id=$1',[contact]);await recordEvent(tx,w,{...input,aggregate:{...input.aggregate,version:2}});}));
  assert.equal((await db.query('SELECT consent_version FROM contacts WHERE id=$1',[contact])).rows[0].consent_version,2);
  const legacy=(await db.query("INSERT INTO outbox(workspace_id,type,aggregate_id,data)VALUES($1,'legacy',$2,'{}')RETURNING id",[w,contact])).rows[0];
  await assert.rejects(()=>tenant(w,user,(tx)=>tx.query('UPDATE outbox SET event_body=$1,event_schema_version=1,event_hash=$2 WHERE id=$3',[row.event_body,row.event_hash,legacy.id])));
 }finally{for(const table of['outbox','suppressions','contacts'])await db.query(`DELETE FROM ${table} WHERE workspace_id=ANY($1::uuid[])`,[[w,other]]);await db.query('DELETE FROM workspaces WHERE id=ANY($1::uuid[])',[[w,other]]);await db.end();}
});
test('one preference save records every removed topic at the same authoritative consent version',async()=>{
 const db=new pg.Pool({connectionString:process.env.MIGRATION_DATABASE_URL}),w=randomUUID(),contact=randomUUID(),topics=[randomUUID(),randomUUID()];
 try{
  await db.query("INSERT INTO workspaces(id,name)VALUES($1,'Multi-topic event fixture')",[w]);
  await db.query("INSERT INTO contacts(workspace_id,id,email_original,email_lookup,subscription)VALUES($1,$2,'multi-event@example.org','multi-event@example.org','subscribed')",[w,contact]);
  for(const topic of topics){await db.query("INSERT INTO lists(workspace_id,id,name)VALUES($1,$2,$3)",[w,topic,'Topic '+topic]);await db.query("INSERT INTO topic_subscriptions(workspace_id,contact_id,topic_id,subscription)VALUES($1,$2,$3,'subscribed')",[w,contact,topic]);}
  const {issuePreferenceToken,savePreference}=await import('../src/server/preferences');
  const token=await issuePreferenceToken(w,contact);
  await savePreference(token,{expected_version:1,frequency:'weekly',topics:[],reactivate_global:false});
  const rows=(await db.query("SELECT * FROM outbox WHERE workspace_id=$1 AND type='contact.topic_unsubscribed'",[w])).rows;
  assert.equal(rows.length,2,'Each removed topic must have its own immutable event');
  const version=(await db.query('SELECT consent_version FROM contacts WHERE id=$1',[contact])).rows[0].consent_version;
  for(const row of rows){const event=readEventBody(row);assert.equal(event.aggregate.version,version);assert.equal(event.type,'contact.topic_unsubscribed');}
  await savePreference(token,{expected_version:2,frequency:'monthly',topics:[],reactivate_global:false});
  assert.equal((await db.query('SELECT count(*)::int AS n FROM outbox WHERE workspace_id=$1',[w])).rows[0].n,2);
 }finally{for(const table of['outbox','consent_events','topic_subscriptions','contacts','lists'])await db.query(`DELETE FROM ${table} WHERE workspace_id=$1`,[w]);await db.query('DELETE FROM workspaces WHERE id=$1',[w]);await db.end();}
});
