import assert from 'node:assert/strict';
import { randomUUID, randomBytes } from 'node:crypto';
import env from '@next/env';
import pg from 'pg';
import { digest } from '../src/server/audit.js';
env.loadEnvConfig(process.cwd());
const origin = process.env.APP_ORIGIN ?? 'http://127.0.0.1:3000';
if (
  process.env.LOCAL_DEVELOPMENT !== 'true' ||
  !['127.0.0.1', 'localhost'].includes(new URL(origin).hostname)
)
  throw new Error('Local review fixtures only');
const db = new pg.Pool({ connectionString: process.env.MIGRATION_DATABASE_URL });
const workspace = randomUUID(),
  user = 'key-review-' + randomUUID(),
  cookie = randomBytes(32).toString('hex'),
  email = randomUUID(),
  revision = randomUUID(),
  campaign = randomUUID();
async function request(
  path: string,
  method = 'GET',
  secret?: string,
  body?: unknown,
  evil = false,
) {
  return fetch(origin + '/v1/' + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Idempotency-Key': randomUUID(),
      ...(secret
        ? { Authorization: 'Bearer ' + secret }
        : {
            Cookie: 'mailcraft_local_session=' + cookie,
            Origin: origin,
            'X-Workspace-Id': workspace,
          }),
      ...(evil ? { Authorization: 'Bearer invalid', Origin: 'https://evil.example' } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}
try {
  await db.query('INSERT INTO workspaces(id,name) VALUES($1,$2)', [workspace, 'Key review QA']);
  await db.query("INSERT INTO memberships(workspace_id,user_id,role) VALUES($1,$2,'Owner')", [
    workspace,
    user,
  ]);
  await db.query(
    "INSERT INTO auth_sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '1 hour')",
    [digest(cookie), user],
  );
  await db.query(
    "INSERT INTO emails(workspace_id,id,title,spec,created_by) VALUES($1,$2,'Fixture','{}',$3)",
    [workspace, email, user],
  );
  await db.query(
    "INSERT INTO revisions(workspace_id,id,email_id,revision_no,spec,html,plaintext,artifact_hash,manifest,created_by) VALUES($1,$2,$3,1,'{}','<p>Review fixture</p>','Review fixture',$4,'{}',$5)",
    [workspace, revision, email, digest('review-fixture'), user],
  );
  await db.query(
    "INSERT INTO campaigns(workspace_id,id,name,revision_id,intent,digest,created_by) VALUES($1,$2,'Fixture',$3,'{}',$4,$5)",
    [workspace, campaign, revision, digest('campaign-fixture'), user],
  );
  const issued = await request('api-keys', 'POST', undefined, {
    name: 'Encoded path QA',
    scopes: ['emails:read', 'campaigns:write'],
    expires_in_days: 1,
  });
  assert.equal(issued.status, 201);
  const secret = (await issued.json()).secret as string;
  const checks = [
    ['canonical session', (await request('session', 'DELETE', undefined, undefined, true)).status],
    ['encoded session', (await request('%73ession', 'DELETE', undefined, undefined, true)).status],
    [
      'canonical workspace',
      (await request('workspaces', 'POST', undefined, { name: 'Review fixture extra' }, true))
        .status,
    ],
    [
      'encoded workspace',
      (await request('%77orkspaces', 'POST', undefined, { name: 'Review fixture extra' }, true))
        .status,
    ],
    [
      'canonical cancel',
      (await request('campaigns/' + campaign + '/cancel', 'POST', secret, {})).status,
    ],
    [
      'encoded cancel',
      (await request('campaigns/' + campaign + '/%63ancel', 'POST', secret, {})).status,
    ],
    [
      'canonical export',
      (await request('email-revisions/' + revision + '/download', 'GET', secret)).status,
    ],
    [
      'encoded export',
      (await request('email-revisions/' + revision + '/%64ownload', 'GET', secret)).status,
    ],
  ];
  assert.deepEqual(
    checks.map(([name, status]) => [name, status]),
    checks.map(([name]) => [name, 403]),
  );
  console.log(
    'Encoded and canonical session/campaign/export authorization all deny consistently; zero provider calls.',
  );
} finally {
  const owned = (
    await db.query('SELECT workspace_id FROM memberships WHERE user_id=$1', [user])
  ).rows.map((r) => r.workspace_id);
  const ids = [...new Set([workspace, ...owned])];
  for (const table of [
    'api_rate_events',
    'idempotency',
    'audit_events',
    'campaigns',
    'revisions',
    'emails',
    'operations',
    'api_keys',
    'memberships',
  ])
    await db.query('DELETE FROM ' + table + ' WHERE workspace_id=ANY($1)', [ids]);
  await db.query('DELETE FROM auth_sessions WHERE token_hash=$1', [digest(cookie)]);
  await db.query('DELETE FROM workspaces WHERE id=ANY($1)', [ids]);
  await db.end();
}
