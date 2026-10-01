import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import pg from 'pg';
import env from '@next/env';
env.loadEnvConfig(process.cwd());
const admin = new pg.Pool({ connectionString: process.env.MIGRATION_DATABASE_URL });
after(() => admin.end());
test('queued API creation rechecks revoked, expired and narrowed credentials', async () => {
  const workspace = randomUUID(),
    user = 'key-worker-' + randomUUID(),
    jobs = [randomUUID(), randomUUID(), randomUUID()],
    keys = [randomUUID(), randomUUID(), randomUUID()];
  await admin.query('INSERT INTO workspaces(id,name) VALUES($1,$2)', [
    workspace,
    'Key worker fixture',
  ]);
  await admin.query("INSERT INTO memberships(workspace_id,user_id,role) VALUES($1,$2,'Owner')", [
    workspace,
    user,
  ]);
  for (let i = 0; i < 3; i++) {
    await admin.query(
      'INSERT INTO api_keys(workspace_id,id,key_hash,name,scopes,created_by,expires_at,revoked_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8)',
      [
        workspace,
        keys[i],
        randomUUID(),
        'Fixture',
        JSON.stringify([i === 2 ? 'brands:read' : 'brands:write']),
        user,
        new Date(Date.now() + (i === 1 ? -1000 : 3600000)),
        i === 0 ? new Date() : null,
      ],
    );
    await admin.query(
      "INSERT INTO operations(workspace_id,id,type,input,created_by,created_api_key_id) VALUES($1,$2,'brand.extract',$3,$4,$5)",
      [workspace, jobs[i], JSON.stringify({ url: 'http://127.0.0.1' }), user, keys[i]],
    );
  }
  const worker = spawn(process.execPath, ['--import', 'tsx', 'src/server/worker.ts'], {
    stdio: 'ignore',
  });
  try {
    let rows: { state: string; error: { code: string } }[] = [];
    for (let i = 0; i < 100; i++) {
      rows = (
        await admin.query('SELECT state,error FROM operations WHERE workspace_id=$1', [workspace])
      ).rows;
      if (rows.every((r) => r.state === 'failed')) break;
      await new Promise((r) => setTimeout(r, 50));
    }
    assert.equal(rows.length, 3);
    assert.ok(rows.every((r) => r.error?.code === 'PERMISSION_REVOKED'));
  } finally {
    worker.kill('SIGTERM');
    await new Promise<void>((resolve) => worker.once('exit', () => resolve()));
    for (const table of ['operations', 'api_keys', 'memberships'])
      await admin.query('DELETE FROM ' + table + ' WHERE workspace_id=$1', [workspace]);
    await admin.query('DELETE FROM workspaces WHERE id=$1', [workspace]);
  }
});
