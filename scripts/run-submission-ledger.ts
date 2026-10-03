import env from '@next/env';
import { z } from 'zod';
import { tenant, closeDb } from '../src/server/db';
import { processSubmissionLedgerBatch } from '../src/server/submission-ledger-worker';

env.loadEnvConfig(process.cwd());
function ownedLoopbackDatabase(connection: string | undefined) {
  if (!connection) return false;
  try {
    const url = new URL(connection);
    return ['postgres:', 'postgresql:'].includes(url.protocol) &&
      ['localhost', '127.0.0.1'].includes(url.hostname) &&
      !url.href.includes('?') && !url.href.includes('#');
  } catch {
    return false;
  }
}
if (process.env.LOCAL_DEVELOPMENT !== 'true' || process.env.NODE_ENV === 'production' ||
    !ownedLoopbackDatabase(process.env.DATABASE_URL))
  throw Error('Local staging worker requires explicit owned loopback configuration. Production worker identity is not qualified.');
const args = process.argv.slice(2);
if (args.length !== 4 || args[0] !== '--workspace' || args[2] !== '--actor')
  throw Error('Use explicit --workspace UUID --actor CURRENT_ACTOR.');
const workspace = z.uuid().regex(/^[0-9a-f-]+$/).parse(args[1]), user = z.string().min(1).max(200).parse(args[3]);
let stopping = false;
process.once('SIGINT', () => { stopping = true; });
process.once('SIGTERM', () => { stopping = true; });
try {
  console.log(JSON.stringify({ worker: 'submission-ledger-local', dispatch_enabled: false }));
  while (!stopping) {
    try {
      const result = await tenant(workspace, user, tx => processSubmissionLedgerBatch(tx, { workspace, user, role: 'Owner' }));
      if (result) console.log(JSON.stringify(result));
      await new Promise(resolve => setTimeout(resolve, result ? 100 : 1000));
    } catch (error) {
      const raw = (error as { code?: unknown }).code, code = typeof raw === 'string' && /^[A-Z0-9_]{1,50}$/.test(raw) ? raw : 'WORKER_FAILURE';
      if (!['40001', '40P01', '55P03', 'ECONNREFUSED', 'ECONNRESET', '57P01', '57P02', '57P03'].includes(code))
        throw Error('Local staging worker stopped: ' + code + '. Sending remains unavailable.');
      console.error(JSON.stringify({ worker: 'submission-ledger-local', error_code: code, retry_in_ms: 1000, dispatch_enabled: false }));
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
} finally {
  await closeDb();
}
