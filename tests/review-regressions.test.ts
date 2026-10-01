import { withCreationQueueFixture } from './fixtures/creation-queue-lock';
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import pg from 'pg';
import env from '@next/env';
env.loadEnvConfig(process.cwd());
const admin = new pg.Pool({ connectionString: process.env.MIGRATION_DATABASE_URL });
after(() => admin.end());
test('queued worker rechecks the target workspace, not another Owner membership', async () => withCreationQueueFixture(async () => {
  const other = randomUUID(),
    target = randomUUID(),
    job = randomUUID(),
    user = 'worker-fixture-' + randomUUID();
  await admin.query('INSERT INTO workspaces(id,name) VALUES($1,$3),($2,$3)', [
    other,
    target,
    'Worker boundary fixture',
  ]);
  await admin.query(
    "INSERT INTO memberships(workspace_id,user_id,role) VALUES($1,$3,'Owner'),($2,$3,'Viewer')",
    [other, target, user],
  );
  await admin.query(
    "INSERT INTO operations(workspace_id,id,type,input,created_by) VALUES($1,$2,'brand.extract',$3,$4)",
    [target, job, JSON.stringify({ url: 'http://127.0.0.1' }), user],
  );
  const child = spawn(process.execPath, ['--import', 'tsx', 'src/server/worker.ts'], {
    stdio: 'ignore',
  });
  let row;
  try {
    for (let i = 0; i < 80; i++) {
      row = (
        await admin.query('SELECT state,error FROM operations WHERE workspace_id=$1 AND id=$2', [
          target,
          job,
        ])
      ).rows[0];
      if (row.state === 'failed') break;
      await new Promise((r) => setTimeout(r, 50));
    }
    assert.equal(row?.error?.code, 'PERMISSION_REVOKED');
  } finally {
    child.kill('SIGTERM');
    await new Promise<void>((resolve) => child.once('exit', () => resolve()));
    await admin.query('DELETE FROM operations WHERE workspace_id=$1', [target]);
    await admin.query('DELETE FROM memberships WHERE user_id=$1', [user]);
    await admin.query('DELETE FROM workspaces WHERE id IN($1,$2)', [target, other]);
  }
}));
