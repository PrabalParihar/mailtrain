import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import pg from 'pg';
import env from '@next/env';
import { withCreationDatabase } from './fixtures/creation-database';
env.loadEnvConfig(process.cwd());
test('actual SQL global lease, crash recovery, cancellation and quota settle exactly once', async () =>
  withCreationDatabase(async (connection) => {
    const db = new pg.Pool({ connectionString: connection }),
      scheduler = new pg.Pool({
        connectionString: connection,
        options: '-c role=mailcraft_media_scheduler',
      }),
      worker = new pg.Pool({
        connectionString: connection,
        options: '-c role=mailcraft_media_worker',
      });
    let derivativeRoot: string | undefined;
    try {
      const w = randomUUID(),
        asset = randomUUID(),
        op = randomUUID(),
        upload = randomUUID(),
        user = 'media-jobs-' + randomUUID(),
        proof = { workspace: w, user, role: 'Owner' };
      await db.query("INSERT INTO workspaces(id,name)VALUES($1,'media fixture')", [w]);
      await db.query("INSERT INTO memberships(workspace_id,user_id,role)VALUES($1,$2,'Owner')", [
        w,
        user,
      ]);
      await db.query(
        "INSERT INTO asset_quotas(workspace_id,allowance,reserved,profile)VALUES($1,268435456,41943040,'local-private-v1')",
        [w],
      );
      await db.query(
        "INSERT INTO assets(workspace_id,id,source_key,source_sha256,source_bytes,mime,created_by)VALUES($1,$2,$3,$4,10,'image/png',$5)",
        [w, asset, w + '_' + upload + '_source', 'a'.repeat(64), user],
      );
      await db.query(
        "INSERT INTO operations(workspace_id,id,type,input,created_by)VALUES($1,$2,'asset.upload','{}',$3)",
        [w, op, user],
      );
      await db.query(
        "INSERT INTO asset_uploads(workspace_id,id,asset_id,operation_id,created_by,principal,token_hash,expected_sha256,expected_bytes,intent,status,reserved_bytes)VALUES($1,$2,$3,$4,$5,$6,'test',$7,10,'{}','finalized',41943040)",
        [w, upload, asset, op, user, proof, 'a'.repeat(64)],
      );
      await db.query(
        'INSERT INTO media_jobs(workspace_id,operation_id,asset_id,upload_id,principal)VALUES($1,$2,$3,$4,$5)',
        [w, op, asset, upload, proof],
      );
      const claim = () =>
        scheduler.query('SELECT mailcraft_claim_media()job').then((r) => r.rows[0].job);
      const a = await claim();
      assert.equal(a.operation_id, op);
      const { mkdtemp, readFile, rm } = await import('node:fs/promises'),
        { tmpdir } = await import('node:os'),
        { join } = await import('node:path'),
        { FileAssetStore, assetObjectKey, bytesHash } = await import('../src/server/asset-store'),
        { cleanupStagedMediaObjects } = await import('../src/server/media-jobs');
      const files = (derivativeRoot = await mkdtemp(join(tmpdir(), 'media-derivative-orphan-'))),
        store = new FileAssetStore(files),
        bytes = await readFile('tests/fixtures/media/source.png'),
        orphan = assetObjectKey(w, randomUUID(), 'variant');
      assert.equal(
        (
          await worker.query('SELECT mailcraft_stage_media_object($1,$2,$3,$4,$5)ok', [
            w,
            op,
            a.token,
            orphan,
            bytes.length,
          ])
        ).rows[0].ok,
        true,
      );
      await store.putImmutable(orphan, bytes, bytesHash(bytes));
      assert.deepEqual(
        (
          await worker.query('SELECT mailcraft_media_object_cleanup_candidates($1,$2,$3)objects', [
            w,
            op,
            randomUUID(),
          ])
        ).rows[0].objects,
        [],
      );

      assert.equal(await claim(), null);
      assert.ok(
        (await worker.query('SELECT mailcraft_media_context($1,$2,$3)ctx', [w, op, a.token]))
          .rows[0].ctx,
      );
      assert.equal(
        (await worker.query('SELECT mailcraft_media_context($1,$2,$3)ctx', [w, op, randomUUID()]))
          .rows[0].ctx,
        null,
      );
      await db.query(
        "UPDATE media_jobs SET lease_until=clock_timestamp()-interval '1 second'WHERE workspace_id=$1",
        [w],
      );
      const b = await claim();
      assert.notEqual(b.token, a.token);
      await cleanupStagedMediaObjects(worker, store, b);
      await assert.rejects(readFile(join(store.root, orphan)), { code: 'ENOENT' });
      await rm(files, { recursive: true, force: true });
      assert.equal(
        (await db.query('SELECT count(*) FROM asset_object_staging WHERE workspace_id=$1', [w]))
          .rows[0].count,
        '0',
      );
      assert.equal(
        (await db.query('SELECT reserved FROM asset_quotas WHERE workspace_id=$1', [w])).rows[0]
          .reserved,
        '41943040',
      );
      assert.equal(
        (
          await worker.query('SELECT mailcraft_settle_media($1,$2,$3,$4)ok', [
            w,
            op,
            a.token,
            { status: 'failed' },
          ])
        ).rows[0].ok,
        false,
      );
      await db.query(
        "UPDATE operations SET state='cancel_requested'WHERE workspace_id=$1 AND id=$2",
        [w, op],
      );
      assert.equal(
        (await worker.query('SELECT mailcraft_media_context($1,$2,$3)ctx', [w, op, b.token]))
          .rows[0].ctx,
        null,
      );
      assert.equal(
        (
          await worker.query('SELECT mailcraft_settle_media($1,$2,$3,$4)ok', [
            w,
            op,
            b.token,
            { status: 'failed', failure_code: 'MEDIA_CANCELLED' },
          ])
        ).rows[0].ok,
        true,
      );
      assert.equal(
        (await db.query('SELECT reserved FROM asset_quotas WHERE workspace_id=$1', [w])).rows[0]
          .reserved,
        '0',
      );
      assert.equal(
        (await db.query('SELECT state FROM operations WHERE workspace_id=$1 AND id=$2', [w, op]))
          .rows[0].state,
        'cancelled',
      );
      assert.equal(
        (
          await worker.query('SELECT mailcraft_settle_media($1,$2,$3,$4)ok', [
            w,
            op,
            b.token,
            { status: 'failed' },
          ])
        ).rows[0].ok,
        false,
      );
      assert.equal(
        (await db.query('SELECT state FROM assets WHERE workspace_id=$1', [w])).rows[0].state,
        'quarantined',
      );
      const unconfirmed = randomUUID();
      await db.query("UPDATE operations SET state='running'WHERE workspace_id=$1 AND id=$2", [
        w,
        op,
      ]);
      await db.query(
        "UPDATE media_jobs SET phase='leased',lease_token=$3,lease_until=clock_timestamp()+interval '30 seconds'WHERE workspace_id=$1 AND operation_id=$2",
        [w, op, unconfirmed],
      );
      await db.query('UPDATE asset_quotas SET reserved=41943040 WHERE workspace_id=$1', [w]);
      await db.query(
        'UPDATE asset_uploads SET reserved_bytes=41943040 WHERE workspace_id=$1 AND id=$2',
        [w, upload],
      );
      assert.equal(
        (
          await worker.query('SELECT mailcraft_settle_media($1,$2,$3,$4)ok', [
            w,
            op,
            unconfirmed,
            { status: 'failed', failure_code: 'MEDIA_REAP_UNCONFIRMED' },
          ])
        ).rows[0].ok,
        true,
      );
      assert.equal(
        (
          await db.query('SELECT phase FROM media_jobs WHERE workspace_id=$1 AND operation_id=$2', [
            w,
            op,
          ])
        ).rows[0].phase,
        'blocked',
      );
      assert.equal(
        (await db.query('SELECT reserved FROM asset_quotas WHERE workspace_id=$1', [w])).rows[0]
          .reserved,
        '41943040',
      );
      assert.equal(await claim(), null);
    } finally {
      if (derivativeRoot)
        await (
          await import('node:fs/promises')
        ).rm(derivativeRoot, { recursive: true, force: true });
      await Promise.all([scheduler.end(), worker.end(), db.end()]);
    }
  }));
