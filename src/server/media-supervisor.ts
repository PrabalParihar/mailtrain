import { spawn } from 'node:child_process';
import { mkdtemp, mkdir, readFile, writeFile, chmod, lstat, realpath, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, isAbsolute } from 'node:path';
import { randomUUID } from 'node:crypto';
import {
  MEDIA_PROFILE,
  SCAN_PROFILE,
  LIMITS,
  validateMediaReceipt,
  validateScanReceipt,
  verifyOutputBytes,
  type MediaProcessInput,
  type MediaScanInput,
  type MediaScanReceipt,
  type MediaProcessReceipt,
} from '../../media/protocol.mjs';
import { type AssetStore } from './asset-store';
import type { MediaJob } from './media-jobs';
export type MediaSupervisorConfig = {
  decoderImage: string;
  scannerImage: string;
  databaseRoot: string;
  snapshotSha256: string;
};
export function mediaSupervisorConfig(): MediaSupervisorConfig {
  const config = {
    decoderImage: process.env.MEDIA_DECODER_IMAGE ?? '',
    scannerImage: process.env.MEDIA_SCANNER_IMAGE ?? '',
    databaseRoot: process.env.MEDIA_SCAN_DATABASE_ROOT ?? '',
    snapshotSha256: process.env.MEDIA_SCAN_SNAPSHOT_SHA256 ?? '',
  };
  if (
    !/^sha256:[a-f0-9]{64}$/.test(config.decoderImage) ||
    !/^sha256:[a-f0-9]{64}$/.test(config.scannerImage) ||
    !isAbsolute(config.databaseRoot) ||
    !/^[a-f0-9]{64}$/.test(config.snapshotSha256)
  )
    throw new Error('MEDIA_RUNTIME_NOT_CONFIGURED');
  return config;
}
export function sandboxArguments(
  kind: 'decode' | 'scan',
  image: string,
  mounts: { source?: string; output?: string; scan?: string; database?: string },
  name: string,
) {
  if (!/^sha256:[a-f0-9]{64}$/.test(image) || !/^lettercape-media-[a-f0-9-]+$/.test(name))
    throw new Error('MEDIA_SANDBOX_INVALID');
  const args = [
    'run',
    '--rm',
    '--interactive',
    '--name',
    name,
    '--network',
    'none',
    '--read-only',
    '--cap-drop',
    'ALL',
    '--security-opt',
    'no-new-privileges',
    '--pids-limit',
    '64',
    '--memory',
    kind === 'decode' ? '1g' : '3g',
    '--cpus',
    kind === 'decode' ? '1' : '2',
    '--user',
    kind === 'decode' ? '1001:1001' : '100:101',
    '--tmpfs',
    '/tmp:rw,noexec,nosuid,size=128m',
  ];
  const mount = (source: string | undefined, target: string, readOnly: boolean) => {
    if (!source || !isAbsolute(source) || source.includes(','))
      throw new Error('MEDIA_MOUNT_INVALID');
    args.push(
      '--mount',
      `type=bind,source=${source},target=${target}${readOnly ? ',readonly' : ''}`,
    );
  };
  if (kind === 'decode') {
    mount(mounts.source, '/input', true);
    mount(mounts.output, '/output', false);
    args.push('--env', `MEDIA_IMAGE_DIGEST=${image}`);
  } else {
    mount(mounts.scan, '/scan', true);
    mount(mounts.database, '/database', true);
    args.push('--env', `SCAN_IMAGE_DIGEST=${image}`);
  }
  if (kind === 'scan') args.push('--platform', 'linux/amd64');
  args.push(image);
  return args;
}
async function boundedFile(path: string, maxBytes: number) {
  const st = await lstat(path);
  if (st.isSymbolicLink() || !st.isFile() || st.size > maxBytes || st.size < 1)
    throw new Error('MEDIA_OUTPUT_LIMIT');
  const bytes = await readFile(path);
  if (bytes.length !== st.size || bytes.length > maxBytes) throw new Error('MEDIA_OUTPUT_LIMIT');
  return bytes;
}
async function runContainer(
  args: string[],
  input: unknown,
  signal: AbortSignal,
  deadline: number,
  name: string,
) {
  if (signal.aborted) throw new Error('MEDIA_CANCELLED');
  return new Promise<Buffer>((resolve, reject) => {
    const child = spawn('docker', args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        PATH: process.env.PATH,
        HOME: process.env.HOME,
        DOCKER_HOST: process.env.DOCKER_HOST,
        NODE_ENV: 'production',
      },
    });
    let bytes = 0,
      stderrBytes = 0,
      done = false,
      interrupted: Error | null = null,
      cleanup: Promise<void> | null = null;
    const chunks: Buffer[] = [],
      errors: Buffer[] = [];
    const finish = (error: Error | null, value?: Buffer) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      signal.removeEventListener('abort', abort);
      if (error) reject(error);
      else resolve(value!);
    };
    const reap = () => {
      if (cleanup) return cleanup;
      child.kill('SIGKILL');
      cleanup = new Promise<void>((cleanResolve, cleanReject) => {
        const killer = spawn('docker', ['rm', '--force', name], {
          stdio: 'ignore',
          env: {
            PATH: process.env.PATH,
            HOME: process.env.HOME,
            DOCKER_HOST: process.env.DOCKER_HOST,
            NODE_ENV: 'production',
          },
        });
        const killTimer = setTimeout(() => {
          killer.kill('SIGKILL');
          cleanReject(new Error('MEDIA_REAP_UNCONFIRMED'));
        }, 5000);
        killer.once('error', () => {
          clearTimeout(killTimer);
          cleanReject(new Error('MEDIA_REAP_UNCONFIRMED'));
        });
        killer.once('close', (code) => {
          clearTimeout(killTimer);
          if (code === 0) cleanResolve();
          else cleanReject(new Error('MEDIA_REAP_UNCONFIRMED'));
        });
      });
      return cleanup;
    };
    const interrupt = (error: Error) => {
      if (interrupted) return;
      interrupted = error;
      void reap().then(
        () => finish(error),
        (failure) => finish(failure),
      );
    };
    const abort = () => interrupt(new Error('MEDIA_CANCELLED'));
    const timer = setTimeout(
      () => interrupt(new Error('MEDIA_RUNTIME_TIMEOUT')),
      Math.max(1, deadline - Date.now()),
    );
    signal.addEventListener('abort', abort, { once: true });
    child.stdout.on('data', (chunk: Buffer) => {
      bytes += chunk.length;
      if (bytes > LIMITS.receipt) interrupt(new Error('MEDIA_RUNTIME_OUTPUT_LIMIT'));
      else chunks.push(chunk);
    });
    child.stderr.on('data', (chunk: Buffer) => {
      stderrBytes += chunk.length;
      if (stderrBytes <= LIMITS.receipt) errors.push(chunk);
      if (stderrBytes > LIMITS.receipt) interrupt(new Error('MEDIA_RUNTIME_OUTPUT_LIMIT'));
    });
    child.once('error', () => finish(new Error('MEDIA_RUNTIME_UNAVAILABLE')));
    child.once('close', (code) => {
      if (interrupted) return;
      if (signal.aborted) abort();
      else if (code !== 0) {
        const detail = Buffer.concat(errors).toString('utf8');
        let failure = 'MEDIA_RUNTIME_FAILED';
        try {
          const parsed = JSON.parse(detail.trim());
          if (typeof parsed.error === 'string' && /^(MEDIA|SCAN)_[A-Z_]{1,65}$/.test(parsed.error))
            failure = parsed.error;
        } catch {}
        finish(new Error(failure, { cause: detail }));
      } else finish(null, Buffer.concat(chunks));
    });
    child.stdin.on('error', () => {});
    child.stdin.end(JSON.stringify(input));
  });
}
export type VerifiedMediaResult = {
  receipt: MediaProcessReceipt;
  scans: MediaScanReceipt[];
  outputs: Array<{ output: MediaProcessReceipt['outputs'][number]; bytes: Uint8Array }>;
};
export async function processMediaIsolated(
  job: MediaJob,
  store: AssetStore,
  signal: AbortSignal,
  recheck: () => Promise<void>,
  config = mediaSupervisorConfig(),
): Promise<VerifiedMediaResult> {
  const root = await realpath(await mkdtemp(join(tmpdir(), 'lettercape-media-'))),
    inputRoot = join(root, 'input'),
    outputRoot = join(root, 'output');
  const deadline = Date.now() + 175000;
  let safeToRemove = true;
  try {
    const canonicalDatabase =
      process.platform === 'darwin' && config.databaseRoot.startsWith('/tmp/')
        ? '/private' + config.databaseRoot
        : config.databaseRoot;
    if (
      (await lstat(config.databaseRoot)).isSymbolicLink() ||
      (await realpath(config.databaseRoot)) !== canonicalDatabase
    )
      throw new Error('SCAN_DATABASE_INVALID');
    await mkdir(inputRoot, { mode: 0o755 });
    await mkdir(outputRoot, { mode: 0o777 });
    await chmod(outputRoot, 0o777);
    const source = await store.readVerified(job.source_key, job.source_sha256, LIMITS.input);
    await writeFile(join(inputRoot, 'source'), source, { mode: 0o444 });
    await recheck();
    let scanUsed = 0;
    const scan = async (files: MediaScanInput['files'], scanRoot: string) => {
      await recheck();
      const started = Date.now(),
        name = 'lettercape-media-' + randomUUID();
      const scanInput: MediaScanInput = {
        version: 1,
        profile: SCAN_PROFILE,
        files,
        database_snapshot_sha256: config.snapshotSha256,
      };
      const raw = await runContainer(
        sandboxArguments(
          'scan',
          config.scannerImage,
          { scan: scanRoot, database: config.databaseRoot },
          name,
        ),
        scanInput,
        signal,
        Math.min(deadline, Date.now() + 90000 - scanUsed),
        name,
      );
      scanUsed += Date.now() - started;
      const result = validateScanReceipt(JSON.parse(raw.toString('utf8')), scanInput);
      if (result.runtime.image_digest !== config.scannerImage || scanUsed > 90000)
        throw new Error('SCAN_RECEIPT_INVALID');
      return result;
    };
    const first = await scan(
      [{ filename: 'source', sha256: job.source_sha256, bytes: source.length }],
      inputRoot,
    );
    await recheck();
    const name = 'lettercape-media-' + randomUUID(),
      input: MediaProcessInput = {
        version: 1,
        source_sha256: job.source_sha256,
        source_path: '/input/source',
        output_directory: '/output',
        selected_frame: job.selected_frame,
        processing_profile: MEDIA_PROFILE,
      };
    await runContainer(
      sandboxArguments(
        'decode',
        config.decoderImage,
        { source: inputRoot, output: outputRoot },
        name,
      ),
      input,
      signal,
      Math.min(deadline, Date.now() + 60000),
      name,
    );
    const receipt = validateMediaReceipt(
      JSON.parse(
        (await boundedFile(join(outputRoot, 'receipt.json'), LIMITS.receipt)).toString('utf8'),
      ),
      input,
    );
    if (
      receipt.runtime.image_digest !== config.decoderImage ||
      receipt.source_metadata.bytes !== job.source_bytes
    )
      throw new Error('MEDIA_RECEIPT_INVALID');
    const outputs = [];
    let total = 0;
    for (const output of receipt.outputs) {
      const bytes = await boundedFile(join(outputRoot, output.filename), LIMITS.derivative);
      verifyOutputBytes(bytes, output);
      await chmod(join(outputRoot, output.filename), 0o444);
      total += bytes.length;
      if (total > LIMITS.derivatives) throw new Error('MEDIA_OUTPUT_LIMIT');
      outputs.push({ output, bytes });
    }
    const second = await scan(
      receipt.outputs.map((o) => ({ filename: o.filename, sha256: o.sha256, bytes: o.bytes })),
      outputRoot,
    );
    await recheck();
    return { receipt, scans: [first, second], outputs };
  } catch (error) {
    if ((error as Error).message === 'MEDIA_REAP_UNCONFIRMED') safeToRemove = false;
    throw error;
  } finally {
    if (safeToRemove) await rm(root, { recursive: true, force: true });
  }
}
