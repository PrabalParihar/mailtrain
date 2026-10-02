import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import {
  type AssetManifest,
  type AssetManifestEntry,
  type AssetMetadata,
  type AssetVariantRef,
  MEDIA_LIMITS,
} from '../domain/assets';
import { type Tx, tenant } from './db';
import type { Principal } from './auth';
import { assertCurrentAuthority } from './current-authority';
import { fail } from './errors';
import { configuredAssetStore, type AssetStore } from './asset-store';
import { keyed } from './commands';
const Ref = z.object({ asset_id: z.uuid(), variant_id: z.uuid() }).strict();
export function assetReferences(spec: unknown): Array<AssetVariantRef & { node_id: string }> {
  const refs: Array<AssetVariantRef & { node_id: string }> = [];
  const visit = (value: unknown) => {
    if (!value || typeof value !== 'object') return;
    if (Array.isArray(value)) {
      for (const item of value) visit(item);
      return;
    }
    const obj = value as Record<string, unknown>;
    if (obj.type === 'image' && obj.asset_ref) {
      refs.push({ ...Ref.parse(obj.asset_ref), node_id: String(obj.id) });
      if (obj.fallback_ref)
        refs.push({ ...Ref.parse(obj.fallback_ref), node_id: String(obj.id) + ':fallback' });
    }
    for (const [key, item] of Object.entries(obj))
      if (!['asset_ref', 'fallback_ref', 'asset_registry'].includes(key)) visit(item);
  };
  visit(spec);
  const registry = (spec as { asset_registry?: unknown })?.asset_registry;
  if (registry) {
    const entries = Array.isArray(registry) ? registry : Object.values(registry);
    for (const entry of entries)
      refs.push({ ...Ref.parse(entry), node_id: 'registry:' + refs.length });
  }
  if (refs.length > MEDIA_LIMITS.entries)
    fail(413, 'ASSET_REFERENCE_LIMIT', 'At most 200 private variants can be referenced.');
  return refs;
}
async function resolveEntry(
  tx: Tx,
  p: Principal,
  ref: AssetVariantRef,
): Promise<AssetManifestEntry> {
  const row = (
    await tx.query(
      `SELECT v.*,a.source_sha256,a.state,s.status AS source_scan_status,d.status AS derivative_scan_status,s.sha256 AS scanned_source,d.sha256 AS scanned_derivative,r.attested,r.source_sha256 AS rights_source FROM asset_variants v JOIN assets a ON a.workspace_id=v.workspace_id AND a.id=v.asset_id JOIN asset_scans s ON s.workspace_id=v.workspace_id AND s.id=v.source_scan_id JOIN asset_scans d ON d.workspace_id=v.workspace_id AND d.id=v.scan_id JOIN asset_rights r ON r.workspace_id=v.workspace_id AND r.id=v.rights_id WHERE v.workspace_id=$1 AND v.asset_id=$2 AND v.id=$3 FOR SHARE OF a`,
      [p.workspace, ref.asset_id, ref.variant_id],
    )
  ).rows[0];
  if (!row) fail(404, 'RESOURCE_NOT_FOUND', 'Private image variant not found.');
  if (
    !['ready_private', 'published'].includes(row.state) ||
    row.source_scan_status !== 'clean' ||
    row.derivative_scan_status !== 'clean' ||
    row.scanned_source !== row.source_sha256 ||
    row.scanned_derivative !== row.sha256 ||
    !row.attested ||
    row.rights_source !== row.source_sha256
  )
    fail(
      409,
      'ASSET_NOT_READY',
      'This image is unavailable or lacks clean source and derivative evidence.',
    );
  return {
    asset_id: row.asset_id,
    variant_id: row.id,
    source_sha256: row.source_sha256,
    sha256: row.sha256,
    mime: row.mime,
    bytes: row.bytes,
    width: row.width,
    height: row.height,
    role: row.role,
    frames: row.frames,
    ...(row.selected_frame === null ? {} : { selected_frame: row.selected_frame }),
    processing_profile: row.processing_profile,
    storage_profile: row.storage_profile,
    visibility: 'private',
    rights_evidence_id: row.rights_id,
    scan_evidence_ids: [row.source_scan_id, row.scan_id],
  };
}
async function sameFallbackJob(
  tx: Tx,
  p: Principal,
  animation: AssetVariantRef,
  fallback: AssetVariantRef,
) {
  if (animation.asset_id !== fallback.asset_id) return false;
  return (
    (
      await tx.query(
        'SELECT a.source_scan_id=f.source_scan_id AS same FROM asset_variants a JOIN asset_variants f ON f.workspace_id=a.workspace_id AND f.asset_id=a.asset_id WHERE a.workspace_id=$1 AND a.id=$2 AND f.id=$3',
        [p.workspace, animation.variant_id, fallback.variant_id],
      )
    ).rows[0]?.same === true
  );
}
export async function resolveAssetManifest(
  tx: Tx,
  p: Principal,
  spec: unknown,
  target:
    | 'preview'
    | 'private_preview'
    | 'bundle'
    | 'private_bundle'
    | 'revision'
    | 'public'
    | 'send'
    | 'hosted'
    | 'esp' = 'revision',
): Promise<AssetManifest> {
  const refs = assetReferences(spec),
    entries: AssetManifestEntry[] = [];
  if (refs.length) await assertCurrentAuthority(tx, p, 'read', 'assets:read');
  for (const ref of refs) {
    if (entries.some((e) => e.variant_id === ref.variant_id && e.asset_id === ref.asset_id))
      continue;
    entries.push(await resolveEntry(tx, p, ref));
  }
  for (const entry of entries)
    if (entry.role === 'animation') {
      let fallback: AssetManifestEntry | undefined;
      for (const candidate of entries)
        if (candidate.role === 'fallback' && (await sameFallbackJob(tx, p, entry, candidate))) {
          fallback = candidate;
          break;
        }
      if (!fallback)
        fail(409, 'ASSET_FALLBACK_REQUIRED', 'Select a clean static fallback for this animation.');
      entry.fallback = { asset_id: fallback.asset_id, variant_id: fallback.variant_id };
    }
  if (entries.length && ['public', 'send', 'hosted', 'esp'].includes(target))
    fail(
      503,
      'ASSET_PUBLICATION_NOT_CONFIGURED',
      'Public image delivery is unavailable. Download a private image bundle.',
    );
  entries.sort(
    (a, b) => a.asset_id.localeCompare(b.asset_id) || a.variant_id.localeCompare(b.variant_id),
  );
  return { version: 'asset-manifest-1', entries };
}
// Pure current-evidence fence: retain asset SHARE locks in the caller's output
// settlement transaction. File reads stay outside database transactions.
export async function assertAssetManifestCurrent(tx:Tx,p:Principal,manifest:AssetManifest,maxBytes=MEDIA_LIMITS.derivatives){
  if(manifest.version!=='asset-manifest-1'||manifest.entries.length>MEDIA_LIMITS.entries)fail(400,'ASSET_MANIFEST_INVALID','Invalid private image manifest.');
    await assertCurrentAuthority(tx, p, 'read', 'assets:read');
    const list = [];
    let total = 0;
    for (const entry of manifest.entries) {
      const current = await resolveEntry(tx, p, entry);
      const fields = [
        'asset_id',
        'variant_id',
        'source_sha256',
        'sha256',
        'mime',
        'bytes',
        'width',
        'height',
        'role',
        'frames',
        'selected_frame',
        'processing_profile',
        'storage_profile',
        'visibility',
        'public_url',
        'rights_evidence_id',
        'scan_evidence_ids',
      ] as const;
      for (const field of fields)
        if (JSON.stringify(current[field]) !== JSON.stringify(entry[field]))
          fail(409, 'ASSET_MANIFEST_MISMATCH', 'Private image evidence changed.');
      if (entry.fallback) {
        const fallback = await resolveEntry(tx, p, entry.fallback);
        if (
          fallback.asset_id !== entry.asset_id ||
          fallback.role !== 'fallback' ||
          !(await sameFallbackJob(tx, p, entry, fallback))
        )
          fail(409, 'ASSET_FALLBACK_REQUIRED', 'Select an authorized static fallback.');
      }
      total += current.bytes;
      if (total > maxBytes)
        fail(413, 'ASSET_READ_LIMIT', 'Private image bytes exceed this output limit.');
      const key = (
        await tx.query(
          'SELECT object_key FROM asset_variants WHERE workspace_id=$1 AND asset_id=$2 AND id=$3',
          [p.workspace, current.asset_id, current.variant_id],
        )
      ).rows[0].object_key;
      list.push({ entry: current, key });
    }
    return list;
}
export async function readAssetVariantsVerified(
  p: Principal,
  manifest: AssetManifest,
  store: AssetStore = configuredAssetStore(),
  maxBytes = MEDIA_LIMITS.derivatives,
) {
  if (manifest.version !== 'asset-manifest-1' || manifest.entries.length > MEDIA_LIMITS.entries)
    fail(400, 'ASSET_MANIFEST_INVALID', 'Invalid private image manifest.');
  const admitted=await tenant(p.workspace,p.user,tx=>assertAssetManifestCurrent(tx,p,manifest,maxBytes));
  const bytes = [];
  for (const item of admitted)
    bytes.push({
      entry: item.entry,
      bytes: await store.readVerified(item.key, item.entry.sha256, item.entry.bytes),
    });
  await tenant(p.workspace, p.user, async (tx) => {
    await assertCurrentAuthority(tx, p, 'read', 'assets:read');
    for (const item of admitted) await resolveEntry(tx, p, item.entry);
  });
  return bytes;
}
export async function syncDraftAssetReferences(
  tx: Tx,
  p: Principal,
  emailId: string,
  spec: unknown,
) {
  if (!assetReferences(spec).length) {
    const previous = (
      await tx.query(
        'SELECT 1 FROM asset_draft_references WHERE workspace_id=$1 AND email_id=$2 LIMIT 1',
        [p.workspace, emailId],
      )
    ).rows[0];
    if (previous) await assertCurrentAuthority(tx, p, 'edit', 'assets:write');
    await tx.query('DELETE FROM asset_draft_references WHERE workspace_id=$1 AND email_id=$2', [
      p.workspace,
      emailId,
    ]);
    return;
  }
  await assertCurrentAuthority(tx, p, 'edit', 'assets:write');
  await resolveAssetManifest(tx, p, spec);
  await tx.query('DELETE FROM asset_draft_references WHERE workspace_id=$1 AND email_id=$2', [
    p.workspace,
    emailId,
  ]);
  for (const ref of assetReferences(spec))
    await tx.query(
      'INSERT INTO asset_draft_references(workspace_id,email_id,node_id,asset_id,variant_id)VALUES($1,$2,$3,$4,$5)',
      [p.workspace, emailId, ref.node_id, ref.asset_id, ref.variant_id],
    );
}
export async function pinRevisionAssetReferences(
  tx: Tx,
  p: Principal,
  revisionId: string,
  manifest: AssetManifest,
) {
  if (!manifest.entries.length) return;
  await assertCurrentAuthority(tx, p, 'edit', 'assets:write');
  for (const ref of manifest.entries) {
    await resolveEntry(tx, p, ref);
    await tx.query(
      'INSERT INTO asset_revision_references(workspace_id,revision_id,asset_id,variant_id)VALUES($1,$2,$3,$4)ON CONFLICT DO NOTHING',
      [p.workspace, revisionId, ref.asset_id, ref.variant_id],
    );
  }
}
export async function assetVariantManifest(
  tx: Tx,
  p: Principal,
  assetId: string,
  variantId: string,
): Promise<AssetManifest> {
  await assertCurrentAuthority(tx, p, 'read', 'assets:read');
  return {
    version: 'asset-manifest-1',
    entries: [await resolveEntry(tx, p, { asset_id: assetId, variant_id: variantId })],
  };
}
export async function assetMetadata(
  tx: Tx,
  p: Principal,
  id: string,
  variantLimit = 200,
): Promise<AssetMetadata> {
  await assertCurrentAuthority(tx, p, 'read', 'assets:read');
  const row = (
    await tx.query(
      'SELECT id,state,version,mime,source_bytes AS bytes,source_sha256,alt,decorative,failure_code FROM assets WHERE workspace_id=$1 AND id=$2',
      [p.workspace, id],
    )
  ).rows[0];
  if (!row) fail(404, 'RESOURCE_NOT_FOUND', 'Image not found.');
  const variants: AssetManifestEntry[] = [];
  if (['ready_private', 'published'].includes(row.state)) {
    for (const v of (
      await tx.query(
        'SELECT id FROM asset_variants WHERE workspace_id=$1 AND asset_id=$2 ORDER BY created_at DESC,id DESC LIMIT $3',
        [p.workspace, id, variantLimit],
      )
    ).rows)
      variants.push(await resolveEntry(tx, p, { asset_id: id, variant_id: v.id }));
  }
  for (const v of variants)
    if (v.role === 'animation') {
      const sibling = (
        await tx.query(
          "SELECT id FROM asset_variants WHERE workspace_id=$1 AND asset_id=$2 AND role='fallback' AND source_scan_id=(SELECT source_scan_id FROM asset_variants WHERE workspace_id=$1 AND id=$3)ORDER BY created_at DESC,id DESC LIMIT 1",
          [p.workspace, id, v.variant_id],
        )
      ).rows[0];
      if (sibling) v.fallback = { asset_id: id, variant_id: sibling.id };
    }
  return { ...row, variants };
}
export async function createFallback(
  tx: Tx,
  p: Principal,
  id: string,
  frame: number,
  version: number,
  key: string | null,
) {
  z.number().int().min(0).max(199).parse(frame);
  await assertCurrentAuthority(tx, p, 'edit', 'assets:write');
  return keyed(tx, p, 'assets.fallback', key, { id, frame, version }, async () => {
    const a = (
      await tx.query(
        "SELECT * FROM assets WHERE workspace_id=$1 AND id=$2 AND state='ready_private'FOR UPDATE",
        [p.workspace, id],
      )
    ).rows[0];
    if (!a) fail(409, 'ASSET_NOT_READY', 'Choose a ready private animation.');
    if (a.version !== version)
      fail(412, 'VERSION_CONFLICT', 'The image library changed. Reload its metadata.');
    if (a.mime !== 'image/gif')
      fail(400, 'ASSET_NOT_ANIMATION', 'Only GIF images have selectable frames.');
    const animation = (
      await tx.query(
        "SELECT frames FROM asset_variants WHERE workspace_id=$1 AND asset_id=$2 AND role='animation' ORDER BY created_at DESC,id DESC LIMIT 1",
        [p.workspace, id],
      )
    ).rows[0];
    if (!animation || frame >= animation.frames)
      fail(
        422,
        'ASSET_FALLBACK_FRAME_INVALID',
        'Select a frame within the measured animation frame count.',
      );
    const u = (
      await tx.query(
        'SELECT u.id FROM asset_uploads u JOIN asset_rights r ON r.workspace_id=u.workspace_id AND r.upload_id=u.id WHERE u.workspace_id=$1 AND u.asset_id=$2 ORDER BY u.created_at DESC LIMIT 1',
        [p.workspace, id],
      )
    ).rows[0];
    const reserved = MEDIA_LIMITS.derivatives;
    const q = (
      await tx.query(
        'UPDATE asset_quotas SET reserved=reserved+$2 WHERE workspace_id=$1 AND reserved+used+$2<=allowance RETURNING workspace_id',
        [p.workspace, reserved],
      )
    ).rows[0];
    if (!q) fail(409, 'ASSET_QUOTA_EXHAUSTED', 'Private media allowance is exhausted.');
    const operation = randomUUID(),
      upload = randomUUID(),
      intent = {
        rights: { terms_version: MEDIA_LIMITS.rights },
        alt: a.alt,
        decorative: a.decorative,
      };
    await tx.query(
      "INSERT INTO operations(workspace_id,id,type,input,created_by,created_api_key_id)VALUES($1,$2,'asset.fallback',$3,$4,$5)",
      [
        p.workspace,
        operation,
        { asset_id: id, selected_frame: frame },
        p.api_key?.delegator ?? p.user,
        p.api_key?.id ?? null,
      ],
    );
    await tx.query(
      "INSERT INTO asset_uploads(workspace_id,id,asset_id,operation_id,created_by,principal,token_hash,expected_sha256,expected_bytes,intent,status,reserved_bytes)VALUES($1,$2,$3,$4,$5,$6,'internal',$7,$8,$9,'finalized',$10)",
      [
        p.workspace,
        upload,
        id,
        operation,
        p.user,
        p,
        a.source_sha256,
        a.source_bytes,
        intent,
        reserved,
      ],
    );
    await tx.query(
      'INSERT INTO asset_rights(workspace_id,asset_id,upload_id,actor,terms_version,attested,source_sha256)SELECT workspace_id,asset_id,$3,actor,terms_version,attested,source_sha256 FROM asset_rights WHERE workspace_id=$1 AND upload_id=$2',
      [p.workspace, u.id, upload],
    );
    await tx.query(
      'INSERT INTO media_jobs(workspace_id,operation_id,asset_id,upload_id,principal,selected_frame)VALUES($1,$2,$3,$4,$5,$6)',
      [p.workspace, operation, id, upload, p, frame],
    );
    await tx.query('UPDATE assets SET version=version+1 WHERE workspace_id=$1 AND id=$2', [
      p.workspace,
      id,
    ]);
    return { operation: { id: operation, state: 'queued' }, asset: await assetMetadata(tx, p, id) };
  });
}
