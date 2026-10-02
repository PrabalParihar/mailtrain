import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import pg from 'pg';
import env from '@next/env';
import { withCreationDatabase } from './fixtures/creation-database';
env.loadEnvConfig(process.cwd());
test('asset tables force tenant RLS, composite identity and least privilege readiness', async () =>
  withCreationDatabase(async (connection) => {
    const db = new pg.Pool({ connectionString: connection }),
      app = new pg.Pool({ connectionString: connection, options: '-c role=mailcraft_runtime' });
    const w = randomUUID(),
      other = randomUUID(),
      id = randomUUID();
    try {
      await db.query("INSERT INTO workspaces(id,name)VALUES($1,'asset-test'),($2,'asset-test')", [
        w,
        other,
      ]);
      await db.query("INSERT INTO assets(workspace_id,id,created_by)VALUES($1,$2,'asset-test')", [
        w,
        id,
      ]);
      assert.equal((await app.query('SELECT * FROM assets')).rowCount, 0);
      const c = await app.connect();
      try {
        await c.query('BEGIN');
        await c.query(
          "SELECT set_config('app.workspace_id',$1,true),set_config('app.user_id','asset-test',true)",
          [w],
        );
        assert.equal((await c.query('SELECT * FROM assets')).rowCount, 1);
        await assert.rejects(
          c.query("UPDATE assets SET state='ready_private'WHERE id=$1", [id]),
          /permission denied/,
        );
        await c.query('ROLLBACK');
        await c.query('BEGIN');
        await c.query("SELECT set_config('app.workspace_id',$1,true)", [other]);
        assert.equal((await c.query('SELECT * FROM assets WHERE id=$1', [id])).rowCount, 0);
        await assert.rejects(
          c.query(
            'INSERT INTO asset_revision_references(workspace_id,revision_id,asset_id,variant_id)VALUES($1,$2,$3,$4)',
            [other, randomUUID(), id, randomUUID()],
          ),
        );
        await c.query('ROLLBACK');
      } finally {
        c.release();
      }
      for (const table of [
        'asset_quotas',
        'assets',
        'asset_uploads',
        'asset_rights',
        'asset_scans',
        'asset_variants',
        'asset_draft_references',
        'asset_revision_references',
        'media_jobs',
      ]) {
        const r = (
          await db.query(
            'SELECT relrowsecurity,relforcerowsecurity FROM pg_class WHERE oid=$1::regclass',
            [table],
          )
        ).rows[0];
        assert.deepEqual(r, { relrowsecurity: true, relforcerowsecurity: true });
      }
      for (const table of ['asset_scans', 'asset_variants'])
        for (const action of ['INSERT', 'UPDATE', 'DELETE'])
          assert.equal(
            (
              await db.query('SELECT has_table_privilege($1,$2,$3)allowed', [
                'mailcraft_runtime',
                table,
                action,
              ])
            ).rows[0].allowed,
            false,
          );
      assert.equal(
        (
          await app.query(
            "SELECT has_function_privilege(current_user,'mailcraft_claim_media()','EXECUTE')allowed",
          )
        ).rows[0].allowed,
        false,
      );
    } finally {
      await app.end();
      await db.end();
    }
  }));
