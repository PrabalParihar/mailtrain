import { withPrincipal, localMode } from './auth';
import { bytesDigest, RENDERER_VERSION } from '../../renderer/protocol.mjs';
import { callRenderWorker } from './render-client';
import { fail } from './errors';
import { audit } from './audit';
import { withRenderSlot } from './render-admission';
export async function frozenRenderDownload(
  req: Request,
  revision: { id: string; html: string; artifact_hash: string },
  format: 'png' | 'pdf',
) {
  const rendererVersion = localMode() && !process.env.RENDER_WORKER_URL
    ? `lettercape-local-browser-export-1-${process.platform}`
    : RENDERER_VERSION;
  if (req.signal.aborted) fail(499, 'RENDER_CANCELLED', 'The export request was cancelled.');
  const cached = await withPrincipal(req, 'edit', async (tx) => {
    const existing = (
      await tx.query(
        'SELECT * FROM render_downloads WHERE revision_id=$1 AND format=$2 AND renderer_version=$3',
        [revision.id, format, rendererVersion],
      )
    ).rows[0];
    if (existing) {
      if (
        existing.artifact_hash !== revision.artifact_hash ||
        bytesDigest(existing.body) !== existing.body_hash
      )
        fail(
          503,
          'RENDER_CACHE_INVALID',
          'Stored export integrity failed; no bytes were returned.',
        );
      return existing.body as Buffer;
    }
    return null;
  });
  if (cached) return cached;
  return withRenderSlot(req.signal, () => withPrincipal(req, 'edit', async (tx, p) => {
    if (req.signal.aborted) fail(499, 'RENDER_CANCELLED', 'The export request was cancelled.');
    const locked = (await tx.query('SELECT pg_try_advisory_xact_lock(hashtext($1)) AS acquired', [p.workspace + ':render-cache'])).rows[0].acquired;
    if (!locked) fail(429, 'RENDER_BUSY', 'Another frozen export is rendering. Retry later.', { retry_after: 2 });
    const existing = (await tx.query('SELECT * FROM render_downloads WHERE revision_id=$1 AND format=$2 AND renderer_version=$3', [revision.id, format, rendererVersion])).rows[0];
    if (existing) {
      if (existing.artifact_hash !== revision.artifact_hash || bytesDigest(existing.body) !== existing.body_hash)
        fail(503, 'RENDER_CACHE_INVALID', 'Stored export integrity failed; no bytes were returned.');
      return existing.body as Buffer;
    }
    const configured = Number(
      process.env.RENDER_CACHE_ALLOWANCE_BYTES ?? (localMode() ? 67108864 : 0),
    );
    if (!Number.isSafeInteger(configured) || configured < 20971520 || configured > 2147483648)
      fail(
        503,
        'RENDER_STORAGE_BUDGET_REQUIRED',
        'Configure a finite render-cache storage allowance before browser exports.',
      );
    const used = Number(
      (await tx.query('SELECT coalesce(sum(byte_size),0)::text AS bytes FROM render_downloads'))
        .rows[0].bytes,
    );
    if (used + 20971520 > configured)
      fail(
        409,
        'RENDER_STORAGE_LIMIT',
        'Export storage cannot admit another maximum-size render. Existing frozen exports are preserved.',
      );
    let bytes: Buffer;
    if (localMode() && !process.env.RENDER_WORKER_URL) {
      const { renderDownload } = await import('./render-download');
      bytes = await renderDownload(revision.html, format, req.signal);
    } else {
      if (!process.env.RENDER_WORKER_URL || !process.env.RENDER_WORKER_SECRET)
        fail(
          409,
          'RENDER_WORKER_REQUIRED',
          'Configure the separately isolated browser renderer before production exports.',
        );
      bytes = await callRenderWorker(
        {
          schema_version: 1,
          workspace_id: p.workspace,
          revision_id: revision.id,
          artifact_hash: revision.artifact_hash,
          renderer_version: RENDERER_VERSION,
          format,
          html: revision.html,
        },
        {
          url: process.env.RENDER_WORKER_URL,
          secret: process.env.RENDER_WORKER_SECRET,
          signal: req.signal,
        },
      );
    }
    if (req.signal.aborted) fail(499, 'RENDER_CANCELLED', 'The export request was cancelled.');
    await tx.query(
      'INSERT INTO render_downloads(workspace_id,revision_id,format,renderer_version,artifact_hash,body,body_hash,byte_size)VALUES($1,$2,$3,$4,$5,$6,$7,$8)',
      [
        p.workspace,
        revision.id,
        format,
        rendererVersion,
        revision.artifact_hash,
        bytes,
        bytesDigest(bytes),
        bytes.length,
      ],
    );
    await audit(tx, p.workspace, p.user, 'email.browser_export_cached', revision.id);
    return bytes;
  }));
}
