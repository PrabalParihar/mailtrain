import { randomUUID } from 'node:crypto';
import type pg from 'pg';
import { assetObjectKey, type AssetStore } from './asset-store';
import {
  claimMediaJob,
  mediaJobContext,
  settleMediaJob,
  cleanupStagedMediaObjects,
  type MediaJob,
} from './media-jobs';
import { processMediaIsolated, type MediaSupervisorConfig } from './media-supervisor';
export async function runMediaJob(
  workerPool: pg.Pool,
  job: MediaJob,
  store: AssetStore,
  signal?: AbortSignal,
  config?: MediaSupervisorConfig,
) {
  const stop = new AbortController();
  const abort = () => stop.abort();
  signal?.addEventListener('abort', abort, { once: true });
  if (signal?.aborted) abort();
  const overall = setTimeout(() => stop.abort(), 175000);
  let checking = false;
  const check = async () => {
    if (stop.signal.aborted || !(await mediaJobContext(workerPool, job))) {
      stop.abort();
      throw new Error('MEDIA_AUTHORITY_REVOKED');
    }
  };
  const timer = setInterval(() => {
    if (!checking) {
      checking = true;
      void check()
        .catch(() => stop.abort())
        .finally(() => {
          checking = false;
        });
    }
  }, 5000);
  try {
    await check();
    await cleanupStagedMediaObjects(workerPool, store, job);
    const result = await processMediaIsolated(job, store, stop.signal, check, config);
    await check();
    const variants = [];
    for (const item of result.outputs) {
      const id = randomUUID(),
        key = assetObjectKey(job.workspace, id, 'variant');
      const staged = (
        await workerPool.query('SELECT mailcraft_stage_media_object($1,$2,$3,$4,$5)ok', [
          job.workspace,
          job.operation_id,
          job.token,
          key,
          item.bytes.length,
        ])
      ).rows[0].ok;
      if (!staged) throw new Error('MEDIA_AUTHORITY_REVOKED');
      await store.putImmutable(key, item.bytes, item.output.sha256);
      variants.push({
        id,
        object_key: key,
        ...item.output,
        frames: item.output.role === 'animation' ? result.receipt.source_metadata.frames : 1,
        processing_profile: result.receipt.profile,
        receipt: result.receipt,
      });
    }
    await check();
    const scans = result.scans.flatMap((scan) =>
      scan.files.map((file) => ({
        sha256: file.sha256,
        status: 'clean',
        engine: scan.runtime.engine,
        database_sha256: scan.database.snapshot_sha256,
        database_built_at: scan.database.daily_built_at,
        completed_at: scan.completed_at,
        receipt: { ...scan, official_database: true },
      })),
    );
    return await settleMediaJob(workerPool, job, {
      status: 'success',
      source_sha256: job.source_sha256,
      variants,
      scans,
    });
  } catch (error) {
    if ((error as Error).cause)
      console.error(
        JSON.stringify({ media_failure: (error as Error).message, detail: (error as Error).cause }),
      );
    const code = (error as { code?: string; message?: string }).code ?? (error as Error).message;
    if(code!=='MEDIA_REAP_UNCONFIRMED')await cleanupStagedMediaObjects(workerPool,store,job);
    await settleMediaJob(workerPool, job, {
      status: 'failed',
      failure_code: /^[A-Z_]{1,80}$/.test(code ?? '') ? code : 'MEDIA_RUNTIME_UNAVAILABLE',
    });
    return false;
  } finally {
    clearTimeout(overall);
    clearInterval(timer);
    signal?.removeEventListener('abort', abort);
  }
}
export async function runNextMediaJob(
  schedulerPool: pg.Pool,
  workerPool: pg.Pool,
  store: AssetStore,
  signal?: AbortSignal,
  config?: MediaSupervisorConfig,
) {
  await cleanupStagedMediaObjects(schedulerPool, store);
  const job = await claimMediaJob(schedulerPool);
  if (!job) return false;
  await runMediaJob(workerPool, job, store, signal, config);
  return true;
}
