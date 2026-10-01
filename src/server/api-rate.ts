import { tenant } from './db';
import { fail } from './errors';
export async function consumeApiRate(workspace: string, credential: string) {
  const retry = await tenant(workspace, 'api-rate:' + credential, async (tx) => {
    await tx.query('SELECT pg_advisory_xact_lock(hashtext($1))', [workspace + ':api-rate']);
    await tx.query(
      "DELETE FROM api_rate_events WHERE occurred_at<=clock_timestamp()-interval '60 seconds'",
    );
    const limit =
      (await tx.query('SELECT api_rpm FROM workspaces WHERE id=$1', [workspace])).rows[0]
        ?.api_rpm ?? 10;
    const counts = (
      await tx.query(
        'SELECT count(*)::int AS total,count(*) FILTER(WHERE credential_id=$1)::int AS own,min(occurred_at) AS first FROM api_rate_events',
        [credential],
      )
    ).rows[0];
    if (counts.total >= limit || counts.own >= limit)
      return Math.max(1, Math.ceil((new Date(counts.first).getTime() + 60000 - Date.now()) / 1000));
    await tx.query('INSERT INTO api_rate_events(workspace_id,credential_id) VALUES($1,$2)', [
      workspace,
      credential,
    ]);
    return 0;
  });
  if (retry)
    fail(
      429,
      'RATE_LIMITED',
      'Workspace API request limit reached. Retry after the indicated interval.',
      { retry_after: retry },
    );
}
