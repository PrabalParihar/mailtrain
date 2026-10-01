import { z } from 'zod';
import type { Tx } from './db';
import type { Principal } from './auth';
import { digest } from './audit';
import { AppError, fail } from './errors';
import { signPreferenceClaims, verifyPreferenceClaims } from './preference-tokens';
const Cursor = z.object({
  workspace: z.uuid(),
  actor: z.string(),
  resource: z.string(),
  filters: z.string().regex(/^[0-9a-f]{64}$/),
  created: z.iso.datetime({ offset: true }),
  id: z.uuid(),
});
type Options = {
  resource:
    'keys' | 'brand-sources' | 'brands' | 'emails' | 'revisions' | 'contacts' | 'campaigns' | 'segments' | 'audit' | 'derivatives' | 'events' | 'webhook-endpoints' | 'webhook-deliveries' | 'webhook-attempts';
  from: string;
  fields: string;
  created?: string;
  id?: string;
  where?: string;
  values?: unknown[];
  filters?: Record<string, unknown>;
};
// SQL identifiers/projections are fixed server-owned constants, never taken from query parameters.
export async function resourcePage(req: Request, tx: Tx, p: Principal, options: Options) {
  const params = new URL(req.url).searchParams;
  const limit = z.coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .parse(params.get('limit') ?? 25);
  const created = options.created ?? 'created_at',
    id = options.id ?? 'id',
    values = [...(options.values ?? [])];
  const filters: Record<string, unknown> = { ...(options.filters ?? {}) };
  let where = options.where ?? 'TRUE';
  for (const [parameter, operator] of [
    ['created_after', '>='],
    ['created_before', '<'],
  ] as const) {
    const value = params.get(parameter);
    if (value !== null) {
      const instant = z.iso.datetime({ offset: true }).parse(value);
      filters[parameter] = instant;
      values.push(instant);
      where += ` AND ${created}${operator}$${values.length}::timestamptz`;
    }
  }
  const totalRaw = (
    await tx.query<{ total: string }>(
      `SELECT count(*)::text AS total FROM ${options.from} WHERE ${where}`,
      values,
    )
  ).rows[0].total;
  const total_count = Number(totalRaw);
  if (!Number.isSafeInteger(total_count))
    fail(503, 'DEPENDENCY_UNAVAILABLE', 'This collection exceeds the supported count range.');
  const fingerprint = digest(filters);
  let cursor: z.infer<typeof Cursor> | undefined;
  const after = params.get('after');
  if (after) {
    if (after.length > 4096) fail(400, 'INVALID_CURSOR', 'This cursor is invalid.');
    try {
      cursor = Cursor.parse(await verifyPreferenceClaims(after, 'resource-page'));
      if (
        cursor.workspace !== p.workspace ||
        cursor.actor !== p.user ||
        cursor.resource !== options.resource ||
        cursor.filters !== fingerprint
      )
        fail(
          400,
          'INVALID_CURSOR',
          'This cursor belongs to a different account, workspace or selection.',
        );
    } catch (error) {
      if (error instanceof AppError && error.status === 503) throw error;
      fail(400, 'INVALID_CURSOR', 'This cursor is invalid or expired.');
    }
  }
  const position = values.length + 1;
  values.push(cursor?.created ?? null, cursor?.id ?? null, limit + 1);
  const rows = (
    await tx.query<Record<string, unknown> & { id: string; _page_created: string }>(
      `SELECT ${options.fields},to_char(${created} AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS _page_created FROM ${options.from} WHERE (${where}) AND ($${position}::timestamptz IS NULL OR (${created},${id})<($${position}::timestamptz,$${position + 1}::uuid)) ORDER BY ${created} DESC,${id} DESC LIMIT $${position + 2}`,
      values,
    )
  ).rows;
  const has_more = rows.length > limit,
    last = rows[Math.min(rows.length, limit) - 1];
  const data = rows.slice(0, limit).map((row) => {
    const item: { [key: string]: unknown; id: string } = { ...row };
    delete item._page_created;
    return item;
  });
  return {
    data,
    total_count,
    has_more,
    next_cursor: has_more
      ? await signPreferenceClaims(
          {
            workspace: p.workspace,
            actor: p.user,
            resource: options.resource,
            filters: fingerprint,
            created: last._page_created,
            id: last.id,
          },
          'resource-page',
          '15m',
        )
      : null,
  };
}
