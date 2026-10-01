import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import pg from 'pg';
import env from '@next/env';
import { compileRule, validateRule } from '../src/domain/segments';
env.loadEnvConfig(process.cwd());
const admin = new pg.Pool({ connectionString: process.env.MIGRATION_DATABASE_URL });
const runtime = new pg.Pool({ connectionString: process.env.DATABASE_URL });
after(async () => {
  await admin.end();
  await runtime.end();
});
test('audience SQL selects exact typed values, observed facts and tenant membership; negative filters exclude missing', async () => {
  const workspace = randomUUID(),
    other = randomUUID(),
    tag = randomUUID(),
    a = randomUUID(),
    b = randomUUID();
  await admin.query('INSERT INTO workspaces(id,name) VALUES($1,$3),($2,$3)', [
    workspace,
    other,
    'Audience test',
  ]);
  try {
    await admin.query('INSERT INTO tags(workspace_id,id,name) VALUES($1,$2,$3)', [
      workspace,
      tag,
      'VIP',
    ]);
    await admin.query(
      "INSERT INTO contacts(workspace_id,id,email_original,email_lookup,attrs) VALUES($1,$2,'a@example.com','a@example.com',$4),($1,$3,'b@example.com','b@example.com','{}')",
      [workspace, a, b, JSON.stringify({ score: 7, city: "x'); DROP TABLE contacts; --" })],
    );
    await admin.query('INSERT INTO contact_tags(workspace_id,contact_id,tag_id) VALUES($1,$2,$3)', [
      workspace,
      a,
      tag,
    ]);
    await admin.query(
      "INSERT INTO engagement_events(workspace_id,contact_id,event,provider,provider_event_id,verification,occurred_at) VALUES($1,$2,'clicked','explicit-test-fixture','test-event','{\"test_only\":true}',now())",
      [workspace, a],
    );
    const client = await runtime.connect();
    try {
      await client.query('BEGIN');
      await client.query("SELECT set_config('app.workspace_id',$1,true)", [workspace]);
      const fields = [
        { key: 'score', type: 'number' as const },
        { key: 'city', type: 'string' as const },
      ];
      const rules = [
        { kind: 'attribute', field: 'score', op: 'gte', value: 5 },
        { kind: 'attribute', field: 'city', op: 'eq', value: "x'); DROP TABLE contacts; --" },
        { kind: 'attribute', field: 'score', op: 'neq', value: 5 },
        { kind: 'tag', id: tag, op: 'in' },
        { kind: 'engagement', event: 'clicked', op: 'observed', within_days: 30 },
      ];
      for (const input of rules) {
        const query = compileRule(validateRule(input, fields), fields);
        assert.deepEqual(
          (
            await client.query('SELECT c.id FROM contacts c WHERE ' + query.sql, query.params)
          ).rows.map((r) => r.id),
          [a],
        );
      }
      assert.equal((await client.query('SELECT * FROM tags')).rowCount, 1);
      await client.query("SELECT set_config('app.workspace_id',$1,true)", [other]);
      assert.equal((await client.query('SELECT * FROM tags')).rowCount, 0);
      await assert.rejects(
        client.query('INSERT INTO contact_tags(workspace_id,contact_id,tag_id) VALUES($1,$2,$3)', [
          other,
          b,
          tag,
        ]),
        /foreign key/,
      );
      await client.query('ROLLBACK');
      await client.query('BEGIN');
      await client.query("SELECT set_config('app.workspace_id',$1,true)", [workspace]);
      await assert.rejects(
        client.query(
          "INSERT INTO engagement_events(workspace_id,contact_id,event,provider,provider_event_id,verification,occurred_at) VALUES($1,$2,'clicked','fake','fake','{}',now())",
          [workspace, a],
        ),
        /permission denied/,
      );
      await client.query('ROLLBACK');
    } finally {
      client.release();
    }
  } finally {
    for (const table of ['engagement_events', 'contact_tags', 'contacts', 'tags'])
      await admin.query('DELETE FROM ' + table + ' WHERE workspace_id=$1', [workspace]);
    await admin.query('DELETE FROM workspaces WHERE id IN($1,$2)', [workspace, other]);
  }
});
