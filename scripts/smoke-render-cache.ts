import assert from 'node:assert/strict';
import { randomUUID, randomBytes } from 'node:crypto';
import pg from 'pg';
import env from '@next/env';
import { digest } from '../src/server/audit';
import { bytesDigest, RENDERER_VERSION } from '../renderer/protocol.mjs';
env.loadEnvConfig(process.cwd());
const origin = process.env.APP_ORIGIN ?? 'http://127.0.0.1:3000';
if (process.env.LOCAL_DEVELOPMENT !== 'true' || !['127.0.0.1', 'localhost'].includes(new URL(origin).hostname))
  throw new Error('Owned local renderer fixtures only');
const db = new pg.Pool({ connectionString: process.env.MIGRATION_DATABASE_URL });
const w = randomUUID(), other = randomUUID(), user = 'render-http-' + randomUUID(), cookie = randomBytes(32).toString('hex');
const email = randomUUID(), revision = randomUUID(), second = randomUUID();
const html = '<html><body><h1>Lettercape frozen export</h1><p>Local cache verification</p></body></html>', hash = bytesDigest(Buffer.from(html));
const download = (format: string, id = revision, workspace = w, signal?: AbortSignal) => fetch(`${origin}/v1/email-revisions/${id}/download?format=${format}`, {
  headers: { Cookie: 'mailcraft_local_session=' + cookie, 'X-Workspace-Id': workspace }, signal,
});
try {
  await db.query('INSERT INTO workspaces(id,name)VALUES($1,$3),($2,$3)', [w, other, 'Renderer HTTP fixture']);
  await db.query("INSERT INTO memberships(workspace_id,user_id,role)VALUES($1,$3,'Owner'),($2,$3,'Owner')", [w, other, user]);
  await db.query("INSERT INTO auth_sessions(token_hash,user_id,expires_at)VALUES($1,$2,now()+interval '1 hour')", [digest(cookie), user]);
  await db.query("INSERT INTO emails(workspace_id,id,title,spec,created_by)VALUES($1,$2,'Fixture','{}',$3)", [w, email, user]);
  for (const [id, number] of [[revision, 1], [second, 2]])
    await db.query("INSERT INTO revisions(workspace_id,id,email_id,revision_no,spec,html,plaintext,artifact_hash,manifest,created_by)VALUES($1,$2,$3,$4,'{}',$5,'Fixture',$6,'{}',$7)", [w, id, email, number, html, hash, user]);
  const pngResponses = await Promise.all([download('png'), download('png')]);
  assert.ok(pngResponses.every((r) => [200, 429].includes(r.status)));
  assert.ok(pngResponses.some((r) => r.status === 200));
  for (let i = 0; i < pngResponses.length; i++) if (pngResponses[i].status === 429) {
    assert.equal((await pngResponses[i].json()).error.retryable, true);
    pngResponses[i] = await download('png');
    assert.equal(pngResponses[i].status, 200);
  }
  const pngs = await Promise.all(pngResponses.map(async (r) => Buffer.from(await r.arrayBuffer())));
  assert.deepEqual(pngs[0], pngs[1]);
  assert.equal(pngs[0].subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  const receipts = (await db.query('SELECT * FROM render_downloads WHERE workspace_id=$1', [w])).rows;
  assert.equal(receipts.length, 1);
  assert.equal(receipts[0].renderer_version, `lettercape-local-browser-assets-export-2-${process.platform}`);
  assert.notEqual(receipts[0].renderer_version, RENDERER_VERSION);
  assert.equal(receipts[0].body_hash, bytesDigest(pngs[0]));
  const bearer = 'lc_' + randomBytes(32).toString('hex');
  await db.query("INSERT INTO api_keys(workspace_id,key_hash,name,scopes,prefix,created_by,expires_at)VALUES($1,$2,'Cache quota fixture','[\"emails:export\"]','fixture',$3,now()+interval '1 hour')", [w, digest(bearer), user]);
  for (let i = 0; i < 10; i++) {
    const r = await fetch(`${origin}/v1/email-revisions/${revision}/download?format=png`, { headers: { Authorization: 'Bearer ' + bearer } });
    assert.equal(r.status, 200, 'one HTTP export consumes exactly one API rate slot');
    await r.arrayBuffer();
  }
  assert.equal((await fetch(`${origin}/v1/email-revisions/${revision}/download?format=png`, { headers: { Authorization: 'Bearer ' + bearer } })).status, 429);
  const holder = await db.connect();
  let fast: Response[] | null = null;
  const aborted = new AbortController();
  try {
    await holder.query('BEGIN');
    await holder.query('SELECT pg_advisory_xact_lock(hashtext($1))', [w + ':render-cache']);
    const requests = Promise.all([download('png'), download('png', second)]);
    fast = await Promise.race([requests, new Promise<null>((resolve) => setTimeout(() => resolve(null), 1500))]);
    const cancelled = download('pdf', second, w, aborted.signal).catch(() => null);
    aborted.abort();
    await cancelled;
    if (!fast) void requests.catch(() => {});
  } finally {
    await holder.query('ROLLBACK');
    holder.release();
  }
  assert.ok(fast, 'cached reads and busy admission must finish without waiting on a render lock');
  assert.deepEqual(fast.map((r) => r.status), [200, 429]);
  assert.equal((await fast[1].json()).error.retryable, true);
  assert.equal((await download('png', revision, other)).status, 404);
  const controller = new AbortController(), dropped = await download('pdf', revision, w, controller.signal);
  assert.equal(dropped.status, 200);
  controller.abort(); // lose the response body after the durable receipt exists
  const recovered = await download('pdf');
  assert.equal(recovered.status, 200);
  const pdf = Buffer.from(await recovered.arrayBuffer());
  assert.equal(pdf.subarray(0, 5).toString(), '%PDF-');
  assert.equal(Number((await db.query('SELECT count(*) FROM render_downloads WHERE workspace_id=$1', [w])).rows[0].count), 2);
  await db.query("UPDATE memberships SET role='Viewer' WHERE workspace_id=$1", [w]);
  assert.equal((await download('png')).status, 403);
  await db.query("UPDATE memberships SET role='Owner' WHERE workspace_id=$1", [w]);
  await db.query('UPDATE render_downloads SET body_hash=$1 WHERE id=$2', ['a'.repeat(64), receipts[0].id]);
  assert.equal((await download('png')).status, 503);
  await db.query('UPDATE render_downloads SET body_hash=$1 WHERE id=$2', [receipts[0].body_hash, receipts[0].id]);
  const quota = Buffer.alloc(16 * 1024 * 1024, 1);
  for (let i = 0; i < 3; i++) await db.query('INSERT INTO render_downloads(workspace_id,revision_id,format,renderer_version,artifact_hash,body,body_hash,byte_size)VALUES($1,$2,$3,$4,$5,$6,$7,$8)', [w, revision, 'png', 'owned-quota-fixture-' + i, hash, quota, bytesDigest(quota), quota.length]);
  assert.equal((await download('png', second)).status, 409);
  assert.equal((await download('html', second)).status, 200);
  assert.deepEqual(Buffer.from(await (await download('png')).arrayBuffer()), pngs[0]);
  assert.deepEqual((await db.query('SELECT html,artifact_hash FROM revisions WHERE id=$1', [revision])).rows[0], { html, artifact_hash: hash });
  console.log(JSON.stringify({ checks: 'real cached PNG/PDF; concurrent receipt uniqueness; lost body recovery; local/worker profile separation; tenant/role/integrity denial; finite storage admission preserves frozen exports', provider_calls: 0 }));
} finally {
  for (const table of ['render_downloads', 'api_rate_events', 'api_keys', 'audit_events', 'revisions', 'emails', 'memberships'])
    await db.query(`DELETE FROM ${table} WHERE workspace_id=ANY($1::uuid[])`, [[w, other]]);
  await db.query('DELETE FROM auth_sessions WHERE user_id=$1', [user]);
  await db.query('DELETE FROM workspaces WHERE id=ANY($1::uuid[])', [[w, other]]);
  await db.end();
}
