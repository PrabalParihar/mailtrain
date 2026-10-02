import assert from 'node:assert/strict';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import pg from 'pg';
import env from '@next/env';
import { withCreationDatabase } from '../tests/fixtures/creation-database';
import { createUpload } from '../src/server/asset-upload';
import { FileAssetStore, bytesHash, assetObjectKey } from '../src/server/asset-store';
import { claimMediaJob } from '../src/server/media-jobs';
import { runMediaJob } from '../src/server/media-worker';
import { assetMetadata, resolveAssetManifest, createFallback } from '../src/server/assets';
import { MEDIA_LIMITS, privateAssetBinding } from '../src/domain/assets';
import type { Principal } from '../src/server/auth';
env.loadEnvConfig(process.cwd());
const root = await mkdtemp(join(tmpdir(), 'lettercape-assets-smoke-'));
process.env.ASSET_STORE_ROOT = root;
const store = new FileAssetStore(root);
try {
  await withCreationDatabase(async (connection) => {
    const db = new pg.Pool({ connectionString: connection }),
      app = new pg.Pool({ connectionString: connection, options: '-c role=mailcraft_runtime' }),
      scheduler = new pg.Pool({
        connectionString: connection,
        options: '-c role=mailcraft_media_scheduler',
      }),
      worker = new pg.Pool({
        connectionString: connection,
        options: '-c role=mailcraft_media_worker',
      });
    const workspace = randomUUID(),
      user = 'assets-smoke-' + randomUUID(),
      token_hash = bytesHash(Buffer.from(randomUUID())),
      p: Principal = { workspace, user, role: 'Owner', local_session: { token_hash } };
    const transaction = async <T>(fn: (tx: pg.PoolClient) => Promise<T>) => {
      const c = await app.connect();
      try {
        await c.query('BEGIN');
        await c.query(
          "SELECT set_config('app.workspace_id',$1,true),set_config('app.user_id',$2,true)",
          [workspace, user],
        );
        const value = await fn(c);
        await c.query('COMMIT');
        return value;
      } catch (e) {
        await c.query('ROLLBACK');
        throw e;
      } finally {
        c.release();
      }
    };
    try {
      await db.query("INSERT INTO workspaces(id,name)VALUES($1,'actual media smoke')", [workspace]);
      await db.query("INSERT INTO memberships(workspace_id,user_id,role)VALUES($1,$2,'Owner')", [
        workspace,
        user,
      ]);
      await db.query(
        "INSERT INTO auth_sessions(token_hash,user_id,expires_at)VALUES($1,$2,clock_timestamp()+interval '1 hour')",
        [token_hash, user],
      );
      const gif = process.argv.includes('--gif');
      const source = await readFile(
          gif ? 'tests/fixtures/media/disposal-1.gif' : 'tests/fixtures/media/source.png',
        ),
        input = {
          filename: 'source.png',
          declared_mime: gif ? 'image/gif' : 'image/png',
          byte_size: source.length,
          sha256: bytesHash(source),
          rights: { attested: true, terms_version: MEDIA_LIMITS.rights },
          alt: 'Actual clean private image',
          decorative: false,
        },
        key = randomUUID();
      const intent = await transaction((tx) => createUpload(tx, p, input, key));
      assert.deepEqual(
        await transaction((tx) => createUpload(tx, p, input, key)),
        JSON.parse(JSON.stringify(intent)),
      );
      await assert.rejects(
        () => transaction((tx) => createUpload(tx, p, { ...input, alt: 'changed' }, key)),
        { code: 'IDEMPOTENCY_MISMATCH' },
      );
      const transfer = randomUUID();
      await transaction((tx) =>
        tx.query(
          "UPDATE asset_uploads SET status='transferring',transfer_token=$3,transfer_until=clock_timestamp()+interval '2 minutes'WHERE workspace_id=$1 AND id=$2",
          [workspace, intent.upload.id, transfer],
        ),
      );
      const object = assetObjectKey(workspace, intent.upload.id, 'source');
      await store.putImmutable(object, source, input.sha256);
      const committed = await transaction(
        async (tx) =>
          (
            await tx.query('SELECT mailcraft_finalize_upload($1,$2,$3,$4,$5,$6,$7)result', [
              workspace,
              intent.upload.id,
              transfer,
              object,
              input.sha256,
              source.length,
              input.declared_mime,
            ])
          ).rows[0].result,
      );
      const job = await claimMediaJob(scheduler);
      assert.ok(job);
      const success = await runMediaJob(worker, job!, store);
      if (!success)
        console.error(
          JSON.stringify(
            (
              await db.query('SELECT state,error FROM operations WHERE workspace_id=$1 AND id=$2', [
                workspace,
                job!.operation_id,
              ])
            ).rows[0],
          ),
        );
      assert.equal(success, true);
      const metadata = await transaction((tx) => assetMetadata(tx, p, committed.asset_id));
      assert.equal(metadata.state, 'ready_private');
      assert.equal(metadata.variants.length, gif ? 2 : 1);
      if (gif) {
        const before = (
          await db.query('SELECT reserved,used FROM asset_quotas WHERE workspace_id=$1', [
            workspace,
          ])
        ).rows[0];
        await assert.rejects(
          () =>
            transaction((tx) =>
              createFallback(
                tx,
                p,
                metadata.id,
                metadata.variants.find((v) => v.role === 'animation')!.frames,
                metadata.version,
                randomUUID(),
              ),
            ),
          { code: 'ASSET_FALLBACK_FRAME_INVALID' },
        );
        assert.deepEqual(
          (
            await db.query('SELECT reserved,used FROM asset_quotas WHERE workspace_id=$1', [
              workspace,
            ])
          ).rows[0],
          before,
        );
      }
      const variant = metadata.variants.find((v) => v.role === 'animation') ?? metadata.variants[0];
      const bytes = await store.readVerified(
        assetObjectKey(workspace, variant.variant_id, 'variant'),
        variant.sha256,
        variant.bytes,
      );
      assert.equal(bytesHash(bytes), variant.sha256);
      assert.notEqual(variant.sha256, input.sha256);
      const manifest = await transaction((tx) =>
        resolveAssetManifest(
          tx,
          p,
          {
            asset_registry: metadata.variants.map((v) => ({
              asset_id: v.asset_id,
              variant_id: v.variant_id,
            })),
          },
          'bundle',
        ),
      );
      assert.equal(
        manifest.entries.find((e) => e.variant_id === variant.variant_id)!.sha256,
        variant.sha256,
      );
      await assert.rejects(
        () =>
          transaction((tx) =>
            resolveAssetManifest(
              tx,
              p,
              {
                asset_registry: metadata.variants.map((v) => ({
                  asset_id: v.asset_id,
                  variant_id: v.variant_id,
                })),
              },
              'public',
            ),
          ),
        { code: 'ASSET_PUBLICATION_NOT_CONFIGURED' },
      );
      const quota = (
        await db.query('SELECT reserved,used FROM asset_quotas WHERE workspace_id=$1', [workspace])
      ).rows[0];
      assert.equal(quota.reserved, '0');
      assert.equal(
        Number(quota.used),
        source.length + metadata.variants.reduce((sum, v) => sum + v.bytes, 0),
      );
      const duplicate = await transaction((tx) =>
        createUpload(tx, p, { ...input, filename: 'second-attestation.png' }, randomUUID()),
      );
      const secondTransfer = randomUUID();
      await transaction((tx) =>
        tx.query(
          "UPDATE asset_uploads SET status='transferring',transfer_token=$3,transfer_until=clock_timestamp()+interval '2 minutes'WHERE workspace_id=$1 AND id=$2",
          [workspace, duplicate.upload.id, secondTransfer],
        ),
      );
      await store.readVerified(object, input.sha256, source.length);
      const second = await transaction(
        async (tx) =>
          (
            await tx.query('SELECT mailcraft_finalize_upload($1,$2,$3,$4,$5,$6,$7,$8)result', [
              workspace,
              duplicate.upload.id,
              secondTransfer,
              assetObjectKey(workspace, duplicate.upload.id, 'source'),
              input.sha256,
              source.length,
              input.declared_mime,
              object,
            ])
          ).rows[0].result,
      );
      assert.notEqual(second.asset_id, committed.asset_id);
      assert.equal(second.source_key, object);
      const next = await claimMediaJob(scheduler);
      assert.ok(next);
      assert.equal(await runMediaJob(worker, next!, store), true);
      const secondMetadata = await transaction((tx) => assetMetadata(tx, p, second.asset_id));
      assert.equal(secondMetadata.state, 'ready_private');
      const secondVariant = secondMetadata.variants.find((v) => v.role === variant.role)!;
      assert.equal(secondVariant.sha256, variant.sha256);
      assert.notEqual(secondVariant.variant_id, variant.variant_id);
      assert.notEqual(secondVariant.rights_evidence_id, variant.rights_evidence_id);
      assert.notEqual(privateAssetBinding(secondVariant), privateAssetBinding(variant));
      const finalQuota = (
        await db.query('SELECT reserved,used FROM asset_quotas WHERE workspace_id=$1', [workspace])
      ).rows[0];
      assert.equal(finalQuota.reserved, '0');
      assert.equal(
        Number(finalQuota.used),
        source.length +
          metadata.variants.reduce((sum, v) => sum + v.bytes, 0) +
          secondMetadata.variants.reduce((sum, v) => sum + v.bytes, 0),
      );
      console.log(
        JSON.stringify({
          result: 'actual source scan → native decode → derivative scan → ready_private',
          source_sha256: input.sha256,
          variant_sha256: variant.sha256,
          source_bytes: source.length,
          variant_bytes: variant.bytes,
          scan_records: (
            await db.query('SELECT count(*) FROM asset_scans WHERE workspace_id=$1', [workspace])
          ).rows[0].count,
          processing_profile: variant.processing_profile,
          quota: finalQuota,
          dedupe: {
            distinct_asset: true,
            distinct_rights: true,
            distinct_variant: true,
            distinct_binding: true,
            shared_verified_source_key: true,
            invalid_frame_prequeue_denied: gif,
          },
          manifest,
        }),
      );
    } finally {
      await Promise.all([db.end(), app.end(), scheduler.end(), worker.end()]);
    }
  });
} finally {
  await rm(root, { recursive: true, force: true });
}
