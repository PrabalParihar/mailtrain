import { z } from 'zod';
import { SubmissionLedgerInput, SubmissionLedgerView, StagedRecipientView, DeliveryHistoryView, DeliveryAttemptView, SubmissionState } from '../domain/submission-ledgers';
import { campaignCanonicalJSON } from '../domain/campaign-configuration';
import type { Tx } from './db';
import type { Principal } from './auth';
import { assertCurrentAuthority } from './current-authority';
import { audienceSnapshotBinding } from './audience-snapshots';
import { keyed } from './commands';
import { fail } from './errors';
import { resourcePage } from './pagination';

const uuid = z.uuid().regex(/^[0-9a-f-]+$/);
const iso = (value: unknown) => value instanceof Date ? value.toISOString() : value;
const ledgerFrom = 'submission_ledgers a JOIN submission_ledger_jobs j ON j.workspace_id=a.workspace_id AND j.id=a.id';
const ledgerFields = `a.*,j.status,j.processed_count,j.updated_at,j.completed_at,
 (SELECT count(*)::int FROM deliveries d WHERE d.workspace_id=a.workspace_id AND d.ledger_id=a.id AND d.submission_state='pending') AS pending_count,
 (SELECT count(*)::int FROM deliveries d WHERE d.workspace_id=a.workspace_id AND d.ledger_id=a.id AND d.submission_state='skipped') AS skipped_count,
 (SELECT count(*)::int FROM deliveries d WHERE d.workspace_id=a.workspace_id AND d.ledger_id=a.id AND d.submission_state='cancelled') AS cancelled_count,
 (SELECT count(*)::int FROM delivery_attempts t JOIN deliveries d ON d.workspace_id=t.workspace_id AND d.id=t.delivery_id WHERE d.workspace_id=a.workspace_id AND d.ledger_id=a.id) AS attempt_count`;
const recipientFrom = 'campaign_recipients r JOIN deliveries d ON d.workspace_id=r.workspace_id AND d.recipient_id=r.id AND d.ledger_id=r.ledger_id';
const recipientFields = 'r.*,d.id AS delivery_id,d.submission_state,d.outcome,d.authorization_issued,d.updated_at';