test('scheduler reclaims an expired interrupted upload reservation without a later user request', async () =>
  withCreationDatabase(async (connection) => {
    const db = new pg.Pool({ connectionString: connection }),
      scheduler = new pg.Pool({
        connectionString: connection,
        options: '-c role=mailcraft_media_scheduler',
      });
    try {
      const w = randomUUID(),
        op = randomUUID(),
        upload = randomUUID();
      await db.query("INSERT INTO workspaces(id,name)VALUES($1,'expiry fixture')", [w]);
      await db.query(
        "INSERT INTO asset_quotas(workspace_id,allowance,reserved,profile)VALUES($1,268435456,62914560,'local-private-v1')",
        [w],
      );
      await db.query(
        "INSERT INTO operations(workspace_id,id,type,input,created_by)VALUES($1,$2,'asset.upload','{}','expiry fixture')",
        [w, op],
      );
      await db.query(
        "INSERT INTO asset_uploads(workspace_id,id,operation_id,created_by,principal,token_hash,expected_sha256,expected_bytes,intent,status,reserved_bytes,transfer_token,transfer_until)VALUES($1,$2,$3,'expiry fixture','{}','test',$4,8,'{}','transferring',62914560,$5,clock_timestamp()-interval '1 second')",
        [w, upload, op, 'a'.repeat(64), randomUUID()],
      );
      assert.equal(
        (await scheduler.query('SELECT mailcraft_expire_media_uploads()count')).rows[0].count,
        1,
      );
      assert.equal(
        (await scheduler.query('SELECT mailcraft_expire_media_uploads()count')).rows[0].count,
        0,
      );
      assert.equal(
        (await db.query('SELECT reserved FROM asset_quotas WHERE workspace_id=$1', [w])).rows[0]
          .reserved,
        '0',
      );
      assert.equal(
        (await db.query('SELECT status FROM asset_uploads WHERE workspace_id=$1', [w])).rows[0]
          .status,
        'expired',
      );
      assert.equal(
        (await db.query('SELECT state FROM operations WHERE workspace_id=$1', [w])).rows[0].state,
        'failed',
      );
    } finally {
      await Promise.all([scheduler.end(), db.end()]);
    }
  }));
