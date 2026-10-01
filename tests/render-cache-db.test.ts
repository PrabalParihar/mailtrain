import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import pg from 'pg';
import env from '@next/env';
import { tenant } from '../src/server/db';
import { bytesDigest, RENDERER_VERSION } from '../renderer/protocol.mjs';
env.loadEnvConfig(process.cwd());
test('render receipts preserve immutable bytes, exact revision/format identity and forced tenant boundaries', async () => {
  const db = new pg.Pool({ connectionString: process.env.MIGRATION_DATABASE_URL }),
    w = randomUUID(),
    other = randomUUID(),
    user = 'render-cache-' + randomUUID(),
    brand = randomUUID(),
    email = randomUUID(),
    revision = randomUUID();
  try {
    await db.query('INSERT INTO workspaces(id,name)VALUES($1,$3),($2,$3)', [
      w,
      other,
      'Render cache fixture',
    ]);
    await db.query(
      "INSERT INTO memberships(workspace_id,user_id,role)VALUES($1,$3,'Owner'),($2,$3,'Owner')",
      [w, other, user],
    );
    await db.query("INSERT INTO brands(workspace_id,id,version,data)VALUES($1,$2,1,'{}')", [
      w,
      brand,
    ]);
    await db.query(
      "INSERT INTO emails(workspace_id,id,title,spec,created_by)VALUES($1,$2,'Fixture','{}',$3)",
      [w, email, user],
    );
    await db.query(
      "INSERT INTO revisions(workspace_id,id,email_id,revision_no,spec,html,plaintext,artifact_hash,manifest,created_by)VALUES($1,$2,$3,1,'{}','<p>Fixture</p>','Fixture',$4,'{}',$5)",
      [w, revision, email, 'a'.repeat(64), user],
    );
    const bytes = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 1]),
      digest = bytesDigest(bytes);
    const receipt = await tenant(
      w,
      user,
      async (tx) =>
        (
          await tx.query(
            'INSERT INTO render_downloads(workspace_id,revision_id,format,renderer_version,artifact_hash,body,body_hash,byte_size)VALUES($1,$2,$3,$4,$5,$6,$7,$8)RETURNING *',
            [w, revision, 'png', RENDERER_VERSION, 'a'.repeat(64), bytes, digest, bytes.length],
          )
        ).rows[0],
    );
    assert.deepEqual(receipt.body, bytes);
    assert.equal(
      (
        await tenant(other, user, (tx) =>
          tx.query('SELECT id FROM render_downloads WHERE id=$1', [receipt.id]),
        )
      ).rowCount,
      0,
    );
    await assert.rejects(() =>
      tenant(other, user, (tx) =>
        tx.query(
          'INSERT INTO render_downloads(workspace_id,revision_id,format,renderer_version,artifact_hash,body,body_hash,byte_size)VALUES($1,$2,$3,$4,$5,$6,$7,$8)',
          [other, revision, 'png', RENDERER_VERSION, 'a'.repeat(64), bytes, digest, bytes.length],
        ),
      ),
    );
    await assert.rejects(() =>
      tenant(w, user, (tx) =>
        tx.query('UPDATE render_downloads SET body=$1 WHERE id=$2', [
          Buffer.from('changed'),
          receipt.id,
        ]),
      ),
    );
    await assert.rejects(() =>
      tenant(w, user, (tx) => tx.query('DELETE FROM render_downloads WHERE id=$1', [receipt.id])),
    );
    assert.equal(
      (
        await tenant(w, user, (tx) =>
          tx.query('SELECT body_hash FROM render_downloads WHERE id=$1', [receipt.id]),
        )
      ).rows[0].body_hash,
      digest,
    );
  } finally {
    for (const table of ['render_downloads', 'revisions', 'emails', 'brands', 'memberships'])
      await db.query(`DELETE FROM ${table} WHERE workspace_id=ANY($1::uuid[])`, [[w, other]]);
    await db.query('DELETE FROM workspaces WHERE id=ANY($1::uuid[])', [[w, other]]);
    await db.end();
  }
});