export async function assertSubmissionAuthority(tx: Tx, p: Principal, write: boolean) {
  await assertCurrentAuthority(tx, p, 'audience', p.api_key ? 'audience:read' : undefined);
  await assertCurrentAuthority(tx, p, write ? 'edit' : 'read', p.api_key ? (write ? 'campaigns:write' : 'campaigns:read') : undefined);
}
function ledgerView(row: Record<string, unknown>) {
  return SubmissionLedgerView.parse({ id: row.id, campaign_id: row.campaign_id, configuration_id: row.configuration_id,
    configuration_version: row.configuration_version, configuration_digest: row.configuration_digest,
    revision_id: row.revision_id, artifact_hash: row.artifact_hash, snapshot_id: row.snapshot_id, snapshot_digest: row.snapshot_digest,
    status: row.status, total_count: row.total_count, processed_count: row.processed_count,
    pending_count: row.pending_count, skipped_count: row.skipped_count, cancelled_count: row.cancelled_count,
    accepted_count: 0, uncertain_count: 0, attempt_count: row.attempt_count, created_by: row.created_by, created_api_key_id: row.created_api_key_id,
    created_at: iso(row.created_at), updated_at: iso(row.updated_at), completed_at: iso(row.completed_at), authorization_issued: false, dispatch_enabled: false });
}
function recipientView(row: Record<string, unknown>) {
  return StagedRecipientView.parse({ id: row.id, ledger_id: row.ledger_id, configuration_id: row.configuration_id,
    delivery_id: row.delivery_id, contact_id: row.contact_id, captured_locale: row.captured_locale,
    captured_reason: row.captured_reason, captured_consent_version: row.captured_consent_version,
    logical_send_key: row.logical_send_key, submission_state: row.submission_state, outcome: row.outcome,
    authorization_issued: row.authorization_issued, created_at: iso(row.created_at), updated_at: iso(row.updated_at) });
}
async function detail(tx: Tx, id: string) {
  const row = (await tx.query(`SELECT ${ledgerFields} FROM ${ledgerFrom} WHERE a.id=$1`, [uuid.parse(id)])).rows[0];
  if (!row) fail(404, 'RESOURCE_NOT_FOUND', 'Submission ledger not found.');
  return { ledger: ledgerView(row) };
}
export async function submissionLedgerDetail(tx: Tx, p: Principal, id: string) {
  await assertSubmissionAuthority(tx, p, false);
  return detail(tx, id);
}
export async function stageSubmissionLedger(tx: Tx, p: Principal, campaign: string, body: unknown, key: string | null) {
  const input = SubmissionLedgerInput.parse(body);
  uuid.parse(campaign);
  await assertSubmissionAuthority(tx, p, true);
  return keyed(tx, p, 'submission-ledger.create:' + campaign, key, campaignCanonicalJSON(input), async () => {
    const c = (await tx.query('SELECT * FROM campaigns WHERE id=$1 FOR UPDATE', [campaign])).rows[0];
    if (!c) fail(404, 'RESOURCE_NOT_FOUND', 'Campaign not found.');
    if (c.version !== input.expected_version) fail(409, 'VERSION_CONFLICT', 'The campaign configuration changed. Reload before staging.', { current_version: c.version });
    if (c.digest !== input.expected_digest) fail(409, 'DIGEST_CONFLICT', 'The campaign configuration digest changed. Reload before staging.');
    if (!['draft', 'review_pending'].includes(c.state)) fail(409, 'STATE_CONFLICT', 'Only draft or review pending campaigns can stage recipients.');
    const configuration = (await tx.query('SELECT * FROM campaign_revisions WHERE campaign_id=$1 AND revision_no=$2', [campaign, c.version])).rows[0];
    if (!configuration || configuration.digest !== c.digest || configuration.revision_id !== c.revision_id || campaignCanonicalJSON(configuration.intent) !== campaignCanonicalJSON(c.intent))
      fail(409, 'CONFIGURATION_INVALID', 'The immutable campaign configuration cannot be verified.');
    if (!c.audience_snapshot_id) fail(409, 'AUDIENCE_SNAPSHOT_REQUIRED', 'Choose a frozen audience snapshot before staging.');
    const binding = await audienceSnapshotBinding(tx, c.audience_snapshot_id);
    if (campaignCanonicalJSON(binding.pointer) !== campaignCanonicalJSON(c.intent.audience_snapshot) || campaignCanonicalJSON(binding.members) !== campaignCanonicalJSON(c.intent.audience))
      fail(409, 'SNAPSHOT_INVALID', 'The campaign audience snapshot cannot be verified.');
    const existing = (await tx.query('SELECT id FROM submission_ledgers WHERE configuration_id=$1', [configuration.id])).rows[0];
    if (existing) return detail(tx, existing.id);
    const revision = (await tx.query('SELECT artifact_hash FROM revisions WHERE id=$1', [c.revision_id])).rows[0];
    if (!revision) fail(409, 'CONFIGURATION_INVALID', 'The immutable email revision cannot be verified.');
    const row = (await tx.query(`INSERT INTO submission_ledgers(workspace_id,campaign_id,configuration_id,configuration_version,configuration_digest,revision_id,artifact_hash,snapshot_id,snapshot_digest,members,total_count,created_by,created_api_key_id)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING id`,
    [p.workspace, campaign, configuration.id, c.version, c.digest, c.revision_id, revision.artifact_hash, binding.pointer.id, binding.pointer.digest,
      JSON.stringify(binding.members), binding.members.length, p.api_key?.delegator ?? p.user, p.api_key?.id ?? null])).rows[0];
    await tx.query('INSERT INTO submission_ledger_jobs(workspace_id,id) VALUES($1,$2)', [p.workspace, row.id]);
    return detail(tx, row.id);
  });
}
function pageQuery(req: Request, state = false) {
  const seen = new Set<string>();
  for (const [key, value] of new URL(req.url).searchParams) {
    if (!['limit', 'after', 'created_after', 'created_before', ...(state ? ['state'] : [])].includes(key) || seen.has(key) || !value)
      fail(422, 'QUERY_INVALID', 'Use supported ledger parameters once with explicit values.');
    seen.add(key);
  }
}
export async function submissionLedgerList(req: Request, tx: Tx, p: Principal, campaign: string) {
  await assertSubmissionAuthority(tx, p, false);
  pageQuery(req); uuid.parse(campaign);
  if (!(await tx.query('SELECT id FROM campaigns WHERE id=$1', [campaign])).rowCount) fail(404, 'RESOURCE_NOT_FOUND', 'Campaign not found.');
  const page = await resourcePage(req, tx, p, { resource: 'submission-ledgers', from: ledgerFrom, fields: ledgerFields,
    created: 'a.created_at', id: 'a.id', where: 'a.campaign_id=$1', values: [campaign], filters: { campaign_id: campaign } });
  return { ...page, data: page.data.map(ledgerView) };
}
export async function submissionLedgerRecipients(req: Request, tx: Tx, p: Principal, id: string) {
  await assertSubmissionAuthority(tx, p, false);
  pageQuery(req, true); await detail(tx, id);
  const rawState = new URL(req.url).searchParams.get('state'), state = rawState === null ? null : SubmissionState.parse(rawState);
  const page = await resourcePage(req, tx, p, { resource: 'staged-recipients', from: recipientFrom, fields: recipientFields,
    created: 'r.created_at', id: 'r.id', where: 'r.ledger_id=$1 AND ($2::text IS NULL OR d.submission_state=$2)',
    values: [id, state], filters: { ledger_id: id, state } });
  return { ...page, data: page.data.map(recipientView) };
}
export async function cancelSubmissionLedger(tx: Tx, p: Principal, id: string, key: string | null) {
  await assertSubmissionAuthority(tx, p, true); uuid.parse(id);
  return keyed(tx, p, 'submission-ledger.cancel:' + id, key, {}, async () => {
    const row = (await tx.query('SELECT id,status FROM submission_ledger_jobs WHERE id=$1 FOR UPDATE', [id])).rows[0];
    if (!row) fail(404, 'RESOURCE_NOT_FOUND', 'Submission ledger not found.');
    if (['queued', 'running', 'completed'].includes(row.status)) {
      await tx.query("UPDATE submission_ledger_jobs SET status='cancelled' WHERE id=$1", [id]);
      await tx.query("UPDATE deliveries SET submission_state='cancelled' WHERE ledger_id=$1 AND submission_state='pending'", [id]);
    }
    return detail(tx, id);
  });
}
async function findDelivery(tx: Tx, id: string) {
  const row = (await tx.query(`SELECT ${recipientFields} FROM ${recipientFrom} WHERE d.id=$1`, [uuid.parse(id)])).rows[0];
  if (!row) fail(404, 'RESOURCE_NOT_FOUND', 'Delivery not found.');
  return { delivery: recipientView(row) };
}
export async function deliveryDetail(tx: Tx, p: Principal, id: string) {
  await assertSubmissionAuthority(tx, p, false);
  return findDelivery(tx, id);
}
export async function deliveryHistory(req: Request, tx: Tx, p: Principal, id: string) {
  await assertSubmissionAuthority(tx, p, false); pageQuery(req); await findDelivery(tx, id);
  const page = await resourcePage(req, tx, p, { resource: 'delivery-history', from: 'delivery_state_history',
    fields: 'id,delivery_id,submission_state,outcome,reason,recorded_at', created: 'recorded_at', where: 'delivery_id=$1', values: [id], filters: { delivery_id: id } });
  return { ...page, data: page.data.map(row => DeliveryHistoryView.parse({ ...row, recorded_at: iso(row.recorded_at) })) };
}
export async function deliveryAttempts(req: Request, tx: Tx, p: Principal, id: string) {
  await assertSubmissionAuthority(tx, p, false); pageQuery(req); await findDelivery(tx, id);
  const page = await resourcePage(req, tx, p, { resource: 'delivery-attempts', from: 'delivery_attempts',
    fields: 'id,delivery_id,attempt_no,submission_state,request_started_at,accepted_at,error_class', created: 'request_started_at', where: 'delivery_id=$1', values: [id], filters: { delivery_id: id } });
  return { ...page, data: page.data.map(row => DeliveryAttemptView.parse({ ...row, request_started_at: iso(row.request_started_at), accepted_at: iso(row.accepted_at) })) };
}
