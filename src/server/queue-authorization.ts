import type { Tx } from './db';
import { allowed } from '../domain/permissions';
import { operationScope } from '../domain/api-keys';
export async function queuedAuthorized(
  tx: Tx,
  op: { workspace_id: string; created_by: string; created_api_key_id?: string; type: string },
) {
  const membership = (
    await tx.query(
      "SELECT m.role FROM memberships m JOIN workspaces w ON w.id=m.workspace_id WHERE m.user_id=$1 AND m.workspace_id=$2 AND m.status='active' AND w.status='active'",
      [op.created_by, op.workspace_id],
    )
  ).rows[0];
  if (!membership || !allowed(membership.role, 'edit')) return false;
  if (!op.created_api_key_id) return true;
  if (!['Owner', 'Admin'].includes(membership.role)) return false;
  const key = (
    await tx.query(
      'SELECT scopes,created_by FROM api_keys WHERE id=$1 AND revoked_at IS NULL AND expires_at>now()',
      [op.created_api_key_id],
    )
  ).rows[0];
  return (
    !!key && key.created_by === op.created_by && key.scopes.includes(operationScope(op.type, true))
  );
}