test('duplicate source bytes share only verified tenant storage while each actor retains distinct asset and rights', async () =>
  withCreationDatabase(async (connection) => {
    const { mkdtemp, rm } = await import('node:fs/promises'),
      { tmpdir } = await import('node:os'),
      { join } = await import('node:path'),
      { FileAssetStore, bytesHash, assetObjectKey } = await import('../src/server/asset-store'),
      { createUpload } = await import('../src/server/asset-upload'),
      { MEDIA_LIMITS } = await import('../src/domain/assets');
    const db = new pg.Pool({ connectionString: connection }),
      app = new pg.Pool({ connectionString: connection, options: '-c role=mailcraft_runtime' }),
      w = randomUUID(),
      root = await mkdtemp(join(tmpdir(), 'asset-dedupe-')),
      store = new FileAssetStore(root),
      previous = process.env.ASSET_STORE_ROOT;
    process.env.ASSET_STORE_ROOT = root;
    const source = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
      sha = bytesHash(source),
      actors = ['first-' + randomUUID(), 'second-' + randomUUID()];
    const transaction = async <T>(user: string, fn: (tx: pg.PoolClient) => Promise<T>) => {
      const c = await app.connect();
      try {
        await c.query('BEGIN');
        await c.query(
          "SELECT set_config('app.workspace_id',$1,true),set_config('app.user_id',$2,true)",
          [w, user],
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
      await db.query("INSERT INTO workspaces(id,name)VALUES($1,'dedupe fixture')", [w]);
      for (const user of actors)
        await db.query("INSERT INTO memberships(workspace_id,user_id,role)VALUES($1,$2,'Editor')", [
          w,
          user,
        ]);
      const committed = [];
      let shared: string | null = null;
      for (const user of actors) {
        const p = { workspace: w, user, role: 'Editor' as const },
          intent = await transaction(user, (tx) =>
            createUpload(
              tx,
              p,
              {
                filename: 'same.png',
                declared_mime: 'image/png',
                byte_size: source.length,
                sha256: sha,
                rights: { attested: true, terms_version: MEDIA_LIMITS.rights },
                alt: user,
                decorative: false,
              },
              randomUUID(),
            ),
          ),
          transfer = randomUUID(),
          key = assetObjectKey(w, intent.upload.id, 'source');
        await store.putImmutable(key, source, sha);
        if (shared) await store.readVerified(shared, sha, source.length);
        await transaction(user, (tx) =>
          tx.query(
            "UPDATE asset_uploads SET status='transferring',transfer_token=$3,transfer_until=clock_timestamp()+interval '2 minutes'WHERE workspace_id=$1 AND id=$2",
            [w, intent.upload.id, transfer],
          ),
        );
        const result = await transaction(
          user,
          async (tx) =>
            (
              await tx.query('SELECT mailcraft_finalize_upload($1,$2,$3,$4,$5,$6,$7,$8)result', [
                w,
                intent.upload.id,
                transfer,
                key,
                sha,
                source.length,
                'image/png',
                shared,
              ])
            ).rows[0].result,
        );
        if (shared) await store.removeAuthorized(key);
        else shared = result.source_key;
        committed.push(result);
      }
      assert.notEqual(committed[0].asset_id, committed[1].asset_id);
      assert.equal(committed[0].source_key, committed[1].source_key);
      const rights = (
        await db.query(
          'SELECT id,asset_id,actor,source_sha256 FROM asset_rights WHERE workspace_id=$1 ORDER BY created_at',
          [w],
        )
      ).rows;
      assert.equal(rights.length, 2);
      assert.notEqual(rights[0].id, rights[1].id);
      assert.notEqual(rights[0].actor, rights[1].actor);
      assert.deepEqual(
        rights.map((r) => r.source_sha256),
        [sha, sha],
      );
      assert.equal(
        (await db.query('SELECT used FROM asset_quotas WHERE workspace_id=$1', [w])).rows[0].used,
        String(source.length),
      );
      assert.equal(
        (await db.query('SELECT count(DISTINCT source_key)FROM assets WHERE workspace_id=$1', [w]))
          .rows[0].count,
        '1',
      );
      assert.deepEqual(Buffer.from(await store.readVerified(shared!, sha, source.length)), source);
    } finally {
      process.env.ASSET_STORE_ROOT = previous;
      await Promise.all([app.end(), db.end()]);
      await rm(root, { recursive: true, force: true });
    }
  }));
test('removing managed references when restoring legacy1.0 clears prior pins under current edit authority', async () =>
  withCreationDatabase(async (connection) => {
    const { syncDraftAssetReferences } = await import('../src/server/assets');
    const db = new pg.Pool({ connectionString: connection }),
      app = new pg.Pool({ connectionString: connection, options: '-c role=mailcraft_runtime' }),
      workspace = randomUUID(),
      user = 'legacy-reference-' + randomUUID(),
      email = randomUUID(),
      asset = randomUUID(),
      variant = randomUUID(),
      upload = randomUUID(),
      op = randomUUID(),
      rights = randomUUID(),
      scan = randomUUID();
    try {
      await db.query("INSERT INTO workspaces(id,name)VALUES($1,'legacy reference fixture')", [
        workspace,
      ]);
      await db.query("INSERT INTO memberships(workspace_id,user_id,role)VALUES($1,$2,'Owner')", [
        workspace,
        user,
      ]);
      await db.query(
        'INSERT INTO emails(workspace_id,id,title,spec,created_by)VALUES($1,$2,\'legacy restore\',\'{"schema_version":"1.1"}\',$3)',
        [workspace, email, user],
      );
      await db.query(
        'INSERT INTO assets(workspace_id,id,created_by,source_sha256)VALUES($1,$2,$3,$4)',
        [workspace, asset, user, 'a'.repeat(64)],
      );
      await db.query(
        "INSERT INTO operations(workspace_id,id,type,input,created_by)VALUES($1,$2,'asset.upload','{}',$3)",
        [workspace, op, user],
      );
      await db.query(
        "INSERT INTO asset_uploads(workspace_id,id,asset_id,operation_id,created_by,principal,token_hash,expected_sha256,expected_bytes,intent)VALUES($1,$2,$3,$4,$5,'{}','test',$6,8,'{}')",
        [workspace, upload, asset, op, user, 'a'.repeat(64)],
      );
      await db.query(
        "INSERT INTO asset_rights(workspace_id,id,asset_id,upload_id,actor,terms_version,attested,source_sha256)VALUES($1,$2,$3,$4,$5,'local-upload-attestation-v1',true,$6)",
        [workspace, rights, asset, upload, user, 'a'.repeat(64)],
      );
      await db.query(
        "INSERT INTO asset_scans(workspace_id,id,asset_id,operation_id,sha256,status,engine,database_sha256,database_built_at,completed_at,receipt)VALUES($1,$2,$3,$4,$5,'error','not-configured',$5,clock_timestamp(),clock_timestamp(),'{}')",
        [workspace, scan, asset, op, 'a'.repeat(64)],
      );
      await db.query(
        "INSERT INTO asset_variants(workspace_id,id,asset_id,object_key,sha256,bytes,mime,width,height,frames,role,processing_profile,storage_profile,rights_id,source_scan_id,scan_id,receipt)VALUES($1,$2,$3,$4,$5,8,'image/png',1,1,1,'static','unavailable','local-private-v1',$6,$7,$7,'{}')",
        [
          workspace,
          variant,
          asset,
          workspace + '_' + variant + '_variant',
          'a'.repeat(64),
          rights,
          scan,
        ],
      );
      await db.query(
        "INSERT INTO asset_draft_references(workspace_id,email_id,node_id,asset_id,variant_id)VALUES($1,$2,'removed-image',$3,$4)",
        [workspace, email, asset, variant],
      );
      const c = await app.connect();
      try {
        await c.query('BEGIN');
        await c.query(
          "SELECT set_config('app.workspace_id',$1,true),set_config('app.user_id',$2,true)",
          [workspace, user],
        );
        await syncDraftAssetReferences(c, { workspace, user, role: 'Owner' }, email, {
          schema_version: '1.0',
          sections: [],
        });
        await c.query('COMMIT');
      } catch (e) {
        await c.query('ROLLBACK');
        throw e;
      } finally {
        c.release();
      }
      assert.equal(
        (
          await db.query(
            'SELECT count(*)FROM asset_draft_references WHERE workspace_id=$1 AND email_id=$2',
            [workspace, email],
          )
        ).rows[0].count,
        '0',
      );
      assert.equal(
        (await db.query('SELECT state FROM assets WHERE workspace_id=$1', [workspace])).rows[0]
          .state,
        'quarantined',
      );
      assert.equal(
        (await db.query('SELECT status FROM asset_scans WHERE workspace_id=$1', [workspace]))
          .rows[0].status,
        'error',
      );
    } finally {
      await Promise.all([app.end(), db.end()]);
    }
  }));
