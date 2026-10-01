import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import pg from 'pg';
import env from '@next/env';
env.loadEnvConfig(process.cwd());
import { issuePreferenceToken, readPreference, unsubscribe } from '../src/server/preferences.js';
import { closeDb } from '../src/server/db.js';
const admin = new pg.Pool({ connectionString: process.env.MIGRATION_DATABASE_URL });
after(async () => {
  await admin.end();
  await closeDb();
});
test('signed recipient GET has no opt-out side effects; repeated POST suppresses once', async () => {
  const w = randomUUID(),
    c = randomUUID();
  await admin.query('INSERT INTO workspaces(id,name) VALUES($1,$2)', [w, 'Preference fixture']);
  await admin.query(
    "INSERT INTO contacts(workspace_id,id,email_original,email_lookup,subscription) VALUES($1,$2,'recipient@example.com','recipient@example.com','subscribed')",
    [w, c],
  );
  const token = await issuePreferenceToken(w, c);
  assert.equal((await readPreference(token)).unsubscribed, false);
  assert.equal(
    (await admin.query('SELECT count(*)::int AS n FROM suppressions WHERE contact_id=$1', [c]))
      .rows[0].n,
    0,
  );
  await unsubscribe(token);
  await unsubscribe(token);
  assert.equal((await readPreference(token)).unsubscribed, true);
  assert.equal(
    (await admin.query('SELECT count(*)::int AS n FROM suppressions WHERE contact_id=$1', [c]))
      .rows[0].n,
    1,
  );
  await assert.rejects(readPreference(token.slice(0, -5) + 'wrong'), /invalid|expired/i);
});

import { frequencyWindowMs, PreferenceInput } from '../src/domain/preferences.js';
test('caps use exact rolling UTC durations and schema rejects ambiguous commands', () => {
  assert.equal(frequencyWindowMs('daily'), 24 * 60 * 60 * 1000);
  assert.equal(frequencyWindowMs('weekly'), 7 * 24 * 60 * 60 * 1000);
  assert.equal(frequencyWindowMs('monthly'), 30 * 24 * 60 * 60 * 1000);
  assert.equal(
    PreferenceInput.safeParse({ expected_version: 1, frequency: 'hourly', topics: [] }).success,
    false,
  );
  assert.equal(
    PreferenceInput.safeParse({
      expected_version: 1,
      frequency: 'weekly',
      topics: [],
      reactivate_global: 'true',
    }).success,
    false,
  );
  const id = 'f61024d7-c89e-42d5-b8f0-bf751570e789';
  assert.equal(
    PreferenceInput.safeParse({ expected_version: 1, frequency: 'weekly', topics: [id, id] })
      .success,
    false,
  );
});
