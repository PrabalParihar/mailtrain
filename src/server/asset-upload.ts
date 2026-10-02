import { randomBytes, randomUUID, createHash, timingSafeEqual } from 'node:crypto';
import { mkdtemp, open, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { z } from 'zod';
import { signatureMime } from '../../media/protocol.mjs';
import { MEDIA_LIMITS, UploadIntentInput } from '../domain/assets';
import { tenant, type Tx } from './db';
import { type Principal, principal, checkOrigin } from './auth';
import { assertCurrentAuthority } from './current-authority';
import { keyed } from './commands';
import { expireMediaUploads } from './media-jobs';
import { fail } from './errors';
import { bytesHash, configuredAssetStore, assetObjectKey, type AssetStore } from './asset-store';
let admissions = 0;
export function uploadAllowance() {
  if (process.env.LOCAL_DEVELOPMENT === 'true' && process.env.NODE_ENV !== 'production')
    return MEDIA_LIMITS.quota;
  fail(503, 'ASSET_ALLOWANCE_NOT_CONFIGURED', 'A finite approved storage allowance is required.');
}
export async function createUpload(tx: Tx, p: Principal, body: unknown, key: string | null) {
  const input = UploadIntentInput.parse(body);
  await assertCurrentAuthority(tx, p, 'edit', 'assets:write');
  configuredAssetStore();
  return keyed(tx, p, 'assets.upload', key, input, async () => {
    await expireMediaUploads(tx, p.workspace);
    const allowance = uploadAllowance(),
      reserve = MEDIA_LIMITS.upload + MEDIA_LIMITS.derivatives;
    await tx.query(
      "INSERT INTO asset_quotas(workspace_id,allowance,profile)VALUES($1,$2,'local-private-v1')ON CONFLICT DO NOTHING",
      [p.workspace, allowance],
    );
    const q = (
      await tx.query(
        'UPDATE asset_quotas SET reserved=reserved+$2 WHERE workspace_id=$1 AND reserved+used+$2<=allowance RETURNING workspace_id',
        [p.workspace, reserve],
      )
    ).rows[0];
    if (!q) fail(409, 'ASSET_QUOTA_EXHAUSTED', 'Private media storage allowance is exhausted.');
    const id = randomUUID(),
      operation = randomUUID(),
      token = randomBytes(32).toString('hex');
    await tx.query(
      "INSERT INTO operations(workspace_id,id,type,input,created_by,created_api_key_id)VALUES($1,$2,'asset.upload',$3,$4,$5)",
      [
        p.workspace,
        operation,
        { upload_id: id },
        p.api_key?.delegator ?? p.user,
        p.api_key?.id ?? null,
      ],
    );
    const u = (
      await tx.query(
        'INSERT INTO asset_uploads(workspace_id,id,operation_id,created_by,principal,token_hash,expected_sha256,expected_bytes,intent,reserved_bytes)VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)RETURNING expires_at',
        [
          p.workspace,
          id,
          operation,
          p.user,
          p,
          bytesHash(Buffer.from(token)),
          input.sha256,
          input.byte_size,
          input,
          reserve,
        ],
      )
    ).rows[0];
    return {
      upload: { id, token, expires_at: u.expires_at },
      operation: { id: operation, state: 'queued' },
    };
  });
}
export async function readUploadStream(
  request: Request,
  expectedBytes: number,
  expectedHash: string,
  write?: (bytes: Uint8Array) => Promise<void>,
) {
  if (
    request.headers.get('content-encoding') &&
    !['identity'].includes(request.headers.get('content-encoding')!)
  )
    fail(415, 'ASSET_ENCODING_UNSUPPORTED', 'Upload uncompressed binary bytes.');
  if (request.headers.get('content-type')?.split(';')[0] !== 'application/octet-stream')
    fail(415, 'ASSET_CONTENT_TYPE', 'Use application/octet-stream.');
  const reader = request.body?.getReader();
  if (!reader) fail(400, 'ASSET_BODY_REQUIRED', 'Upload the actual image bytes.');
  let count = 0;
  const hash = createHash('sha256'),
    chunks: Uint8Array[] = [];
  let timedOut = false;
  const timeout = setTimeout(() => {
    timedOut = true;
    void reader.cancel().catch(() => {});
  }, 120000);
  const abort = () => {
    void reader.cancel().catch(() => {});
  };
  request.signal.addEventListener('abort', abort, { once: true });
  try {
    for (;;) {
      if (request.signal.aborted) fail(499, 'ASSET_TRANSFER_ABORTED', 'Upload was interrupted.');
      const { done, value } = await reader.read();
      if (done) break;
      count += value.byteLength;
      if (count > MEDIA_LIMITS.upload || count > expectedBytes) {
        await reader.cancel();
        fail(413, 'ASSET_BYTES_LIMIT', 'Image exceeds the admitted byte count.');
      }
      hash.update(value);
      if (write) await write(value);
      else chunks.push(value);
    }
    if (timedOut) fail(408, 'ASSET_TRANSFER_TIMEOUT', 'Upload exceeded the bounded transfer time.');
    if (request.signal.aborted) fail(499, 'ASSET_TRANSFER_ABORTED', 'Upload was interrupted.');
    if (count !== expectedBytes || hash.digest('hex') !== expectedHash)
      fail(409, 'ASSET_TRANSFER_MISMATCH', 'Image bytes do not match the upload intent.');
    return write ? Buffer.alloc(0) : Buffer.concat(chunks, count);
  } finally {
    clearTimeout(timeout);
    request.signal.removeEventListener('abort', abort);
    reader.releaseLock();
  }
}
async function releaseTransfer(p: Principal, id: string, transfer: string) {
  await tenant(p.workspace, p.user, async (tx) => {
    await tx.query(
      "UPDATE asset_uploads SET status='pending',transfer_token=NULL,transfer_until=NULL WHERE workspace_id=$1 AND id=$2 AND transfer_token=$3 AND status='transferring'",
      [p.workspace, id, transfer],
    );
  });
}
export async function uploadAssetContent(
  request: Request,
  uploadId: string,
  store: AssetStore = configuredAssetStore(),
) {
  checkOrigin(request);
  z.uuid().parse(uploadId);
  const p = await principal(request, 'edit');
  if (admissions >= 2) fail(503, 'ASSET_ADMISSION_BUSY', 'Two uploads are active. Retry shortly.');
  admissions++;
  const transfer = randomUUID();
  let transferred = false;
  try {
    const u = await tenant(p.workspace, p.user, async (tx) => {
      await assertCurrentAuthority(tx, p, 'edit', 'assets:write');
      const u = (
        await tx.query(
          'SELECT * FROM asset_uploads WHERE workspace_id=$1 AND id=$2 AND created_by=$3 FOR UPDATE',
          [p.workspace, uploadId, p.user],
        )
      ).rows[0];
      if (!u) fail(404, 'RESOURCE_NOT_FOUND', 'Upload not found.');
      const supplied = bytesHash(Buffer.from(request.headers.get('x-upload-token') ?? ''));
      if (!timingSafeEqual(Buffer.from(supplied), Buffer.from(u.token_hash)))
        fail(404, 'RESOURCE_NOT_FOUND', 'Upload not found.');
      if (u.status !== 'finalized') {
        if (u.expires_at <= new Date() || u.status !== 'pending')
          fail(
            409,
            'ASSET_TRANSFER_UNAVAILABLE',
            'This upload is expired or already transferring.',
          );
        await tx.query(
          "UPDATE asset_uploads SET status='transferring',transfer_token=$3,transfer_until=clock_timestamp()+interval '120 seconds' WHERE workspace_id=$1 AND id=$2",
          [p.workspace, uploadId, transfer],
        );
        transferred = true;
      }
      return u;
    });
    const spool = await mkdtemp(join(tmpdir(), 'lettercape-upload-'));
    let bytes: Buffer;
    try {
      const file = await open(join(spool, 'source'), 'wx', 0o600);
      try {
        await readUploadStream(request, u.expected_bytes, u.expected_sha256, async (chunk) => {
          await file.writeFile(chunk);
        });
        await file.sync();
      } finally {
        await file.close();
      }
      bytes = await readFile(join(spool, 'source'));
    } finally {
      await rm(spool, { recursive: true, force: true });
    }
    const mime = signatureMime(bytes);
    if (mime !== u.intent.declared_mime)
      fail(415, 'ASSET_MIME_MISMATCH', 'Image signature does not match declared media type.');
    if (u.status === 'finalized')
      return tenant(p.workspace, p.user, async (tx) => {
        await assertCurrentAuthority(tx, p, 'edit', 'assets:write');
        const current = (
          await tx.query(
            "SELECT asset_id,operation_id FROM asset_uploads WHERE workspace_id=$1 AND id=$2 AND status='finalized'",
            [p.workspace, uploadId],
          )
        ).rows[0];
        if (!current) fail(409, 'ASSET_TRANSFER_UNAVAILABLE', 'Upload is unavailable.');
        return {
          upload: { id: uploadId, status: 'finalized' },
          operation: (
            await tx.query('SELECT id,state FROM operations WHERE workspace_id=$1 AND id=$2', [
              p.workspace,
              current.operation_id,
            ])
          ).rows[0],
          asset_id: current.asset_id,
        };
      });
    const key = assetObjectKey(p.workspace, uploadId, 'source');
    await tenant(p.workspace, p.user, async (tx) => {
      await assertCurrentAuthority(tx, p, 'edit', 'assets:write');
      const staged = (
        await tx.query('SELECT mailcraft_stage_media_object($1,$2,NULL,$3,$4)ok', [
          p.workspace,
          u.operation_id,
          key,
          bytes.length,
        ])
      ).rows[0].ok;
      if (!staged) fail(409, 'ASSET_TRANSFER_REVOKED', 'Upload admission changed before storage.');
    });
    await store.putImmutable(key, bytes, u.expected_sha256);
    let result: Record<string, unknown> | undefined;
    for (let attempt = 0; attempt < 3; attempt++) {
      const candidate = await tenant(p.workspace, p.user, async (tx) => {
        await assertCurrentAuthority(tx, p, 'edit', 'assets:write');
        return (
          await tx.query(
            "SELECT source_key,source_bytes FROM assets WHERE workspace_id=$1 AND source_sha256=$2 AND state NOT IN('deleting','deleted')ORDER BY created_at,id LIMIT 1",
            [p.workspace, u.expected_sha256],
          )
        ).rows[0];
      });
      if (candidate)
        await store.readVerified(candidate.source_key, u.expected_sha256, candidate.source_bytes);
      try {
        result = await tenant(p.workspace, p.user, async (tx) => {
          await assertCurrentAuthority(tx, p, 'edit', 'assets:write');
          return (
            await tx.query('SELECT mailcraft_finalize_upload($1,$2,$3,$4,$5,$6,$7,$8) AS result', [
              p.workspace,
              uploadId,
              transfer,
              key,
              u.expected_sha256,
              bytes.length,
              mime,
              candidate?.source_key ?? null,
            ])
          ).rows[0].result;
        });
        break;
      } catch (error) {
        if ((error as Error).message !== 'MEDIA_DEDUPE_RECHECK_REQUIRED') throw error;
      }
    }
    if (!result) fail(503, 'ASSET_DEDUPE_BUSY', 'Keep the same upload command and retry shortly.');
    transferred = false;
    if (result.source_key !== key) {
      await store.removeAuthorized(key);
      await tenant(p.workspace, p.user, (tx) =>
        tx.query('SELECT mailcraft_forget_media_object($1,$2,$3,NULL)', [
          p.workspace,
          u.operation_id,
          key,
        ]),
      );
    }
    delete result.source_key;
    return result as {
      upload: { id: string; status: 'finalized' };
      operation: { id: string; state: string };
      asset_id: string;
    };
  } catch (error) {
    try {
      const staged = await tenant(p.workspace, p.user, async (tx) => {
        const u = (
          await tx.query(
            'SELECT operation_id FROM asset_uploads WHERE workspace_id=$1 AND id=$2 AND created_by=$3',
            [p.workspace, uploadId, p.user],
          )
        ).rows[0];
        if (!u) return null;
        return {
          operation: u.operation_id,
          objects: (
            await tx.query('SELECT mailcraft_media_object_cleanup_candidates($1,$2,NULL)objects', [
              p.workspace,
              u.operation_id,
            ])
          ).rows[0].objects as Array<{ object_key: string }>,
        };
      });
      if (staged)
        for (const object of staged.objects) {
          try {
            await store.removeAuthorized(object.object_key);
          } catch (cleanupError) {
            console.error(
              JSON.stringify({
                media_cleanup_pending: object.object_key,
                code:
                  (cleanupError as NodeJS.ErrnoException).code ?? (cleanupError as Error).message,
              }),
            );
            continue;
          }
          await tenant(p.workspace, p.user, (tx) =>
            tx.query('SELECT mailcraft_forget_media_object($1,$2,$3,NULL)', [
              p.workspace,
              staged.operation,
              object.object_key,
            ]),
          );
        }
      if (transferred) await releaseTransfer(p, uploadId, transfer);
    } catch (cleanupError) {
      console.error(JSON.stringify({ media_cleanup_unavailable: (cleanupError as Error).message }));
    }
    throw error;
  } finally {
    admissions--;
  }
}
