import { AudienceSnapshotMemberSchema } from '../domain/audience-snapshots';
import type { Tx } from './db';
import type { Principal } from './auth';
import { assertSubmissionAuthority } from './submission-ledgers';
import { fail } from './errors';

async function creatorAuthorized(tx: Tx, p: Principal, row: Record<string, unknown>) {
  const member = (await tx.query("SELECT role FROM memberships WHERE workspace_id=$1 AND user_id=$2 AND status='active' FOR SHARE", [p.workspace, row.created_by])).rows[0];
  if (!member || !['Owner', 'Admin'].includes(member.role)) return false;
  if (!row.created_api_key_id) return true;
  const key = (await tx.query('SELECT scopes FROM api_keys WHERE workspace_id=$1 AND id=$2 AND created_by=$3 AND revoked_at IS NULL FOR SHARE', [p.workspace, row.created_api_key_id, row.created_by])).rows[0];
  if (!key || !Array.isArray(key.scopes) || !key.scopes.includes('campaigns:write') || !key.scopes.includes('audience:read')) return false;
  return (await tx.query('SELECT expires_at>clock_timestamp() AS valid FROM api_keys WHERE workspace_id=$1 AND id=$2', [p.workspace, row.created_api_key_id])).rows[0]?.valid === true;
}
export type SubmissionLedgerBatchResult = { worked: true; id: string; status: 'running' | 'completed' | 'cancelled'; processed_count: number } | null;
/** Caller owns BEGIN/COMMIT. Durable identities, histories and progress escape together. */
export async function processSubmissionLedgerBatch(tx: Tx, p: Principal): Promise<SubmissionLedgerBatchResult> {
  if (p.api_key || p.local_session) fail(403, 'LOCAL_WORKER_ACTOR_REQUIRED', 'Use the explicit trusted development worker actor.');
  await assertSubmissionAuthority(tx, p, true);
  const row = (await tx.query(`SELECT a.*,j.status,j.processed_count FROM submission_ledger_jobs j
    JOIN submission_ledgers a ON a.workspace_id=j.workspace_id AND a.id=j.id
    WHERE j.status IN('queued','running') ORDER BY a.created_at,a.id FOR UPDATE OF j SKIP LOCKED LIMIT 1`)).rows[0];
  if (!row) return null;
  let creator = await creatorAuthorized(tx, p, row);
  const campaign = (await tx.query('SELECT state FROM campaigns WHERE id=$1 FOR SHARE', [row.campaign_id])).rows[0];
  // Expiry advances while the campaign lock waits, even with creator/key rows held.
  if (creator) creator = await creatorAuthorized(tx, p, row);
  if (!creator || !campaign || ['paused', 'cancelled'].includes(campaign.state)) {
    await tx.query("UPDATE submission_ledger_jobs SET status='cancelled' WHERE id=$1", [row.id]);
    await tx.query("UPDATE deliveries SET submission_state='cancelled' WHERE ledger_id=$1 AND submission_state='pending'", [row.id]);
    return { worked: true, id: row.id, status: 'cancelled', processed_count: row.processed_count };
  }
  const members = (row.members as unknown[]).slice(row.processed_count, row.processed_count + 100).map(member => AudienceSnapshotMemberSchema.parse(member));
  for (const member of members) {
    // The guard derives every captured field and canonical identity from immutable database pins.
    const recipient = (await tx.query(`INSERT INTO campaign_recipients(workspace_id,ledger_id,configuration_id,contact_id,
      captured_locale,captured_reason,captured_consent_version,logical_send_key) VALUES($1,$2,$3,$4,$5,$6,$7,'') RETURNING id`,
    [p.workspace, row.id, row.configuration_id, member.id, member.locale, member.reason, member.consent_version])).rows[0];
    await tx.query('INSERT INTO deliveries(workspace_id,recipient_id,ledger_id,submission_state) VALUES($1,$2,$3,$4)',
      [p.workspace, recipient.id, row.id, member.eligible ? 'pending' : 'skipped']);
  }
  const processed = row.processed_count + members.length, status = processed === row.total_count ? 'completed' : 'running';
  await tx.query('UPDATE submission_ledger_jobs SET status=$2,processed_count=$3 WHERE id=$1', [row.id, status, processed]);
  return { worked: true, id: row.id, status, processed_count: processed };
}
