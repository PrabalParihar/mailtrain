import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import pg from 'pg';
import env from '@next/env';
import { withCreationDatabase } from './fixtures/creation-database';
import { createUpload } from '../src/server/asset-upload';
import { bytesHash } from '../src/server/asset-store';
import { MEDIA_LIMITS } from '../src/domain/assets';
import type { Principal } from '../src/server/auth';
env.loadEnvConfig(process.cwd());
test('actual transfer commit and leased settlement reread session, membership, key and workspace; unknown scan cannot ready', async () =>
  withCreationDatabase(async (connection) => {
    const db = new pg.Pool({ connectionString: connection }),
      app = new pg.Pool({ connectionString: connection, options: '-c role=mailcraft_runtime' }),
      worker = new pg.Pool({
        connectionString: connection,
        options: '-c role=mailcraft_media_worker',
      }),
      scheduler = new pg.Pool({
        connectionString: connection,
        options: '-c role=mailcraft_media_scheduler',
      });
    const previous = process.env.ASSET_STORE_ROOT;
    process.env.ASSET_STORE_ROOT = '/tmp/lettercape-authority-private-' + randomUUID();
    const workspace = randomUUID(),
      user = 'media-authority-' + randomUUID(),
      token_hash = bytesHash(Buffer.from(randomUUID())),
      p: Principal = { workspace, user, role: 'Owner', local_session: { token_hash } };
    const tx = async <T>(fn: (tx: pg.PoolClient) => Promise<T>) => {
      const c = await app.connect();
      try {
        await c.query('BEGIN');
        await c.query(
          "SELECT set_config('app.workspace_id',$1,true),set_config('app.user_id',$2,true)",
          [workspace, user],
        );
        const v = await fn(c);
        await c.query('COMMIT');
        return v;
      } catch (e) {
        await c.query('ROLLBACK');
        throw e;
      } finally {
        c.release();
      }
    };
    try {
      await db.query("INSERT INTO workspaces(id,name)VALUES($1,'authority fixture')", [workspace]);
      await db.query("INSERT INTO memberships(workspace_id,user_id,role)VALUES($1,$2,'Owner')", [
        workspace,
        user,
      ]);
      await db.query(
        "INSERT INTO auth_sessions(token_hash,user_id,expires_at)VALUES($1,$2,clock_timestamp()+interval '1 hour')",
        [token_hash, user],
      );
      const bytes = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
        hash = bytesHash(bytes),
        input = {
          filename: 'source.png',
          declared_mime: 'image/png',
          byte_size: bytes.length,
          sha256: hash,
          rights: { attested: true, terms_version: MEDIA_LIMITS.rights },
          alt: 'fixture',
          decorative: false,
        };
      const intent = await tx((c) => createUpload(c, p, input, randomUUID()));
      const transfer = randomUUID();
      await tx((c) =>
        c.query(
          "UPDATE asset_uploads SET status='transferring',transfer_token=$3,transfer_until=clock_timestamp()+interval '2 minutes'WHERE workspace_id=$1 AND id=$2",
          [workspace, intent.upload.id, transfer],
        ),
      );
      const finalize = () =>
        tx(
          async (c) =>
            (
              await c.query('SELECT mailcraft_finalize_upload($1,$2,$3,$4,$5,$6,$7)result', [
                workspace,
                intent.upload.id,
                transfer,
                workspace + '_' + intent.upload.id + '_source',
                hash,
                bytes.length,
                'image/png',
              ])
            ).rows[0].result,
        );
      await db.query('DELETE FROM auth_sessions WHERE token_hash=$1', [token_hash]);
      await assert.rejects(finalize(), /MEDIA_TRANSFER_REVOKED/);
      assert.equal(
        (await db.query('SELECT count(*)FROM assets WHERE workspace_id=$1', [workspace])).rows[0]
          .count,
        '0',
      );
      await db.query(
        "INSERT INTO auth_sessions(token_hash,user_id,expires_at)VALUES($1,$2,clock_timestamp()+interval '1 hour')",
        [token_hash, user],
      );
      const committed = await finalize();
      const job = (await scheduler.query('SELECT mailcraft_claim_media()job')).rows[0].job;
      assert.equal(job.asset_id, committed.asset_id);
      const context = () =>
        worker
          .query('SELECT mailcraft_media_context($1,$2,$3)ctx', [
            workspace,
            job.operation_id,
            job.token,
          ])
          .then((r) => r.rows[0].ctx);
      assert.ok(await context());
      await db.query("UPDATE memberships SET role='Viewer'WHERE workspace_id=$1 AND user_id=$2", [
        workspace,
        user,
      ]);
      assert.equal(await context(), null);
      await db.query("UPDATE memberships SET role='Owner'WHERE workspace_id=$1 AND user_id=$2", [
        workspace,
        user,
      ]);
      await db.query("UPDATE workspaces SET status='locked'WHERE id=$1", [workspace]);
      assert.equal(await context(), null);
      await db.query("UPDATE workspaces SET status='active'WHERE id=$1", [workspace]);
      await assert.rejects(
        worker.query('SELECT mailcraft_settle_media($1,$2,$3,$4)', [
          workspace,
          job.operation_id,
          job.token,
          { status: 'success', source_sha256: hash, variants: [{}], scans: [] },
        ]),
        /MEDIA_SOURCE_SCAN_REQUIRED/,
      );
      assert.equal(
        (await db.query('SELECT state FROM assets WHERE workspace_id=$1', [workspace])).rows[0]
          .state,
        'processing',
      );
      await db.query('DELETE FROM auth_sessions WHERE token_hash=$1', [token_hash]);
      assert.equal(
        (
          await worker.query('SELECT mailcraft_settle_media($1,$2,$3,$4)ok', [
            workspace,
            job.operation_id,
            job.token,
            { status: 'failed', failure_code: 'MEDIA_UNAVAILABLE' },
          ])
        ).rows[0].ok,
        true,
      );
      assert.equal(
        (await db.query('SELECT state FROM assets WHERE workspace_id=$1', [workspace])).rows[0]
          .state,
        'quarantined',
      );
      assert.equal(
        (await db.query('SELECT reserved FROM asset_quotas WHERE workspace_id=$1', [workspace]))
          .rows[0].reserved,
        '0',
      );
      // Separate API actor has a dedicated key proof and cannot survive scope removal/revocation.
      const apiKey = randomUUID();
      await db.query(
        "INSERT INTO api_keys(workspace_id,id,key_hash,name,scopes,created_by,expires_at)VALUES($1,$2,$3,'media key','[\"assets:write\"]',$4,clock_timestamp()+interval '1 hour')",
        [workspace, apiKey, bytesHash(Buffer.from(apiKey)), user],
      );
      const proof = {
        workspace,
        user: 'api-key:' + apiKey,
        role: 'Owner',
        api_key: { id: apiKey, delegator: user, scopes: ['assets:write'] },
      };
      const c = await db.connect();
      try {
        await c.query('BEGIN');
        await c.query('SET LOCAL ROLE mailcraft_media_admin');
        await c.query("SELECT set_config('app.workspace_id',$1,true)", [workspace]);
        assert.equal(
          (await c.query('SELECT mailcraft_media_authorized($1,$2)ok', [workspace, proof])).rows[0]
            .ok,
          true,
        );
        await c.query('COMMIT');
        await db.query("UPDATE api_keys SET scopes='[]'WHERE workspace_id=$1 AND id=$2", [
          workspace,
          apiKey,
        ]);
        await c.query('BEGIN');
        await c.query('SET LOCAL ROLE mailcraft_media_admin');
        await c.query("SELECT set_config('app.workspace_id',$1,true)", [workspace]);
        assert.equal(
          (await c.query('SELECT mailcraft_media_authorized($1,$2)ok', [workspace, proof])).rows[0]
            .ok,
          false,
        );
        await c.query('COMMIT');
      } finally {
        c.release();
      }
    } finally {
      process.env.ASSET_STORE_ROOT = previous;
      await Promise.all([db.end(), app.end(), worker.end(), scheduler.end()]);
    }
  }));