test('queued cancellation releases an untransferred admission immediately and claim waiting on cancellation never resurrects it', async () =>
  withCreationDatabase(async (connection) => {
    const db = new pg.Pool({ connectionString: connection }),
      scheduler = new pg.Pool({
        connectionString: connection,
        options: '-c role=mailcraft_media_scheduler',
      });
    const w = randomUUID(),
      op = randomUUID(),
      upload = randomUUID(),
      asset = randomUUID(),
      user = 'cancel-race-' + randomUUID();
    try {
      await db.query("INSERT INTO workspaces(id,name)VALUES($1,'cancel race')", [w]);
      await db.query("INSERT INTO memberships(workspace_id,user_id,role)VALUES($1,$2,'Owner')", [
        w,
        user,
      ]);
      await db.query(
        "INSERT INTO asset_quotas(workspace_id,allowance,reserved,profile)VALUES($1,268435456,62914560,'local-private-v1')",
        [w],
      );
      await db.query(
        "INSERT INTO assets(workspace_id,id,created_by,source_key,source_sha256,source_bytes,mime)VALUES($1,$2,$3,$4,$5,8,'image/png')",
        [w, asset, user, w + '_' + upload + '_source', 'a'.repeat(64)],
      );
      await db.query(
        "INSERT INTO operations(workspace_id,id,type,input,created_by)VALUES($1,$2,'asset.upload','{}',$3)",
        [w, op, user],
      );
      await db.query(
        "INSERT INTO asset_uploads(workspace_id,id,operation_id,created_by,principal,token_hash,expected_sha256,expected_bytes,intent)VALUES($1,$2,$3,$4,$5,'test',$6,8,'{}')",
        [w, upload, op, user, { workspace: w, user, role: 'Owner' }, 'a'.repeat(64)],
      );
      const c = await db.connect();
      try {
        await c.query('BEGIN');
        await c.query("SELECT set_config('app.workspace_id',$1,true)", [w]);
        await c.query("UPDATE operations SET state='cancelled'WHERE workspace_id=$1 AND id=$2", [
          w,
          op,
        ]);
        assert.equal(
          (await c.query('SELECT reserved FROM asset_quotas WHERE workspace_id=$1', [w])).rows[0]
            .reserved,
          '0',
        );
        assert.equal(
          (await c.query('SELECT status FROM asset_uploads WHERE workspace_id=$1', [w])).rows[0]
            .status,
          'expired',
        );
        await c.query('COMMIT');
      } finally {
        c.release();
      }
      // Real lock wait: finalized media starts with the same admission, then cancellation owns the operation lock.
      const op2 = randomUUID(),
        u2 = randomUUID();
      await db.query('UPDATE asset_quotas SET reserved=62914560 WHERE workspace_id=$1', [w]);
      await db.query(
        "INSERT INTO operations(workspace_id,id,type,input,created_by)VALUES($1,$2,'asset.upload','{}',$3)",
        [w, op2, user],
      );
      await db.query(
        "INSERT INTO asset_uploads(workspace_id,id,asset_id,operation_id,created_by,principal,token_hash,expected_sha256,expected_bytes,intent,status)VALUES($1,$2,$3,$4,$5,$6,'test',$7,8,'{}','finalized')",
        [w, u2, asset, op2, user, { workspace: w, user, role: 'Owner' }, 'a'.repeat(64)],
      );
      await db.query(
        'INSERT INTO media_jobs(workspace_id,operation_id,asset_id,upload_id,principal)VALUES($1,$2,$3,$4,$5)',
        [w, op2, asset, u2, { workspace: w, user, role: 'Owner' }],
      );
      const cancel = await db.connect();
      try {
        await cancel.query('BEGIN');
        await cancel.query("SELECT set_config('app.workspace_id',$1,true)", [w]);
        await cancel.query(
          "UPDATE operations SET state='cancelled'WHERE workspace_id=$1 AND id=$2",
          [w, op2],
        );
        const pending = scheduler.query('SELECT mailcraft_claim_media()job');
        await new Promise((resolve) => setTimeout(resolve, 50));
        await cancel.query('COMMIT');
        assert.equal((await pending).rows[0].job, null);
      } finally {
        cancel.release();
      }
      assert.equal(
        (await db.query('SELECT state FROM operations WHERE workspace_id=$1 AND id=$2', [w, op2]))
          .rows[0].state,
        'cancelled',
      );
      assert.equal(
        (await db.query('SELECT reserved FROM asset_quotas WHERE workspace_id=$1', [w])).rows[0]
          .reserved,
        '0',
      );
      assert.equal(
        (
          await db.query('SELECT phase FROM media_jobs WHERE workspace_id=$1 AND operation_id=$2', [
            w,
            op2,
          ])
        ).rows[0].phase,
        'settled',
      );
    } finally {
      await Promise.all([db.end(), scheduler.end()]);
    }
  }));
