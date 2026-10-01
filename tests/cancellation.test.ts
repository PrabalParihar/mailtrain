import { withCreationQueueFixture } from './fixtures/creation-queue-lock';
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import pg from 'pg';
import env from '@next/env';
import { randomUUID } from 'node:crypto';
env.loadEnvConfig(process.cwd());
import { tenant, closeDb } from '../src/server/db.js';
import { cancelOperation } from '../src/server/operations.js';
const admin = new pg.Pool({ connectionString: process.env.MIGRATION_DATABASE_URL });
after(async () => {
  await admin.end();
  await closeDb();
});
async function fixture(state: string) {
  const w = randomUUID(),
    id = randomUUID();
  await admin.query('INSERT INTO workspaces(id,name) VALUES($1,$2)', [w, 'Cancellation fixture']);
  await admin.query(
    "INSERT INTO operations(workspace_id,id,type,state,input,created_by) VALUES($1,$2,'email.generate',$3,'{}','fixture')",
    [w, id, state],
  );
  await admin.query(
    "INSERT INTO usage_ledger(workspace_id,operation_id,metric,kind,units) VALUES($1,$2,'generation','reserve',1)",
    [w, id],
  );
  return { w, id, p: { workspace: w, user: 'fixture', role: 'Owner' as const } };
}
test('only queued cancellation refunds; in-flight cancellation preserves its finite reservation', async () => withCreationQueueFixture(async () => {
  for (const state of ['queued', 'running']) {
    const f = await fixture(state);
    const result = await tenant(f.w, f.p.user, (tx) => cancelOperation(tx, f.p, f.id));
    assert.equal(result.state, state === 'queued' ? 'cancelled' : 'cancel_requested');
    assert.equal(
      (
        await admin.query("SELECT * FROM usage_ledger WHERE workspace_id=$1 AND kind='release'", [
          f.w,
        ])
      ).rowCount,
      state === 'queued' ? 1 : 0,
    );
  }
}));
test('cancellation cannot replace completion committed while it waits for the row lock', async () => {
  const f = await fixture('running'),
    c = await admin.connect();
  await c.query('BEGIN');
  await c.query('SELECT id FROM operations WHERE id=$1 FOR UPDATE', [f.id]);
  const pending = tenant(f.w, f.p.user, (tx) => cancelOperation(tx, f.p, f.id));
  const rejected = assert.rejects(pending, /ended/);
  try {
    for (let i = 0; i < 40; i++) {
      const blocked = (
        await admin.query(
          "SELECT 1 FROM pg_stat_activity WHERE usename='mailcraft_runtime' AND wait_event_type='Lock' AND query LIKE '%operations%'",
        )
      ).rowCount;
      if (blocked) break;
      await new Promise((r) => setTimeout(r, 10));
    }
    await c.query("UPDATE operations SET state='succeeded' WHERE id=$1", [f.id]);
    await c.query('COMMIT');
    await rejected;
    assert.equal(
      (await admin.query('SELECT state FROM operations WHERE id=$1', [f.id])).rows[0].state,
      'succeeded',
    );
    assert.equal(
      (
        await admin.query("SELECT * FROM usage_ledger WHERE operation_id=$1 AND kind='release'", [
          f.id,
        ])
      ).rowCount,
      0,
    );
  } finally {
    await c.query('ROLLBACK');
    c.release();
  }
});
