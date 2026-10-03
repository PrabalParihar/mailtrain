import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {sourceDatabase} from '../scripts/smoke-source-truth';
const feature=await import('../src/server/creation-report').catch(()=>null);

test('report observes durable creation cohorts, missing timestamps, timezone buckets and preserves rows',async()=>{
  assert.ok(feature,'creation reporting persistence missing');
  await sourceDatabase(async({db,p,tx})=>{
    const samples=[['succeeded','2026-03-08T04:30:00Z','2026-03-08T04:30:10Z'],['succeeded','2026-03-08T05:30:00Z','2026-03-08T05:30:30Z'],['succeeded','2026-03-08T07:30:00Z',null],['failed','2026-03-08T08:00:00Z',null],['running','2026-03-08T09:00:00Z',null],['cancel_requested','2026-03-08T10:00:00Z',null],['cancelled','2026-03-08T11:00:00Z',null],['future_state','2026-03-08T12:00:00Z',null],['succeeded','2026-03-09T00:00:00Z','2026-03-09T00:01:00Z']];
    for(const [state,created,completed]of samples)await db.query('INSERT INTO operations(workspace_id,id,type,state,input,created_by,created_at,completed_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8)',[p.workspace,randomUUID(),'email.generate',state,{prompt:'Private prompt must never appear'},p.user,created,completed]);
    await db.query("INSERT INTO operations(workspace_id,id,type,state,input,created_by,created_at)VALUES($1,$2,'brand.extract','failed','{}',$3,'2026-03-08T08:00:00Z')",[p.workspace,randomUUID(),p.user]);
    const before=(await db.query('SELECT * FROM operations ORDER BY id')).rows;
    const req=new Request('http://127.0.0.1/v1/operations/report?type=email.generate&created_after=2026-03-08T00:00:00.000Z&created_before=2026-03-09T00:00:00.000Z&time_zone=America/New_York');
    const {report}=await tx(c=>feature.creationActivityReport(req,c,p));
    assert.deepEqual(report.counts,{total:8,queued:0,running:1,succeeded:3,failed:1,cancelled:1,cancel_requested:1,other:1});
    assert.deepEqual(report.daily.map(d=>[d.date,d.counts.total]),[['2026-03-07',1],['2026-03-08',7]]);
    assert.deepEqual(report.completion_time,{sample_count:2,missing_count:1,median_ms:20000,p90_ms:28000});
    assert.equal(JSON.stringify(report).includes('Private prompt'),false);
    assert.deepEqual((await db.query('SELECT * FROM operations ORDER BY id')).rows,before);
    const {report:empty}=await tx(c=>feature.creationActivityReport(new Request(req.url.replace('type=email.generate','type=brand.extract').replace('2026-03-08','2026-03-10').replace('2026-03-09','2026-03-11')),c,p));
    assert.equal(empty.counts.total,0);assert.equal(empty.completion_time.median_ms,null);assert.equal(empty.completion_time.p90_ms,null);
    for(const suffix of ['&unknown=1','&type=email.generate'])await assert.rejects(tx(c=>feature.creationActivityReport(new Request(req.url+suffix),c,p)),{code:'VALIDATION_FAILED'});
  });
});
