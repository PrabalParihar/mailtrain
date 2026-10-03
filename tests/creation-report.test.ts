import test from 'node:test';
import assert from 'node:assert/strict';
const feature = await import('../src/domain/creation-report').catch(() => null);

test('report windows use UTC instants, at most 31 days and a supported display timezone', () => {
  assert.ok(feature, 'creation report contracts missing');
  const input = {type:'email.generate',created_after:'2026-03-01T00:00:00.000Z',created_before:'2026-04-01T00:00:00.000Z',time_zone:'America/New_York'};
  assert.deepEqual(feature.parseCreationReportWindow(input),input);
  for (const change of [{created_before:'2026-04-02T00:00:00.000Z'},{created_before:input.created_after},{time_zone:'Invented/Zone'},{type:'send'},{created_after:'2026-02-30T00:00:00.000Z'},{created_after:'2026-03-01T01:00:00+01:00'},{unknown:'extra'}])
    assert.throws(() => feature.parseCreationReportWindow({...input,...change}));
});

test('aggregate CSV exports the displayed snapshot with missing measurements and formula-safe cells', () => {
  assert.ok(feature);
  const counts={total:2,queued:0,running:0,succeeded:1,failed:1,cancelled:0,cancel_requested:0,other:0};
  const report={schema_version:'creation-activity-v1',type:'email.generate',created_after:'2026-03-01T00:00:00.000Z',created_before:'2026-03-02T00:00:00.000Z',time_zone:'UTC',generated_at:'2026-03-02T01:00:00.000Z',counts,daily:[{date:'2026-03-01',counts}],completion_time:{sample_count:0,missing_count:1,median_ms:null,p90_ms:null}};
  const csv=feature.creationReportCSV(report);
  assert.ok(csv.startsWith('schema_version,generated_at,operation_type,created_after_utc,created_before_utc,display_time_zone,row_kind,local_date,total,queued,running,succeeded,failed,cancelled,cancel_requested,other,completion_sample_count,completion_missing_count,median_completion_ms,p90_completion_ms\r\n'));
  assert.match(csv,/summary,,2,0,0,1,1,0,0,0,0,1,,\r\n/);
  assert.equal(csv.split('\r\n').length,4);
  for(const value of ['=SUM(1,2)',' +1','\t@malicious','\r-formula','-2'])assert.ok(feature.reportCSVCell(value).startsWith('"\''));
  assert.equal(feature.reportCSVCell('plain "quoted", value'),'"plain ""quoted"", value"');
  assert.throws(()=>feature.CreationActivityReport.parse({...report,counts:{...counts,total:3}}));
  assert.throws(()=>feature.CreationActivityReport.parse({...report,completion_time:{sample_count:0,missing_count:1,median_ms:0,p90_ms:0}}));
});
