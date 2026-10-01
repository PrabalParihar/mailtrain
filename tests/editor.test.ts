import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import pg from 'pg';
import env from '@next/env';
env.loadEnvConfig(process.cwd());
import { tenant, closeDb } from '../src/server/db.js';
import { blankSpec } from '../src/domain/email.js';
import { createEmail, saveDraft, checkpoint, restoreRevision } from '../src/server/emails.js';
import { keyed } from '../src/server/commands.js';
const admin = new pg.Pool({ connectionString: process.env.MIGRATION_DATABASE_URL });
after(async () => {
  await closeDb();
  await admin.end();
});
test('acknowledged CAS saves survive reload, stale changes fail, restore creates new head', async () => {
  const w = randomUUID(),
    u = 'fixture';
  await admin.query('INSERT INTO workspaces(id,name) VALUES($1,$2)', [w, 'Save fixture']);
  const brand = randomUUID();
  await admin.query('INSERT INTO brands(workspace_id,id,version,data) VALUES($1,$2,1,$3)', [
    w,
    brand,
    JSON.stringify({ name: 'Fixture' }),
  ]);
  const a = await tenant(w, u, (tx) =>
    createEmail(tx, { user: u, workspace: w, role: 'Owner' }, 'Draft', blankSpec(brand, 'Fixture')),
  );
  const rev = await tenant(w, u, (tx) =>
    checkpoint(tx, { user: u, workspace: w, role: 'Owner' }, a.id, 1),
  );
  const edited = { ...a.spec, subject: 'First' };
  const saved = await tenant(w, u, (tx) =>
    saveDraft(tx, { user: u, workspace: w, role: 'Owner' }, a.id, 1, edited),
  );
  assert.equal(saved.doc_version, 2);
  await assert.rejects(
    tenant(w, u, (tx) =>
      saveDraft(tx, { user: u, workspace: w, role: 'Owner' }, a.id, 1, {
        ...edited,
        subject: 'Lost',
      }),
    ),
    /changed/,
  );
  const restored = await tenant(w, u, (tx) =>
    restoreRevision(tx, { user: u, workspace: w, role: 'Owner' }, a.id, 2, rev.id),
  );
  assert.equal(restored.doc_version, 3);
  assert.equal(restored.spec.subject, '');
  assert.equal(
    (
      await tenant(
        w,
        u,
        async (tx) =>
          (
            await tx.query(
              "SELECT subject FROM (SELECT spec->>'subject' AS subject FROM emails WHERE id=$1) s",
              [a.id],
            )
          ).rows[0],
      )
    ).subject,
    '',
  );
});
test('keyed replay preserves operation and refuses a different payload', async () => {
  const w = randomUUID(),
    p = { workspace: w, user: 'fixture', role: 'Owner' as const };
  await admin.query('INSERT INTO workspaces(id,name) VALUES($1,$2)', [w, 'Idempotency fixture']);
  let calls = 0;
  const run = (body: unknown) =>
    tenant(w, p.user, (tx) =>
      keyed(tx, p, 'fixture', 'key', body, async () => ({ number: ++calls })),
    );
  assert.deepEqual(await run({ x: 1 }), await run({ x: 1 }));
  assert.equal(calls, 1);
  await assert.rejects(run({ x: 2 }), /different payload/);
});
test('brand pins must belong to this tenant and audit order survives repeated transaction events', async () => {
  const w = randomUUID(),
    other = randomUUID(),
    brand = randomUUID(),
    p = { workspace: w, user: 'fixture', role: 'Owner' as const };
  await admin.query('INSERT INTO workspaces(id,name) VALUES($1,$3),($2,$3)', [
    w,
    other,
    'Brand boundary fixture',
  ]);
  await admin.query('INSERT INTO brands(workspace_id,id,version,data) VALUES($1,$2,1,$3)', [
    other,
    brand,
    JSON.stringify({ name: 'Private brand' }),
  ]);
  await assert.rejects(
    tenant(w, p.user, (tx) => createEmail(tx, p, 'Invalid pin', blankSpec(brand, 'Fixture'))),
    /Brand version not found/,
  );
  const { audit, digest } = await import('../src/server/audit.js');
  await tenant(w, p.user, async (tx) => {
    await audit(tx, w, p.user, 'first');
    await audit(tx, w, p.user, 'second');
    await audit(tx, w, p.user, 'third');
  });
  const rows = (
    await tenant(w, p.user, (tx) => tx.query('SELECT * FROM audit_events ORDER BY event_sequence'))
  ).rows;
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    assert.equal(r.previous_hash, i ? rows[i - 1].event_hash : 'genesis');
    assert.equal(
      r.event_hash,
      digest({
        format: 2,
        workspace: w,
        id: r.id,
        sequence: r.event_sequence,
        createdAt: r.created_at.toISOString(),
        prev: r.previous_hash,
        actor: r.actor,
        action: r.action,
        resource: r.resource_id,
      }),
    );
  }
});
