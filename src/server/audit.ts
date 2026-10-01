import {createHash,randomUUID} from 'node:crypto';
import type {Tx} from './db';
export const digest=(v:unknown)=>createHash('sha256').update(typeof v==='string'?v:JSON.stringify(v)).digest('hex');
export async function audit(tx:Tx,workspace:string,actor:string,action:string,resource?:string){
 await tx.query('SELECT pg_advisory_xact_lock(hashtext($1))',[workspace+':audit']);
 const prev=(await tx.query('SELECT event_hash FROM audit_events ORDER BY event_sequence DESC LIMIT 1')).rows[0]?.event_hash??'genesis';
 const sequence=(await tx.query("SELECT nextval('audit_events_event_sequence_seq') AS sequence")).rows[0].sequence;
 const id=randomUUID(),createdAt=new Date().toISOString(),resourceId=resource??null;
 const hash=digest({format:2,workspace,id,sequence,createdAt,prev,actor,action,resource:resourceId});
 await tx.query('INSERT INTO audit_events(workspace_id,id,event_sequence,actor,action,resource_id,previous_hash,event_hash,created_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)',[workspace,id,sequence,actor,action,resourceId,prev,hash,createdAt]);
}
