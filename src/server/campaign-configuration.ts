import { z } from 'zod';
import {
  CampaignConfigurationInput, CampaignConfigurationView, CampaignConfigurationSnapshot,
  CampaignTimingError, ResolvedCampaignTimingSchema, resolveCampaignTiming, campaignCanonicalJSON,
} from '../domain/campaign-configuration';
import { AudienceSnapshotPointerSchema } from '../domain/audience-snapshots';
import type { Tx } from './db';
import type { Principal } from './auth';
import { assertCurrentAuthority } from './current-authority';
import { audit, digest } from './audit';
import { keyed } from './commands';
import { fail } from './errors';
import { resourcePage } from './pagination';
import { audienceSnapshotBinding } from './audience-snapshots';

const iso = (value: unknown) => value instanceof Date ? value.toISOString() : value;
function content(row: Record<string, unknown>) {
  const intent = row.intent && typeof row.intent === 'object' && !Array.isArray(row.intent)
    ? row.intent as Record<string, unknown> : {};
  const audience = Array.isArray(intent.audience) ? intent.audience : null;
  // Original typed receipts already had counts, while legacy raw receipts had members.
  const previousCount = (value: unknown) => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : 0;
  const audience_count = audience ? audience.length : previousCount(row.audience_count);
  const eligible_count = audience ? audience.filter(item => item && typeof item === 'object' && item.eligible === true).length : previousCount(row.eligible_count);
  const timing = ResolvedCampaignTimingSchema.safeParse(intent.planned_timing);
  const pointer = AudienceSnapshotPointerSchema.safeParse(intent.audience_snapshot ?? row.audience_snapshot);
  return {
    artifact_hash: typeof intent.artifact_hash === 'string' && /^[0-9a-f]{64}$/.test(intent.artifact_hash) ? intent.artifact_hash : null,
    planned_timing: timing.success ? timing.data : null,
    audience_count, eligible_count, excluded_count: Math.max(0, audience_count - eligible_count),
    audience_snapshot: pointer.success ? pointer.data : null,
  };
}
export function configurationView(row: Record<string, unknown>) {
  const { artifact_hash, planned_timing, ...counts } = content(row);
  return CampaignConfigurationView.parse({ id: row.id, name: row.name, version: row.version,
    state: row.state, revision_id: row.revision_id, intent: { artifact_hash, planned_timing },
    ...counts, digest: row.digest, created_at: iso(row.created_at) });
}
export function redactedCampaignResponse<T extends { campaign: Record<string, unknown> }>(response: T) {
  return { ...response, campaign: configurationView(response.campaign) };
}
export async function campaignDetail(tx: Tx, id: string) {
  const campaign = (await tx.query('SELECT * FROM campaigns WHERE id=$1', [z.uuid().parse(id)])).rows[0];
  if (!campaign) fail(404, 'RESOURCE_NOT_FOUND', 'Campaign not found.');
  return { campaign: configurationView(campaign) };
}
export async function campaignConfigurations(req: Request, tx: Tx, p: Principal, id: string) {
  await campaignDetail(tx, id);
  const page = await resourcePage(req, tx, p, { resource: 'campaign-configurations', from: 'campaign_revisions',
    fields: '*', created: 'captured_at', where: 'campaign_id=$1', values: [id], filters: { campaign_id: id } });
  return { ...page, data: page.data.map(row => CampaignConfigurationSnapshot.parse({
    id: row.id, campaign_id: row.campaign_id, revision_no: row.revision_no, name: row.name,
    revision_id: row.revision_id, ...content(row), digest: row.digest, actor_id: row.actor_id,
    captured_at: iso(row.captured_at), origin: row.origin,
  })) };
}
export async function configureCampaign(tx: Tx, p: Principal, id: string, body: unknown, key: string | null) {
  const input = CampaignConfigurationInput.parse(body); z.uuid().parse(id);
  const authority = async () => {
    await assertCurrentAuthority(tx, p, 'edit', p.api_key ? 'campaigns:write' : undefined);
    if (input.audience_snapshot_id !== undefined)
      await assertCurrentAuthority(tx, p, 'audience', p.api_key ? 'audience:read' : undefined);
  };
  // Original receipts cannot authorize recipient access after role/scope changes.
  await authority();
  const response = await keyed(tx, p, 'campaign.configuration:' + id, key, campaignCanonicalJSON(input), async () => {
    const c = (await tx.query('SELECT * FROM campaigns WHERE id=$1 FOR UPDATE', [id])).rows[0];
    if (!c) fail(404, 'RESOURCE_NOT_FOUND', 'Campaign not found.');
    await authority();
    if (c.version !== input.expected_version)
      fail(409, 'VERSION_CONFLICT', 'The campaign configuration changed. Keep your edits and reload the current version before saving.', { current_version: c.version });
    if (!['draft', 'review_pending'].includes(c.state))
      fail(409, 'STATE_CONFLICT', 'Only draft or review-pending campaigns can change configuration.');
    let planned_timing = null;
    try { planned_timing = input.planned_timing ? resolveCampaignTiming(input.planned_timing) : null; }
    catch (error) { if (error instanceof CampaignTimingError) fail(422, error.code, error.message, { field: error.field }); throw error; }
    const revision = (await tx.query('SELECT id,artifact_hash FROM revisions WHERE id=$1', [input.revision_id])).rows[0];
    if (!revision) fail(404, 'RESOURCE_NOT_FOUND', 'Revision not found.');
    const selected = input.audience_snapshot_id === undefined ? null : await audienceSnapshotBinding(tx, input.audience_snapshot_id);
    const selectionUnchanged = !selected ||
      (campaignCanonicalJSON(c.intent.audience_snapshot ?? null) === campaignCanonicalJSON(selected.pointer) &&
       campaignCanonicalJSON(c.intent.audience ?? null) === campaignCanonicalJSON(selected.members));
    if (c.name === input.name && c.revision_id === revision.id && c.intent.artifact_hash === revision.artifact_hash &&
        campaignCanonicalJSON(c.intent.planned_timing ?? null) === campaignCanonicalJSON(planned_timing) && selectionUnchanged)
      return { campaign: configurationView(c), changed: false, notice: 'Configuration is unchanged. Planned timing does not schedule delivery.' };
    const intent = { ...c.intent, revision_id: revision.id, artifact_hash: revision.artifact_hash, planned_timing,
      ...(selected ? { audience: selected.members, audience_snapshot: selected.pointer } : {}) };
    const hash = digest(campaignCanonicalJSON({ configuration_version: c.version + 1, name: input.name, revision_id: revision.id, intent }));
    const campaign = (await tx.query("UPDATE campaigns SET name=$2,revision_id=$3,intent=$4,digest=$5,version=version+1,state='draft',approval=NULL WHERE id=$1 AND version=$6 RETURNING *",
      [id, input.name, revision.id, JSON.stringify(intent), hash, input.expected_version])).rows[0];
    if (!campaign) fail(409, 'VERSION_CONFLICT', 'The campaign configuration changed. Reload before saving.');
    await audit(tx, p.workspace, p.user, 'campaign.configuration_changed', id);
    return { campaign: configurationView(campaign), changed: true,
      notice: 'Draft configuration saved. Review must be requested again. Planned timing does not schedule delivery.' };
  });
  await authority();
  return redactedCampaignResponse(response);
}
