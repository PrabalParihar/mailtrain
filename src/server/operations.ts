import { randomUUID } from 'node:crypto';
import type { Tx } from './db';
import type { Principal } from './auth';
import { audit } from './audit';
import { fail } from './errors';
export async function operation(tx: Tx, p: Principal, type: string, input: unknown, units = 0) {
  await tx.query('SELECT pg_advisory_xact_lock(hashtext($1))', [p.workspace + ':usage']);
  const allowance = Number(process.env.AI_GENERATION_ALLOWANCE ?? 0);
  if (units) {
    if (!process.env.OPENAI_API_KEY || !process.env.OPENAI_MODEL)
      fail(
        409,
        'PROVIDER_NOT_READY',
        'Configure the AI provider and model before generation. Your draft is preserved.',
      );
    const used = Number(
      (
        await tx.query(
          "SELECT coalesce(sum(CASE WHEN kind='reserve' THEN units WHEN kind='release' THEN -units ELSE 0 END),0) AS used FROM usage_ledger WHERE metric='generation'",
        )
      ).rows[0].used,
    );
    if (!Number.isSafeInteger(allowance) || allowance < used + units)
      fail(
        409,
        'ENTITLEMENT_EXHAUSTED',
        'Generation is paused until a finite, approved usage allowance is configured.',
      );
  }
  const id = randomUUID();
  await tx.query(
    'INSERT INTO operations(workspace_id,id,type,input,created_by) VALUES($1,$2,$3,$4,$5)',
    [p.workspace, id, type, JSON.stringify(input), p.user],
  );
  if (units)
    await tx.query(
      "INSERT INTO usage_ledger(workspace_id,operation_id,metric,kind,units) VALUES($1,$2,'generation','reserve',$3)",
      [p.workspace, id, units],
    );
  await tx.query('INSERT INTO outbox(workspace_id,type,aggregate_id,data) VALUES($1,$2,$3,$4)', [
    p.workspace,
    'operation.queued',
    id,
    JSON.stringify({ type }),
  ]);
  await audit(tx, p.workspace, p.user, type + '.queued', id);
  return { id, type, state: 'queued', poll_url: '/v1/operations/' + id };
}

export async function cancelOperation(tx: Tx, p: Principal, id: string) {
  const row = (await tx.query('SELECT * FROM operations WHERE id=$1 FOR UPDATE', [id])).rows[0];
  if (!row) fail(404, 'RESOURCE_NOT_FOUND', 'Operation not found.');
  if (row.state === 'cancel_requested') return row;
  if (!['queued', 'running'].includes(row.state))
    fail(409, 'STATE_CONFLICT', 'This operation has ended.');
  const state = row.state === 'queued' ? 'cancelled' : 'cancel_requested';
  await tx.query(
    "UPDATE operations SET state=$1,completed_at=CASE WHEN $1='cancelled' THEN now() ELSE NULL END WHERE id=$2",
    [state, id],
  );
  if (state === 'cancelled')
    await tx.query(
      "INSERT INTO usage_ledger(workspace_id,operation_id,metric,kind,units) SELECT workspace_id,operation_id,metric,'release',units FROM usage_ledger WHERE operation_id=$1 AND kind='reserve' ON CONFLICT DO NOTHING",
      [id],
    );
  await audit(tx, p.workspace, p.user, 'operation.' + state, id);
  return {
    ...row,
    state,
    notice:
      state === 'cancel_requested'
        ? 'Cancellation requested. In-flight usage stays reserved until the provider attempt is accounted for.'
        : 'Queued operation cancelled before any external attempt.',
  };
}
