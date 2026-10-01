import { randomBytes } from 'node:crypto';
import { z } from 'zod';
import { KeyInput, scopeForResource } from '../domain/api-keys';
import { sessionQuery, tenant, userQuery } from './db';
import { audit, digest } from './audit';
import { fail } from './errors';
import { keyed } from './commands';
import { withPrincipal, type Principal } from './auth';
import { allowed, type Action } from '../domain/permissions';
import { consumeApiRate } from './api-rate';
import { requestPath } from './http';
import { resourcePage } from './pagination';
// Rechecking current authority within one HTTP request must not charge it again.
// Request identity remains server-owned; every new incoming request has its own receipt.
const rateReceipts = new WeakMap<Request, { workspace: string; key: string; receipt: Promise<void> }>();
export function requireKeyScope(p: Principal, scope: string) {
  if (p.api_key && !p.api_key.scopes.includes(scope))
    fail(403, 'INSUFFICIENT_SCOPE', 'This API key does not grant the required resource scope.');
}
export async function resolveApiKey(req: Request, action: Action): Promise<Principal> {
  const value = req.headers.get('authorization') ?? '';
  if (!/^Bearer lc_[0-9a-f]{64}$/.test(value))
    fail(401, 'AUTH_REQUIRED', 'A valid workspace API key is required.');
  const found = (
    await sessionQuery('SELECT * FROM mailcraft_key_context($1)', [digest(value.slice(7))])
  ).rows[0];
  if (!found) fail(401, 'AUTH_REQUIRED', 'This API key is invalid, expired or revoked.');
  const selected = req.headers.get('x-workspace-id');
  if (selected && selected !== found.workspace_id)
    fail(403, 'WORKSPACE_KEY_BOUND', 'This API key is bound to a different workspace.');
  const membership = await userQuery(
    found.created_by,
    async (tx) =>
      (
        await tx.query(
          "SELECT role FROM memberships WHERE workspace_id=$1 AND user_id=$2 AND status='active'",
          [found.workspace_id, found.created_by],
        )
      ).rows[0],
  );
  if (!membership || !['Owner', 'Admin'].includes(membership.role))
    fail(401, 'AUTH_REQUIRED', 'The API key issuer no longer has delegation permission.');
  const active = await tenant(
    found.workspace_id,
    found.created_by,
    async (tx) =>
      (await tx.query('SELECT status FROM workspaces WHERE id=$1', [found.workspace_id])).rows[0],
  );
  if (active?.status !== 'active')
    fail(409, 'WORKSPACE_LOCKED', 'This workspace cannot accept new work.');
  let rate = rateReceipts.get(req);
  if (!rate) {
    rate = { workspace: found.workspace_id, key: found.id, receipt: consumeApiRate(found.workspace_id, found.id) };
    rateReceipts.set(req, rate);
  }
  if (rate.workspace !== found.workspace_id || rate.key !== found.id)
    fail(401, 'AUTH_CONTEXT_CHANGED', 'Request credential context changed.');
  await rate.receipt;
  if (!allowed(membership.role, action))
    fail(403, 'INSUFFICIENT_SCOPE', 'The issuer cannot delegate this action.');
  const p: Principal = {
    workspace: found.workspace_id,
    user: 'api-key:' + found.id,
    role: membership.role,
    api_key: { id: found.id, scopes: found.scopes, delegator: found.created_by },
  };
  const [root, , command] = requestPath(req);
  const scope = scopeForResource(root, req.method, command);
  if (scope) requireKeyScope(p, scope);
  return p;
}
const metadata = 'id,name,scopes,prefix,created_by,created_at,expires_at,revoked_at';
export async function keyRoute(
  req: Request,
  path: string[],
  body: Record<string, unknown>,
  commandKey: string | null,
) {
  if (req.headers.has('authorization'))
    fail(403, 'SESSION_REQUIRED', 'Manage API keys through an authorized signed-in session.');
  return withPrincipal(req, 'manage', async (tx, p) => {
    const [, id, command] = path;
    if (req.method === 'GET')
      return resourcePage(req, tx, p, { resource: 'keys', from: 'api_keys', fields: metadata });
    let rawSecret: string | undefined;
    const result = await keyed(
      tx,
      p,
      'api-key.' + (command ?? 'create') + ':' + (id ?? ''),
      commandKey,
      body,
      async () => {
        let input: z.infer<typeof KeyInput>;
        let expiresAt: Date;
        if (id) {
          z.object({}).strict().parse(body);
          const old = (await tx.query('SELECT * FROM api_keys WHERE id=$1 FOR UPDATE', [id]))
            .rows[0];
          if (!old) fail(404, 'RESOURCE_NOT_FOUND', 'API key not found.');
          if (command === 'revoke') {
            await tx.query(
              'UPDATE api_keys SET revoked_at=COALESCE(revoked_at,now()) WHERE id=$1',
              [id],
            );
            await audit(tx, p.workspace, p.user, 'api_key.revoked', id);
            return {
              key: (await tx.query('SELECT ' + metadata + ' FROM api_keys WHERE id=$1', [id]))
                .rows[0],
            };
          }
          if (old.revoked_at) fail(409, 'KEY_REVOKED', 'This key is revoked. Create a new key.');
          if (new Date(old.expires_at).getTime() <= Date.now())
            fail(409, 'KEY_EXPIRED', 'This key has expired. Create a new scoped key.');
          expiresAt = new Date(old.expires_at);
          input = KeyInput.parse({ name: old.name, scopes: old.scopes, expires_in_days: 90 });
          await tx.query('UPDATE api_keys SET revoked_at=now() WHERE id=$1', [id]);
        } else {
          input = KeyInput.parse(body);
          expiresAt = new Date(Date.now() + input.expires_in_days * 86400000);
        }
        rawSecret = 'lc_' + randomBytes(32).toString('hex');
        const row = (
          await tx.query(
            'INSERT INTO api_keys(workspace_id,key_hash,name,scopes,prefix,created_by,expires_at) VALUES($1,$2,$3,$4,$5,$6,$7::timestamptz) RETURNING ' +
              metadata,
            [
              p.workspace,
              digest(rawSecret),
              input.name,
              JSON.stringify(input.scopes),
              rawSecret.slice(0, 12),
              p.user,
              expiresAt,
            ],
          )
        ).rows[0];
        await audit(tx, p.workspace, p.user, id ? 'api_key.rotated' : 'api_key.created', row.id);
        return { key: row };
      },
    );
    // Never place the raw secret in keyed receipts, audit data or persistent storage.
    return { ...result, secret: rawSecret, secret_available: !!rawSecret };
  });
}
