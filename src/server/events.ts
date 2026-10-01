import { randomUUID } from 'node:crypto';
import { EventEnvelope, type DomainEvent } from '../domain/events';
import { digest } from './audit';
import type { Tx } from './db';
import { fail } from './errors';
type Strip<T>=T extends unknown?Omit<T,'id'|'schema_version'|'workspace_id'|'occurred_at'|'recorded_at'|'trace_id'>:never;
export type EventInput=Strip<DomainEvent>&{trace_id?:string};
export function readEventBody(row:Record<string,unknown>):DomainEvent {
  try {
    if(typeof row.event_body!=='string'||Buffer.byteLength(row.event_body,'utf8')>65536||digest(row.event_body)!==row.event_hash)throw new Error('Event hash');
    const event=EventEnvelope.parse(JSON.parse(row.event_body));
    if(event.id!==row.id||event.workspace_id!==row.workspace_id||event.type!==row.type||event.aggregate.id!==row.aggregate_id||event.schema_version!==row.event_schema_version)throw new Error('Event binding');
    return event;
  } catch { fail(502,'EVENT_INTEGRITY_FAILED','The event receipt failed integrity checks. Preserve its resource ID for investigation.'); }
}
export async function recordEvent(tx:Tx,workspace:string,input:EventInput) {
  const time=(await tx.query('SELECT clock_timestamp() AS time')).rows[0].time.toISOString();
  const event=EventEnvelope.parse({...input,id:randomUUID(),schema_version:1,workspace_id:workspace,occurred_at:time,recorded_at:time,trace_id:input.trace_id??randomUUID()});
  if(event.type!=='contacts.imported') {
    const contact=(await tx.query("SELECT consent_version,subscription,EXISTS(SELECT 1 FROM suppressions WHERE contact_id=contacts.id AND reason='unsubscribe') AS recipient_suppression FROM contacts WHERE id=$1 FOR SHARE",[event.aggregate.id])).rows[0];
    if(!contact)fail(404,'RESOURCE_NOT_FOUND','Event source contact not found.');
    if(contact.consent_version!==event.aggregate.version)fail(409,'EVENT_SOURCE_VERSION','Event source version changed.');
    if(event.type==='contact.unsubscribed'&&(contact.subscription!=='unsubscribed'||!contact.recipient_suppression))fail(409,'EVENT_SOURCE_INCOMPLETE','Recipient opt-out must be recorded before its event.');
    if(event.type==='contact.topic_unsubscribed'&&!(await tx.query("SELECT 1 FROM topic_subscriptions WHERE contact_id=$1 AND topic_id=$2 AND subscription='unsubscribed'",[event.aggregate.id,event.data.topic_id])).rowCount)fail(409,'EVENT_SOURCE_INCOMPLETE','Topic opt-out must be recorded before its event.');
  } else {
    const operation=(await tx.query("SELECT state,result FROM operations WHERE id=$1 AND type='contacts.import' FOR SHARE",[event.aggregate.id])).rows[0];
    if(!operation||operation.state!=='succeeded'||!operation.result.confirmed)fail(409,'EVENT_SOURCE_INCOMPLETE','Import confirmation must be committed in this transaction before its event.');
    if(event.aggregate.version!==1||['processed','created','existing','opt_in_granted'].some((field)=>operation.result.counts[field]!==event.data[field as keyof typeof event.data]))fail(409,'EVENT_SOURCE_VERSION','Import event counts must match its confirmed source.');
  }
  const raw=JSON.stringify(event),hash=digest(raw);
  const row=(await tx.query('INSERT INTO outbox(workspace_id,id,type,aggregate_id,data,recorded_at,event_schema_version,event_body,event_hash)VALUES($1,$2,$3,$4,$5,$6,1,$7,$8)ON CONFLICT DO NOTHING RETURNING *',[workspace,event.id,event.type,event.aggregate.id,JSON.stringify(event.data),time,raw,hash])).rows[0];
  if(row)return readEventBody(row);
  const topic=event.type==='contact.topic_unsubscribed'?event.data.topic_id:null;
  const existing=(await tx.query("SELECT * FROM outbox WHERE event_body IS NOT NULL AND type=$1 AND aggregate_id=$2 AND (event_body::jsonb->'aggregate'->>'version')::integer=$3 AND (event_body::jsonb->'data'->>'topic_id') IS NOT DISTINCT FROM $4::text",[event.type,event.aggregate.id,event.aggregate.version,topic])).rows[0];
  if(!existing)fail(409,'EVENT_CONFLICT','The logical event could not be acknowledged.');
  const previous=readEventBody(existing);
  if(digest(JSON.stringify(previous.data))!==digest(JSON.stringify(event.data)))fail(409,'EVENT_CONFLICT','The same event transition has a different payload.');
  return previous;
}
