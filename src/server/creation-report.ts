import {CreationActivityReport,parseCreationReportWindow} from '../domain/creation-report';
import type {Tx} from './db';
import type {Principal} from './auth';
import {operationScope} from '../domain/api-keys';
import {requireKeyScope} from './api-keys';
import {fail} from './errors';

const states=['queued','running','succeeded','failed','cancelled','cancel_requested'];
const countsSQL=`count(*)::int AS total,${states.map(state=>`count(*) FILTER(WHERE state='${state}')::int AS ${state}`).join(',')},count(*) FILTER(WHERE state NOT IN(${states.map(state=>"'"+state+"'").join(',')}))::int AS other`;
export async function creationActivityReport(req:Request,tx:Tx,p:Principal) {
  const query=new URL(req.url).searchParams,allowed=['type','created_after','created_before','time_zone'];
  for(const [name,value] of query)
    if(!allowed.includes(name)||!value||query.getAll(name).length!==1)fail(422,'VALIDATION_FAILED','Supply only one value for each documented report parameter.');
  let window;
  try{window=parseCreationReportWindow(Object.fromEntries(allowed.map(name=>[name,query.get(name)])));}
  catch{fail(422,'VALIDATION_FAILED','Choose a creation type, valid UTC instants spanning at most 31 days and a supported named IANA timezone.');}
  // Reuse precisely the type-based access contract of creationPage. No new authority or data surface.
  requireKeyScope(p,operationScope(window.type));
  const params=[p.workspace,window.type,window.created_after,window.created_before,window.time_zone];
  const sql=`WITH cohort AS MATERIALIZED (
    SELECT state,created_at,completed_at FROM operations
    WHERE workspace_id=$1 AND type=$2 AND created_at >= $3::timestamptz AND created_at < $4::timestamptz
  ), totals AS (SELECT ${countsSQL} FROM cohort), daily AS (
    SELECT (created_at AT TIME ZONE $5)::date AS date,${countsSQL} FROM cohort GROUP BY 1
  ), days AS (
    SELECT day::date AS date FROM generate_series(($3::timestamptz AT TIME ZONE $5)::date::timestamp,
      (($4::timestamptz-interval '1 microsecond') AT TIME ZONE $5)::date::timestamp,interval '1 day') day
  ), timing AS (
    SELECT count(*)::int AS sample_count,
      percentile_cont(0.5) WITHIN GROUP(ORDER BY extract(epoch FROM(completed_at-created_at))*1000) AS median_ms,
      percentile_cont(0.9) WITHIN GROUP(ORDER BY extract(epoch FROM(completed_at-created_at))*1000) AS p90_ms
    FROM cohort WHERE state='succeeded' AND completed_at IS NOT NULL AND completed_at>=created_at
  ) SELECT statement_timestamp() AS generated_at,row_to_json(totals) AS counts,
    json_build_object('sample_count',timing.sample_count,'missing_count',totals.succeeded-timing.sample_count,'median_ms',timing.median_ms,'p90_ms',timing.p90_ms) AS completion_time,
    (SELECT json_agg(json_build_object('date',days.date,'counts',json_build_object(
      'total',coalesce(daily.total,0),${[...states,'other'].map(state=>`'${state}',coalesce(daily.${state},0)`).join(',')})) ORDER BY days.date)
      FROM days LEFT JOIN daily USING(date)) AS daily FROM totals,timing`;
  const row=(await tx.query(sql,params)).rows[0];
  return {report:CreationActivityReport.parse({schema_version:'creation-activity-v1',...window,...row,generated_at:row.generated_at.toISOString()})};
}
