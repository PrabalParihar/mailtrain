import type pg from 'pg';
import type { Principal } from './auth';
export type MediaJob = {
  workspace: string;
  operation_id: string;
  asset_id: string;
  upload_id: string;
  principal: Principal;
  selected_frame: number;
  token: string;
  source_key: string;
  source_sha256: string;
  source_bytes: number;
};
export async function claimMediaJob(pool: pg.Pool): Promise<MediaJob | null> {
  await pool.query('SELECT mailcraft_expire_media_uploads()');
  return (await pool.query('SELECT mailcraft_claim_media()AS job')).rows[0].job;
}
export async function mediaJobContext(pool: pg.Pool, job: MediaJob) {
  return (
    await pool.query('SELECT mailcraft_media_context($1,$2,$3)AS context', [
      job.workspace,
      job.operation_id,
      job.token,
    ])
  ).rows[0].context;
}
export async function settleMediaJob(pool: pg.Pool, job: MediaJob, payload: unknown) {
  return (
    (
      await pool.query('SELECT mailcraft_settle_media($1,$2,$3,$4)AS settled', [
        job.workspace,
        job.operation_id,
        job.token,
        payload,
      ])
    ).rows[0].settled === true
  );
}
export async function expireMediaUploads(tx: pg.PoolClient, workspace: string) {
  const rows = (
    await tx.query(
      "SELECT id,reserved_bytes,operation_id FROM asset_uploads WHERE workspace_id=$1 AND (status='pending'AND expires_at<=clock_timestamp()OR status='transferring'AND transfer_until<=clock_timestamp())FOR UPDATE",
      [workspace],
    )
  ).rows;
  for (const u of rows) {
    const staged =
      (
        await tx.query(
          'SELECT count(*) FROM asset_object_staging WHERE workspace_id=$1 AND operation_id=$2',
          [workspace, u.operation_id],
        )
      ).rows[0].count !== '0';
    if (!staged)
      await tx.query('UPDATE asset_quotas SET reserved=reserved-$2 WHERE workspace_id=$1', [
        workspace,
        u.reserved_bytes,
      ]);
    await tx.query(
      "UPDATE asset_uploads SET reserved_bytes=CASE WHEN EXISTS(SELECT FROM asset_object_staging WHERE workspace_id=$1 AND operation_id=asset_uploads.operation_id)THEN reserved_bytes ELSE 0 END,status='expired',transfer_token=NULL,transfer_until=NULL WHERE workspace_id=$1 AND id=$2",
      [workspace, u.id],
    );
    await tx.query(
      'UPDATE operations SET state=\'failed\',error=\'{"code":"ASSET_UPLOAD_EXPIRED","message":"Upload expired before transfer."}\',completed_at=clock_timestamp()WHERE workspace_id=$1 AND id=$2',
      [workspace, u.operation_id],
    );
  }
  return rows.length;
}
export type MediaStagedObject = {
  workspace: string;
  operation_id: string;
  upload_id: string;
  object_key: string;
  bytes: number;
};
export async function cleanupStagedMediaObjects(
  pool: pg.Pool,
  store: import('./asset-store').AssetStore,
  job?: MediaJob,
) {
  const objects = (
    await pool.query('SELECT mailcraft_media_object_cleanup_candidates($1,$2,$3)objects', [
      job?.workspace ?? null,
      job?.operation_id ?? null,
      job?.token ?? null,
    ])
  ).rows[0].objects as MediaStagedObject[];
  for (const object of objects) {
    try {
      await store.removeAuthorized(object.object_key);
    } catch (error) {
      // Missing planned objects remain reserved: a paused writer may still finish its conditional install.
      console.error(
        JSON.stringify({
          media_cleanup_pending: object.object_key,
          code: (error as NodeJS.ErrnoException).code ?? (error as Error).message,
        }),
      );
      continue;
    }
    await pool.query('SELECT mailcraft_forget_media_object($1,$2,$3,$4)', [
      object.workspace,
      object.operation_id,
      object.object_key,
      job?.token ?? null,
    ]);
  }
  return objects.length;
}
