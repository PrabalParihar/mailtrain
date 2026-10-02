import { z } from 'zod';
import { withPrincipal, principal } from './auth';
import { tenant } from './db';
import { assertCurrentAuthority } from './current-authority';
import { createUpload } from './asset-upload';
import {
  assetMetadata,
  assetVariantManifest,
  createFallback,
  readAssetVariantsVerified,
} from './assets';
import { keyed } from './commands';
import { fail } from './errors';
import { signPreferenceClaims, verifyPreferenceClaims } from './preference-tokens';
export async function assetRoute(
  req: Request,
  path: string[],
  body: Record<string, unknown>,
  key: string | null,
): Promise<unknown | Response> {
  const [, id, command, variant, content] = path;
  if (id === 'uploads' && path.length === 2 && req.method === 'POST')
    return withPrincipal(req, 'edit', (tx, p) => createUpload(tx, p, body, key));
  if (!id && req.method === 'GET')
    return withPrincipal(req, 'read', async (tx, p) => {
      await assertCurrentAuthority(tx, p, 'read', 'assets:read');
      const params = new URL(req.url).searchParams,
        limit = z.coerce
          .number()
          .int()
          .min(1)
          .max(100)
          .parse(params.get('limit') ?? 25);
      let cursor: { id: string; created: string } | null = null;
      const after = params.get('after');
      if (after) {
        const claims = await verifyPreferenceClaims(after, 'assets-page');
        if (claims.workspace !== p.workspace || claims.actor !== p.user)
          fail(400, 'INVALID_CURSOR', 'This cursor belongs to another actor or workspace.');
        cursor = z
          .object({ id: z.uuid(), created: z.iso.datetime({ offset: true }) })
          .parse(claims);
      }
      const rows = (
        await tx.query(
          `SELECT id,to_char(created_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS cursor_created FROM assets WHERE workspace_id=$1 AND NOT hidden AND ($2::timestamptz IS NULL OR (created_at,id)<($2::timestamptz,$3::uuid))ORDER BY created_at DESC,id DESC LIMIT $4`,
          [p.workspace, cursor?.created ?? null, cursor?.id ?? null, limit + 1],
        )
      ).rows;
      const data = [];
      for (const row of rows.slice(0, limit)) data.push(await assetMetadata(tx, p, row.id, 2));
      const last = rows[Math.min(rows.length, limit) - 1],
        has_more = rows.length > limit;
      return {
        data,
        has_more,
        next_cursor: has_more
          ? await signPreferenceClaims(
              { workspace: p.workspace, actor: p.user, id: last.id, created: last.cursor_created },
              'assets-page',
              '15m',
            )
          : null,
      };
    });
  z.uuid().parse(id);
  if (req.method === 'GET' && !command)
    return withPrincipal(req, 'read', async (tx, p) => ({ asset: await assetMetadata(tx, p, id) }));
  if (req.method === 'GET' && command === 'variants' && content === 'content') {
    z.uuid().parse(variant);
    const p = await principal(req, 'read'),
      manifest = await tenant(p.workspace, p.user, async (tx) => {
        return assetVariantManifest(tx, p, id, variant);
      });
    const result = await readAssetVariantsVerified(p, manifest);
    return new Response(Buffer.from(result[0].bytes), {
      headers: {
        'Content-Type': result[0].entry.mime,
        'Content-Length': String(result[0].bytes.length),
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'private, no-store',
      },
    });
  }
  if (req.method === 'POST' && command === 'fallback') {
    const selected = z
      .object({ selected_frame: z.number().int().min(0).max(199) })
      .strict()
      .parse(body);
    const version = Number(
      req.headers
        .get('if-match')
        ?.replaceAll('"', '')
        .replace(/^asset-/, ''),
    );
    if (!Number.isSafeInteger(version) || version < 1)
      fail(428, 'VERSION_REQUIRED', 'Supply the acknowledged asset If-Match version.');
    return withPrincipal(req, 'edit', (tx, p) =>
      createFallback(tx, p, id, selected.selected_frame, version, key),
    );
  }
  if (req.method === 'POST' && command === 'remove')
    return withPrincipal(req, 'edit', async (tx, p) => {
      await assertCurrentAuthority(tx, p, 'edit', 'assets:write');
      return keyed(tx, p, 'assets.remove', key, { id }, async () => {
        const row = (
          await tx.query(
            'UPDATE assets SET hidden=true,version=version+1 WHERE workspace_id=$1 AND id=$2 RETURNING id',
            [p.workspace, id],
          )
        ).rows[0];
        if (!row) fail(404, 'RESOURCE_NOT_FOUND', 'Image not found.');
        return { asset: await assetMetadata(tx, p, id) };
      });
    });
  if (command === 'publish')
    fail(503, 'ASSET_PUBLICATION_NOT_CONFIGURED', 'Public image publication is unavailable.');
  fail(404, 'RESOURCE_NOT_FOUND', 'Asset route not found.');
}
