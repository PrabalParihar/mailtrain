import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, symlink, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { FileAssetStore, assetObjectKey } from '../src/server/asset-store';
const sha = (b: Uint8Array) => createHash('sha256').update(b).digest('hex');
test('private immutable storage verifies actual bytes and rejects overwrite, traversal and symlinks', async () => {
  const root = await mkdtemp(join(tmpdir(), 'asset-store-'));
  const bytes = Buffer.from('actual private bytes');
  try {
    const store = new FileAssetStore(root);
    const key = assetObjectKey(randomUUID(), randomUUID(), 'source');
    await store.putImmutable(key, bytes, sha(bytes));
    await store.putImmutable(key, bytes, sha(bytes));
    assert.deepEqual(Buffer.from(await store.readVerified(key, sha(bytes), 100)), bytes);
    await assert.rejects(() =>
      store.putImmutable(key, Buffer.from('changed'), sha(Buffer.from('changed'))),
    );
    await assert.rejects(() => store.readVerified('../escape', sha(bytes), 100));
    await assert.rejects(() => store.readVerified(key, sha(bytes), 3));
    await assert.rejects(() => store.readVerified(key, '0'.repeat(64), 100));
    const link = assetObjectKey(randomUUID(), randomUUID(), 'source');
    await symlink(join(root, key), join(root, link));
    await assert.rejects(() => store.readVerified(link, sha(bytes), 100));
    assert.deepEqual(await readFile(join(root, key)), bytes);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
