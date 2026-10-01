import type { Tx } from './db';
import type { Principal } from './auth';
import { allowed, type Action, type Role } from '../domain/permissions';
import { fail } from './errors';

// Authority is reread and held in the same transaction as its resource callback.
// Lock order is workspace → membership → key. A committed revocation wins over
// a previously resolved principal; an admitted transaction completes before the
// conflicting revocation can commit. This never recalls already returned data.
export async function assertCurrentAuthority(
  tx: Tx,
  p: Principal,
  action: Action,
  scope?: string,
  workspaceLock: 'shared' | 'exclusive' = 'shared',
): Promise<Principal> {
  if (workspaceLock === 'exclusive') await tx.query("SET LOCAL lock_timeout='2s'");
  const workspace = (await tx.query<{ status: string }>(
    "SELECT status FROM workspaces WHERE id=$1 AND id::text=current_setting('app.workspace_id',true) AND current_setting('app.user_id',true)=$2 " + (workspaceLock === 'exclusive' ? 'FOR UPDATE' : 'FOR SHARE'),
    [p.workspace, p.user],
  )).rows[0];
  if (!workspace) fail(404, 'RESOURCE_NOT_FOUND', 'Workspace not found.');
  const actor = p.api_key?.delegator ?? p.user;
  const member = (await tx.query<{ role: Role }>(
    "SELECT role FROM memberships WHERE workspace_id=$1 AND user_id=$2 AND status='active' FOR SHARE",
    [p.workspace, actor],
  )).rows[0];
  if (!member) {
    if (p.api_key) fail(401, 'AUTH_REQUIRED', 'The API key issuer no longer has delegation permission.');
    fail(404, 'RESOURCE_NOT_FOUND', 'Workspace not found.');
  }
  if (workspace.status !== 'active')
    fail(409, 'WORKSPACE_LOCKED', 'This workspace cannot accept new work.');
  let current: Principal = { ...p, role: member.role };
  if (p.api_key) {
    if (!['Owner', 'Admin'].includes(member.role) || p.user !== 'api-key:' + p.api_key.id)
      fail(401, 'AUTH_REQUIRED', 'The API key issuer no longer has delegation permission.');
    const key = (await tx.query<{ scopes: string[] }>(
      'SELECT scopes FROM api_keys WHERE workspace_id=$1 AND id=$2 AND created_by=$3 AND revoked_at IS NULL AND expires_at>clock_timestamp() FOR SHARE',
      [p.workspace, p.api_key.id, actor],
    )).rows[0];
    if (!key || !Array.isArray(key.scopes) || !key.scopes.every(value => typeof value === 'string'))
      fail(401, 'AUTH_REQUIRED', 'This API key is invalid, expired or revoked.');
    // SQL predicates can qualify a row before FOR SHARE waits on its lock.
    // Expiry advances without a tuple update, so check database time again
    // after acquiring the lock and before admitting the resource callback.
    const valid = (await tx.query<{ valid: boolean }>(
      'SELECT expires_at>clock_timestamp() AS valid FROM api_keys WHERE workspace_id=$1 AND id=$2',
      [p.workspace, p.api_key.id],
    )).rows[0]?.valid;
    if (!valid) fail(401, 'AUTH_REQUIRED', 'This API key is invalid, expired or revoked.');
    if (scope && !key.scopes.includes(scope))
      fail(403, 'INSUFFICIENT_SCOPE', 'This API key does not grant the required resource scope.');
    current = { ...current, api_key: { ...p.api_key, scopes: key.scopes } };
  }
  if (!allowed(member.role, action))
    fail(403, 'INSUFFICIENT_SCOPE', 'Your current role cannot perform this action.');
  return current;
}
