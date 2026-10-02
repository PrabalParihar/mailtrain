import { z } from 'zod';
import { AudienceSnapshotMetadataSchema, AudienceSnapshotPointerSchema, snapshotSource } from '../domain/audience-snapshots';
import type { Tx } from './db';
import type { Principal } from './auth';
import { digest } from './audit';
import { fail } from './errors';
import { resourcePage } from './pagination';

const projection = 'a.id,a.segment_id,a.segment_version,a.evaluated_at,a.matched_count,a.eligible_count,a.digest,a.created_at,s.name AS segment_name';
const from = 'audience_snapshots a JOIN segments s ON s.workspace_id=a.workspace_id AND s.id=a.segment_id';
const iso = (value: unknown) => value instanceof Date ? value.toISOString() : value;
function metadata(row: Record<string, unknown>) {
  const result = AudienceSnapshotMetadataSchema.safeParse({
    id: row.id, segment_id: row.segment_id, segment_version: row.segment_version,
    evaluated_at: iso(row.evaluated_at), matched_count: row.matched_count,
    eligible_count: row.eligible_count, excluded_count: Number(row.matched_count) - Number(row.eligible_count),
    digest: row.digest, segment_name: row.segment_name, created_at: iso(row.created_at),
  });
  if (!result.success) fail(409, 'SNAPSHOT_INVALID', 'This stored snapshot has invalid metadata. Freeze a new valid selection.');
  return result.data;
}
function query(req: Request, collection: boolean) {
  const params = new URL(req.url).searchParams, seen = new Set<string>();
  const allowed = collection ? ['limit', 'after', 'created_after', 'created_before', 'segment_id'] : [];
  for (const [name, value] of params) {
    if (!allowed.includes(name) || seen.has(name) || value === '')
      fail(422, 'QUERY_INVALID', 'Use supported audience metadata parameters once with explicit values.');
    seen.add(name);
  }
  if (params.has('limit')) z.string().regex(/^[1-9]\d{0,2}$/).parse(params.get('limit'));
  return params;
}
export async function audienceSnapshotPage(req: Request, tx: Tx, p: Principal) {
  const params = query(req, true), selected = params.get('segment_id');
  const segment_id = selected === null ? undefined : z.uuid().parse(selected).toLowerCase();
  const page = await resourcePage(req, tx, p, {
    resource: 'audience-snapshots', from, fields: projection, created: 'a.created_at', id: 'a.id',
    where: segment_id ? 'a.segment_id=$1' : 'TRUE', values: segment_id ? [segment_id] : [],
    filters: { segment_id: segment_id ?? null },
  });
  return { ...page, data: page.data.map(metadata) };
}
export async function audienceSnapshotMetadata(req: Request, tx: Tx, id: string) {
  query(req, false);
  const row = (await tx.query(`SELECT ${projection} FROM ${from} WHERE a.id=$1`, [z.uuid().parse(id)])).rows[0];
  if (!row) fail(404, 'RESOURCE_NOT_FOUND', 'Snapshot not found.');
  return { snapshot: metadata(row) };
}
export async function audienceSnapshotBinding(tx: Tx, id: string) {
  const row = (await tx.query('SELECT * FROM audience_snapshots WHERE id=$1', [z.uuid().parse(id)])).rows[0];
  if (!row) fail(404, 'RESOURCE_NOT_FOUND', 'Snapshot not found.');
  try {
    const source = snapshotSource({ segment_id: row.segment_id, segment_version: row.segment_version,
      evaluated_at: row.evaluated_at, members: row.members, matched_count: row.matched_count, eligible_count: row.eligible_count });
    const pointer = AudienceSnapshotPointerSchema.parse({ id: row.id, segment_id: source.segment_id,
      segment_version: source.segment_version, evaluated_at: source.evaluated_at,
      matched_count: source.matched_count, eligible_count: source.eligible_count, digest: row.digest });
    if (digest(source) !== pointer.digest) throw new Error('Digest mismatch');
    return { pointer, members: source.members };
  } catch {
    fail(409, 'SNAPSHOT_INVALID', 'This stored snapshot cannot be verified. Freeze a new valid selection.');
  }
}