test('actual orphan cleanup failure retains reservation, then exact filesystem repair and janitor deletion release it once', async () =>
  withCreationDatabase(async (connection) => {
    const { mkdtemp, readFile, rename, symlink, unlink, rm } = await import('node:fs/promises'),
      { join } = await import('node:path'),
      { tmpdir } = await import('node:os'),
      { FileAssetStore, assetObjectKey } = await import('../src/server/asset-store'),
      { cleanupStagedMediaObjects } = await import('../src/server/media-jobs');
    const db = new pg.Pool({ connectionString: connection }),
      app = new pg.Pool({ connectionString: connection, options: '-c role=mailcraft_runtime' }),
      scheduler = new pg.Pool({
        connectionString: connection,
        options: '-c role=mailcraft_media_scheduler',
      }),
      workspace = randomUUID(),
      user = 'orphan-' + randomUUID(),
      token_hash = bytesHash(Buffer.from(randomUUID())),
      p: Principal = { workspace, user, role: 'Owner', local_session: { token_hash } },
      root = await mkdtemp(join(tmpdir(), 'asset-orphan-')),
      store = new FileAssetStore(root),
      previous = process.env.ASSET_STORE_ROOT;
    process.env.ASSET_STORE_ROOT = root;
    const transaction = async <T>(fn: (tx: pg.PoolClient) => Promise<T>) => {
      const c = await app.connect();
      try {
        await c.query('BEGIN');
        await c.query(
          "SELECT set_config('app.workspace_id',$1,true),set_config('app.user_id',$2,true)",
          [workspace, user],
        );
        const v = await fn(c);
        await c.query('COMMIT');
        return v;
      } catch (e) {
        await c.query('ROLLBACK');
        throw e;
      } finally {
        c.release();
      }
    };
    try {
      await db.query("INSERT INTO workspaces(id,name)VALUES($1,'orphan fixture')", [workspace]);
      await db.query("INSERT INTO memberships(workspace_id,user_id,role)VALUES($1,$2,'Owner')", [
        workspace,
        user,
      ]);
      await db.query(
        "INSERT INTO auth_sessions(token_hash,user_id,expires_at)VALUES($1,$2,clock_timestamp()+interval '1 hour')",
        [token_hash, user],
      );
      const source = await readFile('tests/fixtures/media/source.png'),
        hash = bytesHash(source),
        intent = await transaction((tx) =>
          createUpload(
            tx,
            p,
            {
              filename: 'actual.png',
              declared_mime: 'image/png',
              byte_size: source.length,
              sha256: hash,
              rights: { attested: true, terms_version: MEDIA_LIMITS.rights },
              alt: 'actual orphan',
              decorative: false,
            },
            randomUUID(),
          ),
        ),
        transfer = randomUUID(),
        key = assetObjectKey(workspace, intent.upload.id, 'source');
      await transaction((tx) =>
        tx.query(
          "UPDATE asset_uploads SET status='transferring',transfer_token=$3,transfer_until=clock_timestamp()+interval '2 minutes'WHERE workspace_id=$1 AND id=$2",
          [workspace, intent.upload.id, transfer],
        ),
      );
      assert.equal(
        (
          await transaction((tx) =>
            tx.query('SELECT mailcraft_stage_media_object($1,$2,NULL,$3,$4)ok', [
              workspace,
              intent.operation.id,
              key,
              source.length,
            ]),
          )
        ).rows[0].ok,
        true,
      );
      await store.putImmutable(key, source, hash);
      await db.query('DELETE FROM auth_sessions WHERE token_hash=$1', [token_hash]);
      await assert.rejects(
        transaction((tx) =>
          tx.query('SELECT mailcraft_finalize_upload($1,$2,$3,$4,$5,$6,$7)', [
            workspace,
            intent.upload.id,
            transfer,
            key,
            hash,
            source.length,
            'image/png',
          ]),
        ),
        /MEDIA_TRANSFER_REVOKED/,
      );
      await db.query(
        "UPDATE asset_uploads SET transfer_until=clock_timestamp()-interval '1 second'WHERE workspace_id=$1 AND id=$2",
        [workspace, intent.upload.id],
      );
      assert.equal(
        (await scheduler.query('SELECT mailcraft_expire_media_uploads()count')).rows[0].count,
        1,
      );
      assert.equal(
        (await db.query('SELECT reserved FROM asset_quotas WHERE workspace_id=$1', [workspace]))
          .rows[0].reserved,
        '62914560',
      );
      const path = join(store.root, key),
        held = join(store.root, 'held-fixture-bytes');
      await rename(path, held);
      await symlink(held, path);
      await cleanupStagedMediaObjects(scheduler, store);
      assert.equal(
        (await db.query('SELECT reserved FROM asset_quotas WHERE workspace_id=$1', [workspace]))
          .rows[0].reserved,
        '62914560',
      );
      assert.equal(
        (
          await db.query('SELECT count(*)FROM asset_object_staging WHERE workspace_id=$1', [
            workspace,
          ])
        ).rows[0].count,
        '1',
      );
      assert.deepEqual(await readFile(held), source);
      await unlink(path);
      await rename(held, path);
      await cleanupStagedMediaObjects(scheduler, store);
      assert.equal(
        (await db.query('SELECT reserved FROM asset_quotas WHERE workspace_id=$1', [workspace]))
          .rows[0].reserved,
        '0',
      );
      assert.equal(
        (
          await db.query('SELECT count(*)FROM asset_object_staging WHERE workspace_id=$1', [
            workspace,
          ])
        ).rows[0].count,
        '0',
      );
      await assert.rejects(readFile(path), { code: 'ENOENT' });
      await cleanupStagedMediaObjects(scheduler, store);
      assert.equal(
        (await db.query('SELECT reserved FROM asset_quotas WHERE workspace_id=$1', [workspace]))
          .rows[0].reserved,
        '0',
      );
      assert.equal(
        (await db.query('SELECT count(*)FROM assets WHERE workspace_id=$1', [workspace])).rows[0]
          .count,
        '0',
      );
    } finally {
      process.env.ASSET_STORE_ROOT = previous;
      await Promise.all([db.end(), app.end(), scheduler.end()]);
      await rm(root, { recursive: true, force: true });
    }
  }));
