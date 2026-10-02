import { AudienceSnapshotMemberSchema } from '../domain/audience-snapshots';
import type { Tx } from './db';
import type { Principal } from './auth';
import { assertAssessmentAuthority } from './recipient-assessments';
import { fail } from './errors';

async function creatorAuthorized(tx: Tx,p: Principal,row: Record<string,unknown>) {
  const member=(await tx.query("SELECT role FROM memberships WHERE workspace_id=$1 AND user_id=$2 AND status='active' FOR SHARE",[p.workspace,row.created_by])).rows[0];
  if(!member || !['Owner','Admin'].includes(member.role)) return false;
  if(!row.created_api_key_id) return true;
  const key=(await tx.query('SELECT scopes,expires_at FROM api_keys WHERE workspace_id=$1 AND id=$2 AND created_by=$3 AND revoked_at IS NULL FOR SHARE',[p.workspace,row.created_api_key_id,row.created_by])).rows[0];
  if(!key || !Array.isArray(key.scopes)||!key.scopes.includes('campaigns:write')||!key.scopes.includes('audience:read')) return false;
  return (await tx.query('SELECT expires_at>clock_timestamp() AS valid FROM api_keys WHERE workspace_id=$1 AND id=$2',[p.workspace,row.created_api_key_id])).rows[0]?.valid===true;
}
export type RecipientAssessmentBatchResult={worked:true;id:string;status:'running'|'completed'|'cancelled';processed_count:number}|null;
/** Caller owns BEGIN/COMMIT; no claims, observations or progress escape this transaction. Local trusted actor only. */
export async function processRecipientAssessmentBatch(tx: Tx,p: Principal): Promise<RecipientAssessmentBatchResult> {
  if(p.api_key || p.local_session) fail(403,'LOCAL_WORKER_ACTOR_REQUIRED','Use the explicit trusted local worker actor.');
  await assertAssessmentAuthority(tx,p,true);
  const row=(await tx.query("SELECT a.*,j.status,j.processed_count,j.checks_clear_count,j.excluded_count FROM recipient_assessment_jobs j JOIN recipient_assessments a ON a.workspace_id=j.workspace_id AND a.id=j.id WHERE j.status IN('queued','running') ORDER BY a.created_at,a.id FOR UPDATE OF j SKIP LOCKED LIMIT 1")).rows[0];
  if(!row) return null;
  if(!await creatorAuthorized(tx,p,row)) {
    await tx.query("UPDATE recipient_assessment_jobs SET status='cancelled' WHERE id=$1",[row.id]);
    return {worked:true,id:row.id,status:'cancelled',processed_count:row.processed_count};
  }
  const members=(row.members as unknown[]).slice(row.processed_count,row.processed_count+100).map(member=>AudienceSnapshotMemberSchema.parse(member));
  const ids=members.map(member=>member.id);
  // Acquire every existing contact lock in stable order before reading changing checks.
  await tx.query('SELECT id FROM contacts WHERE id=ANY($1::uuid[]) ORDER BY id FOR UPDATE',[ids]);
  let clear=0;
  for(const member of members) {
    // SQL derives all current facts at its authoritative observation instant.
    // Placeholders never become evidence; RETURNING is the canonical count source.
    const observation=(await tx.query("INSERT INTO recipient_observations(workspace_id,assessment_id,contact_id,captured_reason,captured_locale,current_reason,reasons)VALUES($1,$2,$3,$4,$5,'CHECKS_CLEAR','[]') RETURNING current_reason",
      [p.workspace,row.id,member.id,member.reason,member.locale])).rows[0];
    if(observation.current_reason==='CHECKS_CLEAR') clear++;
  }
  const processed=row.processed_count+members.length,status=processed===row.total_count?'completed':'running';
  await tx.query('UPDATE recipient_assessment_jobs SET status=$2,processed_count=$3,checks_clear_count=checks_clear_count+$4,excluded_count=excluded_count+$5 WHERE id=$1',[row.id,status,processed,clear,members.length-clear]);
  return {worked:true,id:row.id,status,processed_count:processed};
}
